# Session Inspection Export

- ses_id: `ses_2dad12bc6ffeiJvqIoas6JYN6F`
- prepared_at: `2026-03-25T13:31:24.046Z`

## Assistant Output

Now I have the complete picture. Here is the investigation report.

---

## Codebase Investigation Report

**Scope:** Source of `ses_*.json` and `session-ses_*.md` files being created at project root (not under `.hivemind/sessions/`), consolidated writer code path, and all session file path construction.

**Question:** What code creates session journal files at the project root, causing ENOENT errors like `open '.../ses_2de2be04dffe4vYxqsDxHs012j.json'`?

---

### Findings

#### ROOT CAUSE BUG: `directory` (project root) passed directly to consolidated-writer instead of `sessionsDir`

Three callers pass `input.directory` (the project root) as the `sessionDir` argument to consolidated-writer functions. The consolidated-writer's `getSessionPath(sessionDir, sessionId)` does `join(sessionDir, sessionId + '.json')`, which produces paths like `/project-root/ses_xxx.json` — at the project root, not under `.hivemind/sessions/`.

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **`createTextCompleteHandler` passes raw `directory` (project root) to consolidated-writer** | `src/hooks/text-complete-handler.ts` | 84, 89, 103, 117, 132, 135, 145 | `loadSession(directory, sdkSessionId)` at line 84, `initSession(directory, ...)` at line 89, `addTurn(directory, ...)` at line 103, `addEvent(directory, ...)` at line 117, etc. — all use `directory` which is the project root from `deps.directory` (line 47) |
| 2 | **`createEventHandler` passes raw `directory` (project root) to `addEvent`** | `src/hooks/event-handler.ts` | 121 | `await addEvent(directory, { sessionId, event: ... })` — `directory` is the project root from `createEventHandler(directory)` at line 93 |
| 3 | **`createCompactionJournalHandler` passes raw `directory` (project root) to `addEvent` and `incrementCounter`** | `src/hooks/compaction-handler.ts` | 52, 67 | `await addEvent(directory, { sessionId, ... })` at line 52, `await incrementCounter(directory, sessionId, ...)` at line 67 — `directory` is from `deps.directory` (line 34) |
| 4 | **Plugin assembly wires all three buggy handlers with `input.directory`** | `src/plugin/opencode-plugin.ts` | 49, 217, 225 | `const directory = input.directory` at line 49. `createTextCompleteHandler({ directory })` at line 217. `compactionJournalHandler(input, output)` at line 225 (where `compactionJournalHandler = createCompactionJournalHandler({ directory })` at line 69) |
| 5 | **Consolidated-writer `getSessionPath` joins dir + sessionId.json** | `src/features/event-tracker/consolidated-writer.ts` | 209-211 | `export function getSessionPath(sessionDir, sessionId): join(sessionDir, sessionId + '.json')` — when sessionDir=project root, creates file at root |
| 6 | **`generateSessionId` produces `ses_` prefix** | `src/features/event-tracker/consolidated-writer.ts` | 139-152 | `return \`ses_${isoDate}_${purposeClass}_${agent}\`` — this is why files at root are named `ses_*.json` |

#### Correct implementations (for contrast)

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 7 | `handleChatMessage` correctly uses `join(projectRoot, '.hivemind', 'sessions')` | `src/hooks/chat-message-handler.ts` | 45 | `const sessionsDir = join(projectRoot, '.hivemind', 'sessions')` — passes `sessionsDir` to all writer calls |
| 8 | Standalone `handleTextComplete` correctly uses `join(projectRoot, '.hivemind', 'sessions')` | `src/hooks/text-complete-handler.ts` | 169 | `const sessionsDir = join(projectRoot, '.hivemind', 'sessions')` — but this standalone function is **never called** from the plugin |
| 9 | Standalone `handleCompaction` correctly uses `join(projectRoot, '.hivemind', 'sessions')` | `src/hooks/compaction-handler.ts` | 91 | `const sessionsDir = join(projectRoot, '.hivemind', 'sessions')` — but this standalone function is **never called** from the plugin |
| 10 | `handleToolExecution` correctly uses `join(projectRoot, '.hivemind', 'sessions')` | `src/hooks/tool-execution-handler.ts` | 39 | `const sessionsDir = join(projectRoot, '.hivemind', 'sessions')` — correctly routed |

