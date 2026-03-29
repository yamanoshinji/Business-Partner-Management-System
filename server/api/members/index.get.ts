import { desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { members } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const query = getQuery(event)
    const companyId = query.companyId === undefined ? undefined : parseUuid(query.companyId, '企業ID')

    if (companyId) {
      return await db.select().from(members).where(eq(members.companyId, companyId)).orderBy(desc(members.createdAt))
    }

    return await db.select().from(members).orderBy(desc(members.createdAt))
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '担当者一覧の取得に失敗しました' })
  }
})