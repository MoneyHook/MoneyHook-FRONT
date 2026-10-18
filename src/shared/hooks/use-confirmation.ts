import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'

export type ConfirmationOptions = {
  title: string
  description: string
  actionLabel: string
  destructive?: boolean
}

export const ConfirmationContext = createContext<
  | ((options: ConfirmationOptions, signal: AbortSignal) => Promise<boolean>)
  | null
>(null)

export function useConfirmation() {
  const request = useContext(ConfirmationContext)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => {
    const current = new AbortController()
    controller.current = current
    return () => current.abort()
  }, [])
  if (!request) throw new Error('ConfirmationProvider is required')
  return useCallback(
    (options: ConfirmationOptions) => {
      if (!controller.current) return Promise.resolve(false)
      return request(options, controller.current.signal)
    },
    [request],
  )
}
