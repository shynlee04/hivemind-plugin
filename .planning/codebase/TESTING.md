# Hivemind — Testing Guide

> **Source:** Extracted from `vitest.config.ts`, `vitest.setup.ts`, `tests/`, `eval/`, `package.json`, and codebase-wide pattern analysis.
> **Last updated:** 2026-06-02

---

## Table of Contents

1. [Test Framework](#1-test-framework)
2. [Test Locations & Organization](#2-test-locations--organization)
3. [Running Tests](#3-running-tests)
4. [Coverage Configuration](#4-coverage-configuration)
5. [Test Patterns](#5-test-patterns)
6. [Mocking Approach](#6-mocking-approach)
7. [Setup & Teardown Patterns](#7-setup--teardown-patterns)
8. [Integration Tests](#8-integration-tests)
9. [Eval Tests](#9-eval-tests)
10. [CI Integration](#10-ci-integration)
11. [Writing New Tests](#11-writing-new-tests)
12. [Testing Best Practices](#12-testing-best-practices)
13. [Phase Conformance Tests](#13-phase-conformance-tests)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Test Framework

### Framework: Vitest

The project uses **Vitest v4** with the following configuration:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,                       // describe, it, expect available without imports
    include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      provider: 'v8',                    // V8 native coverage
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 75,
        branches: 62,
        functions: 80,
        lines: 77,
      },
    },
  },
})
```

### Key Configuration Points

| Setting | Value | Rationale |
|---------|-------|-----------|
| `globals: true` | Enabled | `describe`, `it`, `expect`, `vi` available globally — no imports needed in test files |
| `include` | `tests/**/*.test.ts`, `eval/**/*.test.ts` | Standard + eval test suites |
| `setupFiles` | `vitest.setup.ts` | Temp state directory creation before each run |
| Coverage provider | `v8` | Native V8 JavaScript coverage — faster than Istanbul |
| Coverage reporters | `text`, `lcov`, `json-summary` | Human-readable + CI-parsable (JSON) + IDE integration (lcov) |

### Globals Available

Because `globals: true`, the following are available without import:

```typescript
describe('suite', () => { ... })    // Test suite
it('test case', () => { ... })      // Test case
expect(value).toBe(expected)        // Assertion
vi.fn()                             // Mock factory
vi.spyOn(obj, 'method')             // Spy
vi.mock('module')                   // Module mock
beforeEach(() => { ... })           // Setup hook
afterEach(() => { ... })            // Teardown hook
```

**Important:** While `globals: true` makes these available, some test files still explicitly import them for clarity:

```typescript
// Either style is acceptable:
import { describe, it, expect } from "vitest"
// or using globals (no import)
```

---

## 2. Test Locations & Organization

### Directory Structure

```
tests/
├── lib/                          # Unit tests (106 files) — mirrors src/ modules
│   ├── helpers.test.ts           #   Pure function tests
│   ├── state.test.ts             #   TaskStateManager tests
│   ├── continuity.test.ts        #   Continuity store tests
│   ├── delegation-manager.test.ts #   DelegationManager tests
│   ├── completion-detector.test.ts # Completion detection tests
│   ├── session-api.test.ts       #   SDK wrapper tests
│   ├── runtime-policy.test.ts    #   Runtime policy tests
│   ├── lifecycle-manager.test.ts #   Lifecycle state machine tests
│   ├── config-compiler.test.ts   #   Config compiler tests
│   ├── helpers/                  #   Shared test utilities
│   │   └── in-memory-client.ts   #   In-memory OpenCode client for tests
│   ├── agent-work-contracts/     #   Work contract store tests
│   ├── behavioral-profile/       #   Behavioral profile tests
│   ├── command-engine/           #   Command engine tests
│   ├── config-workflow/          #   Config workflow tests
│   ├── continuity/               #   Continuity submodule tests
│   ├── control-plane/            #   Control plane tests
│   ├── coordination/             #   Coordination tests
│   ├── delegation/               #   Delegation submodule tests
│   ├── doc-intelligence/         #   Doc intelligence tests
│   ├── features/                 #   Feature module tests
│   ├── helpers/                  #   Helper utility tests
│   ├── prompt-packet/            #   Prompt packet tests
│   ├── pty/                      #   PTY background command tests
│   ├── runtime-pressure/         #   Runtime pressure tests
│   ├── security/                 #   Security module tests
│   ├── session-entry/            #   Session entry tests
│   ├── session-tracker/          #   Session tracker tests
│   ├── spawner/                  #   Spawner tests
│   ├── tmux/                     #   Tmux integration tests
│   └── trajectory/               #   Trajectory tests
│
├── tools/                        # Tool tests (30 files)
│   ├── delegate-task.test.ts     #   Delegate task tool tests
│   ├── delegation-status.test.ts #   Delegation status tool tests
│   ├── execute-slash-command.test.ts
│   ├── dispatch-command.test.ts
│   ├── hivemind-doc.test.ts      #   Doc intelligence tool tests
│   ├── hivemind-trajectory.test.ts
│   ├── hivemind-pressure.test.ts
│   ├── hivemind-command-engine.test.ts
│   ├── bootstrap-init.test.ts
│   ├── configure-primitive.test.ts
│   ├── validate-restart.test.ts
│   ├── prompt-analyze.test.ts
│   ├── prompt-skim.test.ts
│   ├── session-journal-export.test.ts
│   ├── session-patch.test.ts
│   ├── run-background-command.test.ts
│   └── delegation/               #   Delegation tool submodule
│       └── ...

├── hooks/                        # Hook tests (27 files)
│   ├── create-core-hooks.test.ts
│   ├── create-session-hooks.test.ts
│   ├── create-tool-guard-hooks.test.ts
│   ├── hook-cqrs-boundary.test.ts
│   ├── session.test.ts
│   ├── delegation.test.ts
│   ├── completion.test.ts
│   ├── continuity.test.ts
│   ├── contract-enforcement.test.ts
│   ├── auth.test.ts
│   ├── plugin-event-observers.test.ts
│   ├── tools.test.ts
│   ├── session-tracker.test.ts
│   ├── task-management.test.ts
│   ├── governance-block.test.ts
│   ├── governance-evaluator.test.ts
│   ├── tool-after-composer.test.ts
│   ├── guards/
│   ├── observers/
│   └── transforms/

├── integration/                  # Cross-module integration tests (15 files)
│   ├── delegation-manager.test.ts
│   ├── delegation-dispatcher.test.ts
│   ├── delegation-tools.test.ts
│   ├── delegation-v2-integration.test.ts
│   ├── delegation-session-intelligence.test.ts
│   ├── continuity-store.test.ts
│   ├── continuity-delegation-persistence.test.ts
│   ├── completion-detector.test.ts
│   ├── completion-notification-handler.test.ts
│   ├── session-tracker-lifecycle.test.ts
│   ├── session-tracker-persistence.test.ts
│   ├── hook-registration.test.ts
│   ├── tool-registration.test.ts
│   ├── prompt-enhance-pipeline.test.ts
│   └── user-install.test.ts

├── features/                     # Feature tests (54 files)
│   ├── session-tracker/          #   Session tracker feature tests
│   ├── runtime-pressure/         #   Runtime pressure tests
│   ├── auto-loop/                #   Auto-loop tests
│   └── ...

├── cli/                          # CLI tests (8 files)
├── schema-kernel/                # Schema validation tests (5 files)
├── task-management/              # Task management tests (5 files)
├── shared/                       # Shared module tests (2 files)
├── sidecar/                      # Sidecar tests (1 file)
├── plugin/                       # Plugin tests (1 file)
├── plugins/                      # Plugin integration tests (1 file)
├── coordination/                 # Coordination tests (1 file)
└── CP-ST-03-01-excision.test.ts  # Standalone excision test

eval/                             # Evaluation tests (3 files)
├── coherence.test.ts
├── correctness.test.ts
└── stability.test.ts
```

### File Count Summary (as of 2026-06-02)

| Directory | Test Files | Purpose |
|-----------|-----------|---------|
| `tests/lib/` | 106 | Unit tests for individual modules |
| `tests/features/` | 54 | Feature-level tests |
| `tests/tools/` | 30 | Tool implementation tests |
| `tests/hooks/` | 27 | Hook factory tests |
| `tests/integration/` | 15 | Cross-module integration tests |
| `tests/cli/` | 8 | CLI substrate tests |
| `tests/schema-kernel/` | 5 | Schema validation tests |
| `tests/task-management/` | 5 | Task management tests |
| `tests/shared/` | 2 | Shared module tests |
| `tests/sidecar/` | 1 | Sidecar tests |
| `tests/plugin/` | 1 | Plugin tests |
| `tests/plugins/` | 1 | Plugin integration tests |
| `tests/coordination/` | 1 | Coordination tests |
| `eval/` | 3 | Evaluation tests |
| **Total** | **260** | |

---

## 3. Running Tests

### Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (vitest run) |
| `npm run test:watch` | Watch mode — re-run on file changes |
| `npm run test:coverage` | Run tests with coverage report |
| `npx vitest run <file>` | Run a single test file |
| `npx vitest run -t "<pattern>"` | Run tests matching name pattern |
| `npx vitest run --reporter=verbose` | Verbose output |
| `npx vitest --ui` | Start Vitest UI (interactive browser interface) |

### Running Specific Tests

```bash
# Single file
npx vitest run tests/lib/helpers.test.ts

# Test name pattern match
npx vitest run -t "isObject"

# Directory
npx vitest run tests/integration/

# Module subset
npx vitest run tests/tools/

# With custom config
npx vitest run --config vitest.config.ts

# Excluding integration tests (fast pass)
npx vitest run tests/lib/ tests/tools/ tests/hooks/
```

### Test Counts

- **257** test files in `tests/`
- **3** eval files in `eval/`
- **~2,963** total tests (as of v0.1.0, all passing, 2 skipped)
- **~1,163** tests under Node 20 baseline

---

## 4. Coverage Configuration

### Current Thresholds

| Metric | Threshold | Current Actual (Node 20) |
|--------|-----------|------------------------|
| Statements | 75% | ~89.94% |
| Branches | 62% | ~79.25% |
| Functions | 80% | ~92.38% |
| Lines | 77% | ~90.95% |

**Note:** Thresholds are intentionally set ~5pp below actual measured coverage to absorb normal churn while catching regressions. The floor is raised as coverage improves.

### Coverage Exclusions

The following are excluded from coverage:

| Pattern | Reason |
|---------|--------|
| `src/index.ts` | Barrel re-exports only — no logic |
| `src/**/index.ts` | Module barrel files — no logic |

### Coverage Reporters

| Reporter | Format | Purpose |
|----------|--------|---------|
| `text` | Console output | Human-readable summary in terminal |
| `lcov` | `coverage/lcov.info` | IDE integration (VS Code, WebStorm) |
| `json-summary` | `coverage/coverage-summary.json` | CI parsing, automation |

### Checking Coverage

```bash
# Full coverage report
npm run test:coverage

# View in terminal (text reporter)
npx vitest run --coverage

# Generate LCOV for IDE
open coverage/lcov-report/index.html    # HTML report
```

---

## 5. Test Patterns

### Unit Test Pattern

The dominant pattern uses `describe`/`it` blocks with grouped assertions:

```typescript
import { describe, expect, it } from "vitest"
import { isObject, getNestedValue } from "../../src/shared/helpers.js"

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false)
  })
})
```

### Section Organization Pattern

Tests use `// ----` separator comments for logical grouping:

```typescript
describe("TaskStateManager", () => {
  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------
  describe("construction", () => {
    it("constructs with empty state", () => { ... })
  })

  // -------------------------------------------------------------------------
  // Session stats
  // -------------------------------------------------------------------------
  describe("session stats", () => {
    it("ensureStats creates new stats", () => { ... })
  })
})
```

### Function-Level Test Structure

Tests for individual functions follow boundary-value analysis:

```typescript
describe("functionName", () => {
  it("handles normal input", () => { ... })       // Happy path
  it("handles edge case", () => { ... })           // Boundary
  it("handles null/undefined", () => { ... })       // Null safety
  it("throws on invalid input", () => { ... })      // Error case
  it("handles empty/zero values", () => { ... })    // Empty state
})
```

### Class/Module Test Structure

Tests for classes or modules follow:

1. **Construction** — does it build?
2. **Happy path** — does the main flow work?
3. **Edge cases** — boundaries, limits, empty states
4. **Error cases** — invalid input, missing dependencies, timeouts
5. **State transitions** — does state change correctly?

### Assertion Style

```typescript
// Primitive assertions
expect(value).toBe(expected)
expect(value).toBe(true)
expect(value).toBeUndefined()

// Object/array assertions
expect(result).toEqual({ id: "test", status: "completed" })
expect(result).toMatchObject({ status: "completed" })  // Partial match
expect(arr).toContain("expected-value")
expect(arr.length).toBe(25)

// Error assertions
expect(() => fn()).toThrow(/^\[Harness\]/)
expect(fn).toThrowError("[Harness] Specific error message")

// Function call assertions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ agent: "builder" }))
expect(mockFn).toHaveBeenCalledTimes(1)

// Async assertions
await expect(asyncFn()).resolves.toEqual({ status: "dispatched" })
await expect(asyncFn()).rejects.toThrow("[Harness]")
```

---

## 6. Mocking Approach

### Mock Strategy

The project uses **Vitest's built-in mocking** (`vi.fn()`, `vi.spyOn()`, `vi.mock()`) — no external mocking libraries:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
```

### Mock Factories (vi.fn())

The primary mock pattern creates inline mock functions with `vi.fn()`:

```typescript
// Simple stub
const myFunc = vi.fn()

// Stub with return value
const myFunc = vi.fn().mockResolvedValue({ status: "dispatched", id: "del_123" })
const myFunc = vi.fn().mockReturnValue("fixed-value")

// Stub with implementation
const myFunc = vi.fn(async (args) => {
  return { status: "completed", result: `processed-${args.id}` }
})

// Incrementing stub
let callCount = 0
const dispatcher = vi.fn(async () => `result-${++callCount}`)
```

### Mock Client Objects

Complex mock objects are built with typed interface stubs:

```typescript
type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    promptAsync: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    messages: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }
  app: {
    agents: ReturnType<typeof vi.fn>
  }
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      promptAsync: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      messages: vi.fn().mockResolvedValue({ data: [] }),
      abort: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      agents: vi.fn().mockResolvedValue([{ name: "builder" }]),
    },
  }
}
```

### In-Memory Client (Shared Utility)

`tests/lib/helpers/in-memory-client.ts` provides a reusable in-memory OpenCode client:

```typescript
import { createInMemoryClient } from "../helpers/in-memory-client.js"

