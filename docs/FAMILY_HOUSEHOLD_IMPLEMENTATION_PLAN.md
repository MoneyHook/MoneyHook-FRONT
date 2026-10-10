# 家族の家計記録 v1 — 実装資料

実装・検証記録の基準: 2026-09-29。本番migration/デプロイはこの記録では未実施。業務仕様は[機能仕様](FAMILY_HOUSEHOLD_DESIGN.md)、HTTP path/schemaは[OpenAPI](../contracts/openapi.yaml)、DDLはGo APIの`app/db/migration/household.go`を正本とする。Go側のパスは参照先であり、この資料だけで別リポジトリの変更を指示しない。

## 構成と正本

既存`transaction.user_no`が個人原本の所有者。汎用ledgerへ移さず、個人payment/subcategory/budget/monthly_transactionを維持する。家族はshared/proxy/snapshotを扱い、所有権・集計は機能仕様に従う。

| 参照先                                                         | 責務                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Go `app/db/migration/schema.go`・`household.go`、`cmd/migrate` | 設定/version/論理削除列、家族テーブルと制約。API起動時にDDLを実行しない |
| Go `app/household`                                             | Store interface・domain error                                           |
| Go `app/handler/household`・`handler/routes.go`                | DTO・入力検証・v1 route・依存注入                                       |
| Go `app/store_postgres`・旧/v1 transaction handler             | DB処理と全書き込み経路の共有整合性                                      |
| React `features/households`・関連page                          | 家族設定/参加/記録。pageで既存featureを合成                             |
| OpenAPI → Orval                                                | 契約・生成型。個人一覧はv1へ移行済み                                    |

DBはbigint ID、HTTPはstring。業務時刻は`timestamptz`、取引日は`date`、DB金額は符号付き整数、HTTP入力は絶対額/sign。

## テーブルと制約

列の詳細はDDLを参照。`users`は入力先設定、`transaction`はversion/updated_at/deleted_at、家族側は次のテーブルを使う。

- `household`: active/archived、version。`household_member`: role/state、slot、表示名・所属日時。
- `household_invitation`: code/token照合値・発行者・期限・消費/取消。`household_payment`・`household_sub_category`: 家族専用参照・active/version。
- `household_entry`: 安定したentry ID、kind=`shared/proxy/snapshot`、state=`active/withdrawn/deleted`、source/payer/家族参照・version・登録/更新者。
- `household_entry_data`: 公開DTOの`payload jsonb`、最新訂正の`corrected_payload`、`captured_at`。sharedには作らずproxy/snapshotに1行。
- `api_idempotency`: user/operation/key、request digest、結果resource ID。同じDB transactionに保存、期限なし。
- `household_invitation_attempt`: account/IPのHMAC bucket、attempts/expiry。各15分20回、期限切れは次の試行でリセット。

操作履歴は保存せず旧`household_event`をmigrationで削除。控えの原本versionも保存せず旧`source_version`列を削除する。

- memberの`(household_id, user_no)`は一意。再参加は同member IDを再利用し、過去参照を保つ。
- active userの一意索引で1所属。active slotは1〜3、非activeはnull。activeな`(household_id, slot_no)`を一意にして4人目を防ぐ。
- active adminは家族ごとに一意。管理者が必ず1人いる条件は家族ロック下の作成/交代/退出で保証する。
- payer/payment/subcategoryは`(household_id, id)`の複合FKで同一家族に限定。参照済み項目/人物は物理削除しない。
- sharedはsource/payer必須、proxyはsourceなし、snapshotはsource必須。原本所有者とshared payerの一致をStoreで検証する。共通財布payerはnull、DTOは`payer_kind: common`。
- source付き`(household_id, source_transaction_id)`は一意。解除後は同entryを再有効化し、snapshot→sharedはv1で拒否。snapshotはsourceを重複判定だけに使い原本をJOINしない。
- kind/dataの表間整合は単一transactionで保証する（CHECKだけで保証したと扱わない）。snapshot payloadは不変。訂正は完全な公開DTOで上書きし、最新だけ集計へ適用。集計除外も訂正で表し、個人参照IDをJSONに保存しない。
- 訂正は家族ロックとentry versionで競合防止。招待digestは各一意、期限は照合/承諾/発行時にDB時刻で判定し、掃除ジョブへ依存しない。
- 索引はmember user/state、invitation家族/期限、entry家族/state・source・payer、data日付。sharedの絞り込みは原本user/dateも確認する。
- 冪等キーは`(user_no, operation, key)`で一意。同キー/異requestは409、結果再返却でも現在権限を確認する。

