import { useState } from 'react'

import { useGetCategoryList } from '@/shared/api/generated/category/category'
import type {
  HouseholdEntry,
  HouseholdEntryInput,
  HouseholdMember,
  HouseholdReference,
} from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'

import { api, useHouseholdAction } from '../api/household-queries'
import { FamilyError, FamilyField, FamilySelect } from './fields'

type Props = {
  id: string
  entry: HouseholdEntry
  members: HouseholdMember[]
  payments: HouseholdReference[]
  subcategories: HouseholdReference[]
  onClose: () => void
}
export function FamilyEntryEditor({
  id,
  entry,
  members,
  payments,
  subcategories,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<HouseholdEntryInput>({
    expected_version: entry.version,
    transaction: {
      transaction_date: entry.transaction_date,
      transaction_time: entry.transaction_time,
      transaction_name: entry.transaction_name,
      amount: entry.amount,
      sign: entry.sign,
      category_id: entry.category_id,
      fixed_flg: entry.fixed_flg,
      payment_id: null,
    },
    payer: { kind: entry.payer.kind, member_id: entry.payer.member_id },
    household_payment_id: entry.household_payment_id,
    household_sub_category_id: entry.household_sub_category_id,
    excluded_from_totals: entry.excluded_from_totals,
  })
  const transaction = draft.transaction!
  const set = (values: Partial<typeof transaction>) =>
    setDraft({ ...draft, transaction: { ...transaction, ...values } })
  const categories = useGetCategoryList()
  const action = useHouseholdAction()
  const correct = entry.kind === 'snapshot'
  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void action
          .run(async () => {
            const payer = draft.payer?.member_id ?? 'common'
            const matches = await api.householdDuplicates(id, {
              date: transaction.transaction_date,
              amount: transaction.amount,
              sign: transaction.sign,
              payer,
              exclude: entry.entry_id,
            })
            if (
              matches.status === 200 &&
              matches.data.length &&
              !window.confirm(
                '同じ日付・金額・支払い者の記録があります。この内容で保存しますか？',
              )
            )
              return
            if (correct) await api.householdCorrect(id, entry.entry_id, draft)
            else await api.householdUpdateProxy(id, entry.entry_id, draft)
            onClose()
          })
          .catch(() => {})
      }}
    >
      <h3 className="font-semibold">
        {correct ? '控えを訂正' : '代理記録を編集'}
      </h3>
      <FamilyError error={action.error || categories.error} />
      <div className="grid grid-cols-2 gap-3">
        <FamilyField label="日付">
          <Input
            required
            type="date"
            value={transaction.transaction_date}
            onChange={(e) => set({ transaction_date: e.target.value })}
          />
        </FamilyField>
        <FamilyField label="時刻（任意）">
          <Input
            type="time"
            value={transaction.transaction_time ?? ''}
            onChange={(e) => set({ transaction_time: e.target.value || null })}
          />
        </FamilyField>
      </div>
      <FamilyField label="取引名">
        <Input
          required
          maxLength={32}
          value={transaction.transaction_name}
          onChange={(e) => set({ transaction_name: e.target.value })}
        />
      </FamilyField>
      <div className="grid grid-cols-2 gap-3">
        <FamilyField label="区分">
          <FamilySelect
            value={transaction.sign}
            onChange={(e) => set({ sign: Number(e.target.value) as 1 | -1 })}
          >
            <option value={-1}>支出</option>
            <option value={1}>収入</option>
          </FamilySelect>
        </FamilyField>
        <FamilyField label="金額（円）">
          <Input
            required
            type="number"
            min={1}
            max={9999999}
            step={1}
            value={transaction.amount}
            onChange={(e) => set({ amount: Number(e.target.value) })}
          />
        </FamilyField>
      </div>
      <FamilyField label="カテゴリ">
        <FamilySelect
          required
          value={transaction.category_id}
          onChange={(e) =>
            setDraft({
              ...draft,
              transaction: { ...transaction, category_id: e.target.value },
              household_sub_category_id: null,
            })
          }
        >
          {categories.data?.status === 200 &&
            categories.data.data.category_list?.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
        </FamilySelect>
      </FamilyField>
      <FamilyField label="家族のサブカテゴリ">
        <FamilySelect
          value={draft.household_sub_category_id ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              household_sub_category_id: e.target.value || null,
            })
          }
        >
          <option value="">指定なし</option>
          {subcategories
            .filter(
              (s) =>
                s.category_id === transaction.category_id &&
                (s.active || s.id === entry.household_sub_category_id),
            )
            .map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
                {!s.active ? '（無効）' : ''}
              </option>
            ))}
        </FamilySelect>
      </FamilyField>
      <FamilyField label="支払い者">
        <FamilySelect
          value={draft.payer?.member_id ?? 'common'}
          onChange={(e) =>
            setDraft({
              ...draft,
              payer:
                e.target.value === 'common'
                  ? { kind: 'common', member_id: null }
                  : { kind: 'member', member_id: e.target.value },
            })
          }
        >
          <option value="common">家族共通</option>
          {members
            .filter(
              (m) =>
                m.state === 'active' || m.member_id === entry.payer.member_id,
            )
            .map((m) => (
              <option value={m.member_id} key={m.member_id}>
                {m.display_name}
                {m.state !== 'active' ? '（退出済み）' : ''}
              </option>
            ))}
        </FamilySelect>
      </FamilyField>
      <FamilyField label="家族の支払い方法">
        <FamilySelect
          value={draft.household_payment_id ?? ''}
          onChange={(e) =>
            setDraft({ ...draft, household_payment_id: e.target.value || null })
          }
        >
          <option value="">指定なし</option>
          {payments
            .filter((p) => p.active || p.id === entry.household_payment_id)
            .map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
                {!p.active ? '（無効）' : ''}
              </option>
            ))}
        </FamilySelect>
      </FamilyField>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={transaction.fixed_flg}
          onCheckedChange={(checked) => set({ fixed_flg: checked === true })}
        />
        固定費
      </label>
      {correct && (
        <>
          <p className="text-xs text-muted-foreground">
            家族用の訂正内容を保存します。個人の原本は変更しません。
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.excluded_from_totals}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, excluded_from_totals: checked === true })
              }
            />
            家族の集計から除外する
          </label>
        </>
      )}
      <div className="flex gap-2">
        <Button disabled={action.busy}>保存</Button>
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
