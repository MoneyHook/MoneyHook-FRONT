import {
  ChevronRight,
  CircleUserRound,
  Monitor,
  Repeat2,
  WalletCards,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth'
import { useGetV1Budget } from '@/shared/api/generated/budget/budget'
import { useGetDeletedFixed, useGetFixed } from '@/shared/api/generated/fixed/fixed'
import { useGetPaymentResources } from '@/shared/api/generated/payment/payment'
import { useAccent } from '@/shared/hooks/accent-context'
import { useChartPalette } from '@/shared/hooks/chart-palette-context'

import { getCurrentMonthStart } from '../model/budget-settings'

type SummaryCardProps = {
  description: string
  icon: typeof CircleUserRound
  title: string
  to: string
  value: string
}

const themeLabels = {
  dark: 'ダークテーマ',
  light: 'ライトテーマ',
  system: 'システム設定に合わせる',
} as const

const accentLabels = {
  black: 'ブラック',
  blue: 'ブルー',
  green: 'グリーン',
  rose: 'ローズ',
  violet: 'バイオレット',
} as const

const chartPaletteLabels = {
  colorful: 'カラフル',
  default: '標準',
  monochrome: 'モノトーン',
} as const

function SummaryCard({ description, icon: Icon, title, to, value }: SummaryCardProps) {
  return (
    <Link
      aria-label={`${title}の設定を開く`}
      className="group flex min-h-25 items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left outline-none transition-[background-color,border-color,transform] hover:-translate-y-px hover:border-foreground/15 hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-5"
      to={to}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block truncate text-base font-semibold tracking-[-0.025em] sm:text-lg">
          {value}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

export function SettingsSummary() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { accent } = useAccent()
  const { chartPalette } = useChartPalette()
  const budgetQuery = useGetV1Budget({ month: getCurrentMonthStart() })
  const paymentsQuery = useGetPaymentResources()
  const activeRulesQuery = useGetFixed()
  const pausedRulesQuery = useGetDeletedFixed()
  const payments = paymentsQuery.data?.status === 200 ? paymentsQuery.data.data.payment_list : []
  const budgetAmount =
    budgetQuery.data?.status === 200 ? budgetQuery.data.data.monthly_budget_amount : null
  const budgetValue = budgetQuery.isPending
    ? '読み込み中'
    : budgetQuery.isError
      ? '取得できませんでした'
      : budgetAmount === null || budgetAmount === undefined
        ? '未設定'
        : `¥${budgetAmount.toLocaleString('ja-JP')}`
  const activeRules =
    activeRulesQuery.data?.status === 200
      ? activeRulesQuery.data.data.monthly_transaction_list
      : []
  const pausedRules = pausedRulesQuery.data?.status === 200 ? pausedRulesQuery.data.data : []
  const paymentValue = paymentsQuery.isPending
    ? '読み込み中'
    : paymentsQuery.isError
      ? '取得できませんでした'
      : payments.length === 0
        ? '未登録'
        : `${payments.length}件登録済み`
  const paymentDescription = payments.length
    ? payments.slice(0, 3).map((payment) => payment.payment_name).join(' ・ ')
    : '取引で使う支払い方法を管理します。'
  const recurringValue = activeRulesQuery.isPending || pausedRulesQuery.isPending
    ? '読み込み中'
    : activeRulesQuery.isError || pausedRulesQuery.isError
      ? '取得できませんでした'
      : `有効 ${activeRules.length}件 ・ 停止中 ${pausedRules.length}件`

  return (
    <div className="space-y-3" role="list">
      <SummaryCard
        description={user?.email ?? 'ログイン中のアカウント情報を確認できます。'}
        icon={CircleUserRound}
        title="アカウント"
        to="/app/settings/account"
        value={user?.displayName || 'MoneyHooksユーザー'}
      />
      <SummaryCard
        description="毎月の支出上限を設定します。"
        icon={WalletCards}
        title="予算"
        to="/app/settings/budget"
        value={budgetValue}
      />
      <SummaryCard
        description={paymentDescription}
        icon={WalletCards}
        title="支払い方法"
        to="/app/settings/payments"
        value={paymentValue}
      />
      <SummaryCard
        description="指定日に毎月の収入・支出を自動登録します。"
        icon={Repeat2}
        title="収支の自動入力"
        to="/app/settings/recurring-transactions"
        value={recurringValue}
      />
      <SummaryCard
        description={`${accentLabels[accent]} ・ ${chartPaletteLabels[chartPalette]}`}
        icon={Monitor}
        title="表示"
        to="/app/settings/appearance"
        value={themeLabels[theme === 'dark' || theme === 'light' ? theme : 'system']}
      />
    </div>
  )
}
