import { createRequire } from 'node:module'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { companies, members, contracts, organizations } from '../../db/schema'
import { parseExcelRowRaw, aggregateImportData, type ExcelRowRaw, type ParsedExcelRow } from '../../utils/import'
import { calculateAlertDate } from '../../utils/alert'

const require = createRequire(import.meta.url)
const { read, utils } = require('xlsx') as typeof import('xlsx')

type ImportResponse = {
  success: true
  stats: {
    companiesCreated: number
    membersCreated: number
    contractsCreated: number
    organizationsCreated: number
  }
} | {
  success: false
  errors: Array<{ rowNumber: number; field: string; message: string }>
}

export default defineEventHandler(async (event): Promise<ImportResponse> => {
  await requireAuth(event)

  try {
    // ファイルを取得
    const form = await readFormData(event)
    const file = form.get('file') as File
    if (!file) {
      throw createError({ statusCode: 400, statusMessage: 'ファイルが指定されていません' })
    }

    // ファイルを Buffer に変換
    const buffer = await file.arrayBuffer()

    // xlsx を読み込む
    const workbook = read(buffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!worksheet) {
      throw createError({ statusCode: 400, statusMessage: 'シートが見つかりません' })
    }

    // シート全体をJSON配列に変換
    const rows = utils.sheet_to_json(worksheet, { header: 'A' }) as Record<string, unknown>[]

    // 見出し行をスキップ（5行目がヘッダ、6行目以降がデータ）
    const dataRows = rows.slice(5) // 0-indexed, 6行目は index 5

    if (dataRows.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'データ行がありません' })
    }

    // 各行をパース（エラーハンドリング）
    const parsedRows: ParsedExcelRow[] = []
    const parseErrors: ImportResponse['errors'] = []
    for (let idx = 0; idx < dataRows.length; idx++) {
      const rawRow = dataRows[idx]
      const rowNumber = 6 + idx
      try {
        const excelRow: ExcelRowRaw = {
          employeeId: rawRow.A,
          companyName: rawRow.B,
          memberName: rawRow.C,
          memberNameKana: rawRow.D,
          role: rawRow.E,
          hireDate: rawRow.F,
          location: rawRow.G,
          department: rawRow.H,
          group: rawRow.I,
          // J: exitDate (skip)
          startDate: rawRow.K,
          endDate: rawRow.L,
        }
        parsedRows.push(parseExcelRowRaw(excelRow, rowNumber))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        parseErrors.push({
          rowNumber,
          field: 'parsing',
          message,
        })
      }
    }
    if (parseErrors.length > 0) {
      return {
        success: false,
        errors: parseErrors,
      }
    }

    // データを集約
    const importData = aggregateImportData(parsedRows)

    if (importData.errors.length > 0) {
      return {
        success: false,
        errors: importData.errors,
      }
    }

    // トランザクション内で insert
    return await db.transaction(async (trx) => {
      const stats = {
        companiesCreated: 0,
        membersCreated: 0,
        contractsCreated: 0,
        organizationsCreated: 0,
      }

      // 1. 会社を insert（既存なら skip）
      const companyMap = new Map<string, string>()
      for (const item of importData.companyInputs) {
        // 既存チェック
        const [existing] = await trx
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.name, item.name))
          .limit(1)

        if (existing) {
          companyMap.set(item.name, existing.id)
        } else {
          const [created] = await trx
            .insert(companies)
            .values(item.input)
            .returning()
          companyMap.set(item.name, created.id)
          stats.companiesCreated++
        }
      }

      // 2. 組織を insert（既存なら skip）
      const organizationMap = new Map<string, string>()
      for (const item of importData.organizationInputs) {
        // 既存チェック
        const [existing] = await trx
          .select({ id: organizations.id })
          .from(organizations)
          .where(and(
            eq(organizations.department, item.input.department),
            eq(organizations.group, item.input.group),
            eq(organizations.location, item.input.location),
          ))
          .limit(1)

        if (existing) {
          organizationMap.set(item.key, existing.id)
        } else {
          const [created] = await trx
            .insert(organizations)
            .values(item.input)
            .returning()
          organizationMap.set(item.key, created.id)
          stats.organizationsCreated++
        }
      }

      // 3. 担当者を insert
      const memberMap = new Map<number, string>()
      for (let i = 0; i < importData.memberInputs.length; i++) {
        const item = importData.memberInputs[i]
        const companyId = Array.from(companyMap.entries()).find(([name]) => name === parsedRows[i].companyName)?.[1]
        if (!companyId) {
          throw createError({ statusCode: 500, statusMessage: `会社 ${parsedRows[i].companyName} の ID 解決に失敗` })
        }

        const orgKey = `${parsedRows[i].organization.department}|${parsedRows[i].organization.group}|${parsedRows[i].organization.location}`
        const organizationId = organizationMap.get(orgKey)

        const [created] = await trx
          .insert(members)
          .values({
            companyId,
            employeeId: parsedRows[i].employeeId,
            name: item.input.name,
            nameKana: item.input.nameKana,
            role: item.input.role,
            hireDate: parsedRows[i].hireDate,
            organizationId,
            note: item.input.note,
          })
          .returning()
        memberMap.set(i, created.id)
        stats.membersCreated++
      }

      // 4. 契約を insert
      for (let i = 0; i < importData.contractInputs.length; i++) {
        const item = importData.contractInputs[i]
        const memberId = memberMap.get(i)
        if (!memberId) {
          throw createError({ statusCode: 500, statusMessage: `担当者 ${i} の ID 解決に失敗` })
        }

        await trx
          .insert(contracts)
          .values({
            memberId,
            startDate: item.input.startDate,
            endDate: item.input.endDate,
            status: 'NOT_STARTED',
            alertDate: calculateAlertDate(item.input.endDate),
            note: item.input.note,
          })
          .returning()
        stats.contractsCreated++
      }

      return {
        success: true,
        stats,
      }
    })
  } catch (error) {
    rethrowHttpError(error)
    throw createError({ statusCode: 500, statusMessage: '初期データの取込に失敗しました' })
  }
})
