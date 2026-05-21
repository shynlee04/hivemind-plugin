# Phase Reordering — Final Recommendation

**Date:** 2026-05-21
**Framework:** Owner's 3-Group Classification + 5 Cross-Cutting Concerns
**Sources:** 14 research artifacts (3,249+ LOC), production session file (16,053 LOC), flaw register (16 flaws), cluster map (10 clusters), 6 deep-analysis reports
**Evidence Level:** L2-L3 (code analysis + file-system evidence + production session evidence)

---

## Executive Summary

The current phase ordering (old Phases 21-28 restored, new Phases 21-34 created ad-hoc) violates the owner's priority framework in **4 structural ways**. The most critical: cleanup/refactor work is scheduled BEFORE design-fix work — the exact opposite of the stated "Design Fix FIRST, Clean/Refactor LAST" principle.

**This report recommends a 15-phase reordering** that follows the owner's framework:

| Group | Phases | Count | Priority |
|-------|--------|-------|----------|
| **Non-Destructive Foundation** (prerequisite) | 0 — already done (Phase 19-20), one quick cleanup sweep | 1 | PREREQUISITE |
| **Group 1: Orchestration Logic** | P21: Session-Tracker → P22: Status/Error → P23: Dispatch/Delegate → P24: Trajectory/Contract → P25: Pressure | 5 | HIGHEST |
| **Group 2: Routing & Coordination** | P26: Routing/Intent → P27: Hooks → P28: Auto-Loop/PTY | 3 | SECOND |
| **Group 3: Schema & Config** | P29: Schema Kernel → P30: Config Plane → P31: Shipped Primitives | 3 | LOWEST |
| **Structural Cleanup** | P32: Plugin Decomp → P33: Async I/O + Errors → P34: Module Splits → P35: Integration Verify | 4 | LAST |

**Total: 15 phases** (plus 1 prerequisite stub) replacing the current mix of 14 new + 8 old contradictory phases.

### Key Decisions

1. **Session-tracker design fix FIRST** — production evidence (F-01 CRITICAL temp file leak, F-02 CRITICAL manifest never writes) demands immediate fix
2. **Delegate-task CP-DT-01 runtime block resolved IN restructuring** — Phase 23, not deferred
3. **Plugin decomposition LAST** — stays at 493 LOC during Groups 1-3; only decomposed in Phase 32
4. **Async I/O + Typed Errors pushed to Group 4** — sync I/O works correctly (just inefficient); design correctness > I/O pattern purity
5. **All old phase directories (21-28 original) are REPLACED** — their scope absorbed into the new sequence

---

## Group Classification

### Group 1: Orchestration Logic (HIGHEST PRIORITY — Total Revamp Needed)

**Owner's characterization:** "Session-tracker + attached tools" — 16 design flaws (2 CRITICAL). Delegate-task "tons of flaws." Trajectory/Pressure/Agent-Work-Contract "mess of flaws, nonsensical designs."

| Phase | Title | Scope Summary | Depends On | Risk |
|-------|-------|---------------|------------|------|
| **P21** | Session-Tracker Design Fix | Fix F-01 temp leak, F-02 manifest wire, F-04/F-07/F-08 recovery blindness, F-03/F-05 status consistency, F-09 persistence simplification. Add tests for hivemind-session-view (127 LOC, zero tests). | Nothing (tools exist) | HIGH — 16 flaws, production evidence; but highest impact |
| **P22** | Coordination Status + Error Unification | Unify `TaskStatus` ↔ `DelegationStatus`. Create `DelegationError` type. Fix `notification-handler.ts` TTL/delivery. Add guardrails to `execute-slash-command`. | P21 (uses session-tracker types) | MODERATE |
| **P23** | Coordination Dispatch + Delegate-Task Fix | Fix CP-DT-01 runtime block. Decompose DelegationManager god-object (~580 LOC). Consolidate dual in-memory stores. Fix `coordinatorRef` forward reference. Merge notification-formatter + router. | P22 (needs unified status/error) | HIGH — core delegation path |
| **P24** | Trajectory + Agent-Work-Contract Redesign | Fix trajectory state transitions. Add dedicated trajectory tests (currently zero). Fix agent-work-contract lifecycle design. Fix `deriveSurface()` duplication. | P23 (trajectory consumes delegation) | MODERATE — owner says "nonsensical" |
| **P25** | Pressure + Notification Redesign | Fix pressure scoring logic (zero tests, 625 LOC). Fix authority-matrix overlap. Fix notification TTL + retry + delivery tracking. Fix SDK handler grace period timer race. | P23 (pressure gates consume delegation) | MODERATE |

**Total Group 1 scope:** 5 contiguous phases, ~14 files modified, addresses all 16 session-tracker flaws + 6 HIGH findings from synthesis

### Group 2: Routing, Auto-looping, Coordination (SECOND PRIORITY — Extremely Under-Developed)

