# Session Context Protocol

## Overview

The Session Context Protocol defines how session state persists across phase boundaries. It uses checkpoint types to mark transitions and a structured YAML format for the session context file.

## Session Context File Location

```
<workspace-root>/.hivemind/state/session-context-prompt.md
```

**Discovery pattern:** The file lives at a project-relative path under the workspace root. The conventional location is `.hivemind/state/session-context-prompt.md`, but agents should discover it relative to the workspace root rather than assuming a fixed absolute path.
<workspace-root>/.hivemind/state/session-context-prompt.md
```

**Discovery pattern:** The file lives at a project-relative path under the workspace root. The conventional location is `.hivemind/state/session-context-prompt.md`, but agents should discover it relative to the workspace root rather than assuming a fixed absolute path.

## YAML Frontmatter Schema

```yaml
---
phase: string              # Current phase name (e.g., "planning", "execution", "review")
phase_index: integer       # Monotonic counter per session (starts at 1)
checkpoint: enum          # See Checkpoint Types below
session_id: string         # UUID v4 — unique per session
started_at: ISO8601       # Session start timestamp
last_updated: ISO8601     # Last modification timestamp
goals: string             # Multi-line goals list
constraints: string       # Multi-line constraints list
current_task: string      # Human-readable current task description
phase_history: string     # Multi-line phase log with outcomes
next_phase: string        # Anticipated next phase (optional)
pending_items: string     # Multi-line pending work list
---
```

## Checkpoint Types

### `checkpoint:phase-start`

**When:** Beginning of any phase execution.

**Purpose:** Initialize or restore session context for phase work.

**Required actions:**
1. Read the session context file (discover relative to workspace root)
2. Validate all frontmatter fields present
3. Extract `goals` and `constraints` for injection
4. Begin phase with context constraints active

**Entry validation:**
```bash
# Must have all required fields — discover file path relative to workspace root
SESSION_FILE="<workspace-root>/.hivemind/state/session-context-prompt.md"
required_fields=("phase" "phase_index" "checkpoint" "session_id" "started_at" "last_updated")
for field in "${required_fields[@]}"; do
  if ! grep -q "^${field}:" "$SESSION_FILE"; then
    echo "ERROR: Missing required field: $field"
    exit 1
  fi
done
```

### `checkpoint:phase-transition`

**When:** Before moving from one phase to the next.

**Purpose:** Capture phase outcome and prepare context for next phase.

**Required actions:**
1. Update `phase_history` with current phase outcome
2. Set `last_updated` to current timestamp
3. Set `next_phase` to anticipated next phase (if known)
4. Update `pending_items` (move completed, add new)
5. Write updated context BEFORE initiating transition
6. Reset `checkpoint` to `checkpoint:phase-start` for next phase

**Transition validation:**
```bash
# Context must be updated before transition — discover file path relative to workspace root
SESSION_FILE="<workspace-root>/.hivemind/state/session-context-prompt.md"
if ! grep -q "phase_history:" "$SESSION_FILE"; then
  echo "ERROR: phase_history not updated before transition"
  exit 1
fi
```

### `checkpoint:loop-entry`

**When:** Beginning of a loop iteration (same phase repeated).

**Purpose:** Preserve existing context while marking iteration boundary.

**Required actions:**
1. Read current session context (do NOT reset)
2. Increment `phase_index` by 1
3. Update `last_updated` timestamp
4. Preserve ALL other fields unchanged
5. Add iteration marker to phase_history

**Loop entry format in phase_history:**
```yaml
phase_history: |
  - phase: planning
    completed_at: "2026-04-07T10:00:00Z"
    outcome: partial
    iteration: 1
  - phase: planning
    entry_at: "2026-04-07T10:30:00Z"
    iteration: 2  # <-- same phase, new iteration
```

## Phase State Machine

```
                    ┌─────────────────┐
                    │  Session Start  │
                    └────────┬────────┘
                             │
                    checkpoint:phase-start
                             │
                             ▼
┌──────────────────────────────────────────────┐
│              PHASE EXECUTION                 │
│  (with session context constraints active)   │
└──────────────────────┬───────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
    More work in phase        Work complete
           │                       │
           ▼                       ▼
checkpoint:loop-entry    checkpoint:phase-transition
           │                       │
           │                       ▼
           │              ┌─────────────────┐
           │              │  Next Phase     │
           │              │  (loop or new)  │
           │              └────────┬────────┘
           │                       │
           └───────────────────────┘
                       │
              checkpoint:phase-start
                       │
                       ▼
              ┌─────────────────┐
              │  Session End    │
              └─────────────────┘
