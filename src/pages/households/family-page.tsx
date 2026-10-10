import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'

import {
  FamilyError,
  FamilyLedger,
  FamilySharing,
  useHouseholds,
} from '@/features/households'
import { DashboardMonthHeader } from '@/shared/components/dashboard-month-header'
import { Button } from '@/shared/components/ui/button'

import { FamilyPageSkeleton } from './family-page-skeleton'
import { FamilyTransactionsView } from './family-transactions-view'

export function FamilyPage({
  analysis = false,
  sharing = false,
  transactions = false,
}: {
  analysis?: boolean
  sharing?: boolean
  transactions?: boolean
}) {
  const [search, setSearch] = useSearchParams()
  const location = useLocation()
  const families = useHouseholds()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const rawMonth = search.get('month')?.slice(0, 7)
  const month =
    rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)
      ? rawMonth
      : currentMonth
  const selected = search.get('household')
  const family = selected
    ? families.data?.find((f) => f.household_id === selected)
    : (families.data?.find((f) => f.state === 'active') ?? families.data?.[0])

  if (families.isPending)
    return (
      <FamilyPageSkeleton
        analysis={analysis}
        sharing={sharing}
        month={month}
        view={search.get('view')}
      />
    )
  if (families.isError)
    return (
      <div className="p-6">
        <FamilyError error={families.error} />
        <Button variant="outline" onClick={() => void families.refetch()}>
          再読み込み
        </Button>
      </div>
    )
  if (!family)
    return (
      <section className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">家族の家計</h1>
        <p>
          {selected
            ? 'この家族にはアクセスできません。'
            : '参加している家族はありません。'}
        </p>
        <Button asChild variant="outline">
          <Link to="/app/settings/family">家族を作成・招待から参加</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/app/family">家族の入口に戻る</Link>
        </Button>
      </section>
    )
  // Keep the chosen family in every navigation link, including archived records.
  if (!selected) {
    const next = new URLSearchParams(search)
    next.set('household', family.household_id)
    return <Navigate replace to={`?${next}`} />
  }
  if (transactions || (!analysis && !sharing))
    return (
      <FamilyTransactionsView
        key={family.household_id}
        family={family}
        hasActiveFamily={families.data.some((item) => item.state === 'active')}
      />
    )
  return (
    <section
      aria-labelledby="family-page-title"
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pt-2 pb-24 sm:px-6 sm:pt-4 md:px-8 md:pt-6 md:pb-10"
    >
      <DashboardMonthHeader
        title={`${family.name}${family.state === 'archived' ? '（終了）' : ''}`}
        titleId="family-page-title"
        hasActiveFamily={
          families.isSuccess &&
          families.data.some((item) => item.state === 'active')
        }
        scope="family"
        personalHref={`/app/home?month=${month}-01`}
        familyHref={`${location.pathname}${location.search}`}
        monthInput={month}
        monthLabel={`${Number(month.slice(0, 4))}年${Number(month.slice(5, 7))}月`}
        maxMonth={month > currentMonth ? month : currentMonth}
        onChange={(value) => {
          if (!value) return
          setSearch((current) => {
            const next = new URLSearchParams(current)
            next.set('month', value)
            return next
          })
        }}
      />
      <div className="mt-2 sm:mt-6">
        {sharing ? (
          <FamilySharing
            key={`${family.household_id}:${month}`}
            family={family}
          />
        ) : (
          <FamilyLedger
            key={family.household_id}
            family={family}
            analysis={analysis}
          />
        )}
      </div>
    </section>
  )
}

export function LegacyFamilyRedirect({
  children,
  analysis = false,
}: {
  children: ReactNode
  analysis?: boolean
}) {
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  if (search.get('scope') !== 'household') return children
  search.delete('scope')
  return (
    <Navigate
      replace
      to={`/app/family${analysis ? '/analysis' : location.pathname === '/app/transactions' ? '/transactions' : ''}?${search}`}
    />
  )
}
