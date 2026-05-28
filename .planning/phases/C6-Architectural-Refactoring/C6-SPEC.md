# Phase C6: Architectural Refactoring — SPEC

**Created:** 2026-05-28
**Phase:** C6
**Status:** DRAFT
**Ambiguity Score:** 0.117 (target ≤0.20) — PASS

## Summary

Phase C6 addresses three architectural fragility concerns (CONCERNS.md §6.1–6.3) through pure internal refactoring. No external packages are introduced. No API surfaces change. No behavioral changes occur — the phase restructures existing code to improve testability, reduce merge conflict risk, and enforce type safety at persistence boundaries.

**Three requirements:**
1. Extract event handlers from `EventCapture` god module into dedicated handler classes
2. Introduce `DelegationStatusReader` interface with Zod-validated format readers
3. Group `plugin.ts` tool registrations by domain into separate functions

## User Constraints

> From CONCERNS.md §6 and RESEARCH.md. These are locked decisions.

- No external packages — pure internal refactoring only
- No API surface changes — all 23 tools must behave identically before and after
- No behavioral changes — refactoring only, not feature work
- TDD: write tests for all extracted handler classes and reader implementations
- Node.js >= 20, ES2022 target
- Max module size: 500 LOC per extracted file
- Atomic commits: one extraction per commit
- Type-check before commit: `npm run typecheck` must pass
- `[Harness]` prefix on all thrown errors
- No circular dependencies: handler classes must not import from `src/plugin.ts`

## Phase Requirements

| ID | Description | Falsification Criteria | Ambiguity |
|----|-------------|----------------------|-----------|
| REQ-C6-01 | Extract `handleSessionCreated`, `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError`, `handleSessionCompacted`, `handleSessionNextTextEnded` from `EventCapture` into dedicated handler classes | `event-capture.ts` LOC ≤200; each handler file ≤500 LOC; all 6 event types still routed correctly | 0.10 |
| REQ-C6-02 | Create `DelegationStatusReader` interface with `SessionTrackerStatusReader` and `LegacyPersistenceStatusReader` implementations; add Zod schemas for both formats | `delegation-status.ts` has zero `as any` casts for persistence format reading; Zod schemas pass roundtrip test (write → read → assert equality) | 0.10 |
| REQ-C6-03 | Group `plugin.ts` tool registrations by domain into `registerDelegationTools()`, `registerSessionTools()`, `registerHivemindTools()`, `registerConfigTools()` functions; split mega `deps` into domain sub-objects | `plugin.ts` tool registration block ≤150 LOC; each `registerXxxTools()` function ≤100 LOC; all 23 tools still registered | 0.15 |

**Overall Ambiguity:** 0.117 — PASS (≤0.20)

---

## REQ-C6-01: Session Tracker God Module Decomposition

### Current State

`event-capture.ts` is 1050 LOC with 6 event handler methods, 3 shared helper methods, and 1 journey recording method. The `EventCapture` class holds 10 injected dependencies and 1 shared `Map<string, number>` (`assistantTurnCounters`).

**Handler method sizes (approximate LOC):**
- `handleSessionCreated`: ~120 LOC (lines 184–302)
- `handleSessionIdle`: ~120 LOC (lines 316–437)
- `handleSessionDeleted`: ~80 LOC (lines 443–520)
- `handleSessionError`: ~70 LOC (lines 526–592)
- `handleSessionCompacted`: ~50 LOC (lines 817–864)
- `handleSessionNextTextEnded`: ~30 LOC (lines 779–809)

**Shared state requiring injection:**
- `assistantTurnCounters: Map<string, number>` — shared across `handleSessionIdle` and `handleSessionNextTextEnded`
- `resolveChildLifecycleRoute()` — private method called by all handlers except `handleSessionCreated`
- `writeImmediateChildFile()` — private method called by `handleSessionCreated`
- `findCompactionText()`, `resolveCompactionFromMessages()`, `collectChildSummaries()`, `extractSummaryFromChildRecord()` — private helpers for `handleSessionCompacted`

