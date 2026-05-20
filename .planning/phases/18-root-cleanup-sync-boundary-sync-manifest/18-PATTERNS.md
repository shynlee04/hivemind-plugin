# Phase 18: Root Cleanup, Sync Boundary, Sync Manifest — Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 14 (2 CREATE, 5 MODIFY, 7 DELETE)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/task-management/continuity/store-cache.ts` | utility | CRUD (get/set/reset) | `src/task-management/continuity/delegation-persistence.ts` | exact — same directory, same surface |
| `tests/lib/store-cache.test.ts` | test | request-response | `tests/lib/state.test.ts` | role-match — pure in-memory state test, no fs/env deps |
| `src/task-management/continuity/index.ts` | service | CRUD | `src/task-management/continuity/index.ts` (self) | exact — modify existing export surface |
| `tests/lib/continuity.test.ts` | test | request-response | `tests/lib/continuity.test.ts` (self) | exact — modify existing test file |
| `src/index.ts` (line 24) | config/route | other | `src/index.ts` line 1 | exact — same file, explicit named export pattern |
| `src/hooks/transforms/toggle-gates.ts` | middleware | other | N/A (delete) | — |
| `tests/hooks/toggle-gates.test.ts` | test | other | N/A (delete) | — |
| `src/features/steering-engine/` (3 files) | feature | other | N/A (delete) | — |
| `src/features/bootstrap/runtime-detection/` (2 files) | feature | other | N/A (delete) | — |
| `tests/lib/runtime-detection/stack-synthesizer.test.ts` | test | other | N/A (delete) | — |
| `.planning/codebase/STRUCTURE.md` | config | other | `.planning/codebase/STRUCTURE.md` (self) | modify |
| `.planning/codebase/ARCHITECTURE.md` | config | other | `.planning/codebase/ARCHITECTURE.md` (self) | modify |
| `.planning/codebase/CONCERNS.md` | config | other | `.planning/codebase/CONCERNS.md` (self) | modify |
| `AGENTS.md` | config | other | `AGENTS.md` (self) | modify |

## Pattern Assignments

### `src/task-management/continuity/store-cache.ts` (utility, CRUD)

**Analog:** `src/task-management/continuity/delegation-persistence.ts`
**Rationale:** Sibling module in same `continuity/` directory, same pattern of module-level operations.

**Imports pattern** (lines 1-8):
```typescript
import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./index.js"
import { getCachedConfig } from "../../config/subscriber.js"
import { redactBoundaryFields } from "../../shared/security/redaction.js"
import type { Delegation, DelegationStatus } from "../../shared/types.js"
```

**Core pattern for store-cache.ts** (derived from the storeCache inline code at `continuity/index.ts` lines 24, 239-246):
```typescript
// --- Analog: continuity/index.ts lines 24, 239-246 ---
let storeCache: ContinuityStoreFile | undefined

function ensureStoreLoaded(): ContinuityStoreFile {
  if (storeCache) {
    return storeCache
  }
  storeCache = loadStoreFromDisk()
  return storeCache
}
```

**Extraction target — new module `store-cache.ts`:**
- Import type from shared types (to avoid circular dep with `index.ts`)
- Export `getStoreCache()`, `setStoreCache()`, `resetStoreCache()`
- Use `import type` only for the `ContinuityStoreFile` type — no runtime imports from `index.ts` to prevent circular dependency

**Validation pattern** (delegation-persistence.ts lines 10-20 — status validation set):
```typescript
const VALID_DELEGATION_STATUSES: ReadonlySet<string> = new Set<string>([
  "dispatched",
  "running",
  "completed",
  "error",
  "timeout",
])
```

**Error handling pattern** (delegation-persistence.ts lines 48-52 — corrupt file quarantine):
```typescript
function quarantineCorruptDelegationsFile(filePath: string): string {
  const quarantinePath = `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(filePath, quarantinePath)
  return quarantinePath
}
```

---

### `tests/lib/store-cache.test.ts` (test, request-response)

**Analog:** `tests/lib/state.test.ts`
**Rationale:** Both test pure in-memory state (no filesystem, no env vars, no dynamic imports). Class-based `TaskStateManager` and module-level `storeCache` share the same "state lifecycle" contract.

**Imports pattern** (state.test.ts lines 1-2):
```typescript
import { TaskStateManager } from "../../src/shared/state.js"
import type { DelegationMeta } from "../../src/shared/types.js"
```

**In `store-cache.test.ts`**, replace with:
```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { getStoreCache, setStoreCache, resetStoreCache } from
  "../../src/task-management/continuity/store-cache.js"
