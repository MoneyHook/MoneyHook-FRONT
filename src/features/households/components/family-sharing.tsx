import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { Household } from '@/shared/api/generated/model'
import { listV1Transactions } from '@/shared/api/generated/transaction/transaction'
import { Button } from '@/shared/components/ui/button'

import { FamilyEntriesSkeleton } from './family-skeletons'
import { FamilyError } from './fields'
import { SharePersonalEntry } from './share-personal-entry'

export function FamilySharing({ family }: { family: Household }) {
  const [search] = useSearchParams()
  const now = new Date()
  const rawMonth = search.get('month')?.slice(0, 7)
  const month =
    rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)
      ? rawMonth
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selected, setSelected] = useState('')
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
          <p className="text-sm text-muted-foreground">
            自分の保存済み取引を家族に共有できます。共有中の取引は、個人の原本を更新すると家族にも反映されます。
          </p>
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
          <ul className="divide-y">
            {transactions.data?.pages
              .flatMap((page) => page.transactions)
              .map((t) => (
                <li key={t.transaction_id} className="py-3">
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-between text-left whitespace-normal"
                    aria-expanded={selected === t.transaction_id}
                    onClick={() =>
                      setSelected(
                        selected === t.transaction_id ? '' : t.transaction_id,
                      )
                    }
                  >
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        {t.transaction_date}
                      </span>
                      <span className="block">{t.transaction_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.shared ? '共有中' : '非共有'}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {t.signed_amount.toLocaleString('ja-JP')}円
                    </span>
                  </Button>
                  {selected === t.transaction_id && (
                    <SharePersonalEntry
                      key={t.transaction_id}
                      transactionId={t.transaction_id}
                      householdId={family.household_id}
                    />
                  )}
                </li>
              ))}
          </ul>
          {transactions.hasNextPage && (
            <Button
              variant="outline"
              disabled={transactions.isFetchingNextPage}
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
