# MoneyHooks React 決定事項

確定済みのフロントエンド判断だけを記録します。未決定事項やバックエンドの実装課題はこの文書で管理しません。

## プロダクト

| 決定 | 理由 |
|---|---|
| 主ナビゲーションはホーム、取引、分析、設定の4画面とする | 主要な利用目的を少数の入口へ整理するため |
| 予算と貯金は明示的な要件追加まで対象外とする | 現行ReactコードとAPI契約に機能が存在しないため |
| 業務画面はvertical sliceで実装する | 空featureや将来用抽象化を先に増やさないため |
| 768px以下はbottom navigation、769px以上はSidebarを使う | モバイルとデスクトップで主要操作への到達性を維持するため |

## 状態と構造

| 決定 | 理由 |
|---|---|
| 依存方向を`app → pages → features → shared`とする | 画面合成、業務機能、共通基盤の責務を分離するため |
| feature同士を直接importせずpageで合成する | featureを独立して変更・テストできるようにするため |
| APIデータはTanStack Queryで管理する | サーバー状態の取得、cache、再取得を一元化するため |
| 再現可能な画面条件はURL Search Paramsで管理する | reload、履歴、URL共有で同じ表示を復元するため |
| 認証状態はFirebaseの`onIdTokenChanged`を正本とする | token更新を含むFirebaseの状態と二重管理しないため |

## APIとデータ

| 決定 | 理由 |
|---|---|
| OpenAPI契約からOrvalでクライアントを生成する | request、response、実装の型ずれを減らすため |
| 生成コードを`src/shared/api/generated/`へ隔離し、直接編集しない | 契約変更時に安全に再生成するため |
| HTTPエラーを共通の`ApiError`へ正規化する | endpointごとの差をUIへ漏らさないため |
| bigint由来のIDをstringとして扱う | JavaScript numberの精度損失を避けるため |
| 金額を日本円の整数、日付をtimezoneなしの文字列として扱う | 表示・入力・API境界で値の意味を安定させるため |

## UI

| 決定 | 理由 |
|---|---|
| すべての色をsemantic color token経由で利用する | light/dark themeと状態表現の意味を一貫させるため |
| 生の色値はtheme token定義だけに置く | コンポーネントごとの色指定とtheme不整合を防ぐため |
| 色だけで状態や収支を区別しない | アクセシビリティと判別性を保つため |
