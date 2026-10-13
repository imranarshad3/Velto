import { createContext, useContext } from 'react'

export interface AppUser {
  id: string
  name: string | null
  email: string | null
  imageUrl: string | null
}

export interface AppAuth {
  /** `none` = no Clerk key (guest-only); `clerk` = real accounts; `dev` = local fake auth for testing only. */
  mode: 'none' | 'clerk' | 'dev'
  enabled: boolean
  loaded: boolean
  signedIn: boolean
  user: AppUser | null
  /** Session token for `Authorization: Bearer`; the server verifies it. */
  getToken: () => Promise<string | null>
  signOut: () => Promise<void>
}

export const guestAuth: AppAuth = {
  mode: 'none',
  enabled: false,
  loaded: true,
  signedIn: false,
  user: null,
  getToken: async () => null,
  signOut: async () => {},
}

export const AuthContext = createContext<AppAuth>(guestAuth)

export const useAppAuth = () => useContext(AuthContext)

export const clerkPublishableKey: string | undefined = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || undefined
