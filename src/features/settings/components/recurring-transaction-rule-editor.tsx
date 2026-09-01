import { ArrowDown, ArrowUp, CalendarDays, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

import {
  validateRecurringTransaction,
  type RecurringTransactionFormErrors,
  type RecurringTransactionFormValues,
} from '../model/recurring-transaction-settings'

type Category = {
  category_id: string
  category_name: string
  sub_category_list?: Array<{
    enable: boolean
    sub_category_id: string
    sub_category_name: string
  }>
}

export function RecurringTransactionRuleEditor({
  categories,
  initialValues,
  isEdit,
  isSaving,
  onCancel,
  onSave,
  payments,
}: {
  categories: Category[]
  initialValues: RecurringTransactionFormValues
  isEdit: boolean
  isSaving: boolean
  onCancel: () => void
  onSave: (values: RecurringTransactionFormValues) => Promise<void>
  payments: Array<{ payment_id: string; payment_name: string }>
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RecurringTransactionFormErrors>({})
  const selectedCategory = categories.find((category) => category.category_id === values.categoryId)
  const subcategories = (selectedCategory?.sub_category_list ?? []).filter(
    (subcategory) => subcategory.enable,
  )

  const update = <K extends keyof RecurringTransactionFormValues>(
    key: K,
    value: RecurringTransactionFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateRecurringTransaction(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) await onSave(values)
  }

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div aria-label="収支区分" className="grid grid-cols-2 gap-2" role="tablist">
        {([
          { label: '支出', sign: -1 as const },
          { label: '収入', sign: 1 as const },
        ]).map(({ label, sign }) => (
          <button
            aria-selected={values.sign === sign}
            className={cn(
              'flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
              values.sign === sign
                ? sign === -1
                  ? 'border-expense/35 bg-expense/10 text-expense'
                  : 'border-income/35 bg-income/10 text-income'
                : 'text-muted-foreground',
            )}
            key={sign}
            onClick={() => update('sign', sign)}
            role="tab"
            type="button"
          >
            {sign === -1 ? <ArrowDown aria-hidden="true" className="size-4" /> : <ArrowUp aria-hidden="true" className="size-4" />}
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-name">取引名</label>
          <Input aria-invalid={errors.transactionName ? true : undefined} disabled={isSaving} id="recurring-transaction-name" maxLength={32} onChange={(event) => update('transactionName', event.target.value)} placeholder="例: 家賃" value={values.transactionName} />
          {errors.transactionName ? <p className="text-sm text-destructive" role="alert">{errors.transactionName}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-amount">金額</label>
          <div className="flex items-center gap-2"><span aria-hidden="true" className="font-semibold">¥</span><Input aria-invalid={errors.amount ? true : undefined} disabled={isSaving} id="recurring-transaction-amount" inputMode="numeric" maxLength={7} onChange={(event) => update('amount', event.target.value.replace(/\D/g, ''))} placeholder="0" value={values.amount} /></div>
          {errors.amount ? <p className="text-sm text-destructive" role="alert">{errors.amount}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-day">毎月の入力日</label>
          <div className="flex items-center gap-2"><Input aria-invalid={errors.day ? true : undefined} disabled={isSaving} id="recurring-transaction-day" inputMode="numeric" max={31} min={1} onChange={(event) => update('day', event.target.value.replace(/\D/g, ''))} type="number" value={values.day} /><span className="text-sm text-muted-foreground">日</span></div>
          {errors.day ? <p className="text-sm text-destructive" role="alert">{errors.day}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-category">カテゴリ</label>
          <Select disabled={isSaving} onValueChange={(categoryId) => { setValues((current) => ({ ...current, categoryId, subcategoryId: '' })); setErrors((current) => ({ ...current, categoryId: undefined, subcategoryId: undefined })) }} value={values.categoryId}>
            <SelectTrigger aria-invalid={errors.categoryId ? true : undefined} id="recurring-transaction-category"><SelectValue placeholder="カテゴリを選択" /></SelectTrigger>
            <SelectContent>{categories.map((category) => <SelectItem key={category.category_id} value={category.category_id}>{category.category_name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.categoryId ? <p className="text-sm text-destructive" role="alert">{errors.categoryId}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-subcategory">サブカテゴリ</label>
          <Select disabled={isSaving || !values.categoryId} onValueChange={(value) => update('subcategoryId', value)} value={values.subcategoryId}>
            <SelectTrigger aria-invalid={errors.subcategoryId ? true : undefined} id="recurring-transaction-subcategory"><SelectValue placeholder="サブカテゴリを選択" /></SelectTrigger>
            <SelectContent>{subcategories.map((subcategory) => <SelectItem key={subcategory.sub_category_id} value={subcategory.sub_category_id}>{subcategory.sub_category_name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.subcategoryId ? <p className="text-sm text-destructive" role="alert">{errors.subcategoryId}</p> : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="recurring-transaction-payment">支払い方法</label>
          <Select disabled={isSaving} onValueChange={(value) => update('paymentId', value === 'none' ? null : value)} value={values.paymentId ?? 'none'}>
            <SelectTrigger id="recurring-transaction-payment"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">選択しない</SelectItem>{payments.map((payment) => <SelectItem key={payment.payment_id} value={payment.payment_id}>{payment.payment_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <p className="flex gap-2 text-sm leading-6 text-muted-foreground"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0" />29〜31日は、該当日がない月には月末日に自動入力されます。</p>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="outline">キャンセル</Button>
        <Button disabled={isSaving} type="submit">{isSaving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}{isEdit ? '保存する' : '追加する'}</Button>
      </div>
    </form>
  )
}
