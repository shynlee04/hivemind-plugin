<!-- generated-by: gsd-doc-writer -->
# Hivemind — Roadmap

**Created:** 2017-05-07  
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

## Cluster-Based Hard Restructuring (Reordered 2026-05-21)

18 phases following owner's 3-group framework: **Group 1 (Orchestration Design Fix) → Group 2 (Routing/Coordination) → Group 3 (Schema/Config) → Group 4 (Structural Cleanup LAST)**. Based on 16 research artifacts (6,621 LOC), 6 deep-analysis cluster reports, production session evidence (16,053 LOC), and phase-reordering analysis (4 critical violations).

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

**Requirements:** REQ-23.2-01 (assistant text extraction), REQ-23.2-02 (compaction summary), REQ-23.2-03 (tool attribution race), REQ-23.2-04 (hierarchy manifest), REQ-23.2-05 (actor field)

**Plans:** 4 plans
- [ ] 23.2-01-PLAN.md — BUG#4 + BUG#5: manifestWriter.addChild() in tool-delegation.ts + subagentType dual-key extraction
- [ ] 23.2-02-PLAN.md — BUG#1: extractTextContent multi-field support in message-capture.ts
- [ ] 23.2-03-PLAN.md — BUG#3 + BUG#4: Tool attribution race fix + manifestWriter.addChild() in event-capture.ts
- [ ] 23.2-04-PLAN.md — BUG#2: Compaction summary fallback via message history

**Depends on:** Phase 23.1 (investigation complete)
**Blocks:** Phase 25 (session-tracker/CP-ST phases)

---

**Goal:** Fix CP-DT-01 runtime block. Decompose DelegationManager god-object (~580 LOC). Consolidate dual in-memory stores. Fix coordinatorRef forward reference.
**Depends on:** Phase 23
**Debts inherited from Phase 23:** C-1 (delegate-task proxy war), M-1 (L0 max skills), M-8 (start-work routing) — see `23-DEBTS-REGISTER-2026-05-23.md`

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

### Phase 24.2: Agent Profile Quality Enforcement (Cluster A — Agent Quality, INSERTED)

**Goal:** Rewrite ALL hm-* agents with proper execution flows, success metrics, input/output contracts, artifact delivery templates, and anti-pattern sections. Enforce quality gate per agent profile.

**Why this exists:** Phase 24.1 restructures hierarchy; Phase 24.2 fills the content gap. Most hm-* agents lack execution protocols, success criteria, and behavioral contracts — producing unpredictable subagent behavior.

**Depends on:** Phase 24.1
**Blocks:** P24.3, P24.4, P24.5, P24.6

**Success Criteria:**
1. Every hm-* agent (45 agents) has documented execution flow (≥150 lines minimum)
2. Every hm-* agent declares success metrics and artifact delivery contract
3. Every hm-* agent has anti-patterns section
4. Quality gate (lifecycle → spec → evidence) passes for agent profile batch
5. Zero agents below minimum line threshold

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

### Phase 24.3.1: Governance Session Prototype (Cluster C — Commands & Workflows, MỚI)

**Goal:** Build a prototype custom tool `create-governance-session` that validates the technical feasibility of OpenCode SDK session creation + TUI injection + named session handoff before full Commands Infrastructure investment.

**Why this exists:** OpenCode SDK provides `sdk.session.create()`, `sdk.session.prompt()`, `sdk.tui.appendPrompt()`, `sdk.tui.showToast()` — but these APIs have not been tested in Hivemind's context. This prototype verifies: (1) Session auto-naming works with explicit title + parentID, (2) TUI injection displays correctly in OpenCode message stream, (3) Git commit flow before handoff is feasible. Without this validation, P24.3 risks building infrastructure on unverified SDK assumptions.

**Plans:** 3 plans in 3 waves — ✅ ALL COMPLETE
- [x] 24.3.1-01-PLAN.md — Wave 1: Create governance engine directory + tool implementation (Zod schema, SDK session creation, prompt injection, TUI toast, git commit) ✅ `0287eb10`, `6f28296f`, `98ea6b80`
- [x] 24.3.1-02-PLAN.md — Wave 2: Register tool in plugin.ts + unit tests with mocked SDK calls ✅ `b0f1b087`, `f4057c82`
- [x] 24.3.1-03-PLAN.md — Wave 3: Full verification — typecheck, test suite, regression check, grep evidence ✅ `56228b96`

**Scope:**
1. Create custom tool `create-governance-session` that:
   - Creates a new OpenCode session via `sdk.session.create()` with explicit title naming
   - Injects TUI notification via `sdk.tui.showToast()` + `sdk.tui.appendPrompt()`
   - Auto-names session with format: `hm-governance:<workflow>-<context>`
   - Git-commits current context before handoff
   - Outputs user instruction: "chuyển tới session 'name, meta, ses_id' để hoàn thành..."
