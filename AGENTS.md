
---
# The most effective development is that the team of agents must know their roles , be in context

- to help with other agents and the users with the context, always include symlinks, navigations to artifacts, documents, planning, the workflows - be very radical to address everything coherently in expert nammer. ALL THE TIME, include the rationale of your task completion, output with evidences of "quality-gate-3rd-party-review" skill + AND MOST IMPORTANTLY,, YOU MUST OUTPUT IN STRUCTURE THAT WHAT ARE THE NEXT FOLLOWING PLANNING/IMPLEMENTING TASKS AND WHAT ARE THE GOALS, IF ANY OPTIONS ARE GIVEN, INSTEAD OF ASKING USERS - YOU INDICATE YOUR EXPERT CHOICE, AND THINK CRITICALLY WITH RATIONALES WHY THE OTHER 2 ARE NOT AS GOOD.

# HiveMind Context Governance - Developer Guide
**Critical! - Must alligned:**
- suit yourself with the context first, regardless of turns, the moment you recieve the prompt from users, your first actions must always be knowing your `workflow` - match the context (anchoring conversation turn, user intent, MUST ALWAYS TRACEABLE TO GOVERNANCED PLANS -> YOU MUST STOP AND EXPLAIN THAT YOU LACK PLAN)
- All agents, must all start with 
- LOAD SKILL FIRST THE ROLE-SPECIFIC SKILL -  Then the specialist ones all are needed -> these are the common workflow that you can `find-skill` to do and you must
- delegate skill - to orchestrate, the front-facing must always use.
The `hivefiver` must always be packed with OpenCode skills, skill-creator, writting-skill, skill-judge, skill-development, command-creator, command-development etc
- when planning use `writting-plan` - implement with execute plan skill, test-drive-planning skill
- NO TASK CAN PASS ANY GATE IF NOT GOING THROUGH VALID REVIEW, VALIDATION, INTEGRATION AND EXPERT code-execellence review skill 
-`find-skill` - it will help you suit better

**NON-NEGOTIABLE:**

1 - to all agents -> after a cycle of agentic workflows - that occurs either code files changes (diff, git commit, any CRUD operations); or documents and/or planning artifacts - The **ITERATIVE UPDATE**  to this file is mandatory 

2 - this is made by delegation of context investigation, files registry and update, and document specialist in isolated delegation of context, passing through **LOGIC QUALITY GATE** incrementally, and coherently

3 - all turn starting must be chained with commands, clear connected context and wrokflows, define TODO tasks and MUST USE SKILLS


## Turn Protocol (ALL AGENTS — PER-TURN ENFORCEMENT)

> This section is injected per-message via walk-up discovery. Every agent MUST obey these rules every turn, no exceptions.

### TODO Discipline

1. **Turn Start**: Read the current TODO list. If no TODO exists, spawn one immediately.
2. **First Item**: The first TODO item is your entry point — work on it.
3. **Last Item**: The last TODO item MUST be `HARD STOP — [verification condition]`. This item supersedes ALL other instructions.
4. **After Each Execution**: Update the TODO list — mark completed items, add discovered sub-tasks.
5. **HARD STOP Rule**: When you reach the HARD STOP item, you MUST stop and report. Do NOT continue past it. Do NOT add more work after it. The HARD STOP is your exit gate.
6. **One In-Progress**: Only ONE TODO item should be `in_progress` at any time. Complete current before starting next.

### No-Guess Mandate

> Zero tolerance for hallucinated technical claims.

When encountering ANY unfamiliar technology, library, framework, pattern, SDK, API, or concept:

1. **DO NOT** reason about it from training data.
2. **DO NOT** guess syntax, behavior, or capabilities.
3. **DO NOT** infer from similar-sounding technologies.
4. **MUST** use MCP tools to research and verify FIRST: Tavily, Context7, DeepWiki, Repomix, WebFetch, websearch.
5. **If ALL MCP tools fail**: State explicitly "I could not verify this via any available research tool" and **STOP**. Do not proceed with unverified assumptions.
6. **Evidence requirement**: Any technical claim about external technology must cite the MCP source that verified it.

