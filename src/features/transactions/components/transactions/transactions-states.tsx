import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import type { TransactionView } from '../../model/transactions'

export function TransactionsSkeleton({ view }: { view: TransactionView }) {
  return (
    <div aria-label="取引画面を読み込んでいます" className="space-y-4 pt-4 sm:pt-6" role="status">
      <Skeleton className={cn('rounded-2xl', view === 'list' ? 'h-40' : 'h-112')} />
      <Skeleton className="h-72 rounded-2xl" />
      {view === 'list' ? <Skeleton className="h-64 rounded-2xl" /> : null}
    </div>
  )
}
