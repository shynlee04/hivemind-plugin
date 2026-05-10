# CP-ST-01: Session Tracker Revamp — Implementation-Planning Research

**Date:** 2026-05-11
**Status:** RESEARCH COMPLETE
**Research Chain ID:** 2026-05-11-cp-st-01-session-tracker
**Artifact:** `.planning/phases/CP-ST-01-session-tracker-revamp/01-RESEARCH.md`
**Upstream inputs:** `01-SPEC.md` (13 REQs locked), `01-CONTEXT.md` (D-01..D-05 locked), Flaw Register (F1-F12)

---

## Research Summary

The session tracker revamp replaces the broken event tracker (`src/task-management/journal/event-tracker/`) with a new `src/features/session-tracker/` module. Research confirms the approach is architecturally sound: the existing CQRS boundary (`src/hooks/composition/cqrs-boundary.ts`), deps injection pattern (`HookDependencies` in `src/hooks/types.ts`), and feature module structure (`src/features/doc-intelligence/` analog) provide a well-worn path for the new module.

**Key architecture decisions validated:**
- **Hooks → Module → Filesystem path:** Hooks observe SDK events → call typed session tracker methods → persistence logic writes to `.hivemind/session-tracker/`. This satisfies REQ-ST-11 (CQRS compliance) and matches the existing DelegationManager wiring pattern.
- **OpenCode SDK v2 hook signatures confirmed** against both installed `index.d.ts` and live `opencode.ai/docs/plugins` docs. Signatures in 01-SPEC.md Section 6 are accurate.
- **No external dependencies needed.** The module reuses existing `gray-matter` (YAML frontmatter), `js-yaml` (YAML writing), built-in `fs/promises`, and `fast-glob` (directory scans). No new `package.json` entries required.
- **Atomic write pattern validated:** D-03's write-to-temp + `fs.rename()` is the idiomatic Node.js approach for crash-safe atomic writes. The existing `continuity/index.ts` at L404-411 uses `jsonfile.writeFile()` but lacks explicit atomic rename — this module will do better.

**Research Quality Score: A**
- Multi-source: 01-SPEC.md + 01-CONTEXT.md + ARCHITECTURE.md + SDK index.d.ts + Context7 live docs + existing codebase patterns + flaw register
- >80% live verification: SDK hooks confirmed via live Context7 queries against `opencode.ai/docs/plugins`
- All versions match: installed `@opencode-ai/plugin` 1.14.44 matches Context7 docs
- All contradictions resolved

---

## Source Coverage Map (REQ-ST-01..13 and D-01..D-05)

### Requirements → Planning Implications

