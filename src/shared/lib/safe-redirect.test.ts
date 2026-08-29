import { describe, expect, it } from 'vitest'

import { DEFAULT_AUTHENTICATED_PATH, getSafeAppRedirect } from './safe-redirect'

describe('getSafeAppRedirect', () => {
  it('allows app-local paths including search and hash', () => {
    expect(getSafeAppRedirect('/app/analysis?month=2026-08-01#fixed')).toBe(
      '/app/analysis?month=2026-08-01#fixed',
    )
  })

  it.each([
    'https://example.com/app/home',
    '//example.com/app/home',
    '/settings',
    '/app\\example.com',
  ])('rejects unsafe redirect %s', (value) => {
    expect(getSafeAppRedirect(value)).toBe(DEFAULT_AUTHENTICATED_PATH)
  })
})
