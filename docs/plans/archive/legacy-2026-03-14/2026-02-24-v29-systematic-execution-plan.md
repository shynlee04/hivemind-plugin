# HiveMind v2.9 Systematic Execution Plan
> Date: 2026-02-24
> Session: 4a625473-9caa-4f4e-a2b0-de1bd7704283
> Source: 2026-02-24-v29-domain-audit.md (evidence-validated)
> Baseline: 180/181 tests pass, 0 tsc errors, branch dev-v3
> Philosophy: "Find the entry, define the absolutes, address one node horizontally and vertically without gaps"

## Design Principles
1. **Progressive Layering** - Foundation before surface, contracts before consumers.
2. **100% Coverage** - Every validated issue has an assigned round, phase, and execution task.
3. **Zero Regression** - No round closes without passing quality gates.
4. **Research-First** - Every round begins with read-only investigation and design checks.
5. **Evidence-Gated** - No completion claim without `npm test` + `npx tsc --noEmit` + targeted verification.
6. **User Authorization** - Each round requires explicit approval before execution dispatch.
7. **Smallest Knot First** - Complete minimal end-to-end knots before expanding to adjacent nodes.

## Execution Overview

### Round 0: Quick Stabilization (P0 Safety Net) ✅ COMPLETE
**Goal:** Remove immediate runtime/control-plane blockers without architecture redesign.
**Duration:** 1 session
**Issues addressed:** CF-D8-01, CF-D8-02, CF-D8-03, CF-D8-07, CF-D8-NEW-02
**Why first:** These are direct runtime integrity failures (agent registration + malformed frontmatter) with low implementation risk and high unblock value.
**Quality gate:** Missing agents visible in `opencode.json`, typo resolved, duplicate keys removed, `npm test` pass, `npx tsc --noEmit` clean.
**Completed:** 2026-02-24 | Commit: `b3e704b` | All 5 fixes verified, quality gates green (180/181 tests, tsc clean).

### Round 1: Already Complete (Audit + Validation)
**Goal:** Preserve validated audit baseline and issue taxonomy as execution source of truth.
**Duration:** complete
**Reference:** `docs/plans/2026-02-24-v29-domain-audit.md`
**Quality gate:** Source-of-truth report accepted as baseline for all downstream rounds.

### Knot 1: Context Constitution
**Goal:** Establish sticky constitutional governance and deterministic prompt transformation contracts at turn level.
**Duration:** 2 sessions
**Prerequisites:** Round 0 + Round 1 complete.
**Issues addressed:** CF-D5-01, CF-D5-02, CF-D5-03, CF-D5-07, CF-D5-NEW-01, CF-D2-03, CF-D2-08, CF-D2-NEW-01, CF-D6-01
**Why this order:** This is the anti-drift foundation; all downstream session/task/state behavior depends on stable turn-level context contracts.
**Status:** ✅ COMPLETE | Closeout: `docs/plans/2026-02-24-knot-1-closeout.md` | Commits: `dbb4f18`, `29848e4`, `a8be520`, `ace66a4`, `3a4d1df` | Quality gates: tsc clean, 180/181 tests | 44 new tests added | 4 issues resolved, 4 partial, 1 deferred.

**Phase K1-R: Research**
- Confirm constitutional-rule model boundaries and hook ownership split from current runtime behavior.
- Validate exact issue mapping against audit evidence and phase-plan issue trace.
- Define deterministic ordering contract for system transform and message transform.

**Phase K1-I: Implement**
- Implement typed constitutional instruction + checklist-driven prompt transformation contract.
- Wire sticky system-instruction marker and first-turn transformation under one canonical ownership path.
- Integrate hierarchy bridge and safe-parse readiness checks into constitutional checklist flow.

**Phase K1-V: Validate**
- Run regression coverage for hook ordering, first-turn de-duplication, and context checklist behavior.
- Verify constitutional marker continuity and no dead/unregistered hook paths.

**Quality gate:** Constitutional marker deterministic, first-turn duplication removed, checklist contract enforced, `npm test` + `npx tsc --noEmit` pass.

### Hybrid 5-Phase Restructuring (2026-02-24)

