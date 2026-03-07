# HiveMind Refactor Master Plan

**Date**: 2026-03-07
**Status**: Active
**Owner**: Root `PLAN.md` is the only human-readable Source of Truth for the refactor program.

---

## 1. Charter

This file is the sole refactor SOT.

Everything else is subordinate:

- `hivemind-comprehensive-audit-report.md` is a reference document only.
- `.opencode/` is a conditional donor surface only.
- `.hivemind/` is runtime/planning evidence, not the master plan.
- `dist/` is shipped-runtime evidence, not design authority.

The target end-state is:

1. `src/` becomes the only master code surface.
2. `.opencode/` no longer contains required runtime dependencies.
3. Redundant control planes, duplicated logic, and overlapping authorities are removed.
4. Every refactor phase follows one fixed protocol:
   `expand -> investigate -> research on knowledge detail -> decision -> sub-plan -> authorize -> execute -> gatekeeping -> atomic commit`

No future session may treat any other document as equal to this plan.

---

## 2. Validated Baseline

The following findings are accepted as validated enough to drive the refactor:

1. `src/` and `.opencode/` currently behave like overlapping governance/control planes.
   `src/index.ts` registers the main runtime hooks, while `.opencode/plugins/hiveops-governance/*` still owns entry, delegation, fallback context, event routing, and compaction-side behavior.
2. The `.opencode` fallback is only partial.
   The fallback guard suppresses message-context injection in some conditions, but it does not suppress the rest of the plugin-side control flow.
3. `dist/` is the effective shipped runtime.
   Published installs execute `dist/**`, not `src/**`, so `src` vs `dist` drift is a real architectural risk.
4. `.hivemind/` has split authority across runtime state, graph state, session records, planning artifacts, and compatibility stores.
   Some of these are active, some are stale, and some are legacy/compatibility only.
5. Session identity is fragmented.
   Current behavior mixes runtime UUIDs, manifest stamps, session profile directories, and legacy JSON export identifiers.
6. Mirror/parity checks are not reliable until owner/mirror roles are declared first.
   Source-vs-mirror ambiguity currently invalidates parity as a truth signal.

The following findings are accepted with adjustment:

1. The other team correctly identified overlap and duplication, but their report is not authoritative.
2. `.opencode/` contains useful patterns, but it is not presumed superior.
3. `.hivemind/project/planning/` remains an important evidence surface, but root `PLAN.md` supersedes it as the master refactor plan.

The following must not drive decisions unless re-validated in a specific phase:

1. Any claim that `.opencode/` should remain an independent long-term runtime layer.
2. Any claim that parity drift alone proves which side is correct.
3. Any edge-case lifecycle statement not directly corroborated by code and current state evidence.

---

## 3. Authority Ledger

| Surface | Current Role | Refactor Role | Rule |
|---|---|---|---|
| `PLAN.md` | New root master plan | Sole human-readable SOT | Always wins over reports, notes, and planning fragments |
| `src/` | Authored runtime logic | Final master code surface | Receives accepted donor logic and owns final runtime semantics |
| `.opencode/` | Mixed mirror + control plane + framework assets | Conditional donor only | Mine selectively, migrate into `src`, then remove dependency |
| `.hivemind/` | Runtime/planning evidence | Evidence + operational data | Use for validation and lifecycle mapping, not as plan authority |
| `dist/` | Shipped executable runtime | Runtime evidence | Must mirror approved `src` behavior; never define design by itself |
| `hivemind-comprehensive-audit-report.md` | External audit | Reference only | Use for claim comparison, not direct adoption |

### `.opencode` Donor Conditions

A pattern from `.opencode/` may move into `src/` only if all are true:

1. It solves a proven problem in the validated baseline.
2. It does not preserve a second runtime/control plane.
3. It can be implemented without keeping `.opencode/` as a required dependency.
4. It fits the final `src`-owned state and hook model.
5. It can be verified with tests or deterministic repo evidence.

If any condition fails, the pattern is rejected and scheduled for removal instead of migration.

---

## 4. Long-Haul Cycle Model

This refactor is a long-haul program, not a one-shot execution.

Every phase must be broken into human-authorized cycles.

Each cycle may do only one of the following:

1. tighten or correct `PLAN.md`,
2. produce one subordinate dated planning packet,
3. run one bounded investigation wave,
4. execute one approved narrow slice,
5. run one verification and closeout wave.

