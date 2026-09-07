

export const analysisViews = [
  { value: 'overview', label: '概要' },
  { value: 'categories', label: 'カテゴリ' },
  { value: 'fixed', label: '固定費' },
  { value: 'payments', label: '支払い方法' },
] as const

export type AnalysisView = (typeof analysisViews)[number]['value']

export function normalizeView(value: string | null): AnalysisView {
  return analysisViews.some((view) => view.value === value)
    ? (value as AnalysisView)
    : 'overview'
}
