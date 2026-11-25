/**
 * pnpm check:findings
 * Repeatable finding checks: what the examiner reads out and the card shows for an available
 * finding and for unavailable ones. Reads the case JSON as it is now, so a changed value shows up.
 */
import { getFinding } from '../src/case/findings'

const checks = [
  { ask: 'Right eye pressure', id: 'iop_right', expected: 'Right eye, Intraocular pressure: 58 mmHg.' },
  { ask: 'Left eye pressure', id: 'iop_left', expected: 'Left eye, Intraocular pressure: 18 mmHg.' },
  { ask: 'Right gonioscopy', id: 'gonio_right', expected: 'Right eye, Gonioscopy: not available. No view: corneal oedema.' },
  { ask: 'RAPD', id: 'rapd', expected: 'Both eyes, Relative afferent pupillary defect: not available. Right pupil fixed, so the test cannot be interpreted.' },
  { ask: 'CT head', id: 'not_in_case', expected: 'That is not part of this case.' },
]

let failed = 0
for (const c of checks) {
  const observed = getFinding(c.id)
  const ok = observed.spoken === c.expected
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${c.ask}" → ${c.id}`)
  console.log(`      expected: ${c.expected}`)
  console.log(`      observed: ${observed.spoken}   [card: ${observed.display}]`)
}
process.exit(failed ? 1 : 0)
