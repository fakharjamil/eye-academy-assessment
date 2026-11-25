import { z } from 'zod'
import rawCase from '../../data/case-ea-viva-001.json'

const findingSchema = z.object({
  id: z.string().min(1),
  eye: z.enum(['right', 'left', 'both']).nullable(),
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]).nullable(),
  unit: z.string().nullable(),
  method: z.string().nullable(),
  available: z.boolean(),
  unavailable_reason: z.string().optional(),
})

const caseSchema = z.object({
  case_id: z.string(),
  title: z.string(),
  opening_prompt: z.string(),
  patient: z.record(z.string(), z.unknown()),
  findings: z.array(findingSchema).min(1),
  examiner_notes: z.object({
    diagnosis: z.string(),
    key_points: z.array(z.string()),
    follow_up_ideas: z.array(z.string()),
  }),
})

export type CaseFile = z.infer<typeof caseSchema>
export type Finding = z.infer<typeof findingSchema>

/** Validates a case file. Throws one readable error listing every problem. */
export function parseCase(input: unknown): CaseFile {
  const result = caseSchema.safeParse(input)
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    throw new Error(`Invalid case file:\n- ${problems.join('\n- ')}`)
  }
  return result.data
}

export function loadCase(): CaseFile {
  return parseCase(rawCase)
}
