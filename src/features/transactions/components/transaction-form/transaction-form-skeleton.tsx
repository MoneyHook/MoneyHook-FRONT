import { LoadingState } from '@/shared/components/app-state'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function TransactionFormSkeleton({
  isEdit = false,
  showCandidates = !isEdit,
  label = `取引${isEdit ? '編集' : '追加'}画面を読み込んでいます`,
}: {
  isEdit?: boolean
  showCandidates?: boolean
  label?: string
}) {
  return (
    <LoadingState
      label={label}
      className="mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden px-4 pt-3 sm:block sm:h-auto sm:overflow-visible sm:px-6 sm:pt-7 sm:pb-10"
    >
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="size-8 rounded-full sm:size-9" />
          <Skeleton
            className={
              isEdit ? 'h-6 w-32 sm:h-8 sm:w-40' : 'h-6 w-56 sm:h-8 sm:w-72'
            }
          />
          <Skeleton className="size-8 rounded-full sm:size-9" />
        </div>
        <Skeleton className="mt-3 h-11 rounded-2xl sm:mt-8 sm:h-15" />
      </div>
      <div className="scrollbar-hidden mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pb-24 sm:mt-8 sm:space-y-6 sm:overflow-visible sm:pb-0">
        <Card className="block divide-y p-0">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex min-h-14 items-center justify-between gap-4 px-4 sm:min-h-16 sm:px-5"
            >
              <Skeleton className="h-5 w-16" />
              <Skeleton className={index === 1 ? 'h-8 w-32' : 'h-5 w-36'} />
            </div>
          ))}
        </Card>
        <Card className="block p-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:min-h-28 sm:px-5">
            <Skeleton className="h-5 w-16" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="flex min-h-12 items-center justify-between border-t px-4 sm:min-h-16 sm:px-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-12 rounded-full" />
          </div>
        </Card>
        <Card className="block p-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:min-h-28 sm:px-5">
            <Skeleton className="h-5 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </Card>
        {showCandidates && (
          <Card className="block px-4 py-2 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="size-11 rounded-full" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </Card>
        )}
      </div>
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 sm:static sm:mt-6 sm:flex sm:justify-end">
        <Skeleton className="h-12 w-full rounded-full sm:w-36 sm:rounded-lg" />
      </div>
    </LoadingState>
  )
}
