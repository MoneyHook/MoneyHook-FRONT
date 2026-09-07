import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

export function CategoryAnalysisPanel({
  children,
  className,
  id,
}: PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-6',
        className,
      )}
      id={id}
    >
      {children}
    </section>
  )
}
