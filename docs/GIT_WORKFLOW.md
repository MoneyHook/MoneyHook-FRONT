# Git Workflow

## 基本ルール

- 明示依頼がなければbranch作成・commit・push・PR・tag操作を行わない。
- `main`（リリース済み）と`develop`（次回統合先）へ直接commit/push・force pushしない。変更はPRで取り込む。
- 1 branch/PRは1目的、1 commitは1論理変更。秘密情報・`.env.local`・ログ・build成果物を含めない。

## Branch

通常は`develop`から作業branchを作り、`develop`向けPRにする。名前は`<type>/<english-kebab-case-summary>`。summaryは具体的な小文字英数字とhyphenだけで、曖昧な`update`・`bug`を避ける。

type例: `feature`、`fix`、`docs`、`refactor`、`chore`。releaseは`release/v1-2-0`、本番緊急修正は`main`から`hotfix/login-failure`の形式。

## Commit・PR

Conventional Commits形式でtype/scopeは英語、説明は具体的な日本語にする。PRタイトルも同形式。

```text
<type>(<optional-scope>): <具体的な変更内容>
feat(transactions): 取引登録フォームと入力検証を追加
```

typeは`feat`・`fix`・`docs`・`refactor`・`test`・`chore`・`build`・`ci`。scopeは対象領域の補足が必要な場合だけ。「更新」「修正」「作業」だけで終わらせない。

PR本文は日本語で「変更概要」「影響範囲」「実行した確認」「未実行または失敗した確認」（なければ「なし」）を含める。理由や制約も必要に応じて記載する。

[最小限のローカル検証](DEVELOPMENT.md#検証)を選び、結果を記録する。有効なrequired checksはすべて成功させる。conflict・意図しない差分を除き、squash merge後に作業branchを削除する。

## Release・Hotfix

versionはSemVer（MAJOR: 非互換、MINOR: 互換機能追加、PATCH: バグ修正）。

- Release: `develop`→release branch→version更新（pnpmがlockfileを変更した場合は含める）→`develop`向けPR→`develop`から`main`へPR→required checks成功後squash merge→release commitに`v1.2.0`形式のtag。
- Hotfix: `main`→hotfix branch→修正とPATCH更新→`main`向けPR→required checks成功後squash merge/tag→`main`から`develop`へPRで修正・versionを反映する。

通常開発を`main`起点にしない。
