import { type RefObject, useEffect } from 'react'

export function useTransactionNameViewport(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const input = inputRef.current
    if (!open || !input) return

    const form = input.form
    const originalPadding = form?.style.paddingBottom ?? ''
    const padding = form ? parseFloat(getComputedStyle(form).paddingBottom) : 0
    const mobile = window.matchMedia('(width < 640px)')
    const viewport = window.visualViewport
    let frame = 0

    const resizeList = () => {
      const content = contentRef.current
      if (!content) return
      const bottom = viewport
        ? viewport.offsetTop + viewport.height
        : window.innerHeight
      const headingHeight =
        content.firstElementChild?.getBoundingClientRect().height ?? 0
      // Leave room for the popover gap (4px), padding (8px), and bottom margin (16px).
      const height = Math.max(
        0,
        bottom - input.getBoundingClientRect().bottom - headingHeight - 28,
      )
      content.style.setProperty('--transaction-name-list-height', `${height}px`)
    }
    const alignInput = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Reserve scroll space only for the mobile form.
        if (form) {
          form.style.paddingBottom = mobile.matches
            ? `${padding + window.innerHeight}px`
            : originalPadding
        }
        if (mobile.matches && document.activeElement === input) {
          input.scrollIntoView({
            block: 'start',
            inline: 'nearest',
            behavior: 'instant',
          })
        }
        resizeList()
      })
    }

    alignInput()
    window.addEventListener('resize', alignInput)
    document.addEventListener('scroll', resizeList, true)
    viewport?.addEventListener('resize', alignInput)
    viewport?.addEventListener('scroll', resizeList)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', alignInput)
      document.removeEventListener('scroll', resizeList, true)
      viewport?.removeEventListener('resize', alignInput)
      viewport?.removeEventListener('scroll', resizeList)
      if (form) form.style.paddingBottom = originalPadding
    }
  }, [open, inputRef, contentRef])
}
