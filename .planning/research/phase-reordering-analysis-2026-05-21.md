# Phase Reordering Analysis — Owner's 3-Group Framework

**Date:** 2026-05-21
**Status:** Analysis document for human review
**Author:** gsd-domain-researcher (subagent)
**Evidence Level:** L5 (governance analysis based on source-backed phase artifacts, production session file, and tool-classification matrix)

---

## 1. Executive Summary

The current hard-restructuring phase ordering (Phases 21-33) violates the project owner's explicit priority framework in **4 structural ways**. The most damaging violation: **cleanup/refactor work is scheduled BEFORE design-fix work** — the exact opposite of the stated "Design Fix FIRST, Clean/Refactor LAST" principle.

### The 4 Violations

| # | Violation | Current Ordering | Owner's Framework | Impact |
|---|-----------|-----------------|-------------------|--------|
| 1 | **Cleanup before design fix** | Phases 21 (plugin decomposition), 22 (shared/config), 28 (tools standardization) before Group 1 coordination fixes | Group 4 cleanup LAST | Wasted effort: clean code that gets redesigned |
| 2 | **Group 1 surfaces scattered across 5 phases** | Session-tracker tools in Phases 28, 30, 31; trajectory in Phase 24; pressure in Phase 30; agent-work-contracts in Phase 30 | Group 1 design fix FIRST | No cohesive fix pass for the most critical surfaces |
| 3 | **Delegate-task ecosystem NOT in restructuring** | CP-DT-01 is runtime-blocked, not part of Phases 21-33 | Group 1 highest priority | System's core delegation path remains broken |
| 4 | **Hook design fix premature** | Phase 23 (hooks CQRS) happens before routing coordination design is settled | Group 2 (second priority) | May re-fix hooks after coordination design changes |

---

## 2. Current Phase Ordering Critique

### Current Order (from ROADMAP.md Phases 21-33)

```
Phase 21:  Composition Root Decomposition  →  CLEANUP (Group 4)
Phase 22:  Shared/Config Foundation Fix    →  CLEANUP (Group 4)
Phase 23:  Hooks CQRS Enforcement          →  PARTIAL DESIGN FIX (Group 2)
Phase 24:  Task Management Design Fix      →  DESIGN FIX (Group 1 trajectory + Group 4 cleanup)
Phase 25:  Routing Cluster Design Fix      →  DESIGN FIX (Group 2)
Phase 26:  Coordination Status Unification →  DESIGN FIX (Group 1)
Phase 27:  Coordination Dispatch Unification→  DESIGN FIX (Group 1)
Phase 28:  Tools Surface Standardization   →  CLEANUP (Group 4)
Phase 29:  Schema Kernel Cleanup           →  CLEANUP (Group 3)
Phase 30:  Features Design Fix Part 1      →  PARTIAL DESIGN FIX (Group 1 pressure + Group 4)
Phase 31:  Feature Module Splits Part 2    →  CLEANUP (Group 4)
Phase 32:  Formal Deferrals + Legacy       →  CLEANUP (Group 4)
Phase 33:  Integration Verification        →  VERIFICATION (all groups)
```

### Category Distribution

| Owner's Group | Phases Assigned | Count | Status |
|---------------|----------------|-------|--------|
| **Group 1** (Design Fix FIRST) | 24 (partial), 26, 27, 30 (partial) | 3.5 | ⚠️ Too few, too late |
| **Group 2** (Second) | 23 (partial), 25 | 1.5 | ⚠️ Interleaved with cleanup |
| **Group 3** (Third) | 29 | 1 | ✅ Correct priority slot, wrong absolute position |
| **Group 4** (Last — Cleanup) | 21, 22, 24 (partial), 28, 30 (partial), 31, 32 | 5.5 | ❌ Scheduled FIRST, 5.5 phases before Group 1 complete |

### Why Cleanup-First Is Wrong

**The hard-restructuring-synthesis document itself states:**
> "Fix design FIRST, then clean/refactor. Never reverse."

But the current ordering does exactly the reverse:

