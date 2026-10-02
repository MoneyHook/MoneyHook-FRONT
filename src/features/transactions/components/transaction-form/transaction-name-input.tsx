import { useEffect, useId, useRef, useState } from 'react'

import { Input } from '@/shared/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'

type Props = Pick<
  TransactionFormController,
  | 'form'
  | 'errors'
  | 'isEdit'
  | 'payments'
  | 'recommendedTransactions'
  | 'isLoadingRecommendations'
  | 'recommendationsError'
  | 'handleNameChange'
  | 'handleNameCompositionStart'
  | 'handleNameCompositionEnd'
  | 'selectFrequentTransaction'
>

export function TransactionNameInput({
  form,
  errors,
  isEdit,
  payments,
  recommendedTransactions,
  isLoadingRecommendations,
  recommendationsError,
  handleNameChange,
  handleNameCompositionStart,
  handleNameCompositionEnd,
  selectFrequentTransaction,
}: Props) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const [open, setOpen] = useState(false)
  const [activeName, setActiveName] = useState<string | null>(null)
  const isOpen = open && !isEdit
  const activeIndex = recommendedTransactions.findIndex(
    (transaction) => transaction.transaction_name === activeName,
  )

  useEffect(() => {
    if (isOpen && activeName) {
      listRef.current
        ?.querySelector<HTMLElement>('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, activeName])

  const select = (transaction: (typeof recommendedTransactions)[number]) => {
    selectFrequentTransaction(transaction)
    setOpen(false)
    setActiveName(null)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setActiveName(null)
      }}
    >
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          aria-autocomplete={isEdit ? undefined : 'list'}
          aria-controls={isOpen ? listId : undefined}
          aria-describedby={
            errors.transactionName
              ? 'new-transaction-transactionName-error'
              : undefined
          }
          aria-expanded={isEdit ? undefined : isOpen}
          aria-haspopup={isEdit ? undefined : 'listbox'}
          aria-invalid={errors.transactionName ? true : undefined}
          autoComplete="off"
          className="ml-auto h-11 max-w-64 text-right text-xl placeholder:text-muted-foreground/60"
          id="new-transaction-name"
          maxLength={32}
          onBlur={() => setOpen(false)}
          onClick={() => !isEdit && setOpen(true)}
          onFocus={() => {
            if (!isEdit) setOpen(true)
            setActiveName(null)
          }}
          onChange={(event) => {
            handleNameChange(event.target.value)
            setActiveName(null)
            if (!isEdit) setOpen(true)
          }}
          onCompositionStart={() => {
            isComposing.current = true
            setActiveName(null)
            handleNameCompositionStart()
          }}
          onCompositionEnd={(event) => {
            isComposing.current = false
            handleNameCompositionEnd(event.currentTarget.value)
          }}
          onKeyDown={(event) => {
            if (
              isEdit ||
              isComposing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229
            ) {
              return
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              const count = recommendedTransactions.length
              if (count) {
                const current = isOpen ? activeIndex : -1
                const next =
                  event.key === 'ArrowDown'
                    ? (current + 1) % count
                    : current <= 0
                      ? count - 1
                      : current - 1
                setActiveName(recommendedTransactions[next].transaction_name)
              }
            } else if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
              event.preventDefault()
              select(recommendedTransactions[activeIndex])
            } else if (event.key === 'Escape' && isOpen) {
              event.preventDefault()
              setOpen(false)
              setActiveName(null)
            } else if (event.key === 'Tab') {
              setOpen(false)
            }
          }}
          placeholder="例: ランチ"
          role={isEdit ? undefined : 'combobox'}
          value={form.transactionName}
        />
      </PopoverAnchor>
      <PopoverContent
        align="end"
        side="bottom"
        collisionPadding={16}
        className="w-80 max-w-[calc(100vw-2rem)] p-1"
        role="presentation"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          if (
            !isComposing.current &&
            !event.isComposing &&
            event.keyCode !== 229
          ) {
            setOpen(false)
            setActiveName(null)
          }
        }}
      >
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
          {form.transactionName.trim() ? 'おすすめ' : '最近よく使う取引'}
        </div>
        <div
          ref={listRef}
          aria-label="取引名の候補"
          aria-busy={isLoadingRecommendations}
          className="max-h-[min(20rem,calc(var(--radix-popover-content-available-height)-2.5rem))] overflow-y-auto"
          id={listId}
          role="listbox"
        >
          {recommendedTransactions.map((transaction, index) => {
            const payment = payments.find(
              (item) => item.payment_id === transaction.payment_id,
            )
            return (
              <button
                aria-selected={activeIndex === index}
                className={cn(
                  'flex min-h-14 w-full flex-col justify-center rounded-lg px-3 py-2 text-left outline-none hover:bg-accent hover:text-accent-foreground',
                  activeIndex === index && 'bg-accent text-accent-foreground',
                )}
                id={`${listId}-option-${index}`}
                key={transaction.transaction_name}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={(event) => {
                  if (event.pointerType === 'mouse') {
                    setActiveName(transaction.transaction_name)
                  }
                }}
                onClick={() => select(transaction)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <span className="w-full truncate text-sm font-medium">
                  {transaction.transaction_name}
                </span>
                <span className="mt-0.5 w-full truncate text-xs text-muted-foreground">
                  {transaction.category_name} / {transaction.sub_category_name}
                  {payment ? ` · ${payment.payment_name}` : ''}
                  {transaction.fixed_flg ? ' · 固定費' : ''}
                </span>
              </button>
            )
          })}
        </div>
        {!recommendedTransactions.length ? (
          <p className="px-3 py-3 text-sm text-muted-foreground" role="status">
            {isLoadingRecommendations
              ? '候補を読み込んでいます…'
              : recommendationsError
                ? '候補を取得できませんでした。取引名はそのまま入力できます。'
                : '候補はありません。そのまま入力できます。'}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
