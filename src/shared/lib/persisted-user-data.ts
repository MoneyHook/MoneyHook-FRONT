export const PERSISTED_USER_DATA_PREFIX = 'moneyhooks:user-cache:'
export const PERSISTED_QUERY_DATA_PREFIX = `${PERSISTED_USER_DATA_PREFIX}query:`
const OWNER_KEY = `${PERSISTED_USER_DATA_PREFIX}owner`
const MAX_PERSISTED_QUERY_ENTRIES = 24

type StoredValue<T> = {
  version: number
  value: T
}

type StoredQueryValue<T> = StoredValue<T> & {
  accessedAt: number
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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function removeOldestQueryEntries(storage: Storage): void {
  const entries = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(PERSISTED_QUERY_DATA_PREFIX)))
    .flatMap((key) => {
      try {
        const raw = storage.getItem(key)
        const parsed: unknown = raw ? JSON.parse(raw) : null
        return parsed && typeof parsed === 'object' && 'accessedAt' in parsed && typeof parsed.accessedAt === 'number'
          ? [{ accessedAt: parsed.accessedAt, key }]
          : [{ accessedAt: 0, key }]
      } catch {
        return [{ accessedAt: 0, key }]
      }
    })
    .sort((left, right) => right.accessedAt - left.accessedAt)

  entries.slice(MAX_PERSISTED_QUERY_ENTRIES).forEach(({ key }) => storage.removeItem(key))
}

export function createPersistedQueryKey(resource: string, parameters: unknown): string {
  return `${PERSISTED_QUERY_DATA_PREFIX}${resource}:${stableSerialize(parameters)}`
}

export function readPersistedQueryData<T>(key: string, version: number, isValue: (value: unknown) => value is T): T | null {
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
      !parsed || typeof parsed !== 'object' || !('version' in parsed) || !('value' in parsed) ||
      !('accessedAt' in parsed) || parsed.version !== version || !isValue(parsed.value)
    ) {
      storage.removeItem(key)
      return null
    }

    storage.setItem(key, JSON.stringify({ ...(parsed as StoredQueryValue<T>), accessedAt: Date.now() }))
    return (parsed as StoredQueryValue<T>).value
  } catch {
    return null
  }
}

export function writePersistedQueryData<T>(key: string, version: number, value: T): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify({ accessedAt: Date.now(), version, value } satisfies StoredQueryValue<T>))
    removeOldestQueryEntries(storage)
  } catch {
    // Keep the in-memory query result when storage is unavailable or full.
  }
}

export function clearPersistedQueryData(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith(PERSISTED_QUERY_DATA_PREFIX)))
      .forEach((key) => storage.removeItem(key))
  } catch {
    // Best-effort cleanup; the next API response repopulates the cache.
  }
}

export function ensurePersistedUserDataOwner(uid: string): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    if (storage.getItem(OWNER_KEY) !== uid) {
      clearPersistedUserData()
      storage.setItem(OWNER_KEY, uid)
    }
  } catch {
    // The authenticated API result remains authoritative if storage is unavailable.
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
