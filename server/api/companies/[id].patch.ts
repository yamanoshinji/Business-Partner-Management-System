import type { CompanyInput } from '../../../shared/types/company'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const companyId = parseUuid(getRouterParam(event, 'id'), '企業ID')
    const body = await readBody<Partial<CompanyInput>>(event)

    const updateValues = {
      name: body.name === undefined ? undefined : parseRequiredString(body.name, '企業名'),
      nameKana: body.nameKana === undefined ? undefined : parseOptionalString(body.nameKana, '企業名カナ'),
      homepage: body.homepage === undefined ? undefined : parseOptionalString(body.homepage, 'ホームページ'),
      article36ExpiryDate: body.article36ExpiryDate === undefined
        ? undefined
        : parseOptionalDateString(body.article36ExpiryDate, '36協定有効期限日'),
      note: body.note === undefined ? undefined : parseOptionalString(body.note, '備考'),
      updatedAt: new Date(),
    }

    const [updatedCompany] = await db.update(companies).set(updateValues).where(eq(companies.id, companyId)).returning()

    if (!updatedCompany) {
      throw createError({ statusCode: 404, statusMessage: '企業が見つかりません' })
    }

    return updatedCompany
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '企業の更新に失敗しました' })
  }
})