1. **Phase 21 (plugin.ts decomposition):** Extracting tool registry, startup tasks, and hook composition from plugin.ts is CLEANUP. Plugin.ts works fine for Group 1 tool additions. Decomposing it first means un-doing that work if coordination design changes require different tool wiring.

2. **Phase 22 (shared leaf/config fix):** session-api.ts leaf violation, config singleton, and compiler split are purely structural cleanup. They don't affect whether the session-tracker or delegate-task works correctly. They can be done LAST without blocking any design fix.

3. **Phase 28 (tools standardization):** Relocating 3 session tools from `hivemind/` to `session/` and standardizing import paths. If session-tool design changes (Group 1), you relocate files that then need re-editing. Waste.

**Evidence from production session file (`session-ses_1baf.md`, 16,053 LOC):** The session-tracker still has real design flaws that affect production usage — hierarchy manifest correctness for long-haul sessions, writer sequencing during delegation dispatch, continuity context for session resume. A real agent session hit these issues. Cleaning up module structure won't fix them — only a design-fix pass will.

---

## 3. Dependency Tree — Which Clusters Block Which

### Hard Blockers

```
Group 1 (Session-Tracker + Delegate-Task)
  │
  ├── blocks → Group 2 (Routing + Hooks + Auto-Looping)
  │              │
  │              └── blocks → Group 3 (Schema + Config Primitives)
  │                              │
  │                              └── blocks → Group 4 (Cleanup)
  │
  ├── does NOT block → Group 4 cleanup
  │   (cleanup is independent of design correctness)
  │
  └── does NOT block → Group 3 schema kernel
      (Zod schemas are leaf dependencies; design can proceed regardless)
```

### Soft Blockers (design stability, not compilation)

| Dependency | Why | Impact if violated |
|-----------|-----|-------------------|
| **Group 1 → Group 2** | Routing (intent classification) routes to sessions. If session-tracker design is wrong, routing decisions are based on wrong data. | Wrong routing → agent confusion |
| **Group 1 → Group 4** | Plugin.ts decomposition changes tool registration pattern. If Coordination tools change in Group 1, the decomposed plugin.ts (Phase 21) must be re-edited. | Double work |
| **Group 2 → Group 3** | Shipped primitives (agents, skills, commands) use routing. If routing design changes after primitives are built, primitives must be updated. | Primitive drift |
| **Group 2 → Group 4** | Hook CQRS enforcement may need rework after coordination dispatch is settled (Group 1 fixes may change what hooks observe). | Re-fix work |

### Key Insight: Cleanup (Group 4) blocks NOTHING

This is the critical dependency insight. **Every Group 4 phase can be postponed to the end without blocking any design fix.** Conversely, doing cleanup first risks wasted effort when design changes invalidate the cleaned-up code.

---

## 4. Reordered Phase Map

### Principle

**Fix design FIRST, clean/refactor LAST.** Within design fixes, follow the owner's priority: Group 1 → Group 2 → Group 3 → Group 4.

### Proposed Reordering

```
GROUP 1 — Design Fix FIRST (Session-Tracker, Delegate-Task, Coordination Core)
  Phase 21: Session-Tracker Tool Design Fix
  Phase 22: Coordination Status + Error Design Fix
  Phase 23: Coordination Dispatch + Decomposition Fix
  Phase 24: Trajectory + Agent-Work-Contract Design Fix
  Phase 25: Pressure + Notification Delivery Design Fix

GROUP 2 — Second (Routing, Hooks, Auto-Looping)
  Phase 26: Routing (Intent Classification + Command Engine)
  Phase 27: Hook Injection Plane Design Fix
  Phase 28: Auto-Looping + Ralph-Loop Design Fix

GROUP 3 — Third (Schema & Configuration)
  Phase 29: Schema Kernel Cleanup + Test Gaps
  Phase 30: Config Plane Fixes

GROUP 4 — Last (Technical Debt Cleanup)
  Phase 31: Plugin.ts Decomposition
  Phase 32: Shared/Config Leaf Fixes + Tools Surface Standardization
  Phase 33: Session-Tracker Module Splits + Async I/O + Typed Errors
  Phase 34: Formal Deferrals + Legacy Inventory
  Phase 35: Integration Verification
```

