import { describe, expect, it } from 'vitest'
import { summariseLatency } from './latency'

const sample = (ms: number, finding = false) => ({ ms, at: 0, kind: 'voice' as const, finding })

describe('summariseLatency', () => {
  it('gives count, median, p90 and worst', () => {
    const s = summariseLatency([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((ms) => sample(ms)))
    expect(s.all).toEqual({ count: 10, median: 550, p90: 910, worst: 1000 })
  })

  it('splits plain turns from turns that looked up a finding', () => {
    const s = summariseLatency([sample(500), sample(700), sample(1500, true)])
    expect(s.plain.count).toBe(2)
    expect(s.finding).toEqual({ count: 1, median: 1500, p90: 1500, worst: 1500 })
  })

  it('handles no samples', () => {
    expect(summariseLatency([]).all).toEqual({ count: 0, median: null, p90: null, worst: null })
  })
})
