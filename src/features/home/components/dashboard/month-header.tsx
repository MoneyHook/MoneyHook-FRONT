import { Bell } from 'lucide-react'
import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'

export function MonthHeader({
  monthInput,
  monthLabel,
  maxMonth,
  onChange,
}: {
  monthInput: string
  monthLabel: string
  maxMonth: string
  onChange: (value: string) => void
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1
        className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl"
        id="home-page-title"
      >
        ホーム
      </h1>
      <div className="flex items-center gap-1">
        <MonthPicker
          align="end"
          className="text-xs sm:text-base"
          maxMonth={maxMonth}
          monthInput={monthInput}
          monthLabel={monthLabel}
          onChange={onChange}
          showCalendarIcon
        />
        <Button aria-label="通知（未対応）" disabled size="icon" variant="ghost">
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}
