import { describe, expect, it } from 'vitest'

import { normalizeApiError } from './api-error'

describe('normalizeApiError', () => {
  it('normalizes the v1 error shape', () => {
    const error = normalizeApiError(422, {
      code: 'VALIDATION_ERROR',
      message: '入力内容を確認してください',
      field_errors: { 'transaction.amount': '1以上で入力してください' },
    })

    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: '入力内容を確認してください',
      fieldErrors: {
        'transaction.amount': ['1以上で入力してください'],
      },
    })
  })

  it('normalizes a legacy JSON string error', () => {
    expect(normalizeApiError(422, '追加に失敗しました')).toMatchObject({
      status: 422,
      message: '追加に失敗しました',
    })
  })
})