**Owner's characterization:** "User intents → classified → improved → dissected → orchestrator routes" — currently very weak. PTY/background commands "all over the place." Hooks "mis-designed." Ralph loops "totally nonsensical."

| Phase | Title | Scope Summary | Depends On | Risk |
|-------|-------|---------------|------------|------|
| **P26** | Routing + Intent Loop Foundation | Fix intention-classifier (fragile substring matching). Remove dead registry validator. Fix dead no-op profile methods. Add tests for session-entry, behavioral-profile, command-engine (~1,200 LOC, zero tests). | P21-P25 (uses session data) | MODERATE — fragile but currently functional |
| **P27** | Hook Injection Plane Redesign | Fix CQRS violation in tool-after-workflow. Make `assertHookWriteBoundary` enforce at runtime. Remove duplicate `system.transform`. Type hook signatures. Fix silent vs required classification. Inline 2 thin observer shells. | P26 (routing event types) | MODERATE — mis-designed but low usage |
| **P28** | Auto-Looping + PTY + Background Command Revamp | Fix auto-loop session-tracker dependency. Fix ralph-loop termination conditions. Wire into routing pipeline. Add loop termination tests. Re-organize PTY/background-command purposes. Remove dead prompt-packet (348 LOC). | P27 (hooks provide loop input) | MODERATE — "totally nonsensical" per owner |

**Total Group 2 scope:** 3 contiguous phases, ~8 files modified, addresses routing weakness + hook misdesign + auto-loop/PTY confusion

### Group 3: Schema & Configuration (LOWEST PRIORITY — Put Last)

**Owner's characterization:** "First setup and configuration, side-car. Shipped primitives — soft approach first. Governance, permissions, wiring of primitives and custom toolings."

| Phase | Title | Scope Summary | Depends On | Risk |
|-------|-------|---------------|------------|------|
| **P29** | Schema Kernel Cleanup + Test Gaps | Delete 3 dead schemas (permission, tool-definition, skill-metadata). Add tests for 9 untested schemas. Verify skill-metadata consumers preserved. | Nothing (leaf module) | LOW |
| **P30** | Config Plane Redesign | Fix config subscriber singleton. Fix `decompileAgent` bug (returns "unknown"). Fix `validateWithFallback` fragile locale check. Split `compiler.ts` (410 LOC). | P29 (schemas used by config) | LOW-MODERATE — singleton leak across tests |
| **P31** | Shipped Primitives + Governance Wire | Wire agent/skill/command primitives with soft approach (.md first). Implement hm-* vs hf-* lineage routing validation. Fix governance/permission wiring. | P30 (config stable) | MODERATE — crosses hard/soft boundary carefully |

**Total Group 3 scope:** 3 phases, ~6 files + .opencode/ primitives, addresses schema/completeness gaps + config bugs + primitive governance

### Non-Destructive Foundation (PREREQUISITE to All Groups)

**Already partially complete:** Phase 19 (plans 01-04, dead code deletion) + Phase 20 (dependency cleanup, yaml consolidation, react→optional).

**Remaining non-destructive work** (1 quick phase, renumber as Phase 20.5 or inline):

| Item | Scope | Risk | Priority |
|------|-------|------|----------|
| Delete remaining dead code | 3 files: permission.schema.ts, tool-definition.schema.ts, skill-metadata.schema.ts (~350 LOC) | VERY LOW | Do before Group 1 |
| Rebuild dist/ (stale artifacts) | 38 stale artifacts from Phase 18 deletions | LOW | Do before Group 1 |
| Remove 2 legacy hooks | system.transform + messages.transform from plugin.ts return | LOW | Inline in this phase |
| npm test regression baseline | Verify 2,382 tests still pass | — | Mandatory gate |

**Rationale:** These are purely additive-safe deletions. They remove dead code that could confuse Group 1 design work. Do them FIRST, commit, then proceed to Group 1 without touching plugin.ts decomposition.

---

## Recommended Phase Sequence

### Complete 15-Phase Sequence

