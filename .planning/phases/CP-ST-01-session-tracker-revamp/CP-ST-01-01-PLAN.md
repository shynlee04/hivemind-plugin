---
phase: CP-ST-01-session-tracker-revamp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/types.ts
  - src/features/session-tracker/AGENTS.md
  - src/features/session-tracker/.gitkeep
  - src/features/session-tracker/persistence/atomic-write.ts
  - src/features/session-tracker/persistence/session-writer.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - tests/features/session-tracker/types.test.ts
  - tests/features/session-tracker/persistence/atomic-write.test.ts
  - tests/features/session-tracker/persistence/session-writer.test.ts
  - tests/features/session-tracker/persistence/child-writer.test.ts
autonomous: true
requirements:
  - REQ-ST-12
must_haves:
  truths:
    - "SessionTracker class exists with constructor accepting { client, projectRoot }"
    - "All TypeScript interfaces are defined in types.ts with camelCase naming"
    - "atomicWriteJson() and atomicAppendMarkdown() helpers use write-to-temp + fs.rename()"
    - "Session writer appends YAML frontmatter + markdown content to .md files"
    - "Child writer creates/updates .json files with atomic writes"
  artifacts:
    - path: "src/features/session-tracker/index.ts"
      provides: "SessionTracker class + barrel exports"
      min_lines: 30
    - path: "src/features/session-tracker/types.ts"
      provides: "All TypeScript interfaces for session tracking"
      min_lines: 50
    - path: "src/features/session-tracker/persistence/atomic-write.ts"
      provides: "atomicWriteJson() and atomicAppendMarkdown() helpers"
      min_lines: 30
    - path: "src/features/session-tracker/persistence/session-writer.ts"
      provides: "SessionWriter class for .md file management"
      min_lines: 40
    - path: "src/features/session-tracker/persistence/child-writer.ts"
      provides: "ChildWriter class for .json child session files"
      min_lines: 30
  key_links:
    - from: "src/features/session-tracker/index.ts"
      to: "src/features/session-tracker/types.ts"
      via: "import type"
      pattern: "import.*SessionTrackerConfig.*from.*types"
    - from: "src/features/session-tracker/persistence/session-writer.ts"
      to: "src/features/session-tracker/persistence/atomic-write.ts"
      via: "import atomicWriteJson"
      pattern: "import.*atomicWrite.*from.*atomic-write"
---

<objective>
Create the session tracker module scaffold with TypeScript types and persistence layer.

Purpose: Foundation for all subsequent capture handlers. Types define the contracts that capture handlers implement. Persistence layer provides crash-safe atomic write operations that all writers depend on.

Output: `src/features/session-tracker/` directory with types.ts, index.ts, AGENTS.md, and persistence/ subdirectory containing atomic-write.ts, session-writer.ts, child-writer.ts.
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

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from SPEC.md and RESEARCH.md. -->

From 01-SPEC.md Section 5.1 (Main Session File format):
```yaml
---
session_id: "ses_1ed9df1adffe2hbJudz3sK60y3"
created: "2026-05-10T21:54:36Z"
updated: "2026-05-10T22:08:04Z"
parent_session_id: null
delegation_depth: 0
children:
  - session_id: "ses_1ed9c5c20ffePWOXce5JQpS5Yk"
    child_file: "ses_1ed9c5c20ffePWOXce5JQpS5Yk.json"
continuity_index: "session-continuity.json"
status: "active"
---
```

From 01-SPEC.md Section 5.2 (Child Session File format):
```json
{
  "session_id": "...",
  "parent_session_id": "...",
  "delegation_depth": 1,
  "delegated_by": { "agent_name": "...", "tool": "task", "description": "...", "subagent_type": "..." },
  "created": "...",
  "updated": "...",
  "status": "completed",
  "main_agent": { "name": "...", "model": "..." },
  "turns": [...],
  "children": []
}
```

