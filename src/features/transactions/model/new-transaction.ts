export type NewTransactionSign = -1 | 1

export type NewTransactionFormValues = {
  transactionDate: string
  transactionTime: string | null
  amount: string
  transactionName: string
  sign: NewTransactionSign
  categoryId: string
  subcategoryId: string
  fixed: boolean
  paymentId: string | null
}

export type NewTransactionField =
  | 'transactionDate'
  | 'amount'
  | 'transactionName'
  | 'categoryId'
  | 'subcategoryId'

export type NewTransactionErrors = Partial<Record<NewTransactionField, string>>

export function getTodayDate(now = new Date()) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

export function createNewTransactionValues(now = new Date()): NewTransactionFormValues {
  return {
    transactionDate: getTodayDate(now),
    transactionTime: null,
    amount: '',
    transactionName: '',
    sign: -1,
    categoryId: '',
    subcategoryId: '',
    fixed: false,
    paymentId: null,
  }
}

function isCalendarDate(value: string) {
  if (!value.match(/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).getFullYear() === year && new Date(year, month - 1, day).getMonth() === month - 1 && new Date(year, month - 1, day).getDate() === day
}

export function validateNewTransaction(values: NewTransactionFormValues): NewTransactionErrors {
  const errors: NewTransactionErrors = {}
  const amount = Number(values.amount)
  const transactionNameLength = values.transactionName.trim().length

  if (!isCalendarDate(values.transactionDate)) {
    errors.transactionDate = '日付を選択してください。'
  }
  if (!/^\d+$/.test(values.amount) || !Number.isSafeInteger(amount) || amount < 1 || amount > 9_999_999) {
    errors.amount = '金額は1〜9,999,999円の整数で入力してください。'
  }
  if (transactionNameLength < 1 || transactionNameLength > 32) {
    errors.transactionName = '取引名は1〜32文字で入力してください。'
  }
  if (!values.categoryId) {
    errors.categoryId = 'カテゴリを選択してください。'
  }
  if (!values.subcategoryId) {
    errors.subcategoryId = 'サブカテゴリを選択してください。'
  }

  return errors
}
