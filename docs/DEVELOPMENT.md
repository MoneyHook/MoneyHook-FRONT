# 開発ガイド

## 環境設定

起動手順は[README](../README.md#起動)、必要な環境変数とデモ値は[`.env.example`](../.env.example)を参照する。`.env.local`はGit管理しない。Vite環境変数はブラウザへ配布されるため秘密情報を入れない。

ローカル認証・API連携では以下を揃える。サービスの起動方法は各所有リポジトリを参照する。

- Go API: `http://localhost:8080`、Auth Emulator: `http://localhost:9099`。
- React・Go API・Emulatorのproject ID: `demo-moneyhooks`。
- Go APIのCORS許可origin: Viteが表示したorigin。
- `VITE_FIREBASE_AUTH_EMULATOR_URL`を設定するとモックGoogle認証ポップアップを使う。任意のモックユーザーでログインでき、固定UIDのサンプルデータは不要。

## 検証

変更に必要な最小範囲だけ実行する。下表は選択肢であり、毎回全項目を実行する手順ではない。

| 変更                         | 検証                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------- |
| 文書のみ                     | `git diff --check`と変更したリンク・記述の確認。テスト・型検査・lint・buildは不要 |
| テストのみ                   | 追加・変更したテストファイルを指定して実行                                        |
| ロジック・API・永続化        | 追加・変更したテストと、変更した契約に直接関係する既存テストだけ実行              |
| TypeScript・React            | 型への影響があれば`pnpm typecheck`。lintは`pnpm exec eslint <変更ファイル...>`    |
| 色・class・style             | 対象ファイルのESLintと`node scripts/check-semantic-colors.mjs`                    |
| routing・build設定・依存関係 | 必要なら`pnpm build`（型検査を含むため`typecheck`を重ねない）                     |
| OpenAPI・生成クライアント    | `pnpm api:check`、契約への影響があれば`pnpm contract:test`、関連テスト            |
| ブラウザ固有の認証/API結合   | 必要なPlaywrightファイル・ケースだけ指定。実Go APIとAuth Emulatorが必要           |

対象テストの例:

```bash
pnpm exec vitest run src/features/transactions/model/new-transaction.test.ts
pnpm exec vitest run src/shared/api/__tests__/http-client.test.ts -t '対象ケース名'
pnpm exec playwright test e2e/auth-shell.spec.ts -g '対象ケース名'
```

パス・ケース名は実在する対象に置き換え、出力の対象と件数で絞り込みを確認する。関連テストがなければその旨を報告し、無関係なテストで代用しない。[テスト方針](ARCHITECTURE.md#テスト)に従い、UIの表示・操作は必要箇所を手動確認する。

`pnpm test`・`pnpm lint`・`pnpm e2e`などの全体実行は、ユーザーの明示依頼、required checks、または全体への影響を具体的に確認した場合だけ行い、拡大理由を報告する。対象の検証が通れば、追加変更や未解決の懸念がない限り再実行・拡大しない。完了時は実行結果と、必要だが未実行・失敗した確認を簡潔に報告する。

Playwright設定は開発ユーザー用mock credentialを有効にし、Authユーザーを削除せず固定UIDのAPIサンプルデータを検証する。通常ログインとはデータ準備条件が異なる。

## APIクライアント

`pnpm api:generate`はOrval生成、未使用schema import除去、生成物のformatを行う。生成物は直接編集しない。`pnpm api:check`は再生成とGit差分確認を含むため、事前に同じ生成処理を重ねない。`pnpm contract:test`はOpenAPI契約のRubyテスト。

## よくある確認箇所

| 症状                     | 確認箇所                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| 起動時に設定エラー       | `.env.local`の必須key・URL形式                                            |
| Googleログイン失敗       | Firebase provider・Authorized domains・Web設定。Emulator時はURLと起動状態 |
| API接続失敗              | API URL・CORS・project ID                                                 |
| 本番認証へ接続してしまう | `VITE_FIREBASE_AUTH_EMULATOR_URL`                                         |
| semantic color check失敗 | 生の色値をtokenへ移し、light/dark両方に定義                               |
