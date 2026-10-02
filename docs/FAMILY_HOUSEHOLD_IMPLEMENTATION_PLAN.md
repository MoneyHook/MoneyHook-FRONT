# 家族の家計記録 v1 — 実装計画書

更新日: 2026-09-29。業務仕様の正本は [機能仕様書](FAMILY_HOUSEHOLD_DESIGN.md)。本書は実装したテーブル・API・移行と検証方針を示す。正確なHTTP schemaは `contracts/openapi.yaml`、DDLはGo APIの `app/db/migration/household.go` を参照。デプロイは未実施。

## 1. 実装の前提

- 既存の `transaction.user_no` を個人原本の所有者として維持する。全データを汎用ledgerへ移す変更は行わない。
- 家族側は共有参照・代理記録・退出時の控えの3種類を扱う。共有参照の金額等は原本から読み、代理記録と控えは独立した値を持つ。
- 他の家族は個人原本・共有参照を編集・削除・共有解除できない。管理者も例外にしない。
- 代理記録は家族全員が共同編集可能だが、支払者の個人原本を作成・更新しない。
- 一人につき有効な家族は1つ、1家族は管理者を含め3人。招待は英数字10文字・24時間・1回限り。リンクとコードは同じ招待に紐づく。
- v1には代理記録の個人インポート、家族予算・定期収支・CSV、精算を含めない。将来用の空APIを追加しない。
- Go APIとReactの両方を実装対象とする。計画書はReactリポジトリに保存する。

### 現行実装との対応

| 現行                                                                           | 変更方針                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `app/db/migration/schema.go` の `users`・`transaction`                         | 設定、更新版、論理削除の列を追加                                     |
| ユーザー別 `payment_resource`・`sub_category`・`budget`・`monthly_transaction` | 個人用として維持。家族用の支払方法・独自分類は別テーブル             |
| `app/handler/routes.go`                                                        | 家族APIをv1へ登録。route契約テストも更新                             |
| `app/handler/transaction` と `app/store_postgres/transaction*.go`              | 本人による原本更新と共有参照の同期、削除と共有終了を一括処理               |
| 旧取引APIとv1 APIの併存                                                        | 外部の既存path・JSON・statusを維持。内部の共有整合性処理は両方に適用 |
| `contracts/openapi.yaml` → Orval                                               | 新API・追加フィールドを契約化し生成。生成物を手編集しない            |
| 個人一覧は旧 `getTimelineData` を使用                                          | 共有状態の絞り込みが必要な新一覧をv1に追加し、React一覧を段階移行    |
| `cmd/migrate` とGORM migration                                                 | 既存の独立migrationコマンドへ追加。API起動時にDDLを実行しない        |

## 2. テーブル一覧

既存のIDはbigint、新規の業務IDもbigintを基本とし、HTTP上はすべてstringで扱う。監査時刻は `timestamptz`、取引日は `date`。金額のDB保存は既存どおり符号付き整数とし、HTTPでは絶対額とsignへ変換する。

| 区分 | テーブル                   | 主な列                                                                                                                                                            | 目的                                                           |
| ---- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 変更 | `users`                    | `default_transaction_scope`（personal / household、default personal）                                                                                             | ユーザーごとの入力先設定                                       |
| 変更 | `transaction`              | `version` default 1、`updated_at`、`deleted_at` nullable                                                                                                          | 本人原本。更新競合と論理削除を扱う                             |
| 新規 | `household`                | `household_id` PK、`name`、`state`（active / archived）、`version`、作成・終了日時                                                                                | 家族本体                                                       |
| 新規 | `household_member`         | `member_id` PK、`household_id` FK、`user_no` FK、`role`、`state`（active / left / archived）、`slot_no`、`display_name`、参加・退出日時                           | 所属と家族内の支払者参照                                       |
| 新規 | `household_invitation`     | `invitation_id` PK、家族・発行者FK、`code_digest`、`token_digest`、`expires_at`、`consumed_by`、`consumed_at`、`revoked_at`、作成日時                             | 1回限りの招待。平文は保存しない                                |
| 新規 | `household_payment`        | `payment_id` PK、家族FK、`payment_type_id` FK、名前、締め日・支払日、`active`、`version`                                                                          | 家族専用の支払方法                                             |
| 新規 | `household_sub_category`   | `sub_category_id` PK、家族FK、共通カテゴリFK、名前、`active`、`version`                                                                                           | 家族専用のサブカテゴリ                                         |
| 新規 | `household_entry`          | `entry_id` PK、家族FK、`kind`、`source_transaction_id` nullable FK、`payer_member_id` nullable FK、家族支払方法・分類FK、`state`、`version`、登録者・更新者・日時 | 家族一覧の安定した記録IDと出所                                 |
| 新規 | `household_entry_data`     | `entry_id` PK/FK、公開DTOの `payload jsonb`、最新訂正の `corrected_payload jsonb`、`captured_at`、`source_version`（金額・日付・分類・表示名をpayloadに保存）                                           | 代理記録の実値、または退出時の不変な控え。共有中は行を作らない |
| 新規 | `household_event`          | `event_id` PK、家族FK、実行者FK、対象メンバー・招待ID、イベント種別、時刻                                                                                         | 参加・退出・管理者交代・招待取消など。招待の秘密は記録しない   |
| 新規 | `api_idempotency`          | ユーザーFK、操作名、キー、request digest、結果resource ID、作成日時（結果は同一DB transaction内で保存、期限なし）                                                 | 家族・記録作成、招待承諾等の再送による重複防止                 |

