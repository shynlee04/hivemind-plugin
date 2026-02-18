# HiveMind Master Plan — Consolidated v3.0

**Branch:** `dev-v3`
**Created:** 2026-02-14
**Status:** ACTIVE
**Source Documents:** AGENT_RULES.md, .planning/ROADMAP.md, strategic-plan-v3-remediation.md, 10-commandments.md

---

## Executive Summary

This document consolidates all planning artifacts into a unified execution roadmap. It addresses:
- **Phase A (Critical):** Bug fixes for data flow gaps (`export_cycle`, `declare_intent`, stale auto-archive)
- **Phase B-D (Roadmap):** TUI Engine Room development with OpenTUI + Drizzle
- **Architecture Principles:** Engine/Display separation, automation over expectation, evidence-based governance

### Current State (2026-02-14)

| Metric | Value |
|--------|-------|
| Version | 2.6.0 |
| Branch | dev-v3 (consolidated with origin/dev-v3) |
| Tests | 54 passing |
| TypeCheck | Passing |
| Recent PRs | #43 (Plan Consolidation), #44 (Declarative compileSignals) |
| Phase | PHASE A — Stabilize & Untie the Knot |

---

## Part I: Architectural Foundation

### 1.1 The Engine vs. Display Separation

**Critical Understanding:** HiveMind is a **Meta-Framework Plugin** operating within the OpenCode Ecosystem.

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **Engine** | Background automation via SDK hooks | `src/hooks/*.ts`, `src/tools/*.ts`, `src/lib/detection.ts` |
| **Display** | Human observability (TUI, CLI, Toasts) | `src/cli.ts`, `src/tui/` (future), `src/lib/toast-throttle.ts` |
| **Host Project** | Target app being built | Reads `package.json`, tech stack |

**Rule:** The Engine drives intelligence silently; Display shows what Engine has already executed. Never mix these concerns.

### 1.2 The 10 Commandments for AI Agent Tools

All tools MUST follow these principles:

| # | Commandment | Key Constraint |
|---|-------------|----------------|
| 1 | ONE ARGUMENT MAX | 0-2 required args; system infers IDs |
| 2 | NATURAL SELECTION | Description matches agent's natural thought |
| 3 | HIGH FREQUENCY | Build for many use cases, called often |
| 4 | NO OVERLAP | Distinct verb domains per tool |
| 5 | CONTEXT IS KING | Never ask for what system already knows |
| 6 | SIGNAL OVER NOISE | 1-line output or structured JSON |
| 7 | HARMONIZE WITH HOOKS | State changes visible to hooks |
| 8 | ACTIONABLE OUTPUT | Agent can DO something with output |
| 9 | PARALLEL BY DESIGN | N atomic calls in one turn |
| 10 | SCHEMA FIRST | Define schema, derive types, write code |

### 1.3 The 4 Entry Points for Context Governance

| Entry Point | SDK Mechanism | Engine Behavior |
|-------------|---------------|-----------------|
| **New Session** | `session.create` / CLI Init | Detect greenfield/brownfield, pull active phase + anchors + mems |
| **Mid-Turn** | `insertReminders` (SDK) | Inject `<system-reminder>` with TODOs, drift warnings |
| **Compaction** | `experimental.session.compacting` | Inject hierarchy + tasks into continuation prompt |
| **Human Intent** | `/commands` & Tool Hooks | Map prompts to Skills, spawn sub-agents, force atomic commits |

---

## Part II: Current Architecture Analysis

### 2.1 Core Files (Post-Consolidation)

```
src/
├── index.ts                 # Plugin entry (10 tools, 4 hooks)
├── cli.ts                   # CLI commands (console.log ONLY here)
├── lib/
│   ├── persistence.ts       # BrainState, Hierarchy management
│   ├── detection.ts         # Signal detection, escalation tiers
│   ├── planning-fs.ts       # Session files, manifest, templates
│   ├── hierarchy-tree.ts    # Tree structure, ASCII rendering
│   └── ...
├── tools/                   # 10 governance tools
│   ├── declare_intent.ts    # Entry gate for sessions
│   ├── map_context.ts       # Hierarchy updates
│   ├── export_cycle.ts      # Subagent result capture
│   └── ...
├── hooks/                   # 4 SDK hooks
│   ├── session-lifecycle.ts # Prompt injection engine
│   ├── soft-governance.ts   # Tool tracking, violation detection
│   ├── tool-gate.ts         # Write gate enforcement
│   └── compaction.ts        # Context preservation
└── schemas/                 # TypeScript schemas
    ├── brain-state.ts       # BrainState interface
    ├── config.ts            # HiveMindConfig interface
    └── hierarchy.ts         # HierarchyLevel, ContextStatus
```

