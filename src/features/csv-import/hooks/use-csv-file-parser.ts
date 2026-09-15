import { useCallback, useEffect, useRef } from 'react'

import {
  type Encoding,
  inferHeaderRow,
  MAX_COLUMNS,
  MAX_FILE_SIZE,
  MAX_ROWS,
} from '../model/csv-import'
import type { CsvImportDispatch } from '../types'

export function useCsvFileParser(
  dispatch: CsvImportDispatch,
  defaultEncoding: Encoding,
) {
  const workerRef = useRef<Worker | null>(null)
  useEffect(() => () => workerRef.current?.terminate(), [])

  const parseFile = useCallback(
    (file: File, encoding: Encoding = defaultEncoding) => {
      if (!file.name.toLowerCase().endsWith('.csv'))
        return dispatch({
          type: 'patch',
          patch: { error: 'CSVファイルを選択してください。' },
        })
      if (file.size > MAX_FILE_SIZE)
        return dispatch({
          type: 'patch',
          patch: { error: 'ファイルサイズは5MB以下にしてください。' },
        })
      dispatch({
        type: 'patch',
        patch: {
          file,
          error: null,
          importing: true,
          rows: [],
          previewRows: [],
          headerRowIndex: null,
          mapping: { date: null, name: null, amount: null },
        },
      })
      workerRef.current?.terminate()
      const worker = new Worker(
        new URL('../csv-parser.worker.ts', import.meta.url),
        {
          type: 'module',
        },
      )
      workerRef.current = worker
      worker.onmessage = (
        event: MessageEvent<{
          rows?: string[][]
          encoding?: string
          error?: string
        }>,
      ) => {
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        if (event.data.error || !event.data.rows)
          return dispatch({
            type: 'patch',
            patch: {
              importing: false,
              error: event.data.error ?? 'CSVを解析できませんでした。',
            },
          })
        const rows = event.data.rows
        if (Math.max(0, ...rows.map((row) => row.length)) > MAX_COLUMNS)
          return dispatch({
            type: 'patch',
            patch: {
              importing: false,
              error: 'CSVの列数は100列以下にしてください。',
            },
          })
        const headerRowIndex = inferHeaderRow(rows)
        const dataRowCount = rows.filter(
          (_, index) => headerRowIndex === null || index > headerRowIndex,
        ).length
        dispatch({
          type: 'patch',
          patch: {
            importing: false,
            rows,
            parsedEncoding: event.data.encoding ?? null,
            headerRowIndex,
            mapping: { date: null, name: null, amount: null },
            error:
              dataRowCount > MAX_ROWS
                ? 'データ行数は10,000行以下にしてください。'
                : null,
          },
        })
      }
      worker.onerror = (event) => {
        event.preventDefault()
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        dispatch({
          type: 'patch',
          patch: {
            importing: false,
            error:
              'CSV解析用の処理を読み込めませんでした。画面を再読み込みして、もう一度お試しください。',
          },
        })
      }
      worker.onmessageerror = () => {
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        dispatch({
          type: 'patch',
          patch: {
            importing: false,
            error:
              'CSVデータを読み込めませんでした。もう一度ファイルを選択してください。',
          },
        })
      }
      worker.postMessage({ file, encoding })
    },
    [defaultEncoding, dispatch],
  )

  return parseFile
}
