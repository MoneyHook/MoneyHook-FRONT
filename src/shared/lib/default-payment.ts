import {
  PERSISTED_USER_DATA_PREFIX,
  readPersistedUserData,
  removePersistedUserData,
  writePersistedUserData,
} from './persisted-user-data'

export const DEFAULT_PAYMENT_STORAGE_KEY = `${PERSISTED_USER_DATA_PREFIX}default-payment`
const DEFAULT_PAYMENT_STORAGE_VERSION = 1

function isPaymentId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function readDefaultPaymentId(): string | null {
  return readPersistedUserData(
    DEFAULT_PAYMENT_STORAGE_KEY,
    DEFAULT_PAYMENT_STORAGE_VERSION,
    isPaymentId,
  )
}

export function writeDefaultPaymentId(paymentId: string): void {
  writePersistedUserData(
    DEFAULT_PAYMENT_STORAGE_KEY,
    DEFAULT_PAYMENT_STORAGE_VERSION,
    paymentId,
  )
}

export function clearDefaultPaymentId(): void {
  removePersistedUserData(DEFAULT_PAYMENT_STORAGE_KEY)
}
