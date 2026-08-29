export const DEFAULT_AUTHENTICATED_PATH = '/app/home'

export function getSafeAppRedirect(value: string | null): string {
  if (!value || value.includes('\\') || value.startsWith('//')) {
    return DEFAULT_AUTHENTICATED_PATH
  }

  try {
    const url = new URL(value, window.location.origin)
    const isSameOrigin = url.origin === window.location.origin
    const isAppPath = /^\/app(?:\/|$)/.test(url.pathname)

    if (!isSameOrigin || !isAppPath) {
      return DEFAULT_AUTHENTICATED_PATH
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return DEFAULT_AUTHENTICATED_PATH
  }
}
