# Session Context Manager — Summary

## Purpose

Manages session context persistence across phases using structured YAML frontmatter and checkpoint-based state transitions.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Session Context** | YAML file at `.hivemind/state/session-context-prompt.md` |
| **Checkpoint Types** | `phase-start`, `phase-transition`, `loop-entry` |
| **Phase State Machine** | Tracks phase progression with history |
| **Context Propagation** | Injects constraints into all subagent task calls |

## Workflow

1. **READ** — Read session context at phase start
2. **PARSE** — Extract phase, goals, constraints
3. **INJECT** — Pass constraints to all task calls
4. **EXECUTE** — Run phase with context active
5. **UPDATE** — Update context before transition
6. **PERSIST** — Write updated context to file

## File Structure

```
session-context-manager/
├── SKILL.md                         # P2 skill (148 lines)
└── references/
    └── session-context-protocol.md   # Protocol docs (313 lines)
```

## Schema Fields

- `phase` — Current phase name
- `phase_index` — Monotonic counter
- `checkpoint` — Current checkpoint type
- `session_id` — UUID v4
- `started_at` / `last_updated` — ISO8601 timestamps
- `goals` / `constraints` — Multi-line lists
- `phase_history` — Phase outcome log

## Checkpoint Types

| Checkpoint | When | Purpose |
|------------|------|---------|
| `phase-start` | Phase begins | Initialize/restore context |
| `phase-transition` | Before next phase | Capture outcome, prepare next |
| `loop-entry` | Loop iteration | Preserve context, mark iteration |

## GSD Pattern Integration

This skill implements the GSD (Get Stuff Done) session management pattern:
- `.planning/` state files → `.hivemind/state/` directory
- Session context read at phase START (mandatory)
- Phase state tracked in structured YAML format
- Context propagates to all subagent prompts via constraints
