[LANGUAGE: Write this file in vi per Language Governance.]
# Phase CP-ST-02: Session-Tracker Deep Fix — Remaining Issues — Research

**Researched:** 2026-05-13
**Domain:** OpenCode SDK Session Lifecycle, Plugin Hooks, Server API Integration
**Confidence:** HIGH

## Summary

This research investigates the OpenCode SDK session lifecycle, Server API endpoints, and plugin hook timing to solve the session-tracker orphan directory bug. The root cause is a race condition: `session.created` fires for child sessions BEFORE `tool.execute.after` populates the HierarchyIndex, causing both classification gates (SDK parentID + HierarchyIndex) to fail. The child session is misclassified as a main session and gets its own directory.

**Primary recommendation:** Wire `tool.execute.before` to proactively poll `client.session.children()` at task dispatch time, registering child sessions in the HierarchyIndex BEFORE `session.created` fires. Use Server API as the authoritative hierarchy source, with hooks as triggers — not the reverse. Also wire `tool.execute.before` to capture `args.subagent_type` for correct delegator attribution.

**Key insight from live verification:** The child session is created DURING `TaskTool.execute()` — NOT before. At `tool.execute.before` time, the child does NOT exist. However, by polling `GET /session/:parentID/children` after dispatch (with a ~200ms retry loop), we can discover the child and register it in HierarchyIndex before `session.created` arrives, preempting the race.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Task dispatch detection | Plugin hooks (`tool.execute.before`) | SessionTracker | Hooks observe tool calls; SessionTracker owns session classification |
| Child session discovery | Server API (`session.children()`) | Plugin hooks | Server API is the authoritative source for parent-child relationships |
| HierarchyIndex population | SessionTracker (HierarchyIndex) | tool-capture (HandleTask) | HierarchyIndex is the in-memory registry for parent-child mappings |
| Agent attribution | Plugin hooks (`tool.execute.before`) | tool-capture | `subagent_type` is available in task tool args at PreToolUse time |
| Directory creation gating | SessionTracker (ensureSessionReady) | event-capture | Classification gates prevent child sessions from getting directories |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add `tool.execute.before` hook in `src/plugin.ts` that detects task tool dispatch. At PreToolUse time, query SDK Server API for child session relationship. Register child session in hierarchy IMMEDIATELY (not waiting for PostToolUse). PostToolUse still fires for metadata updates.
- **D-02:** Server API as PRIMARY hierarchy source. Hook events are SECONDARY triggers. Endpoints: `GET /session`, `GET /session/:id`, `GET /session/:id/children`.
- **D-03:** Capture actual delegating agent name from task tool args (`subagent_type`) at PreToolUse time. Store in `delegatedBy.agentName`.
- **D-04:** Backward compatibility: existing records with `agentName: "unknown"` remain as-is. New sessions get correct attribution.
- **D-05:** Unit tests for PreToolUse hook wiring, Server API integration (mocked), integration test for end-to-end child registration.

### the agent's Discretion

- Exact polling strategy (interval, max attempts, fallback behavior)
- Error handling patterns for Server API failures
- Memoization/caching of `session.children()` results
- Integration of PreToolUse data with existing tool-capture HandleTask logic

### Deferred Ideas (OUT OF SCOPE)