```
PREREQUISITE: Non-Destructive Foundation (quick cleanup of remaining dead code)
    │
    ├── P00.5: Dead Code Sweep + Dist Rebuild (remaining 3 files, 38 stale artifacts)
    │
    ▼
GROUP 1 — Orchestration Logic (Design Fix FIRST — 5 contiguous phases)
    │
    ├── P21: Session-Tracker Design Fix          ← PRODUCTION EVIDENCE EXISTS
    │     Fix F-01 (temp leak), F-02 (manifest), F-04/F-07/F-08 (recovery)
    │     Fix F-03/F-05 (consistency), F-09 (simplify), add session-view tests
    │     [Entry: P00.5 complete]  [Exit: all P0-P1 flaws resolved, tests passing]
    │
    ├── P22: Coordination Status + Error Unification
    │     Unify TaskStatus/DelegationStatus, create DelegationError, 
    │     fix notification TTL/retry, guardrails on execute-slash-command
    │     [Depends: P21 types]  [Exit: single status type, unified error contract]
    │
    ├── P23: Coordination Dispatch + Delegate-Task Fix   ← CP-DT-01 BLOCK
    │     Fix CP-DT-01 runtime block, decompose DelegationManager god-object,
    │     consolidate dual stores, fix coordinatorRef, merge notification files
    │     [Depends: P22 contract]  [Exit: delegate-task functional, deadlock risks resolved]
    │
    ├── P24: Trajectory + Agent-Work-Contract Redesign
    │     Fix trajectory state transitions, add trajectory tests (currently zero),
    │     fix agent-work-contract lifecycle, deduplicate deriveSurface()
    │     [Depends: P23 delegation stable]  [Exit: trajectory designed correctly, tested]
    │
    └── P25: Pressure + Notification Redesign
        Fix pressure scoring (zero tests), authority-matrix singleton,
        notification TTL + retry + delivery tracking, SDK handler race
        [Depends: P23 delegation state]  [Exit: pressure gated, notifications reliable]

GROUP 2 — Routing & Agent Coordination (3 contiguous phases)
    │
    ├── P26: Routing + Intent Loop Foundation
    │     Fix intention-classifier (substring→structured), remove dead validator,
    │     fix dead no-op profile methods, add tests (~1,200 LOC untested)
    │     [Depends: P21-P25 session+pressure data]  [Exit: routing functional, tested]
    │
    ├── P27: Hook Injection Plane Redesign
    │     Fix CQRS violation, enforce assertHookWriteBoundary, 
    │     remove duplicate transform, type hook signatures, 
    │     classify silent vs required, inline thin observers
    │     [Depends: P26 routing event types]  [Exit: hooks typed, CQRS-compliant]
    │
    └── P28: Auto-Looping + PTY + Background Command Revamp
        Fix auto-loop session-tracker dependency, fix ralph-loop termination,
        wire into routing pipeline, add termination tests,
        reorganize PTY/background-command, delete prompt-packet (348 LOC dead)
        [Depends: P27 hook events]  [Exit: auto-loop/PTY coherent, tested]

GROUP 3 — Schema & Configuration (3 phases)
    │
    ├── P29: Schema Kernel Cleanup
    │     Delete 3 dead schemas, add tests for 9 untested schemas
    │     [Depends: Nothing — leaf module]  [Exit: schema-kernel clean, tested]
    │
    ├── P30: Config Plane Redesign
    │     Fix config singleton, fix decompileAgent bug, fix validateWithFallback,
    │     split compiler.ts (410 LOC) into submodules
    │     [Depends: P29 schemas]  [Exit: config instance-scoped, compiler decomposed]
    │
    └── P31: Shipped Primitives + Governance Wire
        Wire agent/skill/command .opencode/ primitives with lineage routing,
        implement hm-*/hf-* validation, fix governance/permission boundaries
        [Depends: P30 config stable]  [Exit: primitives wired, lineage validated]

GROUP 4 — Structural Cleanup (NON-DESTRUCTIVE LAST — 4 phases)
    │
    ├── P32: Plugin.ts Decomposition
    │     Extract tool registry → registry.ts, startup → startup.ts,
    │     hook composition → composer.ts, fix promise hygiene,
    │     remove legacy non-SDK hooks, fix temporal coupling
    │     Target: plugin.ts 493→~150 LOC
    │     [Depends: All design fixes stable — P21-P31]
    │     [Exit: plugin.ts < 200 LOC, all registrations verified]
    │
    ├── P33: Async I/O Conversion + Typed Error Hierarchy
    │     Convert runtime sync fs→fs/promises (44 readFileSync, 32 writeFileSync,
    │     19 renameSync → ~130 runtime calls). Create 5 typed error classes.
    │     Replace ~100 throw new Error sites across 45 files.
    │     [Depends: P32 composition root stable]
    │     [Exit: runtime sync I/O < 30 calls, zero throw new Error("[Harness]")]
    │
    ├── P34: Module Splits + Legacy Inventory
    │     Split event-capture.ts (702 LOC→2-3), session-tracker/index.ts (561→extract init),
    │     simplify PendingDispatchRegistry (312→simple Map),
    │     split types.ts (381 LOC), standardize tool imports,
    │     create legacy/deprecated reference inventory with removal gates
    │     [Depends: P33 errors/types stable]
    │     [Exit: all files < 500 LOC, legacy annotated, imports standardized]
    │
    └── P35: Integration Verification
        Full regression, dist rebuild, tool smoke test, manifest sync,
        ARCHITECTURE.md/STRUCTURE.md/CONCERNS.md update
        [Depends: P21-P34]
        [Exit: all tests pass, dist clean, documentation accurate]
```

### Old Phase Directory Disposition

