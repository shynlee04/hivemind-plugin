# src/hooks/ — Plugin Hooks (Read-Side CQRS)

Hook handlers injected into OpenCode plugin lifecycle events. **Read-side only** — no direct filesystem writes.

## Boundary

- Hooks receive events from OpenCode SDK (`chat.message`, `tool.execute.after`, `event`, etc.)
- Hooks delegate write operations to consolidated-writer or session-resolver
- **Never** call `mkdir`, `writeFile`, or `appendFile` directly — use `consolidated-writer.ts` APIs

## Handlers

| Handler | Hook | Status |
|---------|------|--------|
| `chat-message-handler.ts` | `chat.message` | ✅ Wired |
| `tool-execution-handler.ts` | `tool.execute.after` | ✅ Wired |
| `event-handler.ts` | `event` | ✅ Wired |
| `text-complete-handler.ts` | `experimental.text.complete` | ✅ Wired |
| `compaction-handler.ts` | `experimental.session.compacting` | ✅ Wired |
| `transform-handler.ts` | `experimental.chat.system.transform` | ✅ Wired |

## Rules

- All handlers use `.catch(() => undefined)` for non-fatal error handling
- Session resolution via `SessionResolver` (single entry point)
- No inline `findSessionBySdkId` — use `resolver.resolveOrCreate()`
