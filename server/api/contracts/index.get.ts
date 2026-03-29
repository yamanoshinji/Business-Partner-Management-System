import { desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { contracts } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const query = getQuery(event)
    const memberId = query.memberId === undefined ? undefined : parseUuid(query.memberId, '担当者ID')

    if (memberId) {
      return await db.select().from(contracts).where(eq(contracts.memberId, memberId)).orderBy(desc(contracts.createdAt))
    }

    return await db.select().from(contracts).orderBy(desc(contracts.createdAt))
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '契約一覧の取得に失敗しました' })
  }
})