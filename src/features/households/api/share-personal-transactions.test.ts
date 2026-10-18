import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  householdShare,
  householdShareStatus,
} from '@/shared/api/generated/household/household'
import { getV1Transaction } from '@/shared/api/generated/transaction/transaction'

import { sharePersonalTransactions } from './share-personal-transactions'

vi.mock('@/shared/api/generated/household/household', () => ({
  householdShare: vi.fn(),
  householdShareStatus: vi.fn(),
}))
vi.mock('@/shared/api/generated/transaction/transaction', () => ({
  getV1Transaction: vi.fn(),
}))

const status = vi.mocked(householdShareStatus)
const get = vi.mocked(getV1Transaction)
const share = vi.mocked(householdShare)
const headers = new Headers()

beforeEach(() => {
  vi.resetAllMocks()
  status.mockResolvedValue({
    status: 200,
    data: { state: 'none', version: 0 },
    headers,
  })
  get.mockResolvedValue({
    status: 200,
    data: { transaction: { version: 4 } },
    headers,
  } as Awaited<ReturnType<typeof getV1Transaction>>)
  share.mockResolvedValue({ status: 200, data: {}, headers } as Awaited<
    ReturnType<typeof householdShare>
  >)
})

describe('sharePersonalTransactions', () => {
  it('shares each unique transaction sequentially with current versions', async () => {
    status.mockResolvedValueOnce({
      status: 200,
      data: { state: 'withdrawn', version: 3 },
      headers,
    })
    const results = await sharePersonalTransactions('family', ['a', 'b', 'a'])
    expect(results).toEqual([
      { transactionId: 'a', outcome: 'shared' },
      { transactionId: 'b', outcome: 'shared' },
    ])
    expect(share.mock.calls).toEqual([
      ['family', 'a', { source_version: 4, expected_version: 3 }],
      ['family', 'b', { source_version: 4, expected_version: undefined }],
    ])
    expect(status.mock.invocationCallOrder[1]).toBeGreaterThan(
      share.mock.invocationCallOrder[0],
    )
  })

  it('skips an already shared transaction without writing', async () => {
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'shared', version: 2 },
      headers,
    })
    expect(await sharePersonalTransactions('family', ['a'])).toEqual([
      { transactionId: 'a', outcome: 'already-shared' },
    ])
    expect(get).not.toHaveBeenCalled()
    expect(share).not.toHaveBeenCalled()
  })

  it('rejects snapshots even when active', async () => {
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'snapshot', version: 2 },
      headers,
    })
    const results = await sharePersonalTransactions('family', ['a'])
    expect(results[0]).toMatchObject({
      outcome: 'failed',
      message: expect.stringContaining('再共有できません'),
    })
    expect(share).not.toHaveBeenCalled()
  })

  it('retains a conflict reason and continues with the remaining transactions', async () => {
    share.mockRejectedValueOnce(new Error('他の端末で更新されました。'))
    const results = await sharePersonalTransactions('family', ['a', 'b'])
    expect(results).toEqual([
      {
        transactionId: 'a',
        outcome: 'failed',
        message: '他の端末で更新されました。',
      },
      { transactionId: 'b', outcome: 'shared' },
    ])
  })

  it('reads fresh versions when retrying a failed transaction', async () => {
    share.mockRejectedValueOnce(new Error('競合'))
    await sharePersonalTransactions('family', ['a'])
    status.mockResolvedValue({
      status: 200,
      data: { state: 'withdrawn', version: 7 },
      headers,
    })
    get.mockResolvedValue({
      status: 200,
      data: { transaction: { version: 9 } },
      headers,
    } as Awaited<ReturnType<typeof getV1Transaction>>)
    await sharePersonalTransactions('family', ['a'])
    expect(share).toHaveBeenLastCalledWith('family', 'a', {
      source_version: 9,
      expected_version: 7,
    })
  })

  it('does not resend after a lost response if the transaction is now shared', async () => {
    share.mockRejectedValueOnce(new Error('接続できません'))
    await sharePersonalTransactions('family', ['a'])
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'shared', version: 1 },
      headers,
    })
    expect((await sharePersonalTransactions('family', ['a']))[0].outcome).toBe(
      'already-shared',
    )
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('does not write when status lookup or transaction version is unavailable', async () => {
    status.mockRejectedValueOnce(new Error('共有状態を取得できません'))
    get.mockResolvedValue({
      status: 200,
      data: { transaction: {} },
      headers,
    } as Awaited<ReturnType<typeof getV1Transaction>>)
    const results = await sharePersonalTransactions('family', ['a', 'b'])
    expect(results.map((r) => r.outcome)).toEqual(['failed', 'failed'])
    expect(share).not.toHaveBeenCalled()
  })
})
