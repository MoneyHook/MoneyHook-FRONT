# MoneyHooks React

MoneyHooksのReact SPAです。現在はGoogleログイン、認証ガード、レスポンシブなAppShell、APIクライアント基盤まで実装されています。

## ローカルで起動する

### 1. 必要な環境

- `package.json`の`engines`を満たすNode.js
- `packageManager`に記載されたpnpm

ログインとAPI連携まで確認する場合は、次のサービスも必要です。

- Go API: `http://localhost:8080`
- Firebase Auth Emulator: `http://localhost:9099`

APIとEmulatorを起動していなくてもログイン画面までは表示できます。各サービスの起動方法は、それぞれの所有リポジトリを参照してください。

### 2. 依存パッケージをインストールする

```bash
pnpm install
```

### 3. 環境変数を用意する

```bash
cp .env.example .env.local
```

`.env.example`はローカルのEmulator構成に合わせたデモ値です。`.env.local`はGit管理されません。

主な設定:

| 変数 | ローカルでの用途 |
|---|---|
| `VITE_API_BASE_URL` | Go APIのベースURL |
| `VITE_FIREBASE_PROJECT_ID` | ReactとGo APIで共有するFirebase project ID |
| `VITE_FIREBASE_AUTH_EMULATOR_URL` | Firebase Auth EmulatorのURL |

Firebase Web client設定を含む全項目は [`.env.example`](.env.example) を確認してください。Vite環境変数はブラウザへ配布されるため、秘密情報やサーバーcredentialを保存しないでください。

### 4. 開発サーバーを起動する

```bash
pnpm dev
```

Viteがターミナルに表示したURLをブラウザで開きます。停止する場合は、起動したターミナルで `Ctrl+C` を押します。

### 5. ログインとAPI連携を確認する

ローカルの認証を利用する場合は、次を揃えてください。

- React、Firebase Auth Emulator、Go APIのproject IDを`demo-moneyhooks`にする
- Go APIのCORS許可originを、Viteが表示したoriginに合わせる
- Go APIとFirebase Auth Emulatorを起動してからGoogleログインを実行する

接続できない場合は [開発ガイドの確認項目](docs/DEVELOPMENT.md#よくある確認箇所) を参照してください。

## よく使うコマンド

| コマンド | 用途 |
|---|---|
| `pnpm dev` | 開発サーバーを起動 |
| `pnpm typecheck` | TypeScriptの型検査 |
| `pnpm lint` | ESLintとsemantic color check |
| `pnpm test` | Vitestを実行 |
| `pnpm build` | production buildを作成 |
| `pnpm e2e` | Playwright E2Eを実行 |
| `pnpm api:generate` | OpenAPIからAPIクライアントを生成 |
| `pnpm contract:test` | OpenAPI契約テストを実行 |

`pnpm e2e`はFirebase Auth Emulatorと実Go APIを前提とします。検証条件とAPIクライアントの扱いは [DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照してください。

## ドキュメント

- [プロダクト](docs/PRODUCT.md): 対象機能、画面、データ規則、UI方針
- [アーキテクチャ](docs/ARCHITECTURE.md): 採用技術、コード構造、状態・認証・API・UIの境界
- [開発ガイド](docs/DEVELOPMENT.md): 環境変数、検証、トラブルシューティング
- [決定事項](docs/DECISIONS.md): 確定済みのフロントエンド判断と理由
- [Git workflow](docs/GIT_WORKFLOW.md): branch、commit、PR、releaseの運用ルール

資料全体の入口は [docs/README.md](docs/README.md)、開発エージェント向けの方針は [AGENTS.md](AGENTS.md) です。
