# Phase 18: Root Cleanup, Sync Boundary, Sync Manifest — Research

**Researched:** 2026-05-21
**Domain:** Dead code deletion, context rot extraction, barrel narrowing, boundary manifest sync
**Confidence:** HIGH (all findings verified via filesystem inspection, grep import tracing, git log, and file reads)

## Summary

This research verifies the execution plan for Phase 18 by confirming which files are genuinely dead, designing the storeCache extraction, auditing barrel exports, checking boundary drift, and ordering cleanup for minimal risk.

**Key corrections discovered:**
1. **steering-engine has NO test files** (zero test coverage to lose) — safe deletion
2. **runtime-detection has 1 test file** (`tests/lib/runtime-detection/stack-synthesizer.test.ts`) — must be deleted with sources
3. **permission.schema.ts and tool-definition.schema.ts are genuinely dead** (zero external consumers of their symbols) despite CONTEXT.md calling them "active" — they are barrelled in schema-kernel/index.ts but never imported by any src/ or tests/ code. User excluded them from deletion scope; research confirms they are dead but honors the decision.
4. **recovery/ (5 files, 763 LOC) is NOT in D-01 scope** but is confirmed dead with 4 test files — the most impactful dead code block remaining in the codebase
5. **Boundary maps (codebase/*.md) are already current** — HEAD (d0d5e966) is one commit past last_mapped_commit (906b21a0), and that commit (`47e2717e`) refreshed all 7 maps. Only minor post-cleanup refresh needed.

**Primary recommendation:** Execute D-01 through D-03 as scoped; run `npm run typecheck` and `npm test` after each commit. post-cleanup boundary refresh is real but small.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Module-batched dead code deletion (2 commits): (1) toggle-gates.ts + test; (2) steering-engine/ (3 files) + runtime-detection/
- **D-02:** Extract storeCache singleton from continuity/index.ts into new continuity/store-cache.ts with exported resetCache() API
- **D-03:** Fix `export *` in src/index.ts for command-engine → explicit named exports only. Keep src/harness/ and src/kernel/ .gitkeep dirs.
- **D-04:** Boundary sync order: verify → cleanup → update manifests

### the agent's Discretion
- Context rot: extract storeCache, defer session-tracker split (confirmed by user)
- Boundary sync: verify-then-cleanup (confirmed by user)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | Delete 6 files, ~795 LOC across 3 modules + test file | All 6 confirmed dead via grep import tracing. steering-engine lacks tests; runtime-detection has 1 test; toggle-gates has 1 test |
| D-02 | Extract storeCache to continuity/store-cache.ts | storeCache is a 5-line pattern in continuity/index.ts (lines 24, 240-245). Zero external consumers of the cache variable itself. All 14 continuity functions are named exports unaffected by extraction |
| D-03 | Narrow command-engine barrel | src/index.ts line 24: `export * from "./routing/command-engine/index.js"` — exposes 7 functions + types. 2-4 are internal-only |
| D-04 | Boundary audit + manifest update | Maps are already refreshed (HEAD past last_mapped_commit). Post-cleanup updates are small |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dead code deletion | Source tree (src/) | Test tree (tests/) | Files deleted from src/ + corresponding tests removed in same commit |
| storeCache extraction | src/task-management/continuity/ | — | New module lives in same directory as consumer |
| Barrel narrowing | src/index.ts | — | Single file change — no cross-tier impact |
| Boundary manifest update | .planning/codebase/ | AGENTS.md | Post-cleanup freshness refresh |

## Standard Stack

N/A — Phase 18 is a cleanup phase with no new library dependencies. Tooling:

| Tool | Purpose | Available | Version |
|------|---------|-----------|---------|
| `grep -rn` | Import chain verification | ✓ | macOS builtin |
| `git rm` | File deletion | ✓ | 2.x |
| `git log` | Boundary drift check | ✓ | 2.x |
| `npm run typecheck` | Type verification post-cleanup | ✓ | — |
| `npm test` | Regression verification | ✓ | vitest |
| `vi.resetModules()` | Current storeCache test workaround | ✓ | vitest globals |

## Dead Code Cleanup Scope (Verified Against Actual src/)

### Verification Methodology
For each dead code target: (a) confirm file exists on disk, (b) count LOC, (c) grep for external importers across src/,
(d) check test files, (e) check plugin.ts wiring, (f) check src/index.ts exports.

### Verified Dead Code Files (6 files, ~795 LOC)

#### Batch 1: toggle-gates

| File | LOC | Exists? | External Importers? | Tests? | Wired? |
|------|-----|---------|---------------------|--------|--------|
| `src/hooks/transforms/toggle-gates.ts` | 83 | ✅ | **ZERO** [VERIFIED: grep -rn "toggle-gates\|isToggleEnabled\|getDiscussMode" src/ returns only self-refs] | ✅ `tests/hooks/toggle-gates.test.ts` | ❌ Not in plugin.ts transforms imports (line 35-38) |
| `tests/hooks/toggle-gates.test.ts` | ~95 | ✅ | N/A (test file, tested dead code) | N/A | ❌ |

**Verdict:** Confirmed DEAD. Safe to delete both files.

#### Batch 2: steering-engine + runtime-detection

| File | LOC | Exists? | External Importers? | Tests? | Wired? |
|------|-----|---------|---------------------|--------|--------|
| `src/features/steering-engine/types.ts` | 104 | ✅ | **ZERO** [VERIFIED: grep -rn "steering-engine\|steeringPolicy\|steeringState" src/ returns only self-refs] | ❌ None | ❌ Not in plugin.ts, not in src/index.ts |
| `src/features/steering-engine/steering-state.ts` | 222 | ✅ | **ZERO** | ❌ None | ❌ |
| `src/features/steering-engine/schema/steering-policy.schema.ts` | 283 | ✅ | **ZERO** | ❌ None | ❌ |
| `src/features/bootstrap/runtime-detection/index.ts` | 1 | ✅ | **ZERO** [VERIFIED: grep -rn "runtime-detection" src/ returns only self-refs] | ✅ `tests/lib/runtime-detection/stack-synthesizer.test.ts` | ❌ Not in plugin.ts |
| `src/features/bootstrap/runtime-detection/stack-synthesizer.ts` | 194 | ✅ | **ZERO** | ✅ (same test file) | ❌ |
| `tests/lib/runtime-detection/stack-synthesizer.test.ts` | ~60 | ✅ | N/A | N/A | ❌ |

**Verdict:** Confirmed DEAD. Note: steering-engine has **zero test files** so no test deletion needed for that batch. runtime-detection has **1 test file** that must be deleted with its sources.

**Note on steering-engine additional dirs:** The `conditions/` and `templates/` subdirectories contain NO `.ts` files — they are empty (only `.gitkeep` at most). They will be cleaned up automatically by `git rm -r`.

### Active Files Excluded from D-01 (per CONTEXT.md correction)

| File | LOC | Our Finding |
|------|-----|-------------|
| `src/schema-kernel/permission.schema.ts` | 168 | **Genuinely dead** — zero external importers of any exported symbol. Re-exported through schema-kernel/index.ts barrel (lines 198-221) but no runtime code imports these re-exports |
| `src/schema-kernel/tool-definition.schema.ts` | 74 | **Genuinely dead** — zero external importers. Barrelled at schema-kernel/index.ts lines 278-291, but no consumer |

**Research note:** Despite our grep verification showing zero consumers, these 2 files were excluded from deletion scope by user decision in CONTEXT.md. The barrel re-exports make them part of the npm package API surface. If they are dead, removing them from the barrel is technically a breaking API change. This research defers to the locked decision.

### Phase 17 Dead Code NOT in D-01 (but confirmed dead)

| Target | LOC | Has Tests? | Why Excluded |
|--------|-----|-----------|--------------|
| `src/task-management/recovery/` (5 files) | 763 | ✅ 4 test files | Not in Phase 18 scope per CONTEXT.md D-01 |
| `src/harness/` (empty stub) | 0 | — | D-03 explicitly keeps stubs |

## storeCache Extraction Strategy

### Current State

```typescript
// src/task-management/continuity/index.ts line 24
let storeCache: ContinuityStoreFile | undefined

// Line 240-245 — in a function called by getContinuityFile()
if (storeCache) {
  return storeCache
}
storeCache = loadStoreFromDisk()
return storeCache
```

**Usage analysis:** `storeCache` is referenced at exactly 3 locations in the file (lines 24, 240, 241, 244, 245 in a single logical block). **Zero** files outside `continuity/index.ts` reference `storeCache`.

**Current test pattern:** `tests/lib/continuity.test.ts:168` uses:
```typescript
vi.resetModules()
const continuity2 = await import("../../src/task-management/continuity/index.js")
```
This is the workaround for module-level singleton state — the extract should eliminate this pattern.

### Proposed Design for `store-cache.ts`

```typescript
// src/task-management/continuity/store-cache.ts

import type { ContinuityStoreFile } from "./index.js"  // or shared types

let storeCache: ContinuityStoreFile | undefined

export function getStoreCache(): ContinuityStoreFile | undefined {
  return storeCache
}

export function setStoreCache(cache: ContinuityStoreFile): void {
  storeCache = cache
}

export function resetStoreCache(): void {
  storeCache = undefined
}
```

**Integration:**
- `continuity/index.ts` imports `{ getStoreCache, setStoreCache, resetStoreCache }` from `./store-cache.js`
- Replace lines 240-245 with `getStoreCache() ?? (setStoreCache(loadStoreFromDisk()), getStoreCache())`
- Tests import `resetStoreCache` directly instead of using `vi.resetModules()` + dynamic import

**Test strategy:**
- New test file: `tests/lib/store-cache.test.ts`
  - Test: `resetStoreCache()` clears cached value
  - Test: `setStoreCache()` stores value, `getStoreCache()` retrieves it
  - Test: independence — cache is isolated from other module state
- Update `tests/lib/continuity.test.ts` to use `resetStoreCache()` instead of `vi.resetModules()`

**API surface:**
- `getStoreCache()` → `ContinuityStoreFile | undefined`
- `setStoreCache(cache: ContinuityStoreFile)` → `void`
- `resetStoreCache()` → `void` (new — replaces vi.resetModules() workaround)

**Does NOT break existing callers:** All existing continuity functions (listSessionContinuity, getSessionContinuity, recordSessionContinuity, etc.) remain untouched. They will pull the cache from the new module. The only test change is replacing `vi.resetModules()` boilerplate with `resetStoreCache()`.

## Barrel Noise Audit

### Current State — src/index.ts line 24

```typescript
export * from "./routing/command-engine/index.js"
```

This wildcard re-export exposes 7 internal functions as part of the public npm package API:

| Function | Purpose | Should Be Public? |
|----------|---------|-------------------|
| `discoverCommandBundles()` | Discover available commands | ✅ Yes — used by hivemind-command-engine tool |
| `analyzeCommandContract()` | Analyze a command's contract | ⚠️ Internal — called through executeCommandEngineAction |
| `renderCommandContext()` | Render bounded context | ⚠️ Internal — same |
| `transformCommandMessages()` | Transform messages | ⚠️ Internal — same |
| `routeCommandPreview()` | Preview routing | ⚠️ Internal — same |
| `executeCommandEngineAction()` | Main action dispatcher | ✅ Yes — public API entry point |
| `listCommands()` | List available commands | ✅ Yes — separate public API |

Plus `export type * from "./types.js"` which re-exports all internal types.

### Other barrel entries (for completeness — NOT changing)

All other 21 `export *` lines in `src/index.ts` are from modules where the barrel IS the intended public API:
- `shared/helpers.js`, `shared/types.js`, `shared/state.js` — intentional public surface
- `features/doc-intelligence/index.js`, `features/runtime-pressure/index.js` — feature modules with intentional exports
- `task-management/continuity/index.js`, `task-management/lifecycle/index.js` — intentional manager exports

Only `command-engine/index.js` has the noise: it exports internal routing functions alongside the public API entry points.

### Proposed Narrowing

Replace line 24 with explicit named exports:

```typescript
export {
  executeCommandEngineAction,
  listCommands,
  discoverCommandBundles,
} from "./routing/command-engine/index.js"
```

**Impact:** 4 functions (analyzeCommandContract, renderCommandContext, transformCommandMessages, routeCommandPreview) plus all internal types are removed from public API surface. These functions are only called internally through `executeCommandEngineAction()` — external consumers should go through the dispatcher.

## Boundary Audit Checklist

### last_mapped_commit vs HEAD

| Property | Value |
|----------|-------|
| `last_mapped_commit` (ARCHITECTURE.md metadata) | `906b21a0` |
| Current HEAD | `d0d5e9663acb1e56c0fac54340b50417057338c7` |
| Commits between | 1 commit |

**Commit `47e2717e` — "docs: map existing codebase — refresh codebase intelligence"**
This single commit already updated ALL 7 codebase maps:
- `.planning/codebase/ARCHITECTURE.md` — ✓ refreshed
- `.planning/codebase/CONCERNS.md` — ✓ refreshed
- `.planning/codebase/CONVENTIONS.md` — ✓ refreshed
- `.planning/codebase/INTEGRATIONS.md` — ✓ refreshed
- `.planning/codebase/STACK.md` — ✓ refreshed
- `.planning/codebase/STRUCTURE.md` — ✓ refreshed
- `.planning/codebase/TESTING.md` — ✓ refreshed

**Verdict:** The boundary maps are already current with the codebase. The `last_mapped_commit` in metadata is one commit behind HEAD, but that's because the refresh commit updated the content without updating the metadata. Phase 18 cleanup will require only minor post-deletion updates to STRUCTURE.md (file tree) and potentially ARCHITECTURE.md (component table).

### CQRS Violations Check

CONCERNS.md (refreshed in 47e2717e) lists these known CQRS intersections with cleanup:
| Concern | Cleanup Impact |
|---------|---------------|
| `plugin.ts` at 493 LOC near cap | Not touched by Phase 18 |
| `session-tracker/index.ts` at 561 LOC | DEFERRED per D-02 |
| Sync I/O sprawl | Not touched by Phase 18 |
| Legacy migration code in runtime | Not touched by Phase 18 |

**No CQRS violations intersect with the Phase 18 cleanup targets.** The dead code being removed (toggle-gates, steering-engine, runtime-detection) was never wired into the CQRS flow. The storeCache extraction preserves existing CQRS boundaries.

### Post-Cleanup Manifest Updates Needed

| Manifest | Update Required | Effort |
|----------|----------------|--------|
| `.planning/codebase/STRUCTURE.md` | Remove steering-engine/ and runtime-detection/ from directory layout, remove toggle-gates from hooks section | Small |
| `.planning/codebase/ARCHITECTURE.md` | Remove steering-engine from Feature Layer (line 112), potentially remove runtime-detection from Routing Layer deps (line 120) | Small |
| `.planning/codebase/CONCERNS.md` | Check for any concerns referencing deleted files; add note about cleanup | Minor |
| `AGENTS.md` | Search for references to toggle-gates, steering-engine, runtime-detection | Verify-only |

## Cleanup Order & Risk

### Batch 1: toggle-gates (LOWEST RISK)

**Files to delete:**
- `src/hooks/transforms/toggle-gates.ts`
- `tests/hooks/toggle-gates.test.ts`

**Risk:** Minimal — 0 external importers, 0 test impact on other tests. No typechain effect.

**Verification:** 
```bash
git rm src/hooks/transforms/toggle-gates.ts tests/hooks/toggle-gates.test.ts
npm run typecheck  # should pass
npm test           # 1 fewer test file, no regressions
```

### Batch 2: steering-engine + runtime-detection (LOW RISK)

**Files to delete (6 files):**
- `src/features/steering-engine/types.ts`
- `src/features/steering-engine/steering-state.ts`
- `src/features/steering-engine/schema/steering-policy.schema.ts`
- `src/features/bootstrap/runtime-detection/index.ts`
- `src/features/bootstrap/runtime-detection/stack-synthesizer.ts`
- `tests/lib/runtime-detection/stack-synthesizer.test.ts`

**Risk:** Minimal — all confirmed dead. steering-engine has no test files so zero test removal impact. runtime-detection has 1 dedicated test file that tests only dead code.

**Dist/ rebuild impact:** Old compiled output will remain in `dist/features/steering-engine/` until next `npm run build`. Not a regression — build produces fresh output.

**Note:** `src/features/steering-engine/` will be completely removed including empty subdirs (`conditions/`, `schema/`, `templates/`). The `schema/` dir deletes with the files above.

**Verification:**
```bash
git rm -r src/features/steering-engine/
git rm src/features/bootstrap/runtime-detection/index.ts src/features/bootstrap/runtime-detection/stack-synthesizer.ts
git rm tests/lib/runtime-detection/stack-synthesizer.test.ts
npm run typecheck  # should pass
npm test           # 2 fewer test files, no regressions
```

### Between Batches: storeCache Extraction (LOW RISK)

**Work:**
1. Create `src/task-management/continuity/store-cache.ts`
2. Update `continuity/index.ts` to import from new module
3. Create `tests/lib/store-cache.test.ts`
4. Update `tests/lib/continuity.test.ts` to use `resetStoreCache()` instead of `vi.resetModules()`

**Risk:** Low — the `storeCache` variable has exactly 3 internal usage sites (line 24 declaration, lines 240-245 read). Zero external consumers. The extraction is a pure refactor with no behavior change. The new `resetStoreCache()` API replaces an existing test pattern.

**Timing:** This can be done as a third commit (after the two deletion batches) or interleaved. No dependency on deletion batches.

### After Cleanup: Barrel Narrowing + Boundary Sync

**Barrel narrowing (LOWEST RISK):**
- Single line change in `src/index.ts` line 24
- Verify no test imports the removed symbols with `npm run typecheck`

**Boundary sync (VERIFICATION ONLY):**
- Update STRUCTURE.md to remove deleted directories from file tree
- Update ARCHITECTURE.md Feature Layer section
- Update `last_mapped_commit` metadata to HEAD

### Test Impact Summary

| Deletion | Tests Removed | Tests Broken | Net Change |
|----------|--------------|--------------|------------|
| toggle-gates | 1 (`toggle-gates.test.ts`) | 0 | -1 test file |
| steering-engine | 0 | 0 | 0 test files |
| runtime-detection | 1 (`stack-synthesizer.test.ts`) | 0 | -1 test file |
| **Total** | **2 test files** | **0** | **-2 test files** |

### Commit Plan (Recommended)

| Commit | Content | Verification |
|--------|---------|-------------|
| 1 | Delete toggle-gates.ts + test | `npm run typecheck && npm test` |
| 2 | Delete steering-engine/ + runtime-detection + test | `npm run typecheck && npm test` |
| 3 | Extract storeCache to store-cache.ts + update tests | `npm run typecheck && npm test` |
| 4 | Narrow barrel + update boundary manifests | `npm run typecheck && npm test` |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead file detection | Manual guesswork | `grep -rn "from.*module" src/` | Fast, accurate, covers all import patterns |
| Test isolation for singletons | `vi.resetModules()` boilerplate | `resetStoreCache()` API | Explicit API is cleaner than module-level cache reset hack |
| Barrel narrowing | Manual grep of all consumers | `grep -rn "from.*command-engine" src/ tests/` | Verifies no downstream consumer depends on removed exports |

## Common Pitfalls

### Pitfall 1: Forgetting to Delete Test Files
**What goes wrong:** Dead source files are deleted but their test files remain, leaving orphan test coverage of dead code.
**How to avoid:** Before deleting any source file, always check `find tests -name "*$filename*"`. Both toggle-gates and runtime-detection have test files that must be deleted.

### Pitfall 2: Breaking the Barrel Without Verification
**What goes wrong:** Narrowing `export *` to explicit exports removes symbols that external consumers may depend on.
**How to avoid:** After narrowing, run `npm run typecheck` to catch any compilation errors from removed symbols. For npm package consumers, this is a minor breaking change to document.

### Pitfall 3: storeCache Extraction Creating Circular Dependencies
**What goes wrong:** If `store-cache.ts` imports types from `index.ts` AND `index.ts` imports from `store-cache.ts`, a circular dependency is created.
**How to avoid:** The `ContinuityStoreFile` type should be imported from `index.ts` ONLY if `store-cache.ts` does NOT import any runtime values from `index.ts`. Better: define the cache type in a shared location or use `import type`.

### Pitfall 4: steering-engine Empty Subdirectories Left Behind
**What goes wrong:** `git rm` of individual files leaves empty `conditions/` and `templates/` directories in the working tree.
**How to avoid:** Use `git rm -r src/features/steering-engine/` to remove the entire directory tree, or clean up empty dirs separately.

## Code Examples

### Example 1: storeCache Module Pattern

```typescript
// src/task-management/continuity/store-cache.ts

import type { ContinuityStoreFile } from "../../shared/types.js";

/**
 * Module-level cache for the continuity store file.
 * Extracted from continuity/index.ts for explicit test reset support.
 */
let storeCache: ContinuityStoreFile | undefined;

export function getStoreCache(): ContinuityStoreFile | undefined {
  return storeCache;
}

export function setStoreCache(cache: ContinuityStoreFile): void {
  storeCache = cache;
}

/**
 * Reset the cache to undefined. Used in tests to simulate cold start
 * without requiring vi.resetModules().
 */
export function resetStoreCache(): void {
  storeCache = undefined;
}
```

### Example 2: Using resetStoreCache in Tests

```typescript
// tests/lib/store-cache.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getStoreCache, setStoreCache, resetStoreCache } from 
  "../../src/task-management/continuity/store-cache.js";

describe("store-cache", () => {
  beforeEach(() => {
    resetStoreCache();
  });

  it("should return undefined when no cache is set", () => {
    expect(getStoreCache()).toBeUndefined();
  });

  it("should store and retrieve cached value", () => {
    const mockCache = { sessions: {}, version: 1 } as any;
    setStoreCache(mockCache);
    expect(getStoreCache()).toBe(mockCache);
  });

  it("should clear cache after reset", () => {
    setStoreCache({} as any);
    resetStoreCache();
    expect(getStoreCache()).toBeUndefined();
  });
});
```

### Example 3: Barrel Narrowing

```typescript
// src/index.ts — narrowed export (replacing line 24)
export {
  executeCommandEngineAction,
  listCommands,
  discoverCommandBundles,
} from "./routing/command-engine/index.js";
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | permission.schema.ts and tool-definition.schema.ts are genuinely dead (zero consumers) | Dead Code Cleanup Scope | Already confirmed via grep — zero external importers of their specific symbols. CONTEXT.md excludes them from deletion; research honors this. |
| A2 | No downstream npm consumers depend on removed command-engine internal exports | Barrel Noise Audit | If a consumer imports `analyzeCommandContract` directly from `hivemind`, narrowing the barrel breaks their build. Low risk — these are routing internals. |
| A3 | The 4 removed command-engine functions have no internal src/ callers | Barrel Noise Audit | Confirmed via grep: `executeCommandEngineAction` is the only function called externally. No src/ file imports `analyzeCommandContract`, `renderCommandContext`, `transformCommandMessages`, or `routeCommandPreview` directly. |
| A4 | recovery/ (763 LOC) is dead but excluded from Phase 18 scope | Dead Code Cleanup Scope | Verified via grep — zero external importers. Not in D-01 scope. Planner may choose to add it or defer. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `git` | File deletion, commit | ✓ | 2.x | — |
| `npm` | Build/typecheck/test | ✓ | — | — |
| `typescript` | Type verification | ✓ | ^5.x | — |
| `vitest` | Test verification | ✓ | globals | — |
| `grep` | Import tracing | ✓ | macOS builtin | ripgrep |

**Missing dependencies with no fallback:** None — all cleanup tooling is available.

## Validation Architecture

> `workflow.nyquist_validation` key absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (globals, V8 coverage) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run -t "store-cache\|continuity"` (targeted) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | Dead code deleted, typecheck passes | compilation | `npm run typecheck` | ✅ tsconfig.json |
| D-02 | storeCache extraction with resetCache() | unit | `npx vitest run tests/lib/store-cache.test.ts` | ❌ Wave 0 |
| D-02 | storeCache extraction — continuity tests still pass | unit | `npx vitest run tests/lib/continuity.test.ts` | ✅ |
| D-03 | Barrel narrowed, typecheck passes | compilation | `npm run typecheck` | ✅ |
| D-04 | Boundary manifests updated | manual | `git diff .planning/codebase/` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + boundary docs updated before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/store-cache.test.ts` — covers D-02 (storeCache extraction)
- [ ] Manual boundary manifest update checklist

## Security Domain

> `security_enforcement` not explicitly set to `false` — section included per default.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V7 Code Quality | yes | Dead code removal directly improves code quality: reduces attack surface, removes stale exports, eliminates untested paths |
| V11 Business Logic | partial | storeCache extraction preserves existing behavior — no logic changes |

### Known Threat Patterns for Phase 18

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dead code as attack surface | Information Disclosure | Remove unused code paths (steering-engine, runtime-detection, toggle-gates) |
| Stale barrel exports exposing internal APIs | Information Disclosure | Narrow command-engine exports to explicit public functions only |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: filesystem enumeration] — All file existence and LOC counts from live filesystem scan on 2026-05-21
- [VERIFIED: grep import traces] — All import tracking done via `grep -rn` across `src/` and `tests/` on 2026-05-21
- [VERIFIED: git log] — HEAD vs `last_mapped_commit` comparison from `git rev-parse HEAD` and `git log 906b21a0..HEAD`
- [VERIFIED: file reads] — continuity/index.ts storeCache pattern, src/index.ts barrel exports, plugin.ts wiring

### Secondary (MEDIUM confidence)
- [CITED: CONTEXT.md] — Locked decisions D-01 through D-04 from Phase 18 context
- [CITED: DISCUSSION-LOG.md] — Audit correction on permission.schema.ts and tool-definition.schema.ts
- [CITED: 17-FINDINGS.md] — Phase 17 findings report confirming dead code status
- [CITED: CONCERNS.md] — Known CQRS violations and fragile areas

### Tertiary (LOW confidence)
- None — all research claims were verified against live codebase or official planning artifacts

## Metadata

**Confidence breakdown:**
- Dead code verification: HIGH — all files confirmed via filesystem scan and grep import tracing
- storeCache extraction design: HIGH — based on reading actual source, grep for all usage sites
- Barrel noise audit: HIGH — based on reading src/index.ts and verifying consumer patterns
- Boundary drift: HIGH — git log confirms maps are already refreshed
- Cleanup order: HIGH — verified test impact and typechain for each deletion

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (codebase changes could affect file existence)
