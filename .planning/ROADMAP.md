# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-14 (Phase 12 reconciliation — false-start repair landed, 09.2 summaries quarantined as non-authoritative runtime proof)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [x] **Phase 2: V3 Runtime Architecture** — 9/9 plans complete, 18/18 verified
- [ ] **Phase 3: Schema Definition** — 0/4
- [ ] **Phase 4: Migration Gate** — 0/4
- [ ] **Phase 5: Integration Verification** — 0/5
- [ ] **Phase 6: Runtime Domain Separation** — SUPERSEDED by Phase 11
- [ ] **Phase 7: Runtime Domain Restructuring Planning** — SUPERSEDED by Phase 11
- [x] **Phase 8: Repair Durable Parent Observability** — ✅ COMPLETE (corrective closure)
- [~] **Phase 9: Sticky Delegation Corrective** — ⚠️ MOCK-VERIFIED ONLY, runtime verification pending (forensic reset 2026-04-14)
- [~] **Phase 9.1: Critical Bug Fixes + Test Rewrites** — ⚠️ COMPLETE WITH CAVEATS — 668 tests pass but mock-heavy (forensic reset 2026-04-14)
- [~] **Phase 9.2: Completion Detection Architecture** — MIXED: Plan 01 authoritative; Plans 02-03 executed historically but quarantined as non-authoritative
- [ ] **Phase 9.3: Module Restructuring + Config** — D-01→D-08, D-28→D-30 (11 decisions)
- [x] **Phase 12: Correct background session start semantics + planning reconciliation** — 2/2 plans complete, authoritative truth reset established
- [ ] **Phase 11: Clean Architecture Restructuring** — 0 plans (replaces Phase 6+7)

## Phase 1: Baseline Cleanup

### Already Done ✅ (verified against source)

1. ✅ Double-compaction avoided — `src/plugins/prompt-enhance.ts` records compaction in event hook, single increment
2. ✅ Heading regex anchored — `src/tools/session-patch/tools.ts` uses `match[1]` exact match
3. ✅ Cross-line contradiction detection — `src/tools/prompt-analyze/tools.ts` nested loop comparison
4. ✅ System-transform gating — `src/hooks/system-transform.ts` checks delegation metadata
5. ✅ `recommended_lanes` removed — `src/tools/prompt-skim/tools.ts` output has no such field
6. ✅ `.opencode/tools/*.ts` deleted — only `.gitkeep` remains
7. ✅ Test files canonical form — `tests/tools/*.test.ts` all import from `src/tools/`

### Still Pending 🔄

8. 🔄 Remove `system.transform` wiring from `src/plugin.ts` (lines 38-39 import, lines 315-320 wiring)
9. 🔄 Fix `hivefiver-orchestrator.md` expecting `recommended_lanes` (lines 102, 163)
10. 🔄 Replace heuristic context-budget with real OpenCode compaction data

### Plans
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Execute 3 remaining cleanup items (remove system.transform wiring, fix orchestrator phantoms, remove context-budget tool)

## Phase 2: V3 Runtime Architecture

Executable recovery plan set replacing the stale reference-only Phase 02 plans. These plans are grounded in current V3 runtime code reality and preserve the still-locked Phase 02 decisions.

**Authoritative current status (2026-04-10):** implementation is complete across all 9 Phase 02 plans and authoritative re-verification now records `18/18` truths verified in `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`.

**Corrective closure:** Phase 08 repaired the live `runtimePolicyOverride` writer/persistence seam and hardened durable parent-visible delegated-session truth across async boundaries.

Recovery plan structure:
- 2c/2h. Runtime policy foundation — configurable concurrency + budgets that supplement OpenCode built-ins
- 2a. Hybrid background execution — full D-12/D-13 auto-detect across execution family and built-in submodes
- 2b/2g. Delegation lineage + advisory specialist routing — continuity canonical, exports optional
- 2d. Session recovery — staleness check, risk framing, CQRS-safe checkpoint/resume
- 2e. Context governance — soft-policy rules with runtime mutation and violation logging
- 2f. Injection engine — conditional session-start and compaction-time injection with governance filtering

**Plans:** 9 plans

