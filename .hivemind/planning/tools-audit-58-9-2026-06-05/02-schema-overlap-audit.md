[LANGUAGE: Write this file in en per Language Governance.]
# Schema & Overlap Audit — Session/Coordination/Delegation Tools

**Date:** 2026-06-05
**Phase:** 58.9 (UAT)
**Scope:** Part A (status unification), Part B (stacking/resumable), Part C (progressive disclosure), Part D (edge cases)
**Auditor:** hm-codebase-mapper

---

## Part A: Schema Unification Audit

### A.1 Unified Status Value Table

Every status type/vocabulary used across the session-coordination-delegation codebase, sorted by source file.

| # | Source File | Type Name | Status Values | Used By |
|---|-------------|-----------|---------------|---------|
| 1 | `src/shared/types.ts:3` | `TaskStatus` | pending, queued, running, completed, failed, error, cancelled, interrupt | Continuity store (`SessionContinuityMetadata.status`) |
| 2 | `src/shared/types.ts:9` | `TaskNotification.status` | started, completed, failed, cancelled | Notification routing |
| 3 | `src/shared/types.ts:144-153` | `HarnessStatus` | pending, queued, dispatching, running, completed, error, cancelled, interrupt, failed | Canonical superset (see mapping comment L122-142) |
| 4 | `src/shared/types.ts:155` | `DelegationPacketStatus` | pending, running, completed, failed | Delegation packet records |
| 5 | `src/shared/types.ts:259-265` | `SessionLifecyclePhase` | created, queued, dispatching, running, completed, failed | Lifecycle state machine |
| 6 | `src/coordination/delegation/types.ts:1-8` | `DelegationStatus` | dispatched, running, completed, error, timeout, aborted, cancelled | Core delegation record |
| 7 | `src/coordination/delegation/types.ts:14-22` | `DelegationTerminalKind` | completed, error, timeout, cancelled, restarted, runtime-dispatch-unsupported, interrupted-by-signal, non-resumable-after-restart | Terminal classification |
| 8 | `src/coordination/delegation/pool-types.ts:36-43` | `DelegationLifecycleStatus` | queued, dispatched, running, completed, failed, aborted, paused | Pool snapshot (7-value superset) |
| 9 | `src/tools/delegation/delegation-status.ts:134` | `VALID_DELEGATION_STATUSES` | dispatched, running, completed, error, timeout, aborted, cancelled | Runtime validation guard |
| 10 | `src/shared/task-status.ts:3` | `VALID_TASK_STATUSES` | pending, queued, running, completed, failed, error, cancelled, interrupt | Transition validation |
| 11 | `src/features/tmux/persistence.ts:32` | `SessionState` | active, ready, paused, detached, failed | Pane/tmux state machine |
| 12 | `src/features/session-tracker/types.ts:51-58` | `DelegationLifecycleStatus` (dup) | queued, dispatched, running, completed, failed, aborted, paused | Session-tracker G6 events |
| 13 | `src/features/session-tracker/types.ts:145-166` | `SessionRecord.status` | "active" \| "idle" \| "completed" \| "error" *(string)* | Main session records |
| 14 | `src/features/session-tracker/types.ts:201-230` | `HierarchyManifestChild.status` | "active" \| "idle" \| "completed" \| "error" \| "aborted" \| "cancelled" *(string)* | Hierarchy manifest |
| 15 | `src/features/session-tracker/types.ts:310-357` | `ChildSessionRecord.status` | "active" \| "completed" \| "error" *(string)* | Child session JSON |
| 16 | `src/features/session-tracker/types.ts:431-448` | `ProjectSessionEntry.status` | "active" \| "completed" \| "error" *(string)* | Project-level index |

**Count:** 16 distinct status type declarations across 8 source files.

### A.2 Overlap & Conflicts Analysis

#### Same-meaning overlaps (intentional but risky)

| Status Value | Appears In | Semantically Equivalent In | Risk |
|-------------|-----------|---------------------------|------|
| `completed` | All 16 types | — | ✅ Consistent across every enum |
| `running` | Types 1,3,4,5,6,8,9,10 | — | ✅ Consistent |
| `failed` | Types 1,3,4,5,8,10,11,12 | — | ✅ Consistent |
| `cancelled` | Types 1,2,3,6,9,10,14 | — | ⚠️ present in `DelegationStatus` but **not** in `DelegationLifecycleStatus` (collapses to `aborted`) |