### 2.2 Detection System Architecture

The detection engine (`src/lib/detection.ts`) operates in 5 sections:

| Section | Purpose | Consumer |
|---------|---------|----------|
| 1. Types | DetectionState, EscalatedSignal, Thresholds | All |
| 2. Tool Classification | classifyTool(), incrementToolType() | soft-governance.ts |
| 3. Counter Logic | trackToolResult(), trackSectionUpdate() | soft-governance.ts |
| 4. Keyword Scanning | scanForKeywords(), COUNTER_EXCUSES | soft-governance.ts |
| 5. Signal Compilation | compileSignals(), compileEscalatedSignals() | session-lifecycle.ts |

**Escalation Tiers:** INFO → WARN → CRITICAL → DEGRADED (intensify over unresolved turns)

### 2.3 Recent PR Consolidation (2026-02-14)

| PR | Title | Impact |
|----|-------|--------|
| #43 | HiveMind Plan Consolidation | Added `regenerateManifests()`, streamlined planning-fs.ts |
| #44 | Refactor compileSignals declarative | Cleaner detection signal compilation |
| #34 | Fix Critical PRs | Restored PRs #4, #7, #10, #11, #13-16 |
| #30 | Fix Issue 22 Archive Chaos | Prevented archive overwrite |
| #17-20 | Performance & Refactor | Optimized logging, extracted utilities |

---

## Part III: Phased Execution Roadmap

### Phase A: Stabilize & Untie the Knot (CURRENT PRIORITY)

**Goal:** Fix the broken foundation before any feature work.

#### A1: Bug Triage — Data Flow Gaps

| Bug ID | Issue | File | Fix Required |
|--------|-------|------|--------------|
| A1-1 | `export_cycle` desyncs `brain.json` from `hierarchy.json` | `src/tools/export-cycle.ts` | Sync flat projection after tree mutation |
| A1-2 | `declare_intent` overwrites templates with legacy format | `src/tools/declare-intent.ts` | Separate legacy active.md update |
| A1-3 | Stale auto-archive fails to reset `hierarchy.json` | `src/hooks/session-lifecycle.ts` | Reset tree on new session creation |
| A1-4 | `trackSectionUpdate()` dead code | `src/hooks/soft-governance.ts` | Wire into tool.execute.after |

**Status:** A1-1, A1-2, A1-3 FIXED in PR #34. A1-4 WIRED in PR #44.

#### A2: Structure Reorg

Execute the `.hivemind` folder reorg per AGENT_RULES.md Section 3:

```
.hivemind/
├── state/           # Active Engine State
│   ├── brain.json
│   ├── hierarchy.json
│   ├── tasks.json
│   └── loop-state.json
├── sessions/        # Active sessions + /archive/
├── plans/           # Trajectories, phase plans
├── mems/            # Long-term semantic memory
└── logs/            # Runtime logs
```

**Implementation:** `src/lib/paths.ts` already defines paths. Need to ensure `initializePlanningDirectory()` creates all.

#### A3: First-Turn Context

Ensure Turn 0 pulls prior context:
- ✅ Anchors summary (top 5, budget 300 chars)
- ✅ Mems count + recent summaries (budget 200 chars)
- ✅ Prior session trajectory from manifest (budget 200 chars)
- ✅ Framework context detection (GSD vs spec-kit)

---

### Phase B: Session Lifecycle & Task Governance

**Dependencies:** Phase A complete

#### B1: Session Objects

- Wire sessions as first-class SDK objects
- Auto-export JSON + MD on session close to `archive/exports/`
- Implement session recovery from compacted state

#### B2: Task Manifest (`tasks.json`)

- Wire OpenCode `todowrite`/`todoread` tool hooks
- Write every action to manifest
- Enable task resumption across sessions

#### B3: Atomic Commits

- Wire BunShell script via `tool.execute.after` hook
- Force git commits on file-changing sub-tasks
- Standardized metadata commit messages

---

### Phase C: Agent Tools & Mems Brain

**Dependencies:** Phase B complete

#### C1: Extraction Tools

- Equip SDK tools with `npx repomix` for structured codebase reads
- Enforce `--json` outputs for fast parsing
- Implement hierarchical file reading

#### C2: Semantic Mems

- Save reasoning chains to `mems.json`
- Enable `recall_mems` via semantic search
- Tag mems by type: decision, pattern, error, solution

#### C3: Ralph Loop

- Enable cross-compaction orchestration state
- Survive 5+ compactions with hierarchy intact
- Implement state recovery from mems

---

### Phase D: TUI Engine Room

**Dependencies:** Phase C complete (or partial)

