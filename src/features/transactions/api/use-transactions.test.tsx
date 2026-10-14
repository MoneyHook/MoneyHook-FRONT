import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/query-client'
import type { V1TransactionResource } from '@/shared/api/generated/model'
import { listV1Transactions } from '@/shared/api/generated/transaction/transaction'
import {
  createPersistedQueryKey,
  writePersistedQueryData,
} from '@/shared/lib/persisted-user-data'

import {
  buildTransactionsViewModelFromItems,
  type TransactionItem,
} from '../model/transactions'
import { useTransactions } from './use-transactions'

vi.mock('@/shared/api/generated/transaction/transaction', () => ({
  listV1Transactions: vi.fn(),
}))

const month = '2026-09-01'
const queryKey = ['/api/v1/transactions', { month, sharing: 'all' }]
const storageKey = (value = month) =>
  createPersistedQueryKey('transaction-list', {
    month: value,
    sharing: 'all',
  })
const cached: TransactionItem = {
  id: 'cached',
  name: '保存済み',
  amount: 1200,
  sign: -1,
  date: '2026-09-20',
  categoryId: '10',
  categoryName: '食費',
  subcategoryName: '外食',
  fixed: false,
  paymentId: null,
  paymentName: null,
}
const fresh: V1TransactionResource = {
  transaction_id: 'fresh',
  transaction_name: 'API取得',
  transaction_date: '2026-09-21',
  transaction_time: null,
  amount: 2400,
  sign: -1,
  signed_amount: -2400,
  category_id: '10',
  category_name: '食費',
  sub_category_id: '11',
  sub_category_name: '外食',
  fixed_flg: false,
  payment_id: null,
  payment_name: null,
  shared: true,
}

function page(
  transactions: V1TransactionResource[],
  next_cursor: string | null = null,
): Awaited<ReturnType<typeof listV1Transactions>> {
  return {
    status: 200,
    headers: new Headers(),
    data: { transactions, next_cursor },
  }
}

function pendingPage() {
  let resolve!: (value: ReturnType<typeof page>) => void
  const promise = new Promise<ReturnType<typeof page>>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

function persistedItems(value = month): TransactionItem[] | undefined {
  const raw = localStorage.getItem(storageKey(value))
  return raw ? JSON.parse(raw).value : undefined
}

const clients: ReturnType<typeof createAppQueryClient>[] = []
function setup() {
  const client = createAppQueryClient()
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retry: false },
  })
  clients.push(client)
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  vi.mocked(listV1Transactions).mockResolvedValue(page([fresh]))
})
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
})

