type TransactionNavigationState = {
  returnTo?: unknown
}

export function getReturnTo(state: unknown, fallback: string) {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) {
    return fallback
  }

  const value = (state as TransactionNavigationState).returnTo
  if (typeof value !== 'string' || !value.startsWith('/app/') || value.includes('\\')) {
    return fallback
  }

  return value
}

export function getTransactionMonth(date: string) {
  return `${date.slice(0, 7)}-01`
}

export function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return undefined
  }

  const [, yearString, monthString, dayString] = match
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined
}

export function formatCalendarDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
