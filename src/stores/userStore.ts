import { create } from "zustand";

type UserPayload = {
	login_id: string;
	name: string;
	created_dt?: string;
	updated_dt?: string;
};

interface UserState {
	user: UserPayload | null;
	setUser: (user: UserPayload | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
	user: null,
	setUser: (user) => set({ user }),
}));
