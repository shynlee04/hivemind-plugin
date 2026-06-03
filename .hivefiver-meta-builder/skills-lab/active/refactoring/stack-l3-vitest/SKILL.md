---
name: stack-l3-vitest
version: 4.1.0
description: Vitest testing framework API reference, patterns, and harness-specific testing conventions
category: stack
triggers:
  - vitest
  - test
  - describe
  - expect
  - "vi.mock"
  - "vi.fn"
  - coverage
  - unit test
  - integration test
  - mock
  - spy
  - benchmark
  - snapshot
  - fixture
  - beforeEach
  - afterEach
  - beforeAll
  - afterAll
  - vitest.config
  - test.extend
metadata:
  consumed-by:
    - "hm-l2-executor"
    - "hm-l2-builder"
    - "hf-l2-tool-builder"
  lineage-scope: "stack"
  access: "OPEN"

---

# Stack: Vitest

> Vitest 4.x — Next-generation testing framework powered by Vite.

## Quick Reference

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

## Navigation

| Topic | File | What You'll Find |
|-------|------|-----------------|
| Assertions | `references/api/assertions.md` | `expect()` + all matchers |
| Mocking & Spying | `references/api/mocking.md` | `vi.mock`, `vi.fn`, `vi.spyOn`, timers, globals |
| Lifecycle | `references/api/lifecycle.md` | `describe`, `it`, `test`, hooks, modifiers |
| Configuration | `references/api/configuration.md` | `vitest.config.ts` options |
| Coverage | `references/api/coverage.md` | V8/Istanbul providers, thresholds, reports |
| Testing Patterns | `references/patterns/testing.md` | Harness-specific test structures |
| Mocking Patterns | `references/patterns/mocking.md` | SDK, delegation, continuity mocking |
| TOC | `TOC.md` | Full table of contents |

## Key Facts

- **Runtime:** Node.js >= 18, Vite-powered transform pipeline
- **Globals mode:** Off by default; enable via `globals: true` in config
- **Jest compatibility:** ~95% API compatible; `jest.fn()` → `vi.fn()`
- **Coverage providers:** `v8` (fast, native) or `istanbul` (instrumented)
- **Browser mode:** Stable since 4.0 (Playwright-managed)
- **New in 4.x:** `aroundEach`/`aroundAll` hooks, `test.describe`/`test.suite`, `toMatchScreenshot()`

## Commands

```bash
npx vitest                    # Watch mode
npx vitest run                # Single run (CI)
npx vitest run --coverage     # With coverage
npx vitest run -t "pattern"   # Run matching tests
npx vitest --ui               # Browser UI
npx vitest bench              # Run benchmarks
```

## This Project's Setup

```typescript
// vitest.config.ts — this project uses:
// - vitest globals: true (no imports needed)
// - coverage provider: v8
// - test location: tests/lib/**, tests/tools/**
// - src coverage: src/**/*.ts (excludes index.ts)
```

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Testing OpenCode plugin tools | `stack-opencode` | ToolContext mock setup, ToolResult shape |
| Testing Zod schemas | `stack-zod` | Schema validation edge cases, v4 migration |
| Test-driven development workflow | `hm-test-driven-execution` | RED/GREEN/REFACTOR cycle patterns |
| Next.js component testing | `stack-nextjs` | Server component mocking, route handler testing |

---

*Stack reference for Vitest 4.x. See `TOC.md` for full navigation.*

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 4.1.0) — Vitest releases every 2-4 weeks; the reference may lag.
2. **Verify against official docs:** https://vitest.dev or `npx --yes ctx7 library vitest "migration guide"`.
3. **Check installed version:** `npx vitest --version` for the project's Vitest version.
4. **New 4.x features** (`aroundEach`/`aroundAll`, `test.describe`, `toMatchScreenshot()`) may have evolved since this reference — check the Vitest changelog if behavior differs.

### When Unsure About API Accuracy
1. **Corroborate with source:** `npx vitest --api` for CLI options, or check TypeScript definitions via `node_modules/vitest/dist/index.d.ts`.
2. **Check bundled references** (`references/api/assertions.md`, `references/api/mocking.md`) — extracted from 4.1.0 behavior.
3. **Project-specific setup (lines 74-80) is static:** If the project's `vitest.config.ts` has been modified, the reference may not reflect current configuration.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-vitest reference (v4.1.0) documents [specific API]. Your project uses Vitest [X.Y.Z] — the API may differ."
2. **Offer verification:** Check the Vitest changelog at https://github.com/vitest-dev/vitest/releases.
3. **Do not override:** The user's `vitest.config.ts` and installed version have final authority.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes v3→v4 migration, browser mode configuration, sharding strategy, snapshot management best practices, V8 vs Istanbul coverage tradeoffs, mock hoisting behavior, and `test.extend` fixture patterns.
2. **Search bundled references** (`references/patterns/testing.md`, `references/patterns/mocking.md`) — project-specific patterns may cover common edge cases.
3. **Check GitHub issues:** `vitest-dev/vitest` for known bugs and workarounds.
4. **Escalate to skill maintainer:** File an update request with version, test configuration, and failing scenario.
