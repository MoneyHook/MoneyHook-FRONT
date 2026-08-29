import * as React from "react"

const DESKTOP_BREAKPOINT = 769

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < DESKTOP_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
