export const PERSISTED_USER_DATA_PREFIX = 'moneyhooks:user-cache:'

type StoredValue<T> = {
  version: number
  value: T
}

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

export function readPersistedUserData<T>(key: string, version: number, isValue: (value: unknown) => value is T): T | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('version' in parsed) ||
      !('value' in parsed) ||
      parsed.version !== version ||
      !isValue(parsed.value)
    ) {
      storage.removeItem(key)
      return null
    }

    return (parsed as StoredValue<T>).value
  } catch {
    return null
  }
}

export function writePersistedUserData<T>(key: string, version: number, value: T): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify({ version, value } satisfies StoredValue<T>))
  } catch {
    // Keep the in-memory query result when storage is unavailable or full.
  }
}

export function clearPersistedUserData(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    keys.forEach((key) => {
      if (key?.startsWith(PERSISTED_USER_DATA_PREFIX)) {
        storage.removeItem(key)
      }
    })
  } catch {
    // Best-effort cleanup; authentication state remains the source of truth.
  }
}
