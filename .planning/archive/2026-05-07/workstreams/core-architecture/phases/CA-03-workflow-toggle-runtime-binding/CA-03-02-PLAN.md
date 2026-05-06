---
phase: CA-03-workflow-toggle-runtime-binding
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/delegation-manager.ts
  - src/lib/continuity.ts
  - src/lib/delegation-persistence.ts
  - src/schema-kernel/hivemind-configs.schema.ts
  - tests/lib/delegation-manager.test.ts
  - tests/lib/continuity.test.ts
  - tests/lib/delegation-persistence.test.ts
  - tests/schema-kernel/hivemind-configs.schema.test.ts
autonomous: true
requirements: [CA-03-03, CA-03-04]
tags: [execution-fields, parallelization, atomic-commit, commit-docs, JSDoc, TDD]

must_haves:
  truths:
    - "DelegationManager.dispatch() checks parallelization toggle before wave dispatch"
    - "When parallelization is false, delegations are sequential"
    - "continuity persistStore() checks atomic_commit toggle before persisting"
    - "When atomic_commit is false, state changes are batched in memory"
    - "delegation-persistence persistDelegations() checks commit_docs toggle"
    - "When commit_docs is false, document auto-commit is skipped"
    - "All 3 execution fields default to true (schema defaults preserved per D-17)"
    - "7 unwired toggles have @future-consumer JSDoc annotations with consumer module and target phase"
  artifacts:
    - path: "src/lib/delegation-manager.ts"
      provides: "DelegationManager with parallelization toggle gate"
      contains: "parallelization"
    - path: "src/lib/continuity.ts"
      provides: "Continuity store with atomic_commit toggle gate"
      contains: "atomic_commit"
    - path: "src/lib/delegation-persistence.ts"
      provides: "Delegation persistence with commit_docs toggle gate"
      contains: "commit_docs"
    - path: "src/schema-kernel/hivemind-configs.schema.ts"
      provides: "Schema with @future-consumer JSDoc annotations on 7 toggles"
      contains: "@future-consumer"
  key_links:
    - from: "src/lib/delegation-manager.ts"
      to: "execution config via getCachedConfig()"
      via: "parallelization toggle check in dispatch()"
      pattern: "getCachedConfig.*parallelization"
    - from: "src/lib/continuity.ts"
      to: "execution config via getCachedConfig()"
      via: "atomic_commit toggle check in persistStore()"
      pattern: "getCachedConfig.*atomic_commit"
    - from: "src/lib/delegation-persistence.ts"
      to: "execution config via getCachedConfig()"
      via: "commit_docs toggle check in persistDelegations()"
      pattern: "getCachedConfig.*commit_docs"
---

<objective>
Wire the three execution field toggles (parallelization, atomic_commit, commit_docs) into their respective src/lib/ consumer modules, and annotate the 7 future toggles with @future-consumer JSDoc documentation.

Purpose: Make execution field configuration observable in runtime behavior — delegation dispatch respects parallelization, continuity persistence respects atomic_commit, and delegation persistence respects commit_docs. Document future toggle consumer assignments directly in the schema for discoverability.

Output:
- Modified `src/lib/delegation-manager.ts` — parallelization toggle gate at dispatch() entry
- Modified `src/lib/continuity.ts` — atomic_commit toggle gate at persistStore() entry
- Modified `src/lib/delegation-persistence.ts` — commit_docs toggle gate at persistDelegations() entry
- Modified `src/schema-kernel/hivemind-configs.schema.ts` — 7 @future-consumer JSDoc annotations
- Test files with real-config toggle behavior verification
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md (D-14 through D-18)
@.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-RESEARCH.md (Pattern 3 — Execution Field Consumer Pattern)

<interfaces>
<!-- Key types and contracts for the executor -->

From src/schema-kernel/hivemind-configs.schema.ts:
```typescript
export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>
// Fields: parallelization: boolean (default true), atomic_commit: boolean (default true),
//   commit_docs: boolean (default true), workflow: WorkflowConfig
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>
// Toggles with defaults: research (true), plan_check (true), verifier (true),
//   use_worktrees (false), research_before_questions (true),
//   cross_session_tasks_dependencies_validation (false), trajectory_control (false),
//   advanced_continuity_validation (false), task_plus_enabled (false),
//   ui_phase (false), ui_safety_gate (false), ai_integration_phase (false),
//   discuss_mode ("sufficient-phase-discussion")
```

