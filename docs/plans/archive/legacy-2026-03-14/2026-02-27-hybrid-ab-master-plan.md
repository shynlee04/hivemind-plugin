# HYBRID-A+B Master Plan: Stabilize Context First, Then Extend Capability

> **Date**: 2026-02-27
> **Last Updated**: 2026-02-28
> **Direction**: Hybrid A+B (User-confirmed, pivoted)
> **Output Style**: Architecture/Planning
> **Version**: v2.1
> **Branch**: v-2.9-harness-dev
> **Baseline**: 215+ tests passing, `npx tsc --noEmit` clean, framework validator 1386+ PASS / 0 FAIL

---

## 1. Header Block

### Plan Identity

- Plan file: `docs/plans/2026-02-27-hybrid-ab-master-plan.md`
- Scope: Strategic execution map for post-Wave refactor alignment
- Planning model: Hybrid A+B with stabilize-first governance
- Priority model: 3-RANK problem hierarchy (RANK 1 → RANK 3)
- Execution model: Iterative traversal (not linear wave march)

### Baseline Evidence Snapshot

- Test baseline: 215/215 passing in the last deterministic health run (Evidence: anchor `wave-1-completion`, anchor `health-report-2026-02-27`)
- TypeScript baseline: 0 errors in the latest validated gate (Evidence: anchor `wave-1-completion`)
- Framework validator baseline: 1386 PASS / 0 FAIL / 8 WARN after Wave 1 completion (Evidence: anchor `wave-1-completion`)
- Current trajectory and tactic are active with drift score 70 (Evidence: `hivemind_inspect scan`, 2026-02-28)

### Why This Revision Exists

- The previous v2.0 plan encoded a linear execution model that no longer reflects project reality.
- Wave 1 completed, and previously planned Wave 2A/2B command chaining work is already achieved.
- Investigation surfaced context injection/transformation poisoning as systemic blocker #1.
- This revision locks priority to problem severity, not historical sequence.

---

## 2. Executive Summary

The project remains on **HYBRID-A+B** direction, but the execution posture has shifted from **linear delivery** to **stabilize-first remediation**.

Track A (command/workflow wiring) and Track B (planning/memory lifecycle) are still the correct architecture, but observed behavior shows that context delivery into the model is currently noisy, duplicated, and partially contradictory. That noise now dominates failure modes across command routing, planning persistence, and memory coherence.

Therefore, this plan prioritizes a **3-RANK problem hierarchy**:

1. RANK 1: Context Injection & Transformation Poisoning
2. RANK 2: Tools Routing + Mechanism Design Chain Reactions
3. RANK 3: In-Session Memory Not Auto-Parsed to Knowledge-Base

### Strategic Pivot Statement

- Old strategy: complete waves in numerical order.
- New strategy: complete remediation in rank order and only then continue capability expansion.
- Consequence: Wave identifiers are preserved for traceability, but sequencing is dependency-driven.

### Pivot Evidence

- Two independent context channels are active with no cross-channel dedup (Evidence: `src/hooks/session-lifecycle.ts:137-155`, `src/hooks/messages-transform.ts:530-544`)
- Checklist reminders are emitted in both channels (Evidence: `src/hooks/session-lifecycle.ts:66-70`, `src/hooks/messages-transform.ts:79-89`)
- Auto-realign menu injection can fire each commandless turn without strict gating (Evidence: `src/hooks/messages-transform.ts:530-533`, `src/hooks/messages-transform.ts:101-112`)
- Context compiler emits multi-section XML payload and checklist digest into synthetic context (Evidence: `src/lib/cognitive-packer.ts:391-560`)

---

## 3. 3-RANK Problem Hierarchy

This section replaces the previous "5 Validated Gaps" model.

### RANK 1: Context Injection & Transformation Poisoning (CRITICAL, #1 pain)

#### Definition

RANK 1 covers all context injections/transformations that overlap, conflict, or fail deterministic alignment with planning SOT in `SYSTEM-DIRECTIVES.md`.

#### Where It Occurs

- Session start (manual and post-compact automation)
- Main and sub sessions
- Mid-session, before and after turns
- Tool event listeners with legacy mutation paths
- Downstream session replay where polluted context recurs

#### Evidence Summary

