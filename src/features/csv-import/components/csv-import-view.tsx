import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, ArrowLeft, CheckCircle2, Ellipsis, FileUp, LoaderCircle, Pencil, Upload } from 'lucide-react'
import { Children, isValidElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker } from 'react-router-dom'

import { addTransactionList, useGetFrequentTransactionNames } from '@/shared/api/generated/transaction/transaction'
import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

import {
  MAX_COLUMNS,
  MAX_FILE_SIZE,
  MAX_ROWS,
  applyBulkEditToImportRows,
  createImportRows,
  displayColumnName,
  inferHeaderRow,
  type DateFormat,
  type Encoding,
  type ImportDefaults,
  type ImportRow,
  type Mapping,
  toTransactionList,
  validateImportRow,
} from '../model/csv-import'

type Step = 'setup' | 'mapping' | 'preview' | 'complete'
type Filter = 'all' | 'selected' | 'excluded' | 'error'
type State = {
  step: Step
  file: File | null
  rows: string[][]
  encoding: Encoding
  headerRowIndex: number | null
  mapping: Mapping
  dateFormat: DateFormat
  defaults: Partial<ImportDefaults>
  previewRows: ImportRow[]
  parsedEncoding: string | null
  error: string | null
  importing: boolean
  importedCount: number
}

const initialState: State = { step: 'setup', file: null, rows: [], encoding: 'auto', headerRowIndex: null, mapping: { date: null, name: null, amount: null }, dateFormat: 'auto', defaults: { sign: 'expense' }, previewRows: [], parsedEncoding: null, error: null, importing: false, importedCount: 0 }

type Action =
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'set-row'; id: number; patch: Partial<ImportRow>; categories: Categories }
  | { type: 'apply-bulk-edit'; rowIds: Set<number>; categoryId: string; subcategoryId: string; paymentId: string; categories: Categories }
  | { type: 'set-all'; selected: boolean }

type Categories = Array<{ category_id: string; category_name: string; sub_category_list?: Array<{ sub_category_id: string; sub_category_name: string; enable: boolean }> }>

const previewTableFeatures = tableFeatures({})
const previewGridColumns = 'grid-cols-[40px_110px_minmax(160px,1fr)_110px_150px_150px_150px_42px]'

function reducer(state: State, action: Action): State {
  if (action.type === 'patch') return { ...state, ...action.patch }
  if (action.type === 'set-all') return { ...state, previewRows: state.previewRows.map((row) => row.errors.length ? row : { ...row, selected: action.selected }) }
  if (action.type === 'apply-bulk-edit') return {
    ...state,
    previewRows: applyBulkEditToImportRows({
      rows: state.previewRows,
      rowIds: action.rowIds,
      categoryId: action.categoryId,
      subcategoryId: action.subcategoryId,
      paymentId: action.paymentId,
      categories: action.categories,
    }),
  }
  return {
    ...state,
    previewRows: state.previewRows.map((row) => {
      if (row.id !== action.id) return row
      const next = { ...row, ...action.patch }
      const errors = validateImportRow(next, action.categories)
      return { ...next, errors, selected: errors.length ? false : next.selected }
    }),
  }
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}</label>
}

function SelectField({
  'aria-label': ariaLabel,
  children,
  disabled,
  onValueChange,
  value,
}: {
  'aria-label'?: string
  children: React.ReactNode
  disabled?: boolean
  onValueChange: (value: string) => void
  value: string
}) {
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: React.ReactNode }>(child) || child.type !== 'option') return []
    return [{ label: child.props.children, value: String(child.props.value ?? '') }]
  })
  const placeholder = options.find((option) => option.value === '')?.label ?? '選択してください'

  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value}>
      <SelectTrigger aria-label={ariaLabel} className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.filter((option) => option.value).map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function categorySubcategories(categories: Categories, categoryId: string) {
  return categories.find((category) => category.category_id === categoryId)?.sub_category_list?.filter((subcategory) => subcategory.enable) ?? []
}

function headersFor(state: State) {
  const width = Math.max(0, ...state.rows.map((row) => row.length))
  const headerRow = state.headerRowIndex === null ? undefined : state.rows[state.headerRowIndex]
  return Array.from({ length: width }, (_, index) => headerRow?.[index] || `列${index + 1}`)
}