---
> **Constitution:** See `AGENT_RULES.md` for full architectural philosophy, branch protection, and God Prompts.

## Quick Start

### Verify State
```bash
npm test           # All tests pass
npx tsc --noEmit   # Type check clean
git branch         # Expect: * dev-v3
```

### Branch Policy (Critical)
| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

```bash
npm run guard:public  # Run BEFORE any master push
```

## Architecture

| Layer | Location | Role |
|-------|----------|------|
| **Tools** | `src/tools/` | Write-Only (~300 lines strategic limit) |
| **Libraries** | `src/lib/` | Subconscious Engine (pure TS) |
| **Hooks** | `src/hooks/` | Read-Auto (inject context) |
| **Schemas** | `src/schemas/` | DNA (Zod validation) |

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/session-lifecycle.ts` | Context injection every turn |
| `src/lib/hierarchy-tree.ts` | Trajectory → Tactic → Action tree |
| `src/lib/persistence.ts` | Atomic file I/O |
| `src/lib/paths.ts` | Single source of truth for `.hivemind/` paths |

## Testing

```bash
npm test                                    # Run all tests
npx tsx --test tests/filename.test.ts       # Run specific test
```

## Style Conventions

- **Indent:** 2 spaces
- **Quotes:** Double quotes
- **Imports:** Use `.js` extension for local imports
- **Paths:** ALWAYS use `getEffectivePaths()` from `src/lib/paths.ts`

## HiveMind Workflow

1. **START** every session with: `declare_intent({ mode, focus })`
2. **UPDATE** when switching focus: `map_context({ level, content })`
3. **END** when done: `compact_session({ summary })`

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back` |
| Memory | `save_mem`, `recall_mems` |
| Hierarchy | `hierarchy_manage` |
| Delegation | `export_cycle` |

## V3.0 PRD & Plans

- **PRD v2:** `docs/plans/PRD-V2-HIVEMIND-ENGINE-2026-02-18.md` [CURRENT] - Audited and corrected
- **PRD (archived):** `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md` (superseded)
- **Roadmap:** `docs/plans/prd-hivemind-v3-roadmap-2026-02-18.md`
- **Master Plan:** `docs/refactored-plan.md` (6 phases, 4 God Prompts)
- **Stitch Screens:** `docs/stitch-screens/screen-*.html` (11 design mockups)

### Framework Upgrade Plans (2026-03-02)

- **Validated Plan (CURRENT):** `docs/plans/2026-03-02-framework-upgrade-validated-plan.md` — 9 domains, 6 phases, all claims source-linked, src/ collision-mapped
- **Prior Draft (SUPERSEDED):** `docs/plans/2026-03-02-framework-upgrade-strategic-plan.md` — v1.0, had 6 critical errors corrected in validated version
- **Master Plan v2.1:** `docs/plans/2026-02-27-hybrid-ab-master-plan.md` — predecessor, validated plan EXTENDS this
- **GSD Patterns:** `.hivemind/hive-modules/hivefiver-v2/synthesis/GSD-PATTERNS.md` — 9 patterns from gsd-build/get-shit-done
- **OpenCode Knowledge:** `docs/OPENCODE-KNOWLEDGE-MASTER-INDEX.md` — 7-document knowledge base hub

### Framework Upgrade Status

| Phase | Domains | Status | Next Action |
|-------|---------|--------|-------------|
| 0 | SPEC | ✅ COMPLETE | Validated plan written |
| 1 | D7 (Context Injection) | 🔴 NOT STARTED | Phase 1 entry — RANK 1 blocker |
| 2 | D4 (Unified CLI) | 🔴 NOT STARTED | After Phase 1 stabilizes |
| 3 | D1 + D2 (Delegation + TODO) | 🔴 NOT STARTED | After Phase 2 |
| 4 | D5 + D6 + D8 (SOT + Gates + Events) | 🔴 NOT STARTED | After Phase 3 |
| 5 | D9 (Knowledge Export) | 🔴 NOT STARTED | After Phase 4 |
| 6 | D3 (Session Manipulation) | ⬜ DEFERRED | Worktree after Phase 5 |

