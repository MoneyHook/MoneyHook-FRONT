import { cn } from '@/shared/lib/utils'

import type { TransactionView } from '../../model/transactions'

export function TransactionsViewTabs({
  compact = false,
  value,
  onChange,
}: {
  compact?: boolean
  value: TransactionView
  onChange: (value: TransactionView) => void
}) {
  const tabs = [
    { value: 'list', label: '一覧' },
    { value: 'calendar', label: 'カレンダー' },
  ] as const
  return (
    <div
      aria-label="取引の表示形式"
      className="grid grid-cols-2 border-b"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isSelected = value === tab.value
        return (
          <button
            aria-controls={`transactions-${tab.value}-panel`}
            aria-selected={isSelected}
            className={cn(
              'relative px-4 text-sm font-semibold text-muted-foreground transition-[min-height,color] duration-200 ease-out outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
              compact ? 'min-h-9' : 'min-h-12',
              isSelected &&
                'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary',
            )}
            id={`transactions-${tab.value}-tab`}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
