import { desc } from 'drizzle-orm'
import { db } from '../../db'
import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    return await db.select().from(companies).orderBy(desc(companies.createdAt))
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '企業一覧の取得に失敗しました' })
  }
})