招待試行の保存先として `household_invitation_attempt(bucket PK, attempts, expires_at)` も追加する。アカウントと接続元IPのHMAC bucketをDBで更新し、それぞれ15分間に20回までとする。期限切れbucketは次の試行でリセットする。

`household_entry.kind` は `shared / proxy / snapshot`、`state` は `active / withdrawn / deleted`。snapshotの集計除外は最新の訂正内容で管理し、不変な控え自体を消さない。family共通の支払者は `payer_member_id = null` とし、レスポンスでは `payer_kind: common` を明示する。

### 制約と索引

- `household_member(household_id, user_no)` は一意。再参加時は同じmember IDを再利用し、参加履歴はeventに残す。退出済み人物への過去参照を切らない。
- `user_no WHERE state = 'active'` に一意索引を置き、有効所属を1つにする。
- `slot_no` はactiveなら1〜3、非activeならnull。`(household_id, slot_no) WHERE state = 'active'` を一意にしてDBでも4人目を防ぐ。
- `household_id WHERE state = 'active' AND role = 'admin'` を一意にする。active家族に管理者が必ず1人いる条件は、家族行のロックを取る作成・交代・退出処理で保証する。
- payer、家族支払方法、家族分類は `(household_id, id)` の複合外部キーで同一家族を保証する。所属・支払方法・分類は参照があれば物理削除しない。
- sharedはsource必須・payer必須、proxyはsourceなし、snapshotはsource必須。sourceの所有者とsharedのpayerのuserが一致することはStoreで検証する。
- `(household_id, source_transaction_id)` はsourceがある行で一意にする。共有解除後は同じ行を再有効化し、snapshotへ変わった行はv1ではsharedへ戻せない。source IDは重複判定用でありsnapshot読み取りで原本をJOINしない。
- sharedにentry_dataはなく、proxy・snapshotに1行だけある条件を同一DBトランザクションで保証する。CHECKだけで表をまたぐ整合性を保証したとは扱わない。
- snapshotのpayloadは更新不可。訂正は完全な公開DTOをcorrected_payloadへ上書きし、最新の訂正を集計に適用する。個人側の参照IDはJSONへ格納しない。
- 同時訂正は家族行のロックとentryのversion検証で防ぐ。
- 招待のcode/token digestはそれぞれ一意。期限は照合・承諾・発行時にDB時刻で判定し、期限掃除ジョブを成立条件にしない。
- 取得索引はmemberのuser/state、invitationの家族/有効期限、entryの家族/state、source、payer、entry_dataの日付に置く。sharedの日付絞り込みは原本のuser/date索引も確認する。
- `api_idempotency` は `(user_no, operation, key)` を一意にし、同キー・異なるrequestは409。結果を再返却する際も現在の閲覧権限を再検証する。

## 3. 集計と変更の単位

### 一覧・集計の共通読み取り

家族の有効記録を以下の3分岐で投影し、同じ結果を一覧・月次・カテゴリ別・人物別集計の正本にする。

1. shared: 未削除の個人原本から公開項目を取得し、家族側の支払方法・独自分類を付加する。
2. proxy: entry_dataの現在値を取得する。
3. snapshot: 不変なentry_dataに最新訂正を適用する。除外指定があれば集計しない。

