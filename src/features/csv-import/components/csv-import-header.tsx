import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'

export function CsvImportHeader() {
  return (
    <header className="border-b pb-6">
      <Button asChild className="mb-4 -ml-2" variant="ghost">
        <Link to="/app/transactions">
          <ArrowLeft />
          取引一覧へ戻る
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">
        CSV取引インポート
      </h1>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground md:text-base">
        CSVの列を指定し、読み込む取引をその場で確認・編集します。
      </p>
    </header>
  )
}
