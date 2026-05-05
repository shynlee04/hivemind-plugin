# HiveMind V3 — Runtime Composition Engine

## What This Is

HiveMind V3 is a **runtime composition engine** for OpenCode — an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project spans **4 active workstreams** covering:
- **Hard Harness** (npm package): tools, hooks, plugin assembly, runtime engine
- **Soft Meta-Concepts**: 89 agents, 59 skills, 18 commands (`.opencode/`)
- **Internal State**: session journals, execution lineage, runtime state (`.hivemind/`)
- **Ecosystem Recovery**: HER-0/1/2 complete, HER-3/4/5 ready
- **Governance Layer**: master ROADMAP.md, REQUIREMENTS.md, 3 new planned workstreams, 5 deferred

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.

### Architecture Model

The project is organized along **4 feature paths × 2 lineages** (from MASTER-PROJECT-SKELETON.md):

| Path | Purpose | Lineage |
|------|---------|---------|
| **Path 1** | Agent-Callable Deterministic Features (task CRUD, delegation, context, workflow CRUD, role tools) | hm-* (STRICT) & hf-* (FLEXIBLE) |
| **Path 2** | Runtime Programmatic Features (events, hooks, transforms, compaction, pressure, session entry) | hm-* (STRICT) & hf-* (FLEXIBLE) |
| **Path 3** | Governance / Registry / Permissions / Configuration (primitive registry, config compiler, permission matrix, restart validation, state root) | hm-* (STRICT) & hf-* (FLEXIBLE) |
| **Path 4** | Sidecar + User Onboarding + Safe Configuration (CLI bootstrap, configs.json, doctor, dashboard) | hf-* (FLEXIBLE) |

### Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory | `.hivemind/` |

### State Root (Q6 Decision)

All Hivemind internal deep modules write to `.hivemind/` at project root. `.opencode/` is ONLY for OpenCode primitives (agents, commands, skills). See Q6 decision below for migration details.

## Core Value

Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.

---

## Workstreams

| Workstream | Status | Root | Child Docs | Scope |
|------------|--------|------|------------|-------|
| **harness-ecosystem-recovery** | ACTIVE | `workstreams/harness-ecosystem-recovery/` | ROADMAP.md, STATE.md, REQUIREMENTS.md (→ see child docs) | Ecosystem recovery audit, dead code cleanup, context/compaction, SDK depth, agent rationalization |
| **milestone** | SUSPENDED @ Phase 71 | `workstreams/milestone/` | STATE.md (548L), ROADMAP.md, REQUIREMENTS.md (652L) | Hard harness runtime engine: tools, hooks, plugin assembly, tests, release readiness |
| **skill-ecosystem** | CLOSED (2026-04-30) | `workstreams/skill-ecosystem/` | STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md | hm-* skills: refactor, quality synthesis, RICH-gate |
| **agent-synthesis** | CLOSED (2026-04-30) | `workstreams/agent-synthesis/` | STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md | hf-* builder agents, agent-synthesis pipeline |

### Proposed Workstreams

| Workstream | Priority | Depends On | Purpose |
|------------|----------|------------|---------|
| **hivemind-state-architecture** (WS-1) | CRITICAL | HER-0 | `.hivemind/` canonical directory design, `configs.json` 5-field schema, file format conventions, frontmatter schema |
| **primitive-registry** (WS-3) | HIGH | hivemind-state-architecture | Unified primitive registry (agents/skills/commands/tools/MCP/hooks), permission matrix, cross-primitive validation, stacking/chaining |
| **bootstrap-cli-onboarding** (WS-2) | HIGH | hivemind-state-architecture + primitive-registry | `npm install` → `npx init` pathway, greenfield/brownfield setup, doctor mode, CLI substrate |

### Deferred Workstreams

