---
name: git-pr-workflow
description: MoneyHooks Reactの現在の変更を運用規約に沿うブランチへ整理し、論理単位でコミットを分け、検証結果を記載したdevelop向けGitHub PRを作成する。明示的にbranch・commit・push・PRまで依頼されたときに使う。
---

# Git変更整理とPR作成

MoneyHooks Reactの現在の作業ツリーを、レビュー可能なコミット列と`develop`向けのGitHub PRへ整理する。通常の実装依頼で自動的にbranch、commit、push、PRを実行してはいけない。このスキルを明示的に呼び出した依頼だけを対象にする。

## 実行前に確認する

1. 現在のリポジトリのルートで作業していることを確認する。Go APIリポジトリや別のリポジトリへ変更を加えない。
2. 次の資料を必要な範囲で読み、既存の指示を優先する。
   - `AGENTS.md`
   - `docs/GIT_WORKFLOW.md`
   - `docs/DEVELOPMENT.md`
3. `git status --short --branch`、`git diff`、`git diff --cached`、未追跡ファイル、現在のbranch固有のcommitを確認する。
4. `git fetch origin develop`で`origin/develop`を更新する。fetch、認証、ネットワークに失敗した場合は、推測でbaseを決めず停止する。
5. 対象変更の目的、影響範囲、必要な検証を確定する。複数の無関係な目的が混在していて、どの変更を今回のPRに含めるか判定できない場合は停止し、変更を混ぜない。

## branchを決める

- 通常のbaseは最新の`origin/develop`とする。`main`や`develop`へ直接commitしない。
- branch名は`<type>/<english-kebab-case-summary>`にする。`type`は変更の主目的に合わせて`feature`、`fix`、`refactor`、`docs`、`chore`、`build`、`ci`、`test`から選び、summaryは小文字英数字とhyphenだけで具体的に表す。
- 現在のbranchが`main`または`develop`で、変更が未commitだけなら、未追跡ファイルを含めて安全に一時退避し、`origin/develop`から新branchを作って変更を戻す。復元時に競合したら変更を捨てずに停止する。
- 現在の非base branchにある既存commitと未commit変更の目的が一致する場合は、そのbranchを再利用する。既存commitをrebase、reset、amend、削除しない。
- 非base branchに無関係または目的不明の既存commitがある場合は、履歴を付け替えず停止する。無関係なcommitを含むPRを作らない。
- 同名のlocalまたはremote branchが存在する場合は、目的と履歴を確認して同じ作業だと判断できるときだけ再利用する。別目的なら名前を勝手に流用せず停止する。
- `gh pr list --head <branch> --state open`で既存PRを確認する。`develop`向けのopen PRがあれば重複作成せず、そのPRを検証結果とともに報告する。別baseのPRがあれば停止する。

## commitを論理単位に分ける

- 1 commitは1つのレビュー可能な論理変更にする。ファイル単位や行数単位で機械的に分割しない。
- 実装、対応するテスト、ドキュメント、設定、生成コードは、それぞれ独立してレビューできる場合に分ける。依存関係があり分離すると成立しないテストは、対応する実装と同じ論理commitに含める。
- 同じファイルに複数の目的が混在する場合はhunk単位でstageし、対象外の変更をcommitに含めない。既存の未commit変更や未追跡ファイルを削除しない。
- 各commitの直前に`git diff --cached`と`git diff --cached --check`を確認し、意図した差分だけをstageする。
- commit messageは次の形式にする。typeとscopeは英語の識別子、説明は具体的な日本語にする。

  ```text
  <type>(<optional-scope>): <日本語による具体的な変更内容>
  ```

- 「更新」「修正」「作業」だけで終わる説明を避ける。既存commitを書き換えず、検証で見つかった追加修正は新しい論理commitとして積む。
- commit順は、依存する実装が先、対応するテスト・ドキュメント・設定が後になるようにする。各commitの目的と含めなかった変更を作業中に記録する。

## 検証する

変更範囲に応じて次を選び、実行したコマンドと結果をPR本文に正確に記録する。`lint:fix`や全体formatなど、無関係な差分を大量に作る自動修正は実行しない。

- TypeScript・Reactの変更: `pnpm typecheck`
- source、設定、classの変更: `pnpm lint`
- 挙動やコンポーネントの変更: `pnpm test`。可能なら対象を絞ったテストを先に実行する。
- routing、build設定、依存関係、広範囲の変更: `pnpm build`
- OpenAPI契約や生成クライアントの変更: `pnpm api:check`、必要に応じて`pnpm contract:test`
- 認証・外部API・ブラウザフローの変更: EmulatorやAPIが利用可能な場合だけ`pnpm e2e`
- 常に`git diff --check`と、`origin/develop...HEAD`の最終差分を確認する。

検証が失敗したら、依頼範囲内の原因だけを修正し、修正を別commitとして積んで再検証する。未解決、範囲外、環境依存の失敗が残る場合はpushとPR作成を行わず停止する。失敗を隠したままPRを作成しない。

## pushとPRを作成する

検証が成功し、対象変更がすべてcommitされ、対象外の変更や未追跡ファイルを誤ってcommitに含めていないことを確認してから実行する。対象外の変更は削除せず、作業ツリーに残してよい。

1. `gh auth status`でGitHub認証を確認する。認証できない場合は停止する。
2. `git diff --check`、`git diff --cached --check`、`git status --short`、`git log origin/develop..HEAD --oneline`、`git diff origin/develop...HEAD --stat`を最終確認する。
3. `git push --set-upstream origin <branch>`で通常pushする。force pushは使わない。
4. PRタイトルは全体の目的を表すConventional Commits形式にする。複数commitがあっても、PRタイトルは個別commitの羅列にしない。
5. `gh pr create --base develop --head <branch>`でReady PRを作成する。PR本文は日本語で、次の見出しを必ず含める。

   ```markdown
   ## 変更概要
   ## 影響範囲
   ## 実行した確認
   ## 未実行または失敗した確認
   ```

6. `gh pr view`でPRのURL、base、head、初期のcheck状態を確認し、ユーザーへ報告する。PRのmerge、Ready状態の変更、branch削除は行わない。

## 安全上の禁止事項

- `main`・`develop`への直接commitまたはpush
- `git reset --hard`、`git checkout --`、force push、確認なしのrebase・履歴削除
- 無関係な変更、秘密情報、`.env.local`、ログ、build成果物のcommit
- 検証失敗を隠したpushまたはPR作成
- MoneyHooks Reactの依頼に含まれていない別リポジトリの変更
