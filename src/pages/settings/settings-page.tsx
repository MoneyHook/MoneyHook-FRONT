import { ArrowLeft, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth'
import { FamilySettings } from '@/features/households'
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

function useSettingsHeaderCompact() {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const updateHeader = () => {
      const scrollTop = window.scrollY
      setIsHeaderCompact((compact) =>
        compact ? scrollTop > 0 : scrollTop > 16,
      )
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  return isHeaderCompact
}

function SettingsDetailPage({
  backLabel = '設定へ戻る',
  backTo = '/app/settings',
  children,
  description,
  title,
}: {
  backLabel?: string
  backTo?: string
  children: ReactNode
  description: string
  title: string
}) {
  const isHeaderCompact = useSettingsHeaderCompact()

  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-5xl px-5 pt-2 pb-24 sm:pt-4 md:px-10 md:pt-6 md:pb-12"
    >
      <header
        className={`sticky top-0 z-10 border-b bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'py-1' : 'pt-2 pb-4 sm:pt-3'}`}
        data-compact={isHeaderCompact || undefined}
        data-slot="settings-detail-page-header"
      >
        <Button
          asChild
          className={`-ml-2 transition-[margin-bottom] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'mb-1' : 'mb-4'}`}
          type="button"
          variant="ghost"
        >
          <Link to={backTo}>
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        <div>
          <h1
            id="page-title"
            className={`font-semibold tracking-[-0.035em] transition-[font-size] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'text-base' : 'text-xl md:text-2xl'}`}
          >
            {title}
          </h1>
          <p
            aria-hidden={isHeaderCompact}
            className={`max-w-2xl overflow-hidden text-sm leading-6 text-muted-foreground transition-[max-height,opacity,margin] duration-200 ease-out motion-reduce:transition-none md:text-base ${isHeaderCompact ? 'mt-0 max-h-0 opacity-0' : 'mt-1.5 max-h-12 opacity-100'}`}
          >
            {description}
          </p>
        </div>
      </header>
      <div className="pt-6 md:pt-8">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const isHeaderCompact = useSettingsHeaderCompact()

  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-3xl px-5 pt-2 pb-24 sm:pt-4 md:px-10 md:pt-6 md:pb-12"
    >
      <header
        className={`sticky top-0 z-10 flex gap-4 border-b bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none ${
          isHeaderCompact
            ? 'items-center py-1'
            : 'items-start pt-2 pb-4 sm:pt-3'
        }`}
        data-compact={isHeaderCompact || undefined}
        data-slot="settings-page-header"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-[margin] duration-200 ease-out motion-reduce:transition-none ${
            isHeaderCompact ? '' : 'mt-0.5'
          }`}
        >
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h1
            id="page-title"
            className={`font-semibold tracking-[-0.035em] transition-[font-size] duration-200 ease-out motion-reduce:transition-none ${isHeaderCompact ? 'text-base' : 'text-xl md:text-2xl'}`}
          >
            設定
          </h1>
          <p
            aria-hidden={isHeaderCompact}
            className={`max-w-2xl overflow-hidden text-sm leading-6 text-muted-foreground transition-[max-height,opacity,margin,transform] duration-200 ease-out motion-reduce:transition-none md:text-base ${
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

export function HouseholdSettingsPage() {
  return (
    <SettingsDetailPage
      description="家族の管理、メンバーの招待、新規入力の入力先を設定できます。"
      title="家族の家計"
    >
      <FamilySettings />
    </SettingsDetailPage>
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