#### Lossy mappings (data loss risk)

| Source Type | Source Value | Mapped To | Target | File:Line |
|------------|-------------|-----------|--------|-----------|
| `DelegationStatus` | `timeout` | → `error` (HarnessStatus) | HarnessStatus | `shared/types.ts:185` |
| `DelegationStatus` | `aborted` | → `cancelled` (HarnessStatus) | HarnessStatus | `shared/types.ts:186` |
| `DelegationStatus` | `error` | → `failed` (DelegationLifecycleStatus) | Pool | `pool-types.ts:255` |
| `DelegationStatus` | `timeout` | → `failed` (DelegationLifecycleStatus) | Pool | `pool-types.ts:255` |
| `DelegationStatus` | `cancelled` | → `aborted` (DelegationLifecycleStatus) | Pool | `pool-types.ts:256` |
| `HarnessStatus` | `error` | → `failed` (SessionLifecyclePhase) | Lifecycle | `shared/types.ts:166` |
| `HarnessStatus` | `cancelled` | → `failed` (SessionLifecyclePhase) | Lifecycle | `shared/types.ts:167` |
| `HarnessStatus` | `interrupt` | *(no mapping)* | Lifecycle | `shared/types.ts:157-158` (excluded) |

**Finding F-A1:** The `error → failed` and `cancelled → failed` collapse is **lossy** — there is no way to determine from a `SessionLifecyclePhase` of `"failed"` whether the original cause was an application error, a timeout, an abort, or a cancellation.

#### Inconsistent session-tracker statuses (string types)

The session-tracker types (Items 13-16) use `status: string` instead of typed unions, leading to undocumented drift:

- `SessionRecord.status`: docs say "active | idle | completed | error" (L161)
- `HierarchyManifestChild.status`: docs say "active | idle | completed | error | aborted | cancelled" (L219)
- `ChildSessionRecord.status`: docs say "active | completed | error" (L324)
- `ProjectSessionEntry.status`: docs say "active | completed | error" (L443)

The disparity means a child session marked as `aborted` or `cancelled` in the hierarchy manifest may lose that information when stored at the record or project level. **Finding F-A2.**

#### SessionState (tmux) vs DelegationStatus — completely different vocabularies

`SessionState` (persistence.ts:32) uses `active | ready | paused | detached | failed`.
`DelegationStatus` (types.ts:1-8) uses `dispatched | running | completed | error | timeout | aborted | cancelled`.

These are entirely independent state machines attached to different entities (tmux pane vs. delegation record). The only overlap is `failed`. Both can coexist on the same delegation without contradiction. **Not a conflict — but the `failed` collision is a naming risk.** (Finding F-A3)

#### Contradictory simultaneous states

Can a session be:
- `active` (SessionState pane) AND `completed` (DelegationStatus)? → **Yes, intentionally.** The pane may be alive after the delegation completes. The `restoreAll()` function in persistence.ts:102 explicitly filters for `paused` and `detached` only — `active` and `failed` panes are ignored.
- `interrupt` (TaskStatus) AND `running` (DelegationStatus)? → **Yes**, `interrupt` preserves the previous session state (types.ts:136 comment). No contradiction.

**No actual contradictory simultaneous states found** — the different enums model different concerns.

### A.3 Tool Status Return Analysis

Which tools return which status values for the same field?

| Tool | Field | Status Source | Potential Misalignment |
|------|-------|-------------|----------------------|
| `delegation-status` | `status` | `DelegationStatus` (7 values) | Output shows `dispatched/running/completed/error/timeout/aborted/cancelled` |
| `session-tracker get-status` | `status` | `SessionRecord.status` / `ChildSessionRecord.status` (string) | May show `active/idle` or `completed/error` — **different vocab** from delegation-status |
| `session-hierarchy get-children` | `status` | `ChildHierarchyEntry.status` (string) | Same as session-tracker — string-based |
| `session-delegation-query list` | `status` | `HierarchyManifestChild.status` (string) | Same string-based |
| `hivemind-session-view get` | `session.status` | Session continuity data (string) | Could be `TaskStatus` (from `SessionContinuityMetadata`) or session-tracker status |

