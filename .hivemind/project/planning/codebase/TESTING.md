# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:**
- Node.js built-in test runner via `tsx --test` (no jest, vitest, or mocha)
- `tsx` version specified in `package.json` devDependencies
- Config: None — no `jest.config.*`, `vitest.config.*`, or similar config file exists

**Assertion Libraries:**
- **Modern style (69 files):** `node:assert` or `node:assert/strict` with `describe`/`it` from `node:test`
- **Legacy style (36 files):** Custom `assert()` harness with manual pass/fail counters

**Pre-test Gate:**
- `scripts/check-sdk-boundary.sh` runs before all tests
- Enforces: `src/lib/` must NEVER import from `@opencode-ai/*`
- Failure here blocks the entire test suite

**Run Commands:**
```bash
npm test                                    # Run SDK boundary check + all top-level tests
npx tsx --test tests/*.test.ts              # Run top-level tests only (same as npm test minus boundary check)
npx tsx --test tests/filename.test.ts       # Run a single specific test file
npx tsx --test tests/hooks/*.test.ts        # Run all hook tests
npx tsx --test tests/lib/*.test.ts          # Run all lib tests
npx tsx --test tests/code-intel/*.test.ts   # Run all code-intel tests
npx tsx --test tests/schemas/*.test.ts      # Run all schema tests
```

**CRITICAL:** The `npm test` script only runs `tests/*.test.ts` (top-level). Subdirectory tests (`tests/hooks/`, `tests/lib/`, `tests/schemas/`, `tests/code-intel/`) must be run separately or explicitly. This is a known gap — see CONCERNS.md.

## Test File Organization

**Location:**
- All tests live in `tests/` at project root (NOT co-located with source)
- Source is in `src/`, tests mirror the source structure under `tests/`

**Directory Structure:**
```
tests/
├── *.test.ts                    # Top-level tests (63 files) — run by npm test
├── hooks/                       # Hook-specific tests (7 files)
│   ├── event-handler-todo-2026-02-15.test.ts
│   ├── hf-harden-08-no-any-red.test.ts
│   ├── hf-harden-09-no-any-red.test.ts
│   ├── hf-harden-10-event-handler-no-any-red.test.ts
│   ├── messages-transform-checklist.test.ts
│   ├── session-lifecycle-constitution.test.ts
│   └── soft-governance-checklist.test.ts
├── lib/                         # Library-specific tests (16 files)
│   ├── auto-context.test.ts
│   ├── cognitive-packer-digest.test.ts
│   ├── entity-checklist.test.ts
│   ├── governance-instruction.test.ts
│   ├── hf-harden-11-persistence-no-any-red.test.ts
│   ├── hf-harden-12-planning-fs-no-any-red.test.ts
│   ├── hivefiver-integration.test.ts
│   ├── hivefiver-ralph-bridge.test.ts
│   ├── lifecycle-lineage-snapshot-red.test.ts
│   ├── manifest-tasks-2026-02-15.test.ts
│   ├── max-compaction-enforcement.test.ts
│   ├── orphan-quarantine-extraction-red.test.ts
│   ├── session-engine-resume-path.test.ts
│   ├── session-export-enhanced.test.ts
│   ├── state-mutation-queue-audit.test.ts
│   └── state-mutation-queue.test.ts
├── schemas/                     # Schema validation tests (3 files)
│   ├── brain-state-classification.test.ts
│   ├── co-design-sprint.test.ts
│   └── governance-constitution.test.ts
└── code-intel/                  # Code intelligence tests (19 files)
    ├── binary-detector.test.ts
    ├── codemap-red.test.ts
    ├── file-scanner.test.ts
    ├── gitignore-filter.test.ts
    ├── hivemind-codemap.test.ts
    ├── ideation-engine.test.ts
    ├── phase2-*.test.ts          # Phase 2 code-intel tests
    ├── phase3-*.test.ts          # Phase 3 code-intel tests
    ├── phase7-*.test.ts          # Phase 7 code-intel tests
    ├── secret-detector.test.ts
    └── token-counter.test.ts
```

