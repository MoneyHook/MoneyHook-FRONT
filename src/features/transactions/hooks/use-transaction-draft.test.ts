import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createNewTransactionValues } from '../model/new-transaction'
import { useTransactionDraft } from './use-transaction-draft'

describe('transaction draft concurrency', () => {
  it('retains the version at the first edit when background reads refresh', () => {
    const { result, rerender } = renderHook(
      ({ version }) => useTransactionDraft(version),
      { initialProps: { version: 1 } },
    )
    act(() =>
      result.current.setForm({
        ...createNewTransactionValues(),
        transactionName: '入力中',
      }),
    )
    rerender({ version: 2 })
    expect(result.current.version).toBe(1)
    act(() =>
      result.current.setForm((current) => ({ ...current!, amount: '2000' })),
    )
    expect(result.current.form?.transactionName).toBe('入力中')
    expect(result.current.version).toBe(1)
  })
  it('uses refreshed versions before editing and after explicitly clearing the draft', () => {
    const { result, rerender } = renderHook(
      ({ version }) => useTransactionDraft(version),
      { initialProps: { version: 1 } },
    )
    rerender({ version: 2 })
    expect(result.current.version).toBe(2)
    act(() => result.current.setForm(createNewTransactionValues()))
    rerender({ version: 3 })
    act(() => result.current.setForm(null))
    expect(result.current.version).toBe(3)
  })
})
