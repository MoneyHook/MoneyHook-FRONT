import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'
import { addTransactionList, useGetFrequentTransactionNames } from '@/shared/api/generated/transaction/transaction'
import { clearPersistedQueryData } from '@/shared/lib/persisted-user-data'

import { MAX_COLUMNS, MAX_FILE_SIZE, MAX_ROWS, applyBulkEditToImportRows, createImportRows, inferHeaderRow, toTransactionList, validateImportRow, type DateFormat, type Encoding, type ImportSign, type Mapping } from '../model/csv-import'
import type { Categories, CsvImportAction, CsvImportState, Filter } from '../types'

const initialState: CsvImportState = { step: 'setup', file: null, rows: [], encoding: 'auto', headerRowIndex: null, mapping: { date: null, name: null, amount: null }, dateFormat: 'auto', defaults: { sign: 'expense' }, previewRows: [], parsedEncoding: null, error: null, importing: false, importedCount: 0 }

function reducer(state: CsvImportState, action: CsvImportAction): CsvImportState {
  if (action.type === 'patch') return { ...state, ...action.patch }
  if (action.type === 'set-all') return { ...state, previewRows: state.previewRows.map((row) => row.errors.length ? row : { ...row, selected: action.selected }) }
  if (action.type === 'apply-bulk-edit') return { ...state, previewRows: applyBulkEditToImportRows({ rows: state.previewRows, rowIds: action.rowIds, categoryId: action.categoryId, subcategoryId: action.subcategoryId, paymentId: action.paymentId, categories: action.categories }) }
  return { ...state, previewRows: state.previewRows.map((row) => {
    if (row.id !== action.id) return row
    const next = { ...row, ...action.patch }
    const errors = validateImportRow(next, action.categories)
    return { ...next, errors, selected: errors.length ? false : next.selected }
  }) }
}

function headersFor(state: CsvImportState) {
  const width = Math.max(0, ...state.rows.map((row) => row.length))
  const headerRow = state.headerRowIndex === null ? undefined : state.rows[state.headerRowIndex]
  return Array.from({ length: width }, (_, index) => headerRow?.[index] || `列${index + 1}`)
}

export function useCsvImportController() {
  const queryClient = useQueryClient()
  const categoriesQuery = useGetCategoryWithSubCategoryList()
  const paymentsQuery = useGetPaymentResources()
  const frequentTransactionsQuery = useGetFrequentTransactionNames()
  const categories = useMemo<Categories>(() => categoriesQuery.data?.status === 200 ? categoriesQuery.data.data.category_list ?? [] : [], [categoriesQuery.data])
  const payments = paymentsQuery.data?.status === 200 ? paymentsQuery.data.data.payment_list ?? [] : []
  const frequentTransactions = useMemo(() => frequentTransactionsQuery.data?.status === 200 ? frequentTransactionsQuery.data.data.transaction_list : [], [frequentTransactionsQuery.data])
  const [state, dispatch] = useReducer(reducer, initialState)
  const [filter, setFilter] = useState<Filter>('all')
  const workerRef = useRef<Worker | null>(null)
  const blocker = useBlocker(state.step !== 'complete' && !state.importing && Boolean(state.file))
  useBeforeUnload((event) => { if (state.step !== 'complete' && state.file) event.preventDefault() })
  useEffect(() => () => workerRef.current?.terminate(), [])

  const mutation = useMutation({ mutationFn: (request: ReturnType<typeof toTransactionList>) => addTransactionList(request), onSuccess: async () => { await queryClient.invalidateQueries(); clearPersistedQueryData(); dispatch({ type: 'patch', patch: { importing: false, step: 'complete', importedCount: state.previewRows.filter((row) => row.selected && !row.errors.length).length } }) }, onError: () => dispatch({ type: 'patch', patch: { importing: false, error: '取引を登録できませんでした。内容を確認して、もう一度お試しください。' } }) })
  const headers = useMemo(() => headersFor(state), [state])
  const dataRows = state.rows.filter((_, index) => state.headerRowIndex === null || index > state.headerRowIndex)
  const filteredRows = useMemo(() => state.previewRows.filter((row) => filter === 'all' || filter === 'selected' && row.selected || filter === 'excluded' && !row.selected && !row.errors.length || filter === 'error' && row.errors.length), [filter, state.previewRows])
  const selected = state.previewRows.filter((row) => row.selected).length
  const errors = state.previewRows.filter((row) => row.errors.length).length
  const selectedErrors = state.previewRows.filter((row) => row.selected && row.errors.length).length
  const canPreview = Boolean(dataRows.length <= MAX_ROWS && state.defaults.sign && state.mapping.date !== null && state.mapping.name !== null && state.mapping.amount !== null)

  const parseFile = useCallback((file: File, encoding: Encoding = state.encoding) => {
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
  }, [state.encoding])

  const submit = useCallback(() => {
    if (!selected || selectedErrors || state.importing || !state.defaults.sign) return
    dispatch({ type: 'patch', patch: { importing: true, error: null } })
    mutation.mutate(toTransactionList(state.previewRows, { sign: state.defaults.sign }))
  }, [mutation, selected, selectedErrors, state.defaults.sign, state.importing, state.previewRows])

  const changeHeaderRow = useCallback((headerRowIndex: number | null) => {
    const dataRowCount = state.rows.filter((_, index) => headerRowIndex === null || index > headerRowIndex).length
    dispatch({ type: 'patch', patch: { headerRowIndex, mapping: { date: null, name: null, amount: null }, previewRows: [], error: dataRowCount > MAX_ROWS ? 'データ行数は10,000行以下にしてください。' : null } })
  }, [state.rows])

  useEffect(() => {
    if (!state.rows.length || !canPreview || dataRows.length > MAX_ROWS) return
    const previewRows = createImportRows({ rows: state.rows, headerRowIndex: state.headerRowIndex, mapping: state.mapping, defaults: state.defaults, dateFormat: state.dateFormat, categories, frequentTransactions })
    dispatch({ type: 'patch', patch: { previewRows, error: null } })
  }, [canPreview, categories, dataRows.length, frequentTransactions, state.dateFormat, state.defaults, state.headerRowIndex, state.mapping, state.rows])

  return {
    blocker, canPreview, categories, changeDateFormat: (dateFormat: DateFormat) => dispatch({ type: 'patch', patch: { dateFormat } }),
    changeEncoding: (encoding: Encoding) => { dispatch({ type: 'patch', patch: { encoding } }); if (state.file) parseFile(state.file, encoding) },
    changeHeaderRow, changeMapping: (field: keyof Mapping, value: number | null) => dispatch({ type: 'patch', patch: { mapping: { ...state.mapping, [field]: value }, error: null } }),
    changeSign: (sign: ImportSign) => dispatch({ type: 'patch', patch: { defaults: { ...state.defaults, sign } } }), dispatch, errors, filter, filteredRows,
    headers, parseFile, payments, selected, selectedErrors, setFilter, state, submit,
    restart: () => dispatch({ type: 'patch', patch: initialState }),
  }
}