describe('transaction list query and persistence contract', () => {
  it('uses persisted rows as a placeholder and replaces both caches after every page completes', async () => {
    writePersistedQueryData(storageKey(), 1, [cached])
    const secondPage = pendingPage()
    vi.mocked(listV1Transactions)
      .mockResolvedValueOnce(page([fresh], 'next'))
      .mockReturnValueOnce(secondPage.promise)
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useTransactions(month), { wrapper })

    expect(result.current.data?.items).toEqual([cached])
    expect(result.current.isPending).toBe(false)
    expect(client.getQueryData(queryKey)).toBeUndefined()
    await waitFor(() => expect(listV1Transactions).toHaveBeenCalledTimes(2))
    expect(listV1Transactions).toHaveBeenNthCalledWith(
      2,
      { month, sharing: 'all', cursor: 'next' },
      { signal: expect.any(AbortSignal) },
    )
    expect(result.current.data?.items).toEqual([cached])
    expect(persistedItems()).toEqual([cached])

    secondPage.resolve(
      page([{ ...fresh, transaction_id: 'second', amount: 600 }]),
    )
    await waitFor(() => expect(result.current.data?.items).toHaveLength(2))
    expect(result.current.data?.expenseAmount).toBe(3000)
    expect(result.current.data?.items.every((item) => item.shared)).toBe(true)
    expect(client.getQueryData(queryKey)).toEqual(result.current.data)
    expect(persistedItems()).toEqual(result.current.data?.items)
  })

  it('fetches without either cache and persists an empty month', async () => {
    const pending = pendingPage()
    vi.mocked(listV1Transactions).mockReturnValue(pending.promise)
    const { wrapper } = setup()
    const { result } = renderHook(() => useTransactions(month), { wrapper })
    expect(result.current.data).toBeNull()
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(listV1Transactions).toHaveBeenCalledTimes(1))
    pending.resolve(page([]))
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.data?.items).toEqual([])
    expect(persistedItems()).toEqual([])
  })

  it('prefers query data within one hour over persisted rows without fetching', () => {
    writePersistedQueryData(storageKey(), 1, [cached])
    const { client, wrapper } = setup()
    const data = buildTransactionsViewModelFromItems([
      { ...cached, id: 'memory' },
    ])
    client.setQueryData(queryKey, data, {
      updatedAt: Date.now() - 59 * 60 * 1000,
    })
    const { result } = renderHook(() => useTransactions(month), { wrapper })
    expect(client.getDefaultOptions().queries?.staleTime).toBe(60 * 60 * 1000)
    expect(result.current.data).toEqual(data)
    expect(listV1Transactions).not.toHaveBeenCalled()
  })

  it('refreshes query data older than one hour and persists the result', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(
      queryKey,
      buildTransactionsViewModelFromItems([cached]),
      {
        updatedAt: Date.now() - 61 * 60 * 1000,
      },
    )
    const { result } = renderHook(() => useTransactions(month), { wrapper })
    expect(result.current.data?.items).toEqual([cached])
    await waitFor(() => expect(result.current.data?.items[0].id).toBe('fresh'))
    expect(listV1Transactions).toHaveBeenCalledTimes(1)
    expect(persistedItems()).toEqual(result.current.data?.items)
  })

  it('retains persisted data when a later page fails without storing partial results', async () => {
    writePersistedQueryData(storageKey(), 1, [cached])
    vi.mocked(listV1Transactions)
      .mockResolvedValueOnce(page([fresh], 'next'))
      .mockRejectedValueOnce(new Error('取得失敗'))
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useTransactions(month), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data?.items).toEqual([cached])
    expect(result.current.isPending).toBe(false)
    expect(client.getQueryData(queryKey)).toBeUndefined()
    expect(persistedItems()).toEqual([cached])
  })

  it.each([null, [{}], [{ ...cached, sign: 0 }]])(
    'rejects invalid persisted rows: %j',
    async (value) => {
      writePersistedQueryData(storageKey(), 1, value)
      const { wrapper } = setup()
      const { result } = renderHook(() => useTransactions(month), { wrapper })
      expect(result.current.data).toBeNull()
      expect(localStorage.getItem(storageKey())).toBeNull()
      await waitFor(() =>
        expect(result.current.data?.items[0].id).toBe('fresh'),
      )
    },
  )

  it('keeps different months separate when the hook changes its query key', async () => {
    const nextMonth = '2026-08-01'
    const nextCached = { ...cached, id: 'august', date: '2026-08-20' }
    writePersistedQueryData(storageKey(nextMonth), 1, [nextCached])
    const pending = pendingPage()
    vi.mocked(listV1Transactions)
      .mockResolvedValueOnce(page([fresh]))
      .mockReturnValueOnce(pending.promise)
    const { wrapper } = setup()
    const { result, rerender } = renderHook(
      ({ selectedMonth }) => useTransactions(selectedMonth),
      { initialProps: { selectedMonth: month }, wrapper },
    )
    await waitFor(() => expect(result.current.data?.items[0].id).toBe('fresh'))
    rerender({ selectedMonth: nextMonth })
    expect(result.current.data?.items).toEqual([nextCached])
    await waitFor(() => expect(listV1Transactions).toHaveBeenCalledTimes(2))
    pending.resolve(page([]))
    await waitFor(() => expect(result.current.data?.items).toEqual([]))
    expect(persistedItems(nextMonth)).toEqual([])
    expect(persistedItems()?.[0].id).toBe('fresh')
  })

  it('does not persist a response after its query is cancelled', async () => {
    writePersistedQueryData(storageKey(), 1, [cached])
    const pending = pendingPage()
    vi.mocked(listV1Transactions).mockReturnValue(pending.promise)
    const { client, wrapper } = setup()
    const { unmount } = renderHook(() => useTransactions(month), { wrapper })
    await waitFor(() => expect(listV1Transactions).toHaveBeenCalledTimes(1))
    const signal = vi.mocked(listV1Transactions).mock.calls[0][1]?.signal
    unmount()
    expect(signal?.aborted).toBe(true)
    await act(async () => pending.resolve(page([fresh])))
    expect(persistedItems()).toEqual([cached])
    expect(client.getQueryData(queryKey)).toBeUndefined()
  })
})
