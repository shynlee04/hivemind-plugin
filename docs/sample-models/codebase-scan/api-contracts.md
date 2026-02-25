# API Contracts

- Generated: 2026-02-24T22:37:15+0700
- Scan mode: exhaustive

## Route Inventory

The API layer is implemented as TanStack file routes in `src/routes/api`:

- `chat.ts`
- `providers.ts`
- `providers.$id.ts`
- `providers.$id.test.ts`
- `providers.$id.execute.ts`
- `provider-test.ts`

## Contract Summary

| Method | Endpoint | Handler Source | Notes |
|---|---|---|---|
| GET | `/api/chat` | `chat.ts` | health/status response |
| POST | `/api/chat` | `chat.ts` | SSE streaming chat via AI gateway |
| GET | `/api/providers` | `providers.ts` | list/query providers |
| POST | `/api/providers` | `providers.ts` | register custom provider |
| GET | `/api/providers/:id` | `providers.$id.ts` | fetch provider config |
| PUT | `/api/providers/:id` | `providers.$id.ts` | update custom provider |
| DELETE | `/api/providers/:id` | `providers.$id.ts` | remove custom provider |
| POST | `/api/providers/:id/test` | `providers.$id.test.ts` | test endpoint/api key validity |
| POST | `/api/providers/:id/execute` | `providers.$id.execute.ts` | execute model/provider call |
| POST | `/api/provider-test` | `provider-test.ts` | returns 503 (phase-gated) |

## Authentication and Security Notes

- Chat route requires API key in request payload for server-side execution.
- Provider routes enforce constraints on built-in provider mutation.
- Server responses include standard JSON envelopes and status codes.
