---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planned
last_updated: "2026-05-21T14:06:44.368Z"
progress:
  total_phases: 26
  completed_phases: 6
  total_plans: 40
  completed_plans: 31
  percent: 78
---

<!-- generated-by: gsd-doc-writer -->

# Hivemind — State

**Last updated:** 2026-05-21
**Last advance:** Reordered Phases 21-37 per owner's 3-group framework: Group 1 (Orchestration Design Fix) → Group 2 (Routing/Coordination) → Group 3 (Schema/Config) → Group 4 (Structural Cleanup). Based on 16 research artifacts (6,621 LOC), phase-reordering analysis (4 critical violations), session-tracker flaws analysis (16 flaws, 2 CRITICAL).
**Current focus:** Phase 21 — session-tracker-design-fix
**Next recommended run:** `/gsd-discuss-phase 21` then `/gsd-plan-phase 21`

---

## Current Status

**Active phase:** Phase 21 — Session-Tracker Design Fix (Group 1, HIGHEST PRIORITY).
**Phase 18:** ✅ COMPLETE — 4/4 plans.
**Phase 19:** ✅ COMPLETE — Non-destructive remediation.
**Phase 20:** ✅ COMPLETE — Dependency cleanup (11 deps removed, yaml consolidated, react→optional).
**P00.5:** 📋 READY — Non-destructive foundation sweep (delete 3 dead schemas, rebuild dist/, remove 2 legacy hooks).
**Phase 21:** 📋 READY — Session-Tracker Design Fix (16 flaws, 2 CRITICAL: F-01 temp leak, F-02 manifest never writes).
**Phase 22:** 📋 PENDING — Coordination Status + Error Unification (unify TaskStatus/DelegationStatus, DelegationError type).
**Phase 23:** 📋 PENDING — Coordination Dispatch + Delegate-Task Fix (CP-DT-01 block, DelegationManager decompose).
**Phase 24:** 📋 PENDING — Trajectory + Agent-Work-Contract Redesign.
**Phase 25:** 📋 PENDING — Pressure + Notification Redesign.
**Phase 26:** 📋 PENDING — Routing + Intent Loop Foundation (Group 2).
**Phase 27:** 📋 PENDING — Hook Injection Plane Redesign (Group 2).
**Phase 28:** 📋 PENDING — Auto-Looping + PTY + Background Command Revamp (Group 2).
**Phase 29:** 📋 PENDING — Schema Kernel Cleanup (Group 3).
**Phase 30:** 📋 PENDING — Config Plane Redesign (Group 3).
**Phase 31:** 📋 PENDING — Shipped Primitives + Governance Wire (Group 3).
**Phase 32:** 📋 PENDING — Plugin.ts Decomposition (Group 4, LAST).
**Phase 33:** 📋 PENDING — Async I/O Conversion + Typed Errors (Group 4).
**Phase 34:** 📋 PENDING — Module Splits + Legacy Inventory (Group 4).
**Phase 35:** 📋 PENDING — Integration Verification (Group 4).
**Phase 36:** 📋 deferred — Fix sync-oss.yml workflow.
**Phase 37:** 📋 deferred — Package .opencode/ primitives for distribution.
**Phase 16 Plan 01:** ✅ COMPLETE — Extended 3 tool input schemas (filter-sessions on session-tracker, aggregate on session-context, get-manifest on session-hierarchy) + created session-view.schema.ts.
**Phase 16 Plan 02:** ✅ COMPLETE — Enhanced session-tracker.ts: removed silent 50KB skip, added >1MB file warnings, child .json search with 4-field extraction, filter-sessions action with hierarchy-manifest index strategy. typecheck clean, 18+236 tests pass.
**Phase 16 Plan 03:** ✅ COMPLETE — Added aggregate action to session-context tool: status aggregation (fast path via index) and subagentType aggregation (individual continuity files). GAP-3 closed. REQ-03 satisfied.
**Phase 16 Plan 04:** ✅ COMPLETE — Added get-manifest action to session-hierarchy tool: handleGetManifest reads hierarchy-manifest.json, returns flattened child list. GAP-2 closed. REQ-04 satisfied.
**Phase 16 Plan 05:** ✅ COMPLETE — Created hivemind-session-view.ts (124 LOC) with single `get` action reading concurrently from 3 data roots via Promise.all. Registered in plugin.ts (23 tools). REQ-06 satisfied. typecheck clean.
**Phase 16 Plan 06:** ✅ COMPLETE — Event-tracker deprecation cleanup: scanned all src/ + .opencode/skills/ for remnants, updated hm-l3-hivemind-engine-contracts (2 refs) and hm-l3-hivemind-state-reference (5 refs) with deprecation annotations. GAP-7 closed. REQ-07 satisfied.
**Phase 16 Plan 07:** ✅ COMPLETE — hivemind-power-on skill rewrite: SKILL.md v2.1.0 (236 lines) + 6 reference files updated with actual tool capabilities (filter-sessions, get-manifest, aggregate, hivemind-session-view). All aspirational content removed. Truthful resume guidance with SDK v2 dependency noted. All acceptance criteria pass. REQ-08 satisfied.
**CP-DT-01 status:** RE-OPENED / RUNTIME BLOCKED. Waves 1-5 delivered historical implementation artifacts, but runtime proof failed because OpenCode plugin `ToolContext` v1.15.4 has no `context.task` field.
**Health:** CP-DT-01 blocked until Wave 6 closes runtime-truth gaps. Required sequence: correct docs/spec/gates, reassess Plan 01/02 coordination contracts, rewrite Plan 03 tool contract, adjust Plan 04 loops/chaining, rebuild Plan 05 plugin/runtime-contract tests, then require L1-L3 evidence before any completion claim.
**CP-ST-04 status:** ✅ COMPLETE — 3 plans delivered (PendingDispatchRegistry + Classification, Directory Architecture, Hierarchy Manifest + Immediate I/O + Cleanup).

