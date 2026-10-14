import {
  useCategoriesWithSubcategories,
  useFrequentTransactions,
  usePayments,
  usePaymentTypes,
} from '@/shared/hooks/use-reference-queries'

export {
  FREQUENT_TRANSACTIONS_CACHE_VERSION,
  TRANSACTION_FORM_REFERENCE_CACHE_KEYS,
} from '@/shared/lib/transaction-reference-cache'

export function useTransactionFormReferences({ isEdit }: { isEdit: boolean }) {
  return {
    categoriesQuery: useCategoriesWithSubcategories(),
    paymentsQuery: usePayments(),
    paymentTypesQuery: usePaymentTypes(),
    frequentTransactionsQuery: useFrequentTransactions(!isEdit),
  }
}