**Finding F-A4:** A main agent calling `hivemind-session-view` sees `session.status` which may come from `TaskStatus` (8 values) while `delegations[].status` comes from `DelegationStatus` (7 values) or `HierarchyManifestChild.status` (string). The same delegation displayed via different tools may show different strings.

---

## Part B: Stacking/Resumable Logic Audit

### B.1 Conditions for "Stackable"

Defined in `src/coordination/delegation/session-intelligence.ts:17-23`:

```
STACKABLE_STATUSES = {"completed", "error", "timeout", "aborted", "cancelled"}
```

Conditions (L100-104):
1. `d.status ∈ STACKABLE_STATUSES` — session must be terminal
2. `d.childSessionId` must be truthy (non-empty string)
3. Optional: `agentFilter` — agent name matches
4. Optional: `parentSessionFilter` — parent session ID matches

**Stackable = any terminal session with a valid child session ID.**

### B.2 Conditions for "Resumable"

Defined in `src/coordination/delegation/session-intelligence.ts:26-29`:

```
RESUMABLE_STATUSES = {"dispatched", "running"}
```

Conditions (L140-143):
1. `d.status ∈ RESUMABLE_STATUSES` — session must be active
2. `d.childSessionId` must be truthy
3. Optional: `parentSessionFilter`

**Resumable = any active session with a valid child session ID.**

### B.3 False-Negative Analysis

#### FN-B1: Agents.md claims "ALL sessions are stackable" — code is more restrictive

**Evidence:** `AGENTS.md` states (delegation-stacking section):
> "The SDK supports stacking via `task_id` / `stackOnSessionId` for **ANY** valid session ID — completed, failed, timed out, aborted, cancelled, **or even active sessions**."

But `findStackableSessions` only returns terminal-status sessions (completed/error/timeout/aborted/cancelled). Active sessions (dispatched/running) are returned only by `findResumableSessions`.

**Impact:** If an agent calls `delegation-status({ action: "find-stackable" })` while a delegation is still `running`, that session will NOT appear in `stackable`. It will only appear if the agent also checks `resumable` results.

**Recommendation:** Either:
- (a) Rename `findStackableSessions` → `findTerminalSessions` and add a combined `findAllStackable` that merges both sets, OR
- (b) Update `findStackableSessions` to accept both terminal and active statuses, as the documentation promises "ANY valid session ID."

#### FN-B2: Sessions without `childSessionId` are invisible

