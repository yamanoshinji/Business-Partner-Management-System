import { createRequire } from 'node:module'

type HolidayChecker = (date: Date) => boolean

const require = createRequire(import.meta.url)
const holidaysJp = require('holidays-jp') as { isHoliday: (date: Date) => boolean }

function toDateAtNoon(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map((value) => Number(value))

  if (!year || !month || !day) {
    throw createError({ statusCode: 400, statusMessage: '日付形式が不正です' })
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getSecondMonday(year: number, monthIndex: number): Date {
  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0, 0)
  const offset = (8 - firstDay.getDay()) % 7
  const firstMonday = 1 + offset
  return new Date(year, monthIndex, firstMonday + 7, 12, 0, 0, 0)
}

export function calculateAlertDate(endDate: string, holidayChecker: HolidayChecker = holidaysJp.isHoliday): string {
  const parsedEndDate = toDateAtNoon(endDate)
  const targetMonthDate = new Date(parsedEndDate.getFullYear(), parsedEndDate.getMonth() - 1, 1, 12, 0, 0, 0)

  let alertDate = getSecondMonday(targetMonthDate.getFullYear(), targetMonthDate.getMonth())

  while (isWeekend(alertDate) || holidayChecker(alertDate)) {
    alertDate = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate() + 1, 12, 0, 0, 0)
  }

  return formatDate(alertDate)
}