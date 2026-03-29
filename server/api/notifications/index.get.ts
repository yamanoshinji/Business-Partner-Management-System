export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    return await listNotifications()
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '通知一覧の取得に失敗しました' })
  }
})