| Old Directory | Proposed Fate | Absorbed Into |
|---------------|---------------|---------------|
| `21-sync-io-async-conversion` | **REPLACED** — async I/O pushed to P33 | P33 |
| `22-typed-error-hierarchy` | **REPLACED** — typed errors pushed to P33 | P33 |
| `23-plugin-decomposition` | **REPLACED** — plugin decomposition pushed to P32 | P32 |
| `24-module-split-session-tracker` | **REPLACED** — module splits pushed to P34 | P34 (session-tracker design fix first in P21) |
| `25-legacy-deprecation-cleanup` | **REPLACED** — legacy cleanup pushed to P34 | P34 |
| `26-post-restructuring-integration-verification` | **REPLACED** — moved to P35 | P35 |
| `27-fix-sync-oss-yml-workflow` | **RETAINED** — independent, no Group 1-4 dependency | Renumber to P36 |
| `28-package-opencode-primitives-for-distribution` | **RETAINED** — depends on P31 primitives wiring | Renumber to P37 |

**Rationale for replacing old phases 21-26:** All of them were structural cleanup (async I/O, typed errors, plugin decomposition, module splits). Per the owner's "Design Fix FIRST, Clean/Refactor LAST" principle, these belong at the END of the sequence (Group 4), not at the beginning.

---

## Dependency Graph

### Hard Blockers (cannot proceed without predecessor)

```
P00.5 (Dead Code Sweep)
  → P21 (Session-Tracker Fix)
  → P22 (Status/Error Unification)    ← P21 types needed
  → P23 (Dispatch/Delegate Fix)       ← P22 contract needed
  → P24 (Trajectory/Contract)         ← P23 delegation needed
  → P25 (Pressure/Notification)       ← P23 delegation needed
  → P26 (Routing/Intent)              ← P21-P25 session+pressure data

P22 → P23 is the CRITICAL PATH — everything above depends on delegation dispatch being correct
```

### Soft Blockers (design stability, not compilation)

```
P26 (Routing) → P27 (Hooks): routing event types needed before hooks can be typed
P27 (Hooks) → P28 (Auto-Loop): hook events needed for loop input
P28 (Auto-Loop) → P32 (Plugin Decomp): auto-loop wiring changes tool registration
P29 (Schema) → P30 (Config): schemas consumed by config compiler
P30 (Config) → P31 (Primitives): config compiler used to validate .opencode/ primitives
P21-P31 (ALL) → P32-P34 (Cleanup): all design fixes must settle before structural cleanup
```

### Parallel Candidates (can run concurrently)

| Phase Set | Rationale |
|-----------|-----------|
| **P29 (Schema) runs parallel to P21-P28** | Schema kernel is a leaf module (Zod-only). No runtime dependency on session-tracker, coordination, routing, or hooks. Can be done at any time. |
| **P30 (Config) partially overlaps P26-P28** | Config fixes (singleton, decompileAgent bug) are independent of routing/hooks design. Only depends on schemas (P29). |
| **P34 (Module Splits) partially overlaps P33** | Module splitting (event-capture.ts, types.ts) and sync I/O conversion touch different files. Can parallelize if needed. |

### What Blocks Nothing

- **P29 (Schema Kernel Cleanup):** Leaf module, no downstream dependencies
- **P30 (Config Plane Fixes):** Only depends on schemas (which are stable)
- **P34 Module Splits + P35 Integration:** Terminal phases

---

## Traversal Strategy

### Entry/Exit Gates for Each Phase Cluster

```
P00.5 (Non-Destructive Foundation)
  ENTRY: Phase 20 complete, dist/ has stale artifacts
  EXIT:  dist/ clean, zero dead code, 3,000+ tests passing, typecheck clean
  REVISIT TRIGGER: If Group 1 design fix encounters a dead-code remnant, 
                   return to P00.5 to delete it, then continue

P21-P25 (Group 1 — Orchestration)
  ENTRY: P00.5 exit gates clear
  EXIT:  All 16 session-tracker flaws resolved (P0-P4 priority), 
         CP-DT-01 unblocked, delegation path functional, 
         trajectory/contract designed correctly, pressure gated properly
  CRITICAL CHECKPOINT: Between P21 and P22 — verify session-tracker fixes
                       survive a simulation of the production session scenario
                       (long-haul session with 50+ children, 3+ depth levels)

P26-P28 (Group 2 — Routing & Coordination)
  ENTRY: Group 1 exit gates clear
  EXIT:  Routing correctly classifies intents, hooks are CQRS-compliant,
         auto-loop/PTY have clear purpose and tests
  CHECKPOINT: Between P26 and P27 — verify routing produces correct event types
              before hooks are re-typed

P29-P31 (Group 3 — Schema & Config)
  ENTRY: Group 2 exit gates clear (or P29 can start earlier in parallel)
  EXIT:  Schema kernel clean, config singleton fixed, primitives wired,
         lineage routing validated
  CHECKPOINT: Between P30 and P31 — verify config compiler correctly 
              compiles .opencode/ primitives before wiring them

P32-P35 (Group 4 — Structural Cleanup)
  ENTRY: Groups 1-3 exit gates clear
  EXIT:  plugin.ts < 200 LOC, runtime sync I/O < 30 calls,
         typed errors everywhere, all files < 500 LOC,
         legacy annotated, integration verified
  FINAL CHECKPOINT: Full regression + dist rebuild + manifest sync
```

