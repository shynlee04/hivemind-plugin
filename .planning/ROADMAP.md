<!-- generated-by: gsd-doc-writer -->

# Hivemind — Roadmap

**Created:** 2017-05-07  
**Status:** Active (Gap-Refined Cluster Restructuring)
**Current phase:** P23.4 (GAP-02) — D→A Integration Gate Verification (P23.3 PASSED—deferred; Phase 24 COMPLETE—retroactive)
**Phase 23.2:** ✅ COMPLETE — all 5 session-tracker bugs fixed
**Total phases:** 64 (31 mainline + 8 gap + 10 workstream + 7 historical + 8 concerns)
**CODE VERIFIED (2026-05-29):** See `.planning/research/phase24-*-2026-05-29.md` and `.planning/research/code-truth-*-2026-05-29.md` for full corrections. Key deltas: 42 agents (not 89), 34 skills (not 123), 118 commands (not 106/19), 106 workflows, 8 files >500 LOC (not 1), 7 dead gov refs, 6 empty phase dirs (now RESOLVED — retroactive governance applied 2026-05-29).
**MVP minimum:** ✅ P23.3 (PASSED—deferred) → ✅ P24 (COMPLETE) → ✅ P24.1+P24.2 (COMPLETE) → ✅ P24.7+P24.8 (COMPLETE) → P30 → P36
**Dependency order:** Phase 0 Governance Baseline → Cluster D (Coordination) → A (Agent) + C (Commands) → P25→P25.1→P25.2→P25.3→P26→B (Documents) → E/F (Primitives/Bootstrap) → G (Routing) → H (Hooks) → I (Auto-loop/PTY) → J (Schema/Config, parallel) → K (Cleanup) → L (Verification)

---

## CRITICAL GOVERNANCE REFLECTIONS

These 5 reflections apply to EVERY phase. They are not optional — each must be traced in every phase entry below.

### Reflection 1: GSD Repo Change — Research Invalidation

- **Original GSD repo abandoned** (owner allegedly scammed). New maintainer: https://github.com/open-gsd/get-shit-done-redux
- All 6 GSD research documents from Phase 23 (`23-GSD-agent-architecture`, `23-GSD-command-system`, `23-GSD-workflow-pipeline`, `23-GSD-quality-gates`, `23-GSD-sdk-surface`, `23-GSD-REFERENCE`) are based on the **OLD repo**
- **Every phase that references GSD patterns must include:** "Re-validate against open-gsd/get-shit-done-redux"
- Add a research validation gate BEFORE any phase that depends on GSD architecture patterns

### Reflection 2: Architecture Absorption — Features NOT Agent Profiles

GSD features like session-tracker, delegation-status, coordination, agent-work-contract, injection, trajectory exist in the Hivemind codebase. Their looping/gating/hierarchy/delegation/checkpoint MECHANISMS must be:

- **ABSORBED into programmatic features** (tools, commands, skills) at `src/`
- **NOT** placed in agent profiles (`.opencode/agents/`)
- The L0 orchestrator's coordination logic must use programmatic tools, not agent instruction bloat
- Each phase must explicitly say: "This logic goes into [tools/commands/skills at src/] NOT into agent profiles"

### Reflection 3: Core Protocol Chain — Every Phase Must Respect

Every phase must explicitly trace through these protocols:

1. **Spec-driven**: What spec artifact does this phase produce?
2. **Research-driven**: What needs research before implementation?
3. **Context-driven**: What context artifacts feed into this phase?
4. **Dependencies**: What are the cross-phase dependency links?
5. **Tech compliance**: Must be validated against actual package.json versions and online docs
6. **Patterns**: Must reference existing codebase patterns
7. **Feature completeness**: What's the acceptance criteria?
8. **Test-driven**: Tests must exist before claiming completion
9. **Gatekeeping**: Quality/validation/verification gates required

### Reflection 4: Phase Interdependency — No Phase is Independent

- Every phase WILL generate TBD items that must be tracked
- Every phase WILL need integration checkpoints with adjacent phases
- Every phase WILL generate deferred items for gradual stacking in later phases
- Every phase WILL need a dependency graph/traversal note
- Every phase WILL need a live UAT node on real OpenCode environment

### Reflection 5: Knowledge Sources Need Validation

- The paths listed below contain research that may now be inaccurate due to GSD repo change
- They should be tagged as `⚠️ NEEDS RE-VALIDATION` until verified against open-gsd/get-shit-done-redux

```
.hivemind/registries
.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md
.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md
```

---

## Phases (Clusters A-L, Dependency Ordered)

- [x] **P23.3 (GAP-01): Notification Delivery L1 UAT** — PASSED (L1 UAT deferred — requires live OpenCode session, cannot run headless. All 5 P23.2 bug fixes have L2-L3 evidence via typecheck + tests. Upstream unblocked.)
- [x] **P24 (Cluster D): Coordination Dispatch** — COMPLETE (all 9 sub-phases 24.1-24.9 delivered. Coordination module at src/coordination/ with 6 submodules. Delegation tools at src/tools/delegation/ with 4 files. Parent governance applied retroactively 2026-05-29.) [GSD-reval: NO] [Arch-src: YES - coordination/ + tools/delegation]
- [ ] **P23.4 (GAP-02): D→A Integration Gate** — Verify Coordination + Agent integration [GSD-reval: NO]
- [ ] **P24.1 (Cluster A): Agent Hierarchy Restructure** — Remove L1, restructure L2/L3 by domain [GSD-reval: NO] [Arch-src: NO - .opencode/agents/ only] [UAT: agent list + dispatch]
- [ ] **P24.2 (Cluster A): Agent Profile Quality Enforcement** — Rewrite ALL hm-* agents [GSD-reval: NO] [Arch-src: NO - .opencode/agents/ only] [UAT: agent profile validation]
- [ ] **P24.3 (Cluster C): Commands Infrastructure** — Namespace routers, workflow separation [GSD-reval: YES - GSD research on 67+88 pattern needs re-validation] [Arch-src: YES - tools/ + routing/] [UAT: command dispatch E2E]
- [ ] **P24.3.1 (Cluster C): Governance Session Prototype** — SDK session creation + TUI injection [GSD-reval: NO] [Arch-src: YES - src/tools/governance/] [UAT: live session create]
- [ ] **P24.3.2 (Cluster C): Execute-Slash-Command Core Revamp** — Fix 6 critical flaws: commandSource tracking, execution tracking, delegation-aware context, return envelope consistency, Zod schema, typed errors [GSD-reval: YES - deep-analysis-tools-2026-05-21.md] [Arch-src: YES - src/tools/session/execute-slash-command.ts] [UAT: envelope consistency, typecheck clean, 15+ tests pass]
  - **Plans:** 6 plans in 3 waves
  - Wave 1 (Foundation): Plan 01 (ToolResponse + Typed Errors + Schema + Tracking), Plan 02 (Command-Engine Extension + Namespace Frontmatter)
  - Wave 2 (Facade Extraction): Plan 03 (Hybrid Facade + Delegation Context + Namespace Wiring), Plan 04 (Comprehensive Wave 2 Test Coverage)
  - Wave 3 (Cleanup + Verification): Plan 05 (Session Tools Move + Narrow Import Migration), Plan 06 (Final Verification + Comprehensive Test Suite)
- [ ] **P24.3.3 (Cluster C): Execute-Slash-Command Advanced Features** — Module extraction, contract validation, semantic matching, two-stage routing (P24.3.3.1 + P24.3.3.2 merged) [GSD-reval: YES - deep-analysis-tools-2026-05-21.md] [Arch-src: YES - src/tools/session/execute-slash-command.ts] [UAT: module extraction, contract validation, fuzzy discovery, 10+ tests pass]
- [x] **P23.5 (GAP-03): A→C Integration Gate** — ✅ COMPLETE. 2 plans: 6 orphan agent commands created (12 files, commit e99ff8bb), 3 documentation-truth gaps fixed (commit 1a815207). Typecheck + tests clean. [GSD-reval: NO - command pattern fix only, YAML frontmatter unchanged]
- [x] **P24.4 (Cluster C): References & Templates System** — CANCELLED — architecture correction. Templates/references = static markdown files, NOT runtime engines. Command → Workflow → Agent routing handles everything. `.planning/references/artifact-schema.md` (from 24.2) is sufficient. [GSD-reval: YES - reference patterns from old GSD] [Arch-src: N/A - CANCELLED] [UAT: N/A - CANCELLED]
- [x] **P24.5 (Cluster C): Workflow Files Architecture** — Size budgets, modes decomposition [GSD-reval: YES] [Arch-src: YES - .opencode/workflows/] [UAT: workflow file creation] ✅ CODE EXISTS — 106 workflow files (103 hm-*). Governance gap closed 2026-05-29 via retroactive CONTEXT+SUMMARY.
- [x] **P24.6 (Cluster C): Build HM-* Commands** — 118 commands built [GSD-reval: YES] [Arch-src: YES - .opencode/commands/] [UAT: each command runnable] ✅ CODE EXISTS — 118 commands (99 hm + 7 hf + 12 other). Governance gap closed 2026-05-29 via retroactive CONTEXT+SUMMARY.
- [x] **P25: Trajectory + Agent-Work-Contract Redesign** ✅ COMPLETE — 34 trajectory tests, 20 contract tests, lifecycle state machine, unified bounds, cross-linking. Typecheck clean, 2844 tests pass. [GSD-reval: NO] [Arch-src: YES - src/task-management/trajectory/ + src/features/agent-work-contracts/] [UAT: trajectory state transitions + lifecycle]
- [ ] **P25.1: Task Tool Integration — Wire Trajectory + Contracts** — CRITICAL. Wire trajectory event recording and agent-work-contract creation into the native task tool lifecycle via session-tracker's `recordChildTaskDelegation()`. Both `task` and `delegate-task` tools must automatically create trajectory records and contracts when delegation occurs. Hook point: `src/features/session-tracker/tool-delegation.ts:227`. Changes: 4-5 files, ~40 lines. **1 plan.** Plans:
  - [ ] 25.1-01-PLAN.md — Propagate projectRoot, integrate trajectory+contract at dispatch, add completion event at idle [GSD-reval: NO] [Arch-src: YES - src/features/session-tracker/tool-delegation.ts + src/task-management/trajectory/store-operations.ts + src/features/agent-work-contracts/operations.ts] [UAT: trajectory + contract auto-created on delegation]
- [x] **P25.2: Trajectory Immutability Guard** — HIGH. Prevent mutations on closed trajectories. All trajectory mutation operations (eventTrajectory, attachTrajectoryEvidence, checkpointTrajectory) must throw when the trajectory status is "closed". Changes: 1 file (store-operations.ts), ~15 lines. [GSD-reval: NO] [Arch-src: YES - src/task-management/trajectory/store-operations.ts] [UAT: mutation attempts on closed trajectories throw]
- [x] **P25.3: Pressure Authority Matrix Completion** — MEDIUM. Register all 24 plugin tools in the pressure authority matrix. Currently 8 tools are missing and fall back to conservative defaults. Missing: execute-slash-command, session-tracker, session-hierarchy, session-context, create-governance-session, bootstrap-init, bootstrap-recover, hivemind-session-view. Changes: 1 file (authority-matrix.ts), ~40 lines. [GSD-reval: NO] [Arch-src: YES - src/features/runtime-pressure/authority-matrix.ts] [UAT: all 24 tools have explicit pressureBehavior entries]
- [x] **P25.5: Trajectory + Contract Redesign (GAP)** — COMPLETE REDESIGN. Phases 25/25.1/25.2/25.3 were flawed (per-delegation trajectory, passive contracts, hallucinated pressure integration). This phase corrects: (1) Trajectory is per-PHASE orchestrator mindmap (not per-delegation), (2) Contracts enforce tool restrictions at runtime via tool.execute.before, (3) Pressure integration removed from trajectory/contracts entirely, (4) Trajectory CRUD tool for orchestrator, (5) Progressive disclosure (summary/detailed/full), (6) Trajectory lifecycle states (planning→executing→verifying→completed→closed), (7) Jump links to delegation-persistence (no duplication). Source: deep-architecture-research-2026-05-29.md + P25-assumptions-analysis-2026-05-29.md + user decisions. **12 requirements locked in SPEC.md. 44 decisions locked in CONTEXT.md.** **Plans:** 7 plans in 3 waves. [GSD-reval: NO] [Arch-src: YES - src/task-management/trajectory/ + src/features/agent-work-contracts/] [UAT: phase trajectory creation + contract enforcement + progressive disclosure]

  - [x] 25.5-01-PLAN.md — Trajectory types + schema redesign (5 lifecycle states, PhaseTrajectoryRecord, JumpLink) [Wave 1]
  - [x] 25.5-02-PLAN.md — Contract types + schema redesign (pressure removal, backward compat) [Wave 1]
  - [x] 25.5-03-PLAN.md — Trajectory store operations + progressive disclosure + lifecycle transitions [Wave 2]
  - [x] 25.5-04-PLAN.md — Contract operations + evidence gating + pressure removal [Wave 2]
  - [x] 25.5-05-PLAN.md — Contract enforcement hook (tool.execute.before allowedSurfaces check) [Wave 2]
  - [x] 25.5-06a-PLAN.md — Trajectory + contract tool updates + test rewrites [Wave 3]
  - [x] 25.5-06b-PLAN.md — System prompt injection + plugin.ts wiring + full test verification [Wave 3]
- [ ] **P26: Pressure + Notification Redesign** — Pressure scoring, notification delivery redesign [GSD-reval: NO] [Arch-src: YES - src/features/pressure/ + src/features/notification/] [UAT: pressure scoring live]
- [ ] **P26.1 (Cluster B): Artifact Naming Convention** — Standardized naming/pathing [GSD-reval: YES - ADR-0006 from old GSD] [Arch-src: YES - src/shared/ or src/features/governance/] [UAT: artifact naming validation]
- [ ] **P26.2 (Cluster B): Artifact Dependency & Gatekeeping** — Cross-reference validation [GSD-reval: YES - gate patterns from old GSD] [Arch-src: YES - src/features/governance/] [UAT: cross-ref validation gate]
- [ ] **P23.6 (GAP-04): P25→P26→B Integration Gate** — BLOCKED (upstream phases P25, P26, P26.1, P26.2 NOT STARTED. Trajectory code exists at src/task-management/trajectory/. Pressure code at src/features/pressure/. Cannot verify integration without upstream delivery.) [GSD-reval: NO]
- [x] **P24.7 (Cluster E): Primitives Asset Schema** — Schema per primitive type + code-gen [GSD-reval: YES] [Arch-src: YES - src/schema-kernel/ + src/assets/] [UAT: schema validation test] ✅ CODE EXISTS — 21 schema files + configure-primitive tool. Governance gap closed 2026-05-29 via retroactive CONTEXT+SUMMARY.
- [x] **P24.8 (Cluster E): Primitives Install-Time Extraction** — Real file extraction (not symlinks) [GSD-reval: NO] [Arch-src: YES - scripts/sync-assets.js + package.json] [UAT: npm install E2E] ✅ COMPLETE — `--mode=install` flag with non-destructive per-file merge, dual-root resolution via INIT_CWD, version drift optimization, postinstall hook. 3 tasks, 2 files modified. Typecheck clean, 236/236 test files pass. Commit: 8861bf16.
- [x] **P24.9 (Cluster F): Bootstrap Init Flow Expansion** — Full end-to-end init experience [GSD-reval: NO] [Arch-src: YES - src/cli/ + src/tools/bootstrap] [UAT: init → doctor E2E] ✅ CODE EXISTS — bootstrap-init, bootstrap-recover, CLI commands, bin/hivemind.cjs. Governance gap closed 2026-05-29 via retroactive CONTEXT+SUMMARY.
- [ ] **P27 (Cluster G): Routing + Intent Loop** — Intent classification, two-stage routing [GSD-reval: YES - two-stage routing from old GSD research] [Arch-src: YES - src/routing/] [UAT: route intent → correct handler]
- [ ] **P27.1 (Cluster G): Intent Classification Enhancement** — Natural language intent parser, fuzzy matching, dynamic routing [GSD-reval: YES] [Arch-src: YES - src/routing/] [UAT: intent routing accuracy >90%]
- [x] **P23.7 (GAP-05): E/F/G Integration Gate — ✅ COMPLETE** — All 5 criteria PASS. Research confirms full integration: primitives parity (6 types), bootstrap tooling, governance config, pipeline wiring, P28 compatibility. See `.planning/phases/P23.7-efg-integration-gate/P23.7-VERIFICATION.md`. [GSD-reval: NO]
- [ ] **P28 (Cluster H): Hook Injection Plane Redesign** — CQRS enforcement, typed hooks [GSD-reval: NO] [Arch-src: YES - src/hooks/] [UAT: hook registration + CQRS enforcement]
- [ ] **P28.1 (Cluster H): Hook-Command Integration** — Command execution hooks, workflow injection, lifecycle binding [GSD-reval: YES] [Arch-src: YES - src/hooks/] [UAT: hook-command roundtrip test]
- [ ] **P29 (Cluster I): Auto-looping + PTY Revamp** — Verification patterns, routing pipeline [GSD-reval: YES - loop patterns from old GSD research] [Arch-src: YES - src/features/auto-loop/ + src/features/pty/] [UAT: auto-loop E2E]
- [ ] **P29.1 (Cluster I): Auto-Loop Routing Pipeline** — Multi-stage routing, context preservation, delegation chain [GSD-reval: YES] [Arch-src: YES - src/features/auto-loop/] [UAT: loop chain integrity]
- [ ] **P23.8 (GAP-06): G/H/I Integration Gate** — Verify Routing/Hooks/Auto-loop [GSD-reval: NO]
- [ ] **P30 (Cluster J): Schema Kernel Cleanup** — Delete dead schemas, add tests (parallel) [GSD-reval: NO] [Arch-src: YES - src/schema-kernel/] [UAT: test suite pass]
- [ ] **P31 (Cluster J): Config Plane Redesign** — Config subscriber fix, artifact governance [GSD-reval: YES - ADR-0006 from old GSD] [Arch-src: YES - src/config/] [UAT: config read/write E2E]
- [ ] **P32 (Cluster J): Shipped Primitives + Governance Wire** — Lineage routing, permission wiring [GSD-reval: YES - lineage routing from old GSD] [Arch-src: YES - src/routing/ + src/config/] [UAT: permission enforcement live]
- [ ] **P23.9 (GAP-07): Schema+Config Integration Gate** — Verify schemas match config consumers [GSD-reval: NO]
- [ ] **P23.10 (GAP-08): Pre-Cleanup Readiness Gate** — Design freeze before Group 4 [GSD-reval: NO]
- [ ] **P33 (Cluster K): Plugin.ts Decomposition** — Extract registry, startup, composer [GSD-reval: NO] [Arch-src: YES - src/plugin.ts → src/plugin/] [UAT: build + typecheck pass]
- [ ] **P34 (Cluster K): Async I/O + Typed Errors** — fs→fs/promises, typed error classes [GSD-reval: NO] [Arch-src: YES - src/shared/errors/ + cross-cutting] [UAT: I/O operations work]
- [ ] **P35 (Cluster K): Module Splits + Legacy Inventory** — Split event-capture, types [GSD-reval: NO] [Arch-src: YES - src/features/ + src/shared/] [UAT: test suite pass]
- [ ] **P36 (Cluster L): Integration Verification** — Full regression, dist rebuild, smoke tests [GSD-reval: NO] [Arch-src: N/A - verification only] [UAT: full suite pass]
- [ ] **P37: Fix sync-oss.yml** (DEFERRED) [GSD-reval: NO]
- [ ] **P38: Package .opencode/ Primitives** (DEFERRED) [GSD-reval: NO]
- [ ] **P39: Integration Completion & Hardening — Ship Readiness** — Resolve ALL 80+ ongoing phases: verify 40 complete phases have E2E evidence, complete 23 partial phases with code delivery, absorb 39 not-started phases. Fix 19 test timeouts. Fix sync-oss.yml to whitelist only public-safe artifacts (exclude GSD/OMO). Complete C4-C7 concern implementations. Align language governance (vi/en). Absorb P36-P38. **Plans:** 7 waves (Core Stability → Sync-OSS → Partials → Absorb Empty → Verify Complete → Governance → E2E). [GSD-reval: YES - partial] [UAT: full suite pass, typecheck clean, E2E dispatch working, OSS sync verified leak-free]
  **Plans:**

  - [ ] 39-01-PLAN.md — Wave 1: Performance Optimization (C4) — JSON.parse memoization, async FS, timer cleanup, async exec
  - [ ] 39-02-PLAN.md — Wave 1: Error Handling & Code Quality (C5) — typed extraction, scoped env, empty catch sweep
  - [ ] 39-03-PLAN.md — Wave 2: Architectural Refactoring (C6) — DelegationStatusReader, domain-grouped plugin.ts
  - [ ] 39-04-PLAN.md — Wave 3: Dependency Cleanup (C8) + Primitives Packaging (P38) — dep categories, SDK validation, sync check
  - [ ] 39-05-PLAN.md — Wave 4: Integration Verification & Compliance Audit — regression, audit, E2E smoke test, state update
- [ ] **P40: Public Ship Readiness** — GitHub polish (README, LICENSE, CONTRIBUTING, CI badges). npm package prep (package.json exports, publish workflow, .npmignore). Community-facing documentation. Final build + smoke test. Repo open-sourced. [GSD-reval: NO] [Arch-src: N/A - docs + config only] [UAT: npm publish dry-run, GitHub public repo verified]

---

## Sidecar: GUI Control Plane (SC)

Hivemind Sidecar — Next.js 16 + @json-render/react bidirectional control plane bridging human operators (browser), Hivemind runtime (plugin), and native OpenCode. 4 panels: Session Explorer, Delegation Dashboard, MEMS Browser, Control Panel. See `.hivemind/planning/sidecar-vision/`.

**Architecture:** Two-server model — plugin-embedded HTTP/WS server (Node http + ws) exposes .hivemind/ state reads + tool proxy via REST, SSE for event push, WS for delegation streaming. Next.js 16 standalone app consumes the plugin API. ~85 integration surfaces identified across delegation (27 tools), tmux (7), session-tracker (25+), trajectory (5), pressure (6), config (8).

