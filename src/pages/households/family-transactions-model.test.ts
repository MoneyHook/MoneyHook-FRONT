import { describe, expect, it } from 'vitest'

import type { HouseholdEntry } from '@/shared/api/generated/model'

import { buildFamilyTransactionsViewModel } from './family-transactions-model'

function entry(overrides: Partial<HouseholdEntry> = {}): HouseholdEntry {
  return {
    entry_id: '1',
    transaction_date: '2026-09-20',
    transaction_time: null,
    transaction_name: '食材',
    amount: 1200,
    signed_amount: -1200,
    sign: -1,
    category_id: '10',
    category_name: '食費',
    fixed_flg: false,
    payment_id: null,
    household_payment_id: '20',
    household_payment_name: '家族カード',
    household_sub_category_id: '30',
    household_sub_category_name: '食材',
    kind: 'proxy',
    version: 1,
    payer: { kind: 'common', member_id: null },
    created_by: '1',
    updated_by: '1',
    updated_at: '2026-09-20T10:00:00Z',
    permissions: {
      can_edit: true,
      can_delete: true,
      can_unshare: false,
      can_correct: false,
    },
    captured_at: null,
    corrected: false,
    excluded_from_totals: false,
    ...overrides,
  }
}

describe('family transaction data', () => {
  it('retains excluded records while excluding their expenses and income from daily and monthly totals', () => {
    const result = buildFamilyTransactionsViewModel([
      entry(),
      entry({
        entry_id: '2',
        amount: 9000,
        excluded_from_totals: true,
        kind: 'snapshot',
      }),
      entry({ entry_id: '3', amount: 5000, sign: 1 }),
      entry({
        entry_id: '4',
        amount: 8000,
        sign: 1,
        excluded_from_totals: true,
      }),
    ])
    expect(result.items).toHaveLength(4)
    expect(result).toMatchObject({
      expenseAmount: 1200,
      incomeAmount: 5000,
      balanceAmount: 3800,
    })
    expect(result.groups[0]).toMatchObject({
      expenseAmount: 1200,
      incomeAmount: 5000,
    })
    expect(
      result.items.find((item) => item.id === '2')?.excludedFromTotals,
    ).toBe(true)
  })

  it('combines payer and kind filters for the same list, calendar and totals', () => {
    const rows = [
      entry(),
      entry({
        entry_id: '2',
        kind: 'shared',
        payer: { kind: 'member', member_id: '5' },
      }),
      entry({
        entry_id: '3',
        kind: 'proxy',
        payer: { kind: 'member', member_id: '5' },
      }),
    ]
    expect(
      buildFamilyTransactionsViewModel(rows, '5', 'shared').items.map(
        (item) => item.id,
      ),
    ).toEqual(['2'])
    expect(
      buildFamilyTransactionsViewModel(rows, 'common').items.map(
        (item) => item.id,
      ),
    ).toEqual(['1'])
    expect(
      buildFamilyTransactionsViewModel(rows, 'missing').balanceAmount,
    ).toBe(0)
  })

  it('uses family references and orders day groups newest first without changing input', () => {
    const rows = [
      entry({ transaction_date: '2026-09-01' }),
      entry({ entry_id: '2' }),
    ]
    const original = structuredClone(rows)
    const result = buildFamilyTransactionsViewModel(rows)
    expect(rows).toEqual(original)
    expect(result.groups.map((group) => group.date)).toEqual([
      '2026-09-20',
      '2026-09-01',
    ])
    expect(result.items[0]).toMatchObject({
      paymentId: '20',
      paymentName: '家族カード',
      subcategoryName: '食材',
    })
  })
})
