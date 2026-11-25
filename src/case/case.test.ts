import { describe, expect, it } from 'vitest'
import rawCase from '../../data/case-ea-viva-001.json'
import { parseCase } from './case'

describe('parseCase', () => {
  it('accepts the supplied case file', () => {
    expect(parseCase(rawCase).case_id).toBe('EA-VIVA-001')
  })

  it('rejects a broken edit and names the field that is wrong', () => {
    const broken = structuredClone(rawCase) as Record<string, any>
    broken.findings[2].eye = 'up'
    delete broken.findings[3].available
    expect(() => parseCase(broken)).toThrow(/findings\.2\.eye/)
    expect(() => parseCase(broken)).toThrow(/findings\.3\.available/)
  })
})
