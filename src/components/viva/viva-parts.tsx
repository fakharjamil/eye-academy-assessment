import { useState, type FormEvent } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import type { Phase, RevealedFinding, Turn } from '#/voice/use-viva-session'

const PHASES: Record<Phase, { label: string; hint: string; tone: string }> = {
  idle: { label: 'Ready', hint: 'Press Start viva when you are ready.', tone: 'bg-muted text-foreground' },
  connecting: { label: 'Connecting…', hint: 'Allow microphone access if asked.', tone: 'bg-muted text-foreground' },
  examiner: { label: 'Examiner speaking', hint: 'Please wait until the examiner finishes.', tone: 'bg-amber-100 text-amber-900' },
  trainee: { label: 'Listening to you', hint: 'Keep going. Pause when you are done.', tone: 'bg-sky-100 text-sky-900' },
  thinking: { label: 'Examiner is thinking…', hint: 'Please wait.', tone: 'bg-amber-50 text-amber-900' },
  'your-turn': { label: 'Your turn', hint: 'Speak now: ask for a finding or give your answer.', tone: 'bg-emerald-100 text-emerald-900' },
  ended: { label: 'Viva ended', hint: 'Thank you.', tone: 'bg-muted text-foreground' },
  error: { label: 'Something went wrong', hint: 'See the message below.', tone: 'bg-red-100 text-red-900' },
}

export function TurnIndicator({ phase }: { phase: Phase }) {
  const p = PHASES[phase]
  return (
    <div role="status" aria-live="polite" className={cn('rounded-lg px-4 py-3', p.tone)}>
      <div className="flex items-center gap-2 font-semibold">
        {(phase === 'your-turn' || phase === 'trainee') && (
          <span className="size-2.5 animate-pulse rounded-full bg-current" aria-hidden />
        )}
        {p.label}
      </div>
      <div className="text-sm opacity-80">{p.hint}</div>
    </div>
  )
}

/** Shows which microphone is in use and whether it hears anything. */
export function MicMeter({ name, level }: { name: string; level: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="truncate">Mic: {name}</span>
      <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded bg-muted" aria-label="Microphone level">
        <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${Math.round(level * 100)}%` }} />
      </div>
    </div>
  )
}

const EYE_LABEL ={ right: 'Right eye', left: 'Left eye', both: 'Both eyes' } as const

export function FindingCard({ finding }: { finding: RevealedFinding }) {
  if (!finding.found) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground" data-testid="finding-card">
        {finding.display}
      </div>
    )
  }
  return (
    <div
      data-testid="finding-card"
      className={cn('rounded-lg border p-3', !finding.available && 'border-dashed bg-muted/40')}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{finding.label}</span>
        {finding.eye && (
          <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold text-background">
            {EYE_LABEL[finding.eye]}
          </span>
        )}
      </div>
      <div className={cn('mt-1 text-lg font-semibold', !finding.available && 'text-base font-medium')}>
        {finding.display}
      </div>
      {finding.available && finding.method && (
        <div className="text-xs text-muted-foreground">{finding.method}</div>
      )}
    </div>
  )
}

export function Transcript({ turns }: { turns: Turn[] }) {
  if (!turns.length) return <p className="text-sm text-muted-foreground">The conversation will appear here.</p>
  return (
    <ol className="space-y-2">
      {turns.map((t) => (
        <li key={t.id} className={cn('rounded-lg px-3 py-2 text-sm', t.role === 'examiner' ? 'bg-muted' : 'ml-8 bg-sky-50')}>
          <span className="mr-1 font-semibold">{t.role === 'examiner' ? 'Examiner:' : 'You:'}</span>
          {t.text || <span className="text-muted-foreground">…</span>}
        </li>
      ))}
    </ol>
  )
}

export function TypedInput({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState('')
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    onSend(text)
    setText('')
  }
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        aria-label="Type instead of speaking"
        placeholder="Or type here, e.g. right eye pressure"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <Button type="submit" variant="secondary" disabled={disabled || !text.trim()}>
        Send
      </Button>
    </form>
  )
}
