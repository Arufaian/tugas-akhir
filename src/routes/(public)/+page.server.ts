import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { alternativesTable, criteriaTable } from '$lib/server/db/schema';
import { alternativeImageSchema } from '$lib/validations/alternative.schema.js';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [criteria, [latestAlternative]] = await Promise.all([
		db
			.select({ name: criteriaTable.name })
			.from(criteriaTable)
			.where(eq(criteriaTable.isActive, true))
			.orderBy(asc(criteriaTable.orderIndex)),
		db
			.select({
				name: alternativesTable.name,
				category: alternativesTable.category,
				img: alternativesTable.img
			})
			.from(alternativesTable)
			.where(and(eq(alternativesTable.isActive, true), isNotNull(alternativesTable.img)))
			.orderBy(desc(alternativesTable.createdAt))
			.limit(1)
	]);
	const parsedImage = latestAlternative
		? alternativeImageSchema.safeParse(latestAlternative.img)
		: null;

	return {
		criteria,
		latestAlternative:
			latestAlternative && parsedImage?.success
				? { ...latestAlternative, img: parsedImage.data }
				: null
	};
};
