import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth'
import {
  getGetV1SettingsQueryKey,
  useGetV1Settings,
  usePatchV1Settings,
} from '@/shared/api/generated/settings/settings'

import {
  AppearanceContext,
  DEFAULT_APPEARANCE_SETTINGS,
  type AccentColor,
  type AppearanceSettings,
  type ChartPalette,
  type ThemeMode,
} from './appearance-context'

function resolveTheme(theme: ThemeMode, systemPrefersDark: boolean): 'light' | 'dark' {
  return theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()

  return (
    <AppearanceSettingsProvider key={user?.uid ?? 'anonymous'} status={status}>
      {children}
    </AppearanceSettingsProvider>
  )
}

function AppearanceSettingsProvider({
  children,
  status,
}: {
  children: ReactNode
  status: ReturnType<typeof useAuth>['status']
}) {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS)
  const [systemPrefersDark, setSystemPrefersDark] = useState(false)
  const settingsQuery = useGetV1Settings({
    query: { enabled: status === 'authenticated' },
  })
  const saveMutation = usePatchV1Settings()
  const resolvedTheme = resolveTheme(settings.theme, systemPrefersDark)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemPrefersDark(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || settingsQuery.data?.status !== 200) {
      return
    }

    const data = settingsQuery.data.data
    // React Query owns the remote value; copy it only after a successful fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings({
      theme: data.theme_mode,
      accent: data.accent_color,
      chartPalette: data.chart_palette,
    })
  }, [settingsQuery.data, status])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.dataset.accent = settings.accent
    document.documentElement.dataset.chartPalette = settings.chartPalette
  }, [resolvedTheme, settings.accent, settings.chartPalette])

  const save = useCallback((patch: Partial<AppearanceSettings>) => {
    const previousSettings = settings
    const nextSettings = { ...settings, ...patch }
    setSettings(nextSettings)

    saveMutation.mutate(
      {
        data: {
          ...(patch.theme ? { theme_mode: patch.theme } : {}),
          ...(patch.accent ? { accent_color: patch.accent } : {}),
          ...(patch.chartPalette ? { chart_palette: patch.chartPalette } : {}),
        },
      },
      {
        onError: () => {
          setSettings(previousSettings)
          toast.error('表示設定を保存できませんでした。もう一度お試しください。')
        },
        onSuccess: (response) => {
          if (response.status !== 200) {
            return
          }
          const data = response.data
          const savedSettings = {
            theme: data.theme_mode,
            accent: data.accent_color,
            chartPalette: data.chart_palette,
          } satisfies AppearanceSettings
          setSettings(savedSettings)
          queryClient.setQueryData(getGetV1SettingsQueryKey(), response)
        },
      },
    )
  }, [queryClient, saveMutation, settings])

  const value = useMemo(
    () => ({
      ...settings,
      resolvedTheme,
      setTheme: (theme: ThemeMode) => save({ theme }),
      setAccent: (accent: AccentColor) => save({ accent }),
      setChartPalette: (chartPalette: ChartPalette) => save({ chartPalette }),
    }),
    [resolvedTheme, save, settings],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}