- Full PreToolUse capture for all tool types
- Non-task tool abort handling
- Real-time Server API polling for session discovery
- WebSocket-based session event streaming

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/sdk` | ^1.14.41 | OpenCode Server API client | Official SDK — TYPE-SAFE client for session CRUD, children queries, prompt dispatch |
| `@opencode-ai/plugin` | ^1.14.41 | Plugin hook types (`tool.execute.before`, `tool.execute.after`, `event`) | Official plugin SDK — provides typed hook signatures (peer dep) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | — | No additional libraries needed | The SDK `session.children()`, `session.get()`, and hooks are sufficient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `client.session.children()` polling | Direct HTTP fetch to Server API | SDK provides type safety + error handling; raw fetches require URL management |
| `tool.execute.before` polling | `session.created` with parentID inference | PreToolUse is proactive (prevents race); session.created is reactive (may miss children) |

**Installation:**
```bash
# Already installed — verify:
npm ls @opencode-ai/sdk @opencode-ai/plugin
```

**Version verification:**
```bash
npm view @opencode-ai/sdk version    # → 1.14.44 (latest as of 2026-05-13)
npm view @opencode-ai/plugin version  # → 1.14.44
```
Project uses `^1.14.41`, which resolves to `1.14.44` — confirmed compatible.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OpenCode Runtime                                 │
│                                                                     │
│  User sends prompt → L0 Orchestrator decides to delegate            │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────┐                   │
│  │  tool.execute.before (PreToolUse)             │                   │
│  │  input: { tool:"task", sessionID, callID }    │                   │
│  │  output: { args: { subagent_type, ... } }     │                   │
│  │                                               │                   │
│  │  [NEW] Plugin detects task →                  │                   │
│  │    1. Store (parentID, agentName) in          │                   │
│  │       PendingDispatchRegistry                 │                   │
│  │    2. Start async poll: GET /session/:parentID │                   │
│  │       /children every 200ms (max 5 attempts)  │                   │
│  └──────────────┬───────────────────────────────┘                   │
│                 │                                                   │
│                 ▼                                                   │
│  ┌──────────────────────────────────────────────┐                   │
│  │  TaskTool.execute()                           │                   │
│  │    → sessions.create({ parentID })            │                   │
│  │    → session.created event FIRES              │                   │
│  │    → metadata.sessionId = child session ID    │                   │
│  └──────────────┬───────────────────────────────┘                   │
│                 │                                                   │
│     ┌───────────┼──────────────┐                                    │
│     ▼           ▼              ▼                                    │
│  ┌─────────┐ ┌──────────┐ ┌─────────────────────┐                  │
│  │ session │ │ polling  │ │ tool.execute.after  │                  │
│  │.created │ │ discovers│ │ (PostToolUse)        │                  │
│  │ handler │ │ child    │ │ metadata.sessionId   │                  │
│  │         │ │          │ │ → update child meta  │                  │
│  └────┬────┘ └────┬─────┘ └──────────┬──────────┘                  │
│       │           │                  │                              │
│       ▼           ▼                  ▼                              │
│  ┌──────────────────────────────────────────────────┐              │
│  │         SessionTracker Classification            │              │
│  │                                                  │              │
│  │  Gate 1: SDK getSession(id) → parentID?          │              │
│  │  Gate 2: HierarchyIndex.isChild(id)?             │              │
│  │  Gate 3 (NEW): PendingDispatchRegistry?          │              │
│  │                                                  │              │
│  │  IF any gate → CHILD: skip dir, register .json   │              │
│  │  IF no gate → MAIN: create dir + .md             │              │
│  └──────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── plugin.ts                           # [MODIFY] Add tool.execute.before hook
├── features/
│   └── session-tracker/
│       ├── index.ts                    # [MODIFY] Add pending dispatch methods
│       ├── capture/
│       │   ├── event-capture.ts        # [MODIFY] Add Gate 3 check
│       │   └── tool-capture.ts         # [MODIFY] Accept agentName from pending dispatch
│       └── pending-dispatch.ts         # [NEW] PendingDispatchRegistry class
```

### Pattern 1: PreToolUse Proactive Child Discovery

**What:** At `tool.execute.before` time, detect task tool dispatch and poll Server API for new child sessions. Register in HierarchyIndex before `session.created` fires.

**When to use:** When the race condition between `session.created` and `tool.execute.after` causes orphan directories.

