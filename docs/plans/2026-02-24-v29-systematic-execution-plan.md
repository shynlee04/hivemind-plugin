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

### Round 0: Quick Stabilization (P0 Safety Net)
**Goal:** Remove immediate runtime/control-plane blockers without architecture redesign.
**Duration:** 1 session
**Issues addressed:** CF-D8-01, CF-D8-02, CF-D8-03, CF-D8-07, CF-D8-NEW-02
**Why first:** These are direct runtime integrity failures (agent registration + malformed frontmatter) with low implementation risk and high unblock value.
**Quality gate:** Missing agents visible in `opencode.json`, typo resolved, duplicate keys removed, `npm test` pass, `npx tsc --noEmit` clean.

### Round 1: Already Complete (Audit + Validation)
**Goal:** Preserve validated audit baseline and issue taxonomy as execution source of truth.
**Duration:** complete
**Reference:** `docs/plans/2026-02-24-v29-domain-audit.md`
**Quality gate:** Source-of-truth report accepted as baseline for all downstream rounds.

### Round 2: Schema Foundation (D1)
**Goal:** Establish complete runtime schema contracts and validation-safe persistence entry points.
**Duration:** 2-3 sessions
**Prerequisites:** Round 0 complete; user updates framework vision in `forming-the-own-framework.md`.
**Issues addressed:** CF-D1-01 through CF-D1-10, CF-D2-NEW-01

**Phase 2A: Research + Design (read-only)**
- Analyze current schemas under `src/schemas/` and graph/state structure.
- Extract entity/lifecycle intent from `forming-the-own-framework.md`.
- Design BaseNodeSchema and shared id/timestamp conventions.
- Design schema versioning + migration contract.
- Produce user-approval design checkpoint.

**Phase 2B: Implementation**
- Implement `TaskItem`, `BrainState`, `HierarchyState`, `Config` Zod schemas.
- Add missing v2.9 entity schemas (Project, Milestone, SubTask, memory classes, governance contracts).
- Add `safeParse` validation for persistence read paths (state and graph entry points).
- Extend file locking + backup safety for remaining uncovered state files.

**Phase 2C: Validation**
- Run compatibility tests against existing `.hivemind/` data.
- Add schema-level tests for all newly introduced entities.

**Quality gate:** No schema regressions, full parse coverage for core state entities, compatibility pass.

### Round 3: State Unification (D2)
**Goal:** Remove dual-state divergence and define one authoritative representation per entity.
**Duration:** 2-3 sessions
**Prerequisites:** Round 2 complete.
**Issues addressed:** CF-D2-01 through CF-D2-10

**Phase 3A: Research + Design**
- Field-by-field divergence map for tasks, mems, hierarchy.
- Winner strategy definition (`graph/` relational model as target, compatibility bridge where required).
- 3-level cognitive to 6-level enterprise mapping contract.

**Phase 3B: Implementation**
- Migrate task and mem consumers onto unified contracts.
- Add deterministic sync/conflict policy (or eliminate sync via true unification).
- Split runtime metrics from persistent decision state.
- Introduce graph query interface and event/audit mutation trail.

**Phase 3C: Validation**
- Migration tests (legacy state -> unified graph-backed representation).
- Divergence simulation tests for conflict policy.

**Quality gate:** Dual-state hazards removed or explicitly bridged with tested reconciliation behavior.

### Round 4: Architecture Repair (D3)
**Goal:** Restore dependency direction, reduce LOC concentration risk, and modularize lib structure.
**Duration:** 2-3 sessions
**Prerequisites:** Round 3 complete.
**Issues addressed:** CF-D3-01 through CF-D3-14, CF-D1-NEW-01, CF-D3-NEW-01

**Phase 4A: SDK Access Root-Cause Repair**
- Isolate SDK/shell dependencies into `src/lib/sdk/`.
- Remove lib -> hooks upward imports in `compaction-engine`, `session-governance`, `auto-commit`.

**Phase 4B: Large File Decomposition**
- Split `graph-io.ts`, `graph-migrate.ts`, `hierarchy-tree.ts`, and additional >300 LOC hotspots.
- Preserve behavior with incremental tsc/test checks after each split.

**Phase 4C: Directory Restructuring**
- Introduce domain directories for lib modules.
- Migrate files with import-safe staged moves.

**Phase 4D: Pattern Hardening**
- Introduce DI/factory seams for high-coupling modules.
- Standardize lib-layer error boundary behavior.

**Quality gate:** No import-direction violations, modularized high-risk files, architecture checks green.

### Round 5: Tools + Hooks Expansion (D4 + D5)
**Goal:** Expand operational surface and convert governance from advisory to enforceable.
**Duration:** 2-3 sessions
**Prerequisites:** Round 4 complete.
**Issues addressed:** CF-D4-01 through CF-D4-07, CF-D5-01 through CF-D5-07, CF-D5-NEW-01

