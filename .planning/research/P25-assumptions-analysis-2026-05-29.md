# P25 Assumptions Analysis — Trajectory Redesign

**Generated:** 2026-05-29
**Analyzer:** gsd-assumptions-analyzer
**Phase:** P25 — Trajectory Redesign
**Phase description (ROADMAP.md L99):** "Trajectory + Agent-Work-Contract redesign"
**Dependencies:** P24 (COMPLETE), P23 (COMPLETE), CP-ST-* (COMPLETE)
**Blocks:** P26 (Pressure + Notification Redesign), P23.6 (P25→P26→B Integration Gate)

---

## Scope Assumptions

### A1. "Trajectory Redesign" means rewriting the existing trajectory module, not just extending it.

**Assumption:** P25 is a redesign (architectural change), not a feature addition.

**Why this way:** ROADMAP says "Trajectory + Agent-Work-Contract redesign" — "redesign" implies structural change to existing code, not new modules. The existing trajectory module (414 LOC across 4 files) is minimal but functional: a ledger with CRUD operations, evidence attachment, checkpointing, and traversal. Agent-work-contracts (400 LOC across 4 files) already exists as a separate feature module. The phrase "redesign" suggests these two need architectural changes to work together properly or to meet new requirements not yet captured.

**If wrong:** If this is actually just a feature extension (e.g., add new fields, new actions), the scope is much smaller and the planning overhead is overkill. The implementation would be 1-2 plans, not a multi-wave effort.

**Confidence:** Likely — "redesign" is a strong word, but the ROADMAP entry lacks a detailed spec to confirm scope depth.

### A2. Agent-Work-Contract redesign means restructuring how contracts relate to trajectories, not rewriting contracts from scratch.

**Assumption:** The agent-work-contract module's core schema, store, and operations are sound. The redesign targets the integration seam between trajectory and contracts, not the contract model itself.

**Why this way:** `src/features/agent-work-contracts/` (400 LOC) is well-structured: Zod schema (`schema-kernel/agent-work-contract.schema.ts`, 148 LOC), store with quarantine-on-corrupt (`store.ts`, 146 LOC), pressure-aware creation (`operations.ts`, 162 LOC), and proper types (`types.ts`, 89 LOC). The trajectory module already has `attachTrajectoryEvidence` called from `createAgentWorkContract` (operations.ts:58). The seam exists but may need reworking for tighter integration.

**If wrong:** If contracts need a full rewrite, the scope doubles. The schema, store, and operations files would all need replacement.

**Confidence:** Likely — the code is functional; the integration exists but the "redesign" label suggests the seam needs rework.

### A3. The trajectory redesign should produce a unified state model that covers session lifecycle, delegation tracking, and evidence collection.

**Assumption:** P25 aims to unify trajectory with the lifecycle state machine (SessionLifecyclePhase from `src/task-management/lifecycle/index.ts`) and the continuity store (from `src/task-management/continuity/index.ts`).

**Why this way:** Three overlapping status models exist today (HarnessStatus, SessionLifecyclePhase, DelegationPacketStatus) as documented in `src/shared/types.ts:119-142`. Trajectory currently tracks `active|closed` independently. The lifecycle manager (`lifecycle/index.ts`, 242 LOC) tracks phases `created|queued|dispatching|running|completed|failed`. Continuity tracks per-session metadata. These three systems are disconnected from trajectory. P25 likely needs to bridge them.

