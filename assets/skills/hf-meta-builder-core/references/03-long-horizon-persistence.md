# Long-Horizon Persistence — Cross-Session State Management

## The Problem

LLM sessions are volatile. Context windows fill, compact, and lose information. Long-horizon projects (skill authoring, multi-agent orchestration, deep research) span many sessions. Without persistence, every session starts from zero.

## The Solution: Dual Persistence

MINDNETWORK uses **two layers** of persistence:

### Layer 1: Planning Triplet (Human-Readable)

| File | Purpose | Update Frequency |
|------|---------|-----------------|
| `task_plan.md` | Goal, phases, decisions, errors | Every phase change |
| `findings.md` | Research, discoveries, technical decisions | Every 2-3 discoveries |
| `progress.md` | Session log, actions, handoffs | Every turn |

### Layer 2: MINDNETWORK State (Machine-Readable)

| File | Purpose | Update Frequency |
|------|---------|-----------------|
| `.meta-builder/state/checkpoint.json` | Active node, completed/failed nodes, traversal path | Every node transition |
| `.meta-builder/state/session-{timestamp}.json` | Session snapshot with planning file status | On phase change |
| `.meta-builder/state/question-count.json` | Question tracking (max 3 per session) | Every question |
| `.meta-builder/state/session-stack.json` | Fork history for undo/redo | On fork |

## Session Recovery Protocol

When a session resumes (or a new session picks up prior work):

```
RECOVERY SEQUENCE:
1. Read task_plan.md
   → What is the goal?
   → What phase was active?
   → What decisions were made?

2. Read .meta-builder/state/checkpoint.json
   → Which node was active?
   → Which nodes completed?
   → Which nodes failed?

3. Read findings.md
   → What was learned?
   → What patterns were discovered?

4. Read progress.md
   → What was done?
   → What errors occurred?
   → What handoff notes exist?

5. Cross-reference with reality
   → git status: what files actually changed?
   → ls: do expected files exist?

6. Reconcile
   → Update checkpoint if reality differs from state
   → Mark completed nodes that match reality
   → Flag failed nodes that need retry

7. Resume
   → Continue from active_node
   → If active_node is null, start from root
```

## Checkpoint Format

```json
{
  "active_node": "author",
  "completed_nodes": ["root", "intent-clarifier", "planner"],
  "failed_nodes": [],
  "traversal_path": ["root", "intent-clarifier", "planner", "author"],
  "last_checkpoint": "2026-04-04T15:30:00Z",
  "session_id": "sess_abc123",
  "user_intent": "Create a skill for deep-research using repomix",
  "assumptions": ["User wants validation scripts included"]
}
```

## Session Stack (Fork History)

When a session forks (user creates a new branch from a message):

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "parent": null,
      "forked_from": null,
      "created_at": "2026-04-04T10:00:00Z",
      "checkpoint": "checkpoint-2026-04-04T15:30:00.json"
    },
    {
      "id": "sess_def456",
      "parent": "sess_abc123",
      "forked_from": "message_789",
      "created_at": "2026-04-04T16:00:00Z",
      "checkpoint": "checkpoint-2026-04-04T16:00:00.json"
    }
  ],
  "current_session": "sess_def456"
}
```

## Context Compaction Strategy

When context fills up:

1. **Write everything to disk first** — checkpoint, findings, progress
2. **Summarize the current state** in one paragraph
3. **Note what to read on recovery** — file paths and sections
4. **Let compaction happen** — the disk state survives

On recovery after compaction:
1. Read checkpoint.json → know where you were
2. Read task_plan.md → know what you're doing
3. Read findings.md → know what you learned
4. Continue

## Undo/Redo Support

The session stack enables undo/redo:

- **Undo:** Revert to previous checkpoint, restore file state via git
- **Redo:** Move forward in session stack, re-apply changes
- **Fork:** Create new session from any checkpoint, branch the graph

**Implementation:** Use git for file-level undo. Use checkpoint.json for graph-level undo.

## Cross-Session Communication

When handing off between sessions:

1. Write handoff note to `progress.md`:
   ```
   ## Handoff
   - Current node: author
   - Completed: root, intent-clarifier, planner
   - Next: Run use-authoring-skills validation loop
   - Blockers: None
   - Assumptions: User wants validation scripts
   ```

2. Save checkpoint via `state-persist.sh save`

3. Next session reads handoff note and resumes

## State File Locations

All state lives in `.meta-builder/state/` within the skill directory:

```
.opencode/skills/meta-builder/
├── .meta-builder/
│   ├── graph.json              # Graph definition
│   └── state/
│       ├── checkpoint.json     # Current traversal state
│       ├── question-count.json # Question tracking
│       ├── session-stack.json  # Fork history
│       └── session-*.json      # Session snapshots
```

Planning files live in the **project root**:

```
project-root/
├── task_plan.md    # Goal and phases
├── findings.md     # Research findings
└── progress.md     # Session log
```
