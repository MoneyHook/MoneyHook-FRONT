import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useHomeDashboard } from '../api/use-home-dashboard'
import {
  createMonthContext,
  normalizeMonthParam,
} from '../model/home-dashboard'

export function useHomeDashboardController() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMonth = searchParams.get('month')
  const normalizedMonth = useMemo(
    () => normalizeMonthParam(rawMonth),
    [rawMonth],
  )
  const month = useMemo(
    () => createMonthContext(normalizedMonth),
    [normalizedMonth],
  )
  const dashboard = useHomeDashboard(month)

  useEffect(() => {
    if (rawMonth === normalizedMonth) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('month', normalizedMonth)
    setSearchParams(next, { replace: true })
  }, [normalizedMonth, rawMonth, searchParams, setSearchParams])

  const handleMonthChange = (value: string) => {
    if (!value) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('month', value)
    setSearchParams(next)
  }

  return { dashboard, month, handleMonthChange }
}
