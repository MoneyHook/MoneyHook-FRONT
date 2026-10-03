import type { ReactNode } from 'react'

import type {
  CategoryWithSubcategoryResponseCategoryListItem,
  PaymentResourceListResponsePaymentListItem,
} from '@/shared/api/generated/model'

import type { NewTransactionFormValues } from './new-transaction'

export type TransactionFormExtension = {
  renderTitle?: (resetReferences: () => void, disabled: boolean) => ReactNode
  saveMode?: {
    value: 'normal' | 'proxy'
    onChange: (mode: 'normal' | 'proxy', resetReferences: () => void) => void
    renderDetails?: () => ReactNode
  }
  allowCsvImport?: boolean
  onCreate?: (values: NewTransactionFormValues) => Promise<void>
  isSaving?: boolean
  isBlocked?: boolean
  renderOptions?: (
    form: NewTransactionFormValues,
    resetReferences: () => void,
  ) => ReactNode
  references?: {
    categories: CategoryWithSubcategoryResponseCategoryListItem[]
    payments: PaymentResourceListResponsePaymentListItem[]
  }
}
