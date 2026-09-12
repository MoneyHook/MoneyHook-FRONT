import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { cn } from '@/shared/lib/utils'

import { displayColumnName, type Mapping } from '../model/csv-import'

export function RawCsvPreview({
  headers,
  headerRowIndex,
  mapping,
  rows,
}: {
  headers: string[]
  headerRowIndex: number | null
  mapping: Mapping
  rows: string[][]
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const dataRows = useMemo(
    () => (headerRowIndex === null ? rows : rows.slice(headerRowIndex + 1)),
    [headerRowIndex, rows],
  )
  const highlightedColumns = new Set(
    [mapping.date, mapping.name, mapping.amount].filter(
      (index): index is number => index !== null,
    ),
  )
  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(headers.length, 1)}, minmax(10rem, 1fr))`,
  }
  const virtualizer = useVirtualizer({
    count: dataRows.length,
    estimateSize: () => 36,
    getScrollElement: () => parentRef.current,
    overscan: 8,
  })

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div ref={parentRef} className="max-h-72 overflow-auto">
        <div className="min-w-max">
          <div
            className="sticky top-0 z-10 grid border-b bg-muted/95 text-xs font-semibold text-muted-foreground backdrop-blur"
            style={gridStyle}
          >
            {headers.map((_, index) => (
              <span
                className={cn(
                  'border-r px-3 py-2 last:border-r-0',
                  highlightedColumns.has(index) &&
                    'bg-primary/12 text-foreground',
                )}
                key={index}
              >
                {displayColumnName(headers, index)}
              </span>
            ))}
          </div>
          <div
            className="relative"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = dataRows[virtualRow.index]
              return (
                <div
                  className="absolute top-0 left-0 grid w-full border-b text-sm"
                  data-index={virtualRow.index}
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  style={{
                    ...gridStyle,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {headers.map((_, index) => (
                    <span
                      className={cn(
                        'truncate border-r px-3 py-2 last:border-r-0',
                        highlightedColumns.has(index) && 'bg-primary/8',
                      )}
                      key={index}
                    >
                      {row[index] || '—'}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
