# HiveMind Context Governance - Developer Guide

## Core Architecture
- **Session Lifecycle**: Driven by `src/hooks/session-lifecycle.ts`. This hook fires on every turn, injecting context into the system prompt.
  - Logic extracted to `src/hooks/session-lifecycle-helpers.ts` for testability.
- **Hierarchy Tree**: `src/lib/hierarchy-tree.ts` maintains the `trajectory -> tactic -> action` decision tree.
- **Persistence**: `src/lib/persistence.ts` handles atomic file I/O for state files.
- **Paths**: `src/lib/paths.ts` is the Single Source of Truth for all `.hivemind/` paths.

## Testing
- Run all tests: `npm test`
- Run specific test: `npx tsx --test tests/filename.test.ts`
- **New Convention**: Extract complex hook logic into helper files (e.g., `session-lifecycle-helpers.ts`) and test them in isolation.

## Style & Conventions
- **Indent**: 2 spaces
- **Quotes**: Double quotes
- **Imports**: Use `.js` extension for local imports.
- **Paths**: ALWAYS use `getEffectivePaths` from `src/lib/paths.ts`. NEVER hardcode `.hivemind/` paths.

## Recent Changes (Phase A Verification)
- **Refactor**: `session-lifecycle.ts` split into helpers.
- **Fixes**:
  - Async file locking restored.
  - `fs.copyFile` optimization restored.
  - `flattenTree` iterative implementation restored.
  - `toAsciiTree` truncation and status markers enhanced.
- **Tests**:
  - `tests/session-lifecycle-helpers.test.ts` added.
  - `tests/hierarchy-tree.test.ts` enhanced.
  - `tests/phase-a-verification.test.ts` added.
