import { ArrowLeft, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth'
import {
  AccountSettings,
  AppearanceSettings,
  BudgetSettings,
  PaymentSettings,
  RecurringTransactionSettings,
  SettingsSummary,
} from '@/features/settings'
import { Button } from '@/shared/components/ui/button'

function SettingsDetailPage({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <div className="motion-route-enter mx-auto w-full max-w-5xl px-5 pt-5 pb-24 md:px-10 md:pt-8 md:pb-12">
      <header className="border-b pb-4">
        <Button asChild className="mb-4 -ml-2" type="button" variant="ghost">
          <Link to="/app/settings">
            <ArrowLeft aria-hidden="true" />
            設定へ戻る
          </Link>
        </Button>
        <div className="space-y-1.5">
          <h1
            id="page-title"
            className="text-xl font-semibold tracking-[-0.035em] md:text-2xl"
          >
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </header>
      <div className="pt-6 md:pt-8">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-3xl px-5 pt-5 pb-24 md:px-10 md:pt-8 md:pb-12"
    >
      <header className="flex items-start gap-4 border-b pb-4">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center text-muted-foreground">
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-1.5">
          <h1
            id="page-title"
            className="text-xl font-semibold tracking-[-0.035em] md:text-2xl"
          >
            設定
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            アカウント、予算、支払い方法、表示に関する設定を管理します。
          </p>
        </div>
      </header>
      <div className="py-4 md:py-6">
        <SettingsSummary />
      </div>
    </section>
  )
}

export function AccountSettingsPage() {
  const { user, signOut } = useAuth()
  return (
    <SettingsDetailPage
      description="ログイン中のアカウント情報を確認できます。"
      title="アカウント"
    >
      <AccountSettings showHeader={false} user={user} signOut={signOut} />
    </SettingsDetailPage>
  )
}

export function BudgetSettingsPage() {
  return (
    <SettingsDetailPage
      description="毎月の支出上限を設定できます。設定は今月から適用されます。"
      title="予算"
    >
      <BudgetSettings showHeader={false} />
    </SettingsDetailPage>
  )
}

export function PaymentSettingsPage() {
  return (
    <SettingsDetailPage
      description="取引に使う支払い方法を管理できます。"
      title="支払い方法"
    >
      <PaymentSettings showHeader={false} />
    </SettingsDetailPage>
  )
}

export function RecurringTransactionSettingsPage() {
  return (
    <SettingsDetailPage
      description="指定日に毎月の収入・支出を自動登録します。"
      title="収支の自動入力"
    >
      <RecurringTransactionSettings showHeader={false} />
    </SettingsDetailPage>
  )
}

export function AppearanceSettingsPage() {
  return (
    <SettingsDetailPage
      description="テーマ、アクセントカラー、グラフカラーセットを変更できます。"
      title="表示"
    >
      <AppearanceSettings />
    </SettingsDetailPage>
  )
}