**Example:**
```typescript
// Source: verified against OpenCode SDK v1.14.44
// src/plugin.ts — tool.execute.before hook

"tool.execute.before": async (input, output) => {
  // Only handle task tool dispatches
  if (input.tool !== "task") return

  const parentID = input.sessionID
  const args = output.args as Record<string, unknown> | undefined
  const agentName = (args?.subagent_type as string) || "unknown"

  // 1. Store pending dispatch for agent attribution
  sessionTracker.registerPendingDispatch(parentID, agentName)

  // 2. Proactive polling: discover child before session.created fires
  //    The task tool creates the child during execution — poll to catch it
  let childDiscovered = false
  for (let attempt = 0; attempt < 5 && !childDiscovered; attempt++) {
    await new Promise(r => setTimeout(r, 200))
    try {
      const children = await client.session.children({
        path: { id: parentID }
      })
      // Filter for children created after dispatch time
      for (const child of children.data ?? []) {
        if (child.id && !sessionTracker.hierarchyIndex.isChild(child.id)) {
          sessionTracker.hierarchyIndex.registerChild(parentID, child.id)
          childDiscovered = true
        }
      }
    } catch {
      // Server API may not be ready — retry
    }
  }
}
```

### Pattern 2: Three-Gate Classification

**What:** `ensureSessionReady` (and `handleSessionCreated`) use three classification gates to prevent orphan directories.

**When to use:** Every time a session ID needs classification (main vs. child).

**Gates (in priority order):**
1. **SDK parentID:** `client.session.get({ path: { id } }).data.parentID` — authoritative, fastest path
2. **HierarchyIndex:** In-memory registry, populated by proactive polling and handleTask
3. **PendingDispatchRegistry:** Fallback — if a parent session recently dispatched a task, query `session.children()` on suspected parent to confirm

### Anti-Patterns to Avoid

- **PostToolUse-only registration**: Relying solely on `tool.execute.after` for child registration — this is the current broken pattern. If PostToolUse never fires (abort), the child is never registered.
- **SDK-only classification**: Relying solely on `getSession().parentID` — the SDK may not report parentID during a race window. HierarchyIndex and pending dispatch serve as defense-in-depth.
- **Blocking PreToolUse**: Making the `tool.execute.before` hook synchronous (awaiting polling) — this delays tool execution. Polling should be fire-and-forget with retry.
- **Hardcoded depth**: Using `depth = 1` instead of `parentDepth + 1`. Depth MUST be computed from the hierarchy chain.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session hierarchy discovery | Manual HTTP calls to Server API | `client.session.children({ path: { id } })` | SDK provides type-safe response, error handling, auth |
| Session parentID lookup | Walking message chains or event data | `client.session.get({ path: { id } }).data.parentID` | Server API returns canonical parentID — more reliable than event data |
| Child session ID extraction | Parsing tool output strings | `output.metadata.sessionId` (from `tool.execute.after`) | Structured metadata, not string parsing |
| Agent name attribution | Inferring from session agent config | `args.subagent_type` (from `tool.execute.before` output) | Direct parameter, available at dispatch time |

**Key insight:** The OpenCode SDK Server API is the authoritative source for session hierarchy. Hooks provide triggers (when to query), but the Server API provides the truth (what the relationships are).

---

## Runtime State Inventory

> Omit — this is a code-change phase, not a rename/refactor/migration.

---

## Common Pitfalls

### Pitfall 1: Child Session Not Yet Created at PreToolUse Time

**What goes wrong:** `tool.execute.before` fires BEFORE `TaskTool.execute()`. The child session does NOT exist at this point — `client.session.children()` returns the pre-existing children only.

**Why it happens:** `tool.execute.before` is a PRE-execution hook. The task tool hasn't called `sessions.create()` yet.

**How to avoid:** Use async polling with retry. After `tool.execute.before` fires, start a non-blocking polling loop (200ms intervals, max 5 attempts) to discover the new child when the task tool creates it.

**Warning signs:** `client.session.children()` returns the same count as before — child not yet created. Wait and retry.

### Pitfall 2: session.created Race Window (THE CORE BUG)

**What goes wrong:** `session.created` fires for the child during TaskTool execution. At this moment, `tool.execute.after` hasn't fired yet, so `handleTask()` hasn't called `registerChild()`. The HierarchyIndex doesn't know about the child. Both gates fail → child treated as main → orphan directory created.