| Workstream | Priority | Depends On | Purpose |
|------------|----------|------------|---------|
| auto-commands-workflow-router (WS-4) | MEDIUM | primitive-registry | Intent → workflow routing, auto-commands engine (f-04) |
| delegation-revamp (WS-5) | MEDIUM | primitive-registry | Multi-lane delegation: graph/swarm/CRUD/hierarchy (f-06) |
| trajectory-task-plus (WS-6) | MEDIUM | delegation-revamp + hivemind-state-architecture | Cross-session task lifecycle, trajectory ledger v3 (f-07) |
| context-compaction-engine (WS-7) | MEDIUM | trajectory-task-plus + hivemind-state-architecture | Event-tracker redesign, context purification, time-machine (f-08) |
| sidecar-user-config-ui (WS-8) | LOW | bootstrap-cli-onboarding + primitive-registry | Sidecar dashboard tabs, user config surface (Q2) |

---

## Requirements

### Validated (milestone workstream)

- [x] **RUN-3a**: Background execution mode is classified in the live delegation entrypoint and owned-process work runs through the hardened background manager.
- [x] **RUN-3b**: Delegation lineage and execution metadata persist canonically in continuity and can be exported for audit/recovery.
- [x] **RUN-3c**: Queue acquisition resolves live per-key concurrency policy before acquire.
- [x] **RUN-3d**: Recovery and compaction checkpoint behavior remain verified after Phase 02 re-verification.
- [x] **RUN-3e**: Governance persistence, active blocking, and invocation-scoped metadata are live.
- [x] **RUN-3f**: Session-start and compaction injections are route-aware, conditional, and auditable.
- [x] **RUN-3g**: Specialist routing remains advisory and records rationale with safe fallback behavior.
- [x] **RUN-3h**: Trusted session-level runtime policy overrides now write through live delegation metadata, survive continuity reload, and drive tool-budget enforcement.
- [x] **Phase 02 closure**: Authoritative re-verification completed after Phase 08 corrective closure.
- [x] **PH09-03**: Sync delegation returns parser-safe JSON envelope with base64-decoded output field.
- [x] **REQ-14-01 through REQ-14-08**: WaiterModel dispatch, dual-signal completion, hybrid persistence, runtime-truthful tests — all complete (Phase 14, 407 tests).

> **Note:** These are milestone-specific requirements. For HER workstream requirements see `workstreams/harness-ecosystem-recovery/ROADMAP.md` (HER-0-A through HER-2-F). For proposed workstream requirements see `workstreams/hivemind-state-architecture/CONTEXT.md`, `workstreams/primitive-registry/CONTEXT.md`, `workstreams/bootstrap-cli-onboarding/CONTEXT.md`. Project-level requirements aggregated in `.planning/REQUIREMENTS.md`.

### Active

- [ ] **RUNTIME-DET-01**: Deep codemap/codescan detects project type, language, framework, complexity (from Q1)
- [ ] **RUNTIME-DET-02**: File watcher triggers dependency graph update on package.json changes (from Q1)
- [ ] **RUNTIME-DET-03**: MCP tools + stack skills synthesize tech stack at runtime (from Q1)
- [ ] **SIDECAR-01**: Sidecar reads artifact JSON from .hivemind/ and .planning/, renders dashboard tabs (from Q2)
- [ ] **SIDECAR-02**: Sidecar calls OpenCode SDK server API for config, settings, sessions (from Q2)
- [ ] **SIDECAR-03**: Sidecar CANNOT write to canonical state — enforcement test required (from Q2)
- [ ] **JOURNAL-01**: Session Journal is append-only event timeline, independent of continuity.ts (from Q3)
- [ ] **JOURNAL-02**: Journal query API supports by-session, by-event-type, by-time-range (from Q3)
- [ ] **JOURNAL-03**: Time-machine reconstructs past state from event replay (from Q3)
- [ ] **MEMORY-01**: MVP memory categories: episodic/session, workflow, delegation evidence, human-readable journal, architecture decisions (from Q4)
- [ ] **MEMORY-02**: Post-MVP memory categories deferred with explicit gates (from Q4)
- [ ] **RICH-01**: Every hm-* skill must pass RICH Pattern 1/2/3 third-party synthesis (from Q5)
- [ ] **RICH-02**: RICH gate is quality process, not threshold to lower — 0 of 25 pass today is honest status (from Q5)
- [ ] **HIVEMIND-ROOT-01**: All Hivemind internal deep modules write to `.hivemind/` at project root (from Q6)
- [ ] **HIVEMIND-ROOT-02**: Compatibility bridge reads existing `.opencode/state/opencode-harness/` during transition (from Q6)
- [ ] **HIVEMIND-ROOT-03**: One-way migration `.opencode/state/` → `.hivemind/`, no dual-write (from Q6)
- [ ] **HMQUAL-01 through HMQUAL-08**: Quality contract for all hm-* skills (from Phase 26)

