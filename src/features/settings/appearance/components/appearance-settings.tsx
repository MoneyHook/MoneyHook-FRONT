import { Check, Monitor, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

import { type AccentColor, type ChartPalette, useAppearance } from '@/shared/hooks/appearance-context'

const themeOptions = [
  { value: 'light', label: 'ライト', icon: Sun },
  { value: 'dark', label: 'ダーク', icon: Moon },
  { value: 'system', label: 'システム', icon: Monitor },
] as const

const accentOptions: ReadonlyArray<{ value: AccentColor; label: string; description: string }> = [
  { value: 'blue', label: 'ブルー', description: 'MoneyHooksの標準色' },
  { value: 'green', label: 'グリーン', description: '落ち着いた緑' },
  { value: 'violet', label: 'バイオレット', description: '深みのある紫' },
  { value: 'rose', label: 'ローズ', description: 'やわらかな赤' },
  { value: 'black', label: 'ブラック', description: '引き締まった黒' },
]

const chartPaletteOptions: ReadonlyArray<{ value: ChartPalette; label: string; description: string }> = [
  { value: 'default', label: '標準', description: '現行のブルー基調' },
  { value: 'colorful', label: 'カラフル', description: '色相を分けて比較しやすい配色' },
  { value: 'monochrome', label: 'モノトーン', description: '濃淡で見分ける落ち着いた配色' },
]

function AppearancePanel({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  const titleId = `appearance-${title}`
  return <section aria-labelledby={titleId} className="rounded-2xl border bg-card p-4 sm:p-5"><div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8"><div className="space-y-2"><h2 className="text-xl font-semibold tracking-[-0.03em]" id={titleId}>{title}</h2><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</div></section>
}

function ThemePicker() {
  const { setTheme, theme } = useAppearance()
  return <div className="grid grid-cols-3 gap-2 sm:gap-3">{themeOptions.map((option) => { const Icon = option.icon; return <label className="group relative block" key={option.value}><input checked={theme === option.value} className="peer sr-only" name="theme" onChange={() => setTheme(option.value)} type="radio" value={option.value} /><span className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-24 sm:gap-2 sm:px-3 sm:py-3"><Icon aria-hidden="true" className="size-5 sm:size-6" /><span className="text-xs font-semibold leading-4 sm:text-sm sm:leading-5">{option.label}</span>{theme === option.value ? <Check aria-hidden="true" className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5" /> : null}</span></label> })}</div>
}

function AccentColorPicker() {
  const { accent, setAccent } = useAppearance()
  return <div className="grid grid-cols-3 gap-2 sm:gap-3">{accentOptions.map((option) => <label key={option.value} className="group relative block"><input checked={accent === option.value} className="peer sr-only" name="accent-color" onChange={() => setAccent(option.value)} type="radio" value={option.value} /><span className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-28 sm:gap-2 sm:px-3 sm:py-3"><span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-foreground/15 shadow-sm sm:size-7" style={{ backgroundColor: `var(--accent-swatch-${option.value})` }} /><span className="min-w-0"><span className="block wrap-break-word text-xs font-semibold leading-4 sm:text-sm sm:leading-5">{option.label}</span><span className="mt-0.5 block wrap-break-word text-[0.6875rem] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">{option.description}</span></span>{accent === option.value ? <Check aria-hidden="true" className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5" /> : null}</span></label>)}</div>
}

function ChartPalettePicker() {
  const { chartPalette, setChartPalette } = useAppearance()
  return <div className="grid grid-cols-3 gap-2 sm:gap-3">{chartPaletteOptions.map((option) => <label key={option.value} className="group relative block"><input checked={chartPalette === option.value} className="peer sr-only" name="chart-palette" onChange={() => setChartPalette(option.value)} type="radio" value={option.value} /><span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-background px-1.5 py-2 text-center transition-colors hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-foreground peer-checked:bg-muted sm:min-h-28 sm:px-3 sm:py-3"><span className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1.5" aria-hidden="true">{[1, 2, 3, 4, 5].map((index) => <span className="size-3 rounded-full border border-foreground/10 shadow-sm sm:size-4" key={index} style={{ backgroundColor: `var(--chart-palette-swatch-${option.value}-${index})` }} />)}</span><span className="mt-2 block wrap-break-word text-xs font-semibold leading-4 sm:mt-3 sm:text-sm sm:leading-5">{option.label}</span><span className="mt-0.5 wrap-break-word text-[0.6875rem] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">{option.description}</span>{chartPalette === option.value ? <Check aria-hidden="true" className="absolute right-2 top-2 size-4 text-foreground sm:right-3 sm:top-3 sm:size-5" /> : null}</span></label>)}</div>
}

export function AppearanceSettings() {
  return <div className="space-y-5"><AppearancePanel description="アプリ全体の見た目を切り替えます。" title="テーマ"><ThemePicker /></AppearancePanel><AppearancePanel description="ボタンや選択状態など、主要なUIのアクセント色を選択できます。" title="アクセントカラー"><AccentColorPicker /></AppearancePanel><AppearancePanel description="ホームと分析画面のグラフで使用する色を選択できます。" title="グラフカラーセット"><ChartPalettePicker /></AppearancePanel></div>
}
