/**
 * pnpm prep:note [--dry]
 * Turns the reference PDF into data/note-index.json: the text of every page plus page-bound chunks
 * with embeddings. Run again whenever the PDF changes.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { chunkPage } from '../src/note/chunk'
import { EMBEDDING_MODEL } from '../src/note/models'

const PDF = 'data/glaucoma-note.pdf'
const OUT = 'data/note-index.json'
const HEADER = /^eyeacademy\s+Take-home reference note$/
const FOOTER = /^Glaucoma and angle closure · Eye Academy reference note (\d+)$/

async function extractPages() {
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(PDF)) }).promise
  const pages: { page: number; text: string }[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    const raw = content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join('')
    const lines = raw.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

    // The printed page number must match the physical page, or every citation would be off.
    const footer = lines.at(-1)?.match(FOOTER)
    if (!footer || Number(footer[1]) !== n) throw new Error(`Page ${n}: footer page number missing or wrong: "${lines.at(-1)}"`)
    const body = lines.slice(0, -1).filter((l) => !HEADER.test(l))
    pages.push({ page: n, text: body.join('\n') })
  }
  return pages
}

function openAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  if (existsSync('.dev.vars')) {
    const match = readFileSync('.dev.vars', 'utf8').match(/^OPENAI_API_KEY=(.+)$/m)
    if (match) return match[1].trim()
  }
  throw new Error('Set OPENAI_API_KEY (or put it in .dev.vars)')
}

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  })
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { data: { embedding: number[] }[] }
  return json.data.map((d) => d.embedding.map((v) => Math.round(v * 1e5) / 1e5))
}

const pages = await extractPages()
const chunks = pages.flatMap((p) => chunkPage(p.page, p.text))
console.log(`${pages.length} pages, ${chunks.length} chunks`)
for (const p of pages) console.log(`  page ${p.page}: ${chunks.filter((c) => c.page === p.page).length} chunks`)

if (process.argv.includes('--dry')) {
  for (const c of chunks) console.log(`\n[${c.id}] ${c.text}`)
} else {
  const vectors = await embed(chunks.map((c) => c.text))
  const index = {
    source: PDF,
    embeddingModel: EMBEDDING_MODEL,
    pages,
    chunks: chunks.map((c, i) => ({ ...c, vector: vectors[i] })),
  }
  writeFileSync(OUT, JSON.stringify(index))
  console.log(`Wrote ${OUT}`)
}