`entry_id` 単位で1回だけ数える。本人の個人集計は未削除のtransactionだけを数え、家族entryを足さない。退出直後にも両方の集計値を維持する。

大カテゴリは原本の項目として共有する。本人の新規登録・共有開始では、個人のサブカテゴリ・支払方法から家族項目を自動解決する。共有中の原本のカテゴリ・サブカテゴリまたは支払方法の参照を変更した場合は、変更された項目だけ再解決する。サブカテゴリは親カテゴリと名前、支払方法は名前・種別・締め日・支払日で有効な項目を検索し、なければ作成する。検索・作成・保存は家族行のロック下の同一トランザクションで実行する。無効項目の復活、個人設定変更の過去記録への伝播、既存記録の一括補完は行わない。family subcategoryは代理記録・既存記録のためnullableを維持し、個人側の参照IDを返さない。

### DBトランザクションの境界

| 操作                       | 一括で行う内容                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------- |
| 家族作成                   | household + 作成者member(slot 1/admin) + event                                         |
| 本人支出を家族用で新規登録 | 個人原本 + shared entry + 冪等処理結果                                      |
| 既存原本の共有開始         | 所有権・所属検証 + shared entryの作成/再有効化                              |
| 本人の原本編集             | 所有者とversion検証 + 原本更新 + 関連shared entry version更新            |
| 本人の原本削除             | 原本論理削除 + 有効shared entryをwithdrawnへ。snapshotは触らない            |
| 代理入力・編集・削除       | 家族所属・kind・version検証 + entry/data変更。個人transactionには書かない     |
| 退出・参加解除             | 本人の有効sharedをsnapshotへ切替・公開値保存 + member終了 + event。IDと合計を維持      |
| 家族アーカイブ             | 全sharedをsnapshot化 + 全active memberをarchivedへ + 全招待失効 + household終了        |
| 招待承諾                   | 招待再検証 + 所属/slot追加 + 招待消費 + event + 冪等処理結果                           |
| 管理者交代                 | 現管理者をmemberへ、新管理者をadminへ + 未使用招待失効 + household version更新 + event |

所有者に関する共有・原本更新・退出はuser行を先にロックし、次にhousehold、原本、entryの順にロックする。管理者交代は家族行をロックして役割を切り替える。archiveは最後の1人に限定し、対象userを先にロックする。家族側だけの代理更新・招待発行はhouseholdから取得し、その後にuserロックを要求しない。事前読み取りした所属・所有者はロック後に再検証する。デッドロックや直列化失敗の再試行は冪等性と組み合わせる。

更新のversion条件は原本とentryの双方に必要な操作では両方を要求する。原本と家族側参照の更新を同じトランザクションに含める。

メンバー追加・退出・解除・管理者交代・archiveではhouseholdのversionも進める。すべての変更操作はロック取得後にactive状態と権限を再検証する。archiveはロック後にもactiveメンバーが1人だけであることを再検証する。archive閲覧権限は終了時にarchivedになったメンバーに限定し、それ以前のleftメンバーには与えない。

## 4. API一覧

以下は実装済みの契約。すべてFirebase Bearer認証が必要。`H` は説明上の `/api/v1/households/{householdId}` の略であり、OpenAPIには完全なpathを書く。IDはstring、変更操作の所有者は認証から決める。

### 家族・メンバー・設定

| Method    | Path                       | 目的・権限                      | 主な入力 → 出力                                        |
| --------- | -------------------------- | ------------------------------- | ------------------------------------------------------ |
| GET       | `/api/v1/households`       | 本人の有効家族・閲覧可能archive | → 家族一覧、役割、state                                |
| POST      | `/api/v1/households`       | 未所属者が作成                  | name → household + 自分のmember（201）                 |
| GET       | `H`                        | 所属者、またはarchive閲覧者     | → 名前、state、version、本人のrole/member_id           |
| PATCH     | `H`                        | 管理者が名前変更                | name, expected_version → household                     |
| GET       | `H/members`                | 所属者、archive閲覧者           | → active/left/archivedの人物表示。メール等は返さない   |
| PATCH     | `H/members/me`             | 本人の家族内表示名変更          | display_name → 204                                     |
| POST      | `H/admin-transfer`         | 現管理者                        | target_member_id, expected_version → 204               |
| POST      | `H/leave`                  | 管理者以外の本人                | expected_version → 204                                 |
| DELETE    | `H/members/{memberId}`     | 管理者が他メンバーを解除        | expected_version（query）→ 204                         |
| POST      | `H/archive`                | 最後の1人である管理者           | expected_version → 204                                 |
| GET/PATCH | `/api/v1/settings`（拡張） | 本人の設定                      | default_transaction_scope → 設定。既存の外観項目を維持 |

