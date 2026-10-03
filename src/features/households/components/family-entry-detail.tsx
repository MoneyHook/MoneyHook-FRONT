import { useState } from 'react'
import { Link } from 'react-router-dom'

import type {
  HouseholdEntry,
  HouseholdMember,
  HouseholdReference,
} from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'

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
          個人の原本を共有中です。変更できるのは本人だけです。
        </p>
      )}
      {entry.kind === 'snapshot' && (
        <p className="text-sm">
          {entry.captured_at &&
            new Date(entry.captured_at).toLocaleString('ja-JP')}
          時点の控えです。原本との同期は終了しています。
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
                個人の原本を編集
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
              if (window.confirm('家族の代理記録を削除しますか？'))
                void action
                  .run(() =>
                    api.householdDeleteProxy(id, entry.entry_id, {
                      expected_version: entry.version,
                    }),
                  )
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
              if (
                window.confirm(
                  '家族への共有を解除しますか？個人の原本は残ります。',
                )
              )
                void action
                  .run(() =>
                    api.householdUnshare(id, entry.source_transaction_id!, {
                      expected_version: entry.version,
                    }),
                  )
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
