import type { IndexedChunk, NoteIndex } from './note-index'

export type ScoredChunk = Omit<IndexedChunk, 'vector'> & { score: number; keyword: number; meaning: number }

const STOPWORDS = new Set(
  'a an and are as at be by for from has have if in into is it its of on or that the then this to was were what when which with you your'.split(' '),
)

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => !STOPWORDS.has(t))
}

/** Classic BM25 keyword score for every chunk. */
function bm25(chunks: IndexedChunk[], query: string, k1 = 1.5, b = 0.75): number[] {
  const docs = chunks.map((c) => tokens(c.text))
  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / docs.length
  const terms = [...new Set(tokens(query))]
  const docFreq = new Map(terms.map((t) => [t, docs.filter((d) => d.includes(t)).length]))
  return docs.map((doc) =>
    terms.reduce((score, term) => {
      const tf = doc.filter((t) => t === term).length
      if (!tf) return score
      const df = docFreq.get(term) ?? 0
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5))
      return score + (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / avgLength))
    }, 0),
  )
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

/** Scales scores to 0–1 so keyword and meaning scores can be added fairly. */
function rescale(values: number[]): number[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return values.map((v) => (max > min ? (v - min) / (max - min) : 0))
}

/**
 * Hybrid search: half keyword (BM25, good at exact drug names like "acetazolamide"), half meaning
 * (embeddings, good at paraphrase). Without a query vector it falls back to keywords only.
 */
export function hybridSearch(index: NoteIndex, query: string, queryVector: number[] | null, k = 4): ScoredChunk[] {
  const keyword = rescale(bm25(index.chunks, query))
  const meaning = queryVector ? rescale(index.chunks.map((c) => cosine(queryVector, c.vector))) : null
  return index.chunks
    .map(({ vector: _vector, ...chunk }, i) => ({
      ...chunk,
      keyword: keyword[i],
      meaning: meaning ? meaning[i] : 0,
      score: meaning ? 0.5 * keyword[i] + 0.5 * meaning[i] : keyword[i],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
