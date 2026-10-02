import type { Household } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'

import { api, useHouseholdAction } from '../api/household-queries'
import { FamilyError } from './fields'

export function FamilyLifecycleActions({
  family,
  memberCount,
}: {
  family: Household
  memberCount: number
}) {
  const action = useHouseholdAction()
  const id = family.household_id
  const confirmation = (message: string, fn: () => Promise<unknown>) => {
    if (window.confirm(message)) void action.run(fn).catch(() => {})
  }

  return (
    <section
      aria-labelledby="family-danger-title"
      className="rounded-2xl border border-destructive/25 bg-card p-5 text-card-foreground sm:p-6"
    >
      <h2 className="text-sm font-semibold" id="family-danger-title">
        家族の利用を終了する
      </h2>
      <FamilyError error={action.error} />
      {family.role !== 'admin' ? (
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">
            退出後は家族の記録を閲覧できません。あなたの個人原本は残り、家族には退出時点の控えが残ります。
          </p>
          <Button
            className="shrink-0"
            variant="destructive"
            disabled={action.busy}
            onClick={() =>
              confirmation(
                '家族から退出します。原本は個人に残り、家族には控えが残ります。退出後は家族の記録を閲覧できません。',
                () =>
                  api.householdLeave(id, {
                    expected_version: family.version,
                  }),
              )
            }
          >
            家族から退出
          </Button>
        </div>
      ) : memberCount === 1 ? (
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">
            家族を終了すると閲覧専用になります。共有原本は終了時点の控えに変わります。
          </p>
          <Button
            className="shrink-0"
            variant="destructive"
            disabled={action.busy}
            onClick={() =>
              confirmation(
                'この家族を終了し、閲覧専用にします。共有原本は控えに変わります。',
                () =>
                  api.householdArchive(id, {
                    expected_version: family.version,
                  }),
              )
            }
          >
            家族を終了
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          管理者が退出する場合は、先に他のメンバーへ管理者を交代してください。
        </p>
      )}
    </section>
  )
}
