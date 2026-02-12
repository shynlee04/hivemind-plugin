# AGENTS.md — Developer Guide

**Context:** `hivemind-plugin` is an OpenCode plugin for context governance (version 2.6.0).

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
