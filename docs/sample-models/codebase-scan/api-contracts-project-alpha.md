# API Contracts (project-alpha)

- Generated: 2026-02-24T22:37:15+0700
- Source: `src/routes/api/*`

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/chat` | Health check for chat endpoint |
| POST | `/api/chat` | Streaming AI chat (SSE), gateway-backed |
| GET | `/api/providers` | List provider configs with filters |
| POST | `/api/providers` | Register custom provider |
| GET | `/api/providers/:id` | Get provider by id |
| PUT | `/api/providers/:id` | Update custom provider |
| DELETE | `/api/providers/:id` | Delete custom provider |
| POST | `/api/providers/:id/test` | Test provider connectivity |
| POST | `/api/providers/:id/execute` | Execute provider request payload |
| POST | `/api/provider-test` | Phase-1A disabled provider test endpoint |

## Payload Notes

- `/api/chat` expects validated JSON including messages/provider/model/apiKey; returns SSE chunks and `[DONE]` sentinel.
- Provider routes return envelope-style responses (`success`, `data`, `error`, optional `meta`).
- Provider mutation routes guard built-in providers from modification/deletion.
