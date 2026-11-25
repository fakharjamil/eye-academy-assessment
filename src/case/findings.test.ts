import { describe, expect, it } from 'vitest'
import { loadCase } from './case'
import { getFinding } from './findings'

describe('getFinding', () => {
  it('reads the right eye pressure with its eye, value, unit and method', () => {
    expect(getFinding('iop_right')).toMatchObject({
      found: true,
      available: true,
      eye: 'right',
      label: 'Intraocular pressure',
      display: '58 mmHg',
      method: 'Goldmann applanation, 23:55',
    })
  })

  it('adds the unit only to bare measurements, never twice', () => {
    expect(getFinding('iop_left').display).toBe('18 mmHg')
    expect(getFinding('bp').display).toBe('168/94 mmHg')
    expect(getFinding('va_right').display).toBe('6/36 Snellen')
    expect(getFinding('pupil_right').display).toBe('Mid-dilated, 5 mm, unreactive to light')
    expect(getFinding('refraction').display).toBe(
      'Right +3.50 DS, left +3.25 DS (from her current glasses)',
    )
    expect(getFinding('cornea_left').display).toBe('Clear')
  })

  it('says a finding is not available, with the reason from the case', () => {
    expect(getFinding('gonio_right')).toMatchObject({
      available: false,
      display: 'Not available: No view: corneal oedema',
      reason: 'No view: corneal oedema',
    })
  })

  it('treats rapd as unavailable and hides its value, because available is false', () => {
    const rapd = getFinding('rapd')
    expect(rapd.available).toBe(false)
    expect(rapd.display).toBe('Not available: Right pupil fixed, so the test cannot be interpreted')
    expect(rapd.display).not.toContain('Not assessable')
  })

  it('says an unknown finding is not part of this case', () => {
    for (const id of ['not_in_case', 'ct_head', '']) {
      expect(getFinding(id)).toEqual({
        found: false,
        id,
        available: false,
        display: 'Not part of this case',
        spoken: 'That is not part of this case.',
      })
    }
  })

  it('gives a spoken sentence that names the eye first', () => {
    expect(getFinding('iop_right').spoken).toBe('Right eye, Intraocular pressure: 58 mmHg.')
    expect(getFinding('iop_left').spoken).toBe('Left eye, Intraocular pressure: 18 mmHg.')
    expect(getFinding('bp').spoken).toBe('Blood pressure: 168/94 mmHg.')
    expect(getFinding('gonio_right').spoken).toBe(
      'Right eye, Gonioscopy: not available. No view: corneal oedema.',
    )
    expect(getFinding('axial_length').spoken).toBe(
      'Both eyes, Axial length (biometry): not available. Not performed in casualty.',
    )
  })

  it('formats all 24 findings, and exactly six are unavailable', () => {
    const results = loadCase().findings.map((f) => getFinding(f.id))
    expect(results).toHaveLength(24)
    for (const r of results) {
      expect(r.found).toBe(true)
      expect(r.display).not.toBe('')
      expect(r.spoken).not.toMatch(/null|undefined|NaN/)
      expect(r.display).not.toMatch(/\b(mm|mmHg|Snellen|dioptres) \1\b/)
    }
    expect(results.filter((r) => !r.available).map((r) => r.id)).toEqual([
      'rapd',
      'gonio_right',
      'fundus_right',
      'axial_length',
      'oct',
      'u_and_e',
    ])
  })
})
