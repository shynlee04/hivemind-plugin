# QWEN.md - Harness Experiment Worktree

## Project Overview

**opencode-harness** is a standalone OpenCode harness repository for delegated session orchestration, continuity persistence, routing, and runtime guardrails. This worktree (`harness-experiment`) is an experimental branch for transforming the project from a skill-pack-only implementation into a complete platform harness.

**Package:** `opencode-harness` v0.1.0  
**Type:** npm package (TypeScript/ESM)  
**Peer Dependency:** `@opencode-ai/plugin` >= 1.1.0  
**Node:** >= 20.0.0

### What It Does

The harness provides:
- **Delegation system**: Parent→child session chains with permission scoping (researcher/builder/critic agents)
- **Continuity persistence**: Durable JSON state that survives session compaction
- **Runtime guardrails**: Circuit breaker (tool call loop detection), tool call budgets (400/session), depth limits (max 3)
- **Lifecycle management**: Session state machine with event-driven phase tracking
- **Completion detection**: Two-signal async completion detection
- **System prompt transformation**: Dynamic injection of harness state into compaction context
- **Message transformation**: Context-aware message history transformation

### Architecture (CQRS Pattern)

| Layer | Responsibility | Key Files |
|-------|----------------|-----------|
| **Plugin** (assembly) | Hook + tool wiring, zero business logic | `src/plugin.ts` |
| **Tools** (write-side) | `delegate-task`, `prompt-skim`, `prompt-analyze`, `context-budget`, `session-patch` | `src/tools/` |
| **Hooks** (read-side) | `system.transform`, `messages.transform`, `tool.execute.before/after`, `event`, `shell.env`, `session.compacting` | `src/hooks/` |
| **Library** (core) | Continuity, lifecycle, concurrency, state, session API, completion detection | `src/lib/` |
| **Schema Kernel** | Phase 1 contract authority | `src/schema-kernel/` |
| **Shared** | Leaf utilities and helpers | `src/shared/` |

## Build & Test Commands

```bash
npm install              # Install dependencies
npm run build            # Clean + compile TypeScript to dist/
npm run typecheck        # Type-check without emitting (gate before commit)
npm test                 # Run all tests (vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (src/**/*.ts)
npm pack                 # Build package tarball
npm publish              # Publish to npm
```

### Package Entrypoints
- `opencode-harness` → `./dist/index.js`
- `opencode-harness/plugin` → `./dist/plugin.js`

## Key Architecture Decisions

### Delegation Model
- **3 specialist agents**: researcher (read-only), builder (read+write), critic (read+review)
- **Permission rules** per agent type (e.g., researcher cannot edit/write/bash)
- **Max depth**: 3 levels of delegation
- **Tool budgets**: Per-agent tool allow/deny lists

### State Management
- **Dual-layer**: In-memory Maps (`state.ts`) + durable JSON file (`continuity.ts`)
- **Continuity file**: `.opencode/state/opencode-harness/session-continuity.json`
- **Environment overrides**: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`

### Circuit Breaker
- **Threshold**: 16 repeated identical tool calls
- **Max tool calls**: 400 per session
- **Auto-trip**: Throws error when threshold exceeded

## Current Development State

### Active Phase: Phase 2 — Planning & Breakdown

The project is undergoing planning for a multi-phase cleanup and enhancement effort:

1. **Phase 1** ✅ Complete — Foundation reset (AGENTS.md rewrite, PRD thin-out, research)
2. **Phase 2** 🔄 In Progress — Planning only (no code changes)
3. **Phase 3** ⏳ Pending — Runtime synthesis & implementation
4. **Phase 4** ⏳ Pending — Master plan & checkpoint
5. **Phase 5** ⏳ Pending — CLI substrate + eval harness
6. **Phase 6** ⏳ Pending — Selective migration

### Known Issues (from ROADMAP.md)
- **HIGH**: Double-compaction bug, heading corruption in session-patch, phantom agent references
- **MEDIUM**: System-transform gating, cross-line contradiction detection
- **LOW**: Fake context-budget model, dead text injection, stale hook wiring

### Incident History
- **Rogue agent incident** (2026-04-04): Agent misread AGENTS.md and deleted `.kilo/skills/` and `.opencode/` files. Recovered via `git reset --hard 54d2300b`.
- **Lesson**: `.opencode/` and `.kilo/` are sacred user space — never modify without explicit intent.

## Code Style & Conventions

- **TypeScript strict mode**: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- **ES2022 target**, NodeNext module resolution
- **`verbatimModuleSyntax`**: Use `import type` for type-only imports
- **Max module size**: 500 LOC
- **No `any` types** in new code
- **Error prefix**: `[Harness]` on all thrown errors
- **Deep-clone-on-read** in continuity store

## Dependency Rules

- `types.ts` is leaf (depends on nothing)
- `helpers.ts`, `concurrency.ts`, `completion-detector.ts` are leaf/near-leaf
- `lifecycle-manager.ts` has deepest chain (2 levels)
- **No circular dependencies**
- Tools use `tool.schema` (Zod) for all arg definitions

## Directory Structure

```
src/
├── plugin.ts              # Composition root (hooks + tools wiring)
├── index.ts               # Public API re-exports
└── lib/                   # Core library
    ├── types.ts           # Shared types (leaf)
    ├── task-status.ts     # Task status transitions
    ├── state.ts           # In-memory Maps
    ├── helpers.ts         # Pure utilities
    ├── concurrency.ts     # Keyed semaphore
    ├── continuity.ts      # Durable JSON persistence
    ├── session-api.ts     # OpenCode SDK wrappers
    ├── runtime.ts         # Event→status mapping
    ├── completion-detector.ts
    ├── notification-handler.ts
    ├── lifecycle-manager.ts
    └── agent-registry.ts

.opencode/                 # Soft meta-concepts (skills, agents, commands, rules)
tests/lib/                 # Unit tests (vitest)
.planning/                 # Planning artifacts (roadmap, requirements, research)
```

## Important Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Root governance instructions |
| `opencode.json` | OpenCode config (plugins, permissions, compaction) |
| `task_plan.md` | Multi-phase development plan |
| `.planning/ROADMAP.md` | 5-phase cleanup roadmap |
| `src/plugin.ts` | Plugin composition root (~450 LOC) |
| `src/lib/continuity.ts` | Session persistence layer |
| `src/lib/lifecycle-manager.ts` | Session lifecycle state machine |

## Git Context

- **Worktree**: `harness-experiment` (isolated from main development)
- **Last stable checkpoint**: `54d2300b` (Phase 1 complete)
- **Rogue agent backup**: Branch `rogue-agent-backup`
- **Commit discipline**: `phase: what changed — why it matters`

## Anti-Patterns (Never Do)

1. Import from dead code (`shared/event-bus.ts`, `core/session/kernel.ts`)
2. Define tool args as raw interfaces (use `tool.schema` Zod)
3. Inline tools in plugin file (extract to `src/tools/`)
4. Hand-write `.hivemind/` files (use `hivemind_runtime_command`)
5. Duplicate helpers across tool files (use `src/shared/helpers.ts`)
6. Run commands expecting interactive prompts (no TTY)
7. Glob `**/*.md` (use targeted file reads)

## Session Files

This worktree contains session documentation files tracking agent work history:
- `session-ses_*.md` — Individual session logs
- `findings.md`, `progress.md` — Work tracking artifacts
- `launch-investigation-swarms-onthis-ses_2a54.md` — Investigation log (9000+ lines)
