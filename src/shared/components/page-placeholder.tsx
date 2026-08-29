import type { LucideIcon } from 'lucide-react'

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <section
      aria-labelledby="page-title"
      className="motion-route-enter mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12"
    >
      <header className="flex items-start gap-4 border-b pb-8">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-1.5">
          <h1
            id="page-title"
            className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
          >
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </header>

      <div className="py-12">
        <p className="text-sm font-medium text-muted-foreground">
          この領域は共通基盤の確認用です。業務機能は次のフェーズで追加します。
        </p>
      </div>
    </section>
  )
}