From src/lib/config-subscriber.ts:
```typescript
export function getConfig(projectRoot: string): HivemindConfigs
export function getCachedConfig(): HivemindConfigs
// getCachedConfig() returns the last config loaded by getConfig().
// No projectRoot needed — config is already cached from plugin init.
```

From src/lib/delegation-manager.ts (dispatch method entry point, lines 162-252):
```typescript
export class DelegationManager {
  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    // Line 163: nesting depth check (FIRST thing)
    // Line 170: workingDirectory resolution
    // Line 174: agent validation
    // Line 175: permission resolution
    // Line 176-192: category gate
    // Line 193-199: queue key resolution + concurrency
    // Line 200: semaphore.acquire()
    // Line 202: spawnDelegatedSession()
    // TOGGLE GATE: add parallelization check as FIRST step (line 163), before nesting depth
  }
}
```

From src/lib/continuity.ts (persistStore function at line 300):
```typescript
function persistStore(): void {
  const continuityFile = getContinuityFile()
  const store = ensureStoreLoaded()
  store.updatedAt = Date.now()
  mkdirSync(dirname(continuityFile), { recursive: true })
  // Atomic write with temp file + rename
  // TOGGLE GATE: add atomic_commit check AFTER ensureStoreLoaded(), BEFORE mkdir/write
}
```

From src/lib/delegation-persistence.ts (persistDelegations at line 57):
```typescript
export function persistDelegations(delegations: Delegation[]): void {
  const filePath = getDelegationsFilePath()
  mkdirSync(dirname(filePath), { recursive: true })
  // Atomic write with temp file + rename
  // TOGGLE GATE: add commit_docs check as FIRST step
}
```