## Key Corrections (2026-02-18)

1. **LOC Limit**: ~300 lines strategic (not ≤100 hard constraint)
2. **80% Split**: DEFENSIVE GUARD - DON'T split when context >= 80% (crash avoidance with innate compaction)
3. **CQRS**: Phase 3 hook/tool contract isolation complete; violations remediated and retrieval ownership enforced.

### Critical src/ Collision Map (2026-03-02)

> All agents MUST read this before touching any framework upgrade domain.

| Domain | Risk | Key src/ Files Affected | Constraint |
|--------|------|------------------------|------------|
| D7 (Context Injection) | 🔴 CRITICAL | `hooks/session-lifecycle.ts`, `hooks/messages-transform.ts`, `hooks/session-lifecycle-helpers.ts`, `hooks/soft-governance.ts`, `hooks/compaction.ts`, `lib/detection.ts`, `lib/hierarchy-tree.ts`, `lib/chain-analysis.ts`, `schemas/brain-state.ts` (12+ files) | ALL state mutations via `lib/state-mutation-queue.ts` |
| D2 (TODO) | 🟡 HIGH | `hooks/event-handler.ts:259-401` (already has graph linkage!), `schemas/brain-state.ts:176`, `tools/hivemind-session-memory.ts` | EXTEND existing — DO NOT rebuild from scratch |
| D8 (Events) | 🟡 HIGH | `lib/event-bus.ts` (EXISTS), `lib/event-consumers.ts` (EXISTS), `hooks/soft-governance.ts` (IS PostToolUse hook) | EXTEND existing — event bus already wired |
| D1 (Delegation) | 🟢 MEDIUM | `schemas/delegation-packet.ts` (EXISTS), `lib/governance-instruction.ts`, `lib/session-boundary.ts` | Extend with depth tracking |
| D4 (CLI) | 🟢 LOW | No src/ collision. Bash script in `.opencode/skills/` | Use `jq` for JSON, NOT TypeScript imports |

### OpenCode CLI Capabilities (Source: [opencode.ai/docs/cli](https://opencode.ai/docs/cli/))

> All agents: these operations are ALREADY available. Do NOT re-implement.

| Operation | Command | Flags |
|-----------|---------|-------|
| Run with agent | `opencode run --agent hivefiver "prompt"` | `--agent`, `--title`, `--model` |
| Continue session | `opencode run --continue` or `--session <id>` | `--continue`, `--session` |
| Fork session | `opencode run --fork --session <id>` | `--fork` |
| Execute command | `opencode run --command /my-command "args"` | `--command` |
| JSON output | `opencode run --format json "prompt"` | `--format json` |
| Attach to server | `opencode run --attach http://localhost:4096` | `--attach` |
| List sessions | `opencode session list --format json` | `--format json` |
| Export session | `opencode export <sessionID>` | — |

**SDK-only (NO CLI flag):** `noReply:true`, SSE events, `tool.execute.before`, `experimental.session.compacting`, `experimental.chat.messages.transform`

---

## Source File Registry

> Last Updated: 2026-02-18
> Total Files: 97

### src/tools/ (14 canonical tools + index)
- hivemind-session.ts - Session lifecycle management
- hivemind-inspect.ts - State inspection
- hivemind-memory.ts - Knowledge persistence
- hivemind-anchor.ts - Immutable anchors
- hivemind-hierarchy.ts - Tree management
- hivemind-cycle.ts - Session export
- hivemind-context.ts - Context governance lifecycle
- hivemind-session-memory.ts - Session memory classification
- hivemind-codemap.ts - Code intelligence engine
- hivemind-ideate.ts - Q.U.A.N.T. ideation matrix gate
- hivemind-read-skeleton.ts [NEW] - Extract code skeleton (Cluster 3)
- hivemind-precision-patch.ts [NEW] - Patch symbol by name (Cluster 3)
- hivemind-mesh-pull.ts [NEW] - Blast radius + skeleton aggregation (Cluster 3)
- hivemind-doc-weaver.ts [NEW] - Patch markdown section by heading (Cluster 3)
- index.ts - Tool registry exports