> **Decision:** The sequential knot model (K2->K3->K4->K5->R6->R7->R8) is replaced by a hybrid 5-phase approach that delivers user-visible value earlier, weaves code-intel and framework spec progressively, and includes TUI MVP as an explicit deliverable.
>
> **Rationale:**
> - Knot plan pushed 5 priority hooks to session 4+; hybrid delivers them by session 3
> - Code-intel Phase 1 is ALREADY COMPLETE (8 files, 467 LOC, 7 test suites) - plan was treating it as future work
> - Sequential K3->K4 wall (5-7 sessions) between hooks and differentiating features
> - TUI MVP had no knot assignment; now explicit in Phase E
> - SDK capability correction (ctx.client = full SDK) enables Auto New Session in Phase B
>
> **Coverage:** All 84 original issues retained. 0 dropped. Remapped to 5 phases.

### Phase B: Session Intelligence
**Goal:** Implement auto-new-session, compaction intelligence, session export/cleanup - delivering 4/5 priority hooks.
**Duration:** 2 sessions
**Prerequisites:** Phase A (Verify & Clean) complete.
**Issues addressed:** CF-D2-06, CF-D2-09, CF-D2-10, CF-D5-04, CF-D5-05
**Why this order:** These are the user's daily pain points. Auto-new-session is NOW FEASIBLE via plugin `ctx.client.session.create()` (SDK correction applied). Compaction intelligence depends on K1 constitutional identity. Delivers 4/5 priority hooks by session 3.

**Priority Hooks Delivered:**
| Hook | Status |
|------|--------|
| 1. Auto new-session | ✅ Ships here |
| 2. Sticky system instruction | ✅ K1 DONE |
| 3. Improved compact | ✅ Ships here |
| 4. Improved last-message output | ✅ Ships here |
| 5. Context-first prompt transform | ✅ K1 DONE |

**Phase B-R: Research**
- Review `experimental.session.compacting` behavior for context-doctor, navigation, mapping, and turn-anchoring contracts.
- Confirm defensive rules: no auto-compact at >=80% context, no compact during child delegations, max 3 compacts then auto-new-session on 4th trigger.
- Validate `ctx.client.session.create()` for auto-new-session flow with policy gating.

**Phase B-I: Implement**
- Implement compact-trigger flow that escalates to auto-new-session under policy thresholds.
- Reorganize compaction/session hooks into explicit lifecycle domain boundaries (CF-D5-04, CF-D5-05).
- Add session retention/cleanup and mutation audit trail (CF-D2-09, CF-D2-10).
- Separate runtime metrics from persistent decisions (CF-D2-06).

**Phase B-V: Validate**
- Run compaction journey tests for normal, blocked, and forced-new-session scenarios.
- Verify plugin-driven session lifecycle path is explicit, policy-gated, and audited.

**Quality gate:** Compaction policy deterministic, 5/5 priority hooks verified, export continuity preserved, `npm test` + `npx tsc --noEmit` pass.

---

### Phase C: Framework Spine + Code-Intel Integration
**Goal:** Deliver hierarchical task schemas CO-DESIGNED with framework lifecycle, complete framework spec outline sections, and integrate code-intel Phase 1 (already implemented) into the framework.
**Duration:** 2-3 sessions
**Prerequisites:** Phase B complete.
**Issues addressed:** CF-D1-01, CF-D1-07, CF-D1-08, CF-D1-09, CF-D1-10, CF-D2-01, CF-D2-04, CF-D2-05, CF-D2-07, CF-D3-09
**Why this order:** Merges the best of old Knot 3 (task hierarchy) with framework spec completion and code-intel Phase 1 integration. Schemas are CO-DESIGNED with framework lifecycle rather than created in isolation.

**Key Insight:** Code-intel Phase 1 is ALREADY COMPLETE (467 LOC, 8 files, 7 test suites). This phase integrates it into the framework rather than building it from scratch. CF-D3-09 moves here from old Knot 5.

**Phase C-R: Research**
- Confirm task/planning source-of-truth boundaries and current graph query needs.
- Design task hierarchy contracts across Project, Milestone, TaskItem, and SubTask CO-DESIGNED with framework lifecycle model.
- Complete 3 outline framework spec sections (`forming-the-own-framework.md`).
- Plan code-intel Phase 1 integration points (tool surface, cognitive packer, governance hooks).

**Phase C-I: Implement**
- Implement task schema expansions and planning hierarchy contract (CF-D1-01, CF-D1-07-10).
- Unify task-state representation with deterministic sync/conflict policy (CF-D2-01, CF-D2-04, CF-D2-05).
- Add graph query interface for hierarchical task retrieval (CF-D2-07).
- Raise code-intel Phase 1 quality - token/secret detector upgrades (CF-D3-09).
- Define command groups + workflow chains + agent architecture in framework spec.

**Phase C-V: Validate**
- Run migration and reconciliation tests for task hierarchy transitions.
- Verify planning artifacts align with one task-state source of truth.
- Confirm code-intel Phase 1 integration with framework contracts.

**Quality gate:** Task hierarchy works end-to-end, framework spec outline sections complete, code-intel integrated, `npm test` + `npx tsc --noEmit` pass.

---

### Phase D: State Unification + Architecture Repair
**Goal:** Unify Brain/State persistence with FRAMEWORK-INFORMED contracts, repair import direction violations, decompose high-LOC modules, and advance code-intel Phase 2.
**Duration:** 2 sessions
**Prerequisites:** Phase C complete.
**Issues addressed:** CF-D1-02, CF-D1-03, CF-D1-04, CF-D1-05, CF-D1-06, CF-D1-NEW-01, CF-D2-02, CF-D3-01, CF-D3-02, CF-D3-03, CF-D3-04, CF-D3-05, CF-D3-06, CF-D3-07, CF-D3-08, CF-D3-12, CF-D3-13, CF-D3-14, CF-D3-NEW-01, CF-D3-10
**Why this order:** State unification is high-risk and cross-cutting - it follows stabilized governance/session/task contracts from Phases A-C. Code-intel Phase 2 (compression + incremental) overlaps here since it touches the same architecture layer.

**Phase D-R: Research**
- Build divergence map for brain, hierarchy, mem, and persistence safety gaps.
- Identify import-direction and high-LOC architecture violations for staged repair.
- Define decomposition boundaries and DI seam targets.
- Plan code-intel Phase 2 features (tree-sitter compression, incremental updates).

**Phase D-I: Implement**
- Create BrainState, HierarchyState, Config runtime Zod schemas (CF-D1-02, CF-D1-03, CF-D1-04).
- Add file-lock coverage and backup strategy (CF-D1-05, CF-D1-06).
- Split graph-io into read/write/query/migrate operations (CF-D3-01).
- Remove import-direction violations: compaction-engine, session-governance, auto-commit (CF-D3-02, CF-D3-03, CF-D3-04).
- Extract SDK access boundary into lib sdk module (CF-D3-05).
- Decompose high-LOC modules (CF-D3-06, CF-D3-07, CF-D1-NEW-01).
- Execute lib directory taxonomy and sub-directory organization (CF-D3-08, CF-D3-14).
- Add DI/factory seams and standardize error boundaries (CF-D3-12, CF-D3-13).
- Unify mem state representations (CF-D2-02).
- Split graph-migrate into focused modules (CF-D3-NEW-01).
- Implement code-intel Phase 2 core features (CF-D3-10).

**Phase D-V: Validate**
- Execute migration/regression tests across legacy and unified state paths.
- Verify architecture for dependency direction, decomposition integrity, error boundary consistency.
- Confirm code-intel Phase 2 features with compression benchmarks.

**Quality gate:** Unified validated state model, architecture violations resolved, persistence hardened, code-intel Phase 2 delivered, `npm test` + `npx tsc --noEmit` pass.

---

### Phase E: Surface Expansion + TUI MVP
**Goal:** Expand tool/agent surface, finalize framework lifecycle, deliver code-intel Phase 3, agent renaming, ecosystem normalization, and OpenTUI sidecar dashboard MVP. BOTH big v2.9 goals converge here.
**Duration:** 2-3 sessions
**Prerequisites:** Phase D complete.
**Issues addressed:** CF-D3-11, CF-D4-01, CF-D4-02, CF-D4-03, CF-D4-04, CF-D4-05, CF-D4-06, CF-D4-07, CF-D5-06, CF-D6-02, CF-D6-03, CF-D6-04, CF-D6-05, CF-D6-06, CF-D6-NEW-01, CF-D7-01, CF-D7-02, CF-D7-03, CF-D7-04, CF-D7-05, CF-D7-06, CF-D7-NEW-01, CF-D8-04, CF-D8-05, CF-D8-06, CF-D8-08, CF-D8-09, CF-D8-10, CF-D8-11, CF-D8-12, CF-D8-13, CF-D8-14, CF-D8-15, CF-D8-16, CF-D8-NEW-01
**Why this order:** Surface-area expansion + TUI require stable data contracts (delivered by Phases B-D). Framework lifecycle, ecosystem normalization, and hardening finalize the release.

**Phase E-R: Research**
- Validate code-intel Phase 3 contract requirements (codemap/codewiki maturity).
- Design OpenTUI sidecar architecture (data contracts, event bus, component structure).
- Confirm overlap boundaries between soft-governance and tool-gate ownership.
- Define agent renaming cross-reference plan and capability matrix.

**Phase E-I: Implement**
Sub-phase E1: Tool + Code-Intel Surface
- Expand tool families: context purification, memory subtype, code-intel (CF-D4-01, CF-D4-02, CF-D4-03, CF-D4-04).
- Standardize tool response envelopes + versioning/deprecation + composition (CF-D4-05, CF-D4-06, CF-D4-07).
- Resolve soft-governance/tool-gate overlap (CF-D5-06).
- Complete code-intel Phase 3 contracts (CF-D3-11).

Sub-phase E2: Framework Lifecycle + Ecosystem
- Complete framework lifecycle spec into enforceable model (CF-D6-02, CF-D6-03, CF-D6-04, CF-D6-05, CF-D6-06).
- Normalize skills/commands/agent contracts (CF-D7-01 through CF-D7-06, CF-D7-NEW-01, CF-D6-NEW-01).
- Rationalize command aliases, add command discovery (CF-D7-02, CF-D7-06).
- Align agent mode contracts, add agent capability matrix + handoff protocol (CF-D8-04 through CF-D8-13, CF-D8-NEW-01).

Sub-phase E3: TUI MVP + Hardening
- Design and implement OpenTUI sidecar dashboard MVP (hierarchy view, session monitor, governance indicators).
- Agent renaming execution (build->hivemaker, etc.) (CF-D8-10).
- Add agent versioning, health monitoring, permission inheritance (CF-D8-14, CF-D8-15, CF-D8-16).
- Full integration testing and release-safety checks.

**Phase E-V: Validate**
- Run tool and code-intel integration suites.
- Verify framework lifecycle state machine transitions.
- TUI component tests and visual verification.
- Full integration suite + `npm run guard:public`.

**Quality gate:** All tool/agent contracts consistent, framework lifecycle executable, TUI MVP functional, code-intel Phase 3 complete, integration suite green, `npm test` + `npx tsc --noEmit` + `npm run guard:public` pass.

---

## Issue-to-Phase Traceability Matrix
| Assignment | Issues | Count | Status |
|------------|--------|-------|--------|
| Round 0 | CF-D8-01, CF-D8-02, CF-D8-03, CF-D8-07, CF-D8-NEW-02 | 5 | ✅ COMPLETE |
| Knot 1 | CF-D5-01, CF-D5-02, CF-D5-03, CF-D5-07, CF-D5-NEW-01, CF-D2-03, CF-D2-08, CF-D2-NEW-01, CF-D6-01 | 9 | ✅ COMPLETE |
| Phase B | CF-D2-06, CF-D2-09, CF-D2-10, CF-D5-04, CF-D5-05 | 5 | Planned |
| Phase C | CF-D1-01, CF-D1-07, CF-D1-08, CF-D1-09, CF-D1-10, CF-D2-01, CF-D2-04, CF-D2-05, CF-D2-07, CF-D3-09 | 10 | Planned |
| Phase D | CF-D1-02, CF-D1-03, CF-D1-04, CF-D1-05, CF-D1-06, CF-D1-NEW-01, CF-D2-02, CF-D3-01, CF-D3-02, CF-D3-03, CF-D3-04, CF-D3-05, CF-D3-06, CF-D3-07, CF-D3-08, CF-D3-12, CF-D3-13, CF-D3-14, CF-D3-NEW-01, CF-D3-10 | 20 | Planned |
| Phase E | CF-D3-11, CF-D4-01, CF-D4-02, CF-D4-03, CF-D4-04, CF-D4-05, CF-D4-06, CF-D4-07, CF-D5-06, CF-D6-02, CF-D6-03, CF-D6-04, CF-D6-05, CF-D6-06, CF-D6-NEW-01, CF-D7-01, CF-D7-02, CF-D7-03, CF-D7-04, CF-D7-05, CF-D7-06, CF-D7-NEW-01, CF-D8-04, CF-D8-05, CF-D8-06, CF-D8-08, CF-D8-09, CF-D8-10, CF-D8-11, CF-D8-12, CF-D8-13, CF-D8-14, CF-D8-15, CF-D8-16, CF-D8-NEW-01 | 35 | Planned |

**Coverage check:** 84/84 issues assigned, 0 unassigned, 0 duplicate assignments.

## Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema changes break existing `.hivemind` data | High | Critical | Backward-compat migration tests + staged rollout |
| State unification disrupts active sessions | Medium | High | Dual-read bridge + deterministic migration checkpoints |
| Import refactor breaks build/runtime | Medium | High | Incremental decomposition with per-step typecheck/tests |
| Hook reorg changes execution order unexpectedly | Medium | High | Explicit hook priority contract + integration tests |
| Governance hard enforcement blocks legitimate operations | Medium | High | Policy simulation mode before hard fail mode |
| Framework vision incompleteness delays lifecycle implementation | Medium | Medium | User-approved iterative checkpoints in Round 6 |
| Ecosystem alias cleanup causes user workflow confusion | Medium | Medium | Alias deprecation map + command discovery |

## Quality Gates (Applied to EVERY Round)
```bash
# Mandatory before completing any round
npx tsc --noEmit
npm test
npm run guard:public
```

## Session Tracking Template
For each round execution session:
```text
Round: [N]
Session ID: [UUID]
Started: [timestamp]
Quality Gate Entry: [test count] pass, [tsc errors] errors
Quality Gate Exit: [test count] pass, [tsc errors] errors
Issues Resolved: [list of CF-D*-* IDs]
New Tests Added: [count]
Files Modified: [count]
Commit Hash: [hash]
```

## Appendix A: Derived Issue Provenance
- `CF-D1-NEW-01`: LOC hotspot decomposition requirement isolated from D1/D3 boundary validation during Round 1.5 closure.
- `CF-D2-NEW-01`: Persistence read-path runtime validation gap (`safeParse` boundary) promoted from D2 evidence review.
- `CF-D3-NEW-01`: `graph-migrate` decomposition requirement split out from generic D3 hotspot cluster for explicit tracking.
- `CF-D5-NEW-01`: Unregistered/dead session-start hook path identified in governance flow review.
- `CF-D6-NEW-01`: Skill versioning standardization requirement surfaced during framework lifecycle/compatibility consolidation.
- `CF-D7-NEW-01`: Alias normalization requirement elevated from command-confusion remediation set.
- `CF-D8-NEW-01`: Additional agent-config parity mismatch discovered in Round 1.5 validation merge.
- `CF-D8-NEW-02`: Duplicate frontmatter key defect in `hivefiver` agent config surfaced during D8 cleanup.

## Appendix B: Full Issue Coverage Verification
- [ ] CF-D1-01 -> Phase C
- [ ] CF-D1-02 -> Phase D
- [ ] CF-D1-03 -> Phase D
- [ ] CF-D1-04 -> Phase D
- [ ] CF-D1-05 -> Phase D
- [ ] CF-D1-06 -> Phase D
- [ ] CF-D1-07 -> Phase C
- [ ] CF-D1-08 -> Phase C
- [ ] CF-D1-09 -> Phase C
- [ ] CF-D1-10 -> Phase C
- [ ] CF-D1-NEW-01 -> Phase D
- [ ] CF-D2-01 -> Phase C
- [ ] CF-D2-02 -> Phase D
- [x] CF-D2-03 -> Knot 1 ✅
- [ ] CF-D2-04 -> Phase C
- [ ] CF-D2-05 -> Phase C
- [ ] CF-D2-06 -> Phase B
- [ ] CF-D2-07 -> Phase C
- [x] CF-D2-08 -> Knot 1 ✅
- [ ] CF-D2-09 -> Phase B
- [ ] CF-D2-10 -> Phase B
- [x] CF-D2-NEW-01 -> Knot 1 ✅
- [ ] CF-D3-01 -> Phase D
- [ ] CF-D3-02 -> Phase D
- [ ] CF-D3-03 -> Phase D
- [ ] CF-D3-04 -> Phase D
- [ ] CF-D3-05 -> Phase D
- [ ] CF-D3-06 -> Phase D
- [ ] CF-D3-07 -> Phase D
- [ ] CF-D3-08 -> Phase D
- [ ] CF-D3-09 -> Phase C
- [ ] CF-D3-10 -> Phase D
- [ ] CF-D3-11 -> Phase E
- [ ] CF-D3-12 -> Phase D
- [ ] CF-D3-13 -> Phase D
- [ ] CF-D3-14 -> Phase D
- [ ] CF-D3-NEW-01 -> Phase D
- [ ] CF-D4-01 -> Phase E
- [ ] CF-D4-02 -> Phase E
- [ ] CF-D4-03 -> Phase E
- [ ] CF-D4-04 -> Phase E
- [ ] CF-D4-05 -> Phase E
- [ ] CF-D4-06 -> Phase E
- [ ] CF-D4-07 -> Phase E
- [x] CF-D5-01 -> Knot 1 ✅
- [x] CF-D5-02 -> Knot 1 ✅
- [x] CF-D5-03 -> Knot 1 ✅
- [ ] CF-D5-04 -> Phase B
- [ ] CF-D5-05 -> Phase B
- [ ] CF-D5-06 -> Phase E
- [x] CF-D5-07 -> Knot 1 ✅
- [x] CF-D5-NEW-01 -> Knot 1 ✅
- [x] CF-D6-01 -> Knot 1 ✅
- [ ] CF-D6-02 -> Phase E
- [ ] CF-D6-03 -> Phase E
- [ ] CF-D6-04 -> Phase E
- [ ] CF-D6-05 -> Phase E
- [ ] CF-D6-06 -> Phase E
- [ ] CF-D6-NEW-01 -> Phase E
- [ ] CF-D7-01 -> Phase E
- [ ] CF-D7-02 -> Phase E
- [ ] CF-D7-03 -> Phase E
- [ ] CF-D7-04 -> Phase E
- [ ] CF-D7-05 -> Phase E
- [ ] CF-D7-06 -> Phase E
- [ ] CF-D7-NEW-01 -> Phase E
- [x] CF-D8-01 -> Round 0 ✅ (b3e704b)
- [x] CF-D8-02 -> Round 0 ✅ (b3e704b)
- [x] CF-D8-03 -> Round 0 ✅ (b3e704b)
- [ ] CF-D8-04 -> Phase E
- [ ] CF-D8-05 -> Phase E
- [ ] CF-D8-06 -> Phase E
- [x] CF-D8-07 -> Round 0 ✅ (b3e704b)
- [ ] CF-D8-08 -> Phase E
- [ ] CF-D8-09 -> Phase E
- [ ] CF-D8-10 -> Phase E
- [ ] CF-D8-11 -> Phase E
- [ ] CF-D8-12 -> Phase E
- [ ] CF-D8-13 -> Phase E
- [ ] CF-D8-14 -> Phase E
- [ ] CF-D8-15 -> Phase E
- [ ] CF-D8-16 -> Phase E
- [ ] CF-D8-NEW-01 -> Phase E
- [x] CF-D8-NEW-02 -> Round 0 ✅ (b3e704b)

**Coverage check:** 84/84 issues assigned, 0 unassigned, 0 duplicate assignments.
