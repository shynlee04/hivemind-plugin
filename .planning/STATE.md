---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Hivemind Core
current_phase: 11 — Governance Reconciliation
status: active
last_updated: "2026-05-11T12:00:00.000Z"
progress:
  total_phases: 31
  completed_phases: 2
  total_plans: 28
  completed_plans: 9
  percent: 32
---

# Hivemind — State

**Last updated:** 2026-05-11
**Last trigger:** Phase 11 governance reconciliation — all core artifacts audited against live evidence
**Evidence baseline:** `11-TRUTH-MATRIX.md` — 20 stale claims found, 9 confirmed accurate

---

## Current Status

**Active phase:** 11 — Governance Reconciliation (GOV-01). Reconcile STATE.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and 7 sector AGENTS.md files against live evidence.  
**Health:** 🟢 Build passes (`npm run build`), typecheck clean (`npm run typecheck`), 1978 tests (2 failures). Vitest hoist warnings remain non-fatal.  
**Completed workstreams:** SR restructuring (SR-0 through SR-10) — `src/lib/` removed, source planes reorganized under 8 top-level src/ directories. BOOT-01 through BOOT-08 complete — bootstrap/init CLI proven E2E. MCM-01/MCM-02 complete — 89 agents and 125 skill directories migrated. CP-PTY-00 complete — shell/PTY control-plane spike delivered (docs/spec). Node 9.0.0/Python 3.9.6.  
**Blocked:** No. All entry gates for CP-PTY-01 satisfied.  
**Control mode:** Phase-gated autonomous. Cycle 2 (Bootstrap Recovery) complete.

Cycle 3 (Routing Foundation) pending governance reconciliation and CP-PTY-01 completion.

## Project Reference

**Product:** Hivemind | **Package/bin:** `hivemind` | **Type:** harness | **Platform:** OpenCode  
**Legacy aliases:** `opencode-harness`, `hivemind-tools` (explicitly labeled legacy only)  
**Package:** `package.json` names package as `hivemind`. SDK: `@opencode-ai/plugin` ^1.14.41, `@opencode-ai/sdk` ^1.14.41.  
**Core value:** Agents build on each other's work across sessions.

## What's Delivered

**Harness capabilities:** 16 custom tools registered via `plugin.ts` — all Zod-schematized on the CQRS write-side. Tools cover delegation dispatch (`delegate-task`, `delegation-status`), session management (`session-tracker`, `session-journal-export`, `session-patch`), config query (`configure-primitive`), prompt analysis (`prompt-skim`, `prompt-analyze`), bootstrap (`bootstrap-init`, `bootstrap-recover`), document intelligence (`hivemind-doc`), trajectory tracking (`hivemind-trajectory`), pressure classification (`hivemind-pressure`), and more. 6 hook types registered: 3 lifecycle observers (`session.created`, `session.entry`, `session.journey`), 2 message transforms (`system.transform`, `chat.system.transform`), and 1 tool guard (`tool.execute.after`). configs.json schema with 29 fields served through a lazy-cached subscriber (`readConfigs()`/`writeConfigs()`). Behavioral profile system dispatching 3 modes (expert-advisor, hivemind-powered, free-style) with mode-aware delegation routing. Toggle gate infrastructure — 6 toggles wired at runtime, 4 annotated as `@future-consumer` (deferred), 4 fully deferred (no consumer yet).

**Delegation & persistence:** WaiterModel delegation engine with dual-signal completion detection across PTY and SDK lanes — supports always-background dispatch, status polling, and result retrieval. Continuity persistence layer with deep-clone-on-read integrity, session journal as append-only event timeline, and Q6 state root migration (`.hivemind/` canonical, `.opencode/` primitives-only). Bootstrap/init CLI proven E2E — `npx hivemind init` installs project primitives with project-scope fallback, `npx hivemind doctor` validates health and discoverability. Circuit breaker thresholds and tool-call budget policies enforced at the plugin composition root.

**Primitive inventory — agents:** 89 agents across hm-* (product-dev, STRICT) and hf-* (meta-builder, FLEXIBLE) lineages, organized in L0→L1→L2→L3 hierarchy. 56 agents are shipped product agents (45 hm-* + 11 hf-*); remaining 33 are gsd-* internal developer tooling (NEVER shipped per D-MCM-01). Each agent has YAML frontmatter defining its lineage, tools, permissions, and depth level.

**Primitive inventory — skills:** 125 active skill directories under `.opencode/skills/`. 57 shipped product skills: 35 hm-* (product-dev workflows: brainstorm, spec-driven-authoring, test-driven-execution, debug, refactor, research, synthesis, etc.), 13 hf-* (meta-builder: agent/skill/command/tool authoring), 3 gate-* (internal quality gate triad: evidence-truth, lifecycle-integration, spec-compliance), 6 stack-* (framework references: bun-pty, json-render, nextjs, opencode, vitest, zod). 3 additional (1 opencode-config-workflow, 1 hivemind-power-on, 1 hivemind-governance). Remaining 65 are gsd-* developer tooling (not shipped).