Cycle rules:

- no cycle may assume authorization for the next cycle
- the operator must explicitly authorize each next cycle after reviewing the prior output
- if a cycle discovers new ambiguity, drift, or contamination risk, it must stop at `sub-plan` or `gatekeeping`, not continue into execution
- no subordinate packet may compete with `PLAN.md`; packets are navigation aids, not authority sources
- each cycle must end with one explicit status: `authorized for next cycle requested`, `blocked`, `closed`, or `branch backward required`

Phase rules:

- each phase may contain multiple cycles
- each phase must begin with a sub-planning cycle before any implementation cycle
- no phase may advance forward while the current cycle is unresolved
- if a phase needs re-interpretation, update `PLAN.md` first before changing downstream packets

## 5. Skill And Agent Routing Ladder

Skills and agents must be loaded progressively, not all at once.

Mandatory skill order:

1. `using-superpowers`
   - required at the start of each cycle to determine what other skills are mandatory
2. `brainstorming`
   - required before changing plan structure, architecture, workflow shape, execution strategy, or behavior expectations
3. `spec-driven-development`
   - required when a phase or sub-phase does not yet have a validated working specification or packet
4. `writing-plans`
   - required only after the spec layer is approved and the next step is to convert it into executable tasks
5. `test-driven-development`
   - required only inside an explicitly authorized implementation cycle before production code changes

Subagent routing rules:

- read-only explorers may be used during `expand`, `investigate`, and `research on knowledge detail`
- parallel subagents may be used only when scopes are demonstrably independent
- implementation subagents may be used only after `sub-plan` is frozen and the operator has authorized execution
- no two execution agents may own overlapping file sets in the same cycle
- subagents must consume filtered evidence from the active cycle, not broad document dumps

Research validation rules:

- unstable claims about packages, agent patterns, SDKs, models, plugins, hooks, or tooling must be validated with current MCP or web-backed sources
- local repository documents may inform hypotheses, but they do not replace code evidence or current external validation for unstable topics
- if validation fails or conflicts remain unresolved, the cycle must stop and request the next authorization with the uncertainty recorded

## 6. Mandatory Refactor Protocol

Every phase and sub-phase must follow this exact order:

### Step 1: Expand

- Define the narrow phase scope.
- List touched surfaces.
- State the exact question this phase is answering.

### Step 2: Investigate

- Read the real code paths and active state evidence for only that scope.
- Build a fact set.
- Do not assume previous documents are correct.

### Step 3: Research On Knowledge Detail

- Validate unstable technical assumptions against current docs/tools when needed.
- Compare donor candidates from `.opencode/` against the fact set.
- Record what is stronger, weaker, or incompatible.

### Step 4: Decision

- Choose one authority path.
- Mark competing claims as `accepted`, `adjusted`, `rejected`, or `unverified`.
- Freeze the decision before execution starts.

### Step 5: Sub-Plan

- Translate the approved narrow slice into one bounded cycle packet or direct `PLAN.md` directive.
- Declare owned files, invariants, verification commands, stop conditions, and the exact skill/agent routing for the cycle.
- Keep the sub-plan small enough to close in one cycle.

### Step 6: Authorize

- Request explicit operator authorization before execution or before opening a new downstream packet.
- Do not treat prior authorization as reusable across cycles.
- If authorization is missing, stop here and report the ready-to-run cycle.

### Step 7: Execute

- Only implement the approved narrow slice.
- Do not expand scope mid-phase.
- Do not start the next phase while the current one is unresolved.
- Follow the skill and agent routing declared in `sub-plan`.

### Step 8: Gatekeeping

- Run the phase verification commands and evidence checks.
- Record residual risks.
- Decide either:
  - `phase closed`
  - `phase blocked`
  - `branch backward to preceding slice`

### Step 9: Atomic Commit

- If the cycle is closed and the retained changes belong to one coherent concern, commit them atomically.
- One cycle must not mix planning hardening, runtime refactors, and unrelated cleanup in the same commit.
- If the cycle is blocked, branched backward, or partially verified, do not commit; stop and request the next authorization.

No session may skip from investigation straight to execution.
No session may skip from sub-plan to execution without authorization.

---

## 7. Refactor Program Phases

### Phase 0: SOT Normalization

**Goal**: Use this file to replace competing planning authority.

**Outputs**:

