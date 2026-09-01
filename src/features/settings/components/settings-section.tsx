import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type SettingsSectionProps = {
  action?: ReactNode
  children: ReactNode
  description: string
  icon: LucideIcon
  showHeader?: boolean
  title: string
  titleId: string
}

export function SettingsSection({
  action,
  children,
  description,
  icon: Icon,
  showHeader = true,
  title,
  titleId,
}: SettingsSectionProps) {
  return (
    <section
      aria-label={showHeader ? undefined : title}
      aria-labelledby={showHeader ? titleId : undefined}
      className="max-w-5xl rounded-2xl border bg-card p-5 sm:p-6"
    >
      {showHeader ? (
        <header className="flex items-start justify-between gap-4 border-b pb-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : action ? (
        <div className="flex justify-end border-b pb-4">{action}</div>
      ) : null}
      <div className={showHeader || action ? 'pt-6' : undefined}>{children}</div>
    </section>
  )
}
