---
phase: SC-01-sidecar-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/sidecar/types.ts
  - src/sidecar/readonly-state-extensions.ts
  - tests/sidecar/types.test.ts
  - tests/sidecar/readonly-state.test.ts
autonomous: true
requirements:
  - REQ-01
  - REQ-02
  - REQ-03
must_haves:
  truths:
    - "SidecarEventType union has exactly 11 members"
    - "SidecarEvent interface includes { type, payload, timestamp }"
    - "DirectoryEntry interface includes { name, type, size, mtime }"
    - "CANONICAL_PREFIXES has 4 entries (not 2)"
    - "isCanonicalStatePath() returns true for .hivemind/session-tracker/ and .opencode/ paths"
    - "listCanonicalDirectory() returns DirectoryEntry[] for canonical paths"
    - "listCanonicalDirectory() returns empty array for non-canonical paths"
  artifacts:
    - path: src/sidecar/types.ts
      provides: "Sidecar event types, event type union, directory entry type"
      exports: ["SidecarEventType", "SidecarEvent", "DirectoryEntry"]
      min_lines: 35
    - path: src/sidecar/readonly-state-extensions.ts
      provides: "Extended CANONICAL_PREFIXES re-export, listCanonicalDirectory()"
      exports: ["CANONICAL_PREFIXES", "listCanonicalDirectory", "DirectoryEntry"]
      min_lines: 30
    - path: tests/sidecar/types.test.ts
      provides: "Type shape verification"
      min_lines: 30
    - path: tests/sidecar/readonly-state.test.ts
      provides: "Extended prefix and directory listing tests (append to existing)"
      min_lines: 60
  key_links:
    - from: src/sidecar/readonly-state-extensions.ts
      to: src/sidecar/readonly-state.ts
      via: "import of existing guards"
      pattern: "isCanonicalStatePath"
    - from: tests/sidecar/readonly-state.test.ts
      to: src/sidecar/readonly-state-extensions.ts
      via: "import of CANONICAL_PREFIXES and listCanonicalDirectory"
      pattern: "from.*readonly-state"
---

<objective>
Create foundational sidecar type definitions and extend the canonical state path system.

Purpose: Establish the type system that all subsequent sidecar modules depend on (SidecarEventType, SidecarEvent, DirectoryEntry), and extend the existing read-only state enforcement to cover `.hivemind/session-tracker/` and `.opencode/` — required for Session Explorer (SC-04) and Control Panel (SC-04) to read their respective data surfaces. Also add the `listCanonicalDirectory()` function needed by SC-02's REST API.

