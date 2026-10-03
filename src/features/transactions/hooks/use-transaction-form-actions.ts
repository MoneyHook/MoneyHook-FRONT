import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { toast } from 'sonner'

import type { V1TransactionResource } from '@/shared/api/generated/model'

import type { useTransactionFormMutations } from '../api/use-transaction-form-mutations'
import type { TransactionFormExtension } from '../model/form-extension'
import {
  type NewTransactionErrors,
  type NewTransactionFormValues,
  validateNewTransaction,
} from '../model/new-transaction'
import { getTransactionMonth } from '../model/transaction-form'
type Props = {
  form: NewTransactionFormValues
  setErrors: Dispatch<SetStateAction<NewTransactionErrors>>
  isEdit: boolean
  transactionId?: string
  transaction: V1TransactionResource | null
  expectedVersion?: number
  mutations: ReturnType<typeof useTransactionFormMutations>
  navigate: NavigateFunction
  returnTo: string
  setDeleteDialogOpen: Dispatch<SetStateAction<boolean>>
  extension: TransactionFormExtension
}
export function useTransactionFormActions({
  form,
  setErrors,
  isEdit,
  transactionId,
  transaction,
  expectedVersion,
  mutations,
  navigate,
  returnTo,
  setDeleteDialogOpen,
  extension,
}: Props) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (extension.isBlocked || extension.isSaving || mutations.isSaving) return
    const nextErrors = validateNewTransaction(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const formElement = event.currentTarget
      requestAnimationFrame(() => {
        const firstInvalid = formElement.querySelector<HTMLElement>(
          '[aria-invalid="true"]',
        )
        firstInvalid?.focus()
        firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      return
    }

    try {
      if (isEdit && transactionId) {
        if (
          transaction?.shared &&
          !window.confirm(
            'この取引は家族に共有中です。変更内容は家族の記録・集計にも反映されます。更新しますか？',
          )
        )
          return
        await mutations.update(transactionId, form, expectedVersion)
        toast.success('取引を更新しました。')
        navigate(returnTo, { replace: true })
        return
      }

      if (extension.onCreate) {
        await extension.onCreate(form)
        return
      }
      await mutations.create(form)
      const month = getTransactionMonth(form.transactionDate)
      toast.success('取引を保存しました。')
      navigate(`/app/transactions?month=${month}&view=list`, { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '取引を保存できませんでした。',
      )
    }
  }

  const handleDelete = async () => {
    if (!transactionId || !transaction) {
      return
    }

    try {
      await mutations.remove(transactionId, expectedVersion)
      setDeleteDialogOpen(false)
      toast.success('取引を削除しました。')
      navigate(returnTo, { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '取引を削除できませんでした。',
      )
    }
  }

  return { handleSubmit, handleDelete }
}
