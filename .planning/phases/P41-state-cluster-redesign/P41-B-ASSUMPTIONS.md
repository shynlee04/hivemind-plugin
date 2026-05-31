# Phase P41-B: Add 8 Gap Fields to Session-Tracker Types + Redirect Writers — Assumptions

**Phase:** P41-B  
**Domain:** State cluster redesign — write-side migration  
**Date:** 2026-05-31  
**Sources:** SPEC, `ChildSessionRecord` (types.ts), `ChildWriter` (child-writer.ts), `persistDelegations()` (delegation-persistence.ts), `persistStore()`/`recordSessionContinuity()`/`patchSessionContinuity()` (continuity/index.ts), `DelegationStateMachine` (state-machine.ts), `Delegation` type (coordination/delegation/types.ts), `GovernancePersistenceState` (shared/types.ts), governance evaluator (evaluator.ts), `HierarchyManifestWriter` (hierarchy-manifest.ts), `constructDependencies` (initialization.ts)

---

## Assumptions

### A1: Adding optional fields to `ChildSessionRecord` will not break any existing construction site

- **Statement:** The 7 new optional fields (`pendingNotifications`, `queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`, `compactionCheckpoint`, `lifecycle`) marked with `?` will not cause type errors anywhere that constructs a `ChildSessionRecord` literal.
- **Evidence source:** `ChildSessionRecord` already has 6 optional fields (`lastMessage?`, `journey?`, plus `DelegatedBy` sub-fields are required). Existing construction sites in tests and production code do not supply these optional fields. TypeScript's structural type system allows extra optional properties — adding new ones is backward-compatible. [VERIFIED: codebase inspection — `src/features/session-tracker/types.ts:211-236`]
- **Confidence:** HIGH
- **Risk if wrong:** Low. If a construction site somehow fails, the typecheck gate (`npm run typecheck`) would catch it immediately. The fix would be trivial (add the field).

---

### A2: The `PendingNotification` type import path resolves correctly from `src/features/session-tracker/types.ts`

- **Statement:** `import type { PendingNotification } from "../../shared/types.js"` resolves at both typecheck time and runtime.
- **Evidence source:** The file `src/features/session-tracker/types.ts` is at `src/features/session-tracker/types.ts`. The path `../../shared/types.js` resolves to `src/shared/types.js`. The `PendingNotification` type is exported from `src/shared/types.ts:31`. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. The relative path is correct. If the import had a typo, typecheck would fail.

---

### A3: The 6 MEDIUM gap field types import from `../../coordination/delegation/types.js` without circular dependency

- **Statement:** Importing `DelegationTerminalKind` and `DelegationRecoveryGuarantee` from `../../coordination/delegation/types.js` into `src/features/session-tracker/types.ts` will not create a circular dependency.
- **Evidence source:** `src/features/session-tracker/types.ts` currently has zero imports from `src/coordination/`. The file imports only from `node:fs/promises`, `node:path`, and local same-directory modules. `src/coordination/delegation/types.ts` exports pure type interfaces and does not import from `src/features/`. This is a leaf-level type import — no circular dependency. [VERIFIED: codebase inspection — types.ts:1-19 has no coordination imports]
- **Confidence:** HIGH
- **Risk if wrong:** Medium. A circular dependency could cause runtime import order issues or typecheck failures. The project enforces no-circular-dependency rules. If the import path creates a cycle, the build step (`npm run build` or `npm run typecheck`) will fail.

---

### A4: `persistDelegations()` can call `ChildWriter.createChildFile()` and `HierarchyManifestWriter.addChild()` without architectural violation

