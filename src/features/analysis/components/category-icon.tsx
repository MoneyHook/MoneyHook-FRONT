import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { cn } from '@/shared/lib/utils'

export function CategoryIcon({ name }: { name: string }) {
  const presentation = getCategoryPresentation(name)
  const Icon = presentation.icon
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        presentation.iconClassName,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </span>
  )
}
