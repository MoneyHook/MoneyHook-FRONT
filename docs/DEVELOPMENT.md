# 開発ガイド

## 環境設定

起動手順は[README](../README.md#起動)、必要な環境変数とデモ値は[`.env.example`](../.env.example)を参照する。`.env.local`はGit管理しない。Vite環境変数はブラウザへ配布されるため秘密情報を入れない。

### ローカルサービス

ローカル認証・API連携では以下を揃える。APIとEmulatorの起動は[Go APIのREADME](https://github.com/MoneyHook/MoneyHook-API/blob/development/README.md)を参照する。

- APIとAuth EmulatorのURLは[`.env.example`](../.env.example)と[GoのCompose設定](https://github.com/MoneyHook/MoneyHook-API/blob/development/compose.yaml)を照合する。React・Go API・Emulatorのproject IDを揃える。
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
| OpenAPI・生成クライアント    | [API契約の変更](#api契約の変更)に従い、生成差分と関係する契約・動作を確認          |
| ブラウザ固有の認証/API結合   | [E2Eの実行環境](#e2eの実行環境)で必要なPlaywrightファイル・ケースだけ実行          |

対象テストの例:

```bash
pnpm exec vitest run src/features/transactions/model/new-transaction.test.ts
pnpm exec vitest run src/shared/api/__tests__/http-client.test.ts -t '対象ケース名'
pnpm exec playwright test e2e/auth-shell.spec.ts -g '対象ケース名'
```

パス・ケース名は実在する対象に置き換え、出力の対象と件数で絞り込みを確認する。関連テストがなければその旨を報告し、無関係なテストで代用しない。[テスト方針](ARCHITECTURE.md#テスト)に従い、UIの表示・操作は必要箇所を手動確認する。

`pnpm test`・`pnpm lint`・`pnpm e2e`などの全体実行は、ユーザーの明示依頼、required checks、または全体への影響を具体的に確認した場合だけ行い、拡大理由を報告する。対象の検証が通れば、追加変更や未解決の懸念がない限り再実行・拡大しない。完了時は実行結果と、必要だが未実行・失敗した確認を簡潔に報告する。

### E2Eの実行環境

Docker Compose、PlaywrightのChromium、隣接する `../moneyHook_api` のチェックアウトが必要。[Playwright設定](../playwright.config.ts)がGo API・PostgreSQL・Auth Emulatorのコンテナを再作成する。E2EではAPIの事前起動は不要。Composeの通常のシード処理により固定開発ユーザーのサンプルデータが再生成される。

[現行の認証E2E](../e2e/auth-shell.spec.ts)はEmulatorのGoogleログイン前後で実APIの401・200を確認し、ログアウトまで検証する。

## API契約の変更

1. 利用クライアントへの影響を確認する。path・method・パラメータ・JSON・status code・認証要件を変更する場合は、旧クライアントとの互換性と公開順を決める。
2. 依頼範囲内でGo実装と[`contracts/openapi.yaml`](../contracts/openapi.yaml)を同じ変更単位で更新する。`pnpm api:generate`を実行する。生成先の差分と、`git status --short -- src/shared/api/generated`で新規ファイルを確認する。生成物は手編集しない。
3. `pnpm contract:test`と影響するReactのテストを実行する。Goも変更する場合は[Go開発ガイドの「検証」](https://github.com/MoneyHook/MoneyHook-API/blob/development/docs/DEVELOPMENT.md)から対象テストを選ぶ。生成物の一致確認には、生成先に未ステージ差分・未追跡ファイルがない状態で`pnpm api:check`を使う。このコマンドは再生成とインデックスとの差分確認を行う。実行後の新規ファイルは生成先の`git status`で確認する。
4. PRを作成する場合は関連PRを相互に参照し、互換性と公開順を記載する。DB変更を伴う場合は、Go側の移行手順に従い、migration → API → Reactの順で確認して公開する。

## よくある確認箇所

| 症状                     | 確認箇所                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| 起動時に設定エラー       | `.env.local`の必須key・URL形式                                            |
| Googleログイン失敗       | Firebase provider・Authorized domains・Web設定。Emulator時はURLと起動状態 |
| API接続失敗              | API URL・CORS・project ID                                                 |
| 本番認証へ接続してしまう | `VITE_FIREBASE_AUTH_EMULATOR_URL`                                         |
| semantic color check失敗 | 生の色値をtokenへ移し、light/dark両方に定義                               |

## ドキュメント方針

- 仕様・規約・実行手順は項目ごとに正本を一箇所に置く。[資料索引](README.md)と各入口から該当節へリンクする。ブランチ名、コマンド、設定値などはGitの参照・workflow・設定・スクリプトを参照し、手順に必要な値だけ記載する。
- UIの挙動、テスト、lint、API契約、起動・配備の設定を変更したら、関連する文書・スキルを検索し、現行のコード・設定と照合する。古い手順や重複した説明は同じ変更で更新する。文書だけを直す場合も、該当する実装・設定とリンク先を確認する。
- 実装・検証・配備の履歴には確認時点を記し、現在の手順は担当リポジトリの文書へ案内する。別リポジトリで更新が必要な箇所が依頼範囲外なら、完了報告に記載する。