```

**beforeEach isolation pattern** (state.test.ts lines 15-17):
```typescript
beforeEach(() => {
  mgr = new TaskStateManager()
})
```

**In `store-cache.test.ts`**, replace with:
```typescript
beforeEach(() => {
  resetStoreCache()
})
```

**Core test pattern** (state.test.ts lines 38-54 — ensureStats creates/returns):
```typescript
it("ensureStats creates new stats for unknown session", () => {
  const stats = mgr.ensureStats("sid-1")
  expect(stats).toMatchObject({
    total: 0,
    byTool: {},
    loop: { signature: "", count: 0 },
    warnings: [],
  })
})

it("ensureStats returns existing stats for known session", () => {
  const first = mgr.ensureStats("sid-2")
  first.total = 42
  const second = mgr.ensureStats("sid-2")
  expect(second.total).toBe(42)
  expect(second).toBe(first)
})
```

**Analog for `store-cache.test.ts`:**
```typescript
it("should return undefined when no cache is set", () => {
  expect(getStoreCache()).toBeUndefined()
})

it("should store and retrieve cached value", () => {
  const mockCache = { sessions: {}, version: 1 } as any  // partial ContinuityStoreFile
  setStoreCache(mockCache)
  expect(getStoreCache()).toBe(mockCache)
})

it("should clear cache after reset", () => {
  setStoreCache({} as any)
  resetStoreCache()
  expect(getStoreCache()).toBeUndefined()
})
```

---

### `src/task-management/continuity/index.ts` (service, CRUD)

**Analog:** Self (current file, lines 24, 239-246)

**Current pattern to replace (lines 24, 239-246):**
```typescript
// Line 24:
let storeCache: ContinuityStoreFile | undefined

// Lines 239-246:
function ensureStoreLoaded(): ContinuityStoreFile {
  if (storeCache) {
    return storeCache
  }
  storeCache = loadStoreFromDisk()
  return storeCache
}
```

**Replace with import + simplified ensureStoreLoaded:**
```typescript
import { getStoreCache, setStoreCache, resetStoreCache } from "./store-cache.js"
// (remove line 24: `let storeCache: ContinuityStoreFile | undefined`)

// Simplified ensureStoreLoaded — cache logic delegated to store-cache.ts
function ensureStoreLoaded(): ContinuityStoreFile {
  const cached = getStoreCache()
  if (cached) {
    return cached
  }
  const loaded = loadStoreFromDisk()
  setStoreCache(loaded)
  return loaded
}
```

**No other public API changes.** All exported functions (`listSessionContinuity`, `getSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`, etc. — lines 329-465) remain unchanged.

**Import pattern to follow** (delegation-persistence.ts line 5 — importing from sibling):
```typescript
import { getContinuityStoragePath } from "./index.js"
```

---

### `tests/lib/continuity.test.ts` (test, request-response)

**Analog:** Self (current file)

**Pattern to replace — `vi.resetModules()` + dynamic import** (lines 29-35, 168-170):
```typescript
// Current: beforeEach with resetModules + dynamic import
beforeEach(() => {
  vi.resetModules()
  vi.unmock("node:fs")
  // ...
})

// Current: "simulate restart" with vi.resetModules()
vi.resetModules()
const continuity2 = await import("../../src/task-management/continuity/index.js")
```

**New pattern — use `resetStoreCache()` directly:**
```typescript
// Clean beforeEach — remove vi.resetModules() unless fs mocks still needed
beforeEach(() => {
  // resetStoreCache() handles the cold-start simulation
  // vi.unmock("node:fs")  // keep if fs mocks are used
  // ...
})

// "simulate restart" becomes:
resetStoreCache()
const continuity2 = await import("../../src/task-management/continuity/index.js")
```

**Key locations to update in `continuity.test.ts`:**
| Line | Current Pattern | Replace With |
|------|----------------|--------------|
| 30 | `vi.resetModules()` | Remove (resetStoreCache in setup) |
| 39 | `vi.resetModules()` | Remove (afterEach cleanup) |
| 169 | `vi.resetModules()` + `const continuity2 = await import(...)` | `resetStoreCache()` + `const continuity2 = await import(...)` |
| 273 | `vi.resetModules()` + `const continuity2 = await import(...)` | `resetStoreCache()` + `const continuity2 = await import(...)` |

**NOTE:** Tests that use `vi.doMock` for fs mocking (lines 54-73, 409-416) still need `vi.resetModules()` in their **afterEach** for proper cleanup. Only cold-start/restart simulation tests (lines 160-177, 227-294) can replace `vi.resetModules()` with `resetStoreCache()`.

---

### `src/index.ts` (config/route, other)

**Analog:** `src/index.ts` line 1 (explicit named export pattern)
**Rationale:** Same file, established pattern for selective re-exports.

**Current barrel export (line 24):**
```typescript
export * from "./routing/command-engine/index.js"
```

**Narrow to explicit named exports, following the line-1 pattern:**
```typescript
// Line 1 analog — explicit named export:
export { HarnessControlPlane } from "./plugin.js"

