# CP-ST-01: Session Tracker Revamp — Specification

**Date:** 2026-05-10
**Status:** DRAFT
**Depends on:** WS-SR (COMPLETE), Flaw Register `.hivemind/audit/flaw-register-2026-05-10.json`

---

## 1. Problem Statement

The current event tracker (`src/task-management/journal/event-tracker/`) produces broken output:
- Cross-contamination between session files (F1, F2)
- Semantic fields never populated: actors, subSessions, delegations, toolsUsed (F3, F4, F10)
- Dead code: classifier.ts (101 LOC), delegation-evidence.ts (112 LOC) (F5, F6)
- Q6 migration never executed — writes to legacy `.opencode/state/` (F7)
- Test data contamination in state files (F8, F12)
- Persistence gated by `commit_docs` toggle (F11)

## 2. Target Directory Structure

```
.hivemind/
├── session-tracker/                          # NEW: replaces event-tracker/
│   └── <main-session-id>/                    # One subdir per root session
│       ├── <main-session-id>.md              # Primary knowledge capture
│       ├── <child-session-id>.json           # One per delegated child
│       ├── <grandchild-session-id>.json      # One per 3rd-level delegation
│       └── ...
├── state/
│   ├── session-continuity.json               # Index/manifest of all sessions
│   └── delegations.json                       # Delegation records (existing, fix F8)
```

### Rules
- **NO subdirs generated until the USER starts a new main session** (session.created with no parent)
- Subdir named after the main session ID
- Main capture file uses Markdown + YAML frontmatter (human-readable, grep-friendly, hierarchical)
- Child session files use JSON (programmatic access, schema validation, cross-referencing)
- Maximum 3 levels of delegation depth (matches MAX_DELEGATION_DEPTH = 3)

## 3. File Format Specifications

### 3.1 Main Session File (`<session-id>.md`)

```yaml
---
session_id: ses_1ed9df1adffe2hbJudz3sK60y3
created: "2026-05-10T21:54:36Z"
updated: "2026-05-10T22:08:04Z"
parent_session_id: null
root_session_id: null
depth: 0
actors:
  - role: user
    turns: 2
  - role: main_l0_agent
    name: hm-l0-orchestrator
    model: deepseek-v4-pro
children:
  - session_id: ses_1ed9c5c20ffePWOXce5JQpS5Yk
    agent: hm-l2-investigator
    model: deepseek-v4-pro
    status: completed
    path: ses_1ed9c5c20ffePWOXce5JQpS5Yk.json
tools_used:
  - skill: hm-l2-coordinating-loop
  - skill: hm-l3-opencode-platform-reference
  - read: [".hivemind/state/delegations.json"]
  - task: [ses_1ed9c5c20ffePWOXce5JQpS5Yk]
---

# USER [turn:1]

What did we do so far?

# main_l0_agent [name:hm-l0-orchestrator model:deepseek-v4-pro duration:19.7s]

## Tool: skill
**Input:** `{"name":"hm-l2-coordinating-loop"}`

## Tool: read
**Input:** `{"filePath":".hivemind/state/delegations.json"}`
**Error:** File not found

## Tool: task
**Input:** `{"description":"Investigate event tracker bugs","subagent_type":"hm-l2-investigator"}`
**Output:** `task_id: ses_1ed9c5c20ffePWOXce5JQpS5Yk`

# USER [turn:2]

just record flaws you do not need to analyze anything

# main_l0_agent [name:hm-l0-orchestrator model:deepseek-v4-pro duration:3.2s]

## Tool: write
**Input:** `{"filePath":".hivemind/audit/flaw-register-2026-05-10.json"}`
**Output:** written (12 flaws)
```

### 3.2 Child Session File (`<child-session-id>.json`)

```json
{
  "session_id": "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
  "parent_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
  "root_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
  "depth": 1,
  "created": "2026-05-10T21:56:44Z",
  "updated": "2026-05-10T22:04:47Z",
  "agent": {
    "role": "main_l0_agent",
    "name": "hm-l2-architect",
    "model": "deepseek-v4-pro"
  },
  "delegation_context": {
    "task": "Map the complete source architecture for all modules...",
    "scope": {
      "include": ["src/plugin.ts", "src/task-management/**/*.ts"],
      "exclude": [".opencode/", "tests/"]
    },
    "expected_output": "Structured architecture map",
    "verification": "Must use glob to find ALL .ts files in src/"
  },
  "tools_used": [
    {"tool": "skill", "args": {"name": "hm-l2-refactor"}, "timestamp": "..."},
    {"tool": "glob", "args": {"pattern": "src/**/*.ts"}, "timestamp": "..."},
    {"tool": "read", "args": {"filePath": "src/plugin.ts"}, "timestamp": "..."}
  ],
  "summary": "Architecture map produced with 14 modules, 5 hook factories...",
  "status": "completed"
}
```

### 3.3 Session Continuity Index (`session-continuity.json`)

