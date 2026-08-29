import { ChartPie } from 'lucide-react'

import { PagePlaceholder } from '@/shared/components/page-placeholder'

export function AnalysisPage() {
  return (
    <PagePlaceholder
      description="変動費、固定費、支払い方法別の傾向を確認する画面です。"
      icon={ChartPie}
      title="分析"
    />
  )
}