Plans:
- [x] 02-01-PLAN.md — Runtime policy foundation: configurable concurrency and budgets that explicitly supplement OpenCode built-ins (Wave 1)
- [x] 02-02-PLAN.md — Hybrid background execution: D-12/D-13 auto-detect plus hardened owned-process fallback (Wave 2)
- [x] 02-03-PLAN.md — Delegation lineage and specialist routing: continuity-first persistence with optional packet/manifest exports (Wave 3)
- [x] 02-04-PLAN.md — Session recovery and hook repair: staleness/risk framing, CQRS-safe compaction, compact/reset restoration (Wave 4)
- [x] 02-05-PLAN.md — Context governance: durable soft-policy rules, runtime mutation, violation logging (Wave 5)
- [x] 02-06-PLAN.md — Injection engine: conditional session-start and compaction-time injection with governance filtering (Wave 6)
- [x] 02-07-PLAN.md — Runtime-policy production wiring: live queue and hook budget resolution from trusted policy state (Wave 7)
- [x] 02-08-PLAN.md — Execution-mode wiring: classifier-driven live delegation runtime with owned-process background execution (Wave 8)
- [x] 02-09-PLAN.md — Injection and governance correctness: route-aware payloads, active-rule suppression, and overlapping metadata correlation (Wave 8)

## Phase 3: Schema Definition

- 3a. YAML schema for Agent frontmatter
- 3b. YAML schema for Command frontmatter
- 3c. YAML schema for Skill frontmatter
- 3d. TypeScript types + event emitters from schemas

## Phase 4: Migration Gate

- 4a. Inventory product-detox (excluding .env, tool config pollution)
- 4b. Match against proven harness-experiment baseline
- 4c. Selective migration list with user approval
- 4d. Item-by-item migration with validation

## Phase 5: Integration Verification

- 5a. Full test suite green
- 5b. Plugin loads and wires all tools + hooks
- 5c. Background agents spawn, report, clean up
- 5d. Delegation chains persist across sessions
- 5e. Injection engine applies rules conditionally
- 5f. Specialist routing correct
- 5g. Schema validation catches malformed definitions

## Phase 6: Runtime Domain Separation — SUPERSEDED BY PHASE 11

**Superseded by:** Phase 11 (Clean Architecture Restructuring), which absorbs Phase 6 scope with actual execution authority. The 2026-04-10 architecture audit produced the domain boundary analysis Phase 6 was supposed to deliver.

## Phase 7: Runtime Domain Restructuring Planning — SUPERSEDED BY PHASE 11

**Superseded by:** Phase 11. The architecture audit and research conducted on 2026-04-10 produced the move maps, dependency rules, and domain definitions Phase 7 was supposed to create. Phase 11 executes the restructuring directly.

## Phase 8: Repair durable parent observability for delegated sessions

**Goal:** Restore durable parent-visible delegated-session truth and close the live runtimePolicyOverride seam so Phase 02 can be re-verified.
**Requirements**: RUN-3h
**Depends on:** Phase 02 corrective closure baseline (not Phase 07)
**Plans:** 3 plans

Plans:
- [x] 08-01-PLAN.md — restore the live runtimePolicyOverride writer/persistence seam
- [x] 08-02-PLAN.md — reconcile durable parent-visible started/completed/failed truth
- [x] 08-03-PLAN.md — re-run Phase 02 verification and correct roadmap/state sequencing

**Execution status:** ✅ COMPLETE. Phase 08 closed 2026-04-10. Runtime policy override seam restored, parent-visible truth hardened, Phase 02 re-verification green at 18/18. Roadmap and STATE.md reconciled.

**Closure reference:** `.planning/debug/delegation-root-cause-with-reference-2026-04-10.md` — canonical root-cause analysis that informed Phase 09 corrective planning.

## Phase 9: Sticky Delegation Corrective — SPLIT INTO SUB-PHASES

**Original goal:** Fix multi-layered architectural mismatches from Phase 08 root-cause analysis.
**Original result:** ⚠️ MIXED HISTORICAL STATE — forensic investigation (2026-04-14) confirmed UAT was inflated. Code exists and 09.2-02/03 produced historical execution artifacts, but those closure claims are quarantined as non-authoritative. Fresh runtime verification or replanning is still required.
**Decision:** Split 30 locked decisions across 7 clusters into 3 focused sub-phases.

