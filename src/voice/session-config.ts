import type { CaseFile } from '#/case/case'

export const REALTIME_MODEL = 'gpt-realtime-2.1'
export const MAX_FOLLOW_UPS = 1

const EYE_NAME = { right: 'right eye', left: 'left eye', both: 'both eyes' } as const

/**
 * The examiner's session. Finding values are deliberately absent: the model only learns a value
 * by calling get_finding, so it cannot mix up 58 and 18 from memory.
 */
export function buildSessionConfig(caseFile: CaseFile) {
  const { patient, examiner_notes: notes } = caseFile
  const findingList = caseFile.findings
    .map((f) => `- ${f.id}: ${f.label}${f.eye ? ` (${EYE_NAME[f.eye]})` : ''}`)
    .join('\n')

  const instructions = `You are a consultant ophthalmologist running a short spoken viva with a trainee. Speak UK English, calmly and briefly (one or two sentences per turn).

CASE: ${caseFile.title}
History (you may answer questions about it): ${JSON.stringify(patient)}

HOW THE VIVA RUNS
1. Start by reading this opening prompt word for word, then stop and wait: "${caseFile.opening_prompt}"
2. When the trainee asks for any examination finding or test result, ALWAYS call get_finding. Never state a finding from memory or guess one.
   - If they do not say which eye and the finding exists for each eye, call get_finding once for each eye.
   - If nothing in the list matches, call get_finding with "not_in_case".
3. After get_finding returns, say its "spoken" text exactly as written. Do not add, round or rephrase the value, eye or unit. If it is not available, say so with the reason given.
4. Do not teach, hint or confirm whether the trainee is right during the viva.
5. When the trainee has given a diagnosis and management, choose exactly ${MAX_FOLLOW_UPS} follow-up question aimed at the most important gap or weak point in what they just said. These ideas are hints only: ${notes.follow_up_ideas.join(' | ')}
   Before asking it, call ask_follow_up with the exact question. Only ask it if the result says allowed is true.
6. After they answer the follow-up, thank them in one sentence and call end_viva. Never ask a second follow-up. If ask_follow_up says allowed is false, thank them and call end_viva.

EXAMINER NOTES (private, never read out)
Expected diagnosis: ${notes.diagnosis}
Key points a good answer covers:
${notes.key_points.map((p) => `- ${p}`).join('\n')}`

  const tools = [
    {
      type: 'function' as const,
      name: 'get_finding',
      description: `Look up one examination finding or test result for this case. Available ids:\n${findingList}\nUse "not_in_case" for anything not listed.`,
      parameters: {
        type: 'object' as const,
        properties: {
          finding_id: {
            type: 'string' as const,
            enum: [...caseFile.findings.map((f) => f.id), 'not_in_case'],
          },
        },
        required: ['finding_id'],
      },
    },
    {
      type: 'function' as const,
      name: 'ask_follow_up',
      description:
        'Call before asking your follow-up question, with the exact question. Ask it only if the result says allowed is true.',
      parameters: {
        type: 'object' as const,
        properties: { question: { type: 'string' as const } },
        required: ['question'],
      },
    },
    {
      type: 'function' as const,
      name: 'end_viva',
      description: 'End the viva after the single follow-up question has been answered.',
      parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
    },
  ]

  return {
    type: 'realtime' as const,
    model: REALTIME_MODEL,
    instructions,
    output_modalities: ['audio'],
    tools,
    tool_choice: 'auto' as const,
    audio: {
      input: {
        // Semantic VAD judges whether the trainee has finished a thought, so a pause to think
        // does not end their turn. Medium eagerness: waits for a finished thought, but not too long.
        turn_detection: {
          type: 'semantic_vad' as const,
          eagerness: 'medium' as const,
          create_response: true,
          interrupt_response: true,
        },
        transcription: { model: 'gpt-4o-mini-transcribe', language: 'en' },
      },
      output: { voice: 'marin' },
    },
  }
}