## 読み取りと変更境界

一覧/全集計は同じ投影を使用し、entryごとに1回計上する。sharedは未削除原本＋家族参照、proxyはdata現在値、snapshotはpayload＋最新訂正（除外なら計上なし）。個人集計は未削除原本のみ。家族subcategoryは代理/既存互換のためnullable、個人参照IDは返さない。参照の自動対応ルールは[機能仕様](FAMILY_HOUSEHOLD_DESIGN.md#共有参照情報重複)に集約する。

以下は各操作の単一DB transaction。handlerから複数の独立Store呼び出しに分けない。

| 操作           | 一括処理                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| 家族作成       | household＋作成者admin/slot 1＋冪等結果                                            |
| 本人共有の新規 | 原本＋shared＋冪等結果。個人POST後に共有を別送しない                               |
| 共有開始/解除  | 所有/所属/version確認＋同entry作成/再有効化、またはwithdrawn。原本を保持           |
| 原本編集/削除  | 本人/version確認＋原本/sharedの版更新、または論理削除/共有終了。snapshotは触らない |
| proxy変更      | 所属/kind/version確認＋entry/data変更。個人原本へ書かない                          |
| 退出/解除      | 有効sharedを同IDのsnapshotにし公開値保存＋member終了。個人/家族の合計維持          |
| archive        | 全sharedをsnapshot化＋active memberをarchived＋全招待失効＋家族終了                |
| 承諾           | 招待/所属/slot再検証＋member追加＋招待消費＋冪等結果                               |
| 管理者交代     | 役割切替＋未使用招待失効＋household version更新                                    |

所有者に関する共有/原本更新/退出はuser→household→原本→entry、承諾はuser→household→invitationの順でロック。proxy更新/招待発行はhouseholdから始め、後でuserロックを要求しない。交代は家族ロック、archiveは最後の1人のuserを先に取得する。

ロック後にactive/所属/所有/権限を再確認し、必要な操作では原本とentryの両versionを要求する。所属追加/退出/解除/交代/archiveでhousehold versionも進める。archiveはロック後も1人条件を再確認し、閲覧者は終了時archivedの人だけ。deadlock/直列化再試行は冪等性と組み合わせる。

## API固有の注意

全APIはFirebase Bearer認証。詳細path/入出力はOpenAPIを必要箇所だけ読む。家族permissionはUI表示用であり、Storeが必ず認可する。

- 原本は本人用APIで編集し、家族の汎用PATCHは作らない。家族detailの`source_transaction_id`は所有者だけ。他の家族はedit/delete/unshare不可。proxy APIにshared IDを渡しても拒否する。
- member DTOは表示名/状態を返し、メール/Firebase UID/個人payment等は返さない。snapshotにはcaptured/corrected/excluded情報を付ける。
- 家族参照の使用後は名前/カテゴリ/支払条件の変更を拒否し、active=falseだけ許可。新項目を作って旧項目を無効化する。
- 家族用の入力先既定値はactive所属中だけ設定可能。退出/解除/archiveでpersonalへ戻し、取得失敗/確認中に家族へ切り替えない。

### 招待の秘密と再送

コードは32種の文字から10文字（表示例`ABCDE-FGHJK`）、リンクtokenは別256bit乱数。DBは秘密鍵HMAC等の照合値だけを保存し、鍵管理/更新を確認する。家族ロック下でactive人数＋有効招待を空き枠内に制限する。rate limitは複数APIでも成立させ、信頼するproxy headerを確認する。

秘密は発行レスポンスで1度だけ返し、一覧/冪等結果へ保存しない。受信失敗は一覧確認後に再発行。同じ発行キーの再送は409 `INVITATION_ALREADY_ISSUED`、同じ承諾キーは本人へ成功結果を再返却する。previewのIDだけでacceptできず、秘密を再照合する。

参加リンクは`/family/join#<token>`。公開routeでfragmentを除去し保護routeへ移る。ログイン跨ぎは短時間sessionStorageに退避し、復帰後削除。APIへはPOST bodyで送り、path/query/ログ/分析/例外へ秘密を載せない。GET/プレビューは消費しない。

### エラーと互換性

既存v1の`status/code/message`を使用。401未認証、403閲覧可能だが操作不可、404閲覧権限なし、400型不正、422業務入力、409競合、429試行超過。招待無効/期限切れ/取消は受取人に共通422 `INVITATION_UNAVAILABLE`。詳細は管理者一覧で確認する。

409は`VERSION_CONFLICT`・`HOUSEHOLD_FULL`・`ALREADY_IN_HOUSEHOLD`・`INVITATION_LIMIT_REACHED`・`SOURCE_ALREADY_SNAPSHOTTED`・`IDEMPOTENCY_CONFLICT`等。UIはcodeで案内しDBエラーを出さない。既存入力制約（1〜9,999,999円、名称1〜32文字等）を維持する。

旧path/JSON/statusを維持。既存v1のexpected_versionは移行期は省略可能、React新フォームと新家族変更APIは必須。旧APIを含む全原本書き込みで版を進め共有整合性を保つ。旧クライアントの無条件更新には競合検出を保証せず、所有/退出ロックは保証する。全面的な競合検出には旧API廃止の別計画が必要。

## 移行・公開

1. 追加DDL/設定/version/論理削除を再実行可能なmigrationで導入。既存原本は非共有、家族参照は空、個人設定の所有者は移さない。
2. 旧/v1の全読み書きへ論理削除/共有処理を適用。GORM scope任せにせずTable/Raw/集計/候補/CSV/定期生成を確認し物理DELETEを残さない。
3. 契約/生成物を同期し、公開前に全API instanceを互換処理へ更新する。
4. Reactはpersonal初期値、明示作成/招待で開始。退出/控え/旧API整合まで完成後に公開する。
5. migration前後の原本件数・user/月別signed sum・参照整合・共有0件を確認。再実行で重複しないことも確認する。

公開停止/互換APIへ切り戻せるようにする。家族データ/論理削除開始後に共有を知らない旧binaryへ戻さず控えを保持する。事前backup/復元手順を確認する。CockroachDBのpartial index・lock・制約・直列化再試行は実環境相当で確認し、PostgreSQLの成功を代用しない。

## 検証対象

[最小検証方針](DEVELOPMENT.md#検証)に従い、変更に該当する契約だけ選ぶ。次の一覧は毎回全てを実行する指示ではない。UI操作は必要箇所を手動確認する。

- 認可行列（本人/家族/管理者/部外者/退出者）、非共有原本の非公開、他家族参照の拒否、個人ID漏れ防止。
- 招待の二重使用/code-link競合/期限/取消/交代、同時作成/参加の1所属・3人制限、失敗時の非消費。
- proxyで個人を書かないこと、共有作成の原子性、本人更新/削除と退出の競合・再試行、控えと原本の分離/合計維持、旧API整合。
- 月跨ぎ・category変更時のsubcategory解除・人物合計・控え訂正/除外、解除/再共有・snapshot再共有拒否、冪等payload競合。
- キャッシュの保存境界・退出/ログアウト破棄・遅延結果・入力先同期、migration再実行/既存保持・FK/CHECK/partial unique・全個人集計の論理削除。

Reactは関連テストを指定し、OpenAPI・型・色・buildは影響時だけ確認する。Goの検証は明示的に作業対象の場合だけ当該リポジトリ方針に従い、対象package/ケースに絞る。DB結合が必要なら専用DBと`MIGRATION_TEST_POSTGRES_DSN`を使い、未設定skipを成功扱いしない。一時API/DB/Emulator等は終了時に片付ける。

## 記録済み成果と制約

2026-09-29: Reactの家族設定/参加/入力先/共有/代理/一覧/集計、Goの所属/招待/参照/共有/代理/控えを実装。OpenAPI/生成物を同期し個人一覧をv1へ移行。v2インポートは未実装。

- 当時の検証: React型・30ファイル110テスト・OpenAPI 492 assertions・build成功。lintエラーなし、CSV既存3警告/bundle警告あり。Orval 188ファイルの再生成一致。
- Goのgofmt/vet/全テスト/build、専用PostgreSQL 17のmigration/Store結合が成功（skipなし）。過去の結果であり、今後の全体実行指示ではない。
- 手動で作成/既定値/入力切替の値保持/本人共有/代理/個人合計/原本反映/code参加/他人原本の閲覧専用/代理共同編集/モバイル入力一覧を確認。控え/訂正/除外/archive/再参加/無効招待/同時承諾はAPI/DB契約で確認。未認証リンクからの復帰と全退出操作の画面確認は未実施。
- 利用者DBへのmigration/本番配備は未実施。`HOUSEHOLD_INVITATION_SECRET`（32byte以上）とCockroachDB実環境相当の検証が公開前に必要。
- 一覧は100件/page、集計/重複候補は月の全pageを走査し明細投影に追加queryあり。大量データ性能・SQL集計、冪等データの保存期間/掃除は運用課題。
