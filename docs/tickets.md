# Eye Academy voice viva: implementation tickets

Source of truth for the build. Where this file and `plan.md` differ, this file wins.

## Decisions (24 Nov 2026)
- Firebase: real project (free plan) + emulator for rules tests.
- Voice: OpenAI Realtime over WebRTC. Named alternative: Gemini Live.
- Sign-in: email/password only, two test users (A and B).
- Deploy: Cloudflare Workers (free plan). ID tokens verified with `jose` against Google's public keys, because `firebase-admin` targets Node and may not run on Workers.
- Time: one focused 4-hour build session, tagged `four-hour-mark`. Setup before it and write-up and extras after it are reported separately in the README.

## Timeline (Pakistan time)
Deadline: 25 Nov 23:59 GMT = **26 Nov 04:59 PKT**.
- Before the session: prep checklist P1-P4 (not counted).
- 4-hour session: start **no later than 22:00 PKT on 25 Nov**, ideally 21:00.
- After the session: A1-A4, then submit by email.

## Prep (before the clock, not counted)
- **P1 Accounts and tools.** Firebase project: Auth email/password on, Firestore created, web app config copied. Users A and B created. OpenAI key with credit. Cloudflare account and `wrangler login`. Node 20+, pnpm, Firebase CLI, Java 11+ (the Firestore emulator needs it). Empty GitHub repo the reviewers can open.
- **P2 Docs check.** Confirm on the OpenAI docs: current Realtime model name, ephemeral key endpoint, WebRTC connect URL, session config shape (tools, server VAD, input transcription field), and event names: `input_audio_buffer.speech_started/stopped`, `response.function_call_arguments.done`, `output_audio_buffer.started/stopped`, input and output transcript events. Note them in `docs/realtime-notes.md`.
- **P3 PDF page map.** Extract text per page and confirm which pages hold acute angle closure (expected 3-6) and that "sulfonamide allergy" before acetazolamide is on page 6.
- **P4 Tickets.** Copy this file into the repo as `docs/tickets.md`.

## 4-hour session (240 min, one commit per ticket)

### T1 Scaffold and sign-in (30 min)
- TanStack Start app with pnpm, strict TypeScript, Tailwind 4, shadcn/ui.
- Firebase client init from env. `/login` with email/password. Auth context.
- `beforeLoad` guard on `/viva` and `/attempts*` that redirects to `/login`. Sign-out button.
- **Done when:** user A signs in, sees their email on `/viva`, signs out; a signed-out visit to `/viva` lands on `/login`.

### T2 Case core, test first (25 min) · skill: `tdd`
- `data/case-ea-viva-001.json` (unchanged copy). zod schema. Loaded on every call.
- `findings.ts`: `lookupFinding(id)` and `formatFinding(finding)` returning `{display, spoken, available, reason}`.
- Tests: all 24 findings format without error; `iop_right` → "58 mmHg", right eye, Goldmann 23:55; `iop_left` → 18; pupil shows "5 mm" once; VA shows "6/36 (Snellen)"; `rapd` is unavailable with its reason although `value` is set; `gonio_right` → "Not available: No view: corneal oedema"; unknown id → "not part of this case".
- **Done when:** `pnpm test` is green.

### T3 Voice session (50 min)
- Server function `mintVoiceToken`: verify ID token with `jose`; read case; build instructions with history, diagnosis, key points and follow-up ideas, **no finding values**; tools `get_finding(finding_id: enum of ids + not_in_case)` and `end_viva`; server VAD; input transcription on; return ephemeral key + findings.
- Browser: `RTCPeerConnection`, mic track, remote audio element, events data channel.
- On a `get_finding` call: run the formatter, send the function output with the exact `spoken` text, ask for a response, render the card from the formatter result.
- Transcript list from transcript events. Turn indicator state machine: Listening → Thinking → Examiner speaking → Your turn.
- Typed fallback: text box sends a user message over the data channel.
- **Done when:** saying "right eye pressure" plays and shows 58 mmHg for the right eye; "right gonioscopy" says not available with the reason; the indicator changes with each phase.

