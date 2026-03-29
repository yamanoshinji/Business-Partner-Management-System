import type { H3Event } from 'h3'

/**
 * 認証チェックユーティリティ（仕様書 §5 認証）
 * すべての API ルートでこの関数を呼び出すこと。
 * 未認証の場合は 401 エラーを throw する。
 */
export async function requireAuth(event: H3Event): Promise<void> {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: '認証が必要です' })
  }
}