### Out of Scope

- Broad redesign of delegation behavior beyond the corrective Phase 08 corridor.
- Zombie cleanup and runtime-domain restructure work — excluded from this reconciliation.
- New feature expansion beyond the verified Phase 02 gap closure.

---

## Phase Path Resolution

> Added 2026-05-01 by Phase **32.1** (audit-remediation, Finding 6 contextual override). Updated 2026-05-06 for HER workstream. Closes verification gate **G6** from `.planning/workstreams/milestone/AUDIT-VALIDATION-2026-04-30.md §6`.

This project deliberately uses a **workstream-rooted phase layout**, not a single flat `.planning/phases/` directory. Phase IDs are unique **within each workstream**, not globally. The 2026-04-30 delegation-async-pty-lifecycle audit's "phantom phase" framing came from resolving against the legacy flat root; the canonical roots are below.

### Workstream Roots

| Workstream | Root | Owner / Scope |
|---|---|---|
| **milestone** | `.planning/workstreams/milestone/phases/` | Hard-harness runtime composition engine — tools, hooks, plugin assembly, runtime correctness, release readiness. Most numbered phases (1–73) live here. |
| **skill-ecosystem** | `.planning/workstreams/skill-ecosystem/phases/` | `hm-*` skills body of work — refactor, quality synthesis, RICH-gate enforcement, skill curation. Phases use `SE-*` IDs (e.g. `SE-2`, `SE-14`). |
| **agent-synthesis** | `.planning/workstreams/agent-synthesis/phases/` | Agent-builder corridor — `hf-l2-*` builder agents, agent-synthesis routing. Phases use `AS-*` IDs (e.g. `AS-3`, `AS-11`). |
| **harness-ecosystem-recovery** | `.planning/workstreams/harness-ecosystem-recovery/phases/` | Ecosystem recovery — audit, doc recovery, dead code cleanup, context/compaction, SDK depth, agent rationalization. Phases use `HER-*` IDs (e.g. `HER-0`, `HER-3`). |

State root for runtime persistence is fixed by **D-01** in `.planning/workstreams/skill-ecosystem/ROADMAP.md`: `.hivemind/` is canonical for all internal deep-module state. `.opencode/` is reserved for OpenCode primitives only (agents, commands, skills). Planning artifacts live under `.planning/`.

### Resolution Order

When resolving an unqualified phase ID (e.g. `36`, `48.4.1`, `SE-2`, `HER-3`), tooling MUST search the workstream roots in this order:

1. `workstreams/milestone/phases/`
2. `workstreams/skill-ecosystem/phases/`
3. `workstreams/agent-synthesis/phases/`
4. `workstreams/harness-ecosystem-recovery/phases/`

The first match wins. Numeric IDs are conventionally owned by **milestone**; the `SE-*` prefix is conventionally owned by **skill-ecosystem**; `AS-*` prefix by **agent-synthesis**; `HER-*` prefix by **harness-ecosystem-recovery**. If the same phase number appears in two workstreams, that is a workstream-layout bug — health-check tooling MUST flag it as ambiguous rather than silently picking one.

### How to Verify a Phase Reference

```bash
# 1. Look up by exact path (preferred when in doubt):
ls .planning/workstreams/milestone/phases/ | grep '^36-'
ls .planning/workstreams/skill-ecosystem/phases/ | grep -i '^se-2-'
ls .planning/workstreams/harness-ecosystem-recovery/phases/ | grep -i '^her-'

# 2. Or via the gsd-sdk wrapper (external tool):
gsd-sdk query find-phase 36 --raw
gsd-sdk query find-phase SE-2 --raw
gsd-sdk query find-phase HER-3 --raw
```

If `gsd-sdk` resolves only against the legacy flat `.planning/phases/` root (or only against the first workstream), that is a tooling gap to fix in the external `gsd-sdk` repo — it does not invalidate the layout documented here. The audit-remediation phase that opened that follow-up is `32.1-workstream-path-layout-doc`.

