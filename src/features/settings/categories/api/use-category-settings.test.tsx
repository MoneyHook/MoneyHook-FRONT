import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getGetCategoryWithSubCategoryListQueryKey } from '@/shared/api/generated/category/category'
import { server } from '@/test/msw/server'

import { useCategorySettings } from './use-category-settings'

vi.mock('@/shared/config/environment', () => ({
  getEnvironment: () => ({ apiBaseUrl: 'http://api.test' }),
}))
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: async () => 'test-token' },
  }),
}))

const categoryResponse = {
  status: 200 as const,
  headers: new Headers(),
  data: {
    category_list: [
      {
        category_id: '1',
        category_name: '食費',
        sub_category_list: [
          { sub_category_id: '10', sub_category_name: '外食', enable: true },
        ],
      },
    ],
  },
}

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  server.use(
    http.get(
      'http://api.test/api/category/getCategoryWithSubCategoryList',
      () => HttpResponse.json(categoryResponse.data),
    ),
  )
})

describe('useCategorySettings', () => {
  it('optimistically changes visibility and invalidates the category query', async () => {
    let body: unknown
    let categoryRequestCount = 0
    server.use(
      http.get(
        'http://api.test/api/category/getCategoryWithSubCategoryList',
        () => {
          categoryRequestCount += 1
          return HttpResponse.json(categoryResponse.data)
        },
      ),
      http.post(
        'http://api.test/api/subCategory/editSubCategory',
        async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ status: 'success' })
        },
      ),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
    })
    const queryKey = getGetCategoryWithSubCategoryListQueryKey()
    queryClient.setQueryData(queryKey, categoryResponse)
    const { result } = renderHook(() => useCategorySettings(), {
      wrapper: wrapper(queryClient),
    })

    await act(() => result.current.setVisibility('10', false))

    expect(body).toEqual({ sub_category_id: '10', is_enable: false })
    expect(categoryRequestCount).toBe(1)
  })

  it('restores the previous visibility when saving fails', async () => {
    server.use(
      http.post('http://api.test/api/subCategory/editSubCategory', () =>
        HttpResponse.json({ status: 'error' }, { status: 500 }),
      ),
    )
    const queryClient = new QueryClient()
    const queryKey = getGetCategoryWithSubCategoryListQueryKey()
    queryClient.setQueryData(queryKey, categoryResponse)
    const { result } = renderHook(() => useCategorySettings(), {
      wrapper: wrapper(queryClient),
    })

    await expect(
      act(() => result.current.setVisibility('10', false)),
    ).rejects.toThrow()

    const restored = queryClient.getQueryData<typeof categoryResponse>(queryKey)
    expect(restored?.data.category_list[0]?.sub_category_list[0]?.enable).toBe(
      true,
    )
  })
})
