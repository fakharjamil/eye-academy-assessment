import { loadCase, type CaseFile } from './case'

export type FindingResult = FoundFinding | MissingFinding

export type MissingFinding = {
  found: false
  id: string
  available: false
  display: string
  spoken: string
}

export type FoundFinding = {
  found: true
  id: string
  label: string
  eye: 'right' | 'left' | 'both' | null
  available: boolean
  display: string
  /** The exact sentence the examiner reads out. */
  spoken: string
  reason: string | null
  method: string | null
}

const EYE_PHRASE = { right: 'Right eye, ', left: 'Left eye, ', both: 'Both eyes, ', none: '' }

// A bare measurement is a number or digits with / . + - only, e.g. 58, "168/94", "6/36".
const BARE_MEASUREMENT = /^[\d./+\-\s]+$/

/** Adds the unit only to bare measurements, so text that already names its unit is never doubled. */
function formatValue(value: string | number | null, unit: string | null): string {
  const text = String(value ?? '').trim()
  return unit && BARE_MEASUREMENT.test(text) ? `${text} ${unit}` : text
}

export function getFinding(id: string, caseFile: CaseFile = loadCase()): FindingResult {
  const finding = caseFile.findings.find((f) => f.id === id)
  if (!finding) {
    return {
      found: false,
      id,
      available: false,
      display: 'Not part of this case',
      spoken: 'That is not part of this case.',
    }
  }
  // `available` decides, never `value`: rapd has a value but must not be revealed.
  const reason = finding.available ? null : (finding.unavailable_reason ?? 'Not recorded')
  const value = formatValue(finding.value, finding.unit)
  const subject = `${EYE_PHRASE[finding.eye ?? 'none']}${finding.label}`
  return {
    found: true,
    id: finding.id,
    label: finding.label,
    eye: finding.eye,
    available: finding.available,
    display: reason ? `Not available: ${reason}` : value,
    spoken: reason ? `${subject}: not available. ${reason}.` : `${subject}: ${value}.`,
    reason,
    method: finding.method,
  }
}
