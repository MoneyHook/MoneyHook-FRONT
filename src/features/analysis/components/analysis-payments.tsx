import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  MoreHorizontal,
  QrCode,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ErrorState } from '@/shared/components/app-state'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import { useAnalysisPayments } from '../api/use-analysis-payments'
import {
  getSelectedPayment,
  type AnalysisPaymentsViewModel,
  type PaymentMethodItem,
  type PaymentTransactionItem,
} from '../model/analysis-payments'
import {
  createAnalysisRange,
  formatCurrency,
  formatPercent,
} from '../model/analysis-overview'

const paymentColors = [
  'var(--expense)',
  'var(--chart-2)',
  'var(--success)',
  'var(--warning)',
  'var(--chart-5)',
  'var(--muted-foreground)',
]

const paymentIconClasses = [
  'bg-expense/12 text-expense',
  'bg-chart-2/12 text-chart-2',
  'bg-success/12 text-success',
  'bg-warning/12 text-warning',
  'bg-chart-5/12 text-chart-5',
  'bg-muted text-muted-foreground',
]

const paymentTypeIcons: Record<string, LucideIcon> = {
  カード: CreditCard,
  現金: Banknote,
  QRペイ: QrCode,
}

function AnalysisPanel({
  children,
  className,
  id,
}: React.PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-6',
        className,
      )}
      id={id}
    >
      {children}
    </section>
  )
}

function PeriodPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-sm sm:min-h-20 sm:px-6 sm:py-3">
      <CalendarDays
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground sm:size-6"
      />
      <p className="min-w-0 text-sm font-medium tabular-nums sm:text-lg">
        {label}
      </p>
    </div>
  )
}