function RawCsvPreview({ headers, headerRowIndex, mapping, rows }: { headers: string[]; headerRowIndex: number | null; mapping: Mapping; rows: string[][] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const dataRows = useMemo(() => headerRowIndex === null ? rows : rows.slice(headerRowIndex + 1), [headerRowIndex, rows])
  const highlightedColumns = new Set([mapping.date, mapping.name, mapping.amount].filter((index): index is number => index !== null))
  const gridStyle = { gridTemplateColumns: `repeat(${Math.max(headers.length, 1)}, minmax(10rem, 1fr))` }
  const virtualizer = useVirtualizer({ count: dataRows.length, estimateSize: () => 36, getScrollElement: () => parentRef.current, overscan: 8 })

  return <div className="overflow-hidden rounded-xl border bg-card"><div ref={parentRef} className="max-h-72 overflow-auto"><div className="min-w-max">
    <div className="sticky top-0 z-10 grid border-b bg-muted/95 text-xs font-semibold text-muted-foreground backdrop-blur" style={gridStyle}>{headers.map((_, index) => <span className={cn('border-r px-3 py-2 last:border-r-0', highlightedColumns.has(index) && 'bg-primary/12 text-foreground')} key={index}>{displayColumnName(headers, index)}</span>)}</div>
    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualRow) => { const row = dataRows[virtualRow.index]; return <div className="absolute left-0 top-0 grid w-full border-b text-sm" data-index={virtualRow.index} key={virtualRow.key} ref={virtualizer.measureElement} style={{ ...gridStyle, transform: `translateY(${virtualRow.start}px)` }}>{headers.map((_, index) => <span className={cn('truncate border-r px-3 py-2 last:border-r-0', highlightedColumns.has(index) && 'bg-primary/8')} key={index}>{row[index] || '—'}</span>)}</div> })}</div>
  </div></div></div>
}

function PreviewTable({ rows, categories, payments, dispatch }: { rows: ImportRow[]; categories: Categories; payments: Array<{ payment_id: string; payment_name: string }>; dispatch: React.Dispatch<Action> }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const setRow = useCallback((id: number, patch: Partial<ImportRow>) => dispatch({ type: 'set-row', id, patch, categories }), [categories, dispatch])
  const columns = useMemo<ColumnDef<typeof previewTableFeatures, ImportRow, unknown>[]>(() => [
    { id: 'selected', header: '対象', cell: ({ row }) => <Checkbox aria-label={`${row.original.sourceRowNumber}行目をインポート`} checked={row.original.selected} disabled={row.original.errors.length > 0} onCheckedChange={(checked) => setRow(row.original.id, { selected: checked === true })} /> },
    { accessorKey: 'date', header: '日付', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="日付" value={row.original.date} onChange={(event) => setRow(row.original.id, { date: event.target.value })} /> : row.original.date || '不正' },
    { accessorKey: 'name', header: '取引名', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="取引名" value={row.original.name} onChange={(event) => setRow(row.original.id, { name: event.target.value })} /> : <span className="block truncate">{row.original.name || '（空欄）'}</span> },
    { accessorKey: 'amount', header: '金額', cell: ({ row }) => editingId === row.original.id ? <Input aria-label="金額" value={row.original.amount} onChange={(event) => setRow(row.original.id, { amount: event.target.value })} /> : <span className="tabular-nums">{row.original.amount ? `¥${Number(row.original.amount).toLocaleString('ja-JP')}` : '不正'}</span> },
    { id: 'category', header: 'カテゴリ', cell: ({ row }) => editingId === row.original.id ? <SelectField aria-label="カテゴリ" value={row.original.categoryId} onValueChange={(value) => setRow(row.original.id, { categoryId: value, subcategoryId: '' })}><option value="">選択してください</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</SelectField> : categories.find((category) => category.category_id === row.original.categoryId)?.category_name ?? '未選択' },
    { id: 'subcategory', header: 'サブカテゴリ', cell: ({ row }) => { const subcategories = categorySubcategories(categories, row.original.categoryId); return editingId === row.original.id ? <SelectField aria-label="サブカテゴリ" value={row.original.subcategoryId} onValueChange={(value) => setRow(row.original.id, { subcategoryId: value })}><option value="">選択してください</option>{subcategories.map((subcategory) => <option key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</option>)}</SelectField> : subcategories.find((subcategory) => subcategory.sub_category_id === row.original.subcategoryId)?.sub_category_name ?? '未選択' } },
    { id: 'payment', header: '支払い方法', cell: ({ row }) => payments.find((payment) => payment.payment_id === row.original.paymentId)?.payment_name ?? '未選択' },
    { id: 'actions', header: '', cell: ({ row }) => <Button aria-label={`${row.original.sourceRowNumber}行目を編集`} onClick={() => setEditingId(editingId === row.original.id ? null : row.original.id)} size="icon" type="button" variant="ghost">{editingId === row.original.id ? <CheckCircle2 /> : <Pencil />}</Button> },
  ], [categories, editingId, payments, setRow])
  const table = useTable({ columns, data: rows, features: previewTableFeatures, getRowId: (row) => String(row.id) })
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, getItemKey: (index) => tableRows[index].id, estimateSize: () => 56, overscan: 10 })

  return <div className="overflow-hidden rounded-xl border bg-card"><div ref={parentRef} className="max-h-[32rem] overflow-auto"><div className="min-w-[1000px]">
    <div className={cn('sticky top-0 z-10 grid gap-2 border-b bg-muted/95 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur', previewGridColumns)}>{table.getHeaderGroups().map((group) => group.headers.map((header) => <span key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</span>))}</div>
    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualRow) => { const row = tableRows[virtualRow.index]; return <div key={row.id} className={cn('absolute left-0 top-0 grid w-full items-center gap-2 border-b px-3 py-2 text-sm', previewGridColumns, row.original.errors.length && 'bg-destructive/5')} data-index={virtualRow.index} ref={virtualizer.measureElement} style={{ transform: `translateY(${virtualRow.start}px)`, minHeight: virtualRow.size }}>{row.getAllCells().map((cell) => <div key={cell.id}>{<table.FlexRender cell={cell} />}</div>)}{row.original.errors.length ? <p className="col-span-8 -mt-1 text-xs text-destructive">{row.original.sourceRowNumber}行目: {row.original.errors.map((error) => error.message).join(' ')}</p> : null}</div> })}</div>
  </div></div></div>
}