### Detailed Phase Definitions

#### GROUP 1: Phase 21-25 — Design Fix FIRST

##### Phase 21: Session-Tracker Tool Design Fix
**Owner priority:** Group 1 — "Design-fix first"
**Scope:**
- Fix `hivemind-session-view` zero test coverage (127 LOC, the only untested tool)
- Fix `session-tracker.ts` filter-sessions edge cases for long-haul sessions (issues visible in `session-ses_1baf.md` production output)
- Fix `session-hierarchy.ts` hierarchy traversal correctness — `${getDepth}`, `get-manifest` consistency for sessions with >50 children or deeply nested trees
- Fix `session-context.ts` aggregation — verify aggregate-by-status and aggregate-by-subagentType produce correct counts for concurrent sessions
- Fix session-tracker writers: apply `redactTextSecrets()` to session-tracker writer paths (security gap from flaw register — redaction exists but unused in highest-risk paths)
- Fix `hivemind-power-on` skill to reflect actual tool capabilities after design fixes
**Rationale:** Session-tracker tools are the MOST USED surface by agents. A real 16,053-LOC production session file shows they work but have edge cases. Fix design before agents hit production limits.
**Depends on:** Nothing (tools exist, just need design fixes)
**Blocks:** Nothing (tools are standalone consumers)

##### Phase 22: Coordination Status + Error Design Fix
**Owner priority:** Group 1
**Scope:**
- Unify `TaskStatus` ↔ `DelegationStatus` — single status type system (tool-classification matrix: REWORK score 12/20)
- Create unified `DelegationError` type — apply to all 3 dispatch paths (SDK/PTY/headless) from current Phase 27 scope
- Fix `notification-handler.ts` — add TTL (5 min), 1 retry, delivery tracking (tool-classification: 12/20 REWORK)
- Add guardrails to `execute-slash-command` — `requireCommand()` pre-validation, pressure gate check, proper Zod schema, `renderToolResult()` envelope (tool-classification: 12/20 REWORK)
**Rationale:** Status confusion (UC-1), divergent errors (UC-2), and missing guardrails (UC-3) are the top 3 utility-impacting conflicts per the tool-classification matrix. Fixing these first eliminates the most common agent-facing bugs.
**Depends on:** Phase 21 (uses session-tracker types for status mapping)
**Blocks:** Phase 23 (dispatch unification needs single status + error contract first)

##### Phase 23: Coordination Dispatch + Decomposition Fix
**Owner priority:** Group 1 — "Delegate-task ecosystem"
**Scope:**
- Fix CP-DT-01 runtime block: resolve the `context.task` seam issue (OpenCode plugin ToolContext v1.15.4 has no `context.task` field)
- Decompose `DelegationManager` god-object (~580 LOC): extract dispatch strategy → `coordinator/dispatch-strategy.ts`, extract notification → `coordinator/notifications.ts`, extract persistence → `coordinator/delegation-persistence.ts`
- Consolidate dual in-memory stores: `coordinator.ts` delegates state validation to `state-machine.ts` instead of maintaining separate store
- Add drift detection between dual stores (periodic consistency check as safety net until stores consolidated)
- Fix `coordinatorRef` forward reference in plugin.ts — pass coordinator directly
- Merge `notification-formatter.ts` into `notification-router.ts`
**Rationale:** Delegate-task is the project's core runtime path. The CP-DT-01 runtime block is the single highest-impact design fix. The DelegationManager god-object (score 13/20 REWORK on utility matrix) is the largest coupling hotspot.
**Depends on:** Phase 22 (unified status + error contract needed before decomposition)
**Blocks:** Phase 24 (trajectory needs stable delegation dispatch to be correct)

