---
Name:  "AGENTS.md — Developer Guide"
Constituted by: AGENT_RULES.md at /Users/apple/hivemind-plugin/AGENTS.md - all agents must follow these rules. Read them in full, not offset reading.
Description: This document provides guidelines for developers working on the HiveMind plugin.
---


**Context:** `hivemind-plugin` is an OpenCode plugin for context governance (version 2.6.0).


# Non-negotiable Rules:

- If there are stacks and/or knowledge that need  up-to-date, you must either make internet or MCP servers' tools research

- SKILLS must be used, approriately and very frequencly,  because by only using correct set of SKILLS you can gain epxertise of knowledge, if can't find ones in this codebase. Use find-skill and you are free and encouraged to install them and use. 

## 1. Build & Test Commands

### Build
- `npm run build` — Full build: cleans dist/, compiles TypeScript, makes CLI executable
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run dev` — Watch mode

### Test
- `npm test` — Run all tests (uses `tsx` test runner)
- `npx tsx --test tests/path/to/test.ts` — Run single test file
  - Example: `npx tsx --test tests/integration.test.ts`

### Lint
- `npm run lint:boundary` — Check SDK boundary compliance

## 2. Code Style Guidelines

### Formatting & Syntax
- **Indentation:** 2 spaces
- **Semicolons:** Avoid (mostly)
- **Quotes:** Double quotes `"string"`
- **Trailing Commas:** Yes, in multi-line objects/arrays

### Imports
- Use `import type` for type-only imports
- **Crucial:** Local imports MUST use `.js` extension (e.g., `import { foo } from "./bar.js"`) — required for NodeNext resolution
- Grouping order: External packages → Internal modules (`../src/`) → Utils

### Naming Conventions
- Variables/Functions: `camelCase` (e.g., `createLogger`, `stateManager`)
- Types/Classes: `PascalCase` (e.g., `HiveMindPlugin`, `BrainState`)
- Constants: `UPPER_CASE` (e.g., `COMMANDS`, `DEFAULT_CONFIG`)
- Files: `kebab-case` (e.g., `session-lifecycle.ts`, `save-mem.ts`)

### TypeScript
- **Strict Mode:** Enabled (`strict: true`)
- **Module Resolution:** NodeNext
- **Error Handling:** Use `unknown` in catch blocks (e.g., `catch (err: unknown)`)
- **Explicit Returns:** Prefer explicit return types for exported functions

### Architecture Patterns
- **CLI Output:** `console.log` allowed ONLY in `src/cli.ts`. Library code must use injected logger.
- **Tools:** Implemented in `src/tools/`, export factory function `createXTool(dir)`
- **Hooks:** Implemented in `src/hooks/`
- **State:** Managed via `src/lib/persistence.ts` (`BrainState`, `Hierarchy`)

## 3. Testing Pattern

Tests use a custom assert helper (no external assertion library):
```typescript
function assert(cond: boolean, name: string) {
  if (cond) { passed++; process.stderr.write(`  PASS: ${name}\n`); }
  else { failed_++; process.stderr.write(`  FAIL: ${name}\n`); }
}
```

Environment setup uses `fs/promises` and `os.tmpdir()` for isolated test dirs.

## 4. Project Structure

```
src/
├── index.ts          # Plugin entry point
├── cli.ts            # CLI commands (only file with console.log)
├── lib/              # Core utilities (persistence.ts, logger.ts)
├── tools/            # 14 tools (declare_intent, map_context, etc.)
├── hooks/            # 4 hooks (tool gate, tracking, system transform, compaction)
└── skills/           # Behavioral governance skills
tests/                # Integration tests
```

## 5. Key Conventions

- State files (`brain.json`, `hierarchy.json`) are managed by tools — don't edit manually
- Tools must be idempotent — safe to call multiple times
- All paths use `.hivemind/` as the state directory
- Governance modes: `strict` | `assisted` | `permissive`
- Tests must pass before committing: `npm test && npm run typecheck`

## 6. Git Commit Guidelines

1. Commit tool changes with their tests together
2. Keep commits focused: one feature/bugfix per commit
3. Run `npm test` before committing if tests are affected
4. Update `CHANGELOG.md` for user-facing changes

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



