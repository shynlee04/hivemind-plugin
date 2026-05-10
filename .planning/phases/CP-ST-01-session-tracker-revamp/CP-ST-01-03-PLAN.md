---
phase: CP-ST-01-session-tracker-revamp
plan: 03
type: execute
wave: 3
depends_on:
  - CP-ST-01-01
  - CP-ST-01-02
files_modified:
  - src/features/session-tracker/recovery/session-recovery.ts
  - src/features/session-tracker/index.ts
  - src/plugin.ts
  - src/tools/hivemind/session-tracker.ts
  - src/schema-kernel/session-tracker.schema.ts
  - tests/features/session-tracker/recovery/session-recovery.test.ts
  - tests/features/session-tracker/integration/hook-wiring.test.ts
  - tests/features/session-tracker/integration/cleanup.test.ts
autonomous: true
requirements:
  - REQ-ST-10
  - REQ-ST-11
  - REQ-ST-13
must_haves:
  truths:
    - "Session recovery reads project-continuity.json on init (D-05)"
    - "Recovery provides reconsumeSession() using client.session.messages() (REQ-ST-10)"
    - "Incomplete files remain parseable via atomic writes (REQ-ST-10)"
    - "Hooks route through SessionTracker methods, not direct fs writes (REQ-ST-11)"
    - "plugin.ts adds one instantiation line for SessionTracker"
    - "Old event-tracker wiring removed from plugin.ts (but code preserved)"
    - "Contaminated .hivemind/event-tracker/*.json and *.md files removed (REQ-ST-13)"
    - "Old event-tracker source code preserved at src/task-management/journal/event-tracker/"
    - "session-tracker tool provides export-session, list-sessions, search-sessions actions"
  artifacts:
    - path: "src/features/session-tracker/recovery/session-recovery.ts"
      provides: "Session recovery and reconsumption"
      min_lines: 40
    - path: "src/plugin.ts"
      provides: "SessionTracker instantiation + hook wiring"
      min_lines: 5
    - path: "src/tools/hivemind/session-tracker.ts"
      provides: "Session-tracker query tool"
      min_lines: 50
    - path: "src/schema-kernel/session-tracker.schema.ts"
      provides: "Zod schema for session-tracker tool"
      min_lines: 20
  key_links:
    - from: "src/plugin.ts"
    - to: "src/features/session-tracker/index.ts"
    - via: "import"
    - pattern: "import.*SessionTracker.*from.*session-tracker"
    - from: "src/tools/hivemind/session-tracker.ts"
    - to: "src/features/session-tracker/index.ts"
    - via: "import"
    - pattern: "import.*SessionTracker.*from.*session-tracker"
---

<objective>
Wire session tracker into plugin.ts, implement recovery, add legacy cleanup, and create query tool.

Purpose: Integration point — connects capture handlers to OpenCode hooks via plugin.ts. Recovery enables reconsumption after disconnection. Legacy cleanup removes contaminated state files. Query tool provides agent-callable session operations.

Output: Wired SessionTracker in plugin.ts, session-recovery.ts, session-tracker tool, legacy cleanup.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-RESEARCH.md
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-01-SUMMARY.md
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-02-SUMMARY.md

<interfaces>
<!-- From Plan 01 — SessionTracker class -->

From src/features/session-tracker/index.ts:
```typescript
export class SessionTracker {
  constructor(private deps: { client: OpenCodeClient; projectRoot: string }) {}
  async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void>
  async handleChatMessage(input: unknown, output: unknown): Promise<void>
  async handleToolExecuteAfter(input: unknown, output: unknown): Promise<void>
  async initialize(): Promise<void>
  async cleanup(): Promise<void>
}
```

<!-- From Plan 02 — Capture handlers -->

From src/features/session-tracker/capture/event-capture.ts:
```typescript
export class EventCapture {
  constructor(private deps: { client: OpenCodeClient; sessionWriter: SessionWriter }) {}
  async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void>
}
```

From src/features/session-tracker/capture/message-capture.ts:
```typescript
export class MessageCapture {
  constructor(private deps: { sessionWriter: SessionWriter; agentTransform: AgentTransform }) {}
  async handleChatMessage(input: unknown, output: unknown): Promise<void>
}
```

