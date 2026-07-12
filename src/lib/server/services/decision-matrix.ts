import { canonicalDecimal } from '$lib/utils/decimal.js';

type Alternative = { id: string; code: string; name: string };
type Criterion = {
	id: string;
	code: string;
	name: string;
	inputType: 'number' | 'scale' | 'tech_features';
};
type Value = { alternativeId: string; criterionId: string; rawValue: string };
type Scale = { criterionId: string; value: string };
type MissingCriterion = Criterion & { reason: 'missing' | 'invalid_scale' };

export function checkDecisionMatrixCompleteness({
	alternatives,
	criteria,
	values,
	scales
}: {
	alternatives: Alternative[];
	criteria: Criterion[];
	values: Value[];
	scales: Scale[];
}) {
	const valuesByCell = new Map(
		values.map((value) => [`${value.alternativeId}:${value.criterionId}`, value])
	);
	const scaleValues = new Set(
		scales.map((scale) => `${scale.criterionId}:${canonicalDecimal(scale.value)}`)
	);
	let filledCellCount = 0;

	const completenessByAlternative = alternatives.map((alternative) => {
		const missingCriteria = criteria.flatMap<MissingCriterion>((criterion) => {
			const value = valuesByCell.get(`${alternative.id}:${criterion.id}`);

			if (!value) return [{ ...criterion, reason: 'missing' as const }];
			if (
				criterion.inputType === 'scale' &&
				!scaleValues.has(`${criterion.id}:${canonicalDecimal(value.rawValue)}`)
			) {
				return [{ ...criterion, reason: 'invalid_scale' as const }];
			}

			filledCellCount += 1;
			return [];
		});

		return {
			...alternative,
			filledCount: criteria.length - missingCriteria.length,
			isComplete: criteria.length > 0 && missingCriteria.length === 0,
			missingCriteria
		};
	});

	const totalCellCount = alternatives.length * criteria.length;

	return {
		isComplete:
			alternatives.length > 0 &&
			criteria.length > 0 &&
			completenessByAlternative.every((alternative) => alternative.isComplete),
		totalCellCount,
		filledCellCount,
		emptyCellCount: totalCellCount - filledCellCount,
		alternatives: completenessByAlternative
	};
}
