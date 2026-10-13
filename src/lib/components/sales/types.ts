export interface CatalogAlternative {
	id: string;
	code: string;
	name: string;
	category: string;
	price: number;
	imageUrl: string | null;
	isComplete: boolean;
}

export interface CalculationCriterion {
	criterionId: string;
	name: string;
	unit: string | null;
	type: 'benefit' | 'cost';
	rawValue: number;
	labelValue: string | null;
	weight: number;
}

export interface RankedAlternative extends CatalogAlternative {
	totalBenefit: number;
	totalCost: number;
	optimizationScore: number;
	rank: number;
	criteria: CalculationCriterion[];
}

export interface CalculationData {
	filter: {
		category: string;
		priceRange: [number, number];
	};
	results: RankedAlternative[];
}

export const currencyFormatter = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	maximumFractionDigits: 0
});

export const scoreFormatter = new Intl.NumberFormat('id-ID', {
	minimumFractionDigits: 6,
	maximumFractionDigits: 6
});

export const valueFormatter = new Intl.NumberFormat('id-ID', {
	maximumFractionDigits: 2
});

export const percentFormatter = new Intl.NumberFormat('id-ID', {
	style: 'percent',
	maximumFractionDigits: 2
});

export function formatCurrency(value: number): string {
	return currencyFormatter.format(value);
}

export function formatCriterionValue(criterion: CalculationCriterion): string {
	if (criterion.labelValue) return criterion.labelValue;
	if (criterion.unit === 'Rp') return formatCurrency(criterion.rawValue);

	const value = valueFormatter.format(criterion.rawValue);
	return criterion.unit ? `${value} ${criterion.unit}` : value;
}
