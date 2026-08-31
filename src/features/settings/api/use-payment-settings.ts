import { useQueryClient } from '@tanstack/react-query'

import {
  getGetPaymentResourcesQueryKey,
  useAddPaymentResource,
  useDeletePaymentResource,
  useEditPaymentResource,
  useGetPaymentResources,
  useGetPaymentTypes,
} from '@/shared/api/generated/payment/payment'

export function usePaymentSettings() {
  const queryClient = useQueryClient()
  const invalidatePayments = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetPaymentResourcesQueryKey() })
  }
  const mutationOptions = { mutation: { onSuccess: invalidatePayments } }

  return {
    addMutation: useAddPaymentResource(mutationOptions),
    deleteMutation: useDeletePaymentResource(mutationOptions),
    editMutation: useEditPaymentResource(mutationOptions),
    paymentsQuery: useGetPaymentResources(),
    paymentTypesQuery: useGetPaymentTypes(),
  }
}