##### Phase 24: Trajectory + Agent-Work-Contract Design Fix
**Owner priority:** Group 1 — "trajectory, pressure, agent-work-contract — mess of flaws, nonsensical designs"
**Scope:**
- Fix `trajectory/` design: ensure `ledger.ts`, `store-operations.ts`, and `trajectory.schema.ts` have correct state transition design BEFORE adding tests
- Add dedicated tests for trajectory (currently zero despite file I/O operations — FLAW from cluster map)
- Fix `agent-work-contracts/store.ts` sync fs → `fs/promises` (design + async conversion together for this module — small enough to do atomically)
- Fix `agent-work-contracts` state design: verify contract lifecycle matches Hivemind delegation model (create → dispatch → complete/timeout/fail)
- Fix `deriveSurface()` / `deriveRecoveryGuarantee()` duplication between delegation-persistence and state-machine.ts (drift risk — UC-5)
**Rationale:** The owner explicitly calls trajectory and agent-work-contract design "nonsensical." These are the most architecturally broken surfaces. Fix their core state models before writing tests or converting to async.
**Depends on:** Phase 23 (trajectory consumes delegation state)
**Blocks:** Nothing directly (standalone surfaces)

##### Phase 25: Pressure + Notification Delivery Design Fix
**Owner priority:** Group 1
**Scope:**
- Fix `runtime-pressure/` scoring logic: zero tests currently (625 LOC, 5 files). Design the scoring algorithm correctly first.
- Fix authority-matrix overlap with skill file — ensure single source of truth for tool authority
- Fix notification delivery: add TTL (5 min), 1 retry, delivery tracking flag (notifications can replay stale after process restart — F11/F12 from flaw register)
- Fix `sdk-delegation/handler.ts` grace period timer race with state-machine timer (CO-4 conflict from tool-classification matrix)
**Rationale:** Pressure scoring affects delegation decisions (pressure gates on delegate-task and execute-slash-command). Current zero test coverage means these decisions are untested. Fix design before adding tests.
**Depends on:** Phase 23 (pressure gates consume delegation state)
**Blocks:** Phase 26 (routing uses pressure for dispatch decisions)

#### GROUP 2: Phase 26-28 — Design Fix SECOND

##### Phase 26: Routing Design Fix
**Owner priority:** Group 2
**Scope:**
- Fix `intention-classifier` design: replace fragile substring matching with structured intent classification (from current Phase 25)
- Remove dead registry validator code from `intake-gate.ts` (PURPOSE_TO_ROUTING_TARGET dispatch never consumed)
- Fix dead no-op profile methods (`invalidateBehavioralProfile()`, `clearAllBehavioralProfiles()`)
- Add tests for session-entry, behavioral-profile, command-engine (currently zero for ~1,200 LOC)
**Rationale:** Routing depends on session-tracker (Group 1) for session context. Do routing AFTER session-tracker is correctly designed. Dead code removal is appropriate here because it affects routing logic clarity.
**Depends on:** Phases 21-25 (uses session-tracker data, pressure scores for routing decisions)
**Blocks:** Phase 27 (hooks observe routing events)

##### Phase 27: Hook Injection Plane Design Fix
**Owner priority:** Group 2 — "mis-designed (silent vs required, body vs TUI, queued, routing injection)"
**Scope:**
- Fix CQRS violation in `tool-after-workflow.ts` — move durable writes from hooks sector to coordination (from current Phase 23)
- Make `assertHookWriteBoundary` actually enforce at runtime — throw on durable-write attempt from hooks (or remove if impractical)
- Remove duplicate `system.transform` registration — keep only `experimental.chat.system.transform`
- Type hook signatures: replace `(input: unknown, output: unknown)` with correct SDK shapes
- Fix silent vs required: audit all hooks and classify each as silent (no agent notification) or required (agent receives feedback)
- Inline 2 thin observer shells (`session-entry-consumer.ts`, `session-main-consumer.ts`)
**Rationale:** Hooks depend on routing (Group 2) and coordination (Group 1) for correct event semantics. Doing hooks after both are settled prevents re-fix cycles.
**Depends on:** Phase 26 (routing event types needed for hook typing)
**Blocks:** Phase 28 (auto-looping consumes hook events)

