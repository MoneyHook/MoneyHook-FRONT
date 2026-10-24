# Design QA — 過去の確認記録

以下は当時の画面比較結果。現在の挙動や今後のテスト実行指示ではない。UIテスト追加/検証範囲は[現行方針](docs/DEVELOPMENT.md#検証)に従う。一時画像のパスは証跡記録で、保存されているとは限らない。

## 分析画面の共通条件

実Go APIとAuth Emulatorの開発ユーザーで、2026年8月までの固定6か月を確認。基準画像は約2倍密度の生成モック、実装は426px幅を基準に縦スクロールで可読性を保持した。端末status bar/home indicatorは省き既存AppShellのナビを使う。1440×900のデスクトップも確認し、カテゴリ/固定費/支払方法はdarkも確認した。

Geist/日本語fallback、tabular numerals、余白・境界・chart/icon・文言を比較。semantic token、Recharts、Lucideを使い、実API値を優先。分析accentと保存済みナビaccentは分離。各画面の最終記録はpassed、P0/P1/P2残件・console errorなし。

画像名は`images/analytics/`配下。詳細は下の証跡一覧で探す。

## Overview

- URL: `/app/analysis?view=overview`。source 853×1844→426×921、mobile viewport 426×922/full 426×1461、desktop full 1440×1699。
- 順序: tabs→期間→収支summary→月次trend→カテゴリ/固定費→期間比較→highlight。固定期間・tooltipは製品判断を優先。
- 修正: 426pxの凡例/金額overflow（P1）と縦密度（P2）を改善。chart/paddingを調整し、400pxから比較/highlightを2列にした。最終document幅426px。
- 当時確認: login、4tab・準備状態、reloadのURL復元、概要へ復帰。残りtabの実装は当時P3の後続事項。
- source: `ChatGPT Image 2026年8月28日 22_44_49.png`。
- captures: `implementation-analysis-mobile.png`、`implementation-analysis-mobile-viewport.png`、`implementation-analysis-desktop.png`。

## Categories

- URL: `/app/analysis?view=categories&category=1`。amount mode、食費選択。source 852×1846→426×923、mobile full 426×1586、desktop full 1440×1850、dark 1440×900。
- 順序: summary→選択内訳→trend→取引。実データの食費subcategoryが1項目なので100%の1segmentを表示し、mockの4分割は作らない。
- 修正: 長い名前/最終月ラベル切れと強い青の選択行（P2）を、列幅・折返し・chart余白・subtle greenで改善。overflowなし、darkはanimation完了後に確認。
- 当時確認: 上位/全件、category選択、amount/ratio、月/週、URL/reload、最新3取引。未実装のfilter/全取引はdisabled。認証E2E 4件成功。
- P3: rank依存のカテゴリ色/iconを、将来の全体metadata契約で固定する案。
- source: `ChatGPT Image 2026年8月28日 22_44_54.png`。
- captures: `implementation-analysis-categories-mobile.png`、`implementation-analysis-categories-desktop.png`、`implementation-analysis-categories-dark.png`。

## Fixed Costs

- URL: `/app/analysis?view=fixed`、全カテゴリ/amount mode。source: `ChatGPT Image 2026年8月28日 22_45_00.png`。
- 426×923、1024×900、769pxのSidebar開閉、1440×900/darkを確認。documentはviewport幅を維持し、832pxのtableだけ横scroll（mobile表示392px、1024時654px）。769px本文は513→約648px。
- summary/donut/trend/table/取引の階層を維持。button/linkは40px以上、mobile controlは44px以上。
- 当時確認: amount/ratioのURL/reload、不正カテゴリ補正、最後のカテゴリを除外不可、全選択でcanonical URL。1カテゴリ解除でtable 4→3行、取引24→18件、全体summaryは維持。初期5取引↔全24件。認証E2E 5件成功。

## Payment Methods

- URL: `/app/analysis?view=payments`、全method閉。source 853×1844→426×922、mobile viewport 426×923/full 426×1251、1024/1440 full高さ1542、dark 1543。
- 順序: period→donut/凡例/detail CTA→月次trend→method詳細。実データはmockの6種に対し3種。汎用type iconを使いbrand logoは導入しない。
- 6か月bucket、method別line・tooltip・折返し凡例、金額/ratio/count/平均を比較。1024pxの4tabsは各176px、overflowなし。修正iteration不要。
- 当時確認: `payment=<id>`で最新5→全42件→閉、`#payment-details`へscroll、不正parameter補正、loading/empty/error/retry。認証E2E 5件成功。
- P3: rank依存のicon/colorを全体metadata契約で固定する案。
- source: `ChatGPT Image 2026年8月28日 22_45_02.png`。
- captures: `implementation-analysis-payments-mobile.png`、`implementation-analysis-payments-mobile-viewport.png`、`implementation-analysis-payments-1024.png`、`implementation-analysis-payments-desktop.png`、`implementation-analysis-payments-dark.png`。

## Login

- source: `/tmp/codex-remote-attachments/01a05d08-9523-7002-9c6a-5b7321cf0542/375F854A-9BBE-49CF-AD4D-133174E11D4A/1-写真1.jpg`（1280×720）。
- captures: `/private/tmp/moneyhooks-login-desktop.png`（1280×720）、`/private/tmp/moneyhooks-login-mobile.png`（390×844）。未認証、entrance animation完了後。
- desktopはbrand header・左visual・右login card、mobileはvisualを隠す。既存logo、Geist、Googleのみの日本語copy、security/trust/feature情報、tokensを維持。
- 修正: mobileの`ログイ / ン`を`MoneyHooksへ / ログイン`へ改行。当時の認証テストでhandler 1回・busy/error、目視でCTA/accessibilityを確認。最終passed、P0/P1/P2・console errorなし。

## Transaction Candidate Badge

- source: `/var/folders/dp/_xcq39fs11l2lsjpd4jd4qvr0000gn/T/codex-clipboard-2d348dc8-03f3-42d8-8bcb-df7a6c3d7acc.png`（1672×941、通常/展開の合成）。
- captures: `/private/tmp/moneyhooks-transaction-candidates-final-mobile.png`（390×1052）、`/private/tmp/moneyhooks-transaction-candidates-final-viewport.png`（390×844）、`/private/tmp/moneyhooks-transaction-candidates-final-expanded-mobile.png`（390×1140）。認証済み、light、`/app/transactions/new`。
- 「よく使う項目」にカテゴリicon＋名称のoutline pill（h-9/text-sm/px-3、gap-2）、size-11の破線expand。既存tokens/Geist/Lucideを使用。
- 初期6候補、1操作で12、家賃選択で名称へ適用。mockのbottom sheetに対し製品要件の6件ずつinline展開を優先。周囲のcamera/memo/検索/navは対象外。
- 当時のテストはloading/error/empty/visibility/applicationを確認。最終passed、P0/P1/P2・console errorなし。

## Appearance Select — 2026-10-24

- 対象: `/app/settings/appearance`。既存の設定値・選択肢・保存処理を維持し、shadcn/ui Select と区切り線付きの行に変更。
- source visual truth: `/var/folders/dp/_xcq39fs11l2lsjpd4jd4qvr0000gn/T/codex-clipboard-1a190281-9c64-44b1-b757-d4cc9ebf29ec.png`（514×196）、`/var/folders/dp/_xcq39fs11l2lsjpd4jd4qvr0000gn/T/codex-clipboard-1c3fae5b-448d-4208-85b6-ffb5ca0952f6.png`（514×372）。
- implementation screenshots: `/private/tmp/moneyhooks-appearance-theme-final.png`、`/private/tmp/moneyhooks-appearance-accent-final.png`（820×720）、`/private/tmp/moneyhooks-appearance-mobile-final.png`（390×844）。CSS viewport と画像寸法は同じ、密度1。320×640でも文書幅を確認。
- full-view evidence: 上記のPC・モバイル画面でページタイトル、3行、操作メニュー、下部ナビを確認。
- focused comparison evidence: `/private/tmp/moneyhooks-appearance-theme-comparison-final.png`、`/private/tmp/moneyhooks-appearance-accent-comparison-final.png`。実装の484px幅の設定領域を左右余白込み514pxで切り出し、元画像と同一入力上に並べて比較。拡大縮小なし。
- state: テーマはシステム、アクセントは保存済みのブラック。テーマメニュー・アクセントメニューを別々に開いて比較。参考のパープル・7色に対し、既存の名称・5色を優先。画像のMarkdownエディタ・利用規約は対象外で、既存のグラフカラーセットを残す。
- comparison history: 初回はラベルの太さ、セレクトの幅と背景にP2の差を確認（`/private/tmp/moneyhooks-appearance-theme-comparison.png`、`/private/tmp/moneyhooks-appearance-accent-comparison.png`）。標準の太さ、テーマ・アクセント幅144px、card背景へ修正し、上記final画像で再比較。長い既存名称とグラフ配色見本の可読性のため、幅は参考の116pxより広く維持。
- fonts/typography: 既存のGeist・日本語fallbackを使用。ラベル14px、セレクト12pxで、全項目と選択中の名称を確認。
- spacing/layout: 左ラベル・右セレクト、84pxの行、区切り線、右揃えのメニューを確認。390pxでは1行、320pxの長いラベルは改行し、横方向のはみ出しなし。
- colors/tokens: background/card/popover/border/foregroundと既存の色見本tokenを使用。アプリの背景色は既存のテーマを優先。
- image quality/assets: ラスター素材なし。既存のLucideアイコン、色設定を示すtokenの色見本を使用。
- copy/content: テーマ・アクセントカラー・グラフカラーセットと全既存選択肢を維持。
- interactions: 3つのSelectの開閉、選択中チェック、キーボード移動とEscapeによるキャンセル、labelとの関連付けを確認。設定値は変更せず、保存処理は既存のuseAppearanceへ接続することをコードで確認。ブラウザーのconsole errorなし。
- findings: 未解決のP0/P1/P2なし。実機のタッチ操作・OSキーボード、保存APIの実送信は今回の見た目変更では検証対象外。
- implementation checklist: 3項目の置換、既存token・保存接続の維持、PC・モバイル確認、型検査・対象ESLint・色・書式・差分チェックを完了。
- final result: passed
