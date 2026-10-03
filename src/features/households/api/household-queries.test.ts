import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRequestKey } from './household-queries'

describe('useRequestKey retry contract', () => {
  it('retains a key for retries and uses a different key for changed input', () => {
    const { result, rerender } = renderHook(() => useRequestKey())
    const first = result.current({ name: '家族' })
    rerender()
    expect(result.current({ name: '家族' })).toEqual(first)
    expect(result.current({ name: '別の家族' })).not.toEqual(first)
  })

  it('starts a new operation after the previous operation succeeds', () => {
    const { result } = renderHook(() => useRequestKey())
    const body = { name: '家族' }
    const first = result.current(body)
    const other = result.current({ name: '別の家族' })
    result.current.complete(body)
    expect(result.current(body)).not.toEqual(first)
    expect(result.current({ name: '別の家族' })).toEqual(other)
  })
})