- Two independent channels inject content into model context with no cross-channel dedup.
  - System channel: lifecycle compiler (Evidence: `src/hooks/session-lifecycle.ts:129-155`)
  - User-message channel: transform pipeline (Evidence: `src/hooks/messages-transform.ts:530-544`)
- P0 duplication: checklist contracts emitted by both channels.
  - System-side reminder (Evidence: `src/hooks/session-lifecycle.ts:66-70`)
  - Message-side reminder (Evidence: `src/hooks/messages-transform.ts:79-89`)
- P0 pollution indicators are still present in runtime output contracts.
  - Task block every turn (Evidence: `src/hooks/session-lifecycle.ts:203-210`, included in assembled lines at `src/hooks/session-lifecycle.ts:147-149`)
  - Ignored cycle counter surfaced as non-actionable noise (Evidence: generated status lines from governance signals path `src/hooks/session-lifecycle.ts:129-151` and observed runtime output)
  - Tool hints and forced menus injected in commandless conditions (Evidence: `src/hooks/messages-transform.ts:91-113`, `src/hooks/messages-transform.ts:530-533`)
- Injection footprint remains large.
  - 25 injection points in `session-lifecycle.ts` (Evidence: 3-agent trace artifact, research cache 2026-02-28)
  - 7 injection points in `messages-transform.ts` (Evidence: 3-agent trace artifact, research cache 2026-02-28)
  - 7 compiled sections in `cognitive-packer.ts` payload shape (Evidence: `src/lib/cognitive-packer.ts:391-560`, trace classification 2026-02-28)
- Token footprint is above target.
  - Steady state: 1700-6300 tokens/turn
  - First turn: 4000-8000 tokens/turn
  - Evidence source: 3-agent trace synthesis, session `research_cache` (2026-02-28)

#### Why It Is Rank 1

- This issue contaminates all later decisions and amplifies drift regardless of downstream correctness.
- It is upstream of planning materialization, routing fidelity, and memory retrieval quality.
- Stabilizing this layer is prerequisite for meaningful progress on RANK 2 and RANK 3.

---

### RANK 2: Tools Routing + Mechanism Design Chain Reactions (HIGH)

#### Definition

RANK 2 covers how framework commands/workflows/agents/scripts interact with libs/hooks/schemas to create uncontrolled write/read loops into `.hivemind/`.

#### Observed Pattern

- Tool and workflow actions trigger agent output.
- Agent output can be exported into `.hivemind/` with weak structural guards.
- Exported data can become stale/orphaned/zombie JSON.
- Later retrieval can re-inject low-quality artifacts into context.

#### Evidence Summary

- Event consumer bridge files were implemented but unwired, proving mechanism intent exists but integration safety is incomplete (Evidence: anchor `wave-alpha-complete-2026-02-28`)
- Halt findings explicitly identified dead code and phantom mutation paths in event consumers (Evidence: anchor `wave-2c-halt-findings-2026-02-28`)
- Naming overlap between framework tools and MCP tools still increases operational confusion during command routing (Evidence: operational audit notes in anchor `audit-2026-02-28`)
- Context compiler checklist includes mems presence checks and can fail on missing mem graphs, demonstrating fragile runtime assumptions (Evidence: `src/lib/cognitive-packer.ts:123-153`)

#### Why It Is Rank 2

- These chain reactions directly feed RANK 1 pollution when exported artifacts are malformed/noisy.
- Deterministic export contracts are currently insufficiently enforced at every emission site.
- Tool naming and route ambiguity produce governance/operator mistakes under pressure.

---

### RANK 3: In-Session Memory Not Auto-Parsed to Knowledge-Base (MEDIUM)

#### Definition

RANK 3 covers missing lifecycle automation that should transform session artifacts into durable, retrievable knowledge while work remains unresolved.

#### Evidence Summary

- SYSTEM-DIRECTIVES §3A auto-new-session mechanism remains unbuilt and is explicitly marked as the #1 missing mechanism by user correction (Evidence: anchor `user-correction-2026-02-28`)
- Planning directory and schemas exist, but auto-materialization is not wired end-to-end into lifecycle closure (Evidence: completed Wave 1B plus current state score table in this plan)
- Multiple sessions repeated similar delegation cycles without durable memory consolidation (Evidence: session timeline and pending-node density from `hivemind_inspect scan`)
- Checklist reminders still flag missing memory/entity artifacts depending on session state, indicating lifecycle completion is not deterministic (Evidence: `src/hooks/messages-transform.ts:573-585`, `src/lib/cognitive-packer.ts:135`)

