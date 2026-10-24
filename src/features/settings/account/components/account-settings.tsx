import { CircleUserRound, LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'

import { AppearanceSettings } from '../../appearance/components/appearance-settings'
import { SettingsSection } from '../../components/settings-section'

type AccountSettingsProps = {
  showHeader?: boolean
  user: {
    displayName: string | null
    email: string | null
    photoURL: string | null
  } | null
  signOut: () => Promise<void>
}

export function AccountSettings({
  showHeader = true,
  user,
  signOut,
}: AccountSettingsProps) {
  const initial = useMemo(() => {
    const source = user?.displayName?.trim() || user?.email?.trim() || 'M'
    return source.slice(0, 1).toUpperCase()
  }, [user])

  const handleSignOut = () => {
    void signOut().catch(() => {
      toast.error('ログアウトできませんでした。もう一度お試しください。')
    })
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        description="アカウント情報の確認や、テーマ・配色の変更ができます。"
        icon={CircleUserRound}
        showHeader={showHeader}
        title="アカウント"
        titleId="account-settings-title"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            {user?.photoURL ? (
              <AvatarImage
                alt=""
                referrerPolicy="no-referrer"
                src={user.photoURL}
              />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-medium">
              {user?.displayName || 'MoneyHooksユーザー'}
            </p>
            {user?.email ? (
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <AppearanceSettings />
        </div>
      </SettingsSection>

      <Card aria-label="ログアウト" className="block p-5 sm:p-6" role="region">
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={handleSignOut}
            size="lg"
            type="button"
            variant="destructive"
          >
            <LogOut aria-hidden="true" />
            ログアウト
          </Button>
        </div>
      </Card>
    </div>
  )
}