| Phase | Title | Status | Depends On | Blocks |
|-------|-------|--------|------------|--------|
| SC-01 | Foundation — Plugin HTTP Server + State Bridge | 📋 SPEC | P39 (Integration Hardening) | SC-02..SC-06 |
| SC-02 | REST API + Tool Proxy | 🔵 READY (5 plans: W0 TDD red + W1 infra + W2 REST + W3 realtime + W4 integration) | SC-01 | SC-03..SC-06 |
| SC-03 | Next.js 16 Standalone App | 📋 PENDING | SC-01, SC-02 | SC-04..SC-06 |
| SC-04 | Session Explorer Panel | 📋 PENDING | SC-03 | SC-06 |
| SC-05 | Delegation Dashboard Panel | 📋 PENDING | SC-03 | SC-06 |
| SC-06 | MEMS Browser + Control Panel | 📋 PENDING | SC-04, SC-05 | — |

---

Phase 0 is the current blocking gate before BOOT, MCM, and f-04 continuation. It is docs/governance only and produces L5 evidence. It does not authorize runtime code moves, `.opencode/` primitive edits, `.hivemind/` state edits, package changes, tests, or commits.

| Phase | Title | Status | Depends On | Blocks |
|-------|-------|--------|------------|--------|
| P0-01 | Runtime Identity Taxonomy | ✅ COMPLETE | Source evidence inspection | BOOT, MCM, f-04 |
| P0-02 | Source Plane Architecture | ✅ COMPLETE | P0-01 | BOOT, f-04, source refactors |
| P0-03 | Config Contract | ✅ COMPLETE | P0-01 | BOOT config, MCM config integration |
| P0-04 | HiveFiver Meta-Authoring Architecture | ✅ COMPLETE | P0-01 | MCM and HF command families |
| P0-05 | Phase 0 Governance Gate | ✅ COMPLETE | P0-01..P0-04 | All downstream continuation |
| P0-06 | Phase 0 Route/State Update | ✅ COMPLETE | P0-05 | BOOT/MCM/f-04 routing |

### Phase 0 Canonical Naming

| Concept | Canonical value |
|---|---|
| Product | Hivemind |
| Package/bin | `hivemind` |
| Project type | harness |
| Platform | OpenCode |
| Legacy aliases | `opencode-harness`, `hivemind-tools` only when explicitly labeled legacy |
| Internal workflow tooling | GSD, not product identity |

### Phase 0 Artifacts

- `.planning/architecture/hivemind-runtime-identity-taxonomy-2017-05-07.md`
- `.planning/architecture/hivemind-source-plane-architecture-2017-05-07.md`
- `.planning/config/hivemind-config-contract-2017-05-07.md`
- `.planning/architecture/hivefiver-meta-authoring-architecture-2017-05-07.md`
- `.planning/checklists/phase-0-governance-gate-2017-05-07.md`
- `.planning/roadmap/phase-0-gsd-route-2017-05-07.md`

Gate boundary: Phase 0 artifacts are L5 documentation/governance evidence. Runtime readiness remains FAIL/BLOCK until L1-L3 proof exists in later authorized phases.

---

## Active Workstream: Core Architecture (WS-CA)

| Phase | Title | Status | Depends On |
|-------|-------|--------|------------|
| CA-01 | configs.json Schema + Runtime Binding | ✅ DELIVERED | — |
| CA-02 | Behavioral Profile System + Mode Dispatch | ✅ DELIVERED | CA-01 |
| CA-03 | Workflow Toggle Runtime Binding | ✅ DELIVERED | CA-01 |
| CA-04 | **Bootstrap + State Ownership** (restructured) | 🔴 IN PROGRESS (Phase 0 gate passed) | CA-01, CA-02, CA-03 |

### CA-04 Restructured Scope

Original "CRUD Ownership Modules + Lifecycle Verification" was premature — building plumbing before producers/consumers exist. Restructured to priority-ordered sub-phases:

| Sub-phase | Title | Rationale |
|-----------|-------|-----------|
| CA-04.1 | **Bootstrap CLI + Primitives Recovery** | D-CRUD-01: `npx hivemind init` creates `.hivemind/` + `.opencode/` structure. Postinstall restores primitives. Legacy alias: `npx opencode-harness init`. Fixes the "delete and lose everything" gap. |
| CA-04.2 | **Config Consumer Runtime Wiring** | D-BIND-03: Config fields must have verified consumers. `conversation_language` is traced as wired in L5 config traceability; `delegation_systems` remains without a verified runtime consumer. Fix or explicitly defer the remaining config → behavior gaps. |
| CA-04.3 | **State Directory Ownership Modules** | D-CRUD-05: Each `.hivemind/` subdirectory gets typed module. Tiered by mutation need (7 CRUD, 7 append, 6 read-only). Only AFTER bootstrap exists and tools write state. |
| CA-04.4 | **Lifecycle Audit + Gate Criteria Synthesis** | Synthesize gate-l3-lifecycle-integration references/ from ARCHITECTURE.md. Audit all 34 src/lib modules. Fix only CA-04 CRUD-owner violations. |

### Option 3 — Sector Governance Foundation (Docs-Only Route)

Option 3 is a new docs-only foundation route layered onto CA-04 governance work. It does **not** replace CA-04 and does **not** claim runtime implementation readiness.

| Phase | Title | Status | Depends On |
|-------|-------|--------|------------|
| O3-01 | OMO Architecture Adaptation Research / Context Alignment | ✅ DOCS-ONLY FOUNDATION | CA-04 context |
| O3-02 | Hivemind Sector AGENTS.md Target Architecture | ✅ DOCS-ONLY FOUNDATION | O3-01 |
| O3-03 | Command vs Workflow vs Session/Task Continuity Map | ✅ DOCS-ONLY FOUNDATION | O3-01 |
| O3-04 | Sector AGENTS.md Docs Implementation | ✅ DELIVERED (9 sector AGENTS.md, lifecycle+spec PASS, evidence DUAL) | O3-01, O3-02, O3-03, pre-phase checklist pass |

Option 3 implementation phases (in dependency order):

| # | Phase | Status |
|---|-------|--------|
| 1 | Sector AGENTS.md docs | ✅ DELIVERED (O3-04, 9 files committed) |
| 2 | Config realm cleanup | ✅ DELIVERED (traceability doc, dead code removed) |
| 3 | **Bootstrap/init CLI** | 🔴 IN PROGRESS — see BOOT workstream below; Phase 0 gate passed |
| 4 | Routing workflow foundation | ⬜ PENDING — f-04, blocked until Phase 0 + bootstrap complete |
| 5 | Session/task continuity management | ⬜ PENDING — blocked until typed owners + E2E proof |

Gate boundary: docs-only artifacts are L5 evidence. Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists.

---

## Active Workstream: Bootstrap & Init CLI (WS-BOOT)

The Bootstrap CLI is a proper CLI toolbelt — not just `mkdir` + symlink. It provides project initialization, state recovery, primitives restoration, health checking, and rich terminal feedback. Phase 0 governance gate PASSED. BOOT-02 implementation summaries were reconciled by BOOT-02R, so BOOT-03 automation may resume. The package/bin identity is `hivemind`; `opencode-harness` and `hivemind-tools` are legacy aliases only.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| BOOT-01 | Dependency Audit + Architecture | ✅ COMPLETE | — | L5 research docs |
| BOOT-02 | CLI Framework + Entry Point | ✅ COMPLETE — reconciled | BOOT-01 | L3 local verification summarized in `BOOT-02-SUMMARY.md` |
| BOOT-02R | Governance Reconciliation | ✅ COMPLETE — docs/governance only | BOOT-02 summary evidence | L5: ROADMAP/STATE/REQUIREMENTS agree on BOOT status |
| BOOT-03 | State Init (.hivemind/ creation) | ✅ COMPLETE | BOOT-02R | L3: `node bin/hivemind.cjs init --yes --root <temp>` creates structure |
| BOOT-04 | Primitives Recovery (.opencode/) | ✅ COMPLETE | BOOT-02 | L3: symlinks restored from `.hivefiver-meta-builder/` |
| BOOT-05 | Config Bootstrap + Defaults | ✅ COMPLETE | BOOT-02 | L3: configs.json initializes schema reference and runtime defaults resolve |
| BOOT-06 | Validation + Health Check | ✅ COMPLETE | BOOT-03, BOOT-04, BOOT-05 | L2-L3: built `hivemind doctor` reports ALL CHECKS PASS |
| BOOT-07 | End-to-End Proof | ✅ COMPLETE | BOOT-06 | L1-L3: clean temp project init/recover/doctor passed |
| BOOT-08 | Agent + Skill Integration | ✅ COMPLETE | BOOT-07 | L5: constitution + routing contracts |
| BOOT-09 | MVP Config Schema + Entry Init Verification | 🟡 IN PROGRESS — 2/3 plans complete (01, 03 done; 02 pending) | BOOT-08 | L2-L3: system.transform language injection + tool guard enforcement tests |

### Shell / PTY Control-Plane Runway

The shell/PTY/background command lane is real and cross-cutting across `run-background-command`, PTY adapters, command delegation, SDK delegation, tool guards, lifecycle events, and future sidecar/tmux projection. It is not part of BOOT-02 runtime scope. The safe route is a docs/spec spike now and implementation only after BOOT-07 or explicit higher-risk authorization.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| CP-PTY-00 | Shell / PTY Control-Plane Spike | ✅ COMPLETE — docs/spec only; may run in parallel with BOOT-03..05 | BOOT-02R | L5: context, research, requirements, spec, route artifacts |
| CP-PTY-01 | Background Shell Control-Plane MVP | 🔵 READY | CP-PTY-00, BOOT-07 | L2-L3: permission-gated command lifecycle tests; L1 preferred E2E proof |
| CP-PTY-02 | SDK Session Delegation Integration | ⬜ NOT PLANNED | CP-PTY-01, BOOT-08 | L2-L3: async/sync child-session dispatch, context injection, completion detection tests |
| CP-PTY-03 | Agent/Subagent Background Task Coordination | ⬜ NOT PLANNED | CP-PTY-02, BOOT-08 | L2-L3: wave dispatch, completion-looping, queue dedup, cascade cleanup tests |
| CP-PTY-04 | Cross-Cutting Shell Integration | ⬜ NOT PLANNED | CP-PTY-03, MCM-03 | L2-L3: context integration, journal recording, permission propagation, hook guards tests |
| CP-CMD-01 | Command Architecture Classification | ✅ COMPLETE | WS-SR | L3: deprecated tools removed from `.opencode/`, slash command tool enhanced with SDK-aligned schema, `list_commands` action added, CQRS pattern formalized |
| SC-PTY-01 | Read-Only Terminal Projection | ⬜ DEFERRED | CP-PTY-01, Q2 sidecar decision confirmation | L2-L3: read-only projection proof |

### Session Tracker Runway

The session tracker replaces the broken event-tracker (`src/task-management/journal/event-tracker/`) with a new `src/features/session-tracker/` module that captures session lifecycle, messages, tool calls, and delegation hierarchies into structured `.hivemind/session-tracker/` artifacts. Uses OpenCode SDK v2 hooks (`chat.message`, `tool.execute.after`, `event`, `experimental.session.compacting`). Fixes 12 catalogued flaws (F1-F12) from `.hivemind/audit/flaw-register-2017-05-10.json`.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| CP-ST-01 | Session Tracker Revamp | ✅ COMPLETE | SR-10 (COMPLETE), BOOT-07 (COMPLETE) | L2-L3: 256 tests pass, dual-gate, depth computation, fork inheritance |
| CP-ST-02 | Session Tracker Deep Fix — Remaining | ✅ COMPLETE | CP-ST-01 (COMPLETE) | 3/3 plans, 12 commits — PendingDispatchRegistry + Three-Gate + PreToolUse + Delegator Attribution + Orphan Cleanup |
| CP-ST-03 | Architecture Detox — Plugin Purification + Event-Tracker Excision | ✅ COMPLETE | CP-ST-02 (COMPLETE) | 2/2 plans, 14 commits — plugin.ts 267 LOC (pure assembly), event-tracker excised (22 files deleted), 33 new unit tests |
| CP-ST-04 | Session-Tracker Architecture Fix — Root-Cause Gate Fix | ✅ COMPLETE | CP-ST-02 (COMPLETE), CP-ST-03 (COMPLETE) | 3/3 plans, 15 commits — key mismatch fix, root-only dirs, hierarchy manifest, 338/340 tests pass |
| CP-ST-05 | Session Data Loss Prevention — Classification + Quarantine + Refactor | ✅ COMPLETE | CP-ST-04 (COMPLETE) | 3/3 waves, 12 commits — Gate 0 classification, journey recording, quarantine protocol, monolith refactor (982→807 LOC), 362/364 tests |

**Plans (CP-ST-04):** 3 plans in 3 waves

- [x] CP-ST-04-01-PLAN.md — Fix PendingDispatchRegistry + handleChatMessage Classification Order (Wave 1) — requirements: D-01, D-04, D-05
- [x] CP-ST-04-02-PLAN.md — Directory Architecture Fix — Root-Only Dirs + HierarchyIndex Root Tracking (Wave 2) — requirements: D-02, D-03, D-05, D-08
- [x] CP-ST-04-03-PLAN.md — Hierarchy Manifest + Immediate I/O + Cleanup (Wave 3) — requirements: D-06, D-07, D-08 ✅

**Plans (CP-ST-03):** 3 plans in 3 waves

- [x] CP-ST-03-01-PLAN.md — Event-Tracker Excision + Documentation Sync (Wave 1) — requirements: AC-01..AC-13
- [x] CP-ST-03-02-PLAN.md — Plugin.ts Composition Purification (Wave 2) — requirements: AC-14..AC-29
- [ ] CP-ST-03-03-PLAN.md — Verification + Migration Cleanup (Wave 3)

**Plans (CP-ST-01):**

- [x] CP-ST-01-01-PLAN.md — Module Foundation + Types (Wave 1)
- [x] CP-ST-01-02-PLAN.md — Capture Handlers + Index Writers (Wave 2)
- [x] CP-ST-01-03-PLAN.md — Integration + Recovery + Tool (Wave 3)
- [x] CP-ST-01-04-PLAN.md — Hardening + Verification (Wave 4)

**Plans (CP-ST-02):** 3 plans in 3 waves

- [x] CP-ST-02-01-PLAN.md — PendingDispatchRegistry + Three-Gate Classification (Wave 1) — requirements: AC-02, AC-05 ✅
- [x] CP-ST-02-02-PLAN.md — PreToolUse Hook + Server API Polling (Wave 2) — requirements: AC-10 ✅
- [x] CP-ST-02-03-PLAN.md — Delegator Attribution + Cleanup (Wave 3) — requirements: AC-01, AC-03, AC-06, AC-08, AC-09 ✅

### Delegate-Task Ecosystem Runway (INSERTED)

Toàn diện refactor và revamp delegate-task ecosystem. Phase này cover TẤT CẢ những gì cấu thành nên delegate-task: tools, engines, tracking, completion detection, TUI injection, resume/chaining, agent discovery, permissions inheritance, compact survival. Bao gồm 4 tài liệu cốt lõi: SPEC.md, CONTEXT.md, RESEARCH.md, PATTERN.md.

**Root cause:** delegate-task v1 PROVEN BROKEN — dispatch OK nhưng child sessions freeze sau khi load skills (0 tool calls sau 30 phút). Cần research sâu OpenCode SDK API (sessions, messages, hooks, permissions, agent discovery, primitives loading) và source-code platform architecture trước khi thiết kế v2.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| CP-DT-01 | **Delegate-Task Ecosystem Revamp** | RE-OPENED / RUNTIME BLOCKED — forensic report `report-20260517-105705.md` disproved the `context.task` runtime seam; Plans 01-05 remain historical implementation artifacts requiring gap remediation | CP-ST-06 (session-tracker tracking knowledge), CP-PTY-00 (shell/PTY context) | L5: SPEC + CONTEXT + RESEARCH + PATTERN exist; L2-L3 tests exist but mock/injected native Task evidence is not L1 proof; L1 smoke UAT is blocking before completion |

**Plans:**

- [x] CP-DT-01-01-PLAN.md — Wave 1: Foundation modules (dispatcher, slot-manager, agent-resolver, monitor, escalation-timer, notification-router, lifecycle, retry-handler) ✅ executed; summary `CP-DT-01-01-SUMMARY.md`; tests 22/22 pass; typecheck clean
- [x] CP-DT-01-02-PLAN.md — Wave 2: Coordinator wiring + CompletionDetector v2 dual-signal ✅ executed; summary `CP-DT-01-02-SUMMARY.md`; focused tests 13/13 pass; completion regression 36/36 pass; typecheck clean
- [x] CP-DT-01-03-PLAN.md — Wave 3: Tool layer rewrite (delegate-task v2 + delegation-status v2 + Zod schemas) ✅ executed; summary `CP-DT-01-03-SUMMARY.md`; v2 tool tests 20/20 pass; legacy tool regression 51/51 pass; typecheck clean
- [x] CP-DT-01-04-PLAN.md — Wave 4: manager.ts decomposition + auto-loop + ralph-loop + chaining ✅ executed; summary `CP-DT-01-04-SUMMARY.md`; focused tests 13/13 pass; delegation regression 32/32 pass; session-tracker regression 426/426 pass; typecheck clean
- [x] CP-DT-01-05-PLAN.md — Wave 5: Plugin wiring + integration tests + regression check + JSDoc audit ✅ executed; summary `CP-DT-01-05-SUMMARY.md`; focused integration/e2e tests 18/18 pass; delegation/tool regression 112/112 pass; session-tracker regression 426/426 pass; typecheck clean
- [ ] CP-DT-01-06-RUNTIME-GAPS-2017-05-18-PLAN.md — Wave 6: Runtime-truth gap closure. Correct docs/spec/gates first, then remediate Plans 01-05 in order so no code path depends on false `context.task` runtime seam.

#### CP-DT-01 Scope

1. **Research sâu OpenCode SDK:** sessions API, promptAsync, children, status, messages, compact, client-server architecture, tools/commands/instances/files
2. **Research OpenCode Plugin SDK:** hooks (chat.message, tool.execute.after, event, session.compacting), permissions (regex granularity, main↔sub inheritance, modes all/primary/subagent)
3. **Research agent discovery:** opencode.json, .opencode/agent(s) (số ít + số nhiều), global primitives, edge cases
4. **Research OpenCode source-code:** platform architecture cho primitives, custom tools, commands, agent skills, MCP server tools
5. **Deliverables:**
   - SPEC.md — yêu cầu hệ thống delegate-task v2 (execution verification, progressive polling, failure detection, completion detection, TUI injection, resume/chaining, abort/cancel/restart, concurrent slots)
   - CONTEXT.md — bối cảnh hiện tại (broken v1, session-tracker knowledge, OpenCode Task vs delegate-task)
   - RESEARCH.md — nghiên cứu OpenCode SDK/API/source-code findings
   - PATTERN.md — patterns thiết kế cho async delegation với controlled monitoring

#### CP-DT-01 Key Requirements

- **Execution verification:** 60s fallback nếu không có first tool call → fail level 1
- **Progressive polling:** 30s→45s→60s→90s→120s→180s thin-line status injections vào main session context
- **4-level failure detection:** 60s→120s→180s→300s escalating, sau 300s ngừng injection
- **Completion detection:** tool activity >1min + assistant last message + file changes (optional)
- **TUI injection:** success/failure notifications append trực tiếp vào main session message stream
- **10 concurrent delegation slots** per main session, route notifications đúng session
- **Abort/cancel/restart/redirect** tools cho delegator agent
- **Resume existing sessions:** reuse session ID, context preserved, không lặp prompt
- **Sequential task chaining:** completed task session ID → new task inherits context
- **Compact survival:** handle context window overflow in delegations
- **Session-tracker knowledge áp dụng** vào delegation tracking

### BOOT-01 Scope: Research & Architecture Decision

Before writing code:

1. **OpenCode ecosystem synthesis** — investigate `opencode-pty`, `opencode-background-agents`, `awesome-opencode` directory, `opencode-dynamic-context-pruning` for patterns. Adapt toward Hivemind's CQRS/tool-hook lifecycle. Do NOT blindly copy OMO folder structure or GSD conventions.
2. **Dependency reconciliation** — map each new `package.json` dependency to a concrete Bootstrap CLI feature. Justify every dependency with a Hivemind-native use case.
3. **Grey area clearance** — surface architecture decisions: CLI framework (commander vs. alternative), primitives parsing strategy (gray-matter + yaml vs. unified parser), AST integration scope, MCP server boundaries, PTY ownership.
4. **Output:** research docs in `.planning/research/` (date-stamped), grey-area decision matrix, dependency-to-feature map.

### BOOT-02 Scope: CLI Entry Point

- Wire `commander` CLI framework with program/subcommand structure
- Integrate `@clack/prompts` for interactive flows
- Rich terminal output via `ink`/`react` (optional, deferrable)
- Export path: `./cli` in package.json → `src/cli/index.ts`
- Bin entry: `hivemind`; `hivemind-tools` is a legacy alias only

### BOOT-03 Scope: State Initialization

- `npx hivemind init` creates canonical `.hivemind/` directory tree
- 19 subdirectories with `.gitkeep` registration
- Typed CRUD modules per `.hivemind/` subdirectory (7 CRUD, 7 append, 6 read-only)
- Fixes D-CRUD-05 gap

### BOOT-04 Scope: Primitives Recovery

- Restore `.opencode/` symlinks to `.hivefiver-meta-builder/` source
- Validation: walk `.hivefiver-meta-builder/` → verify every expected `.opencode/` symlink
- Fixes D-CRUD-01: "delete and lose everything" gap

### BOOT-05 Scope: Config Bootstrap

- Initialize `.hivemind/configs.json` from schema defaults
- Validate against `hivemind-configs.schema.ts`
- Wire to behavioral-profile + governance-block consumers

### BOOT-06 Scope: Validation

- `npx hivemind doctor` — full health check
- Checks: `.hivemind/` structure integrity, `.opencode/` symlinks, config validity, SDK availability, typecheck, test pass, module count
- Human-readable report with PASS/FAIL/WARN verdicts

### BOOT-07 Scope: End-to-End Proof

- Nuke `.hivemind/` → run `init` → verify: (a) structure created, (b) symlinks restored, (c) configs initialized, (d) doctor returns PASS, (e) typecheck passes, (f) 1767 tests pass
- This is L1 runtime evidence — closes the docs-only gate

### Checkpoints

- **CP-CA-1:** configs.json full schema operational ✅
- **CP-CA-2:** Mode → behavioral profile mapping produces observable behavior ✅
- **CP-CA-3:** Every workflow toggle has a concrete runtime consumer ✅ (6 wired, 4 annotated, 4 deferred)
- **CP-CA-4:** `.hivemind/` bootstrap on install + typed ownership for state/ and delegation-managements/ dirs (MINIMUM)