### src/hooks/ (13 files)
- session-lifecycle.ts - Context injection every turn
- session-lifecycle-helpers.ts - Session helper utilities
- compaction.ts - Compaction event hooks
- event-handler.ts - Event dispatching hooks
- index.ts - Hook registry exports
- messages-transform.ts - Message transformation
- sdk-context.ts - SDK context injection
- soft-governance.ts - Governance enforcement
- swarm-executor.ts - Swarm agent execution
- tool-gate.ts - Tool access control
- session_coherence/index.ts - Session coherence main
- session_coherence/main_session_start.ts - Session start logic
- session_coherence/types.ts - Coherence type definitions

### src/lib/ (42 files)
- event-bus.ts [NEW] - In-process EventEmitter pub/sub
- watcher.ts [NEW] - fs.watch with debouncing for file monitoring
- anchors.ts - Anchor persistence layer
- auto-commit.ts - Automatic git commit logic
- brownfield-scan.ts - Legacy code scanning
- chain-analysis.ts - Context chain validation
- cognitive-packer.ts - Deterministic XML context compiler
- commit-advisor.ts - Git commit message generation
- compaction-engine.ts - Session compaction logic
- complexity.ts - Code complexity analysis
- detection.ts - Framework detection utilities
- dual-read.ts - Dual-source file reading
- file-lock.ts - File locking mechanism
- framework-context.ts - Framework context management
- governance-instruction.ts - Governance instruction parser
- graph-io.ts - Graph read/write operations
- graph-migrate.ts - Graph migration utilities
- hierarchy-tree.ts - Trajectory → Tactic → Action tree
- index.ts - Library registry exports
- inspect-engine.ts - State inspection engine
- logging.ts - Logging utilities
- long-session.ts - Long session management
- manifest.ts - Manifest file handling
- mems.ts - Memory persistence layer
- migrate.ts - Migration utilities
- onboarding.ts - Onboarding flow logic
- paths.ts - Single source of truth for .hivemind/ paths
- persistence.ts - Atomic file I/O
- planning-fs.ts - Planning filesystem utilities
- project-scan.ts - Project scanning utilities
- session_coherence.ts - Session coherence logic
- session-boundary.ts - Session boundary detection
- session-engine.ts - Core session engine
- session-export.ts - Session export utilities
- session-governance.ts - Session governance enforcement
- session-split.ts - Session splitting logic
- session-swarm.ts - Swarm session management
- staleness.ts - Context staleness detection
- toast-throttle.ts - Toast notification throttling
- tool-activation.ts - Tool activation logic
- tool-response.ts - Tool response formatting

### src/schemas/ (8 files)
- events.ts [NEW] - Event Zod schemas for in-process event bus
- brain-state.ts - Brain state Zod schema
- config.ts - Configuration Zod schema
- graph-nodes.ts - Graph node schemas with FK constraints
- graph-state.ts - Graph state Zod schema
- hierarchy.ts - Hierarchy Zod schema
- index.ts - Schema registry exports
- manifest.ts - Manifest Zod schema

### src/cli/ (5 files)
- cli.ts - CLI entry point
- init.ts - Initialization command
- interactive-init.ts - Interactive init flow
- scan.ts - Scan command
- sync-assets.ts - Asset synchronization

