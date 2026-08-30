import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      aria-label="MoneyHooksのホームへ"
      className={cn(
        'inline-flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      to="/"
    >
      <img
        alt=""
        className="size-9 shrink-0 object-contain"
        height="36"
        src="/home-icon.svg"
        width="36"
      />
      <span className="text-[0.95rem] font-semibold tracking-[-0.025em]">
        MoneyHooks
      </span>
    </Link>
  )
}