const client = createInMemoryClient()
// client._sessions — Map of sessions (read/write)
// client._messages — Map of messages (read/write)
// client._setStatus(sessionId, type) — Set session status
// client._addMessage(sessionId, message) — Append message
```

Features:
- Sessions stored in memory (`Map<string, SessionRecord>`)
- Auto-incrementing session IDs (`ses_1`, `ses_2`, ...)
- Status tracking and manipulation
- Message accumulation
- Error injection via `_setGetSessionError()`

### Spy Pattern (vi.spyOn)

```typescript
// Spy on a class method
const idleSpy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")

// Spy on a module import (after dynamic import for ESM)
const { DelegationManager } = await import("../../src/coordination/delegation/manager.js")
const dispatchSpy = vi.spyOn(DelegationManager.prototype, "dispatch")

// Verify call
expect(idleSpy).toHaveBeenCalledWith("child-from-info-id")
```

### Module Mocking (vi.mock)

```typescript
// Mock a module before imports
vi.mock("node:fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({ data: "test" })),
}))

// Dynamic mock with vi.doMock (within test)
import { vi } from "vitest"
vi.doMock("../../src/config/subscriber.js", () => ({
  getConfig: vi.fn().mockReturnValue({ delegation: { enabled: true } }),
}))
```

### Reset/Restore Patterns

```typescript
afterEach(() => {
  vi.restoreAllMocks()     // Restore all spies to original
  vi.resetAllMocks()       // Reset all mocks (clear calls/returns)
  vi.doUnmock("node:fs")   // Unmock specific module
  vi.resetModules()         // Reset module registry for fresh imports
})
```

---

## 7. Setup & Teardown Patterns

### Standard BeforeEach/AfterEach

The most common pattern — create temp state directory, clean up after:

```typescript
let tempDir: string | undefined
let prevStateDir: string | undefined

