import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnalysisPayments } from '../api/use-analysis-payments'
import { getSelectedPayment } from '../model/analysis-payments'
import type { AnalysisRange } from '../model/analysis-overview'

export function useAnalysisPaymentsController(range: AnalysisRange) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPaymentId = searchParams.get('payment')
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
  }, [
    payments.data,
    rawPaymentId,
    searchParams,
    selectedPayment,
    setSearchParams,
  ])

  const setPayment = (paymentId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (paymentId) {
      next.set('payment', paymentId)
    } else {
      next.delete('payment')
    }
    setSearchParams(next)
  }

  const openTransaction = (transactionId: string) => {
    navigate(`/app/transactions/${encodeURIComponent(transactionId)}/edit`, {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    })
  }

  return { payments, selectedPayment, setPayment, openTransaction }
}