**Naming Conventions:**
- Pattern: `kebab-case.test.ts`
- Date-stamped tests: `{name}-{YYYY-MM-DD}.test.ts` (e.g., `event-handler-todo-2026-02-15.test.ts`)
- Red/regression tests: `{name}-red.test.ts` suffix — indicates TDD-first tests written before implementation
- Hardening tests: `hf-harden-{NN}-{description}-red.test.ts` — type-safety enforcement tests (e.g., no `any`)
- Phase-prefixed: `phase{N}-{description}.test.ts` — tied to specific development phases
- Cycle-prefixed: `cycle{N}-{description}-red.test.ts` — regression tests from development cycles

**Total Stats:**
- ~100+ test files
- ~39,064 total lines of test code
- Largest: `tests/integration.test.ts` (1,844 lines)

## Test Structure — Two Harness Styles

### Style 1: Legacy Custom Harness (36 files)

Used by older/core tests. Explicit function calls, manual counting, `process.exit(1)` on failure.

```typescript
// From tests/hierarchy-tree.test.ts

// ─── Harness ─────────────────────────────────────────────────────────

let passed = 0;
let failed_ = 0;
function assert(cond: boolean, name: string) {
  if (cond) { passed++; process.stderr.write(`  PASS: ${name}\n`); }
  else { failed_++; process.stderr.write(`  FAIL: ${name}\n`); }
}

// ─── Tests ───────────────────────────────────────────────────────────

function test_stamps() {
  process.stderr.write("\n--- stamps ---\n");
  const stamp = generateStamp(TEST_DATE);
  assert(stamp.length === 12, "generateStamp produces 12-char string");
}

// ─── Runner ──────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== hierarchy-tree.test.ts ===\n");
  test_stamps();
  test_crud();
  // ... more test functions
  process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`);
  if (failed_ > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Key characteristics:**
- `let passed = 0; let failed_ = 0` (note underscore to avoid name collision)
- Custom `assert(cond: boolean, name: string)` function
- Output to `process.stderr` (not stdout)
- Section headers: `process.stderr.write("\n--- section-name ---\n")`
- File header: `process.stderr.write("=== filename.test.ts ===\n")`
- Explicit `main()` runner at bottom
- `process.exit(1)` if any failures
- Some files use `check()` instead of `assert()` (e.g., `tests/governance-stress.test.ts`)

### Style 2: Modern `node:test` (69 files)

Used by newer tests. Standard `describe`/`it` blocks, `node:assert`.

```typescript
// From tests/lib/state-mutation-queue.test.ts

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

describe("State Mutation Queue", () => {
  beforeEach(() => {
    clearMutationQueue();
  });

  afterEach(() => {
    clearMutationQueue();
  });

  describe("queueStateMutation", () => {
    it("adds mutation to queue", () => {
      queueStateMutation({
        type: "UPDATE_METRICS",
        payload: { metrics: { turn_count: 5 } as BrainState["metrics"] },
        source: "test-hook",
      });
      assert.strictEqual(getPendingMutationCount(), 1);
    });
  });
});
```

**Key characteristics:**
- `import { describe, it, beforeEach, afterEach } from "node:test"`
- `import assert from "node:assert"` or `import assert from "node:assert/strict"`
- Standard `describe`/`it` nesting
- Some use `test()` instead of `it()` (e.g., `tests/lib/session-engine-resume-path.test.ts`)
- Lifecycle hooks: `beforeEach`/`afterEach` or `before`/`after`

**Which style to use for new tests:** Use the **modern `node:test` style**. The legacy harness predates the migration and should not be added to.

## Mocking Patterns

### noopLogger

Every test that needs a `Logger` uses `noopLogger`:

```typescript
// From src/lib/logging.ts — exported for test use
export const noopLogger: Logger = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
  debug: async () => {},
};

// Usage in tests:
import { noopLogger } from "../src/lib/logging.js";
const hook = createToolGateHookInternal(noopLogger, dir, config);
```

### Capturing Logger

When tests need to verify log output:

```typescript
// From tests/persistence-locking.test.ts
const logs: string[] = [];
const logger = {
  debug: async (msg: string) => { logs.push(`DEBUG: ${msg}`) },
  info: async (msg: string) => { logs.push(`INFO: ${msg}`) },
  warn: async (msg: string) => { logs.push(`WARN: ${msg}`) },
  error: async (msg: string) => { logs.push(`ERROR: ${msg}`) },
};
// ... after operation:
const hasLog = logs.some((line) => line.includes("WARN: Removed stale lock file"));
assert(hasLog, "stale lock recovery emits warning log");
```

### Mock StateManager

```typescript
// From tests/lib/state-mutation-queue.test.ts
function createMockStateManager(initialState: BrainState | null): StateManager {
  let state = initialState;
  return {
    load: async () => state,
    save: async (newState: BrainState) => { state = newState; },
    withState: async (fn) => {
      if (!state) return null;
      state = await fn(state);
      return state;
    },
    initialize: async (sessionId, config) => {
      state = createBrainState(sessionId, config);
      return state;
    },
    exists: () => state !== null,
  };
}
```

### Mock SDK Context (for tool tests)

```typescript
// From tests/integration.test.ts
const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any;
```

### Mock Toast / SDK Client

```typescript
// From tests/governance-stress.test.ts
const toasts: Array<{ message: string; variant: string }> = [];
initSdkContext({
  client: {
    tui: {
      showToast: async ({ body }: any) => {
        toasts.push({ message: body.message, variant: body.variant });
      },
    },
  } as any,
  $: (() => {}) as any,
  serverUrl: new URL("http://localhost:3000"),
} as any);
```

**What to mock:**
- Logger (always — use `noopLogger` or capturing logger)
- SDK context (for tool/hook tests — the `@opencode-ai` SDK is not available in test)
- StateManager (when testing mutation queue or state logic in isolation)

**What NOT to mock:**
- Filesystem — use real `mkdtemp()` temp directories instead
- Schemas/validators — test against real Zod schemas
- Brain state factory functions — use real `createBrainState()`
- Config factory — use real `createConfig()`

## Fixtures and Factories

**No fixture files exist.** Test data is created inline using factory functions from source.

### Factory Pattern (preferred):

```typescript
// State factories — from src/schemas/brain-state.js and src/schemas/config.js
import { createBrainState, generateSessionId } from "../src/schemas/brain-state.js";
import { createConfig } from "../src/schemas/config.js";

const config = createConfig({ governance_mode: "strict" });
const state = createBrainState(generateSessionId(), config);
```

### Helper Builders (test-local):

```typescript
// From tests/hierarchy-tree.test.ts
function buildThreeLevelTree() {
  const root = createNode("trajectory", "Build auth system", "active", TEST_DATE);
  const tactic = createNode("tactic", "JWT validation", "active", new Date(2026, 1, 11, 14, 35));
  const action = createNode("action", "Write middleware", "active", new Date(2026, 1, 11, 14, 40));

  let tree = createTree();
  tree = setRoot(tree, root);
  const tacticResult = addChild(tree, root.id, tactic);
  if (tacticResult.success) tree = tacticResult.tree;
  const actionResult = addChild(tree, tactic.id, action);
  if (actionResult.success) tree = actionResult.tree;
  return { tree, root, tactic, action };
}
```

### Deterministic Dates:

```typescript
// From tests/hierarchy-tree.test.ts
const TEST_DATE = new Date(2026, 1, 11, 14, 30);
const TEST_STAMP = "301411022026";
```

**Location:** All factory helpers are defined inline within each test file. There is no shared `tests/helpers/` or `tests/fixtures/` directory.

## Setup and Teardown

**Real Filesystem Pattern (universal):**

Every test that needs state creates a temp directory and cleans up after:

```typescript
// Setup
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

let tmpDir: string;

async function setup(): Promise<string> {
  tmpDir = await mkdtemp(join(tmpdir(), "hm-test-"));
  await initializePlanningDirectory(tmpDir);  // Creates .hivemind/ structure
  return tmpDir;
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
}
```

**Mutation Queue Reset:**

Tests using the CQRS mutation queue MUST clear it in setup/teardown:

```typescript
import { clearMutationQueue } from "../src/lib/state-mutation-queue.js";

// Before each test
clearMutationQueue();

// After each test
clearMutationQueue();
```

**SDK Context Reset:**

Tests using toast/SDK features must reset:

```typescript
import { initSdkContext, resetSdkContext } from "../src/hooks/sdk-context.js";
import { resetToastCooldowns } from "../src/hooks/soft-governance.js";

// After tests
resetSdkContext();
resetToastCooldowns();
```

## Coverage

**Requirements:** None enforced. No coverage tool is configured.

**No coverage commands exist.** There is no `--coverage` flag, no `c8`, no `istanbul`, no `nyc` in the project.

**Informal coverage tracking:** Test filenames often correspond 1:1 with source files (e.g., `tests/hierarchy-tree.test.ts` → `src/lib/hierarchy-tree.ts`), but this is not enforced.

## Test Types

### Unit Tests (majority)
- Test individual functions/modules in isolation
- Use factory functions to create state objects
- Real filesystem via temp directories
- Examples: `tests/schemas.test.ts`, `tests/hierarchy-tree.test.ts`, `tests/string-utils.test.ts`

### Integration Tests
- Test multi-tool workflows end-to-end
- Full lifecycle: `init → session(start) → session(update) → session(close)`
- Example: `tests/integration.test.ts` (1,844 lines — largest test file)

### Regression Tests (`-red` suffix)
- Written TDD-style: test written BEFORE implementation (initially red, then turned green)
- 14+ files with `-red` suffix
- Cover specific bugs, hardening requirements, and phase milestones
- Examples: `tests/phase5-canonical-governance-red.test.ts`, `tests/wave2-gap-hierarchy-red.test.ts`

### Architecture/Structural Tests
- Verify source code structure rather than runtime behavior
- Read source files and check patterns
- Example from `tests/persistence-locking.test.ts`:
```typescript
function testAsyncExclusiveLockContract(): void {
  const source = readFileSync(join(process.cwd(), "src", "lib", "persistence.ts"), "utf-8");
  const hasAsyncOpen = source.includes('await open(this.lockPath, "wx")');
  assert(hasAsyncOpen, "file lock uses async+exclusive semantics");
}
```
- Example: `tests/hooks/hf-harden-*-no-any-red.test.ts` — verify no `any` types in specific source files

### Hardening Tests (`hf-harden-*`)
- Type-safety enforcement: scan source for `any` usage
- Numbered sequentially: `hf-harden-08` through `hf-harden-12`
- All use `-red` suffix (TDD-first)
- Files: `tests/hooks/hf-harden-08-no-any-red.test.ts` through `tests/lib/hf-harden-12-planning-fs-no-any-red.test.ts`

### Stress Tests
- Test governance behavior under edge conditions
- Example: `tests/governance-stress.test.ts` — permissive mode, high turn counts, toast suppression

## Common Patterns

### Async Testing:

```typescript
// Legacy style — explicit async function + await
async function test_fullLifecycle() {
  const dir = await setup();
  try {
    const result = await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Build auth" }, mockContext);
    const parsed = JSON.parse(result as string);
    assert(parsed.status === "success", "declare_intent sets session focus");
  } finally {
    await cleanup();
  }
}

// Modern style — async it()
it("should create tasks.json when todo.updated event is received", async () => {
  const handler = createEventHandler(noopLogger, tempDir);
  await handler({ event: event as any });
  await flushTaskManifestMutations();
  const content = await readFile(tasksPath, "utf-8");
  const parsed = JSON.parse(content);
  assert.equal(parsed.session_id, sessionID);
});
```

### Error Testing:

```typescript
// Verify error JSON response from tools
const result = await tool.execute({ action: "invalid" }, mockContext);
const parsed = JSON.parse(result as string);
assert(parsed.status === "error", "invalid action returns error");
assert(parsed.message.includes("Unknown action"), "error message is descriptive");
```

### JSON Parse Pattern (tool output testing):

```typescript
// All tool outputs are JSON strings — always parse before asserting
const result = await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "test" }, mockContext);
const parsed = JSON.parse(result as string);
assert(parsed.status === "success", "tool returns success");
```

### Source Code Scanning (structural tests):

```typescript
// Read source and verify patterns — no runtime needed
import { readFileSync } from "node:fs";

const source = readFileSync("src/hooks/tool-gate.ts", "utf-8");
assert(!source.includes(": any"), "no any types in tool-gate.ts");
```

## Test Naming Conventions

### File Names:
| Pattern | Meaning | Example |
|---------|---------|---------|
| `{module}.test.ts` | Standard unit test | `hierarchy-tree.test.ts` |
| `{module}-{YYYY-MM-DD}.test.ts` | Date-stamped (tied to a specific user story) | `event-handler-todo-2026-02-15.test.ts` |
| `{module}-red.test.ts` | TDD-first regression test | `codemap-red.test.ts` |
| `hf-harden-{NN}-{desc}-red.test.ts` | Type hardening enforcement | `hf-harden-08-no-any-red.test.ts` |
| `phase{N}-{desc}.test.ts` | Phase milestone verification | `phase5-lifecycle-red.test.ts` |
| `cycle{N}-{desc}-red.test.ts` | Development cycle regression | `cycle4-session-id-parity-red.test.ts` |
| `wave{N}-{desc}-red.test.ts` | Wave-specific regression | `wave2-gap-hierarchy-red.test.ts` |

### Test Function Names (legacy style):
- Prefix: `test_` + snake_case description
- Example: `test_strict_blocks_write_without_session`

### Test Description Strings (modern style):
- Sentence-case, behavior-focused
- Example: `"should create tasks.json when todo.updated event is received with valid data"`

## SDK Boundary Enforcement

The pre-test gate `scripts/check-sdk-boundary.sh` is an architectural invariant:

```bash
#!/usr/bin/env bash
# src/lib/ must NEVER import @opencode-ai
VIOLATIONS=$(grep -rn '@opencode-ai' src/lib/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo "❌ Architecture boundary violation: src/lib/ imports @opencode-ai"
  exit 1
fi
echo "✅ Architecture boundary clean"
exit 0
```

**Rule:** `src/lib/` is platform-portable. Only `src/hooks/` and `src/tools/` may import `@opencode-ai/*`.

## Prescriptive Guidelines for New Tests

1. **Use modern `node:test` style** — `describe`/`it` blocks with `node:assert`
2. **Use real filesystem** — `mkdtemp()` for temp dirs, NOT in-memory mocks
3. **Always clean up** — `rm(dir, { recursive: true })` in `afterEach` or `finally`
4. **Always clear mutation queue** — `clearMutationQueue()` before/after tests touching state
5. **Use `noopLogger`** — never construct logger objects manually unless testing log output
6. **Use factory functions** — `createConfig()`, `createBrainState()`, NOT raw object literals
7. **Parse tool output** — tools return JSON strings, always `JSON.parse()` before asserting
8. **Include `.js` extension** — all imports must use `.js` extension per NodeNext resolution
9. **Place tests correctly**:
   - Testing a tool? → `tests/{tool-name}.test.ts`
   - Testing a hook? → `tests/hooks/{hook-name}.test.ts`
   - Testing a lib? → `tests/lib/{lib-name}.test.ts`
   - Testing a schema? → `tests/schemas/{schema-name}.test.ts`
   - Testing code-intel? → `tests/code-intel/{feature-name}.test.ts`
10. **Red tests** — if writing a test before implementation, suffix with `-red`

---

*Testing analysis: 2026-02-28*