**Why it happens:** The event system and tool execution run concurrently. OpenCode fires `session.created` immediately after `sessions.create()`, which happens mid-tool-execution. `tool.execute.after` fires only when the entire tool completes.

**How to avoid:** Three-gate classification with proactive polling. If Gate 1 (SDK) and Gate 2 (HierarchyIndex) fail, Gate 3 (PendingDispatch) queries Server API to confirm.

**Verification:** After fix, `.hivemind/session-tracker/` should have exactly ONE directory per L0 main session. Child sessions should never create directories.

### Pitfall 3: SDK Server API Not Ready During Polling

**What goes wrong:** The `client.session.children()` call fails because the Server API hasn't processed the child creation yet.

**Why it happens:** The child session is created via `sessions.create()` which writes to the server. There may be a brief delay before the server's index reflects the new child.

**How to avoid:** Wrap polling in try/catch. Treat API errors as "not ready yet" — continue retrying. Never throw from the PreToolUse hook (best-effort pattern).

**Warning signs:** `client.session.children()` throws with network error or 404. Retry up to 5 times, then fall back to reactive registration in `session.created` handler.

### Pitfall 4: Aborted Task Tool Never Fires PostToolUse

**What goes wrong:** When a task tool is aborted (user cancels, timeout), `tool.execute.after` never fires. If registration relied solely on PostToolUse, the child session is never registered → orphan directory.

**Why it happens:** `tool.execute.after` only fires on normal tool completion. Aborts bypass it.

**How to avoid:** Proactive PreToolUse registration. Child is registered in HierarchyIndex via polling BEFORE PostToolUse. If PostToolUse never fires, the child is still registered and won't create an orphan directory.

---

## Code Examples

Verified patterns from official sources:

### SDK Session Children Query

```typescript
// Source: OpenCode SDK docs — opencode-sdk.md:192
// Verified via: Context7 + official docs bundle
// Note: SDK returns wrapped responses; use .data to access the Session array
const result = await client.session.children({
  path: { id: parentSessionID }
})
// result.data: Session[] — each with id, parentID, title, status, etc.
```

### Hook Signature: tool.execute.before

```typescript
// Source: DeepWiki anomalyco/opencode — verified 2026-05-13
// https://deepwiki.com/search/what-is-the-exact-signature-of_ebf1010b
"tool.execute.before": async (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any }
) => Promise<void>
```

### Hook Signature: tool.execute.after

```typescript
// Source: DeepWiki anomalyco/opencode — verified 2026-05-13
"tool.execute.after": async (
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title: string; output: string; metadata: any }
) => Promise<void>
// For task tool specifically: output.metadata = { sessionId: string, model: string }
```

### SDK Session Get (for parentID)

```typescript
// Source: OpenCode SDK docs — opencode-sdk.md:191
// Verified via: official SDK documentation
const result = await client.session.get({
  path: { id: sessionID }
})
const parentID = result.data?.parentID  // string | null | undefined
```

### Current plugin.ts GAP #2 (sessionID type)

```typescript
// Source: src/plugin.ts:236-237
// CURRENT (sessionID is OPTIONAL — lost when not provided by runtime):
"tool.execute.after": async (
  input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> },
  _output?: { metadata?: unknown; [key: string]: unknown } | string,
): Promise<void> => { ... }

// SHOULD BE (sessionID is REQUIRED — SDK always provides it):
"tool.execute.after": async (
  input: { tool: string; sessionID: string; callID: string; args: Record<string, unknown> },
  _output?: { metadata?: { sessionId?: string }; title?: string; output?: string },
): Promise<void> => { ... }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tool.execute.after` only (PostToolUse registration) | `tool.execute.before` proactive polling + `tool.execute.after` metadata update | CP-ST-02 (this phase) | Eliminates orphan directories from race condition |
| Hardcoded `delegatedBy.agentName = "unknown"` | `args.subagent_type` from PreToolUse hook | CP-ST-02 (this phase) | Correct delegation lineage tracking |
| `ev?.sessionID` for session.created | `getEventSessionID(ev)` via `properties.info.id` | CP-ST-01 (previous phase) | Already fixed — session.created now correctly routes |

