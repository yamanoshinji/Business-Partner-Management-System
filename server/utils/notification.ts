import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { companies, contracts, members, notifications } from '../db/schema'

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { start, end }
}

export async function generateDueNotifications(today: Date = new Date()): Promise<void> {
  const todayText = formatDate(today)
  const dueContracts = await db
    .select({
      contractId: contracts.id,
      endDate: contracts.endDate,
      memberName: members.name,
      companyName: companies.name,
    })
    .from(contracts)
    .innerJoin(members, eq(contracts.memberId, members.id))
    .innerJoin(companies, eq(members.companyId, companies.id))
    .where(eq(contracts.alertDate, todayText))

  const dayRange = getDayRange(today)

  for (const contract of dueContracts) {
    const [existingNotification] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.contractId, contract.contractId),
        gte(notifications.triggeredAt, dayRange.start),
        lte(notifications.triggeredAt, dayRange.end),
      ))
      .limit(1)

    if (existingNotification) {
      continue
    }

    await db.insert(notifications).values({
      contractId: contract.contractId,
      message: `「${contract.memberName}」(${contract.companyName}) の契約が ${contract.endDate} に終了します。手続きを確認してください。`,
    })
  }
}

export async function listNotifications(): Promise<typeof notifications.$inferSelect[]> {
  await generateDueNotifications()
  return db.select().from(notifications).orderBy(desc(notifications.triggeredAt))
}