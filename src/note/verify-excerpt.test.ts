import { describe, expect, it } from 'vitest'
import { verifyExcerpt } from './verify-excerpt'

// Page text as extracted from the PDF: line breaks, a hyphenated break and spacing artefacts.
const page6 = `250 mg four times a day. Check for sulfonamide allergy, kidney disease, low potassium and sickle cell
disease before giving it. Do not use it when the angle closure is caused by topiramate or another
sulfonamide drug.
Recheck the IOP every 30 to 60 minutes. Indenting the central cornea with a gonioscopy lens or a squint
hook can push aqueous into the angle and help break the attack. Topical glycerol can clear corneal
epithelial oedema first, which improves the view and reduces the risk of abra-
sion. Long-term pilocarpine is not an adequate alternative. Prophylactic LPI in the fellow eye, because
without treatment around 40 to 50% of fellow eyes have an attack. The IOP , once settled, is rechecked.`

describe('verifyExcerpt', () => {
  it('accepts an exact excerpt that runs across a line break', () => {
    expect(verifyExcerpt('Check for sulfonamide allergy, kidney disease, low potassium and sickle cell disease before giving it.', page6)).toBe(true)
  })

  it('accepts a word split by a hyphenated line break, and spacing artefacts', () => {
    expect(verifyExcerpt('improves the view and reduces the risk of abrasion', page6)).toBe(true)
    expect(verifyExcerpt('The IOP, once settled, is rechecked.', page6)).toBe(true)
  })

  it('ignores capitalisation and curly quotes', () => {
    expect(verifyExcerpt('check for sulfonamide allergy', page6)).toBe(true)
  })

  it('rejects a paraphrase', () => {
    expect(verifyExcerpt('Check for a sulfa allergy before acetazolamide', page6)).toBe(false)
  })

  it('rejects text from a different page', () => {
    expect(verifyExcerpt('Pilocarpine 2% constricts the pupil and pulls the iris away from the angle.', page6)).toBe(false)
  })

  it('rejects an excerpt too short to prove anything', () => {
    expect(verifyExcerpt('allergy', page6)).toBe(false)
    expect(verifyExcerpt('', page6)).toBe(false)
  })

  it('accepts a real hyphenated word that was split across lines', () => {
    expect(verifyExcerpt('rebound and non-contact tonometers are useful', 'Rebound and non-\ncontact tonometers are useful for screening')).toBe(true)
  })
})
