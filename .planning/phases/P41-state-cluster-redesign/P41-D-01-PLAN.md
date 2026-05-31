---
phase: P41-D
plan: 01
status: planned
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/task-management/continuity/delegation-persistence.ts
autonomous: true
requirements:
  - REQ-P41D-01
must_haves:
  truths:
    - "persistDelegations() performs no delegations.json file I/O (no mkdirSync, no writeFileSync, no renameSync)"
    - "persistDelegations() still performs session-tracker dual-write via ChildWriter + HierarchyManifestWriter"
    - "readPersistedDelegations() returns an empty array []"
    - "All external callers of readPersistedDelegations() continue to compile with empty results"
  artifacts:
    - path: src/task-management/continuity/delegation-persistence.ts
      provides: "No-op persistDelegations + empty reader"
      min_lines: 60
  key_links:
    - from: persistDelegations
      to: ChildWriter.createChildFile / HierarchyManifestWriter.addChild
      via: "session-tracker dual-write (fire-and-forget, lines 172-206 kept)"
      pattern: "childWriter|manifestWriter"
---

<objective>
Make `persistDelegations()` a no-op for delegations.json file I/O while keeping the session-tracker dual-write path fully active. Make `readPersistedDelegations()` return `[]` — session-tracker is now canonical for delegation reads.

**Purpose:** Remove the old file-based persistence layer after P41-B established session-tracker as the canonical delegation store.
**Output:** `src/task-management/continuity/delegation-persistence.ts` modified — no file writes, empty reader, dual-write preserved.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P41-state-cluster-redesign/P41-D-SPEC.md
@.planning/phases/P41-state-cluster-redesign/P41-D-RESEARCH.md

Reference note: `readPersistedDelegations()` has 3 external callers that will now receive `[]`:
1. `src/tools/delegation/delegation-status.ts:429` — has fallback `deps.lifecycle ? () => [] : readPersistedDelegations`
2. `src/coordination/delegation/manager-runtime.ts:318` — one-shot recovery that already relies on session-tracker
3. `src/tools/session/session-journal-export.ts:84` — journal export uses session-tracker data
</context>

<tasks>