From src/lib/AGENTS.md (module dependency graph — confirmed leaf modules):
```
delegation-manager.ts → concurrency.ts + continuity.ts + delegation-persistence.ts + helpers.ts + types.ts
continuity.ts → types.ts
delegation-persistence.ts → types.ts + continuity.ts
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wire parallelization toggle into DelegationManager.dispatch() (TDD)</name>
  <files>src/lib/delegation-manager.ts, tests/lib/delegation-manager.test.ts</files>
  <read_first>
    - src/lib/delegation-manager.ts (full file, 492 LOC — understand dispatch() method lines 162-252, especially the flow order: nesting depth → working dir → validate agent → category gate → concurrency acquire → spawn → send prompt)
    - src/lib/config-subscriber.ts (full file, 78 LOC — understand getCachedConfig() at line 62, getConfig() at line 41)
    - tests/lib/delegation-manager.test.ts (first 100 lines — understand MockClient type, ManagerInternals, ManagerOptions, test setup pattern)
    - src/hooks/toggle-gates.ts (created in Plan 01 — isToggleEnabled pattern; but DelegationManager should NOT import from hooks/ — it reads config directly from getCachedConfig())
  </read_first>
  <behavior>
    - Test 1: DelegationManager.dispatch() with parallelization=true (default) → dispatch proceeds normally, delegation is created and returned
    - Test 2: DelegationManager.dispatch() with parallelization=false → dispatch still creates delegation but dispatches sequentially (semaphore.acquire with limit=1 instead of concurrency limit)
    - Test 3: DelegationManager with no config cached → parallelization defaults to true via getCachedConfig() fallback (which returns getDefaultConfigs())
    - Test 4: DelegationManager does NOT throw or crash when parallelization is false — it just dispatches sequentially
  </behavior>
  <action>
    Modify `src/lib/delegation-manager.ts` to add parallelization toggle check in the `dispatch()` method:

    **Step 1: Add imports** at top of file:
    ```typescript
    import { getCachedConfig } from "./config-subscriber.js"
    ```

    **Step 2: Add toggle check at FIRST line of dispatch() method** (after the opening brace, before nesting depth check at line 163):
    ```typescript
    async dispatch(params: DelegateParams): Promise<DelegationResult> {
      // CA-03: parallelization toggle gate (D-14)
      // When false, delegations are sequential — concurrency limit clamped to 1.
      const config = getCachedConfig()
      const parallelizationEnabled = config.parallelization

      const nestingDepth = this.resolveNestingDepth(params.parentSessionId)
      // ... rest of existing dispatch logic ...
    ```

    **Step 3: Apply parallelization enforcement** at the concurrency.acquire() call (line 200):
    ```typescript
    const concurrency = resolveAcquireArgs(this.runtimePolicy, acquireQueueKey)
    // CA-03 (D-14): When parallelization is false, force sequential dispatch
    const effectiveLimit = parallelizationEnabled ? concurrency.limit : 1
    const release = await this.semaphore.acquire(acquireQueueKey, effectiveLimit, concurrency.acquireTimeoutMs)
    ```

    **Design rationale:** Use `getCachedConfig()` (not `getConfig(projectRoot)`) because:
    1. DelegationManager does not currently store projectRoot (per RESEARCH.md A2 assumption)
    2. `plugin.ts` calls `getConfig(projectDirectory)` at line 56 BEFORE `new DelegationManager()` at line 59 — config is guaranteed cached before any dispatch
    3. `getCachedConfig()` returns `getDefaultConfigs()` if no config has been loaded, ensuring parallelization=true fallback

    **Write tests FIRST** (tdd="true"): Add 4 parallelization toggle tests to `tests/lib/delegation-manager.test.ts`. Follow existing test patterns with `MockClient`, `DelegationManager` construction, and SDK session mocking. Run `npx vitest run tests/lib/delegation-manager.test.ts -t "parallelization"` — RED (new tests fail). Implement — GREEN.

    **Test strategy:** Use `vi.mock` to control `getCachedConfig()` return value in the test. Mock it to return `HivemindConfigsSchema.parse({ parallelization: false })` for the sequential test. Restore original behavior after tests.

    **Important constraint:** Per D-20, do NOT mock toggle values with `vi.fn()` alone — construct real `HivemindConfigs` objects using `HivemindConfigsSchema.parse({...})` and mock only the config-subscriber import to return them.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/delegation-manager.test.ts -t "parallelization"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "getCachedConfig" src/lib/delegation-manager.ts` returns at least `1`
    - `grep -c "parallelization" src/lib/delegation-manager.ts` returns at least `2` (import + toggle check + enforcement)
    - `npx vitest run tests/lib/delegation-manager.test.ts -t "parallelization"` exits 0 with 4 tests passing
    - `npm run typecheck` exits 0
    - DelegationManager still compiles and passes all existing delegation tests (no regressions)
  </acceptance_criteria>
  <done>DelegationManager dispatches sequentially when parallelization=false — 4 new tests pass, all existing delegation tests still pass</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Wire atomic_commit into continuity + commit_docs into delegation-persistence (TDD)</name>
  <files>
    src/lib/continuity.ts,
    src/lib/delegation-persistence.ts,
    tests/lib/continuity.test.ts,
    tests/lib/delegation-persistence.test.ts
  </files>
  <read_first>
    - src/lib/continuity.ts (persistStore function at lines 300-313 — understand the atomic write flow: ensureStoreLoaded → update timestamp → mkdir → temp write → rename)
    - src/lib/delegation-persistence.ts (persistDelegations at lines 57-71 — understand the atomic write flow: getFilePath → mkdir → temp write → rename)
    - src/lib/config-subscriber.ts (getCachedConfig at line 62 — returns HivemindConfigs without projectRoot)
    - tests/lib/continuity.test.ts (full file, 379 LOC — understand env var setup pattern with OPENCODE_HARNESS_STATE_DIR, temp dir fixtures)
    - tests/lib/delegation-persistence.test.ts (full file, 138 LOC — understand similar env var pattern)
  </read_first>
  <behavior>
    - Test 1: persistStore() with atomic_commit=true (default) → writes to disk normally (atomic write with temp file + rename)
    - Test 2: persistStore() with atomic_commit=false → updates in-memory store timestamp but does NOT write to disk (no temp file created, no mkdir/rename)
    - Test 3: persistStore() with getCachedConfig() returning defaults → atomic_commit=true → writes to disk
    - Test 4: persistDelegations() with commit_docs=true (default) → writes delegations.json to disk normally
    - Test 5: persistDelegations() with commit_docs=false → returns early without writing to disk
    - Test 6: persistDelegations() with getCachedConfig() returning defaults → commit_docs=true → writes to disk
  </behavior>
  <action>
    **PART A: Wire atomic_commit toggle into continuity.ts**

    Modify `src/lib/continuity.ts`:

    1. Add import at top:
    ```typescript
    import { getCachedConfig } from "./config-subscriber.js"
    ```

    2. Modify `persistStore()` function (line 300) to add toggle gate:
    ```typescript
    function persistStore(): void {
      // CA-03: atomic_commit toggle gate (D-15)
      // When false, state changes stay in-memory (batched).
      // Per D-15: "When false, state changes are batched" — accumulate in memory,
      // flush at lifecycle events. Never skip entirely (would lose state).
      // NOTE: In-memory batching behavior is a lifecycle concern for CA-04.
      // For CA-03, we gate the write but keep the store updated in memory.
      const config = getCachedConfig()
      const store = ensureStoreLoaded()
      store.updatedAt = Date.now()
      if (!config.atomic_commit) {
        return  // Skip disk write — state remains in memory for later flush
      }

      const continuityFile = getContinuityFile()
      mkdirSync(dirname(continuityFile), { recursive: true })
      const tmpFile = `${continuityFile}.${process.pid}.${randomUUID()}.tmp`
      const redactedStore = redactBoundaryFields(store, {
        redactFieldNames: ["prompt", "result", "error", "output", "resultSummary", "summary", "lastMessageOutput", "description"],
      })
      writeFileSync(tmpFile, `${JSON.stringify(redactedStore, null, 2)}\n`, "utf8")
      renameSync(tmpFile, continuityFile)
    }
    ```

    Critical ordering: `ensureStoreLoaded()` and `store.updatedAt` must happen BEFORE the toggle check, so in-memory state is always current even when disk write is skipped.

    **PART B: Wire commit_docs toggle into delegation-persistence.ts**

    Modify `src/lib/delegation-persistence.ts`:

    1. Add import at top:
    ```typescript
    import { getCachedConfig } from "./config-subscriber.js"
    ```

    2. Modify `persistDelegations()` function (line 57) to add toggle gate as FIRST step:
    ```typescript
    export function persistDelegations(delegations: Delegation[]): void {
      // CA-03: commit_docs toggle gate (D-16)
      // When false, document auto-commit is skipped.
      const config = getCachedConfig()
      if (!config.commit_docs) {
        return  // Skip document persistence
      }

      const filePath = getDelegationsFilePath()
      mkdirSync(dirname(filePath), { recursive: true })
      // ... rest of existing atomic write logic unchanged ...
    ```

    **Write tests FIRST** (tdd="true"): 
    - Add 3 atomic_commit tests to `tests/lib/continuity.test.ts` following env var patterns
    - Add 3 commit_docs tests to `tests/lib/delegation-persistence.test.ts` following env var patterns
    
    Run `npx vitest run tests/lib/continuity.test.ts tests/lib/delegation-persistence.test.ts` — RED (new tests fail). Implement — GREEN.

    **Test strategy for continuity/atomic_commit:**
    - Mock `getCachedConfig()` to return config with `atomic_commit: false`
    - Call `recordSessionContinuity()` (which triggers persistStore internally)
    - Assert that no temp file or final file was created on disk
    - Clean up mock after test

    **Test strategy for delegation-persistence/commit_docs:**
    - Mock `getCachedConfig()` to return config with `commit_docs: false`
    - Call `persistDelegations([...])` with a delegation
    - Assert that no delegations.json file was created on disk
    - Clean up mock after test
  </action>
  <verify>
    <automated>npx vitest run tests/lib/continuity.test.ts tests/lib/delegation-persistence.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "atomic_commit" src/lib/continuity.ts` returns at least `2` (import + toggle check)
    - `grep -c "commit_docs" src/lib/delegation-persistence.ts` returns at least `2` (import + toggle check)
    - `grep -c "getCachedConfig" src/lib/continuity.ts` returns at least `1`
    - `grep -c "getCachedConfig" src/lib/delegation-persistence.ts` returns at least `1`
    - `npx vitest run tests/lib/continuity.test.ts` — all tests pass (existing + 3 new atomic_commit tests)
    - `npx vitest run tests/lib/delegation-persistence.test.ts` — all tests pass (existing + 3 new commit_docs tests)
    - `npm run typecheck` exits 0
    - persistStore() still updates `store.updatedAt` even when atomic_commit is false (in-memory state preserved)
    - All existing continuity and delegation-persistence tests still pass (no regressions)
  </acceptance_criteria>
  <done>Both execution field toggles wired — atomic_commit gates disk writes in continuity, commit_docs gates persistence in delegation-persistence; 6 new tests pass, all existing tests preserved</done>
</task>

<task type="auto">
  <name>Task 3: Add @future-consumer JSDoc annotations to 7 unwired toggles in schema + validation test</name>
  <files>src/schema-kernel/hivemind-configs.schema.ts, tests/schema-kernel/hivemind-configs.schema.test.ts</files>
  <read_first>
    - src/schema-kernel/hivemind-configs.schema.ts (lines 110-155 — WorkflowConfigInnerSchema with all 13 toggle field definitions and their Zod .default() values)
    - tests/schema-kernel/hivemind-configs.schema.test.ts (first 50 lines — understand imports, describe/it patterns, existing toggle tests)
  </read_first>
  <behavior>
    - Test 1: WorkflowConfigSchema parsing still works correctly — all 13 toggles parse with defaults (regression)
    - Test 2: Each of the 7 future toggles has a @future-consumer JSDoc tag in the schema file (verified via grep on source file, not runtime)
    - Test 3: The @future-consumer format is "@future-consumer {module} — CA-04" or "@future-consumer {module} — Future"
  </behavior>
  <action>
    Modify `src/schema-kernel/hivemind-configs.schema.ts` to add `@future-consumer` JSDoc annotations to 7 unwired toggles in `WorkflowConfigInnerSchema` (lines 131-145). 

    Add a `@future-consumer` tag on each toggle's JSDoc comment. The format is:
    ```
    @future-consumer {module-name} — {target-phase}
    ```

    Per D-18, the exact annotations to add are:

    | Current line | Toggle field | JSDoc to add |
    |-------------|-------------|-------------|
    | 133 | `cross_session_tasks_dependencies_validation` | `@future-consumer lifecycle-manager.ts — CA-04` |
    | 134 | `trajectory_control` | `@future-consumer hivemind-trajectory tool — CA-04` |
    | 135 | `advanced_continuity_validation` | `@future-consumer continuity.ts — CA-04` |
    | 136 | `task_plus_enabled` | `@future-consumer task-status.ts — CA-04` |
    | 139 | `ui_phase` | `@future-consumer sidecar UI (WS-2/WS-8) — Future` |
    | 140 | `ui_safety_gate` | `@future-consumer sidecar UI (WS-2/WS-8) — Future` |
    | 141 | `ai_integration_phase` | `@future-consumer WS-4 workstream — Future` |

    **IMPORTANT:** The JSDoc must go on the field definition line itself or on the line immediately preceding it within the `z.object({...})` block. The existing fields at lines 133-141 are inside `WorkflowConfigInnerSchema = z.object({...})`.

    Example for `trajectory_control` (line 134):
    ```typescript
    /** @future-consumer hivemind-trajectory tool — CA-04 */
    trajectory_control: z.boolean().default(false),
    ```

    **DO NOT MODIFY** the Zod schema structure, field names, types, or defaults. Only add JSDoc comments.

    **Add a validation test** to `tests/schema-kernel/hivemind-configs.schema.test.ts`:
    ```typescript
    describe("@future-consumer annotations", () => {
      it("all 7 future toggles have @future-consumer JSDoc tags", () => {
        // This test reads the source file directly to verify JSDoc tags exist.
        // JSDoc is a documentation artifact — runtime parsing confirms schema works,
        // but grep on source confirms annotations are present.
        const schemaSource = readFileSync(
          join(import.meta.dirname ?? __dirname, "../../src/schema-kernel/hivemind-configs.schema.ts"),
          "utf-8"
        )
        const futureConsumerCount = (schemaSource.match(/@future-consumer/g) || []).length
        expect(futureConsumerCount).toBeGreaterThanOrEqual(7)
      })
    })
    ```

    **No TDD required** for this task — pure documentation annotations. The validation test is a static analysis grep check, not runtime behavior.
  </action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts -t "future-consumer"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "@future-consumer" src/schema-kernel/hivemind-configs.schema.ts` returns at least `7`
    - `grep -c "@future-consumer lifecycle-manager.ts" src/schema-kernel/hivemind-configs.schema.ts` returns `1`
    - `grep -c "@future-consumer hivemind-trajectory tool" src/schema-kernel/hivemind-configs.schema.ts` returns `1`
    - `grep -c "@future-consumer continuity.ts" src/schema-kernel/hivemind-configs.schema.ts` returns `1`
    - `grep -c "@future-consumer task-status.ts" src/schema-kernel/hivemind-configs.schema.ts` returns `1`
    - `grep -c "@future-consumer sidecar UI" src/schema-kernel/hivemind-configs.schema.ts` returns `2`
    - `grep -c "@future-consumer WS-4 workstream" src/schema-kernel/hivemind-configs.schema.ts` returns `1`
    - All 44 existing schema tests still pass (no regressions — JSDoc comments do not affect schema behavior)
    - `npm run typecheck` exits 0
    - `npm test -- tests/schema-kernel/hivemind-configs.schema.test.ts` exits 0
  </acceptance_criteria>
  <done>7 toggles annotated with @future-consumer JSDoc — all consumer modules and target phases documented, existing schema tests preserved</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plugin init → module execution | Config values cross from init-time cache into runtime module behavior |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CA03-05 | Denial of Service | DelegationManager.dispatch() | mitigate | When parallelization=false, use semaphore limit=1 (NOT throwing or blocking indefinitely). Delegations still proceed serially — no deadlock risk. |
| T-CA03-06 | Tampering | continuity persistStore() | mitigate | atomic_commit toggle check happens AFTER `ensureStoreLoaded()` and `store.updatedAt` update — in-memory state always current even when disk write skipped. Prevents stale-state-on-toggle-flip. |
| T-CA03-07 | Tampering | delegation-persistence persistDelegations() | mitigate | commit_docs toggle check is FIRST operation in persistDelegations() — no partial writes, no temp files. Clean early return. |
| T-CA03-08 | Elevation of Privilege | getCachedConfig() usage in lib modules | mitigate | getCachedConfig() returns Zod-parsed config with defaults — no raw JSON access, no schema bypass. Toggle values come from validated source only. |
</threat_model>

<verification>
1. `npm run typecheck` — 0 errors
2. `npx vitest run tests/lib/delegation-manager.test.ts tests/lib/continuity.test.ts tests/lib/delegation-persistence.test.ts tests/schema-kernel/hivemind-configs.schema.test.ts` — all pass
3. `npm test` — full suite passes (1690+ tests, 2 pre-existing session-journal failures acceptable)
4. Manual grep: verify @future-consumer count, toggle field presence, getCachedConfig usage
</verification>

<success_criteria>
- DelegationManager dispatches sequentially when parallelization=false (enforced via concurrency limit=1)
- Continuity persistStore() skips disk writes when atomic_commit=false (in-memory state still updated)
- Delegation-persistence persistDelegations() skips writes when commit_docs=false
- All execution field default values preserved: true for all three (Zod schema defaults unchanged)
- 7 @future-consumer JSDoc annotations in schema file — one per unwired toggle
- All existing delegation, continuity, persistence, and schema tests still pass (no regressions)
- No new dependencies, no architectural departures, no new files (all modifications to existing modules)
</success_criteria>

<output>
After completion, create `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-02-SUMMARY.md`
</output>