**CP-ST-05 status:** ✅ COMPLETE — Investigation phase, root causes identified, decisions D-CP05-01 through D-CP05-06 locked.

**CP-ST-06 status:** ✅ COMPLETE — All 5 plans delivered:

- Plan 01: Test Audit + TDD RED Tests ✅
- Plan 02: Root Cause Extraction (RC-1, RC-2, RC-3) ✅
- Plan 03: Retry Queue Implementation (RC-5) ✅
- Plan 04: Fix All Failing Tests (RC-6) ✅
- Plan 05: Runtime Preservation Fixes + Parent Task Result Capture ✅
- Runtime Fix: 06-RUNTIME-FAILURE-FIX-2026-05-17 — parent task result parsing, L2 hierarchy registration, unknownSub bootstrap guard, recovery reads child JSON ✅
- Code Review Fix: 06-REVIEW-FIX — CR-01 (error logging), CR-02 (fork child-copy logging), WR-01..WR-04, IN-01..IN-04 ✅
- Nyquist Audit: 5 gaps filled, 11 behavioral tests, VALIDATION.md ✅

**Verification evidence:**

- `npx vitest run tests/features/session-tracker/` → 418/418 pass (44 files)
- `npx tsc --noEmit` → clean
- `npm test` → 2221 pass, 5 pre-existing failures (unrelated: steering-engine, hooks, plugin, tools)

**Remaining runtime risk:** Parent task result capture and child `.json` preservation proven in tests, but live compact/resume needs UAT with a real long-haul session to confirm OpenCode task output format matches the parser.

Core workstreams delivered: SR restructuring (SR-0 through SR-10) — `src/lib/` removed, source planes reorganized. BOOT-01 through BOOT-08 complete. MCM-01/MCM-02 complete. CP-PTY-00 complete (docs/spec). CP-ST-04/05/06 complete (session tracker fully rewritten).

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)  
**Core value:** Agents build on each other's work across sessions  
**Current focus:** Phase 21 — Session-Tracker Design Fix (Group 1, HIGHEST PRIORITY)

**Docs-only foundation delivered:** Option 3 — Sector Governance Foundation completed. 9 sector AGENTS.md files, gate-cleared for docs scope. O3-01 through O3-04 all delivered. Runtime readiness remains blocked (by design).