#### Why It Is Rank 3

- This is a high-leverage stability feature but depends on clean RANK 1 channels and controlled RANK 2 exports.
- Implementing it before RANK 1 cleanup risks persisting contaminated artifacts at scale.

---

## 4. Completed Work

This section replaces old wave descriptions that are already closed.

### ✅ Completed Deliverables

- ✅ **Wave 1A**: 12/12 router commands now include `required_references` and `required_prompts`; validator upgraded accordingly.
  - Evidence: anchor `wave-1-completion`.
- ✅ **Wave 1B**: `.hivemind/project/planning/` bootstrapped with schemas, tests, and init wiring.
  - Evidence: anchor `wave-1-completion`.
- ✅ **Smart Merge Sync**: `src/cli/sync-assets.ts` preserves user-owned OpenCode frontmatter during sync.
  - Evidence: anchor `smart-merge-sync`.
- ✅ **Framework Auditor Skill Pack**: 10 files, 2811 lines; includes structural and anti-pattern detectors.
  - Evidence: anchor `framework-auditor-complete`.
- ✅ **Wave 2-P0 Audit Blockers**: S-01, D-07, D-12 remediated; `hivefiver` mode set primary→all where required.
  - Evidence: anchor `audit-2026-02-28` and subsequent remediation notes.
- ✅ **Wave α libraries complete (code quality)**:
  - `src/lib/session-intent-classifier.ts`
  - `src/lib/planning-materializer.ts`
  - `src/lib/event-consumers.ts`
  - Evidence: anchor `wave-alpha-complete-2026-02-28`.
- ✅ **Config recon complete**: 25 config fields traced; dead paths removed (`generateAgentBehaviorPrompt`, `explain_reasoning`, `be_skeptical`).
  - Evidence: anchor `wave-alpha-complete-2026-02-28` and config remediation logs.
- ✅ **Context injection 3-agent trace complete**: full pipeline from lifecycle → packer → transform classified.
  - Evidence: active tactic and action logs from `hivemind_inspect scan`, trace artifacts dated 2026-02-28.
- ✅ **Gate evidence at closeout**: 1386 PASS / 0 FAIL / 8 WARN, 215/215 tests, 0 TypeScript errors.
  - Evidence: anchor `wave-1-completion`.

### ❌ OBSOLETE / CANCELLED WORK ITEMS

- ❌ OBSOLETE: Wave 2A "bulk command chaining" as initially defined (already reached 100% chaining).
- ❌ OBSOLETE: Wave 2B "hiveminder command wiring" as an isolated dedicated wave (already achieved by prior remediation).
- ❌ OBSOLETE: Any plan segment assuming command→asset chaining remained at 27% (superseded by current state).

### Closed vs Open Clarifier

- Closed means implemented and verified within historical scope.
- Open means either unwired, partially integrated, or strategically deferred due to RANK ordering.
- Wave α is closed for implementation correctness but open for integration wiring.

---

## 5. Current State Assessment

| Domain | Score | Evidence |
|--------|-------|----------|
| Source Code | 10/10 | 215+ tests passing, 0 tsc errors (anchor `wave-1-completion`) |
| Framework Validator | 10/10 | 1386+ PASS / 0 FAIL (anchor `wave-1-completion`) |
| Command→Asset Chaining | 10/10 | 100% workflow-chained (was 27%) (anchor `wave-1-completion`, Wave 2A recon notes) |
| Agents | 9/10 | 8/8 hardened; P0 structural blockers fixed (anchor `audit-2026-02-28`) |
| Skills Registry | 9/10 | 33 skills active and cataloged (project inventory) |
| Workflows | 9/10 | 20/20 v2 compliant base workflows (project inventory) |
| Context Injection Health | 3/10 | 2 independent channels, no cross-channel dedup, P0 noise patterns (see Section 3 evidence) |
| SOT Planning Layer | 2/10 | Directory + schemas exist, but no deterministic auto-materialization loop |
| Auto-Session Mechanism | 0/10 | SYSTEM-DIRECTIVES §3A unbuilt (anchor `user-correction-2026-02-28`) |
| Memory Lifecycle | 1/10 | Tools exist but no auto-parse to durable knowledge-base |
| Progressive Disclosure | 0/10 | Runtime loader not implemented |
| Code Intelligence | 1/10 | `codemap`/`codewiki` manifests remain functionally empty |