If a delegation record has `childSessionId: undefined` (e.g., a pending dispatch that hasn't yet created a child), neither `findStackableSessions` nor `findResumableSessions` will find it — both require `d.childSessionId` to be truthy (L102, L142).

**Impact:** Pre-dispatch delegations (status `dispatched` but no child yet) are invisible to stacking intelligence.

#### FN-B3: Filter over-matching (agentFilter case-sensitive)

The `agentFilter` check at L103: `d.agent !== agentFilter` is a case-sensitive string comparison. If the delegation was created with `agent: "hm-l2-researcher"` but the caller filters with `agent: "hm-L2-Researcher"`, the match fails.

**Severity:** Low — agent names are machine-generated and consistent.

#### FN-B4: Retry recommendation only for stackable, not for active

`getRetryRecommendation` (L173-191) only returns a recommendation if `STACKABLE_STATUSES.has(delegation.status)`. For running/dispatched delegations that are stuck (zero progress), no retry recommendation is offered — the agent would need to call `control action: abort` first.

### B.4 Resumable Sessions — Missing Resumption Readiness

`findResumableSessions` returns active sessions, but the `StackableSession` interface (L36-59) doesn't include:
- Session age (`createdAt` is included but that's the start time)
- Whether the session is actually responsive (stalled detection)
- Whether the session can accept more prompts

The `resume` action in `manager.ts:374-439` does handle this via `sendPromptAsync`, but the discoverability surface (the `StackableSession` type) doesn't expose readiness signals.

### B.5 Summary

| Aspect | Documentation Claim | Code Reality | Gap |
|--------|-------------------|-------------|-----|
| ALL sessions stackable | "ANY valid session ID" | Terminal statuses only | **FN-B1 (HIGH)** |
| Active sessions visible | Not explicitly mentioned | Only in resumable, not stackable | FN-B1 (HIGH) |
| Pre-dispatch stacking | Not mentioned | Not supported (no childSessionId) | FN-B2 (LOW) |
| Agent filter | Not mentioned | Case-sensitive exact match | FN-B3 (LOW) |
| Retry for active sessions | Not mentioned | Not supported | FN-B4 (MEDIUM) |

---

## Part C: Progressive Disclosure Gap Analysis

### C.1 Per-Tool Depth Support

| Tool | Actions | Depth Levels | Pagination | Filtering |
|------|---------|-------------|------------|-----------|
| `session-tracker` | export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions | **None** — all actions return full data (no summary/detailed/full levels) | `limit` parameter only | status, agentType, minDepth, maxDepth, timeRange |
| `session-hierarchy` | get-children, get-parent-chain, get-delegation-depth, get-manifest | **Partial** — get-children shows children list, get-manifest shows full hierarchy tree; no intermediate depth | None | `includeStatus` boolean only |
| `session-delegation-query` | list, get | **BEST** — `list` shows summaries, `get` shows full drill-down. This is proper progressive disclosure. | offset + limit (L152) | status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore |
| `delegation-status` | status, list, control, find-stackable, pool, peek, progress | **None** — `list` returns full delegation details inline (L661-677), no summarization level | None (returns all) | `status` filter string only |
| `hivemind-trajectory` | inspect, traverse, attach, checkpoint, event, close, create | **YES** — inspect supports `depth: "summary" | "detailed" | "full"` per Hivemind tool description | N/A | N/A |
| `hivemind-session-view` | get | **None** — single "get" action returns all 3 roots at once (session + delegations + trajectory). No depth levels. | Children limited to 20 (L81), trajectory entries limited to 50 (L114) | None |

### C.2 Gap Analysis

#### Gap C1: `session-tracker` lacks progressive disclosure levels

`sessions-tracker get-status` has the same verbosity as `get-summary` — both return similar data. There is no way to get:
- **Summary level (lightweight):** Just `{ status, childCount }` for quick dashboard
- **Detailed level:** Status + tool summary + child IDs
- **Full level:** Everything including turn data

Currently, the caller always gets full data even when they only need a status check.

#### Gap C2: `delegation-status list` returns too much data

The `renderList` function (delegation-status.ts:643-678) runs `renderDelegationV2` on every delegation returned, producing full field expansion for every record. For a main agent with 15+ child sessions, this generates enormous tool output.

**Recommendation:** Add a `summarize: boolean` parameter that returns only `{ delegationId, childSessionId, agent, status }` instead of full records.

#### Gap C3: `hivemind-session-view` has no depth control

The unified view tool always reads from all 3 data roots (session-tracker, delegations, trajectory) concurrently. There is no way to request just the session metadata without delegations, or just the delegation count without trajectory entries.

**Recommendation:** Add `includeDelegations: boolean` and `includeTrajectory: boolean` parameters, plus a `brief: boolean` parameter that returns only counts instead of full entries.

#### Gap C4: No tool provides "children summary" (counts by status)

There is no tool action that returns:
- Total children: 12
- By status: running=3, completed=7, error=1, cancelled=1
- By agent: hm-executor=5, hm-researcher=7

The closest is `session-delegation-query list` with filters, but it still requires multiple calls to aggregate by status.

### C.3 Summary Table

| Tool | Has Depth Levels | Has Pagination | Has Field Filtering | Dashboard Usability |
|------|:----------------:|:--------------:|:-------------------:|:-------------------:|
| session-tracker | ❌ | ⚠️ (limit only) | ✅ | Poor |
| session-hierarchy | ⚠️ (partial) | ❌ | ❌ | Medium |
| session-delegation-query | ✅ | ✅ | ✅ | Good |
| delegation-status | ❌ | ❌ | ⚠️ (status filter) | Poor |
| hivemind-trajectory | ✅ | N/A | N/A | Good |
| hivemind-session-view | ❌ | ⚠️ (limits) | ❌ | Medium |

---

## Part D: Edge Case Analysis

### D.1 Forked Sessions (Two Parents Sharing a Child)

**Detection capability:**

- `session-hierarchy.ts` — `findHierarchyEntry` (L61-75) is a recursive tree traversal that returns `{ entry, parentId }`. It assumes a single-parent tree; the first match wins. **Cannot detect forked sessions** — if a child appears under two parents, only the first found is returned.

- `session-hierarchy.ts computeDepth` (L192-206) — has cycle detection via `visited Set`, but the traversal is from a single root. Multiple parents pointing to the same child will cause `visited` to trigger early termination (treating it as a cycle), **silently reporting depth=0** for the second parent's path.

- `session-context.ts findHierarchyEntry` (L79-93) — same pattern as session-hierarchy: first-match, no fork detection.

- `HierarchyManifest` (types.ts:240-253) — stores children as a flat `Record<string, HierarchyManifestChild>` keyed by child session ID. Each child has exactly one `parentSessionID` field. **Forking would require two entries with the same key** — impossible by design. A forked child would be overwritten by the last writer.

- `delegation-status.ts mergeAllDelegations` (L400-453) — merges from manager, persisted, and session-tracker by delegation ID. Duplicate IDs overwrite based on `isManagerRecord` priority (L416-441). **Would silently drop one fork.**

**Finding D-F1:** The codebase **cannot detect or represent forked sessions**. If two main sessions independently dispatch children with the same session ID (unlikely but possible if using SDK batch dispatch), the last-written record silently overwrites the first. No warning is emitted.

**Potential impact:** A child session running work for parent A could be accidentally reaped or repurposed by parent B's cleanup logic, or vice versa. This is partially mitigated by UUIDv7 session IDs being effectively collision-resistant.

**Recommendation:** Add a `forkedAncestors: string[]` field to session-tracker event data, or at minimum a warning when `mergeAllDelegations` encounters an orphan with conflicting root lineage.

### D.2 Parallel Main Sessions — Session Identity Isolation

**List-sessions scope:**

- `session-tracker.ts handleListSessions` (L236-275): Reads `project-continuity.json` and returns ALL sessions from `chronologicalOrder` or directory scan. **There is no filtering by caller session identity.** Every caller sees all sessions.

- `hivemind-session-view.ts` (L119-155): The `buildUnifiedView` function accepts any sessionId parameter. **No access control** — any agent can query any session by ID.

- `session-delegation-query.ts handleList` (L99-161): If no `rootSessionId` is provided, calls `discoverRootSessions()` which lists ALL directories. **Same total visibility.**

**Finding D-F2:** There is NO session identity isolation for read-side tools. Main session A can see main session B's children, B's delegations, and B's trajectory. The only protection is at the delegation *control* layer — `canAccessDelegation` in `delegation-status.ts` (L256-275) checks the root session lineage, but this only restricts `control` and `get-by-delegationId` actions. The list actions return everything.

**Recommendation:** Add an optional `callerSessionId` filter to all list/find actions, and when the caller is in a main session, scope the result set to that session's delegation tree by default.

### D.3 Boundary Enforcement — Cross-Main-Session Child Access

**Can main session A see/control main session B's children?**

| Tool | Enforcement | Vulnerability |
|------|------------|--------------|
| `delegation-status status (by delegationId)` | ✅ `canAccessDelegation` checks root session lineage (L256-275) | Guarded |
| `delegation-status list` | ⚠️ `canAccessDelegation` is checked per record (L648-651), but caller must NOT pass another session's delegationId | Some protection |
| `delegation-status control` | ✅ `canAccessDelegation` + lineage check (L696) | Guarded |
| `delegation-status find-stackable` | ⚠️ Same `canAccessDelegation` filter (L763-767) | Guarded |
| `session-tracker list-sessions` | ❌ **No filter** — returns ALL sessions | Open |
| `session-tracker get-status` | ❌ Accepts any sessionId — no lineage check | Open |
| `session-tracker get-summary` | ❌ Same — any sessionId | Open |
| `session-hierarchy get-children` | ❌ Any sessionId | Open |
| `session-delegation-query list` | ❌ Lists all when no rootSessionId | Open |
| `hivemind-session-view get` | ❌ No access control | Open |
| `session-context find-related` | ❌ No access control | Open |

**Finding D-F3:** The delegation-status tool has proper boundary enforcement via `canAccessDelegation`, but ALL session-tracker, session-hierarchy, session-delegation-query, session-context, and hivemind-session-view tools have ZERO access control. A main session can freely read, query, and list any other main session's children and trajectory.

**Risk level:** LOW for read-only (cannot mutate), but MEDIUM for information disclosure (a main agent could extract context from sibling main sessions' child data via `session-tracker search-sessions` or `session-context cross-reference`).

### D.4 Cycle Detection & Infinite Loop Prevention

- `delegation-status.ts getHierarchyContext` (L348-349): Uses `visited Set` for cycle detection during descendant counting — **good**.
- `session-hierarchy.ts computeDepth` (L192-194): Uses `visited Set` with `COMPUTE_DEPTH_MAX = 100` — **good**.
- `session-context.ts`: No cycle detection in `findHierarchyEntry` — **gap** (recursive descent without bounds).
- `session-delegation-query.ts handleList`: No cycle detection or MAX_TOTAL_RESULTS guard (L98) — but it's a flat manifest read, not recursive, so low risk.

### D.5 Race Conditions & Concurrent Access

- `delegation-status.ts mergeAllDelegations` (L400-453): Reads from 3 sources (manager in-memory, persisted JSON, session-tracker files). No locking. If a delegation transitions between reads, the merged result could have inconsistent fields (e.g., manager shows `running` but priority merge could pick the older persisted state for one field).
- `hivemind-session-view.ts` (L120-124): Reads all 3 roots with `Promise.all` — slightly more consistent (concurrent reads) but still no transactional snapshot.
- `session-hierarchy.ts readContinuity`: Reads file, no lock — stale reads possible.

---

## Appendices

### Appendix A: Mapping Chain Lossiness

```
DelegationStatus (7 values)
  ├── dispatched ──→ pending (HarnessStatus) ──→ created (Lifecycle)
  ├── running   ──→ running ──→ running
  ├── completed ──→ completed ──→ completed
  ├── error     ──→ error ──→ failed          ← LOSS: error vs timeout vs abort?
  ├── timeout   ──→ error ──→ failed          ← LOSS: indistinguishable from error
  ├── aborted   ──→ cancelled ──→ failed      ← LOSS: indistinguishable from cancel
  └── cancelled ──→ cancelled ──→ failed      ← LOSS
```

### Appendix B: All Status Values (Deduplicated Set)

20 unique status literal strings across the entire codebase:
`active`, `aborted`, `cancelled`, `completed`, `created`, `detached`, `dispatched`, `dispatching`, `error`, `failed`, `idle`, `interrupt`, `pending`, `paused`, `queued`, `ready`, `running`, `started`, `timeout`

(Deduplicated from the 16 type declarations × 97 total status literal slots.)

---

### Key Findings Summary

| ID | Severity | Finding |
|----|----------|---------|
| F-A1 | MEDIUM | `error → failed` collapse loses cause information in lifecycle pipeline |
| F-A2 | LOW | session-tracker status fields are `string` types that drift across record levels |
| F-A3 | LOW | `failed` appears in both `SessionState` and `DelegationStatus` with different semantics |
| F-A4 | MEDIUM | Different tools return status from different enums for the same `status` field |
| FN-B1 | **HIGH** | Documentation claims "ANY session ID" is stackable but code restricts to terminal states |
| FN-B2 | LOW | Pre-dispatch delegations without `childSessionId` are invisible to stacking |
| FN-B4 | MEDIUM | No retry recommendation for stuck (non-terminal) delegations |
| C1 | MEDIUM | `session-tracker` and `delegation-status list` lack progressive disclosure → large responses |
| C3 | LOW | `hivemind-session-view` lacks include/brief parameters → always returns all 3 roots |
| D-F1 | LOW | Forked sessions (2 parents, 1 child) cannot be detected — last write wins silently |
| D-F2 | **HIGH** | Session identity isolation is absent — any session can read any other session's data |
| D-F3 | MEDIUM | 7 of 10 audit tools have no access control for cross-main-session queries |
