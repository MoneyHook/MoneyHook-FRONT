import {
  ChevronRight,
  CircleUserRound,
  Monitor,
  Repeat2,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router-dom'

type SummaryCardProps = {
  description: string
  icon: typeof CircleUserRound
  title: string
  to: string
}

function SummaryCard({ description, icon: Icon, title, to }: SummaryCardProps) {
  return (
    <Link
      aria-label={`${title}の設定を開く`}
      className="group flex min-h-25 items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left outline-none transition-[background-color,border-color,transform] hover:-translate-y-px hover:border-foreground/15 hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-5"
      to={to}
    >
      <span className="flex size-10 shrink-0 items-center justify-center text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
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
  return (
    <div className="space-y-3" role="list">
      <SummaryCard
        description="ログイン中のアカウント情報を確認できます。"
        icon={CircleUserRound}
        title="アカウント"
        to="/app/settings/account"
      />
      <SummaryCard
        description="毎月の支出上限を設定します。"
        icon={WalletCards}
        title="予算"
        to="/app/settings/budget"
      />
      <SummaryCard
        description="取引で使う支払い方法を管理します。"
        icon={WalletCards}
        title="支払い方法"
        to="/app/settings/payments"
      />
      <SummaryCard
        description="指定日に毎月の収入・支出を自動登録します。"
        icon={Repeat2}
        title="収支の自動入力"
        to="/app/settings/recurring-transactions"
      />
      <SummaryCard
        description="テーマやアクセントカラー、グラフの配色を設定します。"
        icon={Monitor}
        title="表示"
        to="/app/settings/appearance"
      />
    </div>
  )
}
