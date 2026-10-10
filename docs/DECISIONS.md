# 設計判断の理由

仕様は[PRODUCT](PRODUCT.md)、実装ルールは[ARCHITECTURE](ARCHITECTURE.md)を正本とし、ここには理由だけを残す。

- 4つの個人用ナビゲーションとモバイル/デスクトップの切り替え: 主要操作への到達性を保つ。
- vertical sliceと一方向の依存・page合成: 空featureや将来用抽象化を増やさず、機能を独立して変更できるようにする。
- TanStack Queryと限定的な永続キャッシュ: 取得・更新を一元化し、再訪・障害時の表示を補助しながらAPIを正本に保つ。
- デフォルト支払方法の端末内保存: 新規入力の選択を保持する。入力先デフォルトは端末間同期が必要なためAPI保存。
- URL Search Params: reload・履歴・URL共有で画面条件を再現する。
- Firebaseの認証通知: token更新を含む状態を二重管理しない。
- OpenAPI/Orvalと共通ApiError: request/responseの型ずれと、endpointごとのエラー形式のUIへの流出を防ぐ。
- string ID・整数円・タイムゾーンなしの日付: 精度損失と境界での意味の変化を避ける。
- semantic color tokenと色以外の状態表現: light/darkの一貫性とアクセシビリティを保つ。
- Recharts: React・shadcn/ui Chart・既存chart tokenとの親和性。
- 対象を絞った検証: 変更に関係する契約を確認し、無関係な全体実行と結果出力を減らす。
