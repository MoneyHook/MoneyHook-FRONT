import { TicketCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { HouseholdPreview } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import {
  api,
  useHouseholdAction,
  useRequestKey,
} from '../api/household-queries'
import { FamilyError, FamilyField } from './fields'

export function JoinFamily({ token = '' }: { token?: string }) {
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<HouseholdPreview | null>(null)
  const action = useHouseholdAction()
  const request = useRequestKey()
  const navigate = useNavigate()
  const credential = token ? { token } : { code }
  return (
    <section
      className="space-y-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
      aria-labelledby="join-family-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <UserPlus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold" id="join-family-title">
            招待から参加
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            招待コードを確認して家族へ参加します。参加できる家族は1つです。
          </p>
        </div>
      </div>
      <div className="space-y-4 border-t pt-5">
        {!token && (
          <FamilyField label="招待コード">
            <Input
              className="h-10 font-mono tracking-[0.12em]"
              autoComplete="off"
              value={code}
              maxLength={11}
              placeholder="XXXXX-XXXXX"
              onChange={(e) => {
                setCode(e.target.value)
                setPreview(null)
              }}
            />
          </FamilyField>
        )}
        <FamilyError error={action.error} />
        {!preview ? (
          <Button
            className="h-10 w-full sm:w-auto"
            disabled={action.busy || (!token && !code)}
            onClick={() =>
              void action
                .run(async () => {
                  const r = await api.householdPreview(credential)
                  if (r.status === 200) setPreview(r.data)
                })
                .catch(() => {})
            }
          >
            <TicketCheck aria-hidden="true" />
            招待を確認
          </Button>
        ) : (
          <div className="space-y-4 rounded-xl border bg-surface p-4">
            <div>
              <p className="text-xs text-muted-foreground">招待された家族</p>
              <p className="mt-1 text-lg font-semibold">
                {preview.household_name}
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              招待者: {preview.inviter_name} ／ 有効期限:{' '}
              {new Date(preview.expires_at).toLocaleString('ja-JP')}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              参加後は過去の家族記録も閲覧できます。個人原本の共有記録は閲覧のみ、代理記録は家族で共同編集できます。
            </p>
            <Button
              className="h-10 w-full"
              disabled={action.busy}
              onClick={() =>
                void action
                  .run(async () => {
                    const r = await api.householdAccept(
                      credential,
                      request(credential),
                    )
                    if (r.status === 201) {
                      sessionStorage.removeItem('household-invite')
                      navigate('/app/settings/family', { replace: true })
                    }
                  })
                  .catch(() => {})
              }
            >
              <UserPlus aria-hidden="true" />
              この家族に参加する
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
