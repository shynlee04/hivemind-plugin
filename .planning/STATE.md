<!-- generated-by: gsd-doc-writer -->
# Hivemind — State

**Last updated:** 2026-05-07  
**Last trigger:** Phase 0 governance baseline created and BOOT/MCM continuation routed behind Phase 0 gate

---

## Current Status

**Active workstreams:** Bootstrap CLI (WS-BOOT) — Phase 0 governance gate PASSED  
**Current phase:** BOOT-02 (CLI Framework + Entry Point) — T01 complete, T02-T13 pending  
**Blocked:** No — Phase 0 gate passed, BOOT-02 continuation authorized  
**Health:** 🟢 Phase 0 governance baseline complete; runtime health claims unchanged from prior evidence
**Control mode:** Managed autonomous loop — one authorized cycle at a time

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)  
**Core value:** Agents build on each other's work across sessions  
**Current focus:** BOOT-02 CLI commands. Phase 0 governance baseline complete (identity, lineage, hierarchy, source planes, config contract, meta-authoring boundary).

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

---

## What's Broken / Missing

| Issue | Severity | Action |
|-------|----------|--------|
| **No bootstrap/recovery** — delete `.opencode/` or `.hivemind/`, `npm run build` restores nothing | 🔴 CRITICAL | CA-04.1: postinstall script + CLI init |
| **Config consumer gap remains** — `conversation_language` is traced as wired in config traceability, but `delegation_systems` has no runtime consumer | 🔴 CRITICAL | Phase 0 config contract + CA-04.2: wire or explicitly defer dead config fields |
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

## BOOT-02 Progress (Phase 0 Gate Passed — Authorized)

| Task | Status | File | LOC |
|------|--------|------|-----|
| T01 | ✅ COMPLETE | `src/lib/bootstrap-structure.ts` | 124 |
| T02 | ⬜ PENDING | `src/tools/bootstrap-init.ts` | — |
| T03 | ⬜ PENDING | `src/tools/bootstrap-recover.ts` | — |
| T04 | ⬜ PENDING | `src/cli/commands/init.ts` | — |
| T05 | ⬜ PENDING | `src/cli/commands/doctor.ts` | — |
| T06 | ⬜ PENDING | `src/cli/commands/recover.ts` | — |
| T07 | ⬜ PENDING | `src/cli/commands/version.ts` | — |
| T08 | ⬜ PENDING | `src/cli/index.ts` (MODIFY) | — |
| T09–T13 | ⬜ PENDING | `tests/cli/commands/*.test.ts` | — |

---

## Next Actions

1. **Phase 0 PASSED** — identity, source planes, config, meta-authoring, checklist, route all complete.
2. **Resume BOOT-02 Wave 1** — T02 + T03 (CQRS write-side tools).
3. **Continue BOOT-02 Waves 2-4** — command handlers, registration wiring, contract tests.
4. **Continue BOOT-03 through BOOT-07** — state init, primitives recovery, config bootstrap, validation, E2E proof.
5. **After BOOT-04 symlinks:** Resume MCM-01 + MCM-02 — agent + skill migration.
6. **After BOOT + MCM prerequisites:** Resume f-04 routing foundation.

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

---
*State updated: 2026-05-07 for Phase 0 governance baseline*
