import {
  ArrowLeft,
  Check,
  CircleUserRound,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth'
import {
  BudgetSettings,
  PaymentSettings,
  RecurringTransactionSettings,
  SettingsSection,
  SettingsSummary,
} from '@/features/settings'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  type AccentColor,
  type ChartPalette,
  useAppearance,
} from '@/shared/hooks/appearance-context'

const themeOptions = [
  { value: 'light', label: 'ライト', icon: Sun },
  { value: 'dark', label: 'ダーク', icon: Moon },
  { value: 'system', label: 'システム', icon: Monitor },
] as const

const accentOptions: ReadonlyArray<{
  value: AccentColor
  label: string
  description: string
}> = [
  { value: 'blue', label: 'ブルー', description: 'MoneyHooksの標準色' },
  { value: 'green', label: 'グリーン', description: '落ち着いた緑' },
  { value: 'violet', label: 'バイオレット', description: '深みのある紫' },
  { value: 'rose', label: 'ローズ', description: 'やわらかな赤' },
  { value: 'black', label: 'ブラック', description: '引き締まった黒' },
]

const chartPaletteOptions: ReadonlyArray<{
  value: ChartPalette
  label: string
  description: string
}> = [
  { value: 'default', label: '標準', description: '現行のブルー基調' },
  { value: 'colorful', label: 'カラフル', description: '色相を分けて比較しやすい配色' },
  { value: 'monochrome', label: 'モノトーン', description: '濃淡で見分ける落ち着いた配色' },
]

function AppearancePanel({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  const titleId = `appearance-${title}`

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-[-0.03em]" id={titleId}>
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function ThemePicker() {
  const { setTheme, theme } = useAppearance()

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {themeOptions.map((option) => {
        const Icon = option.icon

        return (
          <label className="group relative block" key={option.value}>
            <input
              checked={theme === option.value}
              className="peer sr-only"
              name="theme"
              onChange={() => setTheme(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-24 sm:gap-2 sm:px-3 sm:py-3">
              <Icon aria-hidden="true" className="size-5 sm:size-6" />
              <span className="text-xs font-semibold leading-4 sm:text-sm sm:leading-5">{option.label}</span>
              {theme === option.value ? (
                <Check aria-hidden="true" className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5" />
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function AccentColorPicker() {
  const { accent, setAccent } = useAppearance()

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {accentOptions.map((option) => (
          <label key={option.value} className="group relative block">
            <input
              checked={accent === option.value}
              className="peer sr-only"
              name="accent-color"
              onChange={() => setAccent(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-28 sm:gap-2 sm:px-3 sm:py-3">
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full border border-foreground/15 shadow-sm sm:size-7"
                style={{
                  backgroundColor: `var(--accent-swatch-${option.value})`,
                }}
              />
              <span className="min-w-0">
                <span className="block break-words text-xs font-semibold leading-4 sm:text-sm sm:leading-5">{option.label}</span>
                <span className="mt-0.5 block break-words text-[0.6875rem] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">
                  {option.description}
                </span>
              </span>
              {accent === option.value ? (
                <Check
                  aria-hidden="true"
                  className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5"
                />
              ) : null}
            </span>
          </label>
        ))}
    </div>
  )
}

function ChartPalettePicker() {
  const { chartPalette, setChartPalette } = useAppearance()

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {chartPaletteOptions.map((option) => (
          <label key={option.value} className="group relative block">
            <input
              checked={chartPalette === option.value}
              className="peer sr-only"
              name="chart-palette"
              onChange={() => setChartPalette(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-28 sm:px-3 sm:py-3">
              <span className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    className="size-3 rounded-full border border-foreground/10 shadow-sm sm:size-4"
                    key={index}
                    style={{
                      backgroundColor: `var(--chart-palette-swatch-${option.value}-${index})`,
                    }}
                  />
                ))}
              </span>
              <span className="mt-2 block break-words text-xs font-semibold leading-4 sm:mt-3 sm:text-sm sm:leading-5">{option.label}</span>
              <span className="mt-0.5 break-words text-[0.6875rem] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">
                {option.description}
              </span>
              {chartPalette === option.value ? (
                <Check aria-hidden="true" className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5" />
              ) : null}
            </span>
          </label>
        ))}
    </div>
  )
}

function AccountSettings({ showHeader = true }: { showHeader?: boolean }) {
  const { user, signOut } = useAuth()
  const initial = useMemo(() => {
    const source = user?.displayName?.trim() || user?.email?.trim() || 'M'
    return source.slice(0, 1).toUpperCase()
  }, [user])

  const handleSignOut = () => {
    void signOut().catch(() => {
      toast.error('ログアウトできませんでした。もう一度お試しください。')
    })
  }

  return (
    <SettingsSection
      description="ログイン中のアカウント情報を確認できます。"
      icon={CircleUserRound}
      showHeader={showHeader}
      title="アカウント"
      titleId="account-settings-title"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            {user?.photoURL ? (
              <AvatarImage alt="" referrerPolicy="no-referrer" src={user.photoURL} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-medium">
              {user?.displayName || 'MoneyHooksユーザー'}
            </p>
            {user?.email ? (
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={handleSignOut}
          size="lg"
          type="button"
          variant="destructive"
        >
          <LogOut aria-hidden="true" />
          ログアウト
        </Button>
      </div>
    </SettingsSection>
  )
}

function AppearanceSettings() {
  return (
    <div className="space-y-5">
      <AppearancePanel description="アプリ全体の見た目を切り替えます。" title="テーマ">
        <ThemePicker />
      </AppearancePanel>
      <AppearancePanel description="ボタンや選択状態など、主要なUIのアクセント色を選択できます。" title="アクセントカラー">
        <AccentColorPicker />
      </AppearancePanel>
      <AppearancePanel description="ホームと分析画面のグラフで使用する色を選択できます。" title="グラフカラーセット">
        <ChartPalettePicker />
      </AppearancePanel>
    </div>
  )
}

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
    <div
      className="motion-route-enter mx-auto w-full max-w-5xl px-5 pb-24 pt-8 md:px-10 md:pb-12 md:pt-12"
    >
      <header className="border-b pb-6">
        <Button asChild className="-ml-2 mb-4" type="button" variant="ghost">
          <Link to="/app/settings">
            <ArrowLeft aria-hidden="true" />
            設定へ戻る
          </Link>
        </Button>
        <div className="space-y-1.5">
          <h1
            id="page-title"
            className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
          >
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </header>
      <div className="pt-8 md:pt-10">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-3xl px-5 pb-24 pt-8 md:px-10 md:pb-12 md:pt-12"
    >
      <header className="flex items-start gap-4 border-b pb-6">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-1.5">
          <h1
            id="page-title"
            className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
          >
            設定
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            アカウント、予算、支払い方法、表示に関する設定を管理します。
          </p>
        </div>
      </header>
      <div className="py-6 md:py-8">
        <SettingsSummary />
      </div>
    </section>
  )
}

export function AccountSettingsPage() {
  return (
    <SettingsDetailPage
      description="ログイン中のアカウント情報を確認できます。"
      title="アカウント"
    >
      <AccountSettings showHeader={false} />
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
