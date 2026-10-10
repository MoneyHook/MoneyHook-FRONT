import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

type Scope = 'personal' | 'family'
type Props = {
  hasActiveFamily?: boolean
  scope: Scope
  size?: 'default' | 'sm'
} & (
  | {
      personalHref: string
      familyHref: string
      onScopeChange?: never
      disabled?: never
    }
  | {
      onScopeChange: (scope: Scope) => void
      disabled?: boolean
      personalHref?: never
      familyHref?: never
    }
)

export function HouseholdScopeSwitch({
  hasActiveFamily = false,
  scope,
  size = 'default',
  personalHref,
  familyHref,
  onScopeChange,
  disabled,
}: Props) {
  if (!hasActiveFamily) return null

  const items = [
    { scope: 'personal' as const, label: '個人', href: personalHref },
    { scope: 'family' as const, label: '家族', href: familyHref },
  ]
  const containerClassName =
    'inline-flex shrink-0 items-center overflow-hidden rounded-full border bg-background'
  const choices = items.map((item) => {
    const className = cn(
      'inline-flex items-center justify-center py-1 font-medium whitespace-nowrap transition-colors outline-none first:border-r focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50',
      size === 'sm' ? 'min-h-7 px-3 text-xs' : 'min-h-9 px-4 text-sm',
      scope === item.scope
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )
    return onScopeChange ? (
      <button
        key={item.scope}
        type="button"
        aria-pressed={scope === item.scope}
        disabled={disabled}
        className={className}
        onClick={() => onScopeChange(item.scope)}
      >
        {item.label}
      </button>
    ) : (
      <Link
        key={item.scope}
        to={item.href!}
        aria-current={scope === item.scope ? 'page' : undefined}
        className={className}
      >
        {item.label}
      </Link>
    )
  })

  return onScopeChange ? (
    <div role="group" aria-label="取引の登録先" className={containerClassName}>
      {choices}
    </div>
  ) : (
    <nav aria-label="家計の切り替え" className={containerClassName}>
      {choices}
    </nav>
  )
}