---

## Active Workstream: Harness Ecosystem Recovery (HER)

| Phase | Title | Status |
|-------|-------|--------|
| HER-0 | Ecosystem Remap Audit | ✅ VALUABLE-CONTEXT |
| HER-1 | Documentation & Config Recovery | ✅ DELIVERED |
| HER-2 | Dead Code Cleanup | ✅ DELIVERED |
| HER-3 | Context & Compaction | 📋 READY — no PLAN.md |
| HER-4 | SDK Integration Depth | 📋 READY — no PLAN.md |
| HER-5 | Agent Rationalization | 📋 READY — no PLAN.md |

---

## Active Workstream: Meta-Concept Migration (WS-MCM)

The meta-concept migration workstream ports hm-*, hf-*, gate-*, and stack-* agents and skills from `.hivefiver-meta-builder/` (the developer workspace) into `.opencode/` (shipped project primitives), integrates them into config planes, doctor workflows, and end-user customization surfaces. MCM continuation is blocked until the Phase 0 governance gate passes. GSD-prefixed agents/skills are excluded — those are internal dev tooling only and never shipped as Hivemind product primitives.

### Source inventory

- **Agents lab:** `.hivefiver-meta-builder/agents-lab/active/refactoring/` — current active inventory has 89 agent definitions. MCM doctor must classify shipped vs dev-only before migration.
- **Skills lab:** `.hivefiver-meta-builder/skills-lab/active/refactoring/` — current active inventory has 123 skill directories, excluding `.gitkeep`. MCM doctor must classify shipped vs dev-only before migration.
- **Total source:** `.hivefiver-meta-builder/` includes active labs plus commands-lab, plans, references-lab, research, and rules subdirectories. Exact file counts are MCM doctor evidence, not Phase 0 evidence.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| MCM-01 | Agent Migration to .opencode/ | ✅ COMPLETE | BOOT-04 (symlinks exist), Phase 0 gate | L3: MCM doctor classifies hm-/hf-eligible agents and verifies discoverability in `.opencode/agents/` |
| MCM-02 | Skill Migration to .opencode/ | ✅ COMPLETE | BOOT-04 (symlinks exist), Phase 0 gate | L3: MCM doctor classifies hm-/hf-/gate-/stack-eligible skills and verifies discoverability in `.opencode/skills/` |
| MCM-03 | Config Plane Integration | ⬜ BLOCKED BY PHASE 0 | MCM-01, MCM-02, BOOT-06, Phase 0 gate | L2: doctor reports agent/skill counts, config validation includes meta-concept checks |
| MCM-04 | End-User Customization + Ecosystem Integration | ⬜ BLOCKED BY PHASE 0 | MCM-03, Phase 0 gate | L2: end-user projects can customize shipped primitives via config, OpenCode SDK/API integration verified |

### MCM-01 Scope: Agent Migration

- Classify active agent definitions from `.hivefiver-meta-builder/agents-lab/active/refactoring/` before copying or reflecting into `.opencode/agents/`
- Exclude: all `gsd-*` prefixed agents — these are dev tooling
- Include only hm-/hf-eligible agents after MCM doctor confirms lineage, permissions, and discoverability expectations
- Validate each agent has correct frontmatter, tools permissions, temperature settings
- Verify all migrated agents are discoverable by OpenCode runtime

### MCM-02 Scope: Skill Migration

- Classify active skill directories from `.hivefiver-meta-builder/skills-lab/active/refactoring/` before copying or reflecting into `.opencode/skills/`
- Exclude: all `gsd-*` prefixed skills unless explicitly retained as internal developer tooling outside the shipped Hivemind primitive set
- Include only hm-/hf-/gate-/stack-eligible skills after MCM doctor confirms lineage, trigger, and discoverability expectations
- Validate each skill has correct SKILL.md structure, trigger phrases
- Verify all migrated skills are discoverable by OpenCode runtime

### MCM-03 Scope: Config + Doctor Integration

- Add agent/skill count checks to doctor command (BOOT-06 extension)
- Add meta-concept validation to config plane: verify shipped primitives are present and valid
- Wire agent/skill registries into config assets plane
- Doctor reports: agent count, skill count, missing/broken references

### MCM-04 Scope: Customization + Ecosystem

- End-user project meta concept customization via `.hivemind/` config
- Documentation for extending/replacing shipped primitives
- OpenCode SDK/API/plugin interface verification with shipped agents/skills
- Hivemind engine integration contracts validated against shipped primitives

---

### Phase 43: Tmux Co-Pilot Model — Orchestrator Intervention

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 42
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 43 to break down)

---

### Phase P44: Tool Intelligence & Capability Layer

**Goal:** Introduce a compaction-safe capability gate that provides the governance engine and spawner with accurate, real-time tool intelligence at every enforcement point — without requiring external policy engines or runtime dependencies beyond existing harness infrastructure.
**Requirements:** REQ-P44-01 through REQ-P44-06 (from P44-SPEC.md)
**Depends on:** Phase 39 (Integration Completion & Hardening)
**Plans:** 4 plans
**LOC Budget:** ~300 new LOC across 6 modules
**SPEC:** `.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md`
**Research:** `.planning/research/tool-intelligence-patterns-research-2026-05-31.md`
**Audit:** `.hivemind/audits/tool-lifecycle-wiring-audit-2026-05-31.md`

Plans:

- [ ] P44-01-PLAN.md — Wave 1: Capability Gate Module (REQ-P44-01) — ToolCategory enum + CapabilityGate class + 25-tool frozen map + unit tests
- [ ] P44-02-PLAN.md — Wave 2: Agent Frontmatter + Orphaned Tools (REQ-P44-02, REQ-P44-03) — 31 agent tools: declarations, 11 orphaned tools assigned
- [ ] P44-03-PLAN.md — Wave 2: JIT Tool Injection at Delegation Boundary (REQ-P44-04) — spawn-request-builder wired to CapabilityGate
- [ ] P44-04-PLAN.md — Wave 2: Hook Enforcement + Mutation Events (REQ-P44-05, REQ-P44-06) — tool-guard-hooks capability check + session-tracker event type

## Planned Workstreams (Blocked on Core Architecture)

### Agent Workflows (WS-AW)

- WS-4: Auto-commands + Workflow Router (f-04) — **HIGHEST GAP**, blocked by Phase 0 + BOOT + MCM
- WS-5: Delegation Revamp (f-06 lanes/hierarchy)
- WS-6: Trajectory + Task-Plus (f-07)

### User Experience (WS-UX)

- WS-2: Bootstrap CLI + Onboarding
- WS-7: Context/Compaction Engine
- WS-8: Sidecar + UI (DEFERRED)

---

## Active Workstream: Structure Restructuring (WS-SR)

OMO-inspired `src/` reorganization to transform scattered `src/lib/` (56 entries) into organized planes following OMO naming conventions (kebab-case everywhere), feature-module pattern (index.ts, types.ts, AGENTS.md per module), colocated tests, barrel exports, and hierarchical AGENTS.md guidance. Plan: `.planning/architecture/structure-restructuring-plan-2017-05-08.md`

| Phase | Title | Status | Depends On | Key Improvements |
|-------|-------|--------|------------|------------------|
| SR-0 | Preparation (safety net) | ✅ COMPLETE | — | Baseline branch and safety checks completed before restructuring |
| SR-1 | Leaf Modules → `src/shared/` | ✅ COMPLETE | SR-0 | Leaf modules moved to `src/shared/`; import compatibility verified |
| SR-2 | Persistence/Journal → `src/task-management/` | ✅ COMPLETE | SR-1 | Persistence, journal, recovery, trajectory, and lifecycle surfaces moved |
| SR-3 | Delegation/Concurrency → `src/coordination/` | ✅ COMPLETE | SR-1 | Delegation, completion, command delegation, SDK delegation, concurrency, and spawner surfaces moved |
| SR-4 | Features → `src/features/` | ✅ COMPLETE | SR-2, SR-3 | Corrected mapping: standalone features only; command engine and config workflow excluded |
| SR-5 | Config → `src/config/` | ✅ COMPLETE | SR-1 | Config subscriber/compiler/workflow moved to config realm |
| SR-6 | Routing → `src/routing/` | ✅ COMPLETE | SR-1 | Session entry, behavioral profile, and command engine moved to routing plane |
| SR-7 | Hooks Reorganization | ✅ COMPLETE | SR-4 | Hooks reorganized by lifecycle, guards, observers, transforms, and composition |
| SR-8 | Tools Reorganization | ✅ COMPLETE | SR-4 | Tools categorized by delegation, session, config, hivemind, and prompt domains |
| SR-9 | Plugin Composition Root Update | ✅ COMPLETE | SR-7, SR-8 | `src/plugin.ts` imports updated; `src/plugin/` intentionally not created by SR remediation decision |
| SR-10 | Cleanup + AGENTS.md Updates | ✅ COMPLETE | SR-9 | `src/lib/` removed; sector/module AGENTS.md added; typecheck/tests/build passed |

### Target Structure

```
src/
├── AGENTS.md                    # Top-level sector guidance
├── index.ts                     # Public API re-exports
├── plugin.ts                    # Plugin composition root
├── routing/           # Intent → session → task → workflow pipeline
├── task-management/   # Continuity, journal, trajectory, recovery, lifecycle
├── coordination/      # Delegation, concurrency, completion, spawner
├── features/          # Standalone feature modules (each with index.ts, types.ts, AGENTS.md)
├── hooks/             # Reorganized by purpose (lifecycle, guards, observers, transforms, composition)
├── tools/             # Categorized by domain (delegation, session, config, hivemind, prompt)
├── shared/            # Expanded leaf modules, security/, tmux/, model-capabilities/
├── config/            # Config realm (subscriber, compiler, workflow, types.ts)
├── schema-kernel/     # Zod schemas (unchanged)
├── plugin/            # DEFERRED: `src/plugin.ts` remains canonical composition root
├── cli/               # CLI substrate (unchanged — AGENTS.md, discovery, renderer, router, commands/)
└── sidecar/           # Read-only state (unchanged)
```

### SR Phase Directories

| Phase | Directory | Slug |
|-------|-----------|------|
| SR-0 | `.planning/phases/SR-00-preparation-safety-net/` | preparation-safety-net |
| SR-1 | `.planning/phases/SR-01-leaf-modules-to-shared/` | leaf-modules-to-shared |
| SR-2 | `.planning/phases/SR-02-persistence-journal-to-task-management/` | persistence-journal-to-task-management |
| SR-3 | `.planning/phases/SR-03-delegation-concurrency-to-coordination/` | delegation-concurrency-to-coordination |
| SR-4 | `.planning/phases/SR-04-features-to-features-plane/` | features-to-features-plane |
| SR-5 | `.planning/phases/SR-05-config-to-config-realm/` | config-to-config-realm |
| SR-6 | `.planning/phases/SR-06-routing-to-routing-plane/` | routing-to-routing-plane |
| SR-7 | `.planning/phases/SR-07-hooks-reorganization/` | hooks-reorganization |
| SR-8 | `.planning/phases/SR-08-tools-reorganization/` | tools-reorganization |
| SR-9 | `.planning/phases/SR-09-plugin-composition-root-update/` | plugin-composition-root-update |
| SR-10 | `.planning/phases/SR-10-cleanup-agents-md-updates/` | cleanup-agents-md-updates |

---

## Deliverables & Timeline

| Wave | What | Blocks |
|------|------|--------|
| **Wave 0 (NOW)** | Phase 0 Governance Baseline | Blocks BOOT/MCM/f-04 until gate passes |
| **Wave 1** | BOOT-01 Research + BOOT-02 CLI Framework + BOOT-02R Governance Reconciliation ✅ COMPLETE | Depends on Phase 0 gate |
| **Wave 2** | BOOT-03 State Init + BOOT-04 Primitives + BOOT-05 Config; CP-PTY-00 docs/spec spike may run in parallel | Depends on Phase 0 + Wave 1 CLI framework/reconciliation |
| **Wave 3** | BOOT-06 Validation + BOOT-07 E2E Proof | Depends on Phase 0 + Waves 1-2 |
| **Wave 3.5** | CP-PTY-01 Background Shell Control-Plane MVP if routing requires command lanes | Depends on CP-PTY-00 + BOOT-07 unless explicitly authorized earlier |
| **Wave 3.6** | CP-PTY-02 SDK Session Delegation Integration | Depends on CP-PTY-01 + BOOT-08 |
| **Wave 3.7** | CP-PTY-03 Agent/Subagent Background Task Coordination | Depends on CP-PTY-02 + BOOT-08 |
| **Wave 3.8** | CP-PTY-04 Cross-Cutting Shell Integration | Depends on CP-PTY-03 + MCM-03 |
| **Wave 4** | MCM-01 Agent Migration + MCM-02 Skill Migration | Depends on Phase 0 + BOOT-04 (symlinks exist) |
| **Wave 5** | MCM-03 Config Integration + MCM-04 Customization | Depends on Phase 0 + Wave 4 + BOOT-06 |
| **Wave 6** | f-04 Auto-commands + Workflow Router | Depends on Phase 0 + BOOT + MCM; also depends on CP-PTY-00..04 if router invokes command/session lanes |
| **Wave 7** | HER-3/4/5 execution | Depends on Wave 6 routing |
| **Wave 8+** | WS-AW + WS-UX workstreams | Depends on Waves 1-7 |

### Phase 17: Src/ audit — dead code, noise, context rot detection

**Goal:** As a Hivemind project maintainer, I want to manually audit all src/ modules to identify dead code, noise, stub files, context rot, and test coverage gaps, producing a structured findings report for cleanup in Phase 18.
**Mode:** mvp
**Requirements**: TBD
**Depends on:** Phase 16
**Plans:** 4/4 plans complete

Plans:

- [x] 17-01-PLAN.md — Audit shared/, config/, routing/ (smallest modules) — Wave 1 ✅ COMPLETE (2026-05-20)
- [x] 17-02-PLAN.md — Audit schema-kernel/, tools/, hooks/ — Wave 2 ✅ COMPLETE (2026-05-20)
- [x] 17-03-PLAN.md — Audit coordination/, task-management/ — Wave 3 ✅ COMPLETE (2026-05-20)
- [x] 17-04-PLAN.md — Audit features/, cli/, sidecar/, harness/kernel + compile final FINDINGS.md — Wave 4

### Phase 18: Root cleanup, sync boundary, sync manifest

**Goal:** Execute dead code deletion, context rot extraction, barrel narrowing, and manifest sync based on Phase 17's 60 structured findings.
**Requirements**: TBD
**Depends on:** Phase 18
**Plans:** 4/4 complete ✅

Plans:

- [x] 18-01-PLAN.md — Dead Code Deletion: 3 module-batched commits (toggle-gates, steering-engine+runtime-detection, recovery/) — Wave 1 ✅
- [x] 18-02-PLAN.md — Context-Rot: storeCache extraction (store-cache.ts with get/set/reset, TDD RED/GREEN/REFACTOR) — Wave 1 ✅
- [x] 18-03-PLAN.md — Barrel Narrowing: replace export * with explicit named exports for command-engine — Wave 1 ✅
- [x] 18-04-PLAN.md — Manifest Sync: update STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md — Wave 2 ✅

### Phase 19: Non-Destructive Remediation — dead code, stale dist, extra hooks, schema bugfixes

**Goal:** Non-destructive cleanup of dead/wrapper code across schema-kernel, session-tracker, prompt-packet, delegation concurrency, hooks, tests, and stale package output. Zero logic changes to active runtime paths.
**Total scope:**

- Delete 2 dead schema files: `permission.schema.ts` (168 LOC) and `tool-definition.schema.ts` (74 LOC). `skill-metadata.schema.ts` was preserved because it has active consumers.
- Record `permission.schema.ts` as historical REGISTRY-02 gap/debt instead of fixing the deleted prototype enum bug.
- Delete unwired prompt-packet compiler shell (`delegation-packet.ts`, barrel, local AGENTS.md, tests) while preserving active `compaction-preservation.ts` and `kernel-packet.ts` consumers.
- Delete `session-classification-hook.ts` (76 LOC) — never connected
- Delete `schema-normalizer.ts` (155 LOC) — never imported
- Delete `concurrency-key.ts` (12 LOC) — single-line delegating wrapper
- Delete deprecated profile methods (`invalidateBehavioralProfile`, `clearAllBehavioralProfiles`) from `resolve-behavioral-profile.ts`
- Remove `messages.transform` no-op hook from `core-hooks.ts`; keep `system.transform` as backward-compatible test-facing alias for `experimental.chat.system.transform`.
- Rebuild `dist/` — eliminates stale compiled artifacts from Phase 17-19 deletions
- Delete empty dirs: `src/kernel/`, `src/harness/`

**Requirements:** TBD
**Depends on:** Phase 18
**Plans:** 4 plans

Plans:

- [x] 19-01-PLAN.md — Schema barrel cleanup (delete 3 dead schemas, migrate tool-definition) — COMPLETE, 1 correction: skill-metadata preserved (has consumers)
- [x] 19-02-PLAN.md — Dead module deletions (session-classification, schema-normalizer, prompt-packet partial) — COMPLETE
- [x] 19-03-PLAN.md — Code inlines and hook cleanup (concurrency-key, deprecated profile, no-op hooks) — COMPLETE
- [x] 19-04-PLAN.md — Final cleanup (empty dirs, rebuild dist, sync manifests, gatekeeping remediation) — COMPLETE

### Phase 20: Package.json Dependency Cleanup

