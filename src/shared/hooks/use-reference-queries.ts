import {
  getGetCategoryListQueryOptions,
  getGetCategoryWithSubCategoryListQueryOptions,
} from '@/shared/api/generated/category/category'
import type {
  CategoryListResponse,
  CategoryWithSubcategoryResponse,
  FrequentTransactionResponse,
  PaymentResourceListResponse,
  PaymentTypeListResponse,
} from '@/shared/api/generated/model'
import {
  getGetPaymentResourcesQueryOptions,
  getGetPaymentTypesQueryOptions,
} from '@/shared/api/generated/payment/payment'
import { getGetFrequentTransactionNamesQueryOptions } from '@/shared/api/generated/transaction/transaction'
import {
  CATEGORY_REFERENCE_CACHE_VERSION,
  FREQUENT_TRANSACTIONS_CACHE_VERSION,
  TRANSACTION_FORM_REFERENCE_CACHE_KEYS,
} from '@/shared/lib/transaction-reference-cache'

import { usePersistedApiQuery } from './use-persisted-api-query'

function hasArray(value: unknown, key: string, nullable = false) {
  return (
    value !== null &&
    typeof value === 'object' &&
    key in value &&
    (Array.isArray((value as Record<string, unknown>)[key]) ||
      (nullable && (value as Record<string, unknown>)[key] === null))
  )
}
function isCategories(value: unknown): value is CategoryListResponse {
  return hasArray(value, 'category_list', true)
}
function isSubcategories(
  value: unknown,
): value is CategoryWithSubcategoryResponse {
  return hasArray(value, 'category_list', true)
}
function isPayments(value: unknown): value is PaymentResourceListResponse {
  return hasArray(value, 'payment_list')
}
function isPaymentTypes(value: unknown): value is PaymentTypeListResponse {
  return hasArray(value, 'payment_type_list')
}
function isFrequentTransactions(
  value: unknown,
): value is FrequentTransactionResponse {
  return hasArray(value, 'transaction_list')
}

export function useCategories(enabled = true) {
  return usePersistedApiQuery({
    resource: 'categories',
    parameters: {},
    isValue: isCategories,
    queryOptions: getGetCategoryListQueryOptions({ query: { enabled } }),
  })
}
export function useCategoriesWithSubcategories(enabled = true) {
  return usePersistedApiQuery({
    resource: 'categories-with-subcategories',
    parameters: {},
    userDataKey: TRANSACTION_FORM_REFERENCE_CACHE_KEYS.categories,
    version: CATEGORY_REFERENCE_CACHE_VERSION,
    isValue: isSubcategories,
    queryOptions: getGetCategoryWithSubCategoryListQueryOptions({
      query: { enabled },
    }),
  })
}
export function usePayments(enabled = true) {
  return usePersistedApiQuery({
    resource: 'payments',
    parameters: {},
    userDataKey: TRANSACTION_FORM_REFERENCE_CACHE_KEYS.payments,
    isValue: isPayments,
    queryOptions: getGetPaymentResourcesQueryOptions({ query: { enabled } }),
  })
}
export function usePaymentTypes(enabled = true) {
  return usePersistedApiQuery({
    resource: 'payment-types',
    parameters: {},
    userDataKey: TRANSACTION_FORM_REFERENCE_CACHE_KEYS.paymentTypes,
    isValue: isPaymentTypes,
    queryOptions: getGetPaymentTypesQueryOptions({ query: { enabled } }),
  })
}
export function useFrequentTransactions(enabled = true) {
  return usePersistedApiQuery({
    resource: 'frequent-transactions',
    parameters: { limit: 100 },
    userDataKey: TRANSACTION_FORM_REFERENCE_CACHE_KEYS.frequentTransactions,
    version: FREQUENT_TRANSACTIONS_CACHE_VERSION,
    isValue: isFrequentTransactions,
    queryOptions: getGetFrequentTransactionNamesQueryOptions(
      { limit: 100 },
      { query: { enabled } },
    ),
  })
}
