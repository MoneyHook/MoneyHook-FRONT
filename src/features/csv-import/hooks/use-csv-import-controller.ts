import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

import {
  MAX_ROWS,
  createImportRows,
  duplicateCandidatesByRowId,
  toTransactionList,
  type DateFormat,
  type Encoding,
  type ImportSign,
  type Mapping,
} from '../model/csv-import'
import type { Filter } from '../types'

import { useCsvImportApi } from '../api/use-csv-import-api'
import { useCsvImportDuplicateCheck } from '../api/use-csv-import-duplicate-check'
import {
  csvImportReducer,
  headersFor,
  initialState,
} from '../model/csv-import-state'
import { useCsvFileParser } from './use-csv-file-parser'

export function useCsvImportController(onImported: () => Promise<void>) {
  const [state, dispatch] = useReducer(csvImportReducer, initialState)
  const [filter, setFilter] = useState<Filter>('all')
  const blocker = useBlocker(
    state.step !== 'complete' && !state.importing && Boolean(state.file),
  )
  useBeforeUnload((event) => {
    if (state.step !== 'complete' && state.file) event.preventDefault()
  })

  const { categories, payments, frequentTransactions, mutation } =
    useCsvImportApi({
      onImported,
      onSuccess: () =>
        dispatch({
          type: 'patch',
          patch: {
            importing: false,
            step: 'complete',
            importedCount: state.previewRows.filter(
              (row) => row.selected && !row.errors.length,
            ).length,
          },
        }),
      onError: () =>
        dispatch({
          type: 'patch',
          patch: {
            importing: false,
            error:
              '取引を登録できませんでした。内容を確認して、もう一度お試しください。',
          },
        }),
    })
  const duplicateCheck = useCsvImportDuplicateCheck(state.previewRows)
  const parseFile = useCsvFileParser(dispatch, state.encoding)
  const headers = useMemo(() => headersFor(state), [state])
  const dataRows = state.rows.filter(
    (_, index) => state.headerRowIndex === null || index > state.headerRowIndex,
  )
  const filteredRows = useMemo(
    () =>
      state.previewRows.filter(
        (row) =>
          filter === 'all' ||
          (filter === 'selected' && row.selected) ||
          (filter === 'excluded' && !row.selected && !row.errors.length) ||
          (filter === 'error' && row.errors.length),
      ),
    [filter, state.previewRows],
  )
  const selected = state.previewRows.filter((row) => row.selected).length
  const errors = state.previewRows.filter((row) => row.errors.length).length
  const selectedErrors = state.previewRows.filter(
    (row) => row.selected && row.errors.length,
  ).length
  const duplicateCandidates = useMemo(
    () =>
      duplicateCandidatesByRowId({
        rows: state.previewRows,
        sign: state.defaults.sign ?? 'expense',
        transactions: duplicateCheck.transactions,
      }),
    [duplicateCheck.transactions, state.defaults.sign, state.previewRows],
  )
  const canPreview = Boolean(
    dataRows.length <= MAX_ROWS &&
    state.defaults.sign &&
    state.mapping.date !== null &&
    state.mapping.name !== null &&
    state.mapping.amount !== null,
  )

  const submit = useCallback(() => {
    if (
      !selected ||
      selectedErrors ||
      duplicateCheck.isChecking ||
      state.importing ||
      !state.defaults.sign
    )
      return
    dispatch({ type: 'patch', patch: { importing: true, error: null } })
    mutation.mutate(
      toTransactionList(state.previewRows, { sign: state.defaults.sign }),
    )
  }, [
    duplicateCheck.isChecking,
    mutation,
    selected,
    selectedErrors,
    state.defaults.sign,
    state.importing,
    state.previewRows,
  ])

  const changeHeaderRow = useCallback(
    (headerRowIndex: number | null) => {
      const dataRowCount = state.rows.filter(
        (_, index) => headerRowIndex === null || index > headerRowIndex,
      ).length
      dispatch({
        type: 'patch',
        patch: {
          headerRowIndex,
          mapping: { date: null, name: null, amount: null },
          previewRows: [],
          error:
            dataRowCount > MAX_ROWS
              ? 'データ行数は10,000行以下にしてください。'
              : null,
        },
      })
    },
    [state.rows],
  )

  useEffect(() => {
    if (!state.rows.length || !canPreview || dataRows.length > MAX_ROWS) return
    const previewRows = createImportRows({
      rows: state.rows,
      headerRowIndex: state.headerRowIndex,
      mapping: state.mapping,
      defaults: state.defaults,
      dateFormat: state.dateFormat,
      categories,
      frequentTransactions,
    })
    dispatch({ type: 'patch', patch: { previewRows, error: null } })
  }, [
    canPreview,
    categories,
    dataRows.length,
    frequentTransactions,
    state.dateFormat,
    state.defaults,
    state.headerRowIndex,
    state.mapping,
    state.rows,
  ])

  return {
    blocker,
    canPreview,
    categories,
    changeDateFormat: (dateFormat: DateFormat) =>
      dispatch({ type: 'patch', patch: { dateFormat } }),
    changeEncoding: (encoding: Encoding) => {
      dispatch({ type: 'patch', patch: { encoding } })
      if (state.file) parseFile(state.file, encoding)
    },
    changeHeaderRow,
    changeMapping: (field: keyof Mapping, value: number | null) =>
      dispatch({
        type: 'patch',
        patch: { mapping: { ...state.mapping, [field]: value }, error: null },
      }),
    changeSign: (sign: ImportSign) =>
      dispatch({
        type: 'patch',
        patch: { defaults: { ...state.defaults, sign } },
      }),
    dispatch,
    duplicateCandidates,
    duplicateCount: duplicateCandidates.size,
    errors,
    failedDuplicateCheckMonths: duplicateCheck.failedMonths,
    filter,
    filteredRows,
    headers,
    isCheckingDuplicates: duplicateCheck.isChecking,
    parseFile,
    payments,
    selected,
    selectedErrors,
    setFilter,
    state,
    submit,
    restart: () => dispatch({ type: 'patch', patch: initialState }),
  }
}
