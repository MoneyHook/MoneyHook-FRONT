import { Plus, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { FamilyEntryDetailSkeleton } from '@/features/households'
import {
  FamilyEntryDetail,
  FamilyTransactionsListPanel,
  useFamilyData,
  useFamilyTransactions,
} from '@/features/households'
import {
  createTransactionMonth,
  normalizeSelectedDate,
  normalizeTransactionView,
  TransactionFilterButton,
  TransactionsCalendarPanel,
  TransactionsSkeleton,
  TransactionsViewTabs,
} from '@/features/transactions'
import type { Household } from '@/shared/api/generated/model'
import { ErrorState } from '@/shared/components/app-state'
import { HouseholdScopeSwitch } from '@/shared/components/household-scope-switch'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Tabs, TabsContent } from '@/shared/components/ui/tabs'

import { FamilyTransactionsFilterSheet } from './family-transactions-filter-sheet'
import { buildFamilyTransactionsViewModel } from './family-transactions-model'

export function FamilyTransactionsView({
  family,
  hasActiveFamily,
}: {
  family: Household
  hasActiveFamily: boolean
}) {
  const [search, setSearch] = useSearchParams()
  const location = useLocation()
  // Family records may include future months; keep those months accessible.
  const rawMonth = search.get('month')?.slice(0, 7)
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth ?? '')
    ? rawMonth
    : undefined
  const now = new Date()
  const month = createTransactionMonth(
    validMonth ? `${validMonth}-01` : null,
    validMonth &&
      validMonth >
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      ? new Date(
          Number(validMonth.slice(0, 4)),
          Number(validMonth.slice(5, 7)) - 1,
          1,
        )
      : now,
  )
  const view = normalizeTransactionView(search.get('view'))
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const updateHeader = () => {
      const scrollTop = window.scrollY
      setIsHeaderCompact((compact) =>
        compact ? scrollTop > 0 : scrollTop > 16,
      )
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [view])

  const payer = search.get('payer') ?? ''
  const kind = search.get('kind') ?? ''
  const [filterOpen, setFilterOpen] = useState(false)
  const [draft, setDraft] = useState({ payer, kind })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const entries = useFamilyTransactions(family.household_id, month.month)
  const detail = useFamilyData(family.household_id)
  const data = buildFamilyTransactionsViewModel(entries.data ?? [], payer, kind)
  const selectedDate = normalizeSelectedDate(
    search.get('date'),
    month,
    data.items,
  )
  const selectedEntry = entries.data?.find(
    (entry) => entry.entry_id === selectedId,
  )
  const activeCount = Number(Boolean(payer)) + Number(Boolean(kind))
  const context = new URLSearchParams({
    household: family.household_id,
    month: month.month,
  })
  const returnTo = `${location.pathname}${location.search}`
  const updateSearch = (values: Record<string, string | null>) =>
    setSearch((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    })
  const changeMonth = (value: string) => {
    if (!value) return
    updateSearch({ month: `${value.slice(0, 7)}-01`, date: null })
    setSelectedId(null)
  }
  const clearFilters = () => updateSearch({ payer: null, kind: null })
  const error = entries.error || detail.error

  return (
    <>
      <section
        aria-labelledby="family-transactions-title"
        className="motion-route-enter mx-auto w-full max-w-6xl px-4 pt-2 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 md:px-8 md:pt-6 md:pb-20"
      >
        <Tabs
          className="gap-0"
          value={view}
          onValueChange={(value) => updateSearch({ view: value })}
        >
          <div
            className={`sticky top-0 z-10 bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'pt-1' : 'pt-2 sm:pt-3'}`}
          >
            <header
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              data-compact={isHeaderCompact || undefined}
              data-slot="family-transactions-page-header"
            >
              <h1
                id="family-transactions-title"
                className={`font-semibold tracking-[-0.04em] transition-[font-size] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'text-base' : 'text-xl sm:text-2xl'}`}
              >
                取引
              </h1>
              <div className="flex items-center gap-1">
                <HouseholdScopeSwitch
                  size="sm"
                  hasActiveFamily={hasActiveFamily}
                  scope="family"
                  personalHref={`/app/home?month=${month.month}`}
                  familyHref={returnTo}
                />
                <Button
                  asChild
                  variant="ghost"
                  size="icon-lg"
                  aria-label="共有管理"
                >
                  <Link to={`/app/family/sharing?${context}`}>
                    <Share2 aria-hidden="true" className="size-5" />
                  </Link>
                </Button>
                <TransactionFilterButton
                  activeCount={activeCount}
                  onClick={() => {
                    setDraft({ payer, kind })
                    setFilterOpen(true)
                  }}
                />
              </div>
            </header>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {family.name}
              {family.state === 'archived' ? '・終了した家族（閲覧専用）' : ''}
            </p>
            <div
              className={`transition-[margin-top] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'mt-1' : 'mt-3 sm:mt-4'}`}
            >
              <TransactionsViewTabs compact={isHeaderCompact} />
            </div>
          </div>
          <div key={view} data-slot="family-transactions-content">
            {activeCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 text-sm">
                <p className="text-muted-foreground">
                  {data.items.length}件の取引・合計は絞り込み後の金額です
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  すべて解除
                </Button>
              </div>
            )}
            {entries.isPending && (
              <TransactionsSkeleton view={view} month={month} family />
            )}
            {error && (
              <ErrorState
                title="家族の取引を表示できません"
                message={
                  error instanceof Error
                    ? error.message
                    : '再読み込みしてください。'
                }
                onRetry={() => {
                  void entries.refetch()
                  void detail.refetch()
                }}
              />
            )}
            <TabsContent value="list">
              {entries.data && (
                <FamilyTransactionsListPanel
                  data={data}
                  month={month}
                  hasFilters={activeCount > 0}
                  onClearFilters={clearFilters}
                  onMonthChange={changeMonth}
                  onOpen={setSelectedId}
                />
              )}
            </TabsContent>
            <TabsContent value="calendar">
              {entries.data && (
                <TransactionsCalendarPanel
                  data={data}
                  month={month}
                  selectedDate={selectedDate}
                  onDateChange={(date) => updateSearch({ date })}
                  onMonthChange={changeMonth}
                  onOpen={setSelectedId}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </section>

      <FamilyTransactionsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draft}
        onDraftChange={setDraft}
        members={detail.data?.members}
        onApply={() => {
          updateSearch(draft)
          setFilterOpen(false)
        }}
      />

      <Sheet
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[88svh] overflow-y-auto rounded-t-[2rem] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-2xl"
        >
          <SheetHeader className="px-0">
            <SheetTitle>{selectedEntry?.transaction_name}</SheetTitle>
            <SheetDescription>
              {selectedEntry?.transaction_date}・
              {selectedEntry?.payer.display_name ?? '家族共通'}・
              {selectedEntry?.sign === -1 ? '支出' : '収入'}{' '}
              {selectedEntry?.amount.toLocaleString('ja-JP')}円
            </SheetDescription>
          </SheetHeader>
          {selectedEntry && detail.isPending && <FamilyEntryDetailSkeleton />}
          {selectedEntry && detail.isError && (
            <ErrorState
              title="取引の詳細を表示できません"
              message="家族の情報を再読み込みしてください。"
              onRetry={() => void detail.refetch()}
            />
          )}
          {selectedEntry && detail.data && (
            <FamilyEntryDetail
              key={selectedEntry.entry_id}
              id={family.household_id}
              entry={selectedEntry}
              members={detail.data.members}
              payments={detail.data.payments}
              subcategories={detail.data.subcategories}
              returnTo={returnTo}
            />
          )}
        </SheetContent>
      </Sheet>

      {family.state === 'active' && (
        <Button
          asChild
          aria-label="新しい取引を追加"
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg md:right-8 md:bottom-6"
          size="icon-lg"
        >
          <Link to={`/app/family/new?${context}`} state={{ returnTo }}>
            <Plus aria-hidden="true" className="size-7" />
          </Link>
        </Button>
      )}
    </>
  )
}
