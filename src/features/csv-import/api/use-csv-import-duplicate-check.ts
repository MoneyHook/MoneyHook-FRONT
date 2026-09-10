import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { TimelineTransaction } from '@/shared/api/generated/model/timelineTransaction'
import { getGetTimelineDataQueryOptions } from '@/shared/api/generated/transaction/transaction'

import { importMonths, type ImportRow } from '../model/csv-import'

const MAX_CONCURRENT_REQUESTS = 4

type DuplicateCheckState = {
  failedMonths: string[]
  isChecking: boolean
  key: string
  transactions: TimelineTransaction[]
}

const initialState: DuplicateCheckState = {
  failedMonths: [],
  isChecking: false,
  key: '',
  transactions: [],
}

export function useCsvImportDuplicateCheck(rows: ImportRow[]) {
  const queryClient = useQueryClient()
  const key = useMemo(() => importMonths(rows).join('|'), [rows])
  const [state, setState] = useState(initialState)
  const months = useMemo(() => key ? key.split('|') : [], [key])
  const isChecking = months.length > 0 && (state.key !== key || state.isChecking)
  const currentState = state.key === key ? state : initialState

  useEffect(() => {
    let cancelled = false

    if (!months.length) {
      return () => { cancelled = true }
    }

    const checkMonths = async () => {
      const transactions: TimelineTransaction[] = []
      const failedMonths: string[] = []
      let nextIndex = 0

      const worker = async () => {
        while (!cancelled) {
          const month = months[nextIndex]
          nextIndex += 1
          if (!month) return

          try {
            const response = await queryClient.fetchQuery(
              getGetTimelineDataQueryOptions({ month }),
            )
            if (response.status !== 200) {
              failedMonths.push(month)
              continue
            }
            transactions.push(...response.data.transaction_list)
          } catch {
            failedMonths.push(month)
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, months.length) }, worker))
      if (!cancelled) setState({ failedMonths, isChecking: false, key, transactions })
    }

    void checkMonths()
    return () => { cancelled = true }
  }, [key, months, queryClient])

  return {
    failedMonths: currentState.failedMonths,
    isChecking,
    transactions: currentState.transactions,
  }
}
