import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { members } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const memberId = parseUuid(getRouterParam(event, 'id'), '担当者ID')
    const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)

    if (!member) {
      throw createError({ statusCode: 404, statusMessage: '担当者が見つかりません' })
    }

    return member
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '担当者詳細の取得に失敗しました' })
  }
})