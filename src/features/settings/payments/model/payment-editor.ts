import type { PaymentResourceListResponsePaymentListItem } from '@/shared/api/generated/model'

import type { PaymentSettingsFormValues } from './payment-settings'

export type EditorState =
  | { mode: 'add'; payment: null }
  | { mode: 'edit'; payment: PaymentResourceListResponsePaymentListItem }
  | null

export const initialFormValues = (paymentTypeId = ''): PaymentSettingsFormValues => ({
  closingDate: '',
  paymentDate: '',
  paymentName: '',
  paymentTypeId,
})

export function formValuesFromPayment(
  payment: PaymentResourceListResponsePaymentListItem,
): PaymentSettingsFormValues {
  return {
    closingDate: String(payment.closing_date),
    paymentDate: payment.payment_date === null ? '' : String(payment.payment_date),
    paymentName: payment.payment_name,
    paymentTypeId: payment.payment_type_id,
  }
}
