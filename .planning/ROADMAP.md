---
title: "Hivemind V3 — Master Roadmap"
created: "2026-05-06"
updated: "2026-05-06"
status: ACTIVE
type: root-governance
supersedes: ".planning/workstreams/skill-ecosystem/ROADMAP.md (symlink)"
---

# Master Roadmap — Hivemind V3

**Created:** 2026-05-06  
**Status:** Active — master aggregation of all workstreams  

> This is the root `.planning/ROADMAP.md`. It aggregates status from all workstream roadmaps and defines the proposed new workstreams. Per-workstream detail lives in `workstreams/{name}/ROADMAP.md`.

---

## Active Workstreams

### harness-ecosystem-recovery — ACTIVE

→ ref: [HER ROADMAP](workstreams/harness-ecosystem-recovery/ROADMAP.md)

| Phase | Goal | Status | Depends On | Completed |
|-------|------|--------|------------|-----------|
| HER-0 | Ecosystem Re-map & Reality Audit | ✅ COMPLETE | — | 2026-05-05 |
| HER-1 | Documentation & Configuration Recovery | ✅ COMPLETE | HER-0 | 2026-05-05 |
| HER-2 | Dead Code Cleanup (13.7% → ~6.5%) | ✅ COMPLETE | HER-1 | 2026-05-05 |
| HER-3 | Context & Compaction | 🟢 READY | HER-2 (prompt-packet/ wired ✅) | — |
| HER-4 | SDK Integration Depth | 🟢 READY | HER-1 | — |
| HER-5 | Agent Rationalization | 🟢 READY | HER-1 | — |

---

## Planned Workstreams (Ordered by Dependency)

### hivemind-state-architecture — PLANNED

**Purpose:** Design the canonical `.hivemind/` directory structure, `configs.json` schema (5-field minimal), bootstrap tree layout, and frontmatter/file-format conventions. Foundation for ALL state-writing features.

**Scope:**
- `.hivemind/` canonical directory architecture (Q6)
- `configs.json` minimal 5-field schema: `conversationLanguage`, `documentsLanguage`, `mode`, `userExpertLevel`, `delegationSystems`
- File format conventions (JSON, MD with YAML frontmatter, YAML, `.gitkeep`)
- Frontmatter schema requirements for all `.hivemind/.md` files
- Target bootstrap tree from skeleton §8.2 / skeleton-v2 §10
- State root hardening and compatibility bridge verification

**Feature Refs:** f-05.i (configs.json), f-05 (CLI bootstrap), f-03x (registry groundwork)

**Dependencies:** HER-0 (COMPLETE ✅)

**Priority:** CRITICAL

---

### primitive-registry — PLANNED

**Purpose:** Build a unified primitive registry for all agents, skills, commands, tools, MCP integrations, and hooks. Enable stacking, chaining, and permission enforcement. Make governance authoritative before runtime automation grows.

**Scope:**
- Unified registry schema (agents.json, skills.json, commands.json, tools.json, mcp-tools.json, custom-tools.json, hooks.json)
- Permission matrix enforcement (agent→tool→skill access rules)
- Cross-primitive validation on compile
- Stacking and chaining primitives
- Restart validation integration
- Registry ownership = `.hivemind/registries/`

**Feature Refs:** f-03a (agent registry), f-03b (skill registry), f-03c (tool registry), f-03d (MCP registry), f-03e (custom tool registry), f-03f (hook registry), f-04 (command wiring)

**Dependencies:** hivemind-state-architecture (PLANNED, for registry directory structure and schema conventions)

**Priority:** HIGH

---

### bootstrap-cli-onboarding — PLANNED

**Purpose:** Deliver the user-facing `npm install` → `npx init` → first session pathway. Support greenfield (fresh project) and brownfield (existing project) setup. Include doctor/checkup mode for health validation.

**Scope:**
- npm package installation model (`npm install opencode-harness`)
- `npx opencode-harness init` interactive setup
- Greenfield project bootstrap (fresh `.hivemind/` + `.opencode/`)
- Brownfield project integration (existing project adaptation)
- `configs.json` interactive configuration
- Doctor/checkup mode (primitive health, configuration validation)
- CLI substrate leveraging existing `src/cli/` (Phase 40 foundation)

**Feature Refs:** f-05 (CLI installation), f-05.i (configs.json), f-05.ii (project init), f-05.iii (onboarding)

**Dependencies:** hivemind-state-architecture (for .hivemind/ structure + configs.json schema), primitive-registry (for validating installed primitives)

**Priority:** HIGH

---

## Deferred Workstreams

| Workstream | Priority | Depends On | Purpose |
|------------|----------|------------|---------|
| auto-commands-workflow-router (WS-4) | MEDIUM | primitive-registry | Intent → workflow routing, auto-commands engine (f-04, f-04a) |
| delegation-revamp (WS-5) | MEDIUM | primitive-registry | Multi-lane delegation: graph/swarm/CRUD/hierarchy (f-06) |
| trajectory-task-plus (WS-6) | MEDIUM | delegation-revamp, hivemind-state-architecture | Cross-session task lifecycle, trajectory ledger v3 (f-07) |
| context-compaction-engine (WS-7) | MEDIUM | trajectory-task-plus, hivemind-state-architecture | Event-tracker redesign, context purification, time-machine (f-08) |
| sidecar-user-config-ui (WS-8) | LOW | bootstrap-cli-onboarding, primitive-registry | Sidecar dashboard tabs, user config surface (Q2) |

---

## Closed Workstreams

| Workstream | Closed | Phases | Artifacts |
|------------|--------|--------|-----------|
| agent-synthesis | 2026-04-30 | 12/12 | 56 hm/hf agents created |
| skill-ecosystem | 2026-04-30 | 16/17 (SE-10 deferred) | 54 active skills |

---

## Build Gates

| Gate | Status | Date |
|------|--------|------|
| `npm run typecheck` | ✅ 0 errors | 2026-05-05 |
| `npm test` | ✅ 1604 passed | 2026-05-05 |
| `npm run build` | ✅ Pass | 2026-05-05 |
| Coverage | ✅ 90.49% statements | 2026-05-05 |
| validate-restart | ✅ 0 errors | 2026-05-05 |

---

## Decision Log

| ID | Decision | Status | Resolved Date |
|----|----------|--------|---------------|
| D-1 | Hybrid approach: Keep HER + create 3 new workstreams | ✅ RESOLVED | 2026-05-06 |
| D-2 | How many new workstreams to create | → STREAMED to STATE.md Proposed/Deferred | — |
| D-3 | configs.json schema: minimal 5-field vs. full 20+ field | ✅ RESOLVED (Minimal 5-field) | 2026-05-06 |
| D-4 | `.planning/` → `.hivemind/plannings/` migration timing | DEFERRED to hivemind-state-architecture | — |
| D-5 | Root ROADMAP.md as master-of-masters | ✅ RESOLVED (this document) | 2026-05-06 |

---

## Checkpoint Gates

| Checkpoint | Gate | Depends On | Status |
|------------|------|------------|--------|
| CP-1 | State architecture locked | HER-0 ✅ | PENDING (hivemind-state-architecture) |
| CP-2 | Primitive registry functional | CP-1 | PENDING (primitive-registry) |
| CP-3 | Bootstrap installable | CP-1 + CP-2 | PENDING (bootstrap-cli-onboarding) |
| CP-4 | Delegation practical | CP-2 | DEFERRED |
| CP-5 | Context useful | CP-1 | DEFERRED |
| CP-6 | End-user workflow E2E | CP-3 + CP-4 + CP-5 | DEFERRED |
