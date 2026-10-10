import { LoadingState } from '@/shared/components/app-state'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  buildCalendarDays,
  type TransactionMonth,
  type TransactionView,
} from '../../model/transactions'

function TransactionRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-4 w-2/3 sm:h-5" />
            <Skeleton className="h-3 w-1/2 sm:h-4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 sm:w-24" />
        </div>
      ))}
    </div>
  )
}

export function TransactionsSkeleton({
  view,
  month,
  family = false,
  label = '取引画面を読み込んでいます',
}: {
  view: TransactionView
  month: TransactionMonth
  family?: boolean
  label?: string
}) {
  return (
    <LoadingState label={label} className="space-y-4 pt-4 sm:space-y-5 sm:pt-6">
      {view === 'list' ? (
        <>
          <Card className="block px-4 py-4 sm:px-6 sm:py-5">
            <Skeleton className="ml-auto h-7 w-32" />
            <div className="mt-4 grid grid-cols-3 divide-x">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="min-w-0 space-y-1 px-2 first:pl-0 last:pr-0 sm:px-6"
                >
                  <Skeleton className="h-4 w-12 sm:h-5 sm:w-20" />
                  <Skeleton className="h-4 w-3/4 sm:h-8" />
                </div>
              ))}
            </div>
            {family && (
              <div className="mt-5 border-t pt-4 sm:mt-6 sm:pt-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-3/4" />
                <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {[0, 1].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div className="space-y-5 sm:space-y-6">
            {[3, 2].map((count) => (
              <div key={count}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <Skeleton className="h-5 w-28 sm:h-6" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Card className="block p-0">
                  <TransactionRowsSkeleton count={count} />
                </Card>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <Card className="p-3 sm:p-5">
            <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="mx-auto h-7 w-32" />
              <Skeleton className="size-10 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-7">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <Skeleton key={index} className="mx-auto my-2 h-4 w-4" />
              ))}
              {buildCalendarDays(month).map((day) => (
                <div
                  key={day.date}
                  className="flex min-h-14 flex-col items-center justify-center sm:min-h-16"
                >
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="mt-1 h-1.5 w-3 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-7 w-32 sm:h-8" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[0, 1].map((index) => (
                <Skeleton key={index} className="h-12 rounded-xl" />
              ))}
            </div>
            <div className="mt-4 border-t">
              <TransactionRowsSkeleton count={2} />
            </div>
          </Card>
        </>
      )}
    </LoadingState>
  )
}
