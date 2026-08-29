import { ArrowLeftRight } from 'lucide-react'

import { PagePlaceholder } from '@/shared/components/page-placeholder'

export function TransactionsPage() {
  return (
    <PagePlaceholder
      description="取引の一覧、追加、編集を行う画面です。"
      icon={ArrowLeftRight}
      title="取引"
    />
  )
}