### Target Architecture

```
src/features/session-tracker/capture/
├── event-capture.ts              # Thin router ≤200 LOC
├── handlers/
│   ├── types.ts                  # Shared handler types and interfaces
│   ├── session-created-handler.ts
│   ├── session-idle-handler.ts
│   ├── session-deleted-handler.ts
│   ├── session-error-handler.ts
│   ├── session-compacted-handler.ts
│   └── session-next-text-ended-handler.ts
├── child-backfiller.ts           # Unchanged
├── last-message-capture.ts       # Unchanged
├── message-capture.ts            # Unchanged
└── tool-capture.ts               # Unchanged
```

### Falsifiable Acceptance Criteria

| Criterion | How to Verify | Pass/Fail |
|-----------|---------------|-----------|
| `event-capture.ts` ≤200 LOC | `wc -l src/features/session-tracker/capture/event-capture.ts` | __ |
| Each handler file ≤500 LOC | `wc -l src/features/session-tracker/capture/handlers/*.ts` | __ |
| All 6 event types still routed | `grep -c "session\.\|session\.next\." src/features/session-tracker/capture/event-capture.ts` shows ≥6 case branches | __ |
| `assistantTurnCounters` shared correctly | Unit test: call `handleSessionIdle` twice on same sessionID → turn counter increments | __ |
| `resolveChildLifecycleRoute` accessible to handlers | Each handler that needs it receives it via constructor injection | __ |
| Type-check passes | `npm run typecheck` exits 0 | __ |
| All existing tests pass | `npx vitest run` exits 0 | __ |

### Shared State Strategy

**`assistantTurnCounters`:** Pass as constructor parameter to `SessionIdleHandler` and `SessionNextTextEndedHandler`. Both handlers receive the same `Map<string, number>` reference via the `EventCapture` constructor, which passes it to both handler constructors.

**`resolveChildLifecycleRoute`:** Extract into `handlers/types.ts` as a standalone function or keep as a method on `EventCapture` and inject `EventCapture` (or a `ChildRouteResolver` interface) into handlers. Recommendation: extract as a standalone `resolveChildLifecycleRoute(deps, sessionID)` function in `handlers/types.ts` since it only reads from injected deps.

**`writeImmediateChildFile`:** Keep on `EventCapture` since only `handleSessionCreated` calls it. Pass `EventCapture` self-reference or extract as standalone function. Recommendation: extract as standalone function in `handlers/types.ts`.

**Compaction helpers:** Move `findCompactionText`, `resolveCompactionFromMessages`, `collectChildSummaries`, `extractSummaryFromChildRecord` into `session-compacted-handler.ts` as private methods — they are only used by that handler.

### Test Plan

| Test File | Covers | Test Cases |
|-----------|--------|------------|
| `tests/lib/session-tracker/handlers/session-created-handler.test.ts` | REQ-C6-01 | Gate 0 (pending dispatch), SDK parentID, hierarchy index, pending registry, root session creation |
| `tests/lib/session-tracker/handlers/session-idle-handler.test.ts` | REQ-C6-01 | Child status update, main session completion, lastMessage capture, turn counter increment |
| `tests/lib/session-tracker/handlers/session-deleted-handler.test.ts` | REQ-C6-01 | Child deletion, main session deletion, backfill |
| `tests/lib/session-tracker/handlers/session-error-handler.test.ts` | REQ-C6-01 | Child error status, main session error status |
| `tests/lib/session-tracker/handlers/session-compacted-handler.test.ts` | REQ-C6-01 | Event payload summary, message history fallback, child compaction |
| `tests/lib/session-tracker/event-capture.test.ts` | REQ-C6-01 | Router dispatches to correct handler for each event type |

---

## REQ-C6-02: Dual Persistence Format Abstraction