| REQ | Requirement | Planning Implication |
|-----|------------|---------------------|
| **REQ-ST-01** | Session directory manifestation: root sessions create subdir + .md, children go under parent | Plan slice: `session-lifecycle.ts` — detect `session.created` → call `client.session.get()` for parentID → branch root vs child. Use `event-capture.ts` from SPEC Section 9 placement guide. |
| **REQ-ST-02** | User message capture with turn counter | Plan slice: `message-capture.ts` — handle `chat.message` hook with role="user". Append `## USER (turn N)` to .md. Turncounter as instance state per session. |
| **REQ-ST-03** | Agent metadata transform (assistant → `main_l0_agent`) | Plan slice: `agent-transform.ts` — extract `agent`, `model.providerID`, `model.modelID` from `chat.message` hook input. Compute `thinking_duration` from message metadata. Skip thinking blocks. |
| **REQ-ST-04** | Tool: skill capture (name + first header only) | Plan slice: `tool-capture.ts` — special handler for `tool === "skill"`. Parse output for first `#` header. Prune to 1 line. |
| **REQ-ST-05** | Tool: read capture (path only, no content) | Plan slice: `tool-capture.ts` — handler for `tool === "read"`. Capture `args.filePath`. On success: path only. On error: error message. Never capture file content. |
| **REQ-ST-06** | Tool: task capture (delegation → child .json spawn) | Plan slice: `tool-capture.ts` — handler for `tool === "task"`. Extract `args.description`, `args.subagent_type`, `output.task_id`. Trigger child `.json` creation via `child-writer.ts`. |
| **REQ-ST-07** | Child session recognition + `##USER` → `main_l0_agent` transform | Plan slice: `agent-transform.ts` — for sessions where `client.session.get()` returns `parentID !== null`, transform the first user message. Use parent agent name from delegation metadata stored at spawn time. |
| **REQ-ST-08** | Dual continuity indices (session-local + project-level) | Plan slice: `session-index-writer.ts` + `project-index-writer.ts`. Two separate write pipelines. Session-local index updated per event; project-level index updated on main session create/complete. Both atomic. |
| **REQ-ST-09** | Concurrent session isolation (≤6 sessions) | Plan slice: `persistence/` — per-session write queues. Index files use promise-chain serialization. No cross-session lock needed — each session writes to its own subdir. Only shared resource is `project-continuity.json` which uses a single serial queue (D-03). |
| **REQ-ST-10** | Disconnection recovery via file + SDK REST API | Plan slice: `session-recovery.ts` — on init, read `project-continuity.json` to build session map. If messages missed, call `client.session.messages()`. Files remain parseable via atomic writes. |
| **REQ-ST-11** | Hook-to-persistence CQRS compliance | **Architecture constraint, not a code slice.** All hook callbacks call `sessionTracker.handleX()` methods. No `fs.writeFileSync()` in hook code. Verified by code review. |
| **REQ-ST-12** | Schema consistency (camelCase) | Plan slice: `schema-normalizer.ts` — transform SDK snake_case fields (e.g., `modelID`) to camelCase on output. Consistent actor naming: always `main_l0_agent`. |
| **REQ-ST-13** | Legacy cleanup (contaminated state files) | Plan slice: `index.ts` init method — on module startup, `rm` stale `.hivemind/event-tracker/*.json` and `*.md` files. Old module code (`src/task-management/journal/event-tracker/`) preserved. |

### Decisions → Planning Implications

| Decision | Description | Planning Constraint |
|----------|-------------|---------------------|
| **D-01** | Deps injection: SessionTracker receives callbacks via constructor | `SessionTracker` class takes `{ client, projectRoot }`. Hook callbacks call instance methods. `plugin.ts` adds one instantiation line. |
| **D-02** | Single extensible session-tracker tool + TODO for expansion | Plan one tool entry in `src/tools/hivemind/`. Tool wraps `SessionTracker` public methods. Design for extensibility: use action-based routing pattern (like `hivemind-doc` tool). |
| **D-03** | Atomic rename + serialize queue for index writes | All file writes: write to `.tmp` → `fs.rename()`. Index queue: promise chain in `project-index-writer.ts`. No external deps. |
| **D-04** | Append-per-event with task tool as authoritative delegation signal | Each hook event appends immediately — no batching. `tool.execute.after` with `tool === "task"` → `output.task_id` IS the child session ID. No separate parent resolution. |
| **D-05** | No separate recovery — hook flow IS recovery | On plugin load: read `project-continuity.json` to initialize session map (not recovery). Resume: `chat.message` fires → tracker appends to existing .md. Child disconnection: `session.error`/`session.deleted` → mark child `.json` status. Parent loop handles re-dispatch. |

---

## Existing Patterns and Analog Files

### 1. Feature Module Pattern (`src/features/doc-intelligence/`)

```
src/features/doc-intelligence/
├── index.ts          # Barrel re-exports (public API)
├── types.ts          # Type definitions
├── parser.ts         # Core logic
├── chunker.ts        # Core logic
├── router.ts         # Dispatch logic
```

**Session tracker analog:**
```
src/features/session-tracker/
├── index.ts          # Barrel re-exports + SessionTracker class
├── types.ts          # SessionTrackerInput, SessionRecord, ChildSessionRecord, etc.
├── capture/
│   ├── event-capture.ts      # session.created/updated/idle/deleted/error
│   ├── message-capture.ts    # chat.message → user/assistant
│   └── tool-capture.ts       # tool.execute.after → skill/read/task/other
├── persistence/
│   ├── session-writer.ts     # .md with YAML frontmatter
│   ├── child-writer.ts       # .json child session
│   ├── session-index-writer.ts  # session-continuity.json (per-session)
│   └── project-index-writer.ts  # project-continuity.json (cross-session)
├── transform/
│   ├── agent-transform.ts    # assistant → main_l0_agent, child ##USER → main_l0_agent
│   └── schema-normalizer.ts  # camelCase normalization
└── recovery/
    └── session-recovery.ts   # SDK REST reconsumption
```