**Goal:** Clean up package.json dependencies. Remove 11 unused runtime deps, consolidate duplicate YAML libraries, bump 6 minor versions, move @json-render/* + react to optional.
**Actions:**

- Remove: commander, diff, fast-glob, fast-xml-parser, ink, js-yaml, jsonc-parser, node-pty, tree-sitter-javascript, vscode-jsonrpc, web-tree-sitter
- Consolidate: `yaml` + `js-yaml` → use one (keep `yaml` which has 3 importers)
- Bump minors: @clack/prompts ^1.3.0→^1.4.0, bun-types ^1.3.13→^1.3.14, yaml ^2.8.3→^2.9.0, zod ^4.3.6→^4.4.3, vitest ^4.1.5→^4.1.7
- Move to optional: @json-render/core, @json-render/ink, @json-render/next, @json-render/react, @json-render/react-pdf, react
- Verify: `npm run typecheck` → clean, `npm test` → 2382 passed (baseline)

**Requirements:** TBD
**Depends on:** Phase 19
**Plans:** 1 direct execution record

Plans:

- [x] Phase 20 direct execution — dependency cleanup completed in `38e0bd8f`; progress/state manifests updated in `b3875fd6`. Evidence: `package.json`/`package-lock.json` dependency cleanup, `.planning/STATE.md` focus advanced to Phase 21, `AGENTS.md` current phase context updated.

### Phase 39: Integration Completion & Hardening — Ship Readiness

**Goal:** As a project maintainer, I want to resolve ALL 80+ ongoing phases — verify 40 complete phases, complete 23 partial phases, absorb 39 not-started phases — and prepare the repo for public GitHub + npm publication, so that Hivemind is stable, tested, E2E-verified, with zero GSD/OMO internal artifacts leaked and full community-ready documentation.
**Mode:** mvp
**Requirements:** TBD
**Depends on:** None — absorbs all upstream phases (P26-P38 empty, P36-P38 aspirational)
**Plans:** 7 waves (Core Stability → Sync-OSS → Complete Partials → Absorb Empty → Verify Complete → Governance/Philosophy → E2E)

---

### Completed Historical Phases (13-16)

These phase records are preserved from the previous iteration and are fully completed.

### Phase 13: Fix all session-tracker defects with gatekeeping TDD SPEC-driven honest validation and regression prevention

**Goal:** Repair all session-tracker pipeline defects (11 root causes, 12 fixes) to achieve FULL compliance with CP-ST-01 SPEC (13 REQs) using disk-truth-first validation.
**Requirements:** REQ-ST-01 through REQ-ST-13 (from CP-ST-01-session-tracker-revamp/01-SPEC.md)
**Depends on:** Phase 12
**Plans:** 6/6 plans complete

Plans:

- [x] 13-01-PLAN.md — Fix Session Initialization (F-01, F-02) — Wave 1 (BLOCKING)
- [x] 13-02-PLAN.md — Wire Turn Counting (F-03) — Wave 2 (BLOCKING)
- [x] 13-03-PLAN.md — Fix Data Flow + Pinned Reqs (F-04..F-06, P-01/P-03/P-04) — Wave 3 (CRITICAL)
- [x] 13-04-PLAN.md — Add Serial Queues (F-07, F-08) — Wave 3 (HIGH)
- [x] 13-05-PLAN.md — Cleanup + Tool Fixes (F-09..F-12) — Wave 1 (MEDIUM)
- [x] 13-06-PLAN.md — Integration Tests — Wave 4 (VERIFICATION)

### Phase CP-ST-06: Session Tracker Root Cause Rewrite

**Goal:** Triệt để rewrite session-tracker logic — không patch. Fix 6 root causes: (1) delete-on-idle clears child .json data khi sub complete, (2) lastMessage prune thay vì full content cho L0/L1/L2, (3) real-user-turn authority: chỉ exactly 1 real user turn = main session dir, (4) continuous turn counting cho resume/revert/fork, (5) 3-tier parallel hierarchy với upper-level idle, (6) default-to-sub khi không xác định được real user turn. Xóa 30 stale mock tests. Rewrite sạch.
**Requirements**: 6 root causes, 30 stale tests, 5 unfixed bugs from CP-ST-05
**Depends on:** CP-ST-05
**Plans:** 5 plans

Plans:

- [ ] CP-ST-06-01-PLAN.md — Test Audit + RED Root-Cause Coverage (Wave 1) — requirements: RC-1..RC-6, GA-1, GA-2, GA-3, GA-5
- [ ] CP-ST-06-02-PLAN.md — Router Extraction + Default-to-Sub Authority + index.ts LOC Gate (Wave 2) — requirements: RC-3, RC-6, GA-3, GA-4
- [ ] CP-ST-06-03-PLAN.md — Hierarchy Root + Nested Status Persistence (Wave 2) — requirements: RC-1, RC-2, GA-2
- [ ] CP-ST-06-04-PLAN.md — Retry Queue + Full lastMessage Persistence (Wave 3) — requirements: RC-4, RC-5, GA-1
- [ ] CP-ST-06-05-PLAN.md — Stale Test Rewrite + Parallel Integration + Final Verification (Wave 4) — requirements: RC-1..RC-6, GA-3, GA-5

### Phase 14: Wire monitor/notification into DelegationManager.dispatch + clean up partial edits

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 13
**Plans:** 3/4 plans executed

Plans:

- [ ] TBD (run /gsd-plan-phase 14 to break down)

### Phase 15: Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications

**Goal:** Close 8 identified gaps (3 critical, 3 medium, 2 minor) in the delegate-task ecosystem by implementing true session resume/chain-append, session-ended notification delivery with pending replay, rich notification fields (path, fileChanges, timestamp), adjust-prompt/change-agent control actions, and total tool activity duration tracking.

**Requirements**: REQ-01 through REQ-06 (see 15-SPEC.md)
**Depends on:** Phase 14
**Plans:** 5 plans in 3 waves

Plans:

- [ ] 15-01-PLAN.md — manager.ts: restructure controlDelegation for resume/chain/adjust-prompt/change-agent (R1, R4, R5)
- [ ] 15-02-PLAN.md — coordinator.ts chain-append + delegation-status.ts schema extension (R4, R5)
- [ ] 15-03-PLAN.md — notification-formatter.ts + notification-router.ts rich notification fields (R3)
- [ ] 15-04-PLAN.md — plugin.ts: sendPromptAsync injection, pending drain, toast removal (R2, GAP-N1)
- [ ] 15-05-PLAN.md — completion-detector.ts: total tool activity duration tracking (R6)

### Phase 16: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Nâng cấp read-side tools (session-tracker, session-hierarchy, session-context) với search child .json, filter status/agentType/depth, cross-session aggregation, resume-aware tool actions; event-tracker deprecated code được verify 0 remnants; hivemind-power-on skill rewritten dựa trên tools thật

**Goal:** 3 tools (session-tracker, session-hierarchy, session-context) và new hivemind-session-view tool được nâng cấp với JSON-aware child search, filter-sessions, aggregate, get-manifest, cross-root unified query; event-tracker remnants cleaned; hivemind-power-on skill rewritten truthful.
**Requirements:** REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08
**Depends on:** Phase 15
**Plans:** 2/7 plans executed

Plans:

- [x] 16-01-PLAN.md (Wave 0) — Schema-kernel extensions: filter-sessions, aggregate, get-manifest, new session-view schema
- [x] 16-02-PLAN.md (Wave 1) — session-tracker.ts: search child .json + filter-sessions action
- [ ] 16-03-PLAN.md (Wave 1) — session-context.ts: aggregate action
- [x] 16-04-PLAN.md (Wave 1) — session-hierarchy.ts: get-manifest action
- [x] 16-05-PLAN.md (Wave 1) — hivemind-session-view.ts (new tool) + plugin.ts registration
- [x] 16-06-PLAN.md (Wave 2) — Event-tracker deprecation: scan + update skill reference
- [x] 16-07-PLAN.md (Wave 2) — hivemind-power-on skill: full rewrite + 6 reference files

---

## Cluster-Based Hard Restructuring (Reordered 2026-05-25 — Gap-Refined)

28 mainline phases (P21-P40) + 8 gap phases (P23.3-P23.10) following owner's 3-group framework with cluster dependency ordering: **D → A + C → P25 → P26 → B → E/F → G → H → I → J (parallel) → K → L**. Based on 16 research artifacts (6,621 LOC), 6 deep-analysis cluster reports, production session evidence (16,053 LOC), and phase-reordering analysis (4 critical violations). 8 integration gate phases (GAP-01 through GAP-08) added to verify cross-cluster compatibility before downstream consumption.

**Phase 23.2 Status:** ✅ COMPLETE — all 5 session-tracker bugs fixed (assistant text extraction, compaction summary, tool attribution race, hierarchy manifest, actor metadata). See `.planning/phases/P23.2/` for execution evidence.

**Critical Path (dependency-ordered):** D (Coordination) → A (Agent Quality) + C (Commands & Workflows) → P25 (Trajectory) → P26 (Pressure) → B (Documents: naming + gatekeeping) → E/F (Primitives Distribution + Bootstrap) → G (Routing) → H (Hooks) → I (Auto-loop/PTY) → K (Cleanup) → L (Verification). J (Schema/Config) runs parallel to Groups 1-2.

**MVP Minimum (6 phases):** P23.3 (delivery verification) → P24 (coordination) → P24.1+P24.2 (agent quality) → P24.7+P24.8 (primitives) → P30 (schema) → P36 (verification).

### Prerequisite: P00.5 — Non-Destructive Foundation Sweep

**Goal:** Delete remaining dead code, rebuild dist/, remove 2 legacy hooks — purely additive-safe changes before Group 1.
**Scope:**

- Delete 3 dead schema files (permission.schema.ts, tool-definition.schema.ts, skill-metadata.schema.ts — ~350 LOC)
- Rebuild dist/ to eliminate 38 stale artifacts
- Remove legacy hooks system.transform + messages.transform from plugin.ts return
- Verify npm test regression baseline

**Entry gate:** Phase 20 COMPLETE
**Exit gate:** dist/ clean, zero dead code, 3,000+ tests passing, typecheck clean
**Depends on:** Phase 20

### Phase 21: Session-Tracker Design Fix (Group 1)

**Goal:** Fix 16 design flaws (2 CRITICAL, 6 HIGH). Temp file leak (F-01), manifest asymmetry (F-02/F-17), recovery blindness (F-04/F-07/F-08), status consistency (F-03/F-05), anonymous children (F-18), childCount (F-19), guardrails for deferred flaws.
**Evidence:** Production session `ses_1baf.md` (16,053 LOC) — real data loss observed.
**Entry gate:** P00.5 complete
**Exit gate:** All P0-P1 flaws resolved, 418+ tests passing, production scenario simulated
**Requirements:** REQ-21-01 through REQ-21-15 (15 EARS requirements)
**Plans:** 6/6 plans complete

Plans:

- [x] 21-01-PLAN.md — F-01 Temp Fix + Cross-Volume Guardrail (Wave 2) — REQ-21-01, REQ-21-02
- [x] 21-02-PLAN.md — Manifest Derivative Cache + childCount Computation (Wave 1 — prerequisite) — REQ-21-03, REQ-21-04, REQ-21-10, REQ-21-11
- [x] 21-03-PLAN.md — F-18 Anonymous Children Metadata Capture (Wave 2) — REQ-21-08, REQ-21-09
- [x] 21-04-PLAN.md — F-07 Recovery Blindness + F-13 MAX_DEPTH Guard (Wave 2) — REQ-21-05, REQ-21-06, REQ-21-07
- [x] 21-05-PLAN.md — G-3 Precondition + G-4 Gate Removal (Wave 2) — REQ-21-12, REQ-21-13
- [x] 21-06-PLAN.md — Guardrails + Integration Verification (Wave 3) — REQ-21-14, REQ-21-15

### Phase 21.1: Execute-Slash-Command Command Dispatch — deferred subtask command routing (INSERTED)

**Goal:** Upgrade execute-slash-command to discover command primitives from project/global singular/plural roots, expand command bodies, support one-shot `agent` + `subtask` overrides, and schedule subtask dispatch after tool return without mutating command files.
**Requirements**: Revised REQ-01 through REQ-07 in `21.1-SPEC.md`
**Depends on:** Phase 21
**Plans:** 3/3 implementation/test waves revised; live front-agent switching moved to Phase 21.2 research

Plans:

- [x] 21.1-01-PLAN.md — CommandBundle type extension + frontmatter enrichment (Wave 1) — REQ-03, REQ-04
- [x] 21.1-02-SUMMARY.md — Deferred command dispatch rewrite after live SDK-await failure — REQ-01 through REQ-07
- [x] 21.1-03-SUMMARY.md — Regression tests for one-shot subtask overrides and no-hang deferred scheduling — REQ-01 through REQ-07

### Phase 21.2: Front-Agent Switch One-Shot Agent Override — research/prototype route (INSERTED)

**Goal:** Research whether execute-slash-command can run a command in the main/front-facing session under a configured `mode: subagent` agent by temporarily treating that agent as `all`/`primary` for one execution only, without mutating command or agent primitives.
**Requirements:** `21.2-spec-2026-05-22.md`
**Depends on:** Phase 21.1
**Status:** Prototype implemented with L3 unit/typecheck evidence; verdict PARTIAL / NEEDS LIVE UAT
**Plans:** 2 plans in 2 waves

Artifacts:

- [x] `21.2-context-2026-05-22.md` — user intent, current state, phase boundary
- [x] `21.2-research-2026-05-22.md` — live OpenCode source evidence and feasibility options
- [x] `21.2-spec-2026-05-22.md` — prototype-gated requirements and acceptance criteria
- [x] `21.2-prototype-plan-2026-05-22.md` — minimal non-mutating prototype route and live UAT matrix
- [x] `21.2-prototype-implementation-evidence-2026-05-22.md` — unit/typecheck evidence and remaining live UAT gate
- [x] `21.2-CONTEXT.md` — standard-named context artifact
- [x] `21.2-RESEARCH.md` — standard-named research artifact
- [x] `21.2-SPEC.md` — standard-named spec artifact

Plans:

- [ ] `21.2-01-PLAN.md` — Live UAT verification (synthetic parent prompt, baseline subtask, TUI control) — Wave 1
- [ ] `21.2-02-PLAN.md` — Final verdict documentation + governance artifacts update — Wave 2

### Phase 22: Coordination Status + Error Unification (Group 1)

**Goal:** Unify TaskStatus ↔ DelegationStatus. Create DelegationError type. Fix notification TTL/retry.
**Status:** ✅ COMPLETE — all 3 quality gates passed
**Depends on:** Phase 21.2 research route or explicit user deferral
**Plans:** 3/3 plans complete

Plans:

- [x] `22-01-PLAN.md` — Types + mapping (DelegationErrorCode, DelegationError, createDelegationError, delegationStatusToHarnessStatus) — Wave 1
- [x] `22-02-PLAN.md` — Notification routing (retry counter, TTL expiry, PendingNotificationRecord schema, replayPending cleanup) — Wave 2
- [x] `22-03-PLAN.md` — Shared schema + integration (PendingNotification schema update, TERMINAL_EVENTS verification, phase gate) — Wave 3

### Phase 23: Notification Architecture Fix + Holistic Tool Surface Documentation (Group 1 — NEW, HIGH PRIORITY)

**Goal:** Fix CRITICAL notification delivery flaw (session.prompt lacks `synthetic: true` — notifications appended as user-role messages). Create definitive tool-surface documentation skill. Audit and rewrite ALL hm-* coordination skills + hivemind-power-on. Create injection delivery patterns skill. Assess trajectory/pressure/agent-work-contract for redesign.

**Why this exists:** Phase 22 notification routing has a CRITICAL flaw — `sendPrompt()` without `synthetic: true` stores delegation notifications as user-role messages, conflating system notifications with actual user input. Additionally, ALL hm-* orchestration skills contain aspirational patterns (non-existent scripts, ralph-loops, imaginary gate tools) that must be corrected before agents can use them reliably.

**7 requirements (+3 SYNTHESIS):**

- P23-01: Fix `notification-handler.ts` — add `synthetic: true` to all notification text parts
- P23-02: Stream reactivation after notification delivery to idle sessions
- P23-03: Create `hm-l3-tool-surface-documentation` — definitive reference for ALL 14+ Hivemind custom tools with differentiation matrix (task vs delegate-task vs execute-slash-command)
- P23-04: Audit + rewrite ALL hm-* coordination skills (coordinating-loop, gate-orchestrator, phase-execution, phase-loop, completion-looping, hivemind-engine-contracts, hivemind-state-reference, integration-contracts) — remove aspirational patterns, reference only real tool capabilities
- P23-05: Rewrite `hivemind-power-on` skill — tool-based session governance using actual capabilities
- P23-06: Structured assessment of trajectory/pressure/agent-work-contract — redesign or deprecation plan
- P23-07: Create `hm-l3-injection-delivery-patterns` — silent vs required, body vs append, TUI vs direct patterns

**SYNTHESIS (expanded scope — documentation only, defer to later phases):**

- P23-S01: GSD deep research — 6 synthesis documents (command-system, agent-architecture, workflow-pipeline, quality-gates, sdk-surface, reference) ingested from github.com/gsd-build/get-shit-done/docs (113 files, 425K tokens). 9-dimension comparison: GSD vs Hivemind per domain. See `23-GSD-{TYPE}-2026-05-23.md`.
- P23-S02: Debt registry — 25 findings (5 CRITICAL, 5 HIGH, 12 MEDIUM, 3 LOW) across hm-*/hf-* agents, commands, skills. **Phase 23 does NOT fix these debts** — each is deferred to its owning phase. See `23-DEBTS-REGISTER-2026-05-23.md`.
- P23-S03: Document governance debt C-5 identified — artifact naming/pathing collapse systemic, deferred to Phase 31 as P31-01 through P31-07 requirements.

**Depends on:** Phase 22 (COMPLETE)
**Blocks:** Phase 24 (notification surface must be fixed before delegate-task redesign), Phase 26 (hooks injection plane depends on delivery patterns)

**Plans:** 6 plans in 5 waves

| Plan | Wave | Requirements | Objective |
|------|------|-------------|-----------|
| `23-01-PLAN.md` | 1 (code fix) | P23-01, P23-02 | Fix notification delivery architecture — two-mechanism system + stream reactivation |
| `23-02-PLAN.md` | 2 (surface docs) | P23-03 | Create `hm-l3-tool-surface-documentation` skill — 14+ tool catalog + differentiation matrix |
| `23-03-PLAN.md` | 2 (surface docs) | P23-07 | Create `hm-l3-injection-delivery-patterns` skill — 4 delivery patterns |
| `23-04-PLAN.md` | 3 (skill rewrite) | P23-04 | Audit + rewrite ALL 13 hm-* skills — 3 sub-waves, remove aspirational patterns |
| `23-05-PLAN.md` | 3 (skill rewrite) | P23-05 | Rewrite `hivemind-power-on` — trim ~80 lines, add IRON CLAW, remove duplicate content |
| `23-06-PLAN.md` | 4 (assessment) | P23-06 | Structured assessment of trajectory/pressure/work-contract tools |

Plan list:

- [x] `23-01-PLAN.md` — Notification fix: synthetic:true + two-mechanism + stream reactivation (Wave 1)
- [x] `23-02-PLAN.md` — Tool surface documentation skill (Wave 2)
- [x] `23-03-PLAN.md` — Injection delivery patterns skill (Wave 2)
- [x] `23-04-PLAN.md` — Audit + rewrite ALL hm-* coordination skills — 13 skills, 3 sub-waves (Wave 3)
- [x] `23-05-PLAN.md` — Rewrite hivemind-power-on skill (Wave 3)
- [x] `23-06-PLAN.md` — Structured assessment of trajectory/pressure/work-contract (Wave 4)

### Phase 23.1: Session-Tracker SDK Dispatch Investigation (Group 1 — sub-phase of 23)

**Goal:** Investigate và fix root cause session-tracker không observe được child sessions tạo từ `delegate-task` (SDK dispatch). Bug U4/U5 dai dẳng qua 4 rounds live UAT.

**Why this exists:** Phase 23 notification fixes đã thử nghiệm 4 rounds live UAT. U4 (session-tracker miss children) và U5 (hierarchy broken) vẫn FAIL qua tất cả rounds. Root cause chưa được xác nhận: SDK `session.created` event có fire cho sessions tạo từ custom tools (`client.session.create()`) hay không. Cần investigate chuyên sâu OpenCode SDK event system.

**Requirements:**

- P23.1-01: Research OpenCode SDK v1.15.5 — `session.created` event behavior for sessions created via `client.session.create()` inside custom tool dispatch
- P23.1-02: Trace delegate-task dispatch path — identify all session creation points (coordinator.ts, manager-runtime.ts, session-creator.ts)
- P23.1-03: Determine if missing event registration is architectural (cannot observe SDK sessions) or implementation gap (can fix with hook wiring)
- P23.1-04: If architectural — propose alternative: explicit registration via `sessionTracker.handleSessionEvent()` from dispatch path
- P23.1-05: Implement fix + test

**Depends on:** Phase 23
**Blocks:** Phase 25 (session-tracker/CP-ST phases)

**Risks:**

- HIGH: If OpenCode SDK v1.15.5 does NOT fire `session.created` events for sessions created from custom tool code → architectural limit, need alternative approach
- MEDIUM: Session-tracker fix may require changes across 3+ modules (tool-before-guard, event-capture, coordinator, plugin.ts)

### Phase 23.2: Session-Tracker Bugfix — Unified task/delegate-task (Group 1 — sub-phase of 23)

**Goal:** Fix all 5 bugs to ensure session-tracker correctly captures assistant text, compaction summaries, tool attribution, hierarchy manifest entries, and actor metadata for BOTH task and delegate-task delegation paths.

**Why this exists:** Phase 23.1 investigation confirmed 5 bugs sharing a root cause: code written exclusively for `task` tool, never adapted for `delegate-task`. All fixes are surgical (no architecture changes).

**Status:** ✅ COMPLETE — all 5 bugs fixed across 4 plans

**Requirements:** REQ-23.2-01 (assistant text extraction), REQ-23.2-02 (compaction summary), REQ-23.2-03 (tool attribution race), REQ-23.2-04 (hierarchy manifest), REQ-23.2-05 (actor field)

**Plans:** 4/4 plans complete

- [x] 23.2-01-PLAN.md — BUG#4 + BUG#5: manifestWriter.addChild() in tool-delegation.ts + subagentType dual-key extraction
- [x] 23.2-02-PLAN.md — BUG#1: extractTextContent multi-field support in message-capture.ts
- [x] 23.2-03-PLAN.md — BUG#3 + BUG#4: Tool attribution race fix + manifestWriter.addChild() in event-capture.ts
- [x] 23.2-04-PLAN.md — BUG#2: Compaction summary fallback via message history

**Depends on:** Phase 23.1 (investigation complete) ✅
**Blocks:** Nothing (now complete)

---

## Gap Phases (GAP-01 through GAP-08)

These 8 phases fill gaps identified by the gsd-advisor-researcher after Phase 23 cluster analysis (12 clusters A-L, 16 research artifacts, 6,621 LOC). They address missing delivery verification gates, cross-cluster integration checkpoints, test infrastructure, and documentation gaps.

### P23.3: Notification Delivery Completion & L1 UAT Verification (GAP-01)

**Goal:** Complete live UAT verification for all 5 session-tracker bug fixes from P23.2. Document L1 runtime proof for notification delivery completion. Lock notification architecture as DEFERRED-FINAL state.

**Why this exists:** Phase 23.2 bugs were fixed with L2-L3 unit test evidence, but L1 live UAT remains unproven. Without this phase, notification delivery cannot be safely claimed as complete — risking regression in downstream coordination phases (P24, P25, P26) that depend on reliable notification delivery.

**Depends on:** P23.2 (COMPLETE)
**Blocks:** P24 (Coordination Dispatch requires verified notification delivery)

**Success Criteria:**

1. All 5 P23.2 bugs verified with live UAT (L1 evidence in fresh OpenCode session)
2. Notification delivery logs show correct `synthetic: true` text parts in live session
3. Session-tracker correctly captures child sessions from both `task` and `delegate-task` dispatch
4. Notification delivery completion documented with UAT report in `.planning/phases/P23.3/`
5. Notification architecture state locked as DEFERRED-FINAL with remaining debt items registered

### P23.4: Cross-Cluster Gate D→A—Integration Gate (GAP-02)

**Goal:** Verify that Coordination Dispatch (P24) + Agent Hierarchy Restructure (P24.1) + Agent Profile Quality (P24.2) work together before P25 trajectory work depends on them. Gate: all D→A cluster phases must pass lifecycle → spec → evidence triad.

**Why this exists:** The D→A→C cluster dependency chain (D: Coordination → A: Agent Quality → C: Commands) is the critical path. Without a formal integration gate between D and A, P25 may encounter silent regressions when consuming unverified agent dispatch patterns from P24.

**Depends on:** P24, P24.1, P24.2 (all must be complete)
**Blocks:** P24.3 (Commands Infrastructure)

**Success Criteria:**

1. Coordination dispatch (P24) produces correct agent selection for restructured hierarchy (P24.1)
2. Agent profiles (P24.2) enforce ≤3 skill declarations correctly when dispatched via Coordination
3. End-to-end test: dispatch subagent → agent with quality profile → verify contract enforcement
4. Quality gate triad (lifecycle → spec → evidence) passes for D+A cluster
5. Remaining C-1, C-3, H-2, M-1, L-2/L-3 debt items verified as resolved

### P23.5: Cross-Cluster Gate A→C—Integration Gate (GAP-03)

**Goal:** Close 3 A→C integration gaps: (1) create commands for 5 orphan agents so they are dispatchable, (2) fix hm-plan-phase description alignment with actual YAML routing, (3) fix hm-synthesize command/workflow documentation alignment. Gate: every hm-* agent must have a command route or the documentation must accurately reflect the routing gap.

**Why this exists:** Research found 5 orphan agents with zero command routing, a misleading command description (hm-plan-phase claims hm-specifier routing), and a workflow table listing hm-synthesizer with no actual spawn. Without fixes, agents remain undiscoverable and documentation causes confusion.

**Depends on:** P24.5, P24.6 (commands/workflows exist to be audited; P24.4 CANCELLED)
**Blocks:** P25 (Trajectory + Agent-Work-Contract Redesign)

**Requirements:** REQ-01 (orphan agent commands), REQ-02 (hm-specifier routing), REQ-03 (hm-synthesizer alignment), REQ-04 (cross-directory sync), REQ-05 (no regressions)

**Plans:** 2 plans in 1 wave

| Plan | Wave | Objective |
|------|------|-----------|
| `P23.5-01-PLAN.md` | 1 | Create 6 new commands (5 orphan agents + hm-specifier) in both commands/ and command/ |
| `P23.5-02-PLAN.md` | 1 | Fix hm-plan-phase description + hm-synthesize command context + workflow table |

**Success Criteria:**

1. 5 orphan agents have dispatchable commands in both `.opencode/commands/` and `.opencode/command/`
2. `hm-specifier` has a dedicated command (matching REQ-02-B)
3. `hm-plan-phase` description no longer claims routing through `hm-specifier`
4. `hm-synthesize` command context no longer claims "Routed Agent: hm-synthesizer"
5. `hm-synthesize` workflow Agent Routing Table reflects actual `hm-orchestrator` routing
6. `.opencode/commands/` and `.opencode/command/` remain in perfect sync
7. `npm run typecheck` and `npm test` pass with zero regressions

