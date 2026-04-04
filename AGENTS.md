# AGENTS.md

## Project Overview

HiveMind V3 is a **runtime composition engine** for OpenCode. It is an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails.

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

### Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |

### Runtime features this project delivers

Background agents, auto-loop/ralph-loop, delegation chain with task persistence, task queuing, category system, session recovery. See `docs/draft/architecture-proposal-hivemind-v3.md` for feature-to-code mapping.

---

## Setup Commands

```bash
npm install                    # Install dependencies
npm run build                  # Clean + compile TypeScript to dist/
npm run typecheck              # Type-check without emitting
npm run test                   # Run all tests (vitest)
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report (src/**/*.ts)
```

- Requires Node.js >= 20.0.0
- Peer dependency: `@opencode-ai/plugin` >= 1.1.0
- No environment variables required for build/test
- Runtime state overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`

---

## Project Structure

```
src/
├── plugin.ts              # Composition root (447 LOC, target <100)
├── index.ts               # Public API re-exports
└── lib/                   # Core library modules
    ├── types.ts           # Shared types + constants (leaf — no imports)
    ├── task-status.ts     # Task status transitions + guards
    ├── state.ts           # In-memory Maps (sessionStats, rootBudgets)
    ├── helpers.ts         # Pure utilities only
    ├── concurrency.ts     # Keyed semaphore (FIFO queue)
    ├── continuity.ts      # Durable JSON persistence (~635 LOC)
    ├── session-api.ts     # Typed OpenCode SDK wrappers
    ├── runtime.ts         # Event→status mapping
    ├── completion-detector.ts  # Two-signal completion detection
    ├── notification-handler.ts # Async completion notification
    ├── lifecycle-manager.ts    # Session lifecycle state machine (~500 LOC)
    └── agent-registry.ts      # Agent definitions

tests/lib/                 # Unit tests (vitest, globals: true)
.opencode/                 # Soft meta-concepts (skills, agents, commands)
```

### Dependency rules (non-negotiable)

- `types.ts` is leaf — depends on nothing
- `helpers.ts`, `concurrency.ts`, `completion-detector.ts` — leaf or near-leaf
- `lifecycle-manager.ts` depends on most modules (deepest chain: 2 levels)
- No circular dependencies
- Max module size: 500 LOC

### Where to find things

| Task | File |
|------|------|
| Change session persistence format | `src/lib/continuity.ts` |
| Add a lifecycle phase | `src/lib/types.ts` + `src/lib/lifecycle-manager.ts` |
| Change SDK call patterns | `src/lib/session-api.ts` |
| Change concurrency model | `src/lib/concurrency.ts` |
| Change completion detection | `src/lib/completion-detector.ts` |
| Change task status transitions | `src/lib/task-status.ts` |
| Change agent config (temperature, tools) | `src/plugin.ts` — `AGENT_DEFAULTS`, `AGENT_TOOLS` |
| Change circuit breaker / tool budget | `src/plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |

---

## Testing Instructions

- Run all tests: `npm test`
- Run single test file: `npx vitest run tests/lib/helpers.test.ts`
- Run tests matching pattern: `npx vitest run -t "<test name>"`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage` — covers `src/**/*.ts`, excludes `src/index.ts`
- Test files live in `tests/lib/` — mirror `src/lib/` structure
- Tests use vitest globals (no imports needed for `describe`, `it`, `expect`)
- **Type-check before committing:** `npm run typecheck`

---

## Code Style

- TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- ES2022 target, NodeNext module resolution
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Deep-clone-on-read in continuity store
- `[Harness]` prefix on all thrown errors
- Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`)
- No `any` types on new code
- Max module size: 500 LOC

---

## Build and Deployment

- Build: `npm run build` — compiles `src/` → `dist/` with declarations + source maps
- Package entrypoints:
  - `opencode-harness` → `./dist/index.js`
  - `opencode-harness/plugin` → `./dist/plugin.js`
- Prepack runs build automatically: `npm pack` / `npm publish`
- Runtime state path: `.opencode/state/opencode-harness/` (outside package source)

---

## OpenCode Integration

- Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
- Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
- 6 agents defined in `.opencode/agents/`: coordinator, conductor, researcher, builder, critic, explore
- 5 skills in `.opencode/skills/`: meta-builder, user-intent-interactive-loop, coordinating-loop, planning-with-files, use-authoring-skills
- 6 commands in `.opencode/commands/`: start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, ultrawork

---

## Architecture Rules (from architecture-proposal-hivemind-v3.md)

### Script rule
A script should **REPORT FACTS** and **LEAVE JUDGMENT TO THE AGENT**. Pure helpers only (exit 0, no governance). No hardcoded paths, no state mutation outside CQRS tools.

### Anti-patterns to avoid
- Static `.md` files acting as agent definitions (they are templates/references only)
- Bash scripts outside `bin/` CLI substrate
- Governance scripts that block progression (facts only)
- Feature bloat: keep modules under 500 LOC, total codebase target ~4,000-5,000 LOC
- Skill proliferation: target ~20 SKILL.md files, not hundreds

### Target architecture (from proposal)
5 tools (~500 LOC total), hooks (~800 LOC), lifecycle (~400 LOC), delegation (~400 LOC), continuity (~400 LOC), CLI substrate (~500 LOC), control-plane (~400 LOC), shared (~800 LOC).

---

## Git Commit Discipline

- Commit message format: `phase: what changed — why it matters`
- Commit after each meaningful change (subagent returns, phase completes, gate passes)
- Never accumulate changes across multiple phases without committing
- Agents may only manage commits for their own work — they do not constrain or override commits from other development activity

---

## Terminology

| Use | Not |
|-----|-----|
| Harness | Framework, system |
| Agent (specialist: researcher/builder/critic) | Claude, AI, model |
| Skill | Prompt, instruction |
| Runtime composition | Static definition |
| Delegation packet | Task assignment |