**Parent context:** `.planning/phases/09-sticky-delegation-corrective/09-CONTEXT.md` (all 30 decisions D-01→D-30)

---

### Phase 9.1: Critical Bug Fixes + Test Rewrites

**Goal:** Fix the 5 runtime bugs that make delegation non-functional, then rewrite the mock-heavy tests to validate real behavior. This is the unblock-everything phase.

**Decisions:** D-15→D-19 (bug fixes), D-20→D-24 (test strategy) — 10 decisions
**Depends on:** Phase 08 closure
**Context:** `.planning/phases/09.1-critical-bug-fixes-test-rewrites/09.1-CONTEXT.md`

**Bug fixes (from UAT forensic evidence):**
- D-15: Add `status === "started"` branch in notification-handler.ts
- D-16: Return `{ type: "unknown" }` instead of defaulting to `"busy"` in checkSessionExists()
- D-17: Only count ASSISTANT messages as evidence, not user prompt
- D-18: Don't cache external `session.idle` events; only cache internal stability timer results
- D-19: Architectural — fire-and-forget stays, but observer must work correctly (D-15→D-18 fix it)

**Test rewrites:**
- D-20: In-memory adapters for SDK boundary (Clean Architecture testing pattern)
- D-21: Mock only SDK transport + time; NEVER mock internal business logic
- D-22: LOC > 300 not tolerable; dead code forbidden
- D-23: Every test must surface rationales (WHY, WHAT, HOW)
- D-24: Rewrite mock-heavy files: lifecycle-background-observer.test.ts, delegate-task.test.ts, delegate-task-overflow.test.ts, lifecycle-process-runner.test.ts

**Plans:** 3 plans

Plans:
- [x] 09.1-01-PLAN.md — Fix all 5 runtime bugs with TDD regression tests (D-15→D-19) [Wave 1] ⚠️ mock-verified only
- [x] 09.1-02-PLAN.md — Create in-memory SDK adapter + rewrite lifecycle-background-observer tests (D-20, D-21, D-22, D-23, D-24) [Wave 2] ⚠️ mock-verified only
- [x] 09.1-03-PLAN.md — Create delegate-task tests + rewrite process-runner tests with in-memory adapter (D-21, D-24) [Wave 3] ⚠️ mock-verified only

---

### Phase 9.2: Completion Detection Architecture

**Goal:** Implement the user-specified completion detection logic — start gate, backoff polling, true completion, failure handling, parent coordination. This makes delegation actually work end-to-end.

**Decisions:** D-09→D-14 (completion detection), D-25→D-27 (oh-my-openagent patterns) — 9 decisions
**Depends on:** Phase 9.1 (bugs must be fixed first)
**Context:** `.planning/phases/09.2-completion-detection-architecture/09.2-CONTEXT.md`

**Completion detection sub-module:**
- D-09: Completion detection as sub-module `src/lib/tasking/completion/`
- D-10: START GATE — delegation only "started" when ≥1 thinking block + ≥2 tool calls verified
- D-11: POLLING — 15s initial, +5s backoff, 60s cap
- D-12: TRUE COMPLETION — last message is assistant + idle + 2 consecutive polls + start gate evidence
- D-13: FAILURE HANDLING — 180s idle timeout, up to 2 retries, resume-first with same session ID
- D-14: PARENT COORDINATION — main session closes only when ALL delegations + ALL user tasks complete

**Reference architecture:**
- D-25: Adapt oh-my-openagent BackgroundManager pattern
- D-26: Adapt TmuxSessionManager pattern
- D-27: Evaluate oh-my-openagent's direct message injection for notifications

Plans:
- [x] 09.2-01-PLAN.md — Implement completion detection sub-module (start-gate, poll-strategy, completion-verifier) ✅ pure modules shipped
- [~] 09.2-02-PLAN.md — Historical execution artifact exists in `09.2-02-SUMMARY.md`, but it is quarantined/non-authoritative pending fresh verification or replanning
- [~] 09.2-03-PLAN.md — Historical execution artifact exists in `09.2-03-SUMMARY.md`, but it is quarantined/non-authoritative pending fresh authoritative follow-up

