# Phase CP-ST-06: Session Tracker Root Cause Rewrite - Pattern Map

**Mapped:** 2026-05-16  
**Subagent:** gsd-pattern-mapper  
**Ngôn ngữ:** Vietnamese  
**Scope:** chỉ map pattern cho plan-phase; không implement runtime source.

## Pattern Mapping Complete

CP-ST-06 cần rewrite theo pattern hiện có trong `src/features/session-tracker/`: dependency injection qua constructor, classify-before-I/O, persistence qua `.hivemind/session-tracker/`, atomic write bằng temp file rồi `rename`, test integration bằng temp filesystem, và logging lỗi với prefix `[Harness]`.

**Nguồn context đã đọc:**
- `CP-ST-06-CONTEXT.md:22-37` — retry queue bắt buộc cho child writes.
- `CP-ST-06-CONTEXT.md:41-55` — max depth khóa ở L2; SPEC L3 bị supersede.
- `CP-ST-06-CONTEXT.md:58-72` — audit test từng cái, không xóa hàng loạt.
- `CP-ST-06-CONTEXT.md:76-94` — `index.ts` refactor nằm trong scope, mỗi module ≤500 LOC.
- `CP-ST-06-CONTEXT.md:97-110` — parallel child registration/write phải được verify bằng integration tests.
- `CP-ST-06-RESEARCH.md:149-166` — recommended extraction structure.
- `SPEC.md:168-178` — key files/root cause mapping.

## Files To Modify

| File | Role | Data Flow | Root Cause / Work | Pattern/Analog bắt buộc |
|---|---|---|---|---|
| `src/features/session-tracker/index.ts` | facade/orchestrator | request-response + event-driven | GA-4: extract xuống ≤500 LOC; RC-3 routing main/child | `bootstrap.ts:23-45` cho module extraction; `index.ts:272-330` và `index.ts:357-407` cho classify-before-I/O hiện tại |
| `src/features/session-tracker/session-router.ts` *(new)* | router | request-response + event-driven | gom `handleChatMessage` + `handleToolExecuteAfter` routing | `index.ts:262-341`, `index.ts:357-407`, `classification.ts:53-87` |
| `src/features/session-tracker/child-recorder.ts` *(new)* | service/recorder | event-driven + CRUD | gom `ensureChildRoute`, `ensureAncestorRoute`, `recordChildToolJourney`, `recordChildTaskDelegation` | `index.ts:421-556`; `child-writer.ts:222-340`; `session-index-writer.ts:188-238` |
| `src/features/session-tracker/initialization.ts` *(new)* | lifecycle/service | batch + file-I/O | gom construction/initialize/start/shutdown/cleanup helpers | `index.ts:776-913`; `bootstrap.ts:23-45`; `bootstrap.ts:57-93` |
| `src/features/session-tracker/classification.ts` | classifier | transform + request-response | RC-3: `gate:"none"` không còn đồng nghĩa main | `classification.ts:17-22`, `classification.ts:53-87`; `event-capture-classification-first.test.ts:78-107` |
| `src/features/session-tracker/persistence/hierarchy-index.ts` | model/index | transform + in-memory lookup + file scan | RC-1: reverse-order root resolution, giữ L2 cap | `hierarchy-index.ts:120-129`, `hierarchy-index.ts:162-199`, `hierarchy-index.ts:241-252`; `hierarchy-index.test.ts:163-188` |
| `src/features/session-tracker/persistence/session-index-writer.ts` | persistence writer | CRUD + file-I/O + queue | RC-2: nested status update recursive/root-owned | `session-index-writer.ts:188-238`; `session-index-writer.test.ts:139-168`; `types.ts:251-263` |
| `src/features/session-tracker/persistence/child-writer.ts` | persistence writer | CRUD + file-I/O + queue | RC-4/RC-5: full `lastMessage`, no silent error loss | `child-writer.ts:133-145`, `child-writer.ts:283-305`; `child-writer.test.ts:279-297`; `atomic-write.ts:33-42` |
| `src/features/session-tracker/persistence/retry-queue.ts` *(new)* | persistence/service | retry + file-I/O + batch | GA-1 retry queue durable failed child writes | `child-writer.ts:133-145` as anti-pattern to replace; `pending-dispatch-registry.ts:72-93` for small stateful service shape; `atomic-write.ts:33-42` |
| `src/features/session-tracker/capture/event-capture.ts` | event capture | event-driven + request-response | RC-5 immediate child write must route to retry/error surface; maybe extract to ≤500 LOC later | `event-capture.ts:440-501` anti-pattern; `event-capture.ts:161-170`, `event-capture.ts:282-291`, `event-capture.ts:326-335` logging pattern |
| `src/features/session-tracker/persistence/session-writer.ts` | persistence writer | file-I/O + append/update | RC-4 main `.md` full `lastMessage` metadata | `session-writer.ts:71-95`, `session-writer.ts:201-219`; `session-writer.test.ts:284-327` |
| `src/features/session-tracker/types.ts` | model/types | contract | add/fix `lastMessage` doc/type, retry record/degraded status if needed | `types.ts:51-68`, `types.ts:204-229`, `types.ts:251-263` |
| `tests/features/session-tracker/persistence/hierarchy-index.test.ts` | test | unit/integration hybrid | RC-1 keep reverse-order test; change depth expectation to L2 per GA-2 | `hierarchy-index.test.ts:163-200`; `CP-ST-06-CONTEXT.md:41-55` |
| `tests/features/session-tracker/persistence/session-index-writer.test.ts` | test | integration/unit hybrid | RC-2 recursive nested status | `session-index-writer.test.ts:139-168` |
| `tests/features/session-tracker/persistence/child-writer.test.ts` | test | integration with real fs | RC-4/RC-5 full lastMessage + retry/error propagation | `child-writer.test.ts:204-210` stale expectation; `child-writer.test.ts:279-297`; `child-writer.test.ts:340-416` |
| `tests/features/session-tracker/integration/*.test.ts` *(new/updated)* | integration test | event-driven + file-I/O | RC-3 default-sub, RC-5 retry flush, GA-5 parallel children | `pipeline.test.ts:39-97`, `pipeline.test.ts:103-159`, `concurrency.test.ts:78-121`, `concurrency.test.ts:159-210` |