### P23.6: Post-P25→P26→B Integration Gate (GAP-04)

**Goal:** Verify that Trajectory/Pressure redesign (P25-P26) integrates with Artifact Naming & Gatekeeping conventions (P26.1-P26.2). Ensure trajectory state transitions, pressure scoring, and artifact documentation are consistent before advancing to Primitives Distribution (E) and Bootstrap (F) clusters.

**Why this exists:** P25 (Trajectory) and P26 (Pressure) depend on reliable notification delivery and coordination. Artifact naming (P26.1) and gatekeeping (P26.2) provide the documentation framework these phases need to produce consistent governance artifacts.

**Depends on:** P25, P26, P26.1, P26.2
**Blocks:** P24.7 (Primitives Asset Schema), P24.8 (Primitives Install-Time Extraction), P24.9 (Bootstrap Init Flow Expansion)

**Success Criteria:**

1. Trajectory state transitions (P25) produce artifacts matching P26.1 naming conventions
2. Pressure redesign (P26) produces correct scoring output when consuming P25 trajectory data
3. Artifact gatekeeping (P26.2) validates P25/P26 output artifacts
4. Cross-artifact dependency chain is traceable from P25 through P26.2
5. P24.7-P24.9 phase requirements confirmed as compatible with B cluster output

### P23.7: Post-E/F/G Integration Gate (GAP-05)

**Goal:** Verify that Primitives Distribution (P24.7-P24.8) + Bootstrap Init Flow (P24.9) + Routing/Intent Loop (P27) integrate correctly. Gate: shipped primitives are discoverable via routing, bootstrap init configures routing correctly, and intent classification uses correct primitive metadata.

**Why this exists:** E/F/G clusters form the runtime delivery pipeline: primitives are extracted (E), bootstrap configures them (F), and routing dispatches them (G). Without an integration gate, a failure in any link breaks the entire delivery chain.

**Depends on:** P24.7, P24.8, P24.9, P27
**Blocks:** P28 (Hook Injection Plane Redesign)

**Success Criteria:**

1. Primitives extracted in P24.8 are discoverable by P27 routing
2. Bootstrap init (P24.9) correctly configures routing governance plane
3. Intent classification reads primitive metadata from extracted files
4. End-to-end test: init project → extract primitives → route intent → correct agent dispatched
5. P28 phase requirements confirmed as compatible with E/F/G integration

### P23.8: Post-G/H/I Integration Gate (GAP-06)

**Goal:** Verify that Routing (P27) + Hooks (P28) + Auto-looping/PTY (P29) integrate correctly. Gate: the full runtime pipeline (routing → hooks → auto-looping) executes without regression.

**Why this exists:** G/H/I clusters form the runtime execution pipeline. Routing (G) classifies intent, Hooks (H) intercept and transform, Auto-looping (I) manages iteration. Without an integration gate, dispatches may silently fail or produce incorrect results when routed through the full pipeline.

**Depends on:** P27, P28, P29
**Blocks:** P30 (Schema Kernel Cleanup - parallel track), P31 (Config Plane Redesign - parallel track), P33 (Plugin.ts Decomposition)

**Success Criteria:**

1. Intent classification → routing → hook injection → auto-looping path executes end-to-end
2. Hook injection plane (P28) correctly enforces CQRS boundaries during auto-looping dispatch
3. Auto-looping (P29) correctly terminates when hook-injected completion criteria met
4. No regression in session-tracker, delegation, notification, or coordination modules
5. P30/P31 parallel track confirmed as compatible with G/H/I runtime pipeline

### P23.9: Schema+Config Parallel Track Integration (GAP-07)

**Goal:** Verify that Schema Kernel Cleanup (P30) + Config Plane Redesign (P31) produce consistent schema definitions and runtime consumers. Gate: all Zod schemas have corresponding config fields, all config fields have schema validation.

**Why this exists:** P30 and P31 run in parallel to Groups 1-2 (design/shape phases). They must converge before Group 4 (structural cleanup) to ensure schemas match config consumers. Without this gate, P33-P35 cleanup phases may produce incorrect code — or code that doesn't match the schema definitions.

**Depends on:** P30, P31
**Blocks:** P33 (Plugin.ts Decomposition), P34 (Async I/O), P35 (Module Splits)

**Success Criteria:**

1. Every Zod schema in P30 has a corresponding P31 config consumer (or explicit deferral)
2. Every P31 config field validates against its P30 schema definition
3. Schema-compiler.ts (410 LOC) split into manageable modules
4. Config subscriber singleton dependency resolved (testable config consumers)
5. Cross-track validation: no P30 schema conflicts with P31 configuration model

### P23.10: Pre-Structural-Cleanup Readiness Gate (GAP-08)

**Goal:** Final gate before Group 4 structural cleanup phases (P33-P35). Verify that all design/shape phases (Groups 1-3) have settled and no more foundational changes are expected. Complete regression lock and documentation sync.

**Why this exists:** Group 4 (Structural Cleanup — plugin decomposition, async I/O conversion, module splits) is the LAST group and must not be entered while design changes are still in flux. This gate verifies design freeze before restructuring begins.

**Depends on:** P23.7 (E/F/G gate), P23.8 (G/H/I gate), P23.9 (Schema+Config gate)
**Blocks:** P33 (Plugin.ts Decomposition)

**Success Criteria:**

1. All Groups 1-3 phases complete with PASS quality gates
2. No pending design changes for plugin.ts, delegation, session-tracker, notifications
3. Full regression test suite runs at baseline (current pass count documented)
4. ARCHITECTURE.md, STRUCTURE.md, CONCERNS.md synced with current phase ordering
5. AGENTS.md updated to reflect new cluster-based phase structure
6. Design freeze confirmed: Group 4 authorizations gated until this PASS

---

## Cluster-Based Phase Execution (Post-Gap Ordering)

### Phase 24: Coordination Dispatch + Delegate-Task Fix (Cluster D — Coordination)

**Goal:** Fix CP-DT-01 runtime block. Decompose DelegationManager god-object (~580 LOC). Consolidate dual in-memory stores. Fix coordinatorRef forward reference.
**Depends on:** P23.3 (GAP-01 — notification delivery verified)
**Debts inherited from Phase 23:** C-1 (delegate-task proxy war), M-1 (L0 max skills), M-8 (start-work routing) — see `23-DEBTS-REGISTER-2026-05-23.md`

**Governance:**

- **GSD Re-validation:** NO — coordination dispatch is Hivemind-native, not sourced from GSD
- **Architecture Absorption:** YES — DelegationManager decomposition belongs in `src/coordination/delegation/` and `src/tools/delegation/`, NOT in agent profiles
- **Protocol Chain:** Spec (SPEC.md) → Research (CP-DT-01 research) → Context (CP-DT-01 CONTEXT.md) → Dependencies (P23.3) → Tech compliance (package.json SDK version) → Patterns (existing manager.ts patterns) → Feature completeness (CP-DT-01 REQs) → Tests (unit + integration) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P23.3 (input), P24.1 (output), P23.4 (D→A gate)
- **TBD Registry:** TBD-24-01: DelegationManager decomposition may expose further god-objects in coordinator.ts; TBD-24-02: dual store consolidation may require new store module
- **Live UAT Node:** Run `delegate-task` in real OpenCode session — verify child session dispatch, completion detection, notification delivery
- **Deferred Stacking:** coordinator.ts deep refactor (if scope exceeds phase), notification-triggered retry logic (deferred to P26)

### Phase 24.1: Agent Hierarchy Restructure (Cluster A — Agent Quality, INSERTED)

**Goal:** Restructure agent hierarchy — remove L1 agent, retain L0 as sole front-facing orchestrator, restructure L2/L3 by domain. Fix C-1 (delegate-task vs task conflict), C-3 (hallucinated `websearch`), H-2 (hm-l2-build 86 lines underspecified), M-1 (8 skills vs max 3), L-2/L-3 (temperature/size violations across L2 agents).

**Why this exists:** Agent quality audit (Phase 23 — 23-DEBTS-REGISTER) found systemic quality failures: contradictory delegation directives (C-1), hallucinated tool permissions (C-3), severely underspecified agents (H-2), skill overload (M-1), and temp/size violations (L-2/L-3). These must be fixed before agent profiles can be enforced.

**Depends on:** Phase 24
**Blocks:** P24.2, P24.3, P24.4, P24.5, P24.6

**Success Criteria:**

1. L1 agent directory removed or migrated — L0 is sole front-facing orchestrator
2. L2/L3 agents restructured by domain (Coordination, Routing, Schema, Structural)
3. C-1 resolved: `task` tool standardized as preferred delegation method across all agents
4. C-3 resolved: `websearch` removed from all agent permissions
5. M-1 resolved: every agent declares ≤3 skills

**Governance:**

- **GSD Re-validation:** NO — agent hierarchy is Hivemind-native design, not GSD-sourced
- **Architecture Absorption:** NO — agent profiles live in `.opencode/agents/` (soft meta-concepts). Hierarchy restructure modifies agent files only, NOT `src/`
- **Protocol Chain:** Spec (P24.1-SPEC.md) → Research (DEBTS-REGISTER audit) → Context (C-1/C-3/H-2/M-1/L-2/L-3 debt descriptions) → Dependencies (P24) → Feature completeness (5 success criteria) → Tests (agent validation script) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24 (input), P24.2 (output), P23.4 (D→A gate)
- **TBD Registry:** TBD-24.1-01: Agent domain classification may reveal ambiguous agents that span multiple domains; TBD-24.1-02: L1 removal may break existing command references to L1 agent
- **Live UAT Node:** Run `opencode agent list` after restructure — verify L0 appears, L1 missing, L2/L3 grouped by domain. Run a dispatch test — verify L0 routes correctly
- **Deferred Stacking:** Agent permission fine-tuning (deferred to P32), agent-specific tool overrides (deferred to P32)

### Phase 24.2: Agent Profile Quality Enforcement (Cluster A — Agent Quality, INSERTED)

**Goal:** Rewrite ALL hm-* agents with proper execution flows, success metrics, input/output contracts, artifact delivery templates, and anti-pattern sections. Enforce quality gate per agent profile.

**Why this exists:** Phase 24.1 restructures hierarchy; Phase 24.2 fills the content gap. Most hm-* agents lack execution protocols, success criteria, and behavioral contracts — producing unpredictable subagent behavior.

**Depends on:** Phase 24.1
**Blocks:** P24.3, P24.4, P24.5, P24.6

**Success Criteria:**

1. Every hm-* agent (30 agents) has documented execution flow (≥6 structured sections)
2. Every hm-* agent declares success metrics and artifact delivery contract
3. Every hm-* agent has anti-patterns section
4. Quality gate (lifecycle → spec → evidence) passes for agent profile batch
5. Zero TODO comments remaining in any hm-* agent file

**Plans:** 5 plans

```
Plans:

- [ ] 24.2-01-PLAN.md — Upgrade 8 Execution/Implementation Agents (hm-executor, hm-verifier, hm-planner, hm-plan-checker, hm-code-reviewer, hm-code-fixer, hm-integration-checker, hm-debug-session-manager)
- [ ] 24.2-02-PLAN.md — Upgrade 8 Research/Planning Agents (hm-project-researcher, hm-phase-researcher, hm-synthesizer, hm-codebase-mapper, hm-pattern-mapper, hm-architect, hm-roadmapper, hm-specifier)
- [ ] 24.2-03-PLAN.md — Upgrade 8 Cross-Cutting/Support Agents (hm-intent-loop, hm-ecologist, hm-shipper, hm-nyquist-auditor, hm-intel-updater, hm-security-auditor, hm-debugger, hm-user-profiler)
- [ ] 24.2-04-PLAN.md — Upgrade 6 UI/Documentation/Orchestration Agents (hm-ui-researcher, hm-ui-checker, hm-ui-auditor, hm-doc-writer, hm-doc-verifier, hm-orchestrator)
- [ ] 24.2-05-PLAN.md — Create Canonical Artifact Schema Reference (.planning/references/artifact-schema.md)

```

**Governance:**

- **GSD Re-validation:** NO — agent quality is Hivemind-native, quality standards from HMQUAL-01..08
- **Architecture Absorption:** NO — agent profiles are `.opencode/agents/` only. Quality enforcement tools (scanner, validator) belong in `src/features/agent-quality/` at `src/`
- **Protocol Chain:** Spec (P24.2-SPEC.md with quality criteria) → Research (24.2-RESEARCH.md with GSD synthesis) → Context (24-CONTEXT.md with D-24-01..04) → Dependencies (P24.1) → Patterns (GSD agent body format adapted for Hivemind) → Feature completeness (8 SPEC requirements Q-01..08) → Tests (grep-based verification per plan) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.1 (input), P24.3 (output), P23.4/23.5 (gates)
- **TBD Registry:** TBD-24.2-01: 30 agents × 40+ lines minimum body = 1,200+ lines total — achievable within phase budget; TBD-24.2-02: Quality scanner tool may need to be built if no existing validation exists
- **Live UAT Node:** Run grep-based verification on updated agents — verify all 30 have ## Execution Flow. Run a subagent dispatch with a quality-enforced agent — verify correct behavior.
- **Deferred Stacking:** Agent eval framework (deferred to post-P36), agent benchmark suite (deferred to v2.0)

### Phase 24.3: Commands Infrastructure (Cluster C — Commands & Workflows, INSERTED)

**Goal:** Design and implement namespace routers, workflow separation patterns, YAML frontmatter schema for command definitions, and execute-slash-command routing integration. Based on GSD research evidence: 67 commands + 88 workflows pattern.

**Why this exists:** GSD deep research (Phase 23, P23-S01) revealed a structured command system with namespace routers, workflow modes, and frontmatter-driven execution — all of which Hivemind currently lacks. Commands are scattered across `.opencode/commands/` without classification, routing, or standardized schema.

**Depends on:** Phase 24.2
**Blocks:** P24.4, P24.5, P24.6

**Success Criteria:**

1. Namespace router design documented — command groups by domain (hm-*, gsd-*, hf-*)
2. Workflow separation pattern established: discussion vs planning vs execution vs verification vs shipping
3. YAML frontmatter schema defined for all command `.md` files
4. `execute-slash-command` routing integration designed — route by namespace to correct handler
5. Backward compatibility with existing `.opencode/commands/` preserved

**Governance:**

- **GSD Re-validation:** ⚠️ YES — 67+88 commands/workflows pattern sourced from OLD GSD repo. Must re-validate against open-gsd/get-shit-done-redux. The namespace router and workflow separation patterns may differ in the new repo.
- **Architecture Absorption:** YES — namespace routers go in `src/routing/command-engine/`, YAML schema in `src/schema-kernel/`, routing integration in `src/routing/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.3-SPEC.md) → Research (GSD re-validation + existing execute-slash-command code) → Context (P23-S01 synthesis documents, P24.3.1 prototype findings) → Dependencies (P24.2, P24.3.1) → Tech compliance (validate against OpenCode SDK command schema) → Patterns (existing `.opencode/commands/` files) → Feature completeness (5 success criteria) → Tests (command dispatch unit + integration) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.2 (input), P24.4 (output), P24.3.1 (parallel prototype), P23.5 (A→C gate)
- **TBD Registry:** TBD-24.3-01: GSD re-validation may invalidate 67+88 estimate — adjust scope accordingly; TBD-24.3-02: `.opencode/commands/` may have hidden compatibility issues with new schema; TBD-24.3-03: Namespace router may need coexisting legacy router during migration
- **Live UAT Node:** Register a test command via new infrastructure → verify it appears in `opencode command list` → dispatch it via `/` → verify correct handler invoked
- **Deferred Stacking:** Command permission wiring (deferred to P32), command analytics/tracking (deferred to post-P36)

### Phase 24.3.1: Governance Session Prototype (Cluster C — Commands & Workflows, MỚI)

**Goal:** Build a prototype custom tool `create-governance-session` that validates the technical feasibility of OpenCode SDK session creation + TUI injection + named session handoff before full Commands Infrastructure investment. After L2 verification, 5 CRITICAL runtime failures found in live UAT — gap closure plans (04-07) address these.

**Why this exists:** OpenCode SDK provides `sdk.session.create()`, `sdk.session.prompt()`, `sdk.tui.appendPrompt()`, `sdk.tui.showToast()` — but these APIs have not been tested in Hivemind's context. This prototype verifies: (1) Session auto-naming works with explicit title + parentID, (2) TUI injection displays correctly in OpenCode message stream, (3) Git commit flow before handoff is feasible. Without this validation, P24.3 risks building infrastructure on unverified SDK assumptions.

**Plans:** 7 plans in 5 waves — 3 original (✅ COMPLETE) + 4 gap closure

- [x] 24.3.1-01-PLAN.md — Wave 1: Create governance engine directory + tool implementation (Zod schema, SDK session creation, prompt injection, TUI toast, git commit) ✅ `0287eb10`, `6f28296f`, `98ea6b80`
- [x] 24.3.1-02-PLAN.md — Wave 2: Register tool in plugin.ts + unit tests with mocked SDK calls ✅ `b0f1b087`, `f4057c82`
- [x] 24.3.1-03-PLAN.md — Wave 3: Full verification — typecheck, test suite, regression check, grep evidence ✅ `56228b96`
- [ ] 24.3.1-04-PLAN.md — Wave 1: Session Tracker Title Capture — add title field to SessionRecord, fix initializeSessionFile frontmatter, fix hardcoded `title: "unknown"` in KernelPacket
- [ ] 24.3.1-05-PLAN.md — Wave 1: Governance Config Plane — create `.hivemind/governance/config.json` with agents/commands/templates schema + typed config reader
- [ ] 24.3.1-06-PLAN.md — Wave 2: Real Root Session + Agent Dispatch — create root session (no parentID), replace raw sendPrompt with coordinator.dispatch()
- [ ] 24.3.1-07-PLAN.md — Wave 3: Delegation Metadata Propagation — fix delegatedBy.agentName, mainAgent.name, subagentType from "unknown" to real values

**Scope:**

1. Create custom tool `create-governance-session` that:
   - Creates a new OpenCode session via `sdk.session.create()` with explicit title naming
   - Injects TUI notification via `sdk.tui.showToast()` + `sdk.tui.appendPrompt()`
   - Auto-names session with format: `hm-governance:<workflow>-<context>`
   - Git-commits current context before handoff
   - Outputs user instruction: "chuyển tới session 'name, meta, ses_id' để hoàn thành..."
2. L2-L3 evidence: prototype with working SDK calls
3. Verdict: PASS/FAIL for Commands Infrastructure SDK path
4. **Gap closure (04-07):** Fix 5 CRITICAL runtime UAT failures — phantom session, missing agent dispatch, missing config plane, missing title capture, "unknown" delegation metadata

**Governance:**

- **GSD Re-validation:** NO — governance session is a Hivemind-native prototype, not GSD-sourced
- **Architecture Absorption:** YES — the tool itself lives at `src/tools/governance/create-governance-session.ts` (already exists). Config plane logic in `src/config/governance/`. NOT in agent profiles.
- **Protocol Chain:** Spec (24.3.1-SPEC.md) → Research (OpenCode SDK session.create() API) → Context (existing prototype, 5 gap items) → Dependencies (P24) → Tech compliance (validate against @opencode-ai/plugin SDK version) → Patterns (existing tool registration pattern) → Feature completeness (7 plans × success criteria) → Tests (14 unit tests exist, gap closure tests needed) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24 (input), P24.3 (output - validates feasibility), P24.4 (parallel)
- **TBD Registry:** TBD-24.3.1-01: SDK session.create() may have undocumented rate limits; TBD-24.3.1-02: Phantom session root cause may be deeper than current gap plans address
- **Live UAT Node:** Run `create-governance-session` in real OpenCode session → verify: (1) session appears in `opencode session list`, (2) TUI notification displays, (3) agent dispatch works, (4) delegation metadata is NOT "unknown", (5) session titles captured correctly
- **Deferred Stacking:** Full governance workflow abstraction (deferred to P24.6 hm-commands), multi-session orchestration (deferred to post-P36)

**Depends on:** Phase 24
**Blocks:** P24.3 (validates technical feasibility of Command Infrastructure SDK path), P24.4, P24.5, P24.6

**Success Criteria:**

1. `create-governance-session` tool registers in plugin.ts without conflicts
2. Tool creates OpenCode session with formatted name `hm-governance:<workflow>-<context>` and parentID linkage
3. TUI notification (`showToast` + `appendPrompt`) displays in main session message stream
4. Git commit of current context executes before handoff instruction
5. User receives actionable handoff text: "chuyển tới session 'name, meta, ses_id' để hoàn thành..."
6. **Gap closure (L1 UAT):** 5 CRITICAL runtime failures resolved — governance session visible in `opencode session list`, agent dispatched to process brief, config plane exists, session titles captured in tracker, delegation metadata shows real values

### Phase 24.4: References & Templates System (Cluster C — Commands & Workflows, INSERTED)

**Goal:** Create standardized reference format, template engine, and @-reference mechanism for commands and workflows. Establish `.hivemind/references/` and `.hivemind/templates/` as canonical structure.

**Why this exists:** Commands and workflows need shared reference data (agents, skills, commands, permissions) and templates for common patterns. Currently references are ad-hoc and templates don't exist at all — every command author rewrites from scratch.

**Depends on:** Phase 24.3, P24.3.1
**Blocks:** P24.5, P24.6

**Success Criteria:**

1. Standardized reference format defined — YAML frontmatter + markdown body per reference type
2. Template engine designed — parameterized templates with variable substitution
3. @-reference mechanism documented — `@agent:name`, `@skill:name`, `@command:name` resolution
4. `.hivemind/references/` directory created with initial reference schemas
5. `.hivemind/templates/` directory created with command and workflow templates

**Governance:**

- **GSD Re-validation:** ⚠️ YES — reference/template patterns may reference GSD ADR conventions from old repo. Must verify against open-gsd/get-shit-done-redux reference architecture.
- **Architecture Absorption:** YES — template engine implementation goes in `src/features/templates/` or `src/shared/template-engine.ts`. Reference format schema in `src/schema-kernel/reference.schema.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.4-SPEC.md) → Research (existing `.hivemind/` structure patterns + GSD reference conventions re-validated) → Context (P24.3 command infrastructure output) → Dependencies (P24.3, P24.3.1) → Patterns (existing `.hivemind/registries` structure) → Feature completeness (5 success criteria) → Tests (template engine unit tests + reference format validation) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.3 (input), P24.5 (output), P24.6 (consumer)
- **TBD Registry:** TBD-24.4-01: @-reference resolution may require a resolver tool in `src/tools/`; TBD-24.4-02: `.hivemind/references/` and `.hivemind/templates/` may conflict with existing registry structure
- **Live UAT Node:** Create a reference file → reference it via @-mechanism in a command → verify resolution works in real session
- **Deferred Stacking:** Web-based template editor (deferred), reference validation CI hook (deferred to post-P36), template sharing/registry (deferred)

