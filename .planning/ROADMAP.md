# HiveMind V3 — Roadmap

**Created:** 2026-05-07  
**Status:** Active  
**Dependency order:** Core Architecture → Agent Workflows → User Experience (per D-WS-03)

---

## Active Workstream: Core Architecture (WS-CA)

| Phase | Title | Status | Depends On |
|-------|-------|--------|------------|
| CA-01 | configs.json Schema + Runtime Binding | ✅ DELIVERED | — |
| CA-02 | Behavioral Profile System + Mode Dispatch | ✅ DELIVERED | CA-01 |
| CA-03 | Workflow Toggle Runtime Binding | ✅ DELIVERED | CA-01 |
| CA-04 | **Bootstrap + State Ownership** (restructured) | 🔴 PRIORITY | CA-01, CA-02, CA-03 |

### CA-04 Restructured Scope

Original "CRUD Ownership Modules + Lifecycle Verification" was premature — building plumbing before producers/consumers exist. Restructured to priority-ordered sub-phases:

| Sub-phase | Title | Rationale |
|-----------|-------|-----------|
| CA-04.1 | **Bootstrap CLI + Primitives Recovery** | D-CRUD-01: `npx opencode-harness init` creates `.hivemind/` + `.opencode/` structure. Postinstall restores primitives. Fixes the "delete and lose everything" gap. |
| CA-04.2 | **`conversation_language` Runtime Wiring** | D-BIND-03: Field has zero consumers. Wire into system.transform → messages.transform hooks. Fix the config → behavior gap. |
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
| 3 | **Bootstrap/init CLI** | 🔴 ACTIVE — see BOOT workstream below |
| 4 | Routing workflow foundation | ⬜ PENDING — f-04, blocked until bootstrap complete |
| 5 | Session/task continuity management | ⬜ PENDING — blocked until typed owners + E2E proof |

Gate boundary: docs-only artifacts are L5 evidence. Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists.

---

## Active Workstream: Bootstrap & Init CLI (WS-BOOT)

The Bootstrap CLI is a proper CLI toolbelt — not just `mkdir` + symlink. It provides project initialization, state recovery, primitives restoration, health checking, and rich terminal feedback. The user's `package.json` interpretation adds `commander`, `@clack/prompts`, `ink`/`react`, `@json-render/*`, `gray-matter`, `js-yaml`/`yaml`, `jsonc-parser`, `tree-sitter`, `diff`, `@modelcontextprotocol/sdk`, and `node-pty`/`bun-pty` as the foundational toolbelt.

| Phase | Title | Status | Depends On | Evidence Required |
|-------|-------|--------|------------|-------------------|
| BOOT-01 | Dependency Audit + Architecture | 🔴 ACTIVE | — | L5 research docs |
| BOOT-02 | CLI Framework + Entry Point | ⬜ PENDING | BOOT-01 | L3: `npx opencode-harness --help` works |
| BOOT-03 | State Init (.hivemind/ creation) | ⬜ PENDING | BOOT-02 | L3: `npx opencode-harness init` creates structure |
| BOOT-04 | Primitives Recovery (.opencode/) | ⬜ PENDING | BOOT-02 | L3: symlinks restored from `.hivefiver-meta-builder/` |
| BOOT-05 | Config Bootstrap + Defaults | ⬜ PENDING | BOOT-02 | L3: configs.json initialized with defaults |
| BOOT-06 | Validation + Health Check | ⬜ PENDING | BOOT-03, BOOT-04, BOOT-05 | L2: `npx opencode-harness doctor` PASS |
| BOOT-07 | End-to-End Proof | ⬜ PENDING | BOOT-06 | L1: nuke `.hivemind/` + `init` → all gates pass |

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
- Bin entry: `hivemind-tools` → bootstrap subcommand

### BOOT-03 Scope: State Initialization

- `npx opencode-harness init` creates canonical `.hivemind/` directory tree
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

- `npx opencode-harness doctor` — full health check
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

## Planned Workstreams (Blocked on Core Architecture)

### Agent Workflows (WS-AW)
- WS-4: Auto-commands + Workflow Router (f-04) — **HIGHEST GAP**
- WS-5: Delegation Revamp (f-06 lanes/hierarchy)
- WS-6: Trajectory + Task-Plus (f-07)

### User Experience (WS-UX)
- WS-2: Bootstrap CLI + Onboarding
- WS-7: Context/Compaction Engine
- WS-8: Sidecar + UI (DEFERRED)

---

## Deliverables & Timeline

| Wave | What | Blocks |
|------|------|--------|
| **Wave 1 (NOW)** | BOOT-01 Research + BOOT-02 CLI Framework | Nothing — research first, then build |
| **Wave 2** | BOOT-03 State Init + BOOT-04 Primitives + BOOT-05 Config | Depends on Wave 1 CLI framework |
| **Wave 3** | BOOT-06 Validation + BOOT-07 E2E Proof | Depends on Waves 1-2 |
| **Wave 4** | f-04 Auto-commands + Workflow Router | Depends on BOOT (tools need owners) |
| **Wave 5** | HER-3/4/5 execution | Depends on Wave 4 routing |
| **Wave 6+** | WS-AW + WS-UX workstreams | Depends on Waves 1-5 |

---

## Managed Autonomous Loop

Execution now follows the managed autonomous loop described in `.planning/roadmap/managed-autonomous-loop-2026-05-07.md`.

Rules:

- Only one workflow cycle may run per user authorization.
- Each cycle must have an entry gate, plan gate, execution gate, review gate, and exit gate.
- Broad autonomy is blocked until bootstrap recovery, config-to-behavior wiring, f-04 routing, hierarchy enforcement, and E2E proof are complete.
- Cycle 1 — Lifecycle Alignment: ✅ COMPLETE (O3 docs + sector AGENTS.md + config cleanup)
- Current authorized cycle: **Cycle 2 — Bootstrap Recovery**.
- Next recommended cycle after user approval: **Cycle 3 — Routing Foundation**.

---
*Last updated: 2026-05-07 after full audit + archive + codebase map*
