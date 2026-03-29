import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { contracts, members } from '../../db/schema'
import type { ContractInput } from '../../utils/contract'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody<ContractInput>(event)
    const memberId = parseUuid(body.memberId, '担当者ID')
    const [member] = await db.select({ id: members.id }).from(members).where(eq(members.id, memberId)).limit(1)

    if (!member) {
      throw createError({ statusCode: 404, statusMessage: '担当者が見つかりません' })
    }

    const startDate = parseOptionalDateString(body.startDate, '契約開始日')
    const endDate = parseOptionalDateString(body.endDate, '契約終了日')

    if (!startDate || !endDate) {
      throw createError({ statusCode: 400, statusMessage: '契約開始日と契約終了日は必須です' })
    }

    const [createdContract] = await db.insert(contracts).values({
      memberId,
      startDate,
      endDate,
      status: body.status ? parseContractStatus(body.status, 'ステータス') : 'NOT_STARTED',
      alertDate: calculateAlertDate(endDate),
      note: parseOptionalString(body.note, '備考'),
    }).returning()

    return createdContract
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '契約の作成に失敗しました' })
  }
})