家族用をデフォルトに設定できるのは有効な家族への所属中だけ。退出・解除・archive時にpersonalへ戻す。状態確認中や設定取得失敗時に勝手に家族用へ切り替えない。

### 招待

| Method | Path                                    | 目的                     | 主な入力 → 出力                                                                       |
| ------ | --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| GET    | `H/invitations`                         | 管理者の状態一覧         | → ID、有効期限、state。秘密は返さない                                                 |
| POST   | `H/invitations`                         | 管理者が発行             | → invitation_id、code、token、expires_at（201）                                       |
| DELETE | `H/invitations/{invitationId}`          | 管理者が取消             | → 204                                                                                 |
| POST   | `H/invitations/{invitationId}/reissue`  | 取消と置換発行を一括処理 | → 新ID・code・token・期限（201）                                                      |
| POST   | `/api/v1/household-invitations/preview` | ログイン済み受取人の確認 | codeまたはtokenの片方 → 家族名、招待者表示名、期限（共有条件はReactで固定文言を表示） |
| POST   | `/api/v1/household-invitations/accept`  | 受取人が参加確定         | codeまたはtoken、Idempotency-Key → household/member（201）                            |

preview結果のIDだけでは承諾できず、accept時にも招待の秘密を照合する。コードは例として `ABCDE-FGHJK` の形式、32種の紛らわしくない文字から暗号学的乱数で10文字生成する。リンク用tokenは別途256bitの乱数とする。短いコードのDB流出時の探索を抑えるため、サーバー秘密鍵によるHMAC等の照合値を保存し、鍵の管理・更新方針を実装時に定める。

発行レスポンスの秘密は一度だけ表示し、一覧から再表示しない。レスポンスを受信できなかった場合は一覧で発行状態を確認し、再発行する。冪等処理の保存結果にも平文のcode/URLを入れない。同じ発行キーの再試行は409 `INVITATION_ALREADY_ISSUED` を返し、別招待を増やさない。承諾の同キー再試行は、同じ本人に成功結果を返す。

家族行をロックし、有効メンバーと未期限切れ招待を確認して空き枠分だけ発行する。acceptはuser→household→invitationの順でロックして再検証する。rate limitはアカウントと送信元で行い、複数APIインスタンスでも成立する保存先・信頼するproxyヘッダーを実装時に確認する。

Reactの参加URLは `/family/join#<token>` とする。公開routeでfragmentを削除し、保護route `/app/family/join` へ移る。tokenをAPI path/queryへ付けずPOST bodyで渡す。ログイン遷移が必要なら短時間のsessionStorageへ一時退避して復帰後に削除し、URL fragmentも除去する。分析イベント・ログ・例外出力へ秘密を載せない。GETやリンクプレビューは招待を消費しない。

### 記録・共有

| Method           | Path                                           | 目的・権限                         | 主な入力 → 出力                                                                   |
| ---------------- | ---------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| GET              | `/api/v1/transactions`（追加）                 | 本人原本の一覧                     | month、sharing=all/private/shared、cursor → 原本一覧・共有状態                    |
| GET/PATCH/DELETE | `/api/v1/transactions/{transactionId}`（拡張） | 本人原本だけ                       | responseにversion/共有状態。更新・削除にexpected_versionを追加                    |
| POST             | `H/own-transactions`                           | 本人原本と共有参照の同時作成       | transaction + family references → entry（本人だけsource_transaction_id付き、201） |
| GET              | `H/shares/{transactionId}`                     | 本人の共有状態を確認               | → state、entry ID、version、kind。未共有ならnone/version=0                        |
| PUT              | `H/shares/{transactionId}`                     | 本人が既存原本を共有・分類自動対応 | 原本version、既存entryならentry version → 原本から家族側参照を自動解決したentry   |
| DELETE           | `H/shares/{transactionId}`                     | 本人の共有解除                     | expected_version（query）→ 204。原本は残す                                        |
| GET              | `H/entries`                                    | 家族一覧                           | month、payer=member ID/common、kind、cursor → entry一覧                           |
| GET              | `H/entries/{entryId}`                          | 家族詳細                           | → 公開DTO、version、許可操作                                                      |
| POST             | `H/proxy-transactions`                         | 所属者が代理/共通財布記録          | payer、transaction、家族側参照 → entry（201）                                     |
| PATCH            | `H/proxy-transactions/{entryId}`               | 所属者。proxyのみ                  | expected_version、変更項目 → entry                                                |
| DELETE           | `H/proxy-transactions/{entryId}`               | 所属者。proxyのみ                  | expected_version（query）→ 204                                                    |
| POST             | `H/entries/{entryId}/corrections`              | 所属者。snapshotのみ               | expected_version、完全な公開内容または除外指定 → entry（201）             |
| GET              | `H/duplicate-candidates`                       | v1の重複候補                       | 日付、絶対額、sign、payer、任意の除外entry ID → 候補一覧                          |

