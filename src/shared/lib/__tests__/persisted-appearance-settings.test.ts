import { beforeEach, describe, expect, it } from 'vitest'

import {
  ACCENT_STORAGE_KEY,
  CHART_PALETTE_STORAGE_KEY,
  clearPersistedAppearanceSettings,
  THEME_STORAGE_KEY,
} from '../persisted-appearance-settings'

describe('persisted appearance settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes only appearance settings', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'violet')
    localStorage.setItem(CHART_PALETTE_STORAGE_KEY, 'monochrome')
    localStorage.setItem('moneyhooks:user-cache:query:timeline', 'cached')

    clearPersistedAppearanceSettings()

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(CHART_PALETTE_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('moneyhooks:user-cache:query:timeline')).toBe('cached')
  })
})
