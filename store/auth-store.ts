import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '@/constants'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences?: {
    notifications: boolean
    marketing: boolean
    language: string
  }
  supplierInfo?: {
    businessName: string
    taxId: string
    description: string
    website?: string
    verified: boolean
    rating: number
    totalSales: number
  }
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates }
          })
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