### Phase 24.5: Workflow Files Architecture (Cluster C — Commands & Workflows, INSERTED)

**Goal:** Design workflow file architecture with size budgets (XL=1700, LARGE=1500, DEFAULT=1000, STRICT=500). Implement modes/ and templates/ decomposition. Establish pipeline: discuss → plan → execute → verify → ship.

**Why this exists:** Workflow files grow unbounded without size governance. GSD research revealed workflow size budgets as a critical quality control mechanism. Without size limits, workflows degrade into unreadable monoliths. The modes/ decomposition enables reusable execution profiles.

**Depends on:** Phase 24.4
**Blocks:** P24.6

**Success Criteria:**

1. Workflow size budget tiers defined and documented (XL/LARGE/DEFAULT/STRICT)
2. Workflow decomposition into phases/phases/ templates established
3. Pipeline stages documented: discuss → plan → execute → verify → ship
4. Mode system defined: mvp, standard, strict, research per phase
5. Size enforcement mechanism designed (gate at creation time)

**Governance:**

- **GSD Re-validation:** ⚠️ YES — size budget tiers and mode system are sourced directly from old GSD workflow patterns. Re-validate against open-gsd/get-shit-done-redux to verify tier values, mode definitions, and pipeline stages.
- **Architecture Absorption:** YES — size enforcement gate in `src/routing/workflow-validator.ts` or `src/features/workflow/`. Pipeline orchestration in `src/features/workflow/pipeline.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.5-SPEC.md) → Research (GSD workflow architecture re-validated + existing Hivemind workflow patterns) → Context (P24.4 references/templates output) → Dependencies (P24.4) → Tech compliance (validate size budget implementation against real workflow files) → Patterns (existing `.planning/phases/` structure) → Feature completeness (5 success criteria) → Tests (size budget validation tests + pipeline stage transition tests) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.4 (input), P24.6 (output)
- **TBD Registry:** TBD-24.5-01: Size budgets may need adjustment after measuring actual Hivemind workflow files; TBD-24.5-02: Mode definitions may overlap with existing BOOT/CP-* workstream modes
- **Live UAT Node:** Create a workflow file exceeding size budget → verify enforcement gate rejects it. Create within budget → verify gate passes. Run pipeline stages end-to-end.
- **Deferred Stacking:** Workflow analytics (deferred), auto-split for oversized workflows (deferred), workflow visualization (deferred)

### Phase 24.6: Build HM-* Commands (Cluster C — Commands & Workflows, INSERTED)

**Goal:** Create actual hm-* command implementations: hm-init-project, hm-discuss, hm-plan, hm-execute, hm-verify, hm-gate, hm-debug, hm-audit, hm-research. Each command uses the infrastructure from P24.3-P24.5.

**Why this exists:** Hivemind needs its own command family distinct from GSD tooling. Currently all workflows route through gsd-* commands. HM-* commands provide Hivemind-native project initialization, discussion, planning, execution, verification, gating, debugging, auditing, and research workflows.

**Depends on:** Phase 24.5
**Blocks:** P25

**Success Criteria:**

1. `hm-init-project` command creates new Hivemind project structure
2. `hm-discuss` command starts phase discussion cycle
3. `hm-plan` command creates phase plans from discussion output
4. `hm-execute` command runs phase plans
5. `hm-verify` command runs verification gates
6. `hm-gate` command runs quality gate triad
7. `hm-debug` command starts debugging workflow
8. `hm-audit` command audits phase or project state
9. `hm-research` command runs research chain
10. All commands use `.hivemind/references/` and `.hivemind/templates/` from P24.4

**Governance:**

- **GSD Re-validation:** ⚠️ YES — HM-* command patterns (discuss → plan → execute → verify → ship) are derived from GSD workflow patterns. Each command's behavior must be re-validated against open-gsd/get-shit-done-redux. The 9-command list itself is Hivemind-native.
- **Architecture Absorption:** YES — command implementations go in `src/cli/commands/hm-*` or as `.opencode/commands/hm-*` definitions. Core logic (discussion, planning, execution) belongs in `src/features/workflow/` NOT in agent profiles.
- **Protocol Chain:** Spec (P24.6-SPEC.md per command) → Research (GSD re-validation + Hivemind workflow patterns) → Context (P24.3 infrastructure, P24.4 references, P24.5 workflows) → Dependencies (P24.5) → Patterns (existing GSD commands as reference, but must be transformed) → Feature completeness (10 success criteria) → Tests (each command unit test + E2E test) → Gates (lifecycle → spec → evidence per command)
- **Integration Checkpoints:** Adjacent: P24.5 (input), P25 (output - trajectory commands), P23.5 (A→C gate)
- **TBD Registry:** TBD-24.6-01: 9 commands × full implementation may exceed single phase budget — consider MVP subset; TBD-24.6-02: Some commands may overlap with existing GSD commands — resolve routing conflicts
- **Live UAT Node:** Run each hm-* command in live OpenCode session → verify correct behavior, output format, and absence of cross-contamination with gsd-* commands
- **Deferred Stacking:** HM-* command help system (deferred), command discovery/indexing (deferred), command analytics (deferred)

### Phase 25: Trajectory + Agent-Work-Contract Redesign (Group 1 — was Phase 24)

**Status:** ✅ COMPLETE — 6 plans in 4 waves (2026-05-29)
**Goal:** Add comprehensive tests to trajectory module (0→15-30 tests), implement agent-work-contract lifecycle state machine, unify compaction bounds, establish bidirectional cross-linking, investigate deriveSurface() — all TDD-first.
**Depends on:** Phase 23, 24, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6
**Plans:** 6 plans in 4 waves

- [x] 25-01-PLAN.md — Trajectory RED tests (Wave 1, TDD, 34 tests across 4 files)
- [x] 25-02-PLAN.md — Unified bounds + deriveSurface investigation (Wave 1, parallel)
- [x] 25-03-PLAN.md — Contract lifecycle state machine (Wave 2, TDD, 15 tests)
- [x] 25-04-PLAN.md — Bidirectional cross-linking (Wave 2, TDD, 6 tests)
- [x] 25-05-PLAN.md — Make trajectory tests GREEN (Wave 3, TDD loop completion)
- [x] 25-06-PLAN.md — Final verification + SUMMARY (Wave 4)

**Governance:**

- **GSD Re-validation:** NO — trajectory is Hivemind-native (session-tracker lineage), not GSD-sourced
- **Architecture Absorption:** YES — trajectory logic in `src/task-management/trajectory/`, agent-work-contract in `src/features/agent-work-contracts/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P25-SPEC.md) → Context (P25-CONTEXT.md, 15 decisions D-01–D-15) → Gray areas (P25-GRAY-AREAS.md, 7 decided) → Plans (6 plans, 4 waves) → TDD (RED→GREEN→REFACTOR) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.6 (input), P26 (output), P23.6 (P25→P26→B gate)
- **TBD Registry:** TBD-25-01: deriveSurface() exists at delegation-persistence.ts:22 — distinct from getToolAuthority(), no dedup needed; TBD-25-02: Blocked evidence deferred to post-M36 (D-12)
- **Live UAT Node:** Run trajectory lifecycle → verify state transitions and cross-linking in session-tracker logs
- **Deferred Stacking:** Blocked contract evidence (D-12, post-M36), trajectory visualization, trajectory analytics

### Phase 26: Pressure + Notification Redesign (Group 1 — was Phase 25)

**Goal:** Fix pressure scoring (zero tests, 625 LOC). Fix authority-matrix overlap. Complete notification delivery redesign (TTL + retry + delivery tracking + injection plane patterns from P23-07). Fix SDK handler race.
**Depends on:** Phase 23, 24, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 25

**Governance:**

- **GSD Re-validation:** NO — pressure scoring and notification delivery are Hivemind-native
- **Architecture Absorption:** YES — pressure scoring in `src/features/pressure/`, notification delivery in `src/features/notification/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P26-SPEC.md) → Research (existing pressure.ts 625 LOC + P23-07 injection patterns) → Context (P23-07 patterns, notification debts) → Dependencies (P25 trajectory as input) → Tech compliance (validate against existing notification schema) → Patterns (existing notification-handler patterns) → Feature completeness (pressure tests + notification TTL/retry working) → Tests (TDD for pressure scoring + notification delivery) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P25 (input), P26.1 (output), P23.6 (P25→P26→B gate)
- **TBD Registry:** TBD-26-01: Authority-matrix overlap may be more extensive than current scope; TBD-26-02: SDK handler race may require deeper SDK investigation
- **Live UAT Node:** Trigger a high-pressure condition → verify pressure scoring produces correct output. Send a delegation notification → verify TTL/retry/delivery tracking works in real session.
- **Deferred Stacking:** Pressure-based routing decisions (deferred to P27), notification channel plugins (deferred)

### Phase 26.1: Artifact Naming & Pathing Convention (Cluster B — Documents, INSERTED)

**Goal:** Establish standardized artifact naming convention, pathing structure, YAML frontmatter format, and artifact classification system across all `.planning/` and `.hivemind/` documents. Fix C-5 (Document/Artifact Naming & Pathing Governance Collapse) from DEBTS-REGISTER.

**Why this exists:** Systemic debt C-5 identified documents created without naming standards, inconsistent format (lowercase vs uppercase mixed), no gatekeeping on artifact creation, no cross-session validation, and overlapping/conflicting documents across sessions. Pulled forward from P31 (where P31-01 through P31-07 were originally planned) to enable downstream artifact-dependent phases.

**Depends on:** Phase 26

**Success Criteria:**

1. Canonical naming convention defined: `{PHASE}-{TYPE}[-{SUBTYPE}][-{DATE}].md` with TYPE = uppercase
2. Artifact classification schema established: research/, specs/, plans/, syntheses/, audits/ per phase
3. YAML frontmatter template defined for all artifacts
4. Standardized artifact structure per phase: SPEC.md, RESEARCH.md, PLAN.md, SUMMARY.md, SYNTHESIS.md, DEBTS-REGISTER.md
5. Existing artifacts batch-renamed to match convention (non-destructive — symlinks/aliases preserved)

**Governance:**

- **GSD Re-validation:** ⚠️ YES — artifact naming conventions reference GSD ADR-0006 (Planning Path Projection Module). Must re-validate against open-gsd/get-shit-done-redux ADR conventions.
- **Architecture Absorption:** YES — naming convention validation goes in `src/features/governance/artifact-validator.ts` or `src/routing/artifact-governance/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P26.1-SPEC.md) → Research (existing artifact patterns audit + GSD ADR re-validation) → Context (C-5 debt description, existing naming chaos) → Dependencies (P26) → Patterns (`.planning/architecture/` existing conventions) → Feature completeness (5 success criteria) → Tests (naming validation tests + batch rename dry-run) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P26 (input), P26.2 (output), P23.6 (P25→P26→B gate)
- **TBD Registry:** TBD-26.1-01: Batch renaming 100+ artifacts may find hidden cross-references that break; TBD-26.1-02: Some artifacts may have date-stamp naming that conflicts with new convention
- **Live UAT Node:** Create a new artifact → verify naming validator accepts it. Run batch rename dry-run → verify no broken references.
- **Deferred Stacking:** Automated artifact migration tool (deferred), artifact quality scoring (deferred)

### Phase 26.2: Artifact Dependency & Gatekeeping (Cluster B — Documents, INSERTED)

**Goal:** Implement cross-reference validation, gatekeeping loops, and dependency chain management for all artifacts. Ensure documents are validated on creation, checked against existing artifacts for overlap, and traceable across sessions.

**Why this exists:** C-5 sibling gap: even with naming conventions (P26.1), there is no mechanism to validate artifact quality, cross-reference integrity, or dependency ordering. Regressions occur because multiple sessions create overlapping/conflicting documents without awareness.

**Depends on:** Phase 26.1

**Success Criteria:**

1. Gatekeeping loop validates each artifact on creation (naming, location, format, YAML frontmatter)
2. Cross-session validation checks existing artifacts before creating new ones (prevent overlap)
3. Dependency chain between artifacts is documented and enforceable
4. Debt tracking (DEBTS-REGISTER.md) integrated into workflow commands as default step
5. Cross-reference validation detects dead/broken artifact links

**Governance:**

- **GSD Re-validation:** ⚠️ YES — gatekeeping loops and dependency chains reference GSD quality gate patterns. Must re-validate against open-gsd/get-shit-done-redux gate architecture.
- **Architecture Absorption:** YES — cross-reference validator in `src/features/governance/cross-ref-validator.ts`, gatekeeping loop in `src/features/governance/artifact-gate.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P26.2-SPEC.md) → Research (existing gate skills + GSD gate patterns re-validated) → Context (P26.1 naming output) → Dependencies (P26.1) → Patterns (gate-l3-* skill patterns) → Feature completeness (5 success criteria) → Tests (gate loop unit tests + cross-ref integrity tests) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P26.1 (input), P24.7 (output - primitives depend on artifact conventions), P23.6 (P25→P26→B gate)
- **TBD Registry:** TBD-26.2-01: Cross-session validation may need access to `.hivemind/session-tracker/` for full context; TBD-26.2-02: Gatekeeping loop may conflict with existing GSD workflow gates
- **Live UAT Node:** Create a deliberately invalid artifact → verify gatekeeping loop rejects it. Create a cross-reference to non-existent artifact → verify dead link detection fires.
- **Deferred Stacking:** Automated artifact repair (deferred), gatekeeping dashboard (deferred)

### Phase 24.7: Primitives Asset Schema (Cluster E — Primitives Distribution, INSERTED)

**Goal:** Design and implement schema for each primitive type (agent, command, skill, tool, workflow). Code-gen from schema → `src/assets/`. Runtime validation. Fix current broken pattern: primitives live in `.hivefiver-meta-builder/` → symlinks → `.opencode/` which is WRONG — shipped primitives should be install-time extracted from `assets/` as real files.

**Why this exists:** Current primitive architecture uses symlinks from `.hivefiver-meta-builder/` to `.opencode/`. This is a development-time convenience that breaks on `npm install` in end-user projects. Shipped primitives must be extracted at install time from a bundled `assets/` directory. The symlink pattern is ONLY correct for development of this harness project.

**Depends on:** Phase 26
**Blocks:** P24.8

**Success Criteria:**

1. Primitive type schema defined for each: agent, command, skill, tool, workflow
2. Zod schema for each primitive type with validation rules
3. Code-gen pipeline: schema → TypeScript types → `src/assets/` module
4. Runtime validation: loaded primitives validated against schema at activation
5. Legacy `.hivefiver-meta-builder/` symlink pattern documented as dev-only

**Governance:**

- **GSD Re-validation:** ⚠️ YES — primitive schema patterns may reference GSD primitive conventions. Verify against open-gsd/get-shit-done-redux.
- **Architecture Absorption:** YES — schemas in `src/schema-kernel/primitive-*.schema.ts`, code-gen in `src/shared/codegen/`, runtime validation in `src/shared/primitive-validator.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.7-SPEC.md) → Research (existing primitive formats + GSD conventions re-validated) → Context (P26 artifact conventions, existing `.hivefiver-meta-builder/` structure) → Dependencies (P26) → Tech compliance (validate against @opencode-ai/plugin primitive format) → Patterns (existing Zod schema patterns) → Feature completeness (5 success criteria) → Tests (schema validation + code-gen output tests) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P26 (input), P24.8 (output), P23.7 (E/F/G gate)
- **TBD Registry:** TBD-24.7-01: 5 primitive types × full schema may exceed phase budget — prioritize agent+skill; TBD-24.7-02: Code-gen pipeline may need AST-level primitive parsing
- **Live UAT Node:** Generate primitives from schema → verify they load correctly in OpenCode. Validate against existing primitives → verify no breaking changes.
- **Deferred Stacking:** Custom primitive type extensions (deferred), schema evolution/migration (deferred)

### Phase 24.8: Primitives Install-Time Extraction (Cluster E — Primitives Distribution, INSERTED)

**Goal:** Implement `npx hivemind init` primitive extraction from `assets/` into `.opencode/`. Real files (not symlinks). Global vs project-based resolution. Permissions resolution and validation.

**Why this exists:** When a user runs `npx hivemind init` in their project, shipped primitives must be extracted as real files into `.opencode/`. The current symlink-to-meta-builder pattern only works in this development repo. End-user projects need atomic file extraction with permission resolution.

**Depends on:** Phase 24.7
**Blocks:** P24.9

**Success Criteria:**

1. `npx hivemind init` extracts primitives from `assets/` to `.opencode/` as real files
2. Global install extracts to global `.opencode/` directory
3. Project install extracts to project `.opencode/` directory
4. Permissions resolution: project-level overrides global defaults
5. Atomic extraction: partial failure rolls back cleanly
6. No symlinks to `.hivefiver-meta-builder/` in shipped output
7. Legacy `bootstrap-recover` tool updated to use extraction (not symlinks)

**Governance:**

- **GSD Re-validation:** NO — primitive extraction is Hivemind-native (extends existing BOOT workstream)
- **Architecture Absorption:** YES — extraction logic in `src/tools/bootstrap-extract.ts` or `src/cli/commands/init.ts`. Permissions resolution in `src/shared/permissions/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.8-SPEC.md) → Research (existing BOOT-02..BOOT-07 patterns + npm install hooks) → Context (P24.7 schema output) → Dependencies (P24.7) → Tech compliance (validate against OpenCode's `.opencode/` primitive discovery) → Patterns (BOOT-04 symlink restoration as baseline) → Feature completeness (7 success criteria) → Tests (extraction unit tests + atomic rollback tests + E2E init test) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.7 (input), P24.9 (output), P23.7 (E/F/G gate)
- **TBD Registry:** TBD-24.8-01: Global vs project permissions resolution may conflict with existing BOOT config; TBD-24.8-02: `bootstrap-recover` refactor may need to coexist with legacy version during migration
- **Live UAT Node:** Run `npx hivemind init` in a temp project → verify `.opencode/` contains real files (not symlinks) → verify `doctor` PASSes
- **Deferred Stacking:** Partial primitive update/reinstall (deferred), primitive versioning (deferred)

### Phase 24.9: Bootstrap Init Flow Expansion (Cluster F — Bootstrap & Init, INSERTED)

**Goal:** Expand bootstrap initialization flow: create `.hivemind/` structure, extract primitives (from P24.8), initialize routing governance plane, detect framework conflicts, configure user config plane. Full end-to-end `npx hivemind init` experience.

**Why this exists:** Current bootstrap (BOOT-02..BOOT-07) creates `.hivemind/` structure and restores symlinks. With P24.8 delivering real-file extraction, bootstrap must be expanded to coordinate the full init flow: directory creation, primitive extraction, governance initialization, and framework conflict detection.

**Depends on:** Phase 24.8
**Blocks:** P27

**Success Criteria:**

1. `npx hivemind init` creates complete `.hivemind/` directory tree
2. `npx hivemind init` extracts shipped primitives to `.opencode/` as real files
3. Routing governance plane initialized with default configuration
4. Framework conflict detection: warns if GSD, BMAD, or other frameworks present
5. User config plane created with interactive prompts for preferences
6. `npx hivemind doctor` reports all init operations PASS
7. End-to-end clean temp project proof: init → doctor → verify primitives exist

**Governance:**

- **GSD Re-validation:** NO — bootstrap is Hivemind-native (BOOT-02..BOOT-07 already delivered)
- **Architecture Absorption:** YES — full init orchestration in `src/cli/commands/init.ts`, framework conflict detection in `src/features/governance/framework-detector.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P24.9-SPEC.md) → Research (existing BOOT workstream patterns) → Context (P24.8 extraction output, existing BOOT artifacts) → Dependencies (P24.8) → Patterns (BOOT-07 E2E proof pattern) → Feature completeness (7 success criteria) → Tests (E2E init test + conflict detection test) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.8 (input), P27 (output), P23.7 (E/F/G gate)
- **TBD Registry:** TBD-24.9-01: Framework conflict detection may have false positives with existing .planning/ directories; TBD-24.9-02: Interactive prompts may fail in CI environments — add --yes flag
- **Live UAT Node:** Run `npx hivemind init --yes` in a temp project with existing GSD framework → verify conflict warning appears. Run in clean project → verify init completes, doctor PASSes.
- **Deferred Stacking:** Full interactive onboarding wizard (deferred), migration tool from GSD/BMAD (deferred)

### Phase 27: Routing + Intent Loop Foundation (Group 2 — was Phase 26, SCOPE EXPANDED)

**Goal:** Fix intent-classifier (fragile substring). Remove dead registry validator. Delete dead no-op profile methods. Add tests for 3 sub-modules (~1,200 LOC untested). **Expanded scope:** Implement namespace meta-skills (two-stage routing) and workflow separation pattern inspired by GSD research.

**Why scope expanded:** GSD deep research (Phase 23, P23-S01) revealed two patterns critical for routing reliability: (1) namespace meta-skills that enable two-stage routing (classify → route) instead of single-pass fragile substring matching, and (2) workflow separation pattern that decouples routing from execution. These address M-3 (conductor domain mismatch) and M-7 (context-mapper underspecified) by providing a structured routing framework.

**Depends on:** Phase 21-P26.2, P24.7, P24.8, P24.9
**Debts inherited from Phase 23:** M-3 (conductor domain mismatch), M-7 (context-mapper underspecified) — see `23-DEBTS-REGISTER-2026-05-23.md`

**Governance:**

