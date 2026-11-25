import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { loadCase } from '#/case/case'
import { buildSessionConfig } from '#/voice/session-config'
import { verifyIdToken } from './firebase-token'

/**
 * Returns a short-lived OpenAI key for one voice session. The real API key never leaves the server,
 * and only signed-in users get a key.
 */
export const mintVoiceToken = createServerFn({ method: 'POST' })
  .validator(z.object({ idToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    await verifyIdToken(data.idToken)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set on the server')

    const session = buildSessionConfig(loadCase())
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expires_after: { anchor: 'created_at', seconds: 600 }, session }),
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('client_secrets failed', response.status, detail)
      throw new Error(`Voice service refused the session (${response.status})`)
    }
    const body = (await response.json()) as { value: string; expires_at: number }
    return { key: body.value, expiresAt: body.expires_at, model: session.model }
  })
