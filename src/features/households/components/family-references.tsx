import { CreditCard, Pencil, Plus, Tags } from 'lucide-react'
import { useState } from 'react'

import { useGetCategoryList } from '@/shared/api/generated/category/category'
import type { HouseholdReference } from '@/shared/api/generated/model'
import { useGetPaymentTypes } from '@/shared/api/generated/payment/payment'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { api, useHouseholdAction } from '../api/household-queries'
import { FamilyError, FamilyField, FamilySelect } from './fields'

type ReferenceKind = 'payments' | 'subcategories'
type EditableReference = HouseholdReference & { kind: ReferenceKind }

export function FamilyReferences({
  id,
  payments,
  subcategories,
}: {
  id: string
  payments: HouseholdReference[]
  subcategories: HouseholdReference[]
}) {
  const action = useHouseholdAction()
  const [kind, setKind] = useState<ReferenceKind>('payments')
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [editing, setEditing] = useState<EditableReference | null>(null)
  const categories = useGetCategoryList()
  const types = useGetPaymentTypes()
  const choices =
    kind === 'payments'
      ? types.data?.status === 200
        ? types.data.data.payment_type_list.map((payment) => ({
            id: payment.payment_type_id,
            name: payment.payment_type_name,
          }))
        : []
      : categories.data?.status === 200
        ? (categories.data.data.category_list ?? []).map((category) => ({
            id: category.category_id,
            name: category.category_name,
          }))
        : []
  const references: EditableReference[] = (
    kind === 'payments' ? payments : subcategories
  ).map((reference) => ({ ...reference, kind }))

  const resetForm = () => {
    setEditing(null)
    setName('')
    setParent('')
    setPaymentDate('')
    setClosingDate('')
  }

  return (
    <section
      aria-labelledby="family-references-title"
      className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2
            className="text-lg font-semibold tracking-[-0.025em]"
            id="family-references-title"
          >
            家族専用の設定
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            家族で使う支払い方法とサブカテゴリを管理します。個人用の設定には影響しません。
          </p>
        </div>
        <Tabs
          value={kind}
          onValueChange={(value) => {
            resetForm()
            setKind(value as ReferenceKind)
          }}
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="payments">
              <CreditCard aria-hidden="true" />
              支払い方法
            </TabsTrigger>
            <TabsTrigger value="subcategories">
              <Tags aria-hidden="true" />
              サブカテゴリ
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <FamilyError error={action.error || categories.error || types.error} />

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.3fr)] lg:gap-12">
        <form
          className="space-y-4 rounded-xl border bg-muted/50 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void action
              .run(async () => {
                const input =
                  kind === 'payments'
                    ? {
                        name,
                        payment_type_id: parent,
                        payment_date: paymentDate ? Number(paymentDate) : null,
                        closing_date: closingDate ? Number(closingDate) : null,
                      }
                    : {
                        name,
                        category_id: parent,
                      }
                if (editing) {
                  const body = { ...input, expected_version: editing.version }
                  if (kind === 'payments')
                    await api.householdSavePayments(id, editing.id, body)
                  else
                    await api.householdSaveSubcategories(id, editing.id, body)
                } else if (kind === 'payments')
                  await api.householdSavePaymentsCreate(id, input)
                else await api.householdSaveSubcategoriesCreate(id, input)
                resetForm()
              })
              .catch(() => {})
          }}
        >
          <div>
            <h3 className="text-sm font-semibold">
              {editing
                ? `${kind === 'payments' ? '支払い方法' : 'サブカテゴリ'}を編集`
                : `${kind === 'payments' ? '支払い方法' : 'サブカテゴリ'}を追加`}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              使用済みの項目は、削除せず無効化して過去の表示を保ちます。
            </p>
          </div>

          <FamilyField label={kind === 'payments' ? '支払い種類' : 'カテゴリ'}>
            <FamilySelect
              required
              value={parent}
              onChange={(event) => setParent(event.target.value)}
            >
              <option value="">選択してください</option>
              {choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </FamilySelect>
          </FamilyField>

          <FamilyField label="名前">
            <Input
              className="h-10"
              required
              maxLength={kind === 'payments' ? 32 : 16}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FamilyField>

          {kind === 'payments' && (
            <div className="grid grid-cols-2 gap-3">
              <FamilyField label="支払日（任意）">
                <Input
                  className="h-10"
                  type="number"
                  min="1"
                  max="31"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </FamilyField>
              <FamilyField label="締め日（任意）">
                <Input
                  className="h-10"
                  type="number"
                  min="1"
                  max="31"
                  value={closingDate}
                  onChange={(event) => setClosingDate(event.target.value)}
                />
              </FamilyField>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="h-10 flex-1" disabled={action.busy}>
              {editing ? (
                <Pencil aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {editing ? '変更を保存' : '追加'}
            </Button>
            {editing && (
              <Button
                className="h-10"
                type="button"
                variant="ghost"
                disabled={action.busy}
                onClick={resetForm}
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>

        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b pb-2 text-xs font-medium text-muted-foreground">
            <span>名前</span>
            <span>操作</span>
          </div>
          {references.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center border-b text-sm text-muted-foreground">
              まだ登録されていません
            </div>
          ) : (
            <div>
              {references.map((reference) => (
                <div
                  className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center"
                  key={reference.id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {reference.name}
                      </span>
                      <Badge
                        variant={reference.active ? 'secondary' : 'outline'}
                      >
                        {reference.active ? '利用中' : '無効'}
                      </Badge>
                    </div>
                    {reference.kind === 'payments' &&
                      (reference.closing_date || reference.payment_date) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reference.closing_date
                            ? `締め日 ${reference.closing_date}日`
                            : '締め日なし'}
                          {' ・ '}
                          {reference.payment_date
                            ? `支払日 ${reference.payment_date}日`
                            : '支払日なし'}
                        </p>
                      )}
                  </div>
                  <div className="flex gap-1 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={action.busy}
                      onClick={() => {
                        setEditing(reference)
                        setName(reference.name)
                        setParent(
                          (reference.kind === 'payments'
                            ? reference.payment_type_id
                            : reference.category_id) ?? '',
                        )
                        setPaymentDate(reference.payment_date?.toString() ?? '')
                        setClosingDate(reference.closing_date?.toString() ?? '')
                      }}
                    >
                      <Pencil aria-hidden="true" />
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={action.busy}
                      onClick={() =>
                        void action
                          .run(() =>
                            reference.kind === 'payments'
                              ? api.householdSavePayments(id, reference.id, {
                                  active: !reference.active,
                                  expected_version: reference.version,
                                })
                              : api.householdSaveSubcategories(
                                  id,
                                  reference.id,
                                  {
                                    active: !reference.active,
                                    expected_version: reference.version,
                                  },
                                ),
                          )
                          .catch(() => {})
                      }
                    >
                      {reference.active ? '無効化' : '有効化'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