## Closest Existing Analogs

### 1. Module extraction / thin facade

**Use for:** `session-router.ts`, `child-recorder.ts`, `initialization.ts`, thinner `index.ts`.

**Analog:** `src/features/session-tracker/bootstrap.ts`

**Constructor dependency injection pattern** (`bootstrap.ts:23-45`):

```typescript
export class SessionBootstrap {
  private client: OpenCodeClient
  private projectRoot: string
  private sessionWriter: SessionWriter
  private projectIndexWriter: ProjectIndexWriter
  private sessionIndexWriter: SessionIndexWriter

  constructor(deps: {
    client: OpenCodeClient
    projectRoot: string
    sessionWriter: SessionWriter
    projectIndexWriter: ProjectIndexWriter
    sessionIndexWriter: SessionIndexWriter
  }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
    this.sessionWriter = deps.sessionWriter
    this.projectIndexWriter = deps.projectIndexWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
  }
}
```

**Best-effort error/log pattern** (`bootstrap.ts:68-92`):

```typescript
try {
  await this.sessionWriter.createSessionDir(sessionID)
  await this.sessionWriter.initializeSessionFile(sessionID, { sessionID, parentSessionID: null })
} catch (err) {
  bootstrappedSessions.delete(sessionID)
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Session tracker: lazy bootstrap failed for "${sessionID}"`,
      extra: { error: err instanceof Error ? err.message : String(err) },
    },
  })
}
```

**Planning instruction:** extract modules should keep this shape: private deps, constructor `{ deps }`, public methods, no hidden global state, `.js` import extensions.

### 2. Classification-first routing

**Use for:** `session-router.ts`, `classification.ts`, event paths in `event-capture.ts`.

**Analog:** `src/features/session-tracker/index.ts:272-330`.

```typescript
const classification = await this.classifier.classify(
  input.sessionID,
  (id) => this.getSessionSafely(id),
)
const parentID = classification.parentID

if (parentID && this.childWriter) {
  this.bootstrappedSessions.add(input.sessionID)
  await this.ensureChildRoute(parentID, input.sessionID)
  await this.childWriter.appendChildTurn(parentID, input.sessionID, { ... })
  return
}

await this.ensureSessionReady(input.sessionID)
await this.messageCapture.handleChatMessage(input, output)
```

**Analog:** `src/features/session-tracker/classification.ts:53-87`.

```typescript
// Gate 1: SDK parentID
// Gate 2: Hierarchy index
// Gate 3: Pending dispatch registry
return { parentID: undefined, gate: "none" }
```

**Planning warning:** `gate:"none"` result shape is currently ambiguous (`classification.ts:17-22`, `classification.ts:86-87`). Plan should require explicit kind, e.g. root/child/unknownSub, or an equivalent impossible-to-misroute contract.

### 3. Atomic persistence and path safety

**Use for:** all persistence edits and `retry-queue.ts`.

**Analog:** `src/features/session-tracker/persistence/atomic-write.ts:33-42`.

```typescript
export async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}`
  const content = JSON.stringify(data, null, 2)
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, content, "utf-8")
  await rename(tmpPath, filePath)
}
```

