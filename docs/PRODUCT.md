# プロダクト

Go APIを利用する家計管理SPA。画面の正確なrouteは[`src/app/router/router.tsx`](../src/app/router/router.tsx)を参照する。

## 機能と画面

- 個人用のホーム・取引・分析・設定が主ナビゲーション。月次収支、取引CRUD・カレンダー・絞り込み・CSV、カテゴリ/固定費/支払方法の分析を扱う。
- 設定はアカウント、予算、カテゴリ・サブカテゴリ、支払方法、定期収支、外観。
- 家族用は専用ルートで共有記録・代理入力・一覧・分析を扱う。詳細は[家族仕様](FAMILY_HOUSEHOLD_DESIGN.md)。
- Googleログイン、認証ガード、レスポンシブAppShell、light/dark themeを使う。
- 貯金と家族用予算・定期収支・CSVは対象外。将来用のrouteや空featureは追加しない。

## データ規則

- 金額は整数円。APIのsigned amountと入力の絶対額・収支区分を境界で明示的に変換する。
- bigint由来のIDはstringを維持し、numberへ変換しない。
- 日付は`YYYY-MM-DD`、対象月は`YYYY-MM-01`（タイムゾーンなし）。
- 再現可能な画面条件はURL Search Params。画面内だけの集計タブなどの例外は[状態の所有者](ARCHITECTURE.md#状態の所有者)を参照する。
- 月をまたぐ取引変更は旧月・新月の表示を更新する。

## UI方針

- neutral中心の低彩度、余白、文字階層、subtle borderで整理する。gradient・強いshadow・glass・装飾cardを多用しない。
- 主要操作と選択状態を明確にし、focus・hover・disabled・error・収支を色だけで区別しない。
- light/darkで同じ意味のsemantic color tokenを使う。
- 768px以下はbottom navigation、769px以上はSidebar。主要操作へ両方から到達可能にする。
