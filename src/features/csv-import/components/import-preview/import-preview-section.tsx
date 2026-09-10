import { AlertCircle, LoaderCircle, Upload } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'

import { type DuplicateCandidatesByRowId, type ImportRow } from '../../model/csv-import'
import type { Categories, CsvImportDispatch, Filter, Payments } from '../../types'
import { BulkTransactionEditDialog } from './bulk-transaction-edit-dialog'
import { PreviewTable } from './preview-table'

export function ImportPreviewSection({ categories, dispatch, duplicateCandidates, duplicateCount, errors, failedDuplicateCheckMonths, filter, filteredRows, importing, isCheckingDuplicates, onFilterChange, onSubmit, payments, previewRows, selected, selectedErrors }: {
  categories: Categories
  dispatch: CsvImportDispatch
  duplicateCandidates: DuplicateCandidatesByRowId
  duplicateCount: number
  errors: number
  failedDuplicateCheckMonths: string[]
  filter: Filter
  filteredRows: ImportRow[]
  importing: boolean
  isCheckingDuplicates: boolean
  onFilterChange: (filter: Filter) => void
  onSubmit: () => void
  payments: Payments
  previewRows: ImportRow[]
  selected: number
  selectedErrors: number
}) {
  return <section className="grid gap-5 border-t py-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">インポート内容を確認</h2><p className="text-sm text-muted-foreground">{selected} / {previewRows.length}件をインポート予定 ・ エラー {errors}件 ・ 重複候補 {duplicateCount}件</p></div><div className="flex flex-wrap gap-2">{([['all', 'すべて'], ['selected', '対象'], ['excluded', '対象外'], ['error', 'エラー']] as const).map(([value, label]) => <Button key={value} onClick={() => onFilterChange(value)} size="sm" variant={filter === value ? 'default' : 'outline'}>{label}</Button>)}</div></div>
    {isCheckingDuplicates ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />重複候補を確認しています...</p> : null}
    {failedDuplicateCheckMonths.length ? <Alert className="border-warning/40 bg-warning/10 text-warning"><AlertCircle aria-hidden="true" /><AlertTitle>一部の重複候補を確認できませんでした</AlertTitle><AlertDescription className="text-warning/90">{failedDuplicateCheckMonths.join('、')}の既存取引を取得できませんでした。未確認の状態でもインポートできます。</AlertDescription></Alert> : null}
    <div className="flex flex-wrap gap-2"><Button onClick={() => dispatch({ type: 'set-all', selected: true })} size="sm" variant="outline">全選択</Button><Button onClick={() => dispatch({ type: 'set-all', selected: false })} size="sm" variant="outline">全解除</Button><BulkTransactionEditDialog categories={categories} onApply={(rowIds, categoryId, subcategoryId, paymentId) => dispatch({ type: 'apply-bulk-edit', rowIds, categoryId, subcategoryId, paymentId, categories })} payments={payments} rows={previewRows} /></div>
    <PreviewTable categories={categories} dispatch={dispatch} duplicateCandidates={duplicateCandidates} payments={payments} rows={filteredRows} />
    <div className="flex justify-end"><Button disabled={!selected || selectedErrors > 0 || isCheckingDuplicates || importing} onClick={onSubmit}>{importing ? <><LoaderCircle className="animate-spin" />登録しています...</> : <><Upload />{selected}件をインポート</>}</Button></div>
  </section>
}
