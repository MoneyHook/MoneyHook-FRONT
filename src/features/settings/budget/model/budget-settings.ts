export function getCurrentMonthStart(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function validateBudgetAmount(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return '月額予算を入力してください。'
  }

  const amount = Number(normalized)
  if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(amount) || amount < 1) {
    return '1円以上の整数を入力してください。'
  }

  return null
}
