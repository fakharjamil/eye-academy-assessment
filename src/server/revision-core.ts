import { loadCase } from '#/case/case'
import { EMBEDDING_MODEL, TEXT_MODEL } from '#/note/models'
import { loadNoteIndex } from '#/note/note-index'
import { hybridSearch } from '#/note/search'
import { verifyExcerpt } from '#/note/verify-excerpt'

export type RevisionPoint =
  | { supported: true; point: string; page: number; excerpt: string; gap: string; query: string; retrievedPages: number[] }
  | { supported: false; message: string; gap: string; query: string; retrievedPages: number[] }

const NO_SUPPORT = 'No support found in the note'

function apiKey() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set on the server')
  return key
}

/** One JSON-only chat call at temperature 0, so the same transcript gives the same result. */
async function askJson<T>(system: string, user: string, schemaName: string, schema: object): Promise<T> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
    }),
  })
  if (!res.ok) throw new Error(`Text model failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { choices: { message: { content: string } }[] }
  return JSON.parse(json.choices[0].message.content) as T
}

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  })
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status}`)
  const json = (await res.json()) as { data: { embedding: number[] }[] }
  return json.data[0].embedding
}

export type TranscriptTurn = { role: 'examiner' | 'trainee'; text: string }

/** The revision point pipeline without the sign-in check, so scripts can run it too. */
export async function buildRevisionPoint(turns: TranscriptTurn[]): Promise<RevisionPoint> {
  const notes = loadCase().examiner_notes
  const transcript = turns.map((t) => `${t.role === 'trainee' ? 'Trainee' : 'Examiner'}: ${t.text}`).join('\n')

  // 1. Find the biggest gap in the trainee's answer and turn it into a search query.
  const gap = await askJson<{ gap: string; query: string }>(
    'You review an ophthalmology viva. Compare what the TRAINEE said with the examiner key points. Use ONLY the key points as the standard; never use outside medical knowledge, and never call something wrong unless it contradicts a key point. Pick the single most important key point the trainee missed or contradicted. Only if they covered every key point, pick the weakest part of their answer to the follow-up question. Write a short search query (keywords, drug and test names) to find it in a revision note.',
    `Key points:\n${notes.key_points.map((p) => `- ${p}`).join('\n')}\n\nTranscript:\n${transcript || '(the trainee said nothing)'}`,
    'gap',
    {
      type: 'object',
      additionalProperties: false,
      properties: { gap: { type: 'string' }, query: { type: 'string' } },
      required: ['gap', 'query'],
    },
  )

  // 2. Hybrid search over page-bound chunks; keep the top 4.
  const index = loadNoteIndex()
  const passages = hybridSearch(index, gap.query, await embedQuery(gap.query), 4)
  const retrievedPages = [...new Set(passages.map((p) => p.page))]

  // 3. Write one revision point, quoting one passage word for word.
  const answer = await askJson<{ supported: boolean; point: string; page: number; excerpt: string }>(
    'You write one revision point for a trainee, using ONLY the passages given. Quote 1 or 2 sentences word for word from ONE passage as the excerpt (no changes, no ellipses, under 300 characters) and give that passage\'s page number. If no passage supports a revision point for the gap, set supported to false and leave the other fields empty or 0.',
    `Gap: ${gap.gap}\n\nPassages:\n${passages.map((p) => `[page ${p.page}] ${p.text}`).join('\n\n')}`,
    'revision_point',
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        supported: { type: 'boolean' },
        point: { type: 'string' },
        page: { type: 'integer' },
        excerpt: { type: 'string' },
      },
      required: ['supported', 'point', 'page', 'excerpt'],
    },
  )

  // 4. Trust nothing: the excerpt must really be on the cited page, and that page must have been retrieved.
  const pageText = index.pages.find((p) => p.page === answer.page)?.text ?? ''
  const checked =
    answer.supported && retrievedPages.includes(answer.page) && verifyExcerpt(answer.excerpt, pageText)
  if (!checked) return { supported: false, message: NO_SUPPORT, gap: gap.gap, query: gap.query, retrievedPages }
  return {
    supported: true,
    point: answer.point,
    page: answer.page,
    excerpt: answer.excerpt,
    gap: gap.gap,
    query: gap.query,
    retrievedPages,
  }
}
