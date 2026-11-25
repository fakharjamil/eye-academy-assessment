import type { LatencySample } from './use-viva-session'

export type LatencyStats = { count: number; median: number | null; p90: number | null; worst: number | null }

/** Percentile with linear interpolation between neighbours (p in 0–1). */
function percentile(sorted: number[], p: number): number {
  const position = p * (sorted.length - 1)
  const low = Math.floor(position)
  const high = Math.ceil(position)
  return Math.round(sorted[low] + (sorted[high] - sorted[low]) * (position - low))
}

function stats(values: number[]): LatencyStats {
  if (!values.length) return { count: 0, median: null, p90: null, worst: null }
  const sorted = [...values].sort((a, b) => a - b)
  return { count: sorted.length, median: percentile(sorted, 0.5), p90: percentile(sorted, 0.9), worst: sorted.at(-1)! }
}

/**
 * Time from the trainee finishing (speech stopped, or typed message sent) to the examiner's audio
 * starting. Finding turns include a tool call, so they are reported separately.
 */
export function summariseLatency(samples: LatencySample[]) {
  return {
    all: stats(samples.map((s) => s.ms)),
    plain: stats(samples.filter((s) => !s.finding).map((s) => s.ms)),
    finding: stats(samples.filter((s) => s.finding).map((s) => s.ms)),
  }
}
