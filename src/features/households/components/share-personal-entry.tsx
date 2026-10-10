import { useQuery } from '@tanstack/react-query'

import { useGetV1Transaction } from '@/shared/api/generated/transaction/transaction'
import { Button } from '@/shared/components/ui/button'

import {
  api,
  householdKey,
  useHouseholdAction,
  useHouseholds,
} from '../api/household-queries'
import { FamilyShareSkeleton } from './family-skeletons'
import { FamilyError } from './fields'

export function SharePersonalEntry({
  transactionId,
  householdId,
}: {
  transactionId: string
  householdId?: string
}) {
  const families = useHouseholds()
  const family = families.data?.find(
    (f) =>
      f.state === 'active' && (!householdId || f.household_id === householdId),
  )
  const query = useGetV1Transaction(transactionId)
  const transaction =
    query.data?.status === 200 ? query.data.data.transaction : null
  const action = useHouseholdAction()
  const shared = useQuery({
    queryKey: [
      ...householdKey,
      'entries',
      family?.household_id,
      'source',
      transactionId,
      transaction?.version,
    ],
    enabled: Boolean(family && transaction),
    queryFn: async ({ signal }) => {
      const r = await api.householdShareStatus(
        family!.household_id,
        transactionId,
        { signal },
      )
      if (r.status !== 200) throw new Error('共有状態を取得できません')
      return r.data
    },
  })
  if (families.isPending || query.isPending) return <FamilyShareSkeleton />
  if (families.isError || query.isError)
    return <FamilyError error={families.error || query.error} />
  if (!family || !transaction)
    return (
      <p className="px-5 py-3 text-sm">
        この取引の共有を変更できません。家族と取引の状態を確認してください。
      </p>
    )
  return (
    <aside className="mx-auto w-full max-w-2xl space-y-3 border-t px-5 py-5 pb-28">
      {shared.data?.kind === 'snapshot' && (
        <p className="text-sm">
          退出時の控えが残っているため、この原本は再共有できません。
        </p>
      )}
      <h2 className="font-semibold">{family.name}への共有</h2>
      <FamilyError error={shared.error || action.error} />
      <p className="text-sm text-muted-foreground">
        {transaction.shared
          ? '共有中です。原本の更新は家族にも反映されます。他の家族は原本を編集・削除できません。'
          : '保存済みの取引と、選んだサブカテゴリ・支払い方法（締め日・支払日を含む）を家族に共有します。家族にない項目は自動で追加します。'}
      </p>
      {!transaction.shared && shared.data?.kind !== 'snapshot' && (
        <>
          <Button
            disabled={
              action.busy ||
              !transaction.version ||
              shared.isPending ||
              shared.isError
            }
            onClick={() => {
              if (window.confirm('保存済みの内容を家族へ共有しますか？'))
                void action
                  .run(() =>
                    api.householdShare(family.household_id, transactionId, {
                      source_version: transaction.version,
                      expected_version: shared.data?.version,
                    }),
                  )
                  .catch(() => {})
            }}
          >
            保存済みの原本を共有
          </Button>
        </>
      )}
      {transaction.shared && shared.data && (
        <Button
          variant="outline"
          disabled={action.busy}
          onClick={() => {
            if (window.confirm('共有を解除しますか？個人の原本は残ります。'))
              void action
                .run(() =>
                  api.householdUnshare(family.household_id, transactionId, {
                    expected_version: shared.data!.version,
                  }),
                )
                .catch(() => {})
          }}
        >
          共有を解除
        </Button>
      )}
    </aside>
  )
}