##### Phase 28: Auto-Looping + Ralph-Loop Design Fix
**Owner priority:** Group 2 — "totally nonsensical"
**Scope:**
- Fix `auto-loop/` design: verify auto-looping correctly uses session-tracker for loop detection, not event-tracker (event-tracker is deprecated)
- Fix `ralph-loop/` design: verify ralph-loop termination conditions, session resumption, and context window management
- Wire auto-loop/ralph-loop into the routing pipeline (currently disconnected)
- Add tests for loop termination conditions (critical for preventing infinite loops)
**Rationale:** Auto-looping and ralph-loop are agents-level coordination patterns. They depend on correct session-tracker data (Group 1), routing (Group 2), and hooks (Group 2). Fixing them last in Group 2 ensures all dependencies are stable.
**Depends on:** Phase 27 (hooks provide loop input events)
**Blocks:** Nothing (leaf features)

#### GROUP 3: Phase 29-30 — Schema & Configuration

##### Phase 29: Schema Kernel Cleanup + Test Gaps
**Owner priority:** Group 3
**Scope:**
- Verify skill-metadata.schema.ts consumers (preserved in Phase 19 — re-check if still consumed)
- Delete dead schemas (permission.schema.ts, tool-definition.schema.ts — confirmed dead)
- Add tests for 9 currently untested schemas (bootstrap, agent-work-contract, trajectory, session-tracker, session-view, runtime-pressure, sdk-supervisor, command-engine, doc-intelligence)
**Rationale:** Schema kernel is a leaf dependency (Zod-only). It can be cleaned up at any time. Group 3 is the correct priority slot.
**Depends on:** Nothing (leaf module)
**Blocks:** Nothing

##### Phase 30: Config Plane Fixes
**Owner priority:** Group 3
**Scope:**
- Fix config subscriber singleton — replace module-level singleton with instance-scoped cache (from current Phase 22)
- Fix `decompileAgent` bug — `compiler.ts:191` returns `"unknown"` instead of frontmatter name
- Fix `validateWithFallback` fragile locale check — use `issue.code` instead of `message.includes`
- Split `compiler.ts` (410 LOC) → compile.ts, decompile.ts, batch.ts submodules
**Rationale:** Config is configuration of primitives. Primitives (Group 3) depend on config for compilation/decompilation. Doing config after schema kernel makes sense.
**Depends on:** Phase 29 (schemas used by config compiler)
**Blocks:** Phase 31 (plugin.ts needs stable config for tool wiring)

#### GROUP 4: Phase 31-35 — Cleanup/Refactor LAST

##### Phase 31: Plugin.ts Decomposition
**Owner priority:** Group 4 (cleanup)
**Scope:**
- Extract tool registration map → `src/tools/registry.ts`
- Extract startup tasks → `src/plugin/startup.ts` (migration, recovery, bootstrap wiring)
- Extract hook composition → `src/hooks/composition/composer.ts`
- Remove `system.transform` and `messages.transform` from plugin.ts return block
- Fix 5 tools using wide import path → narrow `@opencode-ai/plugin/tool`
- Target: plugin.ts < 200 LOC
**Rationale:** Plugin decomposition changes tool registration patterns. Doing this last ensures all design fixes are stable and tool surfaces won't change after decomposition.
**Depends on:** Phases 21-30 (all design fixes settled)
**Blocks:** Phase 32 (shared/config cleanup depends on tool registry shape)

##### Phase 32: Shared/Config Leaf Fixes + Tools Surface Standardization
**Owner priority:** Group 4
**Scope:**
- Move `session-api.ts` routing import to fix leaf violation
- Split `types.ts` (381 LOC) by concern
- Relocate 3 session tools from `hivemind/` to `session/` (if not already done)
- Standardize 5 tool import paths → narrow
- Move inline Zod schemas from `configure-primitive.ts` to `schema-kernel/`
- Split `renderDelegationV2()` — extract TUI formatting vs structured metadata
**Rationale:** Leaf constraint fixes and tool relocations are purely structural. They must be done last to avoid re-relocating files when tool design changes.
**Depends on:** Phase 31 (tools registry shape settled)
**Blocks:** Phase 33 (session-tracker splits)

