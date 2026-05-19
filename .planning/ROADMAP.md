<!-- generated-by: gsd-doc-writer -->
# Hivemind — Roadmap

**Created:** 2026-05-07  
**Status:** Active  
**Dependency order:** Phase 0 Governance Baseline → Bootstrap/Init CLI → Shell/PTY Control-Plane Runway (CP-PTY-00..04) → Meta-Concept Migration → Routing Foundation → Agent Workflows → User Experience

---

## Phase 0 — Governance Baseline (Blocking Entry Gate)

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

- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
- `.planning/config/hivemind-config-contract-2026-05-07.md`
- `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md`
- `.planning/checklists/phase-0-governance-gate-2026-05-07.md`
- `.planning/roadmap/phase-0-gsd-route-2026-05-07.md`

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

The session tracker replaces the broken event-tracker (`src/task-management/journal/event-tracker/`) with a new `src/features/session-tracker/` module that captures session lifecycle, messages, tool calls, and delegation hierarchies into structured `.hivemind/session-tracker/` artifacts. Uses OpenCode SDK v2 hooks (`chat.message`, `tool.execute.after`, `event`, `experimental.session.compacting`). Fixes 12 catalogued flaws (F1-F12) from `.hivemind/audit/flaw-register-2026-05-10.json`.

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
| CP-DT-01 | **Delegate-Task Ecosystem Revamp** | RE-OPENED / RUNTIME BLOCKED — forensic report `report-20260518-105705.md` disproved the `context.task` runtime seam; Plans 01-05 remain historical implementation artifacts requiring gap remediation | CP-ST-06 (session-tracker tracking knowledge), CP-PTY-00 (shell/PTY context) | L5: SPEC + CONTEXT + RESEARCH + PATTERN exist; L2-L3 tests exist but mock/injected native Task evidence is not L1 proof; L1 smoke UAT is blocking before completion |

**Plans:**
- [x] CP-DT-01-01-PLAN.md — Wave 1: Foundation modules (dispatcher, slot-manager, agent-resolver, monitor, escalation-timer, notification-router, lifecycle, retry-handler) ✅ executed; summary `CP-DT-01-01-SUMMARY.md`; tests 22/22 pass; typecheck clean
- [x] CP-DT-01-02-PLAN.md — Wave 2: Coordinator wiring + CompletionDetector v2 dual-signal ✅ executed; summary `CP-DT-01-02-SUMMARY.md`; focused tests 13/13 pass; completion regression 36/36 pass; typecheck clean
- [x] CP-DT-01-03-PLAN.md — Wave 3: Tool layer rewrite (delegate-task v2 + delegation-status v2 + Zod schemas) ✅ executed; summary `CP-DT-01-03-SUMMARY.md`; v2 tool tests 20/20 pass; legacy tool regression 51/51 pass; typecheck clean
- [x] CP-DT-01-04-PLAN.md — Wave 4: manager.ts decomposition + auto-loop + ralph-loop + chaining ✅ executed; summary `CP-DT-01-04-SUMMARY.md`; focused tests 13/13 pass; delegation regression 32/32 pass; session-tracker regression 426/426 pass; typecheck clean
- [x] CP-DT-01-05-PLAN.md — Wave 5: Plugin wiring + integration tests + regression check + JSDoc audit ✅ executed; summary `CP-DT-01-05-SUMMARY.md`; focused integration/e2e tests 18/18 pass; delegation/tool regression 112/112 pass; session-tracker regression 426/426 pass; typecheck clean
- [ ] CP-DT-01-06-RUNTIME-GAPS-2026-05-18-PLAN.md — Wave 6: Runtime-truth gap closure. Correct docs/spec/gates first, then remediate Plans 01-05 in order so no code path depends on false `context.task` runtime seam.

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

OMO-inspired `src/` reorganization to transform scattered `src/lib/` (56 entries) into organized planes following OMO naming conventions (kebab-case everywhere), feature-module pattern (index.ts, types.ts, AGENTS.md per module), colocated tests, barrel exports, and hierarchical AGENTS.md guidance. Plan: `.planning/architecture/structure-restructuring-plan-2026-05-08.md`

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

---

## Managed Autonomous Loop

Execution now follows the managed autonomous loop described in `.planning/roadmap/managed-autonomous-loop-2026-05-07.md`.

Rules:

- Only one workflow cycle may run per user authorization.
- Each cycle must have an entry gate, plan gate, execution gate, review gate, and exit gate.
- Broad autonomy is blocked until bootstrap recovery, config-to-behavior wiring, f-04 routing, hierarchy enforcement, and E2E proof are complete.
- Cycle 1 — Lifecycle Alignment: ✅ COMPLETE (O3 docs + sector AGENTS.md + config cleanup)
- Current authorized cycle: **Cycle 2 — Bootstrap Recovery** (Phase 0 gate PASSED, BOOT-02 through BOOT-07 complete; BOOT-08 and CP-PTY-00 remain before downstream runtime expansion).
- Parallel docs/spec lane: **CP-PTY-00 Shell / PTY Control-Plane Spike** (L5 only; no runtime mutation).
- Current blocking gate: **BOOT-08 Agent + Skill Integration** and **CP-PTY-00 docs/spec spike** before CP-PTY-01..04 or routing expansion.
- MCM continuation pending BOOT-04 symlinks.
- Next recommended cycle: **Cycle 3 — Routing Foundation**.

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
- [ ] 16-04-PLAN.md (Wave 1) — session-hierarchy.ts: get-manifest action
- [ ] 16-05-PLAN.md (Wave 1) — hivemind-session-view.ts (new tool) + plugin.ts registration
- [ ] 16-06-PLAN.md (Wave 2) — Event-tracker deprecation: scan + update skill reference
- [ ] 16-07-PLAN.md (Wave 2) — hivemind-power-on skill: full rewrite + 6 reference files

---
*Last updated: 2026-05-20 — Phase 15 planned: 5 plans, 3 waves, 6 requirements, 8 gaps | Phase 16 planned: 7 plans, 3 waves, 8 requirements*
