import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { contracts } from '../../../db/schema'

type ContractStatusRequestBody = {
  status?: unknown
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const contractId = parseUuid(getRouterParam(event, 'id'), '契約ID')
    const body = await readBody<ContractStatusRequestBody>(event)
    const nextStatus = parseContractStatus(body.status, 'ステータス')
    const [currentContract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1)

    if (!currentContract) {
      throw createError({ statusCode: 404, statusMessage: '契約が見つかりません' })
    }

    validateStatusTransition(currentContract.status, nextStatus)

    const [updatedContract] = await db.update(contracts).set({
      status: nextStatus,
      updatedAt: new Date(),
    }).where(eq(contracts.id, contractId)).returning()

    return updatedContract
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: 'ステータス更新に失敗しました' })
  }
})