原本は本人用APIで編集し、家族用の汎用PATCH APIは作らない。family detailの `source_transaction_id` は所有者本人にのみ返す。他の家族へ返す `permissions` は can_edit=false/can_delete=false/can_unshare=false。代理APIへsharedのentry IDを渡してもStoreで拒否する。

新規の本人共有登録は、個人APIのPOST後に共有APIを順に呼ぶ方式にしない。共有保存が失敗したのに個人記録だけが残る事故を防ぐため、own-transactionsで一括作成する。

### 家族の参照情報と集計

| Method         | Path                                                | 目的                                                        |
| -------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| GET            | `H/categories`                                      | 家族サブカテゴリ。大カテゴリは既存の共通カテゴリAPIから取得 |
| POST/PATCH     | `H/subcategories` / `H/subcategories/{id}`          | 家族サブカテゴリ作成・未使用項目の変更・無効化              |
| GET/POST/PATCH | `H/payments` / `H/payments/{id}`（PATCHのみID付き） | 家族支払方法の一覧・作成・未使用項目変更・無効化            |
| GET            | `H/analytics/overview`                              | 対象月の収入・支出・差額。家族予算は返さない                |
| GET            | `H/analytics/categories`                            | 共通カテゴリ別支出                                          |
| GET            | `H/analytics/payers`                                | 支払者別支出。家族共通も含め合計一致                        |

参照情報の使用後は名前・カテゴリ・支払条件の上書きを拒否し、必要なら新しい項目を作って旧項目を無効化する。active=falseだけは許可し、既存明細の表示を維持する。すべての家族参照IDの所属をAPIとFKで確認する。

## 5. DTO・エラー・互換性

### 家族記録レスポンスの共通項目

`entry_id`, `kind`, `version`, `transaction_date`, `transaction_time`, `transaction_name`, `amount`, `sign`, `signed_amount`, `category_id/name`, `household_sub_category_id/name`, `household_payment_id/name`, `fixed_flg`, `payer`, `created_by`, `updated_by`, `updated_at`, `permissions`。

snapshotには `captured_at`、`corrected`、`excluded_from_totals` を追加。原本owner IDや個人支払方法IDを家族用DTOに丸ごと埋め込まない。家族側のpayerはmember ID・表示名・active/leftで返し、メール・Firebase UIDは返さない。

```json
{
  "payer": { "kind": "member", "member_id": "12" },
  "transaction": {
    "transaction_date": "2026-09-28",
    "transaction_name": "食料品",
    "amount": 4800,
    "sign": -1,
    "category_id": "3",
    "fixed_flg": false
  },
  "household_payment_id": "8",
  "household_sub_category_id": null
}
```

上はproxy作成の例。payer.kind=commonならmember_idなし。own-transactionsのtransactionは既存の個人用入力契約に従い、本人のcategory/subcategory/paymentを持つ。家族側の参照は別項目で指定する。新入力の金額1〜9,999,999円・名称1〜32文字など既存検証を維持する。

新規APIのエラーは既存v1形式 `status / code / message` を使う。未認証401、閲覧可能な対象で操作権限がない場合403、対象への閲覧権限自体がなければ404、型不正400、業務入力不正422、競合409、試行超過429とする。招待の無効・期限切れ・取消済みは受取人には共通422 `INVITATION_UNAVAILABLE` とし、詳細は管理者一覧で確認する。

