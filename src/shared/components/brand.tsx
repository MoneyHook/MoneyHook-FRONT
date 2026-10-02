import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

type BrandProps = {
  'aria-label'?: string
  className?: string
  onClick?: () => void
}

export function Brand({
  'aria-label': ariaLabel = 'MoneyHooksのホームへ',
  className,
  onClick,
}: BrandProps) {
  const content = (
    <>
      <img
        alt=""
        className="size-9 shrink-0 object-contain"
        height="36"
        src="/home-icon.svg"
        width="36"
      />
      <span className="text-[0.95rem] font-semibold tracking-tight">
        MoneyHooks
      </span>
    </>
  )
  const sharedClassName = cn(
    'inline-flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50',
    className,
  )

  if (onClick) {
    return (
      <Button
        variant="ghost"
        aria-label={ariaLabel}
        className={cn(
          'h-auto border-0 p-0 font-normal hover:bg-transparent active:translate-y-0 dark:hover:bg-transparent',
          sharedClassName,
        )}
        onClick={onClick}
        type="button"
      >
        {content}
      </Button>
    )
  }

  return (
    <Link aria-label={ariaLabel} className={sharedClassName} to="/">
      {content}
    </Link>
  )
}