Output:
- `src/sidecar/types.ts` — standalone type definitions
- `src/sidecar/readonly-state-extensions.ts` — extended prefix array + directory listing
- Updated `tests/sidecar/readonly-state.test.ts` — new prefix/directory tests appended
- New `tests/sidecar/types.test.ts` — compile-time type shape verification
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md
@.planning/phases/SC-01-sidecar-foundation/SC-01-CONTEXT.md
@src/sidecar/readonly-state.ts
@tests/sidecar/readonly-state.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create sidecar type definitions (types.ts + test)</name>
  <files>
    src/sidecar/types.ts
    tests/sidecar/types.test.ts
  </files>
  <behavior>
    - Test 1: SidecarEventType union is exactly `"session.created" | "session.updated" | "session.idle" | "session.deleted" | "session.error" | "delegation.dispatched" | "delegation.completed" | "delegation.failed" | "delegation.timeout" | "invalidate.cache" | "heartbeat"` — verified via const assertion (`as const`) and type-level test
    - Test 2: SidecarEvent interface accepts `{ type: "session.created", payload: { sessionID: "ses_1" }, timestamp: 1 }` — compiles and is assignable
    - Test 3: DirectoryEntry interface has fields `name: string`, `type: "file" | "directory"`, `size: number`, `mtime: number`
    - Test 4: SidecarEvent.timestamp is `number` (Date.now())
    - Test 5: SidecarEvent.payload is `Record<string, unknown>`
  </behavior>
  <action>
    Create `src/sidecar/types.ts` with three exports:

    1. `SidecarEventType` — a const array `SIDECAR_EVENT_TYPES` containing all 11 events, then derive the type union as `(typeof SIDECAR_EVENT_TYPES)[number]`. This gives both runtime and type-level access.

    2. `SidecarEvent` interface:
    ```typescript
    export interface SidecarEvent {
      type: SidecarEventType
      payload: Record<string, unknown>
      timestamp: number
    }
    ```

    3. `DirectoryEntry` interface:
    ```typescript
    export interface DirectoryEntry {
      name: string
      type: "file" | "directory"
      size: number
      mtime: number
    }
    ```

    Create `tests/sidecar/types.test.ts`:
    - Import all three types
    - `it("SidecarEventType has exactly 11 members")` — assert `SIDECAR_EVENT_TYPES.length === 11` and each event exists
    - `it("has correct event names")` — assert each event name is in the array
    - `it("SidecarEvent interface compiles with session.created")` — create a valid SidecarEvent, assert shape
    - `it("DirectoryEntry interface compiles")` — create a valid DirectoryEntry, assert shape
    - `it("rejects invalid SidecarEventType at compile time")` — use `expectTypeOf` from vitest or a const assertion test

    Use `import { describe, it, expect } from "vitest"`.
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/types.test.ts -x</automated>
  </verify>
  <done>
    - `src/sidecar/types.ts` exists with SidecarEventType (11 members), SidecarEvent, DirectoryEntry
    - `tests/sidecar/types.test.ts` exists with 5+ tests, all passing
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend CANONICAL_PREFIXES and add listCanonicalDirectory()</name>
  <files>
    src/sidecar/readonly-state-extensions.ts
    tests/sidecar/readonly-state.test.ts
  </files>
  <behavior>
    - Test 1: CANONICAL_PREFIXES has exactly 4 entries
    - Test 2: CANONICAL_PREFIXES includes ".hivemind/session-tracker" and ".opencode"
    - Test 3: isCanonicalStatePath (from readonly-state.ts) returns true for paths under all 4 new prefixes
    - Test 4: listCanonicalDirectory() returns DirectoryEntry[] for a known canonical directory
    - Test 5: listCanonicalDirectory() returns empty array for non-canonical paths
    - Test 6: Existing tests in readonly-state.test.ts still pass after extension
  </behavior>
  <action>
    Create `src/sidecar/readonly-state-extensions.ts`:

    ```typescript
    import { readdirSync } from "node:fs"
    import { statSync } from "node:fs"
    import { join } from "node:path"
    import {
      isCanonicalStatePath,
      type ReadOnlyStateOptions,
    } from "./readonly-state.js"
    import type { DirectoryEntry } from "./types.js"
    ```

    - Export the extended `CANONICAL_PREFIXES` array with 4 entries:
      `[".hivemind/state", ".hivemind/session-tracker", ".opencode", ".planning"]`

    - Export `listCanonicalDirectory(absoluteDirPath: string, opts: ReadOnlyStateOptions): DirectoryEntry[]`:
      1. Return `[]` immediately if `!isCanonicalStatePath(absoluteDirPath, opts)` — per D-SC01-06 (reject non-canonical)
      2. Use `readdirSync(absoluteDirPath, { withFileTypes: true })`
      3. Map each `Dirent` to `DirectoryEntry`:
         - `name: entry.name`
         - `type: entry.isDirectory() ? "directory" : "file"`
         - `size: statSync(join(absoluteDirPath, entry.name)).size` (0 for dirs)
         - `mtime: statSync(join(absoluteDirPath, entry.name)).mtimeMs`
      4. Return the mapped array (empty array if directory doesn't exist or error — never throw, return empty)

    Also export a `createReadOnlyStateOptions(projectRoot: string): ReadOnlyStateOptions` helper for convenience.

    **Update** `tests/sidecar/readonly-state.test.ts` (append to existing file):
    - Add `import { CANONICAL_PREFIXES, listCanonicalDirectory } from "../../src/sidecar/readonly-state-extensions.js"`
    - Add `import type { DirectoryEntry } from "../../src/sidecar/types.js"`
    - Add describe block `"extended CANONICAL_PREFIXES"`:
      - `it("has exactly 4 prefixes")` — expect 4 entries
      - `it("includes .hivemind/session-tracker")`
      - `it("includes .opencode")`
      - `it("still includes .hivemind/state and .planning")`
    - Add describe block `"listCanonicalDirectory"`:
      - `it("returns DirectoryEntry[] for canonical dirs")` — create a dir with known files, assert entries
      - `it("returns empty array for non-canonical paths")` — pass `join(projectRoot, "src")`, expect `[]`
      - `it("returns empty array for nonexistent paths")` — pass nonexistent canonical path, expect `[]`
    - In the existing `beforeEach`, also create: `mkdirSync(join(projectRoot, ".hivemind", "session-tracker"), { recursive: true })` and `mkdirSync(join(projectRoot, ".opencode"), { recursive: true })`
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/readonly-state.test.ts -x</automated>
  </verify>
  <done>
    - `src/sidecar/readonly-state-extensions.ts` exists with CANONICAL_PREFIXES (4), listCanonicalDirectory(), createReadOnlyStateOptions()
    - `tests/sidecar/readonly-state.test.ts` has new blocks for prefixes and directory listing
    - All tests pass (existing + new)
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| types.ts → consumers | No trust boundary — types are pure data structures, no runtime behavior |
| listCanonicalDirectory → filesystem | Single trust boundary: the function reads directory contents from the filesystem, filtered through isCanonicalStatePath() |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SC01-01 | Information Disclosure | listCanonicalDirectory | mitigate | `isCanonicalStatePath()` guard ensures only canonical surfaces are listed; non-canonical paths return empty array, never throw |
| T-SC01-02 | Tampering | types.ts | accept | Pure type definitions, no runtime execution — no injection surface |
| T-SC01-SC | Tampering | npm/pip/cargo installs | mitigate | No new npm packages in this plan; slopcheck N/A |
</threat_model>

<verification>
- [ ] `npm run typecheck` passes with no errors
- [ ] `npx vitest run tests/sidecar/types.test.ts -x` passes
- [ ] `npx vitest run tests/sidecar/readonly-state.test.ts -x` passes (existing + new tests)
- [ ] `CANONICAL_PREFIXES` has exactly 4 entries
</verification>

<success_criteria>
- `src/sidecar/types.ts` exports all 3 types/interfaces
- `src/sidecar/readonly-state-extensions.ts` exports extended prefixes + directory listing + helper
- `tests/sidecar/types.test.ts` has 5+ passing tests
- `tests/sidecar/readonly-state.test.ts` has 8+ new passing tests (appended)
- TypeScript compiles cleanly
</success_criteria>

<output>
Create `.planning/phases/SC-01-sidecar-foundation/SC-01-01-SUMMARY.md` when done
</output>
