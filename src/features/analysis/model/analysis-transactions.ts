type DatedTransaction = {
  id: string
  date: string
  time: string | null
}

export function compareAnalysisTransactions(
  left: DatedTransaction,
  right: DatedTransaction,
) {
  const dateOrder = right.date.localeCompare(left.date)
  if (dateOrder !== 0) return dateOrder

  const timeOrder = (right.time ?? '').localeCompare(left.time ?? '')
  return timeOrder === 0
    ? right.id.localeCompare(left.id, 'ja', { numeric: true })
    : timeOrder
}
