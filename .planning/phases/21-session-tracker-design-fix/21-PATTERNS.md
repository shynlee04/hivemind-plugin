# Phase 21: Session-Tracker Design Fix — Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 13 new/modified files across 6 plans
**Analogs found:** 13 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/features/session-tracker/persistence/atomic-write.ts` | utility | file-I/O | itself (self-analog for temp fix) | exact |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts` | service | CRUD | `src/features/session-tracker/persistence/hierarchy-index.ts` | role-match |
| `src/features/session-tracker/persistence/project-index-writer.ts` | service | CRUD | itself (self-analog for childCount fix) | exact |
| `src/features/session-tracker/capture/event-capture.ts` | service | event-driven | itself (self-analog for manifest call removal) | exact |
| `src/features/session-tracker/persistence/hierarchy-index.ts` | service | CRUD | itself (self-analog for rebuildChildToRootMain) | exact |
| `src/features/session-tracker/index.ts` | service | CRUD | `hierarchy-index.ts` | role-match |
| `src/features/session-tracker/capture/tool-capture.ts` | service | event-driven | itself (self-analog for metadata wiring) | exact |
| `src/features/session-tracker/persistence/child-writer.ts` | service | CRUD | itself (self-analog for backfillChildMetadata) | exact |
| `src/task-management/continuity/delegation-persistence.ts` | utility | CRUD | itself (self-analog for gate removal) | exact |
| `src/features/session-tracker/persistence/orphan-cleanup.ts` | service | CRUD | `child-writer.ts` (serial queue, error pattern) | role-match |
| *test: atomic-write.test.ts* | test | verification | `tests/features/session-tracker/persistence/atomic-write.test.ts` | exact |
| *test: delegation-persistence.test.ts* | test | verification | `tests/lib/delegation-persistence.test.ts` | exact |
| *test: hierarchy-manifest / project-index / integration* | test | verification | `tests/features/session-tracker/persistence/atomic-write.test.ts` | style-match |

---

## Dominant Project Patterns

### 1. Tool Registration Pattern
- **Convention:** Factory function `createXxxTool(): ReturnType<typeof tool>`, Zod schema for args, async execute wrapping business logic, `renderToolResult(success/error(...))` for responses.
- **Location:** `src/tools/config/bootstrap-init.ts:42-67`, `src/tools/config/configure-primitive.ts`
- **Phase 21 does NOT add or modify tools.** All changes are within feature/persistence layer.

### 2. Persistence Pattern (Durable — Continuity)
- **Convention:** Dual-layer state: in-memory `Map<string, T>` + atomic-write to `.hivemind/state/*.json`. Deep-clone-on-read to prevent mutation aliasing. Synchronous `readFileSync`/`writeFileSync` for simplicity.
- **Location:** `src/task-management/continuity/index.ts`, `src/task-management/continuity/delegation-persistence.ts:58-79`
- **Phase 21 must follow:** Plan 21-05 G-4 gate removal removes the early-return gate but keeps the existing atomic write pattern (write-to-tmp → renameSync).

### 3. Persistence Pattern (Session-Tracker)
- **Convention:** Event-driven writes triggered by hook callbacks. Atomic write-to-temp + `rename()` (D-03). Serial write queues via promise-chaining (`this.writeQueue = this.writeQueue.then(...)`). Retry queue for failed writes (RC-5). Best-effort error handling (catch + log, never throw).
- **Location:** `src/features/session-tracker/persistence/atomic-write.ts:33-42`, `src/features/session-tracker/persistence/child-writer.ts:147-176`, `src/features/session-tracker/persistence/project-index-writer.ts:50-80`
- **Phase 21 must follow:** Plan 21-01 adds `unlink(tmpPath)` after `rename()` — same pattern, same file. Plan 21-02 keeps the same write pattern for manifest and childCount.

### 4. Factory Injection Pattern
- **Convention:** Classes receive typed dependency objects in constructor. Dependencies are wired in `src/plugin.ts` composition root. Optional dependencies use `ClassName | undefined` type.
- **Location:** `src/features/session-tracker/capture/event-capture.ts:58-76`, `src/features/session-tracker/capture/tool-capture.ts:73-89`, `src/features/session-tracker/persistence/child-writer.ts:67-75`, `src/features/session-tracker/persistence/hierarchy-manifest.ts:38-40`
- **Phase 21 must follow:** Plan 21-02 removes `manifestWriter` dependency from `event-capture.ts` write path (manifest becomes derivative cache). No new constructor params.

