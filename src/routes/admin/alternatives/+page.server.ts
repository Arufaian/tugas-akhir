import { data } from './mock-data';

export async function load() {
	// logic to fetch payments data here

	console.log('Data loaded:', data); // Log the data to verify it's being loaded correctly

	return {
		payments: data
	};
}