##### Phase 33: Session-Tracker Module Splits + Async I/O + Typed Errors
**Owner priority:** Group 4
**Scope:**
- Split `event-capture.ts` (702 LOC → 2-3 files by lifecycle event family)
- Split `session-tracker/index.ts` (561 LOC → extract initialization)
- Simplify `PendingDispatchRegistry` (312 LOC → simple Map pair + periodic purge)
- Convert continuity/index.ts sync I/O (44 readFileSync, 32 writeFileSync, 19 renameSync → fs/promises)
- Create `src/shared/errors.ts` with 5 typed error classes
- Replace ~80 remaining `throw new Error("[Harness]...")` sites
**Rationale:** Module splits and async I/O conversion are purely structural. No design changes — just execution improvement. Group 4 is the correct slot.
**Depends on:** Phase 32 (tools/session module structure settled)
**Blocks:** Phase 34

##### Phase 34: Formal Deferrals + Legacy Inventory
**Owner priority:** Group 4
**Scope:**
- Journal decision: wire `appendJournalEntry()` into lifecycle handler or formally defer
- Sidecar decision: integrate or defer until Q2 sidecar confirmation
- Create legacy/deprecated reference inventory
- Add `@deprecated — remove after <gate>` JSDoc annotations
- Archive stale CP phase directories
**Rationale:** Decisions about deferring unwired subsystems are safest AFTER all active design fixes are complete. You can only accurately judge what to defer when you know what's working.
**Depends on:** Phase 33
**Blocks:** Phase 35

##### Phase 35: Integration Verification
**Owner priority:** All groups — verification
**Scope:** Full regression, tool surface smoke test, dist rebuild, manifest sync
**Depends on:** Phases 21-34

---

## 5. Rationale for Each Reordering Decision

### Decision 1: Session-tracker FIRST (Phase 21 before current Phase 21)

**Current:** Plugin.ts decomposition (Phase 21) → Shared/config fix (Phase 22) → Hooks CQRS (Phase 23) → Task management (Phase 24) → Routing (Phase 25) → Coordination (Phase 26-27)

**Proposed:** Session-tracker tools design fix (Phase 21) leads

**Why:** The production session file (`session-ses_1baf.md`, 16,053 LOC) contains real evidence of session-tracker issues in active agent use. Every agent that uses `hivemind-power-on` or delegation tools hits these surfaces first. Fixing session-tracker design first means:
1. Agents immediately get better tool output
2. All downstream phases (routing, hooks, auto-looping) consume correct session data
3. No wasted cleanup work on modules that may change

**Risk if WRONG:** Plugin decomposition now (Phase 21) means decomposing a composition root that will need re-editing when coordination tools (Phase 26-27) change their registration patterns. Wasted effort.

### Decision 2: Coordinate status/error FIX before dispatch FIX

**Current:** Coordination status unification (Phase 26) → Coordination dispatch (Phase 27) — same cluster, correct ordering

**Proposed:** Same relative ordering, just moved earlier (Phase 22 → Phase 23)

**Why:** You cannot fix dual-dispatch paths (Phase 27) without agreeing on a single status type and error contract first (Phase 22/26). The tool-classification matrix confirms: UC-1 (dual status), UC-2 (divergent errors), UC-3 (missing guardrails) are the top 3 conflicts. Fixing the error contract before the dispatch logic prevents rework.

### Decision 3: All Group 1 work contiguous (Phases 21-25)

**Current:** Group 1 work spread across Phases 24, 26, 27, 30, 31 — interleaved with cleanup

**Proposed:** 5 contiguous phases for ALL Group 1 design fixes

**Why:** Cognitive continuity. The developer working on Coordination status unification (Phase 22) should immediately proceed to dispatch decomposition (Phase 23) without context-switching to cleanup work. The current ordering forces 3 context switches (Phase 21 cleanup → Phase 22 cleanup → Phase 23 hooks → Phase 24 task mgmt → Phase 25 routing → Phase 26 coordination).

