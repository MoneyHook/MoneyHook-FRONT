import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  ACCENT_STORAGE_KEY,
  AccentContext,
  DEFAULT_ACCENT,
  isAccentColor,
  type AccentColor,
} from './accent-context'

function readStoredAccent(): AccentColor {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCENT
  }

  try {
    const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY)
    return isAccentColor(storedAccent) ? storedAccent : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState<AccentColor>(readStoredAccent)

  useEffect(() => {
    document.documentElement.dataset.accent = accent

    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent)
    } catch {
      // Ignore storage failures and keep the setting active for this session.
    }
  }, [accent])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACCENT_STORAGE_KEY) {
        return
      }

      setAccent(isAccentColor(event.newValue) ? event.newValue : DEFAULT_ACCENT)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}
