import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/test/msw/server'

const environment = {
  VITE_API_BASE_URL: 'http://api.test',
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_APP_ID: 'test-app-id',
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.resetModules()
    for (const [key, value] of Object.entries(environment)) {
      vi.stubEnv(key, value)
    }
  })

  it('resolves relative OpenAPI paths against the configured API origin', async () => {
    server.use(
      http.get('http://api.test/api/health', () =>
        HttpResponse.json({ status: 'success' }),
      ),
    )
    const { apiFetch, withApiAuth } = await import('./http-client')

    const result = await apiFetch<{
      data: { status: string }
      status: number
      headers: Headers
    }>('/api/health', withApiAuth('none'))

    expect(result.status).toBe(200)
    expect(result.data).toEqual({ status: 'success' })
  })

  it('leaves only the root health check unauthenticated by default', async () => {
    let capturedAuthHeader: string | null = null
    server.use(
      http.get('http://api.test/', ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization')
        return HttpResponse.text('Success, running')
      }),
    )
    vi.doMock('@/shared/lib/firebase', () => ({
      getFirebaseAuth: () => {
        throw new Error('health check must not initialize Firebase Auth')
      },
    }))

    const { apiFetch } = await import('./http-client')
    const result = await apiFetch<{ data: string; status: number }>('/')

    expect(result.status).toBe(200)
    expect(result.data).toBe('Success, running')
    expect(capturedAuthHeader).toBeNull()
  })

  it('throws a normalized ApiError for a legacy JSON string', async () => {
    server.use(
      http.post('http://api.test/api/failure', () =>
        HttpResponse.json('追加に失敗しました', { status: 422 }),
      ),
    )
    const { apiFetch, withApiAuth } = await import('./http-client')

    await expect(
      apiFetch('/api/failure', withApiAuth('none', { method: 'POST' })),
    ).rejects.toMatchObject({
      status: 422,
      message: '追加に失敗しました',
    })
  })

  it('automatically attaches Bearer token when user is signed in', async () => {
    let capturedAuthHeader: string | null = null
    server.use(
      http.get('http://api.test/api/v1/protected', ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json({ status: 'ok' })
      }),
    )

    vi.doMock('@/shared/lib/firebase', () => ({
      getFirebaseAuth: () => ({
        currentUser: {
          getIdToken: () => Promise.resolve('test-firebase-id-token'),
        },
      }),
    }))

    const { apiFetch } = await import('./http-client')
    const result = await apiFetch<{ data: { status: string }; status: number }>(
      '/api/v1/protected',
    )

    expect(result.status).toBe(200)
    expect(capturedAuthHeader).toBe('Bearer test-firebase-id-token')
  })

  it('throws 401 AUTH_REQUIRED when no user is signed in for default bearer request', async () => {
    vi.doMock('@/shared/lib/firebase', () => ({
      getFirebaseAuth: () => ({
        currentUser: null,
      }),
    }))

    const { apiFetch } = await import('./http-client')
    await expect(apiFetch('/api/v1/protected')).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_REQUIRED',
    })
  })
})
