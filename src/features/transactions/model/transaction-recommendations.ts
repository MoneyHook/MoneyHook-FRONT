import type { FrequentTransactionResponseTransactionListItem } from '@/shared/api/generated/model/frequentTransactionResponseTransactionListItem'

export type TransactionRecommendationIndex = Array<{
  transaction: FrequentTransactionResponseTransactionListItem
  normalizedName: string
}>

export function normalizeTransactionName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    )
    .replace(/\s/g, '')
}

export function createTransactionRecommendationIndex(
  transactions: FrequentTransactionResponseTransactionListItem[],
): TransactionRecommendationIndex {
  return transactions.map((transaction) => ({
    transaction,
    normalizedName: normalizeTransactionName(transaction.transaction_name),
  }))
}

export function getTransactionRecommendations(
  index: TransactionRecommendationIndex,
  input: string,
): FrequentTransactionResponseTransactionListItem[] {
  const query = normalizeTransactionName(input)
  if (!query) return []

  return index
    .map(({ transaction, normalizedName }) => {
      const rank =
        normalizedName === query ? 0 : normalizedName.startsWith(query) ? 1 : 2
      return { transaction, normalizedName, rank }
    })
    .filter(({ normalizedName }) => normalizedName.includes(query))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6)
    .map(({ transaction }) => transaction)
}
