import { technologyFeatures } from '$lib/constants/technology-features.js';
import { calculateTechnologyScore } from '$lib/utils/technology-features.js';
import { checkDecisionMatrixCompleteness } from './decision-matrix.js';

type CriterionType = 'benefit' | 'cost';
type InputType = 'number' | 'scale' | 'tech_features';

type Alternative = { id: string; code: string; name: string };
type Criterion = {
	id: string;
	code: string;
	name: string;
	unit: string;
	orderIndex: number;
	type: CriterionType;
	inputType: InputType;
	normalizedWeight: string;
};
type Value = {
	alternativeId: string;
	criterionId: string;
	rawValue: string;
	labelValue: string | null;
};
type Scale = { criterionId: string; value: string };

export type MooraInput = {
	alternatives: Alternative[];
	criteria: Criterion[];
	values: Value[];
	scales: Scale[];
};

type MooraResultRow = Alternative & {
	totalBenefit: number;
	totalCost: number;
	optimizationScore: number;
	rank: number;
};

type MooraDetailRow = {
	alternativeId: string;
	criterionId: string;
	criterionCode: string;
	criterionName: string;
	criterionUnit: string;
	criterionOrderIndex: number;
	criterionType: CriterionType;
	criterionInputType: InputType;
	rawValue: number;
	labelValue: string | null;
	denominator: number;
	normalizedValue: number;
	weight: number;
	weightedValue: number;
};

export type MooraResult =
	| { success: false; issues: string[] }
	| {
			success: true;
			alternatives: Alternative[];
			criteria: Criterion[];
			decisionMatrix: number[][];
			denominators: number[];
			normalizedMatrix: number[][];
			weightedMatrix: number[][];
			results: MooraResultRow[];
			details: MooraDetailRow[];
	  };

const featureNames = new Map<string, string>(
	technologyFeatures.map((feature) => [feature.id, feature.name])
);
// ponytail: 9-decimal persisted weights can differ from 1 by a few nanounits.
const weightTolerance = 1e-8;

function compareCode(a: { code: string }, b: { code: string }): number {
	return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
}

function round9(value: number): number {
	return Number(value.toFixed(9));
}

function snapshotLabel(
	criterion: Criterion,
	value: Value,
	rawValue: number
): { label: string | null; issue?: string } {
	if (criterion.inputType === 'number') return { label: null };

	if (criterion.inputType === 'scale') {
		return value.labelValue?.trim()
			? { label: value.labelValue }
			: { label: null, issue: `Label nilai ${criterion.code} tidak valid` };
	}

	try {
		const featureIds: unknown = JSON.parse(value.labelValue ?? '');
		if (!Array.isArray(featureIds) || !featureIds.every((id) => typeof id === 'string')) {
			throw new Error('Invalid feature ids');
		}

		if (calculateTechnologyScore(featureIds) !== rawValue) {
			return { label: null, issue: `Nilai dan fitur ${criterion.code} tidak konsisten` };
		}

		return {
			label: featureIds.map((id) => featureNames.get(id)!).join(', ') || null
		};
	} catch {
		return { label: null, issue: `Daftar fitur ${criterion.code} tidak valid` };
	}
}