### 5. Error Handling Pattern
- **Convention:** `[Harness]` prefix on all error messages. `void this.client.app?.log?.(...)` for fire-and-forget logging. `.catch(() => {})` to swallow errors on background promises. try/catch wrappers on all handler methods.
- **Location:** `src/features/session-tracker/capture/event-capture.ts:161-171`, `src/features/session-tracker/persistence/atomic-write.ts:100-101`, `src/task-management/continuity/delegation-persistence.ts:192-194`, `src/features/session-tracker/persistence/child-writer.ts:174`
- **Phase 21 must follow:** Plan 21-01 `unlink()` in try/catch. Plan 21-06 guardrails use warning logs (not blocking errors). All new code uses `[Harness]` prefix.

### 6. Test Pattern
- **Convention:** Vitest with `describe`/`it` blocks. Real temp directories (`mkdtempSync`) for filesystem tests. `vi.doMock`/`vi.mock` for module mocking. `beforeEach`/`afterEach` cleanup with `rmSync`. Descriptive `it()` names.
- **Location:** `tests/features/session-tracker/persistence/atomic-write.test.ts:1-274`, `tests/lib/delegation-persistence.test.ts:1-223`
- **Phase 21 must follow:** All 6 plans need new tests. Follow the pattern from `atomic-write.test.ts` (real temp dir, no mocking) and `delegation-persistence.test.ts` (config mocking via `vi.doMock`). Plan 21-06's integration test should follow the temp-dir lifecycle pattern.

### 7. Config Schema Pattern
- **Convention:** Zod schemas in `src/schema-kernel/` with `z.object()`, defaults via `.default()`. Cached config via `getCachedConfig()`. Schema fields kept for backward compatibility when removing runtime consumers.
- **Location:** `src/schema-kernel/hivemind-configs.schema.ts:282`
- **Phase 21 must follow:** Plan 21-05 does NOT add or change schema — keeps `commit_docs` field, only removes its runtime consumer in delegation-persistence.

---

## Per-Plan Pattern Compliance

### Plan 21-01: F-01 Temp Fix + Cross-Volume Guardrail

**Target file:** `persistence/atomic-write.ts`

**Patterns to follow:**

