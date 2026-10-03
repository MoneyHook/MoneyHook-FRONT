import { type SetStateAction, useCallback, useState } from 'react'

import type { NewTransactionFormValues } from '../model/new-transaction'

type Draft = { form: NewTransactionFormValues; version?: number }

export function useTransactionDraft(version?: number) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const setForm = useCallback(
    (action: SetStateAction<NewTransactionFormValues | null>) => {
      setDraft((current) => {
        const form =
          typeof action === 'function' ? action(current?.form ?? null) : action
        if (form === current?.form) return current
        return form
          ? { form, version: current ? current.version : version }
          : null
      })
    },
    [version],
  )
  return {
    form: draft?.form ?? null,
    version: draft ? draft.version : version,
    setForm,
  }
}
