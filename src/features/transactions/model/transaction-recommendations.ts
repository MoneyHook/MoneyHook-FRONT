import type { FrequentTransactionResponseTransactionListItem } from '@/shared/api/generated/model/frequentTransactionResponseTransactionListItem'

export function normalizeTransactionName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    )
    .replace(/\s/g, '')
}

export function getTransactionRecommendations(
  transactions: FrequentTransactionResponseTransactionListItem[],
  input: string,
): FrequentTransactionResponseTransactionListItem[] {
  const query = normalizeTransactionName(input)
  if (!query) return []

  return transactions
    .map((transaction) => {
      const name = normalizeTransactionName(transaction.transaction_name)
      const rank = name === query ? 0 : name.startsWith(query) ? 1 : 2
      return { transaction, name, rank }
    })
    .filter(({ name }) => name.includes(query))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6)
    .map(({ transaction }) => transaction)
}
