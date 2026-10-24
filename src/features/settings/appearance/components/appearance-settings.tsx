import {
  ChartNoAxesColumn,
  type LucideIcon,
  Monitor,
  Moon,
  Palette,
  Sun,
} from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
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

const accentOptions: ReadonlyArray<{ value: AccentColor; label: string }> = [
  { value: 'blue', label: 'ブルー' },
  { value: 'green', label: 'グリーン' },
  { value: 'violet', label: 'バイオレット' },
  { value: 'rose', label: 'ローズ' },
  { value: 'black', label: 'ブラック' },
]

const chartPaletteOptions: ReadonlyArray<{
  value: ChartPalette
  label: string
}> = [
  { value: 'default', label: '標準' },
  { value: 'colorful', label: 'カラフル' },
  { value: 'monochrome', label: 'モノトーン' },
]

function AppearanceRow({
  children,
  icon: Icon,
  id,
  title,
}: {
  children: ReactNode
  icon: LucideIcon
  id: string
  title: string
}) {
  return (
    <div className="flex min-h-21 items-center justify-between gap-3 py-6">
      <label
        className="flex min-w-0 items-center gap-2 text-xs sm:text-sm"
        htmlFor={id}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span>{title}</span>
      </label>
      {children}
    </div>
  )
}

function ThemePicker() {
  const { setTheme, theme } = useAppearance()
  return (
    <Select
      onValueChange={(value) => setTheme(value as typeof theme)}
      value={theme}
    >
      <SelectTrigger
        className="w-36 shrink-0 bg-card text-xs shadow-xs"
        id="appearance-theme"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-36">
        {themeOptions.map((option) => {
          const Icon = option.icon
          return (
            <SelectItem
              className="text-xs"
              key={option.value}
              value={option.value}
            >
              <span className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{option.label}</span>
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function AccentColorPicker() {
  const { accent, setAccent } = useAppearance()
  return (
    <Select
      onValueChange={(value) => setAccent(value as typeof accent)}
      value={accent}
    >
      <SelectTrigger
        className="w-36 shrink-0 bg-card text-xs shadow-xs"
        id="appearance-accent"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-36">
        {accentOptions.map((option) => (
          <SelectItem
            className="text-xs"
            key={option.value}
            value={option.value}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full border border-foreground/10"
                style={{
                  backgroundColor: `var(--accent-swatch-${option.value})`,
                }}
              />
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ChartPalettePicker() {
  const { chartPalette, setChartPalette } = useAppearance()
  return (
    <Select
      onValueChange={(value) => setChartPalette(value as typeof chartPalette)}
      value={chartPalette}
    >
      <SelectTrigger
        className="w-40 shrink-0 bg-card text-xs shadow-xs"
        id="appearance-chart-palette"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-40">
        {chartPaletteOptions.map((option) => (
          <SelectItem
            className="text-xs"
            key={option.value}
            value={option.value}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="flex shrink-0 gap-0.5">
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    className="size-1.5 rounded-full"
                    key={index}
                    style={{
                      backgroundColor: `var(--chart-palette-swatch-${option.value}-${index})`,
                    }}
                  />
                ))}
              </span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AppearanceSettings() {
  return (
    <div className="divide-y">
      <AppearanceRow icon={Sun} id="appearance-theme" title="テーマ">
        <ThemePicker />
      </AppearanceRow>
      <AppearanceRow
        icon={Palette}
        id="appearance-accent"
        title="アクセントカラー"
      >
        <AccentColorPicker />
      </AppearanceRow>
      <AppearanceRow
        icon={ChartNoAxesColumn}
        id="appearance-chart-palette"
        title="グラフカラーセット"
      >
        <ChartPalettePicker />
      </AppearanceRow>
    </div>
  )
}
