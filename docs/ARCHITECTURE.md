# MoneyHooks React アーキテクチャ

## 採用済みの基盤

| 分類 | 技術 |
|---|---|
| UI | React、TypeScript strict、Vite |
| Package manager | pnpm |
| Routing | React Router |
| Server state | TanStack Query |
| Validation | Zod |
| Authentication | Firebase Authentication |
| Components / CSS | shadcn/ui、Radix UI、Tailwind CSS |
| Chart | Recharts |
| Theme / notification | next-themes、Sonner |
| API generation | OpenAPI、Orval |
| Test | Vitest、React Testing Library、MSW、Playwright |

新しいライブラリは、実装する機能で必要になった時に選定して追加します。将来の候補を採用済みとして扱いません。

## コード構造

```text
src/
├── app/       provider、router、layout、global style
├── pages/     route単位の画面とfeatureの合成
├── features/  業務機能ごとのUI、状態、API利用、model
├── shared/    API基盤、汎用UI、設定、hook、utility
└── test/      複数箇所で共有するテスト基盤
```

依存方向は`app → pages → features → shared`です。

- pageは複数featureを合成する。
- feature同士を直接importしない。連携に必要な値はpageで受け渡す。
- feature外から利用するものはfeatureの`index.ts`で公開する。
- `shared`は特定featureの業務知識を持たない。
- 新しい共通化は複数の実利用が確認できてから行う。

## 状態の所有者

| 状態 | 所有者 |
|---|---|
| APIから取得したデータ | TanStack Query |
| ログインユーザーと認証確定状態 | Firebase Authentication / AuthProvider |
| URLで再現する条件 | React Router Search Params |
| そのコンポーネントだけの表示状態 | React local state |
| 環境変数の検証済み設定 | `shared/config/environment` |

同じデータを別のstoreやlocalStorageへ複製しません。フォームなど新しい状態管理手段が必要な場合は、その機能を実装する時に責務を決めます。

## 認証

- `onIdTokenChanged`をクライアントの認証状態の正本とする。
- Google popupでログインする。`VITE_FIREBASE_AUTH_EMULATOR_URL`を設定した開発環境では、Auth Emulatorがローカルのモック認証ポップアップを提供する。保護routeは認証状態の確定を待ってから判定する。
- ID tokenを手動で永続化せず、API呼び出し時にFirebase SDKから取得する。
- ログアウト時はTanStack Queryのキャッシュを破棄する。
- 未認証ユーザーの戻り先は安全なアプリ内pathだけを許可する。

## API境界

- [`contracts/openapi.yaml`](../contracts/openapi.yaml)をOrvalの入力とする。
- 生成物は`src/shared/api/generated/`に置き、直接編集しない。
- `shared/api/http-client`がベースURL、Firebase Bearer token、response bodyの解析を担当する。
- HTTP失敗は共通の`ApiError`へ正規化し、UIへ生のresponse形式を漏らさない。
- API固有の呼び出しやDTO変換をpageや汎用UIへ直接記述しない。
- ID、金額、日付などAPI DTOと画面入力の意味が異なる境界だけを明示的に変換する。
- Mutationを追加する時は影響するquery keyを機能側で管理し、月をまたぐ変更では旧月と新月を更新する。

APIのサーバー実装、DB、認可、データ移行、運用はGo APIリポジトリの責務です。

## UIとカラー

- アプリの色は用途名を持つsemantic color tokenを使う。
- 生の色値は`src/app/styles/tokens.css`だけに置く。
- page、feature、shared component、SVG、inline styleへHEX、RGB、HSL、色名を直接記述しない。
- 必要な色がなければ、light/dark両themeに意味が一致するtokenを追加する。
- shadcn/uiのprimitiveは`src/shared/components/ui/`、アプリ共通の組み合わせは`src/shared/components/`に置く。

直接カラー指定は`pnpm lint`に含まれるsemantic color checkで検出します。

## テスト

- テストは対象コードの近くへ置く。
- ユーザー操作、公開された振る舞い、状態遷移を検証し、内部実装へ過度に依存しない。
- APIを利用するコンポーネントはMSWで成功、エラー、空状態を再現する。
- routeや認証をまたぐ主要フローはPlaywrightで検証する。
- 複数テストで共有するsetupやMSW serverだけを`src/test/`へ置く。
