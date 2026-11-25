# How the work was split

## Why these tickets

- **One working slice per ticket.** Each ticket ends in something you can try by hand: sign in, a finding read aloud, a saved attempt. It never ends in a half-built layer.
- **Risk first.** The findings formatter (T2) came before voice (T3), so voice was built on code already proven correct.
- **Test first where a mistake would be serious:**
  - the formatter (a wrong eye or value)
  - the privacy rules (another trainee's attempt)
  - the quote check (an invented citation)
- **One commit per ticket**, so the history shows the order and the timing.
- **Never cut:** the formatter tests, the owner-only rules, the quote check, and the four-hour tag.

## Before the clock (not counted)

- **Accounts and tools:** Firebase project, OpenAI key, Java for the Firestore emulator.
- **Docs check:** the current OpenAI Realtime model, endpoints and event names (summary in `CLAUDE.md`).
- **PDF page map:** which pages hold acute angle closure, and where the distractors are, in [`note-page-map.md`](note-page-map.md).
- **Scaffold:** TanStack Start with Tailwind, shadcn/ui and the Cloudflare adapter, plus the case data.

## The four hours

| Ticket | Goal | Done when | What actually happened |
|---|---|---|---|
| **T1** Scaffold and sign-in | Email/password sign-in; the viva page is guarded | User A signs in and sees their email; a signed-out visit goes to `/login` | – |
| **T2** Case and formatter (test first) | One place where a value, eye and unit become text | `pnpm test` green | Units only on bare numbers; `available` decides, so RAPD stays hidden |
| **T3** Voice session | Ask aloud, hear and see the exact finding | "Right eye pressure" → 58 mmHg, right eye | A silent microphone was hard to spot, so a mic level meter was added. Semantic listening (so a pause doesn't end a turn) and lost-connection handling were added |
| **T4** Follow-up and end | One follow-up, then results | One follow-up, then Viva complete | Bug: a reply was requested while one was still in progress, and the viva froze. Fixed with a reply queue. The "Done speaking" button was added |
| **T5** Saved attempts and privacy (test first) | Reopen after refresh; owner only | Refresh restores it; user B is denied; rules tests pass | Rules deployed; the owner's id is in the link, so user B sees "Permission denied" |
| **T6** Revision point (test first) | One point cited to a page | A missed sulfonamide check cites page 6; an unsupported gap gives "No support found" | `gpt-4.1-mini` misjudged gaps, so both text calls use `gpt-4.1` |
| **T7** Latency and the three checks | Measure a voice turn; record the checks | Numbers and checks recorded | One sample read 298 s: the timer survived an unanswered turn. Fixed. The model once ended without a follow-up, so the end is now enforced in code |
| **T8** Stop | Tag and push | `four-hour-mark` on GitHub | – |

## Timeline (25 Nov 2026, PKT)

| Time | Commit |
|---|---|
| 15:25 | Setup before the clock (tag `four-hour-start`) |
| 15:31 | T1 |
| 15:36 | T2 |
| 16:22 / 16:33 | T3 / T3 listening and connection fixes |
| 17:10 | T4 |
| 17:28 | T5 |
| 17:41 | T6 |
| 18:16 | T7 |
| 18:17 | T8 (tag `four-hour-mark`): **2 h 52 min** |

## After the clock

- Response times removed from the screen. They are still saved and logged.
- A favicon.
- The README in the brief's order, `CLAUDE.md`, and these docs.
- **Pending:** deploy to Cloudflare Workers, and an end-to-end test on the Firebase emulators.
