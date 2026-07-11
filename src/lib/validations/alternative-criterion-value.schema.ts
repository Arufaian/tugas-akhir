import { z } from 'zod';

export const alternativeCriterionValuesSchema = z.object({
	values: z.array(
		z.object({
			criterionId: z.uuid(),
			value: z.string(),
			selectedFeatureIds: z.array(z.string()),
			isAssessed: z.boolean()
		})
	)
});

export type AlternativeCriterionValuesInput = z.infer<typeof alternativeCriterionValuesSchema>;
export type AlternativeCriterionValuesSchema = typeof alternativeCriterionValuesSchema;
