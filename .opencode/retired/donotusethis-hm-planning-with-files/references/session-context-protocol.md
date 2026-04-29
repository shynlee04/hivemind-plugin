# Session Context Protocol

> Merged from `session-context-manager` (Phase 20, 2026-04-23). This reference extends the 3-file planning system with session-level checkpoint schema and cross-session persistence.

## When to Use

- Starting a new phase within a multi-phase project
- Resuming work after interruption or context compaction
- Handing off between subagents that need shared state
- Loop iterations that must preserve accumulated context

## Session Context Schema

Session context is a YAML-frontmatter file (conventionally `.hivemind/state/session-context-prompt.md`) that lives **above** the task-level planning files:

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

[Session context body — freeform notes, decisions, learnings]
```

## Relationship to 3-File System

| File | Scope | Lifetime |
|------|-------|----------|
| `task_plan.md` | Task-level: goals, phases, decisions | Single task |
| `findings.md` | Research-level: discoveries, technical data | Single task |
| `progress.md` | Session-level: log, errors, handoffs | Single task |
| `session-context-prompt.md` | Project-level: phase history, constraints, checkpoints | Multi-session |

**Rule:** `session-context-prompt.md` is the **orchestrator's brain** across sessions. The 3-file system is the **task-completer's brain** within a session. Both must be read at phase start.

## Checkpoint Types

| Checkpoint | When | Action |
|------------|------|--------|
| `checkpoint:phase-start` | Phase begins | Read session context, inject constraints into task |
| `checkpoint:phase-transition` | Before moving phases | Update context, persist before transition |
| `checkpoint:loop-entry` | Loop iteration begins | Preserve context, increment iteration counter |

## Phase Start Protocol

1. **[ ] READ** — Read session context file (`.hivemind/state/session-context-prompt.md` or discover via Glob)
2. **[ ] PARSE** — Extract `phase`, `checkpoint`, `goals`, `constraints`
3. **[ ] INJECT** — Append `[Session Context]` block to every subagent prompt
4. **[ ] EXECUTE** — Run the phase with context constraints active
5. **[ ] UPDATE** — Before transition, update context with outcomes
6. **[ ] PERSIST** — Write updated context back to the session context file

## Context Propagation Rules

Inject this block into ALL subagent prompts:

```
[Session Context]
Phase: <phase>
Goals: <goals>
Constraints: <constraints>
Session ID: <session_id>
```

## Context Update Rules

**Before phase transitions:**
1. Record `phase_history` entry with `outcome`
2. Update `last_updated` timestamp
3. Set `next_phase` if known
4. Move `pending_items` to completed or carry forward

**On loop iteration:**
1. Add entry to `phase_history` with `loop` marker
2. Preserve ALL existing context fields
3. Append iteration-specific notes to body

## State Persistence

| State File | Purpose | Update Frequency |
|------------|---------|------------------|
| `.hivemind/state/session-context-prompt.md` | Primary session context | On every phase transition |
| `.hivemind/state/phase-history.json` | Structured phase log (optional) | After each phase completes |

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
