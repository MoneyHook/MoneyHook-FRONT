import { getEnvironment } from '@/shared/config/environment'
import { getFirebaseAuth } from '@/shared/lib/firebase'

import { ApiError, normalizeApiError } from './api-error'

export type ApiAuthMode = 'none' | 'bearer'

const apiAuthMode = Symbol('moneyhooks-api-auth-mode')

export type ApiRequestInit = RequestInit & {
  [apiAuthMode]?: ApiAuthMode
}

export function withApiAuth(
  mode: ApiAuthMode,
  options: RequestInit = {},
): ApiRequestInit {
  return {
    ...options,
    [apiAuthMode]: mode,
  }
}

async function getAuthorizationValue(mode: ApiAuthMode): Promise<string | null> {
  if (mode === 'none') {
    return null
  }

  const user = getFirebaseAuth().currentUser
  if (!user) {
    throw new ApiError({
      status: 401,
      code: 'AUTH_REQUIRED',
      message: 'ログインが必要です。',
    })
  }

  const token = await user.getIdToken()
  return `Bearer ${token}`
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if ([204, 205, 304].includes(response.status)) {
    return undefined
  }

  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestInit = {},
): Promise<T> {
  const { apiBaseUrl } = getEnvironment()
  const mode = options[apiAuthMode] ?? (path === '/' ? 'none' : 'bearer')
  const headers = new Headers(options.headers)
  const authorization = await getAuthorizationValue(mode)

  if (authorization) {
    headers.set('Authorization', authorization)
  }

  let response: Response
  try {
    response = await fetch(new URL(path, `${apiBaseUrl}/`), {
      ...options,
      headers,
    })
  } catch (cause) {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'APIへ接続できませんでした。ネットワークを確認してください。',
      cause,
    })
  }

  const data = await parseResponseBody(response)
  if (!response.ok) {
    throw normalizeApiError(response.status, data)
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T
}
