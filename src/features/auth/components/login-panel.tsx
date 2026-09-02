import { Check, LockKeyhole } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'

import { useAuth } from '../auth-context'

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
          Googleアカウントでログインして、家計データへ安全にアクセスします。
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
          <span className="login-google-mark" aria-hidden="true">G</span>
          {isBusy ? '確認しています…' : 'Googleで続行'}
        </Button>
        <p className="flex items-start justify-center gap-2 px-2 text-center text-xs leading-5 text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>ログインを続けることで、MoneyHooksの<br className="sm:hidden" />認証処理に同意したものとみなされます。</span>
        </p>
      </div>

      <div className="login-trust-row" aria-label="ログインの安全性">
        <span><Check aria-hidden="true" />安全な認証</span>
        <span><Check aria-hidden="true" />データ保護</span>
        <span><Check aria-hidden="true" />いつでも利用</span>
      </div>
    </div>
  )
}
