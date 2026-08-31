import { describe, expect, it } from 'vitest'

import type { V1PaymentsResponse } from '@/shared/api/generated/model'

import { createAnalysisRange } from './analysis-overview'
import {
  buildAnalysisPaymentsViewModel,
  getSelectedPayment,
  UNCLASSIFIED_PAYMENT_ID,
} from './analysis-payments'

const range = createAnalysisRange(new Date(2026, 7, 30, 12))

function response(): V1PaymentsResponse {
  return {
    range: { start_date: range.startDate, end_date: range.endDate },
    total_expense_amount: 18_000,
    payment_list: [
      {
        payment_id: null,
        payment_name: '未分類',
        payment_type_id: null,
        payment_type_name: null,
        is_payment_due_later: null,
        expense_amount: 3_000,
        ratio: 16.7,
        transaction_count: 1,
        average_amount: 3_000,
        series: [
          { bucket: '2026-03-01', expense_amount: 0 },
          { bucket: '2026-08-01', expense_amount: 3_000 },
        ],
        transaction_list: [
          {
            transaction_id: '3',
            transaction_date: '2026-08-01',
            transaction_time: null,
            transaction_name: '支払い元なし',
            amount: 3_000,
            sign: -1,
            signed_amount: -3_000,
            category_id: '1',
            category_name: '食費',
            sub_category_id: '10',
            sub_category_name: '外食',
            fixed_flg: false,
            payment_id: null,
            payment_name: null,
          },
        ],
      },
      {
        payment_id: '2',
        payment_name: '現金',
        payment_type_id: '1',
        payment_type_name: '現金',
        is_payment_due_later: false,
        expense_amount: 15_000,
        ratio: 83.3,
        transaction_count: 2,
        average_amount: 7_500,
        series: [
          { bucket: '2026-03-01', expense_amount: 5_000 },
          { bucket: '2026-08-01', expense_amount: 10_000 },
        ],
        transaction_list: [
          {
            transaction_id: '1',
            transaction_date: '2026-08-01',
            transaction_time: '09:00:00',
            transaction_name: '朝食',
            amount: 5_000,
            sign: -1,
            signed_amount: -5_000,
            category_id: '1',
            category_name: '食費',
            sub_category_id: '10',
            sub_category_name: '外食',
            fixed_flg: false,
            payment_id: '2',
            payment_name: '現金',
          },
          {
            transaction_id: '2',
            transaction_date: '2026-08-02',
            transaction_time: '12:00:00',
            transaction_name: '昼食',
            amount: 10_000,
            sign: -1,
            signed_amount: -10_000,
            category_id: '1',
            category_name: '食費',
            sub_category_id: '10',
            sub_category_name: '外食',
            fixed_flg: false,
            payment_id: '2',
            payment_name: '現金',
          },
        ],
      },
    ],
  }
}

describe('analysis payments model', () => {
  it('sorts payment methods and maps monthly series and transactions', () => {
    const model = buildAnalysisPaymentsViewModel(response(), range)

    expect(model.totalExpenseAmount).toBe(18_000)
    expect(model.payments.map((payment) => payment.name)).toEqual([
      '現金',
      '未分類',
    ])
    expect(model.payments[0].series.map((item) => item.label)).toEqual([
      '3月',
      '8月',
    ])
    expect(model.payments[0].transactions.map((item) => item.id)).toEqual([
      '2',
      '1',
    ])
    expect(model.payments[0]).toMatchObject({
      id: '2',
      typeName: '現金',
      isPaymentDueLater: false,
      transactionCount: 2,
      averageAmount: 7_500,
    })
  })

  it('uses a stable id for unclassified expenses and resolves selection', () => {
    const model = buildAnalysisPaymentsViewModel(response(), range)
    const unclassified = model.payments[1]

    expect(unclassified.id).toBe(UNCLASSIFIED_PAYMENT_ID)
    expect(getSelectedPayment(model.payments, UNCLASSIFIED_PAYMENT_ID)).toBe(
      unclassified,
    )
    expect(getSelectedPayment(model.payments, 'missing')).toBeNull()
    expect(getSelectedPayment(model.payments, null)).toBeNull()
  })

  it('keeps an empty response stable', () => {
    const empty = response()
    empty.total_expense_amount = 0
    empty.payment_list = []

    expect(buildAnalysisPaymentsViewModel(empty, range)).toEqual({
      range,
      totalExpenseAmount: 0,
      payments: [],
    })
  })
})
