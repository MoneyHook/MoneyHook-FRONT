import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Plus,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import type { Household } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { api, householdKey, useFamilyData } from '../api/household-queries'
import { FamilyEntryDetail } from './family-entry-detail'
import { FamilyError, FamilyField, FamilySelect } from './fields'

export function FamilyLedger({
  family,
  analysis = false,
  transactions = false,
}: {
  family: Household
  analysis?: boolean
  transactions?: boolean
}) {
  const [search, setSearch] = useSearchParams()
  const location = useLocation()
  const now = new Date()
  const monthValue = search.get('month')?.slice(0, 7)
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue ?? '')
    ? monthValue!
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const payer = transactions ? (search.get('payer') ?? '') : ''
  const kind = transactions ? (search.get('kind') ?? '') : ''
  const [expanded, setExpanded] = useState('')
  const group =
    analysis && search.get('group') === 'payers' ? 'payers' : 'categories'
  const id = family.household_id
  const detail = useFamilyData(id)
  const entries = useInfiniteQuery({
    queryKey: [...householdKey, 'entries', id, month, payer, kind],
    initialPageParam: '',
    queryFn: async ({ pageParam, signal }) => {
      const r = await api.householdEntries(
        id,
        {
          month: `${month}-01`,
          payer,
          kind,
          cursor: pageParam,
        },
        { signal },
      )
      if (r.status !== 200) throw new Error('記録を取得できません')
      return r.data
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 0,
  })
  const summary = useQuery({
    queryKey: [...householdKey, 'entries', id, month, 'summary', group],
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const r = await api.householdAnalytics(
        id,
        group,
        {
          month: `${month}-01`,
        },
        { signal },
      )
      if (r.status !== 200) throw new Error('集計を取得できません')
      return r.data
    },
  })
  const allEntries = entries.data?.pages.flatMap((page) => page.entries) ?? []
  const visibleEntries = transactions ? allEntries : allEntries.slice(0, 5)
  const context = new URLSearchParams({ household: id, month: `${month}-01` })

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          {(analysis || transactions) && (
            <h2 className="text-lg font-semibold">
              {analysis ? '分析' : transactions ? '取引' : 'ホーム'}
            </h2>
          )}
          <p className="text-sm text-muted-foreground">
            {family.state === 'archived'
              ? `${family.name}・終了した家族（閲覧専用）`
              : `${family.name}の${analysis ? '支出の内訳' : transactions ? '共有された取引と家族の記録' : '月次収支'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {family.state === 'active' && (
            <Button asChild>
              <Link
                to={`/app/family/new?${context}`}
                state={{ returnTo: `${location.pathname}${location.search}` }}
              >
                <Plus aria-hidden="true" />
                記録を追加
              </Link>
            </Button>
          )}
        </div>
      </div>
      <FamilyError error={detail.error || entries.error || summary.error} />
      {(entries.isError || summary.isError || detail.isError) && (
        <Button
          variant="outline"
          onClick={() => {
            void detail.refetch()
            void entries.refetch()
            void summary.refetch()
          }}
        >
          再読み込み
        </Button>
      )}
      {summary.isPending ? (
        <div
          role="status"
          aria-label="収支を読み込んでいます"
          className="grid grid-cols-3 gap-4 border-y py-6"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : (
        summary.data && (
          <dl className="grid grid-cols-1 gap-5 border-y py-6 sm:grid-cols-3 sm:gap-6">
            <div className="space-y-2 sm:border-r sm:pr-6">
              <dt className="text-sm text-muted-foreground">月の収支</dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {summary.data.balance.toLocaleString('ja-JP')}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  円
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:gap-6">
              {[
                {
                  label: '収入',
                  value: summary.data.income,
                  icon: ArrowDownLeft,
                  color: 'text-income',
                },
                {
                  label: '支出',
                  value: summary.data.expense,
                  icon: ArrowUpRight,
                  color: 'text-expense',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="space-y-2">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon aria-hidden="true" className={`size-4 ${color}`} />
                    {label}
                  </dt>
                  <dd
                    className={`text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${color}`}
                  >
                    {value.toLocaleString('ja-JP')}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      円
                    </span>
                  </dd>
                </div>
              ))}
            </div>
          </dl>
        )
      )}
      {analysis && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold">支出の内訳</h2>
          <div className="max-w-xs">
            <FamilyField label="集計方法">
              <FamilySelect
                value={group}
                onChange={(e) =>
                  setSearch((current) => {
                    current.set('group', e.target.value)
                    return current
                  })
                }
              >
                <option value="categories">カテゴリ別</option>
                <option value="payers">支払い者別</option>
              </FamilySelect>
            </FamilyField>
          </div>
          {summary.data?.groups.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">
              この月の支出はありません。
            </p>
          )}
          {summary.data?.groups.map((g) => (
            <div key={g.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{g.name}</span>
                <span>{g.amount.toLocaleString('ja-JP')}円</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{
                    width: `${summary.data.expense ? Math.min(100, Math.max(0, (g.amount / summary.data.expense) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {!analysis && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">
              {transactions ? '取引一覧' : '最近の取引'}
            </h2>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link to={`/app/family/sharing?${context}`}>
                  <Share2 aria-hidden="true" />
                  共有管理
                </Link>
              </Button>
              {!transactions && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/app/family/transactions?${context}`}>
                    すべて見る
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {transactions && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FamilyField label="支払い者で絞り込み">
                <FamilySelect
                  value={payer}
                  onChange={(e) =>
                    setSearch((current) => {
                      current.set('payer', e.target.value)
                      return current
                    })
                  }
                >
                  <option value="">全員</option>
                  <option value="common">家族共通</option>
                  {detail.data?.members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.display_name}
                      {m.state === 'left' ? '（退出済み）' : ''}
                    </option>
                  ))}
                </FamilySelect>
              </FamilyField>
              <FamilyField label="記録の種類">
                <FamilySelect
                  value={kind}
                  onChange={(e) =>
                    setSearch((current) => {
                      current.set('kind', e.target.value)
                      return current
                    })
                  }
                >
                  <option value="">すべて</option>
                  <option value="shared">個人原本の共有</option>
                  <option value="proxy">代理記録</option>
                  <option value="snapshot">控え</option>
                </FamilySelect>
              </FamilyField>
            </div>
          )}
          {transactions && (
            <p className="text-xs text-muted-foreground">
              収支・内訳は家族全体の月合計です。絞り込みは下の一覧に適用されます。
            </p>
          )}
          {entries.isPending && <p role="status">記録を読み込んでいます…</p>}
          {entries.data?.pages[0].entries.length === 0 && (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center">
              <p className="font-medium">
                {transactions && (payer || kind)
                  ? '条件に一致する取引はありません'
                  : 'この月の取引はありません'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {transactions && (payer || kind)
                  ? '絞り込み条件を変更してください。'
                  : family.state === 'archived'
                    ? '終了した家族の過去の記録を表示しています。'
                    : '個人の取引を共有するか、家族の記録を追加できます。'}
              </p>
            </div>
          )}
          <ul className="divide-y">
            {visibleEntries.map((entry) => (
              <li className="space-y-3 py-1" key={entry.entry_id}>
                <Button
                  variant="ghost"
                  className="flex h-auto w-full items-start justify-between gap-4 rounded-lg border-0 px-2 py-4 text-left font-normal whitespace-normal transition-colors hover:bg-muted/50 active:translate-y-0 aria-expanded:bg-muted/50 dark:hover:bg-muted/50"
                  aria-expanded={expanded === entry.entry_id}
                  onClick={() =>
                    setExpanded(
                      expanded === entry.entry_id ? '' : entry.entry_id,
                    )
                  }
                >
                  <span>
                    <span className="block text-xs text-muted-foreground">
                      {entry.transaction_date} ／{' '}
                      {entry.payer.display_name ?? '家族共通'}
                    </span>
                    <span className="mt-1 block font-medium">
                      {entry.transaction_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {
                        {
                          shared: '原本共有',
                          proxy: '代理記録',
                          snapshot: '控え',
                        }[entry.kind]
                      }
                      {entry.corrected && '・訂正済み'}
                      {entry.excluded_from_totals && '・集計除外'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${entry.sign === -1 ? 'text-expense' : 'text-income'}`}
                    >
                      {entry.sign === -1 ? '−' : '+'}
                      {entry.amount.toLocaleString('ja-JP')}円
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`size-4 text-muted-foreground transition-transform ${expanded === entry.entry_id ? 'rotate-180' : ''}`}
                    />
                  </span>
                </Button>
                {expanded === entry.entry_id && detail.data && (
                  <FamilyEntryDetail
                    id={id}
                    returnTo={`${location.pathname}${location.search}`}
                    entry={entry}
                    members={detail.data.members}
                    payments={detail.data.payments}
                    subcategories={detail.data.subcategories}
                  />
                )}
              </li>
            ))}
          </ul>
          {transactions && entries.hasNextPage && (
            <Button
              variant="outline"
              disabled={entries.isFetchingNextPage}
              onClick={() => void entries.fetchNextPage()}
            >
              続きを読み込む
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
