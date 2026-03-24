# Session Inspection Export

- ses_id: `ses_2e545d17effepnO0LeuJwZP35S`
- prepared_at: `2026-03-23T12:46:49.608Z`

## Assistant Output

Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Session export and diagnostic logging system in the HiveMind plugin  
**Question:** Map all files, wiring, path definitions, and runtime artifacts for the error-log/diagnostic-log and session-inspection subsystems.

---

### 1. Error-Log / Diagnostic-Log System

#### Source Files

| # | File | Lines | Role |
|---|------|-------|------|
| 1 | `src/sdk-supervisor/diagnostic-log.ts` | 104 | Core writer — `writeDiagnosticLog()` + `DiagnosticLogEntry` interface + `renderDiagnosticEntry()` |
| 2 | `src/shared/paths.ts` | 42-44, 72, 83 | `getErrorLogPath(projectRoot)` returns `.hivemind/error-log/`; also in `getEffectivePaths().errorLogDir` |
| 3 | `src/sdk-supervisor/index.ts` | 5 | Barrel export: `export * from './diagnostic-log.js'` |
| 4 | `src/plugin/opencode-plugin.ts` | 34, 180-201 | Import + invocation inside `experimental.text.complete` hook |

#### Compiled Artifacts (dist/)
- `dist/sdk-supervisor/diagnostic-log.js`
- `dist/sdk-supervisor/diagnostic-log.d.ts`
- `dist/sdk-supervisor/diagnostic-log.js.map`
- `dist/sdk-supervisor/diagnostic-log.d.ts.map`

#### Path Definition
```
src/shared/paths.ts:42  →  getErrorLogPath(projectRoot) = path.join(projectRoot, '.hivemind', 'error-log')
src/shared/paths.ts:72  →  errorLogDir = path.join(root, 'error-log')  (inside getEffectivePaths)
```

#### Key Implementation Pattern
```typescript
// src/sdk-supervisor/diagnostic-log.ts:92-104
export async function writeDiagnosticLog(projectRoot, entry) {
  const errorLogDir = getErrorLogPath(projectRoot)
  await fs.mkdir(errorLogDir, { recursive: true })
  const filename = `${entry.sessionId}-${Date.now()}.md`
  const filePath = path.join(errorLogDir, filename)
  await fs.writeFile(filePath, renderDiagnosticEntry(entry))
  return filePath
}
```
- **Naming:** `{sessionId}-{timestamp}.md` (flat, no subdirectories)
- **Content:** YAML frontmatter (`session_id`, `timestamp`, `purpose`, `session_state`, `trajectory`, `workflow`, `agent`) + optional `## Injection Payload` section + `## Assistant Output` (truncated to 5000 chars)
- **Behavior:** APPEND semantics (new file per turn, never overwrites)

#### Runtime Artifacts
- **Directory:** `.hivemind/error-log/`
- **File count:** **140 files** across ~15 sessions
- **Sample:** `.hivemind/error-log/ses_2e545d17effepnO0LeuJwZP35S-1774269913961.md`

#### Test Coverage
- **No dedicated test file** for `diagnostic-log.ts`. The `session-inspection.test.ts` exists but does not cover diagnostic log writing.

---

### 2. Session-Inspection System

#### Source Files

| # | File | Lines | Role |
|---|------|-------|------|
| 1 | `src/sdk-supervisor/session-inspection.ts` | 106 | Core writer — `upsertSessionInspectionExport()` + `createPreparedPurificationCommand()` + render |
| 2 | `src/sdk-supervisor/session-inspection.test.ts` | 63 | Tests: command stability + overwrite-in-place behavior |
| 3 | `src/shared/paths.ts` | 38-40, 69 | `getSessionInspectionPath(projectRoot, sessionId)` returns `.hivemind/session-inspection/{sessionId}/` |
| 4 | `src/sdk-supervisor/index.ts` | 4 | Barrel export: `export * from './session-inspection.js'` |
| 5 | `src/plugin/opencode-plugin.ts` | 34, 173-176 | Import + invocation inside `experimental.text.complete` hook |

#### Compiled Artifacts (dist/)
- `dist/sdk-supervisor/session-inspection.js`
- `dist/sdk-supervisor/session-inspection.d.ts`
- `dist/sdk-supervisor/session-inspection.test.js`

#### Path Definition
```
src/shared/paths.ts:38-40  →  getSessionInspectionPath(projectRoot, sessionId) = path.join(projectRoot, '.hivemind', 'session-inspection', sessionId)
src/shared/paths.ts:69     →  sessionInspectionDir = path.join(root, 'session-inspection')  (inside getEffectivePaths)
```