// Replace line 24 with:
export {
  executeCommandEngineAction,
  listCommands,
  discoverCommandBundles,
} from "./routing/command-engine/index.js"
```

**Functions removed from public API surface (internal-only):**
- `analyzeCommandContract` — called through `executeCommandEngineAction()` dispatcher
- `renderCommandContext` — internal routing helper
- `transformCommandMessages` — internal routing helper
- `routeCommandPreview` — internal routing helper
- All types (`export type *` on line 223)

**Verification command:**
```bash
grep -rn "analyzeCommandContract\|renderCommandContext\|transformCommandMessages\|routeCommandPreview" src/ tests/
```
Expected: zero matches in `src/` or `tests/` outside `command-engine/index.ts` itself.

---

## Shared Patterns

### Module Extraction (singleton → dedicated module)

**Source:** `src/task-management/continuity/delegation-persistence.ts` (sibling extraction analog)
**Apply to:** `store-cache.ts` creation + `continuity/index.ts` modification

| Pattern Element | Current State | Target State |
|----------------|--------------|--------------|
| Variable location | `continuity/index.ts` line 24 | `continuity/store-cache.ts` |
| Getter | Inline at line 240-241: `if (storeCache) return storeCache` | `getStoreCache(): ContinuityStoreFile \| undefined` |
| Setter | Assignment at line 244: `storeCache = loadStoreFromDisk()` | `setStoreCache(cache: ContinuityStoreFile): void` |
| Reset | `vi.resetModules()` in tests (line 30, 39, 169, 273) | `resetStoreCache(): void` — explicit API |
| Type | `ContinuityStoreFile` from `../../shared/types.js` | Same type, use `import type` only |

### Barrel Narrowing (wildcard → explicit)

**Source:** `src/index.ts` line 1
**Apply to:** `src/index.ts` line 24

| Pattern Element | Current | Target |
|----------------|---------|--------|
| Export style | `export *` (wildcard) | `export { ... }` (explicit list) |
| Exposed symbols | 7 functions + all types | 3 public functions only |
| Risk | Exposes internal routing API | Removes 4 internal helpers from npm surface |

### Dead Code Deletion

**Prior art:** Commit `3fb2f364` — event-tracker excision (12 source + 10 test files)
**Prior art:** Commit `af535be3` — category-gate removal (2 source files + reference cleanup)

**Required steps per deletion batch:**
1. `git rm` target files (or `git rm -r` for directories)
2. Remove any references from `src/index.ts`, `src/plugin.ts`, or other wiring files
3. `npm run typecheck` — verify no dangling imports
4. `npm test` — verify no regressions (test count decreases by orphan test count)
5. `git commit` with atomic message

**Batch 1: toggle-gates (2 files)**
```bash
git rm src/hooks/transforms/toggle-gates.ts tests/hooks/toggle-gates.test.ts
npm run typecheck && npm test
git commit -m "phase-18: remove dead toggle-gates module (+ 1 test file) — 0 external importers"
```

**Batch 2: steering-engine + runtime-detection (5 source + 1 test file)**
```bash
git rm -r src/features/steering-engine/
git rm src/features/bootstrap/runtime-detection/index.ts src/features/bootstrap/runtime-detection/stack-synthesizer.ts
git rm tests/lib/runtime-detection/stack-synthesizer.test.ts
npm run typecheck && npm test
git commit -m "phase-18: remove dead steering-engine and runtime-detection modules (+ 1 test file)"
```

**NOTE:** steering-engine `conditions/` and `templates/` subdirectories contain only `.gitkeep` — cleaned up by `git rm -r`.

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All files have close analogs |

## Metadata

**Analog search scope:** `src/task-management/continuity/`, `src/shared/`, `src/index.ts`, `tests/lib/`, `src/routing/command-engine/`
**Files scanned:** ~30 source + test files
**Pattern extraction date:** 2026-05-21
