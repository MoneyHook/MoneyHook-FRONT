import { Check, LockKeyhole } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'

import { useAuth } from '../auth-context'

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="login-google-mark" viewBox="0 0 24 24">
      <path fill="var(--google-blue)" d="M21.6 12.23c0-.71-.06-1.39-.18-2.03H12v3.84h5.38a4.6 4.6 0 0 1-1.99 3.02v2.49h3.21c1.88-1.73 3-4.28 3-7.32Z" />
      <path fill="var(--google-green)" d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.21-2.49c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.75-5.59-4.11H3.1v2.57A10 10 0 0 0 12 22Z" />
      <path fill="var(--google-yellow)" d="M6.41 13.91A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.91V7.52H3.1A10 10 0 0 0 2 12c0 1.61.39 3.14 1.1 4.48l3.31-2.57Z" />
      <path fill="var(--google-red)" d="M12 5.98c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.9 5.52l3.31 2.57C7.2 7.73 9.4 5.98 12 5.98Z" />
    </svg>
  )
}

export function LoginPanel() {
  const { error, status, signInWithGoogle } = useAuth()
  const isBusy = status === 'initializing'

  const handleGoogleLogin = () => {
    void signInWithGoogle()
  }

  return (
    <div className="login-card motion-auth-enter w-full max-w-lg space-y-7">
      <div className="space-y-4 text-center">
        <p className="login-eyebrow">家計を見渡す場所</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] md:text-[2.65rem] md:leading-tight">
          MoneyHooksへ<span className="login-title-break">ログイン</span>
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
          Googleアカウントでログインして、家計データを確認できます。
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ログインできませんでした</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          className="login-google-button h-14 w-full justify-center rounded-xl text-base font-semibold shadow-sm"
          disabled={isBusy}
          onClick={handleGoogleLogin}
        >
          <GoogleMark />
          {isBusy ? '確認しています…' : 'Googleで続行'}
        </Button>
        <p className="flex items-start justify-center gap-2 px-2 text-center text-xs leading-5 text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>ログインを続けることで、MoneyHooksの<br className="sm:hidden" />認証処理に同意したものとみなされます。</span>
        </p>
      </div>

      <div className="login-trust-row" aria-label="MoneyHooksの特徴">
        <span><Check aria-hidden="true" />かんたんログイン</span>
        <span><Check aria-hidden="true" />家計を見える化</span>
        <span><Check aria-hidden="true" />いつでも利用</span>
      </div>
    </div>
  )
}
