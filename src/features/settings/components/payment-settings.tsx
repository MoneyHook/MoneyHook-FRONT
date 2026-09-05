import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle,
  Banknote,
  CreditCard,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import type {
  PaymentResourceListResponsePaymentListItem,
  PaymentTypeListResponsePaymentTypeListItem,
} from '@/shared/api/generated/model'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { getPaymentIconSource } from '@/shared/lib/payment-icon'
import { getGetPaymentResourcesQueryKey } from '@/shared/api/generated/payment/payment'

import { usePaymentSettings } from '../api/use-payment-settings'
import {
  validatePaymentSettings,
  type PaymentSettingsFormErrors,
  type PaymentSettingsFormValues,
} from '../model/payment-settings'
import { SettingsSection } from './settings-section'

type EditorState =
  | { mode: 'add'; payment: null }
  | { mode: 'edit'; payment: PaymentResourceListResponsePaymentListItem }
  | null

const initialFormValues = (paymentTypeId = ''): PaymentSettingsFormValues => ({
  closingDate: '',
  paymentDate: '',
  paymentName: '',
  paymentTypeId,
})

function formValuesFromPayment(
  payment: PaymentResourceListResponsePaymentListItem,
): PaymentSettingsFormValues {
  return {
    closingDate: String(payment.closing_date),
    paymentDate: payment.payment_date === null ? '' : String(payment.payment_date),
    paymentName: payment.payment_name,
    paymentTypeId: payment.payment_type_id,
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function PaymentTypeIcon({ paymentTypeName }: { paymentTypeName: string }) {
  if (paymentTypeName.includes('カード')) {
    return <CreditCard aria-hidden="true" className="size-4" />
  }
  if (paymentTypeName.includes('QR')) {
    return <QrCode aria-hidden="true" className="size-4" />
  }
  return <Banknote aria-hidden="true" className="size-4" />
}

function SortablePaymentRow({
  payment,
  paymentTypes,
  onEdit,
  onDelete,
  isDeleting,
  isReordering,
}: {
  payment: PaymentResourceListResponsePaymentListItem
  paymentTypes: PaymentTypeListResponsePaymentTypeListItem[]
  onEdit: (payment: PaymentResourceListResponsePaymentListItem) => void
  onDelete: (payment: PaymentResourceListResponsePaymentListItem) => void
  isDeleting: boolean
  isReordering: boolean
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id: payment.payment_id })
  const type = paymentTypes.find((item) => item.payment_type_id === payment.payment_type_id)
  const iconSource = getPaymentIconSource({ paymentName: payment.payment_name, paymentTypeName: type?.payment_type_name })

  return (
    <li
      className={cn('flex items-center gap-3 bg-card px-4 py-3', isDragging && 'z-10 opacity-50 shadow-lg')}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        aria-label={`${payment.payment_name}を並べ替え`}
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        disabled={isReordering}
        ref={setActivatorNodeRef}
        size="icon-sm"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      {iconSource ? <img alt="" className="size-9 shrink-0 rounded-lg" height="36" src={iconSource} width="36" /> : <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CreditCard aria-hidden="true" className="size-4" /></span>}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{payment.payment_name}</p><p className="text-sm text-muted-foreground">{type?.payment_type_name ?? '未分類'}{type?.is_payment_due_later && payment.payment_date !== null ? ` ・ 締め日 ${payment.closing_date}日 / 支払日 ${payment.payment_date}日` : ''}</p></div>
      <div className="flex shrink-0 gap-1"><Button aria-label={`${payment.payment_name}を編集`} disabled={isReordering} onClick={() => onEdit(payment)} size="icon-sm" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`${payment.payment_name}を削除`} disabled={isDeleting || isReordering} onClick={() => onDelete(payment)} size="icon-sm" type="button" variant="destructive"><Trash2 aria-hidden="true" /></Button></div>
    </li>
  )
}

