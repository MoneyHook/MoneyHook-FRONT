# MoneyHooks React

Go APIを利用する家計管理SPA。個人の取引・分析・設定と家族の共有記録を扱います。

## 起動

Node.jsとpnpmのバージョンは[`package.json`](package.json)に従います。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Viteが表示したURLを開きます。ログイン画面は単独で表示でき、認証・API連携にはGo API（`localhost:8080`）とFirebase Auth Emulator（`localhost:9099`）が必要です。

環境設定・トラブルシューティングは[開発ガイド](docs/DEVELOPMENT.md)、資料の入口は[docs/README.md](docs/README.md)、エージェント向け指示は[AGENTS.md](AGENTS.md)を参照してください。

検証は[変更に必要な最小範囲](docs/DEVELOPMENT.md#検証)だけ実行します。テストは追加・変更したファイルと影響する既存テストに絞ります。
