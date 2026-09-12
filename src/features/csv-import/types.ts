import type { Dispatch } from 'react'

import type {
  DateFormat,
  Encoding,
  ImportDefaults,
  ImportRow,
  Mapping,
} from './model/csv-import'

export type Step = 'setup' | 'complete'
export type Filter = 'all' | 'selected' | 'excluded' | 'error'

export type Categories = Array<{
  category_id: string
  category_name: string
  sub_category_list?: Array<{
    sub_category_id: string
    sub_category_name: string
    enable: boolean
  }>
}>

export type Payments = Array<{ payment_id: string; payment_name: string }>

export type CsvImportState = {
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

export type CsvImportAction =
  | { type: 'patch'; patch: Partial<CsvImportState> }
  | {
      type: 'set-row'
      id: number
      patch: Partial<ImportRow>
      categories: Categories
    }
  | {
      type: 'apply-bulk-edit'
      rowIds: Set<number>
      categoryId: string
      subcategoryId: string
      paymentId: string
      categories: Categories
    }
  | { type: 'set-all'; selected: boolean }

export type CsvImportDispatch = Dispatch<CsvImportAction>
