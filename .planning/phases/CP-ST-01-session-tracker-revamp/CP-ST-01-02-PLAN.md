---
phase: CP-ST-01-session-tracker-revamp
plan: 02
type: execute
wave: 2
depends_on:
  - CP-ST-01-01
files_modified:
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/message-capture.ts
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/transform/agent-transform.ts
  - src/features/session-tracker/transform/schema-normalizer.ts
  - src/features/session-tracker/persistence/session-index-writer.ts
  - src/features/session-tracker/persistence/project-index-writer.ts
  - tests/features/session-tracker/capture/event-capture.test.ts
  - tests/features/session-tracker/capture/message-capture.test.ts
  - tests/features/session-tracker/capture/tool-capture.test.ts
  - tests/features/session-tracker/transform/agent-transform.test.ts
  - tests/features/session-tracker/transform/schema-normalizer.test.ts
  - tests/features/session-tracker/persistence/session-index-writer.test.ts
  - tests/features/session-tracker/persistence/project-index-writer.test.ts
autonomous: true
requirements:
  - REQ-ST-01
  - REQ-ST-02
  - REQ-ST-03
  - REQ-ST-04
  - REQ-ST-05
  - REQ-ST-06
  - REQ-ST-07
  - REQ-ST-08
  - REQ-ST-09
must_haves:
  truths:
    - "Event capture handles session.created/idle/deleted/error events"
    - "Root sessions create subdir + .md; child sessions do not (REQ-ST-01)"
    - "User messages captured with turn counter (REQ-ST-02)"
    - "Agent metadata transformed to main_l0_agent (REQ-ST-03)"
    - "Skill tool captures name + first header only (REQ-ST-04)"
    - "Read tool captures path only, no content (REQ-ST-05)"
    - "Task tool captures delegation metadata + triggers child .json (REQ-ST-06)"
    - "Child sessions recognized via parentID check (REQ-ST-07)"
    - "Dual indices maintained: session-local + project-level (REQ-ST-08)"
    - "Concurrent writes isolated per session (REQ-ST-09)"
  artifacts:
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "Session lifecycle event handler"
      min_lines: 40
    - path: "src/features/session-tracker/capture/message-capture.ts"
      provides: "User/assistant message capture"
      min_lines: 40
    - path: "src/features/session-tracker/capture/tool-capture.ts"
      provides: "Tool metadata capture (skill/read/task/other)"
      min_lines: 50
    - path: "src/features/session-tracker/transform/agent-transform.ts"
      provides: "##USER → main_l0_agent transform"
      min_lines: 30
    - path: "src/features/session-tracker/persistence/session-index-writer.ts"
      provides: "Session-local index writer"
      min_lines: 40
    - path: "src/features/session-tracker/persistence/project-index-writer.ts"
      provides: "Project-level index writer with serial queue"
      min_lines: 50
  key_links:
    - from: "src/features/session-tracker/capture/event-capture.ts"
      to: "src/features/session-tracker/persistence/session-writer.ts"
      via: "import"
      pattern: "import.*SessionWriter.*from.*session-writer"
    - from: "src/features/session-tracker/capture/tool-capture.ts"
      to: "src/features/session-tracker/persistence/child-writer.ts"
      via: "import"
      pattern: "import.*ChildWriter.*from.*child-writer"
    - from: "src/features/session-tracker/persistence/project-index-writer.ts"
      to: "src/features/session-tracker/persistence/atomic-write.ts"
      via: "import"
      pattern: "import.*atomicWriteJson.*from.*atomic-write"
---

<objective>
Implement capture handlers for all hook events and dual continuity index writers.

Purpose: Core capture logic that processes SDK hook events and writes session knowledge files. This is the heart of the session tracker — transforms raw events into structured, searchable session artifacts.

Output: Capture handlers (event, message, tool), transforms (agent, schema), and dual index writers (session-local, project-level).
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

<interfaces>
<!-- From Plan 01 — types.ts exports -->

From src/features/session-tracker/types.ts:
```typescript
export interface SessionRecord {
  sessionId: string
  created: string
  updated: string
  parentSessionId: string | null
  delegationDepth: number
  children: ChildRef[]
  continuityIndex: string
  status: 'active' | 'idle' | 'completed' | 'error'
}

export interface ChildSessionRecord {
  sessionId: string
  parentSessionId: string
  delegationDepth: number
  delegatedBy: DelegatedBy
  created: string
  updated: string
  status: string
  mainAgent: MainAgent
  turns: Turn[]
  children: ChildSessionRecord[]
}

export interface SessionContinuityIndex {
  version: string
  sessionId: string
  lastUpdated: string
  hierarchy: { root: string; children: Record<string, ChildHierarchyEntry> }
  turnCount: number
  toolSummary: Record<string, number>
}

export interface ProjectContinuityIndex {
  version: string
  projectRoot: string
  lastUpdated: string
  sessions: Record<string, SessionSummary>
  chronologicalOrder: string[]
}
```