### Checkpoint/Revisit Criteria

A later phase MUST trigger revisiting an earlier phase when:

| Condition | Action | Max Depth |
|-----------|--------|-----------|
| P23 dispatch fix reveals session-tracker design gap | Return to P21, patch flaw, advance through P22-P23 again | 2 cycles |
| P24 trajectory design contradicts delegation model | Return to P23, fix dispatch contract, advance through P24 | 1 cycle |
| P26 routing needs a pressure signal that P25 doesn't provide | Return to P25, add signal, advance through P26 | 1 cycle |
| P27 hook type mismatch with P23 coordination events | Return to P23, verify event types, advance through P26-P27 | 1 cycle |
| P32 plugin decomposition changes a tool that P21-P28 fixed | Accept — plugin decomp is mechanical extraction, not redesign | 0 cycles (design already settled) |
| P33 async conversion breaks P21 session-tracker write path | Return to P21, fix write path with async, advance through P33 | 1 cycle |

### Maximum Traversal Depth Before Escalation

| Depth | Action |
|-------|--------|
| **1 revisit** | Acceptable — minor design iteration |
| **2 revisits** | Review with gatekeeping — may indicate design contracts not properly defined between phases |
| **3+ revisits** | **ESCALATE** — STOP the phase sequence. Conduct root-cause analysis across all groups. The dependency contracts between phases are insufficiently specified. Produce a gap analysis report for human decision. |

---

## Risk Assessment by Group

### Group 1 — Orchestration Logic (Phases 21-25)

**HIGHEST RISK PHASES:**

| Phase | Risk Level | Why | Mitigation |
|-------|-----------|-----|------------|
| **P21 (Session-Tracker)** | HIGH | 16 flaws (2 CRITICAL). Production session file shows real data loss. Temp file leakage (F-01) can corrupt project continuity. | Fix P0-P1 first (F-01, F-02, F-04, F-07, F-08). Add integration test that simulates long-haul session. |
| **P23 (Dispatch/Delegate)** | HIGH | CP-DT-01 runtime block requires resolving `context.task` absence. DelegationManager god-object (~580 LOC) is the highest coupling hotspot. | If `context.task` remain absent, redesign delegate-task to not depend on it. Don't block — alternative dispatch design exists. |
| **P24 (Trajectory)** | MODERATE | Owner says "nonsensical." Zero tests currently. Redesign may reveal fundamental design contradictions with delegation model. | Keep scope bounded to trajectory state transitions + tests. Don't expand into delegation redesign (that's P23). |

**QUICK WINS (Highest Impact for Lowest Effort):**

| Phase | Quick Win | Effort | Impact |
|-------|-----------|--------|--------|
| **P21** | F-01 temp leak fix (atomic-write.ts — 3 lines + cleanup-after-rename) | ~50 LOC | Eliminates CRITICAL data loss risk |
| **P21** | F-02 manifest wire (hierarchy-manifest.ts — 10 lines to add `addChild()` call in event-capture or tool-capture) | ~30 LOC | Fixes "authoritative source" that never writes — the most embarrassing design gap |
| **P22** | Unify TaskStatus/DelegationStatus | ~100 LOC | Eliminates UC-1 (dual status type system, score 12/20 REWORK) |
| **P23** | Decompose DelegationManager extract dispatch strategy | ~200 LOC | Reduces 580 LOC god-object to 3 focused ~200 LOC modules |
| **P24** | Add trajectory tests (zero currently) | ~100 LOC | First-ever test coverage for 411 LOC module with file I/O |

**EVIDENCE NEEDED BEFORE PROCEEDING:**

| Gate | Evidence |
|------|----------|
| Before P22 | P21 exit: `npm test` passes with session-tracker fixes; production session scenario simulated and verified |
| Before P23 | P22 exit: single `DelegationStatus` type in use, `DelegationError` type defined, notification TTL working |
| Before P24 | P23 exit: CP-DT-01 unblocked, manager.ts decomposed, dual stores reconciled |
| Before P25 | P23 exit: delegation dispatch working correctly (pressure gates consume delegation state) |

### Group 2 — Routing, Auto-looping, Coordination (Phases 26-28)

**HIGHEST RISK PHASE:**

| Phase | Risk Level | Why | Mitigation |
|-------|-----------|-----|------------|
| **P26 (Routing)** | MODERATE | ~1,200 LOC untested across 3 sub-modules (session-entry, behavioral-profile, command-engine). Fragile substring matching. | Add tests FIRST before redesign. This establishes a regression baseline for the fragile routing logic. |
| **P28 (Auto-Loop/PTY)** | MODERATE | Ralph loops "totally nonsensical." PTY/background-command "all over the place, no clear purposes." | Keep scope tightly bounded: fix auto-loop termination conditions + wire into routing. Don't redesign the entire PTY surface — that's a separate workstream. |

