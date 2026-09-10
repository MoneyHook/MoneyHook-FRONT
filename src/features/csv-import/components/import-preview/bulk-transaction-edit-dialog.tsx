import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

import { categorySubcategories } from '../category-utils'
import { Field, SelectField } from '../form-fields'
import { type ImportRow } from '../../model/csv-import'
import type { Categories, Payments } from '../../types'

const tableFeaturesForBulkEdit = tableFeatures({})

export function BulkTransactionEditDialog({ categories, onApply, payments, rows }: {
  categories: Categories
  onApply: (rowIds: Set<number>, categoryId: string, subcategoryId: string, paymentId: string) => void
  payments: Payments
  rows: ImportRow[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const parentRef = useRef<HTMLDivElement>(null)
  const subcategories = categorySubcategories(categories, categoryId)

  useEffect(() => {
    if (!open) return
    setSelectedIds(new Set(rows.map((row) => row.id)))
    setCategoryId('')
    setSubcategoryId('')
    setPaymentId('')
  }, [open, rows])

  const toggleRow = useCallback((id: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])
  const columns = useMemo<ColumnDef<typeof tableFeaturesForBulkEdit, ImportRow, unknown>[]>(() => [
    { id: 'selected', header: () => <Checkbox aria-label="一括変更の対象を全選択" checked={rows.length > 0 && selectedIds.size === rows.length} onCheckedChange={(checked) => setSelectedIds(checked === true ? new Set(rows.map((row) => row.id)) : new Set())} />, cell: ({ row }) => <Checkbox aria-label={`${row.original.sourceRowNumber}行目を一括変更`} checked={selectedIds.has(row.original.id)} onCheckedChange={(checked) => toggleRow(row.original.id, checked === true)} /> },
    { id: 'sourceRowNumber', header: '行', cell: ({ row }) => row.original.sourceRowNumber },
    { accessorKey: 'name', header: '取引名', cell: ({ row }) => <span className="block truncate">{row.original.name || '（空欄）'}</span> },
    { id: 'category', header: 'カテゴリ', cell: ({ row }) => categories.find((category) => category.category_id === row.original.categoryId)?.category_name ?? '未選択' },
    { id: 'subcategory', header: 'サブカテゴリ', cell: ({ row }) => categorySubcategories(categories, row.original.categoryId).find((subcategory) => subcategory.sub_category_id === row.original.subcategoryId)?.sub_category_name ?? '未選択' },
    { id: 'payment', header: '支払い方法', cell: ({ row }) => payments.find((payment) => payment.payment_id === row.original.paymentId)?.payment_name ?? '未選択' },
  ], [categories, payments, rows, selectedIds, toggleRow])
  const table = useTable({ columns, data: rows, features: tableFeaturesForBulkEdit, getRowId: (row) => String(row.id) })
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, getItemKey: (index) => tableRows[index].id, estimateSize: () => 44, overscan: 10 })
  const gridColumns = 'grid-cols-[40px_64px_minmax(160px,1fr)_140px_140px_140px]'
  const canApply = selectedIds.size > 0 && (Boolean(paymentId) || Boolean(categoryId) && Boolean(subcategoryId))

  return <Dialog onOpenChange={setOpen} open={open}>
    <Button onClick={() => setOpen(true)} type="button" variant="outline">取引情報を一括変更</Button>
    <DialogContent className="max-w-4xl">
      <DialogHeader><DialogTitle>取引情報を一括変更</DialogTitle><DialogDescription>変更する取引を選び、カテゴリまたは支払い方法を指定してください。</DialogDescription></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="カテゴリ"><SelectField aria-label="一括変更するカテゴリ" value={categoryId} onValueChange={(value) => { setCategoryId(value); setSubcategoryId('') }}><option value="">変更しない</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</SelectField></Field>
        <Field label="サブカテゴリ"><SelectField aria-label="一括変更するサブカテゴリ" disabled={!categoryId} value={subcategoryId} onValueChange={setSubcategoryId}><option value="">変更しない</option>{subcategories.map((subcategory) => <option key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</option>)}</SelectField></Field>
        {payments.length > 0 ? <Field label="支払い方法"><SelectField aria-label="一括変更する支払い方法" value={paymentId} onValueChange={setPaymentId}><option value="">変更しない</option>{payments.map((payment) => <option key={payment.payment_id} value={payment.payment_id}>{payment.payment_name}</option>)}</SelectField></Field> : null}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card"><div ref={parentRef} className="max-h-80 overflow-auto"><div className="min-w-190">
        <div className={cn('sticky top-0 z-10 grid items-center gap-2 border-b bg-muted/95 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur', gridColumns)}>{table.getHeaderGroups().map((group) => group.headers.map((header) => <span key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</span>))}</div>
        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualRow) => { const row = tableRows[virtualRow.index]; return <div className={cn('absolute left-0 top-0 grid w-full items-center gap-2 border-b px-3 py-2 text-sm', gridColumns)} data-index={virtualRow.index} key={row.id} ref={virtualizer.measureElement} style={{ transform: `translateY(${virtualRow.start}px)`, minHeight: virtualRow.size }}>{row.getAllCells().map((cell) => <div key={cell.id}><table.FlexRender cell={cell} /></div>)}</div> })}</div>
      </div></div></div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><DialogClose asChild><Button type="button" variant="outline">キャンセル</Button></DialogClose><Button disabled={!canApply} onClick={() => { onApply(selectedIds, categoryId, subcategoryId, paymentId); setOpen(false) }} type="button">{selectedIds.size}件に適用</Button></div>
    </DialogContent>
  </Dialog>
}
