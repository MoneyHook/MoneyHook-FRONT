import { ChevronDown } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

import type {
  AnalysisFixedViewModel,
  FixedCategoryItem,
} from '../../model/analysis-fixed'
import { formatCurrency } from '../../model/analysis-overview'
import { CategoryIcon } from '../category-icon'
import { AnalysisPanel } from './fixed-analysis-panel'

function CategorySelector({
  categories,
  selectedCategoryIds,
  onChange,
}: {
  categories: FixedCategoryItem[]
  selectedCategoryIds: string[]
  onChange: (categoryIds: string[]) => void
}) {
  const selected = new Set(selectedCategoryIds)
  const allSelected = selectedCategoryIds.length === categories.length

  const toggleCategory = (categoryId: string) => {
    if (selected.has(categoryId)) {
      if (selectedCategoryIds.length === 1) {
        return
      }
      onChange(selectedCategoryIds.filter((id) => id !== categoryId))
      return
    }
    onChange(
      categories
        .filter(
          (category) => selected.has(category.id) || category.id === categoryId,
        )
        .map((category) => category.id),
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`カテゴリを選択、${selectedCategoryIds.length}件選択中`}
          className="min-h-11 text-success sm:min-h-9"
          variant="ghost"
        >
          {allSelected
            ? 'カテゴリを選択'
            : `${selectedCategoryIds.length}カテゴリを選択中`}
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>表示するカテゴリ</DropdownMenuLabel>
        <DropdownMenuItem
          className="min-h-10"
          onSelect={() => onChange(categories.map((category) => category.id))}
        >
          すべて選択
          {allSelected ? (
            <span className="ml-auto text-success">選択中</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((category) => {
          const checked = selected.has(category.id)
          return (
            <DropdownMenuCheckboxItem
              checked={checked}
              className="min-h-10"
              disabled={checked && selectedCategoryIds.length === 1}
              key={category.id}
              onCheckedChange={() => toggleCategory(category.id)}
              onSelect={(event) => event.preventDefault()}
            >
              <CategoryIcon name={category.name} />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCurrency(category.amount)}
              </span>
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function CategoryTrendTable({
  data,
  categories,
  selectedCategoryIds,
  onCategoryChange,
}: {
  data: AnalysisFixedViewModel
  categories: FixedCategoryItem[]
  selectedCategoryIds: string[]
  onCategoryChange: (categoryIds: string[]) => void
}) {
  return (
    <AnalysisPanel className="overflow-hidden p-0">
      <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          固定費のカテゴリ別推移
        </h2>
        <div className="self-end sm:self-auto">
          <CategorySelector
            categories={data.categories}
            onChange={onCategoryChange}
            selectedCategoryIds={selectedCategoryIds}
          />
        </div>
      </div>
      <div className="divide-y border-t sm:hidden">
        {categories.map((category) => {
          const byBucket = new Map(
            category.series.map((item) => [item.bucket, item.expenseAmount]),
          )
          return (
            <details className="group" key={category.id}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <CategoryIcon name={category.name} />
                <span className="min-w-0 flex-1 text-sm font-semibold wrap-anywhere">
                  {category.name}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xs text-muted-foreground">
                    月平均
                  </span>
                  <span className="block text-sm font-semibold tabular-nums">
                    {formatCurrency(category.monthlyAverage)}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="px-4 pb-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3">
                  {data.series.map((item) => (
                    <div className="min-w-0" key={item.bucket}>
                      <dt className="text-xs text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium tabular-nums">
                        {formatCurrency(byBucket.get(item.bucket) ?? 0)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <dl className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3">
                  <dt className="text-xs text-muted-foreground">年間換算</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {formatCurrency(category.annualizedAmount)}
                  </dd>
                </dl>
              </div>
            </details>
          )
        })}
      </div>
      <div className="hidden border-t sm:block">
        <Table className="w-full min-w-208 border-collapse text-xs tabular-nums sm:text-sm">
          <TableCaption className="sr-only">
            選択した固定費カテゴリの月平均、月別支出、年間換算
          </TableCaption>
          <TableHeader className="bg-card text-muted-foreground">
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-36 bg-card px-4 py-3 text-left font-medium sm:px-6">
                カテゴリ
              </TableHead>
              <TableHead className="px-3 py-3 text-right font-medium">
                月平均
              </TableHead>
              {data.series.map((item) => (
                <TableHead
                  className="px-3 py-3 text-right font-medium"
                  key={item.bucket}
                >
                  {item.label}
                </TableHead>
              ))}
              <TableHead className="px-4 py-3 text-right font-medium sm:px-6">
                年間換算
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {categories.map((category) => {
              const byBucket = new Map(
                category.series.map((item) => [
                  item.bucket,
                  item.expenseAmount,
                ]),
              )
              return (
                <TableRow
                  className="bg-card transition-colors"
                  key={category.id}
                >
                  <TableHead
                    className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-semibold sm:px-6"
                    scope="row"
                  >
                    <span className="flex items-center gap-2">
                      <CategoryIcon name={category.name} />
                      <span>{category.name}</span>
                    </span>
                  </TableHead>
                  <TableCell className="px-3 py-3 text-right font-semibold">
                    {formatCurrency(category.monthlyAverage)}
                  </TableCell>
                  {data.series.map((item) => (
                    <TableCell
                      className="px-3 py-3 text-right"
                      key={item.bucket}
                    >
                      {formatCurrency(byBucket.get(item.bucket) ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3 text-right font-semibold sm:px-6">
                    {formatCurrency(category.annualizedAmount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </AnalysisPanel>
  )
}