- **Statement:** The `persistDelegations()` function in `delegation-persistence.ts` can be modified to accept or construct a `ChildWriter` and `HierarchyManifestWriter`, then call their methods for dual-write.
- **Evidence source:** `persistDelegations()` is a pure synchronous function (`sync` fs, no async). `ChildWriter.createChildFile()` is async (returns `Promise<void>`, uses `fs/promises`). The caller chain is: `DelegationStateMachine.persistAll()` → `persistDelegations()`. `DelegationStateMachine.persistAll()` is called synchronously from multiple places including `transition()` and `transitionToTerminal()`. Making `persistAll()` async would require changing the call chain. [VERIFIED: codebase inspection — delegation-persistence.ts:58 is sync; child-writer.ts:408 is async; state-machine.ts:214 is sync calling persistDelegations at line 218]
- **Confidence:** HIGH
- **Risk if wrong:** High. If the dual-write must be async but the call chain expects sync, there are two approaches: (1) fire-and-forget the async write (acceptable for dual-write since the old sync path still works), or (2) make `persistAll()` async and update all callers. The SPEC does not explicitly address this sync→async impedance mismatch. The fire-and-forget pattern (`void childWriter.createChildFile(...)`) is the most likely implementation and carries a LOW risk of dropped writes on process exit (mitigated by the old sync path still writing to `delegations.json`).

---

### A5: The status mapping (`Delegation.status` → `ChildSessionRecord.status`) covers all possible values

- **Statement:** The 5 Delegation statuses map to 3 ChildSessionRecord statuses deterministically:
  - `"dispatched"` → `"active"`
  - `"running"` → `"active"`
  - `"completed"` → `"completed"`
  - `"error"` → `"error"`
  - `"timeout"` → `"error"`
- **Evidence source:** SPEC table REQ-P41B-04-AC4. `DelegationStatus` is a union of `"dispatched" | "running" | "completed" | "error" | "timeout"` (delegation-persistence.ts:10-16). `ChildSessionRecord.status` is typed as `string` (types.ts:225) — any value is accepted. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. Even if a new delegation status is added in the future (e.g., `"cancelled"`), the `ChildSessionRecord.status` field is `string` and would accept it — the new value would pass through. The reverse mapping in P41-C readers would handle the new value.

---

### A6: `Delegation.childSessionId` and `Delegation.parentSessionId` are always populated by the time `persistDelegations()` is called

