# 協力会社員管理システム

社内管理者が協力会社員の情報・契約期間・契約手続きの進捗を一元管理し、契約更新の見落としをなくすシステムです。

現在は MVP 完了後の機能追加フェーズです。現行仕様は `docs/spec/product-spec.md` を参照してください。

## Database Setup

Initialize the database:

```bash
npm run db:generate  # スキーマ変更時のマイグレーション生成
npm run db:migrate   # マイグレーション実行
```

## 初期データ取込

### 概要
このシステムは、Excel ファイルから協力会社員の初期データを一括登録する機能を持っています。
現行仕様では標準機能として扱います。

### テスト

```bash
npm test  # Vitest でユニットテストを実行
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