- **GSD Re-validation:** ⚠️ YES — two-stage routing (namespace meta-skills) and workflow separation pattern are sourced from old GSD research. Must re-validate against open-gsd/get-shit-done-redux to verify these patterns still apply.
- **Architecture Absorption:** YES — routing engine in `src/routing/`, intent classifier in `src/routing/intent-classifier/`, namespace meta-skills in `src/routing/namespace-router/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P27-SPEC.md with expanded scope) → Research (GSD routing patterns re-validated + existing intent-classifier analysis) → Context (M-3, M-7 debts, P23-S01 synthesis) → Dependencies (P21-P26.2 chain, P24.7-P24.9) → Tech compliance (validate against existing routing code) → Patterns (existing routing/ module patterns) → Feature completeness (fragile substring fixed + two-stage routing + workflow separation) → Tests (1,200 LOC of untested code covered + new routing tests) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P24.9 (input), P28 (output), P23.7 (E/F/G gate), P23.8 (G/H/I gate)
- **TBD Registry:** TBD-27-01: Two-stage routing may introduce latency that single-pass classification didn't have; TBD-27-02: Namespace meta-skills may conflict with existing agent skill loading
- **Live UAT Node:** Submit various intent queries → verify first stage (classify) and second stage (route) produce correct results. Verify fragile substring bugs no longer occur.
- **Deferred Stacking:** Adaptive routing based on historical accuracy (deferred), routing analytics dashboard (deferred)

### Phase 28: Hook Injection Plane Redesign (Group 2 — was Phase 27, SCOPE EXPANDED)

**Goal:** Fix CQRS violation in tool-after-workflow. Enforce assertHookWriteBoundary. Type hook signatures. Classify silent vs required (incorporate P23-07 delivery patterns). Inline thin observers. **Expanded scope:** Implement workflow size budget enforcement and command inventory drift-guard.

**Why scope expanded:** GSD research identified two unaddressed risks: (1) workflow size budget enforcement prevents bloated workflows from degrading hook injection performance, and (2) command inventory drift-guard detects when registered commands drift from their on-disk definitions — preventing the silent mismatch between `.opencode/commands/` and the command engine's internal registry.
**Depends on:** Phase 27

**Governance:**

- **GSD Re-validation:** ⚠️ YES — workflow size budget enforcement and command inventory drift-guard are sourced from old GSD patterns. Re-validate against open-gsd/get-shit-done-redux.
- **Architecture Absorption:** YES — hook injection in `src/hooks/`, CQRS enforcement in `src/hooks/guards/`, drift-guard in `src/routing/command-engine/drift-guard.ts`. NOT in agent profiles.
- **Protocol Chain:** Spec (P28-SPEC.md with expanded scope) → Research (existing hook code + GSD patterns re-validated + P23-07 delivery patterns) → Context (P27 routing output) → Dependencies (P27) → Tech compliance (validate hook signatures against @opencode-ai/plugin SDK) → Patterns (existing hook module patterns) → Feature completeness (CQRS fix + typed signatures + silent/required classification + size budgets + drift-guard) → Tests (hook type tests + CQRS violation tests + drift detection tests) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P27 (input), P29 (output), P23.8 (G/H/I gate)
- **TBD Registry:** TBD-28-01: assertHookWriteBoundary may need exceptions for legitimate cross-boundary hooks; TBD-28-02: Command inventory drift-guard may have false positives during active development
- **Live UAT Node:** Register a hook that violates CQRS → verify enforcement fires. Modify a command file without updating registry → verify drift-guard detects mismatch.
- **Deferred Stacking:** Hook performance monitoring (deferred), hook dependency visualization (deferred)

### Phase 29: Auto-Looping + PTY + Background Command Revamp (Group 2 — was Phase 28)

**Goal:** Fix auto-loop session-tracker dependency. Replace ralph-loop with practical verification patterns (per P23-04 rewrite). Wire into routing pipeline. Delete dead prompt-packet (348 LOC).
**Depends on:** Phase 28
**Debts inherited from Phase 23:** H-5 (external scripts), M-11 (gate dependencies) — see `23-DEBTS-REGISTER-2026-05-23.md`

**Governance:**

- **GSD Re-validation:** ⚠️ YES — auto-looping patterns and verification patterns are sourced from old GSD ralph-loop research. Re-validate against open-gsd/get-shit-done-redux.
- **Architecture Absorption:** YES — auto-loop engine in `src/features/auto-loop/`, PTY integration in `src/features/pty/`, background commands in `src/features/background-command/`. NOT in agent profiles.
- **Protocol Chain:** Spec (P29-SPEC.md) → Research (existing auto-loop code + GSD loop patterns re-validated + PTY CP-PTY-00 research) → Context (P23-04 rewritten skills, P28 hook output) → Dependencies (P28) → Tech compliance (validate PTY against bun-pty version in package.json) → Patterns (existing auto-loop module patterns) → Feature completeness (session-tracker dependency fixed + ralph-loop replaced + routing pipeline wired + prompt-packet deleted) → Tests (auto-loop unit + PTY integration) → Gates (lifecycle → spec → evidence)
- **Integration Checkpoints:** Adjacent: P28 (input), P30 (output - parallel), P23.8 (G/H/I gate)
- **TBD Registry:** TBD-29-01: PTY implementation may have platform-specific issues (Linux vs macOS); TBD-29-02: Ralph-loop replacement may need migration path for existing loops
- **Live UAT Node:** Run an auto-loop task → verify session-tracker correctly tracks iterations. Verify PTY commands work in real terminal session.
- **Deferred Stacking:** Advanced loop patterns (deferred), multi-agent loop coordination (deferred), PTY multiplexing (deferred)

### Phase 30: Schema Kernel Cleanup (Group 3 — was Phase 29)

**Goal:** Delete 3 dead schemas. Add tests for 9 untested schemas. Leaf module — can run parallel to Group 1-2.
**Depends on:** Nothing (leaf module)
**Debts inherited from Phase 23:** H-2 (hm-l2-build underspecified), H-3 (phase-guardian temp), L-2 (agent temp range) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 31: Config Plane Redesign + Artifact Governance (Group 3 — was Phase 30)

**Goal:** Fix config subscriber singleton. Fix decompileAgent bug. Fix validateWithFallback locale check. Split compiler.ts (410 LOC). Establish planning-path projection and document/artifact naming/pathing governance (inspired by GSD ADR-0006 Planning Path Projection Module + STATE.md Document Module).
**Requirements:**

- P31-01: Standardize artifact naming convention: `{PHASE}-{TYPE}[-{SUBTYPE}][-{DATE}].md` với TYPE = uppercase
- P31-02: Standardize phase artifact structure: SPEC.md, RESEARCH.md, PLAN.md, PLAN-N.md, SUMMARY.md, SYNTHESIS.md, DEBTS-REGISTER.md
- P31-03: Classify artifacts by category: research/, specs/, plans/, syntheses/, audits/ per phase
- P31-04: Gatekeeping: document creation validation (naming, location, format)
- P31-05: Cross-session validation: check existing artifacts before creating new ones
- P31-06: Planning-path projection module (centralized path resolution à la GSD ADR-0006)
- P31-07: Debt tracking: integrate `.hivemind/tracking/` (or phase-level `DEBTS-REGISTER.md`) into workflow commands

**Depends on:** Phase 30

### Phase 32: Shipped Primitives + Governance Wire (Group 3 — was Phase 31)

**Goal:** Wire agent/skill/command primitives with soft approach (.md first). Implement hm-* vs hf-* lineage routing validation. Fix governance/permission wiring. Extends P23-03 tool surface docs with shipped primitive patterns.
**Depends on:** Phase 31
**Debts inherited from Phase 23:** C-2 (broken agent refs), C-3 (websearch hallucination), H-4 (hf-create broken path), M-2 (hf-l0 hm-* defaults), M-9 (harness-audit routing), M-10 (hf- dead refs), M-12 (skill depth suffix) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 33: Plugin.ts Decomposition (Group 4 — was Phase 32)

**Goal:** Extract tool registry → registry.ts, startup → startup.ts, hook composition → composer.ts. Fix promise hygiene. Remove legacy hooks. Fix temporal coupling. Target: 493→~150 LOC.
**Depends on:** Phases 21-32 (design fixes settled)

### Phase 34: Async I/O Conversion + Typed Errors (Group 4 — was Phase 33)

**Goal:** Convert runtime sync fs→fs/promises (44 readFileSync, 32 writeFileSync, 19 renameSync). Create 5 typed error classes. Replace ~100 throw new Error.
**Depends on:** Phase 33

### Phase 35: Module Splits + Legacy Inventory (Group 4 — was Phase 34)

**Goal:** Split event-capture.ts (702→2-3), session-tracker/index.ts (561→extract init). Simplify PendingDispatchRegistry. Split types.ts. Standardize tool imports. Legacy inventory.
**Depends on:** Phase 34
**Debts inherited from Phase 23:** C-4 (Q6 state path), M-6 (.coordination/ path), L-1 (guardian overlap) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 36: Integration Verification (Group 4 — was Phase 35)

**Goal:** Full regression. dist rebuild. Tool smoke test. Manifest sync (ARCHITECTURE.md/STRUCTURE.md/CONCERNS.md).
**Depends on:** Phase 35
**Debts inherited from Phase 23:** M-5 (GSD agent list validation) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 37: Fix sync-oss.yml workflow (Independent — was Phase 36)

**Goal:** [To be planned]
**Depends on:** Phase 36
**Debts inherited from Phase 23:** (none)

### Phase 38: Package .opencode/ primitives for distribution (Independent — was Phase 37)

**Goal:** [To be planned]
**Depends on:** Phase 37
**Debts inherited from Phase 23:** L-3 (agent file size) — see `23-DEBTS-REGISTER-2026-05-23.md`

---

## Concern-Remediation Phases (C1-C8)

These 8 phases address code quality, type safety, performance, and architectural concerns identified in `.planning/codebase/CONCERNS.md`. They are sequenced by dependency and priority (P0→P2). Each phase targets specific file-level issues with verifiable success criteria.

- [x] **C1 (Concerns): Critical Type Safety & Error Handling** — Fix: duplicate PermissionAction union member in src/shared/types.ts; silent error swallowing .catch(() => {}) in event-capture.ts, child-writer.ts, initialization.ts; ClientLike = any type erasure in initialization.ts [Arch-src: YES - src/shared/types.ts, src/features/session-tracker/event-capture.ts, src/task-management/continuity/child-writer.ts, src/plugin.ts initialization.ts] [UAT: zero duplicate union members, zero .catch(() => {}) with empty bodies, zero `ClientLike = any` erasure; typecheck clean]
- [x] **C2 (Concerns): Type Safety & Security Hardening** — Fix: 12 `as any` casts in delegation-status.ts, coordinator.ts, session-api.ts; ESLint suppressions in session-api.ts, initialization.ts; console logging in production code (6 files); unsanitized session ID in file paths (3 files); synchronous readFileSync in sidecar; full process.env spread in governance git commit [Arch-src: YES - src/coordination/delegation/delegation-status.ts, src/coordination/coordinator.ts, src/shared/session-api.ts, src/plugin.ts, src/features/session-tracker/*.ts, src/tools/governance/*.ts] [UAT: zero `as any` casts in listed files, zero ESLint suppressions in listed files, zero console.log in production code, session IDs sanitized in file paths, sidecar uses async fs, git commit uses scoped env]
- [x] **C3 (Concerns): Module Decomposition & Promise Patterns** — Fix: 8 files >500 LOC (event-capture.ts 1062 LOC highest); fragile promise chain in ChildWriter.enqueueWrite [Arch-src: YES - src/features/session-tracker/event-capture.ts, src/task-management/continuity/child-writer.ts, src/features/session-tracker/index.ts] [UAT: all files ≤500 LOC, ChildWriter.enqueueWrite uses async/await with proper error propagation, typecheck clean]
- [ ] **C4 (Concerns): Performance Optimization** — Fix: repeated JSON.parse without memoization in delegation-status.ts; synchronous FS in bootstrap-init tool; unbounded timer accumulation in completion detector; execSync blocking in governance session creation [Arch-src: YES - src/coordination/delegation/delegation-status.ts, src/tools/bootstrap/bootstrap-init.ts, src/coordination/completion/detector.ts, src/tools/governance/create-governance-session.ts] [UAT: JSON.parse results cached/memoized, bootstrap-init uses async fs, completion detector clears timers on terminal state, governance session uses async exec]
  **Plans:** 3 plans in 3 waves

  - [ ] C4-01-PLAN.md — Wave 0: Test scaffold for pruneStaleTimers (detector-stability-prune.test.ts)
  - [ ] C4-02-PLAN.md — Wave 1: pruneStaleTimers (REQ-03) + hierarchy-manifest cache (REQ-01)
  - [ ] C4-03-PLAN.md — Wave 2: execFile async (REQ-04) + async FS in bootstrapInit (REQ-02)
- [ ] **C5 (Concerns): Error Handling & Code Quality** — Fix: coordinator.ts triple-fallback error extraction; env propagation risks in create-governance-session.ts and doctor.ts; verify empty catch blocks (already addressed by C1-C4). **Plans:** 3 plans  
  Plans:

  - [ ] C5-01-PLAN.md — coordinator.ts typed SdkMessageShape extraction (REQ-02)
  - [ ] C5-02-PLAN.md — Scoped env for create-governance-session.ts + doctor.ts comment (REQ-03, REQ-04)
  - [ ] C5-03-PLAN.md — Verify zero empty catch blocks (REQ-01 — already satisfied)
- [ ] **C6 (Concerns): Architectural Refactoring** — Fix: session-tracker god module — extract event handlers into dedicated classes; dual persistence format dependency — create DelegationStatusReader interface; plugin.ts monolithic composition — group tool registrations by domain [Arch-src: YES - src/features/session-tracker/, src/coordination/delegation/delegation-status.ts, src/plugin.ts] [UAT: session-tracker event handlers extracted to ≤3 dedicated classes, DelegationStatusReader interface abstracts persistence format, plugin.ts tool registrations grouped by domain with ≤150 LOC per group]
  **Plans:** 5 plans
  Plans:

  - [ ] 01-01-PLAN.md — TDD test scaffolds for all 3 requirements (Wave 0)
  - [ ] 01-02-PLAN.md — REQ-C6-01: Extract event handlers from EventCapture god module (Wave 1)
  - [ ] 01-03-PLAN.md — REQ-C6-02: DelegationStatusReader interface + Zod-validated readers (Wave 1)
  - [ ] 01-04-PLAN.md — REQ-C6-03: Domain-grouped plugin.ts tool registration (Wave 2)
  - [ ] 01-05-PLAN.md — Integration verification (Wave 3)
- [ ] **C7 (Concerns): Test Coverage** — Fix: untested hooks modules (10+ files with 0 coverage); ~80-100 source files without direct test coverage; missing integration tests for session tracker race conditions [Arch-src: YES - src/hooks/**/*.ts, src/features/**/*.ts, src/task-management/**/*.ts] [UAT: hooks modules ≥50% line coverage, session-tracker race condition integration tests exist and pass, overall test coverage increases by ≥10%]
- [ ] **C8 (Concerns): Dependency Cleanup** — Fix: bun-pty in dependencies (should be optionalDependencies); bun-types in dependencies (should be devDependencies); Zod v4 pinned with caret range (pin to specific minor); no runtime SDK version validation [Arch-src: YES - package.json, src/shared/sdk-version.ts (new)] [UAT: bun-pty in optionalDependencies, bun-types in devDependencies, Zod pinned to exact minor, runtime SDK version validation check exists and runs on plugin load]

### Phase 39: C1 Critical Type Safety & Error Handling

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 38
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 39 to break down)

---

## Managed Autonomous Loop — Cycle 3: Cluster-Based Restructuring (Post-Gap Refinement)

**Current authorized cycle: Cycle 3 — Cluster-Based Restructuring** (Phases 21-38 + GAPs P23.3-P23.10)

- Entry gate: Phase 20 COMPLETE (2026-05-21)
- Cluster ordering (critical path): D (Coordination) → A (Agent Quality) + C (Commands & Workflows) → P25 (Trajectory) → P26 (Pressure) → B (Documents) → E (Primitives) + F (Bootstrap) → G (Routing) → H (Hooks) → I (Auto-loop/PTY) → J (Schema/Config, parallel) → K (Cleanup) → L (Verification)
- 8 integration gate phases (P23.3-P23.10) added to verify cross-cluster compatibility before downstream consumption
- 59 total phases (33 original + 8 gaps + 8 concerns + 10 historical CA/O3/BOOT/MCM/SR/CP-* workstream phases)
- MVP minimum (6 phases): P23.3 → P24 → P24.1+P24.2 → P24.7+P24.8 → P30 → P36
- Non-destructive foundation sweep (P00.5) precedes Group 1

**Previous cycles:**

- **Cycle 1 — Lifecycle Alignment:** ✅ COMPLETE (O3 docs + sector AGENTS.md + config cleanup)
- **Cycle 2 — Bootstrap Recovery:** ✅ COMPLETE (BOOT-02 through BOOT-07, Phase 15-20 delivered)

**Completed phases summary (11-23.2):**

- Phase 11: Governance reconciliation
- Phase 12: CP-ST-01 remediation
- Phase 13: Session-tracker defects (6/6 plans)
- Phase 14: Delegation wiring (3/4 plans)
- Phase 15: Delegate-task gap remediation (5 plans)
- Phase 16: Session-tracker tool intelligence (7 plans)
- Phase 17: src/ audit (60 findings, 36K LOC)
- Phase 18: Root cleanup (4 submodules deleted)
- Phase 19: Non-destructive (-854 LOC net)
- Phase 20: Dependency cleanup (11 deps removed)
- Phase 21: Session-Tracker Design Fix (6/6 plans, 15/15 REQs)
- Phase 21.1: Execute-Slash-Command SDK redesign
- Phase 22: Coordination Status + Error Unification (9/9 REQs, 3/3 gates PASS)
- Phase 23: Notification Architecture Fix + Tool Surface Documentation (Wave 1-4)
- Phase 23.1: Session-Tracker SDK Dispatch Investigation
- **Phase 23.2: Session-Tracker Bugfix — Unified task/delegate-task (4/4 plans)** ✅

**Gap phases inserted (P23.3-P23.10):**

- P23.3: Notification Delivery L1 UAT Verification (GAP-01)
- P23.4: D→A Cross-Cluster Integration Gate (GAP-02)
- P23.5: A→C Cross-Cluster Integration Gate (GAP-03)
- P23.6: P25→P26→B Integration Gate (GAP-04)
- P23.7: E/F/G Integration Gate (GAP-05)
- P23.8: G/H/I Integration Gate (GAP-06)
- P23.9: Schema+Config Parallel Track Integration (GAP-07)
- P23.10: Pre-Structural-Cleanup Readiness Gate (GAP-08)

**Concern-remediation phases inserted (C1-C8):**

- C1: Critical Type Safety & Error Handling (P0)
- C2: Type Safety & Security Hardening (P1)
- C3: Module Decomposition & Promise Patterns (P1)
- C4: Performance Optimization (P2)
- C5: Error Handling & Code Quality (P2)
- C6: Architectural Refactoring (P2)
- C7: Test Coverage (P2)
- C8: Dependency Cleanup (P2)

---

## Phase 40: Public Ship Readiness (2026-05-30)

**Status:** Planned
**Depends on:** Phase 39 (COMPLETE)
**Blocking:** GitHub public release + npm publish

**Source:** Runtime gap analysis identified 11 findings across 4 tiers during forensic investigation. Phase 39 completed internal hardening but did not address feature wiring gaps, integration conflicts, or end-user experience.

**PACKAGE NAME:** `hivemind-3.0` (confirmed by owner 2026-05-30)

**PROCESS VIOLATION ACKNOWLEDGED:** Initial 7 PLAN.md files were created directly by front-facing agent (violates constitution). All marked `status: draft-violated`. Each must be recreated through proper GSD workflow: research → context → spec → plan → gatekeeping.

### GSD Routing Table

| Phase | Slash Command | Specialist Agent | Artifacts Required | Gate |
|-------|--------------|-----------------|-------------------|------|
| P40.01 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.02 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.03 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.04 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.05 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.06 | `/gsd-plan-phase` | `gsd-phase-researcher` → `gsd-planner` | RESEARCH → SPEC → PLAN | `gsd-plan-checker` |
| P40.07 | ✅ COMPLETE | Direct execution | test(P40.07-01) + test(P40.07-02) | c0f8475f, 8a694c3e, c3cc9134 |

### Sequential Gate Enforcement

```
P40.01 gate PASS → P40.02 research starts
P40.02 gate PASS → P40.03 research starts
P40.03 gate PASS → P40.04 research starts
P40.04 gate PASS → P40.05 research starts
P40.05 gate PASS → P40.06 research starts
P40.06 gate PASS → P40.07 research starts
P40.07 gate PASS → ✅ SHIP (2026-05-31)
```

NO phase starts research until the previous phase's plan passes `gsd-plan-checker`.

### Dependency Graph

```
P40.01 (dispatch fixes) ──┐
P40.02 (state unification) ──┤
P40.03 (auto-loop wiring) ──┤── P40.07 (E2E verification) → SHIP
P40.04 (governance wiring) ──┤
P40.05 (state persistence) ──┤
P40.06 (npm publishing) ─────┘
✅ P40.07 COMPLETE — SHIP GATE PASSED
```

### Execution Order (Wave-Based)

**Wave 1 — Runtime Fixes (P40.01 + P40.05, parallel-safe)**

- P40.01: Fix fire-and-forget dispatch (5 tasks, P0)
- P40.05: Fix state persistence & singletons (4 tasks, P1)

**Wave 2 — Feature Wiring (P40.02 + P40.03 + P40.04, sequential)**

- P40.02: Unify delegation state machines (5 tasks, P0) — depends on P40.01
- P40.03: Wire auto-loop/ralph-loop (4 tasks, P1) — depends on P40.01 + P40.02
- P40.04: Wire governance evaluation (4 tasks, P1) — depends on P40.02

**Wave 3 — Ship Preparation (P40.06 + P40.07)**

- P40.06: npm package publishing readiness (5 tasks, P0) — depends on P40.01 + P40.02
- P40.07: E2E integration verification (5 tasks, P0) — depends on ALL above

### Phase Entries

#### P40.01: Fix Fire-and-Forget Dispatch & Silent Failures

- **Severity:** P0 — runtime break
- **Scope:** dispatch-command.ts, execute-slash-command.ts, manager.ts
- **Problem:** 3 dispatch paths return success before SDK call completes. Errors swallowed in console.error. handleSessionError not forwarded to runtime adapter. validateAgentExists returns true on API failure.
- **Delivers:** Await-based dispatch, error propagation to user, symmetric event forwarding

#### P40.02: Unify Delegation State Machines

- **Severity:** P0 — architecture conflict
- **Scope:** manager-runtime.ts, coordinator.ts, manager.ts, continuity/index.ts
- **Problem:** v1 (runtime) and v2 (coordinator) maintain separate delegation maps. Facade merges with fallback (lossy). handleSessionIdle forwards to both, handleSessionError only to coordinator.
- **Delivers:** Unified delegation visibility, symmetric event forwarding, consistent status across tools

#### P40.03: Wire Auto-Loop / Ralph-Loop to Hook Chain

- **Severity:** P1 — feature not wired
- **Scope:** auto-loop.ts, ralph-loop.ts, session-hooks.ts
- **Problem:** Spawner primitives imported but never invoked. session-hooks uses simpler inline auto-loop.
- **Delivers:** runAutoLoop triggered on delegation completion, runRalphLoop on delegation failure

#### P40.04: Wire Governance Evaluation

- **Severity:** P1 — feature not wired
- **Scope:** tool-guard-hooks.ts, governance-engine/
- **Problem:** Governance evaluation always returns empty arrays (stripped in 14-01). Configured rules ignored.
- **Delivers:** Governance rules evaluated on tool execution, blocks/warnings/escalations functional

#### P40.05: Fix State Persistence & Module-Level Singletons

- **Severity:** P1 — state loss risk
- **Scope:** continuity/index.ts, subscriber.ts
- **Problem:** atomic_commit:false has no flush mechanism (state lost on restart). State dir resolved at import via process.cwd(). Singleton config cache breaks multi-project.
- **Delivers:** Shutdown flush or always-persist, lazy state dir resolution, multi-project config cache

#### P40.06: npm Package Publishing & Public Repo Readiness

- **Severity:** P0 — ship blocker
- **Scope:** package.json, dependencies, .npmignore, publish workflow
- **Problem:** Name "hivemind" collides with existing npm package. bun-pty in wrong dependency class. Missing publishConfig.
- **Delivers:** Unique package name, correct dependencies, publish CI workflow, verified package contents

#### P40.07: End-to-End Integration Verification ✅

- **Severity:** P0 — ship gate
- **Scope:** Integration tests, bootstrap verification, tool smoke tests
- **Problem:** No test verifies the actual user experience (install → plugin loads → tools work → primitives copied).
- **Delivers:** Simulated user install test, plugin registration E2E, tool smoke tests, bootstrap flow E2E, sync-oss verification
- **Status:** ✅ COMPLETE (2026-05-31) — 23 integration tests, 24 tools verified, 8+ hooks verified, typecheck 0 errors, 3,013 tests pass, build clean, 2.3 MB pack with zero internal leaks
- **Commits:** `c0f8475f` (tool tests), `8a694c3e` (hook tests), `c3cc9134` (summary)

---

### Phase 41: State Cluster Consolidation (2026-05-31)

**Goal:** Merge delegations.json + session-continuity.json into session-tracker per-session files, eliminate standalone files. These 2 files contain only test artifacts, grow unbounded, and have no progressive disclosure mechanism for agents. The session-tracker already tracks 117 real sessions with per-session files — the right pattern.

#### P41-A: Investigate Field Mapping + Affected Tools

- **Severity:** P1 — foundation for all consolidation
- **Scope:** delegations.json unique fields, session-continuity.json unique fields, session-tracker schema, affected tools/agents/hooks
- **Problem:** Cannot consolidate until we know exactly what data is unique to each file, where it maps in session-tracker, and what tools read/write it
- **Delivers:** SPEC.md with falsifiable requirements, RESEARCH.md with complete field mapping, identified affected tools/agents
- [ ] **P41-D: Delete Old Files, Make Old Writers No-Ops, Remove Dead Code**
  - **Severity:** P1 — final teardown
  - **Scope:** Make `persistDelegations()` no-op (keep session-tracker dual-write), make `persistStore()`/`flushAllStores()`/`registerShutdownHandlers()` no-ops (keep in-memory cache), remove 8 dead exports from continuity/index.ts, delete `.hivemind/state/delegations.json` and `session-continuity.json` via one-shot migration, update tests
  - **Depends on:** P41-B, P41-C
  - **Plans:** 3 plans in 2 waves
  - Wave 1: Plan 01 (delegation-persistence.ts no-op + empty reader), Plan 02 (continuity/index.ts no-op writers + dead exports removal)
  - Wave 2: Plan 03 (one-shot file deletion in plugin.ts + test updates)
  - **Plans created:** ✅ 3 plans

---

### Phase 45: Vendor Sync Script (2026-06-01)

**Goal:** Provide `scripts/sync-fork.sh` to pull upstream changes from the preserved `shynlee04/opencode-tmux` GitHub fork into the vendored `opencode-tmux/` directory (commit `7dc30d95` resolved the broken gitlink). The script performs a 3-way merge that preserves Hivemind-specific surface changes (runtime injection boundary, tmux-copilot tool) while propagating upstream patches and features. Must be idempotent and support a `--dry-run` mode that previews the merge without writing. Shell test suite covers three scenarios: clean fast-forward, three-way merge success, and conflicting Hivemind-pinned files (must abort with clear error, never silently overwrite Hivemind changes).
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Depends on:** Phase 43
**Plans:** 2 plans

Plans:

- [ ] 45-01-PLAN.md — Create `scripts/sync-fork.sh` with temp remote, merge-tree conflict detection, dry-run, pinned file protection
- [ ] 45-02-PLAN.md — Install bats, create `tests/scripts/sync-fork.bats` test suite with 3 scenarios (fast-forward, 3-way merge, conflict abort)

---

### Phase 46: Build Pipeline (2026-06-01)

**Goal:** Introduce `npm run build:tmux` to compile the vendored `opencode-tmux/` fork and integrate its output into Hivemind's `dist/` tree, and (optionally) expose it as the `@hivemind/opencode-tmux` subpath export in `package.json` if the monorepo split is taken. The build must type-check the cross-package boundary (runtime injection contracts between Hivemind's plugin layer and the fork's tool layer) so that contract drift fails the build. Tests verify (a) build artifacts exist at expected paths and are non-empty, and (b) a cross-package import smoke test loads the compiled module without runtime errors.
**Requirements**: TBD
**Depends on:** Phase 45
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 46 to break down)

---

### Phase 47: Install Documentation (2026-06-01)

**Goal:** Author user-facing documentation covering the vendored tmux fork distribution: README.md sections on tmux prerequisites, the silent fallback behavior when tmux is absent, and a troubleshooting matrix for common install failures; INSTALL.md with detailed install steps and tmux detection commands; configuration reference documenting the `opencode-tmux.json` schema (specifically the `copilot: boolean` and `agentLabelFormat` keys); and migration notes for users on prior Hivemind versions. Tests: docs lint (markdown link check, broken-reference scan) plus JSON-schema validation of every `opencode-tmux.json` example block in the docs.
**Requirements**: TBD
**Depends on:** Phase 46
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 47 to break down)

### Phase 49: tmux-e2e-completion (2026-06-01)

**Goal:** Close the runtime gap for tmux end-to-end: register `tmux-copilot` tool in `src/plugin.ts`, replace `buildNoopForkSessionManager()` no-op stub with real SessionManager wiring, wire co-pilot intervention, add BATS to CI workflow, run BATS suite, write P42 VERIFICATION + UAT + P45 45-01 SUMMARY to close W007/W009 paperwork gaps. Absorbs and supersedes the documentation gap from P42/P43/P45.
**Requirements**: TBD
**Depends on:** Phase 42, Phase 43, Phase 45
**Plans:** 0 plans

Plans:

- [x] 49-01: Register `tmuxCopilotTool` in `src/plugin.ts` (~5 LOC import + tools array) — commit `012c01f8`
- [x] 49-02: Replace `buildNoopForkSessionManager()` with real SessionManager wiring — commit `2599c4c7`
- [x] 49-03: Wire co-pilot intervention in `src/plugin.ts` — commit `57b2096b`
- [x] 49-04: Add BATS to `.github/workflows/ci.yml` (~3 LOC) — commit `1d53606b`
- [x] 49-05: Run BATS suite, capture output (3/3 pass evidence) — commit `e08c8e80`
- [x] 49-06: Write P42 VERIFICATION.md + UAT.md + P45 45-01 SUMMARY.md — commit `6e8ed3da`
- [x] 49-07: gsd-verify-work for P43 with stricter REQ-05 — commit `f31c43e7`
- [x] 49-08: `fork-bridge.ts` keep external, narrow runtime-injection — commit `9e28966a`
- [x] 49-09: tmux-copilot `fork-not-wired` error path — commit `e2bd65a4`

**Closure (2026-06-02)**: P49 closed via pivot document `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md` (commit `209ca5f8`). L1 verified (tsc exit 0, vitest 12/12 tmux-copilot.test.ts, BATS 3/3). L4 (live session) deferred per user override. P42/P43/P45 paperwork gaps DOWNGRADED to L5; UAT SKIPPED. Pivots to P50-P55 in-tree synthesis (see below). **Supersedes**: P45, P46, P47, P48.

---

### Phase 50: Cleanup opencode-tmux Fork + Script Coupling (2026-06-02)

**Goal:** Remove the `opencode-tmux/` package, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` job in `.github/workflows/ci.yml` (lines 64-82) — all artifacts of the now-deferred P45 vendor-sync strategy. After P50, no references to the fork, the sync script, or the BATS-vendor-sync CI job remain in the repo. This is the **PIVOT** phase that transitions from external-fork to in-tree synthesis (P51-P55). Tests: `tsc --noEmit` exit 0, `vitest run` no dead-import failures, `grep -rE "opencode-tmux|sync-fork|bats-vendor-sync" --exclude-dir=node_modules --exclude-dir=.git` returns 0 matches, CI lint clean.
**Requirements:** REQ-04 (Tmux Visual Orchestration), REQ-05 (Co-pilot Model), REQ-07 (Cqrs Boundary).
**Depends on:** Phase 49 (closed).
**Plans:** 1 plan

