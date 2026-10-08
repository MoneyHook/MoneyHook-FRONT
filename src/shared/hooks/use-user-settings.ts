import { useEffect } from 'react'

import type { V1SettingsResponse } from '@/shared/api/generated/model'
import { useGetV1Settings } from '@/shared/api/generated/settings/settings'
import {
  isAccentColor,
  isChartPalette,
  isThemeMode,
} from '@/shared/hooks/appearance-context'

import { usePersistedQueryData } from './use-persisted-query-data'

export function isUserSettings(value: unknown): value is V1SettingsResponse {
  if (!value || typeof value !== 'object') return false
  const settings = value as V1SettingsResponse
  return (
    isThemeMode(settings.theme_mode) &&
    isAccentColor(settings.accent_color) &&
    isChartPalette(settings.chart_palette) &&
    (settings.default_transaction_scope === undefined ||
      settings.default_transaction_scope === 'personal' ||
      settings.default_transaction_scope === 'household')
  )
}

export function useUserSettings({ enabled = true } = {}) {
  const cache = usePersistedQueryData({
    resource: 'user-settings',
    parameters: {},
    isValue: isUserSettings,
  })
  const query = useGetV1Settings({
    query: {
      ...(enabled ? cache.queryOptions : {}),
      // An earlier observer may have already started fetching this query.
      placeholderData: enabled ? cache.queryOptions.initialData : undefined,
      enabled,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
    },
  })
  useEffect(() => {
    if (enabled && !query.isPlaceholderData) cache.persist(query.data)
  }, [cache, enabled, query.data, query.isPlaceholderData])
  return query
}