**Phase 5A: Tool-Gate Enforcement (critical knot)**
- Implement hard policy decisions in `tool-gate.ts`.
- Resolve duplicate first-turn handling and orphan hook registration paths.

**Phase 5B: Tool Surface Expansion**
- Add context purification, memory subtype, and code-intel tool families.
- Standardize tool response envelope contract and deprecation metadata.

**Phase 5C: Hook Reorganization**
- Introduce hook domain directories and explicit ordering/priority contract.
- Resolve overlap between soft governance and tool gate.

**Quality gate:** Enforcement behavior testable and active; hook pipeline deterministic.

### Round 6: Framework Lifecycle (D6)
**Goal:** Finalize framework lifecycle model and command/state transitions.
**Duration:** 1-2 sessions
**Prerequisites:** Round 5 complete.
**Issues addressed:** CF-D6-01 through CF-D6-06

- Complete framework vision draft into enforceable lifecycle spec.
- Merge duplicate enterprise workflows.
- Add missing lifecycle command families and state machine transition rules.
- Introduce framework versioning/compatibility contract.

**Quality gate:** Lifecycle flow is explicit, versioned, and command-complete for planned operation modes.

### Round 7: Ecosystem Surface (D7 + D8 Surface)
**Goal:** Normalize skills/commands/agent contracts for reliable day-to-day operation.
**Duration:** 2 sessions
**Prerequisites:** Round 6 complete.
**Issues addressed:** CF-D7-01 through CF-D7-06, CF-D8-04 through CF-D8-13, CF-D6-NEW-01, CF-D7-NEW-01, CF-D8-NEW-01

- Repair missing skill assets and define skill dependency declarations.
- Rationalize command aliases and add command discovery.
- Fix mode/config mismatches and introduce capability matrix + handoff protocol.
- Implement `hiveplanner` and finalize naming/conventions decision paths.

**Quality gate:** Skills and commands are discoverable, consistent, and agent contracts are explicit.

### Round 8: Hardening + Integration Testing
**Goal:** Complete platform hardening, observability, and integration confidence for v2.9 expansion.
**Duration:** 2 sessions
**Prerequisites:** Round 7 complete.
**Issues addressed:** CF-D3-09, CF-D3-10, CF-D3-11, CF-D8-14, CF-D8-15, CF-D8-16

- Complete code-intel maturity milestones.
- Add agent versioning, health monitoring, and permission inheritance model.
- Execute full integration test suite and release-safety checks.

**Quality gate:** Integration suite green, observability in place, branch/public guard verified.

