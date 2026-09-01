export type RecurringTransactionSign = -1 | 1

export type RecurringTransactionFormValues = {
  amount: string
  categoryId: string
  day: string
  paymentId: string | null
  sign: RecurringTransactionSign
  subcategoryId: string
  transactionName: string
}

export type RecurringTransactionFormErrors = Partial<
  Record<Exclude<keyof RecurringTransactionFormValues, 'paymentId' | 'sign'>, string>
>

export type RecurringTransactionRule = {
  category_id: string
  category_name: string
  monthly_transaction_amount: number
  monthly_transaction_date: number
  monthly_transaction_id: string
  monthly_transaction_name: string
  monthly_transaction_sign: RecurringTransactionSign
  payment_id: string | null
  sub_category_id: string
  sub_category_name: string
}

export function createRecurringTransactionValues(): RecurringTransactionFormValues {
  return {
    amount: '',
    categoryId: '',
    day: '',
    paymentId: null,
    sign: -1,
    subcategoryId: '',
    transactionName: '',
  }
}

export function validateRecurringTransaction(
  values: RecurringTransactionFormValues,
): RecurringTransactionFormErrors {
  const errors: RecurringTransactionFormErrors = {}
  const amount = Number(values.amount)
  const day = Number(values.day)
  const nameLength = Array.from(values.transactionName.trim()).length

  if (!/^\d+$/.test(values.amount) || !Number.isSafeInteger(amount) || amount < 1 || amount > 9_999_999) {
    errors.amount = '金額は1〜9,999,999円の整数で入力してください。'
  }
  if (nameLength < 1 || nameLength > 32) {
    errors.transactionName = '取引名は1〜32文字で入力してください。'
  }
  if (!/^\d+$/.test(values.day) || !Number.isSafeInteger(day) || day < 1 || day > 31) {
    errors.day = '入力日は1〜31の整数で入力してください。'
  }
  if (!values.categoryId) {
    errors.categoryId = 'カテゴリを選択してください。'
  }
  if (!values.subcategoryId) {
    errors.subcategoryId = 'サブカテゴリを選択してください。'
  }

  return errors
}