**Primitive inventory — commands:** 19 commands across 7 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork), 7 extended (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack), 1 sync (sync-agents-md), and 4 test (test-echo, test-list, test-spike-execute, test-status). 7 sector AGENTS.md files across all governance layers.

**Structural integrity:** `src/lib/` has been removed. Source planes now live under `src/shared/`, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, `src/hooks/`, and `src/tools/`. `plugin.ts` at 242 LOC (target: 100). Test suite: 149 test files containing 1978 test cases (all unit; zero integration/E2E).

## What's Broken / Missing

| Issue | Severity | Action |
|-------|----------|--------|
| **Config consumer gap** — `delegation_systems` config field has no runtime consumer | 🔴 CRITICAL | CA-04.2: wire or explicitly defer |
| **f-04 auto-routing MISSING** — no intent classification, no workflow router | 🔴 CRITICAL | Wave 3: design from skeleton §5.2 |
| **E2E tests MISSING** — all 1978 tests are unit; zero integration/E2E | 🟡 HIGH | Add delegation smoke test |
| **Lifecycle gate criteria MISSING** — `references/` empty in gate-l3-lifecycle-integration | 🟡 HIGH | CA-04.4: synthesize from ARCHITECTURE.md |
| **`.hivemind/` ownership gap** — 11 subdirectories, only 2 have typed CRUD modules | 🟡 HIGH | CA-04.3: after bootstrap |
| **plugin.ts LOC** — 242 LOC vs 100 target | 🟡 MEDIUM | Extract hook/tool registration modules |
| **`asString` duplicated** — helpers.ts + continuity.ts | 🟢 LOW | Consolidate |
| **storeCache singleton** — prevents isolated testing | 🟢 LOW | Refactor continuity.ts |

## Active Phase Runway

| Phase | Title | Status | Depends On | Notes |
|-------|-------|--------|------------|-------|
| **GOV-01** | Governance Reconciliation (THIS PHASE) | 🔵 IN PROGRESS | — | Updating all core artifacts |
| CP-PTY-01 | Background Shell Control-Plane MVP | 🔵 READY | BOOT-07, CP-PTY-00 | Permission-gated command lifecycle; PTY + headless fallback |
| CP-PTY-02 | SDK Session Delegation Integration | ⬜ NOT PLANNED | CP-PTY-01, BOOT-08 | Async/sync child-session dispatch, context injection |
| CP-PTY-03 | Agent/Subagent Background Task Coordination | ⬜ NOT PLANNED | CP-PTY-02, BOOT-08 | Wave dispatch, completion-looping, queue dedup |
| CP-PTY-04 | Cross-Cutting Shell Integration | ⬜ NOT PLANNED | CP-PTY-03, MCM-03 | Wires background commands to session/task/journal/hooks |
| CP-ST-01 | Session Tracker Revamp | 🔵 PLANNED | SR-10, BOOT-07 | Hook wiring, file format validation, session capture |
| SC-PTY-01 | Read-Only Terminal Projection | ⬜ DEFERRED | CP-PTY-01, Q2 confirmation | Read-only projection only; blocked on sidecar decision |
| f-04 | Auto-commands + Workflow Router | ⬜ PENDING | Phase 0, BOOT, MCM | HIGHEST GAP — no intent classification exists |
| MCM-03 | Config Plane Integration | ⬜ PENDING | MCM-01, MCM-02, BOOT-06 | Doctor agent/skill counts, config integration |
| MCM-04 | End-User Customization | ⬜ PENDING | MCM-03 | User-project customization surface |

## Archived Content

Historical detail previously in STATE.md has been moved to `.planning/archive/state-history/` (6 date-stamped files extracted 2026-05-11):

- `01-boot-task-list-2026-05-11.md` — BOOT-02 task table (T01–T13)
- `02-phase-0-governance-progress-2026-05-11.md` — Phase 0 artifact checklist
- `03-sr-decisions-2026-05-11.md` — SR restructuring decisions (D-01 through D-07)
- `04-accumulated-context-2026-05-11.md` — Roadmap evolution history
- `05-next-actions-2026-05-11.md` — Next actions from prior STATE.md
- `06-delivered-components-2026-05-11.md` — Component status table (replaced by paragraph summary above)

These archives preserve the full history. Git history also preserves the pre-rewrite STATE.md.

## Recent Decisions