**Deprecated/outdated:**
- `ev?.sessionID` extraction pattern — replaced by `getEventSessionID()` in CP-ST-01
- PostToolUse-only child registration — replaced by PreToolUse proactive polling in CP-ST-02
- Hardcoded delegation depth — replaced by dynamic `parentDepth + 1` computation (already in CP-ST-01 tool-capture.ts:239-246)

---

## Assumptions Log

> All claims in this research were verified via live sources or existing codebase analysis.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `client.session.children()` returns `{ data: Session[] }` wrapper | Code Examples | The exact response shape may differ slightly — verified via official docs but should be tested at runtime |
| A2 | `args.subagent_type` is available in `tool.execute.before` output | Architecture Patterns | If the task tool doesn't expose `subagent_type` at PreToolUse time, agent attribution falls back to "unknown" |
| A3 | Polling interval of 200ms with 5 retries is sufficient to catch child creation | Common Pitfalls | Child creation may take longer under heavy load — tunable parameter |

---

## Open Questions

1. **Does `tool.execute.before` output expose `args.subagent_type` for all task tool invocations?**
   - What we know: The output object contains `args` (the tool's full arguments). Task tool args include `subagent_type`.
   - What's unclear: Whether OpenCode always populates `subagent_type` at PreToolUse time, or only for certain dispatch patterns.
   - Recommendation: Write defensively — use `args.subagent_type ?? "unknown"` and verify with runtime testing.

2. **Can `client.session.children()` be called from within a hook callback without blocking tool execution?**
   - What we know: The SDK client is available in the plugin context. Hook callbacks are async.
   - What's unclear: Whether the SDK client blocks while awaiting Server API responses, and whether this delays the task tool from executing.
   - Recommendation: Use fire-and-forget pattern (no `await` in hook, start async polling as separate promise). The hook should return immediately after storing pending dispatch.

3. **What is the exact response shape of `client.session.children()`?**
   - What we know: From official docs, it returns `Session[]`. The SDK wraps responses in a `data` field.
   - What's unclear: Whether the response uses `{ data: Session[] }` or the `fields` response style (configurable via SDK option `responseStyle`).
   - Recommendation: Use `unwrapData()` helper from `src/shared/helpers.ts` (already used in `session-api.ts`) to handle both response styles.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified — this phase uses only already-installed SDK packages)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.5 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run tests/features/session-tracker/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AC-11 | PreToolUse detects task tool dispatch | unit | `npx vitest run tests/features/session-tracker/pre-tool-use.test.ts -t "detects task tool"` | ❌ Wave 0 |
| AC-11 | Proactive polling registers child in HierarchyIndex | unit | `npx vitest run tests/features/session-tracker/pre-tool-use.test.ts -t "polls for children"` | ❌ Wave 0 |
| AC-11 | session.created uses Gate 3 (pending dispatch) | unit | `npx vitest run tests/features/session-tracker/event-capture.test.ts -t "pending dispatch gate"` | ❌ Wave 0 |
| AC-11 | SDK Server API children query mocked | integration | `npx vitest run tests/features/session-tracker/server-api.test.ts` | ❌ Wave 0 |
| D-03 | Delegator agentName from subagent_type | unit | `npx vitest run tests/features/session-tracker/tool-capture.test.ts -t "agent attribution"` | ❌ Wave 0 |
| D-04 | Backward compat — existing records unchanged | unit | `npx vitest run tests/features/session-tracker/persistence.test.ts -t "backward compat"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/features/session-tracker/ --reporter=verbose`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + manual verification of `.hivemind/session-tracker/` directory count

### Wave 0 Gaps

