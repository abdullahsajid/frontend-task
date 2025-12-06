import { create } from "zustand";

const useUserStore = create<UserState>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
  resetUser: () => set({ user: undefined }),
}));

export default useUserStore;