function PaymentForm({
  editor,
  paymentTypes,
  onCancel,
  onSave,
  isSaving,
}: {
  editor: Exclude<EditorState, null>
  paymentTypes: PaymentTypeListResponsePaymentTypeListItem[]
  onCancel: () => void
  onSave: (values: PaymentSettingsFormValues, errors: PaymentSettingsFormErrors) => Promise<void>
  isSaving: boolean
}) {
  const [values, setValues] = useState(() =>
    editor.mode === 'edit'
      ? formValuesFromPayment(editor.payment)
      : initialFormValues(paymentTypes[0]?.payment_type_id),
  )
  const [errors, setErrors] = useState<PaymentSettingsFormErrors>({})
  const selectedType = paymentTypes.find((type) => type.payment_type_id === values.paymentTypeId)

  const update = (key: keyof PaymentSettingsFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validatePaymentSettings(values, selectedType)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    await onSave(values, nextErrors)
  }

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="payment-name">
            支払い方法名
          </label>
          <Input
            aria-invalid={errors.paymentName ? true : undefined}
            disabled={isSaving}
            id="payment-name"
            maxLength={32}
            onChange={(event) => update('paymentName', event.target.value)}
            placeholder="例: 楽天カード"
            value={values.paymentName}
          />
          {errors.paymentName ? <p className="text-sm text-destructive" role="alert">{errors.paymentName}</p> : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">支払いの種類</legend>
        <div aria-label="支払いの種類" className="grid grid-cols-3 gap-2" role="radiogroup">
          {paymentTypes.map((type) => {
            const isSelected = values.paymentTypeId === type.payment_type_id

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  isSelected && 'border-primary bg-primary/5 text-primary',
                )}
                disabled={isSaving}
                key={type.payment_type_id}
                onClick={() => update('paymentTypeId', type.payment_type_id)}
                role="radio"
                type="button"
              >
                <PaymentTypeIcon paymentTypeName={type.payment_type_name} />
                <span className="truncate">{type.payment_type_name}</span>
              </button>
            )
          })}
        </div>
        {errors.paymentTypeId ? <p className="text-sm text-destructive" role="alert">{errors.paymentTypeId}</p> : null}
      </fieldset>

      {selectedType?.is_payment_due_later ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="closing-date">締め日</label>
            <div className="flex items-center gap-2"><Input aria-invalid={errors.closingDate ? true : undefined} disabled={isSaving} id="closing-date" inputMode="numeric" max={31} min={1} onChange={(event) => update('closingDate', event.target.value)} type="number" value={values.closingDate} /><span className="text-sm text-muted-foreground">日</span></div>
            {errors.closingDate ? <p className="text-sm text-destructive" role="alert">{errors.closingDate}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="payment-date">支払日</label>
            <div className="flex items-center gap-2"><Input aria-invalid={errors.paymentDate ? true : undefined} disabled={isSaving} id="payment-date" inputMode="numeric" max={31} min={1} onChange={(event) => update('paymentDate', event.target.value)} type="number" value={values.paymentDate} /><span className="text-sm text-muted-foreground">日</span></div>
            {errors.paymentDate ? <p className="text-sm text-destructive" role="alert">{errors.paymentDate}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="outline">キャンセル</Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {editor.mode === 'add' ? '追加する' : '保存する'}
        </Button>
      </div>
    </form>
  )
}

export function PaymentSettings({ showHeader = true }: { showHeader?: boolean }) {
  const { addMutation, deleteMutation, editMutation, paymentsQuery, paymentTypesQuery, queryClient, reorderMutation } = usePaymentSettings()
  const [editor, setEditor] = useState<EditorState>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentResourceListResponsePaymentListItem | null>(null)
  const payments = paymentsQuery.data?.status === 200 ? paymentsQuery.data.data.payment_list : []
  const paymentTypes = paymentTypesQuery.data?.status === 200 ? paymentTypesQuery.data.data.payment_type_list : []
  const isLoading = paymentsQuery.isPending || paymentTypesQuery.isPending
  const hasError = paymentsQuery.isError || paymentTypesQuery.isError
  const isSaving = addMutation.isPending || editMutation.isPending
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const savePayment = async (values: PaymentSettingsFormValues) => {
    const paymentType = paymentTypes.find((type) => type.payment_type_id === values.paymentTypeId)
    const dates = paymentType?.is_payment_due_later
      ? { closing_date: Number(values.closingDate), payment_date: Number(values.paymentDate) }
      : {}
    try {
      const response = editor?.mode === 'edit'
        ? await editMutation.mutateAsync({ data: { payment_id: editor.payment.payment_id, payment_name: values.paymentName.trim(), payment_type_id: values.paymentTypeId, ...dates } })
        : await addMutation.mutateAsync({ data: { payment_name: values.paymentName.trim(), payment_type_id: values.paymentTypeId, ...dates } })
      if (response.status !== 200) throw new Error('支払い方法を保存できませんでした。')
      toast.success(editor?.mode === 'edit' ? '支払い方法を更新しました。' : '支払い方法を追加しました。')
      setEditor(null)
    } catch (error) {
      toast.error(errorMessage(error, '支払い方法を保存できませんでした。'))
    }
  }

  const deletePayment = async () => {
    if (!paymentToDelete) return
    try {
      const response = await deleteMutation.mutateAsync({ paymentId: paymentToDelete.payment_id })
      if (response.status !== 200) throw new Error('支払い方法を削除できませんでした。')
      setPaymentToDelete(null)
      toast.success('支払い方法を削除しました。')
    } catch (error) {
      toast.error(errorMessage(error, '支払い方法を削除できませんでした。'))
    }
  }

  const reorderPayments = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || reorderMutation.isPending) return
    const oldIndex = payments.findIndex((payment) => payment.payment_id === active.id)
    const newIndex = payments.findIndex((payment) => payment.payment_id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const nextPayments = arrayMove(payments, oldIndex, newIndex)
    const queryKey = getGetPaymentResourcesQueryKey()
    const previousData = queryClient.getQueryData(paymentsQuery.queryKey)
    queryClient.setQueryData(queryKey, (current: typeof paymentsQuery.data) => current?.status === 200
      ? { ...current, data: { ...current.data, payment_list: nextPayments } }
      : current)
    try {
      const response = await reorderMutation.mutateAsync({ data: { payment_ids: nextPayments.map((payment) => payment.payment_id) } })
      if (response.status !== 200) throw new Error('支払い方法の並べ替えを保存できませんでした。')
      await queryClient.invalidateQueries({ queryKey })
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData)
      toast.error(errorMessage(error, '支払い方法の並べ替えを保存できませんでした。'))
    }
  }

  return (
    <SettingsSection
      action={<Button disabled={isLoading || hasError} onClick={() => setEditor({ mode: 'add', payment: null })} size="lg" type="button" variant="outline"><Plus aria-hidden="true" />支払い方法を追加</Button>}
      description="取引に使う支払い方法を管理できます。カードは締め日と支払日も設定できます。"
      icon={WalletCards}
      showHeader={showHeader}
      title="支払い方法"
      titleId="payment-settings-title"
    >
      {isLoading ? <div aria-label="支払い方法を読み込んでいます" className="space-y-3" role="status"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : null}
      {hasError ? <div className="space-y-4"><Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>支払い方法を読み込めません</AlertTitle><AlertDescription>{errorMessage(paymentsQuery.error ?? paymentTypesQuery.error, '支払い方法を取得できませんでした。')}</AlertDescription></Alert><Button onClick={() => { void paymentsQuery.refetch(); void paymentTypesQuery.refetch() }} size="lg" type="button" variant="outline">もう一度試す</Button></div> : null}
      {!isLoading && !hasError ? <div className="space-y-5">
        {payments.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-8 text-center"><CreditCard aria-hidden="true" className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">支払い方法がありません</p><p className="mt-1 text-sm text-muted-foreground">追加すると、取引の登録時に選択できます。</p></div> : <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void reorderPayments(event)} sensors={sensors}><SortableContext items={payments.map((payment) => payment.payment_id)} strategy={verticalListSortingStrategy}><ul className="divide-y overflow-hidden rounded-xl border">
          {payments.map((payment) => <SortablePaymentRow isDeleting={deleteMutation.isPending} isReordering={reorderMutation.isPending} key={payment.payment_id} onDelete={setPaymentToDelete} onEdit={(item) => setEditor({ mode: 'edit', payment: item })} payment={payment} paymentTypes={paymentTypes} />)}
        </ul></SortableContext></DndContext>}
      </div> : null}
      <Dialog onOpenChange={(open) => !open && !isSaving && setEditor(null)} open={editor !== null}>
        {editor ? (
          <DialogContent>
            <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <DialogTitle>
                  {editor.mode === 'add' ? '支払い方法を追加' : '支払い方法を編集'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  支払い方法の名前、種類、締め日、支払日を入力します。
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button aria-label="編集を閉じる" disabled={isSaving} size="icon-sm" type="button" variant="ghost">
                  <X aria-hidden="true" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <PaymentForm editor={editor} isSaving={isSaving} key={editor.mode === 'edit' ? editor.payment.payment_id : 'add'} onCancel={() => setEditor(null)} onSave={savePayment} paymentTypes={paymentTypes} />
          </DialogContent>
        ) : null}
      </Dialog>
      <AlertDialog onOpenChange={(open) => !open && setPaymentToDelete(null)} open={paymentToDelete !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>支払い方法を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{paymentToDelete?.payment_name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); void deletePayment() }}>
              {deleteMutation.isPending ? <LoaderCircle aria-hidden="true" className="mr-1.5 size-4 animate-spin" /> : null}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