**Reference:** `.planning/ROADMAP.md` — 5 phases, 33 requirements

| TUI Phase | Goal | Requirements |
|-----------|------|--------------|
| D1: Terminal Foundation | TUI starts, resizes, exits cleanly | CORE-01 to CORE-04 |
| D2: State Layer | SQLite + Drizzle, state polling | CORE-05, CORE-06, POLL-01 to POLL-04 |
| D3: Layout Shell | Tab bar, status bar, keyboard nav | LAYOUT-01 to LAYOUT-05 |
| D4: Simple Tabs | Agents monitor, Tools log stream | AGENT-01 to AGENT-03, TOOL-01 to TOOL-04 |
| D5: Advanced Tabs | Hierarchy tree, Artifacts browser, Charts | TREE-01 to TREE-04, SHELF-01 to SHELF-04, CHART-01 to CHART-03 |

**Tech Stack:** OpenTUI Solid reconciler, Drizzle ORM, SQLite

---

## Part IV: Root Cause Remediation

### 4.1 The Nonsensical Toast System

**Root Cause:** Toasts designed as notification layer, not governance mechanism.

**Fix:**
- Replace with "Signal-Driven Governance"
- Escalation tiers (INFO→WARN→CRITICAL→DEGRADED)
- Evidence-based pushback with counter-arguments
- Actionable guidance (what should the agent DO?)

### 4.2 The Broken Promise of export_cycle

**Root Cause:** Implemented as logging tool, not state-synchronization gateway.

**Fix:**
- Update `brain.hierarchy` after tree mutations
- Link to hierarchy nodes
- Persist to mems brain with proper tagging
- Clear `pending_failure_ack` on successful export

### 4.3 The Corrupted Session Lifecycle

**Root Cause:** Conflicting responsibilities across multiple files.

**Fix:**
- Centralize session lifecycle in `planning-fs.ts`
- Strict format enforcement via templates
- Coordinate auto-archive with hierarchy reset
- Single source of truth for session format

---

## Part V: Implementation Priorities

### Immediate (This Session)

1. ✅ Merge `origin/dev-v3` into local `dev-v3`
2. ✅ Fix TypeScript error (unused `governanceMode` parameter)
3. ✅ Verify tests pass (54/54)
4. ✅ Verify typecheck passes
5. ⏳ Document consolidated plan

### Next Session

1. Verify A1-1 through A1-4 fixes are complete
2. Test `export_cycle` hierarchy sync
3. Test `declare_intent` template handling
4. Test stale auto-archive hierarchy reset
5. Implement remaining Phase A items

### Short-Term (1-2 Weeks)

1. Complete Phase A (Stabilize)
2. Begin Phase B (Session Lifecycle)
3. Wire task manifest integration
4. Implement atomic commit automation

### Medium-Term (2-4 Weeks)

1. Complete Phase B
2. Begin Phase C (Agent Tools & Mems)
3. Start TUI foundation (Phase D1)

---

## Part VI: Quality Gates

### Before Each Commit

- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint:boundary` passes (SDK compliance)

### Before Each Phase Advancement

- [ ] All bugs in phase fixed
- [ ] Tests covering new functionality
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### Before Release

- [ ] All phases complete
- [ ] Integration tests pass
- [ ] README.md reflects current state
- [ ] Version bump in package.json

---

## Appendix A: Key Files Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/lib/detection.ts` | Signal detection engine | `compileSignals`, `compileEscalatedSignals`, `DetectionThresholds` |
| `src/hooks/session-lifecycle.ts` | Prompt injection | `createSessionLifecycleHook` |
| `src/lib/planning-fs.ts` | Session file management | `initializePlanningDirectory`, `regenerateManifests` |
| `src/tools/map-context.ts` | Hierarchy updates | `createMapContextTool` |
| `src/schemas/config.ts` | Configuration types | `HiveMindConfig`, `AgentBehaviorConfig` |

## Appendix B: Test Coverage

| Suite | Assertions | Status |
|-------|------------|--------|
| Integration | 10 | ✅ |
| Detection | 10 | ✅ |
| Tool Gate | 14 | ✅ |
| Sync Assets | 14 | ✅ |
| **Total** | **54** | **All Passing** |

---

## Appendix C: Git Consolidation Log

```
a286605 Merge remote-tracking branch 'origin/dev-v3' into dev-v3
89574e5 chore: update session metrics and add AGENT_RULES master SOT
1eb5947 Merge pull request #43 (Plan Consolidation)
f5126ed Update src/lib/planning-fs.ts
31b2084 Consolidate HiveMind plan: Task/TODO, Prompt refinement
```

---

*Document consolidated: 2026-02-14*
*Next review: After Phase A completion*
