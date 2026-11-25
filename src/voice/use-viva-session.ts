import { useCallback, useEffect, useRef, useState } from 'react'
import { getFinding, type FindingResult } from '#/case/findings'
import { getFirebaseAuth } from '#/lib/firebase'
import { mintVoiceToken } from '#/server/voice'

/** Whose turn it is. Drives the indicator so the trainee always knows when to speak. */
export type Phase =
  | 'idle'
  | 'connecting'
  | 'examiner' // examiner audio is playing
  | 'trainee' // trainee is speaking
  | 'thinking' // trainee finished, waiting for the examiner
  | 'your-turn'
  | 'ended'
  | 'error'

export type Turn = { id: string; role: 'examiner' | 'trainee'; text: string; final: boolean; at: number }
export type RevealedFinding = FindingResult & { at: number }
export type LatencySample = { ms: number; at: number; kind: 'voice' | 'typed'; finding: boolean }

type ServerEvent = { type: string; [key: string]: any }

export function useVivaSession() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [revealed, setRevealed] = useState<RevealedFinding[]>([])
  const [latency, setLatency] = useState<LatencySample[]>([])
  const [error, setError] = useState<string | null>(null)
  const [micName, setMicName] = useState<string | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const meterStop = useRef<(() => void) | null>(null)

  const pc = useRef<RTCPeerConnection | null>(null)
  const channel = useRef<RTCDataChannel | null>(null)
  const mic = useRef<MediaStream | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const timer = useRef<{ start: number; kind: 'voice' | 'typed'; finding: boolean } | null>(null)
  const examinerSpeaking = useRef(false)
  const endRequested = useRef(false)

  const send = useCallback((event: object) => {
    if (channel.current?.readyState === 'open') channel.current.send(JSON.stringify(event))
  }, [])

  const upsertTurn = useCallback((id: string, role: Turn['role'], update: (text: string) => string, final: boolean) => {
    setTurns((prev) => {
      const index = prev.findIndex((t) => t.id === id)
      if (index === -1) return [...prev, { id, role, text: update(''), final, at: Date.now() }]
      const next = [...prev]
      next[index] = { ...next[index], text: update(next[index].text), final: final || next[index].final }
      return next
    })
  }, [])

  const teardown = useCallback(() => {
    channel.current?.close()
    pc.current?.close()
    mic.current?.getTracks().forEach((t) => t.stop())
    audio.current?.pause()
    meterStop.current?.()
    meterStop.current = null
    setMicLevel(0)
    channel.current = null
    pc.current = null
    mic.current = null
  }, [])

  const finish = useCallback(() => {
    teardown()
    setPhase('ended')
  }, [teardown])

  const handleToolCall = useCallback(
    (event: ServerEvent) => {
      const { call_id, name } = event
      if (name === 'get_finding') {
        let findingId = 'not_in_case'
        try {
          findingId = JSON.parse(event.arguments).finding_id ?? 'not_in_case'
        } catch {
          // keep not_in_case
        }
        const result = getFinding(findingId)
        // The card shows the formatter's result, never the model's words.
        setRevealed((prev) => [...prev, { ...result, at: Date.now() }])
        if (timer.current) timer.current.finding = true
        send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify({ spoken: result.spoken, available: result.available }),
          },
        })
        send({ type: 'response.create' })
      } else if (name === 'end_viva') {
        endRequested.current = true
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id, output: '{"ok":true}' } })
        if (!examinerSpeaking.current) finish()
      }
    },
    [finish, send],
  )

  const handleEvent = useCallback(
    (event: ServerEvent) => {
      if (import.meta.env.DEV && !event.type.endsWith('.delta')) console.debug('[realtime]', event.type)
      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          setPhase('trainee')
          break
        case 'input_audio_buffer.speech_stopped':
          // Latency timer starts when the trainee stops speaking.
          timer.current = { start: performance.now(), kind: 'voice', finding: false }
          setPhase('thinking')
          break
        case 'input_audio_buffer.committed':
          upsertTurn(event.item_id, 'trainee', (t) => t, false)
          break
        case 'conversation.item.input_audio_transcription.delta':
          upsertTurn(event.item_id, 'trainee', (t) => t + event.delta, false)
          break
        case 'conversation.item.input_audio_transcription.completed':
          upsertTurn(event.item_id, 'trainee', () => event.transcript.trim(), true)
          break
        case 'conversation.item.input_audio_transcription.failed':
          upsertTurn(event.item_id, 'trainee', () => '(speech could not be transcribed)', true)
          break
        case 'response.output_audio_transcript.delta':
          upsertTurn(event.item_id, 'examiner', (t) => t + event.delta, false)
          break
        case 'response.output_audio_transcript.done':
          upsertTurn(event.item_id, 'examiner', () => event.transcript, true)
          break
        case 'output_audio_buffer.started': {
          // ...and stops when the examiner's audio starts playing.
          examinerSpeaking.current = true
          const t = timer.current
          if (t) setLatency((prev) => [...prev, { ms: Math.round(performance.now() - t.start), at: Date.now(), kind: t.kind, finding: t.finding }])
          timer.current = null
          setPhase('examiner')
          break
        }
        case 'output_audio_buffer.stopped':
        case 'output_audio_buffer.cleared':
          examinerSpeaking.current = false
          if (endRequested.current) finish()
          else setPhase((p) => (p === 'examiner' ? 'your-turn' : p))
          break
        case 'response.function_call_arguments.done':
          handleToolCall(event)
          break
        case 'error':
          console.error('Realtime error', event.error)
          setError(event.error?.message ?? 'Voice service error')
          break
      }
    },
    [finish, handleToolCall, upsertTurn],
  )

  const start = useCallback(async () => {
    setError(null)
    setTurns([])
    setRevealed([])
    setLatency([])
    endRequested.current = false
    setPhase('connecting')
    try {
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error('Please sign in again.')
      const { key, model } = await mintVoiceToken({ data: { idToken: await user.getIdToken() } })

      const connection = new RTCPeerConnection()
      pc.current = connection
      const player = audio.current ?? new Audio()
      player.autoplay = true
      audio.current = player
      connection.ontrack = (e) => {
        player.srcObject = e.streams[0]
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mic.current = stream
      const micTrack = stream.getAudioTracks()[0]
      setMicName(micTrack?.label || 'Unknown microphone')
      if (micTrack?.muted) setError('Your microphone is muted by the system. Check System Settings → Privacy → Microphone.')
      meterStop.current = startMicMeter(stream, setMicLevel)
      stream.getTracks().forEach((track) => connection.addTrack(track, stream))

      const dc = connection.createDataChannel('oai-events')
      channel.current = dc
      dc.onmessage = (e) => handleEvent(JSON.parse(e.data))
      dc.onopen = () => {
        // The examiner opens with the case prompt (see instructions).
        send({ type: 'response.create' })
        setPhase('thinking')
      }

      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      const answer = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/sdp' },
      })
      if (!answer.ok) throw new Error(`Could not connect to the voice service (${answer.status}, ${model})`)
      await connection.setRemoteDescription({ type: 'answer', sdp: await answer.text() })
    } catch (err) {
      teardown()
      setError(err instanceof Error ? err.message : 'Could not start the viva')
      setPhase('error')
    }
  }, [handleEvent, send, teardown])

  /** Typed fallback: same conversation, no microphone needed. */
  const sendText = useCallback(
    (text: string) => {
      const message = text.trim()
      if (!message) return
      upsertTurn(`typed-${Date.now()}`, 'trainee', () => message, true)
      send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: message }] } })
      send({ type: 'response.create' })
      timer.current = { start: performance.now(), kind: 'typed', finding: false }
      setPhase('thinking')
    },
    [send, upsertTurn],
  )

  useEffect(() => teardown, [teardown])

  return { phase, turns, revealed, latency, error, micName, micLevel, start, stop: finish, sendText }
}

/** Reports the microphone input level (0–1) about ten times a second, so silence is visible. */
function startMicMeter(stream: MediaStream, onLevel: (level: number) => void): () => void {
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 512
  context.createMediaStreamSource(stream).connect(analyser)
  const samples = new Float32Array(analyser.fftSize)
  const id = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples)
    let sum = 0
    for (const s of samples) sum += s * s
    onLevel(Math.min(1, Math.sqrt(sum / samples.length) * 8))
  }, 100)
  return () => {
    window.clearInterval(id)
    void context.close()
  }
}
