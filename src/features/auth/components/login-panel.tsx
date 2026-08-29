import { LogIn } from 'lucide-react'

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
    <div className="motion-auth-enter w-full max-w-md space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-primary">家計を見渡す場所</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          MoneyHooksへログイン
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Googleアカウントでログインして、家計データへ安全にアクセスします。
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ログインできませんでした</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center"
          disabled={isBusy}
          onClick={handleGoogleLogin}
        >
          <LogIn aria-hidden="true" data-icon="inline-start" />
          {isBusy ? '確認しています…' : 'Googleで続行'}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          ログインを続けることで、MoneyHooksの認証処理に同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}
