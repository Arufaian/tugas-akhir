import { technologyFeatures } from '$lib/constants/technology-features';

const scoreById = new Map<string, number>(
	technologyFeatures.map((feature) => [feature.id, feature.score])
);

export function calculateTechnologyScore(featureIds: readonly string[]): number {
	const selected = new Set<string>();
	let total = 0;

	for (const featureId of featureIds) {
		const score = scoreById.get(featureId);

		if (score === undefined) throw new Error(`Unknown technology feature: ${featureId}`);
		if (selected.has(featureId)) throw new Error(`Duplicate technology feature: ${featureId}`);

		selected.add(featureId);
		total += score;
	}

	return total;
}
