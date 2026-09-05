import { useEffect, useState } from 'react'

import { useGetCategoryWithSubCategoryList } from '@/shared/api/generated/category/category'
import type {
  CategoryWithSubcategoryResponse,
  FrequentTransactionResponse,
  PaymentResourceListResponse,
  PaymentTypeListResponse,
} from '@/shared/api/generated/model'
import { useGetPaymentResources, useGetPaymentTypes } from '@/shared/api/generated/payment/payment'
import { useGetFrequentTransactionNames } from '@/shared/api/generated/transaction/transaction'
import {
  PERSISTED_USER_DATA_PREFIX,
  readPersistedUserData,
  writePersistedUserData,
} from '@/shared/lib/persisted-user-data'

const CACHE_VERSION = 1
export const TRANSACTION_FORM_REFERENCE_CACHE_KEYS = {
  categories: `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`,
  payments: `${PERSISTED_USER_DATA_PREFIX}transaction-form:payments`,
  paymentTypes: `${PERSISTED_USER_DATA_PREFIX}transaction-form:payment-types`,
  frequentTransactions: `${PERSISTED_USER_DATA_PREFIX}transaction-form:frequent-transactions`,
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function hasArray(value: unknown, key: string): boolean {
  return isRecord(value) && Array.isArray(value[key])
}

function isCategoryResponse(value: unknown): value is CategoryWithSubcategoryResponse {
  return isRecord(value) && (value.category_list === null || Array.isArray(value.category_list))
}

function isPaymentResourcesResponse(value: unknown): value is PaymentResourceListResponse {
  return hasArray(value, 'payment_list')
}

function isPaymentTypesResponse(value: unknown): value is PaymentTypeListResponse {
  return hasArray(value, 'payment_type_list')
}

function isFrequentTransactionsResponse(value: unknown): value is FrequentTransactionResponse {
  return hasArray(value, 'transaction_list')
}

function cachedSuccessResponse<T>(data: T) {
  return { data, headers: new Headers(), status: 200 as const }
}

/**
 * Loads transaction-form reference data from local storage for first paint, then
 * immediately revalidates each value through the existing API query.
 */
export function useTransactionFormReferences({ isEdit }: { isEdit: boolean }) {
  const [cachedCategories] = useState(() =>
    readPersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.categories, CACHE_VERSION, isCategoryResponse),
  )
  const [cachedPayments] = useState(() =>
    readPersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.payments, CACHE_VERSION, isPaymentResourcesResponse),
  )
  const [cachedPaymentTypes] = useState(() =>
    readPersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.paymentTypes, CACHE_VERSION, isPaymentTypesResponse),
  )
  const [cachedFrequentTransactions] = useState(() =>
    isEdit
      ? null
      : readPersistedUserData(
        TRANSACTION_FORM_REFERENCE_CACHE_KEYS.frequentTransactions,
        CACHE_VERSION,
        isFrequentTransactionsResponse,
      ),
  )

  const categoriesQuery = useGetCategoryWithSubCategoryList({
    query: {
      initialData: cachedCategories ? () => cachedSuccessResponse(cachedCategories) : undefined,
      initialDataUpdatedAt: cachedCategories ? 0 : undefined,
    },
  })
  const paymentsQuery = useGetPaymentResources({
    query: {
      initialData: cachedPayments ? () => cachedSuccessResponse(cachedPayments) : undefined,
      initialDataUpdatedAt: cachedPayments ? 0 : undefined,
    },
  })
  const paymentTypesQuery = useGetPaymentTypes({
    query: {
      initialData: cachedPaymentTypes ? () => cachedSuccessResponse(cachedPaymentTypes) : undefined,
      initialDataUpdatedAt: cachedPaymentTypes ? 0 : undefined,
    },
  })
  const frequentTransactionsQuery = useGetFrequentTransactionNames({
    query: {
      enabled: !isEdit,
      initialData: cachedFrequentTransactions
        ? () => cachedSuccessResponse(cachedFrequentTransactions)
        : undefined,
      initialDataUpdatedAt: cachedFrequentTransactions ? 0 : undefined,
    },
  })

  useEffect(() => {
    void categoriesQuery.refetch()
    void paymentsQuery.refetch()
    void paymentTypesQuery.refetch()
    if (!isEdit) {
      void frequentTransactionsQuery.refetch()
    }
    // Revalidate on every form mount even when another screen has a fresh in-memory query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (categoriesQuery.data?.status === 200) {
      writePersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.categories, CACHE_VERSION, categoriesQuery.data.data)
    }
  }, [categoriesQuery.data])

  useEffect(() => {
    if (paymentsQuery.data?.status === 200) {
      writePersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.payments, CACHE_VERSION, paymentsQuery.data.data)
    }
  }, [paymentsQuery.data])

  useEffect(() => {
    if (paymentTypesQuery.data?.status === 200) {
      writePersistedUserData(TRANSACTION_FORM_REFERENCE_CACHE_KEYS.paymentTypes, CACHE_VERSION, paymentTypesQuery.data.data)
    }
  }, [paymentTypesQuery.data])

  useEffect(() => {
    if (frequentTransactionsQuery.data?.status === 200) {
      writePersistedUserData(
        TRANSACTION_FORM_REFERENCE_CACHE_KEYS.frequentTransactions,
        CACHE_VERSION,
        frequentTransactionsQuery.data.data,
      )
    }
  }, [frequentTransactionsQuery.data])

  return { categoriesQuery, paymentsQuery, paymentTypesQuery, frequentTransactionsQuery }
}
