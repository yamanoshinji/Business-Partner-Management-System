# 協力会社員管理システム — GitHub Copilot 開発指示書

このファイルはワークスペース全体に常時適用される Copilot への指示書です。  
実装・レビュー・テスト生成のすべてにおいて、以下のルールを最優先で守ってください。

---

## プロジェクト概要

**目的**: 社内管理者が協力会社員の情報・契約期間・契約手続き進捗を一元管理し、契約終了の見落としを防ぐ。  
**仕様書**: `docs/spec/mvp-spec.md` を必ず参照すること。

---

## 技術スタック（変更禁止）

| 層 | 採用技術 |
|----|---------|
| フレームワーク | **Nuxt 3**（Vue 3 Composition API、`<script setup lang="ts">`） |
| 言語 | **TypeScript**（`strict: true`、`any` 禁止） |
| UI コンポーネント | **Material Design（Google）** |
| DB | **Postgres**（ローカル運用） |
| ORM | **Drizzle ORM** |
| 認証 | **nuxt-auth-utils** |
| テスト | **Vitest** |

> **WARNING**: 上記以外のライブラリを新たに追加する場合は、必ずコメントで理由を明示し、代替がないことを確認してから追加すること。勝手に追加しない。

---

## MVP スコープ（絶対守ること）

**含む機能のみ実装する**:
1. 企業情報 CRUD
2. 担当者情報 CRUD
3. 契約期間・契約手続きステータス管理
4. アプリ内アラート（alert_date 当日に通知生成）
5. 管理者認証（1 ロールのみ）

**以下は MVP 対象外 — 実装しないこと**:
- メール通知
- CSV 入出力
- 複数ロール・権限管理
- 監査ログ
- 本番デプロイ設定（Vercel, Docker 等）

> **MUST**: 仕様書に記載のない機能は、指示されても「MVP スコープ外です」と明示して実装しない。

---

## コーディング規約

### 全般

- TypeScript の `strict` モードを遵守する。`any` 型は使用禁止。
- `null` チェックを必ず行う。`!`（non-null assertion）の使用は禁止。
- 関数・変数名は英語、コメントは日本語で書く。
- マジックナンバー・マジック文字列は定数に切り出す。

### Nuxt 3 / Vue 3

- コンポーネントは `<script setup lang="ts">` を使用する（Options API 禁止）。
- API ルートは `server/api/` 以下に配置する。
- DB アクセスは必ず `server/` 内のみで行う（クライアント側での DB 直接アクセス禁止）。
- `composables/` に再利用ロジックを切り出す。ページコンポーネントは薄く保つ。
- ページコンポーネントは `pages/` 配下のみ、再利用コンポーネントは `components/` 配下のみに置く。

### Drizzle ORM

- スキーマ定義は `server/db/schema.ts` にまとめる。
- マイグレーションファイルは手動で編集しない。`drizzle-kit` のみで生成する。
- クエリは型安全に書く。生 SQL（`db.run(sql\`...\`)` 等）は必要最小限にとどめる。

### エラーハンドリング

- API ルートでは必ず try/catch を実装し、適切な HTTP ステータスコードを返す。
- クライアント側では `useAsyncData` / `useFetch` のエラー状態を必ず処理する。
- エラーメッセージはユーザーに分かりやすい日本語で表示する。

### セキュリティ

- 入力値はサーバー側で必ずバリデーションする（クライアント側バリデーションのみは不可）。
- SQL インジェクション対策として、プレーンな文字列結合によるクエリ構築を禁止する。Drizzle ORM のクエリビルダーを使うこと。
- 認証チェックはすべての API ルートで実施する（`server/utils/auth.ts` のヘルパーを使用）。

---

## ディレクトリ構成

```
/
├── components/          # 再利用 Vue コンポーネント
├── composables/         # 再利用ロジック（useXxx）
├── pages/               # ルーティング対象ページ
├── server/
│   ├── api/             # API ルート（DB アクセスはここのみ）
│   ├── db/
│   │   ├── schema.ts    # Drizzle スキーマ定義
│   │   └── index.ts     # DB 接続
│   └── utils/           # サーバー側ユーティリティ
├── shared/
│   └── types/           # クライアント・サーバー共通の型定義
├── docs/
│   └── spec/
│       └── mvp-spec.md  # MVP 仕様書（常に参照すること）
└── drizzle/             # マイグレーションファイル（自動生成）
```

---

## 契約ステータス遷移ルール

```typescript
// shared/types/contract.ts に定義
export const CONTRACT_STATUS = [
  'NOT_STARTED',
  'ESTIMATE_REQUESTED',
  'ESTIMATE_RECEIVED',
  'DRAFT_CREATED',
  'DRAFT_CONFIRMED',
  'APPROVAL_CREATED',
  'CONTRACT_SENT',
  'CONTRACT_SIGNED',
  'CONTRACT_RECEIVED',
  'SENT_TO_MANAGEMENT',
  'COMPLETED',
] as const
```

- **自動切替**: `alert_date` 当日になったら `COMPLETED` → `NOT_STARTED` へサーバー側で自動切替する。
- **前進**: 現在のインデックス + 1 のみ許可（スキップ禁止）。
- **差し戻し**: 現在のインデックス - 1 のみ許可（`COMPLETED` からの差し戻しは禁止）。
- 上記以外の遷移は API でバリデーションエラーを返す。

---

## アラート日計算ルール

```
alert_date = end_date の 1 ヶ月前の月の「第 2 月曜日」
→ その日が祝日・土日なら翌平日にスライド
```

- 祝日判定は `holidays-jp` パッケージを使用する。
- フォールバック: 祝日データ取得失敗時はメモリキャッシュを使用。キャッシュもない場合は「祝日なし」として計算し、UI に警告を表示する。
- alert_date は契約保存時に自動計算して DB に保存する。

---

## テスト方針

- テストファイルは対象ファイルと同ディレクトリに `*.test.ts` として配置する。
- 各機能につき最低 **正常系 1 件 + 異常系 1 件** を書く。
- アラート日計算（`calculateAlertDate`）は以下の 2 ケースを必ずテストする:
  1. 第 2 月曜日が平日の場合
  2. 第 2 月曜日が祝日の場合（翌平日へのスライド）
- ステータス遷移バリデーションは「許可された遷移」「禁止された遷移」の両方をテストする。

---

## 禁止事項（MUST NOT）

- `any` 型の使用
- `!`（non-null assertion）の使用
- コンポーネント内での直接 DB アクセス
- MVPスコープ外の機能追加（指示があった場合もスコープ外を明示する）
- 既存テストを削除・スキップして通過させること（`it.skip` / `describe.skip`）
- 環境変数（パスワード等）をソースコードにハードコーディングすること
- 未使用の依存パッケージを追加すること
