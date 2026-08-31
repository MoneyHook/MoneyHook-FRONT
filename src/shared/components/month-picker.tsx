import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

export type MonthPickerProps = {
  monthInput: string
  monthLabel: string
  maxMonth: string
  onChange: (month: string) => void
  align?: 'start' | 'center' | 'end'
  className?: string
  showCalendarIcon?: boolean
}

const monthNames = Array.from({ length: 12 }, (_, index) => index + 1)

function parseYear(monthInput: string) {
  return Number(monthInput.slice(0, 4))
}

function formatMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function MonthPicker({
  monthInput,
  monthLabel,
  maxMonth,
  onChange,
  align = 'center',
  className,
  showCalendarIcon = false,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [visibleYear, setVisibleYear] = useState(() => parseYear(monthInput))
  const selectedYear = parseYear(monthInput)
  const maxYear = parseYear(maxMonth)

  const canGoNextYear = visibleYear < maxYear
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setVisibleYear(selectedYear)
    }
  }

  const handleMonthSelect = (month: number) => {
    const nextMonthInput = formatMonth(visibleYear, month)
    if (nextMonthInput > maxMonth) {
      return
    }
    onChange(`${nextMonthInput}-01`)
    setOpen(false)
  }

  const handleCurrentMonthSelect = () => {
    onChange(`${maxMonth}-01`)
    setOpen(false)
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label="対象月"
          aria-haspopup="dialog"
          className={cn(
            'min-h-10 gap-1.5 px-2 text-sm font-medium sm:gap-2',
            className,
          )}
          variant="ghost"
        >
          {showCalendarIcon ? <CalendarDays aria-hidden="true" className="size-5" /> : null}
          <span>{monthLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[calc(100vw-2rem)] max-w-80 p-3 sm:p-4"
        sideOffset={8}
      >
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <Button
            aria-label={`${visibleYear - 1}年を表示`}
            onClick={() => setVisibleYear((year) => year - 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p className="text-sm font-semibold tabular-nums">{visibleYear}年</p>
          <Button
            aria-label={`${visibleYear + 1}年を表示`}
            disabled={!canGoNextYear}
            onClick={() => setVisibleYear((year) => year + 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>

        <div
          aria-label={`${visibleYear}年の月`}
          className="grid grid-cols-3 gap-1.5 pt-3"
          role="group"
        >
          {monthNames.map((month) => {
            const value = formatMonth(visibleYear, month)
            const isSelected = value === monthInput
            const isDisabled = value > maxMonth

            return (
              <Button
                aria-label={`${visibleYear}年${month}月${isSelected ? '（選択中）' : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  'h-10 w-full text-sm',
                  !isSelected && 'text-muted-foreground hover:text-foreground',
                )}
                disabled={isDisabled}
                key={value}
                onClick={() => handleMonthSelect(month)}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
              >
                {month}月
              </Button>
            )
          })}
        </div>

        <div className="mt-3 flex justify-end border-t pt-3">
          <Button
            aria-label="今月を選択"
            className="text-xs text-primary"
            onClick={handleCurrentMonthSelect}
            type="button"
            variant="link"
          >
            今月
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
