export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const session = await getUserSession(event)
  return session.user ?? null
})