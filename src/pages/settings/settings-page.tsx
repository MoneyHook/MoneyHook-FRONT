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
            <span className="flex h-20 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-primary peer-checked:bg-accent">
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
                  className="ml-auto size-4 shrink-0 text-primary"
                />
              ) : null}
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
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
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
          description="テーマとアクセントカラーはこのブラウザに保存されます。"
          icon={Monitor}
          title="表示"
          titleId="appearance-settings-title"
        >
          <AccentColorPicker />
        </SettingsSection>
      </div>
    </section>
  )
}