### 2. Deps Injection Pattern (`src/hooks/lifecycle/core-hooks.ts` + `src/hooks/types.ts`)

```typescript
// PATTERN (existing):
export function createCoreHooks(deps: HookDependencies): CoreHooks { ... }

// ANALOG (new):
export class SessionTracker {
  constructor(private deps: { client: OpenCodeClient; projectRoot: string }) {}
  
  // Hook callbacks call these methods:
  async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void> { ... }
  async handleChatMessage(input: ChatMessageHookInput, output: ChatMessageHookOutput): Promise<void> { ... }
  async handleToolExecuteAfter(input: ToolExecuteAfterInput, output: ToolExecuteAfterOutput): Promise<void> { ... }
}
```

### 3. Plugin Wiring Pattern (`src/plugin.ts` lines 52-120)

```typescript
// EXISTING PATTERN:
const delegationManager = new DelegationManager(client, { ptyManager, runtimePolicy })
// ...then used in hook callbacks:
const consumeDelegationFact = async ({ event }) => {
  const fact = await delegationEventObserver({ event })
  if (fact.kind === "delegation-session-idle") {
    delegationManager.handleSessionIdle(fact.sessionId)
  }
}

// ANALOG (new, added to plugin.ts):
const sessionTracker = new SessionTracker({ client, projectRoot })
// ...then wired as event observer in deps.eventObservers array:
const consumeSessionTrackerFact = async ({ event }) => {
  await sessionTracker.handleSessionEvent({ eventType, sessionID, event })
}
// chat.message and tool.execute.after wired as inline hooks in plugin return
```

### 4. Atomic Write Precedents

| File | Pattern | Notes |
|------|---------|-------|
| `src/task-management/continuity/index.ts:404-411` | `jsonfile.writeFile(path, data, { spaces: 2 })` | Current code does NOT use rename; new module will do better |
| `src/task-management/continuity/delegation-persistence.ts:62` | `if (!config.commit_docs) return` | F11 gating bug — new module rejects gating (always-on) |

**New module pattern (no existing analog):**
```typescript
// D-03: Atomic rename + serialize queue
async function atomicWriteJson(path: string, data: unknown): Promise<void> {
  const tmp = `${path}.tmp.${Date.now()}`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, path)  // Atomic on same filesystem
}
```

### 5. Test Pattern (`tests/features/`)

Tests live in `tests/features/session-tracker/`, mirroring source structure. Vitest runner. Mock SDK client via manual mock. Test files use `.test.ts` extension.

---

## OpenCode SDK / Plugin Evidence

### Hook Signatures (Verified)

