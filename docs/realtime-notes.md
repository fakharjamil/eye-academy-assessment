# OpenAI Realtime notes (prep P2)

Checked on 25 Nov 2026 against developers.openai.com. Items marked UNCONFIRMED were not found on the docs pages.

## Model
- `gpt-realtime-2.1` (used in every WebRTC example). Also listed: `gpt-realtime-2.1-mini` (price UNCONFIRMED).
- Price per 1M tokens: audio $32 in / $0.40 cached in / $64 out; text $4 / $0.40 / $24.
- Do not use `gpt-live-1.1` examples: different events (`session.started`, `session.close`).
- Sources: https://developers.openai.com/api/docs/models/gpt-realtime-2.1

## Ephemeral key (server)
- `POST https://api.openai.com/v1/realtime/client_secrets` with the real API key.
- Body: `{ "expires_after": {"anchor":"created_at","seconds":600}, "session": { "type":"realtime", "model":"gpt-realtime-2.1", ... } }` (seconds 10–7200, default 600).
- Response: top-level `value` (`ek_...`), `expires_at` (unix seconds), `session`.

## WebRTC connect (browser)
- `POST https://api.openai.com/v1/realtime/calls`, headers `Authorization: Bearer <ek>` and `Content-Type: application/sdp`, body = offer SDP. Response text = answer SDP.
- Events data channel: `pc.createDataChannel("oai-events")`.

## Session config
```json
{
  "type": "realtime",
  "model": "gpt-realtime-2.1",
  "instructions": "...",
  "output_modalities": ["audio"],
  "tools": [{ "type": "function", "name": "get_finding", "description": "...", "parameters": {} }],
  "tool_choice": "auto",
  "audio": {
    "input": {
      "turn_detection": { "type": "semantic_vad", "eagerness": "low", "create_response": true, "interrupt_response": true },
      "transcription": { "model": "gpt-4o-mini-transcribe" }
    },
    "output": { "voice": "marin" }
  }
}
```
- Transcription models: `gpt-transcribe`, `gpt-realtime-whisper` (no `prompt`), `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`.
- Voice cannot change after the model has spoken.

## Events we use
| Purpose | Event |
|---|---|
| Trainee starts / stops talking (semantic VAD; `server_vad` uses silence only) | `input_audio_buffer.speech_started` / `input_audio_buffer.speech_stopped` (timer start) |
| Tool call ready | `response.function_call_arguments.done` (`call_id`, `name`, `arguments` JSON string) |
| Send tool result | `conversation.item.create` `{type:"function_call_output", call_id, output}` then `response.create` |
| Examiner audio starts / stops (WebRTC only) | `output_audio_buffer.started` (timer stop) / `output_audio_buffer.stopped` / `.cleared` |
| Trainee transcript | `conversation.item.input_audio_transcription.delta` / `.completed` (`.failed`) |
| Examiner transcript | `response.output_audio_transcript.delta` / `.done` (`transcript`) |
| Typed message | `conversation.item.create` `{type:"message", role:"user", content:[{type:"input_text", text}]}` then `response.create` |
| Barge-in | Automatic with `interrupt_response: true` (`response.done` status `cancelled`). Manual: `response.cancel` + `output_audio_buffer.clear` |
| Item added | `conversation.item.added` / `.done` (GA); also handle `conversation.item.created` |

## Old examples that will break
- No `OpenAI-Beta: realtime=v1` header.
- `/v1/realtime/sessions` + `client_secret.value` → `/v1/realtime/client_secrets` + `value`.
- `/v1/realtime?model=...` → `/v1/realtime/calls`.
- `session.type: "realtime"` is required; voice, VAD and transcription live under `audio`.
- `response.audio_transcript.delta` → `response.output_audio_transcript.delta`.
