/**
 * pnpm check:citation
 * Repeatable citation check: runs the real revision point pipeline (OpenAI calls included) on fixed
 * trainee answers and prints expected vs observed, with the retrieved pages and the cited passage.
 */
import { existsSync, readFileSync } from 'node:fs'
import { buildRevisionPoint, type TranscriptTurn } from '../src/server/revision-core'

if (!process.env.OPENAI_API_KEY && existsSync('.dev.vars')) {
  const match = readFileSync('.dev.vars', 'utf8').match(/^OPENAI_API_KEY=(.+)$/m)
  if (match) process.env.OPENAI_API_KEY = match[1].trim()
}

const cases: { name: string; expected: string; turns: TranscriptTurn[] }[] = [
  {
    name: 'Misses the sulfonamide allergy check',
    expected: 'supported, page 6, excerpt mentions sulfonamide',
    turns: [
      { role: 'examiner', text: 'What is your diagnosis and immediate management?' },
      {
        role: 'trainee',
        text: 'Right acute primary angle closure. I would lie her flat, give analgesia and an antiemetic, stop the chlorphenamine, start timolol and apraclonidine, give IV acetazolamide 500 mg, add pilocarpine once the pressure falls, and arrange laser iridotomy to both eyes, then repeat gonioscopy and check the discs.',
      },
    ],
  },
  {
    name: 'Off-topic answer',
    expected: 'a point from the APAC pages, or "No support found in the note"',
    turns: [
      { role: 'examiner', text: 'What is your diagnosis and immediate management?' },
      { role: 'trainee', text: 'I think she has migraine. I would give her paracetamol and send her home.' },
    ],
  },
  {
    name: 'Weak point the note does not cover (blood pressure)',
    expected: '"No support found in the note"',
    turns: [
      { role: 'examiner', text: 'What is your diagnosis and immediate management?' },
      {
        role: 'trainee',
        text: 'Right acute primary angle closure. Lie her flat, analgesia and antiemetic, stop the chlorphenamine, timolol, apraclonidine, pilocarpine once the pressure falls, and acetazolamide only after checking her sulfonamide allergy. Laser iridotomy to both eyes, then repeat gonioscopy and check both discs.',
      },
      { role: 'examiner', text: 'Her blood pressure is 168/94. How would you manage that long term?' },
      { role: 'trainee', text: 'I would start ramipril and titrate it to a target of 140/90 over the next month.' },
    ],
  },
]

const only = process.argv[2]
for (const c of cases.filter((_, i) => !only || String(i + 1) === only)) {
  const result = await buildRevisionPoint(c.turns)
  console.log(`\n=== ${c.name}\nExpected: ${c.expected}`)
  console.log(`Gap: ${result.gap}\nQuery: ${result.query}\nRetrieved pages: ${result.retrievedPages.join(', ')}`)
  if (result.supported) console.log(`Observed: supported, page ${result.page}\nPoint: ${result.point}\nExcerpt: "${result.excerpt}"`)
  else console.log(`Observed: ${result.message}`)
}
