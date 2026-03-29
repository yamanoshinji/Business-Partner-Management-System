import type { ContractStatus } from '../../shared/types/contract'

export type ContractInput = {
  memberId: string
  startDate: string
  endDate: string
  status?: ContractStatus
  note?: string
}

export function parseContractStatus(value: unknown, label: string): ContractStatus {
  const status = parseRequiredString(value, label) as ContractStatus

  if (!CONTRACT_STATUS.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: `${label}が不正です` })
  }

  return status
}

export function validateStatusTransition(current: ContractStatus, next: ContractStatus): void {
  if (!isValidTransition(current, next)) {
    throw createError({ statusCode: 400, statusMessage: '許可されていないステータス遷移です' })
  }
}