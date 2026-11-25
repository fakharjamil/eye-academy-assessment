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
