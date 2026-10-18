import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type {
  HouseholdEntry,
  HouseholdMember,
  HouseholdReference,
} from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { useConfirmation } from '@/shared/hooks/use-confirmation'

import { api, useHouseholdAction } from '../api/household-queries'
import { FamilyEntryEditor } from './family-entry-editor'
import { FamilyError } from './fields'

type Props = {
  id: string
  entry: HouseholdEntry
  members: HouseholdMember[]
  payments: HouseholdReference[]
  subcategories: HouseholdReference[]
  returnTo: string
}
export function FamilyEntryDetail(props: Props) {
  const { id, entry, returnTo } = props
  const [edit, setEdit] = useState(false)
  const confirm = useConfirmation()
  const action = useHouseholdAction()
  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {entry.category_name} /{' '}
        {entry.household_sub_category_name ?? 'サブカテゴリなし'} /{' '}
        {entry.household_payment_name ?? '支払い方法なし'}
      </p>
      {entry.kind === 'shared' && (
        <p className="text-sm">
          個人の取引を共有中です。変更できるのは本人だけです。共有を解除しても、個人の取引は残ります。
        </p>
      )}
      {entry.kind === 'snapshot' && (
        <p className="text-sm">
          {entry.captured_at &&
            new Date(entry.captured_at).toLocaleString('ja-JP')}
          時点の控えです。個人の取引との同期は終了しています。
        </p>
      )}
      <FamilyError error={action.error} />
      <div className="flex flex-wrap gap-2">
        {entry.kind === 'shared' &&
          entry.permissions.can_edit &&
          entry.source_transaction_id && (
            <Button asChild variant="outline">
              <Link
                to={`/app/family/transactions/${entry.source_transaction_id}/edit?household=${id}`}
                state={{
                  returnTo,
                }}
              >
                個人の取引を編集
              </Link>
            </Button>
          )}
        {((entry.kind === 'proxy' && entry.permissions.can_edit) ||
          entry.permissions.can_correct) && (
          <Button variant="outline" onClick={() => setEdit(!edit)}>
            {entry.kind === 'snapshot' ? '訂正・集計除外' : '代理記録を編集'}
          </Button>
        )}
        {entry.kind === 'proxy' && entry.permissions.can_delete && (
          <Button
            variant="destructive"
            disabled={action.busy}
            onClick={() => {
              void action
                .run(async () => {
                  if (
                    await confirm({
                      title: '代理記録の削除',
                      description: '家族の代理記録を削除しますか？',
                      actionLabel: '削除する',
                      destructive: true,
                    })
                  )
                    await api.householdDeleteProxy(id, entry.entry_id, {
                      expected_version: entry.version,
                    })
                })
                .catch(() => {})
            }}
          >
            代理記録を削除
          </Button>
        )}
        {entry.permissions.can_unshare && entry.source_transaction_id && (
          <Button
            variant="outline"
            disabled={action.busy}
            onClick={() => {
              void action
                .run(() =>
                  api.householdUnshare(id, entry.source_transaction_id!, {
                    expected_version: entry.version,
                  }),
                )
                .then(() => toast.success('共有を解除しました。'))
                .catch(() => {})
            }}
          >
            共有を解除
          </Button>
        )}
      </div>
      {edit && <FamilyEntryEditor {...props} onClose={() => setEdit(false)} />}
    </div>
  )
}
