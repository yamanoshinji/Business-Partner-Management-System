type LoginRequestBody = {
  username?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginRequestBody>(event)
  const username = parseRequiredString(body.username, 'ユーザー名')
  const password = parseRequiredString(body.password, 'パスワード')
  const adminCredentials = getAdminCredentials()

  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    throw createError({ statusCode: 401, statusMessage: 'ユーザー名またはパスワードが正しくありません' })
  }

  await setUserSession(event, {
    user: buildAdminUser(username),
  })

  return { ok: true }
})