export type ApiFieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors?: ApiFieldErrors

  constructor(options: {
    status: number
    message: string
    code?: string
    fieldErrors?: ApiFieldErrors
    cause?: unknown
  }) {
    super(options.message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeFieldErrors(value: unknown): ApiFieldErrors | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const normalizedErrors: ApiFieldErrors = {}
  for (const [key, messages] of Object.entries(value)) {
    if (typeof messages === 'string') {
      normalizedErrors[key] = [messages]
      continue
    }
    if (Array.isArray(messages)) {
      const normalized = messages.filter(
        (message): message is string => typeof message === 'string',
      )
      if (normalized.length > 0) {
        normalizedErrors[key] = normalized
      }
    }
  }

  return Object.keys(normalizedErrors).length > 0 ? normalizedErrors : undefined
}

export function normalizeApiError(status: number, payload: unknown): ApiError {
  if (typeof payload === 'string') {
    return new ApiError({
      status,
      code: status === 0 ? 'NETWORK_ERROR' : undefined,
      message: payload || '通信に失敗しました。時間をおいて再度お試しください。',
    })
  }

  if (isRecord(payload)) {
    return new ApiError({
      status,
      code: typeof payload.code === 'string' ? payload.code : undefined,
      message:
        typeof payload.message === 'string'
          ? payload.message
          : '通信に失敗しました。時間をおいて再度お試しください。',
      fieldErrors: normalizeFieldErrors(
        payload.field_errors ?? payload.fieldErrors,
      ),
    })
  }

  return new ApiError({
    status,
    code: status === 0 ? 'NETWORK_ERROR' : undefined,
    message: '通信に失敗しました。時間をおいて再度お試しください。',
  })
}
