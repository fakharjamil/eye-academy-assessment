export type Chunk = { id: string; page: number; text: string }

const TARGET_CHARS = 450

/**
 * Splits one page into chunks of a few sentences. Chunks never cross a page, so every chunk has
 * exactly one page number to cite.
 */
export function chunkPage(page: number, text: string): Chunk[] {
  const sentences = text
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)

  const chunks: Chunk[] = []
  let current = ''
  for (const sentence of sentences) {
    current = current ? `${current} ${sentence}` : sentence
    if (current.length >= TARGET_CHARS) {
      chunks.push({ id: `p${page}-${chunks.length + 1}`, page, text: current })
      current = ''
    }
  }
  if (current) chunks.push({ id: `p${page}-${chunks.length + 1}`, page, text: current })
  return chunks
}
