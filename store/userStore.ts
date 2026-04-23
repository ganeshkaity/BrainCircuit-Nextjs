import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface UserState {
  user: UserProfile | null;
  firebaseUid: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUid: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setFirebaseUid: (uid) => set({ firebaseUid: uid }),

      setLoading: (isLoading) => set({ isLoading }),

      clearUser: () =>
        set({
          user: null,
          firebaseUid: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "brain-circuit-user",
      partialize: (state) => ({ firebaseUid: state.firebaseUid }),
    }
  )
);
