import { ErrorState } from '@/shared/components/app-state'

import { useHomeDashboardController } from '../hooks/use-home-dashboard-controller'
import { MonthHeader } from './dashboard/month-header'
import { SummaryCard } from './dashboard/summary-card'
import { SpendingPaceCard } from './dashboard/spending-pace-card'
import { CategoryCard } from './dashboard/category-card'
import { ChangesCard } from './dashboard/changes-card'
import { FixedSummaryCard } from './dashboard/fixed-summary-card'
import { HomeDashboardSkeleton } from './dashboard/home-dashboard-skeleton'

export function HomeDashboard() {
  const { dashboard, month, handleMonthChange } = useHomeDashboardController()

  return (
    <section
      aria-labelledby="home-page-title"
      className="motion-route-enter mx-auto w-full max-w-7xl px-4 pb-24 pt-2 sm:px-6 sm:pt-6 md:px-8 md:pb-10 md:pt-8"
    >
      <MonthHeader
        maxMonth={month.currentMonthInput}
        monthInput={month.monthInput}
        monthLabel={month.monthLabel}
        onChange={handleMonthChange}
      />

      <div className="mt-2 sm:mt-6">
        {dashboard.isPending ? <HomeDashboardSkeleton /> : null}
        {dashboard.isError ? (
          <ErrorState
            message={
              dashboard.error instanceof Error
                ? dashboard.error.message
                : 'ホームのデータを取得できませんでした。'
            }
            onRetry={() => void dashboard.refetch()}
            title="ホームを表示できません"
          />
        ) : null}
        {dashboard.data ? (
          <div className="space-y-3 sm:space-y-4">
            <SummaryCard data={dashboard.data} />
            <SpendingPaceCard data={dashboard.data} />
            <div className="grid gap-3 min-[400px]:grid-cols-[1.08fr_0.92fr] sm:gap-4">
              <CategoryCard data={dashboard.data} month={month.month} />
              <ChangesCard data={dashboard.data} />
            </div>
            <FixedSummaryCard data={dashboard.data} month={month.month} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
