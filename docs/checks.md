# Checks: expected vs observed

Run on 25 Nov 2026 against case EA-VIVA-001 and the reference note. Each check has a repeatable
command plus the result of a real voice run.

## How to repeat

| Command | What it checks | Needs |
|---|---|---|
| `pnpm test` | Formatter (all 24 findings), no finding values in the examiner instructions, one follow-up, end only after the follow-up, excerpt check, search, latency maths | nothing |
| `pnpm test:rules` | Firestore rules: owner only | Java 11+ (emulator) |
| `pnpm check:findings` | What the examiner says and the card shows for check 1 and 2 | nothing |
| `pnpm check:citation` | Check 3, end to end with the real models | `OPENAI_API_KEY` |

## Check 1: available finding

| | |
|---|---|
| Input (voice) | "What's the right eye pressure?", then "And the left?" |
| Expected | Right eye, Intraocular pressure, 58 mmHg, Goldmann applanation 23:55. Left: 18 mmHg |
| Observed (voice run) | Examiner: "Right eye, Intraocular pressure: 58 mmHg." Card: Right eye, 58 mmHg, Goldmann applanation, 23:55. Left: "Left eye, Intraocular pressure: 18 mmHg." ✅ |
| Observed (`check:findings`) | 2 of 2 PASS ✅ |

## Check 2: unavailable finding

| | |
|---|---|
| Input (voice) | "Right gonioscopy?", "Is there an RAPD?", "Can I have a CT head?" |
| Expected | Gonioscopy: "Not available: No view: corneal oedema". RAPD: not available with its reason, although the JSON has a value. CT head: not part of this case |
| Observed (voice run) | "Right eye, Gonioscopy: not available. No view: corneal oedema." "Both eyes, Relative afferent pupillary defect: not available. Right pupil fixed, so the test cannot be interpreted." CT head was transcribed as "city head" and still answered "That is not part of this case." Cards match. ✅ |
| Observed (`check:findings`) | 3 of 3 PASS ✅ |

## Check 3: citation support

Pipeline: biggest gap against the examiner key points → hybrid search (BM25 + embeddings) over
page-bound chunks, top 4 → one point quoting one passage → code accepts it only if the excerpt is on
the cited, retrieved page word for word.

| Input | Expected | Retrieved pages | Observed |
|---|---|---|---|
| Answer that misses the sulfonamide allergy check (`check:citation` 1) | Supported, page 6, excerpt about sulfonamide | 6, 9, 8, 3 | ✅ Page 6: "Check for sulfonamide allergy, kidney disease, low potassium and sickle cell disease before giving it." |
| Off-topic answer: "migraine, paracetamol, send home" (`check:citation` 2) | A point from the acute angle closure pages | 10, 5, 7, 3 | ✅ Page 5: "Immediate treatment Position and support. Lie the patient flat (supine) …" |
| Covers every key point; weak follow-up answer on long-term blood pressure, which the note does not cover (`check:citation` 3) | "No support found in the note" | 9, 10, 7, 3 | ✅ "No support found in the note" |
| Voice run that did not mention stopping chlorphenamine | A point about the trigger drug | – | ✅ Page 4: "Drugs with anticholinergic effects, including some antihistamines (for example chlorphenamine), …" |

Finding while building: with `gpt-4.1-mini` the gap step called "lie her flat" a mistake (the note
recommends it). The excerpt check refused to cite it, but the gap was wrong, so both text calls use
`gpt-4.1` at temperature 0.

## Latency

Timer starts at `input_audio_buffer.speech_stopped` (the server decided the trainee finished) and stops
at `output_audio_buffer.started` (the examiner's audio starts playing in the browser), using
`performance.now()`. The server's end-of-speech wait (semantic VAD) happens before the timer starts and
is not included.

| Turn type | Turns | Median | p90 | Worst |
|---|---|---|---|---|
| Finding lookup (tool call + reply) | 5 | 1582 ms | 1769 ms | 1838 ms |
| Plain reply | 2 | 990 ms | – | 1523 ms |

Plain replies come from the debug log of an earlier run (1523 ms and 457 ms). One plain sample in the
voice run read 297995 ms: the timer kept running across a turn the examiner did not answer aloud. Fixed
after the run: the timer now resets when the trainee starts speaking again and is dropped when a reply
has no voice or tool call.

## Known limitations seen in testing

- A long pause mid-answer can still end the trainee's turn early; the "Done speaking" button avoids it.
- In one run the viva ended without a follow-up. The app now refuses `end_viva` until `ask_follow_up` has been used.
