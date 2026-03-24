---
session_id: ses_2e4e08b8fffe0eS5auMxWRgRgk
timestamp: 2026-03-23T14:38:54.538Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

## Assistant Output

Now I have both designs and the codebase ground truth. Let me produce the synthesis and phased TDD plan.

---

## Architecture Decision Summary

### What EXISTS in Code (Ground Truth)

| File | What It Does | Problem |
|------|--------------|---------|
| `diagnostic-log.ts` | Writes `.hivemind/error-log/{ses_id}-{timestamp}.md` per turn | **File explosion** - 92 files for ~10 sessions |
| `session-inspection.ts` | Overwrites `.hivemind/session-inspection/{ses_id}/assistant-output.md` per turn | **History loss** - overwrites discard prior turns |
| `paths.ts` | `SESSIONS_DIR = 'sessions'`, `getSessionPath()` → `.hivemind/sessions/{id}` | **Existing path is `sessions/`, NOT `event-log/`** |
| `opencode-plugin.ts` | Wires `experimental.text.complete` → writes both diagnostic-log AND session-inspection | Dual-write chaos |
| `event-handler.ts` | Routes OpenCode `event` hook to trajectory ledger | Works, but doesn't contribute to session journals |
| `injection-store.ts` | In-memory Map bridging `messages.transform` → `text.complete` | Works for single-session |

### Design Conflict Analysis

| Aspect | Time-Machine Design | Event-Tracker Design | Resolution |
|--------|---------------------|----------------------|------------|
| **Root directory** | `.hivemind/sessions/` | `.hivemind/event-log/` | **Use `sessions/`** — already exists in `paths.ts` |
| **Session metadata** | `session.json` | Frontmatter in `events.md` | **Hybrid** — `session.json` for machine-parseable, frontmatter for human |
| **Event log format** | `journal.md` | `events.md` | **Use `events.md`** — simpler name |
| **Diagnostic verbose** | `diagnostics/{turn}.log` | `diagnostics.log` single file | **Use single `diagnostics.log`** — append-only per session |
| **Sub-session linking** | `parent_ses_id`/`root_ses_id` fields | Via delegation.md | **Use delegation.md** with parent/child tracking |
| **Index** | `journal-index.json` + `index.md` | `event-log/index.md` | **Use `sessions/index.json`** — machine-parseable, created on-demand |
| **Token accounting** | Yes | No | **Omit** — not observable from hooks |
| **Content hashing** | SHA-256 | No | **Omit** — premature complexity |
| **Query tool** | `hivemind_query_sessions` | No | **Omit** — future work |

### What from Each Design Is Valid

**From Event-Tracker (applicable):**
- ✅ Replace `error-log/` with per-session `events.md` + `diagnostics.log` structure
- ✅ Append-only session event log (not overwrite like session-inspection)
- ✅ Hook integration points: `messages.transform` → injection log, `text.complete` → event log
- ✅ Master index for session discovery
- ✅ Migration from existing error-log files

**From Time-Machine (applicable):**
- ✅ Session metadata schema (`session.json`)
- ✅ Sub-session relationship tracking via delegation chain
- ✅ Structured event taxonomy for classification
- ✅ Importance scoring for pruning
- ✅ Clean separation: readable journal vs. verbose diagnostics

### What Needs to Change vs What's New

| Item | Action |
|------|--------|
| `diagnostic-log.ts` | **Replace** — consolidate into event-tracker module |
| `session-inspection.ts` | **Keep** — serves different purpose (purification commands) |
| `paths.ts` | **Extend** — add `getEventLogPath()`, keep `getSessionPath()` canonical |
| `opencode-plugin.ts` | **Refactor** — single write path, not dual-write |
| `event-handler.ts` | **Extend** — also write to event-tracker |
| New module: `src/features/event-tracker/` | **Create** — replaces diagnostic-log.ts |

### Key Constraints

1. **SDK-independent**: `src/features/event-tracker/` must use only `node:fs/promises` and `node:path` — no `@opencode-ai/sdk` imports
2. **Path stability**: Use existing `SESSIONS_DIR` path constant, don't introduce `event-log/` root
3. **Existing hooks**: Wire into existing hooks, don't add new ones
4. **No new files unnecessarily**: Extend existing files where possible

---

## Phased TDD Plan

### Unit 1: Path Extensions and Types
**Scope:** Add event-log paths to `paths.ts` and define core types

**RED (test first):**
```typescript
// tests/features/event-tracker/paths.test.ts
// Test: getEventLogPath returns correct path
// Test: getSessionEventsPath returns {sessionId}/events.md
// Test: getSessionDiagnosticsPath returns {sessionId}/diagnostics.log
// Test: session folder constants are exported
```

**GREEN (minimal implementation):**
- Add to `paths.ts`:
  - `EVENT_LOG_DIR = 'event-log'` (not root — goes inside SESSIONS_DIR)
  - `getEventLogPath(projectRoot)` → `{HIVEMIND_DIR}/event-log`
  - `getSessionEventsPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/events.md`
  - `getSessionDiagnosticsPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/diagnostics.log`
  - `getSessionDelegationPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/delegation.md`
  - `getSessionInjectionPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/injection.md`

- Add to `src/features/event-tracker/types.ts`:
  ``
