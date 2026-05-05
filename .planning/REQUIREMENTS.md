---
title: "Hivemind V3 — Requirements"
created: "2026-05-06"
updated: "2026-05-06"
status: ACTIVE
type: root-governance
source: ".planning/MASTER-PROJECT-SKELETON.md"
---

# Requirements — Hivemind V3

**Created:** 2026-05-06  
**Status:** Active  

> This document aggregates requirements from HER workstream completions and the proposed new workstreams (hivemind-state-architecture, primitive-registry, bootstrap-cli-onboarding). Feature IDs cross-reference the skeleton feature registry (§5).

---

## Path 1 — Agent-Callable Deterministic Features

**Purpose:** Features agents can explicitly call or skills can activate.

| ID | Description | Priority | Phase/Owner | Status |
|----|-------------|----------|-------------|--------|
| f-03a | Agent registry with permission enforcement | HIGH | primitive-registry (WS-3) | PARTIAL (agent files exist, no runtime enforcement) |
| f-06 | Delegation with multi-lane support (native/SDK/PTY/graph/swarm) | HIGH | delegation-revamp (WS-5, DEFERRED) | PARTIAL (core WaiterModel works) |
| f-06.lanes | Delegation lane routing per task characteristics | MEDIUM | delegation-revamp (WS-5, DEFERRED) | PARTIAL |
| f-06.hierarchy | L0→L1→L2→L3 delegation depth enforcement | MEDIUM | delegation-revamp (WS-5, DEFERRED) | PARTIAL |
| f-07 | Trajectory & task-plus lifecycle wiring | MEDIUM | trajectory-task-plus (WS-6, DEFERRED) | PARTIAL (modules exist, not wired) |
| f-07.i | Cross-session task dependency validation | MEDIUM | trajectory-task-plus (WS-6, DEFERRED) | MISSING |
| f-07.ii | Workflow-aware task-to-agent/skill/command wiring | MEDIUM | trajectory-task-plus (WS-6, DEFERRED) | MISSING |
| f-07.iii | Task-to-artifact/delegation/roadmap relationships | MEDIUM | trajectory-task-plus (WS-6, DEFERRED) | MISSING |
| f-11 | Role-specific tool access with E2E path validation | MEDIUM | HER-5 | PARTIAL (16 tools, no E2E path test) |

---

## Path 2 — Runtime Programmatic Features

**Purpose:** Automatic operations via OpenCode hooks, events, injections, transforms, compaction.

| ID | Description | Priority | Phase/Owner | Status |
|----|-------------|----------|-------------|--------|
| f-08 | Event-tracker redesign — produce queryable context | CRITICAL | HER-3 (READY) | PARTIAL (writes but output is noise) |
| f-08.i | Context purification & retrieval profiles | HIGH | context-compaction-engine (WS-7, DEFERRED) | MISSING |
| f-08.ii | Time-machine replay from event journal | MEDIUM | HER-3 / WS-7 | PARTIAL (journal-query.ts exists) |
| f-08.iii | Stale context detection & hallucination prevention | MEDIUM | context-compaction-engine (WS-7, DEFERRED) | MISSING |
| f-09 | Long-haul session survival (compaction hooks) | MEDIUM | HER-2 (COMPLETE) / HER-3 | PARTIAL (compaction-preservation wired) |
| f-10 | SDK/server API injection & hook steering | MEDIUM | HER-4 (READY) | PARTIAL |
| f-04a.i | Intent analyzer (classification, reconstruction) | MEDIUM | auto-commands-workflow-router (WS-4, DEFERRED) | PARTIAL (purpose-classifier 8 classes) |

---

## Path 3 — Governance / Registry / Permissions / Configuration

**Purpose:** The control layer — what exists, what is allowed, what is wired, what can be stacked/chained.

| ID | Description | Priority | Phase/Owner | Status |
|----|-------------|----------|-------------|--------|
| HIVEMIND-STATE-01 | `.hivemind/` canonical directory structure designed and locked | CRITICAL | hivemind-state-architecture (WS-1) | MISSING |
| HIVEMIND-STATE-02 | `configs.json` 5-field minimal schema (language, mode, expertLevel, delegationSystems) | CRITICAL | hivemind-state-architecture (WS-1) | MISSING |
| HIVEMIND-STATE-03 | File format and frontmatter conventions for all `.hivemind/` artifacts | HIGH | hivemind-state-architecture (WS-1) | MISSING |
| REGISTRY-01 | Unified primitive registry with agents/skills/commands/tools/MCP/hooks entries | HIGH | primitive-registry (WS-3) | PARTIAL (individual scanners exist, no unified registry) |
| REGISTRY-02 | Permission matrix with runtime enforcement (agent→tool→skill) | HIGH | primitive-registry (WS-3) | MISSING |
| REGISTRY-03 | Stacking and chaining support for primitives | MEDIUM | primitive-registry (WS-3) | MISSING |
| REGISTRY-04 | Cross-primitive validation on compile | MEDIUM | primitive-registry (WS-3) | PARTIAL (config-compiler.ts exists) |
| f-03c | Tool registry & wiring | HIGH | primitive-registry (WS-3) | PARTIAL |
| f-03d | MCP tool registry & permissions | MEDIUM | primitive-registry (WS-3) | MISSING |
| f-03e | Custom tool registry & stacking | MEDIUM | primitive-registry (WS-3) | PARTIAL |
| f-03f | Hook registry & feature wiring | MEDIUM | primitive-registry (WS-3) | PARTIAL |
| f-04 | Auto-commands engine with $ARGUMENTS parsing | MEDIUM | auto-commands-workflow-router (WS-4, DEFERRED) | FOUNDATION (command-engine/ stub) |
| f-04a | Workflow router | MEDIUM | auto-commands-workflow-router (WS-4, DEFERRED) | MISSING |
| f-04a.ii | Command creation/wiring with $ARGUMENTS parsing | MEDIUM | auto-commands-workflow-router (WS-4, DEFERRED) | MISSING |