beforeEach(() => {
  prevStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  tempDir = mkdtempSync(join(tmpdir(), "test-prefix-"))
  process.env.OPENCODE_HARNESS_STATE_DIR = tempDir
})

afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
  if (prevStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = prevStateDir
  }
})
```

### Environment Variable Management

```typescript
// Save, override, restore pattern
let previousStateDir: string | undefined

beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  process.env.OPENCODE_HARNESS_STATE_DIR = tempDir
})

afterEach(() => {
  if (previousStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
  }
})
```

### vitest.setup.ts

```typescript
// Runs once before ALL tests
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const stateDir = mkdtempSync(join(tmpdir(), "vitest-state-"))
process.env.OPENCODE_HARNESS_STATE_DIR = join(stateDir, "state")
```

Creates a temp state directory for the entire test run, preventing cross-test contamination of `.hivemind/state/` files.

### Temp File Cleanup

```typescript
// Always clean up temp files
afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

afterAll(() => {
  // Clean up vitest.setup.ts temp dir
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
```

---

## 8. Integration Tests

### Purpose

Integration tests verify cross-module behavior — how modules interact in realistic scenarios:

```
tests/integration/
├── delegation-manager.test.ts           # DelegationManager + coordinator + lifecycle
├── delegation-dispatcher.test.ts        # Dispatcher + agent-resolver + slot-manager
├── delegation-tools.test.ts             # Tool surface + delegation manager
├── delegation-v2-integration.test.ts    # V2 delegation end-to-end
├── delegation-session-intelligence.test.ts  # Session stacking + intelligence
├── continuity-store.test.ts             # Continuity persistence + recovery
├── continuity-delegation-persistence.test.ts  # Delegation records persistence
├── completion-detector.test.ts          # CompletionDetector + message analysis
├── completion-notification-handler.test.ts   # Notification routing + delivery
├── session-tracker-lifecycle.test.ts    # Session tracker module imports
├── session-tracker-persistence.test.ts  # Tracker file I/O
├── hook-registration.test.ts            # Hook factory integration
├── tool-registration.test.ts            # Tool factory integration
└── user-install.test.ts                 # Full install simulation
```

### Integration Test Pattern

```typescript
describe("integration — delegation manager", () => {
  it("creates DelegationManager without client when v2 modules are injected", () => {
    const coordinator = {
      chain: vi.fn(),
      dispatch: vi.fn(),
    }
    const lifecycle = {
      getChildSessionId: vi.fn(),
      getStatus: vi.fn(),
      list: vi.fn(),
      markAborted: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
      markCancelled: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
    }
    const mgr = new DelegationManager(undefined as never, { coordinator, lifecycle })
    expect(mgr).toBeInstanceOf(DelegationManager)
  })

  it("dispatches through coordinator when available", async () => {
    const dispatch = vi.fn().mockResolvedValue({ id: "del_001", status: "dispatched" })
    const coordinator = { chain: vi.fn(), dispatch }
    // ... rest of setup
    const result = await mgr.dispatch({ agent: "test-agent", prompt: "do work" } as never)
    expect(result.status).toBe("dispatched")
  })
})
```

### Import Verification Tests

Session-tracker lifecycle tests verify module imports without executing:

```typescript
describe("integration — session tracker lifecycle", () => {
  it("imports session-tracker index without error", async () => {
    const mod = await import("../../src/features/session-tracker/index.js")
    expect(mod).toBeDefined()
    expect(typeof mod).toBe("object")
  }, 15000)  // 15s timeout for dynamic import

  it("imports child-recorder module", async () => {
    const mod = await import("../../src/features/session-tracker/child-recorder.js")
    expect(mod).toBeDefined()
  })
})
```

---

## 9. Eval Tests

### Purpose

Eval tests in `eval/` measure behavioral characteristics of the built system:

| File | Purpose |
|------|---------|
| `coherence.test.ts` | Tests that the system behaves consistently across similar inputs |
| `correctness.test.ts` | Tests that outputs match expected results |
| `stability.test.ts` | Tests that the system handles edge cases without crashing |

Eval tests are included in the regular test run via `include: ['eval/**/*.test.ts']` in vitest config.

---

## 10. CI Integration

### Pre-Commit Checks

Before committing, run:

```bash
npm run typecheck    # Must pass with zero errors
npm test             # All tests must pass
```

### CI Pipeline (Expected)

The project is expected to run in CI:

1. **Checkout** — fetch repository
2. **Install** — `npm ci`
3. **Build** — `npm run build`
4. **TypeCheck** — `npm run typecheck`
5. **Test** — `npm test`
6. **Coverage** — `npm run test:coverage`
   - Coverage thresholds enforced in vitest config (statements 75%, branches 62%, functions 80%, lines 77%)
   - JSON summary emitted for CI parsing
   - LCOV report for IDE integration
7. **Gate** — Coverage thresholds gate the build; failure blocks merge

### Test Isolation

Each test file creates its own temporary state directory via `mkdtempSync` in `beforeEach`. The `vitest.setup.ts` file creates a global temp state directory that tests can override. Key principles:

- **No shared mutable state between test files**
- **Environment variables saved/restored** in each test suite
- **Temp files cleaned up** in `afterEach`/`afterAll`
- **Vitest module isolation** via `vi.resetModules()` and dynamic `import()`

---

## 11. Writing New Tests

### Test File Location

Place test files to mirror the source structure:

| Source File | Test File | Notes |
|-------------|-----------|-------|
| `src/shared/helpers.ts` | `tests/lib/helpers.test.ts` | Unit test in `lib/` |
| `src/tools/delegation/delegate-task.ts` | `tests/tools/delegate-task.test.ts` | Tool test in `tools/` |
| `src/hooks/lifecycle/core-hooks.ts` | `tests/hooks/create-core-hooks.test.ts` | Hook test in `hooks/` |
| `src/coordination/delegation/manager.ts` | `tests/lib/delegation-manager.test.ts` | Can go in `lib/` or `integration/` |
| Cross-module | `tests/integration/<name>.test.ts` | Integration test |

### Test File Template

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

// Import source under test
import { YourModule } from "../../src/path/to/module.js"

// --- Setup ---
let tempDir: string | undefined
let previousStateDir: string | undefined

beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  tempDir = mkdtempSync(join(tmpdir(), "your-test-"))
  process.env.OPENCODE_HARNESS_STATE_DIR = tempDir
})

afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
  if (previousStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
  }
})

// --- Tests ---
describe("YourModule", () => {
  describe("main behavior", () => {
    it("handles happy path", async () => {
      const result = await YourModule.doSomething("input")
      expect(result).toMatchObject({ status: "completed" })
    })

    it("handles error case", async () => {
      await expect(
        YourModule.doSomething(null)
      ).rejects.toThrow(/^\[Harness\]/)
    })
  })
})
```

### Import Paths

```typescript
// From tests/lib/ to src/ — use relative paths with .js extension
import { helpers } from "../../src/shared/helpers.js"

// From tests/tools/ to src/ — same convention
import { createDelegateTaskTool } from "../../src/tools/delegation/delegate-task.js"
```

### Conventions Summary

| Aspect | Convention |
|--------|-----------|
| File naming | `module-name.test.ts` (kebab-case) |
| Test imports | Same `.js` extension as source |
| Suite naming | `describe("ModuleName", ...)` — PascalCase matching class |
| Test naming | `it("does something", ...)` — present tense, descriptive |
| Separators | `// ----` for logical section grouping |
| Assertions | `toBe()`, `toEqual()`, `toMatchObject()`, `toThrow()` |
| Async | `async/await` throughout (no raw promise chaining) |
| Timeout | Default vitest timeout; use 15s for dynamic imports |

---

## 12. Testing Best Practices

### Do

- **Test the public API** — focus on exported functions and class methods
- **Test edge cases** — empty arrays, null inputs, boundary values
- **Test error paths** — every `throw` should have at least one test
- **Use `toMatchObject()`** for partial object matching in complex results
- **Use `expect.objectContaining()`** for argument matching on spies
- **Isolate tests** — each test file manages its own temp directory
- **Clean up** — remove temp files and restore env vars in `afterEach`
- **Name tests descriptively** — `"throws on invalid session ID"`, not `"bad input"`
- **Group logically** — use `describe` blocks for each function/method

### Don't

- **Don't test private implementation details** — test behavior, not internal state
- **Don't share mutable state between tests** — each test should be independent
- **Don't use `any` types in test mocks** — use typed interfaces
- **Don't rely on test ordering** — each test must pass in isolation
- **Don't skip cleanup** — always clean up temp dirs and env vars
- **Don't over-mock** — prefer real implementations for leaf utilities
- **Don't skip error cases** — error handling is critical runtime behavior

### Testing Philosophy

The Hivemind test suite follows these principles:

1. **Unit tests cover individual module behavior** (106 files in `tests/lib/`)
2. **Tool tests verify the SDK surface** (30 files in `tests/tools/`)
3. **Hook tests verify CQRS boundary compliance** (27 files in `tests/hooks/`)
4. **Integration tests verify cross-module wiring** (15 files in `tests/integration/`)
5. **Feature tests verify complete runtime capabilities** (54 files in `tests/features/`)
6. **Coverage thresholds act as a regression net** — not a target to hit, but a floor not to fall below

---

## 13. Phase Conformance Tests

The project includes phase-specific conformance tests that verify architectural requirements from specific development phases:

```typescript
// tests/lib/phase39-conformance.test.ts
describe("Phase 39 conformance — auto-loop + ralph-loop composition", () => {
  it("runs ralph-loop inside the verifier and reports completed when ralph passes", async () => {
    // Tests: composing auto-loop with ralph-loop
    // Failed verifications in auto-loop → kick into ralph-loop correction cycle
    // Passed verifications → complete auto-loop
    // Warning: [`Harness`] prefix on exhausted ralph errors
  })
})
```

These conformance tests are:
- Annotated with `Phase NN` in description
- Located at `tests/lib/phaseNN-conformance.test.ts` or inline
- Document the phase requirement they verify

---

## 14. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ERR_MODULE_NOT_FOUND` | Missing `.js` extension in import | Add `.js` to all local imports |
| Test fails with `[Harness]` prefix missing | New error thrown without prefix | Add `[Harness]` prefix |
| `TypeError: Cannot read properties of undefined` | Mock not returning expected shape | Check mock return value structure |
| `vi.mock` not working in ESM | Hoisting issues with ESM mocks | Use `vi.doMock` + dynamic `import()` |
| Coverage drop | New code not covered by tests | Add tests for new code paths |
| Temp directory not cleaned | Test failure before cleanup | Use `afterEach` with `force: true` |
| State contamination between tests | Shared state directory | Override `OPENCODE_HARNESS_STATE_DIR` per test |
| Slow test execution | Import-heavy setup | Use `vi.resetModules()` sparingly |
| `globals: true` type errors | TypeScript doesn't know about globals | Ensure `vitest/globals` is in tsconfig types |

### Debug Commands

```bash
# Run with verbose output
npx vitest run --reporter=verbose

# Run single test by file
npx vitest run tests/lib/helpers.test.ts

# Run single test by name
npx vitest run -t "TaskStateManager"

# Run with inline source maps for debugging
npx vitest run --reporter=verbose --no-color

# Generate HTML coverage report
npm run test:coverage
open coverage/index.html

# Watch specific directory
npx vitest run tests/lib/ --watch
```

### Environment Variables

| Variable | Purpose | Set by |
|----------|---------|--------|
| `OPENCODE_HARNESS_STATE_DIR` | State persistence directory | Test setup + vitest.setup.ts |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Continuity file override | Test setup (optional) |
| `NODE_ENV=test` | Enables test-only assertions | vitest |

---

## Appendix: Key Test Files Reference

### Most-Referenced Test Files

| File | Lines | Tests | What It Tests |
|------|-------|-------|---------------|
| `tests/lib/delegation-manager.test.ts` | ~2,976 | ~78 | DelegationManager class — dispatch, monitor, completion detection |
| `tests/lib/helpers.test.ts` | ~505 | ~45 | Pure utility functions |
| `tests/lib/continuity.test.ts` | ~435 | ~25 | Continuity store persistence and recovery |
| `tests/lib/state.test.ts` | ~207 | ~20 | TaskStateManager in-memory state |
| `tests/tools/delegate-task.test.ts` | ~396 | ~20 | Delegate task tool surface |
| `tests/hooks/create-core-hooks.test.ts` | ~400 | ~18 | Core lifecycle hooks |
| `tests/lib/phase39-conformance.test.ts` | ~92 | ~4 | Auto-loop + ralph-loop composition |

### Key Mock/Helper Files

| File | Purpose |
|------|---------|
| `tests/lib/helpers/in-memory-client.ts` | Reusable in-memory OpenCodeClient for tests |
| `vitest.setup.ts` | Global test setup — temp state directory |
| `vitest.config.ts` | Vitest configuration — globals, coverage, includes |

---
