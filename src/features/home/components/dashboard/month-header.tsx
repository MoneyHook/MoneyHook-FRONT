import { useEffect, useState } from 'react'

import { DashboardMonthHeader } from '@/shared/components/dashboard-month-header'

export function MonthHeader({
  hasActiveFamily = false,
  monthInput,
  monthLabel,
  maxMonth,
  onChange,
}: {
  hasActiveFamily?: boolean
  monthInput: string
  monthLabel: string
  maxMonth: string
  onChange: (value: string) => void
}) {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      const scrollTop = window.scrollY
      setIsHeaderCompact((compact) =>
        compact ? scrollTop > 0 : scrollTop > 16,
      )
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  return (
    <DashboardMonthHeader
      compact={isHeaderCompact}
      sticky
      headerSlot="home-page-header"
      title="ホーム"
      titleId="home-page-title"
      hasActiveFamily={hasActiveFamily}
      scope="personal"
      personalHref={`/app/home?month=${monthInput}-01`}
      familyHref={`/app/family?month=${monthInput}-01`}
      maxMonth={maxMonth}
      monthInput={monthInput}
      monthLabel={monthLabel}
      onChange={onChange}
    />
  )
}