### Assessment Notes

- Core code quality is strong; orchestration quality is mixed.
- Stability risk is concentrated in context delivery and memory lifecycle, not in compile/test health.
- Next-value work must optimize signal quality before adding feature volume.

---

## 6. Execution Waves (Sector-2 First Lock)

Waves are now ordered by the 3-RANK hierarchy and stability dependencies.

### Locked Phase Order

`S2-01 -> S2-02 -> S2-03 -> S2-MIL -> S1-01 -> S1-02 -> S1-03`

### Phase Gate Status

| Phase ID | Mapped Wave | Status | Hard Block |
|----------|-------------|--------|------------|
| S2-01 | Wave β | active_entry | none |
| S2-02 | Wave γ | blocked_by_S2-01 | S2-01 closeout |
| S2-03 | Wave δ | blocked_by_S2-01_S2-02 | S2-01 + S2-02 closeout |
| S2-MIL | (milestone) | blocked_by_S2-01_S2-02_S2-03 | all S2 transition guards + reality validation |
| S1-01 | Wave ε | BLOCKED_by_S2-MIL | S2-MIL hard unlock |
| S1-02 | Wave ζ | BLOCKED_by_S2-MIL | S2-MIL hard unlock |
| S1-03 | Post-ζ Sector-1 implementation tranche | BLOCKED_by_S2-MIL | S2-MIL hard unlock |

- `S2-MIL` is a hard unlock milestone. Sector-1 implementation cannot start or close before `S2-MIL = PASS`.

### Wave β: Context Injection Remediation (RANK 1, highest priority)

#### Objective

Eliminate duplication and pollution across context channels, then wire Wave α only after injection paths are safe.

#### Work Packages

| Knot | Task | Primary Surfaces | Notes |
|------|------|------------------|-------|
| β.1 | Remove P0 duplications (checklist duplication, deprecated SL-06 behavior, duplicate confirmation contract) | `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts` | Must preserve essential governance semantics |
| β.2 | Remove P0 pollution (SL-11 task block every turn, SL-14 ignored counter spam, SL-19 tool hint noise) | `src/hooks/session-lifecycle.ts`, helper generators | Remove only noisy, non-actionable signals |
| β.3 | Conditionalize MT-03 auto-realign | `src/hooks/messages-transform.ts` | Fire only when commandless + intent confidence threshold fails |
| β.4 | Wire Wave α libs into safe insertion points | `src/lib/event-consumers.ts`, `src/hooks/event-handler.ts`, `src/lib/session-engine.ts`, index exports | Respect existing ownership boundaries |
| β.5 | Add cross-channel dedup between lifecycle and transform channels | `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts`, shared utility | Marker-based dedup preferred over order coupling |
| β.6 | Verify with isolated tests + typecheck | `tests/*`, `npm test`, `npx tsc --noEmit` | Include regression tests for each removed signal |

#### Acceptance Criteria

- Steady-state injection volume < 1200 tokens/turn.
- Zero P0 duplications across channels.
- Zero P0 pollution signals in default path.
- Wave α integration paths active with deterministic ownership and no phantom mutations.

#### Verification Gate

- Required: `npx tsc --noEmit`
- Required: `npm test`
- Required: targeted tests for lifecycle + transform + event consumer paths
- Required: side-by-side prompt transcript diff proving reduced token payload and zero duplicated contracts

---

### Wave γ: Tools & Mechanism Hygiene (RANK 2)

#### Objective

Stop chain reactions that produce malformed or zombie `.hivemind/` artifacts and re-poison context.

#### Work Packages