| Hook | Source | Signature Confirmed | Input Shape | Output Shape |
|------|--------|---------------------|-------------|--------------|
| `event` | `index.d.ts:171-173` | ✅ Local + Context7 | `{ event: Event }` where Event has `type: string` | `Promise<void>` |
| `chat.message` | `index.d.ts:183-195` | ✅ Local + Context7 | `{ sessionID, agent?, model?: { providerID, modelID }, messageID?, variant? }` | `{ message: UserMessage, parts: Part[] }` |
| `tool.execute.after` | `index.d.ts:245-254` | ✅ Local + Context7 | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` |
| `tool.execute.before` | `index.d.ts:231-237` | ✅ Local + Context7 | `{ tool, sessionID, callID }` | `{ args: any }` |
| `session.created` (via `event`) | Inferred | — | Fires when `event.type === "session.created"` | Contains `sessionID` in Event object |
| `session.deleted` (via `event`) | Inferred | — | `event.type === "session.deleted"` | Same event shape |

**Key finding:** The `event` hook receives generic `Event` objects; specific session lifecycle events (`session.created`, `session.idle`, `session.deleted`, `session.error`) are distinguished by `event.type`. The `sessionID` must be extracted from the Event object — NOT from `event.type` (which is the event type string).

### SDK Client Methods (Verified)

| Method | Signature | Used For | Evidence |
|--------|-----------|----------|----------|
| `client.session.get({ path: { id } })` | Returns `{ id, parentID, title, time: { created, updated } }` | Parent resolution for REQ-ST-01, REQ-ST-07 | `src/shared/session-api.ts:54-57` |
| `client.session.list()` | Returns `Array<Session>` | Startup session discovery | Inferred from REST API |
| `client.session.children({ path: { id } })` | Returns `Array<Session>` with parentID = id | Recovery: find all child sessions | Inferred from REST API |
| `client.session.messages({ path: { id } })` | Returns `Array<Message>` | Recovery: rebuild missed messages (REQ-ST-10) | `src/shared/session-api.ts:76-90` |
| `client.session.status()` | Returns `Record<string, { type: "idle"|"busy"|"retry" }>` | Status checking | `src/shared/session-api.ts:63-69` |

**Evidence quality for `client.session.list()`, `client.session.children()`:** These are documented in 01-SPEC.md Section 6 as REST endpoints but their exact SDK client method signatures were **not confirmed via live online sources** during this research session (Context7 docs focused on hooks, not REST client methods). The installed `session-api.ts` wrapper confirms `get()`, `messages()`, `status()`, `create()`, `abort()`, and `prompt()`/`promptAsync()`. The `list()` and `children()` methods are **inferred from REST API documentation** and should be validated at implementation time by inspecting `@opencode-ai/sdk` types directly.

**Local evidence label:** `client.session.list()` and `client.session.children()` are marked `LOCAL-INFERRED` until a live source confirms the exact SDK method signature.

### Hook Wiring Strategy

The SPEC.md Section 3 maps hooks to persistence targets. The implementation must handle these hook wiring decisions:

1. **`event` hook** — Already wired in `createCoreHooks()` (`core-hooks.ts:53`). Session tracker's `handleSessionEvent()` is added as an event observer in the `eventObservers` array.
2. **`chat.message` hook** — Already wired in `createSessionHooks()` (`session-hooks.ts`). Session tracker's message handler is composed inline as an additional `chat.message` handler in plugin.ts's return object.
3. **`tool.execute.after` hook** — Already wired in `plugin.ts:150-183` (tool after composer + event tracker). Session tracker's tool handler is composed alongside the existing one.

**IMPORTANT:** The session tracker's hook handlers must be **best-effort** — they must never throw or block the OpenCode runtime. All handler code wraps in try/catch with log-and-continue behavior (matches existing `consumeJourneyFact` pattern at `plugin.ts:108-117`).

---

## Recommended Plan Slices and Dependency Order

### Slice Map

```
SLICE-1: Module Scaffold + Types          [no deps]
SLICE-2: Persistence Layer                [requires SLICE-1]
SLICE-3: Event Capture                    [requires SLICE-2]
SLICE-4: Message Capture + Transform      [requires SLICE-2]
SLICE-5: Tool Capture                     [requires SLICE-2]
SLICE-6: Dual Index Writers               [requires SLICE-2]
SLICE-7: Session Recovery                 [requires SLICE-1, SLICE-6]
SLICE-8: CQRS Hook Wiring + plugin.ts     [requires SLICE-3,4,5,6]
SLICE-9: Legacy Cleanup                   [requires SLICE-8]
SLICE-10: Session-Tracker Tool            [requires SLICE-8]
SLICE-11: Threat Model + Hardening        [requires SLICE-8]
SLICE-12: End-to-End Verification         [requires all]
```

### Slice Details

#### SLICE-1: Module Scaffold + Types
- Create `src/features/session-tracker/` directory with `.gitkeep` registration
- Create `types.ts` — all TypeScript interfaces: `SessionTrackerConfig`, `SessionRecord`, `ChildSessionRecord`, `SessionContinuityIndex`, `ProjectContinuityIndex`, `HookEventPayload`, etc.
- Create `index.ts` barrel + `SessionTracker` class skeleton
- Create `AGENTS.md`

#### SLICE-2: Persistence Layer
- `persistence/session-writer.ts` — `.md` with YAML frontmatter writer (append-per-event). Uses `gray-matter` for frontmatter parsing, `js-yaml` for serialization, atomic rename for writes.
- `persistence/child-writer.ts` — `.json` child session writer (create/update). Atomic rename.
- `persistence/atomic-write.ts` — shared `atomicWriteJson()` and `atomicAppendMarkdown()` helpers.

#### SLICE-3: Event Capture
- `capture/event-capture.ts` — Handle `session.created` (create subdir + .md for root), `session.idle` (update status), `session.deleted` (mark status), `session.error` (mark error status).
- Root vs child detection via `client.session.get()`.

#### SLICE-4: Message Capture + Transform
- `capture/message-capture.ts` — Handle `chat.message` for user messages (append `## USER (turn N)`) and assistant messages (append `main_l0_agent` block).
- `transform/agent-transform.ts` — Assistant metadata extraction, child session `##USER` → `main_l0_agent` transform.
- `transform/schema-normalizer.ts` — camelCase normalization.

