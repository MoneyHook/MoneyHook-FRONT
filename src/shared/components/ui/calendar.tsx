import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type DayPickerProps,
} from 'react-day-picker'

import { Button, buttonVariants } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      className={cn(
        'group/calendar bg-background p-3 [--cell-size:2.5rem]',
        className,
      )}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-[var(--cell-size)] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-[var(--cell-size)] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-[var(--cell-size)] w-full items-center justify-center px-[var(--cell-size)]',
          defaultClassNames.month_caption,
        ),
        caption_label: cn('select-none text-sm font-semibold', defaultClassNames.caption_label),
        month_grid: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 select-none rounded-md text-[0.8rem] font-normal text-muted-foreground',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn(
          'group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-[var(--cell-size)] min-w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100',
          defaultClassNames.day_button,
        ),
        today: cn(
          'rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn('text-muted-foreground aria-selected:text-muted-foreground', defaultClassNames.outside),
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('size-4', className)} {...props} />
          }
          if (orientation === 'right') {
            return <ChevronRight className={cn('size-4', className)} {...props} />
          }
          return <ChevronDown className={cn('size-4', className)} {...props} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      className={cn(
        'flex aspect-square h-auto w-full min-w-[var(--cell-size)] flex-col gap-1 font-normal leading-none data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
