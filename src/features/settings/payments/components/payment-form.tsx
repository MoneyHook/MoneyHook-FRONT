import { Banknote, CreditCard, LoaderCircle, QrCode } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { PaymentTypeListResponsePaymentTypeListItem } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

import {
  validatePaymentSettings,
  type PaymentSettingsFormErrors,
  type PaymentSettingsFormValues,
} from '../model/payment-settings'

import { formValuesFromPayment, initialFormValues, type EditorState } from '../model/payment-editor'

function PaymentTypeIcon({ paymentTypeName }: { paymentTypeName: string }) {
  if (paymentTypeName.includes('カード')) {
    return <CreditCard aria-hidden="true" className="size-4" />
  }
  if (paymentTypeName.includes('QR')) {
    return <QrCode aria-hidden="true" className="size-4" />
  }
  return <Banknote aria-hidden="true" className="size-4" />
}

export function PaymentForm({
  editor,
  paymentTypes,
  onCancel,
  onSave,
  isSaving,
}: {
  editor: Exclude<EditorState, null>
  paymentTypes: PaymentTypeListResponsePaymentTypeListItem[]
  onCancel: () => void
  onSave: (values: PaymentSettingsFormValues) => Promise<void>
  isSaving: boolean
}) {
  const [values, setValues] = useState(() =>
    editor.mode === 'edit'
      ? formValuesFromPayment(editor.payment)
      : initialFormValues(paymentTypes[0]?.payment_type_id),
  )
  const [errors, setErrors] = useState<PaymentSettingsFormErrors>({})
  const selectedType = paymentTypes.find((type) => type.payment_type_id === values.paymentTypeId)

  const update = (key: keyof PaymentSettingsFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validatePaymentSettings(values, selectedType)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    await onSave(values)
  }

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="payment-name">
          支払い方法名
        </label>
        <Input
          aria-invalid={errors.paymentName ? true : undefined}
          disabled={isSaving}
          id="payment-name"
          maxLength={32}
          onChange={(event) => update('paymentName', event.target.value)}
          placeholder="例: 楽天カード"
          value={values.paymentName}
        />
        {errors.paymentName ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.paymentName}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">支払いの種類</legend>
        <div aria-label="支払いの種類" className="grid grid-cols-3 gap-2" role="radiogroup">
          {paymentTypes.map((type) => {
            const isSelected = values.paymentTypeId === type.payment_type_id

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  isSelected && 'border-primary bg-primary/5 text-primary',
                )}
                disabled={isSaving}
                key={type.payment_type_id}
                onClick={() => update('paymentTypeId', type.payment_type_id)}
                role="radio"
                type="button"
              >
                <PaymentTypeIcon paymentTypeName={type.payment_type_name} />
                <span className="truncate">{type.payment_type_name}</span>
              </button>
            )
          })}
        </div>
        {errors.paymentTypeId ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.paymentTypeId}
          </p>
        ) : null}
      </fieldset>

      {selectedType?.is_payment_due_later ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="closing-date">
              締め日
            </label>
            <div className="flex items-center gap-2">
              <Input
                aria-invalid={errors.closingDate ? true : undefined}
                disabled={isSaving}
                id="closing-date"
                inputMode="numeric"
                max={31}
                min={1}
                onChange={(event) => update('closingDate', event.target.value)}
                type="number"
                value={values.closingDate}
              />
              <span className="text-sm text-muted-foreground">日</span>
            </div>
            {errors.closingDate ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.closingDate}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="payment-date">
              支払日
            </label>
            <div className="flex items-center gap-2">
              <Input
                aria-invalid={errors.paymentDate ? true : undefined}
                disabled={isSaving}
                id="payment-date"
                inputMode="numeric"
                max={31}
                min={1}
                onChange={(event) => update('paymentDate', event.target.value)}
                type="number"
                value={values.paymentDate}
              />
              <span className="text-sm text-muted-foreground">日</span>
            </div>
            {errors.paymentDate ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.paymentDate}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="outline">
          キャンセル
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {editor.mode === 'add' ? '追加する' : '保存する'}
        </Button>
      </div>
    </form>
  )
}
