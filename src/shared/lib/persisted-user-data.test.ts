import { beforeEach, describe, expect, it } from 'vitest'

import {
  PERSISTED_USER_DATA_PREFIX,
  clearPersistedUserData,
  readPersistedUserData,
  writePersistedUserData,
} from './persisted-user-data'

describe('persisted user data', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns only a versioned value accepted by its validator', () => {
    writePersistedUserData('cache:valid', 1, { items: ['one'] })

    expect(readPersistedUserData('cache:valid', 1, (value): value is { items: string[] } => (
      Boolean(value) && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)
    ))).toEqual({ items: ['one'] })
  })

  it('discards malformed or outdated values', () => {
    localStorage.setItem('cache:malformed', '{')
    localStorage.setItem('cache:outdated', JSON.stringify({ version: 0, value: { items: [] } }))

    const acceptsAnyValue = (value: unknown): value is unknown => Boolean(value)

    expect(readPersistedUserData('cache:malformed', 1, acceptsAnyValue)).toBeNull()
    expect(readPersistedUserData('cache:outdated', 1, acceptsAnyValue)).toBeNull()
    expect(localStorage.getItem('cache:outdated')).toBeNull()
  })

  it('clears only user-scoped persisted values', () => {
    const userKey = `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`
    localStorage.setItem(userKey, 'value')
    localStorage.setItem('moneyhooks:appearance:theme', 'dark')

    clearPersistedUserData()

    expect(localStorage.getItem(userKey)).toBeNull()
    expect(localStorage.getItem('moneyhooks:appearance:theme')).toBe('dark')
  })
})
