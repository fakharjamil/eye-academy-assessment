import { describe, expect, it } from 'vitest'
import { decideEndViva, decideFollowUp } from './follow-up'

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

describe('decideEndViva', () => {
  it('refuses to end before the follow-up has been asked', () => {
    const early = decideEndViva(0)
    expect(early.allowed).toBe(false)
    expect(early.output).toContain('ask_follow_up')
  })

  it('allows ending once the follow-up has been asked', () => {
    expect(decideEndViva(1).allowed).toBe(true)
  })
})
