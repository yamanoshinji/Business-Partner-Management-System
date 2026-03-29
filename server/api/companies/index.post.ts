import type { CompanyInput } from '../../../shared/types/company'
import { db } from '../../db'
import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody<CompanyInput>(event)

    const [createdCompany] = await db.insert(companies).values({
      name: parseRequiredString(body.name, '企業名'),
      nameKana: parseOptionalString(body.nameKana, '企業名カナ'),
      homepage: parseOptionalString(body.homepage, 'ホームページ'),
      article36ExpiryDate: parseOptionalDateString(body.article36ExpiryDate, '36協定有効期限日'),
      note: parseOptionalString(body.note, '備考'),
    }).returning()

    return createdCompany
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '企業の作成に失敗しました' })
  }
})