**Path traversal guard** (`atomic-write.ts:121-149`):

```typescript
if (sessionID.includes("/") || sessionID.includes("\\") || sessionID.includes("..")) {
  throw new Error(`[Harness] Path traversal detected in sessionID: "${sessionID}"`)
}
const trackerRoot = resolve(projectRoot, SESSION_TRACKER_DIR)
const resolved = resolve(trackerRoot, safe, filename)
if (!resolved.startsWith(trackerRoot + "/") && resolved !== trackerRoot) {
  throw new Error(`[Harness] Path traversal detected — resolved path ...`)
}
```

**Planning instruction:** no new persistence path should concatenate raw session IDs; all state must go through `safeSessionPath()`/`sessionTrackerRoot()`.

### 4. Stateful in-memory service with lifecycle cleanup

**Use for:** `retry-queue.ts` in-memory pending retry records + durable flush.

**Analog:** `src/features/session-tracker/persistence/pending-dispatch-registry.ts:72-93`, `pending-dispatch-registry.ts:241-266`.

```typescript
export class PendingDispatchRegistry {
  private dispatches: Map<string, PendingDispatchEntry> = new Map()
  private callIDToChild: Map<string, string> = new Map()
  private byParent: Map<string, Set<string>> = new Map()
  static readonly STALE_THRESHOLD_MS = 30_000

  cleanupStale(): void {
    const now = Date.now()
    const threshold = PendingDispatchRegistry.STALE_THRESHOLD_MS
    for (const [key, entry] of this.dispatches) {
      if (now - entry.timestamp > threshold) {
        this.dispatches.delete(key)
      }
    }
  }
}
```

**Planning instruction:** retry queue should be a dedicated module, not extra maps in `index.ts`; persistent records should be atomic JSON under `.hivemind/session-tracker/`.

### 5. Test with temp filesystem and disk assertions

**Use for:** all new RC integration tests.

**Analog:** `tests/features/session-tracker/integration/pipeline.test.ts:39-97`.

```typescript
beforeEach(async () => {
  testRoot = resolve(tmpdir(), `hivemind-pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  await mkdir(testRoot, { recursive: true })
  sessionTrackerDir = join(testRoot, ".hivemind", "session-tracker")
  vi.clearAllMocks()
})