### Decision 4: Delegate-task runtime block resolved in restructuring

**Current:** CP-DT-01 is separate, runtime-blocked, not in Phases 21-33

**Proposed:** CP-DT-01 runtime block remediation included in Phase 23

**Why:** The owner explicitly lists "delegate-task ecosystem" as Group 1 highest priority. Leaving it outside the restructuring phases means the core delegation path remains broken. Including it in Phase 23 ensures the delegation architecture is fixed as part of the same dispatch unification work.

### Decision 5: Cleanup phases pushed to Group 4

**Current:** 5.5 cleanup phases (21, 22, 28, 30 partial, 31, 32) before Group 1 is complete

**Proposed:** All cleanup unified in Phases 31-34, AFTER all design fixes

**Why:** Insulated risk. If a design fix changes a module's interface, the cleanup phase still applies correctly. If you clean first and design later, the cleanup may be invalidated. The only cost: slightly more effort if cleanup volume grows during design fixes. That's acceptable.

### Decision 6: Hook CQRS enforcement after coordination design

**Current:** Hooks CQRS (Phase 23) before coordination status unifcation (Phase 26)

**Proposed:** Hooks CQRS (Phase 27) after coordination dispatch (Phase 23) and routing (Phase 26)

**Why:** Hook signatures depend on event types. Event types come from coordination (what events exist) and routing (what routing events exist). If coordination dispatch changes in Phase 23, hook signatures from Phase 23 need rework. Sequencing hooks AFTER coordination prevents this.

### Decision 7: Auto-looping/ralph-loop last in Group 2

**Current:** Not in hard restructuring (too early? not included?)

**Proposed:** Phase 28, after hooks and routing

**Why:** Auto-looping depends on session-tracker for loop state (Group 1), hooks for event input (Group 2), and routing for dispatch (Group 2). It's the most dependent surface in Group 2.

---

## 6. Risk Assessment

### High Risks in Reordering

| Risk | Mitigation |
|------|-----------|
| **Plugin.ts stays overloaded during Group 1 work** — 493 LOC composition root makes tool additions error-prone | Accept the friction. Group 1 tool changes are additive (fixes to existing tools), not new tool registrations. Only 1-2 phase-appropriate tool registration changes expected across 5 Group 1 phases. |
| **Session-tracker design fix reveals unanticipated flaws** — real session usage may expose deeper issues | Build into Phase 21: production session file analysis is primary input. Add 1 buffer week before Phase 22 if critical flaws found. |
| **CP-DT-01 runtime block resolution may require SDK upgrade** — OpenCode v1.15.4 missing `context.task` field | Collateral: upgrade OpenCode SDK or change delegate-task design to not depend on `context.task`. Either way, this must be resolved before Phase 23 completes — no alternative. |
| **Contiguous Group 1 phases are high-effort** — 5 design fix phases without cleanup breaks may burn out the developer | Accept per the owner's framework: this is the PRIORITY. The developer explicitly stated Group 1 (design fix FIRST) is the highest priority. Invest effort where the owner directed. |

### Medium Risks

| Risk | Mitigation |
|------|-----------|
| **Phase 24 (trajectory + agent-work-contract) is small scope** — may not warrant own phase | Merge into Phase 25 or expand with pressure fixes. 2 phases for remaining Group 1 is acceptable. |
| **Phase 30 (config plane) overlaps with Phase 32 (shared/config leaf)** — two config touches | Keep Phase 30 for config DESIGN fixes (singleton fix, decompileAgent bug). Phase 32 for STRUCTURAL config fixes (split, import standardization). Clean separation. |
| **Session-tracker module splits delayed to Phase 33** — 702 LOC event-capture.ts stays large during Group 1-3 work | Accept: the file works correctly despite being large. Design fix priority > cleanup priority. |

### Low Risks

