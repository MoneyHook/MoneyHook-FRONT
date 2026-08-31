import { Check, CircleUserRound, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth'
import { BudgetSettings, PaymentSettings, SettingsSection } from '@/features/settings'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  type AccentColor,
  useAccent,
} from '@/shared/hooks/accent-context'
import {
  type ChartPalette,
  useChartPalette,
} from '@/shared/hooks/chart-palette-context'

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

function ThemeMenu() {
  const { setTheme, theme = 'system' } = useTheme()
  const SelectedIcon =
    themeOptions.find((option) => option.value === theme)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="表示テーマを変更" size="icon-lg" variant="outline">
          <SelectedIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>表示テーマ</DropdownMenuLabel>
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          {themeOptions.map((option) => {
            const Icon = option.icon
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon aria-hidden="true" />
                {option.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AccentColorPicker() {
  const { accent, setAccent } = useAccent()

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">アクセントカラー</legend>
      <p className="text-sm leading-6 text-muted-foreground">
        ボタンや選択状態など、主要なUIのアクセント色を選択できます。
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {accentOptions.map((option) => (
          <label key={option.value} className="group relative block h-full">
            <input
              checked={accent === option.value}
              className="peer sr-only"
              name="accent-color"
              onChange={() => setAccent(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex h-20 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted">
              <span
                aria-hidden="true"
                className="size-5 shrink-0 rounded-full border border-foreground/15 shadow-sm"
                style={{
                  backgroundColor: `var(--accent-swatch-${option.value})`,
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{option.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {accent === option.value ? (
                <Check
                  aria-hidden="true"
                  className="ml-auto size-4 shrink-0 text-foreground"
                />
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ChartPalettePicker() {
  const { chartPalette, setChartPalette } = useChartPalette()

  return (
    <fieldset className="space-y-3 border-t pt-5">
      <legend className="text-sm font-medium">グラフカラーセット</legend>
      <p className="text-sm leading-6 text-muted-foreground">
        ホームと分析画面のグラフで使用する色を選択できます。
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {chartPaletteOptions.map((option) => (
          <label key={option.value} className="group relative block h-full">
            <input
              checked={chartPalette === option.value}
              className="peer sr-only"
              name="chart-palette"
              onChange={() => setChartPalette(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex h-full min-h-28 cursor-pointer flex-col rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    className="size-4 rounded-full border border-foreground/10 shadow-sm"
                    key={index}
                    style={{
                      backgroundColor: `var(--chart-palette-swatch-${option.value}-${index})`,
                    }}
                  />
                ))}
              </span>
              <span className="mt-3 flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{option.label}</span>
                {chartPalette === option.value ? (
                  <Check aria-hidden="true" className="ml-auto size-4 shrink-0 text-foreground" />
                ) : null}
              </span>
              <span className="mt-1 text-xs leading-5 text-muted-foreground">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function AccountSettings() {
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

export function SettingsPage() {
  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12"
    >
      <header className="flex items-start gap-4 border-b pb-8">
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
            MoneyHooksのアカウントと表示に関する設定を管理する画面です。
          </p>
        </div>
      </header>

      <div className="space-y-6 py-8 md:py-10">
        <AccountSettings />
        <BudgetSettings />
        <PaymentSettings />
        <SettingsSection
          action={<ThemeMenu />}
          description="テーマ、アクセントカラー、グラフカラーセットはこのブラウザに保存されます。"
          icon={Monitor}
          title="表示"
          titleId="appearance-settings-title"
        >
          <AccentColorPicker />
          <ChartPalettePicker />
        </SettingsSection>
      </div>
    </section>
  )
}
