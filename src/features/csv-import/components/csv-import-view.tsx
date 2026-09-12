import { AlertCircle } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

import { useCsvImportController } from '../hooks/use-csv-import-controller'
import { CsvImportComplete } from './csv-import-complete'
import { CsvImportHeader } from './csv-import-header'
import { CsvImportMappingPanel } from './csv-import-mapping-panel'
import { CsvImportSetup } from './csv-import-setup'
import { ImportPreviewSection } from './import-preview/import-preview-section'
import { RawCsvPreview } from './raw-csv-preview'

export function CsvImportView({
  onImported,
}: {
  onImported: () => Promise<void>
}) {
  const controller = useCsvImportController(onImported)
  const { state } = controller

  if (state.step === 'complete')
    return (
      <CsvImportComplete
        importedCount={state.importedCount}
        onRestart={controller.restart}
      />
    )

  return (
    <main className="motion-route-enter mx-auto w-full max-w-6xl px-5 pt-8 pb-24 md:px-10 md:pt-12">
      <CsvImportHeader />
      {state.error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>CSVを処理できませんでした</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <section className="grid gap-5 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CsvImportSetup
          file={state.file}
          importing={state.importing}
          onParseFile={controller.parseFile}
          onSignChange={controller.changeSign}
          sign={state.defaults.sign}
        />
        {state.rows.length ? (
          <CsvImportMappingPanel
            dateFormat={state.dateFormat}
            encoding={state.encoding}
            file={state.file}
            headerRowIndex={state.headerRowIndex}
            headers={controller.headers}
            mapping={state.mapping}
            onDateFormatChange={controller.changeDateFormat}
            onEncodingChange={controller.changeEncoding}
            onHeaderRowChange={controller.changeHeaderRow}
            onMappingChange={controller.changeMapping}
            parsedEncoding={state.parsedEncoding}
            rows={state.rows}
          />
        ) : null}
      </section>
      {state.rows.length ? (
        <section className="grid gap-3 border-t py-8">
          <div>
            <h2 className="text-lg font-semibold">CSVプレビュー</h2>
            <p className="text-sm text-muted-foreground">
              選択した列を強調表示しています。
            </p>
          </div>
          <RawCsvPreview
            headerRowIndex={state.headerRowIndex}
            headers={controller.headers}
            mapping={state.mapping}
            rows={state.rows}
          />
        </section>
      ) : null}
      {state.rows.length && controller.canPreview ? (
        <ImportPreviewSection
          categories={controller.categories}
          dispatch={controller.dispatch}
          duplicateCandidates={controller.duplicateCandidates}
          duplicateCount={controller.duplicateCount}
          errors={controller.errors}
          failedDuplicateCheckMonths={controller.failedDuplicateCheckMonths}
          filter={controller.filter}
          filteredRows={controller.filteredRows}
          importing={state.importing}
          isCheckingDuplicates={controller.isCheckingDuplicates}
          onFilterChange={controller.setFilter}
          onSubmit={controller.submit}
          payments={controller.payments}
          previewRows={state.previewRows}
          selected={controller.selected}
          selectedErrors={controller.selectedErrors}
        />
      ) : null}
      {state.rows.length && !controller.canPreview ? (
        <p className="border-t py-6 text-sm text-muted-foreground">
          取引種別と日付・取引名・金額の列をすべて指定すると、インポート内容を表示します。
        </p>
      ) : null}
      <AlertDialog
        onOpenChange={(open) => !open && controller.blocker.reset?.()}
        open={controller.blocker.state === 'blocked'}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>インポート作業を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              読み込んだCSVと編集内容は保存されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={() => controller.blocker.proceed?.()}>
              破棄して離れる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
