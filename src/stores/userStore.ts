import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export const useUserStore = create(
  persist<UserState>(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: "user-storage", // 로컬 스토리지에 저장될 때 사용될 키 이름
    },
  ),
);