**Package naming:** `package.json` names package/bin as `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only unless explicitly labeled.

**Canonical identity:** Product Hivemind; package/bin `hivemind`; project type harness; current platform OpenCode; GSD is internal workflow tooling, not product identity.

---

## What's Delivered

| Component | Status | Details |
|-----------|--------|---------|
| Build system | ✅ | tsc clean, typecheck passes, dist/ produces correctly |
| Test suite | ✅ | 125 test files, 1767 tests, 2 failures (README heading assertions) |
| 24 custom tools | ✅ | Registered in plugin.ts, Zod schemas, CQRS write-side |
| 6 hook types | ✅ | Event observers, system/messages transforms, tool guards |
| configs.json schema | ✅ | 29 fields, readConfigs()/writeConfigs(), lazy-cached subscriber |
| Behavioral profiles | ✅ | 3 modes → profile mapping, wired into hooks/delegation/gates |
| Toggle gates | ✅ | 6 toggles wired, 4 @future-consumer annotated, 4 deferred |
| Delegation engine | ✅ | WaiterModel dispatch, dual-signal completion, PTY/SDK lanes |
| Continuity persistence | ✅ | Deep-clone-on-read, session journal, Q6 state root migration |
| 89 agents | ✅ | L0/L1/L2/L3 hierarchy, hm-* + hf-* lineages |
| 123 active skill directories | ✅ | Current primitive inventory excludes `.gitkeep`; lineage counts require MCM doctor proof before shipping claims |
| 19 commands | ✅ | start-work, plan, deep-init, ultrawork, harness-doctor, etc. |
| Agent/skill integration constitution | ✅ | BOOT-08: lineage, permissions, hierarchy, routing contracts (L5 governance) |
| Agent migration verification | ✅ | MCM-01: 56 shipped agents (45 hm-* + 11 hf-*) classified and discoverable |
| Skill migration verification | ✅ | MCM-02: 48 shipped skills (35 hm-* + 13 hf-*) classified and discoverable |
| Session Tracker Root Cause Rewrite | ✅ | CP-ST-06: 6 root causes fixed, 418/418 tests pass, retry queue, runtime preservation, parent task result capture |

---

## What's Broken / Missing

| Issue | Severity | Action |
|-------|----------|--------|
| **Bootstrap/recovery E2E proof complete** — BOOT-02 through BOOT-07 passed local clean-state proof | 🟢 RESOLVED | Maintain regression coverage |
| **Config consumer gap remains** — `conversation_language` is traced as wired in config traceability, but `delegation_systems` has no runtime consumer | 🔴 CRITICAL | Phase 0 config contract + CA-04.2: wire or explicitly defer dead config fields |
| **Shell/PTY command lane fully scoped** — CP-PTY-00 spike complete, CP-PTY-01..04 phases defined covering command-process, SDK session, coordination, and cross-cutting integration | 🟡 HIGH | CP-PTY-01 ready to execute; 02-04 planned |
| **`messages-transform.ts` dead code** — 67 LOC, zero imports, confirmed dead Phase 35 | 🟡 HIGH | Delete file |
| **plugin.ts at 447 LOC** — 100 LOC target, needs split | 🟡 HIGH | Extract hook/tool registration modules |
| **12 stale modules** — exist but no consumers | 🟡 HIGH | Document or wire (see SRC-MODULE-AUDIT) |
| **f-04 auto-routing MISSING** — no intent classification, no workflow router | 🔴 CRITICAL | Wave 3: design from skeleton §5.2 |
| **E2E tests MISSING** — 1767 unit tests, zero integration | 🟡 HIGH | Add at least delegation smoke test |
| **Lifecycle gate criteria MISSING** — references/ empty | 🟡 HIGH | CA-04.4: synthesize from ARCHITECTURE.md |
| **`.hivemind/` ownership gap** — 17/19 dirs no typed module | 🟡 MEDIUM | CA-04.3: after bootstrap |
| **`asString` duplication** — **RESOLVED** (continuity.ts copy removed in prior phase) | 🟢 RESOLVED | Already consolidated |
| **storeCache singleton** — prevents isolated testing | 🟢 LOW | Refactor continuity.ts |

---

## Decisions Record

| ID | Decision | Status |
|----|----------|--------|
| Q1-Q6 | Validation decisions 2026-04-25 | Locked |
| D-CONF-01..05 | configs.json schema and loading | Locked |
| D-BIND-01..03 | Schema-to-runtime binding | Locked (BIND-03 still requires consumer proof; `conversation_language` traced as wired, `delegation_systems` unresolved) |
| D-CRUD-01..05 | CRUD lifecycle | Locked (CRUD-01 MISSING, CRUD-05 partial) |
| D-LIFECYCLE-01..02 | Lifecycle integration requirements | Locked |
| D-WS-01..03 | Workstream consolidation (5→3) | Locked |
| CA-04 RESTRUCTURE | Split into 4 sub-phases with correct dependency order | NEW — 2026-05-07 |
| O3-DOCS-FOUNDATION | Option 3 Sector Governance Foundation is docs-only L5 evidence layered onto CA-04, not a runtime implementation claim | NEW — 2026-05-07 |
| WS-MCM | Meta-Concept Migration workstream added — 4 phases (MCM-01 through MCM-04) for agent/skill migration, config integration, and end-user customization | NEW — 2026-05-07 |
| D-MCM-01 | gsd-* agents/skills are NEVER shipped — dev tooling boundary enforced | NEW — 2026-05-07 |
| D-CP-ST-04-01 | PendingDispatchRegistry byParent reverse index (D-04) + handleChatMessage classification-first (D-05) delivered; 4 atomic commits, 37 new tests, 0 regressions | NEW — 2026-05-13 |
| D-CP-ST-04-02 | Directory Architecture Fix: HierarchyIndex root main tracking (D-03, D-08) + root-only directory creation (D-02) + ChildWriter root main routing (D-03); 6 atomic TDD commits, 25 new tests, 318/320 pass | NEW — 2026-05-15 |
| D-CP-ST-04-03 | Hierarchy manifest system: hierarchy-manifest.json coexists with session-continuity.json — manifest is flattened authoritative lookup; continuity index preserves hierarchical tree; 3 TDD commits, 27 new tests, 338/340 pass | NEW — 2026-05-15 |
| D-CP-ST-04-03a | registerChild() must be called before getRootMain() in writeImmediateChildFile to resolve root main for fresh children (otherwise getRootMain returns undefined) | NEW — 2026-05-15 |
| D-CP-ST-04-03b | createChildFile in tool-capture intentionally overwrites immediate write — richer metadata from PostToolUse supersedes initial record | NEW — 2026-05-15 |
| P0-GOV | Phase 0 Governance Baseline blocks BOOT/MCM/f-04 until identity, source-plane, config, meta-authoring, and route gates pass | NEW — 2026-05-07 |
| P0-ID | Product is Hivemind; package/bin are `hivemind`; harness is project type; OpenCode is platform; `opencode-harness` and `hivemind-tools` are legacy aliases only | NEW — 2026-05-07 |
| BOOT-02R | BOOT-02 implementation summaries were reconciled before BOOT-03 automation resumed | COMPLETE — 2026-05-08 |
| CP-PTY-00 | Shell/PTY/background command control-plane spike is docs/spec only and may run parallel with BOOT continuation | NEW — 2026-05-08 |
| CP-PTY-01 | Runtime shell/PTY control-plane implementation is blocked on BOOT-07 unless explicitly authorized earlier | NEW — 2026-05-08 |
| CP-PTY-02 | SDK session delegation integration — async/sync child-session dispatch, context injection, completion detection | NEW — 2026-05-08 |
| CP-PTY-03 | Agent/subagent background task coordination — wave dispatch, completion-looping, queue dedup, lifecycle cascade | NEW — 2026-05-08 |
| CP-PTY-04 | Cross-cutting shell integration — wires background commands to session/task/journal/hooks/permissions | NEW — 2026-05-08 |
| DA-IN-02 | Fork handling uses reference-copy (not deep-copy) for child delegations — both sessions share same child .json files; T-12-11 mitigated; copyForkedChildren() in SessionTracker | NEW — 2026-05-12 |
| D-PHASE12-COMPLETE | All 14 CP-ST-01-REVIEW.md findings resolved with verifiable evidence across 3 waves; pipeline verified end-to-end | NEW — 2026-05-12 |
| CP-CMD-01 | Command architecture classified: CQRS pattern (read: hivemind-command-engine, write: execute-slash-command), deprecated tools removed from `.opencode/` (violates soft meta-concepts-only rule), `list_commands` action added | NEW — 2026-05-13 |
| D-CP-ST-06-01 | Test audit complete: 25 failing tests all classified as 'rewrite' (0 keep, 0 delete); RC-3 (API mismatch) accounts for 19/25 root causes; 22 new integration tests across 4 files; 8 TDD RED tests for RetryQueue awaiting CP-ST-06-03 implementation | NEW — 2026-05-16 |
| D-CP-ST-06-COMPLETE | CP-ST-06 fully complete: 5/5 plans, 418/418 tests pass, typecheck clean, all code review findings fixed (CR-01, CR-02, WR-01..04, IN-01..04), Nyquist gaps filled (5 gaps, 11 tests). 6 root causes fixed: RC-1 (hierarchy reverse-order), RC-2 (nested child status), RC-3 (gate:none→unknownSub), RC-4 (lastMessage truncation), RC-5 (error swallowing→retry queue), RC-6 (stale tests). Runtime preservation: parent task result capture, L2 hierarchy registration, unknownSub bootstrap guard, recovery reads child JSON | NEW — 2026-05-17 |
| D-15-05 | computeTotalToolActivityDuration pure function + 4-condition isComplete (stalled + assistant + fileChanges + sufficientDuration); totalToolActivityDurationMs in result; minTotalToolActivityDurationMs in options (default 60s); 9 new tests, 31 total, all pass | NEW — 2026-05-19 |
| D-16-01 | Schema extension: filter-sessions on session-tracker, aggregate on session-context, get-manifest on session-hierarchy; new session-view.schema.ts with SessionViewInputSchema for hivemind-session-view tool | NEW — 2026-05-19 |
| D-16-06 | Event-tracker deprecation cleanup: src/ references in AGENTS.md comments and plugin.ts migration code left intact (legitimate historical/migration documentation); .opencode/skills/ references updated with deprecation annotations; evals.json not modified (test fixture per D-16) | NEW — 2026-05-19 |
| D-16-04 | get-manifest action on session-hierarchy tool: handleGetManifest reads hierarchy-manifest.json via safeSessionPath + readFile + JSON.parse. Returns flattened child list with status/delegatedBy/depth/turnCount/createdAt. No new imports. | NEW — 2026-05-20 |
| D-17-01 | Plan 01 audit complete: 32 files audited (shared/, config/, routing/), zero dead code, zero architecture violations, 3 minor test-gaps in shared/ (tool-response.ts, task-status.ts, tool-helpers.ts lack dedicated test files). 3 RESEARCH.md corrections: routing HAS test coverage (9 files), compiler.ts is 410 LOC (not ~500), profile filename corrected. Findings report ready for Phase 18 consumption. | NEW — 2026-05-20 |
| D-17-03 | Plan 03 audit complete: 47 files audited (coordination/ 31 files, task-management/ 16 files). Found 5 dead files (entire recovery/ submodule, 763 LOC, zero runtime consumers). Corrected 3 RESEARCH.md inaccuracies: sdk-delegation/ HAS tests (tests/lib/sdk-delegation.test.ts), command-delegation/ HAS tests (tests/lib/command-delegation.test.ts), manager.ts is 362 LOC (not ~500). storeCache singleton confirmed as known context-rot (ARCHITECTURE.md line 266). asString duplication confirmed resolved. All active submodules have adequate test coverage. | NEW — 2026-05-20 |
| D-18-01 | Deleted dead toggle-gates module (83 LOC) + test file — 0 external importers | NEW — 2026-05-20 |
| D-18-02 | Deleted dead steering-engine (609 LOC, 3 files + empty subdirs) — 0 external importers | NEW — 2026-05-20 |
| D-18-03 | Deleted dead runtime-detection module (195 LOC, 2 files) + test — 0 external importers | NEW — 2026-05-20 |
| D-18-04 | Deleted dead recovery/ submodule (763 LOC, 5 source + AGENTS.md + .gitkeep + 4 tests) — 0 external importers, session-tracker recovery test preserved | NEW — 2026-05-20 |
| D-18-05 | Extracted storeCache singleton from continuity/index.ts into store-cache.ts with get/set/reset API — 4 TDD tests, all 2382 suite tests pass | NEW — 2026-05-20 |
| D-18-06 | Narrowed command-engine barrel: replaced export * with 3 explicit named exports (executeCommandEngineAction, listCommands, discoverCommandBundles). 4 internal routing functions removed from public API. typecheck clean, 2382/2384 tests pass. | NEW — 2026-05-21 |
| D-18-07 | Updated boundary manifests for Phase 18 cleanup: STRUCTURE.md removed steering-engine/ and recovery/, added store-cache.ts; ARCHITECTURE.md removed same from component tables; CONCERNS.md removed 3 stale recovery concerns, added cleanup annotation; AGENTS.md removed recovery from task-management comment. All grep acceptance criteria pass. | NEW — 2026-05-21 |
| D-19-01 | Schema cleanup corrected: `permission.schema.ts` deleted as prototype; `tool-definition.schema.ts` migrated to `tool.schema.ts`; `skill-metadata.schema.ts` preserved due active consumers. | NEW — 2026-05-21 |
| D-19-02 | Historical trace locked: `session-classification-hook.ts`, `schema-normalizer.ts`, and `delegation-packet.ts` were intended-but-unwired feature gaps, not meaningless dead code; future rebuild must use requirements f-04c, REQ-ST-12, and F-09a. | NEW — 2026-05-21 |
| D-19-03 | Final cleanup removed stale `concurrency-key` test, empty `src/kernel`/`src/harness` folders, and synchronized ROADMAP/STATE/codebase/AGENTS drift before clean dist rebuild. | NEW — 2026-05-21 |

---

## Phase 0 Governance Baseline Progress

| Artifact | Status | Evidence level |
|---|---|---|
| `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/config/hivemind-config-contract-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/checklists/phase-0-governance-gate-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/roadmap/phase-0-gsd-route-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
| `.planning/ROADMAP.md` update | ✅ COMPLETE | L5 docs/governance |
| `.planning/STATE.md` update | ✅ COMPLETE | L5 docs/governance |

