import { useQuery } from '@tanstack/react-query'
import { Clock3, Copy, Link2, RotateCw, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type {
  Household,
  HouseholdInviteSecret,
} from '@/shared/api/generated/model'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

import {
  api,
  householdKey,
  useHouseholdAction,
  useRequestKey,
} from '../api/household-queries'
import { FamilyError } from './fields'

const invitationStateLabel: Record<string, string> = {
  active: '未使用',
  used: '使用済み',
  expired: '期限切れ',
  revoked: '取消済み',
}

export function FamilyInvitations({
  family,
  memberCount,
}: {
  family: Household
  memberCount: number
}) {
  const [secret, setSecret] = useState<HouseholdInviteSecret | null>(null)
  const action = useHouseholdAction()
  const request = useRequestKey()
  const id = family.household_id
  const query = useQuery({
    queryKey: [...householdKey, id, 'invites'],
    queryFn: async ({ signal }) => {
      const response = await api.householdInvitations(id, { signal })
      return response.status === 200 ? response.data : []
    },
  })
  const issue = (replace?: string) =>
    action.run(async () => {
      const options = request({ id, replace, nonce: secret?.invitation_id })
      const response = replace
        ? await api.householdReissue(id, replace, {}, options)
        : await api.householdIssue(id, {}, options)
      if (response.status === 201) setSecret(response.data)
    })
  const openSlots = Math.max(0, 3 - memberCount)
  const copyInvitation = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label}をコピーしました`)
    } catch {
      toast.error(
        'コピーできませんでした。招待コードを選択してコピーしてください',
      )
    }
  }

  return (
    <section
      aria-labelledby="family-invitations-title"
      className="min-w-0 space-y-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <UserPlus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2
            className="text-lg font-semibold tracking-[-0.025em]"
            id="family-invitations-title"
          >
            メンバーを招待
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            あと{openSlots}人招待できます。コードは24時間・1人限り有効です。
          </p>
        </div>
      </div>

      <Button
        className="h-10 w-full"
        disabled={action.busy || openSlots === 0}
        onClick={() => void issue().catch(() => {})}
      >
        <UserPlus aria-hidden="true" />
        {openSlots === 0 ? '参加人数が上限です' : '招待を発行'}
      </Button>

      <FamilyError error={query.error || action.error} />

      {secret && (
        <div className="space-y-4 rounded-xl border bg-muted p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              招待コード
            </p>
            <Button
              aria-label="招待コードをコピー"
              className="mt-1 h-auto min-h-11 max-w-full justify-start gap-2 px-0 hover:bg-background/60"
              type="button"
              variant="ghost"
              onClick={() => void copyInvitation(secret.code, '招待コード')}
            >
              <Copy aria-hidden="true" className="size-4" />
              <span className="font-mono text-xl font-semibold tracking-[0.16em] select-text">
                {secret.code}
              </span>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {new Date(secret.expires_at).toLocaleString('ja-JP')}まで
          </p>
          <Button
            className="w-full"
            variant="outline"
            onClick={() =>
              void copyInvitation(
                `${window.location.origin}/family/join#${secret.token}`,
                '招待リンク',
              )
            }
          >
            <Copy aria-hidden="true" />
            招待リンクをコピー
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            コードとリンクはこの画面でのみ確認できます。家族の過去の記録を閲覧できるため、招待する相手にだけ共有してください。
          </p>
        </div>
      )}

      {(query.data?.length ?? 0) > 0 && (
        <div className="border-t pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            招待の履歴
          </p>
          <div className="divide-y">
            {query.data?.map((invite) => (
              <div className="py-3" key={invite.invitation_id}>
                <div className="flex items-center gap-2">
                  <Link2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {new Date(invite.expires_at).toLocaleString('ja-JP')}まで
                  </span>
                  <Badge variant="outline">
                    {invitationStateLabel[invite.state] ?? invite.state}
                  </Badge>
                </div>
                {invite.state === 'active' && (
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={action.busy}
                      onClick={() =>
                        void issue(invite.invitation_id).catch(() => {})
                      }
                    >
                      <RotateCw aria-hidden="true" />
                      再発行
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={action.busy}
                      onClick={() =>
                        void action
                          .run(async () => {
                            await api.householdRevoke(id, invite.invitation_id)
                            if (secret?.invitation_id === invite.invitation_id)
                              setSecret(null)
                          })
                          .catch(() => {})
                      }
                    >
                      <X aria-hidden="true" />
                      取消
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
