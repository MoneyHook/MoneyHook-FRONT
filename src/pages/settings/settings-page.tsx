import { ArrowLeft, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth'
import {
  AccountSettings,
  AppearanceSettings,
  BudgetSettings,
  CategorySettings,
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
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      setIsHeaderCompact(window.scrollY > 16)
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  useEffect(() => {
    document.body.classList.add('settings-page-scrollbar-hidden')
    return () =>
      document.body.classList.remove('settings-page-scrollbar-hidden')
  }, [])

  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-3xl px-5 pt-5 pb-24 md:px-10 md:pt-8 md:pb-12"
    >
      <header
        className={`transition-padding sticky top-0 z-10 flex gap-4 border-b bg-background/95 backdrop-blur duration-200 ease-out ${
          isHeaderCompact ? 'items-center py-3' : 'items-start pb-4'
        }`}
        data-compact={isHeaderCompact || undefined}
        data-slot="settings-page-header"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-[margin] duration-200 ease-out ${
            isHeaderCompact ? '' : 'mt-0.5'
          }`}
        >
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h1
            id="page-title"
            className="text-xl font-semibold tracking-[-0.035em] md:text-2xl"
          >
            設定
          </h1>
          <p
            aria-hidden={isHeaderCompact}
            className={`max-w-2xl overflow-hidden text-sm leading-6 text-muted-foreground transition-[max-height,opacity,margin,transform] duration-200 ease-out md:text-base ${
              isHeaderCompact
                ? 'max-h-0 -translate-y-1 opacity-0'
                : 'mt-1.5 max-h-12 translate-y-0 opacity-100'
            }`}
          >
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

export function CategorySettingsPage() {
  return (
    <SettingsDetailPage
      description="取引の入力時に表示するサブカテゴリを設定できます。"
      title="カテゴリ・サブカテゴリ"
    >
      <CategorySettings showHeader={false} />
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
