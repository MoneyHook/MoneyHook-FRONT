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
  formatJapaneseMonth,
  getCurrentAnalysisMonth,
  type AnalysisRangeSelection,
} from '../../model/analysis-overview'
import {
  analysisViews,
  type AnalysisView,
} from '../../model/analysis-navigation'

export function AnalysisHeader({
  view,
  selection,
  onRangeChange,
  getViewLink,
}: {
  getViewLink: (view: AnalysisView) => { search: string }
  view: AnalysisView
  selection: AnalysisRangeSelection
  onRangeChange: (startMonth: string, endMonth: string) => void
}) {
  const [periodOpen, setPeriodOpen] = useState(false)
  const label = selection.isDefault
    ? '直近6か月'
    : `${formatJapaneseMonth(selection.startMonth)}〜${Number(selection.endMonth.slice(5))}月`

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <h1
          className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl"
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
                  className="min-h-10 gap-2 px-2 text-sm font-semibold text-primary sm:text-base"
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

      <nav aria-label="分析表示" className="mt-3 border-b sm:mt-5">
        <ul className="grid grid-cols-4">
          {analysisViews.map((item) => {
            const isActive = item.value === view
            return (
              <li key={item.value}>
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-12 items-center justify-center px-1 text-center text-xs font-medium transition-colors sm:text-base',
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
