---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planned
last_updated: "2026-05-13T14:50:00.000Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 6
  completed_plans: 0
  percent: 0
---

<!-- generated-by: gsd-doc-writer -->

# Hivemind — State

**Last updated:** 2026-05-13
**Last trigger:** CP-CMD-01 complete — command architecture classified, deprecated tools removed from .opencode/, slash command tool enhanced, list_commands action added

---

## Current Status

**Active phase:** BOOT-09 — MVP Config Schema + Entry Init Verification. 3 plans verified and ready for execution.
**Health:** 🟢 Build passes (`npm run build`), typecheck clean (`npm run typecheck`), 2104 tests (2 pre-existing failures) — 12 new tool guard tests added. Session tracker pipeline verified.
**Phase 12 status:** 🟢 COMPLETE — 3 plans, 3 summaries, 14 review findings resolved, fork handling implemented, 247 session-tracker+tools tests (0 failures).

Core workstreams delivered: SR restructuring (SR-0 through SR-10) — `src/lib/` removed, source planes reorganized. BOOT-01 through BOOT-08 complete. MCM-01/MCM-02 complete. CP-PTY-00 complete (docs/spec).

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)  
**Core value:** Agents build on each other's work across sessions  
**Current focus:** Phase 13 — fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr

**Docs-only foundation delivered:** Option 3 — Sector Governance Foundation completed. 9 sector AGENTS.md files, gate-cleared for docs scope. O3-01 through O3-04 all delivered. Runtime readiness remains blocked (by design).

**Package naming:** `package.json` names package/bin as `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only unless explicitly labeled.

**Canonical identity:** Product Hivemind; package/bin `hivemind`; project type harness; current platform OpenCode; GSD is internal workflow tooling, not product identity.

---

## What's Delivered

| Component | Status | Details |
|-----------|--------|---------|
| Build system | ✅ | tsc clean, typecheck passes, dist/ produces correctly |
| Test suite | ✅ | 125 test files, 1767 tests, 2 failures (README heading assertions) |
| 16 custom tools | ✅ | Registered in plugin.ts, Zod schemas, CQRS write-side |
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
| **`asString` duplicated** — helpers.ts + continuity.ts | 🟢 LOW | Consolidate |
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

---

## Accumulated Context

### Roadmap Evolution

- **2026-05-08** — SR-00 through SR-10 phase directories created: 11 directories with `.gitkeep` registration under `.planning/phases/SR-*/`
- **2026-05-08** — WS-SR ROADMAP.md updated: improved phase descriptions with OMO kebab-case conventions, feature-module pattern (index.ts + types.ts + AGENTS.md per module), colocated tests, barrel exports, hierarchical AGENTS.md guidance, 500 LOC cap enforcement, verification commands per phase
- **2026-05-08** — STATE.md updated: current phase set to SR-0, health green, control mode set to managed autonomous loop, SR directories registered
- **2026-05-08** — Restructuring plan refined: `.planning/architecture/structure-restructuring-plan-2026-05-08.md` contains complete file mapping (current → target), 10-phase migration plan with risk assessment, rollback strategy, circular dependency resolution, verification commands
- **2026-05-12** — Phase 13 added: Fix all session-tracker defects with gatekeeping TDD SPEC-driven honest validation and regression prevention

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

1. **CP-CMD-01 delivered** — command architecture classified, deprecated tools relocated, slash command tool enhanced.
2. **Return to CP-PTY-01** — background shell control-plane MVP is ready after WS-SR completion.
3. **Resume MCM/f-04 dependency order** — follow ROADMAP gates after CP-PTY readiness checks.

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
*State updated: 2026-05-08 for SR remediation completion*
