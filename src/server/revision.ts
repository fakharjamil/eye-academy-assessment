import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { verifyIdToken } from './firebase-token'
import { buildRevisionPoint } from './revision-core'

export type { RevisionPoint } from './revision-core'

const turnSchema = z.object({ role: z.enum(['examiner', 'trainee']), text: z.string() })

/** Builds one revision point from what the trainee said, cited to a page of the reference note. */
export const makeRevisionPoint = createServerFn({ method: 'POST' })
  .validator(z.object({ idToken: z.string().min(1), turns: z.array(turnSchema).max(200) }))
  .handler(async ({ data }) => {
    await verifyIdToken(data.idToken)
    return buildRevisionPoint(data.turns)
  })
