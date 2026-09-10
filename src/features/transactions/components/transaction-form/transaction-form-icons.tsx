import { CreditCard } from 'lucide-react'

import { getCategoryPresentation } from '@/shared/lib/category-presentation'
import { getPaymentIconSource } from '@/shared/lib/payment-icon'
import { cn } from '@/shared/lib/utils'

export function CategoryIcon({
  name,
  iconSizeClassName = 'size-5',
  sizeClassName = 'size-11',
}: {
  name: string
  iconSizeClassName?: string
  sizeClassName?: string
}) {
  const presentation = getCategoryPresentation(name)
  const Icon = presentation.icon

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        sizeClassName,
        presentation.iconClassName,
      )}
    >
      <Icon aria-hidden="true" className={iconSizeClassName} />
    </span>
  )
}

export function PaymentIcon({
  paymentName,
  paymentTypeName,
  sizeClassName,
}: {
  paymentName: string
  paymentTypeName?: string | null
  sizeClassName: string
}) {
  const iconSource = getPaymentIconSource({ paymentName, paymentTypeName })

  return iconSource ? (
    <img
      alt=""
      className={cn('shrink-0 rounded-full', sizeClassName)}
      height="44"
      src={iconSource}
      width="44"
    />
  ) : (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-chart-2/12 text-chart-2',
        sizeClassName,
      )}
    >
      <CreditCard aria-hidden="true" className="size-5" />
    </span>
  )
}