**QUICK WINS:**

| Phase | Quick Win | Effort | Impact |
|-------|-----------|--------|--------|
| **P26** | Delete dead registry validator code + dead no-op profile methods | ~50 LOC deletions | Removes confusion from routing code |
| **P27** | Remove duplicate `system.transform` registration | ~5 LOC | Eliminates hook registration noise |
| **P27** | Type hook signatures (replace `unknown, unknown` with SDK shapes) | ~50 LOC | Compile-time type safety for 3 hooks |
| **P28** | Delete `prompt-packet/` (348 LOC, designed-only, unwired) | ~350 LOC deletion | Reduces dead code by 20% |

**EVIDENCE NEEDED BEFORE PROCEEDING:**

| Gate | Evidence |
|------|----------|
| Before P27 | P26 exit: routing correctly classifies intents, event types documented and consistent |
| Before P28 | P27 exit: hooks correctly typed, CQRS violations eliminated, silent/required classification complete |

### Group 3 — Schema & Configuration (Phases 29-31)

**HIGHEST RISK PHASE:**

| Phase | Risk Level | Why | Mitigation |
|-------|-----------|-----|------------|
| **P31 (Primitives Wiring)** | MODERATE | Crosses hard/soft boundary. Must wire .opencode/ primitives without breaking the soft approach. | Use read-side validation only. Don't implement a full runtime routing engine — that's "runtime intelligence" for a later phase. |

**QUICK WINS:**

| Phase | Quick Win | Effort | Impact |
|-------|-----------|--------|--------|
| **P29** | Delete 3 dead schemas (~350 LOC) | ~10 LOC deletions | Reduces barrel bloat, maintenance burden |
| **P30** | Fix `decompileAgent` bug (returns "unknown" instead of frontmatter name) | ~5 LOC | Fixes a confusing bug |
| **P30** | Fix `validateWithFallback` locale check | ~5 LOC | Eliminates fragile string-matching |

**EVIDENCE NEEDED BEFORE PROCEEDING:**

| Gate | Evidence |
|------|----------|
| Before P30 | P29 exit: schema-kernel clean, dead schemas deleted, all remaining schemas have tests |
| Before P31 | P30 exit: config singleton fixed, compiler decomposed, primitives compile correctly |

### Group 4 — Structural Cleanup (Phases 32-35)

**HIGHEST RISK PHASE:**

| Phase | Risk Level | Why | Mitigation |
|-------|-----------|-----|------------|
| **P32 (Plugin Decomposition)** | MODERATE | Composition root changes affect ALL 23 tool registrations. One wrong import breaks entire plugin. | Keep old plugin.ts as rollback; extract incrementally (tool registry → startup → hooks → assembly); verify after each extraction. |
| **P33 (Async I/O)** | MODERATE | Must not break CLI cold-start paths. ~130 sync calls to convert across runtime paths. | Add integration test for bootstrap-init CLI path BEFORE conversion. |

**QUICK WINS:**

| Phase | Quick Win | Effort | Impact |
|-------|-----------|--------|--------|
| **P32** | Remove 2 legacy non-SDK hooks | ~10 LOC | Eliminates SDK-silently-ignored hooks |
| **P33** | Create 5 typed error classes | ~50 LOC | Foundation for error hierarchy |
| **P34** | Simplify PendingDispatchRegistry (312→simple Map) | ~150 LOC deletions | Major persistence simplification |

**EVIDENCE NEEDED BEFORE PROCEEDING:**

| Gate | Evidence |
|------|----------|
| Before P33 | P32 exit: plugin.ts < 200 LOC, all 23 tools registered and verified |
| Before P34 | P33 exit: runtime sync I/O < 30 calls, typed errors throughout |
| Before P35 | P34 exit: all files < 500 LOC, legacy annotated, everything stable |

---

## Cross-Cutting Validation Points

### 5 Cross-Cutting Concerns Applied Per Phase