---

## Context

**Worktree**: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project**: hivemind-plugin

**Authoritative verification artifact**: `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`

**Corrected phase chain (milestone)**: Phase 02 baseline → Phase 08 corrective closure → Phase 09-family forensic reset → Phase 12 reconciliation → Phase 14-16 delegation revamp → Phase 17-24 skills refactor → Phase 26 quality synthesis → Phase 31 documentation refresh.

**HER workstream:** HER-0/1/2 completed 2026-05-05. HER-3 unblocked (HER-2 dependency satisfied — prompt-packet/ compaction preservation wired), HER-4/5 ready.
**Governance refresh:** 2026-05-06 — master skeleton synthesis, root ROADMAP.md and REQUIREMENTS.md created, 3 new workstreams planned (hivemind-state-architecture, primitive-registry, bootstrap-cli-onboarding), 5 deferred.

**Current verified state (milestone):**
- Phase 01: COMPLETE (baseline cleanup)
- Phase 02: VERIFIED (18/18 truths)
- Phase 08: COMPLETE (corrective closure)
- Phase 12: COMPLETE (false-start repair + reconciliation)
- Phase 14: COMPLETE (WaiterModel + dual-signal + hybrid persistence, 407 tests)
- Phase 15: COMPLETE (26 security/quality audit fixes)
- Phase 16: 5/6 plans, Gap 4 closure pending
- Phase 16.5: COMPLETE (Agents Builder Configuration, 772 tests)
- Phase 17-24: COMPLETE (Hivemind skills refactor pipeline)
- Phase 26: COMPLETE (quality synthesis, HMQUAL contract)
- Phase 31: IN PROGRESS (planning documentation refresh)
- Phase 35-71: COMPLETE (1659 tests, 90.49% coverage)
- Phase 52: PARTIAL (end-user acceptance)
- Phase 66: PARTIAL (failure-classes only)

**Current verified state (HER):**
- HER-0: COMPLETE (ecosystem remap, 6 plans)
- HER-1: COMPLETE (doc & config recovery, 8 plans in 4 waves)
- HER-2: COMPLETE (dead code 13.7% → ~6.5%, 3 plans)
- HER-3: READY (context & compaction)
- HER-4: READY (SDK integration depth)
- HER-5: READY (agent rationalization)

**Closed workstreams:**
- skill-ecosystem: CLOSED 2026-04-30 (16/17 phases, SE-10 deferred)
- agent-synthesis: CLOSED 2026-04-30 (12/12 phases, 56 hm/hf agents)

