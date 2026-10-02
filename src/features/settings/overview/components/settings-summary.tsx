import {
  ChevronRight,
  CircleUserRound,
  Monitor,
  Repeat2,
  Tags,
  Users,
  WalletCards,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '@/shared/components/ui/card'

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
      className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      to={to}
    >
      <Card className="flex min-h-22 flex-row items-center gap-3 px-4 py-4 transition-colors duration-200 group-hover:bg-surface group-focus-visible:bg-surface motion-reduce:transition-none sm:min-h-24 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground group-focus-visible:text-foreground motion-reduce:transition-none">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
        />
      </Card>
    </Link>
  )
}

function SummaryGroup({
  children,
  title,
  titleId,
}: {
  children: ReactNode
  title: string
  titleId: string
}) {
  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <h2
        className="px-1 text-xs font-medium tracking-wide text-muted-foreground"
        id={titleId}
      >
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function SettingsSummary() {
  return (
    <div className="space-y-8">
      <SummaryGroup title="アカウント" titleId="settings-account-title">
        <SummaryCard
          description="ログイン中のアカウント情報を確認できます。"
          icon={CircleUserRound}
          title="アカウント"
          to="/app/settings/account"
        />
      </SummaryGroup>

      <SummaryGroup title="家計の設定" titleId="settings-finances-title">
        <SummaryCard
          description="毎月の支出上限を設定します。"
          icon={WalletCards}
          title="予算"
          to="/app/settings/budget"
        />
        <SummaryCard
          description="取引で使うサブカテゴリの表示を設定します。"
          icon={Tags}
          title="カテゴリ・サブカテゴリ"
          to="/app/settings/categories"
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
      </SummaryGroup>

      <SummaryGroup title="家族との共有" titleId="settings-family-title">
        <SummaryCard
          description="家族の管理、メンバーの招待、新規入力の入力先を設定します。"
          icon={Users}
          title="家族の家計"
          to="/app/settings/family"
        />
      </SummaryGroup>

      <SummaryGroup title="アプリの設定" titleId="settings-app-title">
        <SummaryCard
          description="テーマやアクセントカラー、グラフの配色を設定します。"
          icon={Monitor}
          title="表示"
          to="/app/settings/appearance"
        />
      </SummaryGroup>
    </div>
  )
}
