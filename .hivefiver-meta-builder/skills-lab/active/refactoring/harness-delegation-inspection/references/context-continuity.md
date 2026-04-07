# Context Continuity

## What LLMs Don't Know

Context continuity is the **FIRST requirement** of the framework. Without it, every session starts from zero, all progress is lost, and the agent hallucinates instead of building on prior work.

---

## The Problem

LLMs have finite context windows. When a session exceeds the window:
1. **Auto-compaction** kicks in — old messages are summarized or dropped
2. **Session state is lost** — subagent outputs, intermediate findings, task IDs
3. **The agent forgets** what it was doing, what it found, what it committed

---

## The Solution: Dual-Layer State

### Layer 1: Durable JSON File (Continuity Store)

```
.hivemind/state/
├── session-context-prompt.md    ← Session recovery context
├── continuity.json              ← Durable state (JSON)
└── sessions/
    └── <session-id>.json        ← Per-session state
```

**What gets saved:**
- Session ID
- Task IDs from delegated work
- Phase completion status
- File paths modified
- Commit hashes
- Subagent outputs (auto-exported)

### Layer 2: In-Memory Maps (Runtime State)

```typescript
// In-memory during session
const sessionStats = new Map<string, SessionStats>();
const rootBudgets = new Map<string, BudgetInfo>();
```

**What's in memory:**
- Current session statistics
- Token budget tracking
- Active subagent references
- Real-time progress

---

## Auto-Export Protocol

### Every Subagent Output Must Be Saved

```bash
# After each subagent completes:
AUDIT_ID="audit-$(date +%Y%m%d-%H%M%S)"
SESSION_ID="<task-id-from-delegation>"

# Create isolated workspace
mkdir -p ".temp/audit/${AUDIT_ID}/subagents/${PHASE_NAME}"

# Export subagent output
echo "${SUBAGENT_OUTPUT}" > ".temp/audit/${AUDIT_ID}/subagents/${PHASE_NAME}/final-output.json"

# Export tool calls
echo "${TOOL_CALLS}" > ".temp/audit/${AUDIT_ID}/subagents/${PHASE_NAME}/tool-calls.json"

# Export spawned children
echo "${CHILD_RESULTS}" > ".temp/audit/${AUDIT_ID}/subagents/${PHASE_NAME}/children.json"
```

### Session State File

```json
{
  "audit_id": "audit-20260407-102345",
  "session_id": "ses_29a43c0e8ffehmn16VaMelr93M",
  "started_at": "2026-04-07T10:23:45Z",
  "phases": {
    "phase-1-skills": {
      "status": "complete",
      "session_id": "ses_29a420c59ffe4ZY3TWhg2Sn5wO",
      "output_file": ".temp/audit/audit-20260407-102345/subagents/phase-1-skills/final-output.json",
      "findings_count": 12,
      "completed_at": "2026-04-07T10:25:12Z"
    },
    "phase-2-commands": {
      "status": "in_progress",
      "session_id": "ses_29a41f51affetuUlp1tChbP1VI",
      "started_at": "2026-04-07T10:25:15Z"
    }
  },
  "last_checkpoint": "2026-04-07T10:25:12Z",
  "resume_from": "phase-2-commands"
}
```

---

## Resume Protocol

### When Disconnected

1. **DO NOT create new tasks** — resume existing delegated tasks
2. Read `.hivemind/state/session-context-prompt.md` for recovery context
3. Read `.temp/audit/<audit-id>/state.json` for phase status
4. For each incomplete phase:
   - Check if session ID exists
   - Resume with `task_id` parameter
   - If session is dead, re-dispatch with same context

### Resume by Session ID

```
Task tool:
  description: "Resume: Phase 2 Commands Audit"
  task_id: "ses_29a41f51affetuUlp1tChbP1VI"
  prompt: "RESUME SESSION ses_29a41f51affetuUlp1tChbP1VI\n\nYou were auditing commands. Continue from where you left off."
```

### Resume from Checkpoint

```bash
# Read state
STATE=$(cat ".temp/audit/${AUDIT_ID}/state.json")

# Find last incomplete phase
RESUME_PHASE=$(echo "$STATE" | jq -r '.resume_from')

# Resume from that phase
bash "scripts/phase-${RESUME_PHASE}.sh" --audit-id "${AUDIT_ID}" --resume
```

---

## Context Budget Management

### Monitoring

```
At 50% context: "Context budget at 50%. Consider checkpointing."
At 70% context: AUTO-COMPACT — save state, ask user to resume in new session
At 90% context: CRITICAL — save state immediately, force new session
```

### Compaction Strategy

1. **Before compact:** Save all subagent outputs to disk
2. **Before compact:** Write session state to `.hivemind/state/`
3. **Before compact:** Record commit hashes for all changes
4. **After compact:** Read session-context-prompt.md to restore context
5. **After compact:** Resume from last checkpoint

---

## Session Context File Format

```markdown
---
version: N.0
source_mode: enhance
lanes_executed: [...]
confidence_score: 0.X
complexity_before: N
complexity_after: N
phases_completed: [...]
phases_remaining: [...]
date: YYYY-MM-DD
status: COMPLETE | IN_PROGRESS | BLOCKED
---

## Session Context: [description]

### What We Know
### Actual State
### What Was Achieved
### What Remains Incomplete
### Next Actions
### Key Files to Read
```

---

## What LLMs Get Wrong

| Wrong Assumption | Reality |
|-----------------|---------|
| "I'll remember this" | Context windows are finite. Save to disk. |
| "The subagent output is captured" | It's in memory until the session dies. Export it. |
| "I can resume by reading the conversation" | Conversations get compacted. Use session state files. |
| "Creating a new task is the same as resuming" | New tasks lose all prior context. Resume by session ID. |
| "Context compaction preserves everything" | It summarizes or drops old messages. State is lost. |

---

## The Iron Law

```
EVERY SUBSESSION MESSAGE MUST BE AUTO-EXPORTED TO DISK.
EVERY PHASE COMPLETION MUST UPDATE STATE FILE.
EVERY DISCONNECT MUST RESUME BY SESSION ID, NOT BY RECREATING.
```
