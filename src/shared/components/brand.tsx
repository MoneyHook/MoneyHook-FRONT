import { WalletCards } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <WalletCards aria-hidden="true" className="size-4.5" />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-[-0.025em]">
        MoneyHooks
      </span>
    </span>
  )
}