From 01-SPEC.md Section 5.3 (Session-Local Index):
```json
{
  "version": "2.0",
  "session_id": "...",
  "last_updated": "...",
  "hierarchy": { "root": "...", "children": { ... } },
  "turn_count": 0,
  "tool_summary": {}
}
```

From 01-SPEC.md Section 5.4 (Project-Level Index):
```json
{
  "version": "2.0",
  "project_root": "...",
  "last_updated": "...",
  "sessions": { ... },
  "chronological_order": [...]
}
```

From existing codebase pattern (`src/features/doc-intelligence/`):
```typescript
// Feature module pattern: index.ts (barrel), types.ts (interfaces), core logic files
export class DocIntelligence {
  constructor(private deps: { client: OpenCodeClient; projectRoot: string }) {}
  // ... methods
}
```

From `src/hooks/types.ts` (HookDependencies pattern):
```typescript
export interface HookDependencies {
  client: OpenCodeClient
  projectRoot: string
  // ... other deps
}
```

From `src/shared/session-api.ts` (SDK client wrapper):
```typescript
export function getSession(client: OpenCodeClient, sessionID: string): Promise<Session>
export function getSessionMessages(client: OpenCodeClient, sessionID: string): Promise<Message[]>
export function getSessionStatus(client: OpenCodeClient): Promise<Record<string, SessionStatus>>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Module Scaffold + Types</name>
  <files>
    src/features/session-tracker/index.ts,
    src/features/session-tracker/types.ts,
    src/features/session-tracker/AGENTS.md,
    src/features/session-tracker/.gitkeep,
    tests/features/session-tracker/types.test.ts
  </files>
  <behavior>
    - SessionTracker class accepts { client, projectRoot } in constructor
    - SessionTrackerConfig interface has projectRoot: string
    - SessionRecord interface has session_id, created, updated, parent_session_id, delegation_depth, children, continuity_index, status
    - ChildSessionRecord interface has session_id, parent_session_id, delegation_depth, delegated_by, created, updated, status, main_agent, turns, children
    - SessionContinuityIndex interface has version, session_id, last_updated, hierarchy, turn_count, tool_summary
    - ProjectContinuityIndex interface has version, project_root, last_updated, sessions, chronological_order
    - All field names use camelCase (REQ-ST-12)
    - Type guards exist for validating hook payloads
  </behavior>
  <action>
    Create `src/features/session-tracker/types.ts` with all TypeScript interfaces:
    - `SessionTrackerConfig` — `{ projectRoot: string }`
    - `SessionRecord` — main session .md frontmatter shape (session_id, created, updated, parent_session_id, delegation_depth, children array, continuity_index, status)
    - `ChildSessionRecord` — child session .json shape (session_id, parent_session_id, delegation_depth, delegated_by object, created, updated, status, main_agent, turns array, children array)
    - `SessionContinuityIndex` — session-local index shape (version, session_id, last_updated, hierarchy with root+children, turn_count, tool_summary)
    - `ProjectContinuityIndex` — project-level index shape (version, project_root, last_updated, sessions map, chronological_order array)
    - `DelegatedBy` — delegation metadata (agent_name, tool, description, subagent_type)
    - `MainAgent` — agent metadata (name, model)
    - `Turn` — turn record (turn number, actor, actor_transformed_from?, content, tools array)
    - `ToolRecord` — tool invocation (tool, input, output_pruned?, status?)
    - `ChildRef` — child reference in parent (session_id, child_file)
    - `ChildHierarchyEntry` — hierarchy entry (file, depth, status, delegated_by, children)
    - Type guards: `isValidSessionID(id: unknown): id is string`, `isValidHookPayload(payload: unknown): boolean`

    Create `src/features/session-tracker/index.ts`:
    - Barrel exports for all types
    - `SessionTracker` class skeleton with constructor accepting `{ client: OpenCodeClient; projectRoot: string }`
    - Stub methods: `handleSessionEvent()`, `handleChatMessage()`, `handleToolExecuteAfter()`, `initialize()`, `cleanup()`
    - Each method logs a TODO comment indicating it will be implemented in subsequent plans

    Create `src/features/session-tracker/AGENTS.md`:
    - Module purpose, file structure, dependency rules
    - Reference to SPEC.md for requirements
    - Note about CQRS compliance (hooks call module methods, module owns persistence)

    Create `src/features/session-tracker/.gitkeep`:
    - Empty file to register directory with git

    Create `tests/features/session-tracker/types.test.ts`:
    - Test type guards work correctly
    - Test SessionRecord can be constructed with valid data
    - Test ChildSessionRecord can be constructed with valid data
    - Test camelCase naming on all interfaces (REQ-ST-12)
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/types.test.ts</automated>
  </verify>
  <done>
    - src/features/session-tracker/ directory exists with .gitkeep
    - types.ts exports all interfaces with camelCase field names
    - index.ts exports SessionTracker class with stub methods
    - AGENTS.md documents module purpose and structure
    - types.test.ts passes
    - typecheck passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Persistence Layer + Atomic Write Helpers</name>
  <files>
    src/features/session-tracker/persistence/atomic-write.ts,
    src/features/session-tracker/persistence/session-writer.ts,
    src/features/session-tracker/persistence/child-writer.ts,
    tests/features/session-tracker/persistence/atomic-write.test.ts,
    tests/features/session-tracker/persistence/session-writer.test.ts,
    tests/features/session-tracker/persistence/child-writer.test.ts
  </files>
  <behavior>
    - atomicWriteJson() writes JSON to .tmp file then renames atomically
    - atomicAppendMarkdown() appends markdown content to .md file using atomic rename
    - SessionWriter creates/updates main session .md files with YAML frontmatter
    - SessionWriter.appendTurn() adds ## USER or ## main_l0_agent sections
    - SessionWriter.appendToolBlock() adds ### Tool: {name} sections
    - ChildWriter creates/updates child .json files
    - ChildWriter.updateStatus() updates child status field
    - All writes are crash-safe (atomic rename pattern)
    - No file content is captured for read tool (REQ-ST-05)
  </behavior>
  <action>
    Create `src/features/session-tracker/persistence/atomic-write.ts`:
    - `atomicWriteJson(filePath: string, data: unknown): Promise<void>` — writes JSON.stringify(data, null, 2) to `${filePath}.tmp.${Date.now()}`, then `fs.rename()` to filePath. Uses `fs/promises`.
    - `atomicAppendMarkdown(filePath: string, content: string): Promise<void>` — reads existing file, appends content with newline separator, writes to temp, renames. For .md files that grow incrementally.
    - `ensureDirectory(dirPath: string): Promise<void>` — `fs.mkdir(dirPath, { recursive: true })`
    - `sanitizeSessionID(sessionID: string): string` — strips non-alphanumeric/underscore/hyphen chars, validates length >= 3
    - `safeSessionPath(projectRoot: string, sessionID: string, filename: string): string` — constructs path under `.hivemind/session-tracker/{sessionID}/{filename}`, validates no `../` traversal

    Create `src/features/session-tracker/persistence/session-writer.ts`:
    - `SessionWriter` class with constructor accepting `{ projectRoot: string }`
    - `async createSessionDir(sessionID: string): Promise<string>` — creates `.hivemind/session-tracker/{sessionID}/` directory
    - `async initializeSessionFile(sessionID: string, metadata: Partial<SessionRecord>): Promise<void>` — creates initial .md file with YAML frontmatter (session_id, created, updated, parent_session_id, delegation_depth, children: [], continuity_index, status)
    - `async appendUserTurn(sessionID: string, turnNumber: number, content: string): Promise<void>` — appends `## USER (turn {N})\n\n{content}\n`
    - `async appendAgentBlock(sessionID: string, agentName: string, model: string, thinkingDuration?: string): Promise<void>` — appends `## main_l0_agent\n\n**name:** {agentName}\n**model:** {model}\n**thinking_duration:** {thinkingDuration}\n`
    - `async appendToolBlock(sessionID: string, toolName: string, input: unknown, outputPruned?: string, error?: string): Promise<void>` — appends `### Tool: {toolName}\n\n**Input:**\n```json\n{input}\n```\n` plus output or error section
    - `async updateFrontmatter(sessionID: string, updates: Partial<SessionRecord>): Promise<void>` — reads existing .md, parses YAML frontmatter with `gray-matter`, merges updates, writes back atomically
    - Uses `gray-matter` for frontmatter parsing, `js-yaml` for YAML serialization
    - All writes use atomic-write.ts helpers

    Create `src/features/session-tracker/persistence/child-writer.ts`:
    - `ChildWriter` class with constructor accepting `{ projectRoot: string }`
    - `async createChildFile(parentSessionID: string, childSessionID: string, metadata: ChildSessionRecord): Promise<void>` — creates `.hivemind/session-tracker/{parentSessionID}/{childSessionID}.json`
    - `async updateChildStatus(parentSessionID: string, childSessionID: string, status: string): Promise<void>` — reads existing .json, updates status field, writes back atomically
    - `async appendChildTurn(parentSessionID: string, childSessionID: string, turn: Turn): Promise<void>` — reads existing .json, appends to turns array, writes back atomically
    - All writes use atomicWriteJson()

    Create tests:
    - `tests/features/session-tracker/persistence/atomic-write.test.ts`:
      - Test atomicWriteJson creates file with correct JSON
      - Test atomicWriteJson handles concurrent writes (no corruption)
      - Test atomicAppendMarkdown appends to existing file
      - Test atomicAppendMarkdown creates file if not exists
      - Test sanitizeSessionID rejects invalid IDs
      - Test safeSessionPath rejects path traversal
    - `tests/features/session-tracker/persistence/session-writer.test.ts`:
      - Test createSessionDir creates directory structure
      - Test initializeSessionFile creates .md with correct frontmatter
      - Test appendUserTurn adds correct markdown
      - Test appendAgentBlock adds correct markdown
      - Test appendToolBlock adds correct markdown with pruned output
      - Test updateFrontmatter correctly merges updates
    - `tests/features/session-tracker/persistence/child-writer.test.ts`:
      - Test createChildFile creates .json with correct structure
      - Test updateChildStatus updates status field
      - Test appendChildTurn appends to turns array
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/persistence/</automated>
  </verify>
  <done>
    - atomic-write.ts provides crash-safe write helpers
    - session-writer.ts creates/updates .md files with YAML frontmatter
    - child-writer.ts creates/updates .json child files
    - All writes use atomic rename pattern (D-03)
    - Path safety validated (no traversal)
    - All persistence tests pass
    - typecheck passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Module → Filesystem | All writes constrained to `.hivemind/session-tracker/` root |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ST01-01 | Tampering | atomic-write.ts | mitigate | Path traversal validation: `safeSessionPath()` rejects `../` and verifies resolved path starts with tracker root |
| T-ST01-02 | Information Disclosure | session-writer.ts | mitigate | No file content captured for read tool (REQ-ST-05); tool output pruned per SPEC Section 5.1 |
| T-ST01-03 | Denial of Service | persistence layer | accept | File growth is append-only; no performance concern with current Node.js fs operations for typical session sizes |
</threat_model>

<verification>
- `npm run typecheck` passes
- `npx vitest run tests/features/session-tracker/` passes
- `src/features/session-tracker/` directory exists with proper structure
- All interfaces use camelCase field names (REQ-ST-12)
- All writes use atomic rename pattern (D-03)
- Path safety validated (no traversal possible)
</verification>

<success_criteria>
- Module scaffold created with types.ts, index.ts, AGENTS.md
- Persistence layer provides atomic write helpers
- SessionWriter and ChildWriter classes functional
- All tests pass
- typecheck passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-01-SUMMARY.md`
</output>
