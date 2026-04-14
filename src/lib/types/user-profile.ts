// Tipe untuk authenticated user (dijamin semua field ada)
export type UserProfileData = {
	name: string;
	role: 'admin' | 'sales';
	email: string;
};

// Tipe yang bisa null (untuk load function)
export type UserProfile = UserProfileData | null;