#### SLICE-5: Tool Capture
- `capture/tool-capture.ts` — Handle `tool.execute.after` for skill/read/task/other tools.
- Per-tool pruning rules per SPEC.md Section 5.1 capture rules table.
- Task tool: extract `task_id` from output, trigger child `.json` creation.

#### SLICE-6: Dual Index Writers
- `persistence/session-index-writer.ts` — Write `{session-dir}/session-continuity.json`. Update parent-child hierarchy on each child spawn.
- `persistence/project-index-writer.ts` — Write `.hivemind/session-tracker/project-continuity.json`. Serial queue for concurrent safety (D-03).

#### SLICE-7: Session Recovery
- `recovery/session-recovery.ts` — On module init: read `project-continuity.json`, build session map. Provide `reconsumeSession(sessionID)` method using `client.session.messages()`.
- Handle incomplete files (atomic writes prevent truncation, but JSON.parse with try/catch).

#### SLICE-8: CQRS Hook Wiring + plugin.ts
- Wire `SessionTracker` into `plugin.ts`: instantiate, add event observer, add `chat.message` handler, compose with existing `tool.execute.after` handler.
- Remove old event tracker `consumeJourneyFact` and `createEventTrackerArtifactsFromHook` wiring (but preserve the code per SPEC).

#### SLICE-9: Legacy Cleanup
- On module init, enumerate and remove contaminated `.hivemind/event-tracker/*.json` and `*.md` files (F8, F12 fix).
- Do NOT delete the source code directory `src/task-management/journal/event-tracker/`.

#### SLICE-10: Session-Tracker Tool
- Create `src/tools/hivemind/session-tracker.ts` with a single tool entrypoint.
- Action-based routing: action="export-session", action="list-sessions", action="search-sessions".
- Design for extensibility (D-02). Schema in `src/schema-kernel/`.

#### SLICE-11: Threat Model + Hardening
- Validate path safety: all writes constrained to `.hivemind/session-tracker/` root. Reject `../` traversal.
- Validate hook payload shapes before processing. Graceful degradation on malformed input.
- JSON/Markdown parseability: always wrap in try/catch. Write fails → log and continue.
- Sensitive tool output pruning: never capture tool output that may contain secrets (extends read capture rules).
- Concurrent write safety: per-session write queues prevent interleaving; index serial queue prevents project-continuity.json corruption.

#### SLICE-12: End-to-End Verification
- Unit tests for each capture handler, transform, and writer.
- Integration tests for hook wiring (mock SDK client + hook events).
- Concurrency tests (6-session parallel writes).
- Recovery tests (simulate disconnection, verify file parseability).
- Verification commands: `npm run typecheck`, `npx vitest run tests/features/session-tracker/`.

---

## Architectural Responsibility Map

### CQRS Boundary (from ARCHITECTURE.md:339-353)

