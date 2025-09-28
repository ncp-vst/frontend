import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TokenState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useTokenStore = create(
  persist<TokenState>(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: "token-storage", // 로컬 스토리지에 저장될 때 사용될 키 이름
    },
  ),
);
