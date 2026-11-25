# Decisions

Each entry covers the choice, why it was made, and the alternative that was considered.

## 1. Voice model: OpenAI Realtime (`gpt-realtime-2.1`)

- **Why:** reliable tool calls (every finding depends on one), WebRTC handles mic and playback, and its events drive the turn label and timer. Full comparison: [README, Model choice](../README.md#model-choice).
- **Alternative:** Gemini Live, with lower published audio prices but its own audio streaming code.
- **When to revisit:** if cost matters more than integration time, try Gemini Live first.

## 2. Audio goes straight from the browser to OpenAI (WebRTC)

- **Why:** lower latency, and no audio passes through our server. The server only issues a 10-minute key.
- **Alternative:** relaying audio through our server. That means more code, more cost and more delay.

## 3. The voice model never gets finding values

- **Why:** a model that "knows" 58 and 18 can swap them. It sees only ids and labels; every value comes from `get_finding`. A test checks no value is in the instructions.
- **Alternative:** the case in the prompt. Simpler, but a misread value would go unnoticed.

## 4. Sign-in check with `jose`, not `firebase-admin`

- **Why:** the server must run on Cloudflare Workers, and `firebase-admin` targets Node. `jose` verifies Firebase ID tokens against Google's public keys and runs anywhere.
- **Trade-off:** we check the token's signature, issuer and audience ourselves.

## 5. Semantic listening, plus a "Done speaking" button

- **Why:** with plain silence detection, a pause to think ended the trainee's turn. Semantic detection with low eagerness waits for a finished thought. The button lets the trainee end a turn at once.
- **Trade-off:** after an answer that sounds unfinished, the examiner can wait a few seconds.

## 6. The follow-up and the end are enforced in code

- **Why:** the brief requires one spoken follow-up, and in testing the model once ended without asking it. A prompt can't guarantee it; code can (`src/voice/follow-up.ts`).
- **Alternative:** the prompt alone, which is what failed.

## 7. The owner's id is in the attempt link

- **Why:** attempts live at `users/{uid}/attempts/{id}`. With the owner in the link, another user opening it really asks Firestore for that user's attempt, and gets "Permission denied" from the rules. That shows the privacy rule working, not just a missing page.
- **Alternative:** a flat `attempts/{id}` collection with an owner field. It works too. The nested path keeps the rule to one line.

## 8. Hybrid search, with chunks that never cross a page

- **Why:** keywords (BM25) find exact drug names; embeddings find paraphrases. A chunk never crosses a page, so every citation has one page number.
- **Alternative:** embeddings only (miss exact terms) or whole pages (imprecise quotes). How it runs: [architecture](architecture.md#after-the-viva-revision-point).

## 9. The quote is checked by code, using `gpt-4.1`

- **Why:** a model can paraphrase or invent a quote, so code accepts it only if it is on the cited, retrieved page word for word. Otherwise: "No support found in the note".
- **Model:** `gpt-4.1` at temperature 0 (same transcript, same point). `gpt-4.1-mini` called a correct step a mistake.

## 10. Response times are saved and logged, not shown

- **Why:** the brief asks to measure a voice turn, not to show timings to trainees. Samples are saved with each attempt and logged for developers. Method and numbers: [`checks.md`](checks.md#latency).
