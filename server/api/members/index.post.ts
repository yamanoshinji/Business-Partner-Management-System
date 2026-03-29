import type { MemberInput } from '../../../shared/types/member'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies, members } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody<MemberInput>(event)
    const companyId = parseUuid(body.companyId, '企業ID')
    const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1)

    if (!company) {
      throw createError({ statusCode: 404, statusMessage: '企業が見つかりません' })
    }

    const [createdMember] = await db.insert(members).values({
      companyId,
      name: parseRequiredString(body.name, '氏名'),
      nameKana: parseOptionalString(body.nameKana, '氏名カナ'),
      role: parseOptionalString(body.role, '担当役割'),
      note: parseOptionalString(body.note, '備考'),
    }).returning()

    return createdMember
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '担当者の作成に失敗しました' })
  }
})