---

## Path 4 — Sidecar / Onboarding / Configuration

**Purpose:** User-facing setup, configuration, and control surfaces.

| ID | Description | Priority | Phase/Owner | Status |
|----|-------------|----------|-------------|--------|
| BOOTSTRAP-01 | npm package install model: `npm install opencode-harness` | CRITICAL | bootstrap-cli-onboarding (WS-2) | FOUNDATION (src/cli/ scaffold) |
| BOOTSTRAP-02 | `npx opencode-harness init` interactive greenfield setup | CRITICAL | bootstrap-cli-onboarding (WS-2) | MISSING |
| BOOTSTRAP-03 | Brownfield project integration (existing project adaptation) | HIGH | bootstrap-cli-onboarding (WS-2) | MISSING |
| BOOTSTRAP-04 | Doctor/checkup mode for primitive health validation | HIGH | bootstrap-cli-onboarding (WS-2) | MISSING |
| f-05.i | `.hivemind/configs.json` interactive configuration | HIGH | bootstrap-cli-onboarding (WS-2) | MISSING |
| SIDECAR-01 | Sidecar dashboard reads artifact JSON from .hivemind/ and .planning/ | MEDIUM | sidecar-user-config-ui (WS-8, DEFERRED) | PARTIAL (readonly-state.ts exists) |
| SIDECAR-02 | Sidecar calls OpenCode SDK server API | MEDIUM | sidecar-user-config-ui (WS-8, DEFERRED) | MISSING |
| SIDECAR-03 | Sidecar CANNOT write to canonical state — enforcement test | MEDIUM | sidecar-user-config-ui (WS-8, DEFERRED) | MISSING |

---

## Reference: Existing Validated Requirements

These requirements from the milestone workstream are validated and locked. They are not duplicated in the workstream-specific sections above.

| ID | Description | Source | Status |
|----|-------------|--------|--------|
| Q1 (RUNTIME-DET-01..03) | Hybrid + Spec-Driven Automated Runtime Detection | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| Q2 (SIDECAR-01..03) | Artifact-Focused Sidecar (read-only) | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| Q3 (JOURNAL-01..03) | Session Journal + Time-Machine | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| Q4 (MEMORY-01..02) | MVP 5/8 memory categories | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| Q5 (RICH-01..02) | Full RICH gate — no threshold lowering | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| Q6 (HIVEMIND-ROOT-01..03) | .hivemind/ as internal state root | Validation Decisions 2026-04-25 | Requirements derived, not implemented |
| HMQUAL-01..08 | Quality contract for all hm-* skills | Phase 26 | Active, not implemented |

---

## Gap Coverage Map

This shows which proposed workstreams cover which feature gaps.

| Gap Area | Feature Refs | Covered By | Status |
|----------|-------------|------------|--------|
| State architecture | f-05.i, Q6 | hivemind-state-architecture | PLANNED |
| Config schema | f-05.i | hivemind-state-architecture | PLANNED |
| Primitive registry | f-03a..f | primitive-registry | PLANNED |
| Bootstrap/CLI | f-05, f-05.ii, f-05.iii | bootstrap-cli-onboarding | PLANNED |
| Doctor/checkup | BOOTSTRAP-04 | bootstrap-cli-onboarding | PLANNED |
| Auto-commands | f-04, f-04a | auto-commands-workflow-router | DEFERRED |
| Delegation revamp | f-06, f-06.* | delegation-revamp | DEFERRED |
| Task/trajectory | f-07, f-07.* | trajectory-task-plus | DEFERRED |
| Context engine | f-08, f-08.* | context-compaction-engine + HER-3 | PARTIAL (HER-3 READY) |
| Sidecar/UI | SIDECAR-01..03 | sidecar-user-config-ui | DEFERRED |
| Context budget | f-08 | HER-3 | READY |
| SDK depth | f-10 | HER-4 | READY |
| Agent rationalization | f-11 | HER-5 | READY |
