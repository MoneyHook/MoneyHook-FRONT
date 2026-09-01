import { AlertCircle, LoaderCircle, WalletCards } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { useBudgetSettings } from '../api/use-budget-settings'
import { validateBudgetAmount } from '../model/budget-settings'
import { SettingsSection } from './settings-section'

const saveErrorMessage = '予算を保存できませんでした。もう一度お試しください。'

export function BudgetSettings({ showHeader = true }: { showHeader?: boolean }) {
  const { budgetQuery, currentMonth, saveMutation } = useBudgetSettings()
  const [editedAmount, setEditedAmount] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const configuredAmount =
    budgetQuery.data?.status === 200 && budgetQuery.data.data.monthly_budget_amount !== null
      ? String(budgetQuery.data.data.monthly_budget_amount)
      : ''
  const amount = editedAmount ?? configuredAmount

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const error = validateBudgetAmount(amount)
    setValidationError(error)
    if (error) {
      return
    }

    const monthlyBudgetAmount = Number(amount)
    try {
      const response = await saveMutation.mutateAsync({
        data: {
          effective_from: currentMonth,
          monthly_budget_amount: monthlyBudgetAmount,
        },
      })
      if (response.status !== 200) {
        throw new Error(saveErrorMessage)
      }

      const savedAmount = response.data.monthly_budget_amount
      setEditedAmount(savedAmount === null ? String(monthlyBudgetAmount) : String(savedAmount))
      setValidationError(null)
      toast.success('予算を保存しました。')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : saveErrorMessage)
    }
  }

  return (
    <SettingsSection
      description="毎月の支出上限を設定できます。設定は今月から適用されます。"
      icon={WalletCards}
      showHeader={showHeader}
      title="予算"
      titleId="budget-settings-title"
    >
      {budgetQuery.isPending ? (
        <div
          aria-label="予算設定を読み込んでいます"
          className="space-y-3"
          role="status"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : null}

      {budgetQuery.isError ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>予算設定を読み込めません</AlertTitle>
            <AlertDescription>
              {budgetQuery.error instanceof Error
                ? budgetQuery.error.message
                : '予算設定を取得できませんでした。'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => void budgetQuery.refetch()}
            size="lg"
            type="button"
            variant="outline"
          >
            もう一度試す
          </Button>
        </div>
      ) : null}

      {!budgetQuery.isPending && !budgetQuery.isError ? (
        <form className="space-y-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
          <div className="max-w-md space-y-2">
            <label className="text-sm font-medium" htmlFor="monthly-budget-amount">
              月額予算
            </label>
            <div className="flex items-center gap-2">
              <Input
                aria-describedby={
                  validationError
                    ? 'monthly-budget-description monthly-budget-error'
                    : 'monthly-budget-description'
                }
                aria-invalid={validationError ? true : undefined}
                className="h-10"
                disabled={saveMutation.isPending}
                id="monthly-budget-amount"
                min={1}
                onChange={(event) => {
                  setEditedAmount(event.target.value)
                  setValidationError(null)
                }}
                placeholder="例: 300000"
                step={1}
                type="number"
                value={amount}
              />
              <span className="shrink-0 text-sm font-medium">円</span>
            </div>
            <p id="monthly-budget-description" className="text-xs text-muted-foreground">
              今月1日から適用されます。
            </p>
            {validationError ? (
              <p className="text-sm text-destructive" id="monthly-budget-error" role="alert">
                {validationError}
              </p>
            ) : null}
          </div>
          <Button disabled={saveMutation.isPending} size="lg" type="submit" variant="outline">
            {saveMutation.isPending ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : null}
            予算を保存
          </Button>
        </form>
      ) : null}
    </SettingsSection>
  )
}
