import { AlertCircle, LoaderCircle, Plus, Repeat2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { useRecurringTransactionSettings } from '../api/use-recurring-transaction-settings'
import { createRecurringTransactionValues, type RecurringTransactionFormValues, type RecurringTransactionRule } from '../model/recurring-transaction-settings'
import { RecurringTransactionRuleEditor } from './recurring-transaction-rule-editor'
import { RecurringTransactionRuleList } from './recurring-transaction-rule-list'
import { SettingsSection } from './settings-section'

type EditorState =
  | { include: boolean; mode: 'add'; rule: null }
  | { include: boolean; mode: 'edit'; rule: RecurringTransactionRule }
  | null

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function valuesFromRule(rule: RecurringTransactionRule): RecurringTransactionFormValues {
  return { amount: String(rule.monthly_transaction_amount), categoryId: rule.category_id, day: String(rule.monthly_transaction_date), paymentId: rule.payment_id, sign: rule.monthly_transaction_sign, subcategoryId: rule.sub_category_id, transactionName: rule.monthly_transaction_name }
}

function rulePayload(rule: RecurringTransactionRule, include: boolean) {
  return {
    category_id: rule.category_id,
    include_flg: include,
    monthly_transaction_amount: rule.monthly_transaction_amount,
    monthly_transaction_date: rule.monthly_transaction_date,
    monthly_transaction_id: rule.monthly_transaction_id,
    monthly_transaction_name: rule.monthly_transaction_name,
    monthly_transaction_sign: rule.monthly_transaction_sign,
    payment_id: rule.payment_id ?? '',
    sub_category_id: rule.sub_category_id,
  }
}

export function RecurringTransactionSettings({ showHeader = true }: { showHeader?: boolean }) {
  const settings = useRecurringTransactionSettings()
  const [editor, setEditor] = useState<EditorState>(null)
  const [ruleToDelete, setRuleToDelete] = useState<RecurringTransactionRule | null>(null)
  const activeRules = settings.activeRulesQuery.data?.status === 200 ? settings.activeRulesQuery.data.data.monthly_transaction_list : []
  const pausedRules = settings.pausedRulesQuery.data?.status === 200 ? settings.pausedRulesQuery.data.data : []
  const categories = settings.categoriesQuery.data?.status === 200 ? settings.categoriesQuery.data.data.category_list ?? [] : []
  const payments = settings.paymentsQuery.data?.status === 200 ? settings.paymentsQuery.data.data.payment_list : []
  const isLoading = settings.activeRulesQuery.isPending || settings.pausedRulesQuery.isPending || settings.categoriesQuery.isPending || settings.paymentsQuery.isPending
  const hasError = settings.activeRulesQuery.isError || settings.pausedRulesQuery.isError || settings.categoriesQuery.isError || settings.paymentsQuery.isError
  const isSaving = settings.addMutation.isPending || settings.editMutation.isPending
  const error = settings.activeRulesQuery.error ?? settings.pausedRulesQuery.error ?? settings.categoriesQuery.error ?? settings.paymentsQuery.error

  const saveRule = async (values: RecurringTransactionFormValues) => {
    try {
      const monthlyTransaction = { category_id: values.categoryId, monthly_transaction_amount: Number(values.amount), monthly_transaction_date: Number(values.day), monthly_transaction_name: values.transactionName.trim(), monthly_transaction_sign: values.sign, payment_id: values.paymentId ?? '', sub_category_id: values.subcategoryId }
      const response = editor?.mode === 'edit'
        ? await settings.editMutation.mutateAsync({ data: { monthly_transaction: { ...monthlyTransaction, include_flg: editor.include, monthly_transaction_id: editor.rule.monthly_transaction_id } } })
        : await settings.addMutation.mutateAsync({ data: { monthly_transaction: monthlyTransaction } })
      if (response.status !== 200) throw new Error('自動入力を保存できませんでした。')
      toast.success(editor?.mode === 'edit' ? '自動入力を更新しました。' : '自動入力を追加しました。')
      setEditor(null)
    } catch (saveError) {
      toast.error(errorMessage(saveError, '自動入力を保存できませんでした。'))
    }
  }

  const setIncluded = async (rule: RecurringTransactionRule, include: boolean) => {
    try {
      const response = await settings.editMutation.mutateAsync({ data: { monthly_transaction: rulePayload(rule, include) } })
      if (response.status !== 200) throw new Error(include ? '自動入力を再開できませんでした。' : '自動入力を停止できませんでした。')
      toast.success(include ? '自動入力を再開しました。' : '自動入力を停止しました。')
    } catch (updateError) {
      toast.error(errorMessage(updateError, include ? '自動入力を再開できませんでした。' : '自動入力を停止できませんでした。'))
    }
  }

  const deleteRule = async () => {
    if (!ruleToDelete) return
    try {
      const response = await settings.deleteMutation.mutateAsync({ monthlyTransactionId: ruleToDelete.monthly_transaction_id })
      if (response.status !== 200) throw new Error('自動入力を削除できませんでした。')
      toast.success('自動入力を完全に削除しました。')
      setRuleToDelete(null)
    } catch (deleteError) {
      toast.error(errorMessage(deleteError, '自動入力を削除できませんでした。'))
    }
  }

  const retry = () => {
    void settings.activeRulesQuery.refetch()
    void settings.pausedRulesQuery.refetch()
    void settings.categoriesQuery.refetch()
    void settings.paymentsQuery.refetch()
  }

  return (
    <SettingsSection action={<Button disabled={isLoading || hasError} onClick={() => setEditor({ include: true, mode: 'add', rule: null })} size="lg" type="button" variant="outline"><Plus aria-hidden="true" />自動入力を追加</Button>} description="指定日に毎月の収入・支出を自動登録します。保存済みの取引履歴は変更しません。" icon={Repeat2} showHeader={showHeader} title="収支の自動入力" titleId="recurring-transaction-settings-title">
      {isLoading ? <div aria-label="自動入力を読み込んでいます" className="space-y-3" role="status"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : null}
      {hasError ? <div className="space-y-4"><Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>自動入力を読み込めません</AlertTitle><AlertDescription>{errorMessage(error, '自動入力の設定を取得できませんでした。')}</AlertDescription></Alert><Button onClick={retry} size="lg" type="button" variant="outline">もう一度試す</Button></div> : null}
      {!isLoading && !hasError ? <div className="space-y-6">
        <div className="space-y-3"><div><h3 className="font-medium">有効な自動入力</h3><p className="mt-1 text-sm text-muted-foreground">指定日の日次処理で取引を作成します。</p></div><RecurringTransactionRuleList emptyMessage="有効な自動入力はありません。" isPaused={false} onDelete={setRuleToDelete} onEdit={(rule) => setEditor({ include: true, mode: 'edit', rule })} onSetIncluded={setIncluded} payments={payments} rules={activeRules} /></div>
        <div className="space-y-3 border-t pt-5"><div><h3 className="font-medium">停止中</h3><p className="mt-1 text-sm text-muted-foreground">再開するまで新しい取引は自動作成されません。</p></div><RecurringTransactionRuleList emptyMessage="停止中の自動入力はありません。" isPaused onDelete={setRuleToDelete} onEdit={(rule) => setEditor({ include: false, mode: 'edit', rule })} onSetIncluded={setIncluded} payments={payments} rules={pausedRules} /></div>
      </div> : null}
      <Dialog onOpenChange={(open) => !open && !isSaving && setEditor(null)} open={editor !== null}>
        {editor ? (
          <DialogContent className="max-w-lg">
            <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <DialogTitle>
                  {editor.mode === 'add' ? '自動入力を追加' : '自動入力を編集'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  収支区分、取引名、金額、入力日、カテゴリ、支払い方法を入力します。
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button aria-label="編集を閉じる" disabled={isSaving} size="icon-sm" type="button" variant="ghost">
                  <X aria-hidden="true" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <RecurringTransactionRuleEditor categories={categories} initialValues={editor.mode === 'edit' ? valuesFromRule(editor.rule) : createRecurringTransactionValues()} isEdit={editor.mode === 'edit'} isSaving={isSaving} key={editor.mode === 'edit' ? editor.rule.monthly_transaction_id : 'add'} onCancel={() => setEditor(null)} onSave={saveRule} payments={payments} />
          </DialogContent>
        ) : null}
      </Dialog>
      <AlertDialog onOpenChange={(open) => !open && setRuleToDelete(null)} open={ruleToDelete !== null}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>自動入力を完全に削除しますか？</AlertDialogTitle><AlertDialogDescription>「{ruleToDelete?.monthly_transaction_name}」を完全に削除します。この操作は取り消せません。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={settings.deleteMutation.isPending}>キャンセル</AlertDialogCancel><AlertDialogAction disabled={settings.deleteMutation.isPending} onClick={(event) => { event.preventDefault(); void deleteRule() }}>{settings.deleteMutation.isPending ? <LoaderCircle aria-hidden="true" className="mr-1.5 size-4 animate-spin" /> : null}完全に削除する</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SettingsSection>
  )
}