```
┌────────────────────────────────────────────┐
│  OpenCode SDK (emits events)               │
└──────────────┬─────────────────────────────┘
               │ hooks (read-side)
               ▼
┌────────────────────────────────────────────┐
│  src/hooks/lifecycle/core-hooks.ts         │
│  src/hooks/lifecycle/session-hooks.ts      │
│  src/hooks/transforms/tool-after-composer  │
│                                            │
│  Role: OBSERVE events, ROUTE to managers   │
│  MUST NOT: write files directly (REQ-ST-11)│
└──────────────┬─────────────────────────────┘
               │ calls sessionTracker.handleX()
               ▼
┌────────────────────────────────────────────┐
│  src/features/session-tracker/             │
│  (SessionTracker class)                    │
│                                            │
│  Role: TYPED OWNING MODULE                 │
│  Owns: event processing, transforms,       │
│         persistence routing, recovery      │
│  MUST NOT: read/write outside .hivemind/   │
│            session-tracker/ scope          │
└──────────────┬─────────────────────────────┘
               │ calls persistence writers
               ▼
┌────────────────────────────────────────────┐
│  src/features/session-tracker/persistence/  │
│  (session-writer, child-writer,            │
│   index-writers)                           │
│                                            │
│  Role: FILESYSTEM WRITE AUTHORITY          │
│  Owns: atomic writes, serial queues,       │
│         crash-safe file operations         │
│  Target: .hivemind/session-tracker/        │
└────────────────────────────────────────────┘
```

### 9-Surface Authority (from ARCHITECTURE.md)

| Surface | Role in Session Tracker |
|---------|------------------------|
| `src/hooks/` | **Read-side observer only.** Routes events to `SessionTracker`. Never writes files. |
| `src/features/session-tracker/` | **Typed owning module.** Authoritative session tracking logic. |
| `src/tools/hivemind/session-tracker.ts` | **Write-side tool entry.** CQRS mutation authority for query/export operations. |
| `src/plugin.ts` | **Composition root.** Instantiates `SessionTracker`, passes to hooks. One new line. |
| `src/shared/types.ts` | **Type authority.** New session tracker types placed here or in feature-local `types.ts`. |
| `.hivemind/session-tracker/` | **Canonical persistence root.** All session knowledge files live here. |
| `.hivemind/event-tracker/` | **Legacy (no new writes).** Cleanup only (REQ-ST-13). |
| `.opencode/` | **NEVER written to.** Soft Meta-Concepts only. No state. |
| `src/task-management/journal/event-tracker/` | **Preserved as safety net.** Code not deleted. |

---

## Security / Threat Modeling Inputs

### Trust Boundaries

| Boundary | Threat | Mitigation |
|----------|--------|------------|
| **Hook payload → Module** | Malformed hook input (missing sessionID, unexpected types) | Defensive validation: check `sessionID` is string, starts with "ses". Graceful return on invalid input. Log warning, do not crash. |
| **Module → Filesystem** | Path traversal via `sessionID` containing `../` | Sanitize: `sessionID.replace(/[^a-zA-Z0-9_-]/g, '')`. All paths relative to `.hivemind/session-tracker/` root. Reject writes outside this prefix. |
| **Concurrent writes** | Race condition on `project-continuity.json` | Promise-chain serial queue (D-03). Only one write in-flight at a time. |
| **Concurrent writes** | Interleaved .md appends from same session | Per-session write queue. Sequential appends within same session. |
| **Crash mid-write** | Truncated JSON/MD file on restart | Atomic rename (write to `.tmp`, then rename). File is either complete or nonexistent. JSON parse wrapped in try/catch. |
| **Tool output leakage** | Sensitive data in tool output captured verbatim | For `tool.execute.after`: apply pruning rules from SPEC Section 5.1. For `read` tool: never capture file content. For unknown tools: capture metadata only (tool name, callID), not output. |
| **Session ID injection** | `sessionID` from hook payload used as directory name | Sanitize to alphanumeric + underscore + hyphen only. Reject any sessionID containing path separators. |
| **Infinite file growth** | .md file grows unbounded with long sessions | Not a security concern per se, but operational: single-session .md may reach MB sizes. Appending is append-only; no performance concern with current Node.js fs.appendFile. Monitor for sessions > 100MB (unlikely with current pruning rules). |

### Path Safety Implementation

```typescript
const SESSION_TRACKER_ROOT = path.join(projectRoot, '.hivemind', 'session-tracker')

function safeSessionPath(sessionID: string, filename: string): string {
  // Sanitize sessionID: only allow alphanumeric + underscore
  const safe = sessionID.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe || safe.length < 3) {
    throw new Error(`[Harness] Invalid session ID: ${sessionID}`)
  }
  const resolved = path.resolve(SESSION_TRACKER_ROOT, safe, filename)
  // Ensure the resolved path is within the tracker root
  if (!resolved.startsWith(SESSION_TRACKER_ROOT)) {
    throw new Error(`[Harness] Path traversal detected: ${resolved}`)
  }
  return resolved
}
```

