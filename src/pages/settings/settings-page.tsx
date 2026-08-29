import { Settings } from 'lucide-react'

import { PagePlaceholder } from '@/shared/components/page-placeholder'

export function SettingsPage() {
  return (
    <PagePlaceholder
      description="MoneyHooksの表示と入力に関する設定を管理する画面です。"
      icon={Settings}
      title="設定"
    />
  )
}
