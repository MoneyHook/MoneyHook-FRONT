import { ErrorState } from '@/shared/components/app-state'
import type { AnalysisRange } from '../model/analysis-overview'
import { useAnalysisPaymentsController } from '../hooks/use-analysis-payments-controller'
import { PaymentsSkeleton, EmptyPayments } from './payments/payments-analysis-states'
import { PaymentSummaryPanel } from './payments/payment-summary-panel'
import { PaymentTrendPanel } from './payments/payment-trend-panel'
import { PaymentDetailsPanel } from './payments/payment-details-panel'

export function AnalysisPaymentsContent({ range }: { range: AnalysisRange }) {
  const {
    payments,
    selectedPayment,
    setPayment,
    openTransaction,
  } = useAnalysisPaymentsController(range)

  if (payments.isPending) {
    return <PaymentsSkeleton />
  }

  if (payments.isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
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
    return <EmptyPayments />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
      <PaymentSummaryPanel data={payments.data} />
      <PaymentTrendPanel data={payments.data} />
      <PaymentDetailsPanel
        data={payments.data}
        onOpen={openTransaction}
        onPaymentChange={setPayment}
        selectedPayment={selectedPayment}
      />
    </div>
  )
}