```json
{
  "version": 2,
  "last_updated": "2026-05-10T22:08:04Z",
  "sessions": {
    "ses_1ed9df1adffe2hbJudz3sK60y3": {
      "created": "2026-05-10T21:54:36Z",
      "updated": "2026-05-10T22:08:04Z",
      "status": "active",
      "depth": 0,
      "path": ".hivemind/session-tracker/ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9df1adffe2hbJudz3sK60y3.md",
      "children": ["ses_1ed9c5c20ffePWOXce5JQpS5Yk"],
      "actors": ["user", "hm-l0-orchestrator"]
    },
    "ses_1ed9c5c20ffePWOXce5JQpS5Yk": {
      "created": "2026-05-10T21:56:44Z",
      "updated": "2026-05-10T22:04:47Z",
      "status": "completed",
      "depth": 1,
      "parent": "ses_1ed9df1adffe2hbJudz3sK60y3",
      "root": "ses_1ed9df1adffe2hbJudz3sK60y3",
      "path": ".hivemind/session-tracker/ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9c5c20ffePWOXce5JQpS5Yk.json",
      "agent": "hm-l2-architect",
      "children": []
    }
  }
}
```

## 4. Capture Rules

### 4.1 What Gets Captured

| Source | Hook | Capture |
|--------|------|---------|
| User message | `chat.message` | Full text, turn counter |
| Agent response | `chat.message` | Agent name, model, thinking duration |
| Tool: skill | `tool.execute.after` | Input: name only |
| Tool: read | `tool.execute.after` | Input: filePath; Error if failed; skip output on success |
| Tool: write/edit | `tool.execute.after` | Input: filePath; Output: brief status |
| Tool: task | `tool.execute.after` | Input: description, subagent_type; Output: task_id |
| Tool: bash | `tool.execute.after` | Input: command (truncated); Output: brief status |
| Tool: other | `tool.execute.after` | Input: args (stem only); Output: title |
| Session created | `event` (session.created) | Creates subdir + files |
| Session idle | `event` (session.idle) | Updates status |
| Session deleted | `event` (session.deleted) | Updates status |

### 4.2 What Gets Skipped

- Thinking blocks (between `<thinking>` tags)
- Full file contents from read operations
- Full tool output text (use title/summary only)
- System transform content
- Permission prompts

### 4.3 Delegation Transformation Rules

For delegated (child) sessions:
- `## User` header → `main_l0_agent` with agent name and model from `chat.message` hook
- The delegated prompt becomes the `delegation_context` object
- Child session files go under parent's subdir, NOT a new subdir
- Indexed in session-continuity.json with parent/root references

## 5. OpenCode SDK v2 Hooks to Use

| Hook | Purpose | v2 API |
|------|---------|--------|
| `event` | Session lifecycle (created/idle/deleted) | `Hooks.event` |
| `chat.message` | Capture messages with agent/model metadata | `Hooks["chat.message"]` — NEW v2 |
| `tool.execute.after` | Capture tool call metadata | `Hooks["tool.execute.after"]` |
| `experimental.session.compacting` | Preserve context across compaction | `Hooks["experimental.session.compacting"]` |

### NOT to use (deprecated)
- `system.transform` → use `experimental.chat.system.transform` if needed
- `messages.transform` → use `experimental.chat.messages.transform` if needed

## 6. Schema Field Naming Conventions

Follow consistent naming:
- `snake_case` for all JSON/YAML fields
- `session_id` not `sessionID` or `sessionId`
- `parent_session_id` not `parentID` or `parentId`
- `root_session_id` not `rootId`
- `created` / `updated` as ISO 8601 timestamps
- `depth` as integer (0 = root, 1 = child, 2 = grandchild, 3 = great-grandchild)
- `actors` as array of objects with `role`, `name`, `model`
- `children` as array of session_id strings
- `tools_used` as array of objects with `tool`, `args`

## 7. Module Architecture (Target)

```
src/
├── features/
│   └── session-tracker/              # NEW module
│       ├── index.ts                   # Public API
│       ├── writer.ts                  # File writer (MD + JSON)
│       ├── capture.ts                 # Hook handlers (capture logic)
│       ├── transformer.ts             # Message/tool transforms
│       ├── schema.ts                  # Zod schemas for all file formats
│       ├── continuity-index.ts        # session-continuity.json manager
│       └── session-resolver.ts        # Session ID resolution (fix F1/F2)
├── hooks/
│   └── session-tracker-hooks.ts       # NEW: v2 hook wiring
└── plugin.ts                          # Updated: wire session tracker hooks
```

### Dependency Rules
- `session-tracker/` depends on: `shared/types.ts`, `shared/helpers.ts`
- `session-tracker/` does NOT depend on: `task-management/journal/event-tracker/` (replaces it)
- Hooks wire to session tracker via plugin.ts (same pattern as existing)

## 8. What Stays, What Goes

### Keep (reuse/refactor)
- `src/task-management/continuity/` — session continuity persistence (fix Q6 migration path)
- `src/task-management/continuity/delegation-persistence.ts` — delegation records (fix F8 test data, F11 toggle)
- `src/coordination/delegation/manager.ts` — delegation dispatch (unchanged)
- `src/task-management/lifecycle/` — lifecycle state machine (unchanged)

### Replace
- `src/task-management/journal/event-tracker/` → `src/features/session-tracker/`
  - `hook-event.ts` → DELETE (replaced by capture.ts using v2 hooks)
  - `artifact-writer.ts` → DELETE (replaced by writer.ts)
  - `document-store.ts` → DELETE (replaced by continuity-index.ts)
  - `classifier.ts` → DELETE (dead code F5)
  - `delegation-evidence.ts` → DELETE (dead code F6)
  - `types.ts` → DELETE (replaced by schema.ts)

### Clean up
- `.hivemind/event-tracker/` — delete all contaminated session files
- `.hivemind/state/delegations.json` — clean test fixture data
- `.opencode/state/opencode-harness/session-continuity.json` — migrate to `.hivemind/state/`