| Risk | Mitigation |
|------|-----------|
| **Schema kernel cleanup (Phase 29) doesn't depend on any Group 1/2 fix** — could be done earlier | Accept: putting it at the start of Group 3 is fine. It's a leaf module that genuinely doesn't depend on anything. |
| **Async I/O conversion delayed to Phase 33** — sync I/O stays in runtime paths during Group 1-3 | Accept: sync I/O works correctly (just inefficient). The production session file ran for 16,053 LOC of output without async conversion causing issues. |
| **Integration verification (Phase 35) is the same as Phase 33 in current plan** | Same scope, just pushed back to account for additional phases. Normal schedule adjustment. |

### Overall Compare: Current vs Reordered Risk Profile

| Dimension | Current Ordering | Reordered Ordering |
|-----------|-----------------|-------------------|
| Design correctness delivered first | ❌ Cleanup delivered first | ✅ Group 1 design fixes first |
| Wasted cleanup effort risk | HIGH (cleanup before design) | LOW (design before cleanup) |
| Plugin.ts overload friction | LOW (decomposed in Phase 21) | MODERATE (stays overloaded until Phase 31) |
| Delegate-task fixed | NO (CP-DT-01 not in restructuring) | YES (Phase 23) |
| Context switches | HIGH (5 switches between cleanup and design) | LOW (contiguous Group 1, then Group 2, etc.) |
| Total phase count | 13 phases | 15 phases |
| Time to first agent-facing improvement | Phase 26 (Coordination — 6 phases in) | Phase 21 (Session-tracker — 1 phase in) |

---

## 7. Summary: What Changes

| Component | Current Plan | Reordered Plan |
|-----------|-------------|----------------|
| First phase executed | Plugin.ts decomposition (cleanup) | Session-tracker tool design fix (Group 1) |
| CP-DT-01 runtime block | Separate, not in restructuring | Phase 23 — integrated with dispatch fix |
| Session-tracker tools fix | Phase 28, 30, 31 (scattered) | Phase 21 (contiguous) |
| Plugin.ts decomposition | Phase 21 (first!) | Phase 31 (last in Group 4) |
| Shared/config leaf fix | Phase 22 | Phase 32 |
| Hook CQRS enforcement | Phase 23 (before coordination) | Phase 27 (after coordination) |
| Auto-looping fix | Not explicitly in restructuring | Phase 28 |
| Integration verification | Phase 33 | Phase 35 |
| **Net phases added** | 13 phases | 15 phases (+2 for pressure + auto-looping) |

### Migration Path

To implement this reordering:

1. **Update ROADMAP.md** — replace current Phases 21-33 with the reordered 15 phases
2. **Update STATE.md** — reset "current focus" from Phase 21 to Phase 21 (now: Session-Tracker Tool Design Fix)
3. **Keep phase directories** — rename existing phase dirs (21-sync-io-async-conversion → archive or push to Phase 33)
4. **Update hard-restructuring-thin-framing.md** — replace cluster batches with owner's 4-group ordering
5. **Begin Phase 21** — analyze `session-ses_1baf.md` for specific session-tracker design improvements
6. **Do NOT touch plugin.ts decomposition** until Phase 31 — accept it stays at 493 LOC during Groups 1-3

---

## 8. Research Sources

- `.planning/ROADMAP.md` (911 LOC) — current phase ordering Phases 21-33
- `.planning/roadmap/hard-restructuring-thin-framing-2026-05-21.md` — cluster dependency map, addressing order (228 LOC)
- `.planning/research/hard-restructuring-cluster-map-2026-05-21.md` — full module health matrix, 10 clusters (392 LOC)
- `.planning/codebase/TOOL-CLASSIFICATION-MATRIX-AND-TACKLE-ORDER-2026-05-18.md` — 15 surface utility scores, 6 REWORK surfaces (361 LOC)
- `session-ses_1baf.md` — 16,053 LOC production session file showing real session-tracker usage patterns
- `.hivemind/audit/flaw-register-2026-05-10.json` — 12 catalogued session-tracker flaws (F1-F12)
- `.planning/research/hard-restructuring-synthesis-2026-05-21.md` — SDK audit, DI analysis, severity matrix (454 LOC)
- Owner's verbal 3-group framework (primary source for priority ordering)
