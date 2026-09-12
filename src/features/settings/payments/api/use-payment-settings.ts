import type { PaymentResourceListResponsePaymentListItem } from '@/shared/api/generated/model'

import { useQueryClient } from '@tanstack/react-query'

import {
  getGetPaymentResourcesQueryKey,
  useAddPaymentResource,
  useDeletePaymentResource,
  useEditPaymentResource,
  useGetPaymentResources,
  useGetPaymentTypes,
  useReorderPaymentResources,
} from '@/shared/api/generated/payment/payment'

export function usePaymentSettings() {
  const queryClient = useQueryClient()
  const invalidatePayments = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetPaymentResourcesQueryKey(),
    })
  }
  const mutationOptions = { mutation: { onSuccess: invalidatePayments } }

  const paymentsQuery = useGetPaymentResources()
  const reorderMutation = useReorderPaymentResources()
  const reorder = async (
    nextPayments: PaymentResourceListResponsePaymentListItem[],
  ) => {
    const queryKey = getGetPaymentResourcesQueryKey()
    const previousData = queryClient.getQueryData(paymentsQuery.queryKey)
    queryClient.setQueryData(queryKey, (current: typeof paymentsQuery.data) =>
      current?.status === 200
        ? { ...current, data: { ...current.data, payment_list: nextPayments } }
        : current,
    )
    try {
      const response = await reorderMutation.mutateAsync({
        data: {
          payment_ids: nextPayments.map((payment) => payment.payment_id),
        },
      })
      if (response.status !== 200)
        throw new Error('支払い方法の並べ替えを保存できませんでした。')
      await invalidatePayments()
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData)
      throw error
    }
  }

  return {
    addMutation: useAddPaymentResource(mutationOptions),
    deleteMutation: useDeletePaymentResource(mutationOptions),
    editMutation: useEditPaymentResource(mutationOptions),
    paymentsQuery,
    paymentTypesQuery: useGetPaymentTypes(),
    reorder,
    reorderMutation,
  }
}
