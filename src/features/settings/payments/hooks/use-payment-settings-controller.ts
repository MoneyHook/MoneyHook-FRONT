import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { PaymentResourceListResponsePaymentListItem } from '@/shared/api/generated/model'
import {
  clearDefaultPaymentId,
  readDefaultPaymentId,
  writeDefaultPaymentId,
} from '@/shared/lib/default-payment'

import { usePaymentSettings } from '../api/use-payment-settings'
import type { PaymentSettingsFormValues } from '../model/payment-settings'

import type { EditorState } from '../model/payment-editor'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function usePaymentSettingsController() {
  const {
    addMutation,
    deleteMutation,
    editMutation,
    paymentsQuery,
    paymentTypesQuery,
    reorder,
    reorderMutation,
  } = usePaymentSettings()
  const [editor, setEditor] = useState<EditorState>(null)
  const [paymentToDelete, setPaymentToDelete] =
    useState<PaymentResourceListResponsePaymentListItem | null>(null)
  const [defaultPaymentId, setDefaultPaymentId] = useState(readDefaultPaymentId)
  const payments = useMemo(
    () =>
      paymentsQuery.data?.status === 200
        ? paymentsQuery.data.data.payment_list
        : [],
    [paymentsQuery.data],
  )
  const paymentTypes = useMemo(
    () =>
      paymentTypesQuery.data?.status === 200
        ? paymentTypesQuery.data.data.payment_type_list
        : [],
    [paymentTypesQuery.data],
  )
  const isLoading = paymentsQuery.isPending || paymentTypesQuery.isPending
  const hasError = paymentsQuery.isError || paymentTypesQuery.isError
  const isSaving = addMutation.isPending || editMutation.isPending

  useEffect(() => {
    if (
      !defaultPaymentId ||
      paymentsQuery.data?.status !== 200 ||
      payments.some((payment) => payment.payment_id === defaultPaymentId)
    ) {
      return
    }

    clearDefaultPaymentId()
    // The fetched payment list invalidates the locally stored selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaultPaymentId(null)
  }, [defaultPaymentId, payments, paymentsQuery.data])

  const savePayment = async (values: PaymentSettingsFormValues) => {
    const paymentType = paymentTypes.find(
      (type) => type.payment_type_id === values.paymentTypeId,
    )
    const dates = paymentType?.is_payment_due_later
      ? {
          closing_date: Number(values.closingDate),
          payment_date: Number(values.paymentDate),
        }
      : {}
    try {
      const response =
        editor?.mode === 'edit'
          ? await editMutation.mutateAsync({
              data: {
                payment_id: editor.payment.payment_id,
                payment_name: values.paymentName.trim(),
                payment_type_id: values.paymentTypeId,
                ...dates,
              },
            })
          : await addMutation.mutateAsync({
              data: {
                payment_name: values.paymentName.trim(),
                payment_type_id: values.paymentTypeId,
                ...dates,
              },
            })
      if (response.status !== 200)
        throw new Error('支払い方法を保存できませんでした。')
      toast.success(
        editor?.mode === 'edit'
          ? '支払い方法を更新しました。'
          : '支払い方法を追加しました。',
      )
      setEditor(null)
    } catch (error) {
      toast.error(errorMessage(error, '支払い方法を保存できませんでした。'))
    }
  }

  const deletePayment = async () => {
    if (!paymentToDelete) return
    try {
      const response = await deleteMutation.mutateAsync({
        paymentId: paymentToDelete.payment_id,
      })
      if (response.status !== 200)
        throw new Error('支払い方法を削除できませんでした。')
      if (paymentToDelete.payment_id === defaultPaymentId) {
        clearDefaultPaymentId()
        setDefaultPaymentId(null)
      }
      setPaymentToDelete(null)
      toast.success('支払い方法を削除しました。')
    } catch (error) {
      toast.error(errorMessage(error, '支払い方法を削除できませんでした。'))
    }
  }

  const changeDefaultPayment = (value: string) => {
    if (value === 'none') {
      clearDefaultPaymentId()
      setDefaultPaymentId(null)
      return
    }

    writeDefaultPaymentId(value)
    setDefaultPaymentId(value)
  }

  const reorderPayments = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || reorderMutation.isPending) return
    const oldIndex = payments.findIndex(
      (payment) => payment.payment_id === active.id,
    )
    const newIndex = payments.findIndex(
      (payment) => payment.payment_id === over.id,
    )
    if (oldIndex < 0 || newIndex < 0) return
    const nextPayments = arrayMove(payments, oldIndex, newIndex)
    try {
      await reorder(nextPayments)
    } catch (error) {
      toast.error(
        errorMessage(error, '支払い方法の並べ替えを保存できませんでした。'),
      )
    }
  }

  return {
    editor,
    setEditor,
    paymentToDelete,
    setPaymentToDelete,
    defaultPaymentId,
    payments,
    paymentTypes,
    isLoading,
    hasError,
    isSaving,
    savePayment,
    deletePayment,
    changeDefaultPayment,
    reorderPayments,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
    error: errorMessage(
      paymentsQuery.error ?? paymentTypesQuery.error,
      '支払い方法を取得できませんでした。',
    ),
    retry: () => {
      void paymentsQuery.refetch()
      void paymentTypesQuery.refetch()
    },
  }
}
