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
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">
          固定費のカテゴリ別推移
        </h2>
        <CategorySelector
          categories={data.categories}
          onChange={onCategoryChange}
          selectedCategoryIds={selectedCategoryIds}
        />
      </div>
      <div className="border-t">
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