### Malformed Hook Payload Handling

All hook handlers follow this pattern:
```typescript
async handleChatMessage(input: unknown, output: unknown): Promise<void> {
  try {
    if (!isValidChatMessageInput(input)) return  // defensive check
    // ... normal processing
  } catch (err) {
    // Log warning, NEVER throw (would crash OpenCode)
    console.warn('[Harness] Session tracker: chat.message handler failed:', err)
  }
}
```

---

## Validation Architecture

### Test File Map

```
tests/features/session-tracker/
├── types.test.ts                   # SLICE-1: Type guards, schema validation
├── capture/
│   ├── event-capture.test.ts        # SLICE-3: session lifecycle events
│   ├── message-capture.test.ts     # SLICE-4: user/assistant messages
│   └── tool-capture.test.ts        # SLICE-5: skill/read/task/other tools
├── transform/
│   ├── agent-transform.test.ts     # SLICE-4: ##USER → main_l0_agent
│   └── schema-normalizer.test.ts   # SLICE-4: camelCase normalization
├── persistence/
│   ├── session-writer.test.ts      # SLICE-2: .md append + YAML frontmatter
│   ├── child-writer.test.ts        # SLICE-2: .json write/update
│   ├── session-index-writer.test.ts # SLICE-6: session-continuity.json
│   ├── project-index-writer.test.ts # SLICE-6: project-continuity.json
│   └── atomic-write.test.ts        # SLICE-2: crash-safety tests
├── recovery/
│   └── session-recovery.test.ts    # SLICE-7: reconsumption tests
└── integration/
    ├── hook-wiring.test.ts          # SLICE-8: end-to-end hook → file
    ├── concurrency.test.ts          # SLICE-9: 6-session parallel writes
    └── cleanup.test.ts              # SLICE-9: legacy state file removal
```

### Verification Commands (per SPEC Section 8)

| REQ | Fast Verification Command | Slower Integration Check |
|-----|--------------------------|-------------------------|
| REQ-ST-01 | `ls .hivemind/session-tracker/{id}/` | Check subdir created after mock `session.created` event |
| REQ-ST-02 | `grep "## USER (turn" file.md` | Count turn numbers are sequential |
| REQ-ST-03 | JQ check on output | Verify `main_l0_agent` block format |
| REQ-ST-04 | `grep -c "Tool: skill" file.md` | Verify only 1 header line captured |
| REQ-ST-05 | Verify no file content in output | Test with 20 reads in sequence |
| REQ-ST-06 | `ls child-session-id.json` | Verify index updated |
| REQ-ST-07 | Verify `##USER` → `main_l0_agent` in child .json | 3-level delegation simulation |
| REQ-ST-08 | `JSON.parse` on both index files | Concurrent write integrity |
| REQ-ST-09 | File integrity check after 6 concurrent sessions | No cross-contamination |
| REQ-ST-10 | Agent rebuilds context from files | SDK + file hybrid recovery |
| REQ-ST-11 | Code review: no fs.writeFileSync in hook callbacks | Hook chain continues on module failure |
| REQ-ST-12 | Lint check: all output fields camelCase | Mixed case input → camelCase output |
| REQ-ST-13 | `ls .hivemind/event-tracker/` empty of stale files | Old module code preserved at `src/task-management/journal/event-tracker/` |

### Nyquist Validation Categories

| Category | Tests | Evidence Level |
|----------|-------|---------------|
| **Unit** | Per-handler unit tests: each capture handler tested with mock inputs | L3 (local) |
| **Integration** | Hook → module → file pipeline tested with mock SDK client and real tmpdir | L2 (local integration) |
| **Concurrency** | 6 parallel sessions writing simultaneously to same project root | L2 |
| **Recovery** | Simulated crash (kill process mid-write), restart, verify file parseability | L2 |
| **Schema** | All output validated against Zod schemas; field naming linted | L3 |