**Atomic-write pattern** — copy from itself (lines 33-42):
```typescript
// FROM: atomic-write.ts:33-42 (before fix)
export async function atomicWriteJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}`
  const content = JSON.stringify(data, null, 2)
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, content, "utf-8")
  await rename(tmpPath, filePath)  // <-- ADD unlink(tmpPath) AFTER this line
}
```

**Error handling pattern** — copy from `child-writer.ts:174`:
```typescript
// Best-effort unlink after rename
try {
  await unlink(tmpPath)
} catch {
  // Best-effort: temp file will be cleaned on next startup
}
```

**Cross-volume validation pattern** — stat dev comparison:
```typescript
// Before rename(), check same volume
const srcStat = await stat(tmpPath)
const dstStat = await stat(dirname(filePath))
if (srcStat.dev !== dstStat.dev) {
  // log warning: cross-volume rename
}
```

**Test pattern** — follow `tests/features/session-tracker/persistence/atomic-write.test.ts`:
```typescript
// Pattern: real temp dir, no mocking for basic tests
beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "st-atomic-write-"))
})
afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})
it("does not leave .tmp files behind on success", async () => {
  // ...assert 0 .tmp files after write
})
```

---

### Plan 21-02: F-17/F-02 Manifest + F-19 childCount

**Target files:** `hierarchy-manifest.ts`, `project-index-writer.ts`, `event-capture.ts`, `hierarchy-index.ts`

**Patterns to follow:**

**Manifest derivative cache pattern** — add `generateFromContinuity()` method to `HierarchyManifestWriter`. Follow the existing class patterns:

Constructor pattern from `hierarchy-manifest.ts:38-40`:
```typescript
constructor(deps: { projectRoot: string }) {
  this.projectRoot = deps.projectRoot
}
```

Read-side generation replaces the write-side `addChild()`. The existing `loadManifest()` at line ~67 is the analog — change it to generate from continuity tree when cache is stale.

**childCount computation pattern** — add to `ProjectIndexWriter`. Follow the existing `incrementChildCount()` method:
```typescript
// FROM: project-index-writer.ts (existing incrementChildCount pattern)
async incrementChildCount(
  rootMainID: string,
  delegationDepth: number,
): Promise<void> {
  // serial queue write
}
```

New `computeChildCount()` and `computeMaxDepth()` should walk the hierarchy index (in-memory), then update the in-memory entry before serializing to disk via `updateSession()`.

**Factory injection usage:** `event-capture.ts` removes `manifestWriter.addChild()` calls (lines 490-498). The DI wiring stays — `manifestWriter` is optional (`HierarchyManifestWriter | undefined`), so the removal is safe.

---

### Plan 21-03: F-18 Anonymous Children

**Target files:** `event-capture.ts`, `tool-capture.ts`, `child-writer.ts`

**Patterns to follow:**

**Metadata capture pattern** — `writeImmediateChildFile()` at `event-capture.ts:428-467` already accepts `explicitSubagentType?`. The fix passes real values from `tool-capture.ts` handleTask path:

From `tool-capture.ts:258-268` (delegator agent resolution pattern):
```typescript
let delegatorAgentName = "unknown"
if (this.pendingRegistry) {
  const registryName = this.pendingRegistry.getSubagentType(childSessionID)
  if (registryName) delegatorAgentName = registryName
}
// Fallback: use args.subagent_type if registry didn't have it
if (delegatorAgentName === "unknown" && subagentType) {
  delegatorAgentName = subagentType
}
```

**Backfill pattern** — add `backfillChildMetadata()` to `child-writer.ts`. Follow the existing `updateChildStatus()` pattern (lines 290-307):
```typescript
// FROM: child-writer.ts:290-307 — enqueueWrite pattern
async updateChildStatus(parentID, childID, status): Promise<void> {
  const writeParent = this.resolveWriteParent(childID, parentID)
  return this.enqueueWrite(`${writeParent}/${childID}`, async () => {
    const record = await this.readChildFile(writeParent, childID)
    record.status = status
    // ...write back atomically
  })
}
```

New `backfillChildMetadata()` follows the same `enqueueWrite()` + `resolveWriteParent()` + `readChildFile()` + `atomicWriteJson()` pipeline.

---

### Plan 21-04: F-07 Recovery + F-13 MAX_DEPTH

**Target files:** `hierarchy-index.ts`, `session-tracker/index.ts`

**Patterns to follow:**

**Recovery rebuild pattern** — add `rebuildChildToRootMain()` to `hierarchy-index.ts`. Follow the existing `buildFromDisk()` pattern:

From `hierarchy-index.ts` (existing second-pass approach):
```typescript
// Existing pattern: walk childToParent to compute rootMain
// Traces from each child up through parent chain to root
```

**MAX_DEPTH guard pattern** — add to `ensureAncestorRoute()` at `session-tracker/index.ts:375-388`:
```typescript
// Guard pattern — copy error handling from other guards in codebase
const MAX_DEPTH = 20
if (depth > MAX_DEPTH) {
  // Log warning + return gracefully
  return
}
```

**Test pattern for restart simulation** — follows temp-dir lifecycle from `atomic-write.test.ts`:
```typescript
// Simulate restart: two separate SessionTracker initializations
// First init: register child chain, flush to disk
// Second init: rebuild from disk, assert childToRootMain is correct
```

---

### Plan 21-05: G-3 Precondition + G-4 Gate Removal

**Target files:** `project-index-writer.ts`, `delegation-persistence.ts`

**Patterns to follow:**

**Status overwrite fix pattern** — modify `addSession()` in `project-index-writer.ts`. Existing overwrite at lines ~168-169:
```typescript
// FROM: project-index-writer.ts ~168-169 (to be removed)
existing.status = "active"  // <-- REMOVE this line
```

**Gate removal pattern** — modify `persistDelegations()` at `delegation-persistence.ts:58-64`:
```typescript
// FROM: delegation-persistence.ts:58-64 (current)
const config = getCachedConfig()
if (!config.commit_docs) {
  return  // <-- REMOVE this early return
}