### Current State

`delegation-status.ts` reads delegation data from three sources:
1. In-memory `DelegationManager` (primary)
2. `hierarchy-manifest.json` via `readManifest()` (new format, lines 171–187)
3. `delegations.json` via `readPersistedDelegations()` (legacy format)

**`as any` casts (11 instances at lines 201, 291, 304, 317):**
```typescript
const childMeta = child as HierarchyManifestChild  // lines 201, 291, 304, 317
```

**Format shapes:**

`hierarchy-manifest.json` children entries:
```typescript
{
  parentSessionID: string,
  status: string,
  subagentType: string,
  delegationDepth: number,
  createdAt: string,
  updatedAt: string,
  childFile: string,
  // ... additional fields
}
```

`delegations.json` entries:
```typescript
{
  id: string,
  parentSessionId?: string,
  childSessionId?: string,
  agent?: string,
  status: string,
  createdAt?: number,  // epoch ms
  completedAt?: number,
  // ... additional fields
}
```

### Target Architecture

```
src/tools/delegation/
├── delegation-status.ts          # Tool entrypoint (unchanged API)
├── readers/
│   ├── types.ts                  # DelegationStatusReader interface + Zod schemas
│   ├── session-tracker-reader.ts # Reads hierarchy-manifest.json
│   └── legacy-reader.ts          # Reads delegations.json
```

### Interface Definition

```typescript
// src/tools/delegation/readers/types.ts
export interface DelegationStatusReader {
  /** Read all child delegations for a parent session. */
  readChildren(parentSessionId: string, projectRoot: string): Promise<Delegation[]>
  /** Read a single delegation by ID. */
  readDelegation(delegationId: string, projectRoot: string): Promise<Delegation | null>
}
```

### Falsifiable Acceptance Criteria

| Criterion | How to Verify | Pass/Fail |
|-----------|---------------|-----------|
| Zero `as any` casts for persistence format | `grep -n "as any" src/tools/delegation/delegation-status.ts` returns 0 matches for format reading | __ |
| Zod schemas validate both formats | Unit tests: parse valid JSON → success; parse invalid JSON → ZodError | __ |
| Roundtrip test passes | Write manifest → read through Zod → assert field equality | __ |
| `DelegationStatusReader` interface exists | TypeScript compiles with interface definition | __ |
| Both reader implementations pass interface contract | `implements DelegationStatusReader` on both classes | __ |
| Tool behavior unchanged | All existing delegation-status tests pass | __ |
| Type-check passes | `npm run typecheck` exits 0 | __ |

### Zod Schema Definitions

```typescript
// Hierarchy manifest child (new format)
export const HierarchyManifestChildSchema = z.object({
  parentSessionID: z.string(),
  status: z.string(),
  subagentType: z.string().optional(),
  delegationDepth: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  childFile: z.string().optional(),
  rootMainSessionID: z.string().optional(),
  delegatedBy: z.string().optional(),
  turnCount: z.number().optional(),
})

// Legacy delegation record (old format)
export const LegacyDelegationRecordSchema = z.object({
  id: z.string(),
  parentSessionId: z.string().optional(),
  childSessionId: z.string().optional(),
  agent: z.string().optional(),
  status: z.string(),
  createdAt: z.number().optional(),
  completedAt: z.number().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  executionMode: z.string().optional(),
  surface: z.string().optional(),
  recoveryGuarantee: z.string().optional(),
  workingDirectory: z.string().optional(),
  nestingDepth: z.number().optional(),
  terminalKind: z.string().optional(),
  messageCount: z.number().optional(),
  toolCallCount: z.number().optional(),
  actionCount: z.number().optional(),
  finalMessageExcerpt: z.string().optional(),
})
```

### Test Plan

