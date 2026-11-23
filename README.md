# MoneyHooks React

Go APIを利用する家計管理SPA。個人の取引・分析・設定と家族の共有記録を扱います。

## 起動

Node.jsとpnpmのバージョンは[`package.json`](package.json)に従います。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Viteが表示したURLを開くとログイン画面を確認できます。認証やAPI連携を試す場合は、[ローカルサービス](docs/DEVELOPMENT.md#ローカルサービス)も起動します。

[検証手順](docs/DEVELOPMENT.md#検証)と[接続エラーの確認箇所](docs/DEVELOPMENT.md#よくある確認箇所)は開発ガイド、その他の資料は[資料索引](docs/README.md)、エージェント向け指示は[AGENTS.md](AGENTS.md)を参照してください。