Runtime readiness remains blocked until later L1-L3 proof exists. Phase 0 governance gate PASSED.

---

## BOOT-02 / BOOT-02R Progress (Phase 0 Gate Passed — Authorized)

| Task | Status | File | LOC |
|------|--------|------|-----|
| T01 | ✅ COMPLETE | `src/lib/bootstrap-structure.ts` | 124 |
| T02 | ✅ COMPLETE | `src/tools/bootstrap-init.ts` | Summary evidence |
| T03 | ✅ COMPLETE | `src/tools/bootstrap-recover.ts` | Summary evidence |
| T04 | ✅ COMPLETE | `src/cli/commands/init.ts` | Summary evidence |
| T05 | ✅ COMPLETE | `src/cli/commands/doctor.ts` | Summary evidence |
| T06 | ✅ COMPLETE | `src/cli/commands/recover.ts` | Summary evidence |
| T07 | ✅ COMPLETE | `src/cli/commands/version.ts` | Summary evidence |
| T08 | ✅ COMPLETE | `src/cli/index.ts` (MODIFY) | Summary evidence |
| T09–T13 | ✅ COMPLETE | `tests/cli/commands/*.test.ts` | Summary evidence |

BOOT-02 phase-local summaries report implementation and verification evidence in the working tree. BOOT-02R reconciled the active governance truth; BOOT-03 is now the next BOOT phase.

