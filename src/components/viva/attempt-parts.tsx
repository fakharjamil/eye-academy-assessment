import { summariseLatency } from '#/voice/latency'
import type { LatencySample } from '#/voice/use-viva-session'
import type { RevisionPoint } from '#/server/revision-core'
import type { AttemptStatus } from '#/attempts/attempts'
import { cn } from '#/lib/utils'

const STATUS = {
  completed: { label: 'Completed', tone: 'bg-emerald-100 text-emerald-900' },
  in_progress: { label: 'Not finished', tone: 'bg-amber-100 text-amber-900' },
  interrupted: { label: 'Interrupted', tone: 'bg-red-100 text-red-900' },
} as const

export function StatusLabel({ status }: { status: AttemptStatus }) {
  const s = STATUS[status] ?? STATUS.in_progress
  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium', s.tone)}>{s.label}</span>
}

export function formatDate(date: Date | null) {
  return date
    ? date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now'
}

export function RevisionCard({ revision, loading, error }: { revision: RevisionPoint | null | undefined; loading?: boolean; error?: string | null }) {
  return (
    <div className="rounded-lg border p-3 text-sm" data-testid="revision-point">
      <div className="mb-1 font-semibold">Revision point</div>
      {loading && <p className="text-muted-foreground">Reading the reference note…</p>}
      {error && <p className="text-red-700">{error}</p>}
      {revision && revision.supported && (
        <div className="space-y-2">
          <p>{revision.point}</p>
          <blockquote className="border-l-2 pl-3 italic text-muted-foreground">“{revision.excerpt}”</blockquote>
          <p className="text-xs text-muted-foreground">Glaucoma and angle closure reference note, page {revision.page}</p>
        </div>
      )}
      {revision && !revision.supported && <p>{revision.message}.</p>}
      {!loading && !error && !revision && <p className="text-muted-foreground">No revision point for this attempt.</p>}
    </div>
  )
}

export function LatencySummary({ samples }: { samples: LatencySample[] }) {
  const voice = samples.filter((s) => s.kind === 'voice')
  const typed = samples.length - voice.length
  const s = summariseLatency(voice)
  const ms = (v: number | null) => (v === null ? '–' : `${v} ms`)
  const rows = [
    ['All voice turns', s.all],
    ['Plain replies', s.plain],
    ['Replies with a finding lookup', s.finding],
  ] as const
  return (
    <div className="rounded-lg border p-3 text-sm" data-testid="latency-summary">
      <div className="mb-1 font-semibold">Response time</div>
      <p className="mb-2 text-xs text-muted-foreground">
        From the moment you stopped speaking to the moment the examiner's voice started.
        {typed > 0 && ` ${typed} typed turn${typed === 1 ? '' : 's'} not included.`}
      </p>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="font-normal" />
            <th className="font-normal">Turns</th>
            <th className="font-normal">Median</th>
            <th className="font-normal">p90</th>
            <th className="font-normal">Worst</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, r]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{r.count}</td>
              <td>{ms(r.median)}</td>
              <td>{ms(r.p90)}</td>
              <td>{ms(r.worst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
