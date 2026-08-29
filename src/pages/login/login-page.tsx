import { Navigate, useSearchParams } from 'react-router-dom'

import { LoginPanel, useAuth } from '@/features/auth'
import { Brand } from '@/shared/components/brand'
import { FullScreenLoading } from '@/shared/components/app-state'
import { getSafeAppRedirect } from '@/shared/lib/safe-redirect'

export function LoginPage() {
  const { status } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = getSafeAppRedirect(searchParams.get('redirect'))

  if (status === 'authenticated') {
    return <Navigate replace to={redirect} />
  }

  if (status === 'initializing') {
    return <FullScreenLoading label="認証状態を確認しています" />
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8vw] top-1/2 hidden size-[30rem] -translate-y-1/2 rounded-full border border-primary/20 md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[15vw] top-1/2 hidden size-72 -translate-y-1/2 rounded-full border border-primary/35 md:block"
      />

      <header className="absolute inset-x-0 top-0 z-10 px-6 py-6 md:px-10 md:py-8">
        <Brand />
      </header>

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl items-center px-6 py-28 md:px-10">
        <LoginPanel />
      </div>
    </main>
  )
}
