import { HouseholdScopeSwitch } from '@/shared/components/household-scope-switch'
import { MonthPicker } from '@/shared/components/month-picker'
import { cn } from '@/shared/lib/utils'

export function DashboardMonthHeader({
  compact = false,
  sticky = false,
  headerSlot,
  title,
  titleId,
  hasActiveFamily = false,
  scope,
  personalHref,
  familyHref,
  monthInput,
  monthLabel,
  maxMonth,
  onChange,
}: {
  compact?: boolean
  sticky?: boolean
  headerSlot?: string
  title: string
  titleId: string
  hasActiveFamily?: boolean
  scope: 'personal' | 'family'
  personalHref: string
  familyHref: string
  monthInput: string
  monthLabel: string
  maxMonth: string
  onChange: (value: string) => void
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        sticky &&
          'sticky top-0 z-10 bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none',
        sticky && (compact ? 'py-1' : 'py-2 sm:py-3'),
      )}
      data-compact={compact || undefined}
      data-slot={headerSlot}
    >
      <h1
        className={cn(
          'min-w-0 font-semibold tracking-[-0.04em] break-words transition-[font-size] duration-200 ease-out motion-reduce:transition-none',
          compact ? 'text-base' : 'text-lg sm:text-2xl',
        )}
        id={titleId}
      >
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-1">
        <HouseholdScopeSwitch
          size="sm"
          hasActiveFamily={hasActiveFamily}
          scope={scope}
          personalHref={personalHref}
          familyHref={familyHref}
        />
        <MonthPicker
          align="end"
          className={cn(
            'text-xs duration-200 ease-out motion-reduce:transition-none',
            compact ? 'min-h-9 sm:text-sm' : 'sm:text-base',
          )}
          maxMonth={maxMonth}
          monthInput={monthInput}
          monthLabel={monthLabel}
          onChange={onChange}
          showCalendarIcon
        />
      </div>
    </header>
  )
}
