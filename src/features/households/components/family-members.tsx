import { Crown, Pencil, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'

import type { Household, HouseholdMember } from '@/shared/api/generated/model'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

import { api, useHouseholdAction } from '../api/household-queries'
import { FamilyError, FamilyField } from './fields'

type TransactionScope = 'personal' | 'household'

export function FamilyMembers({
  defaultScope,
  family,
  members,
  onDefaultScopeChange,
  settingsDisabled,
}: {
  defaultScope: TransactionScope
  family: Household
  members: HouseholdMember[]
  onDefaultScopeChange: (scope: TransactionScope) => void
  settingsDisabled: boolean
}) {
  const me = members.find((member) => member.member_id === family.member_id)
  const [name, setName] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState<{
    value: string
    version: number
  } | null>(null)
  const action = useHouseholdAction()
  const id = family.household_id
  const active = members.filter((member) => member.state === 'active')
  const confirmation = (message: string, fn: () => Promise<unknown>) => {
    if (window.confirm(message)) void action.run(fn).catch(() => {})
  }

  return (
    <div className="min-w-0 space-y-5">
      <section
        aria-labelledby="personal-family-settings-title"
        className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
      >
        <div className="mb-5">
          <h2
            className="text-lg font-semibold tracking-[-0.025em]"
            id="personal-family-settings-title"
          >
            自分の設定
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            家族内の表示名と、新しい取引を入力するときの初期値を設定します。
          </p>
        </div>

        <FamilyError error={action.error} />
        <div className="space-y-6 border-t pt-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <FamilyField label="家族に表示する自分の名前">
              <Input
                className="h-10"
                value={name ?? me?.display_name ?? ''}
                maxLength={32}
                onChange={(event) => setName(event.target.value)}
              />
            </FamilyField>
            <Button
              className="h-10"
              variant="outline"
              disabled={action.busy || name === null}
              onClick={() =>
                void action
                  .run(() =>
                    api.householdRenameMember(id, {
                      display_name: name ?? me?.display_name ?? '',
                    }),
                  )
                  .then(() => setName(null))
                  .catch(() => {})
              }
            >
              <Save aria-hidden="true" />
              表示名を保存
            </Button>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              新規入力のデフォルト
            </legend>
            <div
              aria-label="新規入力のデフォルト"
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
              role="radiogroup"
            >
              {(
                [
                  ['personal', '個人用'],
                  ['household', '家族用'],
                ] as const
              ).map(([value, label]) => (
                <button
                  aria-checked={defaultScope === value}
                  className={cn(
                    'h-10 rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                    defaultScope === value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  disabled={settingsDisabled}
                  key={value}
                  onClick={() => onDefaultScopeChange(value)}
                  role="radio"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              入力画面で毎回切り替えられます。この設定は端末間で同期されます。
            </p>
          </fieldset>
        </div>
      </section>

      <section
        aria-labelledby="family-members-title"
        className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-lg font-semibold tracking-[-0.025em]"
              id="family-members-title"
            >
              メンバー
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              参加中 {active.length}人、上限3人
            </p>
          </div>
        </div>

        {family.role === 'admin' && (
          <div className="grid gap-3 border-y py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <FamilyField label="家族の名前">
              <Input
                className="h-10"
                value={familyName?.value ?? family.name}
                maxLength={64}
                onChange={(event) =>
                  setFamilyName({
                    value: event.target.value,
                    version: familyName?.version ?? family.version,
                  })
                }
              />
            </FamilyField>
            <Button
              className="h-10"
              variant="outline"
              disabled={action.busy || familyName === null}
              onClick={() =>
                void action
                  .run(() =>
                    api.householdRename(id, {
                      name: familyName?.value ?? family.name,
                      expected_version: familyName?.version ?? family.version,
                    }),
                  )
                  .then(() => setFamilyName(null))
                  .catch(() => {})
              }
            >
              <Pencil aria-hidden="true" />
              家族名を変更
            </Button>
          </div>
        )}

        <ul className={family.role === 'admin' ? '' : 'border-t'}>
          {members.map((member) => (
            <li
              className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center"
              key={member.member_id}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                >
                  {member.display_name.trim().slice(0, 1) || (
                    <UserRound className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {member.display_name}
                      {member.member_id === family.member_id
                        ? '（あなた）'
                        : ''}
                    </span>
                    {member.role === 'admin' && (
                      <Badge variant="secondary">
                        <ShieldCheck aria-hidden="true" />
                        管理者
                      </Badge>
                    )}
                    {member.state === 'left' && (
                      <Badge variant="outline">退出済み</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {member.state === 'active'
                      ? `${new Date(member.joined_at).toLocaleDateString('ja-JP')}から参加`
                      : '過去の記録には表示名が残ります'}
                  </p>
                </div>
              </div>

              {family.role === 'admin' &&
                member.state === 'active' &&
                member.member_id !== family.member_id && (
                  <div className="flex flex-wrap gap-2 pl-13 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={action.busy}
                      onClick={() =>
                        confirmation(
                          `${member.display_name}さんへ管理者を交代します。未使用の招待は無効になります。`,
                          () =>
                            api.householdTransfer(id, {
                              target_member_id: member.member_id,
                              expected_version: family.version,
                            }),
                        )
                      }
                    >
                      <Crown aria-hidden="true" />
                      管理者にする
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={action.busy}
                      onClick={() =>
                        confirmation(
                          `${member.display_name}さんの参加を解除します。共有原本の控えが家族に残ります。`,
                          () =>
                            api.householdRemoveMember(id, member.member_id, {
                              expected_version: family.version,
                            }),
                        )
                      }
                    >
                      参加を解除
                    </Button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
