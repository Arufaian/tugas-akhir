import { z } from 'zod';

export const alternativeCriterionValuesSchema = z.strictObject({
	values: z.array(
		z.strictObject({
			criterionId: z.uuid(),
			value: z.string(),
			selectedFeatureIds: z.array(z.string()),
			isAssessed: z.boolean()
		})
	)
});
