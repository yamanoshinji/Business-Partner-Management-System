import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { contracts } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const contractId = parseUuid(getRouterParam(event, 'id'), '契約ID')
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1)

    if (!contract) {
      throw createError({ statusCode: 404, statusMessage: '契約が見つかりません' })
    }

    return contract
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '契約詳細の取得に失敗しました' })
  }
})