import type { PaymentTypeListResponsePaymentTypeListItem } from '@/shared/api/generated/model'

export type PaymentSettingsFormValues = {
  closingDate: string
  paymentDate: string
  paymentName: string
  paymentTypeId: string
}

export type PaymentSettingsFormErrors = Partial<Record<keyof PaymentSettingsFormValues, string>>

export function validatePaymentSettings(
  values: PaymentSettingsFormValues,
  paymentType: PaymentTypeListResponsePaymentTypeListItem | undefined,
): PaymentSettingsFormErrors {
  const errors: PaymentSettingsFormErrors = {}
  const paymentName = values.paymentName.trim()

  if (!paymentName) {
    errors.paymentName = '支払い方法名を入力してください。'
  } else if (Array.from(paymentName).length > 32) {
    errors.paymentName = '支払い方法名は32文字以内で入力してください。'
  }

  if (!paymentType) {
    errors.paymentTypeId = '支払いの種類を選択してください。'
    return errors
  }

  if (!paymentType.is_payment_due_later) {
    return errors
  }

  for (const [key, label] of [
    ['closingDate', '締め日'],
    ['paymentDate', '支払日'],
  ] as const) {
    const value = values[key].trim()
    const day = Number(value)
    if (!value) {
      errors[key] = `${label}を入力してください。`
    } else if (!/^\d+$/.test(value) || !Number.isSafeInteger(day) || day < 1 || day > 31) {
      errors[key] = `${label}は1〜31の整数で入力してください。`
    }
  }

  return errors
}