- **Statement:** Every delegation record passed to `persistDelegations()` has valid `childSessionId` and `parentSessionId` strings.
- **Evidence source:** `persistDelegations()` receives the full in-memory delegation set from `DelegationStateMachine.persistAll()` → `Array.from(this.delegations.values())` (state-machine.ts:218). Every `Delegation` record is constructed through dispatch flows that set both fields. The `Delegation` interface requires both as `string` (coordination/delegation/types.ts:28-29). [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low (handled by SPEC's graceful skip). The SPEC mandates: if `childSessionId` or `parentSessionId` is missing/invalid, skip that record and log a warning (REQ-P41B-04-AC6). No data loss because the old path still writes to `delegations.json`.

---

### A7: `ChildWriter` and `HierarchyManifestWriter` are available/constructable from `delegation-persistence.ts`

- **Statement:** The dual-write implementation can obtain `ChildWriter` and `HierarchyManifestWriter` instances through dependency injection or construction.
- **Evidence source:** `ChildWriter` constructor requires `{ projectRoot, hierarchyIndex?, retryQueue?, manifestWriter? }` (child-writer.ts:85-95). `HierarchyManifestWriter` constructor requires `{ projectRoot }` (hierarchy-manifest.ts). Both can be constructed from just a `projectRoot`. `delegation-persistence.ts` already accesses `getContinuityStoragePath()` which depends on `projectRoot`. [VERIFIED: codebase inspection]
- **Confidence:** MEDIUM
- **Risk if wrong:** Medium. If `delegation-persistence.ts` is called at a point where the session-tracker subsystem hasn't been initialized (e.g., during early startup before `constructDependencies` runs), the `ChildWriter`/`HierarchyManifestWriter` instances might not be available. The SPEC assumes these are injectable, but the actual module does not currently accept dependency injection. The implementation will likely need to either (a) construct fresh instances internally using `projectRoot`, or (b) add DI parameters to `persistDelegations()`. Approach (a) is safe because both constructors have trivial deps. Approach (b) would require changing all `persistDelegations()` call sites.

---

### A8: The `Delegation.executionMode` field maps directly to `ChildSessionRecord.executionMode` without transformation

- **Statement:** `Delegation.executionMode: "sdk" | "pty" | "headless"` is assigned directly to `ChildSessionRecord.executionMode` with the same union type.
- **Evidence source:** SPEC field mapping table row `executionMode | executionMode | direct`. Both types use the same union: `"sdk" | "pty" | "headless"`. [VERIFIED: codebase inspection — Delegation.executionMode at coordination/delegation/types.ts:48, SPEC REQ-P41B-02 table]
- **Confidence:** HIGH
- **Risk if wrong:** Low. Direct assignment of identical union types — TypeScript compiler enforces compatibility.

---

### A9: The `Delegation.createdAt` (Unix ms) → `ChildSessionRecord.created` (ISO 8601) conversion is possible and correct

- **Statement:** `new Date(delegation.createdAt).toISOString()` produces the correct `created` timestamp for the child record.
- **Evidence source:** `Delegation.createdAt` is typed `number` (coordination/delegation/types.ts:36) and documented as Unix millisecond timestamp. `ChildSessionRecord.created` is typed `string` (types.ts:221) and documented as ISO 8601. `new Date(number).toISOString()` is the standard JavaScript conversion. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. Standard `Date` constructor handles Unix ms correctly. The conversion is well-tested. If `createdAt` is `0` or `NaN` (edge case), it produces `"1970-01-01T00:00:00.000Z"` or `"Invalid Date"` — both unlikely given the `createdAt` is set from `Date.now()` during delegation creation.

---

### A10: `recordSessionContinuity()` and `patchSessionContinuity()` have access to `ChildSessionRecord` file state

- **Statement:** When these continuity store functions run their dual-write, they can determine whether a `ChildSessionRecord` file exists for the session ID, and write/update it accordingly.
- **Evidence source:** `recordSessionContinuity()` receives a `SessionContinuityRecord` with `sessionID` field. `patchSessionContinuity()` receives a `sessionID` string. Both would need to construct a `ChildWriter` instance to check file existence and write. The `ChildWriter` constructor requires `{ projectRoot }` (child-writer.ts:85). `continuity/index.ts` already has `getCanonicalStateDir()` and `getContinuityFile()` which use `projectRoot`. [VERIFIED: codebase inspection — continuity/index.ts:23-52, child-writer.ts:85-95]
- **Confidence:** MEDIUM
- **Risk if wrong:** Medium. Same as A7 — dependency injection surface. The continuity module is a top-level module that doesn't currently accept `ChildWriter` injection. Adding dual-write requires either constructing a `ChildWriter` internally or adding it as a module-level dependency. Constructing internally is safe (trivial deps) but means the `continuity/index.ts` module gains a dependency on `src/features/session-tracker/persistence/child-writer.js`, which is a cross-domain import (task-management → features). This may violate module boundary conventions.

---

### A11: The `compactionCheckpoint` and `lifecycle` fields are never populated on disk for existing child records

- **Statement:** These fields from `SessionContinuityMetadata` are "never populated on disk" per the SPEC, meaning their values always come from the in-memory continuity store, not from disk-based `ChildSessionRecord` files.
- **Evidence source:** SPEC REQ-P41B-02 notes column: "From continuity store — never populated on disk." The in-memory `SessionContinuityRecord` is the source of truth for these fields. They are written to `ChildSessionRecord` as part of the dual-write redirect (REQ-P41B-05-AC1). [VERIFIED: SPEC tables]
- **Confidence:** HIGH (assumption is documented in the SPEC itself)
- **Risk if wrong:** Low. If an old `ChildSessionRecord` file on disk does somehow have these fields, the dual-write merge logic in `ChildWriter.mergeChildRecord()` (child-writer.ts:307-327) would preserve them. The `...existing` spread at line 317 ensures existing fields survive.

---

### A12: The `Delegation` → `ChildSessionRecord` field mapping is lossless enough for P41-C readers

- **Statement:** The 14+ mapped fields (SPEC REQ-P41B-04 table) contain enough information for P41-C reader migration to succeed without needing the unmapped `Delegation` fields (`result`, `error`, `fallbackReason`, `ptySessionId`, `v2`, termination fields, etc.).
- **Evidence source:** SPEC REQ-P41B-04 note: "Many fields (`result`, `error`, `fallbackReason`, ...) are not mapped to `ChildSessionRecord` because they are either transient runtime state, redacted before persist, or have no session-tracker equivalent." [VERIFIED: SPEC line 154]
- **Confidence:** MEDIUM
- **Risk if wrong:** Medium. If a P41-C reader needs a field that was left unmapped (e.g., `error` for error-recovery flows), the dual-write to the old path still has it. The risk is that P41-C must fall back to reading the old `delegations.json` for unmapped fields, which defeats the migration purpose. This is acceptable as a transitional state.

---

### A13: The new standalone `governance-state.json` file path resolves correctly and does not conflict with any existing file

- **Statement:** `.hivemind/state/governance-state.json` (via `getCanonicalStateDir()`) is a fresh, non-conflicting path. No existing code writes to or reads from this path.
- **Evidence source:** `getCanonicalStateDir()` returns `resolve(projectRoot, ".hivemind", "state")` (continuity/index.ts:23-26). The `ContinuityStoreFile` stores governance data inside `session-continuity.json` under the `governance` key (shared/types.ts:353-358). No code references `governance-state.json`. [VERIFIED: grep for "governance-state" returns zero results]
- **Confidence:** HIGH
- **Risk if wrong:** Low. If the path conflicts with an existing file (not possible per grep), the atomic write pattern (write temp → rename) would overwrite it. The `getGovernanceStatePath()` function derives the path from `getCanonicalStateDir()` which is already well-tested.

---

### A14: The governance engine evaluator call at `evaluator.ts:97-99` can be redirected from `recordGovernancePersistenceState()` to `writeGovernanceState()` without breaking runtime behavior

- **Statement:** The one caller of `recordGovernancePersistenceState()` (in evaluator.ts) can safely be changed to call the new `writeGovernanceState()` function, and the old function can become a deprecated no-op.
- **Evidence source:** Evaluator.ts:97-99 calls `getGovernancePersistenceState()`, mutates `state.violations`, then calls `recordGovernancePersistenceState(state)`. This writes governance data into the continuity store's `governance` field. The new `writeGovernanceState()` writes to a standalone file instead. [VERIFIED: codebase inspection — evaluator.ts:95-103, continuity/index.ts:464-474]
- **Confidence:** HIGH
- **Risk if wrong:** Low. The old path (`recordGovernancePersistenceState()`) is kept as a deprecated no-op that logs a warning. Tests that verify the old behavior (like `continuity.test.ts:451`) will still pass because the no-op doesn't throw. Governance evaluator tests (`governance-evaluator.test.ts`) import `recordGovernancePersistenceState` — if they verify written data, they may need updating to import from the new module.

---

### A15: All existing tests pass without modification despite the dual-write adding new file I/O

- **Statement:** The dual-write (writing to both old files AND new session-tracker files) does not cause test failures. Tests that check old files continue to find their data there. Tests do not check for absences of new files.
- **Evidence source:** Persist path: tests that call `persistDelegations()` or continuity functions indirectly through `DelegationStateMachine` will still write to `delegations.json` and `session-continuity.json`. The dual-write is additive — old paths remain intact. [VERIFIED: SPEC REQ-P41B-06, REQ-P41B-07]
- **Confidence:** HIGH
- **Risk if wrong:** Medium. If a test uses a temporary directory and the dual-write creates files outside that directory (e.g., by resolving to `process.cwd()` instead of the test's `projectRoot`), the write could fail. The implementation must ensure `projectRoot` is correctly threaded through. `persistDelegations()` currently gets its store directory from `getContinuityStoragePath()` which uses `getCanonicalStateDir()` with optional `projectRoot` — if no `projectRoot` is passed, it defaults to `process.cwd()`. In tests, this might point to a non-writable directory.

---

### A16: `HierarchyManifestWriter.addChild()` is callable from `persistDelegations()` with the available delegation data

- **Statement:** The `addChild()` method can be invoked with data available from `Delegation` objects during the dual-write.
- **Evidence source:** `addChild()` requires `rootMainSessionID`, `childSessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy`, `subagentType`, `childFile` (hierarchy-manifest.ts:62-70). From a `Delegation` record: `childSessionId` → `childSessionID`, `parentSessionId` → `parentSessionID`, `agent` → `delegatedBy`. `rootMainSessionID` would need to be resolved (not directly available from `Delegation` — requires the hierarchy index). `childFile` is `${childSessionID}.json`. [VERIFIED: codebase inspection]
- **Confidence:** MEDIUM
- **Risk if wrong:** Medium. The `rootMainSessionID` is not a field on `Delegation`. It requires either: (a) resolving via `HierarchyIndex.getRootMain(childSessionID)`, or (b) passing it through from the caller that has it. If (a) is used, it adds a dependency on `HierarchyIndex`. If (b), the `persistDelegations()` signature needs to change. This is a non-trivial detail that the SPEC glosses over (it says "call `HierarchyManifestWriter.addChild()`" but doesn't specify how `rootMainSessionID` is obtained).

---

### A17: No production data loss occurs from the dual-write because `JSON.parse(JSON.stringify(x))` of `ChildSessionRecord` produces valid JSON

- **Statement:** The 7 new optional fields serialize/deserialize cleanly through `JSON.parse`/`JSON.stringify` without data loss.
- **Evidence source:** All 7 fields are plain optional values: `string`, `string[]`, union types, `Record<string, unknown>`, or arrays of plain objects. None are `Map`, `Set`, `Date`, `Buffer`, or other non-JSON-serializable types. `pendingNotifications` is `PendingNotification[]` — an array of plain objects with string/number/boolean fields. [VERIFIED: shared/types.ts:31-102, SPEC REQ-P41B-02 table]
- **Confidence:** HIGH
- **Risk if wrong:** Low. If a field contained a non-serializable value (unlikely given the type definitions), `JSON.stringify` would either throw (for `BigInt`, `undefined` in arrays) or silently drop it (for `undefined` in objects). The types are simple enough to guarantee serialization safety.

---

### A18: `ContinuityStoreFile.governance` field can coexist in memory with the new standalone `governance-state.json`

- **Statement:** During the dual-write/deprecation period, governance data is written to both:
  1. The in-memory continuity store's `governance` field (for backward compatibility)
  2. The standalone `governance-state.json` file (new canonical source)
- **Evidence source:** `ContinuityStoreFile` has a required `governance: GovernancePersistenceState` field (shared/types.ts:357). After the deprecation, the continuity store's `governance` field becomes stale but is still written to disk by `persistStore()`. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. The old governance-data-in-continuity-store approach remains functional even if stale. Readers in P41-C would read from the standalone file. The continuity store's `governance` field is cleaned up in P41-D (file deletion).

---

### A19: The `Delegation` → `ChildSessionRecord` field mapping for `delegatedBy.model` and `delegatedBy.subagentType` can use `""` when unavailable

- **Statement:** When the dispatch context doesn't have model or subagentType information, these fields default to empty string `""`.
- **Evidence source:** SPEC field mapping table: `delegatedBy.model` maps to `""` if unavailable, `delegatedBy.subagentType` maps to `""` if unavailable. The `DelegatedBy` interface has `model: string` (required, not optional — types.ts:80) and `subagentType: string` (required — types.ts:86). Both accept `""` as valid string values. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. Empty strings are valid for required string fields. TypeScript allows `""` for `string` type.

---

### A20: The `ContinuityStore` writes (`persistStore()`, `recordSessionContinuity()`, `patchSessionContinuity()`) can access `ChildWriter` without creating a circular module dependency

- **Statement:** `src/task-management/continuity/index.ts` can import from `src/features/session-tracker/persistence/child-writer.ts` without creating a circular dependency.
- **Evidence source:** `src/features/session-tracker/persistence/child-writer.ts` imports from `../types.js` and `./atomic-write.js` and `./hierarchy-index.js` and `./hierarchy-manifest.js`. None of these import from `src/task-management/continuity/`. However, `src/features/session-tracker/` modules DO import from `src/task-management/continuity/` (e.g., `initialization.ts` doesn't, but other modules might). If there's no current circular chain, adding an import from `continuity/index.ts` → `child-writer.ts` is safe. [VERIFIED: grep for continuity imports in session-tracker namespace returns zero results]
- **Confidence:** MEDIUM
- **Risk if wrong:** High. A circular dependency would break the build. The dependency direction (task-management → features) is acceptable in a layered architecture. However, if any `src/features/session-tracker/` module imports from `src/task-management/continuity/` (which some do), adding the reverse would create a cycle. A grep for `from.*task-management.*continuity` in `src/features/session-tracker/` confirms zero matches, so the import is safe. [VERIFIED: grep confirms zero cross-imports]

---

### A21: `Delegation.queueKey` is always a string (never undefined) by the time `persistDelegations()` is called

- **Statement:** The `queueKey` field on every `Delegation` record is a populated string, suitable for writing to `ChildSessionRecord.queueKey`.
- **Evidence source:** `Delegation.queueKey` is typed `string` (coordination/delegation/types.ts:54). The `normalizePersistedDelegation()` function normalizes it to `""` if missing (delegation-persistence.ts:212). In dispatch flows, `queueKey` is always provided. [VERIFIED: codebase inspection]
- **Confidence:** HIGH
- **Risk if wrong:** Low. Even if `queueKey` is empty string `""`, it's a valid value for the optional `ChildSessionRecord.queueKey` field. Empty string is semantically different from `undefined` but both are acceptable.

---

### A22: The child `.json` file write for `pendingNotifications` does not conflict with concurrent `appendChildTurn` writes

- **Statement:** When `patchSessionContinuity()` writes `pendingNotifications` to the `ChildSessionRecord` file, and `appendChildTurn()` also writes to the same file (from a different code path), they don't corrupt each other.
- **Evidence source:** `ChildWriter` has per-child serial write queues (child-writer.ts:56-57: `writeQueues: Map<string, Promise<void>>`). All write methods (`createChildFile`, `updateChildStatus`, `appendChildTurn`, `appendJourneyEntry`) use `enqueueWrite()` which serializes writes per `{parentID}/{childID}` key. This is already designed to prevent concurrent-write corruption. [VERIFIED: codebase inspection — child-writer.ts:56-57, 196-235]
- **Confidence:** HIGH
- **Risk if wrong:** Low. The serial queue is already in place. The dual-write code from continuity writes would go through `ChildWriter` methods, which use this queue. As long as the continuity redirect calls `ChildWriter` methods (not raw file writes), no corruption risk.

---

### A23: No test asserts exact field count on `ChildSessionRecord` or forbids unknown keys

- **Statement:** Existing tests do not use `toStrictEqual` or `Object.keys().length` to verify that `ChildSessionRecord` has exactly the expected fields (and would fail with 7 new optional fields).
- **Evidence source:** TypeScript's type system adds unknown keys at runtime — `toStrictEqual` checks all enumerable own properties. `jest`/`vitest`'s `toEqual` ignores extra keys on the expected side. `toStrictEqual` fails on extra keys. [ASSUMED — based on training knowledge of Jest/Vitest matchers; not verified in this session]
- **Confidence:** MEDIUM
- **Risk if wrong:** Medium. If a test uses `expect(child).toStrictEqual(expectedChild)` where `expectedChild` is constructed with only the original fields, the 7 new optional fields would cause it to fail (since the runtime object from `JSON.parse` of a new child file would include them). If `expectedChild` doesn't include the new optional fields but the actual object does, `toStrictEqual` fails. Mitigation: The new fields are optional, so `createChildFile` would not add them for existing construction sites. The merge logic (`mergeChildRecord`) preserves existing fields. Tests that construct mock `ChildSessionRecord` objects without the new fields will continue to work because the spread `...metadata` uses whatever was provided.

---

## Summary

| # | Domain | Statement | Confidence | Risk |
|---|--------|-----------|-----------|------|
| A1 | Types | Adding optional fields doesn't break construction | HIGH | LOW |
| A2 | Types | PendingNotification import resolves | HIGH | LOW |
| A3 | Types | No circular dependency for delegation type imports | HIGH | LOW |
| A4 | Architecture | Sync→async impedance for dual-write | HIGH | HIGH |
| A5 | Mapping | Status mapping covers all values | HIGH | LOW |
| A6 | Mapping | childSessionId always available | HIGH | LOW |
| A7 | Architecture | ChildWriter constructable from delegation-persistence | MEDIUM | MEDIUM |
| A8 | Mapping | executionMode direct mapping | HIGH | LOW |
| A9 | Mapping | Date conversion correct | HIGH | LOW |
| A10 | Architecture | Continuity module can access ChildWriter | MEDIUM | MEDIUM |
| A11 | State | compactionCheckpoint/lifecycle not on disk | HIGH | LOW |
| A12 | Mapping | Field mapping sufficient for P41-C readers | MEDIUM | MEDIUM |
| A13 | Architecture | governance-state.json path is fresh | HIGH | LOW |
| A14 | Architecture | Governance evaluator redirect works | HIGH | LOW |
| A15 | Testing | Tests pass with additive dual-write | HIGH | MEDIUM |
| A16 | Architecture | HierarchyManifestWriter.addChild() has required data | MEDIUM | MEDIUM |
| A17 | Data | JSON serialization safe | HIGH | LOW |
| A18 | State | Governance data coexistence safe | HIGH | LOW |
| A19 | Mapping | Empty string fallbacks for model/subagentType | HIGH | LOW |
| A20 | Architecture | No circular dep from continuity → session-tracker | MEDIUM | HIGH |
| A21 | Mapping | queueKey always available | HIGH | LOW |
| A22 | Concurrency | Serial write queues prevent corruption | HIGH | LOW |
| A23 | Testing | No test asserts exact field count on ChildSessionRecord | MEDIUM | MEDIUM |

### Highest-risk assumptions

**A4 (sync→async impedance):** `persistDelegations()` is synchronous; `ChildWriter.createChildFile()` is async. The dual-write must use fire-and-forget (`void childWriter.createChildFile(...)`). The old sync path to `delegations.json` still runs, so no data loss, but the session-tracker write might not complete before process exit. Mitigation: register the pending writes in `flushAllStores()` or use `process.on("exit")` handlers.

**A16 (rootMainSessionID resolution):** `HierarchyManifestWriter.addChild()` requires `rootMainSessionID`, which is NOT a field on `Delegation`. The implementation must either resolve it via `HierarchyIndex.getRootMain()` or thread it through `persistDelegations()`'s call chain. This is a design gap in the SPEC.

**A20 (circular dependency risk):** The import direction `task-management/continuity` → `features/session-tracker/persistence` is architecturally acceptable (task-management depends on features, not vice versa). But it must be verified that no reverse import path exists. Current grep confirms it does not.

**A23 (test field count assertion):** The most insidious risk. If any test uses `toStrictEqual` on a `ChildSessionRecord` with only the original fields, it will fail once the 7 new fields are present on runtime objects. Mitigation: run full test suite (`npm run test`) as the phase gate — any failures would be immediately visible and fixable.