409の主なcodeは `VERSION_CONFLICT`、`HOUSEHOLD_FULL`、`ALREADY_IN_HOUSEHOLD`、`INVITATION_LIMIT_REACHED`、`SOURCE_ALREADY_SNAPSHOTTED`、`IDEMPOTENCY_CONFLICT`。UIはcodeで案内を分け、内部DBエラーを表示しない。

既存v1のexpected_versionは導入期間は省略可能として既存利用者を壊さず、React新フォームでは必ず送る。家族の新規変更APIは必須。旧APIを含む原本の全書き込みでversionを進め、共有参照の整合を保つ。古いクライアントの無条件更新には競合検出を保証しないが、退出とのロック整合と所有権は保証する。厳密な全クライアント競合検出が必要なら旧API廃止を別途計画する。

## 6. データ移行・リリース

1. **追加DDL:** household系テーブルとusersの設定列、transactionのversion・更新日時・deleted_atを追加する。既存行は非共有原本のまま。共有行の自動生成はしない。
2. **migration実装:** `schema.go`、制約定義、検証、必要な専用backfillへ追加する。partial index/CHECK/複合FKは現行の単純な制約ヘルパーで表現できるか確認し、必要箇所だけ拡張する。再実行可能にする。
3. **互換APIを先行配備:** 旧/v1双方に論理削除フィルタと共有処理を入れる。GORMの自動scopeに頼らず、Table/Raw/集計/候補/CSV/定期生成の全経路を確認する。物理DELETEを残さない。
4. **家族API・生成クライアント配備:** 追加契約と生成物を同じ変更単位で同期する。家族機能を公開する前に全APIインスタンスが新書き込み処理になっていることを確認する。
5. **React公開:** 初期値はpersonal。家族作成・招待を明示操作で始める。個人だけの既存利用者の表示・集計を変えない。
6. **移行検証:** 既存原本件数・ユーザー/月別signed sum・参照整合を前後比較し、共有件数が0であることを確認する。再migrationで重複が出ないことも確認する。

個人の支払方法・分類・予算・定期収支の所有者を家族へ移行しない。家族作成時の支払方法・独自分類は空で開始し、共通大カテゴリだけ利用する。

切り戻しは家族UIの公開停止と、新テーブルを理解する互換APIへの切り戻しを基本とする。家族データ作成後や論理削除開始後に、共有整合を知らない旧バイナリへ戻さない。家族の記録・控えは保持する。migration前のバックアップと復元手順を配備時に確認する。

現行migrationにはCockroachDBを意識した分岐もあるため、実際の配備先とpartial index・ロック・制約対応をDDL確定前に確認する。PostgreSQL前提の本案を未検証で別DBへ適用しない。

## 7. 実装ステップと完了条件

| 順序 | 作業単位           | 主な成果・完了条件                                                           |
| ---- | ------------------ | ---------------------------------------------------------------------------- |
| 1    | 契約・DB定義       | 本計画をOpenAPI・migration定義へ落とす。DTOの公開範囲とエラーを確定          |
| 2    | 所属と招待         | 最大3人・1家族、24時間/1回招待、取消・再発行・管理者交代をDB結合テストで保証 |
| 3    | 原本と共有         | 論理削除、version、本人共有作成・解除・更新、全旧APIの整合。家族は閲覧のみ   |
| 4    | 家族専用記録・集計 | proxy CRUD、重複候補、家族参照情報、共通投影による一覧と分析                 |
| 5    | 退出・archive      | snapshot切替と訂正、再共有拒否、人数枠解放、退出前後の合計維持               |
| 6    | React導線          | 作成→招待→参加→デフォルト設定→本人共有/代理入力→閲覧→退出を接続              |
| 7    | 統合確認と公開準備 | 個人回帰、権限・同時操作・migration、手動操作、配備順と切り戻しを確認        |

途中段階では家族機能を利用者へ公開せず、退出・控え・旧API整合まで完成してから公開する。作業単位はcommit/PR作成の指示ではない。

Go側は `app/household` に必要なStore interfaceとdomain error、`app/handler/household` にDTO・検証・handler、`app/store_postgres` にDB処理を置く。routeは `handler/routes.go`、依存注入は既存handler root/db構成に従う。複数表を更新する操作をhandlerから別々のStore呼び出しへ分解しない。

React側は `features/households`、設定page・参加page、既存transactions/home/analysisを変更する。feature間の直接importを増やさずpageで合成する。入力先と閲覧対象を分け、family APIのquery keyにはhousehold IDを含める。permissionはUIの操作表示に使うがAPIで必ず再検証する。