From src/features/session-tracker/persistence/session-writer.ts:
```typescript
export class SessionWriter {
  constructor(private deps: { projectRoot: string }) {}
  async createSessionDir(sessionID: string): Promise<string>
  async initializeSessionFile(sessionID: string, metadata: Partial<SessionRecord>): Promise<void>
  async appendUserTurn(sessionID: string, turnNumber: number, content: string): Promise<void>
  async appendAgentBlock(sessionID: string, agentName: string, model: string, thinkingDuration?: string): Promise<void>
  async appendToolBlock(sessionID: string, toolName: string, input: unknown, outputPruned?: string, error?: string): Promise<void>
  async updateFrontmatter(sessionID: string, updates: Partial<SessionRecord>): Promise<void>
}
```

From src/features/session-tracker/persistence/child-writer.ts:
```typescript
export class ChildWriter {
  constructor(private deps: { projectRoot: string }) {}
  async createChildFile(parentSessionID: string, childSessionID: string, metadata: ChildSessionRecord): Promise<void>
  async updateChildStatus(parentSessionID: string, childSessionID: string, status: string): Promise<void>
  async appendChildTurn(parentSessionID: string, childSessionID: string, turn: Turn): Promise<void>
}
```

From src/shared/session-api.ts (SDK client wrapper):
```typescript
export function getSession(client: OpenCodeClient, sessionID: string): Promise<Session>
// Session has: id, parentID, title, time: { created, updated }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Event Capture + Message Capture + Transform</name>
  <files>
    src/features/session-tracker/capture/event-capture.ts,
    src/features/session-tracker/capture/message-capture.ts,
    src/features/session-tracker/transform/agent-transform.ts,
    src/features/session-tracker/transform/schema-normalizer.ts,
    tests/features/session-tracker/capture/event-capture.test.ts,
    tests/features/session-tracker/capture/message-capture.test.ts,
    tests/features/session-tracker/transform/agent-transform.test.ts,
    tests/features/session-tracker/transform/schema-normalizer.test.ts
  </files>
  <behavior>
    - Event capture handles session.created: creates subdir + .md for root sessions
    - Event capture handles session.idle: updates status to idle
    - Event capture handles session.deleted: marks status completed
    - Event capture handles session.error: marks status error
    - Root vs child detection via client.session.get() parentID check
    - Message capture handles chat.message with role="user": appends ## USER (turn N)
    - Message capture handles chat.message with role="assistant": appends main_l0_agent block
    - Agent transform extracts agent name, model, thinking_duration from metadata
    - Agent transform skips thinking blocks
    - Child session ##USER transformed to main_l0_agent with parent agent name
    - Schema normalizer converts SDK snake_case to camelCase
  </behavior>
  <action>
    Create `src/features/session-tracker/capture/event-capture.ts`:
    - `EventCapture` class with constructor accepting `{ client: OpenCodeClient; sessionWriter: SessionWriter }`
    - `async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void>`
    - Switch on `event.eventType`:
      - `"session.created"`: call `client.session.get({ path: { id: sessionID } })` to get parentID. If parentID is null/undefined → root session: call `sessionWriter.createSessionDir(sessionID)` + `sessionWriter.initializeSessionFile(sessionID, metadata)`. If parentID exists → child session: skip (handled by tool-capture when task tool fires).
      - `"session.idle"`: call `sessionWriter.updateFrontmatter(sessionID, { status: 'idle' })`
      - `"session.deleted"`: call `sessionWriter.updateFrontmatter(sessionID, { status: 'completed' })`
      - `"session.error"`: call `sessionWriter.updateFrontmatter(sessionID, { status: 'error' })`
    - All handlers wrapped in try/catch with `console.warn('[Harness] Session tracker event handler failed:', err)` — never throw

    Create `src/features/session-tracker/capture/message-capture.ts`:
    - `MessageCapture` class with constructor accepting `{ sessionWriter: SessionWriter; agentTransform: AgentTransform }`
    - Instance state: `turnCounters: Map<string, number>` (sessionID → current turn number)
    - `async handleChatMessage(input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string }; messageID?: string }, output: { message: { role: string }; parts: Array<{ type: string; text?: string }> }): Promise<void>`
    - If `output.message.role === "user"`: increment turn counter, call `sessionWriter.appendUserTurn(sessionID, turnNumber, textContent)`
    - If `output.message.role === "assistant"`: call `agentTransform.extractAssistantMetadata(input, output)` → call `sessionWriter.appendAgentBlock(sessionID, name, model, thinkingDuration)`
    - Skip thinking blocks: filter `parts` where `type !== "thinking"`
    - All handlers wrapped in try/catch

    Create `src/features/session-tracker/transform/agent-transform.ts`:
    - `AgentTransform` class
    - `extractAssistantMetadata(input: { agent?: string; model?: { providerID: string; modelID: string } }, output: { parts: Array<{ type: string }> }): { name: string; model: string; thinkingDuration?: string }`
    - Extract agent name from `input.agent` or default to "unknown"
    - Extract model from `input.model.modelID` or `input.model.providerID`
    - Compute thinking duration from message metadata if available
    - `transformChildUserMessage(parentAgentName: string, parentModel: string): { name: string; model: string }` — returns parent agent info for child ##USER → main_l0_agent transform

    Create `src/features/session-tracker/transform/schema-normalizer.ts`:
    - `toCamelCase(str: string): string` — converts snake_case to camelCase
    - `normalizeSessionRecord(data: Record<string, unknown>): SessionRecord` — transforms all keys to camelCase
    - `normalizeChildRecord(data: Record<string, unknown>): ChildSessionRecord` — transforms all keys to camelCase

    Create tests:
    - `event-capture.test.ts`: Test session.created with null parentID creates subdir, test session.created with parentID skips, test session.idle updates status, test session.deleted marks completed, test session.error marks error, test graceful failure on malformed input
    - `message-capture.test.ts`: Test user message appends with turn counter, test assistant message appends main_l0_agent, test thinking blocks skipped, test multiple messages increment turn counter
    - `agent-transform.test.ts`: Test extractAssistantMetadata with full input, test with missing agent name, test with missing model, test transformChildUserMessage
    - `schema-normalizer.test.ts`: Test toCamelCase conversions, test normalizeSessionRecord, test normalizeChildRecord
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/capture/ tests/features/session-tracker/transform/</automated>
  </verify>
  <done>
    - Event capture handles session.created/idle/deleted/error
    - Root sessions create subdir + .md; child sessions skip (REQ-ST-01)
    - User messages captured with turn counter (REQ-ST-02)
    - Agent metadata transformed to main_l0_agent (REQ-ST-03)
    - Thinking blocks skipped (REQ-ST-03)
    - Child ##USER → main_l0_agent transform works (REQ-ST-07)
    - Schema normalizer converts to camelCase (REQ-ST-12)
    - All capture/transform tests pass
    - typecheck passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Tool Capture + Dual Index Writers</name>
  <files>
    src/features/session-tracker/capture/tool-capture.ts,
    src/features/session-tracker/persistence/session-index-writer.ts,
    src/features/session-tracker/persistence/project-index-writer.ts,
    tests/features/session-tracker/capture/tool-capture.test.ts,
    tests/features/session-tracker/persistence/session-index-writer.test.ts,
    tests/features/session-tracker/persistence/project-index-writer.test.ts
  </files>
  <behavior>
    - Tool capture handles skill: captures name + first header line only (REQ-ST-04)
    - Tool capture handles read: captures path only, no content (REQ-ST-05)
    - Tool capture handles task: captures delegation metadata + triggers child .json (REQ-ST-06)
    - Tool capture handles other tools: captures metadata only (tool name, callID)
    - Session index writer maintains session-local hierarchy (REQ-ST-08)
    - Project index writer maintains cross-session navigation (REQ-ST-08)
    - Project index uses serial queue for concurrent safety (REQ-ST-09)
    - Both indices use atomic writes (D-03)
  </behavior>
  <action>
    Create `src/features/session-tracker/capture/tool-capture.ts`:
    - `ToolCapture` class with constructor accepting `{ sessionWriter: SessionWriter; childWriter: ChildWriter; sessionIndexWriter: SessionIndexWriter; projectIndexWriter: ProjectIndexWriter }`
    - `async handleToolExecuteAfter(input: { tool: string; sessionID: string; callID: string; args: unknown }, output: { title?: string; output?: string; metadata?: unknown }): Promise<void>`
    - Switch on `input.tool`:
      - `"skill"`: extract `args.name`, parse output for first `#` header line, call `sessionWriter.appendToolBlock(sessionID, "skill", { name: args.name }, firstHeaderLine)`
      - `"read"`: extract `args.filePath`, call `sessionWriter.appendToolBlock(sessionID, "read", { filePath: args.filePath }, undefined, output.error)` — NEVER capture file content
      - `"task"`: extract `args.description`, `args.subagent_type`, `output.task_id`. Call `childWriter.createChildFile(sessionID, task_id, childMetadata)`. Call `sessionIndexWriter.addChild(sessionID, task_id)`. Call `projectIndexWriter.updateSession(sessionID, { childCount: increment })`.
      - default: call `sessionWriter.appendToolBlock(sessionID, input.tool, { callID: input.callID })` — metadata only
    - All handlers wrapped in try/catch

    Create `src/features/session-tracker/persistence/session-index-writer.ts`:
    - `SessionIndexWriter` class with constructor accepting `{ projectRoot: string }`
    - `async initializeIndex(sessionID: string): Promise<void>` — creates initial `session-continuity.json` in session subdir
    - `async addChild(sessionID: string, childSessionID: string, childFile: string, depth: number, delegatedBy: string): Promise<void>` — reads existing index, adds child to hierarchy.children, increments turn_count, writes back atomically
    - `async updateChildStatus(sessionID: string, childSessionID: string, status: string): Promise<void>` — reads existing index, updates child status, writes back atomically
    - `async incrementTurnCount(sessionID: string): Promise<void>` — reads existing index, increments turn_count, writes back atomically
    - `async updateToolSummary(sessionID: string, toolName: string): Promise<void>` — reads existing index, increments tool_summary[toolName], writes back atomically
    - All writes use atomicWriteJson()

    Create `src/features/session-tracker/persistence/project-index-writer.ts`:
    - `ProjectIndexWriter` class with constructor accepting `{ projectRoot: string }`
    - Private `writeQueue: Promise<void>` — promise chain for serial writes (D-03, REQ-ST-09)
    - `async initializeIndex(): Promise<void>` — creates initial `project-continuity.json` if not exists
    - `async addSession(sessionID: string, sessionDir: string, mainFile: string): Promise<void>` — serializes via writeQueue, reads existing index, adds session entry, updates chronological_order, writes back atomically
    - `async updateSession(sessionID: string, updates: Partial<SessionSummary>): Promise<void>` — serializes via writeQueue, reads existing index, merges updates, writes back atomically
    - `async removeSession(sessionID: string): Promise<void>` — serializes via writeQueue, reads existing index, removes session entry, updates chronological_order, writes back atomically
    - Private `async enqueueWrite(fn: () => Promise<void>): Promise<void>` — chains writes: `this.writeQueue = this.writeQueue.then(fn).catch(console.warn)`

    Create tests:
    - `tool-capture.test.ts`: Test skill capture with first header, test skill capture with no header, test read capture path only, test read capture with error, test task capture creates child .json, test task capture updates indices, test other tool captures metadata only
    - `session-index-writer.test.ts`: Test initializeIndex creates file, test addChild updates hierarchy, test updateChildStatus, test incrementTurnCount, test updateToolSummary, test concurrent writes to same index
    - `project-index-writer.test.ts`: Test initializeIndex creates file, test addSession adds entry, test updateSession merges updates, test removeSession removes entry, test serial queue prevents corruption, test 6 concurrent session writes
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts tests/features/session-tracker/persistence/session-index-writer.test.ts tests/features/session-tracker/persistence/project-index-writer.test.ts</automated>
  </verify>
  <done>
    - Skill tool captures name + first header only (REQ-ST-04)
    - Read tool captures path only, no content (REQ-ST-05)
    - Task tool captures delegation + triggers child .json (REQ-ST-06)
    - Session-local index maintained (REQ-ST-08)
    - Project-level index maintained (REQ-ST-08)
    - Serial queue prevents corruption (REQ-ST-09)
    - All tool/index tests pass
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

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ST02-01 | Tampering | tool-capture.ts | mitigate | Path traversal validation on all sessionID usage |
| T-ST02-02 | Information Disclosure | tool-capture.ts | mitigate | Read tool never captures file content; skill output pruned to 1 header line |
| T-ST02-03 | Denial of Service | project-index-writer.ts | mitigate | Serial queue prevents concurrent write corruption |
| T-ST02-04 | Spoofing | event-capture.ts | mitigate | SessionID validated via sanitizeSessionID() before use |
</threat_model>

<verification>
- `npm run typecheck` passes
- `npx vitest run tests/features/session-tracker/capture/` passes
- `npx vitest run tests/features/session-tracker/transform/` passes
- `npx vitest run tests/features/session-tracker/persistence/session-index-writer.test.ts` passes
- `npx vitest run tests/features/session-tracker/persistence/project-index-writer.test.ts` passes
- All 13 REQs from SPEC.md addressed (REQ-ST-01 through REQ-ST-09 in this plan)
</verification>

<success_criteria>
- All capture handlers functional (event, message, tool)
- Transforms working (agent-transform, schema-normalizer)
- Dual indices maintained correctly
- Concurrent write safety verified
- All tests pass
- typecheck passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-02-SUMMARY.md`
</output>
