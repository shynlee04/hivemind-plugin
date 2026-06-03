# Phase 58: PATTERNS — Frozen patterns for the 6-gap tmux orchestration hardening

**Generated:** 2026-06-03
**Phase:** 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
**Mode:** `--auto` (agent-recommended patterns; SPEC + CONTEXT locked)
**Predecessor patterns:** P51–P55 BATS precedent, P54 `__stateRoot` test seam, P53 pane-monitor event subscription, P25.1 trajectory event log

This document records **8 frozen patterns** that the P58 implementer MUST follow when building the 6 gaps. Each pattern is documented with:
- **Source-of-truth citations** (file:line) where the pattern already exists
- **P58 application** (which gap/plan consumes it)
- **Anti-pattern warning** (what the implementer must NOT do)

The patterns are listed in dependency order — earlier patterns are referenced by later ones.

---

## Pattern 1 — Policy comment block above a tool factory function (G1)

**Source-of-truth:** Existing `[Harness]`-prefixed policy comments in `src/features/tmux/integration.ts:1-25` and `src/features/tmux/persistence.ts:1-19`. The P50/P51 `D-04` silent-fallback contract is documented as a header comment block.

**P58 application (G1, REQ-58-01):** A 3-sentence `POLICY (P58, G1)` block at the top of `src/tools/delegation/delegate-task.ts` (above the `createDelegateTaskTool` export at line 23) explaining the 3 concrete failure modes if a contributor reaches for the native `task` tool from `@opencode-ai/plugin`:
1. Bypasses the Hivemind delegation lifecycle (no `DelegationManager.dispatch` invocation)
2. Skips session-tracker events (no `recordChildTaskDelegation` call)
3. Skips tmux pane projection (no `SessionManager.onSessionCreated` event)

The grep guard in BATS slot 61 enforces the policy at test-time; the comment is for human readers.

**Pattern template:**
```typescript
// POLICY (P58, G1): This tool MUST route via coordinator.dispatch only.
//   Do NOT import the native `task` tool from "@opencode-ai/plugin" —
//   bypassing coordinator.dispatch skips the Hivemind delegation
//   lifecycle, session-tracker events, and tmux pane projection.
```

**Anti-pattern:** Do NOT use `eslint-disable`, `// @ts-expect-error`, or a runtime throw. The guard is grep-based, not runtime-based, and the comment is a human-readable justification. Do NOT add the policy comment inside the function body — it MUST precede the `createDelegateTaskTool` export so a future contributor sees it before reading the implementation.

---

## Pattern 2 — `__`-prefixed test seam on a public class (G2)

**Source-of-truth:** `__stateRoot` on `SessionPersistence` at `src/features/tmux/persistence.ts:90` (P54 precedent), `__waitForPendingRetries` on `pane-monitor.ts:206-208` (P53 precedent), `__testEventLog` on session-tracker trajectory (P25.1 precedent). All three follow the `__`-prefix + explicit JSDoc "TEST-ONLY" convention.

**P58 application (G2, REQ-58-02, D-58-03):** A new method `__getDelegationsForTesting(): ReadonlyMap<string, Delegation>` on the `DelegationManager` class (placed near the existing `delegations` getter at `manager.ts:380`). Returns the same `Map` instance held by `this.runtime?.delegations` but as a `ReadonlyMap` to prevent test-side mutation. JSDoc MUST include "**TEST-ONLY:** do not call from production code; for BATS test fixtures only." pattern, matching `__stateRoot` exactly.

**Pattern template:**
```typescript
/**
 * Read-only test seam exposing the in-memory delegation map.
 * **TEST-ONLY:** do not call from production code; for BATS test
 * fixtures only. Returns a ReadonlyMap view — consumers MUST NOT
 * cast away the readonly modifier to mutate state.
 */
get __getDelegationsForTesting(): ReadonlyMap<string, Delegation> {
  return this.runtime?.delegations ?? new Map()
}
```

