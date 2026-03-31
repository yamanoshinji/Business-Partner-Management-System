import { describe, it, expect } from 'vitest'
import { parseExcelRowRaw, aggregateImportData, type ExcelRowRaw, type ParsedExcelRow } from './import'

describe('import.ts', () => {
  describe('parseExcelRowRaw', () => {
    it('正常系: 必須項目が揃っていれば正常にパースされる', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      const result = parseExcelRowRaw(row, 7)

      expect(result.employeeId).toBe('EMP001')
      expect(result.companyName).toBe('テスト会社')
      expect(result.memberName).toBe('山田太郎')
      expect(result.memberNameKana).toBe('ヤマダタロウ')
      expect(result.role).toBe('営業')
      expect(result.hireDate).toBe('2024-04-01')
      expect(result.organization.department).toBe('営業部')
      expect(result.organization.group).toBe('営業グループ')
      expect(result.organization.location).toBe('東京')
      expect(result.startDate).toBe('2024-04-01')
      expect(result.endDate).toBe('2025-03-31')
    })

    it('異常系: 会社名が空文字列ならエラー', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: '',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      expect(() => parseExcelRowRaw(row, 7)).toThrow()
    })

    it('異常系: 担当者名が空文字列ならエラー', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      expect(() => parseExcelRowRaw(row, 7)).toThrow()
    })

    it('異常系: 契約開始日が空なら必須チェックでエラー', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '',
        endDate: '2025-03-31',
      }

      expect(() => parseExcelRowRaw(row, 7)).toThrow()
    })

    it('異常系: 契約終了日が空なら必須チェックでエラー', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '',
      }

      expect(() => parseExcelRowRaw(row, 7)).toThrow()
    })

    it('日付吸収: スラッシュ区切りの日付をYYYY-MM-DDに正規化できる', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024/04/01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      const result = parseExcelRowRaw(row, 7)
      expect(result.hireDate).toBe('2024-04-01')
    })

    it('日付吸収: Excelシリアル値の日付をYYYY-MM-DDに正規化できる', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: 45383,
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: 45292,
        endDate: 45656,
      }

      const result = parseExcelRowRaw(row, 7)
      expect(result.hireDate).toBe('2024-04-01')
      expect(result.startDate).toBe('2024-01-01')
      expect(result.endDate).toBe('2024-12-30')
    })

    it('日付吸収: Dateオブジェクトの日付をYYYY-MM-DDに正規化できる', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: new Date(Date.UTC(2024, 3, 1)),
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: new Date(Date.UTC(2024, 0, 1)),
        endDate: new Date(Date.UTC(2024, 11, 30)),
      }

      const result = parseExcelRowRaw(row, 7)
      expect(result.hireDate).toBe('2024-04-01')
      expect(result.startDate).toBe('2024-01-01')
      expect(result.endDate).toBe('2024-12-30')
    })

    it('社員番号吸収: 数値セルでも文字列化して取り込める', () => {
      const row: ExcelRowRaw = {
        employeeId: 60140,
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '2024-04-01',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      const result = parseExcelRowRaw(row, 7)
      expect(result.employeeId).toBe('60140')
    })

    it('日付不正: 解釈不能な日付文字列ならエラー', () => {
      const row: ExcelRowRaw = {
        employeeId: 'EMP001',
        companyName: 'テスト会社',
        memberName: '山田太郎',
        memberNameKana: 'ヤマダタロウ',
        role: '営業',
        hireDate: '来月の頭',
        location: '東京',
        department: '営業部',
        group: '営業グループ',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      }

      expect(() => parseExcelRowRaw(row, 7)).toThrow()
    })
  })

  describe('aggregateImportData', () => {
    it('正常系: 複数行から会社・担当者・契約・組織を集約', () => {
      const rows: ParsedExcelRow[] = [
        {
          employeeId: 'EMP001',
          companyName: 'テスト会社A',
          memberName: '山田太郎',
          memberNameKana: 'ヤマダタロウ',
          role: '営業',
          hireDate: '2024-04-01',
          organization: { department: '営業部', group: 'グループA', location: '東京' },
          startDate: '2024-04-01',
          endDate: '2025-03-31',
        },
        {
          employeeId: 'EMP002',
          companyName: 'テスト会社A',
          memberName: '鈴木花子',
          memberNameKana: 'スズキハナコ',
          role: 'エンジニア',
          hireDate: '2024-05-01',
          organization: { department: '営業部', group: 'グループA', location: '東京' },
          startDate: '2024-05-01',
          endDate: '2025-04-30',
        },
        {
          employeeId: 'EMP003',
          companyName: 'テスト会社B',
          memberName: '佐藤次郎',
          memberNameKana: 'サトウジロウ',
          role: 'デザイナー',
          hireDate: '2024-06-01',
          organization: { department: '企画部', group: 'グループB', location: '大阪' },
          startDate: '2024-06-01',
          endDate: '2025-05-31',
        },
      ]

      const result = aggregateImportData(rows)

      // 会社: 2社（A, B）
      expect(result.companyInputs).toHaveLength(2)
      expect(result.companyInputs[0].input.name).toBe('テスト会社A')
      expect(result.companyInputs[1].input.name).toBe('テスト会社B')

      // 担当者: 3名
      expect(result.memberInputs).toHaveLength(3)

      // 契約: 3件
      expect(result.contractInputs).toHaveLength(3)

      // 組織: 2組（グループA@東京, グループB@大阪）
      expect(result.organizationInputs).toHaveLength(2)
      expect(result.organizationInputs[0].input.department).toBe('営業部')
      expect(result.organizationInputs[0].input.group).toBe('グループA')
      expect(result.organizationInputs[1].input.department).toBe('企画部')
      expect(result.organizationInputs[1].input.group).toBe('グループB')

      // エラーなし
      expect(result.errors).toHaveLength(0)
    })

    it('組織の一意性確認: 同一組織は1回だけ集約される', () => {
      const rows: ParsedExcelRow[] = [
        {
          employeeId: 'EMP001',
          companyName: 'テスト会社A',
          memberName: '山田太郎',
          memberNameKana: 'ヤマダタロウ',
          role: '営業',
          hireDate: '2024-04-01',
          organization: { department: '営業部', group: 'グループA', location: '東京' },
          startDate: '2024-04-01',
          endDate: '2025-03-31',
        },
        {
          employeeId: 'EMP002',
          companyName: 'テスト会社A',
          memberName: '鈴木花子',
          memberNameKana: 'スズキハナコ',
          role: 'エンジニア',
          hireDate: '2024-05-01',
          organization: { department: '営業部', group: 'グループA', location: '東京' }, // 同一組織
          startDate: '2024-05-01',
          endDate: '2025-04-30',
        },
      ]

      const result = aggregateImportData(rows)

      // 組織は1つだけ
      expect(result.organizationInputs).toHaveLength(1)
      expect(result.organizationInputs[0].input.department).toBe('営業部')
    })
  })
})
