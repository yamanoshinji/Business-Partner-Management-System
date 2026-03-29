import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { notifications } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const notificationId = parseUuid(getRouterParam(event, 'id'), '通知ID')
    const [updatedNotification] = await db.update(notifications).set({
      isRead: true,
    }).where(eq(notifications.id, notificationId)).returning()

    if (!updatedNotification) {
      throw createError({ statusCode: 404, statusMessage: '通知が見つかりません' })
    }

    return updatedNotification
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '通知の既読更新に失敗しました' })
  }
})