| Knot | Task | Primary Surfaces | Notes |
|------|------|------------------|-------|
| γ.1 | Audit event listeners for unintended context injection triggers | `src/hooks/*`, `src/lib/*` listener paths | Trace every enqueue/dequeue path |
| γ.2 | Audit `.hivemind/` JSON for zombie/orphan patterns | `.hivemind/state`, `.hivemind/graph`, `.hivemind/memory` | Build repeatable validator script/report |
| γ.3 | Resolve framework-tool vs MCP-tool naming conflicts | command metadata, docs references, routing helpers | Keep backward compatibility aliases when needed |
| γ.4 | Add deterministic export contracts before any write to `.hivemind/` | tool write paths + schemas | Block writes that fail schema validation |
| γ.5 | Verify with full suite | `npm test`, `npx tsc --noEmit`, validator scripts | Include migration-safe checks |

#### Acceptance Criteria

- Zero unintended writes into `.hivemind/` during normal command flow.
- All export writes validated against schema before persistence.
- Tool naming ambiguity reduced to documented alias set.

#### Verification Gate

- Required: `npx tsc --noEmit`
- Required: `npm test`
- Required: deterministic write-audit report attached to wave closeout

---

### Wave δ: Auto-Session + Memory Lifecycle (RANK 3 + SYSTEM-DIRECTIVES §3A/§4)

#### Objective

Implement lifecycle automation so unresolved context remains retrievable and session continuity survives disruption.

#### Work Packages

| Knot | Task | Primary Surfaces | Notes |
|------|------|------------------|-------|
| δ.1 | Implement auto-new-session mechanism (SYSTEM-DIRECTIVES §3A) | session boundary + lifecycle tools | Start classifier-first, then full orchestration |
| δ.2 | Implement memory auto-classification (`temporary -> consolidated -> purged`) | session memory services + persistence | Preserve audit trail for purge operations |
| δ.3 | Implement session-related memory sorting (`discovery/research/planning/implementing/debug/test`) | memory classifiers + schemas | Add deterministic category mapping |
| δ.4 | Wire planning-materializer into `compact_session` for auto `STATE.md` persistence | `src/lib/planning-materializer.ts`, session tool | Must not duplicate write ownership |
| δ.5 | Implement TODO-Pending routing for off-track intentions (§4C) | transform/lifecycle + session memory | Keep off-track intents out of inline execution |
| δ.6 | Verify with isolated tests + typecheck | tests + TS gate | Cover re-entry and interruption cases |

#### Acceptance Criteria

- New sessions auto-classified with deterministic lane assignment.
- Memory artifacts auto-parsed into durable categories.
- `STATE.md` persists and updates across compaction/session boundaries.
- TODO-Pending behavior is visible, queryable, and non-disruptive.

#### Verification Gate

- Required: `npx tsc --noEmit`
- Required: `npm test`
- Required: lifecycle replay scenario proving continuity after disruption

---

### Wave ε / S1-01: Progressive Disclosure (unchanged scope, postponed, BLOCKED by S2-MIL)

#### Objective

Add disclosure-controlled loading and token budgeting after context pipeline is stable.

#### Work Packages

| Knot | Task | Primary Surfaces | Notes |
|------|------|------------------|-------|
| ε.1 | Build `skill-loader.ts` local-first resolver (bundle + disclosure + token budget) | `src/lib/skill-loader.ts` | Must support L0 default path |
| ε.2 | Implement L0 bootstrap-minimal loading | hook integration points | Governance core only on initial turn |
| ε.3 | Implement L1-L3 escalation | loader + routing context | Escalate by trigger, not by default |
| ε.4 | Enforce token budgets | loader budget controls + tests | Hard fail/soft degrade policy explicit |

#### Acceptance Criteria

- Skill loading obeys L0-L3 disclosure levels.
- Token budgets enforced and visible in diagnostics.
- No regression in baseline governance prompts.

#### Verification Gate

- Required: `npx tsc --noEmit`
- Required: `npm test`
- Required: disclosure-level simulation tests

---

### Wave ζ / S1-02: Code Intelligence + Observability (merged from old Waves 5+6, BLOCKED by S2-MIL)

#### Objective

Operationalize codemap/codewiki plus traceability for route chains and poisoning signatures.

#### Work Packages

| Knot | Task | Primary Surfaces | Notes |
|------|------|------------------|-------|
| ζ.1 | Populate codemap auto-scan | code intel tools + manifests | Ensure deterministic generation |
| ζ.2 | Populate codewiki auto-generation | code intel tools + manifests | Structured article inventory required |
| ζ.3 | Add command→workflow→skill chain trace logging | tracing lib/tool hooks | Include session and task IDs |
| ζ.4 | Add context-poisoning failure signatures | observability diagnostics | Capture duplicate/pollution patterns |

