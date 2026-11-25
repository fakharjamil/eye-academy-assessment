# Eye Academy voice viva

Spoken ophthalmology viva: TanStack Start + Firebase Auth/Firestore + OpenAI Realtime (WebRTC). One case
(`data/case-ea-viva-001.json`), one reference note (`data/glaucoma-note.pdf`). Commands live in
`package.json`; `pnpm check` is the gate before every commit.

## Invariants (each one is tested; keep the test green when you change the code)

- **Findings reach the trainee only through `getFinding`** in `src/case/findings.ts`, the single place a
  value, eye and unit become text. The voice tool handler and the cards both use its result. Examiner
  instructions (`src/voice/session-config.ts`) carry no finding values; a test checks all of them.
- **`available` decides availability, never `value`** (rapd has a value and is unavailable).
- **Units are appended only to bare measurements**, so text that already names its unit stays as written.
- **The follow-up and the end are enforced in code** (`src/voice/follow-up.ts`): one `ask_follow_up`,
  and `end_viva` is refused before it. The prompt describes the behaviour; the code guarantees it.
- **A revision point is shown only if `verifyExcerpt` finds the quote on the cited page, and that page
  was retrieved.** Otherwise the trainee sees "No support found in the note". Keep this gate whenever the
  prompt, model or search changes.
- **Attempts are owner-only** (`firestore.rules`). After editing rules: `pnpm test:rules`, then
  `pnpm exec firebase deploy --only firestore:rules`.

## Realtime session (`src/voice/use-viva-session.ts`)

- Ask for a reply with `requestResponse()`: OpenAI allows one response at a time, and a tool result
  arrives while its response is still open, so the request queues until `response.done`.
- Event names follow the GA API; see `docs/realtime-notes.md` before using an older example.
- To diagnose a session, use the dev-only **Copy debug log** link on the viva page: every event in and
  out, with timings.
- Latency: timer from `input_audio_buffer.speech_stopped` to `output_audio_buffer.started`. Samples are
  saved with the attempt; trainees never see them.

## Secrets and environments

- `VITE_*` values in `.env.local` are public (sent to the browser).
- `OPENAI_API_KEY` is server-only: `.dev.vars` locally, `wrangler secret put` in production.
- The server verifies Firebase ID tokens with `jose` (Workers-compatible).

## Gotchas

- `/_authed` routes are client-only (`ssr: false`) because Firebase Auth lives in the browser.
- The dev server uses port 3100 with `--strictPort`.
- The Firestore emulator needs Java on `PATH`. With Homebrew's keg-only `openjdk@21`, add
  `/opt/homebrew/opt/openjdk@21/bin`.
- Unit tests pin today's case values (58 / 18 mmHg …), so editing the case JSON is expected to fail them.
  Update the expectations together with the data.
- The PDF index is generated: run `pnpm prep:note` after changing the PDF. It stops if a printed page
  number does not match the physical page.
- The shadcn CLI can misread the `#/` alias: new components import `cn` from `#/lib/utils`.

## Deeper docs

- `docs/checks.md`: the three checks, expected vs observed, and how to repeat them.
- `docs/note-page-map.md`: what each PDF page holds, and the distractor pages.
- `docs/tickets.md`: how the build was split, and why.
