const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseRequiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${label}は文字列で入力してください` })
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    throw createError({ statusCode: 400, statusMessage: `${label}は必須です` })
  }

  return trimmedValue
}

export function parseOptionalString(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${label}は文字列で入力してください` })
  }

  return value.trim() || null
}

export function parseOptionalDateString(value: unknown, label: string): string | null {
  const parsedValue = parseOptionalString(value, label)
  if (!parsedValue) {
    return null
  }

  if (!ISO_DATE_PATTERN.test(parsedValue)) {
    throw createError({ statusCode: 400, statusMessage: `${label}はYYYY-MM-DD形式で入力してください` })
  }

  return parsedValue
}

export function parseUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw createError({ statusCode: 400, statusMessage: `${label}が不正です` })
  }

  return value
}