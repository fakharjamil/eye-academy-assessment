import { describe, expect, it } from 'vitest'
import { hybridSearch } from './search'
import { loadNoteIndex } from './note-index'

const index = loadNoteIndex()

describe('hybridSearch (keywords only, no embeddings)', () => {
  it('finds the page 6 acetazolamide caution for a sulfonamide allergy query', () => {
    const top = hybridSearch(index, 'sulfonamide allergy before acetazolamide', null, 4)
    expect(top).toHaveLength(4)
    expect(top[0].page).toBe(6)
    expect(top[0].text).toContain('Check for sulfonamide allergy')
  })

  it('finds the fellow-eye laser for a left eye question', () => {
    const top = hybridSearch(index, 'prophylactic laser iridotomy fellow eye', null, 4)
    expect(top.map((c) => c.page)).toContain(6)
  })
})
