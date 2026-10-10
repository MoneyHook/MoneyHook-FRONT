# 資料索引

必要な文書・節だけ参照する。コードと食い違う場合は現行実装を確認し、方針変更時は該当文書も更新する。

| 確認する内容                             | 文書                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| 機能・画面・データ規則・UI方針           | [PRODUCT.md](PRODUCT.md)                                                           |
| 構造・状態・認証・API境界・テスト方針    | [ARCHITECTURE.md](ARCHITECTURE.md)                                                 |
| 環境設定・最小限の検証・接続エラー       | [DEVELOPMENT.md](DEVELOPMENT.md)                                                   |
| 設計判断の理由                           | [DECISIONS.md](DECISIONS.md)                                                       |
| branch・commit・PR・release              | [GIT_WORKFLOW.md](GIT_WORKFLOW.md)                                                 |
| ファイル責務・行数上限                   | [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md)                                     |
| 家族の所有権・共有・代理入力・退出・招待 | [FAMILY_HOUSEHOLD_DESIGN.md](FAMILY_HOUSEHOLD_DESIGN.md)                           |
| 家族のDB制約・更新境界・互換性・配備状況 | [FAMILY_HOUSEHOLD_IMPLEMENTATION_PLAN.md](FAMILY_HOUSEHOLD_IMPLEMENTATION_PLAN.md) |
| 家族設定画面の情報順・表示状態・操作     | [FAMILY_SETTINGS_UI_SPEC.md](FAMILY_SETTINGS_UI_SPEC.md)                           |
| 過去の画面比較結果・画像                 | [design-qa.md](../design-qa.md)（通常の作業では読まない）                          |

APIのpath/schemaは[`contracts/openapi.yaml`](../contracts/openapi.yaml)、サーバー実装・DB・運用はGo APIリポジトリを正本とする。
