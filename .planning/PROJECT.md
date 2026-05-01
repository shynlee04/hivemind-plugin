# Harness Runtime Composition Engine

## What This Is

HiveMind V3 is a **runtime composition engine** for OpenCode. It is an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project has progressed through 31 phases covering runtime architecture, delegation revamp, skills quality, and planning documentation refresh. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

### Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |

### State Root (Q6 Decision)

All Hivemind internal deep modules write to `.hivemind/` at project root. `.opencode/` is ONLY for OpenCode primitives (agents, commands, skills). See Q6 decision below for migration details.

## Core Value 

Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.

## Requirements

### Validated

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

## Context

**Worktree**: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project**: hivemind-plugin

**Authoritative verification artifact**: `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`

**Corrected phase chain**: Phase 02 baseline → Phase 08 corrective closure → Phase 09-family forensic reset → Phase 12 reconciliation → Phase 14-16 delegation revamp → Phase 17-24 skills refactor → Phase 26 quality synthesis → Phase 31 documentation refresh.

**Current verified state**:
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
*Last updated: 2026-04-25 after Phase 31 Plan 01 documentation refresh*
