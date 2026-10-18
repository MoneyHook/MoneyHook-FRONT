import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  householdShareStatus,
  householdUnshare,
} from '@/shared/api/generated/household/household'

import { unsharePersonalTransactions } from './unshare-personal-transactions'

vi.mock('@/shared/api/generated/household/household', () => ({
  householdShareStatus: vi.fn(),
  householdUnshare: vi.fn(),
}))

const status = vi.mocked(householdShareStatus)
const unshare = vi.mocked(householdUnshare)
const headers = new Headers()

beforeEach(() => {
  vi.resetAllMocks()
  status.mockResolvedValue({
    status: 200,
    data: { state: 'active', kind: 'shared', version: 3 },
    headers,
  })
  unshare.mockResolvedValue({ status: 204, data: undefined, headers })
})

describe('unsharePersonalTransactions', () => {
  it('unshares each unique transaction sequentially with the latest share version', async () => {
    status.mockResolvedValueOnce({
      status: 200,
      data: { state: 'active', kind: 'shared', version: 7 },
      headers,
    })
    expect(
      await unsharePersonalTransactions('family', ['a', 'b', 'a']),
    ).toEqual([
      { transactionId: 'a', outcome: 'unshared' },
      { transactionId: 'b', outcome: 'unshared' },
    ])
    expect(unshare.mock.calls).toEqual([
      ['family', 'a', { expected_version: 7 }],
      ['family', 'b', { expected_version: 3 }],
    ])
    expect(status.mock.invocationCallOrder[1]).toBeGreaterThan(
      unshare.mock.invocationCallOrder[0],
    )
  })

  it.each(['none', 'withdrawn', 'deleted'] as const)(
    'skips a transaction in state %s without sending a delete request',
    async (state) => {
      status.mockResolvedValue({
        status: 200,
        data: { state, version: state === 'none' ? 0 : 3 },
        headers,
      })
      expect(await unsharePersonalTransactions('family', ['a'])).toEqual([
        { transactionId: 'a', outcome: 'already-unshared' },
      ])
      expect(unshare).not.toHaveBeenCalled()
    },
  )

  it('rejects an active snapshot without changing the retained record', async () => {
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'snapshot', version: 3 },
      headers,
    })
    expect(await unsharePersonalTransactions('family', ['a'])).toEqual([
      {
        transactionId: 'a',
        outcome: 'failed',
        message: '退出時の控えは共有解除できません。',
      },
    ])
    expect(unshare).not.toHaveBeenCalled()
  })

  it('retains successes and continues after a version conflict', async () => {
    unshare.mockRejectedValueOnce(new Error('他の端末で更新されました。'))
    expect(await unsharePersonalTransactions('family', ['a', 'b'])).toEqual([
      {
        transactionId: 'a',
        outcome: 'failed',
        message: '他の端末で更新されました。',
      },
      { transactionId: 'b', outcome: 'unshared' },
    ])
  })

  it('fetches the current version again when retrying', async () => {
    unshare.mockRejectedValueOnce(new Error('競合'))
    await unsharePersonalTransactions('family', ['a'])
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'shared', version: 9 },
      headers,
    })
    await unsharePersonalTransactions('family', ['a'])
    expect(status).toHaveBeenCalledTimes(2)
    expect(unshare).toHaveBeenLastCalledWith('family', 'a', {
      expected_version: 9,
    })
  })

  it('does not delete again after a lost response when the share is already withdrawn', async () => {
    unshare.mockRejectedValueOnce(new Error('接続できません'))
    await unsharePersonalTransactions('family', ['a'])
    status.mockResolvedValue({
      status: 200,
      data: { state: 'withdrawn', kind: 'shared', version: 4 },
      headers,
    })
    expect(await unsharePersonalTransactions('family', ['a'])).toEqual([
      { transactionId: 'a', outcome: 'already-unshared' },
    ])
    expect(unshare).toHaveBeenCalledTimes(1)
  })

  it('does not delete when share lookup or the current version is unavailable', async () => {
    status.mockRejectedValueOnce(new Error('共有状態を取得できません'))
    status.mockResolvedValue({
      status: 200,
      data: { state: 'active', kind: 'shared', version: 0 },
      headers,
    })
    const results = await unsharePersonalTransactions('family', ['a', 'b'])
    expect(results.map((result) => result.outcome)).toEqual([
      'failed',
      'failed',
    ])
    expect(unshare).not.toHaveBeenCalled()
  })

  it('does not delete after an unsuccessful status response', async () => {
    status.mockResolvedValue({
      status: 404,
      data: { status: 'error', code: 'NOT_FOUND', message: '見つかりません。' },
      headers,
    })
    const results = await unsharePersonalTransactions('family', ['a'])
    expect(results[0].outcome).toBe('failed')
    expect(unshare).not.toHaveBeenCalled()
  })

  it('does not report success for an unsuccessful unshare response', async () => {
    unshare.mockResolvedValue({
      status: 409,
      data: { status: 'error', code: 'CONFLICT', message: '競合しました。' },
      headers,
    })
    expect(await unsharePersonalTransactions('family', ['a'])).toEqual([
      {
        transactionId: 'a',
        outcome: 'failed',
        message: '共有を解除できませんでした。',
      },
    ])
  })
})