### Phase 12: Correct background session start semantics, reconcile Phase 09/09.1/09.2, and archive obsolete architectural noise

**Goal:** Make background delegation report truthful start state, then reconcile the Phase 09-family artifacts and planning metadata to that corrected runtime reality.
**Requirements**: [PH12-01, PH12-02, PH12-03, PH12-04]
**Depends on:** Phase 08 corrective sequencing baseline plus the existing Phase 09/09.1/09.2 runtime corridor (not Phase 11)
**Plans:** 2/2 plans complete

**Execution status:** ✅ COMPLETE. Phase 12 closed the false-start corridor, quarantined contaminated 09.2 completion summaries, and refreshed roadmap/project/state artifacts to the corrected dependency chain.

**Authoritative references:**
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-01-SUMMARY.md`
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-reconciliation-note-2026-04-14.md`

**Requirement details:**
- **PH12-01:** Async builtin-subsession children stay non-started until observer-confirmed D-10 start-gate evidence exists.
- **PH12-02:** Parent-visible `started` reminders and lifecycle status stay honest across background execution families.
- **PH12-03:** Phase 09/09.1/09.2 artifacts are reconciled so quarantined claims cannot be mistaken for authoritative runtime truth.
- **PH12-04:** Roadmap/state/project metadata and stale architectural notes are archived or rewritten to the corrected dependency chain.

Plans:
- [x] 12-01-PLAN.md — Lock truthful async start semantics and regression coverage
- [x] 12-02-PLAN.md — Reconcile Phase 09-family artifacts and archive stale planning noise

### Phase 13: fix async delegated result capture and persist child session outputs, transcripts, and evidence so completion is backed by recoverable work product

**Goal:** Fix async delegated result capture and persist child session outputs, transcripts, and evidence so completion is backed by recoverable work product.
**Requirements**: PH13-01 through PH13-11
**Depends on:** Phase 12
**Plans:** 2 plans

Plans:
- [ ] 13-01-PLAN.md — Types, result-capture module, and continuity wiring (Wave 1)
- [ ] 13-02-PLAN.md — Wire result capture into observer, process runner, and notifications (Wave 2, depends on 13-01)

### Phase 14: delegate-task truth-reset: archive phases 09-13, remove trash artifacts, refactor codebase to stop confusing agents about delegation

**Goal:** Hard reset + rebuild — delete all 09-13 regression code, archive stale phase dirs, rebuild delegate-task with sync + async delegation using a single DelegationManager class (~300-400 LOC replacing 20+ broken files).
**Requirements**: REQ-14-01 through REQ-14-08
**Depends on:** Phase 12 (truthful start semantics baseline)
**Plans:** 1/3 plans executed

Plans:
- [x] 14-01-PLAN.md — Cleanup + Deletion: NUKE trash, archive phase dirs, delete 09-13 code/tests, clean plugin.ts + types.ts (Wave 1)
- [ ] 14-02-PLAN.md — DelegationManager Core: Build delegation engine with sync dispatch, async durability, session lifecycle events, persistence, recovery (Wave 2)
- [ ] 14-03-PLAN.md — Tool + Tests + AGENTS.md: Rebuild delegate-task tool, write fresh runtime-truthful tests, update AGENTS.md (Wave 3)

---

### Phase 9.3: Module Restructuring + Config

**Goal:** Split lifecycle-manager into tasking modules, add Zod config schema for tasking, fix type cycles, enforce LOC discipline. (Note: significant overlap with Phase 11 — consider merging if 9.3 scope is too similar.)

**Decisions:** D-01→D-04 (module boundaries), D-05→D-08 (config surface), D-28→D-30 (code quality) — 11 decisions
**Depends on:** Phase 9.2 (completion detection must be implemented)
**Context:** `.planning/phases/09.3-module-restructuring-config/09.3-CONTEXT.md`

**Module boundaries:**
- D-01: Feature module pattern — `src/lib/tasking/` as coordination-tasking domain
- D-02: 3-way split of lifecycle-manager.ts into tasking-coordinator, tasking-observer, tasking-dispatcher
- D-03: Shared runner interface with TaskRunner contract
- D-04: Config mindset — absence = freedom, presence = constraint

