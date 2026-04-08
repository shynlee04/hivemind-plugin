---
name: session-context-manager
description: This skill should be used when the user asks to "manage session context", "track phase progress", "persist context across loops", "load session state", "read session context", "maintain context between phases", "save checkpoint", "resume session context", or "context schema".
version: 1.0.0
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Session Context Manager

<files_to_read>
- references/session-context-protocol.md — Detailed checkpoint types, state machine, and protocol steps
</files_to_read>

## First Action — Mandatory Phase Start Protocol

**Before any phase execution, read the session context file.**

The session context file lives at a project-relative path. The convention is `.hivemind/state/session-context-prompt.md` from the workspace root, but projects may use different state directories. Discover it by:

1. Check `.hivemind/state/session-context-prompt.md` (conventional location)
2. If not found, use Glob to search: `**/state/session-context-prompt.md`
3. If still not found, initialize it at `.hivemind/state/session-context-prompt.md`

```bash
# Discover and read session context at phase start
cat .hivemind/state/session-context-prompt.md
```

**If the file does not exist, initialize it before proceeding.**

## Context Schema

Session context MUST have this structure:

```yaml
---
phase: <current-phase-name>
phase_index: <number>
checkpoint: <checkpoint-type>
session_id: <uuid>
started_at: <ISO-timestamp>
last_updated: <ISO-timestamp>
goals: |
  - <goal 1>
  - <goal 2>
constraints: |
  - <constraint 1>
  - <constraint 2>
current_task: <description>
phase_history: |
  - phase: <name>
    completed_at: <timestamp>
    outcome: <success|partial|failure>
next_phase: <name>
pending_items: |
  - <item 1>
  - <item 2>
---

[Session context body - freeform notes, decisions, learnings]
```

## Phase Start Protocol

### Checkpoint Types

| Checkpoint | When | Action |
|------------|------|--------|
| `checkpoint:phase-start` | Phase begins | Read session context, inject constraints into task |
| `checkpoint:phase-transition` | Before moving phases | Update context, persist before transition |
| `checkpoint:loop-entry` | Loop iteration begins | Preserve context, increment iteration counter |

### Protocol Steps

1. **[ ] READ** — Read the session context file (discover relative to workspace root, conventionally `.hivemind/state/session-context-prompt.md`)
2. **[ ] PARSE** — Extract `phase`, `checkpoint`, `goals`, `constraints`
3. **[ ] INJECT** — Append a `[Session Context]` block to every subagent prompt (see Context Propagation Rules below)
4. **[ ] EXECUTE** — Run the phase with context constraints active
5. **[ ] UPDATE** — Before transition, update context with outcomes
6. **[ ] PERSIST** — Write updated context back to the session context file

## Context Propagation Rules

**Inject context into ALL subagent prompts via a `[Session Context]` block:**

```
[Session Context]
Phase: <phase>
Goals: <goals>
Constraints: <constraints>
Session ID: <session_id>
```

Append this block to every subagent prompt before dispatching work. This is the OpenCode-native pattern for context injection — no CLI flags required.

## Context Update Rules

**Update context BEFORE phase transitions:**

1. Record `phase_history` entry with `outcome`
2. Update `last_updated` timestamp
3. Set `next_phase` if known
4. Move `pending_items` to completed or carry forward
5. If loop: increment `phase_index` but preserve `goals` and `constraints`

**Update context ON loop iteration:**

1. Add entry to `phase_history` with `loop` marker
2. Preserve ALL existing context fields
3. Append iteration-specific notes to body

## State Persistence

| State File | Purpose | Update Frequency |
|------------|---------|------------------|
| `.hivemind/state/session-context-prompt.md` | Primary session context | On every phase transition |
| `.hivemind/state/phase-history.json` | Structured phase log (optional) | After each phase completes |

**Path discovery:** All state paths are relative to the workspace root. The `.hivemind/state/` directory is a convention — if your project uses a different state directory, discover it and adapt accordingly.

**Never rely on in-memory context across sessions.** Always read from persistence.

## Validation Checklist

- [ ] Session context file exists before phase execution
- [ ] `phase` field matches current phase
- [ ] `goals` field is non-empty
- [ ] `constraints` field passed to all subagent calls
- [ ] Context updated before any phase transition
- [ ] `last_updated` reflects most recent modification
- [ ] `phase_history` contains entry for completed phases

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|--------------|-----------|------------|
| **Context-free execution** | No session context read at phase start | HALT — read context before any action |
| **Stale context** | `last_updated` > 1 hour ago | Re-read and validate before proceeding |
| **Lost constraints** | Subagent prompts lack `[Session Context]` block | Append context block to subagent prompt template |
| **Orphaned loops** | Loop iteration without context preservation | Use `checkpoint:loop-entry`, preserve all fields |
| **Ghost transitions** | Phase change without context update | Update context BEFORE calling next phase |

## Reference Files

- `references/session-context-protocol.md` — Detailed checkpoint types and state machine

## Cross-References (Boundary Clarification)

| Related Skill | Boundary |
|---------------|----------|
| `planning-with-files` | planning-with-files owns task-level planning files (task_plan.md, findings.md, progress.md). This skill owns session-level context (phase tracking, checkpoint schema, context propagation). |
| `phase-loop` | phase-loop owns iterative loop semantics. This skill owns the context schema that loop iterations read/write. |
| `coordinating-loop` | coordinating-loop dispatches agents across phases. This skill provides the context persistence those agents use. |