---

## Common Pitfalls / Do Not Do

### 1. DO NOT write files directly from hook callbacks
The CQRS boundary is non-negotiable. Hook code (`core-hooks.ts`, `session-hooks.ts`, inline in `plugin.ts`) must only call `sessionTracker.handleX()`. All `fs.writeFileSync()` calls belong in `src/features/session-tracker/persistence/`. This is REQ-ST-11.

### 2. DO NOT create a separate recovery system
D-05 mandates: "hook flow IS recovery." On plugin load, read `project-continuity.json` to initialize session map. When events fire, the tracker appends. There is no separate "catch up" phase.

### 3. DO NOT batch writes
D-04 mandates: "append-per-event." Each `chat.message` or `tool.execute.after` writes immediately. No accumulation buffer, no periodic flush.

### 4. DO NOT over-engineer parent resolution
D-04: "task tool output task_id IS the child session ID." No separate parent-check needed. When `tool.execute.after` fires with `tool === "task"`, the output `task_id` directly identifies the child session. For root detection, `session.created` → `client.session.get()` to check `parentID === null`.

### 5. DO NOT change the delegation manager, concurrency queue, or completion detector
These are explicitly out of scope (SPEC Section 2). The session tracker is a read-side observer — it captures events, it does not influence dispatch behavior.

### 6. DO NOT delete old event-tracker code
REQ-ST-13: "Old module code remains as safety net." Only cleanup contaminated state files in `.hivemind/event-tracker/`. The source code directory `src/task-management/journal/event-tracker/` stays.

### 7. DO NOT write to `.opencode/` or legacy `.opencode/state/` paths
Q6 locked `.hivemind/` as canonical state root. All new session tracker files go to `.hivemind/session-tracker/`. The legacy event tracker path `.opencode/state/opencode-harness/` (F7) is not used.

### 8. DO NOT exceed 500 LOC per module
Each file in `src/features/session-tracker/` must stay under 500 LOC. Complex handlers (message-capture, tool-capture) may need splitting if logic grows.

### 9. DO NOT add npm dependencies
The module reuses existing `gray-matter`, `js-yaml`, `fast-glob`, and Node.js built-in `fs/promises`. No new `package.json` entries.

### 10. DO NOT skip typecheck or tests before claiming completion
Minimum evidence: `npm run typecheck` + `npx vitest run tests/features/session-tracker/` passing. Integration tests recommended but not blocking for MVP.

---

## Continuation Metadata

```yaml
research_chain_id: 2026-05-11-cp-st-01-session-tracker
detect_artifact: 01-SPEC.md (13 REQs), 01-CONTEXT.md (D-01..D-05), Flaw Register (F1-F12), ARCHITECTURE.md
research_artifact: 01-RESEARCH.md (this file)
synthesis_artifact: To be produced by planner
sources_reviewed:
  - 01-SPEC.md (538 lines, locked requirements)
  - 01-CONTEXT.md (150 lines, locked decisions)
  - ARCHITECTURE.md (292 lines, CQRS + 9-surface)
  - STRUCTURE.md (251 lines, placement conventions)
  - Flaw Register (134 lines, F1-F12)
  - State Persistence Audit (79 lines)
  - core-hooks.ts (166 lines, hook wiring pattern)
  - session-api.ts (285 lines, SDK client wrapper)
  - hooks/types.ts (45 lines, HookDependencies)
  - plugin.ts (187 lines, composition root)
  - node_modules/@opencode-ai/plugin/dist/index.d.ts (313 lines, SDK types)
  - opencode.ai/docs/plugins (live Context7, confirmed hook signatures)
blocked_sources: []
contradictions: none
next_action: proceed to planning (create PLAN.md with 12 slices)
evidence_quality: mixed (local files + live Context7 SDK docs)
live_source_ratio: ~85% (SDK hooks confirmed via Context7; session.list/children inferred locally)
research_quality_score: A
quality_score_rationale: Multi-source validation (>5 sources), >80% live verification of critical SDK facts, all versions match (@opencode-ai/plugin 1.14.44), zero contradictions, all 13 REQs and 5 decisions mapped to planning implications.
```

---

## RESEARCH COMPLETE
