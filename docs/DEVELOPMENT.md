# MoneyHooks React 開発ガイド

## 必要な環境

- `package.json`の`engines`を満たすNode.js
- `packageManager`に記載されたpnpm
- API連携を確認する場合は、互換性のあるGo API
- 認証E2Eを実行する場合はFirebase Auth Emulator

## セットアップ

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Viteが表示したURLをブラウザで開きます。`.env.local`はGit管理しません。

## 環境変数

設定例と必要なkeyは [`.env.example`](../.env.example) を正本とします。

| 変数 | 用途 |
|---|---|
| `VITE_API_BASE_URL` | Go APIのベースURL |
| `VITE_FIREBASE_API_KEY` | Firebase Web client設定 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | 任意のFirebase Web client設定 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 任意のFirebase Web client設定 |
| `VITE_FIREBASE_AUTH_EMULATOR_URL` | 任意のAuth Emulator URL |

Vite環境変数はブラウザへ配布されます。秘密情報やサーバーcredentialを保存しないでください。Emulator利用時はReactとGo APIのFirebase project IDを一致させます。

`VITE_FIREBASE_AUTH_EMULATOR_URL`を設定すると、GoogleログインはFirebase Auth Emulatorが提供するローカルのモック認証ポップアップを表示します。任意のモックGoogleユーザーでログインするため、API側で事前投入された固定UIDのサンプルデータには依存しません。

## 検証

変更範囲に応じて実行します。

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

- `typecheck`: TypeScript project referencesの型検査
- `lint`: ESLintとsemantic color check
- `test`: Vitestの単体・コンポーネントテスト
- `build`: TypeScript buildとVite production build
- `e2e`: Playwrightによるブラウザテスト

`pnpm e2e`はFirebase Auth Emulatorと実Go APIを前提とします。Playwright設定では開発ユーザー用のmock credentialを有効にし、Authユーザーを削除せず、固定UIDとサンプルデータがAPI経由で利用できることを検証します。外部サービスの起動方法とデータ準備は、それぞれの所有リポジトリを参照してください。

## APIクライアント

OpenAPI契約を変更した場合、生成コードと契約を確認します。

```bash
pnpm api:generate
pnpm contract:test
pnpm api:check
```

`pnpm api:generate`は`src/shared/api/generated/`を更新します。生成物を手作業で編集しないでください。

## よくある確認箇所

| 症状 | 確認箇所 |
|---|---|
| 起動時に環境設定エラーになる | `.env.local`の必須keyとURL形式 |
| Googleログインが失敗する | 通常環境はFirebase provider、Authorized domains、Web client設定。Emulator開発時は`VITE_FIREBASE_AUTH_EMULATOR_URL`とAuth Emulatorの起動を確認 |
| ログイン後にAPIへ接続できない | API URL、APIのCORS設定、Firebase project ID |
| Emulatorではなく本番認証へ接続する | `VITE_FIREBASE_AUTH_EMULATOR_URL` |
| semantic color checkが失敗する | 生の色値をtokenへ移し、light/dark両方を定義したか |
