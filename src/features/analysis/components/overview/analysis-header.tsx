import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { MonthPicker } from '@/shared/components/month-picker'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Tooltip as AppTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

import {
  type AnalysisView,
  analysisViews,
} from '../../model/analysis-navigation'
import {
  type AnalysisRangeSelection,
  formatJapaneseMonth,
  getCurrentAnalysisMonth,
  getPreviousAnalysisMonth,
} from '../../model/analysis-overview'

export function AnalysisHeader({
  compact = false,
  view,
  selection,
  onRangeChange,
  getViewLink,
}: {
  compact?: boolean
  getViewLink: (view: AnalysisView) => { search: string }
  view: AnalysisView
  selection: AnalysisRangeSelection
  onRangeChange: (startMonth: string, endMonth: string) => void
}) {
  const [periodOpen, setPeriodOpen] = useState(false)
  const label = selection.isDefault
    ? '直近6か月'
    : selection.startMonth === selection.endMonth
      ? formatJapaneseMonth(selection.startMonth)
      : `${formatJapaneseMonth(selection.startMonth)}〜${Number(selection.endMonth.slice(5))}月`

  const selectMonth = (month: string) => {
    onRangeChange(month, month)
    setPeriodOpen(false)
  }

  return (
    <>
      <header
        className="flex shrink-0 items-center justify-between gap-4"
        data-compact={compact || undefined}
        data-slot="analysis-page-header"
      >
        <h1
          className={cn(
            'font-semibold tracking-[-0.04em] transition-[font-size] duration-200 ease-out motion-reduce:transition-none',
            compact ? 'text-base' : 'text-xl sm:text-2xl',
          )}
          id="analysis-page-title"
        >
          分析
        </h1>
        <Popover onOpenChange={setPeriodOpen} open={periodOpen}>
          <AppTooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  aria-label="表示期間を変更"
                  aria-expanded={periodOpen}
                  className={cn(
                    'gap-2 px-2 text-sm font-semibold text-primary duration-200 ease-out motion-reduce:transition-none',
                    compact ? 'min-h-9' : 'min-h-10 sm:text-base',
                  )}
                  type="button"
                  variant="ghost"
                >
                  <CalendarDays aria-hidden="true" className="size-5" />
                  {label}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {selection.range.label}
            </TooltipContent>
          </AppTooltip>
          <PopoverContent
            align="end"
            className="w-[calc(100vw-2rem)] max-w-80 p-3 sm:p-4"
            sideOffset={8}
          >
            <p className="text-sm font-semibold">表示期間</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                className="min-h-10"
                onClick={() => selectMonth(getCurrentAnalysisMonth())}
                type="button"
                variant="outline"
              >
                今月
              </Button>
              <Button
                className="min-h-10"
                onClick={() => selectMonth(getPreviousAnalysisMonth())}
                type="button"
                variant="outline"
              >
                先月
              </Button>
            </div>
            <div className="mt-3 grid gap-3 border-t pt-3">
              <MonthPicker
                align="start"
                ariaLabel="開始月"
                maxMonth={selection.endMonth}
                monthInput={selection.startMonth}
                monthLabel={`開始: ${formatJapaneseMonth(selection.startMonth)}`}
                onChange={(month) =>
                  onRangeChange(month.slice(0, 7), selection.endMonth)
                }
                showCalendarIcon
              />
              <MonthPicker
                align="start"
                ariaLabel="終了月"
                maxMonth={getCurrentAnalysisMonth()}
                minMonth={selection.startMonth}
                monthInput={selection.endMonth}
                monthLabel={`終了: ${formatJapaneseMonth(selection.endMonth)}`}
                onChange={(month) =>
                  onRangeChange(selection.startMonth, month.slice(0, 7))
                }
                showCalendarIcon
              />
            </div>
          </PopoverContent>
        </Popover>
      </header>

      <nav
        aria-label="分析表示"
        className={cn(
          'shrink-0 border-b transition-[margin-top] duration-200 ease-out motion-reduce:transition-none',
          compact ? 'mt-1' : 'mt-3 sm:mt-5',
        )}
      >
        <ul className="grid grid-cols-4">
          {analysisViews.map((item) => {
            const isActive = item.value === view
            return (
              <li key={item.value}>
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center justify-center px-1 text-center text-xs font-medium transition-[min-height,color,font-size] duration-200 ease-out motion-reduce:transition-none',
                    compact ? 'min-h-9 sm:text-sm' : 'min-h-12 sm:text-base',
                    isActive
                      ? 'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                  to={getViewLink(item.value)}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
