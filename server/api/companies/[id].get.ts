import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const companyId = parseUuid(getRouterParam(event, 'id'), '企業ID')
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1)

    if (!company) {
      throw createError({ statusCode: 404, statusMessage: '企業が見つかりません' })
    }

    return company
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '企業詳細の取得に失敗しました' })
  }
})