From src/features/session-tracker/capture/tool-capture.ts:
```typescript
export class ToolCapture {
  constructor(private deps: { sessionWriter: SessionWriter; childWriter: ChildWriter; sessionIndexWriter: SessionIndexWriter; projectIndexWriter: ProjectIndexWriter }) {}
  async handleToolExecuteAfter(input: unknown, output: unknown): Promise<void>
}
```

From src/plugin.ts (existing wiring):
```typescript
// Lines 52-120: DelegationManager instantiation pattern
const delegationManager = new DelegationManager(client, { ptyManager, runtimePolicy })

// Lines 108-117: Event observer pattern (consumeJourneyFact)
const consumeJourneyFact = async ({ event }) => {
  const fact = await delegationEventObserver({ event })
  if (fact.kind === "delegation-session-idle") {
    delegationManager.handleSessionIdle(fact.sessionId)
  }
}

// Lines 150-183: tool.execute.after composer
const existingToolAfterHandler = async (input, output) => { ... }
```

From src/hooks/types.ts:
```typescript
export interface HookDependencies {
  client: OpenCodeClient
  projectRoot: string
  eventObservers: Array<(params: { event: unknown }) => Promise<void>>
  // ... other deps
}
```

From src/shared/tool-response.ts:
```typescript
export function createToolResponse(data: unknown): ToolResponse
export function createToolError(message: string): ToolResponse
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Session Recovery</name>
  <files>
    src/features/session-tracker/recovery/session-recovery.ts,
    tests/features/session-tracker/recovery/session-recovery.test.ts
  </files>
  <behavior>
    - Recovery reads project-continuity.json on module init (D-05)
    - Recovery builds session map from persisted index
    - reconsumeSession() uses client.session.messages() to fill gaps (REQ-ST-10)
    - Incomplete files remain parseable (atomic writes prevent truncation)
    - Recovery handles missing/corrupt index gracefully
  </behavior>
  <action>
    Create `src/features/session-tracker/recovery/session-recovery.ts`:
    - `SessionRecovery` class with constructor accepting `{ client: OpenCodeClient; projectRoot: string }`
    - `async initialize(): Promise<Map<string, SessionSummary>>` — reads `.hivemind/session-tracker/project-continuity.json`, parses JSON, returns session map. If file missing or corrupt, returns empty map and logs warning.
    - `async reconsumeSession(sessionID: string): Promise<ReconsumptionResult>` — calls `client.session.messages({ path: { id: sessionID } })` to get messages. Compares with persisted .md file. Returns gap analysis: which messages are missing from persisted file.
    - `async rebuildSessionContext(sessionID: string): Promise<SessionContext>` — reads persisted .md + .json files, combines with SDK messages, returns full session context for agent reconsumption.
    - `isSessionFileParseable(filePath: string): Promise<boolean>` — tries to read and parse file, returns true if successful. Used to detect incomplete files.
    - Private `readProjectIndex(): Promise<ProjectContinuityIndex | null>` — reads and parses project-continuity.json with try/catch
    - Private `readSessionFile(sessionID: string): Promise<string | null>` — reads session .md file with try/catch

    Create `tests/features/session-tracker/recovery/session-recovery.test.ts`:
    - Test initialize with valid project-continuity.json returns session map
    - Test initialize with missing file returns empty map
    - Test initialize with corrupt file returns empty map + logs warning
    - Test reconsumeSession returns gap analysis
    - Test rebuildSessionContext combines file + SDK data
    - Test isSessionFileParseable with valid file returns true
    - Test isSessionFileParseable with truncated file returns false
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/recovery/</automated>
  </verify>
  <done>
    - Recovery reads project-continuity.json on init (D-05)
    - reconsumeSession() fills gaps via SDK (REQ-ST-10)
    - Incomplete files detected gracefully (REQ-ST-10)
    - All recovery tests pass
    - typecheck passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: CQRS Hook Wiring + plugin.ts</name>
  <files>
    src/features/session-tracker/index.ts,
    src/plugin.ts,
    tests/features/session-tracker/integration/hook-wiring.test.ts
  </files>
  <behavior>
    - SessionTracker wired into plugin.ts via deps injection (D-01)
    - Event observer added to eventObservers array
    - chat.message handler composed inline
    - tool.execute.after handler composed with existing handler
    - Old event-tracker wiring removed (consumeJourneyFact, createEventTrackerArtifactsFromHook)
    - All handlers best-effort (try/catch, never throw)
  </behavior>
  <action>
    Update `src/features/session-tracker/index.ts`:
    - Implement `SessionTracker.initialize()`:
      - Create `SessionRecovery` instance
      - Call `recovery.initialize()` to build session map
      - Create `EventCapture`, `MessageCapture`, `ToolCapture` instances with their dependencies
      - Create `SessionWriter`, `ChildWriter`, `SessionIndexWriter`, `ProjectIndexWriter` instances
      - Store all handlers as instance properties
    - Implement `SessionTracker.handleSessionEvent()`:
      - Delegate to `eventCapture.handleSessionEvent()`
    - Implement `SessionTracker.handleChatMessage()`:
      - Delegate to `messageCapture.handleChatMessage()`
    - Implement `SessionTracker.handleToolExecuteAfter()`:
      - Delegate to `toolCapture.handleToolExecuteAfter()`
    - Implement `SessionTracker.cleanup()`:
      - Run legacy cleanup (REQ-ST-13): enumerate `.hivemind/event-tracker/*.json` and `*.md`, remove them
      - Do NOT remove `src/task-management/journal/event-tracker/` source code

    Update `src/plugin.ts`:
    - Add import: `import { SessionTracker } from './features/session-tracker'`
    - After DelegationManager instantiation (~line 116), add:
      ```typescript
      const sessionTracker = new SessionTracker({ client, projectRoot })
      ```
    - Add event observer for session tracker:
      ```typescript
      const consumeSessionTrackerFact = async ({ event }) => {
        try {
          const eventType = event?.type || 'unknown'
          const sessionID = event?.sessionID || event?.session?.id || ''
          if (sessionID) {
            await sessionTracker.handleSessionEvent({ eventType, sessionID, event })
          }
        } catch (err) {
          console.warn('[Harness] Session tracker event observer failed:', err)
        }
      }
      ```
    - Add `consumeSessionTrackerFact` to `eventObservers` array
    - Add chat.message handler in plugin return object:
      ```typescript
      "chat.message": async (input, output) => {
        try {
          await sessionTracker.handleChatMessage(input, output)
        } catch (err) {
          console.warn('[Harness] Session tracker chat.message failed:', err)
        }
      }
      ```
    - Compose tool.execute.after handler:
      ```typescript
      "tool.execute.after": async (input, output) => {
        try {
          // Existing handler
          await existingToolAfterHandler(input, output)
        } catch (err) {
          console.warn('[Harness] Existing tool.after failed:', err)
        }
        try {
          // Session tracker handler
          await sessionTracker.handleToolExecuteAfter(input, output)
        } catch (err) {
          console.warn('[Harness] Session tracker tool.after failed:', err)
        }
      }
      ```
    - Remove old event-tracker wiring: comment out or remove `consumeJourneyFact` and `createEventTrackerArtifactsFromHook` references (keep the import comments for safety net awareness)
    - Call `sessionTracker.initialize()` during plugin initialization

    Create `tests/features/session-tracker/integration/hook-wiring.test.ts`:
    - Test SessionTracker receives event hook calls
    - Test SessionTracker receives chat.message calls
    - Test SessionTracker receives tool.execute.after calls
    - Test handler failure does not block OpenCode runtime (graceful degradation)
    - Test old event-tracker wiring is removed
  </action>
  <verify>
    <automated>npm run typecheck && npm test</automated>
  </verify>
  <done>
    - SessionTracker wired into plugin.ts (D-01)
    - Event observer registered
    - chat.message handler composed
    - tool.execute.after handler composed
    - Old event-tracker wiring removed
    - All handlers best-effort (try/catch)
    - All tests pass (full suite)
    - typecheck passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Legacy Cleanup + Session-Tracker Tool</name>
  <files>
    src/tools/hivemind/session-tracker.ts,
    src/schema-kernel/session-tracker.schema.ts,
    tests/features/session-tracker/integration/cleanup.test.ts
  </files>
  <behavior>
    - Legacy cleanup removes contaminated .hivemind/event-tracker/*.json and *.md (REQ-ST-13)
    - Old event-tracker source code preserved at src/task-management/journal/event-tracker/
    - session-tracker tool provides action-based routing (D-02)
    - Actions: export-session, list-sessions, search-sessions
    - Tool designed for extensibility (D-02)
  </behavior>
  <action>
    Create `src/schema-kernel/session-tracker.schema.ts`:
    - Zod schema for session-tracker tool input:
      ```typescript
      import { z } from 'zod'
      
      export const SessionTrackerActionSchema = z.enum(['export-session', 'list-sessions', 'search-sessions'])
      
      export const SessionTrackerInputSchema = z.object({
        action: SessionTrackerActionSchema,
        sessionId: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().min(1).max(100).default(20).optional()
      })
      
      export type SessionTrackerInput = z.infer<typeof SessionTrackerInputSchema>
      ```

    Create `src/tools/hivemind/session-tracker.ts`:
    - `sessionTrackerTool` definition with:
      - `name: "session-tracker"`
      - `description: "Query and export session tracker data. Actions: export-session (get full session capture), list-sessions (list all sessions), search-sessions (search session content)."`
      - `inputSchema: SessionTrackerInputSchema`
      - `handler: async (input: SessionTrackerInput) => Promise<ToolResponse>`
    - Handler switches on `input.action`:
      - `"export-session"`: reads session .md file, returns content. Requires `input.sessionId`.
      - `"list-sessions"`: reads project-continuity.json, returns session list with metadata.
      - `"search-sessions"`: scans session .md files for `input.query` string, returns matching sessions with context snippets.
    - All operations read-only (CQRS read-side)
    - Uses `createToolResponse()` and `createToolError()` from `src/shared/tool-response.ts`

    Create `tests/features/session-tracker/integration/cleanup.test.ts`:
    - Test cleanup removes .json and .md files from .hivemind/event-tracker/
    - Test cleanup preserves event-tracker source code directory
    - Test cleanup handles missing event-tracker directory gracefully
    - Test cleanup does not remove .gitkeep files
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/integration/cleanup.test.ts</automated>
  </verify>
  <done>
    - Legacy cleanup removes contaminated state files (REQ-ST-13)
    - Old event-tracker source code preserved
    - session-tracker tool created with 3 actions (D-02)
    - Tool uses Zod schema validation
    - All cleanup tests pass
    - typecheck passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Hook payload → Module | Malformed hook input (missing sessionID, unexpected types) |
| Module → Filesystem | All writes constrained to `.hivemind/session-tracker/` root |
| Tool input → Module | Agent-provided tool input validated via Zod schema |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ST03-01 | Tampering | plugin.ts wiring | mitigate | All hook handlers wrapped in try/catch — module failure never crashes OpenCode |
| T-ST03-02 | Information Disclosure | session-tracker tool | mitigate | Tool is read-only (CQRS read-side); no mutation authority |
| T-ST03-03 | Denial of Service | cleanup | mitigate | Cleanup runs once on init; does not block plugin startup |
| T-ST03-04 | Spoofing | session-tracker tool | mitigate | Zod schema validates all tool input |
</threat_model>

<verification>
- `npm run typecheck` passes
- `npm test` passes (full suite — regression check)
- `npx vitest run tests/features/session-tracker/recovery/` passes
- `npx vitest run tests/features/session-tracker/integration/` passes
- plugin.ts has SessionTracker instantiation
- Old event-tracker wiring removed from plugin.ts
- .hivemind/event-tracker/ contains no .json or .md files after init
</verification>

<success_criteria>
- SessionTracker wired into plugin.ts via deps injection (D-01)
- Recovery reads project-continuity.json on init (D-05)
- Legacy cleanup removes contaminated state files (REQ-ST-13)
- session-tracker tool provides 3 actions (D-02)
- All tests pass (full suite)
- typecheck passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-03-SUMMARY.md`
</output>