afterEach(async () => {
  await rm(testRoot, { recursive: true, force: true })
})
```

**Disk-state assertion pattern** (`pipeline.test.ts:103-159`):

```typescript
await tracker.handleSessionEvent({ eventType: "session.created", sessionID: "ses_child_001", event: {} })
const childDir = join(sessionTrackerDir, "ses_child_001")
expect(existsSync(childDir)).toBe(false)
```

## Data Flow Patterns

### Classify-before-I/O flow

**Current pattern:** `index.ts:272-330`, `index.ts:357-407` classify first, then route child/main.  
**Problem:** `classification.ts:86-87` returns `parentID: undefined` for `gate:"none"`; `index.ts:321-330` treats no parent as main and creates a directory.

**Plan should enforce:**
1. SDK/hierarchy/pending classification runs before `ensureSessionReady()`.
2. Only explicit root classification may call `SessionWriter.createSessionDir()`.
3. Unknown/none path routes to default-sub/degraded, never rogue root.
4. Event paths (`event-capture.ts:182-292`, `event-capture.ts:298-422`) must share the same decision authority or equivalent.

### Child write flow

**Current analog:** `child-writer.ts:222-241`, `child-writer.ts:254-270`, `child-writer.ts:283-305`.

```typescript
const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
return this.enqueueWrite(`${writeParent}/${childSessionID}`, async () => {
  const record = await this.readChildFile(writeParent, childSessionID)
  record.turns.push(turn)
  if (turn.actor !== "user" && turn.content) record.lastMessage = turn.content
  await atomicWriteJson(filePath, record)
})
```

**Plan should enforce:** retry integration wraps/records failures from these exact operations: `createChildFile`, `updateChildStatus`, `appendChildTurn`, `appendJourneyEntry`.

### Recursive hierarchy update flow

**Current anti-pattern:** `session-index-writer.ts:231-234` only checks top-level children.

```typescript
const child = index.hierarchy.children[childSessionID]
if (child) {
  child.status = status
}
```

**Expected pattern:** use `types.ts:251-263` (`ChildHierarchyEntry.children`) recursively. Test analog is `session-index-writer.test.ts:139-168`.

### Parallel children flow

**Analog tests:**
- `child-writer.test.ts:373-394` — 10 concurrent child turns must not lose data.
- `session-index-writer.test.ts:264-291` — 10 concurrent `addChild()` calls must preserve all children.
- `concurrency.test.ts:159-210` — multiple child JSON files under parent/root dir.

**Plan should add:** CP-ST-06 GA-5 tests for 3 children parallel, nested parallel L1/L2, concurrent child writes.

## Persistence And Atomic Write Patterns

### Atomic write

Use `atomicWriteJson()` (`atomic-write.ts:33-42`) and `atomicAppendMarkdown()` (`atomic-write.ts:60-77`) instead of direct `writeFile(target)`.

### Main `.md` frontmatter update

Use `SessionWriter.updateFrontmatter()` pattern (`session-writer.ts:201-219`): read file, `matter(raw)`, merge fields, write tmp, rename. New main `lastMessage` should follow this pattern if stored as YAML frontmatter.

### Child `.json` merge safety

Use `ChildWriter.mergeChildRecord()` (`child-writer.ts:172-191`) to avoid wiping turns/journey on repeated lifecycle creation.

```typescript
return {
  ...existing,
  ...metadata,
  created: existing.created,
  turns: metadata.turns.length > 0 ? metadata.turns : existing.turns,
  children: Array.from(new Set([...existing.children, ...metadata.children])),
  lastMessage: metadata.lastMessage ?? existing.lastMessage,
  journey: nextJourney.length > 0 ? [...existingJourney, ...nextJourney] : existingJourney,
}
```

### Manifest pattern

Use `HierarchyManifestWriter.addChild()` (`hierarchy-manifest.ts:58-90`) and `updateChildStatus()` (`hierarchy-manifest.ts:103-117`) as analog for flat root-owned child lookup. Do not confuse it with nested tree authority in `session-continuity.json`.

## Retry/Error Handling Patterns

### Anti-pattern to replace

`ChildWriter.enqueueWrite()` currently keeps queue alive by swallowing promise rejections (`child-writer.ts:133-145`):

```typescript
const next = current.catch(() => {}).then(async () => {
  await fn()
  this.lastWriteTimes.set(queueKey, Date.now())
})
this.writeQueues.set(queueKey, next.catch(() => {}))
return next
```

**Planner must specify:** stored queue may swallow only to keep chain alive, but the returned operation must reject and the failed operation must create a retry record.

### Logging pattern

Use `[Harness]` log envelope from `index.ts:331-340` and `event-capture.ts:161-170`:

```typescript
void this.client.app?.log?.({
  body: {
    service: "session-tracker",
    level: "warn",
    message: "[Harness] Session tracker: ... failed",
    extra: { error: err instanceof Error ? err.message : String(err) },
  },
})
```

### Retry queue expected boundaries

From `CP-ST-06-CONTEXT.md:30-37`:
- `enqueueWrite()` throws/propagates instead of silent swallow.
- caller catch records in retry queue in-memory + persisted.
- flush on `initialize()` and periodic every 30s.
- max retries 5, exponential backoff 1s/2s/4s/8s/16s.
- after 5 failures mark child `degraded` and log error.

**Planning warning:** `EventCapture.writeImmediateChildFile()` catches and hides child write failure (`event-capture.ts:492-501`). Plan must route this through the same retry/error surface, otherwise RC-5 remains partially unfixed.

## Test Patterns

### Keep/repair valid root-cause tests

| Test | Pattern | Planner action |
|---|---|---|
| `hierarchy-index.test.ts:163-188` | reverse registration root resolution | keep; make pass |
| `hierarchy-index.test.ts:191-200` | stale L3 expectation | update to L2 per `CP-ST-06-CONTEXT.md:41-55` |
| `session-index-writer.test.ts:139-168` | nested status under root-owned hierarchy | keep; implement recursive support |
| `child-writer.test.ts:279-297` | full last assistant message | keep/extend for main `.md` |
| `child-writer.test.ts:204-210` | stale expectation that missing child resolves | rewrite to expect rejection + retry record |

### Prefer real filesystem integration

Use `pipeline.test.ts:39-97` temp-dir setup and disk assertions from `pipeline.test.ts:103-159`. New tests for default-sub/retry/parallel should read actual `.md`, `.json`, `session-continuity.json`, retry record files.

### Avoid private-mock-only tests for rewritten boundaries

`event-capture-classification-first.test.ts:78-107` is useful as a narrow unit analog, but GA-3 requires new tests to verify persistence via public API and real temp filesystem. Unit mocks can remain only for pure classifier/registry logic.

### Required new test files/areas

| Coverage | Suggested placement | Analog |
|---|---|---|
| RC-3 default-sub when `gate:"none"` | `tests/features/session-tracker/integration/default-sub.test.ts` | `pipeline.test.ts:103-159` |
| RC-4 main + child full lastMessage | `tests/features/session-tracker/integration/last-message.test.ts` | `child-writer.test.ts:279-297`, `session-writer.test.ts:284-327` |
| RC-5 retry queue persistence/flush/degraded | `tests/features/session-tracker/persistence/retry-queue.test.ts` + integration | `child-writer.test.ts:340-416`, `pending-dispatch-registry.test` style from source analog |
| GA-5 parallel nested children | `tests/features/session-tracker/integration/parallel-children.test.ts` | `concurrency.test.ts:159-210`, `session-index-writer.test.ts:264-324` |

## Module Extraction Boundaries

### `index.ts` after CP-ST-06

Keep as public barrel + thin `SessionTracker` facade. Existing re-export pattern is `index.ts:14-32`. Constructor and public handler methods can delegate to extracted modules. Target ≤500 LOC per `CP-ST-06-CONTEXT.md:87-94`.

### `session-router.ts`

Owns:
- chat message routing currently at `index.ts:262-341`.
- tool execute after routing currently at `index.ts:357-407`.
- classification result interpretation.

Does **not** own:
- persistence implementation.
- SDK raw calls except via injected `getSessionSafely` callback.
- retry queue internals.

### `child-recorder.ts`

Owns:
- `recordChildToolJourney()` (`index.ts:421-438`).
- `ensureChildRoute()` (`index.ts:450-455`).
- `ensureAncestorRoute()` (`index.ts:463-476`).
- `recordChildTaskDelegation()` (`index.ts:485-556`).

Boundary: accept injected `ChildWriter`, `SessionIndexWriter`, `ProjectIndexWriter`, `HierarchyIndex`, `HierarchyManifestWriter`; do not import `SessionTracker`.

### `initialization.ts`

Owns initialization assembly currently at `index.ts:776-913`, plus helper initialization scans where safe. Pattern from `bootstrap.ts:23-45` should be copied: dependencies explicit, no global singleton.

### `retry-queue.ts`

Owns retry records, backoff metadata, flush behavior. It should not classify sessions and should not own child write logic. It stores failed operation metadata enough to replay through `ChildWriter`/router boundary.

### Leave in current modules

- `classification.ts` remains pure classification authority.
- `hierarchy-index.ts` remains in-memory parent/root/depth index.
- `session-index-writer.ts`, `child-writer.ts`, `session-writer.ts` remain persistence owners.

## Planning Warnings

1. **CONTEXT overrides SPEC for depth.** `SPEC.md:51-54` mentions L3, but locked decision `CP-ST-06-CONTEXT.md:41-55` sets max depth = L2. Planner must not plan L3 implementation.
2. **Do not patch only `handleChatMessage`.** Classification also appears in `handleToolExecuteAfter` (`index.ts:357-407`) and event capture (`event-capture.ts:182-422`). One caller fix leaves rogue roots/data loss elsewhere.
3. **Do not leave `EventCapture.writeImmediateChildFile()` best-effort-only.** Its catch block at `event-capture.ts:492-501` would bypass retry queue.
4. **Do not bulk-delete tests.** GA-3 requires per-test audit/rationale (`CP-ST-06-CONTEXT.md:58-72`).
5. **`SessionIndexWriter.addChild()` signature mismatch risk.** Test `session-index-writer.test.ts:148-155` calls a 6th parent argument, but source `session-index-writer.ts:188-194` accepts 5 args. Planner must decide explicit nested insertion API.
6. **`SessionIndexWriter.enqueueWrite()` also swallows errors.** Research flags this at `CP-ST-06-RESEARCH.md:359-362`; even if GA-1 focuses child writes, nested status failure can remain invisible.
7. **`types.ts` documentation is stale for `lastMessage`.** `types.ts:225-226` says “summary (first 200 chars)” but CP-ST-06 requires full content.
8. **Keep `.opencode/**` untouched.** Phase scope and AGENTS forbid primitive changes for CP-ST-06.
9. **All new source functions/classes need JSDoc.** Project rule from `AGENTS.md:40` and TypeScript strict ESM rules apply.

## PATTERN MAPPING COMPLETE

**Files classified:** 16 source/test targets  
**Analogs found:** 16 / 16  
**Key patterns:** classify-before-I/O, atomic write via safe paths, serial per-file queues, retry record instead of silent swallow, temp-dir integration tests, DI-based module extraction.
