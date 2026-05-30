# Contributing to HiveMind

Thank you for your interest in contributing to HiveMind! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/shynlee04/hivemind-plugin/issues) first
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Node.js version, OS, OpenCode version

### Suggesting Features

Open an issue with the `feature-request` label. Include:
- Problem statement (what gap does this fill?)
- Proposed solution
- How it fits the [5 Pillars](./docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md#3-the-5-pillars-of-hivemind-practice)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the [Code Style](#code-style) guidelines
4. Run tests: `npm test`
5. Run type-check: `npm run typecheck`
6. Commit with format: `type(scope): description — why`
7. Push and open a PR

## Development Setup

```bash
git clone https://github.com/shynlee04/hivemind-plugin.git
cd hivemind-plugin
npm install
npm run build
npm test
```

## Code Style

### TypeScript

- **Strict mode** enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- **ES2022 target**, NodeNext module resolution
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports
- **No `any` types** on new code
- **Max 500 LOC per module** (target 300)
- **`[Harness]` prefix** on all thrown errors

### Architecture Rules

- **CQRS enforced**: Tools are write-side (state mutation). Hooks are read-side (observation only).
- **`types.ts` is leaf** — depends on nothing
- **No circular dependencies** — max chain depth is 2 levels
- **Deep-clone-on-read** in continuity store
- **State root separation**: `.hivemind/` for runtime state, `.opencode/` for primitives only

### Testing

- Tests in `tests/` directory, mirroring `src/` structure
- Use vitest globals (`describe`, `it`, `expect` — no imports needed)
- **Always type-check before committing**: `npm run typecheck`
- Coverage thresholds: Statements 85%, Branches 72%, Functions 85%, Lines 85%

### Commit Messages

```
type(scope): description — why

Types: feat, fix, refactor, test, docs, chore
Scope: tools, hooks, lib, schema, cli, docs
```

Examples:
```
feat(tools): add delegation timeout override — prevents orphaned sessions
fix(lib): deep-clone continuity reads — mutation aliasing caused stale state
test(hooks): add auto-loop boundary tests — coverage gap in session hooks
```

## Project Structure

```
src/
├── plugin.ts          # Composition root (zero business logic)
├── tools/             # Write-side tools (17 tools)
├── hooks/             # Read-side hooks (10 factories)
├── lib/               # Core library modules (34 modules)
├── shared/            # Cross-cutting utilities
├── schema-kernel/     # Zod v4 schemas (16 files)
└── cli/               # CLI tools

tests/                 # Test files (mirror src/)
docs/                  # Documentation
```

## Questions?

Open an issue or start a discussion. We're here to help!
