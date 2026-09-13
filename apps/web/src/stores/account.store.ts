import { create } from "zustand";

export interface UserProfile {
  id: number;
  email: string;
  username?: string;
  isAdmin?: boolean;
}

interface AccountState {
  token: string;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  setToken: (token: string) => void;
  setUser: (user: UserProfile | null) => void;
  clearToken: () => void;
}

let initialUser: UserProfile | null = null;
try {
  const stored = localStorage.getItem("user");
  if (stored) initialUser = JSON.parse(stored);
} catch {
  // ignore json parse error
}

export const useAccountStore = create<AccountState>((set) => ({
  token: localStorage.getItem("token") ?? "",
  user: initialUser,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  setToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user });
  },
  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: "", user: null });
  },
}));

