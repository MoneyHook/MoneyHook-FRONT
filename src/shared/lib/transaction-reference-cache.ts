import {
  CATEGORY_REFERENCE_CACHE_KEY,
  CATEGORY_REFERENCE_CACHE_VERSION,
} from './category-reference-cache'
import { PERSISTED_USER_DATA_PREFIX } from './persisted-user-data'

export { CATEGORY_REFERENCE_CACHE_VERSION }
export const FREQUENT_TRANSACTIONS_CACHE_VERSION = 2
export const TRANSACTION_FORM_REFERENCE_CACHE_KEYS = {
  categories: CATEGORY_REFERENCE_CACHE_KEY,
  payments: `${PERSISTED_USER_DATA_PREFIX}transaction-form:payments`,
  paymentTypes: `${PERSISTED_USER_DATA_PREFIX}transaction-form:payment-types`,
  frequentTransactions: `${PERSISTED_USER_DATA_PREFIX}transaction-form:frequent-transactions`,
} as const
