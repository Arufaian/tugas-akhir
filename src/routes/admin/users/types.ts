export type UserRow = {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'sales';
	isActive: boolean;
	createdAt: string;
	isCurrentUser: boolean;
};
