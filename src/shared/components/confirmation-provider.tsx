import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import {
  ConfirmationContext,
  type ConfirmationOptions,
} from '@/shared/hooks/use-confirmation'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { buttonVariants } from './ui/button'

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const [open, setOpen] = useState(false)
  const pending = useRef<((confirmed: boolean) => void) | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const finish = useCallback((confirmed: boolean) => {
    const resolve = pending.current
    pending.current = null
    setOpen(false)
    resolve?.(confirmed)
  }, [])
  const request = useCallback(
    (next: ConfirmationOptions, signal: AbortSignal) => {
      if (signal.aborted || pending.current) return Promise.resolve(false)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setOptions(next)
      setOpen(true)
      return new Promise<boolean>((resolve) => {
        const abort = () => finish(false)
        pending.current = (confirmed) => {
          signal.removeEventListener('abort', abort)
          resolve(confirmed)
        }
        signal.addEventListener('abort', abort, { once: true })
      })
    },
    [finish],
  )
  useEffect(
    () => () => {
      pending.current?.(false)
      pending.current = null
    },
    [],
  )

  return (
    <ConfirmationContext.Provider value={request}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!value) finish(false)
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocus.current?.isConnected) returnFocus.current.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finish(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({
                variant: options?.destructive ? 'destructive' : 'default',
              })}
              onClick={() => finish(true)}
            >
              {options?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  )
}
