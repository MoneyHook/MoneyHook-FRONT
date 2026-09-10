import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/test/msw/server'
import { useCsvImportController } from './use-csv-import-controller'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: { getIdToken: async () => 'test-token' } }),
}))

class ParserWorker {
  static instances: ParserWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  onmessageerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    ParserWorker.instances.push(this)
  }
  complete() {
    this.onmessage?.(
      new MessageEvent('message', {
        data: {
          rows: [
            ['日付', '取引名', '金額'],
            ['2026/08/28', 'ランチ', '1,200'],
          ],
          encoding: 'utf-8',
        },
      }),
    )
  }
}

function renderController(onImported = vi.fn(async () => undefined)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return renderHook(() => useCsvImportController(onImported), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createMemoryRouter([{ path: '/', element: children }])} />
      </QueryClientProvider>
    ),
  })
}

beforeEach(() => {
  localStorage.clear()
  ParserWorker.instances = []
  vi.stubGlobal('Worker', ParserWorker)
  server.use(
    http.get('http://api.test/api/category/getCategoryWithSubCategoryList', () =>
      HttpResponse.json({
        category_list: [
          {
            category_id: '10',
            category_name: '食費',
            sub_category_list: [{ sub_category_id: '11', sub_category_name: '外食', enable: true }],
          },
        ],
      }),
    ),
    http.get('http://api.test/api/payment/getPayment', () =>
      HttpResponse.json({ payment_list: [] }),
    ),
    http.get('http://api.test/api/transaction/getFrequentTransactionName', ({ request }) => {
      if (new URL(request.url).searchParams.get('limit') !== '100') {
        return HttpResponse.json({ message: '候補件数が不正です' }, { status: 400 })
      }
      return HttpResponse.json({
        transaction_list: [
          {
            transaction_name: 'ランチ',
            category_id: '10',
            sub_category_id: '11',
            payment_id: null,
            fixed_flg: false,
          },
        ],
      })
    }),
    http.get('http://api.test/api/transaction/getTimelineData', () =>
      HttpResponse.json({ transaction_list: [] }),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('CSV import controller', () => {
  it('parses, maps and edits rows, then preserves them after a failed import and completes on retry', async () => {
    let shouldFail = true
    const requests: unknown[] = []
    server.use(
      http.post('http://api.test/api/transaction/addTransactionList', async ({ request }) => {
        requests.push(await request.json())
        return shouldFail
          ? HttpResponse.json({ message: 'failed' }, { status: 500 })
          : HttpResponse.json({ success: true })
      }),
    )
    const onImported = vi.fn(async () => undefined)
    const { result } = renderController(onImported)
    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    act(() => result.current.parseFile(new File(['csv'], 'transactions.csv')))
    expect(result.current.state.importing).toBe(true)
    act(() => ParserWorker.instances[0].complete())
    expect(result.current.state.importing).toBe(false)
    expect(result.current.headers).toEqual(['日付', '取引名', '金額'])
    // Update one column per render, as the mapping UI does.
    act(() => result.current.changeMapping('date', 0))
    act(() => result.current.changeMapping('name', 1))
    act(() => result.current.changeMapping('amount', 2))
    await waitFor(() => expect(result.current.selected).toBe(1))
    await waitFor(() => expect(result.current.isCheckingDuplicates).toBe(false))
    act(() =>
      result.current.dispatch({
        type: 'set-row',
        id: 0,
        patch: { amount: '1500' },
        categories: result.current.categories,
      }),
    )
    await waitFor(() => expect(result.current.isCheckingDuplicates).toBe(false))
    act(() => result.current.submit())
    await waitFor(() => expect(result.current.state.error).toContain('取引を登録できませんでした'))
    expect(onImported).not.toHaveBeenCalled()
    expect(result.current.state.previewRows[0].amount).toBe('1500')
    expect(result.current.state.importing).toBe(false)
    shouldFail = false
    act(() => result.current.submit())
    await waitFor(() => expect(result.current.state.step).toBe('complete'))
    expect(result.current.state.importedCount).toBe(1)
    expect(onImported).toHaveBeenCalledOnce()
    expect(requests).toHaveLength(2)
    expect(requests[1]).toEqual({
      transaction_list: [
        {
          transaction_date: '2026-08-28',
          transaction_amount: 1500,
          transaction_sign: -1,
          transaction_name: 'ランチ',
          category_id: '10',
          sub_category_id: '11',
          fixed_flg: false,
        },
      ],
    })
    act(() => result.current.restart())
    expect(result.current.state.file).toBeNull()
    expect(result.current.state.previewRows).toEqual([])
  })

  it('terminates a replaced parser and the active parser on unmount', async () => {
    const { result, unmount } = renderController()
    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    act(() => result.current.parseFile(new File(['csv'], 'first.csv')))
    act(() => result.current.changeEncoding('shift-jis'))
    expect(ParserWorker.instances[0].terminate).toHaveBeenCalledOnce()
    expect(ParserWorker.instances[1].postMessage).toHaveBeenCalledWith({
      file: expect.any(File),
      encoding: 'shift-jis',
    })
    unmount()
    expect(ParserWorker.instances[1].terminate).toHaveBeenCalledOnce()
  })

  it('reports parser failures and accepts a subsequent file', async () => {
    const { result } = renderController()
    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    act(() => result.current.parseFile(new File(['csv'], 'broken.csv')))
    act(() => ParserWorker.instances[0].onerror?.(new ErrorEvent('error')))
    expect(result.current.state.importing).toBe(false)
    expect(result.current.state.error).toContain('CSV解析用の処理を読み込めませんでした')
    expect(ParserWorker.instances[0].terminate).toHaveBeenCalledOnce()
    act(() => result.current.parseFile(new File(['csv'], 'valid.csv')))
    act(() => ParserWorker.instances[1].complete())
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.rows).toHaveLength(2)
  })

  it('checks each import month once, flags matches, and permits import after a check failure', async () => {
    const checkedMonths: string[] = []
    const requests: unknown[] = []
    server.use(
      http.get('http://api.test/api/transaction/getTimelineData', ({ request }) => {
        const month = new URL(request.url).searchParams.get('month')
        if (month) checkedMonths.push(month)
        if (month === '2026-10-01') return HttpResponse.json({ message: 'failed' }, { status: 500 })
        return HttpResponse.json({
          transaction_list: [{
            transaction_id: 'existing', transaction_name: '登録済みランチ', transaction_amount: 1200,
            transaction_sign: -1, transaction_date: '2026-09-28', category_id: '10', category_name: '食費',
            sub_category_id: '11', sub_category_name: '外食', fixed_flg: false, payment_id: null, payment_name: null,
          }],
        })
      }),
      http.post('http://api.test/api/transaction/addTransactionList', async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json({ success: true })
      }),
    )
    const { result } = renderController()
    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    act(() => result.current.dispatch({
      type: 'patch',
      patch: {
        previewRows: [
          { id: 0, sourceRowNumber: 2, source: [], date: '2026-09-28', name: 'ランチ', amount: '1200', categoryId: '10', subcategoryId: '11', paymentId: '', selected: true, errors: [] },
          { id: 1, sourceRowNumber: 3, source: [], date: '2026-10-01', name: '別の取引', amount: '500', categoryId: '10', subcategoryId: '11', paymentId: '', selected: true, errors: [] },
        ],
      },
    }))
    expect(result.current.isCheckingDuplicates).toBe(true)
    act(() => result.current.submit())
    expect(requests).toHaveLength(0)
    await waitFor(() => expect(result.current.isCheckingDuplicates).toBe(false))
    expect(checkedMonths.sort()).toEqual(['2026-09-01', '2026-10-01'])
    expect(result.current.duplicateCandidates.get(0)).toEqual([expect.objectContaining({ transaction_id: 'existing' })])
    expect(result.current.duplicateCandidates.has(1)).toBe(false)
    expect(result.current.failedDuplicateCheckMonths).toEqual(['2026-10-01'])
    act(() => result.current.submit())
    await waitFor(() => expect(requests).toHaveLength(1))
  })
})
