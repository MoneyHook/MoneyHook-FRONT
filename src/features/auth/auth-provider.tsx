import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'

import { EnvironmentConfigurationError } from '@/shared/config/environment'
import { getFirebaseAuth } from '@/shared/lib/firebase'

import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthUser } from './model/auth'

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

function toAuthErrorMessage(error: unknown): string {
  if (error instanceof EnvironmentConfigurationError) {
    return error.message
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Googleログインがキャンセルされました。'
      case 'auth/popup-blocked':
        return 'ログイン画面を開けませんでした。ポップアップを許可してください。'
      case 'auth/network-request-failed':
        return '認証サーバーへ接続できませんでした。ネットワークを確認してください。'
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています。'
      case 'auth/too-many-requests':
        return '試行回数が多すぎます。しばらく待ってから再度お試しください。'
      default:
        return '認証処理に失敗しました。もう一度お試しください。'
    }
  }
  return '認証処理に失敗しました。もう一度お試しください。'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<
    Pick<AuthContextValue, 'status' | 'user' | 'error'>
  >({ status: 'initializing', user: null, error: null })
  const activeUidRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    try {
      unsubscribe = onIdTokenChanged(getFirebaseAuth(), (user) => {
        if (user) {
          const previousUid = activeUidRef.current
          if (previousUid && previousUid !== user.uid) {
            queryClient.clear()
          }
          activeUidRef.current = user.uid
          setState({
            status: 'authenticated',
            user: toAuthUser(user),
            error: null,
          })
          return
        }

        const previousUid = activeUidRef.current
        if (previousUid) {
          queryClient.clear()
          activeUidRef.current = null
        }

        setState({ status: 'unauthenticated', user: null, error: null })
      })
    } catch (error) {
      queueMicrotask(() => {
        if (active) {
          setState({
            status: 'error',
            user: null,
            error: toAuthErrorMessage(error),
          })
        }
      })
    }

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [queryClient])

  const signInWithGoogle = useCallback(async () => {
    setState({ status: 'initializing', user: null, error: null })

    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
    } catch (error) {
      let hasCurrentUser: boolean
      try {
        hasCurrentUser = Boolean(getFirebaseAuth().currentUser)
      } catch {
        hasCurrentUser = false
      }
      if (hasCurrentUser) {
        return
      }
      setState({
        status: 'error',
        user: null,
        error: toAuthErrorMessage(error),
      })
    }
  }, [])

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth()
    queryClient.clear()
    activeUidRef.current = null
    await firebaseSignOut(auth)
    setState({ status: 'unauthenticated', user: null, error: null })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signInWithGoogle,
      signOut,
    }),
    [signInWithGoogle, signOut, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