- root `PLAN.md`
- accepted/adjusted/rejected claim ledger
- initial authority ledger

**Close when**:

- future sessions can operate from this file alone
- the external audit is demoted to reference-only status in practice

### Phase 1: Governance And Control-Plane Unification

**Goal**: End the dual-control-plane condition.

**Focus**:

- hook overlaps
- fallback semantics
- entry/intent/delegation duplication
- compaction and event ownership

**Decision target**:

- one `src`-owned governance flow
- no `.opencode` runtime control plane left behind

### Phase 2: State, Session, And Identity Unification

**Goal**: reduce `.hivemind/` to a coherent authority model.

**Focus**:

- brain/session model
- graph/task/session manifest relationships
- session identity normalization
- handoff/export/resume authority
- planning evidence vs runtime evidence boundaries

**Decision target**:

- one canonical identity model
- one canonical session lifecycle model
- explicit classification of active vs compat vs stale stores

### Phase 3: Tool, Command, And Donor Absorption

**Goal**: absorb valid `.opencode` patterns into `src` and burst redundancies.

**Focus**:

- duplicated tool/command domains
- donor evaluation against the conditions above
- migration of accepted logic into `src`
- deletion list for rejected or obsolete `.opencode` surfaces

**Decision target**:

- tool-centric `src` surface
- no imperative markdown command surface driving architecture

### Phase 4: Runtime, Build, And Publish Hardening

**Goal**: make shipped runtime reflect approved `src` semantics.

**Focus**:

- `src` vs `dist` parity
- build graph and publish entries
- dashboard/bin sidecars
- reinstall/reset behavior

**Decision target**:

- `dist` becomes a faithful derivative, not a drifting truth source

### Phase 5: Phasewise Cleanup And Deletion

**Goal**: remove compatibility debris only after the replacement path is proven.

**Focus**:

- leftover `.opencode` runtime dependencies
- stale session/planning/manifest stores
- duplicated scripts and dead command surfaces

**Decision target**:

- sole `src` master
- explicit retained evidence surfaces only

---

## 8. Branching Rule

A later phase may branch backward only when:

1. execution reveals a wrong upstream authority decision,
2. a donor candidate fails one of the donor conditions,
3. a gate exposes missing evidence in a prior phase.

When that happens:

- stop the current phase,
- record the exact upstream dependency that failed,
- reopen only the minimum preceding slice,
- re-close it before resuming forward motion.

No lateral expansion without a recorded branch decision.

---

## 9. Verification Gates

Every execution phase must declare and run its gate set before completion claims.

Minimum gate categories:

1. runtime authority gate
   - verifies the selected owner is the only active authority for that slice
2. donor gate
   - proves accepted `.opencode` logic no longer needs `.opencode` runtime dependency
3. drift gate
   - verifies `src` and `dist` do not disagree on shipped behavior for the slice
4. state gate
   - verifies active vs compat vs stale `.hivemind` stores are correctly classified
5. regression gate
   - verifies existing boundary tests still hold or are intentionally replaced

If a gate cannot be run yet, the phase cannot be closed as complete.
If a gate result is pending, the next cycle may be prepared but not presumed authorized.

---

## 10. Artifact Rules

Any future artifact produced under this plan must:

1. be grouped into a clear category directory,
2. use date-stamped naming,
3. state whether it is `SOT`, `reference`, `evidence`, or `temporary`.

Examples:

- `docs/audits/architecture/control-plane-ledger-2026-03-07.md`
- `docs/plans/refactor/phase-1-governance-unification-2026-03-07.md`
- `docs/plans/refactor/phase-1-cycle-1-governance-sub-plan-2026-03-07.md`
- `docs/evidence/runtime/src-dist-drift-2026-03-07.md`

No new document may silently compete with `PLAN.md`.

---

## 11. Immediate Next Moves

The next execution session must do only this:

1. use this `PLAN.md` as the sole SOT,
2. open a Phase 1 sub-planning cycle for governance/control-plane unification,
3. load skills progressively in this order as applicable: `using-superpowers -> brainstorming -> spec-driven-development`,
4. create one dated Phase 1 working packet subordinate to this file,
5. validate which `.opencode` governance behaviors are donors vs deletions,
6. refuse to treat the external audit as binding text,
7. stop and request explicit authorization before any implementation cycle begins.

If a future session cannot map its work directly to one section of this file, it must stop and re-anchor before proceeding.
