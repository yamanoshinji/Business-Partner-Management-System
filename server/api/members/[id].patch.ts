import type { MemberInput } from '../../../shared/types/member'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies, members } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const memberId = parseUuid(getRouterParam(event, 'id'), '担当者ID')
    const body = await readBody<Partial<MemberInput>>(event)

    let companyId: string | undefined
    if (body.companyId !== undefined) {
      companyId = parseUuid(body.companyId, '企業ID')
      const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1)
      if (!company) {
        throw createError({ statusCode: 404, statusMessage: '企業が見つかりません' })
      }
    }

    const updateValues = {
      companyId,
      name: body.name === undefined ? undefined : parseRequiredString(body.name, '氏名'),
      nameKana: body.nameKana === undefined ? undefined : parseOptionalString(body.nameKana, '氏名カナ'),
      role: body.role === undefined ? undefined : parseOptionalString(body.role, '担当役割'),
      note: body.note === undefined ? undefined : parseOptionalString(body.note, '備考'),
      updatedAt: new Date(),
    }

    const [updatedMember] = await db.update(members).set(updateValues).where(eq(members.id, memberId)).returning()

    if (!updatedMember) {
      throw createError({ statusCode: 404, statusMessage: '担当者が見つかりません' })
    }

    return updatedMember
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '担当者の更新に失敗しました' })
  }
})