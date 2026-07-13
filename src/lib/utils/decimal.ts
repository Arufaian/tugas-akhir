export function canonicalDecimal(value: string): string {
	const [integer, fraction = ''] = value.split('.');
	const normalizedInteger = integer.replace(/^0+(?=\d)/, '');
	const normalizedFraction = fraction.replace(/0+$/, '');

	return normalizedFraction ? `${normalizedInteger}.${normalizedFraction}` : normalizedInteger;
}
