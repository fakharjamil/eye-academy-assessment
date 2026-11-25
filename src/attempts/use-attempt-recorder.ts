import { useEffect, useRef, useState } from 'react'
import type { LatencySample, Phase, RevealedFinding, Turn } from '#/voice/use-viva-session'
import { createAttempt, saveAttempt, type AttemptStatus } from './attempts'

type SessionSnapshot = {
  phase: Phase
  turns: Turn[]
  revealed: RevealedFinding[]
  followUps: string[]
  latency: LatencySample[]
}

/**
 * Creates an attempt when a viva starts and saves it after every change (debounced),
 * so a refresh never loses more than the turn in progress.
 */
export function useAttemptRecorder(uid: string | undefined, caseId: string, session: SessionSnapshot) {
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const connecting = session.phase === 'connecting'

  useEffect(() => {
    if (!connecting || !uid) return
    setAttemptId(null)
    setSaveError(null)
    createAttempt(uid, caseId)
      .then(setAttemptId)
      .catch((err) => {
        console.error('createAttempt failed', err)
        setSaveError('This attempt could not be saved.')
      })
  }, [connecting, uid, caseId])

  const status: AttemptStatus =
    session.phase === 'ended' ? 'completed' : session.phase === 'error' ? 'interrupted' : 'in_progress'
  const finished = status !== 'in_progress'
  const latest = useRef({ ...session, status })
  latest.current = { ...session, status }

  useEffect(() => {
    if (!uid || !attemptId) return
    const write = () => {
      const s = latest.current
      saveAttempt(uid, attemptId, {
        status: s.status,
        turns: s.turns.filter((t) => t.final),
        revealed: s.revealed,
        followUps: s.followUps,
        latency: s.latency,
      }).catch((err) => {
        console.error('saveAttempt failed', err)
        setSaveError('Latest changes could not be saved.')
      })
    }
    if (finished) {
      write()
      return
    }
    const id = window.setTimeout(write, 400)
    return () => window.clearTimeout(id)
  }, [uid, attemptId, finished, session.turns, session.revealed, session.followUps, session.latency])

  return { attemptId, saveError }
}