#### Key Implementation Pattern
```typescript
// src/sdk-supervisor/session-inspection.ts:76-106
export async function upsertSessionInspectionExport(projectRoot, { sessionId, assistantText }) {
  const directoryPath = getSessionInspectionPath(projectRoot, sessionId)
  const markdownPath = path.join(directoryPath, 'assistant-output.md')
  const commandPath = path.join(directoryPath, 'purification-command.json')
  await fs.mkdir(directoryPath, { recursive: true })
  await fs.writeFile(markdownPath, ...)   // OVERWRITES each time
  await fs.writeFile(commandPath, ...)    // OVERWRITES each time
  return { sessionId, directoryPath, markdownPath, commandPath }
}
```
- **Per-session directory:** `.hivemind/session-inspection/{sessionId}/`
- **Two files per session:**
  - `assistant-output.md` — session export markdown with `ses_id` and `prepared_at`
  - `purification-command.json` — `PreparedPurificationCommand` (version v1, kind `session-inspection-purification`, status `prepared`)
- **Behavior:** OVERWRITE semantics (same session → same path, replaced each completion)

#### Purification Command Contract
```typescript
// src/sdk-supervisor/session-inspection.ts:9-18
interface PreparedPurificationCommand {
  version: 'v1'
  kind: 'session-inspection-purification'
  status: 'prepared'
  ses_id: string
  markdown_path: string
  tool_hints: ['grep', 'read']
  instruction: string
  prepared_at: string
}
```

#### Runtime Artifacts
- **Directory:** `.hivemind/session-inspection/`
- **Session count:** **30 session directories**
- **Each session dir contains:** `assistant-output.md` + `purification-command.json`
- **Sample:** `.hivemind/session-inspection/ses_2e545d17effepnO0LeuJwZP35S/`

#### Test Coverage
- `src/sdk-supervisor/session-inspection.test.ts` covers:
  1. `createPreparedPurificationCommand` — stable ses_id and markdown_path
  2. `upsertSessionInspectionExport` — replaces session-scoped export artifacts (same path on second call, content overwritten)

---

### 3. Plugin Hook Wiring

#### Entry Point: `src/plugin/opencode-plugin.ts`

The `experimental.text.complete` hook at **lines 165-201** is the single trigger for both export systems:

```typescript
// src/plugin/opencode-plugin.ts:165-201
'experimental.text.complete': async (input, output) => {
  const sessionId = input.sessionID
  const assistantText = typeof output.text === 'string' ? output.text : ''
  if (!sessionId || assistantText.length === 0) return

  // 1. Session-inspection export (fire-and-forget, non-blocking)
  void upsertSessionInspectionExport(directory, {
    sessionId, assistantText,
  }).catch(() => undefined)

  // 2. Diagnostic log (fire-and-forget, non-blocking)
  const snapshot = await turnSnapshot.getSnapshot()
  const injection = getAndClearInjectionPayload(sessionId)
  void writeDiagnosticLog(directory, {
    sessionId,
    timestamp: new Date().toISOString(),
    assistantText,
    purpose: snapshot.defaultPurposeClass,
    sessionState: snapshot.entryState,
    trajectory: snapshot.trajectoryId ?? 'none',
    workflow: snapshot.workflowId ?? 'none',
    agent: snapshot.preferredUserName ?? 'hivefiver',
    injection: injection ? { ... } : undefined,
  }).catch(() => undefined)
}
```

Both writes are:
- **Non-blocking** (`void` + `.catch(() => undefined)`)
- **Deterministic** (same session → same path)
- **Hook-triggered** (not agent-initiated)

#### Injection Store (cross-hook data bridge)

| # | File | Lines | Role |
|---|------|-------|------|
| 1 | `src/plugin/injection-store.ts` | 35 | In-memory `Map<sessionId, InjectionPayload>`, written by messages-transform, read+cleared by text.complete |
| 2 | `src/plugin/messages-transform-adapter.ts` | 155-168 | Calls `setInjectionPayload()` with full injection context |
| 3 | `src/plugin/opencode-plugin.ts` | 179, 189-200 | Calls `getAndClearInjectionPayload()` in text.complete hook |

Data flow:
```
messages.transform → setInjectionPayload(sessionId) 
                    → text.complete → getAndClearInjectionPayload(sessionId) → writeDiagnosticLog()
```

---

### 4. Path Definitions Summary

All in `src/shared/paths.ts`:

| Function | Line | Returns |
|----------|------|---------|
| `getSessionInspectionPath(projectRoot, sessionId)` | 38-40 | `{projectRoot}/.hivemind/session-inspection/{sessionId}` |
| `getErrorLogPath(projectRoot)` | 42-44 | `{projectRoot}/.hivemind/error-log` |
| `getEffectivePaths().sessionInspectionDir` | 69 | `{projectRoot}/.hivemind/session-inspection` |
| `getEffectivePaths().errorLogDir` | 72 | `{projectRoot}/.hivemind/error-log` |

