# MoneyHooks React Agent Guide

このファイルはリポジトリ全体に適用します。

## 作業方針

- 依頼内容と変更対象を確認し、関連する既存コードを読んでから作業する。
- `docs/` を一括で読まない。判断に必要な資料だけを参照し、参照先が不明な場合は [README.md](README.md) または [docs/README.md](docs/README.md) から探す。
- 不明点は、コード、設定、契約、関連資料から確認できる範囲を調査してから質問する。
- ユーザーが指定していない機能追加、広範なリファクタリング、別リポジトリの変更を行わない。
- 既存の構成、命名、実装パターンを優先し、必要性が確認できない共通化や将来向けの抽象化を追加しない。
- 変更範囲に応じて型検査、lint、テスト、buildを実行し、未実行または失敗した確認項目を報告する。
- ユーザーから明示的に依頼されない限り、branch作成、commit、push、PR作成、tag操作を行わない。

## 資料マップ

すべてを事前に読まず、作業中に詳細情報が必要になった場合だけ該当資料を参照してください。

| 確認したい内容 | 参照先 |
|---|---|
| 対象機能、画面、スコープ外、金額・日付・ID、UI方針 | [docs/PRODUCT.md](docs/PRODUCT.md) |
| 採用技術、コード配置、依存方向、状態管理、認証・API・UIの境界 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| ローカル環境、環境変数、検証コマンド、トラブルシューティング | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| 確定済みのフロントエンド判断と理由 | [docs/DECISIONS.md](docs/DECISIONS.md) |
| branch戦略、commit message、PR、release、hotfix | [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) |

資料の概要から探す場合は [docs/README.md](docs/README.md) を参照してください。APIのpathやschemaを確認する場合は、必要な箇所だけ [`contracts/openapi.yaml`](contracts/openapi.yaml) を参照してください。

## 関連リポジトリ

Go APIの実装は `/Users/yusukematsumoto/source/moneyHook_api` で参照できます。このリポジトリの作業として変更するのは、ユーザーが明示的に対象へ含めた場合だけにしてください。
