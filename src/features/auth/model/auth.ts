export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}