#### Path resolution infrastructure (correctly designed, but bypassed)

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 11 | Central path builder: `getSessionPath` returns `{root}/.hivemind/sessions/{id}` | `src/shared/paths.ts` | 34-36 | `path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)` |
| 12 | Event-tracker paths: `getEventTrackerSessionDir` returns `{root}/.hivemind/sessions/{id}` | `src/features/event-tracker/paths.ts` | 15-17 | `path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)` |
| 13 | `getEffectivePaths` returns `sessionsDir` = `{root}/.hivemind/sessions` | `src/shared/paths.ts` | 68 | `const sessionsDir = path.join(root, SESSIONS_DIR)` |
| 14 | Session inspection uses correct path via `getSessionInspectionPath` | `src/sdk-supervisor/session-inspection.ts` | 83 | Uses `getSessionInspectionPath(projectRoot, input.sessionId)` → `{root}/.hivemind/session-inspection/{id}` |
| 15 | Error log uses correct path via `getErrorLogPath` | `src/sdk-supervisor/diagnostic-log.ts` | 99 | `getErrorLogPath(projectRoot)` → `{root}/.hivemind/error-log` |

#### Consolidated writer internals

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 16 | `initSession` creates session JSON file via `atomicWrite` | `src/features/event-tracker/consolidated-writer.ts` | 334-377 | Calls `getSessionPath(sessionDir, filename)` then `atomicWrite(filePath, JSON.stringify(session, null, 2))` |
| 17 | `addEvent` reads session, pushes event, writes back | `src/features/event-tracker/consolidated-writer.ts` | 441-448 | Calls `modifySession` → `loadSession` → `atomicWrite` |
| 18 | `addTurn` reads session, pushes turn, increments counters | `src/features/event-tracker/consolidated-writer.ts` | 402-418 | Calls `modifySession` which does `loadSession` then `atomicWrite` |
| 19 | `loadSession` does `readFile` on the session path (source of ENOENT) | `src/features/event-tracker/consolidated-writer.ts` | 225-232 | `readFile(filePath, 'utf8')` — if file doesn't exist, throws ENOENT |
| 20 | `createSdkSymlink` creates backward-compat symlinks | `src/features/event-tracker/consolidated-writer.ts` | 283-298 | `symlink(semanticFilename, sdkPath)` |

#### Legacy session writers (separate system, correctly routed)

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 21 | `session-writers.ts` facade delegates to events/diagnostics writers | `src/internal/session-writers.ts` | 88-129 | `appendSessionEvent(projectRoot, entry)` uses `getSessionEventsPath` → `{root}/.hivemind/sessions/{id}/events.md` |
| 22 | `events-writer.ts` writes to `.hivemind/sessions/{id}/events.md` | `src/features/event-tracker/writers/events-writer.ts` | 52 | `getSessionEventsPath(projectRoot, entry.sessionId)` — correctly nested |
| 23 | `diagnostics-writer.ts` writes to `.hivemind/sessions/{id}/diagnostics.log` | `src/features/event-tracker/writers/diagnostics-writer.ts` | 50 | `getSessionDiagnosticsPath(projectRoot, entry.sessionId)` — correctly nested |
| 24 | `session-writer.ts` writes `session.json` to `.hivemind/sessions/{id}/session.json` | `src/features/event-tracker/writers/session-writer.ts` | 61 | `getSessionMetadataPath(projectRoot, input.sessionId)` — correctly nested |

---

### Structure Map

**Correct path (`.hivemind/sessions/`):**
```
.hivemind/sessions/{sessionId}/          ← created by chat-message-handler, handleTextComplete, handleCompaction, handleToolExecution
  ├── events.md                          ← events-writer.ts
  ├── diagnostics.log                    ← diagnostics-writer.ts
  ├── session.json                       ← session-writer.ts
  └── {semanticId}.json                  ← consolidated-writer.ts (when sessionDir is correct)
```

**Buggy path (project root):**
```
{projectRoot}/ses_{timestamp}_{purpose}_{agent}.json   ← consolidated-writer.ts via text-complete-handler, event-handler, compaction-handler
```

**Other `.hivemind/` directories:**
```
.hivemind/session-inspection/{sessionId}/   ← session-inspection.ts (correct)
  ├── assistant-output.md
  └── purification-command.json

.hivemind/error-log/                        ← diagnostic-log.ts (correct)
  └── {sessionId}-{timestamp}.md
```

---

### Gaps

1. **`session-ses_*.md` files at root** — `session-ses_2e0b.md` and `session-ses_2e54.md` found at project root. No source code creates files with the `session-ses_` prefix. These appear to be orphaned test artifacts or manually created files. No source trace found.
2. **`createTextCompleteHandler` vs `handleTextComplete`** — Two implementations exist. The factory function `createTextCompleteHandler` (line 46) is used by the plugin but has the root-directory bug. The standalone `handleTextComplete` (line 161) is correct but unused. The standalone version should either replace the factory or the factory should be fixed to construct `sessionsDir`.
3. **`createCompactionJournalHandler` vs `handleCompaction`** — Same pattern. Factory (line 33) is buggy, standalone (line 83) is correct but unused.

---

### Git Context

Working directory: `/Users/apple/hivemind-plugin/.worktrees/product-detox` (git worktree). 196 orphaned `ses_*.json` files at the project root, confirming the bug has been producing files across multiple sessions.