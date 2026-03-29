// 契約手続きステータス定義（仕様書 §5.1 に準拠）
export const CONTRACT_STATUS = [
  'NOT_STARTED',
  'ESTIMATE_REQUESTED',
  'ESTIMATE_RECEIVED',
  'DRAFT_CREATED',
  'DRAFT_CONFIRMED',
  'APPROVAL_CREATED',
  'CONTRACT_SENT',
  'CONTRACT_SIGNED',
  'CONTRACT_RECEIVED',
  'SENT_TO_MANAGEMENT',
  'COMPLETED',
] as const

export type ContractStatus = (typeof CONTRACT_STATUS)[number]

/**
 * ステータスの前進が許可されるか判定する（仕様書 §5.2）
 * 現在のインデックス + 1 のみ許可
 */
export function canAdvance(current: ContractStatus, next: ContractStatus): boolean {
  const currentIdx = CONTRACT_STATUS.indexOf(current)
  const nextIdx = CONTRACT_STATUS.indexOf(next)
  return nextIdx === currentIdx + 1
}

/**
 * ステータスの差し戻しが許可されるか判定する（仕様書 §5.2）
 * 現在のインデックス - 1 のみ許可。COMPLETED からの差し戻しは禁止。
 */
export function canRollback(current: ContractStatus, prev: ContractStatus): boolean {
  if (current === 'COMPLETED') return false
  const currentIdx = CONTRACT_STATUS.indexOf(current)
  const prevIdx = CONTRACT_STATUS.indexOf(prev)
  return prevIdx === currentIdx - 1
}

/**
 * ステータス遷移が有効か判定する（前進・差し戻しどちらか）
 */
export function isValidTransition(from: ContractStatus, to: ContractStatus): boolean {
  return canAdvance(from, to) || canRollback(from, to)
}
