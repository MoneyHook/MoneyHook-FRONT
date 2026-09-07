import { ArrowRight, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'
import { formatCurrency, formatSignedCurrency, type CategorySummary, type HomeDashboardViewModel } from '../../model/home-dashboard'
import { DashboardCard } from './dashboard-card'

function CategoryRow({ category }: { category: CategorySummary }) {
  const presentation = getCategoryPresentation(category.name)
  const Icon = presentation.icon
  const differenceClass =
    category.difference > 0
      ? 'text-expense'
      : category.difference < 0
        ? 'text-chart-2'
        : 'text-muted-foreground'

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
      <span
        className={cn(
          'row-span-2 flex size-6 items-center justify-center rounded-full sm:size-9',
          presentation.iconClassName,
        )}
      >
        <Icon aria-hidden="true" className="size-3 sm:size-4.5" />
      </span>
      <span className="truncate text-xs font-medium leading-none sm:text-sm sm:leading-normal">
        {category.name}
      </span>
      <span className="text-xs font-semibold leading-none tabular-nums sm:text-sm sm:leading-normal">
        {formatCurrency(category.amount)}
      </span>
      <span className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted sm:mt-1 sm:h-1.5">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${category.barRatio}%` }}
        />
      </span>
      <span
        className={cn(
          'text-[0.625rem] font-medium leading-none tabular-nums sm:mt-0.5 sm:text-xs sm:leading-normal',
          differenceClass,
        )}
      >
        {formatSignedCurrency(category.difference)}
      </span>
    </li>
  )
}

export function CategoryCard({ data, month }: { data: HomeDashboardViewModel; month: string }) {
  return (
    <DashboardCard className="flex min-h-full flex-col">
      <h2 className="text-sm font-semibold sm:text-lg">
        カテゴリ別支出 <span className="text-[0.625rem] sm:text-xs">（上位5件）</span>
      </h2>
      {data.categories.length > 0 ? (
        <ul className="mt-2 space-y-1.5 sm:mt-5 sm:space-y-4">
          {data.categories.map((category) => (
            <CategoryRow category={category} key={category.name} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <Tags aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">この月の支出はありません</p>
        </div>
      )}
      <Button asChild className="mt-1 h-6 self-center text-xs text-primary sm:mt-5 sm:h-9 sm:text-sm" variant="link">
        <Link to={`/app/analysis?view=categories&month=${month}`}>
          すべて見る <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Link>
      </Button>
    </DashboardCard>
  )
}