export function calculateMoora(input: MooraInput): MooraResult {
	const alternatives = [...input.alternatives].sort(compareCode);
	const criteria = [...input.criteria].sort(
		(a, b) => a.orderIndex - b.orderIndex || compareCode(a, b)
	);
	const completeness = checkDecisionMatrixCompleteness({
		alternatives,
		criteria,
		values: input.values,
		scales: input.scales
	});
	const issues: string[] = [];

	if (!alternatives.length) issues.push('Belum ada alternative aktif');
	if (!criteria.length) issues.push('Belum ada criterion aktif');
	if (alternatives.length && criteria.length && !completeness.isComplete) {
		issues.push('Decision matrix belum lengkap atau memiliki nilai scale tidak valid');
	}
	if (issues.length) return { success: false, issues };

	const weights = criteria.map((criterion) => Number(criterion.normalizedWeight));
	if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
		issues.push('Normalized weight harus finite dan lebih besar dari nol');
	} else if (Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) > weightTolerance) {
		issues.push('Total normalized weight harus sama dengan 1.0');
	}

	const valuesByCell = new Map(
		input.values.map((value) => [`${value.alternativeId}:${value.criterionId}`, value])
	);
	const decisionMatrix: number[][] = [];
	const labels: (string | null)[][] = [];

	for (const alternative of alternatives) {
		const matrixRow: number[] = [];
		const labelRow: (string | null)[] = [];

		for (const criterion of criteria) {
			const value = valuesByCell.get(`${alternative.id}:${criterion.id}`)!;
			const rawValue = Number(value.rawValue);

			if (!value.rawValue.trim() || !Number.isFinite(rawValue) || rawValue < 0) {
				issues.push(`Nilai ${alternative.code}/${criterion.code} harus finite dan nonnegatif`);
				continue;
			}

			const snapshot = snapshotLabel(criterion, value, rawValue);
			if (snapshot.issue) issues.push(`${alternative.code}: ${snapshot.issue}`);
			matrixRow.push(rawValue);
			labelRow.push(snapshot.label);
		}

		decisionMatrix.push(matrixRow);
		labels.push(labelRow);
	}

	if (issues.length) return { success: false, issues };

	const denominators = criteria.map((_, criterionIndex) =>
		Math.sqrt(
			decisionMatrix.reduce((sum, row) => sum + row[criterionIndex] * row[criterionIndex], 0)
		)
	);

	criteria.forEach((criterion, index) => {
		if (!Number.isFinite(denominators[index]) || denominators[index] <= 0) {
			issues.push(`Nilai pembagi normalisasi ${criterion.code} harus lebih besar dari nol`);
		}
	});
	if (issues.length) return { success: false, issues };

	const normalizedMatrix = decisionMatrix.map((row) =>
		row.map((value, index) => value / denominators[index])
	);
	const weightedMatrix = normalizedMatrix.map((row) =>
		row.map((value, index) => value * weights[index])
	);
	const scored = alternatives.map((alternative, alternativeIndex) => {
		let totalBenefit = 0;
		let totalCost = 0;

		criteria.forEach((criterion, criterionIndex) => {
			if (criterion.type === 'benefit') {
				totalBenefit += weightedMatrix[alternativeIndex][criterionIndex];
			} else {
				totalCost += weightedMatrix[alternativeIndex][criterionIndex];
			}
		});

		return { ...alternative, totalBenefit, totalCost, optimizationScore: totalBenefit - totalCost };
	});
	const ranked = scored.sort(
		(a, b) => round9(b.optimizationScore) - round9(a.optimizationScore) || compareCode(a, b)
	);
	const results = ranked.map((result, index) => ({
		...result,
		totalBenefit: round9(result.totalBenefit),
		totalCost: round9(result.totalCost),
		optimizationScore: round9(result.optimizationScore),
		rank: index + 1
	}));
	const roundedDenominators = denominators.map(round9);
	const roundedNormalizedMatrix = normalizedMatrix.map((row) => row.map(round9));
	const roundedWeightedMatrix = weightedMatrix.map((row) => row.map(round9));
	const details = alternatives.flatMap((alternative, alternativeIndex) =>
		criteria.map((criterion, criterionIndex) => ({
			alternativeId: alternative.id,
			criterionId: criterion.id,
			criterionCode: criterion.code,
			criterionName: criterion.name,
			criterionUnit: criterion.unit,
			criterionOrderIndex: criterion.orderIndex,
			criterionType: criterion.type,
			criterionInputType: criterion.inputType,
			rawValue: decisionMatrix[alternativeIndex][criterionIndex],
			labelValue: labels[alternativeIndex][criterionIndex],
			denominator: roundedDenominators[criterionIndex],
			normalizedValue: roundedNormalizedMatrix[alternativeIndex][criterionIndex],
			weight: round9(weights[criterionIndex]),
			weightedValue: roundedWeightedMatrix[alternativeIndex][criterionIndex]
		}))
	);

	return {
		success: true,
		alternatives,
		criteria,
		decisionMatrix,
		denominators: roundedDenominators,
		normalizedMatrix: roundedNormalizedMatrix,
		weightedMatrix: roundedWeightedMatrix,
		results,
		details
	};
}