| Test File | Covers | Test Cases |
|-----------|--------|------------|
| `tests/lib/delegation/readers/session-tracker-reader.test.ts` | REQ-C6-02 | Valid manifest → Delegation[]; invalid manifest → ZodError; empty children → empty array |
| `tests/lib/delegation/readers/legacy-reader.test.ts` | REQ-C6-02 | Valid delegations.json → Delegation[]; invalid JSON → error; empty file → empty array |
| `tests/lib/delegation/readers/delegation-status-reader.test.ts` | REQ-C6-02 | Interface contract: both readers implement same methods; roundtrip test |

---

## REQ-C6-03: Plugin.ts Composition Root Cleanup

### Current State

`plugin.ts` is 554 LOC with:
- 60+ import statements (lines 8–78)
- A single `deps` object at line 377 with 12+ properties
- A flat `tool:` registration block at lines 456–486 with 23 tool registrations
- Initialization order constraints documented in comments (lines 326–327)

**Tool registration by domain (current flat block):**

| Domain | Tools | Count |
|--------|-------|-------|
| Delegation | `delegate-task`, `delegation-status`, `run-background-command` | 3 |
| Session | `execute-slash-command`, `session-patch`, `session-journal-export`, `session-tracker`, `session-hierarchy`, `session-context` | 6 |
| Hivemind | `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export` | 8 |
| Config | `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover` | 4 |
| Prompt | `prompt-skim`, `prompt-analyze` | 2 |
| Governance | `create-governance-session` | 1 |

### Target Architecture

```typescript
// src/plugin.ts — extracted domain registration functions

function registerDelegationTools(deps: { delegationManager, hivemindConfig, getChildMessageCount, terminateChild, getEscalationLevel, projectRoot, ptyManager }): Record<string, Tool> {
  return {
    "delegate-task": createDelegateTaskTool(deps.delegationManager, deps.hivemindConfig),
    "delegation-status": createDelegationStatusTool(deps.delegationManager, { ... }),
    "run-background-command": createRunBackgroundCommandTool({ delegationManager: deps.delegationManager, ptyManager: deps.ptyManager }),
  }
}

function registerSessionTools(deps: { client, sessionTracker, projectRoot }): Record<string, Tool> {
  return {
    "execute-slash-command": createExecuteSlashCommandTool(deps.client, deps.sessionTracker),
    "session-patch": createSessionPatchTool(deps.projectRoot),
    "session-journal-export": createSessionJournalExportTool(),
    "session-tracker": createSessionTrackerTool(deps.projectRoot),
    "session-hierarchy": createSessionHierarchyTool(deps.projectRoot),
    "session-context": createSessionContextTool(deps.projectRoot),
  }
}

function registerHivemindTools(deps: { projectRoot }): Record<string, Tool> {
  return {
    "hivemind-doc": createHivemindDocTool(deps.projectRoot),
    "hivemind-trajectory": createHivemindTrajectoryTool(deps.projectRoot),
    // ... etc
  }
}

function registerConfigTools(): Record<string, Tool> {
  return {
    "configure-primitive": createConfigurePrimitiveTool(),
    "validate-restart": createValidateRestartTool(),
    "bootstrap-init": createBootstrapInitTool(),
    "bootstrap-recover": createBootstrapRecoverTool(),
  }
}
```

### Initialization Order Constraints

**MUST NOT move these side-effecting calls into domain functions:**
- `delegationManager.recoverPending()` (line 301) — must run after delegation module setup
- `sessionTracker.initialize()` (line 332) — must run after session tracker construction
- `delegationManager.setCompletionDetector(...)` (line 328) — must run after lifecycle manager creation
- `lifecycleManager.hydrateFromContinuity()` (line 312) — must run after lifecycle manager creation
- `replayPendingDelegationNotifications(client)` (line 318) — must run after hydrateFromContinuity

**These stay in the main composition root.** Only pure tool registration moves to domain functions.

### Falsifiable Acceptance Criteria

