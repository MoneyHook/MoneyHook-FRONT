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