**Config surface:**
- D-05: Single harness.json at project root
- D-06: Phase 9.3 implements config SCHEMA (Zod) + tasking wiring only
- D-07: Configurable tasking aspects: agent→skill injection, category→model routing, concurrency, completion params
- D-08: All internal hooks/plugins features user-configurable via JSON

**Code quality:**
- D-28: Extract duplicated PatchLifecycleArgs into shared runners/types.ts
- D-29: Fix near-cycle types.ts → pending-notifications.ts → continuity.ts → types.ts
- D-30: Split continuity-normalizers.ts (706 LOC) into domain-specific files

Plans:
- [ ] 09.3-01-PLAN.md — 3-way split of lifecycle-manager.ts into tasking modules
- [ ] 09.3-02-PLAN.md — Zod config schema + tasking wiring
- [ ] 09.3-03-PLAN.md — Type cycle fixes + continuity-normalizers split

## Phase 11: Clean Architecture Restructuring

**Goal:** Restructure and refactor `src/` into a maintainable, extensible, pattern-driven architecture with Clean Architecture patterns, CQRS separation, modular decomposition into 8-10 focused modules (<350 LOC each), and explicit design patterns (Factory, Handler Composition, Strategy).

**Audit evidence (2026-04-10):**
- Architecture audit: 9 anti-patterns found (2 HIGH, 5 MEDIUM, 2 LOW)
- LOC analysis: src/ = 9,385 LOC across 56 files; src/lib/ = 37 flat files
- God object: `lifecycle-manager.ts` at 734 LOC with 14 imports
- Research: AI SDK v6 middleware chain, OpenAI Agents handoff pattern, DDD bounded contexts

**Depends on:** Phase 9 (complete with P0 fix)
**Plans:** 6 plans (phased execution)

**Scope — IN:**
- `src/lib/` — 31 files, flat namespace, mixed concerns
- `src/hooks/` — 5 files, functional grouping (CQRS read-side alignment)
- `src/tools/` — 11 files, best-organized (4 sub-dirs)
- `src/plugin.ts` — 57 LOC, composition root

**Scope — OUT:**
- `.opencode/` — client-side concern
- `tests/` — separate from source restructuring
- `dist/` — build artifact
- `docs/` — documentation

**Scope — AS-IS (preserve):**
- `src/cli/` — install/user runtime scaffolding

**Scope — UNCERTAIN (analyze before deciding):**
- `src/shared/`, `src/schema-kernel/`, `src/kernel/`, `src/harness/`

**Target Module Structure:**
```
src/
├── plugin/              # Assembly root (<100 LOC)
├── tools/               # 5 tools (~500 LOC, write-side CQRS)
├── hooks/               # Event handlers (~800 LOC, read-side CQRS)
├── lifecycle/           # Session state machine (~400 LOC)
├── delegation/          # Delegation chain logic (~400 LOC)
├── continuity/          # State persistence, JSON durability (~400 LOC)
├── cli/                 # CLI substrate (~500 LOC, AS-IS)
├── control-plane/       # Control primitives (~400 LOC)
└── shared/              # Utilities (~800 LOC, leaf module)
```

**Dependency Rules (non-negotiable):**
- `shared/` is leaf — depends on nothing
- `plugin/` depends on everything (assembly root)
- `tools/`, `hooks/`, `cli/`, `control-plane/` depend on `lifecycle/`, `delegation/`, `continuity/`, `shared/`
- `lifecycle/`, `delegation/`, `continuity/` depend on `shared/` only
- No circular dependencies

**File Size Rule:** No file exceeds 350 LOC

**Design Patterns:**

| Pattern | Application |
|---------|-------------|
| Factory | `createTool()`, `createHook()`, `createHandler()` factories for extensible construction |
| Handler Composition | Chain `before/after` hooks via composition, not inheritance |
| Strategy | Pluggable continuity store, notification handlers |
| Command/Query Separation | tools/ = write-side, hooks/ = read-side |

**Execution Plan:**

