import { QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FirebaseError } from 'firebase/app'
import type { User } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/query-client'

const firebaseMocks = vi.hoisted(() => ({
  googleCredential: vi.fn((token: string) => ({ token })),
  onIdTokenChanged: vi.fn(),
  signInWithCredential: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

const testEnvironment = vi.hoisted(() => ({
  firebase: { devUserEnabled: false },
}))

const firebaseAuth = {
  currentUser: null as User | null,
}

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {
    static credential = firebaseMocks.googleCredential
  },
  onIdTokenChanged: firebaseMocks.onIdTokenChanged,
  signInWithCredential: firebaseMocks.signInWithCredential,
  signInWithPopup: firebaseMocks.signInWithPopup,
  signOut: firebaseMocks.signOut,
}))

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => testEnvironment,
  EnvironmentConfigurationError: class EnvironmentConfigurationError extends Error {},
}))

vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => firebaseAuth,
}))

import { useAuth } from './auth-context'
import { AuthProvider } from './auth-provider'

let idTokenListener: ((user: User | null) => void) | null = null

function createUser(uid: string): User {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: uid,
    photoURL: null,
  } as User
}

function AuthProbe() {
  const auth = useAuth()

  return (
    <div>
      <output aria-label="認証状態">{auth.status}</output>
      <output aria-label="ユーザーID">{auth.user?.uid ?? ''}</output>
      <p>{auth.error}</p>
      <button type="button" onClick={() => void auth.signInWithGoogle()}>
        Googleログイン
      </button>
      <button type="button" onClick={() => void auth.signOut()}>
        ログアウト
      </button>
    </div>
  )
}

function renderAuthProvider() {
  const queryClient = createAppQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

function emitIdToken(user: User | null) {
  firebaseAuth.currentUser = user
  act(() => idTokenListener?.(user))
}

describe('AuthProvider', () => {
  beforeEach(() => {
    idTokenListener = null
    firebaseAuth.currentUser = null
    testEnvironment.firebase.devUserEnabled = false
    vi.clearAllMocks()
    firebaseMocks.onIdTokenChanged.mockImplementation(
      (_auth: unknown, listener: (user: User | null) => void) => {
        idTokenListener = listener
        return vi.fn()
      },
    )
    firebaseMocks.signOut.mockImplementation(async () => {
      firebaseAuth.currentUser = null
    })
  })

  it('keeps initialization distinct from an unauthenticated result', () => {
    renderAuthProvider()
    expect(screen.getByLabelText('認証状態')).toHaveTextContent('initializing')

    emitIdToken(null)

    expect(screen.getByLabelText('認証状態')).toHaveTextContent('unauthenticated')
  })

  it('uses Firebase ID token state as the authenticated source of truth', async () => {
    renderAuthProvider()

    emitIdToken(createUser('user-1'))

    expect(screen.getByLabelText('認証状態')).toHaveTextContent('authenticated')
    expect(screen.getByLabelText('ユーザーID')).toHaveTextContent('user-1')
  })

  it('reports a cancelled Google popup in Japanese', async () => {
    firebaseMocks.signInWithPopup.mockRejectedValue(
      new FirebaseError('auth/popup-closed-by-user', 'cancelled'),
    )
    renderAuthProvider()
    emitIdToken(null)

    fireEvent.click(screen.getByRole('button', { name: 'Googleログイン' }))

    expect(firebaseMocks.signInWithPopup).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.getByText('Googleログインがキャンセルされました。')).toBeVisible()
    })
  })

  it('uses the fixed Google mock credential for the development user', async () => {
    testEnvironment.firebase.devUserEnabled = true
    renderAuthProvider()
    emitIdToken(null)

    fireEvent.click(screen.getByRole('button', { name: 'Googleログイン' }))

    await waitFor(() => {
      expect(firebaseMocks.signInWithCredential).toHaveBeenCalledTimes(1)
    })
    expect(firebaseMocks.signInWithPopup).not.toHaveBeenCalled()
    expect(firebaseMocks.googleCredential).toHaveBeenCalledWith(
      JSON.stringify({
        sub: 'a77a6e94-6aa2-47ea-87dd-129f580fb669',
        email: 'developer@example.com',
        email_verified: true,
        name: '開発ユーザー',
      }),
    )
  })

  it('reports authentication errors from the development credential flow', async () => {
    testEnvironment.firebase.devUserEnabled = true
    firebaseMocks.signInWithCredential.mockRejectedValue(
      new FirebaseError('auth/network-request-failed', 'network failed'),
    )
    renderAuthProvider()
    emitIdToken(null)

    fireEvent.click(screen.getByRole('button', { name: 'Googleログイン' }))

    await waitFor(() => {
      expect(screen.getByText('認証サーバーへ接続できませんでした。ネットワークを確認してください。')).toBeVisible()
    })
  })

  it('clears cached server data when the authenticated uid changes', async () => {
    const queryClient = renderAuthProvider()
    emitIdToken(createUser('user-1'))
    await waitFor(() => {
      expect(screen.getByLabelText('認証状態')).toHaveTextContent('authenticated')
    })
    queryClient.setQueryData(['private', 'user-1'], { amount: 100 })

    emitIdToken(createUser('user-2'))

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    await waitFor(() => {
      expect(screen.getByLabelText('ユーザーID')).toHaveTextContent('user-2')
    })
  })

  it('clears cached server data before Firebase logout', async () => {
    const queryClient = renderAuthProvider()
    const user = createUser('user-1')
    emitIdToken(user)
    await waitFor(() => {
      expect(screen.getByLabelText('認証状態')).toHaveTextContent('authenticated')
    })
    queryClient.setQueryData(['private', 'user-1'], { amount: 100 })
    firebaseMocks.signOut.mockImplementation(async () => {
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
      firebaseAuth.currentUser = null
    })

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(screen.getByLabelText('認証状態')).toHaveTextContent('unauthenticated')
    })
  })
})