## CP-PTY Runway Progress

| Phase | Status | Evidence level | Notes |
|---|---|---|---|
| CP-PTY-00 | ✅ COMPLETE | L5 docs/spec | Context, research, requirements, spec, verification all passed |
| CP-PTY-01 | 🔵 READY | L2-L3 required | BOOT-07 complete, entry gate satisfied |
| CP-PTY-02 | ⬜ NOT PLANNED | L2-L3 required | SDK child-session delegation integration |
| CP-PTY-03 | ⬜ NOT PLANNED | L2-L3 required | Agent/subagent background task coordination |
| CP-PTY-04 | ⬜ NOT PLANNED | L2-L3 required | Cross-cutting shell integration (wires everything) |
| CP-CMD-01 | ✅ COMPLETE | L3 source | Command architecture classification, deprecated tools removed from .opencode/, slash command tool enhanced, list_commands action added |
| SC-PTY-01 | ⬜ DEFERRED | L2-L3 required | Read-only projection only after CP-PTY-01 and Q2 sidecar confirmation |

## Session Tracker Runway Progress

| Phase | Status | Evidence level | Notes |
|---|---|---|---|
| CP-ST-01 | ✅ COMPLETE | L3 source | Session tracker revamp — initial implementation |
| CP-ST-02 | ✅ COMPLETE | L3 source | Deep fix remaining defects |
| CP-ST-03 | ✅ COMPLETE | L3 source | Architecture detox — event-tracker excision, plugin.ts purification |
| CP-ST-04 | ✅ COMPLETE | L3 source | Architecture fix — PendingDispatchRegistry, directory architecture, hierarchy manifest |
| CP-ST-05 | ✅ COMPLETE | L3 source | Data loss investigation — root cause analysis, 6 decisions locked |
| CP-ST-06 | ✅ COMPLETE | L3 source + L2 tests | Root cause rewrite — 6 RCs fixed, 418/418 tests, retry queue, runtime preservation |
| CP-DT-01 | ✅ EXECUTION COMPLETE | L5→L2-L3 | Delegate-Task Ecosystem Revamp — 5/5 plans executed; Plan 01-05 summaries complete; Plan 05 added total tool activity duration tracking (GAP-M3); review/validation/live-smoke gates pending |

