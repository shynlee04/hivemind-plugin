---
phase: BOOT-09
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/schema-kernel/hivemind-configs.schema.ts
  - src/hooks/types.ts
  - src/hooks/observers/event-observers.ts
autonomous: true
requirements:
  - REQ-01
  - REQ-03
user_setup: []

must_haves:
  truths:
    - "Config schema accepts document_paths with correct default"
    - "HookDependencies exposes isMainSession type"
    - "isMainSession cache populates from session.created events"
    - "Map-based isMainSession is injectable into hook factories"
  artifacts:
    - path: "src/schema-kernel/hivemind-configs.schema.ts"
      provides: "document_paths field + LEGACY_KEY_MAP entry"
      contains: "document_paths: z.array(z.string()).default([\".hivemind/planning/\"])"
    - path: "src/hooks/types.ts"
      provides: "isMainSession on HookDependencies"
      contains: "isMainSession"
    - path: "src/hooks/observers/event-observers.ts"
      provides: "createSessionIsMainObserver factory"
      contains: "createSessionIsMainObserver"
    - path: "tests/schema-kernel/hivemind-configs.schema.test.ts"
      provides: "document_paths schema validation test"
      contains: "document_paths"
    - path: "tests/hooks/observers/event-observers.test.ts"
      provides: "isMainSession observer cache test"
      contains: "createSessionIsMainObserver"
  key_links:
    - from: "event-observers.ts"
      to: "session-api.ts"
      via: "getEventParentID"
      pattern: "getEventParentID"
    - from: "hivemind-configs.schema.ts"
      to: "configs.json runtime"
      via: "document_paths schema field"
      pattern: "document_paths"
---

<objective>
Add the `document_paths` config schema field, the `isMainSession` type to `HookDependencies`, and the `createSessionIsMainObserver()` factory that caches `isMainSession` booleans from `session.created` events.

**Purpose:** Foundation for all downstream BOOT-09 enforcement — schema defines configurable document paths, types enable hook injection, observer enables child-session exclusion.
**Output:** Schema field, interface type, observer factory + tests.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-CONTEXT.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-RESEARCH.md

<interfaces>
<!-- Key types the executor needs (extracted from existing codebase) -->

From `src/schema-kernel/hivemind-configs.schema.ts:213-218`:
```typescript
export const LEGACY_KEY_MAP: Record<string, string> = {
  conversationLanguage: "conversation_language",
  documentsLanguage: "documents_and_artifacts_language",
  userExpertLevel: "user_expert_level",
  delegationSystems: "delegation_systems",
} as const
```

From `src/schema-kernel/hivemind-configs.schema.ts:265-277`:
```typescript
export const HivemindConfigsSchema = z
  .object({
    conversation_language: SupportedLanguageSchema.default("en"),
    documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
    // ... existing fields ...
  })
  .strip()
```

From `src/hooks/types.ts:25-44`:
```typescript
export interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  client: OpenCodeClient
  stateManager: TaskStateManager
  eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>
  // ... other fields ...
  getIntake?: (sessionId: string) => IntakeResult | undefined
  hivemindConfig?: HivemindConfigs
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
}
```

From `src/hooks/observers/event-observers.ts:68-93` (createSessionEntryEventObserver pattern):
```typescript
export function createSessionEntryEventObserver(): {
  observer: (input: { event?: unknown }) => Promise<SessionEntryEventFact>
  getIntake: (sessionId: string) => IntakeResult | undefined
} {
  const intakeCache = new Map<string, IntakeResult>()
  const observer = async ({ event }: { event?: unknown }): Promise<SessionEntryEventFact> => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)
    if (eventType !== "session.created" || !sessionId) {
      return { kind: "ignored" }
    }
    const messages = getNestedValue(event, ["messages"]) as Array<{ role: string; content: string }> | undefined
    const userMessage = messages?.find(m => m.role === "user")?.content ?? ""
    const intake = resolveIntake(userMessage)
    intakeCache.set(sessionId, intake)
    return { kind: "session-created", sessionId, intake }
  }
  return { observer, getIntake: (sessionId: string) => intakeCache.get(sessionId) }
}
```