2. L2-L3 evidence: prototype with working SDK calls
3. Verdict: PASS/FAIL for Commands Infrastructure SDK path

**Depends on:** Phase 24
**Blocks:** P24.3 (validates technical feasibility of Command Infrastructure SDK path), P24.4, P24.5, P24.6

**Success Criteria:**
1. `create-governance-session` tool registers in plugin.ts without conflicts
2. Tool creates OpenCode session with formatted name `hm-governance:<workflow>-<context>` and parentID linkage
3. TUI notification (`showToast` + `appendPrompt`) displays in main session message stream
4. Git commit of current context executes before handoff instruction
5. User receives actionable handoff text: "chuyển tới session 'name, meta, ses_id' để hoàn thành..."

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

### Phase 25: Trajectory + Agent-Work-Contract Redesign (Group 1 — was Phase 24)

**Goal:** Fix trajectory state transitions. Add trajectory tests (zero currently). Fix agent-work-contract lifecycle. Deduplicate deriveSurface(). Incorporate P23-06 assessment findings.
**Depends on:** Phase 23, 24, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6
**Debts inherited from Phase 23:** M-4 (legacy .harness/ path) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 26: Pressure + Notification Redesign (Group 1 — was Phase 25)

**Goal:** Fix pressure scoring (zero tests, 625 LOC). Fix authority-matrix overlap. Complete notification delivery redesign (TTL + retry + delivery tracking + injection plane patterns from P23-07). Fix SDK handler race.
**Depends on:** Phase 23, 24, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 25

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

### Phase 27: Routing + Intent Loop Foundation (Group 2 — was Phase 26, SCOPE EXPANDED)

**Goal:** Fix intent-classifier (fragile substring). Remove dead registry validator. Delete dead no-op profile methods. Add tests for 3 sub-modules (~1,200 LOC untested). **Expanded scope:** Implement namespace meta-skills (two-stage routing) and workflow separation pattern inspired by GSD research.

**Why scope expanded:** GSD deep research (Phase 23, P23-S01) revealed two patterns critical for routing reliability: (1) namespace meta-skills that enable two-stage routing (classify → route) instead of single-pass fragile substring matching, and (2) workflow separation pattern that decouples routing from execution. These address M-3 (conductor domain mismatch) and M-7 (context-mapper underspecified) by providing a structured routing framework.

**Depends on:** Phase 21-P26.2, P24.7, P24.8, P24.9
**Debts inherited from Phase 23:** M-3 (conductor domain mismatch), M-7 (context-mapper underspecified) — see `23-DEBTS-REGISTER-2026-05-23.md`

### Phase 28: Hook Injection Plane Redesign (Group 2 — was Phase 27, SCOPE EXPANDED)

**Goal:** Fix CQRS violation in tool-after-workflow. Enforce assertHookWriteBoundary. Type hook signatures. Classify silent vs required (incorporate P23-07 delivery patterns). Inline thin observers. **Expanded scope:** Implement workflow size budget enforcement and command inventory drift-guard.

**Why scope expanded:** GSD research identified two unaddressed risks: (1) workflow size budget enforcement prevents bloated workflows from degrading hook injection performance, and (2) command inventory drift-guard detects when registered commands drift from their on-disk definitions — preventing the silent mismatch between `.opencode/commands/` and the command engine's internal registry.
**Depends on:** Phase 27

### Phase 29: Auto-Looping + PTY + Background Command Revamp (Group 2 — was Phase 28)

**Goal:** Fix auto-loop session-tracker dependency. Replace ralph-loop with practical verification patterns (per P23-04 rewrite). Wire into routing pipeline. Delete dead prompt-packet (348 LOC).
**Depends on:** Phase 28
**Debts inherited from Phase 23:** H-5 (external scripts), M-11 (gate dependencies) — see `23-DEBTS-REGISTER-2026-05-23.md`

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

## Managed Autonomous Loop — Cycle 3: Cluster-Based Restructuring

**Current authorized cycle: Cycle 3 — Cluster-Based Restructuring** (Phases 21-38)
- Entry gate: Phase 20 COMPLETE (2026-05-21)
- 18 phases across 4 groups: Group 1 (design fix FIRST) → Group 2 → Group 3 → Group 4 (structural cleanup LAST)
- Non-destructive foundation sweep (P00.5) precedes Group 1

**Previous cycles:**
- **Cycle 1 — Lifecycle Alignment:** ✅ COMPLETE (O3 docs + sector AGENTS.md + config cleanup)
- **Cycle 2 — Bootstrap Recovery:** ✅ COMPLETE (BOOT-02 through BOOT-07, Phase 15-20 delivered)

**Completed phases summary (11-20):**
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