---

## Accumulated Context

### Roadmap Evolution

- **2026-05-08** — SR-00 through SR-10 phase directories created: 11 directories with `.gitkeep` registration under `.planning/phases/SR-*/`
- **2026-05-08** — WS-SR ROADMAP.md updated: improved phase descriptions with OMO kebab-case conventions, feature-module pattern (index.ts + types.ts + AGENTS.md per module), colocated tests, barrel exports, hierarchical AGENTS.md guidance, 500 LOC cap enforcement, verification commands per phase
- **2026-05-08** — STATE.md updated: current phase set to SR-0, health green, control mode set to managed autonomous loop, SR directories registered
- **2026-05-08** — Restructuring plan refined: `.planning/architecture/structure-restructuring-plan-2026-05-08.md` contains complete file mapping (current → target), 10-phase migration plan with risk assessment, rollback strategy, circular dependency resolution, verification commands
- **2026-05-12** — Phase 13 added: Fix all session-tracker defects with gatekeeping TDD SPEC-driven honest validation and regression prevention
- **2026-05-13** — CP-ST-03 phase created: Architecture Detox (event-tracker excision + plugin.ts purification). Plan 01 (Event-Tracker Excision) complete — 22 files deleted, 7 docs synced, EXCISION.md test (13 assertions) passes. Plan 02 (Plugin.ts Purification) complete — 7 inline closures extracted to 14 files, plugin.ts 330→267 LOC (19% reduction), 33 new unit tests all pass.
- Phase CP-ST-06 added: Session Tracker Root Cause Rewrite — triệt để rewrite 6 root causes + xóa 30 stale mock tests
- **2026-05-18** — Phase CP-DT-01 INSERTED after CP-ST-06: Delegate-Task Ecosystem Revamp — toàn diện refactor delegate-task (proven broken: child sessions freeze sau 30 phút, 0 tool calls). 4 deliverables: SPEC.md, CONTEXT.md, RESEARCH.md, PATTERN.md. Research sâu OpenCode SDK + source-code architecture trước khi design v2.
- Phase 16 added: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Nâng cấp read-side tools, deprecate event-tracker, sửa hivemind-power-on skill
- **2026-05-21** — Phase 18 complete (4/4 plans). Gatekeeping: 3 gates clear, 2 WARNING findings.
- **2026-05-21** — **HARD RESTRUCTURING RUNWAY INSERTED**: Phases 19-25 before original Phases 19/20 (pushed to 27/28). Based on 4 initial research + 6 deep analysis agents (3,807 LOC) + full restructuring map (3,994 LOC). Phase 26 added as post-restructuring integration verification. Sequence: non-destructive → deps → async I/O → typed errors → plugin decomposition + module split → session-tracker split → legacy + test gaps + tool relocation + CQRS → integration verification → sync-oss.yml → package primitives.
- **2026-05-21** — **REORDERED per owner's 3-group framework**: Group 1 (Orchestration Design Fix, P21-P25) → Group 2 (Routing/Coordination, P26-P28) → Group 3 (Schema/Config, P29-P31) → Group 4 (Structural Cleanup, P32-P35) → P36-P37 independent. Based on 16 research artifacts (6,621 LOC), 6 deep-analysis reports, phase-reordering analysis (4 critical violations). Session-tracker FIRST with production evidence.