#### Acceptance Criteria

- Codemap and codewiki manifests are populated and refreshable.
- Chain traces are queryable and linked to session/task IDs.
- Poisoning signatures are detected and surfaced in diagnostics.

#### Verification Gate

- Required: `npx tsc --noEmit`
- Required: `npm test`
- Required: observability report proving trace coverage and signature detection

---

### S1-03: Sector-1 Implementation Expansion (BLOCKED by S2-MIL)

#### Objective

Execute remaining Sector-1 implementation phases only after Sector-2 reaches Robust/Safe milestone status.

#### Entry Gate

- Required: `S2-MIL = PASS`
- Required: transition guards satisfied at all S2 boundaries
- Required: reality-validation artifact set attached to S2 closeout

---

## 7. Dependency Graph

```text
[COMPLETED] Wave 1 -> Wave α -> Phase 0
                           |
                           v
                        S2-01 (Wave β) -> S2-02 (Wave γ) -> S2-03 (Wave δ) -> S2-MIL [HARD UNLOCK]
                                                                                  |
                                                                                  +-- if PASS --> S1-01 (Wave ε) -> S1-02 (Wave ζ) -> S1-03
                                                                                  |
                                                                                  +-- if FAIL --> all Sector-1 phases remain BLOCKED
```

### Dependency Rules

- S2-01 is a hard gate before any downstream phase progression.
- S2-02 may begin after S2-01 core dedup/pollution cleanup lands, but cannot close before S2-01 acceptance is complete.
- S2-03 depends on S2-01 and S2-02 artifacts being deterministic.
- S2-MIL requires closure evidence for all S2 phases and transition guard compliance.
- S1-01, S1-02, S1-03 are hard blocked until `S2-MIL = PASS`.

### Transition Guards (Boundary Enforcement)

At every phase boundary, block progression unless all guard checks pass:

- `D-02`: no bypass of required plan/gate sequence.
- `D-07`: no unvalidated structural/governance transition.
- `D-10`: no carry-forward of stale or unresolved artifacts.
- `D-13`: no broken dependency chain across parent/child levels.
- `D-14`: no session-rot progression; drift must be realigned before promotion.

Reality-validation requirement (mandatory at phase closure):

- Static checks (`npm test`, `npx tsc --noEmit`) are necessary but not sufficient.
- Closure requires agent/workflow run evidence artifacts (execution logs, run traces, boundary decisions, and linked anchors/mems).

---

## 8. Related Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| SYSTEM-DIRECTIVES | `SYSTEM-DIRECTIVES.md` | Source of truth for required framework behavior |
| PITFALLS | `docs/PITFALLS.md` | Anti-pattern catalog (28 pitfalls) |
| THE-ZERO-EVENT | `docs/THE-ZERO-EVENT.md` | Entity domains, hierarchy model, governance rules |
| Context Injection Trace | Session memory `research_cache` (2026-02-28) | Full lifecycle→packer→transform trace |
| 3-RANK Problem Framework | Session memory `scratch` (2026-02-28) | User-defined severity hierarchy |
| Wave 2C Deep Plan | `docs/plans/2026-02-28-wave-2c-deep-execution-plan.md` | Partial plan, now partially invalidated |
| Config Blast Radius | Anchor `wave-alpha-complete-2026-02-28` | Classification of config fields and removals |

### Artifact Usage Rules

- Treat `SYSTEM-DIRECTIVES.md` as behavioral source of truth for lifecycle and memory obligations.
- Treat session trace artifacts as execution evidence for ranking and acceptance definitions.
- Treat old wave plans as historical references only when they conflict with current rank ordering.

---

## 9. Decision Locks

