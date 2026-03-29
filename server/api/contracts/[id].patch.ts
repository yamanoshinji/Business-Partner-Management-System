import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { contracts, members } from '../../db/schema'
import type { ContractInput } from '../../utils/contract'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const contractId = parseUuid(getRouterParam(event, 'id'), '契約ID')
    const body = await readBody<Partial<ContractInput>>(event)

    let memberId: string | undefined
    if (body.memberId !== undefined) {
      memberId = parseUuid(body.memberId, '担当者ID')
      const [member] = await db.select({ id: members.id }).from(members).where(eq(members.id, memberId)).limit(1)
      if (!member) {
        throw createError({ statusCode: 404, statusMessage: '担当者が見つかりません' })
      }
    }

    const startDate = body.startDate === undefined ? undefined : parseOptionalDateString(body.startDate, '契約開始日')
    const endDate = body.endDate === undefined ? undefined : parseOptionalDateString(body.endDate, '契約終了日')

    const updateValues = {
      memberId,
      startDate,
      endDate,
      alertDate: endDate === undefined ? undefined : calculateAlertDate(endDate),
      note: body.note === undefined ? undefined : parseOptionalString(body.note, '備考'),
      updatedAt: new Date(),
    }

    const [updatedContract] = await db.update(contracts).set(updateValues).where(eq(contracts.id, contractId)).returning()

    if (!updatedContract) {
      throw createError({ statusCode: 404, statusMessage: '契約が見つかりません' })
    }

    return updatedContract
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '契約の更新に失敗しました' })
  }
})