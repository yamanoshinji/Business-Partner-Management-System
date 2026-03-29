import { drizzle } from 'drizzle-orm/node-postgres'
import pkg from 'pg'
import * as schema from './schema'

const { Pool } = pkg

// 環境変数から接続設定を読み込む（ハードコーディング禁止）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })
