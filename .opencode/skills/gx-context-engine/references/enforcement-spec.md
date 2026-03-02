# Enforcement Specification

> **SOT:** `docs/plans/2026-03-02-gx-pack-certified-requirements.md` CR-01, CR-08
> **Script:** `scripts/gx-enforce.sh`

## Overview

The enforcement engine blocks off-plan agent actions at runtime. When an agent attempts a tool call, path access, or delegation outside its current hierarchy node's scope, the action is BLOCKED (not warned, not logged — BLOCKED). Override requires explicit user approval.

## Enforcement State

File: `.hivemind/state/enforcement.json`

```json
{
  "$schema": "gx-enforcement-v1",
  "version": 1,
  "mode": "active",
  "active_node": "action/fix-schemas",
  "scope": {
    "allowed_paths": [".opencode/**", ".hivemind/**", "docs/**"],
    "allowed_tools": ["read", "glob", "grep", "write", "edit", "bash", "task"],
    "allowed_delegations": ["hivemaker", "hiveq", "hivexplorer"]
  },
  "violations": [],
  "last_check": 1709337600,
  "block_active": false,
  "block_reason": null
}
```

## Modes

| Mode | Behavior |
|------|----------|
| `active` | Blocks off-plan actions. Returns BLOCKED message. |
| `passive` | Logs violations but allows action. Returns warning. |
| `disabled` | No enforcement. Used for emergency override only. |

## Scope Resolution

1. Read hierarchy.json, find node by ID
2. If node has `scope` field → use it
3. If node has no `scope` → inherit from parent
4. If no ancestor has scope → use default: `[".opencode/**", ".hivemind/**", "docs/**"]`
5. L3 executors: subtract orchestration tools (`task`, `hiveops_export`, `hiveops_gate`)

## Path Matching

Uses glob-style matching:
- `**` matches any depth of directories
- `*` matches within a single directory level
- Exact prefix matching for simple paths

## Violation Record

```json
{
  "timestamp": 1709337600,
  "type": "path|tool|delegation",
  "detail": "Attempted: src/main.ts, Allowed: .opencode/**, .hivemind/**, docs/**",
  "blocked": true
}
```
