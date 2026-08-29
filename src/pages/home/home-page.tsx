import { House } from 'lucide-react'

import { PagePlaceholder } from '@/shared/components/page-placeholder'

export function HomePage() {
  return (
    <PagePlaceholder
      description="対象月の家計サマリーを確認する画面です。"
      icon={House}
      title="ホーム"
    />
  )
}
