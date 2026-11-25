import { describe, expect, it } from 'vitest'
import { decideFollowUp } from './follow-up'

describe('decideFollowUp', () => {
  it('allows the first follow-up', () => {
    expect(decideFollowUp(0).allowed).toBe(true)
  })

  it('refuses a second follow-up and tells the examiner to end the viva', () => {
    const second = decideFollowUp(1)
    expect(second.allowed).toBe(false)
    expect(second.output).toContain('end_viva')
  })
})