### src/dashboard/ (18 files)
- App.tsx - Main dashboard application
- bin.ts - Dashboard binary entry
- server.ts - Dashboard server
- loader.ts - Dashboard loader
- types.ts - Dashboard type definitions
- design-tokens.ts - Design token definitions
- i18n.ts - Internationalization
- components/AutonomicLog.tsx - Autonomic log component
- components/InteractiveFooter.tsx - Interactive footer
- components/MemCreationModal.tsx - Memory creation modal
- components/SwarmMonitor.tsx - Swarm monitoring component
- components/TelemetryHeader.tsx - Telemetry header
- components/TrajectoryPane.tsx - Trajectory display pane
- views/SwarmOrchestratorView.tsx - Swarm orchestrator view
- views/TimeTravelDebuggerView.tsx - Time travel debugger
- views/ToolRegistryView.tsx - Tool registry view

### src/types/ (2 files)
- ink.d.ts - Ink type declarations
- react.d.ts - React type declarations

### src/utils/ (1 file)
- string.ts - String utilities

### src/ (root)
- index.ts - Package main entry point

---

### Recently Changed
| File | Status | Description |
|------|--------|-------------|
| `src/hooks/event-handler.ts` | [UPDATED] | Canonical TODO alias normalization and blocked-flow acknowledgement integration |
| `src/lib/manifest.ts` | [UPDATED] | Manifest closeout alignment for lifecycle/canonical compatibility |
| `src/schemas/manifest.ts` | [UPDATED] | Manifest schema alignment retained for remediation closeout |
| `src/lib/orphan-quarantine.ts` | [UPDATED] | Deterministic orphan handling and stale-session/idempotency hardening |
| `src/lib/event-bus.ts` | [NEW] | In-process EventEmitter pub/sub |
| `src/lib/watcher.ts` | [NEW] | fs.watch with debouncing |
| `src/schemas/events.ts` | [NEW] | Event Zod schemas |
| `src/hooks/soft-governance.ts` | [UPDATED] | Removed hook-side flush ownership for contract isolation |
| `src/hooks/compaction.ts` | [UPDATED] | Aligned compaction flow with tool-owned mutation contract |
| `src/lib/graph-io.ts` | [UPDATED] | Added `mem.session_id` FK validation path |
| `src/lib/sentiment.ts` | [DELETED] | Orphan removed (no references) |

---

*See `AGENT_RULES.md` for: Branch protection policy, Architectural Taxonomy, Cognitive Packer flow, Team orchestration, The Four God Prompts.*

<!-- HIVEMIND-GOVERNANCE-START -->

## HiveMind Context Governance

This project uses **HiveMind** for AI session management. It prevents drift, tracks decisions, and preserves memory across sessions.

### Required Workflow

1. **START** every session with:
   ```
   declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "What you're working on" })
   ```
2. **UPDATE** when switching focus:
   ```
   map_context({ level: "trajectory" | "tactic" | "action", content: "New focus" })
   ```