Plans:
- [ ] 11-01-PLAN.md — Analyze and Map: Audit current src/lib/ 31 files, classify by concern, document cross-dependencies, produce REFACTOR-MAP.md
- [ ] 11-02-PLAN.md — Shared Leaf First: Extract utilities to src/shared/, ensure zero dependencies
- [ ] 11-03-PLAN.md — Core Domain Modules: Create lifecycle/, delegation/, continuity/ with clean internal APIs
- [ ] 11-04-PLAN.md — CQRS Separation: Move tools to src/tools/, hooks to src/hooks/, wire via plugin
- [ ] 11-05-PLAN.md — Plugin Assembly: Compose all modules in src/plugin/ as root (<100 LOC)
- [ ] 11-06-PLAN.md — Validation: npm run typecheck, npm test, verify <350 LOC per file, dependency rules

**Verification Gate:**
- [ ] `npm run build` — compiles without errors
- [ ] `npm test` — all tests pass
- [ ] `npm run typecheck` — zero type errors
- [ ] `src/plugin/` composition root <100 LOC
- [ ] No file in `src/` exceeds 350 LOC
- [ ] `src/shared/` has zero imports from other `src/` modules (leaf verification)

**Identified Risks:**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Flat-folder consolidation causes import breakage | CRITICAL | Dry-run output before executing file moves; phased commits per plan |
| No rollback plan | CRITICAL | Phase commits after each of 6 plans; git history enables revert |
| Vague patterns ("apply architecture patterns") | HIGH | Explicit pattern list: Factory, Handler Composition, Strategy, CQRS |
| Scope creep into uncertain directories | HIGH | AS-IS flag on src/cli/; UNCERTAIN set deferred to Plan 11-01 analysis |
| No validation gate | HIGH | Explicit gate: npm run typecheck && npm test must pass |

## Progress Table

| Phase | Items Complete | Status |
|-------|---------------|--------|
| 1. Baseline Cleanup | 7/10 | Plan created (1 plan, Wave 1) |
| 2. V3 Runtime Architecture | 9/9 plans, 18/18 truths | Verified after Phase 08 corrective closure |
| 3. Schema Definition | 0/4 | Not started |
| 4. Migration Gate | 0/4 | Not started |
| 5. Integration Verification | 0/5 | Not started |
| 6. Runtime Domain Separation | — | SUPERSEDED by Phase 11 |
| 7. Runtime Domain Restructuring Planning | — | SUPERSEDED by Phase 11 |
| 8. Repair Durable Parent Observability | 3/3 plans | ✅ COMPLETE — corrective closure, 2026-04-10 |
| 9. Sticky Delegation Corrective | 3/3 plans | ⚠️ MOCK-VERIFIED ONLY — forensic reset 2026-04-14 |
| 9.1 Critical Bug Fixes + Tests | 3/3 plans | ⚠️ COMPLETE WITH CAVEATS — mock-heavy, live verification pending |
| 9.2 Completion Detection Architecture | 1/3 authoritative (+2 historical/quarantined) | ⚠️ MIXED — Plan 01 authoritative; Plans 02-03 ran historically but are not current proof |
| 9.3 Module Restructuring + Config | 0/3 plans | Blocked by 9.2 |
| 12. Correct start semantics + reconciliation | 2/2 plans | ✅ COMPLETE — false-start corridor fixed, planning truth reconciled |
| 13. Async Result Capture + Persistence | 0/2 plans | Planned — types + module + wiring (13-01), observer + runner integration (13-02) |
| 11. Clean Architecture Restructuring | 0/6 | Ready for planning |

## Dependencies

```
Phase 1 (7 done, 3 pending — planned)
  └─→ Phase 2: V3 Runtime baseline
       └─→ Phase 8: Corrective closure for delegated-session durability ✅
            └─→ Phase 2: Authoritative re-verification (18/18) ✅
                 └─→ Phase 9 family: partial implementation + forensic reset
                      └─→ Phase 12: truthful start-semantics repair + reconciliation ✅
                           └─→ Next runtime verification / re-planning work from corrected truth
                                └─→ Phase 9.3: Module Restructuring + Config
                                     └─→ Phase 11: Clean Architecture Restructuring
                                          └─→ Phase 3: Schema Definition
                                               └─→ Phase 4: Migration Gate
                                                    └─→ Phase 5: Integration Verification
```
