import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CreditCard, GripVertical, Pencil, Trash2 } from 'lucide-react'

import type {
  PaymentResourceListResponsePaymentListItem,
  PaymentTypeListResponsePaymentTypeListItem,
} from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { getPaymentIconSource } from '@/shared/lib/payment-icon'
import { cn } from '@/shared/lib/utils'

export function SortablePaymentRow({
  payment,
  paymentTypes,
  onEdit,
  onDelete,
  isDeleting,
  isReordering,
}: {
  payment: PaymentResourceListResponsePaymentListItem
  paymentTypes: PaymentTypeListResponsePaymentTypeListItem[]
  onEdit: (payment: PaymentResourceListResponsePaymentListItem) => void
  onDelete: (payment: PaymentResourceListResponsePaymentListItem) => void
  isDeleting: boolean
  isReordering: boolean
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: payment.payment_id })
  const type = paymentTypes.find((item) => item.payment_type_id === payment.payment_type_id)
  const iconSource = getPaymentIconSource({
    paymentName: payment.payment_name,
    paymentTypeName: type?.payment_type_name,
  })

  return (
    <li
      className={cn(
        'flex items-center gap-3 bg-card px-4 py-3',
        isDragging && 'z-10 opacity-50 shadow-lg',
      )}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        aria-label={`${payment.payment_name}を並べ替え`}
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        disabled={isReordering}
        ref={setActivatorNodeRef}
        size="icon-sm"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      {iconSource ? (
        <img
          alt=""
          className="size-9 shrink-0 rounded-lg"
          height="36"
          src={iconSource}
          width="36"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CreditCard aria-hidden="true" className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{payment.payment_name}</p>
        <p className="text-sm text-muted-foreground">
          {type?.payment_type_name ?? '未分類'}
          {type?.is_payment_due_later && payment.payment_date !== null
            ? ` ・ 締め日 ${payment.closing_date}日 / 支払日 ${payment.payment_date}日`
            : ''}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          aria-label={`${payment.payment_name}を編集`}
          disabled={isReordering}
          onClick={() => onEdit(payment)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          aria-label={`${payment.payment_name}を削除`}
          disabled={isDeleting || isReordering}
          onClick={() => onDelete(payment)}
          size="icon-sm"
          type="button"
          variant="destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}
