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
