import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AlertCircle, CreditCard, LoaderCircle, Plus, WalletCards, X } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { SettingsSection } from '../../components/settings-section'

import { usePaymentSettingsController } from '../hooks/use-payment-settings-controller'
import { PaymentForm } from './payment-form'
import { SortablePaymentRow } from './sortable-payment-row'

export function PaymentSettings({ showHeader = true }: { showHeader?: boolean }) {
  const {
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
    isDeleting,
    isReordering,
    error,
    retry,
  } = usePaymentSettingsController()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  return (
    <SettingsSection
      action={
        <Button
          disabled={isLoading || hasError}
          onClick={() => setEditor({ mode: 'add', payment: null })}
          size="lg"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" />
          支払い方法を追加
        </Button>
      }
      description="取引に使う支払い方法を管理できます。カードは締め日と支払日も設定できます。"
      icon={WalletCards}
      showHeader={showHeader}
      title="支払い方法"
      titleId="payment-settings-title"
    >
      {isLoading ? (
        <div aria-label="支払い方法を読み込んでいます" className="space-y-3" role="status">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}
      {hasError ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>支払い方法を読み込めません</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={retry} size="lg" type="button" variant="outline">
            もう一度試す
          </Button>
        </div>
      ) : null}
      {!isLoading && !hasError ? (
        <div className="space-y-5">
          <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
            <label className="text-sm font-medium" htmlFor="default-payment">
              デフォルトの支払い方法
            </label>
            <p className="text-sm text-muted-foreground">
              新しい取引を追加するときに、最初から選択する支払い方法です。
            </p>
            <Select onValueChange={changeDefaultPayment} value={defaultPaymentId ?? 'none'}>
              <SelectTrigger
                aria-label="デフォルトの支払い方法"
                className="w-full sm:max-w-sm"
                id="default-payment"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">設定しない</SelectItem>
                {payments.map((payment) => (
                  <SelectItem key={payment.payment_id} value={payment.payment_id}>
                    {payment.payment_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {payments.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center">
              <CreditCard
                aria-hidden="true"
                className="mx-auto mb-3 size-6 text-muted-foreground"
              />
              <p className="font-medium">支払い方法がありません</p>
              <p className="mt-1 text-sm text-muted-foreground">
                追加すると、取引の登録時に選択できます。
              </p>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) => void reorderPayments(event)}
              sensors={sensors}
            >
              <SortableContext
                items={payments.map((payment) => payment.payment_id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y overflow-hidden rounded-xl border">
                  {payments.map((payment) => (
                    <SortablePaymentRow
                      isDeleting={isDeleting}
                      isReordering={isReordering}
                      key={payment.payment_id}
                      onDelete={setPaymentToDelete}
                      onEdit={(item) => setEditor({ mode: 'edit', payment: item })}
                      payment={payment}
                      paymentTypes={paymentTypes}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ) : null}
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
                <Button
                  aria-label="編集を閉じる"
                  disabled={isSaving}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <PaymentForm
              editor={editor}
              isSaving={isSaving}
              key={editor.mode === 'edit' ? editor.payment.payment_id : 'add'}
              onCancel={() => setEditor(null)}
              onSave={savePayment}
              paymentTypes={paymentTypes}
            />
          </DialogContent>
        ) : null}
      </Dialog>
      <AlertDialog
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        open={paymentToDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>支払い方法を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{paymentToDelete?.payment_name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void deletePayment()
              }}
            >
              {isDeleting ? (
                <LoaderCircle aria-hidden="true" className="mr-1.5 size-4 animate-spin" />
              ) : null}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
