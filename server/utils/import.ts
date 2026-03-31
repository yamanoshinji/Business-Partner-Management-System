import type { CompanyInput } from '../../shared/types/company'
import type { MemberInput } from '../../shared/types/member'
import type { ContractInput } from './contract'
import { parseRequiredString, parseOptionalString, parseOptionalDateString } from './validation'

// ========== 型定義 ==========

export type ExcelRowRaw = {
  employeeId: unknown // A
  companyName: unknown // B
  memberName: unknown // C
  memberNameKana: unknown // D
  role: unknown // E
  hireDate: unknown // F
  location: unknown // G
  department: unknown // H
  group: unknown // I
  // J: exitDate (skip)
  startDate: unknown // K
  endDate: unknown // L
}

export type OrganizationInput = {
  department: string
  group: string
  location: string
}

export type ParsedExcelRow = {
  employeeId: string | null
  companyName: string
  memberName: string
  memberNameKana: string | null
  role: string | null
  hireDate: string | null
  organization: OrganizationInput
  startDate: string
  endDate: string
}

export type ImportContext = {
  companies: Map<string, string> // companyName -> id
  organizations: Map<string, string> // "department|group|location" -> id
  members: Array<{ companyId: string; name: string; id: string }>
}

export type ImportResult = {
  companyInputs: { name: string; input: CompanyInput }[]
  memberInputs: { companyId: string; input: MemberInput }[]
  contractInputs: { memberId: string; input: ContractInput }[]
  organizationInputs: { key: string; input: OrganizationInput }[]
  errors: ImportError[]
}

export type ImportError = {
  rowNumber: number
  field: string
  message: string
}

const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function parseYearMonthDay(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw createError({ statusCode: 400, statusMessage: '日付が不正です' })
  }

  return `${year}-${pad2(month)}-${pad2(day)}`
}

function normalizeExcelDate(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const utcDate = new Date(EXCEL_EPOCH_UTC_MS + Math.round(value) * ONE_DAY_MS)
    return formatUtcDate(utcDate)
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw createError({ statusCode: 400, statusMessage: `${label}の日付が不正です` })
    }
    return formatUtcDate(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const ymd = trimmed.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/)
    if (ymd) {
      const year = Number.parseInt(ymd[1], 10)
      const month = Number.parseInt(ymd[2], 10)
      const day = Number.parseInt(ymd[3], 10)
      return parseYearMonthDay(year, month, day)
    }

    const japaneseYmd = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
    if (japaneseYmd) {
      const year = Number.parseInt(japaneseYmd[1], 10)
      const month = Number.parseInt(japaneseYmd[2], 10)
      const day = Number.parseInt(japaneseYmd[3], 10)
      return parseYearMonthDay(year, month, day)
    }

    const maybeSerial = Number.parseInt(trimmed, 10)
    if (/^\d{5}$/.test(trimmed) && Number.isFinite(maybeSerial)) {
      const utcDate = new Date(EXCEL_EPOCH_UTC_MS + maybeSerial * ONE_DAY_MS)
      return formatUtcDate(utcDate)
    }

    const strict = parseOptionalDateString(trimmed, label)
    if (strict) {
      return strict
    }
  }

  throw createError({ statusCode: 400, statusMessage: `${label}は日付として解釈できません` })
}

function normalizeOptionalExcelText(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value === 'string') {
    return parseOptionalString(value, label)
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw createError({ statusCode: 400, statusMessage: `${label}が不正です` })
    }
    return String(value)
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  throw createError({ statusCode: 400, statusMessage: `${label}は文字列または数値で入力してください` })
}

// ========== パーサー ==========

/**
 * Excel 1行をパースして正規化された行オブジェクトへ変換する
 * @param row Excel1行分のデータ（各列の値）
 * @param rowNumber 行番号（エラー報告用）
 * @throws createError でバリデーション失敗
 */
export function parseExcelRowRaw(row: ExcelRowRaw, rowNumber: number): ParsedExcelRow {
  try {
    // 必須項目: memberName, companyName, startDate, endDate
    const companyName = parseRequiredString(row.companyName, '協力会社名')
    const memberName = parseRequiredString(row.memberName, '協力会社員氏名')
    const startDate = normalizeExcelDate(row.startDate, '現契約開始日')
    const endDate = normalizeExcelDate(row.endDate, '現契約終了日')

    if (!startDate || !endDate) {
      throw createError({ statusCode: 400, statusMessage: '契約開始日と契約終了日は必須です' })
    }

    // 任意項目
    const employeeId = normalizeOptionalExcelText(row.employeeId, '社員番号')
    const memberNameKana = parseOptionalString(row.memberNameKana, '氏名ふりがな')
    const role = parseOptionalString(row.role, '雇用形態')
    const hireDate = normalizeExcelDate(row.hireDate, '入場日')

    // 組織: department, group, location は必須
    const department = parseRequiredString(row.department, '受入管理部門')
    const group = parseRequiredString(row.group, '受入管理グループ')
    const location = parseRequiredString(row.location, '勤務場所')

    return {
      employeeId,
      companyName,
      memberName,
      memberNameKana,
      role,
      hireDate,
      organization: { department, group, location },
      startDate,
      endDate,
    }
  } catch (error) {
    if (error instanceof Error && (error as any).statusCode) {
      const httpError = error as any
      throw createError({
        statusCode: httpError.statusCode,
        statusMessage: `[行${rowNumber}] ${httpError.statusMessage}`,
      })
    }
    throw error
  }
}

/**
 * 集計: ParsedExcelRow の配列から、会社・担当者・契約・組織の insert 用オブジェクトを準備する
 * @param rows パースされた Excel 行の配列
 * @returns ImportResult
 */
export function aggregateImportData(rows: ParsedExcelRow[]): ImportResult {
  const result: ImportResult = {
    companyInputs: [],
    memberInputs: [],
    contractInputs: [],
    organizationInputs: [],
    errors: [],
  }

  const seenCompanies = new Set<string>() // 重複チェック用
  const seenOrganizations = new Set<string>() // "dept|group|loc"

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = 6 + i // Excel 的な行番号（見出しが5行目、データは6行目から）

    try {
      // 会社情報を add (重複チェック)
      const companyKey = row.companyName
      if (!seenCompanies.has(companyKey)) {
        result.companyInputs.push({
          name: companyKey,
          input: { name: row.companyName },
        })
        seenCompanies.add(companyKey)
      }

      // 組織情報を add (重複チェック)
      const orgKey = `${row.organization.department}|${row.organization.group}|${row.organization.location}`
      if (!seenOrganizations.has(orgKey)) {
        result.organizationInputs.push({
          key: orgKey,
          input: row.organization,
        })
        seenOrganizations.add(orgKey)
      }

      // member input を準備（placeholders の形式）
      result.memberInputs.push({
        companyId: `__company:${row.companyName}__`, // 後で実際の ID に置換
        input: {
          companyId: '', // 後で replace
          name: row.memberName,
          nameKana: row.memberNameKana,
          role: row.role,
          note: `社員番号: ${row.employeeId || 'N/A'}`,
        },
      })

      // contract input を準備
      const memberId = `__member:${i}__` // 後で実際の ID に置換
      result.contractInputs.push({
        memberId,
        input: {
          memberId: '',
          startDate: row.startDate,
          endDate: row.endDate,
          note: '',
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push({
        rowNumber,
        field: 'row',
        message,
      })
    }
  }

  return result
}
