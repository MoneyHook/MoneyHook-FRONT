import { cn } from '@/shared/lib/utils'

export function DashboardCard({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_6%,transparent)] sm:p-6',
        'max-sm:p-3',
        className,
      )}
    >
      {children}
    </section>
  )
}