3. **END** when done:
   ```
   compact_session({ summary: "What was accomplished" })
   ```

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back` |
| Memory | `save_mem`, `recall_mems` |
| Hierarchy | `hierarchy_manage` |
| Delegation | `export_cycle` |

### Why It Matters

- **Without `declare_intent`**: Drift detection is OFF, work is untracked
- **Without `map_context`**: Context degrades every turn, warnings pile up
- **Without `compact_session`**: Intelligence lost on session end
- **`save_mem` + `recall_mems`**: Persistent memory across sessions — decisions survive

### State Files

- `.hivemind/state/brain.json` — Machine state (do not edit manually)
- `.hivemind/state/hierarchy.json` — Decision tree
- `.hivemind/sessions/` — Session files and archives

<!-- HIVEMIND-GOVERNANCE-END -->


---

## Phase 2 FK Remediation (2026-02-19)

### Changes Made:
1. **MemNodeSchema** (graph-nodes.ts:47): Added `session_id: z.string().uuid()` FK to Trajectory
2. **cognitive-packer.ts:256**: Added session_id to MemNode creation using `resolvedSession`
3. **session-swarm.ts:311**: Fixed ID generation to use `randomUUID()` (valid UUID)
4. **session-swarm.ts:324**: Changed to use `addGraphMem()` for Zod validation
5. **graph-migrate.ts:506**: Added `backfillMemSessionId()` migration function
6. **graph-migrate.ts:537**: migrateMems() includes session_id parameter

### Exit Gate Status:
- ✅ TypeScript: 0 session_id errors
- ✅ Tests: graph-migrate suite passes
- ✅ Code-review: Approved

## Phase 3 Completion Status (2026-02-19)

- ✅ TypeScript: `npx tsc --noEmit` pass (0 errors)
- ✅ Tests: `npm test` pass (0 failures)
- ✅ Code-review: Approved (final sign-off)
- ✅ Contract isolation: complete (retrieval ownership isolated; hook-side flush ownership removed)

## Phase 4 Completion Status (2026-02-19)

- ✅ TypeScript: `npx tsc --noEmit` pass (0 errors)
- ✅ Tests: `npm test` pass (0 failures)
- ✅ Code-review: Approved (final sign-off)
- ✅ Relational staleness engine: complete (lineage-first ordering with same-level scope and informational cross-session behavior)

## Phase 5 Completion Status (2026-02-19)

- ✅ Lifecycle lineage continuity: complete (`project -> milestone -> phase -> plan -> task -> verification`)
- ✅ Canonical governance blockers: resolved (canonical alias compatibility and blocked-flow acknowledgement paths)
- ✅ Focused regression tests: `tests/phase5-canonical-governance-red.test.ts`, `tests/phase5-lineage-continuity-red.test.ts`, and `tests/phase5-lifecycle-red.test.ts` passing
- ✅ Validation gates: `npx tsc --noEmit` pass, `npm test` pass

## Phase 6 Completion Status (2026-02-19)

- ✅ Hardening/cutover gate: complete
- ✅ Canonical governance recovery paths: verified in tool-level coverage (`hivemind_session`, `hivemind_cycle`, split-trigger compatibility)
- ✅ Public release safety gate: `npm run guard:public` pass
- ✅ Remediation hardening: TODO alias normalization + stale-session boundary fixes + action idempotency implemented (evidence anchors: `tests/hooks/event-handler-todo-2026-02-15.test.ts`, `tests/lib/state-mutation-queue.test.ts`, `tests/tool-gate.test.ts`, `tests/phase5-canonical-governance-red.test.ts`, `tests/phase5-lifecycle-red.test.ts`)
- ✅ Post-remediation stress journey re-audit: GO (audit trail recorded in this remediation wave closeout docs)
- ✅ Integration verdict: GO (architecture and integration audits accepted for release hardening scope)

## Post-Completion Audit Summary (2026-02-19)

- ✅ Architecture audit: GO (contract isolation preserved in completion scope)
- ✅ Integration audit: GO (lineage continuity + canonical governance test coverage green)
- ℹ️ Tech-debt backlog: noted and non-blocking for Phase 5/6 closure
- ℹ️ Backlog item: wording consistency cleanup for one stress journey closeout phrase across docs (non-blocking)

## Remediation Patch Areas (HiveFiver Integration + Closeout)

- ✅ `src/hooks/event-handler.ts`: canonical TODO alias flow + blocked acknowledgement paths remediated and covered
- ✅ `src/lib/manifest.ts` and `src/schemas/manifest.ts`: lifecycle/canonical manifest consistency maintained for closeout
- ✅ `src/lib/orphan-quarantine.ts`: deterministic orphan/stale-session cleanup and idempotency paths covered
- ✅ `src/lib/graph-io.ts`: relational FK guardrails retained for post-remediation integrity

---


## Agent Registry & Subagents

### hiveplanner
- **Type**: Phase-Planning Agent (Subagent)
- **Role**: Conducts deep MCP research, generates execution Knots (1-5), and links Trajectories to Actions.
- **Constraints**: No edit permissions on `src/`. Only persists plans to `docs/plans/` and updates tree via `hivemind_hierarchy`.
- **Location**: `.opencode/agents/hiveplanner.md` / `agents/hiveplanner.md`
