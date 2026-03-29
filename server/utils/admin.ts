export type SessionUser = {
  id: string
  name: string
  role: 'ADMIN'
  username: string
}

export function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    throw createError({
      statusCode: 500,
      statusMessage: '管理者ログイン情報が未設定です。.env を確認してください',
    })
  }

  return { username, password }
}

export function buildAdminUser(username: string): SessionUser {
  return {
    id: 'admin',
    name: '管理者',
    role: 'ADMIN',
    username,
  }
}