<task type="auto">
  <name>Task 1: No-op persistDelegations() file I/O — keep session-tracker dual-write</name>
  <files>src/task-management/continuity/delegation-persistence.ts</files>
  <action>
    Transform `persistDelegations()` (lines 95-207) into a function that:

    1. REMOVES all delegations.json file I/O (lines 102-170):
       - `mkdirSync(dirname(filePath), { recursive: true })` — no mkdir
       - `readPersistedDelegations()` call + merge logic — no read-merge-write
       - `writeFileSync(tmpFile, ...)` + `renameSync(tmpFile, filePath)` — no atomic write
       - The `redactBoundaryFields()` call for file output — no redaction for file
       - The entire read-merge-write loop (lines 106-159) and atomic write section (lines 165-170)

    2. KEEPS the session-tracker dual-write section (lines 172-206):
       - `ChildWriter.createChildFile()` loop with fire-and-forget `.catch()`
       - `HierarchyManifestWriter.addChild()` loop with fire-and-forget `.catch()`
       - The outer try/catch that swallows dual-write errors

    3. The function signature stays: `export function persistDelegations(delegations: Delegation[]): void`
       The comment block at lines 96-101 (G-4 / REQ-21-13 explanation) can stay as-is.

    **Ordering requirement:** Remove file I/O FIRST, keep dual-write AFTER. The no-op must not accidentally strip both paths — the dual-write to session-tracker is the canonical persistence path now.

    **What to avoid:**
    - Do NOT remove `getDelegationsFilePath()` — it's used by `retry-handler.ts` via `import { getDelegationsFilePath }`
    - Do NOT remove `getDelegationStoreDirectory()` — used internally by dual-write (line 174)
    - Do NOT remove `buildChildRecordFromDelegation()` — used by dual-write loop (line 185)
    - Do NOT remove `import` statements for `ChildWriter`, `HierarchyManifestWriter`, `ChildSessionRecord` — dual-write still needs them
    - Do NOT remove `Delegation` type import — function signature uses it
  </action>
  <verify>
    <automated>npx vitest run tests/lib/delegation-persistence.test.ts -x 2>&1 | head -40</automated>
  </verify>
  <done>
    - `persistDelegations()` compiles without delegations.json file I/O
    - `persistDelegations()` still calls `ChildWriter.createChildFile()` and `HierarchyManifestWriter.addChild()`
    - Typecheck passes: `npm run typecheck` has zero errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Make readPersistedDelegations() return empty array</name>
  <files>src/task-management/continuity/delegation-persistence.ts</files>
  <action>
    Rewrite `readPersistedDelegations()` (lines 297-323) to:

    ```typescript
    export function readPersistedDelegations(): Delegation[] {
      // REQ-P41D-01: No delegations.json reads. Session-tracker is canonical.
      return []
    }
    ```

    This replaces ~27 lines (file existence check, JSON parse, normalization loop, corrupt-file quarantine) with a single return statement.

    **What to remove:** The entire `normalizePersistedDelegation()` helper function (lines 209-295). Since the reader is now a no-op returning `[]`, this normalization logic has no callers. Removing it eliminates ~87 lines of dead code.

    **What to keep:**
    - `getDelegationsFilePath()` — used by `retry-handler.ts` (confirmed via grep)
    - `getDelegationStoreDirectory()` — used internally by dual-write (line 174)
    - `buildChildRecordFromDelegation()` — used by dual-write loop
    - `deriveSurface()` — used by `buildChildRecordFromDelegation`
    - `deriveRecoveryGuarantee()` — used by `buildChildRecordFromDelegation`
    - `isValidDelegationStatus()` — used by `buildChildRecordFromDelegation`
    - `VALID_DELEGATION_STATUSES` — used by `isValidDelegationStatus`
    - `quarantineCorruptDelegationsFile()` — ONLY used by readPersistedDelegations, so REMOVE it (no caller after readPersistedDelegations no-op)
    - `Delegation` type import — keep (function signatures use it)
    - `DelegationStatus` type import — keep (signature uses it)
    - `redactBoundaryFields` import — REMOVE (no longer used after file write removal in Task 1)
    - `randomUUID` import — REMOVE if only used by quarantineCorruptDelegationsFile (check: it's also used by atomic write tmp filename — after Task 1, that code is gone. After this task, quarantineCorruptDelegationsFile is gone. So `randomUUID` can be removed from imports.)
    - `existsSync`, `readFileSync`, `renameSync` from fs imports — REMOVE (no file I/O in delegation-persistence.ts anymore)
    - Keep: `mkdirSync` and `writeFileSync` — just kidding, those are removed in Task 1. After both tasks, no fs imports needed. REMOVE `existsSync`, `readFileSync`, `renameSync`, `writeFileSync`, `mkdirSync` from `node:fs` import. Actually `dirname` from `node:path` is still needed (used by `getDelegationStoreDirectory`). So trim `node:fs` import entirely if no fs operations remain.

    Actually, verify: `dirname, join` from `node:path` — `dirname` used by `getDelegationStoreDirectory` (line 42), `join` used by `getDelegationsFilePath` (line 58). Both keep.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/delegation-persistence.test.ts -x 2>&1 | head -40</automated>
  </verify>
  <done>
    - `readPersistedDelegations()` returns `[]`
    - `normalizePersistedDelegation()` removed from file
    - `quarantineCorruptDelegationsFile()` removed
    - All fs imports removed from file (no file I/O remains)
    - Typecheck passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| delegation-persistence.ts | No longer touches the filesystem for delegations.json — removal of file I/O eliminates file-tampering surface |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P41D-01 | Tampering | persistDelegations file I/O removal | mitigate | File I/O removed entirely — no delegations.json read/write/rename operations remain. Session-tracker dual-write uses fire-and-forget `.catch()`. |
| T-P41D-02 | Repudiation | readPersistedDelegations returns [] | accept | Empty return means callers get no legacy file data. Session-tracker is canonical for recovery. Three callers verified to handle empty results gracefully. |
| T-P41D-SC | Tampering | npm/pip/cargo installs | mitigate | No packages installed in this phase |
</threat_model>

<verification>
- Typecheck: `npm run typecheck` passes
- File quarantine tests: `npx vitest run tests/lib/delegation-persistence.test.ts` — expect changes (tests that assert corrupt file quarantine or JSON parse errors will now fail since reader returns `[]`)
</verification>

<success_criteria>
- `persistDelegations()` is a no-op for delegations.json file writes
- `persistDelegations()` still performs session-tracker dual-write (ChildWriter + HierarchyManifestWriter)
- `readPersistedDelegations()` returns `[]`
- `normalizePersistedDelegation()` and `quarantineCorruptDelegationsFile()` removed
- All fs imports for file I/O removed from delegation-persistence.ts
- Typecheck passes
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-D-01-SUMMARY.md` when done
</output>
