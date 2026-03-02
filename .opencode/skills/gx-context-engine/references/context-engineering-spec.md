# Context Engineering Spec — Operational Manual

> **SOT:** `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md`
> **Scope:** This reference covers the operational aspects of the GX-Pack context engine.

## Engine Overview

The GX-Pack context engine is a 7-layer enforcement chain that runs at different lifecycle points:

| Layer | Mechanism | Trigger |
|-------|-----------|---------|
| 0 | `tool.execute.before` (plugin) | Every tool call |
| 1 | `gx-entry-guard.sh` (command `!`cmd``) | Session start |
| 2 | `messages.transform` (plugin) | Every LLM turn |
| 3 | `gx-mid-guard.sh` (plugin event, every 10 tools) | Mid-session |
| 4 | `gx-todo-sync.sh` (plugin `tool.execute.after` on hiveops_todo) | TODO mutation |
| 5 | `gx-semantic-validate.sh` (workflow exit) | Stage close |
| 6 | `gx-handoff-purify.sh` + `gx-sot-register.sh` (plugin compaction) | Session end |

## Runtime Profile

Built by `gx-entry-guard.sh` at session start. Deterministic: identical inputs → identical profile.

**Fields:**
- `id`: SHA-256 hash of `intent:scope:policy_version` (12 chars)
- `ttl`: 3600000ms (1 hour)
- `intent`: classified user intent
- `role_envelope`: primary/secondary/monitor agent mapping
- `capabilities`: tools, paths, depth_limit, delegate_to
- `constraints`: behavioral rules

## Context Injection

The `messages.transform` hook prepends a governance system message to every LLM turn containing:
- Agent identity + profile ID
- Turn count + drift score + delegation depth
- Active TODO items (max 10)
- Hierarchy cursor (breadcrumb to deepest active node)
- Active constraints
- Scope violation count
- Recovery context (if auto-recovered)

## Auto-Purge

When dirty_score exceeds 90:
1. Snapshot schematic state to `pre-purge-snapshot.json`
2. Archive to `.hivemind/archive/<date>/`
3. Spawn retrieval agent (hivexplorer) via `opencode run`
4. Retrieval agent reads archives, writes `context-recovery.json`
5. Next turn's `messages.transform` picks up recovery context

## Dirty Score Formula

```
drift < 40       → 30 points
turnCount > 30   → 20 points
violations > 3   → 20 points
depth > 3        → 15 points
todo.blocked > 5 → 15 points
max = 100

Thresholds: >70 WARNING, >90 AUTO-PURGE
```
