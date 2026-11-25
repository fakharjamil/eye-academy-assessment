import rawIndex from '../../data/note-index.json'

export type IndexedChunk = { id: string; page: number; text: string; vector: number[] }
export type NoteIndex = {
  source: string
  embeddingModel: string
  pages: { page: number; text: string }[]
  chunks: IndexedChunk[]
}

/** Built by `pnpm prep:note` from the reference PDF. */
export function loadNoteIndex(): NoteIndex {
  return rawIndex as NoteIndex
}
