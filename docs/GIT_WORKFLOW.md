# MoneyHooks React Git Workflow

## 基本ルール

- `main`と`develop`へ直接commitまたはpushしない。変更は必ずPRで取り込む。
- `main`と`develop`へのforce pushは禁止する。
- 1つのbranchとPRには、1つの目的に関係する変更だけを含める。
- 秘密情報、`.env.local`、ログ、build成果物をcommitしない。
- 自動化されたエージェントは、ユーザーから明示的に依頼されない限り、branch作成、commit、push、PR作成、tag操作を行わない。

## Branch戦略

| Branch | 役割 |
|---|---|
| `main` | リリース済みの安定版 |
| `develop` | 次回リリースへ向けた変更の統合先 |

通常の機能追加、バグ修正、文書変更、refactorは`develop`から作業branchを作り、`develop`向けのPRで取り込みます。

### Branch名

形式は`<type>/<英語kebab-case-summary>`です。typeは用途別の接頭辞、summaryは変更内容を表す英語にします。summaryには小文字英数字とhyphenだけを使い、空白、日本語、underscoreを使いません。

| 種類 | 例 |
|---|---|
| 機能追加 | `feature/transaction-form` |
| バグ修正 | `fix/auth-redirect` |
| 文書 | `docs/local-setup` |
| Refactor | `refactor/api-error` |
| 保守作業 | `chore/update-dependencies` |
| Release準備 | `release/v1-2-0` |
| 緊急修正 | `hotfix/login-failure` |

branch名は変更内容が分かる具体的な語句にします。`feature/update`や`fix/bug`のような曖昧な名前は使用しません。

## Commit message

[Conventional Commits](https://www.conventionalcommits.org/)のtype分類を使い、次の形式にします。typeとscopeは英語の識別子、メッセージは日本語にします。

```text
<type>(<optional-scope>): <日本語による具体的な変更内容>
```

scopeは変更対象のfeatureや領域を補足する場合だけ付けます。

| Type | 用途 |
|---|---|
| `feat` | ユーザーに提供する機能の追加・変更 |
| `fix` | 不具合修正 |
| `docs` | 文書だけの変更 |
| `refactor` | 振る舞いを変えないコード構造の変更 |
| `test` | テストの追加・修正 |
| `chore` | 通常の保守作業 |
| `build` | dependencyやbuild設定の変更 |
| `ci` | CI設定の変更 |

例:

```text
feat(transactions): 取引登録フォームと入力検証を追加
fix(auth): ログアウト後にAPIキャッシュが残る問題を修正
docs: ローカル起動手順とGit運用ルールを整理
```

- 「更新」「修正」「作業」だけで終わらせず、何をどう変えたか記載する。
- 1 commitは1つの論理的変更にまとめる。
- commit messageは日本語で記載する。typeとscopeを除き、英語だけのメッセージにはしない。
- squash merge後のcommitになるため、PRタイトルも同じ形式にする。

## Pull Request

- 通常の作業branchは`develop`をbaseにする。
- PRタイトルはcommit messageと同じ`<type>(<optional-scope>): <日本語による具体的な変更内容>`形式にする。typeとscopeを除き、タイトルは日本語で記載する。
- PR本文は日本語で記載し、次の項目を必ず含める。
  - 変更概要
  - 影響範囲
  - 実行した確認
  - 未実行または失敗した確認（ない場合も「なし」と記載する）
- repositoryで有効なrequired checksをすべて通す。CI導入前は、変更範囲に応じたローカル検証結果をPRへ記載する。
- conflictを解消し、意図しないファイルや生成物が含まれていないことを確認する。
- squash mergeを使用し、merge後は作業branchを削除する。

## Release

versionは[Semantic Versioning](https://semver.org/)に従います。

- MAJOR: 後方互換性のない変更
- MINOR: 後方互換性のある機能追加
- PATCH: 後方互換性のあるバグ修正

Release手順:

1. `develop`から`release/v1-2-0`形式のbranchを作る。
2. `package.json`のversionを更新し、必要なrelease準備を行う。pnpmが`pnpm-lock.yaml`を更新した場合は、その差分も含める。
3. release branchから`develop`へPRを作成して取り込む。
4. `develop`から`main`へrelease PRを作成する。
5. required checks成功後にsquash mergeする。
6. `main`のrelease commitへ`v1.2.0`形式のtagを付ける。

## Hotfix

本番の緊急修正だけは`main`から`hotfix/<kebab-case-summary>`を作ります。

1. 修正とPATCH version更新をhotfix branchへ含める。
2. hotfix branchから`main`へPRを作成する。
3. required checks成功後にsquash mergeし、対応するversion tagを付ける。
4. `main`から`develop`へPRを作成し、修正とversionを反映する。

hotfix以外の変更をmain起点で開発しません。
