import type { FrequentTransactionResponseTransactionListItem } from '@/shared/api/generated/model/frequentTransactionResponseTransactionListItem'

import type { NewTransactionFormValues } from './new-transaction'

export type TransactionRecommendationOverrides = {
  category?: boolean
  fixed?: boolean
  payment?: boolean
}

export function applyTransactionRecommendation(
  form: NewTransactionFormValues,
  transaction: FrequentTransactionResponseTransactionListItem,
  overrides: TransactionRecommendationOverrides,
): NewTransactionFormValues {
  return {
    ...form,
    transactionName: transaction.transaction_name,
    ...(!overrides.category && {
      categoryId: transaction.category_id,
      subcategoryId: transaction.sub_category_id,
      subcategoryName: '',
    }),
    ...(!overrides.fixed && { fixed: transaction.fixed_flg }),
    ...(!overrides.payment && { paymentId: transaction.payment_id }),
  }
}

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
  if (!query) return index.slice(0, 6).map(({ transaction }) => transaction)

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