## 8. 検証計画

[既存テスト方針](ARCHITECTURE.md#テスト)に従い、UI表示・操作の自動テストは追加しない。以下はドメイン・API・DB・永続化の契約として検証する。

- 所有者/他メンバー/管理者/部外者/退出者の認可行列。原本・共有参照の変更、代理変更、snapshot訂正を別々に検証。
- 同時招待承諾、同一コードの二重使用、コードとリンクの競合、期限境界、取消と承諾の競合、管理者交代後の失効。
- 家族作成と参加の同時実行でも1所属、slot制約で4人目拒否。参加失敗時に招待だけ消費しない。
- 他家族のpayer/payment/subcategoryの指定拒否。個人の参照IDが家族DTOへ漏れない。
- 代理変更で個人transactionへのINSERT/UPDATE/DELETEが発生しない。共有作成の途中失敗で原本だけ残らない。
- 原本の本人更新と退出・削除の競合、snapshot再試行、旧API経由の更新。原本と控えが分離し、退出前後の両集計が一致。
- 日付の月跨ぎ、category変更によるfamily subcategory解除、人物別合計、控えの訂正/除外の集計一致。
- 共有解除・再共有、再参加時のsnapshot再共有拒否。冪等キー再送と異なるpayload拒否。
- 家族キャッシュの永続化防止、ログアウト・退出時の破棄、遅延レスポンスの混入防止、デフォルト設定の同期。
- migration初回/再実行/既存データ保持、FK・CHECK・partial unique、論理削除の全個人集計への適用。

実装後のコマンドはReactで `pnpm contract:test`、`pnpm api:generate`、生成差分確認、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`。Goはappで `go vet ./...`、`go test ./...`、`go build ./...` と変更Goファイルのgofmt確認。DB統合はテスト専用DBと `MIGRATION_TEST_POSTGRES_DSN` を用意して `go test -tags=integration ./db/migration ./store_postgres` を実行し、DSN未設定のskipを成功検証と扱わない。

手動ではモバイル/デスクトップの招待・ログイン復帰、本人共有の閲覧専用表示、代理編集、削除確認、退出後の個人保持と家族控え、期限切れ/満員/入力エラーを確認する。

## 9. 今回の成果と未実施

Reactの家族設定・招待参加・入力先選択・共有/代理記録・家族一覧/集計と、Go APIの所属・招待・参照情報・原本共有・代理編集・退出時の控えを実装した。OpenAPIと生成クライアントを更新し、個人一覧をv1へ移行した。v2の代理インポートは未実装。

2026-09-29の検証結果:

- React: 型検査、30ファイル/110テスト、OpenAPI 492 assertions、buildが成功。lintはエラーなし（既存CSV画面の3警告）。buildはbundleサイズの警告あり。
- Orval: 188ファイルを再生成し、2回目の生成結果が同一であることを確認。生成時にformatterを実行して差分を安定させる。
- Go: gofmt、vet、全テスト、buildが成功。専用PostgreSQL 17 DBのmigration/Store結合テストも成功（DSN設定済み、skipなし）。
- 手動: 専用Auth Emulatorと一時DBで家族作成、デフォルト保存、入力先切り替え時の金額/名称保持、本人共有/代理登録、個人合計の重複防止、本人原本編集の家族への反映、招待codeで参加、別メンバーの原本閲覧専用、代理共同編集、モバイル入力/一覧を確認。
- 退出時の控えと訂正/除外、archive、再参加、期限切れ/取消/同時承諾はAPI/DB契約テストで検証。招待リンクからの未認証ログイン復帰と全退出操作の画面確認は未実施。UI表示/操作の自動テストは追加していない。

検証用の一時HTML・API・DB・Auth Emulatorは終了時に片付ける。既存の利用者DBへmigrationを適用していない。

本番へのmigration・デプロイは未実施。`HOUSEHOLD_INVITATION_SECRET`（32byte以上）の配備が必要。現在の本番DBであるCockroachDBでのDDL、partial unique、直列化再試行は公開前に実環境相当で検証する。PostgreSQLでの成功をCockroachDB検証済みとは扱わない。

v1の一覧は100件ずつ取得する。集計/重複候補は該当月の全ページを走査し、明細の投影で追加queryを行う。大量データでの性能検証とSQL集計への移行、冪等性/家族イベントデータの保存期間と掃除は今後の運用課題。