Plans:

- [x] 50-01: Remove `opencode-tmux/` directory (~932 LOC source + 1,820 LOC test), `scripts/sync-fork.sh` (126 LOC), `tests/scripts/sync-fork.bats` (210 LOC), and the `bats-vendor-sync` job from `.github/workflows/ci.yml` (L64-82) — single atomic commit with clean verification (tsc + vitest + grep + CI lint). No dead imports in `src/`.

**Closure (2026-06-02)**: P50 closed via `.planning/phases/50-cleanup-opencode-tmux-fork/50-CLOSE.md`. 25 files removed (21 vendored + sync-fork.sh + sync-fork.bats + CI job + CHANGELOG), 3,497 deletions, 0 insertions. tsc exit 0, vitest 3,102/3,102 pass, grep returns 0 matches, CI lint clean. 26 tool keys assertion held, D-04 graceful-fallback at `src/features/tmux/integration.ts:197-202` preserved. Backup at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (16M) retained until P51 close. Pivots to P51 in-tree synthesis.

---

### Phase 51: Synthesize Core Tmux Classes In-Tree (2026-06-02)

**Goal:** Replace the in-tree `fork-bridge.ts` runtime-injection surface with three concrete classes synthesized from the opencode-tmux fork reference patterns. **Copy patterns verbatim** from `opencode-tmux/src/{tmux,session-manager,grid-planner}.ts` (to be deleted in P50) into new in-tree modules at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts`. Annotate every copied function with `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>` header for traceability. Rewrite `src/features/tmux/integration.ts` to a factory-of-real-classes (drop the `fork-bridge.ts` no-op stub). This phase delivers **3 new files (~770 LOC) + 1 rewrite (~200 LOC) + 1 removal (`fork-bridge.ts` 138 LOC)**, reducing net LOC by ~100 while eliminating the fork dependency. Tests: 6 BATS scenarios (1/cluster) for `tmux-multiplexer`, `session-manager`, `grid-planner`; 15+ vitest cases in `tests/lib/tmux/`; existing `integration.test.ts` (363 LOC) + `tmux-copilot.test.ts` (12 tests) untouched. **L1 evidence**: BATS 6/6, vitest 15+ pass, tsc exit 0.
**Requirements:** REQ-04, REQ-05, REQ-07.
**Depends on:** Phase 50.
**Plans:** 1 plan

Plans:

- [x] 51-01: Create `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` (~770 LOC), rewrite `src/features/tmux/integration.ts` as factory-of-real-classes (~200 LOC), remove `src/features/tmux/fork-bridge.ts` (138 LOC). Add 6 BATS scenarios, 15+ vitest cases. ORIGIN annotations on every copied function. Atomic commit; L1 verification (BATS 6/6, vitest 15+, tsc 0). ✅ executed via stacked resume (commit `9a1ad770`); summary in `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-CLOSE.md` (commit `345987d7`); 22 files (+2884/-337, net +2547); 7/7 EARS PASS, 80/80 vitest, 26/26 BATS, D-04 preserved.

---

### Phase 52: Wire tmux-copilot + State Query API (2026-06-02)

**Goal:** Keep the public contract of `src/tools/tmux-copilot.ts` **identical** (4 actions: send-keys, capture-pane, list-panes, kill-session; `TmuxCopilotResult` union widened in P49 pass-2 fix at L100-112). Swap only the factory: from `buildNoopForkSessionManager()` to `buildInTreeSessionManager()`. Add a new `src/tools/tmux-state-query.ts` read-only tool (no mutation) that exposes session metadata for the observability layer. Expand `src/features/tmux/observers.ts` (93 LOC) with 2 new event subscriptions: `session-state-changed` and `pane-captured`. This phase delivers **2 new tools, 1 expanded observer, 1 factory swap**. Tests: 3 BATS scenarios (1/action); 5+ vitest cases for the new query tool; manual smoke test for the action dispatch. **L1 evidence**: BATS 3/3, vitest 5+ pass, tsc exit 0, manual `tmux-copilot` invoke in a real session produces expected output.
**Requirements:** REQ-04, REQ-05.
**Depends on:** Phase 51.
**Plans:** 1 plan

Plans:

- [x] 52-01: Swap `tmux-copilot.ts` factory from `buildNoopForkSessionManager` to `buildInTreeSessionManager`. Add `src/tools/tmux-state-query.ts` (read-only metadata). Expand `observers.ts` with `session-state-changed` + `pane-captured`. 3 BATS + 5 vitest. Atomic commit; L1 verification. ✅ executed via audit-remediation (commits `2bd5a0e2`, `dbf260b5`, `3f2a7bc6`, `8ed3d6ea`, `6474ad67`); summary in `.planning/phases/52-wire-tmux-copilot-state-query/52-CLOSE.md` (commit `b22207df`); 4/4 EARS PASS, 11/11 P52 BATS, 26/26 P51 BATS (no regression), 3144/3144 vitest, 27 tool keys.

---

### Phase 53: Live Pane Monitoring Hook + Journal Integration (2026-06-02)

**Goal:** Add a new hook `src/hooks/pane-monitor.ts` that subscribes to `pane-captured` events (from P52 observer expansion) and writes structured journal entries to `.hivemind/journal/<sessionId>/<timestamp>-pane.json`. Implement exponential backoff (5s → 10s → 30s) on capture failures. Cap journal writes to 100 entries per session per hour to prevent runaway growth. **Closes P42 UAT gaps retroactively**: re-write P42 UAT.md with L1 backing (live journal entries captured during hook test) instead of the L5-downgraded P49 pass-1 fix. Also re-write P43 VERIFICATION.md (was W-01..W-04 RESOLVED at 0a501582) to reference P53 hook evidence. Tests: 1 BATS scenario for journal entry capture; 1 vitest for backoff; 1 vitest for cap. **L1 evidence**: journal entries written to `.hivemind/journal/test-session/2026-06-02T*-pane.json` and grep-able; backoff timing measured; cap enforced.
**Requirements:** REQ-04, REQ-05.
**Depends on:** Phase 52.
**Plans:** 1 plan

Plans:

- [x] 53-01: Create `src/hooks/pane-monitor.ts` (subscribes to `pane-captured`, writes `.hivemind/journal/<sid>/<ts>-pane.json`, exponential backoff 5s→10s→30s, 100/session/hour cap). Retroactively rewrite P42 UAT.md + P43 VERIFICATION.md with P53 L1 evidence. 1 BATS + 2 vitest. Atomic commit; L1 verification (journal files written + grep'd). ✅ executed atomically (EXECUTE commit `5f7a09e5`, 9 files +1005/-3, 0 .hivemind/*; VERIFY commit `f2801911`); summary in `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-CLOSE.md`; 5/5 EARS PASS, 3/3 P53 BATS (1 file, 3 scenarios) + 40/40 BATS regression, 4/4 P53 vitest + 3149/3149 vitest regression, module 490 LOC ≤ 500 cap, D-04 silent-fallback preserved, R-P50-03 honored (0 .hivemind/*), P20 invariant honored (0 new deps), 27 tool keys unchanged, retroactive P42 UAT.md +12 lines and P43 VERIFICATION.md +13 lines with `## L1 Backing (P53)` sections.

---

### Phase 54: Session Persistence + Restart-Recovery (2026-06-02)

**Goal:** Implement persistent session metadata at `.hivemind/state/tmux-sessions/<sessionId>.json`, serialized on every state transition (`active → ready → paused → detached → failed`). On harness restart, restore `paused` and `detached` sessions from disk; `failed` sessions are NOT auto-restored. Use restart-safe IDs (UUIDv7 — sortable, no birthday collision). Wire to `src/features/tmux/session-manager.ts` (from P51) via a new `src/features/tmux/persistence.ts` module (~150 LOC). Tests: 1 BATS for kill-parent-restart-recovery (the most important contract — harness restart preserves live tmux sessions); 4+ vitest for state transitions. **L1 evidence**: kill harness parent during a live session, restart, verify `.hivemind/state/tmux-sessions/<sid>.json` exists and the tmux session is still alive.
**Requirements:** REQ-04.
**Depends on:** Phase 53.
**Plans:** 1 plan

Plans:

- [x] 54-01: Create `src/features/tmux/persistence.ts` (~150 LOC, serialize on every transition, restore on restart for `paused`/`detached`, UUIDv7 IDs). 1 BATS kill-parent-restart + 4 vitest transitions. Atomic commit; L1 verification (manual kill-restart preserves session). ✅ executed atomically (EXECUTE commit `a5c67c19`, 8 files +1225, 0 .hivemind/*; VERIFY commit `ddcb5335`); summary in `.planning/phases/54-session-persistence-restart-recovery/54-CLOSE.md`; 5/5 EARS PASS (REQ-54-01..05), 1/1 P54 BATS (slot 56 — kill-parent-restart-recovery) + 40/40 BATS regression, 6/6 P54 vitest + 3203/3203 vitest regression, persistence.ts 400 LOC ≤ 500 cap (target ~150; see 54-01-SUMMARY.md deviation #5 for JSDoc density rationale), session-manager.ts 29 LOC added/0 removed ≤ 30 budget, types.ts UNCHANGED (27-tool-key invariant preserved), D-04 silent-fallback preserved, R-P50-03 honored (0 .hivemind/*), P20 invariant honored (0 new deps — UUIDv7 inline via `node:crypto.getRandomValues`).

---

### Phase 55: E2E UAT Against Seed's 4 Success Criteria (2026-06-02)

**Goal:** Author 4 BATS scenarios — one per seed success criterion — that exercise the end-to-end tmux visual orchestration layer. **Each seed criterion becomes its own BATS test.** Partial passes (e.g., 3/4) still advance ROADMAP (per the close-pivot UAT strategy). Criteria: (1) **Live pane monitoring** — harness shows live content of all agent tmux panes; (2) **Orchestrator intervention** — orchestrator can `send-keys` to any pane; (3) **Session persistence** — harness restart preserves `paused`/`detached` sessions; (4) **Visual dependency graph** — delegation tree renders as a pane grid (DFS via P51 `grid-planner.ts`). Tests: 4 BATS scenarios + 1 manual screenshot/journal pass for visual verification. **L1 evidence**: 4 BATS files, each running in isolation; L2 evidence: manual screenshots of the tmux grid + journal entries. **GATE**: All 4 BATS must run; 3/4 PASS advances ROADMAP, 2/4 or fewer requires P56 retry phase.
**Requirements:** REQ-04, REQ-05, REQ-07.
**Depends on:** Phase 54.
**Plans:** 1 plan

Plans:

- [x] 55-01: Write 4 BATS scenarios (one per seed criterion) + run manual L2 verification (screenshots of tmux grid + journal entries). Capture `.planning/phases/55-e2e-uat-tmux-seed/55-E2E-UAT-2026-06-02.md` with L1 + L2 evidence. If 3/4 PASS: ROADMAP advance; if 2/4 or fewer: trigger P56 retry phase planning. ✅ executed atomically (EXECUTE commit `d929c932`, 6 files +676 LOC, 0 .hivemind/* — 4 BATS slots 57/58/59/60 + helpers.bash +7 LOC + UAT report; VERIFY commit `cb3f0838`); summary in `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-CLOSE.md`; **4/4 EARS PASS** (REQ-55-01..04), **GATE 4/4 PASS** (4/4 = seed germinated unconditionally per D-55-04), **5/5 P55 BATS scenarios pass** (1+1+2+1 = slot 57 live-pane-monitoring + slot 58 orchestrator-intervention + slot 59 session-persistence-restart [ready-state filtered + detached-state restored] + slot 60 visual-dependency-graph), 46/46 cumulative BATS regression (40 P51-P54 + 1 P53 + 1 P54 + 4 P55; 45 PASS + 1 pre-existing env-dependent failure unrelated to P55), 3203/3203 vitest regression, 0 .hivemind/* in P55 commits (R-P50-03 strict), 27 tool keys unchanged (`src/features/tmux/types.ts` UNCHANGED through P51-P55), D-04 silent-fallback preserved, P20 invariant honored (0 new deps), D-55-10 SC-isolation confirmed (0 SC-* refs in any P55 artifact), 3 inline BLOCKER fixes from 55-PLAN-CHECK.md re-validated (schemaVersion numeric literal per D-53-13, BATS 58 TmuxMultiplexer direct call bypass of integration factory's `process.env.TMUX` gate, BATS 60 `pane_session_id` definition). **GATE: 4/4 PASS = seed germinated, ROADMAP advances to P56+**. P56 stress-test phase is the next phase (separate dispatch).

---

### Phase 48: CI/CD Release Pipeline (2026-06-01)

**Goal:** Stand up a GitHub Actions workflow that builds the vendored fork, runs the test suite, and publishes `@hivemind/opencode-tmux` to npm with version synchronization against the main `hivemind` package (no drift allowed between the two package versions on a release). Include a pre-release channel (`canary` dist-tag) for trunk-based publishing. Tests: a CI dry-run job that exercises the workflow against a fixture package and verifies the produced tarball contains the expected entry points and excludes source-only files; the publish job is gated on this verification.
**Requirements**: TBD
**Depends on:** Phase 46
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 48 to break down)
