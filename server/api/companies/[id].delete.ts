import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const companyId = parseUuid(getRouterParam(event, 'id'), '企業ID')
    const [deletedCompany] = await db.delete(companies).where(eq(companies.id, companyId)).returning()

    if (!deletedCompany) {
      throw createError({ statusCode: 404, statusMessage: '企業が見つかりません' })
    }

    return { ok: true }
  } catch (error: unknown) {
    const postgresError = error as { code?: string }
    if (postgresError.code === '23503') {
      throw createError({ statusCode: 409, statusMessage: '担当者が紐づいているため削除できません' })
    }

    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '企業の削除に失敗しました' })
  }
})