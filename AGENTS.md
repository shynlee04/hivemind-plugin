**NON-NEGOTIABLE RULES:** CAN'T NOT SKIP - MOST IMPORTANT FOR FRONT FACING AGENTS - APART FROM CONTEXT REGULATING, RECORDING, RETRIVING AND GIT COMMIT - YOU ARE NOT ALLOWED TO CARRY ANY OTHER ACTIONS THAN **DELEGATION** AND **CORDINATION OF OTHER AGENTS**

**ONLY FRONT AGENT AS FOR THE ONE HAVING CONVERSATION WITH HUMAN USER IS COUNTED FOR COORDINATOR JOB - IF YOU ARE "BUILD" START IMPLEMENT

1.  if you are the **front-facing-agent:** never start action/execution first -> **ALWAYS** load context, retrace past event - knowing which TODO tasks connected with, what are past plans
2. Number 1 is true not matter in-between turns, starting new or after compact
3. from 1 and 2 , never act or execute with out plan
4. never act if the plan with tasks are not connected
5. if you can't find any skill related to - you must find SKILL - do not execute any actions
6. if you can't find connected points of a demanding workloads - back to 1
7. always keep context relevant, with anchor, states and brains loaded.
YES COORDINATION, SKILLS AND SKILLS DON'T TELL ME YOU FIND NO SKILLS TO LOAD

```
/Users/apple/hivemind-plugin/.opencode/skills
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle/SKILL.md
```
---

# HiveMind Context Governance - Developer Guide


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

## Key Corrections (2026-02-18)

1. **LOC Limit**: ~300 lines strategic (not ≤100 hard constraint)
2. **80% Split**: DEFENSIVE GUARD - DON'T split when context >= 80% (crash avoidance with innate compaction)
3. **CQRS**: 10 violations identified in hooks - being addressed via state-mutation-queue

---

## Source File Registry

> Last Updated: 2026-02-18
> Total Files: 97

### src/tools/ (6 canonical tools + index)
- hivemind-session.ts - Session lifecycle management (declare_intent, map_context, compact_session)
- hivemind-inspect.ts - State inspection (scan_hierarchy, think_back)
- hivemind-memory.ts - Knowledge persistence (save_mem, recall_mems)
- hivemind-anchor.ts - Immutable anchors (save_anchor, list_anchors, get_anchor)
- hivemind-hierarchy.ts - Tree management (prune, migrate, status)
- hivemind-cycle.ts - Session export (export, list, prune)
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
| `src/lib/event-bus.ts` | [NEW] | In-process EventEmitter pub/sub |
| `src/lib/watcher.ts` | [NEW] | fs.watch with debouncing |
| `src/schemas/events.ts` | [NEW] | Event Zod schemas |
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
