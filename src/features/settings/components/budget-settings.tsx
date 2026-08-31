import { AlertCircle, LoaderCircle, WalletCards } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { useBudgetSettings } from '../api/use-budget-settings'
import { validateBudgetAmount } from '../model/budget-settings'

const saveErrorMessage = '予算を保存できませんでした。もう一度お試しください。'

export function BudgetSettings() {
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
    <section
      aria-labelledby="budget-settings-title"
      className="max-w-5xl rounded-2xl border bg-card p-5 sm:p-6"
    >
      <header className="flex items-start justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <h2 id="budget-settings-title" className="text-lg font-semibold">
            予算
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            毎月の支出上限を設定できます。設定は今月から適用されます。
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <WalletCards aria-hidden="true" className="size-5" />
        </span>
      </header>

      {budgetQuery.isPending ? (
        <div
          aria-label="予算設定を読み込んでいます"
          className="space-y-3 pt-5"
          role="status"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : null}

      {budgetQuery.isError ? (
        <div className="space-y-4 pt-5">
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>予算設定を読み込めません</AlertTitle>
            <AlertDescription>
              {budgetQuery.error instanceof Error
                ? budgetQuery.error.message
                : '予算設定を取得できませんでした。'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => void budgetQuery.refetch()} type="button" variant="outline">
            もう一度試す
          </Button>
        </div>
      ) : null}

      {!budgetQuery.isPending && !budgetQuery.isError ? (
        <form className="space-y-5 pt-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
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
          <Button disabled={saveMutation.isPending} type="submit">
            {saveMutation.isPending ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : null}
            予算を保存
          </Button>
        </form>
      ) : null}
    </section>
  )
}