### T4 Follow-up and end of viva (15 min)
- Instructions: after diagnosis and management, ask exactly one follow-up aimed at a gap in that answer, then call `end_viva`.
- `MAX_FOLLOW_UPS = 1` in config; app counts follow-ups and ends the session on `end_viva`.
- **Done when:** one follow-up is asked, then the session closes and the results view opens.

### T5 Saved attempts and privacy (30 min) · skill: `tdd` for rules
- Create `users/{uid}/attempts/{id}` at start; update after every turn (turns, revealed findings, latency samples).
- `/attempts` list and `/attempts/$id` view (transcript, revealed cards, revision point).
- `firestore.rules`: owner only. Rules tests on the emulator: A reads own → allowed; B reads A → denied; signed out → denied.
- **Done when:** refresh restores the attempt; user B gets "permission denied" on A's link; rules tests pass.

### T6 Revision point with citation (45 min) · skill: `tdd` for the substring check
- `scripts/prep-note.ts` (`pnpm prep:note`): pdfjs text per page, footer page check, paragraph chunks that never cross a page, embeddings, write `data/note-index.json`.
- Server function `makeRevisionPoint`: verify ID token; LLM call 1 finds the biggest gap against the key points and writes a query; rank chunks by cosine + BM25, keep top 4; LLM call 2 (temperature 0, JSON) returns `supported, point, page, excerpt`; code checks the excerpt is a verbatim substring of a retrieved chunk on that page (whitespace and hyphen breaks normalised); else "No support found in the note".
- Show on the results view and save to the attempt with `retrievedPages`.
- **Done when:** a transcript that misses the sulfonamide check cites page 6 with a matching excerpt; an off-topic transcript shows "No support found".

### T7 Latency and the three checks (20 min)
- Log `performance.now()` at `speech_stopped` and at `output_audio_buffer.started`; save per turn.
- Run 10 voice turns. Run the three checks by voice and note observed results.
- `pnpm check` runs the unit, rules and citation checks.

### T8 Stop and snapshot (5 min)
- Commit, `git tag four-hour-mark`, push. Write three lines: what works, what does not, where it stopped.

**Buffer: 20 min.**

### Cut rules inside the session
- T3 over 70 min → drop typed fallback, keep everything else.
- Behind at 3:00 → T6 uses BM25 only (no embeddings).
- Never cut: T2 tests, owner-only rules, the citation substring check, the T8 tag.

## After the clock (reported separately)
- **A1 Write-up (60 min).** README: setup and run steps; status at `four-hour-mark` and total time; model choice and Gemini Live as the alternative; latency method and numbers; the three checks with expected and observed results, retrieved pages and the cited passage; note prep and passage selection; one AI-tool example (formatter written with Claude Code, verified by T2 tests); one improvement and why. Repo `CLAUDE.md` for their Claude Code (skill: `writing-for-agents`).
- **A2 Deploy (30 min).** Cloudflare Workers config, `wrangler secret put`, add the workers.dev domain to Firebase authorized domains, smoke test sign-in and one finding.
- **A3 Extras on branch `after-four-hours` (optional).** Routing eval (30 phrases incl. left/right), citation eval (6 answers), Playwright e2e in text mode, 20-turn latency, barge-in. Review with `code-review` before merging.
- **A4 Final docs (45 min).** Replace working notes with clean project docs: `docs/architecture.md` (system diagram and one finding turn), `docs/tickets.md` (tickets and why the work was split this way), `docs/decisions.md` (model choice and alternative, auth, deploy). Remove personal notes and HTML drafts; `planning/` stays out of git.
- **Submit.** Email the repo link, live link and write-up to team@eye.academy before 04:59 PKT, with an AI usage screenshot.
