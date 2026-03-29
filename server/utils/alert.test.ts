import { describe, expect, it } from 'vitest'
import { calculateAlertDate } from './alert'

describe('calculateAlertDate', () => {
  it('第2月曜日が平日の場合はその日を返す', () => {
    expect(calculateAlertDate('2026-04-30')).toBe('2026-03-09')
  })

  it('第2月曜日が祝日の場合は翌平日にスライドする', () => {
    expect(calculateAlertDate('2026-02-28')).toBe('2026-01-13')
  })
})