### Key Restructuring Decisions

| ID | Decision |
|----|----------|
| SR-D-01 | kebab-case everywhere — directories and files follow OMO naming conventions |
| SR-D-02 | Feature-module pattern — each module has `index.ts` (barrel), `types.ts`, `AGENTS.md` |
| SR-D-03 | Colocated tests — `manager.ts` + `manager.test.ts` in same directory (not separate `tests/`) |
| SR-D-04 | 500 LOC cap — modules exceeding 500 LOC (continuity.ts: 465, plugin.ts: 447, delegation-manager.ts: ~500) must be split |
| SR-D-05 | AGENTS.md at every level — hierarchical guidance from `src/AGENTS.md` down to individual module `AGENTS.md` |
| SR-D-06 | Circular dependency resolution — `primitive-scanners.ts ↔ primitive-registry.ts` and `runtime-validator.ts ↔ cross-primitive-validator.ts` resolved by extracting shared types |
| SR-D-07 | Rollback strategy — per-phase atomic commits; full rollback via `git checkout main && git branch -D refactor/structure-restructuring` |

---

## Next Actions

1. **P00.5** 📋 — Non-destructive foundation sweep (delete 3 dead schemas, rebuild dist/, remove 2 legacy hooks).
2. **Phase 21** 📋 — Session-Tracker Design Fix (Group 1, HIGHEST PRIORITY — fix F-01 temp leak, F-02 manifest wire, F-04/F-07/F-08 recovery).
3. **Phase 22** 📋 — Coordination Status + Error Unification (Depends: P21).
4. **Phase 23** 📋 — Coordination Dispatch + Delegate-Task Fix (Depends: P22). Includes CP-DT-01 runtime block resolution.
5. **Phase 24** 📋 — Trajectory + Agent-Work-Contract Redesign (Depends: P23).
6. **Phase 25** 📋 — Pressure + Notification Redesign (Depends: P23).
7. **Phase 26** 📋 — Routing + Intent Loop Foundation (Group 2, Depends: P21-P25).
8. **Phase 27** 📋 — Hook Injection Plane Redesign (Group 2, Depends: P26).
9. **Phase 28** 📋 — Auto-Looping + PTY + Background Command Revamp (Group 2, Depends: P27).
10. **Phase 29** 📋 — Schema Kernel Cleanup (Group 3, can run parallel to Groups 1-2).
11. **Phase 30** 📋 — Config Plane Redesign (Group 3, Depends: P29).
12. **Phase 31** 📋 — Shipped Primitives + Governance Wire (Group 3, Depends: P30).
13. **Phase 32** 📋 — Plugin.ts Decomposition (Group 4, LAST — Depends: P21-P31 design fixes settled).
14. **Phase 33** 📋 — Async I/O Conversion + Typed Errors (Group 4, Depends: P32).
15. **Phase 34** 📋 — Module Splits + Legacy Inventory (Group 4, Depends: P33).
16. **Phase 35** 📋 — Integration Verification (Group 4, Depends: P34).
17. **Phase 36** 📋 — Fix sync-oss.yml workflow (deferred, Depends: P35).
18. **Phase 37** 📋 — Package .opencode/ primitives (deferred, Depends: P36).
19. **CP-PTY-01** — Background Shell Control-Plane MVP (after restructuring runway).

## Option 3 Foundation Artifacts

- `.planning/research/omo-adaptation-architecture-2026-05-07.md`
- `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md`
- `.planning/architecture/hivemind-command-workflow-session-map-2026-05-07.md`
- `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md`
- `.planning/checklists/pre-phase-omo-adaptation-2026-05-07.md`

Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists

## Phase 0 Governance Artifacts

- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
- `.planning/config/hivemind-config-contract-2026-05-07.md`
- `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md`
- `.planning/checklists/phase-0-governance-gate-2026-05-07.md`
- `.planning/roadmap/phase-0-gsd-route-2026-05-07.md`

All Phase 0 artifacts are L5 documentation/governance evidence only.

## Current Control Artifacts

- `.planning/roadmap/managed-autonomous-loop-2026-05-07.md`
- `.planning/lifecycle/lifecycle-overview-2026-05-07.md`
- `.planning/roadmap/shell-pty-control-plane-route-2026-05-08.md`

---
*State updated: 2026-05-21 for cluster-based restructuring reordering*
