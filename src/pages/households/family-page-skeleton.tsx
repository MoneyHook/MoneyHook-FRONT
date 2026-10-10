import {
  FamilyEntriesSkeleton,
  FamilySummarySkeleton,
} from '@/features/households'
import {
  createTransactionMonth,
  normalizeTransactionView,
  TransactionsSkeleton,
} from '@/features/transactions'
import { LoadingState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function FamilyPageSkeleton({
  analysis,
  sharing,
  month,
  view,
}: {
  analysis: boolean
  sharing: boolean
  month: string
  view: string | null
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-2 pb-24 sm:px-6 sm:pt-4 md:px-8 md:pt-6 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-72" />
      </div>
      {analysis || sharing ? (
        <div className="mt-2 space-y-8 sm:mt-6">
          {sharing ? (
            <>
              <LoadingState
                label="家族を読み込んでいます"
                className="space-y-2"
              >
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-full max-w-xl" />
              </LoadingState>
              <FamilyEntriesSkeleton sharing />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              <FamilySummarySkeleton />
              <LoadingState
                label="家族を読み込んでいます"
                className="space-y-5"
              >
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-full max-w-xs" />
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </LoadingState>
            </>
          )}
        </div>
      ) : (
        <>
          <Skeleton className="mt-1 h-4 w-24" />
          <div className="mt-3 flex gap-2 sm:mt-4">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
          <TransactionsSkeleton
            label="家族を読み込んでいます"
            view={normalizeTransactionView(view)}
            month={createTransactionMonth(
              `${month}-01`,
              new Date(
                Number(month.slice(0, 4)),
                Number(month.slice(5, 7)) - 1,
                1,
              ),
            )}
            family
          />
        </>
      )}
    </section>
  )
}