| ID | Decision | Status |
|----|----------|--------|
| Q1-Q6 | Validation decisions 2026-04-25 | Locked |
| D-CONF-01..05 | configs.json schema and loading | Locked |
| D-BIND-01..03 | Schema-to-runtime binding | Locked (BIND-03: `conversation_language` wired, `delegation_systems` unresolved) |
| D-WS-01..03 | Workstream consolidation (5→3) | Locked |
| P0-ID | Product Hivemind; package/bin `hivemind`; `opencode-harness` legacy | Locked |
| CA-04 RESTRUCTURE | Split into 4 sub-phases with dependency order | NEW — 2026-05-07 |
| O3-DOCS-FOUNDATION | Option 3 is docs-only L5, not runtime | NEW — 2026-05-07 |
| WS-MCM | Meta-Concept Migration workstream (MCM-01..04) | NEW — 2026-05-07 |
| D-MCM-01 | gsd-* agents/skills NEVER shipped | Locked |
| BOOT-02R | BOOT-02 summaries reconciled before BOOT-03 | COMPLETE |
| CP-PTY-00 | Shell/PTY spike docs/spec only | COMPLETE |
| SR-D-01..07 | SR restructuring decisions (archived: `.planning/archive/state-history/03-sr-decisions-2026-05-11.md`) | COMPLETE |
| GOV-01 | Phase 11 governance reconciliation (D-01 through D-15) | IN PROGRESS |

## Key Artifacts Index

**Architecture baselines:**
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract: hm-* (product-dev, STRICT), hf-* (meta-builder, FLEXIBLE), gate-* (quality, INTERNAL), stack-* (reference). L0-L3 delegation hierarchy with per-level tool permissions and loading rules.
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model: 9-surface authority table, Phase 0 mutation gates, target source planes for Hard Harness (src/), Soft Meta-Concepts (.opencode/), Internal State (.hivemind/), Meta-Authoring (.hivefiver-meta-builder/), and Governance (.planning/).
- `.planning/codebase/ARCHITECTURE.md` — CQRS model (tools = write-side, hooks = read-side), 9-surface authority with per-surface mutation rules, component dependency graph, module size caps (500 LOC max, 300 target). Dual-layer state (durable JSON continuity.ts + in-memory Maps state.ts).
- `.planning/codebase/STRUCTURE.md` — File tree conventions: kebab-case directories, feature-module pattern (index.ts + types.ts + AGENTS.md per module), colocated tests, barrel exports, hierarchical AGENTS.md guidance.

**Control artifacts:**
- `.planning/roadmap/managed-autonomous-loop-2026-05-07.md` — Autonomous loop governance: phase-gated execution with entry/exit criteria, checkpoint protocol, and wave-based parallelization rules
- `.planning/roadmap/shell-pty-control-plane-route-2026-05-08.md` — CP-PTY phase route: 5-phase dependency chain (CP-PTY-00 through CP-PTY-04) with gate criteria and evidence level requirements per phase
- `.planning/lifecycle/lifecycle-overview-2026-05-07.md` — Session lifecycle phases: bootstrap → delegation → completion → continuity, with transition gates and event wiring map

**Phase evidence (completion proof):**
- BOOT-07: `.planning/phases/BOOT-07-end-to-end-proof/` — E2E bootstrap proof (init + doctor + validate-restart)
- BOOT-08: `.planning/phases/BOOT-08-agent-skill-integration/` — Integration constitution (lineage, permission, routing contracts)
- CP-PTY-00: `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/` — Docs/spec spike (context, research, requirements, specification, verification)
- MCM-01: `.planning/phases/MCM-01-agent-migration/` — 56 shipped agents classified and verified discoverable
- MCM-02: `.planning/phases/MCM-02-skill-migration/` — 48 shipped skills classified and verified discoverable
- SR-10: `.planning/phases/SR-10-cleanup-agents-md-updates/` — SR restructuring completion marker

**Historical state (archived):**
- `.planning/archive/state-history/` — 6 date-stamped files extracted 2026-05-11. Git history preserves all prior STATE.md versions.

**Truth baseline:**
- `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md` — 27 claims verified across 13 governance files via live evidence inspection; 20 stale, 9 confirmed, 1 false (R-01 — GOV-01/CP-ST-02 not yet in ROADMAP table rows). All claims cross-referenced with filesystem, git log, and phase directory completion evidence.

## GOV-01 Verification Status

**Progress:** Plan 01 (truth matrix generation) — COMPLETE. Plan 02 (STATE.md rewrite) — IN PROGRESS.  
**Verified in this plan:** All STATE.md numeric claims matched against 11-TRUTH-MATRIX.md live evidence. Stale numbers corrected: plugin LOC 447→242, test count 1767→1978, test files 125→149, skill dirs 123→125, .hivemind dirs 19→11, AGENTS.md files 9→7, progress percent 73→32.  
**Removed claims:** `messages-transform.ts` dead code (confirmed DELETED per S-07), `src/lib/` directory (confirmed removed per P-04), "12 stale modules" (unverifiable), component delivery table (replaced with paragraph per D-10).  
**Remaining work:** PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and 7 sector AGENTS.md audits against live evidence — to be completed in Phase 11 Plans 03 through 06.


---

*State updated 2026-05-11 for Phase 11 governance reconciliation (GOV-01, Plan 02). Historical STATE.md sections archived to `.planning/archive/state-history/` (6 date-stamped files). All numeric claims cross-referenced against 11-TRUTH-MATRIX.md — 20 stale corrections applied, 9 confirmed accurate. Git history preserves the pre-rewrite STATE.md (216 lines, 13 sections → runway-focused 8-section form). Next update: GOV-01 completion when all remaining core artifacts are reconciled against live evidence.*
