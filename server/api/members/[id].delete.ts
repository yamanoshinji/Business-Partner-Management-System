import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { members } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const memberId = parseUuid(getRouterParam(event, 'id'), '担当者ID')
    const [deletedMember] = await db.delete(members).where(eq(members.id, memberId)).returning()

    if (!deletedMember) {
      throw createError({ statusCode: 404, statusMessage: '担当者が見つかりません' })
    }

    return { ok: true }
  } catch (error: unknown) {
    const postgresError = error as { code?: string }
    if (postgresError.code === '23503') {
      throw createError({ statusCode: 409, statusMessage: '契約が紐づいているため削除できません' })
    }

    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '担当者の削除に失敗しました' })
  }
})