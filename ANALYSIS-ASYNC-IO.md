# Analysis: Async Hot-Path I/O for Cluster 9

**Analyzed:** `delegation-store.ts`, `trajectory-store.ledger.ts`, `workflow-authority.ts`, `opencode-skill-registry.ts`, `task-lifecycle.ts`

**Date:** 2026-03-21
**Worktree:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/`

---

## 1. `src/delegation/delegation-store.ts`

### Sync Calls Made

| Call | Line | Function | Purpose |
|------|------|----------|---------|
| `fs.mkdirSync(directory, { recursive: true })` | 56 | `ensureHandoffDirectory()` | Ensure handoffs directory exists |
| `fs.existsSync(filePath)` | 67 | `readHandoffFileResult()` | Check if handoff file exists |
| `fs.readFileSync(filePath, 'utf-8')` | 73 | `readHandoffFileResult()` | Read handoff JSON file |
| `fs.writeFileSync(path, data)` | 125 | `writeHandoffRecord()` | Write handoff record to disk |
| `fs.readdirSync(directory)` | 165 | `listDelegationHandoffs()` | List all handoff files |

### Functions Using Sync Calls

- `ensureHandoffDirectory()` — called by `writeHandoffRecord()`
- `readHandoffFileResult()` — called by `readHandoffFile()`, `updateDelegationHandoff()`, `validateDelegationHandoff()`
- `writeHandoffRecord()` — called by `createDelegationHandoff()`, `updateDelegationHandoff()`, `validateDelegationHandoff()`, `closeDelegationHandoff()`
- `readHandoffFile()` — called by `readDelegationHandoff()`
- `listDelegationHandoffs()` — exported function, reads all `.json` files in handoffs directory

### Hot Path Classification

| Operation | Path Type | Notes |
|-----------|-----------|-------|
| `createDelegationHandoff()` | **Per-request hot path** | Called on every delegation creation |
| `readDelegationHandoff()` | **Per-request hot path** | Called on every delegation read |
| `listDelegationHandoffs()` | **Per-request hot path** | Called when listing handoffs; reads ALL files |
| `updateDelegationHandoff()` | **Per-request hot path** | Called on every update |
| `validateDelegationHandoff()` | **Per-request hot path** | Called on validation (may write) |
| `closeDelegationHandoff()` | **Per-request hot path** | Called on close (writes) |

### API Convertibility

**Recommendation: Safe to convert to async**

- All exported CRUD functions are synchronous but could be converted to `async`
- No external sync-only consumers identified
- Breaking change but manageable with incremental migration

### Additional Concern

`listDelegationHandoffs()` uses `readdirSync` + `readFileSync` for each file — O(n) file reads on every list operation. Should consider memoization or indexing.

---

## 2. `src/core/trajectory/trajectory-store.ledger.ts`

### Sync Calls Made

| Call | Line | Function | Purpose |
|------|------|----------|---------|
| `fsSync.existsSync(filePath)` | 23 | `fileExistsSync()` | Sync wrapper for existence check |
| `fsSync.readFileSync(filePath, 'utf-8')` | 117 | `loadTrajectoryLedgerSync()` | Load ledger synchronously |
| `fsSync.readFileSync(filePath, 'utf-8')` | 141 | `inspectTrajectoryLedger()` | Read ledger for health inspection |

### Already Has Async Variants

| Async Call | Line | Function | Notes |
|------------|------|----------|-------|
| `fs.access(filePath)` | 19 | `fileExists()` | Async existence check |
| `fs.mkdir(path, { recursive: true })` | 77 | `saveTrajectoryLedger()` | Async mkdir |
| `fs.writeFile(path, data)` | 78 | `saveTrajectoryLedger()` | Async write |
| `fs.readFile(path, 'utf-8')` | 98 | `loadTrajectoryLedger()` | Async read |

### Hot Path Classification

| Function | Path Type | Notes |
|----------|-----------|-------|
| `createEmptyLedger()` | Startup only | Pure in-memory |
| `normalizeLedger()` | Any | In-memory transformation |
| `saveTrajectoryLedger()` | **Async, per-write** | Used by callers that already support async |
| `loadTrajectoryLedger()` | **Async, per-read** | The preferred async variant |
| `loadTrajectoryLedgerSync()` | **Hot path** | Sync variant used when async isn't viable |
| `inspectTrajectoryLedger()` | **Health checks** | Called by `ensureTrajectoryLedger()` and external inspection |

### API Convertibility

**Recommendation: Memoization needed**

- `loadTrajectoryLedger()` already exists as async — callers should migrate to it
- `loadTrajectoryLedgerSync()` is the problem — used when callers need sync but could be refactored
- `inspectTrajectoryLedger()` could be async but inspection is typically called in repair/bootstrapping contexts
- **This file is already partially async** — the issue is callers preferring the sync variant

### Key Finding

This file already has proper async infrastructure. The sync calls are **escape hatches** for code that hasn't been converted yet. Solution is to convert callers, not this file.

---

## 3. `src/core/workflow-management/workflow-authority.ts`

### Sync Calls Made

| Call | Line | Function | Purpose |
|------|------|----------|---------|
| `fs.existsSync(filePath)` | 39 | `parseTaskCollection()` | Check task file exists |
| `fs.readFileSync(filePath, 'utf-8')` | 44 | `parseTaskCollection()` | Read task collection JSON |
| `fs.existsSync(hivemindPath)` | 58 | `inspectWorkflowAuthority()` | Check .hivemind dir exists |
| `fs.existsSync(planningPath)` | 69 | `inspectWorkflowAuthority()` | Check planning root exists |
| `fs.mkdirSync(phaseDir, { recursive: true })` | 152 | `bootstrapWorkflowAuthority()` | Create control plane dir |
| `fs.mkdirSync(dir, { recursive: true })` | 153 | `bootstrapWorkflowAuthority()` | Create state dir |
| `fs.mkdirSync(dir, { recursive: true })` | 154 | `bootstrapWorkflowAuthority()` | Create graph dir |
| `fs.writeFileSync(path, data)` | 157-161 | `bootstrapWorkflowAuthority()` | Write planning index.json |
| `fs.writeFileSync(path, data)` | 163-167 | `bootstrapWorkflowAuthority()` | Write project-state.json |
| `fs.writeFileSync(path, data)` | 170-175 | `bootstrapWorkflowAuthority()` | Write 00-01-PLAN.md |
| `fs.writeFileSync(path, data)` | 177-179 | `bootstrapWorkflowAuthority()` | Write state tasks.json |
| `fs.writeFileSync(path, data)` | 181-183 | `bootstrapWorkflowAuthority()` | Write graph tasks.json |

### Hot Path Classification

| Function | Path Type | Notes |
|----------|-----------|-------|
| `parseTaskCollection()` | **Per-request** | Called by `inspectWorkflowAuthority()` which is called on every status check |
| `inspectWorkflowAuthority()` | **Per-request** | Called by repair, bootstrap, and status checks |
| `bootstrapWorkflowAuthority()` | **Startup/shutdown only** | Only called during initial setup |
| `repairWorkflowAuthority()` | **Repair scenarios** | Called when repair is needed |

### API Convertibility

**Recommendation: Split by usage**

| Function | Recommendation | Rationale |
|----------|---------------|------------|
| `parseTaskCollection()` | **Safe to convert to async** | Internal, called only by `inspectWorkflowAuthority()` |
| `inspectWorkflowAuthority()` | **Leave as sync** | Used for quick health/status checks; blocking is acceptable for inspection |
| `bootstrapWorkflowAuthority()` | **Leave as sync** | Runs at startup only; blocking is acceptable |
| `repairWorkflowAuthority()` | **Leave as sync** | Repair scenarios are not hot path |

---

## 4. `src/shared/opencode-skill-registry.ts`

### Sync Calls Made

| Call | Line | Function | Purpose |
|------|------|----------|---------|
| `readdirSync(fullPath, { withFileTypes: true })` | 73 | `readMarkdownFiles()` | List markdown files in directory |
| `readFileSync(join(...), 'utf-8')` | 76 | `readMarkdownFiles()` | Read individual markdown file |
| `readdirSync(skillsRoot, { withFileTypes: true })` | 92 | `discoverSkills()` | List skill directories |
| `statSync(skillFile)` | 98 | `discoverSkills()` | Check if SKILL.md exists |
| `readFileSync(sourcePath, 'utf-8')` | 114 | `buildRegistryEntry()` | Read SKILL.md source |

### Hot Path Classification

| Function | Path Type | Notes |
|----------|-----------|-------|
| `readMarkdownFiles()` | Startup/build time | Called during registry creation |
| `discoverSkills()` | **Startup only** | Called once when creating registry |
| `buildRegistryEntry()` | **Startup only** | Called once when creating registry |
| `createOpencodeSkillRegistry()` | **Startup only** | Single call at initialization |

### API Convertibility

**Recommendation: Leave as sync**

- This is **startup-only code**, not on any per-request hot path
- Called once during initialization
- Converting to async would add complexity with zero runtime benefit
- No external consumers on critical paths

---

## 5. `src/core/workflow-management/task-lifecycle.ts`

### Sync Calls Made

| Call | Line | Function | Purpose |
|------|------|----------|---------|
| `fs.existsSync(filePath)` | 81 | `loadLifecycleState()` | Check task file exists |
| `fs.readFileSync(filePath, 'utf-8')` | 86 | `loadLifecycleState()` | Read task state JSON |
| `fs.mkdirSync(path, { recursive: true })` | 124-125 | `saveLifecycleState()` | Create state/graph directories |
| `fs.writeFileSync(path, data)` | 127 | `saveLifecycleState()` | Write state tasks.json |
| `fs.writeFileSync(path, data)` | 128 | `saveLifecycleState()` | Write graph tasks.json (duplicate write) |

### Hot Path Classification

| Function | Path Type | Notes |
|----------|-----------|-------|
| `loadLifecycleState()` | **Per-request** | Called by ALL exported functions |
| `saveLifecycleState()` | **Per-request** | Called after every mutation |
| `activateWorkflowTask()` | **Per-request hot path** | Core task activation |
| `createWorkflowTask()` | **Per-request hot path** | Core task creation |
| `verifyWorkflowTask()` | **Per-request hot path** | Core task verification |
| `completeWorkflowTask()` | **Per-request hot path** | Core task completion |
| `readWorkflowTaskState()` | **Per-request hot path** | Read state |
| `readWorkflowTask()` | **Per-request hot path** | Read single task |
| `listWorkflowTasks()` | **Per-request hot path** | List tasks |

### Additional Concern

`saveLifecycleState()` writes the **same data to two files** (`stateTasksPath` and `graphTasksPath`). This is a double-write on every mutation.

### API Convertibility

**Recommendation: Safe to convert to async**

- All exported functions are sync but could be async
- No external sync-only consumers identified
- However, the **double-write pattern** (writing same data to 2 files) should be reconsidered — is the graph copy necessary?

---

## Summary Table

| File | Sync Calls | Hot Path? | Recommendation |
|------|------------|-----------|----------------|
| `delegation-store.ts` | 5 calls across 4 functions | Yes | **Safe to convert to async** |
| `trajectory-store.ledger.ts` | 3 calls (has async variants) | Partial | **Memoization needed** — callers should use existing `async` variants |
| `workflow-authority.ts` | 11 calls across 4 functions | Partial | **Leave as sync** (inspection/startup) |
| `opencode-skill-registry.ts` | 5 calls across 4 functions | No (startup only) | **Leave as sync** |
| `task-lifecycle.ts` | 5 calls (incl. double-write) | Yes | **Safe to convert to async** |

---

## Prioritized Action Items

### High Priority (Per-Request Hot Path)

1. **`delegation-store.ts`** — Convert to async
   - All CRUD operations block on every request
   - `listDelegationHandoffs()` does O(n) file reads — consider caching/indexing

2. **`task-lifecycle.ts`** — Convert to async
   - Every task operation blocks
   - **Remove double-write** to `stateTasksPath` and `graphTasksPath` unless graph copy is required

### Medium Priority (Partial Hot Path)

3. **`trajectory-store.ledger.ts`** — Migrate callers to async variants
   - Already has `loadTrajectoryLedger()` async variant
   - Find and convert sync callers (`loadTrajectoryLedgerSync()` → `loadTrajectoryLedger()`)

### Low Priority (Not Hot Path)

4. **`workflow-authority.ts`** — Leave as sync
   - `inspectWorkflowAuthority()` is for health checks (acceptable to block)
   - `bootstrapWorkflowAuthority()` is startup only

5. **`opencode-skill-registry.ts`** — Leave as sync
   - Startup-only code path
   - Converting adds complexity with no runtime benefit

---

## Risk Assessment

| Conversion | Breaking Change Risk | Effort | Notes |
|------------|---------------------|--------|-------|
| `delegation-store.ts` → async | Medium | Medium | All callers must become async |
| `task-lifecycle.ts` → async | Medium | Medium | All callers must become async |
| `trajectory-store.ledger.ts` caller migration | Low | Low | Async variants already exist |
| `workflow-authority.ts` | N/A | N/A | Not recommended for conversion |
| `opencode-skill-registry.ts` | N/A | N/A | Not recommended for conversion |