// TO:
// Always persist — remove the config gate entirely
// (keep getCachedConfig() import for future use)
```

**Test pattern** — follow `tests/lib/delegation-persistence.test.ts` (lines 144-222, `commit_docs toggle` describe block):
```typescript
// Pattern: vi.doMock config subscriber, real temp dir
vi.doMock("../../src/config/subscriber.js", () => ({
  getCachedConfig: vi.fn().mockReturnValue({ commit_docs: false }),
  // ...
}))
```

Remove the "skips disk write when commit_docs is false" test (line 188-205). Keep the "writes to disk" test (line 167-186) as always-persist baseline.

---

### Plan 21-06: Guardrails + Integration Verification

**Target files:** `orphan-cleanup.ts`, `hierarchy-index.ts`, `hierarchy-manifest.ts` + integration test

**Patterns to follow:**

**Guardrail pattern** — add warning logs only, no behavioral changes. Follow the existing warning pattern from `event-capture.ts:153-159`:
```typescript
// FROM: event-capture.ts:153-159 — warning log pattern
void this.client.app?.log?.({
  body: {
    service: "session-tracker",
    level: "warn",
    message: `[Harness] Session tracker: [context message]`,
  },
})
```

**Orphan guardrail pattern** — add `checkContinuityTree()` call in orphan-cleanup before quarantine. Follow the guard pattern from `event-capture.ts:471`:
```typescript
// Pattern: optional dependency guard
if (this.hierarchyIndex) {
  // perform check
}
```

**Integration test pattern** — new file `tests/lib/session-tracker/integration/`. Follow the temp-dir lifecycle from `atomic-write.test.ts` and the multi-phase pattern from `delegation-persistence.test.ts`:

```typescript
// Phased integration test pattern:
describe("P21 integration", () => {
  let tmpDir: string
  beforeEach(() => { /* setup temp dir, init SessionTracker */ })
  afterEach(() => { /* cleanup, rmSync */ })

  it("Phase 1: 100 writes → 0 temp files", async () => { /* ... */ })
  it("Phase 2: root + delegates → childCount matches", async () => { /* ... */ })
  it("Phase 3: children have real agent names", async () => { /* ... */ })
  it("Phase 4: restart → getRootMain works", async () => { /* ... */ })
  it("Phase 5: status preserved across callbacks", async () => { /* ... */ })
  it("Phase 6: deep chain → no stack overflow", async () => { /* ... */ })
})
```

---

## Shared Patterns

### Error Handling / Logging
**Source:** `src/features/session-tracker/capture/event-capture.ts:161-171`
**Apply to:** ALL Plan files (01-06)
```typescript
void this.client.app?.log?.({
  body: {
    service: "session-tracker",
    level: "warn",
    message: `[Harness] Session tracker: ${context}`,
    extra: { error: err instanceof Error ? err.message : String(err) },
  },
})
```

### Atomic Write Pattern
**Source:** `src/features/session-tracker/persistence/atomic-write.ts:33-42`
**Apply to:** Plan 21-01 (modify), Plan 21-03 (backfill via child-writer)
```typescript
// write-to-temp + rename + (NEW) unlink temp
const tmpPath = `${filePath}.tmp.${Date.now()}`
await writeFile(tmpPath, content, "utf-8")
await rename(tmpPath, filePath)
try { await unlink(tmpPath) } catch { /* best-effort */ }
```

### Factory Injection / Constructor DI
**Source:** `src/features/session-tracker/capture/event-capture.ts:58-76`
**Apply to:** All new classes and optional-dependency checks
```typescript
constructor(deps: {
  projectRoot: string
  optionalDep?: SomeClass  // optional with undefined type
}) {
  this.projectRoot = deps.projectRoot
  this.optionalDep = deps.optionalDep // may be undefined
}
```

### Serial Write Queue
**Source:** `src/features/session-tracker/persistence/child-writer.ts:147-176`
**Apply to:** Plan 21-03 backfill metadata (child-writer) and Plan 21-02 childCount (project-index-writer)
```typescript
private enqueueWrite(
  queueKey: string,
  fn: () => Promise<void>,
): Promise<void> {
  this.detectStaleQueue(queueKey)
  const current = this.writeQueues.get(queueKey) ?? Promise.resolve()
  const next = current.then(async () => {
    await fn()
    this.lastWriteTimes.set(queueKey, Date.now())
  })
  this.writeQueues.set(queueKey, next.catch(() => {}))
  return next
}
```

### [Harness] Error Prefix
**Source:** `src/shared/state.ts:78`, `src/task-management/continuity/delegation-persistence.ts:193`
**Apply to:** All thrown errors in Plan 21-04 (MAX_DEPTH guard), Plan 21-01 (validation errors)
```typescript
throw new Error(`[Harness] Description of error: ${details}`)
```

### Test Fixture / Temp Dir Lifecycle
**Source:** `tests/features/session-tracker/persistence/atomic-write.test.ts:19-29`
**Apply to:** All 6 plans' test files
```typescript
let tmpDir: string
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "st-prefix-")) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })
```

---

## Anti-Patterns to Avoid

These patterns in session-tracker code are KNOWN BAD and must NOT be repeated in Phase 21:

| Anti-Pattern | Location | Why Bad | Phase 21 Must |
|---|---|---|---|
| **Promise-chaining without error handling** | `child-writer.ts:174` `.catch(() => {})` | Swallows errors silently; makes debugging impossible | Plan 21-03: log backfill errors, don't swallow them |
| **Silent catch blocks** | `event-capture.ts:227` `break` on SDK error | Lost context for why parentID resolution failed | Plan 21-03: add log before silent fallthrough |
| **In-memory state with no persistence** | `hierarchy-index.ts` childToRootMain | Lost on restart (F-07) | Plan 21-04: rebuild from continuity tree |
| **Asymmetric write paths** | `hierarchy-manifest.ts` — written by some paths but not others | Manifest has holes (F-17) | Plan 21-02: derivative cache eliminates write asymmetry |
| **Schema fields never populated** | `project-continuity.json` childCount=0 (F-19) | Schema validation passes but data is wrong | Plan 21-02: compute before write, don't leave zero |
| **Config field name ≠ behavior** | `commit_docs` controlling delegation persistence (F-21) | Misleading; category error from CA-03 | Plan 21-05: remove the gate entirely |
| **No temp cleanup after write** | `atomic-write.ts:33-42`, `hierarchy-manifest.ts:201-204` | Temp files accumulate (F-01) | Plan 21-01: unlink after EVERY rename |
| **writeManifest() independent temp pattern** | `hierarchy-manifest.ts:201-204` | Same leak as atomicWriteJson but in a different file | Plan 21-02: ensure manifest temp files also cleaned |

---

## New Pattern Introductions

### 1. Derivative Cache Pattern (Plan 21-02)
- **What:** Manifest becomes a read-time generated derivative of the continuity tree instead of an independently-written authoritative source.
- **Where:** `hierarchy-manifest.ts` — `generateFromContinuity()` + `getManifest()` cache miss regeneration.
- **Convention:**
  ```typescript
  getManifest(rootMainID): Promise<HierarchyManifest> {
    if (this.cache[rootMainID] && !this.isStale(rootMainID)) {
      return deepClone(this.cache[rootMainID])
    }
    // Generate from continuity tree
    const manifest = this.generateFromContinuity(rootMainID)
    this.cache[rootMainID] = manifest
    await this.writeManifest(rootMainID, manifest) // optional disk cache
    return deepClone(manifest)
  }
  ```
- **Consistency check:** Same deep-clone-on-read pattern as `ContinuityStoreFile`. Cache freshness ts matches project-index-writer's staleness detection.

### 2. Rebuild-From-Continuity Pattern (Plan 21-04)
- **What:** `childToRootMain` mapping survives restart by walking the continuity tree at startup.
- **Where:** `hierarchy-index.ts` — `rebuildChildToRootMain()` called from `buildFromDisk()`.
- **First-found-wins** strategy for DAG hierarchies (child under multiple parents).
- **Consistency check:** No new file format — rebuilds from existing `session-continuity.json`. Same approach as the existing `buildFromDisk()` second pass.

### 3. Backfill Metadata Pattern (Plan 21-03)
- **What:** Child `.json` metadata is backfilled when delegation completes, replacing `"pending"`/`"unknown"` values with real agent identity.
- **Where:** `child-writer.ts` — `backfillChildMetadata(sessionId, metadata)`.
- **Convention:** Follows the same `enqueueWrite()` + `resolveWriteParent()` pipeline as `updateChildStatus()`.
- **Consistency check:** Same serial queue, same atomic write. Backfill is a passive secondary defense — primary fix is capturing metadata at creation time.

---

## No Analog Found

All Phase 21 changes modify existing files serving the same roles. No entirely new files are created. The closest match for each:

| Plan | File(s) | Closest Analog | Reason |
|------|---------|---------------|--------|
| 21-01 | `atomic-write.ts` | Self | Same file, additive changes only |
| 21-02 | `hierarchy-manifest.ts`, `project-index-writer.ts`, `event-capture.ts` | Self | Same files, modifying existing methods |
| 21-03 | `event-capture.ts`, `tool-capture.ts`, `child-writer.ts` | Self | Same files, wiring metadata through existing paths |
| 21-04 | `hierarchy-index.ts`, `index.ts` | Self | Same files, additive methods |
| 21-05 | `project-index-writer.ts`, `delegation-persistence.ts` | Self | Same files, removing gates |
| 21-06 | `orphan-cleanup.ts`, `hierarchy-index.ts`, `hierarchy-manifest.ts` | Self | Same files, adding guardrail logs |

---

## Metadata

**Analog search scope:** `src/features/session-tracker/`, `src/task-management/continuity/`, `src/shared/`, `src/tools/config/`, `tests/`
**Files scanned:** 18 source files + 2 test files
**Pattern extraction date:** 2026-05-21