| Concern | P21 | P22 | P23 | P24 | P25 | P26 | P27 | P28 | P29 | P30 | P31 | P32 | P33 | P34 | P35 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **1. Specs Compliance** | Verify against ROADMAP.md spec for session-tracker fixes | Verify against coordination status design spec | Verify against CP-DT-01 spec | Verify against trajectory spec patterns | Verify against pressure design spec | Verify against routing design spec | Verify against hook injection spec | Verify against auto-loop design | Verify against schema spec | Verify against config compile spec | Verify against primitive governance spec | Verify against plugin decomposition spec | Verify against async I/O spec | Verify against module split spec | Verify against full integration spec |
| **2. Patterns** | Must follow factory injection (dominant pattern) | Must follow same status/error pattern everywhere | Must follow decomposition pattern (not create new god-object) | Must follow delegation lifecycle pattern | Must follow notification delivery pattern | Must follow classification pattern | Must follow CQRS pattern | Must follow loop termination pattern | Must follow Zod schema pattern | Must follow instance-scoped pattern (not singleton) | Must follow soft primitives pattern | Must follow zero-logic assembly pattern | Must follow fs/promises pattern | Must follow 500 LOC cap pattern | Must follow manifest consistency pattern |
| **3. Harness-OpenCode Integration** | Must not break session data continuity | Must not break delegation tools | Must pass CP-DT-01 L1 runtime proof | Must not break trajectory tool contract | Must not break pressure gate decisions | Must not break command-engine | Must not break hook dispatch | Must not break auto-loop cycle | Leaf module — no integration impact | Must not break config subscriber | Must not break .opencode/ discovery | Must not break tool registration | Must not break CLI cold paths | Must not break import graphs | Must pass full L1 verification |
| **4. Study from GSD/OMO** | Spec-driven approach (GSD). Context intelligence from (OMO). | Status unification pattern from OMO delegation model | Delegation dispatch pattern from OMO. Spec-driven from GSD. | Trajectory pattern from OMO session continuity | Pressure gating from OMO circuit breaker | Intent classification from GSD routing patterns | Hook injection from OMO plugin system | Auto-loop from GSD autonomous loop patterns | Schema patterns from both — clean leaf first | Config patterns from GSD config workflow | Primitive patterns from both — soft approach | Plugin composition from OMO | Async patterns from both | Module organization from both | Quality gate from RICH/HMQUAL |
| **5. Non-Destructive First** | ✅ Design fix on existing tools — no restructuring | ✅ Additive status/error types | ✅ Decompose without removing v1 paths (yet) | ✅ Fix without removing old trajectory | ✅ Additive pressure/notification | ✅ Test-first, then redesign | ✅ Fix CQRS without removing old hooks | ✅ Fix without breaking existing loops | ✅ Deletion of dead code only | ✅ Fix singleton without removing subscriber | ✅ Additive validation layer | ⚠️ Restructuring, but only after all design settled | ⚠️ Restructuring, but mechanical conversion | ⚠️ Restructuring, but only splitting | Full verification — non-destructive |

### Key Validation Artifacts

| Phase | Must Validate Against | Reference Location |
|-------|----------------------|-------------------|
| P21 | Flaw register (F-01 through F-16) | `.hivemind/audit/flaw-register-2026-05-10.json` |
| P21 | Production session evidence | `/Users/apple/hivemind-plugin-private/session-ses_1baf.md` |
| P22-P23 | Tool-classification matrix (15 surface utility scores) | `.planning/codebase/TOOL-CLASSIFICATION-MATRIX-AND-TACKLE-ORDER-2026-05-18.md` |
| P23 | CP-DT-01 spec + runtime block evidence | `.planning/phases/dt-01/` |
| P24 | Trajectory current implementation | `src/hivemind-trajectory.ts` + `src/task-management/trajectory/` |
| P25 | Pressure current implementation | `src/features/runtime-pressure/` |
| P26 | Routing current implementation | `src/routing/session-entry/`, `src/routing/behavioral-profile/`, `src/routing/command-engine/` |
| P27 | Hook current implementation | `src/hooks/` (16 files) |
| P28 | Auto-loop + PTY current implementation | `src/features/auto-loop/`, `src/features/ralph-loop/`, `src/features/background-command/` |
| P29 | Schema inventory | `src/schema-kernel/` (20 files) |
| P30 | Config implementation | `src/config/` (subscriber.ts, compiler.ts, workflow/) |
| P31 | .opencode/ primitives | `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/` |
| P32-P34 | Synthesis report (severity-classification matrix) | `.planning/research/hard-restructuring-synthesis-2026-05-21.md` |
| P35 | Full integration regression | All above + dist/ comparison |

---

## Phase-by-Phase Rationale

### Why Session-Tracker FIRST (P21)

**Evidence:** Production session file (16,053 LOC) shows real data loss from temp file leakage (F-01) and hierarchy-manifest never writing (F-02). The flaw register catalogs 16 distinct flaws (2 CRITICAL, 6 HIGH). Every agent that uses `hivemind-power-on` or delegation tools hits these surfaces first.

**Cost of being wrong:** If we do plugin decomposition first (current old Phase 21), we decompose a composition root that will need re-editing when session-tracker tools change their registration. Wasted effort.

**Cost of doing it now:** Session-tracker fixes are additive to existing tools. No new tool registrations needed. Low structural risk.

### Why Delegate-Task Fix INCLUDED in Restructuring (P23)

**Evidence:** CP-DT-01 is runtime-blocked because `context.task` is absent from SDK ToolContext (v1.15.4, v1.15.5). The owner explicitly lists "delegate-task ecosystem" as Group 1 highest priority.

