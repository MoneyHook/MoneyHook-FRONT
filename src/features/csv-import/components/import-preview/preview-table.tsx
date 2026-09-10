import { useCallback, useMemo, useRef, useState } from 'react'
import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CheckCircle2, Info, Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import type { TimelineTransaction } from '@/shared/api/generated/model/timelineTransaction'
import { cn } from '@/shared/lib/utils'

import { categorySubcategories } from '../category-utils'
import { SelectField } from '../form-fields'
import { type DuplicateCandidatesByRowId, type ImportRow } from '../../model/csv-import'
import type { Categories, CsvImportDispatch, Payments } from '../../types'

const previewTableFeatures = tableFeatures({})
const previewGridColumns = 'grid-cols-[40px_110px_minmax(160px,1fr)_110px_150px_150px_150px_84px]'

function formatAmount(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

function DuplicateCandidatesDialog({ candidates, row, onOpenChange, open }: {
  candidates: TimelineTransaction[]
  row: ImportRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>重複候補の取引</DialogTitle>
        <DialogDescription>{row ? `CSV ${row.sourceRowNumber}行目と同じ日付・金額・収支区分の登録済み取引です。` : ''}</DialogDescription>
      </DialogHeader>
      <div className="max-h-96 overflow-auto rounded-xl border">
        {candidates.map((candidate) => <div className="grid gap-1 border-b px-4 py-3 text-sm last:border-b-0" key={candidate.transaction_id}>
          <div className="flex items-center justify-between gap-3"><span className="font-medium">{candidate.transaction_name}</span><span className="tabular-nums">{formatAmount(candidate.transaction_amount)}</span></div>
          <p className="text-muted-foreground">{candidate.transaction_date} ・ {candidate.category_name} / {candidate.sub_category_name} ・ {candidate.payment_name ?? '支払い方法未設定'}</p>
        </div>)}
      </div>
      <div className="flex justify-end"><DialogClose asChild><Button type="button" variant="outline">閉じる</Button></DialogClose></div>
    </DialogContent>
  </Dialog>
}

export function PreviewTable({ rows, categories, duplicateCandidates, payments, dispatch }: { rows: ImportRow[]; categories: Categories; duplicateCandidates: DuplicateCandidatesByRowId; payments: Payments; dispatch: CsvImportDispatch }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [duplicateRowId, setDuplicateRowId] = useState<number | null>(null)
  const setRow = useCallback((id: number, patch: Partial<ImportRow>) => dispatch({ type: 'set-row', id, patch, categories }), [categories, dispatch])
  const columns = useMemo<ColumnDef<typeof previewTableFeatures, ImportRow, unknown>[]>(() => [
    { id: 'selected', header: '対象', cell: ({ row }) => <Checkbox aria-label={`${row.original.sourceRowNumber}行目をインポート`} checked={row.original.selected} disabled={row.original.errors.length > 0} onCheckedChange={(checked) => setRow(row.original.id, { selected: checked === true })} /> },
    { accessorKey: 'date', header: '日付', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="日付" value={row.original.date} onChange={(event) => setRow(row.original.id, { date: event.target.value })} /> : row.original.date || '不正' },
    { accessorKey: 'name', header: '取引名', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="取引名" value={row.original.name} onChange={(event) => setRow(row.original.id, { name: event.target.value })} /> : <span className="block truncate">{row.original.name || '（空欄）'}</span> },
    { accessorKey: 'amount', header: '金額', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="金額" value={row.original.amount} onChange={(event) => setRow(row.original.id, { amount: event.target.value })} /> : <span className="tabular-nums">{row.original.amount ? `¥${Number(row.original.amount).toLocaleString('ja-JP')}` : '不正'}</span> },
    { id: 'category', header: 'カテゴリ', cell: ({ row }) => editingId === row.original.id ? <SelectField aria-label="カテゴリ" value={row.original.categoryId} onValueChange={(value) => setRow(row.original.id, { categoryId: value, subcategoryId: '' })}><option value="">選択してください</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</SelectField> : categories.find((category) => category.category_id === row.original.categoryId)?.category_name ?? '未選択' },
    { id: 'subcategory', header: 'サブカテゴリ', cell: ({ row }) => { const subcategories = categorySubcategories(categories, row.original.categoryId); return editingId === row.original.id ? <SelectField aria-label="サブカテゴリ" value={row.original.subcategoryId} onValueChange={(value) => setRow(row.original.id, { subcategoryId: value })}><option value="">選択してください</option>{subcategories.map((subcategory) => <option key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</option>)}</SelectField> : subcategories.find((subcategory) => subcategory.sub_category_id === row.original.subcategoryId)?.sub_category_name ?? '未選択' } },
    { id: 'payment', header: '支払い方法', cell: ({ row }) => payments.find((payment) => payment.payment_id === row.original.paymentId)?.payment_name ?? '未選択' },
    { id: 'actions', header: '', cell: ({ row }) => <div className="flex items-center"><Button aria-label={`${row.original.sourceRowNumber}行目を編集`} onClick={() => setEditingId(editingId === row.original.id ? null : row.original.id)} size="icon" type="button" variant="ghost">{editingId === row.original.id ? <CheckCircle2 /> : <Pencil />}</Button>{duplicateCandidates.has(row.original.id) ? <Button aria-label={`${row.original.sourceRowNumber}行目の重複候補を確認`} onClick={() => setDuplicateRowId(row.original.id)} size="icon" type="button" variant="ghost"><Info /></Button> : null}</div> },
  ], [categories, duplicateCandidates, editingId, payments, setRow])
  const table = useTable({ columns, data: rows, features: previewTableFeatures, getRowId: (row) => String(row.id) })
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, getItemKey: (index) => tableRows[index].id, estimateSize: () => 56, overscan: 10 })

  const duplicateRow = duplicateRowId === null ? null : rows.find((row) => row.id === duplicateRowId) ?? null
  const candidates = duplicateRow ? duplicateCandidates.get(duplicateRow.id) ?? [] : []

  return <><div className="overflow-hidden rounded-xl border bg-card"><div ref={parentRef} className="max-h-128 overflow-auto"><div className="min-w-250">
    <div className={cn('sticky top-0 z-10 grid gap-2 border-b bg-muted/95 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur', previewGridColumns)}>{table.getHeaderGroups().map((group) => group.headers.map((header) => <span key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</span>))}</div>
    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualRow) => { const row = tableRows[virtualRow.index]; return <div key={row.id} className={cn('absolute left-0 top-0 grid w-full items-center gap-2 border-b px-3 py-2 text-sm', previewGridColumns, row.original.errors.length ? 'bg-destructive/5' : duplicateCandidates.has(row.original.id) && 'bg-warning/10')} data-index={virtualRow.index} ref={virtualizer.measureElement} style={{ transform: `translateY(${virtualRow.start}px)`, minHeight: virtualRow.size }}>{row.getAllCells().map((cell) => <div key={cell.id}><table.FlexRender cell={cell} /></div>)}{row.original.errors.length ? <p className="col-span-8 -mt-1 text-xs text-destructive">{row.original.sourceRowNumber}行目: {row.original.errors.map((error) => error.message).join(' ')}</p> : null}</div> })}</div>
  </div></div></div><DuplicateCandidatesDialog candidates={candidates} onOpenChange={(open) => { if (!open) setDuplicateRowId(null) }} open={Boolean(duplicateRow)} row={duplicateRow} /></>
}