From `src/shared/session-api.ts` — `getEventParentID` helper (already exists):
```typescript
export function getEventParentID(event: unknown): string | undefined {
  return getParentID(getEventSessionInfo(event))
}
```

From `src/plugin.ts:112-114` — existing observer factory wiring:
```typescript
const sessionEntryObserverFactory = createSessionEntryEventObserver()
const deps = { client, lifecycleManager, stateManager: taskState, ..., getIntake: sessionEntryObserverFactory.getIntake, ... }
```

**`session.created` Event shape (from DeepWiki/Repomix):**
```typescript
export type EventSessionCreated = {
  type: "session.created"
  properties: { info: Session }
}
export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string    // undefined = main, set = child/delegated
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add document_paths to HivemindConfigsSchema + LEGACY_KEY_MAP</name>
  <files>src/schema-kernel/hivemind-configs.schema.ts</files>
  <read_first>
    src/schema-kernel/hivemind-configs.schema.ts (lines 200-277)
    tests/schema-kernel/hivemind-configs.schema.test.ts (full file)
  </read_first>
  <action>
    Add `document_paths` to `HivemindConfigsSchema` (line 268, after `documents_and_artifacts_language`):
    ```typescript
    document_paths: z.array(z.string()).default([".hivemind/planning/"]),
    ```
    Add `documentPaths` → `document_paths` entry to `LEGACY_KEY_MAP` (line 213):
    ```typescript
    documentPaths: "document_paths",
    ```
    Add a test in `tests/schema-kernel/hivemind-configs.schema.test.ts` that:
    - Parses `{}` and verifies `document_paths` defaults to `[".hivemind/planning/"]`
    - Parses `{ document_paths: [".docs/"] }` and verifies custom paths
    - Uses `.strip()` ensures unknown fields are removed
    - Uses `documentPaths` camelCase key and verifies it's migrated to `document_paths`

    Per D-08: flat string array with default `[".hivemind/planning/"]`.
    Per D-09: accept any path relative to project root, default is only `[".hivemind/planning/"]`.
    Per D-10: paths support recursive subdirectory globbing (note: the path value itself is a string, recursive globbing is handled at enforcement time not schema — just validate it's a non-empty string).
  </action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts -t "document_paths"</automated>
  </verify>
  <acceptance_criteria>
    1. `HivemindConfigsSchema.parse({}).document_paths` equals `[".hivemind/planning/"]`
    2. `HivemindConfigsSchema.parse({ document_paths: [".docs/"] }).document_paths` equals `[".docs/"]`
    3. Legacy camelCase key `documentPaths` is migrated to `document_paths` via LEGACY_KEY_MAP + migrateKeys()
    4. Schema still uses `.strip()` — unknown fields are removed
    5. `npm run typecheck` passes
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Add isMainSession to HookDependencies interface</name>
  <files>src/hooks/types.ts</files>
  <read_first>src/hooks/types.ts (full file, 45 lines)</read_first>
  <action>
    Add the `isMainSession` optional function type to `HookDependencies` interface after `getBehavioralProfile` (line 44):
    ```typescript
    /**
     * Checks whether a session ID belongs to a main (level-0, non-delegated) session.
     * Populated by `createSessionIsMainObserver()` from `session.created` events.
     * Main sessions have no `parentID` in OpenCode's session records.
     * @see D-01, D-02, D-03 in BOOT-09-CONTEXT.md
     */
    isMainSession?: (sessionId: string) => boolean
    ```
    Per D-04: injected via HookDependencies (matches existing `getBehavioralProfile` pattern in plugin.ts:112).
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    1. `HookDependencies` has `isMainSession?: (sessionId: string) => boolean`
    2. JSDoc explains it's populated by `createSessionIsMainObserver()` per D-01 through D-04
    3. `npm run typecheck` passes
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Create createSessionIsMainObserver factory in event-observers.ts</name>
  <files>src/hooks/observers/event-observers.ts</files>
  <read_first>src/hooks/observers/event-observers.ts (full file)</read_first>
  <action>
    Add a new `createSessionIsMainObserver()` factory function to `src/hooks/observers/event-observers.ts`.

    Pattern: Follow `createSessionEntryEventObserver()` (lines 68-93) — uses a `Map<string, boolean>` cache, fires on `session.created` event type, returns both `observer` and `isMainSession` lookup function.

    Implementation:
    ```typescript
    /**
     * Creates an event observer that caches whether a session is a main (level-0) session.
     *
     * Uses OpenCode's native `parentID` field on session records (D-01).
     * Main sessions have `parentID === undefined`; child/delegated sessions have a
     * `parentID` string set by the `task` tool (D-03).
     *
     * The cached boolean is read by the `system.transform` hook via HookDependencies (D-04).
     *
     * @returns An observer function and an `isMainSession` lookup function.
     */
    export function createSessionIsMainObserver(): {
      observer: (input: { event?: unknown }) => Promise<void>
      isMainSession: (sessionId: string) => boolean
    } {
      const mainSessionSet = new Set<string>()

      const observer = async ({ event }: { event?: unknown }): Promise<void> => {
        const eventType = asString(getNestedValue(event, ["type"]))
        const sessionId = getEventSessionID(event)

        if (eventType !== "session.created" || !sessionId) {
          return
        }

        const parentID = getEventParentID(event)
        // Main sessions have NO parentID (property absent / undefined)
        // Child/delegated sessions have parentID set by the task tool
        if (!parentID) {
          mainSessionSet.add(sessionId)
        }
      }

      return {
        observer,
        isMainSession: (sessionId: string) => mainSessionSet.has(sessionId),
      }
    }
    ```

    Per D-02: cache the `isMainSession` boolean on `session.created` event.
    Per D-01: uses OpenCode native `parentID`, NOT DelegationManager.
    Per Pitfall 4 (RESEARCH.md): check `parentID === undefined || parentID === null` — both indicate main session. `getEventParentID()` already handles this.

    Add a test file at `tests/hooks/observers/event-observers.test.ts` that:
    - Tests observer stores session as main when event has NO parentID
    - Tests observer does NOT store session when event has a parentID
    - Tests `isMainSession` returns `true` for cached main session
    - Tests `isMainSession` returns `false` for non-cached session ID
    - Tests observer ignores non-session.created event types
    - Uses `getEventParentID` via the actual helper
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/observers/event-observers.test.ts -t "createSessionIsMainObserver"</automated>
  </verify>
  <acceptance_criteria>
    1. `createSessionIsMainObserver()` returns `{ observer, isMainSession }`
    2. Observer caches session IDs that have NO `parentID` as main sessions
    3. Observer does NOT cache sessions that DO have a `parentID`
    4. `isMainSession("ses_main")` returns `true` after `session.created` without parentID
    5. `isMainSession("ses_child")` returns `false` when event has a parentID
    6. Observer ignores non-`session.created` events
    7. Uses `getEventParentID()` from `session-api.ts` (already exists — not DelegationManager)
    8. All tests pass, `npm run typecheck` passes
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Observer cache ↔ Hook injector | in-memory Map has no cross-session persistence — safe |
| Schema validation ↔ Config file | Zod .strip() + defaults protect against unknown/missing fields |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-BOOT09-01 | T (Tampering) | LEGACY_KEY_MAP | mitigate | migrateKeys() only applies if new key absent — no overwrite risk |
| T-BOOT09-02 | I (Info Disclosure) | isMainSession cache | accept | In-memory Map, no persistence or logging of session hierarchy |
</threat_model>

<verification>
1. `npm run typecheck` passes
2. `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts -t "document_paths"` passes
3. `npx vitest run tests/hooks/observers/event-observers.test.ts -t "createSessionIsMainObserver"` passes
</verification>

<success_criteria>
- Schema field `document_paths` exists with `z.array(z.string()).default([".hivemind/planning/"])` per D-08/09/10
- LEGACY_KEY_MAP has `documentPaths` → `document_paths` entry
- `HookDependencies` has `isMainSession?: (sessionId: string) => boolean` per D-04
- `createSessionIsMainObserver()` factory creates Map cache from `session.created` events per D-01/02/03
- `parentID === undefined/null` correctly identifies main sessions per D-03
- All tests pass, no regression
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-01-SUMMARY.md`
</output>
