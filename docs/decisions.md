# Decisions

Each entry covers the choice, why it was made, and the alternative that was considered.

## 1. Voice model: OpenAI Realtime (`gpt-realtime-2.1`)

- **Why:**
  - Tool calls are reliable, and every finding depends on one.
  - WebRTC handles the microphone, echo cancellation and playback.
  - Its events (`speech_stopped`, `output_audio_buffer.started`) drive the turn label and the timer directly.
  - It is already in Eye Academy's stack.
- **Alternative:** Gemini Live. It is roughly 5× cheaper for audio. It needs our own audio streaming over WebSocket, and its short-lived browser keys were still in preview.
- **When to revisit:** if cost matters more than integration time, try Gemini Live first.

## 2. Audio goes straight from the browser to OpenAI (WebRTC)

- **Why:** lower latency, and no audio passes through our server. The server only issues a 10-minute key.
- **Alternative:** relaying audio through our server. That means more code, more cost and more delay.

## 3. The voice model never gets finding values

- **Why:** a model that "knows" 58 and 18 can swap them. Instead, the examiner instructions list only the finding ids and labels. Every value comes from `get_finding`, which is answered by the formatter, and a test checks that no value appears in the instructions.
- **Alternative:** putting the case into the prompt. It is simpler, but the model can then misread a value and nothing would catch it.

## 4. Sign-in check with `jose`, not `firebase-admin`

- **Why:** the server must run on Cloudflare Workers, and `firebase-admin` targets Node. `jose` verifies Firebase ID tokens against Google's public keys and runs anywhere.
- **Trade-off:** we check the token's signature, issuer and audience ourselves.

## 5. Semantic listening, plus a "Done speaking" button

- **Why:** with plain silence detection, a pause to think ended the trainee's turn. Semantic detection with low eagerness waits for a finished thought. The button lets the trainee end a turn at once.
- **Trade-off:** after an answer that sounds unfinished, the examiner can wait a few seconds.

## 6. The follow-up and the end are enforced in code

- **Why:** the brief requires one spoken follow-up, and in testing the model once ended without asking it. Now:
  - The model must call `ask_follow_up`. The app allows exactly one.
  - `end_viva` is refused until the follow-up has been asked.
- **Alternative:** relying on the prompt alone. That is what failed in testing.

## 7. The owner's id is in the attempt link

- **Why:** attempts live at `users/{uid}/attempts/{id}`. With the owner in the link, another user opening it really asks Firestore for that user's attempt, and gets "Permission denied" from the rules. That shows the privacy rule working, not just a missing page.
- **Alternative:** a flat `attempts/{id}` collection with an owner field. It works too. The nested path keeps the rule to one line.

## 8. Hybrid search, with chunks that never cross a page

- **Why:**
  - Keyword search (BM25) finds exact drug names like "acetazolamide".
  - Embeddings find paraphrases.
  - Each chunk belongs to exactly one page, so every citation has one page number.
  - The prep script stops if a printed page number doesn't match the physical page.
- **Alternative:** embeddings only. These miss exact terms. Whole-page chunks give imprecise quotes.

## 9. The quote is checked by code, using `gpt-4.1`

- **Why:** a model can paraphrase or invent a quote. Code accepts the revision point only if the excerpt is on the cited, retrieved page word for word, and tolerates only line breaks, hyphen splits and case. Otherwise the trainee sees "No support found in the note".
- **Model:** `gpt-4.1` at temperature 0, so the same transcript gives the same point. `gpt-4.1-mini` was tried first and called a correct step ("lie her flat") a mistake.

## 10. Response times are saved and logged, not shown

- **Why:** the brief asks us to measure a voice turn, not to show timings to trainees. Each sample is saved with the attempt and logged for developers. The dev-only debug log includes them.
- **Method:** the timer starts at `input_audio_buffer.speech_stopped` and stops at `output_audio_buffer.started`, using `performance.now()`. It resets when the trainee speaks again, so an unanswered turn cannot inflate it.