function PaymentIcon({
  payment,
  index,
  size = 'default',
}: {
  payment: PaymentMethodItem
  index: number
  size?: 'default' | 'large'
}) {
  const Icon =
    payment.id === 'unclassified'
      ? MoreHorizontal
      : paymentTypeIcons[payment.typeName ?? ''] ?? WalletCards

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

function PaymentDonut({ data }: { data: AnalysisPaymentsViewModel }) {
  return (
    <div className="relative mx-auto size-36 sm:size-56">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={data.payments}
            dataKey="amount"
            innerRadius="57%"
            isAnimationActive
            nameKey="name"
            outerRadius="89%"
            paddingAngle={0.6}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.payments.map((payment, index) => (
              <Cell
                fill={paymentColors[index % paymentColors.length]}
                key={payment.id}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.625rem] text-muted-foreground sm:text-xs">
          総支出
        </span>
        <strong className="mt-0.5 text-sm font-semibold tracking-[-0.025em] tabular-nums sm:text-xl">
          {formatCurrency(data.totalExpenseAmount)}
        </strong>
      </div>
    </div>
  )
}

function PaymentSummaryPanel({ data }: { data: AnalysisPaymentsViewModel }) {
  return (
    <AnalysisPanel>
      <h2 className="text-base font-semibold sm:text-lg">支払い方法サマリー</h2>
      <div className="mx-auto mt-4 grid max-w-4xl grid-cols-[9rem_minmax(0,1fr)] items-center gap-3 sm:mt-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
        <PaymentDonut data={data} />
        <ul className="min-w-0 space-y-1 sm:space-y-2">
          {data.payments.map((payment, index) => (
            <li
              className="grid min-h-10 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg"
              key={payment.id}
            >
              <PaymentIcon index={index} payment={payment} />
              <span className="min-w-0 truncate text-[0.6875rem] font-semibold sm:text-sm">
                {payment.name}
              </span>
              <span className="text-right text-[0.6875rem] tabular-nums sm:text-sm">
                <span className="block font-semibold">
                  {formatCurrency(payment.amount)}
                </span>
                <span className="block text-[0.625rem] text-muted-foreground sm:text-xs">
                  {formatPercent(payment.ratio)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <a
        className="mt-4 flex min-h-11 items-center justify-between rounded-xl border px-4 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        href="#payment-details"
      >
        支払い方法の取引一覧を見る
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </a>
    </AnalysisPanel>
  )
}

type PaymentTrendRow = {
  bucket: string
  label: string
} & Record<string, string | number>

function buildTrendRows(data: AnalysisPaymentsViewModel): PaymentTrendRow[] {
  const buckets = new Map<string, PaymentTrendRow>()
  data.payments.forEach((payment) => {
    payment.series.forEach((item) => {
      const row = buckets.get(item.bucket) ?? {
        bucket: item.bucket,
        label: item.label,
      }
      row[payment.id] = item.expenseAmount
      buckets.set(item.bucket, row)
    })
  })
  return [...buckets.values()].sort((left, right) =>
    left.bucket.localeCompare(right.bucket),
  )
}

function formatAxisAmount(value: number) {
  if (value === 0) {
    return '¥0'
  }
  return `¥${Math.round(value / 10_000)}万`
}

function PaymentTrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    color?: string
    name?: string
    value?: number
    payload?: { label?: string }
  }>
}) {
  const visible = payload?.filter((item) => item.value !== undefined) ?? []
  if (!active || visible.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{visible[0].payload?.label}</p>
      <ul className="mt-1.5 space-y-1">
        {visible.map((item) => (
          <li className="flex items-center justify-between gap-5" key={item.name}>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(item.value ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PaymentTrendPanel({ data }: { data: AnalysisPaymentsViewModel }) {
  const rows = buildTrendRows(data)

  return (
    <AnalysisPanel>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold sm:text-lg">
          支払い方法別の支出推移
        </h2>
        <span className="rounded-lg bg-muted px-3 py-2 text-xs font-medium sm:text-sm">
          月別
        </span>
      </div>
      <div
        aria-label="直近6か月の支払い方法別支出推移グラフ"
        className="mt-4 h-56 w-full sm:h-72"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={rows}
            margin={{ bottom: 0, left: 0, right: 14, top: 18 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={0}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              tickFormatter={(value) => formatAxisAmount(Number(value))}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<PaymentTrendTooltip />}
              cursor={{ stroke: 'var(--border)' }}
            />
            {data.payments.map((payment, index) => (
              <Line
                activeDot={{ r: 5, strokeWidth: 0 }}
                dataKey={payment.id}
                dot={{
                  fill: paymentColors[index % paymentColors.length],
                  r: 3.5,
                  strokeWidth: 0,
                }}
                isAnimationActive
                key={payment.id}
                name={payment.name}
                stroke={paymentColors[index % paymentColors.length]}
                strokeWidth={2.25}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul
        aria-label="支払い方法別支出推移の凡例"
        className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[0.6875rem] sm:text-xs"
      >
        {data.payments.map((payment, index) => (
          <li className="flex items-center gap-1.5" key={payment.id}>
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: paymentColors[index % paymentColors.length] }}
            />
            {payment.name}
          </li>
        ))}
      </ul>
    </AnalysisPanel>
  )
}

function formatTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(year, month - 1, day).getDay()
  ]
  return `${month}月${day}日（${weekday}）`
}

function PaymentTransactionRow({ item }: { item: PaymentTransactionItem }) {
  return (
    <li className="grid grid-cols-[minmax(5.8rem,auto)_minmax(0,1fr)_auto] items-center gap-2 px-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-2">
      <span className="text-[0.6875rem] font-medium sm:text-sm">
        {formatTransactionDate(item.date)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-sm">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground sm:text-xs">
          {item.categoryName} · {item.subcategoryName}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-xs font-semibold text-expense tabular-nums sm:text-sm">
          {formatCurrency(item.amount)}
        </span>
        {item.time ? (
          <span className="block text-[0.625rem] text-muted-foreground tabular-nums sm:text-xs">
            {item.time.slice(0, 5)}
          </span>
        ) : null}
      </span>
    </li>
  )
}

function PaymentTransactions({ payment }: { payment: PaymentMethodItem }) {
  const [expanded, setExpanded] = useState(false)
  const visibleTransactions = expanded
    ? payment.transactions
    : payment.transactions.slice(0, 5)

  return (
    <div className="border-t bg-muted/20 px-3 pb-3 sm:px-5 sm:pb-4">
      <div className="flex items-center justify-between gap-4 py-3">
        <p className="text-xs font-semibold sm:text-sm">{payment.name}の取引</p>
        <span className="text-[0.6875rem] text-muted-foreground tabular-nums sm:text-xs">
          {payment.transactions.length}件
        </span>
      </div>
      {visibleTransactions.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card px-2 sm:px-3">
          {visibleTransactions.map((transaction) => (
            <PaymentTransactionRow item={transaction} key={transaction.id} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          この支払い方法の取引はありません
        </div>
      )}
      {payment.transactions.length > 5 ? (
        <button
          aria-expanded={expanded}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border bg-card text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded
            ? '最新5件に戻す'
            : `すべて表示（${payment.transactions.length}件）`}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
          />
        </button>
      ) : null}
    </div>
  )
}

function PaymentDetailsPanel({
  data,
  selectedPayment,
  onPaymentChange,
}: {
  data: AnalysisPaymentsViewModel
  selectedPayment: PaymentMethodItem | null
  onPaymentChange: (paymentId: string | null) => void
}) {
  return (
    <AnalysisPanel className="scroll-mt-4 overflow-hidden p-0" id="payment-details">
      <div className="flex items-baseline justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">支払い方法の詳細</h2>
        <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
          {data.payments.length}件
        </span>
      </div>
      <ul className="divide-y border-t">
        {data.payments.map((payment, index) => {
          const isSelected = selectedPayment?.id === payment.id
          return (
            <li key={payment.id}>
              <button
                aria-expanded={isSelected}
                className="grid min-h-20 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 sm:min-h-24 sm:px-6"
                onClick={() =>
                  onPaymentChange(isSelected ? null : payment.id)
                }
                type="button"
              >
                <PaymentIcon index={index} payment={payment} size="large" />
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold sm:text-base">
                      {payment.name}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1 text-[0.625rem] text-muted-foreground sm:text-xs">
                      {payment.typeName ?? '未分類'}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.6875rem] text-muted-foreground sm:text-sm">
                    取引数{' '}
                    <span className="tabular-nums">
                      {payment.transactionCount}件
                    </span>
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block text-sm font-semibold text-expense sm:text-base">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="mt-1 block text-[0.625rem] text-muted-foreground sm:text-xs">
                    平均単価 {formatCurrency(payment.averageAmount)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-4 text-muted-foreground transition-transform',
                    isSelected && 'rotate-90',
                  )}
                />
              </button>
              {isSelected ? <PaymentTransactions payment={payment} /> : null}
            </li>
          )
        })}
      </ul>
    </AnalysisPanel>
  )
}

function PaymentsSkeleton() {
  return (
    <div
      aria-label="支払い方法分析を読み込んでいます"
      className="space-y-3 sm:space-y-4"
      role="status"
    >
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

function EmptyPayments({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <PeriodPanel label={rangeLabel} />
      <AnalysisPanel className="flex min-h-64 flex-col items-center justify-center text-center">
        <WalletCards aria-hidden="true" className="size-8 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">この期間の支出はありません</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          支払い方法を設定して支出を記録すると、方法別の傾向を確認できます。
        </p>
      </AnalysisPanel>
    </div>
  )
}

export function AnalysisPaymentsContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPaymentId = searchParams.get('payment')
  const range = useMemo(() => createAnalysisRange(), [])
  const payments = useAnalysisPayments(range)
  const selectedPayment = payments.data
    ? getSelectedPayment(payments.data.payments, rawPaymentId)
    : null

  useEffect(() => {
    if (!rawPaymentId || !payments.data || selectedPayment) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    setSearchParams(next, { replace: true })
  }, [payments.data, rawPaymentId, searchParams, selectedPayment, setSearchParams])

  const setPayment = (paymentId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (paymentId) {
      next.set('payment', paymentId)
    } else {
      next.delete('payment')
    }
    setSearchParams(next)
  }

  if (payments.isPending) {
    return <PaymentsSkeleton />
  }

  if (payments.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <PeriodPanel label={range.label} />
        <ErrorState
          message={
            payments.error instanceof Error
              ? payments.error.message
              : '支払い方法分析データを取得できませんでした。'
          }
          onRetry={() => void payments.refetch()}
          title="支払い方法分析を表示できません"
        />
      </div>
    )
  }

  if (!payments.data || payments.data.payments.length === 0) {
    return <EmptyPayments rangeLabel={range.label} />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <PeriodPanel label={payments.data.range.label} />
      <PaymentSummaryPanel data={payments.data} />
      <PaymentTrendPanel data={payments.data} />
      <PaymentDetailsPanel
        data={payments.data}
        onPaymentChange={setPayment}
        selectedPayment={selectedPayment}
      />
    </div>
  )
}
