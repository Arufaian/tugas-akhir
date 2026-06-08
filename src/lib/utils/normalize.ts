export interface CriteriaWeightInput {
	rawWeight: number;
	isActive: boolean;
}

export function recalcNormalizedWeights<T extends CriteriaWeightInput>(
	criteria: T[]
): (T & { normalizedWeight: number })[] {
	const totalRaw = criteria.filter((c) => c.isActive).reduce((sum, c) => sum + c.rawWeight, 0);

	return criteria.map((c) => ({
		...c,
		normalizedWeight: c.isActive && totalRaw > 0 ? c.rawWeight / totalRaw : 0
	}));
}
