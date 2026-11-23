# 資料索引

必要な文書・節だけ参照する。文書を更新するときは[ドキュメント方針](DEVELOPMENT.md#ドキュメント方針)を確認する。

| 確認する内容                             | 文書                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| 機能・画面・データ規則・UI方針           | [PRODUCT.md](PRODUCT.md)                                                           |
| 構造・状態・認証・API境界・テスト方針    | [ARCHITECTURE.md](ARCHITECTURE.md)                                                 |
| 環境設定・検証・API契約の変更・文書更新   | [DEVELOPMENT.md](DEVELOPMENT.md)                                                   |
| 設計判断の理由                           | [DECISIONS.md](DECISIONS.md)                                                       |
| branch・commit・PR・release              | [GIT_WORKFLOW.md](GIT_WORKFLOW.md)                                                 |
| ファイル責務・行数の目安                 | [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md)                                     |
| 家族の所有権・共有・代理入力・退出・招待 | [FAMILY_HOUSEHOLD_DESIGN.md](FAMILY_HOUSEHOLD_DESIGN.md)                           |
| 家族のDB制約・更新境界・互換性・検証履歴 | [FAMILY_HOUSEHOLD_IMPLEMENTATION_PLAN.md](FAMILY_HOUSEHOLD_IMPLEMENTATION_PLAN.md) |
| 家族設定画面の情報順・表示状態・操作     | [FAMILY_SETTINGS_UI_SPEC.md](FAMILY_SETTINGS_UI_SPEC.md)                           |
| 過去の画面比較結果・画像                 | [design-qa.md](../design-qa.md)（通常の作業では読まない）                          |

HTTP契約は[`contracts/openapi.yaml`](../contracts/openapi.yaml)を参照する。サーバー実装・DB・運用は[Go APIリポジトリ](https://github.com/MoneyHook/MoneyHook-API/tree/development)、家族機能の移行・公開は[Go開発ガイドの「家族機能の移行と公開」](https://github.com/MoneyHook/MoneyHook-API/blob/development/docs/DEVELOPMENT.md)を参照する。