No hardcoded `.hivemind/error-log` or `.hivemind/session-inspection` strings exist in `src/` — all references go through these path helpers.

---

### 5. Current .hivemind/ Directory Structure

```
.hivemind/
├── agent-work-contract/         (empty)
├── config/                      (runtime-attachment.json)
├── context-check.json
├── error-log/                   ← 140 .md files (flat, {sessionId}-{timestamp}.md)
├── graph/
├── project/
├── session-inspection/          ← 30 session dirs, each with:
│   └── {sessionId}/
│       ├── assistant-output.md
│       └── purification-command.json
└── state/
```

---

### 6. Files That Would Need Modification/Deletion for Migration

#### Source files to modify:
| File | Reason |
|------|--------|
| `src/sdk-supervisor/diagnostic-log.ts` | Core diagnostic log writer — rename, restructure, or replace |
| `src/sdk-supervisor/session-inspection.ts` | Core session-inspection writer — restructure export pipeline |
| `src/sdk-supervisor/session-inspection.test.ts` | Tests must follow any structural changes |
| `src/sdk-supervisor/index.ts` | Barrel exports for renamed/restructured modules |
| `src/shared/paths.ts` | Path helpers (`getErrorLogPath`, `getSessionInspectionPath`, effective paths) |
| `src/plugin/opencode-plugin.ts` | Hook wiring at lines 165-201 — import changes + invocation changes |
| `src/plugin/injection-store.ts` | Cross-hook bridge — may need changes if diagnostic-log contract changes |
| `src/plugin/messages-transform-adapter.ts` | Calls `setInjectionPayload()` — must stay in sync |

#### Source files to potentially create:
| File | Reason |
|------|--------|
| `src/sdk-supervisor/diagnostic-log.test.ts` | Currently missing — no test coverage for diagnostic log |

#### Compiled artifacts to delete/rebuild:
- `dist/sdk-supervisor/diagnostic-log.{js,d.ts,js.map,d.ts.map}`
- `dist/sdk-supervisor/session-inspection.{js,d.ts,js.map}`
- `dist/sdk-supervisor/session-inspection.test.{js,d.ts,js.map}`
- `dist/plugin/injection-store.{js,d.ts,js.map,d.ts.map}`

#### Runtime artifacts (runtime-generated, safe to delete):
- `.hivemind/error-log/` — 140 files
- `.hivemind/session-inspection/` — 30 session directories (60 files)

#### Documentation referencing this system:
- `time-machine-desing-2026-03-23.md` (design doc)
- `event-tracker-design-2026-03-23.md` (migration plan)
- `src/sdk-supervisor/AGENTS.md` (missing `diagnostic-log.ts` and `session-inspection.ts` from file table — documentation gap)
- `src/shared/AGENTS.md` (session-inspection export exemption note)

---

### 7. Hook Registration Pattern

The plugin at `src/plugin/opencode-plugin.ts` registers hooks as a flat object returned from the `Plugin` factory:

```typescript
export const HiveMindPlugin: Plugin = async (input) => {
  // ...setup...
  return {
    event: async (eventInput) => { ... },
    tool: { ... },                        // 8 tools registered
    'chat.message': async (...) => { ... },
    'permission.ask': async (...) => { ... },
    'tool.execute.before': async (...) => { ... },
    'shell.env': async (...) => { ... },
    'command.execute.before': async (...) => { ... },
    'tool.execute.after': async (...) => { ... },
    'experimental.text.complete': async (...) => { ... },    ← triggers both exports
    'experimental.chat.messages.transform': messagesTransform,
    'experimental.session.compacting': compactionHandler,
  }
}
```

No adapter layer is used — SDK hook keys are used directly with the `experimental.*` prefix as-is.

---

### 8. Architectural Gaps Noted

1. **`src/sdk-supervisor/AGENTS.md`** lists only `instance-registry.ts`, `health.ts`, `runtime-status.ts`, and `index.ts` — `diagnostic-log.ts` and `session-inspection.ts` are **missing from the file table** despite being live modules.
2. **No test file for `diagnostic-log.ts`** — only `session-inspection.ts` has test coverage.
3. **Error-log has no reading interface** — `writeDiagnosticLog` writes but no tool/hook reads or queries error-log entries.
4. **Flat append semantics** in error-log (140 files, no rotation/cleanup) vs. overwrite semantics in session-inspection (30 dirs, stable per-session).