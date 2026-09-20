import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPersistedUserData,
  createPersistedQueryKey,
  ensurePersistedUserDataOwner,
  PERSISTED_USER_DATA_PREFIX,
  readPersistedUserData,
  writePersistedQueryData,
  writePersistedUserData,
} from '../persisted-user-data'

describe('persisted user data', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns only a versioned value accepted by its validator', () => {
    writePersistedUserData('cache:valid', 1, { items: ['one'] })

    expect(
      readPersistedUserData(
        'cache:valid',
        1,
        (value): value is { items: string[] } =>
          Boolean(value) &&
          typeof value === 'object' &&
          Array.isArray((value as { items?: unknown }).items),
      ),
    ).toEqual({ items: ['one'] })
  })

  it('discards malformed or outdated values', () => {
    localStorage.setItem('cache:malformed', '{')
    localStorage.setItem(
      'cache:outdated',
      JSON.stringify({ version: 0, value: { items: [] } }),
    )

    const acceptsAnyValue = (value: unknown): value is unknown => Boolean(value)

    expect(
      readPersistedUserData('cache:malformed', 1, acceptsAnyValue),
    ).toBeNull()
    expect(
      readPersistedUserData('cache:outdated', 1, acceptsAnyValue),
    ).toBeNull()
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

  it('separates query parameters and limits persisted query entries', () => {
    const firstKey = createPersistedQueryKey('timeline', {
      month: '2026-08-01',
      filter: 'all',
    })
    const reorderedKey = createPersistedQueryKey('timeline', {
      filter: 'all',
      month: '2026-08-01',
    })
    expect(firstKey).toBe(reorderedKey)

    for (let index = 0; index < 25; index += 1) {
      writePersistedQueryData(
        createPersistedQueryKey('timeline', { index }),
        1,
        { index },
      )
    }

    expect(
      Array.from({ length: localStorage.length }, (_, index) =>
        localStorage.key(index),
      ).filter((key) => key?.includes(':query:')),
    ).toHaveLength(24)
  })

  it('does not read cached payloads when the cache is within its limit', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    try {
      for (let index = 0; index < 24; index += 1) {
        writePersistedQueryData(
          createPersistedQueryKey('timeline', { index }),
          1,
          { index },
        )
      }
      expect(getItem).not.toHaveBeenCalled()
    } finally {
      getItem.mockRestore()
    }
  })

  it('evicts the least recently accessed query without removing unrelated data', () => {
    localStorage.setItem('other-setting', 'keep')
    for (let index = 0; index < 24; index += 1) {
      localStorage.setItem(
        createPersistedQueryKey('timeline', { index }),
        JSON.stringify({
          version: 1,
          value: { index },
          accessedAt: index === 0 ? 100 : index,
        }),
      )
    }
    writePersistedQueryData(
      createPersistedQueryKey('timeline', { index: 24 }),
      1,
      { index: 24 },
    )
    expect(
      localStorage.getItem(createPersistedQueryKey('timeline', { index: 1 })),
    ).toBeNull()
    expect(
      localStorage.getItem(createPersistedQueryKey('timeline', { index: 0 })),
    ).not.toBeNull()
    expect(localStorage.getItem('other-setting')).toBe('keep')
  })

  it('clears another user cache before assigning the authenticated owner', () => {
    writePersistedUserData(
      `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`,
      1,
      { values: [] },
    )
    ensurePersistedUserDataOwner('user-a')
    writePersistedUserData(
      `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`,
      1,
      { values: ['a'] },
    )

    ensurePersistedUserDataOwner('user-b')

    expect(
      localStorage.getItem(
        `${PERSISTED_USER_DATA_PREFIX}transaction-form:categories`,
      ),
    ).toBeNull()
  })
})
