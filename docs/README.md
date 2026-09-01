# MoneyHooks React ドキュメント

作業内容に関係する文書だけを参照してください。

| 文書 | 内容 |
|---|---|
| [PRODUCT.md](PRODUCT.md) | 対象機能、現在の画面、ドメイン規則、UI方針 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 採用技術、コード構造、状態・認証・API・UIの境界 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | セットアップ、環境変数、開発・検証コマンド |
| [DECISIONS.md](DECISIONS.md) | 確定済みのフロントエンド判断と理由 |
| [GIT_WORKFLOW.md](GIT_WORKFLOW.md) | branch戦略、commit message、PR、release、hotfix |
| [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md) | ファイル責務、行数上限、分割方針 |

APIの機械可読な契約は [`contracts/openapi.yaml`](../contracts/openapi.yaml) にあります。API実装の仕様、運用、DB変更はGo APIリポジトリを正本とします。

文書とコードが食い違う場合は現行コードを確認し、意図的な方針変更であれば該当文書も同じ変更で更新してください。