**Validation decisions locked**: 6 decisions (Q1-Q6) documented in `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — these are the architectural foundation for Phases 27-30 and all future work.

## Constraints

- **Compatibility**: Keep continuity as the canonical store; delegation exports remain derived artifacts.
- **Verification boundary**: Treat Phase 08 as a bounded corrective closure phase, not a general delegation redesign.
- **Closure rule**: Later planning work depends on the corrected sequence `Phase 02 baseline → Phase 08 → Phase 09-family forensic reset → Phase 12 reconciliation → Phase 14-16 → Phase 17-24 → Phase 26 synthesis → Phase 31 documentation refresh`.
- **Evidence standard**: Current status must match `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` rather than older audit or validation artifacts.
- **Reconciliation rule**: Phase 09-family summaries are not authoritative by default; planners must consult the Phase 12 reconciliation note before inheriting claims from that corridor.
- **Q6 — State root separation**: `.opencode/` is ONLY for OpenCode primitives (agents, commands, skills). All Hivemind internal deep module state MUST write to `.hivemind/` at project root. This prevents corruption by other plugins or user dependencies. Even `.opencode/` primitives are temporary — they will become compiled code at runtime via CLI installation.
- **Q5 — Quality honesty**: RICH gate is not a threshold to lower. 0 of 25 skills pass RICH today is honest status. Phase 27-30 research artifacts are the input for synthesis.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep continuity as canonical state | Delegation packets/manifests must derive from continuity rather than become a second source of truth | Active and verified |
| Runtime policy supplements built-ins | Custom queue/budget controls fill gaps without replacing OpenCode-native session behavior | Verified |
| Background execution uses classified runtime modes | Execution family/submode must be chosen from task characteristics and environment capabilities | Verified |
| Injection remains narrow and route-aware | Specialist guidance should derive from the effective route and active governance state only | Verified |
| Phase 02 closure requires end-to-end runtime-policy override persistence | Manual in-memory test injection is insufficient; live producer + reload path must exist | Satisfied by Phase 08 |
| Phase 09-family truth must be reconciled through forensic evidence before reuse | Mock-heavy tests and partial integration work can remain historically useful without being accepted as authoritative runtime proof | Enforced by Phase 12 |
| HER-0 Ecosystem Audit complete | Unified ecosystem map produced — 22 UAT findings reclassified, 84 legacy concepts validated, 116 modules mapped, 34 SDK surfaces verified | Active (2026-05-05) |
| HER-1 Doc Recovery complete | All 14 broken command refs fixed, AGENTS.md/ARCHITECTURE.md counts synced, CHANGELOG.md created, validate-restart 0 errors | Active (2026-05-05) |
| HER-2 Dead Code Cleanup complete | ~1,562 LOC removed (13.7% → ~6.5%), auto-loop/ralph-loop wired, session-entry/ + prompt-packet/ wired | Active (2026-05-05) |
| D-1: Hybrid approach | Keep HER workstream + create 3 new workstreams (hivemind-state-architecture, primitive-registry, bootstrap-cli-onboarding) | RESOLVED (2026-05-06) |
| D-3: Minimal configs.json | 5-field schema (conversationLanguage, documentsLanguage, mode, userExpertLevel, delegationSystems) | RESOLVED (2026-05-06) |
| D-5: Master ROADMAP.md | Root `.planning/ROADMAP.md` as master-of-masters aggregating all workstreams | RESOLVED (2026-05-06) |

### Branch Strategy

**Canonical branch:** `main` (post-rename from `feature/harness-implementation`). Legacy v2.x baseline preserved as `legacy/v2.x` branch + `legacy/v2.x-baseline` tag. Decision recorded and enacted per `.planning/decisions/ADR-2026-04-30-branch-strategy.md` (Phase 16.4.1, audit-remediation gate G7). Until the maintainer enacts the rename, the canonical branch in flight is `feature/harness-implementation` and the ADR's `status:` remains `proposed`.

### Validation Decisions (Q1-Q6) — Locked 2026-04-25

Source: `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Q1: Hybrid + Spec-Driven Automated Runtime Detection | NOT simple metadata detection — deep codemap/codescan, MCP tools, file watchers, dependency graph; Layer 2 taxonomy for runtime classification | Active — requirements derived as RUNTIME-DET-01 through RUNTIME-DET-03 |
| Q2: Artifact-Focused Sidecar (Next.js + @json-render/react) | Sidecar is NOT delegation monitoring — it renders artifact dashboards via JSON-spec-driven UI; read-only for canonical state; uses OpenCode SDK server API | Active — requirements derived as SIDECAR-01 through SIDECAR-03 |
| Q3: Session Journal as Complement + Time-Machine Foundation | continuity.ts unchanged (410 LOC); new append-only event timeline module; enables time-machine, investigation agents, future graph/vector memory | Active — requirements derived as JOURNAL-01 through JOURNAL-03 |
| Q4: MVP = 5 of 8 memory categories, Post-MVP = 3 with gates | MVP: episodic/session (new), workflow (exists), delegation evidence (exists), human-readable journal (new), architecture decisions (locked). Post-MVP: long-term concept, graph-query, vector memory — deferred with explicit gates | Active — requirements derived as MEMORY-01, MEMORY-02 |
| Q5: Full RICH gate — no compromise | RICH is quality process, not threshold to lower; 0 of 25 skills pass today is honest status; Phase 27-30 research artifacts feed synthesis | Active — requirements derived as RICH-01, RICH-02 |
| Q6: `.hivemind/` as internal state root, `.opencode/` for OpenCode primitives only | All Hivemind deep modules write to `.hivemind/`; `.opencode/` is for agents/commands/skills only; one-way migration from `.opencode/state/` to `.hivemind/` | Active — requirements derived as HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after skeleton synthesis, governance refresh, 3 new workstreams planned, HER-0/1/2 confirmed complete*
