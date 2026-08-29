import { NotFoundState } from '@/shared/components/app-state'

export function PublicNotFoundPage() {
  return (
    <main className="min-h-svh bg-background">
      <NotFoundState />
    </main>
  )
}

export function AppNotFoundPage() {
  return <NotFoundState withinApp />
}
