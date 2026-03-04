---
name: gx-context-engine
description: "Use when steering refactoring, enforcing delegation, managing context continuity, recovering from dirty context, or validating semantic chains. Triggers on: gx-steer, gx-recover, gx-validate, gx-profile, context degradation, delegation routing, session handoff."
---

# GX-Pack Context Engineering Engine

Deterministic, stateful context engineering for governed agent execution.

## What This Skill Does

Orchestrates 10 scripts that enforce context hygiene, delegation boundaries, semantic validation, and cross-session continuity. This skill is the **unit of deployment** — scripts are chained from this SKILL.md, not invoked individually.

## Script Chain Architecture

Scripts execute in lifecycle order. Each chain is triggered by a specific event:

### Chain 1: Session Entry (triggered by command invocation)

```bash
# Step 1: Build runtime profile + lock state
bash scripts/gx-entry-guard.sh <workdir>

# Step 2 (if profile exists): Validate profile is still valid
# Automatic — entry guard checks TTL and policy hash
```

**Output:** `.hivemind/state/runtime-profile.json` — deterministic profile for this session.

### Chain 2: Mid-Session Check (triggered every 10 tool calls by plugin)

```bash
# Step 1: Scan for drift + depth violations
bash scripts/gx-mid-guard.sh <workdir>
```

**Output:** JSON with `drift_score`, `depth_ok`, `todo_health`, `recommendations`.

### Chain 3: TODO Mutation (triggered by hiveops_todo tool)

```bash
# Step 1: Sync TODO changes to hierarchy graph
bash scripts/gx-todo-sync.sh <workdir> <action> <item_id>
```

**Output:** Updated `hierarchy.json` and `todo.json` in sync.

### Chain 4: Stage Close (triggered by workflow exit)

```bash
# Step 1: Validate command→workflow→skill intent alignment
bash scripts/gx-semantic-validate.sh <workdir> <stage>
```

**Output:** JSON with `valid`, `mismatches[]`, `chain_integrity`.

### Chain 5: Export Pipeline (triggered by session end / compaction)

```bash
# Step 1: Strip noise, extract decisions
bash scripts/gx-handoff-purify.sh <workdir>

# Step 2: Register in SOT index + JSONL export
bash scripts/gx-sot-register.sh <workdir>
```

**Output:** Purified handoff + SOT-indexed JSONL at `.hivemind/exports/`.

### Chain 6: Auto-Purge (triggered when dirty_score > 90)

```bash
# Step 1: Snapshot schematic state
bash scripts/gx-auto-purge.sh <workdir> snapshot

# Step 2: Spawn retrieval agent
bash scripts/gx-auto-purge.sh <workdir> spawn-retrieval

# Step 3: Synthesize recovery context (run by retrieval agent)
bash scripts/gx-context-retrieve.sh <workdir>
```

**Output:** `.hivemind/state/context-recovery.json` — picked up by `messages.transform` on next turn.

### Chain 7: Schema Sync (triggered by file.edited event on .hivemind/state/*.json)

```bash
# Step 1: Validate schema + update registry
bash scripts/gx-schema-sync.sh <workdir> <changed_file>
```

**Output:** Updated `schema-registry.json` with version increment.

### Chain 8: Swarm Launch (triggered by gx-steer with parallel-eligible tasks)

```bash
# Step 1: Partition tasks + spawn agents
bash scripts/gx-swarm-launch.sh <workdir>
```

**Output:** `swarm-manifest.json` with spawned agent sessions.

## Runtime Profile Schema

The entry guard builds this profile for every session:

```json
{
  "id": "gx-profile-<hash12>",
  "created": "<ISO timestamp>",
  "ttl": 3600000,
  "intent": "fix_broken",
  "policy_version": "gx-pack-v1",
  "role_envelope": {
    "primary": { "agent": "hiveminder", "level": 2 },
    "secondary": { "agent": "hivehealer", "level": 3 },
    "monitor": { "agent": "hiveq", "level": 3 }
  },
  "capabilities": {
    "tools": ["read", "glob", "grep", "task", "skill", "hiveops_todo", "hiveops_gate"],
    "paths": [".opencode/**", ".hivemind/**", "docs/**"],
    "depth_limit": 3,
    "delegate_to": ["hivehealer", "hivexplorer", "hiveq"]
  },
  "constraints": [
    "L3 agents cannot execute critical-path edits",
    "Monitor must verify before stage promotion",
    "All delegation packets must include profile_id"
  ]
}
```

## Dirty Score Computation

```
dirty_score = sum(
  drift < 40       → 30 points,
  turnCount > 30   → 20 points,
  violations > 3   → 20 points,
  depth > 3        → 15 points,
  todo.blocked > 5 → 15 points
)

Thresholds:
  > 70 → WARNING (inject reminder)
  > 90 → AUTO-PURGE (snapshot + spawn retrieval)
```

## Intent → Role Envelope Mapping

| Intent | Primary (L2) | Secondary (L3) | Monitor |
|--------|-------------|----------------|---------|
| build_new | hiveminder | hivemaker | hiveq |
| fix_broken | hiveminder | hivehealer | hiveq |
| audit_health | hiveq | hivexplorer | hiveminder |
| extend | hiveminder | hivemaker | hiveq |
| improve | hiveminder | hivemaker | hiveq |

## Plugin Integration Points

This skill's scripts are invoked by the `hiveops-governance` plugin at these hook points:

| Hook | Script | When |
|------|--------|------|
| `tool.execute.before` | Profile validation | Every tool call (reads runtime-profile.json) |
| `tool.execute.after` | gx-mid-guard.sh | Every 10 tool calls |
| `experimental.chat.messages.transform` | Context injection | Every LLM turn |
| `experimental.session.compacting` | gx-handoff-purify.sh + gx-sot-register.sh | On compaction |
| `event` (file.edited) | gx-schema-sync.sh | On .hivemind/state/*.json changes |
| `event` (todo.updated) | gx-todo-sync.sh | On TODO state changes |

## Anti-Patterns (BLOCKED)

| ID | Pattern | Why |
|----|---------|-----|
| GX-01 | Running scripts outside chain order | Scripts have dependencies — entry guard MUST run first |
| GX-02 | Modifying runtime-profile.json manually | Profile is auto-constructed — manual edits invalidate hash |
| GX-03 | Skipping mid-guard at >30 turns | Context degradation is guaranteed without mid-session checks |
| GX-04 | Export without purification | Raw exports contain noise that pollutes downstream sessions |
| GX-05 | TODO without hierarchy sync | Orphan TODOs with no hierarchy linkage lose traceability |

## References

Load from `references/` for domain knowledge:
- `context-engineering-spec.md` — Operational manual for the context engine
- `delegation-hierarchy.md` — L2/L3/Monitor boundaries and proof mechanism
- `schema-graph-registry.md` — Schema management protocol and version tracking
- `semantic-validation-rules.md` — Per-asset-type semantic criteria for chain validation
