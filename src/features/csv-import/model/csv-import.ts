import type { TransactionListWriteRequest } from '@/shared/api/generated/model/transactionListWriteRequest'
import type { FrequentTransactionResponseTransactionListItem } from '@/shared/api/generated/model/frequentTransactionResponseTransactionListItem'

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_COLUMNS = 100
export const MAX_ROWS = 10_000

export type Encoding = 'auto' | 'utf-8' | 'shift-jis'
export type DateFormat = 'auto' | 'yyyy/mm/dd' | 'yyyy-mm-dd' | 'yyyymmdd' | 'japanese'
export type ImportSign = 'expense' | 'income'
export type Mapping = { date: number | null; name: number | null; amount: number | null }
export type ImportRowError = { field: 'date' | 'name' | 'amount' | 'category' | 'subcategory'; message: string }

export type ImportRow = {
  id: number
  sourceRowNumber: number
  source: string[]
  date: string
  name: string
  amount: string
  categoryId: string
  subcategoryId: string
  selected: boolean
  errors: ImportRowError[]
}

export type ImportDefaults = {
  categoryId: string
  subcategoryId: string
  paymentId: string
  sign: ImportSign
}

export function isBlankCsvRow(row: string[]) {
  return row.every((value) => !value.trim())
}

export function displayColumnName(headers: string[], index: number) {
  const value = headers[index] || `列${index + 1}`
  return headers.filter((header) => header === value).length > 1 ? `${value}（${index + 1}列目）` : value
}

export function inferHeaderRow(rows: string[][]) {
  const candidates = rows.slice(0, 20)
  const match = candidates.findIndex((row, index) => {
    if (row.length < 2 || isBlankCsvRow(row)) return false
    const next = candidates.slice(index + 1, index + 4).filter((candidate) => !isBlankCsvRow(candidate))
    return next.length > 0 && next.some((candidate) => candidate.length === row.length)
  })
  return match >= 0 ? match : null
}

function calendarDate(year: number, month: number, day: number) {
  const candidate = new Date(year, month - 1, day)
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day
    ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : null
}

export function normalizeDate(value: string, format: DateFormat) {
  const source = value.trim()
  const patterns: Array<[DateFormat, RegExp]> = [
    ['yyyy/mm/dd', /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/],
    ['yyyy-mm-dd', /^(\d{4})-(\d{1,2})-(\d{1,2})$/],
    ['yyyymmdd', /^(\d{4})(\d{2})(\d{2})$/],
    ['japanese', /^(\d{4})年(\d{1,2})月(\d{1,2})日$/],
  ]
  const matched = patterns.find(([kind, pattern]) => (format === 'auto' || format === kind) && pattern.test(source))
  if (!matched) return null
  const groups = matched[1].exec(source)
  return groups ? calendarDate(Number(groups[1]), Number(groups[2]), Number(groups[3])) : null
}

export function normalizeAmount(value: string) {
  const source = value.trim().replace(/[\s\u3000,，¥￥]/g, '')
  if (!/^\d+$/.test(source)) return null
  const amount = Number(source)
  return Number.isSafeInteger(amount) && amount >= 1 && amount <= 9_999_999 ? String(amount) : null
}

export function validateImportRow(row: Omit<ImportRow, 'errors'>, categories: Array<{ category_id: string; category_name: string; sub_category_list?: Array<{ sub_category_id: string; sub_category_name: string; enable: boolean }> }>) {
  const errors: ImportRowError[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push({ field: 'date', message: '日付を読み取れません。' })
  if (row.name.trim().length < 1 || row.name.trim().length > 32) errors.push({ field: 'name', message: '取引名は1〜32文字で入力してください。' })
  if (!normalizeAmount(row.amount)) errors.push({ field: 'amount', message: '金額は1〜9,999,999円の整数で入力してください。' })
  const category = categories.find((item) => item.category_id === row.categoryId)
  if (!category) errors.push({ field: 'category', message: 'カテゴリを選択してください。' })
  if (!category?.sub_category_list?.some((item) => item.enable && item.sub_category_id === row.subcategoryId)) {
    errors.push({ field: 'subcategory', message: 'サブカテゴリを選択してください。' })
  }
  return errors
}

export function createImportRows({ rows, headerRowIndex, mapping, defaults, dateFormat, categories, frequentTransactions = [] }: {
  rows: string[][]
  headerRowIndex: number | null
  mapping: Mapping
  defaults: Partial<ImportDefaults>
  dateFormat: DateFormat
  categories: Array<{ category_id: string; category_name: string; sub_category_list?: Array<{ sub_category_id: string; sub_category_name: string; enable: boolean }> }>
  frequentTransactions?: FrequentTransactionResponseTransactionListItem[]
}) {
  if (mapping.date === null || mapping.name === null || mapping.amount === null) return []
  const frequentTransactionsByName = new Map(
    frequentTransactions.map((transaction) => [transaction.transaction_name.trim(), transaction]),
  )
  return rows
    .map((source, index) => ({ source, index }))
    .filter(({ source, index }) => (headerRowIndex === null || index > headerRowIndex) && !isBlankCsvRow(source))
    .map(({ source, index }, id) => {
      const name = source[mapping.name!] ?? ''
      const frequentTransaction = frequentTransactionsByName.get(name.trim())
      const draft = {
        id,
        sourceRowNumber: index + 1,
        source,
        date: normalizeDate(source[mapping.date!] ?? '', dateFormat) ?? '',
        name,
        amount: normalizeAmount(source[mapping.amount!] ?? '') ?? (source[mapping.amount!] ?? ''),
        categoryId: frequentTransaction?.category_id ?? defaults.categoryId ?? '',
        subcategoryId: frequentTransaction?.sub_category_id ?? defaults.subcategoryId ?? '',
        selected: true,
      }
      const errors = validateImportRow(draft, categories)
      return { ...draft, selected: errors.length === 0, errors }
    })
}

export function applyCategoryToImportRows({ rows, rowIds, categoryId, subcategoryId, categories }: {
  rows: ImportRow[]
  rowIds: Set<number>
  categoryId: string
  subcategoryId: string
  categories: Array<{ category_id: string; category_name: string; sub_category_list?: Array<{ sub_category_id: string; sub_category_name: string; enable: boolean }> }>
}) {
  return rows.map((row) => {
    if (!rowIds.has(row.id)) return row
    const next = { ...row, categoryId, subcategoryId }
    const errors = validateImportRow(next, categories)
    return { ...next, errors, selected: errors.length === 0 }
  })
}

export function toTransactionList(rows: ImportRow[], defaults: Pick<ImportDefaults, 'sign'> & Partial<Pick<ImportDefaults, 'paymentId'>>): TransactionListWriteRequest {
  return {
    transaction_list: rows.filter((row) => row.selected && row.errors.length === 0).map((row) => ({
      transaction_date: row.date,
      transaction_amount: Number(normalizeAmount(row.amount)),
      transaction_sign: defaults.sign === 'expense' ? -1 : 1,
      transaction_name: row.name,
      category_id: row.categoryId,
      sub_category_id: row.subcategoryId,
      fixed_flg: false,
      ...(defaults.paymentId ? { payment_id: defaults.paymentId } : {}),
    })),
  }
}
