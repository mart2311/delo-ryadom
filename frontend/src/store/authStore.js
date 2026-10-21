import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),

      logout: () =>
        set({ token: null, refreshToken: null, user: null }),

      updateUser: (user) =>
        set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
