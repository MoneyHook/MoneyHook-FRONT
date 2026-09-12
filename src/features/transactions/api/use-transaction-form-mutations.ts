import { useQueryClient } from '@tanstack/react-query'

import {
  getGetV1TransactionQueryKey,
  useCreateV1Transaction,
  useDeleteV1Transaction,
  useUpdateV1Transaction,
} from '@/shared/api/generated/transaction/transaction'

import type { NewTransactionFormValues } from '../model/new-transaction'
import { invalidateTransactionQueries } from './invalidate-transaction-queries'

export function useTransactionFormMutations() {
  const queryClient = useQueryClient()
  const createMutation = useCreateV1Transaction()
  const updateMutation = useUpdateV1Transaction()
  const deleteMutation = useDeleteV1Transaction()

  const create = async (form: NewTransactionFormValues) => {
    const response = await createMutation.mutateAsync({
      data: {
        transaction: {
          transaction_date: form.transactionDate,
          transaction_name: form.transactionName.trim(),
          amount: Number(form.amount),
          sign: form.sign,
          category_id: form.categoryId,
          sub_category_id: form.subcategoryId,
          fixed_flg: form.fixed,
          payment_id: form.paymentId,
        },
      },
    })
    if (response.status !== 201) {
      throw new Error('取引を保存できませんでした。もう一度お試しください。')
    }

    await invalidateTransactionQueries(queryClient)
  }
  const update = async (
    transactionId: string,
    form: NewTransactionFormValues,
  ) => {
    const response = await updateMutation.mutateAsync({
      transactionId,
      data: {
        transaction: {
          transaction_date: form.transactionDate,
          transaction_time: form.transactionTime,
          transaction_name: form.transactionName.trim(),
          amount: Number(form.amount),
          sign: form.sign,
          category_id: form.categoryId,
          sub_category_id: form.subcategoryId,
          fixed_flg: form.fixed,
          payment_id: form.paymentId,
        },
      },
    })
    if (response.status !== 200) {
      throw new Error('取引を保存できませんでした。もう一度お試しください。')
    }

    await invalidateTransactionQueries(queryClient)
    await queryClient.invalidateQueries({
      queryKey: getGetV1TransactionQueryKey(transactionId),
    })
  }
  const remove = async (transactionId: string) => {
    const response = await deleteMutation.mutateAsync({ transactionId })
    if (response.status !== 204) {
      throw new Error('取引を削除できませんでした。もう一度お試しください。')
    }

    await invalidateTransactionQueries(queryClient)
    queryClient.removeQueries({
      queryKey: getGetV1TransactionQueryKey(transactionId),
    })
  }

  return {
    create,
    update,
    remove,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
