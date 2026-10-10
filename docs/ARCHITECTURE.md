# アーキテクチャ

## 基盤

React・TypeScript strict・Vite・pnpm、React Router、TanStack Query、Zod、Firebase Auth、shadcn/ui・Radix UI・Tailwind、Recharts、Sonner、OpenAPI/Orval、Vitest・MSW・Playwright。正確な依存とバージョンは[`package.json`](../package.json)。ライブラリは実利用が必要になった時に追加する。

## コード構造

依存は`app → pages → features → shared`。

- `app`: provider・router・layout・global style。`pages`: route画面とfeatureの合成。
- `features`: 業務UI・状態・API利用・model。feature間で直接importせず、pageで値を受け渡す。外部公開は`index.ts`。
- `shared`: 特定featureの業務知識を持たないAPI基盤・汎用UI・設定・hook・utility。共通化は複数の実利用を確認してから。
- `test`: 複数テストで共有するsetup・MSW serverのみ。

ファイル責務とサイズは[コード規約](CODING_CONVENTIONS.md)。

## 状態の所有者

| 状態                   | 所有者                                    |
| ---------------------- | ----------------------------------------- |
| APIデータ              | TanStack Query                            |
| ユーザー・認証確定     | Firebase/AuthProvider                     |
| URLで再現する条件      | React Router Search Params                |
| コンポーネント内の表示 | React local state                         |
| デフォルト支払方法     | ユーザー単位のlocalStorage（API同期なし） |
| 入力先デフォルト       | ユーザー設定API                           |
| 検証済み環境設定       | `shared/config/environment`               |

APIを正本とし、永続キャッシュは成功レスポンスの初期表示・障害時フォールバックだけに使う。mount時に再取得する。

- 個人取引一覧はv1 APIから取得し、永続化しない。家族取引・分析も永続化せず、household ID付きquery keyとAbortSignalを使い、退出後のqueryを除去する。
- ユーザー設定・家族一覧・家族設定参照（メンバー/支払方法/サブカテゴリ）は入力先の即時表示用に復元する。家族操作成功時に永続キャッシュを破棄し、一覧から消えた家族の参照も削除する。再取得で入力中の登録先を変えない。
- ホーム・分析・取引詳細は`usePersistedQueryData`で復元。query用永続キャッシュは最大24件でアクセスの古い順に破棄する。
- フォームのカテゴリ・支払方法・支払種別・取引候補は専用参照キャッシュ（24件制限とは別）。
- ユーザーデータ・デフォルト支払方法は保存版/形式を検証し、ユーザー変更・ログアウト時に破棄する。支払方法が取得一覧から消えた場合も既定値を解除する。
- 外観はAPIが正本、localStorageはフォールバック。認証接続とユーザー単位のprovider再生成は`app/providers/appearance-provider`。
- カテゴリ分析の月/週/日タブはlocal state。日別レスポンスから月・月曜始まりの週を再集計し、タブ変更ではAPI追加取得・URL変更をしない。旧URLの`group`は初期選択だけに使う。

新しい状態管理手段は機能実装時に責務を決める。

## 認証

`onIdTokenChanged`を正本とし、保護routeは認証確定を待つ。Google popupを使い、Emulator時はモックpopupになる。tokenは手動永続化せず、API呼び出し時にSDKから取得する。ログアウト時はQuery cacheを破棄。未認証の戻り先は安全なアプリ内pathだけ許可する。

## API境界

- [`contracts/openapi.yaml`](../contracts/openapi.yaml)からOrvalで`shared/api/generated/`へ生成し、直接編集しない。
- `shared/api/http-client`がURL・Bearer token・body解析を担当し、HTTP失敗は`ApiError`へ正規化する。
- API呼び出し・DTO変換はpage/汎用UIへ書かず、ID・金額・日付など意味が変わる境界だけ明示的に変換する。
- Mutationの影響query keyは機能側で管理する。取引登録/編集/削除/CSV後は`features/transactions/api/invalidate-transaction-queries`で一覧・ホーム・分析の全期間と候補を無効化し、query用永続キャッシュを破棄する。編集詳細は再取得、削除詳細は除去。CSVはpageのcallbackで接続し、無関係な設定queryは無効化しない。

サーバー・DB・認可・移行・運用はGo APIの責務。

## UIとカラー

semantic color tokenを使い、生のHEX/RGB/HSL/色名は`app/styles/tokens.css`だけに置く。page・feature・shared・SVG・inline styleへの直書きを避け、不足tokenはlight/dark両方に定義する。検出は`scripts/check-semantic-colors.mjs`。

shadcn primitiveは`shared/components/ui/`、共通の組み合わせは`shared/components/`。[UI方針](PRODUCT.md#ui方針)も参照する。

## テスト

- 追加・変更・レビュー前に本節を確認する。対象はドメインロジック・変換・入力検証・API・永続化・認証結合など、UIを介さない契約。
- UI表示・レイアウト・style・ユーザー操作のテストは追加しない。React Testing Libraryのコンポーネントテストや画面遷移目的のPlaywrightも含む。既存UIテスト・導入済みライブラリを追加の根拠にしない。
- Playwrightはブラウザ固有の認証/API結合だけに使う。表示・操作は必要箇所を手動確認する。
- テストは対象の近くに置き、日付計算などは固定入力と期待値で契約を確認する。レビューでは成功だけでなく検証対象も確認する。
- 実行は追加・変更したテストと影響する既存テストだけ。詳しいコマンド・拡大条件は[検証方針](DEVELOPMENT.md#検証)。
