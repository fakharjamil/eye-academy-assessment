import { useEffect, useRef, useState } from 'react'
import { getFirebaseAuth } from '#/lib/firebase'
import { makeRevisionPoint, type RevisionPoint } from '#/server/revision'
import type { Turn } from '#/voice/use-viva-session'
import { saveAttempt } from './attempts'

/** After the viva ends, asks the server for one cited revision point and saves it to the attempt. */
export function useRevisionPoint(ended: boolean, attemptId: string | null, turns: Turn[]) {
  const [point, setPoint] = useState<RevisionPoint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestedFor = useRef<string | null>(null)
  const latestTurns = useRef(turns)
  latestTurns.current = turns

  useEffect(() => {
    if (!ended) {
      setPoint(null)
      setError(null)
      return
    }
    const user = getFirebaseAuth().currentUser
    const key = attemptId ?? 'unsaved'
    if (!user || requestedFor.current === key) return
    requestedFor.current = key
    setLoading(true)
    ;(async () => {
      try {
        const idToken = await user.getIdToken()
        const result = await makeRevisionPoint({
          data: {
            idToken,
            turns: latestTurns.current.filter((t) => t.final && t.text).map(({ role, text }) => ({ role, text })),
          },
        })
        setPoint(result)
        if (attemptId) await saveAttempt(user.uid, attemptId, { revision: result })
      } catch (err) {
        console.error('makeRevisionPoint failed', err)
        setError('The revision point could not be created.')
      } finally {
        setLoading(false)
      }
    })()
  }, [ended, attemptId])

  return { point, loading, error }
}