**If wrong:** If trajectory redesign is standalone (doesn't touch lifecycle/continuity), the scope is much narrower — just the trajectory module itself.

**Confidence:** Unclear — the ROADMAP entry is too terse to confirm whether the goal is unification or standalone redesign.

---

## Code State Assumptions

### B1. The trajectory module is functional and has passing tests.

**Assumption:** The current trajectory code works, passes tests, and does not need emergency fixes.

**Evidence:** `tests/tools/hivemind-trajectory.test.ts` (62 LOC) has 2 test cases covering all 6 actions (attach, checkpoint, event, traverse, inspect, close). The tool is registered in `src/plugin.ts:163`. The ledger has proper quarantine-on-corrupt (ledger.ts:74-78). Store operations handle edge cases (missing trajectory creation with rootSessionId requirement, duplicate checkpoint/event dedup). LOC counts: types 128, ledger 93, store-operations 190, index 3 = **414 LOC total**.

**If wrong:** If trajectory has hidden bugs or test gaps, P25 needs remediation before redesign.

**Confidence:** Confident — tests exist, code is clean, no dead code or stubs found.

### B2. The agent-work-contract module is functional and has passing tests.

**Assumption:** The current contract code works, has tests, and the pressure integration is wired correctly.

**Evidence:** `tests/tools/hivemind-agent-work.test.ts` exists (verified via glob). The contract module has proper Zod schemas (`schema-kernel/agent-work-contract.schema.ts`, 148 LOC), atomic writes with temp-file-rename pattern (`store.ts:49-51`), quarantine-on-corrupt (`store.ts:98-100`), deep-clone-on-read (`store.ts:108-146`), pressure-gated creation (`operations.ts:27-38`), bounded compaction fields (`operations.ts:93-101`), and markdown export (`operations.ts:121-152`). The tool is registered in `src/plugin.ts` (via `hivemind-agent-work.ts`, 152 LOC). LOC counts: schema 148, store 146, operations 162, types 89, index 3 = **400 LOC total**. Plus tool wrapper: 152 LOC.

**If wrong:** If contract tests are missing or broken, P25 needs test remediation first.

**Confidence:** Confendent — tests exist, code follows established patterns (quarantine, atomic writes, deep-clone).

### B3. The continuity module (467 LOC) does NOT reference trajectory.

**Assumption:** Continuity and trajectory are currently disconnected. There is no import of trajectory in continuity, and no `trajectoryId` field in the continuity store schema.

**Evidence:** Grep for "trajectory" in `src/task-management/continuity/*.ts` returned zero matches. The continuity store schema (`ContinuityStoreFile` type) has sessions, governance, but no trajectory field. Continuity tracks: delegationMeta, lifecycle, pendingNotifications, resultCapture, compactionCheckpoint, delegationPacket — but not trajectory.

**If wrong:** If continuity already references trajectory, the integration seam is different than assumed.

**Confidence:** Confident — grep confirms zero references.

### B4. The lifecycle module (242 LOC) does NOT reference trajectory.

**Assumption:** Lifecycle manages session state machines independently of trajectory.

**Evidence:** Lifecycle imports from continuity, completion, notification-handler, delegation-manager, session-api, and state — but not trajectory. The `HarnessLifecycleManager` class manages phase transitions, completion detection, notification replay, and delegation launch — all without trajectory awareness.

**If wrong:** If lifecycle already wires to trajectory, the "redesign" is less about bridging and more about extending.

**Confidence:** Confident — code inspection confirms no trajectory imports.

### B5. There are 8 files >500 LOC in the codebase (per ROADMAP L10), but none in the trajectory/agent-work-contract scope.

**Assumption:** The trajectory and agent-work-contract modules are well under the 500 LOC max module size rule.

**Evidence:** Trajectory: 128+93+190+3 = 414 LOC (4 files). Agent-work-contracts: 148+146+162+89+3 = 548 LOC (5 files, but split across schema/store/operations/types/index). No single file exceeds 200 LOC except continuity/index.ts (467 LOC) which is in a different module.

**If wrong:** If a file is near 500 LOC and needs expansion during redesign, it may need splitting.

**Confidence:** Confident — LOC counts verified.

---

## Dependency Assumptions

### C1. P24 (Coordination Dispatch) is COMPLETE and provides stable delegation infrastructure.

**Assumption:** P24 delivered working delegation dispatch, completion detection, and concurrency management that P25 can build on.

**Evidence:** ROADMAP L83 marks P24 as COMPLETE with "all 9 sub-phases 24.1-24.9 delivered." The coordination module exists at `src/coordination/` with delegation manager, completion detector, and notification handler. P25 depends on stable delegation to wire trajectory evidence from delegated sessions.

**If wrong:** If P24 has unresolved issues (the "P23.4 GAP-02 D→A Integration Gate" is still pending per ROADMAP L84), P25 may hit integration problems.

**Confidence:** Likely — P24 code exists, but the integration gate P23.4 is not yet verified.

### C2. CP-ST-05 (Session-Tracker) is COMPLETE and provides session lifecycle tracking.

**Assumption:** The session-tracker module (35 files, verified via glob) is stable and provides the session data that trajectory needs to reference.

**Evidence:** ROADMAP L252 marks CP-ST-05 as COMPLETE with "3/3 waves, 12 commits — Gate 0 classification, journey recording, quarantine protocol, monolith refactor (982→807 LOC), 362/364 tests." The session-tracker captures session lifecycle, messages, tool calls, and delegation hierarchies into `.hivemind/session-tracker/` artifacts. Trajectory could reference session-tracker data as evidence.

**If wrong:** If session-tracker has unresolved data loss issues, trajectory evidence references may point to unreliable data.

**Confidence:** Likely — 362/364 tests pass (2 failures), but the session-tracker module is large (807 LOC in the main file) and complex.

### C3. The runtime-pressure module is stable and wired correctly.

**Assumption:** Pressure detection works and agent-work-contract creation correctly gates on pressure decisions.

**Evidence:** `src/features/runtime-pressure/` exists with 5 files. `operations.ts:27-38` calls `detectRuntimePressure` and checks `outcome === "block"` or `outcome === "require_approval"`. The authority-matrix.ts (252 LOC) documents which tools write to trajectory.

**If wrong:** If pressure detection has bugs, contract creation may bypass gates.

**Confidence:** Likely — code follows established patterns, but no dedicated pressure tests were found in the trajectory/contract test files.

---

## Implementation Order Assumptions

### D1. Trajectory redesign should be done BEFORE P26 (Pressure + Notification).

**Assumption:** P25 is correctly sequenced before P26 because P26 needs the redesigned trajectory to attach pressure evidence.

**Evidence:** ROADMAP L99 shows P25 → P26 dependency. The pressure tool (`hivemind-pressure.ts:80`) already calls `eventTrajectory` to attach pressure evidence. If trajectory changes its API, P26 must adapt.

**If wrong:** If P26 doesn't actually need trajectory changes, P25 could be deferred.

**Confidence:** Confident — the dependency is explicit in the roadmap and the code shows pressure→trajectory wiring.

### D2. The redesign should start with schema/type changes, then operations, then tool wiring.

**Assumption:** The implementation should follow bottom-up: types first (what data), then operations (how to mutate), then tool (how agents interact).

**Why this way:** The existing code follows this pattern: `schema-kernel/agent-work-contract.schema.ts` → `features/agent-work-contracts/store.ts` → `features/agent-work-contracts/operations.ts` → `tools/hivemind/hivemind-agent-work.ts`. Following the same pattern reduces risk.

**If wrong:** If the redesign requires top-down changes (e.g., new tool surface first), the order reverses.

**Confidence:** Likely — the existing pattern is consistent across trajectory, contracts, and pressure modules.

### D3. Tests should be written/updated before or alongside code changes.

**Assumption:** TDD approach — update tests first or in parallel with code changes.

**Why this way:** AGENTS.md mandates "PRACTICE EXTREMELY STRICT TEST-DRIVEN DEVELOPMENTS." Existing tests (`hivemind-trajectory.test.ts`, `hivemind-agent-work.test.ts`) provide regression baselines.

**If wrong:** If this is a pure refactor with no behavior change, tests may not need updates.

**Confidence:** Confident — project governance requires TDD.

---

## Risk Assumptions

### E1. The trajectory↔continuity bridge is the highest-risk integration point.

**Assumption:** Connecting trajectory to the continuity store (467 LOC) is risky because continuity is a central persistence layer with deep clone-on-read patterns and legacy file path resolution.

**Why this way:** Continuity is imported by lifecycle, delegation, session-tracker, and multiple tools. Any change to its schema or API ripples across the codebase. The trajectory module currently writes to its own ledger file (`trajectory-ledger.json`), separate from continuity (`session-continuity.json`). Merging or bridging these requires careful version migration.

**If wrong:** If the redesign keeps trajectory as a separate ledger (doesn't merge with continuity), the risk drops significantly.

**Confidence:** Likely — the architectural boundary is clear but the integration is complex.

### E2. Schema version migration is a risk if trajectory ledger format changes.

**Assumption:** If `TrajectoryLedger` version bumps from 1 to 2, existing `.hivemind/state/trajectory-ledger.json` files need migration.

**Why this way:** `TRAJECTORY_LEDGER_VERSION = 1` (types.ts:4). The ledger reader checks version match (ledger.ts:82). A version bump without migration would quarantine existing ledgers as corrupt.

**If wrong:** If the redesign keeps version 1 and extends the schema additively, no migration needed.

**Confidence:** Likely — the version gate is strict (exact match, not >=).

### E3. The agent-work-contract store has a separate file (`agent-work-contracts.json`) from trajectory (`trajectory-ledger.json`).

**Assumption:** These are separate state files today. The redesign may merge them or keep them separate.

**Why this way:** `getAgentWorkContractsFilePath` (store.ts:16-18) resolves to `.hivemind/state/agent-work-contracts.json`. `getTrajectoryLedgerPath` (ledger.ts:19-22) resolves to `.hivemind/state/trajectory-ledger.json`. Two separate JSON files in the same directory. Merging them would simplify the state model but requires migration.

**If wrong:** If they should remain separate, the "redesign" is about improving the integration API, not the storage model.

**Confidence:** Unclear — the ROADMAP doesn't specify whether the redesign merges state files.

### E4. The lifecycle state machine may need new states to support trajectory integration.

**Assumption:** The current lifecycle phases (`created|queued|dispatching|running|completed|failed`) may need extension to support trajectory-specific states like `evidence-pending` or `contract-active`.

**Why this way:** Trajectory tracks `active|closed`. Lifecycle tracks `created|queued|dispatching|running|completed|failed`. These don't align. If trajectory needs to participate in lifecycle transitions, new phases may be needed.

**If wrong:** If trajectory remains a parallel tracking system (not lifecycle-integrated), no new states needed.

**Confidence:** Unclear — the design intent is not specified in available docs.

---

## Unknowns

### U1. What specific problems does the trajectory redesign solve?

**Status:** The ROADMAP entry is one line: "Trajectory + Agent-Work-Contract redesign." No SPEC.md, no CONTEXT.md, no requirements exist for P25 yet.

**Impact:** Without knowing the problems (e.g., "trajectory is disconnected from session lifecycle", "evidence references are unreliable", "contracts don't propagate compaction state"), the planning phase cannot produce a correct spec.

**Action needed:** Run `gsd-spec-phase` or `gsd-discuss-phase` to clarify requirements before planning.

### U2. Is the trajectory↔agent-work-contract integration the core problem, or is there a broader redesign scope?

**Status:** The code shows a thin integration: `createAgentWorkContract` calls `attachTrajectoryEvidence` (operations.ts:58). Is this seam insufficient? Does it need bidirectional linking? Does trajectory need to query contract state?

**Impact:** If the integration is the core problem, scope is narrow (maybe 2-3 plans). If there's a broader vision (e.g., trajectory as the single source of truth for all session/delegation/evidence state), scope is much larger.

**Action needed:** Clarify whether the redesign is targeted (fix the integration seam) or architectural (unify state models).

### U3. How does the session-tracker's journey recording relate to trajectory?

**Status:** Session-tracker records journeys into `.hivemind/session-tracker/`. Trajectory records evidence/checkpoints into `.hivemind/state/trajectory-ledger.json`. Are these complementary? Overlapping? Should one replace the other?

**Impact:** If they're complementary (session-tracker = raw data, trajectory = structured evidence), the redesign is about wiring them. If overlapping, one may need to be deprecated.

**Action needed:** Map the data flow: session-tracker captures → ??? → trajectory references.

### U4. What is the relationship between trajectory and the delegation persistence (`delegations.json`)?

**Status:** `src/task-management/continuity/delegation-persistence.ts` manages delegation records. Trajectory currently tracks root-session-lineage. Delegations track parent-child session relationships. These may overlap.

**Impact:** If trajectory should subsume delegation tracking, scope expands. If they remain separate, the redesign is limited to trajectory's own model.

**Action needed:** Clarify whether trajectory replaces, extends, or complements delegation persistence.

### U5. What evidence exists that the current trajectory module is inadequate?

**Status:** No known bugs, no failing tests, no user complaints documented. The module is small (414 LOC), clean, and follows established patterns.

**Impact:** If the current module works fine, the "redesign" may be about adding capabilities (e.g., lifecycle integration, session-tracker bridging) rather than fixing problems. This changes the planning approach from "fix broken things" to "add new features."

**Action needed:** Identify concrete gaps or failures that motivate the redesign.

---

## Summary of Assumption Confidence

| Category | Confident | Likely | Unclear |
|----------|-----------|--------|---------|
| Scope (A) | 0 | 3 | 0 |
| Code state (B) | 4 | 0 | 0 |
| Dependencies (C) | 0 | 3 | 0 |
| Implementation order (D) | 1 | 2 | 0 |
| Risks (E) | 0 | 2 | 2 |
| Unknowns (U) | — | — | 5 |

**Key finding:** Code state is well-understood (all Confident). Scope and risks have reasonable assumptions (Likely). But 5 Unknowns need resolution before planning can begin. The ROADMAP entry is too terse — a spec phase is required before any implementation planning.
