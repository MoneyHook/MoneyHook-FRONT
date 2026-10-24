import { Trash2, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

import type { TransactionFormController } from '../../hooks/use-transaction-form-controller'
import type { TransactionFormExtension } from '../../model/form-extension'

type Props = {
  controller: Pick<
    TransactionFormController,
    | 'isEdit'
    | 'goBack'
    | 'openCsvImport'
    | 'isSaving'
    | 'isDeleting'
    | 'setDeleteDialogOpen'
    | 'form'
    | 'handleSignChange'
    | 'resetReferences'
  >
  extension: TransactionFormExtension
}

export function TransactionFormHeader({ controller, extension }: Props) {
  const {
    isEdit,
    goBack,
    openCsvImport,
    isSaving,
    isDeleting,
    setDeleteDialogOpen,
    form,
    handleSignChange,
  } = controller
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const updateHeader = () => {
      const scrollTop = window.scrollY
      setCompact((current) => (current ? scrollTop > 0 : scrollTop > 16))
    }
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-background/95 backdrop-blur transition-[padding] duration-200 ease-out motion-reduce:transition-none',
        compact ? 'pt-1' : 'pt-2 sm:pt-3',
      )}
      data-compact={compact || undefined}
      data-slot="transaction-form-header"
    >
      <header
        className={cn(
          'flex items-center justify-between gap-2 sm:gap-3 [&_h1]:transition-[font-size] [&_h1]:duration-200 [&_h1]:ease-out motion-reduce:[&_h1]:transition-none',
          compact && '[&_h1]:text-base',
        )}
      >
        <Button
          aria-label="前の画面へ戻る"
          className="size-8 sm:size-9"
          onClick={goBack}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-6 sm:size-7" />
        </Button>
        {!isEdit && extension.renderTitle ? (
          extension.renderTitle(controller.resetReferences, isSaving)
        ) : (
          <h1
            className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl"
            id="transaction-page-title"
          >
            取引を{isEdit ? '編集' : '追加'}
          </h1>
        )}
        <div className="flex min-w-8 items-center gap-1 sm:min-w-9">
          {isEdit ? (
            <Button
              aria-label="取引を削除"
              className="size-8 sm:size-9"
              disabled={isSaving || isDeleting || extension.isBlocked}
              onClick={() => setDeleteDialogOpen(true)}
              size="icon"
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </Button>
          ) : extension.allowCsvImport !== false ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="CSV取引をインポート"
                  className="size-8 sm:size-9"
                  onClick={openCsvImport}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Upload aria-hidden="true" className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">CSV取引をインポート</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </header>

      <RadioGroup
        aria-label="取引区分"
        className={cn(
          'grid grid-cols-2 rounded-2xl bg-muted-foreground/10 transition-[margin,padding] duration-200 ease-out motion-reduce:transition-none',
          compact ? 'mt-1 p-0.5' : 'mt-3 p-0.5 sm:mt-8 sm:p-1.5',
        )}
        onValueChange={(value) => handleSignChange(Number(value) as -1 | 1)}
        value={String(form.sign)}
      >
        {[
          { sign: -1 as const, label: '支出' },
          { sign: 1 as const, label: '収入' },
        ].map((item) => {
          const isSelected = form.sign === item.sign
          return (
            <div className="relative" key={item.sign}>
              <RadioGroupItem
                className="peer sr-only"
                id={`transaction-sign-${item.sign}`}
                value={String(item.sign)}
              />
              <label
                className={cn(
                  'flex cursor-pointer items-center justify-center rounded-xl px-3 font-semibold transition-[min-height,color] duration-200 ease-out peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 motion-reduce:transition-none sm:px-4',
                  compact
                    ? 'min-h-9 text-sm'
                    : 'min-h-10 text-sm sm:min-h-12 sm:text-base',
                  isSelected
                    ? item.sign === -1
                      ? 'bg-card text-expense shadow-sm'
                      : 'bg-card text-income shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                htmlFor={`transaction-sign-${item.sign}`}
              >
                {item.label}
              </label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