function BulkTransactionEditDialog({ categories, onApply, payments, rows }: {
  categories: Categories
  onApply: (rowIds: Set<number>, categoryId: string, subcategoryId: string, paymentId: string) => void
  payments: Array<{ payment_id: string; payment_name: string }>
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
  const columns = useMemo<ColumnDef<typeof previewTableFeatures, ImportRow, unknown>[]>(() => [
    { id: 'selected', header: () => <Checkbox aria-label="一括変更の対象を全選択" checked={rows.length > 0 && selectedIds.size === rows.length} onCheckedChange={(checked) => setSelectedIds(checked === true ? new Set(rows.map((row) => row.id)) : new Set())} />, cell: ({ row }) => <Checkbox aria-label={`${row.original.sourceRowNumber}行目を一括変更`} checked={selectedIds.has(row.original.id)} onCheckedChange={(checked) => toggleRow(row.original.id, checked === true)} /> },
    { id: 'sourceRowNumber', header: '行', cell: ({ row }) => row.original.sourceRowNumber },
    { accessorKey: 'name', header: '取引名', cell: ({ row }) => <span className="block truncate">{row.original.name || '（空欄）'}</span> },
    { id: 'category', header: 'カテゴリ', cell: ({ row }) => categories.find((category) => category.category_id === row.original.categoryId)?.category_name ?? '未選択' },
    { id: 'subcategory', header: 'サブカテゴリ', cell: ({ row }) => categorySubcategories(categories, row.original.categoryId).find((subcategory) => subcategory.sub_category_id === row.original.subcategoryId)?.sub_category_name ?? '未選択' },
    { id: 'payment', header: '支払い方法', cell: ({ row }) => payments.find((payment) => payment.payment_id === row.original.paymentId)?.payment_name ?? '未選択' },
  ], [categories, payments, rows, selectedIds, toggleRow])
  const table = useTable({ columns, data: rows, features: previewTableFeatures, getRowId: (row) => String(row.id) })
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, getItemKey: (index) => tableRows[index].id, estimateSize: () => 44, overscan: 10 })
  const gridColumns = 'grid-cols-[40px_64px_minmax(160px,1fr)_140px_140px_140px]'
  const canApply = selectedIds.size > 0 && (Boolean(paymentId) || Boolean(categoryId) && Boolean(subcategoryId))

  return <Dialog onOpenChange={setOpen} open={open}>
    <Button onClick={() => setOpen(true)} type="button" variant="outline">取引情報を一括変更</Button>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>取引情報を一括変更</DialogTitle>
        <DialogDescription>変更する取引を選び、カテゴリまたは支払い方法を指定してください。</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="カテゴリ"><SelectField aria-label="一括変更するカテゴリ" value={categoryId} onValueChange={(value) => { setCategoryId(value); setSubcategoryId('') }}><option value="">変更しない</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</SelectField></Field>
        <Field label="サブカテゴリ"><SelectField aria-label="一括変更するサブカテゴリ" disabled={!categoryId} value={subcategoryId} onValueChange={setSubcategoryId}><option value="">変更しない</option>{subcategories.map((subcategory) => <option key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</option>)}</SelectField></Field>
        {payments.length > 0 ? <Field label="支払い方法"><SelectField aria-label="一括変更する支払い方法" value={paymentId} onValueChange={setPaymentId}><option value="">変更しない</option>{payments.map((payment) => <option key={payment.payment_id} value={payment.payment_id}>{payment.payment_name}</option>)}</SelectField></Field> : null}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card"><div ref={parentRef} className="max-h-80 overflow-auto"><div className="min-w-[760px]">
        <div className={cn('sticky top-0 z-10 grid items-center gap-2 border-b bg-muted/95 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur', gridColumns)}>{table.getHeaderGroups().map((group) => group.headers.map((header) => <span key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</span>))}</div>
        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualRow) => { const row = tableRows[virtualRow.index]; return <div className={cn('absolute left-0 top-0 grid w-full items-center gap-2 border-b px-3 py-2 text-sm', gridColumns)} data-index={virtualRow.index} key={row.id} ref={virtualizer.measureElement} style={{ transform: `translateY(${virtualRow.start}px)`, minHeight: virtualRow.size }}>{row.getAllCells().map((cell) => <div key={cell.id}><table.FlexRender cell={cell} /></div>)}</div> })}</div>
      </div></div></div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><DialogClose asChild><Button type="button" variant="outline">キャンセル</Button></DialogClose><Button disabled={!canApply} onClick={() => { onApply(selectedIds, categoryId, subcategoryId, paymentId); setOpen(false) }} type="button">{selectedIds.size}件に適用</Button></div>
    </DialogContent>
  </Dialog>
}

