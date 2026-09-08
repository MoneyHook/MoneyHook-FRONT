import { Plus, X } from 'lucide-react'

import { ErrorState } from '@/shared/components/app-state'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'

import { useTransactionsController } from '../hooks/use-transactions-controller'
import { EMPTY_TRANSACTION_FILTERS } from '../model/transaction-filters'
import { TransactionsCalendarPanel } from './transactions/transactions-calendar-panel'
import {
  ActiveFilterChips,
  FilterResultSummary,
  TransactionFilterButton,
  TransactionsFilterPanel,
} from './transactions/transactions-filter-controls'
import { TransactionsListPanel } from './transactions/transactions-list-panel'
import { TransactionsSkeleton } from './transactions/transactions-states'
import { TransactionsViewTabs } from './transactions/transactions-view-tabs'

export function TransactionsView() {
  const controller = useTransactionsController()

  return (
    <>
      <section aria-labelledby="transactions-page-title" className="motion-route-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 md:px-8 md:pb-10 md:pt-8">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" id="transactions-page-title">取引</h1>
          <div className="flex items-center gap-1">
            <div className="md:hidden"><TransactionFilterButton activeCount={controller.activeFilterCount} onClick={controller.openMobileFilters} /></div>
            <TransactionFilterButton activeCount={controller.activeFilterCount} className="hidden md:inline-flex" onClick={controller.openDesktopFilters} />
          </div>
        </header>

        <div className="mt-4 sm:mt-6">
          <TransactionsViewTabs onChange={controller.changeView} value={controller.view} />
          {controller.data && controller.activeFilterCount ? (
            <div className="space-y-3 pt-4 sm:pt-5">
              <ActiveFilterChips filters={controller.filters} items={controller.data.items} onRemove={controller.removeFilter} references={controller.references} />
              <FilterResultSummary sign={controller.filters.sign} summary={controller.filterSummary} />
            </div>
          ) : null}
          {controller.isPending ? <TransactionsSkeleton view={controller.view} /> : null}
          {controller.isError ? <ErrorState message={controller.error instanceof Error ? controller.error.message : '取引データを取得できませんでした。'} onRetry={() => void controller.refetch()} title="取引を表示できません" /> : null}
          {controller.data && controller.filteredData && controller.view === 'list' ? <TransactionsListPanel data={controller.filteredData} hasFilters={Boolean(controller.activeFilterCount)} month={controller.month} onClearFilters={controller.clearAppliedFilters} onMonthChange={controller.changeMonth} onOpen={controller.openTransaction} /> : null}
          {controller.data && controller.filteredData && controller.view === 'calendar' ? <TransactionsCalendarPanel data={controller.filteredData} month={controller.month} onDateChange={controller.changeDate} onMonthChange={controller.changeMonth} onOpen={controller.openTransaction} selectedDate={controller.selectedDate} /> : null}
        </div>
      </section>

      <Sheet onOpenChange={controller.setMobileFilterOpen} open={controller.mobileFilterOpen}>
        <SheetContent className="max-h-[88svh] rounded-t-[2rem] border-x-0 px-0 pb-[max(1rem,env(safe-area-inset-bottom))]" showCloseButton={false} side="bottom">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
          <div className="flex items-center justify-between px-5 pb-1 pt-4"><h2 className="text-xl font-semibold">絞り込み</h2><Button aria-label="絞り込みを閉じる" onClick={() => controller.setMobileFilterOpen(false)} size="icon-lg" variant="ghost"><X aria-hidden="true" /></Button></div>
          <TransactionsFilterPanel draft={controller.draftFilters} onApply={controller.applyFilters} onChange={controller.setDraftFilters} onClear={() => controller.setDraftFilters(EMPTY_TRANSACTION_FILTERS)} references={controller.references} />
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={controller.setDesktopFilterOpen} open={controller.desktopFilterOpen}>
        <SheetContent className="hidden inset-y-4 right-4 h-[calc(100%-2rem)] w-[min(26rem,calc(100vw-2rem))] max-w-none gap-0 rounded-l-[2rem] rounded-r-none border md:flex" showCloseButton={false} side="right">
          <div className="flex items-center justify-between border-b px-6 py-5"><h2 className="text-xl font-semibold">絞り込み</h2><Button aria-label="絞り込みを閉じる" onClick={() => controller.setDesktopFilterOpen(false)} size="icon-lg" variant="ghost"><X aria-hidden="true" /></Button></div>
          <TransactionsFilterPanel draft={controller.draftFilters} onApply={controller.applyFilters} onChange={controller.setDraftFilters} onClear={() => controller.setDraftFilters(EMPTY_TRANSACTION_FILTERS)} references={controller.references} />
        </SheetContent>
      </Sheet>

      <Button aria-label="新しい取引を追加" className="fixed bottom-6 right-8 z-30 hidden size-14 rounded-full shadow-lg md:inline-flex" onClick={controller.openNewTransaction} size="icon-lg" title="新しい取引を追加"><Plus aria-hidden="true" className="size-7" /></Button>
    </>
  )
}
