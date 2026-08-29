import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth'
import { FullScreenLoading } from '@/shared/components/app-state'
import { DEFAULT_AUTHENTICATED_PATH } from '@/shared/lib/safe-redirect'

export function RootRedirect() {
  const { status } = useAuth()

  if (status === 'initializing') {
    return <FullScreenLoading label="認証状態を確認しています" />
  }

  return (
    <Navigate
      replace
      to={status === 'authenticated' ? DEFAULT_AUTHENTICATED_PATH : '/login'}
    />
  )
}

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'initializing') {
    return <FullScreenLoading label="認証状態を確認しています" />
  }

  if (status !== 'authenticated') {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return (
      <Navigate
        replace
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
      />
    )
  }

  return <Outlet />
}