```

## Context Injection Format

### As Subagent Prompt Section

```markdown
## Session Context
Phase: <phase>
Phase Index: <phase_index>
Session ID: <session_id>
Goals:
  - <goal 1>
  - <goal 2>
Constraints:
  - <constraint 1>
  - <constraint 2>
Current Task: <current_task>
Pending Items:
  - <pending item 1>
```

Append this block to every subagent prompt before dispatching work. Do not use `--constraint` flags — OpenCode has no such flag. Context flows through prompt text only.

Append this block to every subagent prompt before dispatching work. Do not use `--constraint` flags — OpenCode has no such flag. Context flows through prompt text only.

## State Files

### Primary State File

**Location:** `<workspace-root>/.hivemind/state/session-context-prompt.md` (discover relative to workspace root)

**Contents:** Full YAML frontmatter + body with session notes.

### Structured Phase Log (Optional)

**Location:** `<workspace-root>/.hivemind/state/phase-history.json` (discover relative to workspace root)

**Format:**
```json
{
  "session_id": "uuid",
  "started_at": "ISO8601",
  "phases": [
    {
      "name": "planning",
      "index": 1,
      "entered_at": "ISO8601",
      "completed_at": "ISO8601",
      "outcome": "success|partial|failure",
      "iteration": 1
    }
  ]
}
```

## Initialization

When no session context exists:

1. Create `<workspace-root>/.hivemind/state/` directory (discover relative to workspace root)
2. Create `session-context-prompt.md` with:
   - `session_id`: Generate UUID v4
   - `started_at`: Current timestamp
   - `last_updated`: Same as started_at
   - `phase_index`: 1
   - `checkpoint`: checkpoint:phase-start
3. Leave `goals`, `constraints`, `phase_history` empty (populate during planning phase)

```bash
# Initialize new session context — discover STATE_DIR relative to workspace root
STATE_DIR="<workspace-root>/.hivemind/state"
mkdir -p "$STATE_DIR"
cat > "$STATE_DIR/session-context-prompt.md" << 'EOF'
---
phase: initialization
phase_index: 1
checkpoint: checkpoint:phase-start
session_id: $(uuidgen)
started_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
last_updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
goals: |
  -
constraints: |
  -
current_task: Awaiting phase assignment
phase_history: |
  -
next_phase: planning
pending_items: |
  -
---

# Session Notes
EOF
```

## Validation Rules

| Rule | Check | Error If |
|------|-------|----------|
| File exists | Test `-f` | "Session context file not found" |
| Required fields | Grep each required field | "Missing required field: X" |
| UUID format | Regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | "Invalid session_id format" |
| Timestamp format | ISO8601 regex | "Invalid timestamp format" |
| Non-empty goals | Field has content after `goals: |` | "Goals not set before phase execution" |
| Stale check | `last_updated` < 1 hour old | Warning only: "Context may be stale" |

## Example Session Context

```yaml
---
phase: deep-research
phase_index: 3
checkpoint: checkpoint:phase-start
session_id: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
started_at: "2026-04-07T09:00:00Z"
last_updated: "2026-04-07T11:30:00Z"
goals: |
  - Complete codebase analysis for auth module
  - Identify all security-relevant code paths
  - Document findings in research report
constraints: |
  - Do not modify any source files
  - Focus on read-only analysis
  - Report only factual findings
current_task: Analyzing JWT token validation flow
phase_history: |
  - phase: planning
    completed_at: "2026-04-07T09:15:00Z"
    outcome: success
  - phase: exploration
    completed_at: "2026-04-07T10:45:00Z"
    outcome: partial
    note: "Incomplete - resumed in iteration 2"
next_phase: synthesis
pending_items: |
  - Review authentication middleware
  - Check password hashing implementation
  - Audit session management
---

# Iteration 2 Notes

Continuing exploration of auth module. Previous iteration identified:
- Login endpoint at `src/auth/login.ts`
- Token refresh mechanism partially documented

Remaining:
- JWT validation flow (in progress)
- Session cleanup handlers
```

## Anti-Patterns

| Pattern | Problem | Solution |
|---------|---------|----------|
| **Skip read** | Execute phase without reading context | Mandatory read step before phase code |
| **Lost goals** | Constraints not passed to subagent | Inject via `[Session Context]` prompt block |
| **Silent stale** | Using context older than 1 hour | Warn and re-validate before use |
| **Orphan history** | Phase outcomes not recorded | Update phase_history at transition |
| **Ghost loop** | Loop without preserving context | Use checkpoint:loop-entry, keep all fields |
