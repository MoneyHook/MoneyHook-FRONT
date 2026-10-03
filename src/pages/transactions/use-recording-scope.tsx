import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'

import {
  FamilyError,
  FamilyField,
  FamilySelect,
  useFamilyData,
  useHouseholdAction,
  useHouseholds,
  useRequestKey,
} from '@/features/households'
import type {
  NewTransactionFormValues,
  TransactionFormExtension,
} from '@/features/transactions'
import { useGetCategoryList } from '@/shared/api/generated/category/category'
import {
  householdDuplicates,
  householdOwn,
  householdProxy,
} from '@/shared/api/generated/household/household'
import type { HouseholdEntryInput } from '@/shared/api/generated/model'
import { useGetV1Settings } from '@/shared/api/generated/settings/settings'
import { HouseholdScopeSwitch } from '@/shared/components/household-scope-switch'
import { Button } from '@/shared/components/ui/button'

export function useRecordingScope(): TransactionFormExtension & {
  isInitializing: boolean
} {
  const [search] = useSearchParams()
  const location = useLocation()
  const families = useHouseholds()
  const hasActiveFamily =
    families.isSuccess && families.data.some((item) => item.state === 'active')
  const settings = useGetV1Settings({
    query: { staleTime: 0, refetchOnWindowFocus: 'always' },
  })
  const requestedFamily = search.get('household')
  const family = families.data?.find(
    (f) =>
      f.state === 'active' &&
      (!requestedFamily || f.household_id === requestedFamily),
  )
  const detail = useFamilyData(family?.household_id ?? '')
  const categories = useGetCategoryList()
  const [scopeOverride, setScope] = useState<'personal' | 'household' | null>(
    () =>
      search.get('scope') === 'personal'
        ? 'personal'
        : search.get('scope') === 'household' ||
            location.pathname === '/app/family/new'
          ? 'household'
          : null,
  )
  const defaultScope =
    settings.data?.status === 200
      ? settings.data.data.default_transaction_scope
      : 'personal'
  const isInitializing =
    scopeOverride === null &&
    (settings.isPending || (defaultScope === 'household' && families.isPending))
  const scope =
    scopeOverride ??
    (family && defaultScope === 'household' ? 'household' : 'personal')
  // Resolve the initial default once, before mounting the form. Refetches must not change an active draft's destination.
  if (scopeOverride === null && !isInitializing) setScope(scope)
  const [payer, setPayer] = useState('own')
  const action = useHouseholdAction()
  const request = useRequestKey()
  const navigate = useNavigate()
  const proxy = scope === 'household' && payer !== 'own'
  const isBlocked =
    isInitializing ||
    (scope === 'household' &&
      (families.isPending ||
        families.isError ||
        !family ||
        !detail.data ||
        detail.data.family.state !== 'active' ||
        detail.isError))
  const references = proxy
    ? {
        categories: (categories.data?.status === 200
          ? (categories.data.data.category_list ?? [])
          : []
        ).map((c) => ({
          ...c,
          sub_category_list: [
            {
              sub_category_id: 'none',
              sub_category_name: '指定なし',
              enable: true,
            },
            ...(detail.data?.subcategories ?? [])
              .filter((s) => s.active && s.category_id === c.category_id)
              .map((s) => ({
                sub_category_id: s.id,
                sub_category_name: s.name,
                enable: true,
              })),
          ],
        })),
        payments: (detail.data?.payments ?? [])
          .filter((p) => p.active)
          .map((p) => ({
            payment_id: p.id,
            payment_name: p.name,
            payment_type_id: p.payment_type_id ?? '1',
            payment_date: p.payment_date,
            closing_date: p.closing_date ?? 31,
          })),
      }
    : undefined
  const onCreate =
    scope === 'household'
      ? async (form: NewTransactionFormValues) => {
          if (!family || !detail.data)
            throw new Error('家族の情報を再読み込みしてください')
          const id = family.household_id
          const body: HouseholdEntryInput = {
            transaction: {
              transaction_date: form.transactionDate,
              transaction_time: form.transactionTime,
              transaction_name: form.transactionName.trim(),
              amount: Number(form.amount),
              sign: form.sign,
              category_id: form.categoryId,
              fixed_flg: form.fixed,
              payment_id: proxy ? null : form.paymentId,
              ...(!proxy
                ? form.subcategoryName
                  ? { sub_category_name: form.subcategoryName.trim() }
                  : { sub_category_id: form.subcategoryId }
                : {}),
            },
            payer:
              payer === 'common'
                ? { kind: 'common', member_id: null }
                : {
                    kind: 'member',
                    member_id: payer === 'own' ? family.member_id : payer,
                  },
            ...(proxy
              ? {
                  household_payment_id: form.paymentId,
                  household_sub_category_id:
                    form.subcategoryId === 'none' ? null : form.subcategoryId,
                }
              : {}),
          }
          await action.run(async () => {
            const duplicates = await householdDuplicates(id, {
              date: form.transactionDate,
              amount: Number(form.amount),
              sign: form.sign,
              payer: payer === 'own' ? family.member_id : payer,
            })
            if (
              duplicates.status === 200 &&
              duplicates.data.length > 0 &&
              !window.confirm(
                '同じ日付・金額・支払い者の家族記録があります。重複ではないことを確認して登録しますか？',
              )
            )
              return
            const r = proxy
              ? await householdProxy(id, body, request(body))
              : await householdOwn(id, body, request(body))
            if (r.status !== 201)
              throw new Error(
                '家族の記録を保存できませんでした。再読み込みしてからお試しください。',
              )
            if (r.status === 201) {
              request.complete(body)
              toast.success('家族の記録を保存しました')
              navigate(
                `/app/family?household=${id}&month=${form.transactionDate.slice(0, 7)}-01`,
                { replace: true },
              )
            }
          })
        }
      : undefined
  return {
    isInitializing,
    renderTitle: hasActiveFamily
      ? (reset, disabled) => (
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <HouseholdScopeSwitch
              hasActiveFamily
              scope={scope === 'household' ? 'family' : 'personal'}
              disabled={disabled || action.busy}
              onScopeChange={(value) => {
                const nextScope = value === 'family' ? 'household' : 'personal'
                if (nextScope === scope) return
                setScope(nextScope)
                setPayer('own')
                if (proxy) reset()
              }}
            />
            <h1
              className="text-base font-semibold tracking-[-0.04em] whitespace-nowrap sm:text-2xl"
              id="transaction-page-title"
            >
              <span className="sr-only">
                {scope === 'household' ? '家族' : '個人'}
              </span>
              の取引を追加
            </h1>
          </div>
        )
      : undefined,
    allowCsvImport: scope === 'personal',
    onCreate,
    isSaving: action.busy,
    isBlocked,
    references,
    saveMode:
      scope === 'household' && family
        ? {
            value: proxy ? 'proxy' : 'normal',
            onChange: (mode, reset) => {
              if ((mode === 'proxy') === proxy) return
              setPayer(mode === 'proxy' ? 'common' : 'own')
              reset()
            },
            renderDetails: proxy
              ? () => (
                  <div className="space-y-3 rounded-2xl bg-card p-4 sm:p-5">
                    <FamilyField label="代理記録の支払い者">
                      <FamilySelect
                        disabled={action.busy}
                        value={payer}
                        onChange={(event) => setPayer(event.target.value)}
                      >
                        <option value="common">家族共通</option>
                        {detail.data?.members
                          .filter(
                            (member) =>
                              member.state === 'active' &&
                              member.member_id !== family.member_id,
                          )
                          .map((member) => (
                            <option
                              key={member.member_id}
                              value={member.member_id}
                            >
                              {member.display_name}
                            </option>
                          ))}
                      </FamilySelect>
                    </FamilyField>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      家族にだけ保存します。支払い者の個人記録には追加されません。
                    </p>
                  </div>
                )
              : undefined,
          }
        : undefined,
    renderOptions:
      families.isError ||
      settings.isError ||
      (scope === 'household' &&
        (detail.isError || (!families.isPending && !family)))
        ? (_form, reset) => (
            <div className="my-3 space-y-3 rounded-lg border p-3">
              <FamilyError
                error={
                  families.error ||
                  settings.error ||
                  (scope === 'household' ? detail.error : null)
                }
              />
              {scope === 'household' && !families.isPending && !family && (
                <p className="text-sm">
                  登録できる家族がありません。個人用へ切り替えるか、家族設定を確認してください。
                </p>
              )}
              {(families.isError ||
                (scope === 'household' && detail.isError)) && (
                <Button
                  variant="link"
                  type="button"
                  className="text-sm text-primary underline"
                  onClick={() => {
                    void families.refetch()
                    if (family) void detail.refetch()
                  }}
                >
                  家族情報を再読み込み
                </Button>
              )}
              {!hasActiveFamily && scope === 'household' && (
                <Button
                  disabled={action.busy}
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setScope('personal')
                    setPayer('own')
                    if (proxy) reset()
                  }}
                >
                  個人用で登録する
                </Button>
              )}
              {!family && (
                <Link
                  className="text-sm text-primary underline"
                  to="/app/settings/family"
                >
                  家族を作成・招待から参加
                </Link>
              )}
            </div>
          )
        : undefined,
  }
}
