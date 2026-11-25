import { MAX_FOLLOW_UPS } from './session-config'

/**
 * The app, not the model, enforces the follow-up limit: the examiner must ask permission
 * through ask_follow_up, and this decides the answer it gets back.
 */
export function decideFollowUp(askedSoFar: number, max = MAX_FOLLOW_UPS) {
  if (askedSoFar < max) {
    return { allowed: true, output: JSON.stringify({ allowed: true, instruction: 'Ask the question now, then wait.' }) }
  }
  return {
    allowed: false,
    output: JSON.stringify({
      allowed: false,
      instruction: 'Do not ask another question. Thank the trainee in one sentence and call end_viva.',
    }),
  }
}

/** The viva may only end after the one follow-up: the brief asks for a spoken follow-up every time. */
export function decideEndViva(followUpsAsked: number, max = MAX_FOLLOW_UPS) {
  if (followUpsAsked >= max) return { allowed: true, output: JSON.stringify({ ok: true }) }
  return {
    allowed: false,
    output: JSON.stringify({
      ok: false,
      instruction:
        'Do not end yet. If the trainee has given a diagnosis and management, call ask_follow_up with one follow-up question aimed at a gap in their answer. Otherwise ask for their diagnosis and management.',
    }),
  }
}
