export const THEME_STORAGE_KEY = 'moneyhooks-theme'
export const ACCENT_STORAGE_KEY = 'moneyhooks-accent'
export const CHART_PALETTE_STORAGE_KEY = 'moneyhooks-chart-palette'

const APPEARANCE_STORAGE_KEYS = [
  THEME_STORAGE_KEY,
  ACCENT_STORAGE_KEY,
  CHART_PALETTE_STORAGE_KEY,
] as const

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function clearPersistedAppearanceSettings(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    APPEARANCE_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
  } catch {
    // Best-effort cleanup; the API setting remains the source of truth.
  }
}