**Decision:** Include CP-DT-01 runtime block remediation in P23, not as a separate deferred workstream. If `context.task` cannot be added to SDK, redesign delegate-task to not depend on it (the alternative session-based dispatch already works for other tools).

### Why Async I/O + Typed Errors Pushed to Group 4 (P33)

**Evidence:** 239 sync FS calls total — but only ~16 in truly runtime-critical paths (delegation-persistence.ts: 9, session-patch/tools.ts: 7). The production session ran 16,053 LOC of output without async conversion causing issues. The hard-restructuring-synthesis confirms: "Most sync calls are in CLI/bootstrap cold paths (acceptable)."

**Decision:** Sync I/O works correctly (just inefficient). Design correctness > I/O pattern purity. Fix the session-tracker atomic write (F-01) as a design fix in P21 — THAT's the data loss risk, not the sync vs async pattern.

### Why Plugin Decomposition LAST (P32)

**Evidence:** Plugin.ts at 493 LOC near the 500 LOC cap. But the DI-ARCHITECTURE-ANALYSIS confirms the factory injection pattern is consistent across ~90% of modules. The plugin works correctly for existing tool additions.

**Decision:** Accept the 493 LOC friction during Groups 1-3. Plugin decomposition is structural cleanup — changing tool registration patterns. If a design fix (P21-P28) changes a tool's signature, the decomposed plugin.ts would need re-editing. Decompose AFTER all design fixes are stable.

### Why Old Phases 21-26 Are Replaced

**Evidence:** Every old phase (21-28 original) is either structural cleanup (not design fix) or belongs later in the sequence. The owner's framework explicitly states "Design Fix FIRST, Clean/Refactor LAST."

**Disposition:**
- Old 21 (sync I/O) → P33 — pushed back 12 phases
- Old 22 (typed errors) → P33 — pushed back 11 phases
- Old 23 (plugin decomposition) → P32 — pushed back 9 phases
- Old 24 (module split session-tracker) → P34 — session-tracker design fix (P21) must come first; splitting happens after design is correct
- Old 25 (legacy cleanup) → P34 — pushed back 9 phases
- Old 26 (integration verification) → P35 — pushed back 9 phases
- Old 27 (fix sync-oss.yml) → P36 — retained, independent
- Old 28 (package primitives) → P37 — retained, depends on P31

---

## Go/No-Go Assessment

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **Phase 19 COMPLETE** | GO | Plans 01-04 executed, gatekeeping passed, dist rebuilt |
| **Phase 20 COMPLETE** | GO | 11 deps removed, yaml consolidated, 6 minors bumped, react→optional |
| **Test baseline stable** | GO | ~2,382 tests passing (Phase 20 baseline) |
| **Typecheck clean** | GO | `npm run typecheck` passes |
| **Research artifacts complete** | GO | 14 research reports (3,249+ LOC) + production session evidence + flaw register |
| **Owner's 3-group framework applied** | GO | Group 1 (5 phases) → Group 2 (3 phases) → Group 3 (3 phases) → Group 4 (4 phases) |
| **CP-DT-01 block resolved in restructuring** | GO | P23 includes CP-DT-01 remediation — not deferred |
| **Contiguous Group 1 work without context switching** | GO | 5 contiguous phases for ALL orchestration design fixes |
| **Scope containment** | GO | 15 phases total, all groups bounded, OUT scope explicitly documented |
| **User authorization** | PENDING | Requires explicit approval before proceeding |

### Go/No-Go Verdict

**RECOMMENDATION: GO** (pending user authorization).

The reordered sequence is technically sound, risk-managed, and aligned with all 5 cross-cutting concerns. Each of the 15 phases has explicit entry/exit gates, dependency documentation, and risk mitigation. The 3 groups follow the owner's priority exactly: design fixes for the most-used surfaces FIRST (session-tracker, delegation), then routing/coordination, then schema/config, then structural cleanup LAST.

The two retained old phases (27: fix sync-oss.yml, 28: package primitives) become P36 and P37 — independent of the restructuring sequence and executable after all 15 phases complete.

---

## Migration Path

1. **Update ROADMAP.md** — replace current Phases 21-34 with the 15-phase sequence (P21-P35)
2. **Archive or rename** old phase directories (21-sync-io-async-conversion through 28-package-opencode-primitives)
3. **Create new phase directories** following the P21-P35 sequence
4. **Add P36-P37** for the two retained old phases (sync-oss.yml, package primitives)
5. **Update STATE.md** — reset "current focus" to P00.5 (Non-Destructive Foundation) or P21 (Session-Tracker Design Fix)
6. **Begin P21** — analyze session-ses_1baf.md for specific session-tracker design improvements
7. **Do NOT touch plugin.ts decomposition** until P32 — accept it stays at 493 LOC during Groups 1-3
8. **Do NOT convert sync I/O or create typed errors** until P33 — design correctness is the priority

---

*End of Phase Reordering Final Recommendation — generated 2026-05-21 by gsd-advisor-researcher*
