import { FamilyField, FamilySelect } from '@/features/households'
import type { HouseholdMember } from '@/shared/api/generated/model'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'

type Filters = { payer: string; kind: string }

export function FamilyTransactionsFilterSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  members,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: Filters
  onDraftChange: (draft: Filters) => void
  members: HouseholdMember[] | undefined
  onApply: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88svh] overflow-y-auto rounded-t-[2rem] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-xl"
      >
        <SheetHeader className="px-0">
          <SheetTitle>絞り込み</SheetTitle>
          <SheetDescription>
            一覧とカレンダーに表示する取引を絞り込みます。
          </SheetDescription>
        </SheetHeader>
        <FamilyField label="支払い者">
          <FamilySelect
            value={draft.payer}
            onChange={(event) =>
              onDraftChange({ ...draft, payer: event.target.value })
            }
          >
            <option value="">全員</option>
            <option value="common">家族共通</option>
            {members?.map((member) => (
              <option key={member.member_id} value={member.member_id}>
                {member.display_name}
                {member.state === 'left' ? '（退出済み）' : ''}
              </option>
            ))}
          </FamilySelect>
        </FamilyField>
        <FamilyField label="記録の種類">
          <FamilySelect
            value={draft.kind}
            onChange={(event) =>
              onDraftChange({ ...draft, kind: event.target.value })
            }
          >
            <option value="">すべて</option>
            <option value="shared">個人の取引</option>
            <option value="proxy">代理記録</option>
            <option value="snapshot">控え</option>
          </FamilySelect>
        </FamilyField>
        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onDraftChange({ payer: '', kind: '' })}
          >
            クリア
          </Button>
          <Button onClick={onApply}>適用する</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
