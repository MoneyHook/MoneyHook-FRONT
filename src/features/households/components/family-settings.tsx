import { Check, HousePlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  patchV1Settings,
  useGetV1Settings,
} from '@/shared/api/generated/settings/settings'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import {
  api,
  useFamilyData,
  useHouseholdAction,
  useHouseholds,
  useRequestKey,
} from '../api/household-queries'
import { FamilyInvitations } from './family-invitations'
import { FamilyLifecycleActions } from './family-lifecycle-actions'
import { FamilyMembers } from './family-members'
import { FamilyError, FamilyField, FamilySelect } from './fields'
import { JoinFamily } from './join-family'

export function FamilySettings() {
  const families = useHouseholds()
  const settings = useGetV1Settings({
    query: { staleTime: 0, refetchOnWindowFocus: 'always' },
  })
  const [search, setSearch] = useSearchParams()
  const selected = search.get('household') ?? ''
  const current = selected
    ? families.data?.find((family) => family.household_id === selected)
    : (families.data?.find((family) => family.state === 'active') ??
      families.data?.[0])
  const detail = useFamilyData(current?.household_id ?? '')
  const [name, setName] = useState('')
  const [display, setDisplay] = useState('')
  const action = useHouseholdAction()
  const request = useRequestKey()
  const active = families.data?.some((family) => family.state === 'active')
  const activeMembers =
    detail.data?.members.filter((member) => member.state === 'active') ?? []
  const defaultScope =
    settings.data?.status === 200
      ? (settings.data.data.default_transaction_scope ?? 'personal')
      : 'personal'

  return (
    <div className="family-settings-flow space-y-5">
      <FamilyError
        error={families.error || detail.error || action.error || settings.error}
      />

      {families.isPending && (
        <div
          className="flex min-h-48 items-center justify-center rounded-2xl border bg-card p-5 text-sm text-muted-foreground"
          role="status"
        >
          家族を読み込んでいます…
        </div>
      )}

      {selected && !families.isPending && !families.isError && !current && (
        <div className="space-y-3 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
          <p className="font-medium">この家族にはアクセスできません。</p>
          <Button asChild variant="outline">
            <Link to="/app/settings/family">家族設定の入口に戻る</Link>
          </Button>
        </div>
      )}

      {current && (
        <>
          <section
            aria-labelledby="family-overview-title"
            className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users aria-hidden="true" className="size-4" />
                  表示中の家族
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2
                    className="truncate text-2xl font-semibold tracking-[-0.04em] md:text-3xl"
                    id="family-overview-title"
                  >
                    {current.name}
                  </h2>
                  <Badge
                    className="rounded-full px-2.5"
                    variant={
                      current.state === 'active' ? 'secondary' : 'outline'
                    }
                  >
                    {current.state === 'active' ? (
                      <Check aria-hidden="true" />
                    ) : null}
                    {current.state === 'active' ? '利用中' : '終了・閲覧専用'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeMembers.length} / 3人 ・{' '}
                  {current.role === 'admin' ? 'あなたは管理者です' : 'メンバー'}
                </p>
              </div>

              {(families.data?.length ?? 0) > 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <FamilyField label="表示する家族">
                    <FamilySelect
                      className="sm:w-64"
                      value={current.household_id}
                      onChange={(event) =>
                        setSearch((params) => {
                          params.set('household', event.target.value)
                          return params
                        })
                      }
                    >
                      {families.data?.map((family) => (
                        <option
                          value={family.household_id}
                          key={family.household_id}
                        >
                          {family.name}
                          {family.state === 'archived'
                            ? '（終了・閲覧専用）'
                            : ''}
                        </option>
                      ))}
                    </FamilySelect>
                  </FamilyField>
                </div>
              )}
            </div>
          </section>

          {detail.data && detail.data.family.state === 'active' && (
            <>
              <div
                className={
                  detail.data.family.role === 'admin'
                    ? 'grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]'
                    : 'max-w-3xl'
                }
              >
                <FamilyMembers
                  defaultScope={defaultScope}
                  family={detail.data.family}
                  members={detail.data.members}
                  onDefaultScopeChange={(scope) =>
                    void action
                      .run(() =>
                        patchV1Settings({
                          default_transaction_scope: scope,
                        }),
                      )
                      .catch(() => {})
                  }
                  settingsDisabled={
                    action.busy || settings.isPending || settings.isError
                  }
                />
                {detail.data.family.role === 'admin' && (
                  <FamilyInvitations
                    key={current.household_id}
                    family={detail.data.family}
                    memberCount={activeMembers.length}
                  />
                )}
              </div>
              <FamilyLifecycleActions
                family={detail.data.family}
                memberCount={activeMembers.length}
              />
            </>
          )}

          {detail.data && detail.data.family.state !== 'active' && (
            <div className="rounded-2xl border bg-card p-5 text-sm leading-6 text-muted-foreground sm:p-6">
              この家族は終了しているため、設定は変更できません。過去の家族記録は閲覧できます。
            </div>
          )}
        </>
      )}

      {!families.isPending && !families.isError && !active && (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section
            aria-labelledby="create-family-title"
            className="space-y-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <HousePlus aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold" id="create-family-title">
                  家族を作成
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  最大3人で家計を記録できます。作成後にメンバーを招待してください。
                </p>
              </div>
            </div>
            <form
              className="space-y-4 border-t pt-5"
              onSubmit={(event) => {
                event.preventDefault()
                const body = { name, display_name: display }
                void action
                  .run(() => api.householdCreate(body, request(body)))
                  .then(() => request.complete(body))
                  .catch(() => {})
              }}
            >
              <FamilyField label="家族の名前">
                <Input
                  className="h-10"
                  required
                  maxLength={64}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FamilyField>
              <FamilyField label="家族に表示する自分の名前">
                <Input
                  className="h-10"
                  required
                  maxLength={32}
                  value={display}
                  onChange={(event) => setDisplay(event.target.value)}
                />
              </FamilyField>
              <Button className="h-10 w-full sm:w-auto" disabled={action.busy}>
                家族を作成
              </Button>
            </form>
          </section>
          <JoinFamily />
        </div>
      )}
    </div>
  )
}
