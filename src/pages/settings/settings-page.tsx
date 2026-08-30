import { Check, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

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
        <Button aria-label="表示テーマを変更" size="icon" variant="outline">
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
    <fieldset className="space-y-3 pt-6">
      <legend className="text-sm font-medium">アクセントカラー</legend>
      <p className="text-sm leading-6 text-muted-foreground">
        ボタンや選択状態など、主要なUIのアクセント色を選択できます。
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
            <span className="flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border bg-background px-3 py-3 transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-primary peer-checked:bg-accent">
              <span
                aria-hidden="true"
                className="size-5 shrink-0 rounded-full border border-foreground/15 shadow-sm"
                style={{
                  backgroundColor: `var(--accent-swatch-${option.value})`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
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
            MoneyHooksの表示と入力に関する設定を管理する画面です。
          </p>
        </div>
      </header>

      <div className="py-8 md:py-10">
        <section
          aria-labelledby="appearance-settings-title"
          className="max-w-5xl rounded-2xl border bg-card p-5 sm:p-6"
        >
          <header className="flex items-start justify-between gap-4 border-b pb-5">
            <div className="space-y-1">
              <h2 id="appearance-settings-title" className="text-lg font-semibold">
                表示
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                テーマとアクセントカラーはこのブラウザに保存されます。
              </p>
            </div>
            <ThemeMenu />
          </header>
          <AccentColorPicker />
        </section>
      </div>
    </section>
  )
}
