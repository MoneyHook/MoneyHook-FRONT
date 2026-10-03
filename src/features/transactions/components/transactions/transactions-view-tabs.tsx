import { TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { cn } from '@/shared/lib/utils'

export function TransactionsViewTabs({
  compact = false,
}: {
  compact?: boolean
}) {
  const tabs = [
    { value: 'list', label: '一覧' },
    { value: 'calendar', label: 'カレンダー' },
  ] as const
  return (
    <TabsList
      aria-label="取引の表示形式"
      className="grid h-auto w-full grid-cols-2 rounded-none border-b bg-transparent p-0"
    >
      {tabs.map((tab) => (
        <TabsTrigger
          className={cn(
            compact ? 'min-h-9' : 'min-h-12',
            'relative rounded-none border-0 bg-transparent px-4 py-0 text-sm font-semibold text-muted-foreground shadow-none transition-[min-height,color] duration-200 ease-out after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent hover:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:after:bg-primary motion-reduce:transition-none',
          )}
          key={tab.value}
          value={tab.value}
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
