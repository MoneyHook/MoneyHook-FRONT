import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { Household } from '@/shared/api/generated/model'
import { listV1Transactions } from '@/shared/api/generated/transaction/transaction'
import { Button } from '@/shared/components/ui/button'

import { useBulkSharing } from '../hooks/use-bulk-sharing'
import { FamilySharingList } from './family-sharing-list'
import { FamilyEntriesSkeleton } from './family-skeletons'
import { FamilyError } from './fields'

export function FamilySharing({ family }: { family: Household }) {
  const [search] = useSearchParams()
  const now = new Date()
  const rawMonth = search.get('month')?.slice(0, 7)
  const month =
    rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)
      ? rawMonth
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return (
    <FamilySharingMonth
      key={`${family.household_id}:${month}`}
      family={family}
      month={month}
    />
  )
}

function FamilySharingMonth({
  family,
  month,
}: {
  family: Household
  month: string
}) {
  const bulk = useBulkSharing(family.household_id)
  const transactions = useInfiniteQuery({
    queryKey: [
      '/api/v1/transactions',
      'family-sharing',
      family.household_id,
      month,
    ],
    enabled: family.state === 'active',
    initialPageParam: '',
    queryFn: async ({ pageParam, signal }) => {
      const r = await listV1Transactions(
        { month: `${month}-01`, sharing: 'all', cursor: pageParam },
        { signal },
      )
      if (r.status !== 200) throw new Error('個人の取引を取得できませんでした')
      return r.data
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const rows = useMemo(
    () => transactions.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactions.data],
  )
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">共有管理</h2>
        <p className="text-sm text-muted-foreground">
          {family.name}に共有する個人の取引
        </p>
      </header>
      {family.state === 'archived' ? (
        <p>
          終了した家族への共有は変更できません。記録画面から過去の記録を閲覧できます。
        </p>
      ) : (
        <>
          <FamilyError error={transactions.error} />
          {transactions.isError && (
            <Button
              variant="outline"
              onClick={() => void transactions.refetch()}
            >
              再読み込み
            </Button>
          )}
          {transactions.isPending && <FamilyEntriesSkeleton sharing />}
          {transactions.data?.pages[0].transactions.length === 0 && (
            <p>この月の個人取引はありません。</p>
          )}
          <FamilySharingList
            transactions={rows}
            busy={bulk.busy}
            operation={bulk.operation}
            results={bulk.results}
            onShare={bulk.share}
            onUnshare={bulk.unshare}
          />
          {transactions.hasNextPage && (
            <Button
              variant="outline"
              disabled={bulk.busy || transactions.isFetchingNextPage}
              onClick={() => void transactions.fetchNextPage()}
            >
              続きを読み込む
            </Button>
          )}
        </>
      )}
    </section>
  )
}
