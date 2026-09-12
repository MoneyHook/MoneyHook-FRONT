import {
  Banknote,
  CreditCard,
  MoreHorizontal,
  QrCode,
  WalletCards,
} from 'lucide-react'
import { getPaymentIconSource } from '@/shared/lib/payment-icon'
import { cn } from '@/shared/lib/utils'
import type { PaymentMethodItem } from '../../model/analysis-payments'

const paymentIconClasses = [
  'bg-expense/12 text-expense',
  'bg-chart-2/12 text-chart-2',
  'bg-success/12 text-success',
  'bg-warning/12 text-warning',
  'bg-chart-5/12 text-chart-5',
  'bg-muted text-muted-foreground',
]

export function PaymentIcon({
  payment,
  index,
  size = 'default',
}: {
  payment: PaymentMethodItem
  index: number
  size?: 'default' | 'large'
}) {
  const iconSource =
    payment.id === 'unclassified'
      ? null
      : getPaymentIconSource({
          paymentName: payment.name,
          paymentTypeName: payment.typeName,
        })
  const Icon =
    payment.id === 'unclassified'
      ? MoreHorizontal
      : payment.typeName === 'カード'
        ? CreditCard
        : payment.typeName === '現金'
          ? Banknote
          : payment.typeName === 'QRペイ'
            ? QrCode
            : WalletCards

  if (iconSource) {
    return (
      <img
        alt=""
        className={cn(
          'shrink-0 rounded-full',
          size === 'large' ? 'size-10 sm:size-12' : 'size-8',
        )}
        height={size === 'large' ? 48 : 32}
        src={iconSource}
        width={size === 'large' ? 48 : 32}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        size === 'large' ? 'size-10 sm:size-12' : 'size-8',
        paymentIconClasses[index % paymentIconClasses.length],
      )}
    >
      <Icon
        aria-hidden="true"
        className={size === 'large' ? 'size-5 sm:size-6' : 'size-4'}
      />
    </span>
  )
}
