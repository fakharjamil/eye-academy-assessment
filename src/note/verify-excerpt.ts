const MIN_EXCERPT_CHARS = 20

/**
 * Makes PDF text and model text comparable without changing the words: joins words split by a
 * hyphenated line break, collapses whitespace, drops spaces before punctuation ("IOP ,"),
 * straightens quotes and dashes, and ignores case.
 */
export function normaliseForMatch(text: string): string {
  return text
    .replace(/(\w)-\s*\n\s*(\w)/g, '$1$2')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/ ([,.;:!?)])/g, '$1')
    .trim()
    .toLowerCase()
}

/** True only if the excerpt appears word for word in the page text. */
export function verifyExcerpt(excerpt: string, pageText: string): boolean {
  const needle = normaliseForMatch(excerpt).replace(/^["']|["']$/g, '')
  if (needle.length < MIN_EXCERPT_CHARS) return false
  const haystack = normaliseForMatch(pageText)
  if (haystack.includes(needle)) return true
  // A real hyphenated word split across lines ("non-\ncontact") loses its hyphen above.
  const noHyphens = (s: string) => s.replace(/-/g, '')
  return noHyphens(haystack).includes(noHyphens(needle))
}
