# Status at the four-hour mark

*Snapshot written when the clock stopped (tag `four-hour-mark`); not updated since. Current status: [README](../README.md).*

Clock started 25 Nov 2026 15:25 PKT (tag `four-hour-start`) and stopped 18:17 PKT (tag `four-hour-mark`):
2 hours 52 minutes of build time. Setup before the clock (scaffold, dependencies, docs check, PDF page
map) is in the first commit.

**What works.** Signed-in trainees run a spoken viva on EA-VIVA-001 (OpenAI Realtime over WebRTC).
Findings come only from the case JSON through a tool, so the examiner reads and the card shows the
correct eye, value and unit; unavailable and unknown findings are stated as such. The turn indicator
shows when to speak, there is a typed fallback and a "Done speaking" button, and the app enforces exactly
one follow-up before the viva can end. Attempts (transcript, findings, follow-up, latency, revision
point) are saved after every turn, reopen after a refresh, and are private to their owner (Firestore
rules, tested on the emulator, deployed). After the viva, one revision point is cited to a page of the
reference note with an excerpt that code checks word for word, or "No support found in the note".
28 unit tests and 4 rules tests pass; the three checks are recorded in `docs/checks.md`.

**What does not, or is not verified.** Not deployed yet (runs locally). The last two fixes (latency
timer reset, end only after the follow-up) pass unit tests but were not re-run by voice. A long pause
mid-answer can still end the trainee's turn early. No end-to-end browser test yet.

**Where it stopped.** After T7 (latency and checks). Next: README and handover notes, deploy to
Cloudflare Workers, then extras (end-to-end test on the Firebase emulators, routing eval).
