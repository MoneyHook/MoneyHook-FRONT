import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'

export function CsvImportComplete({
  importedCount,
  onRestart,
}: {
  importedCount: number
  onRestart: () => void
}) {
  return (
    <main className="motion-route-enter mx-auto w-full max-w-3xl px-5 pt-8 pb-24 md:px-10 md:pt-12">
      <div className="mx-auto max-w-md py-16 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h1 className="mt-5 text-2xl font-semibold">
          インポートが完了しました
        </h1>
        <p className="mt-2 text-muted-foreground">
          {importedCount}件の取引を追加しました。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/app/transactions">取引一覧を見る</Link>
          </Button>
          <Button onClick={onRestart}>別のCSVをインポート</Button>
        </div>
      </div>
    </main>
  )
}
