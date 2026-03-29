import { describe, expect, it } from 'vitest'
import { canAdvance, canRollback, isValidTransition } from './contract'

describe('contract transitions', () => {
  it('許可された前進遷移を通す', () => {
    expect(canAdvance('NOT_STARTED', 'ESTIMATE_REQUESTED')).toBe(true)
    expect(isValidTransition('DRAFT_CREATED', 'DRAFT_CONFIRMED')).toBe(true)
  })

  it('禁止されたスキップ遷移とCOMPLETEDからの差し戻しを拒否する', () => {
    expect(isValidTransition('NOT_STARTED', 'ESTIMATE_RECEIVED')).toBe(false)
    expect(canRollback('COMPLETED', 'SENT_TO_MANAGEMENT')).toBe(false)
  })
})