export function CsvImportView() {
  const queryClient = useQueryClient()
  const categoriesQuery = useGetCategoryWithSubCategoryList()
  const paymentsQuery = useGetPaymentResources()
  const frequentTransactionsQuery = useGetFrequentTransactionNames()
  const categories = useMemo<Categories>(() => categoriesQuery.data?.status === 200 ? categoriesQuery.data.data.category_list ?? [] : [], [categoriesQuery.data])
  const payments = paymentsQuery.data?.status === 200 ? paymentsQuery.data.data.payment_list ?? [] : []
  const frequentTransactions = useMemo(
    () => frequentTransactionsQuery.data?.status === 200 ? frequentTransactionsQuery.data.data.transaction_list : [],
    [frequentTransactionsQuery.data],
  )
  const [state, dispatch] = useReducer(reducer, initialState)
  const [filter, setFilter] = useState<Filter>('all')
  const workerRef = useRef<Worker | null>(null)
  const blocker = useBlocker(state.step !== 'complete' && !state.importing && Boolean(state.file))
  useBeforeUnload((event) => { if (state.step !== 'complete' && state.file) event.preventDefault() })
  useEffect(() => () => workerRef.current?.terminate(), [])

  const mutation = useMutation({ mutationFn: (request: ReturnType<typeof toTransactionList>) => addTransactionList(request), onSuccess: async () => { await queryClient.invalidateQueries(); dispatch({ type: 'patch', patch: { importing: false, step: 'complete', importedCount: state.previewRows.filter((row) => row.selected && !row.errors.length).length } }) }, onError: () => dispatch({ type: 'patch', patch: { importing: false, error: '取引を登録できませんでした。内容を確認して、もう一度お試しください。' } }) })
  const headers = useMemo(() => headersFor(state), [state])
  const dataRows = state.rows.filter((_, index) => state.headerRowIndex === null || index > state.headerRowIndex)
  const filteredRows = useMemo(() => state.previewRows.filter((row) => filter === 'all' || filter === 'selected' && row.selected || filter === 'excluded' && !row.selected && !row.errors.length || filter === 'error' && row.errors.length), [filter, state.previewRows])
  const selected = state.previewRows.filter((row) => row.selected).length
  const errors = state.previewRows.filter((row) => row.errors.length).length
  const selectedErrors = state.previewRows.filter((row) => row.selected && row.errors.length).length
  const defaults = state.defaults

  const parseFile = (file: File, encoding: Encoding = state.encoding) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return dispatch({ type: 'patch', patch: { error: 'CSVファイルを選択してください。' } })
    if (file.size > MAX_FILE_SIZE) return dispatch({ type: 'patch', patch: { error: 'ファイルサイズは5MB以下にしてください。' } })
    dispatch({ type: 'patch', patch: { file, error: null, importing: true, rows: [], previewRows: [], headerRowIndex: null, mapping: { date: null, name: null, amount: null } } })
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../csv-parser.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<{ rows?: string[][]; encoding?: string; error?: string }>) => {
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      if (event.data.error || !event.data.rows) return dispatch({ type: 'patch', patch: { importing: false, error: event.data.error ?? 'CSVを解析できませんでした。' } })
      const rows = event.data.rows
      if (Math.max(0, ...rows.map((row) => row.length)) > MAX_COLUMNS) return dispatch({ type: 'patch', patch: { importing: false, error: 'CSVの列数は100列以下にしてください。' } })
      const headerRowIndex = inferHeaderRow(rows)
      const dataRowCount = rows.filter((_, index) => headerRowIndex === null || index > headerRowIndex).length
      dispatch({ type: 'patch', patch: { importing: false, rows, parsedEncoding: event.data.encoding ?? null, headerRowIndex, mapping: { date: null, name: null, amount: null }, error: dataRowCount > MAX_ROWS ? 'データ行数は10,000行以下にしてください。' : null } })
    }
    worker.onerror = (event) => {
      event.preventDefault()
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      dispatch({ type: 'patch', patch: { importing: false, error: 'CSV解析用の処理を読み込めませんでした。画面を再読み込みして、もう一度お試しください。' } })
    }
    worker.onmessageerror = () => {
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      dispatch({ type: 'patch', patch: { importing: false, error: 'CSVデータを読み込めませんでした。もう一度ファイルを選択してください。' } })
    }
    worker.postMessage({ file, encoding })
  }
  const submit = () => {
    if (!selected || selectedErrors || state.importing || !state.defaults.sign) return
    dispatch({ type: 'patch', patch: { importing: true, error: null } })
    mutation.mutate(toTransactionList(state.previewRows, { sign: state.defaults.sign }))
  }
  const canPreview = Boolean(dataRows.length <= MAX_ROWS && state.defaults.sign && state.mapping.date !== null && state.mapping.name !== null && state.mapping.amount !== null)

  useEffect(() => {
    if (!state.rows.length || !canPreview || dataRows.length > MAX_ROWS) return
    const rows = createImportRows({ rows: state.rows, headerRowIndex: state.headerRowIndex, mapping: state.mapping, defaults, dateFormat: state.dateFormat, categories, frequentTransactions })
    dispatch({ type: 'patch', patch: { previewRows: rows, error: null } })
  }, [canPreview, categories, dataRows.length, defaults, frequentTransactions, state.dateFormat, state.headerRowIndex, state.mapping, state.rows])

  if (state.step === 'complete') return <main className="motion-route-enter mx-auto w-full max-w-3xl px-5 pb-24 pt-8 md:px-10 md:pt-12"><div className="mx-auto max-w-md py-16 text-center"><CheckCircle2 className="mx-auto size-12 text-primary" /><h1 className="mt-5 text-2xl font-semibold">インポートが完了しました</h1><p className="mt-2 text-muted-foreground">{state.importedCount}件の取引を追加しました。</p><div className="mt-8 flex justify-center gap-3"><Button asChild variant="outline"><Link to="/app/transactions">取引一覧を見る</Link></Button><Button onClick={() => dispatch({ type: 'patch', patch: initialState })}>別のCSVをインポート</Button></div></div></main>

  return <main className="motion-route-enter mx-auto w-full max-w-6xl px-5 pb-24 pt-8 md:px-10 md:pt-12">
    <header className="border-b pb-6">
      <Button asChild className="-ml-2 mb-4" variant="ghost"><Link to="/app/settings"><ArrowLeft />設定へ戻る</Link></Button>
      <h1 className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">CSV取引インポート</h1>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground md:text-base">CSVの列を指定し、読み込む取引をその場で確認・編集します。</p>
    </header>
    {state.error ? <Alert className="mt-6" variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>CSVを処理できませんでした</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert> : null}
    <section className="grid gap-5 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid self-start gap-5">
        <div className="grid gap-4 rounded-2xl border bg-card p-5">
          <div aria-label="取引種別" className="grid grid-cols-2 rounded-2xl bg-muted p-0.5 sm:p-1.5" role="tablist">
            {([
              { sign: 'expense' as const, label: '支出' },
              { sign: 'income' as const, label: '収入' },
            ]).map((item) => {
              const isSelected = state.defaults.sign === item.sign
              return <button
                aria-selected={isSelected}
                className={cn(
                  'min-h-10 rounded-xl px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-12 sm:px-4 sm:text-base',
                  isSelected
                    ? item.sign === 'expense'
                      ? 'bg-card text-expense shadow-sm'
                      : 'bg-card text-income shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={item.sign}
                onClick={() => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, sign: item.sign } } })}
                role="tab"
                type="button"
              >{item.label}</button>
            })}
          </div>
        </div>
        <label className="grid min-h-36 cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-muted/20 p-5 text-center transition-colors hover:bg-muted/45" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !state.importing) parseFile(file) }}><input accept=".csv,text/csv" className="sr-only" disabled={state.importing} onChange={(event) => { const file = event.target.files?.[0]; if (file) parseFile(file) }} type="file" /><span><FileUp className="mx-auto size-7 text-muted-foreground" /><span className="mt-2 block font-medium">{state.file ? '別のCSVを選択' : 'CSVをドラッグ&ドロップ'}</span><span className="mt-1 block text-sm text-muted-foreground">またはファイルを選択（5MBまで）</span></span></label>
        {state.importing ? <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />CSVを解析しています...</p> : null}
      </div>
      {state.rows.length ? <aside className="grid content-start gap-4 rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">列の指定</h2><p className="mt-1 text-sm text-muted-foreground">{state.file?.name}・{state.parsedEncoding?.toUpperCase()}として解析</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button aria-label="解析オプションを開く" size="icon" variant="ghost"><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72 p-3"><DropdownMenuLabel>解析オプション</DropdownMenuLabel><DropdownMenuSeparator /><div className="grid gap-3 px-1 py-2"><Field label="文字コード"><SelectField value={state.encoding} onValueChange={(value) => { const encoding = value as Encoding; dispatch({ type: 'patch', patch: { encoding } }); if (state.file) parseFile(state.file, encoding) }}><option value="auto">自動</option><option value="utf-8">UTF-8</option><option value="shift-jis">Shift_JIS</option></SelectField></Field><Field label="日付形式"><SelectField value={state.dateFormat} onValueChange={(value) => dispatch({ type: 'patch', patch: { dateFormat: value as DateFormat } })}><option value="auto">自動判定</option><option value="yyyy/mm/dd">YYYY/MM/DD</option><option value="yyyy-mm-dd">YYYY-MM-DD</option><option value="yyyymmdd">YYYYMMDD</option><option value="japanese">YYYY年M月D日</option></SelectField></Field></div></DropdownMenuContent></DropdownMenu></div>
        <Field label="ヘッダー行"><SelectField value={state.headerRowIndex === null ? 'none' : String(state.headerRowIndex)} onValueChange={(value) => { const headerRowIndex = value === 'none' ? null : Number(value); const dataRowCount = state.rows.filter((_, index) => headerRowIndex === null || index > headerRowIndex).length; dispatch({ type: 'patch', patch: { headerRowIndex, mapping: { date: null, name: null, amount: null }, previewRows: [], error: dataRowCount > MAX_ROWS ? 'データ行数は10,000行以下にしてください。' : null } }) }}><option value="none">ヘッダーなし</option>{state.rows.slice(0, 20).map((_, index) => <option key={index} value={index}>{index + 1}行目</option>)}</SelectField></Field>
        {(['date', 'name', 'amount'] as const).map((field) => <Field key={field} label={{ date: '日付', name: '取引名', amount: '金額' }[field]}><SelectField value={state.mapping[field] === null ? '' : String(state.mapping[field])} onValueChange={(value) => dispatch({ type: 'patch', patch: { mapping: { ...state.mapping, [field]: value === '' ? null : Number(value) }, error: null } })}><option value="">選択してください</option>{headers.map((_, index) => <option key={index} value={index}>{displayColumnName(headers, index)}</option>)}</SelectField></Field>)}
      </aside> : null}
    </section>
    {state.rows.length ? <section className="grid gap-3 border-t py-8"><div><h2 className="text-lg font-semibold">CSVプレビュー</h2><p className="text-sm text-muted-foreground">選択した列を強調表示しています。</p></div><RawCsvPreview headerRowIndex={state.headerRowIndex} headers={headers} mapping={state.mapping} rows={state.rows} /></section> : null}
    {state.rows.length && canPreview ? <section className="grid gap-5 border-t py-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">インポート内容を確認</h2><p className="text-sm text-muted-foreground">{selected} / {state.previewRows.length}件をインポート予定 ・ エラー {errors}件</p></div><div className="flex flex-wrap gap-2">{([['all', 'すべて'], ['selected', '対象'], ['excluded', '対象外'], ['error', 'エラー']] as const).map(([value, label]) => <Button key={value} onClick={() => setFilter(value)} size="sm" variant={filter === value ? 'default' : 'outline'}>{label}</Button>)}</div></div><div className="flex flex-wrap gap-2"><Button onClick={() => dispatch({ type: 'set-all', selected: true })} size="sm" variant="outline">全選択</Button><Button onClick={() => dispatch({ type: 'set-all', selected: false })} size="sm" variant="outline">全解除</Button><BulkTransactionEditDialog categories={categories} onApply={(rowIds, categoryId, subcategoryId, paymentId) => dispatch({ type: 'apply-bulk-edit', rowIds, categoryId, subcategoryId, paymentId, categories })} payments={payments} rows={state.previewRows} /></div><PreviewTable categories={categories} dispatch={dispatch} payments={payments} rows={filteredRows} /><div className="flex justify-end"><Button disabled={!selected || selectedErrors > 0 || state.importing} onClick={submit}>{state.importing ? <><LoaderCircle className="animate-spin" />登録しています...</> : <><Upload />{selected}件をインポート</>}</Button></div></section> : null}
    {state.rows.length && !canPreview ? <p className="border-t py-6 text-sm text-muted-foreground">取引種別と日付・取引名・金額の列をすべて指定すると、インポート内容を表示します。</p> : null}
    <AlertDialog onOpenChange={(open) => !open && blocker.reset?.()} open={blocker.state === 'blocked'}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>インポート作業を破棄しますか？</AlertDialogTitle><AlertDialogDescription>読み込んだCSVと編集内容は保存されません。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>編集を続ける</AlertDialogCancel><AlertDialogAction onClick={() => blocker.proceed?.()}>破棄して離れる</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>

  /*
  return <main className="motion-route-enter mx-auto w-full max-w-6xl px-5 pb-24 pt-8 md:px-10 md:pt-12"><header className="border-b pb-6"><Button asChild className="-ml-2 mb-4" variant="ghost"><Link to="/app/settings"><ArrowLeft />設定へ戻る</Link></Button><h1 className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">CSV取引インポート</h1><p className="mt-1.5 text-sm leading-6 text-muted-foreground md:text-base">CSVを確認してから、選択した取引だけをまとめて登録します。</p><div className="mt-7 max-w-xl"><Stepper step={state.step} /></div></header>
    {state.error ? <Alert className="mt-6" variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>CSVを処理できませんでした</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert> : null}
    {state.step === 'setup' ? <section className="mx-auto grid max-w-2xl gap-5 py-8"><div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"><Field label="支払い方法"><SelectField value={state.defaults.paymentId ?? ''} onValueChange={(value) => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, paymentId: value } } })}><option value="">選択してください</option>{payments.map((payment) => <option key={payment.payment_id} value={payment.payment_id}>{payment.payment_name}</option>)}</SelectField></Field><Field label="取引種別"><SelectField value={state.defaults.sign ?? ''} onValueChange={(value) => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, sign: value as ImportSign } } })}><option value="">選択してください</option><option value="expense">支出</option><option value="income">収入</option></SelectField></Field><Field label="カテゴリ"><SelectField value={state.defaults.categoryId ?? ''} onValueChange={(value) => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, categoryId: value, subcategoryId: '' } } })}><option value="">選択してください</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</SelectField></Field><Field label="サブカテゴリ"><SelectField disabled={!state.defaults.categoryId} value={state.defaults.subcategoryId ?? ''} onValueChange={(value) => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, subcategoryId: value } } })}><option value="">選択してください</option>{categorySubcategories(categories, state.defaults.categoryId ?? '').map((subcategory) => <option key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</option>)}</SelectField></Field></div>
      <label className="grid min-h-44 cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/45" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !state.importing) parseFile(file) }}><input accept=".csv,text/csv" className="sr-only" disabled={state.importing} onChange={(event) => { const file = event.target.files?.[0]; if (file) parseFile(file) }} type="file" /><span><FileUp className="mx-auto size-8 text-muted-foreground" /><span className="mt-3 block font-medium">CSVをドラッグ&ドロップ</span><span className="mt-1 block text-sm text-muted-foreground">またはファイルを選択（5MBまで）</span></span></label>
      {state.importing ? <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />CSVを解析しています...</p> : null}
      <Button className="justify-self-end" disabled={!state.defaults.paymentId || !state.defaults.sign || !state.defaults.categoryId || !state.defaults.subcategoryId || state.importing} onClick={() => state.file ? parseFile(state.file) : dispatch({ type: 'patch', patch: { error: 'CSVファイルを選択してください。' } })}>次へ</Button>
    </section> : null}
    {state.step === 'mapping' ? <section className="mx-auto grid max-w-3xl gap-5 py-8"><div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{state.file?.name} {state.parsedEncoding ? `・${state.parsedEncoding.toUpperCase()}として解析` : ''}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="文字コード"><SelectField value={state.encoding} onValueChange={(value) => { const encoding = value as Encoding; dispatch({ type: 'patch', patch: { encoding } }); if (state.file) parseFile(state.file, encoding) }}><option value="auto">自動</option><option value="utf-8">UTF-8</option><option value="shift-jis">Shift_JIS</option></SelectField></Field><Field label="ヘッダー行"><SelectField value={state.headerRowIndex === null ? 'none' : String(state.headerRowIndex)} onValueChange={(value) => dispatch({ type: 'patch', patch: { headerRowIndex: value === 'none' ? null : Number(value), mapping: { date: null, name: null, amount: null }, error: null } })}><option value="none">ヘッダーなし</option>{state.rows.slice(0, 20).map((_, index) => <option key={index} value={index}>{index + 1}行目</option>)}</SelectField></Field><Field label="日付形式"><SelectField value={state.dateFormat} onValueChange={(value) => dispatch({ type: 'patch', patch: { dateFormat: value as DateFormat } })}><option value="auto">自動判定</option><option value="yyyy/mm/dd">YYYY/MM/DD</option><option value="yyyy-mm-dd">YYYY-MM-DD</option><option value="yyyymmdd">YYYYMMDD</option><option value="japanese">YYYY年M月D日</option></SelectField></Field></div></div>
      <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">CSV列を指定</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">{(['date', 'name', 'amount'] as const).map((field) => <Field key={field} label={{ date: '日付', name: '取引名', amount: '金額' }[field]}><SelectField value={state.mapping[field] === null ? '' : String(state.mapping[field])} onValueChange={(value) => dispatch({ type: 'patch', patch: { mapping: { ...state.mapping, [field]: value === '' ? null : Number(value) }, error: null } })}><option value="">選択してください</option>{headers.map((_, index) => <option key={index} value={index}>{displayColumnName(headers, index)}</option>)}</SelectField></Field>)}</div></div><div className="flex justify-between"><Button onClick={() => dispatch({ type: 'patch', patch: { step: 'setup', error: null } })} variant="outline">戻る</Button><Button onClick={makePreview}>プレビューへ</Button></div></section> : null}
    {state.step === 'preview' ? <section className="py-8"><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">インポート内容を確認</h2><p className="text-sm text-muted-foreground">{selected} / {state.previewRows.length}件をインポート予定 ・ エラー {errors}件</p></div><div className="flex flex-wrap gap-2">{([['all', 'すべて'], ['selected', '対象'], ['excluded', '対象外'], ['error', 'エラー']] as const).map(([value, label]) => <Button key={value} onClick={() => setFilter(value)} size="sm" variant={filter === value ? 'default' : 'outline'}>{label}</Button>)}</div></div><div className="mb-3 flex gap-2"><Button onClick={() => dispatch({ type: 'set-all', selected: true })} size="sm" variant="outline">全選択</Button><Button onClick={() => dispatch({ type: 'set-all', selected: false })} size="sm" variant="outline">全解除</Button></div><PreviewTable categories={categories} dispatch={dispatch} rows={filteredRows} /><div className="mt-6 flex justify-between"><Button disabled={state.importing} onClick={() => dispatch({ type: 'patch', patch: { step: 'mapping', error: null } })} variant="outline">戻る</Button><Button disabled={!selected || errors > 0 || state.importing} onClick={submit}>{state.importing ? <><LoaderCircle className="animate-spin" />登録しています...</> : <><Upload />{selected}件をインポート</>}</Button></div></section> : null}
  </main>
  */
}
