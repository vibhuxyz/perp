import { create } from "zustand";

interface AccountState {
  token: string;
  setToken: (token: string) => void;
  clearToken: () => void;
}

// localStorage is the OK-through-AWESOME shape. At the BEST rung this moves to an
// HttpOnly cookie and the token stops being reachable from JavaScript at all.
export const useAccountStore = create<AccountState>(set => ({
  token: localStorage.getItem("token") ?? "",
  setToken: token => {
    localStorage.setItem("token", token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem("token");
    set({ token: "" });
  },
}));