1. Root assets remain source of truth; `.opencode/` is mirror/deploy surface.
2. All core commands remain router-based with explicit execution context.
3. Planning artifacts remain under `.hivemind/project/planning/`.
4. Tiered workflow contract remains: orchestration-heavy for hiveminder, minimal for persona utility flows.
5. Progressive disclosure defaults to L0 and only escalates on explicit trigger.
6. `STATE.md` is persistent project-level state and survives compaction boundaries.
7. Every wave requires independent verification (`npm test` + `npx tsc --noEmit` + wave-specific checks).
8. Sync parity and schema integrity checks remain mandatory at wave boundaries.
9. **NEW**: `S2-MIL` is the hard unlock gate for all Sector-1 implementation phases.
10. **NEW**: 3-RANK hierarchy is the official priority order; do not skip ranks.
11. **NEW**: Wave α libs stay unwired until Wave β cleans the injection path they plug into.
12. **NEW**: Phase closure requires reality-validation artifacts from agent/workflow runs; static lint/type/test gates alone do not close a phase.
13. **NEW**: This master plan is a living traversal artifact; execute iteratively, not linearly.

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Workflow file volume and maintenance overhead | HIGH | MEDIUM | Keep tier boundaries strict; template shared patterns |
| Regression while removing noisy context signals | HIGH | HIGH | Isolated regression test per removed signal path |
| Breaking governance semantics during dedup | MEDIUM | HIGH | Marker-based dedup + transcript diff verification |
| Planning materializer coupling with session closure | MEDIUM | HIGH | Phase rollout: classifier first, full write loop second |
| Parity sync drift during iterative waves | HIGH | LOW | Run sync verification at each wave close |
| Context injection cleanup may remove signals agents currently depend on | HIGH | HIGH | Guard removals behind tests and fallback flags |
| Auto-session mechanism complexity | MEDIUM | HIGH | Start with low-risk classifier and strict acceptance gates |
| Cross-channel dedup requiring ordering changes | LOW | HIGH | Use channel markers, avoid hook order dependence |
| Zombie JSON remediation accidentally purging useful state | MEDIUM | MEDIUM | Add quarantine mode before hard deletion |
| Observability noise from over-instrumentation | MEDIUM | MEDIUM | Define compact trace schema with severity filters |

### Risk Escalation Triggers

- Any regression in baseline tests or TypeScript gate.
- Any increase in steady-state token budget after β changes.
- Any false-positive schema blocks in export paths that halt valid workflows.

### Risk Response Policy

- On high-impact regression: rollback wave knot, preserve evidence, re-enter with narrower change-set.
- On medium-impact degradation: keep partial deployment only if deterministic behavior and safety gates remain green.

---

## 11. Assumptions

1. Sector-1 runtime code is stable at compile/test level, but context injection path has known pollution requiring remediation.
2. Existing workflow v2 contracts remain valid and can support remediation-first sequencing.
3. Wave α libs are bug-free and ready to wire once context channels are cleaned.
4. Auto-session implementation can be phased without breaking active lifecycle operations.
5. Planning materialization remains additive and should respect tool ownership boundaries.
6. Dashboard-v2 and unrelated tracks remain out of scope for this master plan.
7. 31 pre-existing `sync-assets` test failures are deferred and unrelated to this wave sequence.
8. Historical anchors and session traces are sufficient to reconstruct the strategic pivot without re-opening closed waves.
9. The plan will be iteratively updated as each wave acceptance criterion is met.

---

## 12. Execution Protocol

The original protocol is retained and extended for rank-first execution.

### Core Protocol (retained)

1. Each wave starts with `declare_intent` and `map_context(tactic)`.
2. Each knot uses explicit scope, constraints, acceptance criteria, and evidence requirements.
3. Each wave ends with verification gate (`npm test`, `npx tsc --noEmit`, plus wave-specific validators).
4. User authorization is required between major wave boundaries.
5. Framework validation must remain zero-fail at all gate boundaries.

### Rank-First Additions

6. Do not start RANK 2 work until RANK 1 acceptance criteria are met.
7. Do not start RANK 3 automation until RANK 2 export hygiene is deterministic.
8. Track and publish token-footprint deltas before and after Wave β knots.
9. Keep an explicit rollback plan per knot to avoid broad reverts.
10. Treat all unresolved off-track intents as TODO-Pending, not inline execution.

### Wave Closeout Template (required)

At the end of each wave, publish:

- Scope completed vs deferred
- Gate results (`npm test`, `npx tsc --noEmit`, validator outputs)
- Reality-validation artifacts (agent/workflow run logs, traces, and linked anchors/mems)
- Token/trace delta (for β and γ)
- Files changed and ownership validation
- Risk outcomes and follow-up actions

