import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

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
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      const scrollTop = window.scrollY
      setIsHeaderCompact((compact) =>
        compact ? scrollTop > 0 : scrollTop > 16,
      )
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex items-center justify-between gap-4 bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none',
        isHeaderCompact ? 'py-1' : 'py-2 sm:py-3',
      )}
      data-compact={isHeaderCompact || undefined}
      data-slot="home-page-header"
    >
      <h1
        className={cn(
          'font-semibold tracking-[-0.04em] transition-[font-size] duration-200 ease-out motion-reduce:transition-none',
          isHeaderCompact ? 'text-base' : 'text-lg sm:text-2xl',
        )}
        id="home-page-title"
      >
        ホーム
      </h1>
      <div className="flex items-center gap-1">
        <MonthPicker
          align="end"
          className={cn(
            'text-xs duration-200 ease-out motion-reduce:transition-none',
            isHeaderCompact ? 'min-h-9 sm:text-sm' : 'sm:text-base',
          )}
          maxMonth={maxMonth}
          monthInput={monthInput}
          monthLabel={monthLabel}
          onChange={onChange}
          showCalendarIcon
        />
        <Button
          aria-label="通知（未対応）"
          disabled
          size="icon"
          variant="ghost"
        >
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}