| Criterion | How to Verify | Pass/Fail |
|-----------|---------------|-----------|
| Tool registration block ≤150 LOC | Count lines in `tool: { ... }` block | __ |
| Each `registerXxxTools()` ≤100 LOC | `wc -l` on each function body | __ |
| All 23 tools still registered | `grep -c '"[^"]*":' src/plugin.ts` in tool block ≥23 | __ |
| Initialization order preserved | `delegationManager.recoverPending()` still called after module setup | __ |
| `deps` split into domain sub-objects | No single `deps` object with >8 properties | __ |
| Type-check passes | `npm run typecheck` exits 0 | __ |
| All existing tests pass | `npx vitest run` exits 0 | __ |

### Test Plan

| Test File | Covers | Test Cases |
|-----------|--------|------------|
| `tests/lib/plugin-tools.test.ts` | REQ-C6-03 | All 23 tools registered; domain functions return correct tool maps; deps sub-objects typed correctly |

---

## Implementation Sequence

**Wave 0 (prerequisites):** Create test files with failing tests (TDD red phase)

**Wave 1 (REQ-C6-01):** Extract handlers
1. Create `handlers/types.ts` with shared interfaces and extracted helper functions
2. Create each handler class (one at a time, commit per handler)
3. Refactor `EventCapture` to thin router
4. Run full test suite

**Wave 2 (REQ-C6-02):** Introduce DelegationStatusReader
1. Create `readers/types.ts` with interface and Zod schemas
2. Create `SessionTrackerStatusReader`
3. Create `LegacyPersistenceStatusReader`
4. Refactor `delegation-status.ts` to use readers
5. Run full test suite

**Wave 3 (REQ-C6-03):** Domain-group plugin.ts
1. Create domain registration functions
2. Split `deps` into domain sub-objects
3. Refactor `plugin.ts` to use domain functions
4. Run full test suite

**Wave 4:** Verification
1. `npm run typecheck` — must exit 0
2. `npm test` — full suite green
3. Manual: verify all 23 tools appear in OpenCode tool catalog

---

## Dependencies

- **Upstream:** None (standalone refactoring phase)
- **Downstream:** None (no new APIs introduced)
- **Blocked by:** None
- **Blocks:** None

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Handler extraction breaks shared state | LOW | HIGH | `assistantTurnCounters` passed as constructor param; unit test validates counter increment |
| Zod schema drifts from actual format | MEDIUM | MEDIUM | Roundtrip test: write → read → assert equality |
| plugin.ts init order breaks | LOW | HIGH | Side-effecting calls stay in composition root; only pure registration moves |
| Child writer retry queue coupling | LOW | MEDIUM | Verify `ChildWriter` is injected (not created per-handler) |
| Merge conflicts during extraction | LOW | LOW | One handler per atomic commit; sequential extraction |

## Open Questions

1. **Should `Prompt` tools (2 tools) get their own `registerPromptTools()` or stay in `registerConfigTools()`?**
   - Recommendation: Keep in `registerConfigTools()` — only 2 tools, not worth a separate function.
   - Resolution: Include in `registerConfigTools()`.

2. **Should `create-governance-session` (1 tool) get its own function?**
   - Recommendation: Keep in `registerSessionTools()` — it's session-adjacent.
   - Resolution: Include in `registerSessionTools()`.

3. **Should `resolveChildLifecycleRoute` be a standalone function or injected interface?**
   - Recommendation: Standalone function in `handlers/types.ts` — simpler, no interface needed since it only reads from deps.
   - Resolution: Standalone function.

## Metadata

**Confidence breakdown:**
- REQ-C6-01: HIGH — exact handler methods and LOC counts verified from source
- REQ-C6-02: HIGH — exact `as any` cast locations and format shapes verified from source
- REQ-C6-03: HIGH — exact tool registration block and deps structure verified from source

**Spec date:** 2026-05-28
**Valid until:** 2026-06-28 (stable — internal refactoring, no external dependencies)
