import { FileUp, LoaderCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/components/ui/card'
import type { ImportSign } from '../model/csv-import'

export function CsvImportSetup({
  file,
  importing,
  onParseFile,
  onSignChange,
  sign,
}: {
  file: File | null
  importing: boolean
  onParseFile: (file: File) => void
  onSignChange: (sign: ImportSign) => void
  sign: ImportSign | undefined
}) {
  return (
    <div className="grid gap-5 self-start">
      <Card className="grid gap-4 p-5">
        <div
          aria-label="取引種別"
          className="grid grid-cols-2 rounded-2xl bg-muted p-0.5 sm:p-1.5"
          role="tablist"
        >
          {[
            { sign: 'expense' as const, label: '支出' },
            { sign: 'income' as const, label: '収入' },
          ].map((item) => {
            const isSelected = sign === item.sign
            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'min-h-10 rounded-xl px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-12 sm:px-4 sm:text-base',
                  isSelected
                    ? item.sign === 'expense'
                      ? 'bg-card text-expense shadow-sm'
                      : 'bg-card text-income shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={item.sign}
                onClick={() => onSignChange(item.sign)}
                role="tab"
                type="button"
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </Card>
      <label
        className="grid min-h-36 cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-muted/20 p-5 text-center transition-colors hover:bg-muted/45"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const droppedFile = event.dataTransfer.files[0]
          if (droppedFile && !importing) onParseFile(droppedFile)
        }}
      >
        <input
          accept=".csv,text/csv"
          className="sr-only"
          disabled={importing}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0]
            if (selectedFile) onParseFile(selectedFile)
          }}
          type="file"
        />
        <span>
          <FileUp className="mx-auto size-7 text-muted-foreground" />
          <span className="mt-2 block font-medium">
            {file ? '別のCSVを選択' : 'CSVをドラッグ&ドロップ'}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            またはファイルを選択（5MBまで）
          </span>
        </span>
      </label>
      {importing ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          CSVを解析しています...
        </p>
      ) : null}
    </div>
  )
}