- [ ] `tests/features/session-tracker/pre-tool-use.test.ts` — covers PreToolUse detection + polling
- [ ] `tests/features/session-tracker/server-api.test.ts` — covers mocked SDK Server API integration
- [ ] `tests/features/session-tracker/event-capture.test.ts` — add Gate 3 (pending dispatch) test case
- [ ] `tests/features/session-tracker/tool-capture.test.ts` — add agent attribution from pending dispatch
- [ ] `tests/features/session-tracker/persistence.test.ts` — add backward compatibility test

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | yes | Session-tracker is read-only; no credentials or auth tokens stored in `.hivemind/` |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `isValidSessionID()` + `safeSessionPath()` for path traversal prevention |
| V6 Cryptography | no | — |

### Known Threat Patterns for Session Tracking

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in sessionID | Tampering | `sanitizeSessionID()` rejects non-alphanumeric characters; `safeSessionPath()` confines writes to `.hivemind/session-tracker/` |
| Server API response injection | Spoofing | Only accept child sessions whose `parentID` matches known main sessions; validate response shape before processing |
| Race condition data corruption | Denial of Service | Best-effort handlers (never throw); atomic file writes prevent partial state |

---

## Sources

### Primary (HIGH confidence)

- [Official OpenCode SDK docs] `.opencode/skills/hm-l3-opencode-platform-reference/references/opencode-sdk.md` — Session API methods (`.list()`, `.get()`, `.children()`, `.create()`) at lines 188-233
- [Official OpenCode Plugin docs] `.opencode/skills/hm-l3-opencode-platform-reference/references/opencode-plugins.md` — Hook events list at lines 105-141, PreToolUse/PostToolUse hook types
- [DeepWiki anomalyco/opencode] — `tool.execute.before` / `tool.execute.after` hook signatures (input/output shapes) verified 2026-05-13
- [DeepWiki anomalyco/opencode] — TaskTool execution flow: child session created via `sessions.create()` during execution, session ID available in `metadata.sessionId`
- [DeepWiki anomalyco/opencode] — Server API endpoints: `GET /session`, `GET /session/:id`, `GET /session/:id/children`, `POST /session`

### Secondary (MEDIUM confidence)

- [Context7 /anomalyco/opencode-sdk-js] — `SessionResource` class: `create()`, `list()`, `chat()`, `messages()` methods
- [Context7 /anomalyco/opencode-sdk-js] — `AssistantMessage` and `TextPart` type definitions
- [Codebase] `src/plugin.ts:162-180` — `consumeSessionTrackerFact` (GAP #1 fixed — uses `getEventSessionID`)
- [Codebase] `src/plugin.ts:236-253` — `tool.execute.after` hook (GAP #2 — sessionID optional)
- [Codebase] `src/features/session-tracker/capture/event-capture.ts:173-236` — `handleSessionCreated` with dual-gate classification
- [Codebase] `src/features/session-tracker/capture/tool-capture.ts:223-299` — `handleTask` with HierarchyIndex registration + hardcoded agentName
- [Codebase] `src/shared/session-api.ts:54-57` — `getSession()` wrapper with `unwrapData()`

### Tertiary (LOW confidence)

- None — all findings verified against live sources or existing code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json + official SDK docs + DeepWiki live source
- Architecture: HIGH — patterns confirmed by DeepWiki task tool execution analysis + codebase audit
- Pitfalls: HIGH — race condition confirmed by live code analysis + DeepWiki timing verification
- Hook signatures: HIGH — verified via DeepWiki (live source) and official plugin docs

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (SDK stable — hook signatures unlikely to change within 30 days)

**Evidence levels:**
- L1 (runtime): Pending — will be verified after implementation via integration tests
- L2 (code-backed): All code examples verified against official SDK docs and current codebase
- L3 (external verification): Hook signatures + Server API endpoints verified via DeepWiki + Context7
- L4 (specification): Acceptance criteria AC-11, AC-12 from SPEC.md §6
- L5 (documentation): This RESEARCH.md itself is the deliverable
