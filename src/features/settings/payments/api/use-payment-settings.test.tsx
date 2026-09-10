import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/test/msw/server'
import { usePaymentSettings } from './use-payment-settings'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: { getIdToken: async () => 'test-token' } }),
}))

const payments = [
  {
    payment_id: '1',
    payment_name: '現金',
    payment_type_id: 'cash',
    closing_date: 0,
    payment_date: null,
  },
  {
    payment_id: '2',
    payment_name: 'カード',
    payment_type_id: 'card',
    closing_date: 31,
    payment_date: 27,
  },
]

describe('payment reordering', () => {
  it.each([true, false])(
    'updates the visible order optimistically and handles success=%s',
    async (success) => {
      let savedPayments = payments
      let finish: ((response: Response) => void) | undefined
      let requestedOrder: unknown
      server.use(
        http.get('http://api.test/api/payment/getPayment', () =>
          HttpResponse.json({ payment_list: savedPayments }),
        ),
        http.get('http://api.test/api/payment/getPaymentType', () =>
          HttpResponse.json({ payment_type_list: [] }),
        ),
        http.put('http://api.test/api/payment/reorder', async ({ request }) => {
          requestedOrder = await request.json()
          return new Promise<Response>((resolve) => {
            finish = resolve
          })
        }),
      )
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result } = renderHook(() => usePaymentSettings(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })
      await waitFor(() => expect(result.current.paymentsQuery.data?.status).toBe(200))
      const nextPayments = [...payments].reverse()
      let pending: Promise<unknown>
      act(() => {
        pending = result.current.reorder(nextPayments).catch((error: unknown) => error)
      })
      await waitFor(() =>
        expect(result.current.paymentsQuery.data?.data).toEqual({ payment_list: nextPayments }),
      )
      await waitFor(() => expect(finish).toBeDefined())
      expect(requestedOrder).toEqual({ payment_ids: ['2', '1'] })
      await act(async () => {
        if (success) savedPayments = nextPayments
        finish?.(
          success
            ? HttpResponse.json({ success: true })
            : HttpResponse.json({ message: 'failed' }, { status: 500 }),
        )
        const outcome = await pending
        if (!success) expect(outcome).toBeInstanceOf(Error)
      })
      await waitFor(() =>
        expect(result.current.paymentsQuery.data?.data).toEqual({
          payment_list: success ? nextPayments : payments,
        }),
      )
    },
  )
})