## Issue-to-Round Traceability Matrix
| Issue ID | Round | Phase | Task Description | Dependencies |
|----------|-------|-------|------------------|--------------|
| CF-D1-01 | 2 | 2B | Create TaskItem runtime Zod schema | Round 0 |
| CF-D1-02 | 2 | 2B | Create BrainState runtime Zod schema | Round 0 |
| CF-D1-03 | 2 | 2B | Create HierarchyState runtime Zod schema | Round 0 |
| CF-D1-04 | 2 | 2B | Create Config runtime Zod schema | Round 0 |
| CF-D1-05 | 2 | 2B | Add missing file-lock coverage for JSON state files | CF-D1-01..04 |
| CF-D1-06 | 2 | 2B | Implement backup strategy for uncovered JSON files | CF-D1-05 |
| CF-D1-07 | 2 | 2A | Expand schema coverage beyond graph-nodes.ts | CF-D1-01..04 |
| CF-D1-08 | 2 | 2A | Define schema versioning + migration contract | CF-D1-07 |
| CF-D1-09 | 2 | 2A | Introduce BaseNode shared schema conventions | CF-D1-07 |
| CF-D1-10 | 2 | 2B | Add missing v2.9 entity schemas | CF-D1-08, CF-D1-09 |
| CF-D1-NEW-01 | 4 | 4B | Decompose hierarchy-tree high-LOC hotspot into modules | Round 3 |
| CF-D2-01 | 3 | 3B | Unify task state representations | Round 2 |
| CF-D2-02 | 3 | 3B | Unify mem state representations | Round 2 |
| CF-D2-03 | 3 | 3A | Define 3-level to 6-level hierarchy bridge | Round 2 |
| CF-D2-04 | 3 | 3B | Implement deterministic synchronization or remove dual-path need | CF-D2-01..03 |
| CF-D2-05 | 3 | 3B | Add conflict resolution policy for divergence | CF-D2-04 |
| CF-D2-06 | 3 | 3B | Separate runtime metrics from persistent decisions in brain state | CF-D2-01 |
| CF-D2-07 | 3 | 3B | Introduce graph query interface for relational state | CF-D2-01 |
| CF-D2-08 | 3 | 3B | Enforce validation on state directory read paths | Round 2 |
| CF-D2-09 | 3 | 3B | Add session retention/cleanup policy | CF-D2-04 |
| CF-D2-10 | 3 | 3B | Add event sourcing/audit trail for state mutations | Round 2 |
| CF-D2-NEW-01 | 2 | 2B | Add safeParse validation at persistence load boundary | Round 0 |
| CF-D3-01 | 4 | 4B | Split graph-io into read/write/query/migrate operations | Round 3 |
| CF-D3-02 | 4 | 4A | Remove compaction-engine import violation (lib -> hooks) | Round 3 |
| CF-D3-03 | 4 | 4A | Remove session-governance import violation (lib -> hooks) | Round 3 |
| CF-D3-04 | 4 | 4A | Remove auto-commit import violation (lib -> hooks) | Round 3 |
| CF-D3-05 | 4 | 4A | Extract SDK access boundary into lib sdk module | CF-D3-02..04 |
| CF-D3-06 | 4 | 4B | Decompose cognitive-packer/session-engine/hierarchy-tree hotspots | CF-D3-01 |
| CF-D3-07 | 4 | 4B | Decompose remaining >300 LOC strategic hotspot modules | CF-D3-06 |
| CF-D3-08 | 4 | 4C | Introduce sub-directory organization in src/lib | CF-D3-01 |
| CF-D3-09 | 8 | 8A | Raise code-intel phase 1 quality (token/secret detector upgrades) | Round 7 |
| CF-D3-10 | 8 | 8A | Implement phase 2 code-intel core features | CF-D3-09 |
| CF-D3-11 | 8 | 8A | Complete phase 3 code-intel contracts (codemap/codewiki maturity) | CF-D3-10 |
| CF-D3-12 | 4 | 4D | Add dependency injection/factory seams in lib layer | CF-D3-08 |
| CF-D3-13 | 4 | 4D | Standardize lib error boundary behavior | CF-D3-08 |
| CF-D3-14 | 4 | 4C | Execute proposed lib directory taxonomy | CF-D3-08 |
| CF-D3-NEW-01 | 4 | 4B | Split graph-migrate into focused migration modules | Round 3 |
| CF-D4-01 | 5 | 5B | Expand tool surface beyond 6 canonical tools | Round 4 |
| CF-D4-02 | 5 | 5B | Add context purification tool family | CF-D4-01 |
| CF-D4-03 | 5 | 5B | Add in-session memory subtype tools | CF-D4-01 |
| CF-D4-04 | 5 | 5B | Add code-intel tool family | Round 4 |
| CF-D4-05 | 5 | 5B | Standardize tool response envelopes | CF-D4-01 |
| CF-D4-06 | 5 | 5B | Add tool versioning/deprecation mechanism | CF-D4-05 |
| CF-D4-07 | 5 | 5B | Add tool composition pattern | CF-D4-05 |
| CF-D5-01 | 5 | 5A | Implement hard enforcement in tool-gate | Round 4 |
| CF-D5-02 | 5 | 5A | Remove duplicate first-turn handling paths | CF-D5-01 |
| CF-D5-03 | 5 | 5A | Resolve session_coherence orphan registration gap | CF-D5-02 |
| CF-D5-04 | 5 | 5C | Introduce hook sub-directory structure | Round 4 |
| CF-D5-05 | 5 | 5C | Apply target hook taxonomy lifecycle/governance/context/events/infrastructure | CF-D5-04 |
| CF-D5-06 | 5 | 5C | Resolve soft-governance and tool-gate responsibility overlap | CF-D5-01 |
| CF-D5-07 | 5 | 5C | Add explicit hook priority/ordering mechanism | CF-D5-04 |
| CF-D5-NEW-01 | 5 | 5A | Remove or register dead createMainSessionStartHook path | CF-D5-03 |
| CF-D6-01 | 6 | 6A | Complete framework vision draft into executable spec | Round 5 |
| CF-D6-02 | 6 | 6A | Merge duplicate enterprise workflow definitions | CF-D6-01 |
| CF-D6-03 | 6 | 6B | Add missing GSD-equivalent lifecycle commands | CF-D6-01 |
| CF-D6-04 | 6 | 6B | Add missing command groups (Code-Intel, Settings, Milestone, Phase) | CF-D6-03 |
| CF-D6-05 | 6 | 6C | Define lifecycle state machine and transitions | CF-D6-01 |
| CF-D6-06 | 6 | 6C | Add framework versioning + compatibility layer | CF-D6-05 |
| CF-D6-NEW-01 | 7 | 7B | Standardize skill versioning policy in ecosystem contracts | Round 6 |
| CF-D7-01 | 7 | 7A | Restore missing skill assets declared by SKILL.md contracts | Round 6 |
| CF-D7-02 | 7 | 7B | Rationalize command alias overlap and ambiguity | Round 6 |
| CF-D7-03 | 7 | 7B | Consolidate gatekeeping triad overlap | CF-D7-02 |
| CF-D7-04 | 7 | 7A | Add skill dependency declaration model | CF-D7-01 |
| CF-D7-05 | 7 | 7A | Add skill compatibility/version checks | CF-D7-04 |
| CF-D7-06 | 7 | 7B | Implement command discovery mechanism | CF-D7-02 |
| CF-D7-NEW-01 | 7 | 7B | Normalize alias command conventions and migration hints | CF-D7-02 |
| CF-D8-01 | 0 | 0A | Register hiveminder in opencode.json | None |
| CF-D8-02 | 0 | 0A | Register debug agent in opencode.json | None |
| CF-D8-03 | 0 | 0A | Register hivemind-brownfield-orchestrator in opencode.json | None |
| CF-D8-04 | 7 | 7C | Align build agent mode contract across MD and JSON | Round 6 |
| CF-D8-05 | 7 | 7C | Align code-review agent mode contract across MD and JSON | Round 6 |
| CF-D8-06 | 7 | 7C | Align scanner hidden/mode contract across MD and JSON | Round 6 |
| CF-D8-07 | 0 | 0A | Fix `alllow` typo in hivefiver agent frontmatter | None |
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
| CF-D8-NEW-02 | 0 | 0A | Remove duplicate frontmatter keys in hivefiver agent file | None |

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
- [ ] CF-D1-01 -> Round 2
- [ ] CF-D1-02 -> Round 2
- [ ] CF-D1-03 -> Round 2
- [ ] CF-D1-04 -> Round 2
- [ ] CF-D1-05 -> Round 2
- [ ] CF-D1-06 -> Round 2
- [ ] CF-D1-07 -> Round 2
- [ ] CF-D1-08 -> Round 2
- [ ] CF-D1-09 -> Round 2
- [ ] CF-D1-10 -> Round 2
- [ ] CF-D1-NEW-01 -> Round 4
- [ ] CF-D2-01 -> Round 3
- [ ] CF-D2-02 -> Round 3
- [ ] CF-D2-03 -> Round 3
- [ ] CF-D2-04 -> Round 3
- [ ] CF-D2-05 -> Round 3
- [ ] CF-D2-06 -> Round 3
- [ ] CF-D2-07 -> Round 3
- [ ] CF-D2-08 -> Round 3
- [ ] CF-D2-09 -> Round 3
- [ ] CF-D2-10 -> Round 3
- [ ] CF-D2-NEW-01 -> Round 2
- [ ] CF-D3-01 -> Round 4
- [ ] CF-D3-02 -> Round 4
- [ ] CF-D3-03 -> Round 4
- [ ] CF-D3-04 -> Round 4
- [ ] CF-D3-05 -> Round 4
- [ ] CF-D3-06 -> Round 4
- [ ] CF-D3-07 -> Round 4
- [ ] CF-D3-08 -> Round 4
- [ ] CF-D3-09 -> Round 8
- [ ] CF-D3-10 -> Round 8
- [ ] CF-D3-11 -> Round 8
- [ ] CF-D3-12 -> Round 4
- [ ] CF-D3-13 -> Round 4
- [ ] CF-D3-14 -> Round 4
- [ ] CF-D3-NEW-01 -> Round 4
- [ ] CF-D4-01 -> Round 5
- [ ] CF-D4-02 -> Round 5
- [ ] CF-D4-03 -> Round 5
- [ ] CF-D4-04 -> Round 5
- [ ] CF-D4-05 -> Round 5
- [ ] CF-D4-06 -> Round 5
- [ ] CF-D4-07 -> Round 5
- [ ] CF-D5-01 -> Round 5
- [ ] CF-D5-02 -> Round 5
- [ ] CF-D5-03 -> Round 5
- [ ] CF-D5-04 -> Round 5
- [ ] CF-D5-05 -> Round 5
- [ ] CF-D5-06 -> Round 5
- [ ] CF-D5-07 -> Round 5
- [ ] CF-D5-NEW-01 -> Round 5
- [ ] CF-D6-01 -> Round 6
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
- [ ] CF-D8-01 -> Round 0
- [ ] CF-D8-02 -> Round 0
- [ ] CF-D8-03 -> Round 0
- [ ] CF-D8-04 -> Round 7
- [ ] CF-D8-05 -> Round 7
- [ ] CF-D8-06 -> Round 7
- [ ] CF-D8-07 -> Round 0
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
- [ ] CF-D8-NEW-02 -> Round 0

**Coverage check:** 84/84 issues assigned, 0 unassigned, 0 duplicate assignments.
