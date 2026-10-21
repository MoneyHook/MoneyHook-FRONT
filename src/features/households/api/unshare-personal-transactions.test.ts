import { beforeEach, describe, expect, it, vi } from 'vitest'

import { householdBulkUnshare } from '@/shared/api/generated/household/household'

import { unsharePersonalTransactions } from './unshare-personal-transactions'

vi.mock('@/shared/api/generated/household/household', () => ({
  householdBulkShare: vi.fn(),
  householdBulkUnshare: vi.fn(),
  householdShareStatus: vi.fn(() => {
    throw new Error('単件取得は禁止')
  }),
  householdShare: vi.fn(() => {
    throw new Error('単件更新は禁止')
  }),
  householdUnshare: vi.fn(() => {
    throw new Error('単件更新は禁止')
  }),
}))
vi.mock('@/shared/api/generated/transaction/transaction', () => ({
  getV1Transaction: vi.fn(() => {
    throw new Error('詳細取得は禁止')
  }),
}))
const update = vi.mocked(householdBulkUnshare)
const headers = new Headers()
beforeEach(() => {
  vi.resetAllMocks()
  update.mockImplementation(async (_family, body) => ({
    status: 200,
    data: {
      results: body.transaction_ids.map((transaction_id) => ({
        transaction_id,
        outcome: 'unshared' as const,
      })),
    },
    headers,
  }))
})
describe('unsharePersonalTransactions', () => {
  it('sends unique IDs in one request without individual lookups', async () => {
    expect(
      await unsharePersonalTransactions('family', ['1', '2', '1']),
    ).toEqual([
      { transactionId: '1', outcome: 'unshared' },
      { transactionId: '2', outcome: 'unshared' },
    ])
    expect(update.mock.calls).toEqual([
      ['family', { transaction_ids: ['1', '2'] }],
    ])
  })
  it('does not request an empty selection', async () => {
    expect(await unsharePersonalTransactions('family', [])).toEqual([])
    expect(update).not.toHaveBeenCalled()
  })
  it('preserves partial failures and already completed results', async () => {
    update.mockResolvedValueOnce({
      status: 200,
      headers,
      data: {
        results: [
          { transaction_id: '1', outcome: 'already-unshared' },
          {
            transaction_id: '2',
            outcome: 'failed',
            code: 'NOT_FOUND',
            message: '見つかりません',
          },
        ],
      },
    })
    expect(await unsharePersonalTransactions('family', ['1', '2'])).toEqual([
      { transactionId: '1', outcome: 'already-unshared' },
      { transactionId: '2', outcome: 'failed', message: '見つかりません' },
    ])
  })
  it('marks all submitted IDs as failed on a network error', async () => {
    update.mockRejectedValueOnce(new Error('接続失敗'))
    expect(await unsharePersonalTransactions('family', ['1', '2'])).toEqual([
      { transactionId: '1', outcome: 'failed', message: '接続失敗' },
      { transactionId: '2', outcome: 'failed', message: '接続失敗' },
    ])
  })
  it('splits only above 1000 and continues after a failed batch', async () => {
    const ids = Array.from({ length: 1001 }, (_, i) => String(i + 1))
    update.mockRejectedValueOnce(new Error('失敗'))
    const results = await unsharePersonalTransactions('family', ids)
    expect(
      update.mock.calls.map((call) => call[1].transaction_ids.length),
    ).toEqual([1000, 1])
    expect(results).toHaveLength(1001)
    expect(
      results.filter((result) => result.outcome === 'failed'),
    ).toHaveLength(1000)
    expect(results[1000]).toMatchObject({
      transactionId: '1001',
      outcome: 'unshared',
    })
  })
  it('sends exactly 1000 in one request', async () => {
    await unsharePersonalTransactions(
      'family',
      Array.from({ length: 1000 }, (_, i) => String(i + 1)),
    )
    expect(update).toHaveBeenCalledTimes(1)
  })
})
