import {
  PERSISTED_USER_DATA_PREFIX,
  removePersistedUserData,
} from './persisted-user-data'

export const CATEGORY_REFERENCE_CACHE_VERSION = 1
export const CATEGORY_REFERENCE_CACHE_KEY = `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`

export function clearCategoryReferenceCache() {
  removePersistedUserData(CATEGORY_REFERENCE_CACHE_KEY)
}