**Anti-pattern:** Do NOT use a private `#` field (test seam must be public, JSDoc'd). Do NOT return a plain `Map<>` (the `ReadonlyMap<>` type prevents accidental test-side mutation). Do NOT name the seam `__delegations` (no underscore-suffix pattern exists; the prefix is the signal). Do NOT place the seam in a separate test-helper module (the inline pattern matches `__stateRoot`).

---

## Pattern 3 — Frozen JSON contract via deep `Object.freeze` (G2)

**Source-of-truth:** P53/P54 D-04 silent-fallback contract paired with `JSON.stringify` round-trip preservation. The P53 `pane-monitor.ts:206-208` log envelope uses `Object.freeze` for the captured payload to prevent downstream mutation. The P25.1 trajectory event log enforces immutability via `Object.freeze` at insertion time.

**P58 application (G2, REQ-58-02, D-58-04):** `DelegationManager.getPoolSnapshot()` returns a top-level `DelegationPool` and each `DelegationPoolEntry` is deep-frozen. `Object.freeze` is called recursively: top-level first, then each entry. Primitive strings (`promptPreview`, `id`, `agent`) are auto-frozen as primitive values. No `Date` objects in the snapshot — only numeric epochs (`capturedAt`) and primitive strings.

**Pattern template:**
```typescript
function freezeEntry(entry: DelegationPoolEntry): DelegationPoolEntry {
  return Object.freeze({
    id: entry.id,
    agent: entry.agent,
    status: entry.status,
    depth: entry.depth,
    parentId: entry.parentId,
    startedAt: entry.startedAt,
    promptPreview: entry.promptPreview,  // primitive string, auto-frozen
  }) as DelegationPoolEntry
}

function freezeSnapshot(snapshot: DelegationPool): DelegationPool {
  const frozenEntries = snapshot.delegations.map(freezeEntry)
  return Object.freeze({
    schemaVersion: 1,
    capturedAt: snapshot.capturedAt,
    delegations: Object.freeze(frozenEntries) as readonly DelegationPoolEntry[],
  }) as DelegationPool
}
```

**Anti-pattern:** Do NOT use a runtime `throw` for mutation attempts (the contract is type-system + Object.freeze enforcement, not runtime guards). Do NOT include `Date` objects (they break `JSON.stringify` round-trip — use numeric epoch). Do NOT freeze the underlying `delegations` Map (test fixtures MUST be able to insert via `__getDelegationsForTesting` without thaw).

---

## Pattern 4 — `state: "paused"` lifecycle transition via persistence call site (G3)

**Source-of-truth:** P54 `state: "paused"` literal already in `SessionState` union at `src/features/tmux/persistence.ts:32` (`"active" | "ready" | "paused" | "detached" | "failed"`). P54 `onSessionCreated` calls `void this.persistence?.persist(this.toPersistedSession(tracked))` at `session-manager.ts:209` (active→ready) and `handleSessionClose` at line 310 (*→failed). The P54 `restoreAll` at `persistence.ts:102` filters to only `paused` and `detached` states as alive.

**P58 application (G3, REQ-58-03, D-58-06/07/08):** Three call sites in `src/coordination/delegation/manager.ts`:
1. `abortDelegation` (line 153) — after `terminalFallback` decision: `if (record.tmuxSessionId) await sessionManager.persist({ ...record, state: "paused" })` (NOT `failed`).
2. `resume` (around line 180, inside `controlDelegation` action handler) — BEFORE `coordinator.sendPromptAsync`: `const respawned = await sessionManager.respawnIfKnown(record.tmuxSessionId); if (respawned?.paneId && respawned.paneId !== record.paneId) { record.paneId = respawned.paneId; await sessionManager.persist(record); } await coordinator.sendPromptAsync(record);`
3. `handleResume` (after `sendPromptAsync` resolves) — `await sessionManager.persist({ ...record, state: "ready" })`.

The state machine path is: `ready → paused → ready` (abort→resume success). The `paused` literal is reused — no schema change.

**Pattern template:**
```typescript
// G3 abort: ready → paused
abortDelegation(delegationId: string): DelegationResult {
  // ... existing terminalFallback dispatch ...
  const record = this.getStatus(delegationId)
  if (record?.tmuxSessionId && this.options.sessionManager?.persist) {
    void this.options.sessionManager.persist({ ...record, state: "paused" } as PersistedSession)
  }
  return this.terminalFallback(delegationId, "[Harness] Delegation aborted")
}

// G3 resume: paused → ready
// (respawnIfKnown BEFORE sendPromptAsync, persist(ready) AFTER)
```

**Anti-pattern:** Do NOT add a new `SessionState` literal (P54 already has `paused`). Do NOT use `state: "failed"` on abort (the pane is still alive; `failed` would exclude it from `restoreAll`). Do NOT skip the `respawnIfKnown` step (the paneId may have changed during the paused interval).

---

## Pattern 5 — Sentinel-prepended orchestrator prompt via `SessionManagerAdapter.sendKeys` (G4)

**Source-of-truth:** P55 `TmuxMultiplexer.sendKeys` delivery at `src/features/tmux/tmux-multiplexer.ts` (proven via BATS slot 58). P49 widening of `tmux-copilot.ts:80-107` Zod discriminated union — existing 4 actions demonstrate the additive discriminated-union pattern. P55 D-55-08 `sleep 0.2` (200ms flush wait) proven necessary for tmux→process key delivery.

**P58 application (G4, REQ-58-04, D-58-09/10):** A new 5th action `forward-prompt` on `TmuxCopilotActionSchema` (added to the `z.discriminatedUnion("action", [...])` array at `tmux-copilot.ts:102-107`). The handler prepends `[orchestrator-forward ${new Date().toISOString()}]\n` to the user-supplied `text` then calls `adapter.sendKeys(input.paneId, payload, input.literal ?? true)`. The `literal: true` default is critical — it uses `tmux send-keys -l` to suppress tmux's own special-key interpretation (e.g., Enter, Tab).

**Pattern template:**
```typescript
const ForwardPromptActionSchema = z.object({
  action: z.literal("forward-prompt"),
  paneId: z.string().min(1),
  text: z.string(),
  literal: z.boolean().optional(),
})

// In TmuxCopilotActionSchema union:
const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
  SendKeysActionSchema,
  ListPanesActionSchema,
  ComputeGridActionSchema,
  RespawnActionSchema,
  ForwardPromptActionSchema,  // P58 G4
])

// In switch dispatch:
case "forward-prompt": {
  const sentinel = `[orchestrator-forward ${new Date().toISOString()}]\n`
  const payload = sentinel + input.text
  const byteLength = Buffer.byteLength(payload, "utf8")
  try {
    await adapter.sendKeys(input.paneId, payload, input.literal ?? true)
    return renderToolResult({
      paneId: input.paneId,
      deliveredAt: new Date().toISOString(),
      byteLength,
    })
  } catch (err) {
    return renderToolResult({ sent: false, paneId: input.paneId, error: { message: err instanceof Error ? err.message : String(err) } })
  }
}
```

**Anti-pattern:** Do NOT use `appendTuiPrompt` (writes to TUI input, not tmux pane). Do NOT use `Buffer.byteLength` of the bare `text` (must include sentinel). Do NOT escape the sentinel line — the `literal: true` default suppresses tmux's special-key interpretation; the receiving process decides what to do with the bytes.

---

## Pattern 6 — Per-session `manualOverride` flag in session-tracker in-memory map (G5)

**Source-of-truth:** `SessionRecord` interface at `src/features/session-tracker/types.ts:59-80` has fields `sessionID`, `created`, `updated`, `parentSessionID`, `delegationDepth`, `children`, `continuityIndex`, `status`, `title?`, `lastMessage?`. The map `Map<sessionId, SessionRecord>` is referenced in CONTEXT.md:116 but does NOT yet exist as an in-memory cache — current code uses `bootstrap.getSessionSafely(id)` returning `unknown`. P58 G5 introduces the in-memory `Map<sessionId, { manualOverride: boolean }>` keyed by `sessionId` for the override flag.

**P58 application (G5, REQ-58-05, D-58-11/12):** Two new tmux-copilot actions (`take-over`, `release`) plus an in-memory map `private readonly overrideMap = new Map<string, { manualOverride: boolean; takenAt?: number; takenBy?: string }>()` in `src/features/session-tracker/index.ts` (or a new sub-module). The flag is checked at 3 wiring points:
1. `tmux-copilot forward-prompt` handler — if `overrideMap.get(sessionId)?.manualOverride === true`, return `{ suppressed: true, reason: "manualOverride", paneId, textPreview, evaluatedAt }` (D-58-12 shape).
2. `src/plugin.ts:920` `appendTuiPrompt` wrapper — if `overrideMap.get(sessionId)?.manualOverride === true`, return early (no SDK call).
3. Future orchestrator auto-prompting call sites — same check (extensibility point).

**Pattern template:**
```typescript
// In tmux-copilot.ts (forward-prompt case, before sendKeys):
const sessionId = context.sessionID
const overrideState = getManualOverrideState(sessionId)
if (overrideState?.manualOverride === true) {
  return renderToolResult({
    suppressed: true,
    reason: "manualOverride",
    paneId: input.paneId,
    textPreview: input.text.slice(0, 80),
    evaluatedAt: new Date().toISOString(),
  })
}

// New actions:
const TakeOverActionSchema = z.object({
  action: z.literal("take-over"),
  sessionId: z.string().min(1),
  paneId: z.string().min(1),
})
const ReleaseActionSchema = z.object({
  action: z.literal("release"),
  sessionId: z.string().min(1),
})

case "take-over": {
  setManualOverrideState(input.sessionId, {
    manualOverride: true,
    takenAt: Date.now(),
    takenBy: "human-operator",  // D-58-11 literal
  })
  return renderToolResult({
    sessionId: input.sessionId,
    paneId: input.paneId,
    takenBy: "human-operator",
    takenAt: new Date().toISOString(),
  })
}
case "release": {
  setManualOverrideState(input.sessionId, { manualOverride: false })
  return renderToolResult({
    sessionId: input.sessionId,
    releasedAt: new Date().toISOString(),
  })
}
```

**Anti-pattern:** Do NOT nest the flag under `policy: { manualOverride }` (per SPEC D-58-11, top-level field is locked). Do NOT widen `takenBy` to `string` (single-actor model per SPEC OOS line 178). Do NOT use a shared global flag (per-session isolation is required — multiple sessions may have different override states concurrently).

---

## Pattern 7 — SessionTrackerEvent union created from scratch (G6)

**Source-of-truth:** P25.1 trajectory `__testEventLog` array uses a typed `JourneyEntry` shape at `src/features/session-tracker/types.ts:265-274` (not a discriminated union — a single shape with `type: "tool_call" | "tool_result" | "assistant_message" | ...` discriminator field). Q1 finding (RESEARCH.md:122) confirms `delegation-queued` / `delegation-dispatched` / `delegation-terminal` event types do NOT exist in current source — zero matches anywhere.

**P58 application (G6, REQ-58-06, D-58-13/14):** Create a NEW `SessionTrackerEvent` discriminated union in `src/features/session-tracker/types.ts` (placed after the existing `SessionRecord` interface, before `HierarchyManifest`). The union has 3 members: `delegation-queued`, `delegation-dispatched`, `delegation-terminal`. Each carries `{ delegationId, agent, status, depth, parentId, tmuxSessionId: string | null, emittedAt: number }`. The `emittedAt` field is `Date.now()` numeric (D-58-13 — sort-friendly, monotonic, no string parsing).

A new in-memory event log `__testEventLog: SessionTrackerEvent[] = []` (matching P25.1 precedent) provides the test seam for BATS slot 66 monotonicity assertions.

**Pattern template:**
```typescript
// In src/features/session-tracker/types.ts (NEW)
export type DelegationLifecycleStatus =
  | "queued"
  | "dispatched"
  | "running"
  | "completed"
  | "failed"
  | "aborted"
  | "paused"

export interface DelegationEventBase {
  delegationId: string
  agent: string
  status: DelegationLifecycleStatus
  depth: number
  parentId: string | null
  tmuxSessionId: string | null
  emittedAt: number  // Date.now() ms epoch, monotonic
}

export type SessionTrackerEvent =
  | (DelegationEventBase & { type: "delegation-queued" })
  | (DelegationEventBase & { type: "delegation-dispatched" })
  | (DelegationEventBase & { type: "delegation-terminal" })
```

**Anti-pattern:** Do NOT extend an existing union (Q1 finding — no `SessionTrackerEvent` exists). Do NOT use string ISO timestamps (D-58-13 — numeric epoch is the locked convention). Do NOT add the union to `events.ts:15-31` SSE filter (Q2 finding — the filter is 6 CATEGORIES, not event types; the 3 new events flow through the existing `"delegation"` filter category without filter array changes).

---

## Pattern 8 — BATS scenario with 3 sequential assertions in a single `@test` block (G1 + G6)

**Source-of-truth:** P55 BATS slot 60 (`60-visual-dependency-graph.bats`) uses a single `@test` block with multiple sequential `run` + assertion steps. P53 BATS slot 55 (`55-pane-monitor-journal-capture.bats`) uses the same pattern. The pattern keeps CI runtime bounded — 6 scenarios × 1 `@test` = 6 BATS executions, not 18.

**P58 application:** BATS slots 61, 62, 63, 64, 65, 66 follow the P53/P55 precedent — single `@test` block per scenario with 3-8 sequential `run --` + `[[ "$output" == *...* ]]` assertions. Slot 61 (G1 grep guard) is the smallest — 3 grep assertions in one block. Slot 66 (G6 event lifecycle) has 6 assertions but they are tightly coupled (event log state) and belong in one block.

**Pattern template (BATS slot 61 — G1):**
```bash
@test "delegate-task does not invoke native task tool (G1)" {
  # Assertion 1: no native task import
  run grep -rE "from ['\"]@opencode-ai/plugin(/task)?['\"]" src/tools/delegation/ | grep -E "\btask\b"
  [ "$status" -eq 1 ]  # grep returns no matches

  # Assertion 2: no createTaskTool factory
  run grep -rE "createTaskTool" src/tools/delegation/
  [ "$status" -eq 1 ]  # grep returns no matches

  # Assertion 3: policy comment present
  run bash -c "grep -c 'POLICY (P58, G1)' src/tools/delegation/delegate-task.ts"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]
}
```

**Anti-pattern:** Do NOT split into 3 separate `@test` blocks (multiplies CI runtime without adding signal). Do NOT use `assert_success` macro without prior `run --` (the macro does not capture `$output` for subsequent assertions). Do NOT use `wc -l` to count grep matches (parses whitespace oddly — use `grep -c` for direct count). Do NOT omit `set -e` equivalent (BATS default does not exit on first failure — every assertion must be explicit).

---

## Pattern cross-references

| Pattern | Gap | REQ | Source files |
|---------|-----|-----|--------------|
| 1 — Policy comment block | G1 | REQ-58-01 | `src/tools/delegation/delegate-task.ts:23` |
| 2 — `__`-prefixed test seam | G2 | REQ-58-02 | `src/coordination/delegation/manager.ts:380` |
| 3 — Frozen JSON contract | G2 | REQ-58-02 | `src/coordination/delegation/manager.ts` (new method) |
| 4 — `state: "paused"` lifecycle | G3 | REQ-58-03 | `src/coordination/delegation/manager.ts:153`, `src/features/tmux/session-manager.ts:209` |
| 5 — Sentinel-prepended forward-prompt | G4 | REQ-58-04 | `src/tools/tmux-copilot.ts:102` |
| 6 — Per-session manualOverride flag | G5 | REQ-58-05 | `src/features/session-tracker/index.ts`, `src/tools/tmux-copilot.ts`, `src/plugin.ts:920` |
| 7 — SessionTrackerEvent union from scratch | G6 | REQ-58-06 | `src/features/session-tracker/types.ts` (new union) |
| 8 — BATS single-@test multi-assertion | All | All 6 | `tests/scripts/tmux/61..66-*.bats` |

---

*Phase: 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl*
*Patterns documented: 2026-06-03*
*Next step: `/gsd-plan-phase 58` — produce 58-PLAN-01..06.md against this patterns file + locked SPEC + CONTEXT.*
