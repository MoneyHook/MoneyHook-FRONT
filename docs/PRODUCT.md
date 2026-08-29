# MoneyHooks React プロダクト

## 現在の状態

MoneyHooks Reactは、既存のGo APIを利用する家計管理SPAです。Googleログイン、認証ガード、テーマ切替、レスポンシブなAppShell、API通信基盤まで実装されています。業務画面は現在プレースホルダーです。

## 現在の画面

| URL | 役割 | 状態 |
|---|---|---|
| `/login` | Googleログイン | 実装済み |
| `/app/home` | 月次サマリーの入口 | AppShellとプレースホルダー |
| `/app/transactions` | 取引管理の入口 | AppShellとプレースホルダー |
| `/app/analysis` | 分析の入口 | AppShellとプレースホルダー |
| `/app/settings` | 設定の入口 | AppShellとプレースホルダー |

業務機能の詳細routeは、該当機能を実装する変更で追加します。将来用のrouteや空featureを先に作りません。

## 対象機能

今後のvertical sliceで次を扱います。

- 月次の収支サマリー
- 取引の一覧、登録、編集、削除
- 取引のカレンダー表示と絞り込み
- 変動費、固定費、収入、支払方法別の分析
- 定期収支
- カテゴリ、サブカテゴリ、支払元
- 端末内に保存する表示・入力設定

予算と貯金は現行のReactコードとAPI契約に存在しないため対象外です。新機能として明示された場合に、要件とAPIを含めて別途設計します。

## フロントエンドのデータ規則

- 金額は日本円の整数として扱う。API上のsigned amountと、入力画面の絶対額・収支区分の変換を明示する。
- DBのbigintに由来するIDはJavaScriptのnumberへ変換せずstringを維持する。
- 日付はタイムゾーンを持たない`YYYY-MM-DD`、対象月は`YYYY-MM-01`として扱う。
- 対象月、表示形式、並び順、検索条件など再現可能な画面状態はURL Search Paramsを正本とする。
- 取引日を別月へ変更した場合、旧月と新月の両方に属する表示データを更新対象とする。

## UI方針

- neutral中心の低彩度パレット、十分な余白、明確な文字階層で情報へ集中できる画面にする。
- surfaceは強い塗り分けより余白とsubtle borderで整理し、gradient、強いshadow、glass effect、装飾的なcardを多用しない。
- 通常状態は静かに保ち、主要操作と選択状態だけを明確にする。
- light/dark themeで同じsemantic color tokenが同じ意味を持つようにする。
- focus、hover、selected、disabled、error、収入・支出を色だけに依存せず、形、文言、iconでも区別する。
- 768px以下はbottom navigation、769px以上はSidebarを使う。主要な操作は両方のレイアウトで到達可能にする。
