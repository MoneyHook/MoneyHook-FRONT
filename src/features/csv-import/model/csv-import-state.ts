import type { CsvImportAction, CsvImportState } from '../types'
import { applyBulkEditToImportRows, validateImportRow } from './csv-import'

export const initialState: CsvImportState = {
  step: 'setup',
  file: null,
  rows: [],
  encoding: 'auto',
  headerRowIndex: null,
  mapping: { date: null, name: null, amount: null },
  dateFormat: 'auto',
  defaults: { sign: 'expense' },
  previewRows: [],
  parsedEncoding: null,
  error: null,
  importing: false,
  importedCount: 0,
}

export function csvImportReducer(state: CsvImportState, action: CsvImportAction): CsvImportState {
  if (action.type === 'patch') return { ...state, ...action.patch }
  if (action.type === 'set-all')
    return {
      ...state,
      previewRows: state.previewRows.map((row) =>
        row.errors.length ? row : { ...row, selected: action.selected },
      ),
    }
  if (action.type === 'apply-bulk-edit')
    return {
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

export function headersFor(state: CsvImportState) {
  const width = Math.max(0, ...state.rows.map((row) => row.length))
  const headerRow = state.headerRowIndex === null ? undefined : state.rows[state.headerRowIndex]
  return Array.from({ length: width }, (_, index) => headerRow?.[index] || `列${index + 1}`)
}