---

## Appendix A: Evidence Register

| ID | Evidence | Source |
|----|----------|--------|
| EV-01 | Dual-channel system injection path exists | `src/hooks/session-lifecycle.ts:129-155` |
| EV-02 | Checklist reminder emitted from lifecycle channel | `src/hooks/session-lifecycle.ts:66-70` |
| EV-03 | Task block injected each turn by lifecycle compiler | `src/hooks/session-lifecycle.ts:203-210`, assembled at `src/hooks/session-lifecycle.ts:147-149` |
| EV-04 | Auto-realign reminder construction exists in transform channel | `src/hooks/messages-transform.ts:91-113` |
| EV-05 | Auto-realign reminder injection trigger exists | `src/hooks/messages-transform.ts:530-533` |
| EV-06 | Cognitive packer injected by transform channel | `src/hooks/messages-transform.ts:535-539` |
| EV-07 | Anchor context injection exists in transform channel | `src/hooks/messages-transform.ts:541-544` |
| EV-08 | Checklist builder exists in transform channel | `src/hooks/messages-transform.ts:79-89` |
| EV-09 | Entity checklist failures are appended to pre-stop checklist | `src/hooks/messages-transform.ts:573-585` |
| EV-10 | Context compiler includes checklist digest and missing keys | `src/lib/cognitive-packer.ts:123-153` |
| EV-11 | Compiled XML includes trajectory, anchors, mems, anti-patterns, context summary | `src/lib/cognitive-packer.ts:391-560` |
| EV-12 | `mems_presence` is a required checklist key | `src/lib/cognitive-packer.ts:135` |
| EV-13 | Wave 1 deterministic gate metrics | anchor `wave-1-completion` |
| EV-14 | Smart merge preservation implemented | anchor `smart-merge-sync` |
| EV-15 | Framework auditor package completion | anchor `framework-auditor-complete` |
| EV-16 | Strategic correction: auto-new-session is top unbuilt mechanism | anchor `user-correction-2026-02-28` |
| EV-17 | Wave α complete but unwired finding | anchor `wave-alpha-complete-2026-02-28` |
| EV-18 | Halt findings: dead code and phantom mutation queue markers | anchor `wave-2c-halt-findings-2026-02-28` |
| EV-19 | Active hierarchy/tactic/action and drift score | `hivemind_inspect scan` (2026-02-28) |
| EV-20 | Validator/test/ts baseline from health anchors | anchor `health-report-2026-02-27` |

---

## Appendix B: Obsolescence Ledger

| Item | Status | Replacement |
|------|--------|-------------|
| Old Wave 2A command-chain backlog | ❌ OBSOLETE | Closed under Completed Work + rank-first β entry |
| Old Wave 2B hiveminder wiring backlog | ❌ OBSOLETE | Closed under Completed Work + rank-first β entry |
| "27% chaining" baseline narrative | ❌ OBSOLETE | Updated 10/10 chaining state |
| Linear 1→6 wave assumption | ❌ OBSOLETE | Dependency graph with β/γ/δ/ε/ζ ordering |

---

## Appendix C: Acceptance Checklist by Wave

### Wave β Checklist

- [ ] P0 duplication removed from both channels
- [ ] P0 pollution removed from default path
- [ ] Auto-realign conditionalized
- [ ] Wave α integration points wired safely
- [ ] Cross-channel dedup active
- [ ] Steady-state injection < 1200 tokens/turn
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

### Wave γ Checklist

- [ ] Event listeners audited for unintended triggers
- [ ] Zombie/orphan JSON patterns cataloged and remediated
- [ ] Tool naming conflicts resolved/documented
- [ ] Export contracts validated before write
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

### Wave δ Checklist

- [ ] Auto-new-session mechanism implemented
- [ ] Memory auto-classification implemented
- [ ] Category sorting implemented
- [ ] `STATE.md` auto-persistence on compaction
- [ ] TODO-Pending lifecycle implemented
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

### Wave ε/ζ Checklist (condensed)

- [ ] Progressive disclosure loader delivered (L0-L3 + token budget)
- [ ] Codemap/codewiki population delivered
- [ ] Chain trace + poisoning signatures delivered
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass
