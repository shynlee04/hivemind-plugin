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

### Restructuring Note (2026-02-24)
- Rounds 2-5 are replaced by domain-knots that co-design schemas, hooks, and libs in vertical slices instead of layer-by-layer waves.
- This follows the validated execution philosophy: "Find the entry, define the absolutes, address one node horizontally and vertically without gaps, solve one complete smallest knot before spreading to neighbors."
- Knots 1-5 are domain-focused vertical slices; Rounds 6-8 remain broader lifecycle, ecosystem, and hardening passes.

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

### Knot 2: Session Intelligence
**Goal:** Implement auto-new-session and compaction/session-export intelligence with SDK-safe constraints.
**Duration:** 2 sessions
**Prerequisites:** Knot 1 complete.
**Issues addressed:** CF-D2-06, CF-D2-09, CF-D2-10, CF-D5-04, CF-D5-05
**Why this order:** Session compaction/lifecycle continuity depends on Knot 1 constitutional identity and checklist continuity marker.

**Phase K2-R: Research**
- Review `experimental.session.compacting` behavior for context-doctor, navigation, mapping, and turn-anchoring contracts.
- Confirm defensive rules: no auto-compact at >=80% context, no compact during child delegations, max 3 compacts then auto-new-session on the 4th trigger.
- Validate constraint boundary: plugins cannot create sessions programmatically.

**Phase K2-I: Implement**
- Implement compact-trigger flow that escalates to auto-new-session under policy thresholds.
- Reorganize compaction/session hooks into explicit lifecycle domain boundaries.
- Add session retention/cleanup and mutation audit trail behavior tied to compact lifecycle.

**Phase K2-V: Validate**
- Run compaction journey tests for normal, blocked, and forced-new-session scenarios.
- Verify no programmatic session creation path is introduced by plugin logic.

**Quality gate:** Compaction policy deterministic, export continuity preserved, session lifecycle constraints enforced, `npm test` + `npx tsc --noEmit` pass.

### Knot 3: Task Hierarchy & Planning Framework
**Goal:** Deliver hierarchical task schema and planning SOT task-state contracts.
**Duration:** 2-3 sessions
**Prerequisites:** Knot 2 complete.
**Issues addressed:** CF-D1-01, CF-D1-07, CF-D1-08, CF-D1-09, CF-D1-10, CF-D2-01, CF-D2-04, CF-D2-05, CF-D2-07
**Why this order:** Hierarchical planning requires stable constitutional context (K1) and reliable session boundaries/compaction semantics (K2).

**Phase K3-R: Research**
- Confirm task/planning source-of-truth boundaries and current graph query needs.
- Design task hierarchy contracts across Project, Milestone, TaskItem, and SubTask.
- Validate migration approach from existing task representations.

**Phase K3-I: Implement**
- Implement task schema expansions and planning hierarchy contract.
- Unify task-state representation and introduce deterministic synchronization/conflict policy.
- Add graph query interface for hierarchical task retrieval.

**Phase K3-V: Validate**
- Run migration and reconciliation tests for task hierarchy transitions.
- Verify planning artifacts align with one task-state source of truth.

**Quality gate:** Task hierarchy works end-to-end with deterministic sync/query behavior, `npm test` + `npx tsc --noEmit` pass.

### Knot 4: State Unification & Persistence
**Goal:** Refactor Brain/State persistence contracts into one validated architecture with safety guardrails.
**Duration:** 3-4 sessions
**Prerequisites:** Knot 3 complete.
**Issues addressed:** CF-D1-02, CF-D1-03, CF-D1-04, CF-D1-05, CF-D1-06, CF-D1-NEW-01, CF-D2-02, CF-D3-01 through CF-D3-08, CF-D3-12, CF-D3-13, CF-D3-14, CF-D3-NEW-01
**Why this order:** State unification is cross-cutting and high-risk; it should follow stabilized governance/session/task contracts from Knots 1-3.

**Phase K4-R: Research**
- Build divergence map for brain, hierarchy, mem, and persistence safety gaps.
- Identify import-direction and high-LOC architecture violations for staged repair.
- Define decomposition boundaries and DI seam targets.

**Phase K4-I: Implement**
- Unify mem/brain/hierarchy persistence contracts with runtime validation safety.
- Repair import-direction violations and decompose high-LOC modules.
- Add file-lock/backup hardening and directory/domain restructuring.

**Phase K4-V: Validate**
- Execute migration/regression tests across legacy and unified state paths.
- Verify architecture checks for dependency direction, decomposition integrity, and error boundary consistency.

**Quality gate:** Unified validated state model with architecture violations resolved and persistence safety hardened, `npm test` + `npx tsc --noEmit` pass.

### Knot 5: Code Intelligence & Ecosystem Surface
**Goal:** Deliver code-intel maturity and tool/agent surface expansion on top of stabilized core architecture.
**Duration:** 2-3 sessions
**Prerequisites:** Knot 4 complete.
**Issues addressed:** CF-D4-01 through CF-D4-07, CF-D5-06, CF-D3-09, CF-D3-10, CF-D3-11
**Why this order:** Surface-area expansion is safest after governance, session lifecycle, hierarchy, and persistence are stable.

**Phase K5-R: Research**
- Validate code-intel maturity gaps and tool-surface contract requirements.
- Confirm overlap boundaries between soft-governance and tool-gate ownership.
- Define agent/tool naming and envelope/versioning strategy.

**Phase K5-I: Implement**
- Expand tool families (context purification, memory subtype, code-intel) and response envelope standards.
- Resolve soft-governance/tool-gate overlap with explicit responsibility contract.
- Implement code-intel maturity phases and agent-surface contract updates.

**Phase K5-V: Validate**
- Run tool and code-intel integration suites with governance overlap regression checks.
- Verify agent/tool contract consistency across documentation and runtime registration.

**Quality gate:** Code-intel maturity milestones achieved with consistent tool/agent contracts, `npm test` + `npx tsc --noEmit` pass.

### Round 6: Framework Lifecycle (D6)
**Goal:** Finalize framework lifecycle model and command/state transitions.
**Duration:** 1-2 sessions
**Prerequisites:** Knot 5 complete.
**Issues addressed:** CF-D6-02 through CF-D6-06

- Complete framework vision draft into enforceable lifecycle spec.
- Merge duplicate enterprise workflows.
- Add missing lifecycle command families and state machine transition rules.
- Introduce framework versioning/compatibility contract.

**Quality gate:** Lifecycle flow is explicit, versioned, and command-complete for planned operation modes.

### Round 7: Ecosystem Surface (D7 + D8)
**Goal:** Normalize skills/commands/agent contracts for reliable day-to-day operation.
**Duration:** 2 sessions
**Prerequisites:** Round 6 complete.
**Issues addressed:** CF-D7-01 through CF-D7-06, CF-D8-04 through CF-D8-06, CF-D8-08 through CF-D8-13, CF-D6-NEW-01, CF-D7-NEW-01, CF-D8-NEW-01

- Repair missing skill assets and define skill dependency declarations.
- Rationalize command aliases and add command discovery.
- Fix mode/config mismatches and introduce capability matrix + handoff protocol.
- Implement `hiveplanner` and finalize naming/conventions decision paths.

**Quality gate:** Skills and commands are discoverable, consistent, and agent contracts are explicit.

### Round 8: Hardening + Integration Testing
**Goal:** Complete platform hardening, observability, and integration confidence for v2.9 expansion.
**Duration:** 2 sessions
**Prerequisites:** Round 7 complete.
**Issues addressed:** CF-D8-14, CF-D8-15, CF-D8-16

- Add agent versioning, health monitoring, and permission inheritance model.
- Execute full integration test suite and release-safety checks.

**Quality gate:** Integration suite green, observability in place, branch/public guard verified.

## Issue-to-Round Traceability Matrix
| Issue ID | Round | Phase | Task Description | Dependencies |
|----------|-------|-------|------------------|--------------|
| CF-D1-01 | Knot 3 | K3-I | Create TaskItem runtime Zod schema | Knot 2 |
| CF-D1-02 | Knot 4 | K4-I | Create BrainState runtime Zod schema | Knot 3 |
| CF-D1-03 | Knot 4 | K4-I | Create HierarchyState runtime Zod schema | Knot 3 |
| CF-D1-04 | Knot 4 | K4-I | Create Config runtime Zod schema | Knot 3 |
| CF-D1-05 | Knot 4 | K4-I | Add missing file-lock coverage for JSON state files | CF-D1-02..04 |
| CF-D1-06 | Knot 4 | K4-I | Implement backup strategy for uncovered JSON files | CF-D1-05 |
| CF-D1-07 | Knot 3 | K3-R | Expand schema coverage beyond graph-nodes.ts for task hierarchy | CF-D1-01 |
| CF-D1-08 | Knot 3 | K3-R | Define schema versioning + migration contract for planning entities | CF-D1-07 |
| CF-D1-09 | Knot 3 | K3-R | Introduce BaseNode shared schema conventions for planning graph | CF-D1-07 |
| CF-D1-10 | Knot 3 | K3-I | Add missing v2.9 task hierarchy schemas (Project/Milestone/SubTask) | CF-D1-08, CF-D1-09 |
| CF-D1-NEW-01 | Knot 4 | K4-I | Decompose hierarchy-tree high-LOC hotspot into modules | Knot 3 |
| CF-D2-01 | Knot 3 | K3-I | Unify task state representations | Knot 2 |
| CF-D2-02 | Knot 4 | K4-I | Unify mem state representations | Knot 3 |
| CF-D2-03 | Knot 1 | K1-I | Define 3-level to 6-level hierarchy bridge in constitutional checklist | Round 1 |
| CF-D2-04 | Knot 3 | K3-I | Implement deterministic synchronization or remove dual-path need for tasks | CF-D2-01 |
| CF-D2-05 | Knot 3 | K3-I | Add conflict resolution policy for task divergence | CF-D2-04 |
| CF-D2-06 | Knot 2 | K2-I | Separate runtime metrics from persistent decisions in session intelligence flow | Knot 1 |
| CF-D2-07 | Knot 3 | K3-I | Introduce graph query interface for relational task state | CF-D2-01 |
| CF-D2-08 | Knot 1 | K1-I | Enforce validation on state directory read paths via checklist gate | Round 1 |
| CF-D2-09 | Knot 2 | K2-I | Add session retention/cleanup policy | Knot 1 |
| CF-D2-10 | Knot 2 | K2-I | Add event sourcing/audit trail for session/state mutations | Knot 1 |
| CF-D2-NEW-01 | Knot 1 | K1-I | Add safeParse validation at persistence load boundary | Round 0 |
| CF-D3-01 | Knot 4 | K4-I | Split graph-io into read/write/query/migrate operations | Knot 3 |
| CF-D3-02 | Knot 4 | K4-I | Remove compaction-engine import violation (lib -> hooks) | Knot 3 |
| CF-D3-03 | Knot 4 | K4-I | Remove session-governance import violation (lib -> hooks) | Knot 3 |
| CF-D3-04 | Knot 4 | K4-I | Remove auto-commit import violation (lib -> hooks) | Knot 3 |
| CF-D3-05 | Knot 4 | K4-I | Extract SDK access boundary into lib sdk module | CF-D3-02..04 |
| CF-D3-06 | Knot 4 | K4-I | Decompose cognitive-packer/session-engine/hierarchy-tree hotspots | CF-D3-01 |
| CF-D3-07 | Knot 4 | K4-I | Decompose remaining >300 LOC strategic hotspot modules | CF-D3-06 |
| CF-D3-08 | Knot 4 | K4-I | Introduce sub-directory organization in src/lib | CF-D3-01 |
| CF-D3-09 | Knot 5 | K5-I | Raise code-intel phase 1 quality (token/secret detector upgrades) | Knot 4 |
| CF-D3-10 | Knot 5 | K5-I | Implement phase 2 code-intel core features | CF-D3-09 |
| CF-D3-11 | Knot 5 | K5-I | Complete phase 3 code-intel contracts (codemap/codewiki maturity) | CF-D3-10 |
| CF-D3-12 | Knot 4 | K4-I | Add dependency injection/factory seams in lib layer | CF-D3-08 |
| CF-D3-13 | Knot 4 | K4-I | Standardize lib error boundary behavior | CF-D3-08 |
| CF-D3-14 | Knot 4 | K4-I | Execute proposed lib directory taxonomy | CF-D3-08 |
| CF-D3-NEW-01 | Knot 4 | K4-I | Split graph-migrate into focused migration modules | Knot 3 |
| CF-D4-01 | Knot 5 | K5-I | Expand tool surface beyond 6 canonical tools | Knot 4 |
| CF-D4-02 | Knot 5 | K5-I | Add context purification tool family | CF-D4-01 |
| CF-D4-03 | Knot 5 | K5-I | Add in-session memory subtype tools | CF-D4-01 |
| CF-D4-04 | Knot 5 | K5-I | Add code-intel tool family | Knot 4 |
| CF-D4-05 | Knot 5 | K5-I | Standardize tool response envelopes | CF-D4-01 |
| CF-D4-06 | Knot 5 | K5-I | Add tool versioning/deprecation mechanism | CF-D4-05 |
| CF-D4-07 | Knot 5 | K5-I | Add tool composition pattern | CF-D4-05 |
| CF-D5-01 | Knot 1 | K1-I | Implement constitutional hard-governance contract through tool-gate path | Round 1 |
| CF-D5-02 | Knot 1 | K1-I | Remove duplicate first-turn handling paths | CF-D5-01 |
| CF-D5-03 | Knot 1 | K1-I | Resolve session_coherence orphan registration gap | CF-D5-02 |
| CF-D5-04 | Knot 2 | K2-I | Introduce hook sub-directory structure for session/compaction domain | Knot 1 |
| CF-D5-05 | Knot 2 | K2-I | Apply hook taxonomy for lifecycle/governance/context/events/infrastructure | CF-D5-04 |
| CF-D5-06 | Knot 5 | K5-I | Resolve soft-governance and tool-gate responsibility overlap | Knot 4 |
| CF-D5-07 | Knot 1 | K1-I | Add explicit hook priority/ordering mechanism | CF-D5-01 |
| CF-D5-NEW-01 | Knot 1 | K1-I | Remove or register dead createMainSessionStartHook path | CF-D5-03 |
| CF-D6-01 | Knot 1 | K1-I | Complete framework constitutional slice into executable spec baseline | Round 1 |
| CF-D6-02 | 6 | 6A | Merge duplicate enterprise workflow definitions | Knot 5 |
| CF-D6-03 | 6 | 6B | Add missing GSD-equivalent lifecycle commands | CF-D6-02 |
| CF-D6-04 | 6 | 6B | Add missing command groups (Code-Intel, Settings, Milestone, Phase) | CF-D6-03 |
| CF-D6-05 | 6 | 6C | Define lifecycle state machine and transitions | CF-D6-02 |
| CF-D6-06 | 6 | 6C | Add framework versioning + compatibility layer | CF-D6-05 |
| CF-D6-NEW-01 | 7 | 7B | Standardize skill versioning policy in ecosystem contracts | Round 6 |
| CF-D7-01 | 7 | 7A | Restore missing skill assets declared by SKILL.md contracts | Round 6 |
| CF-D7-02 | 7 | 7B | Rationalize command alias overlap and ambiguity | Round 6 |
| CF-D7-03 | 7 | 7B | Consolidate gatekeeping triad overlap | CF-D7-02 |
| CF-D7-04 | 7 | 7A | Add skill dependency declaration model | CF-D7-01 |
| CF-D7-05 | 7 | 7A | Add skill compatibility/version checks | CF-D7-04 |
| CF-D7-06 | 7 | 7B | Implement command discovery mechanism | CF-D7-02 |
| CF-D7-NEW-01 | 7 | 7B | Normalize alias command conventions and migration hints | CF-D7-02 |
| CF-D8-01 | 0 | 0A | ✅ Register hiveminder in opencode.json | None |
| CF-D8-02 | 0 | 0A | ✅ Register debug agent in opencode.json | None |
| CF-D8-03 | 0 | 0A | ✅ Register hivemind-brownfield-orchestrator in opencode.json | None |
| CF-D8-04 | 7 | 7C | Align build agent mode contract across MD and JSON | Round 6 |
| CF-D8-05 | 7 | 7C | Align code-review agent mode contract across MD and JSON | Round 6 |
| CF-D8-06 | 7 | 7C | Align scanner hidden/mode contract across MD and JSON | Round 6 |
| CF-D8-07 | 0 | 0A | ✅ Fix `alllow` typo in hivefiver agent frontmatter | None |
| CF-D8-08 | 7 | 7C | Add explicit tools block for debug agent | CF-D8-02 |
| CF-D8-09 | 7 | 7C | Define canonical agent directory and de-duplicate agent sources | CF-D8-04..08 |
| CF-D8-10 | 7 | 7C | Decide and execute agent renaming cross-reference plan | CF-D8-09 |
| CF-D8-11 | 7 | 7C | Add agent capability matrix | CF-D8-09 |
| CF-D8-12 | 7 | 7C | Add agent handoff protocol | CF-D8-11 |
| CF-D8-13 | 7 | 7C | Implement hiveplanner subagent with strict permissions | CF-D8-11 |
| CF-D8-14 | 8 | 8B | Add agent versioning + compatibility declarations | Round 7 |
| CF-D8-15 | 8 | 8B | Add agent health/performance monitoring | Round 7 |
| CF-D8-16 | 8 | 8B | Add permission inheritance model for agent configs | Round 7 |
| CF-D8-NEW-01 | 7 | 7C | Resolve additional surfaced agent-config parity mismatch | Round 6 |
| CF-D8-NEW-02 | 0 | 0A | ✅ Remove duplicate frontmatter keys in hivefiver agent file | None |

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
- [ ] CF-D1-01 -> Knot 3
- [ ] CF-D1-02 -> Knot 4
- [ ] CF-D1-03 -> Knot 4
- [ ] CF-D1-04 -> Knot 4
- [ ] CF-D1-05 -> Knot 4
- [ ] CF-D1-06 -> Knot 4
- [ ] CF-D1-07 -> Knot 3
- [ ] CF-D1-08 -> Knot 3
- [ ] CF-D1-09 -> Knot 3
- [ ] CF-D1-10 -> Knot 3
- [ ] CF-D1-NEW-01 -> Knot 4
- [ ] CF-D2-01 -> Knot 3
- [ ] CF-D2-02 -> Knot 4
- [ ] CF-D2-03 -> Knot 1
- [ ] CF-D2-04 -> Knot 3
- [ ] CF-D2-05 -> Knot 3
- [ ] CF-D2-06 -> Knot 2
- [ ] CF-D2-07 -> Knot 3
- [ ] CF-D2-08 -> Knot 1
- [ ] CF-D2-09 -> Knot 2
- [ ] CF-D2-10 -> Knot 2
- [ ] CF-D2-NEW-01 -> Knot 1
- [ ] CF-D3-01 -> Knot 4
- [ ] CF-D3-02 -> Knot 4
- [ ] CF-D3-03 -> Knot 4
- [ ] CF-D3-04 -> Knot 4
- [ ] CF-D3-05 -> Knot 4
- [ ] CF-D3-06 -> Knot 4
- [ ] CF-D3-07 -> Knot 4
- [ ] CF-D3-08 -> Knot 4
- [ ] CF-D3-09 -> Knot 5
- [ ] CF-D3-10 -> Knot 5
- [ ] CF-D3-11 -> Knot 5
- [ ] CF-D3-12 -> Knot 4
- [ ] CF-D3-13 -> Knot 4
- [ ] CF-D3-14 -> Knot 4
- [ ] CF-D3-NEW-01 -> Knot 4
- [ ] CF-D4-01 -> Knot 5
- [ ] CF-D4-02 -> Knot 5
- [ ] CF-D4-03 -> Knot 5
- [ ] CF-D4-04 -> Knot 5
- [ ] CF-D4-05 -> Knot 5
- [ ] CF-D4-06 -> Knot 5
- [ ] CF-D4-07 -> Knot 5
- [ ] CF-D5-01 -> Knot 1
- [ ] CF-D5-02 -> Knot 1
- [ ] CF-D5-03 -> Knot 1
- [ ] CF-D5-04 -> Knot 2
- [ ] CF-D5-05 -> Knot 2
- [ ] CF-D5-06 -> Knot 5
- [ ] CF-D5-07 -> Knot 1
- [ ] CF-D5-NEW-01 -> Knot 1
- [ ] CF-D6-01 -> Knot 1
- [ ] CF-D6-02 -> Round 6
- [ ] CF-D6-03 -> Round 6
- [ ] CF-D6-04 -> Round 6
- [ ] CF-D6-05 -> Round 6
- [ ] CF-D6-06 -> Round 6
- [ ] CF-D6-NEW-01 -> Round 7
- [ ] CF-D7-01 -> Round 7
- [ ] CF-D7-02 -> Round 7
- [ ] CF-D7-03 -> Round 7
- [ ] CF-D7-04 -> Round 7
- [ ] CF-D7-05 -> Round 7
- [ ] CF-D7-06 -> Round 7
- [ ] CF-D7-NEW-01 -> Round 7
- [x] CF-D8-01 -> Round 0 ✅ (b3e704b)
- [x] CF-D8-02 -> Round 0 ✅ (b3e704b)
- [x] CF-D8-03 -> Round 0 ✅ (b3e704b)
- [ ] CF-D8-04 -> Round 7
- [ ] CF-D8-05 -> Round 7
- [ ] CF-D8-06 -> Round 7
- [x] CF-D8-07 -> Round 0 ✅ (b3e704b)
- [ ] CF-D8-08 -> Round 7
- [ ] CF-D8-09 -> Round 7
- [ ] CF-D8-10 -> Round 7
- [ ] CF-D8-11 -> Round 7
- [ ] CF-D8-12 -> Round 7
- [ ] CF-D8-13 -> Round 7
- [ ] CF-D8-14 -> Round 8
- [ ] CF-D8-15 -> Round 8
- [ ] CF-D8-16 -> Round 8
- [ ] CF-D8-NEW-01 -> Round 7
- [x] CF-D8-NEW-02 -> Round 0 ✅ (b3e704b)

**Coverage check:** 84/84 issues assigned, 0 unassigned, 0 duplicate assignments.
