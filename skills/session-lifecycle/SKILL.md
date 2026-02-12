---
name: "session-lifecycle"
description: "Teaches proper session lifecycle: declare_intent → map_context → compact_session. Covers starting, updating, and closing sessions."
triggers:
  - "Starting a new work session"
  - "Switching focus within a session"
  - "Completing work and archiving"
version: "2.6.0"
---

# Session Lifecycle

Manage your work session with HiveMind's 3-level hierarchy. Each tool is a cognitive prosthetic — you become smarter by using it.

## The 3-Level Hierarchy

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

- **Trajectory**: Project-level goal, survives sessions
- **Tactic**: Session-level approach, survives compaction
- **Action**: What you're doing right now, resets drift

## Starting a Session — `declare_intent`

```typescript
declare_intent({
  mode: "plan_driven" | "quick_fix" | "exploration",
  focus: "What you're working on (1 sentence)",
  reason?: "Optional: why this mode?"
})
```

**What you gain:**
- Hierarchy tree created with timestamp ID (grep-able forever)
- Session file instantiated from template (structured, not chaotic)
- Drift detection activated (you'll know when you wander)
- Brain state initialized (all tools now have context)
- Manifest updated (session traceable across boundaries)

**What skipping costs:**
- No drift detection → silent wandering without awareness
- No tree → `scan_hierarchy`, `think_back`, `check_drift` return nothing
- No session file → compaction loses all context
- System prompt warns every turn (strict/assisted modes)

**Mode selection:**
| Mode | When | Governance |
|------|------|-----------|
| `plan_driven` | Feature work, multi-step tasks | Full tracking, drift warnings at 5 turns |
| `quick_fix` | Bug fix, single change | Lighter tracking, drift warnings at 8 turns |
| `exploration` | Research, investigation | Minimal tracking, drift warnings at 12 turns |

## Updating Focus — `map_context`

```typescript
map_context({
  level: "trajectory" | "tactic" | "action",
  content: "The new focus (1-2 sentences)",
  status?: "pending" | "active" | "complete" | "blocked"
})
```

**What you gain:**
- Turn count RESET → drift score rebounds
- Tree node created with timestamp → decision traceable
- Active session file updated → any agent can see current focus
- Chain integrity maintained → parent-child relationships preserved

**What skipping costs:**
- Turn count climbs → drift warnings compound
- No record of focus change → looks like wandering
- Compaction loses the pivot → next session doesn't know you changed direction

**When to call:**
- Switching from planning to implementation → `level: "tactic"`
- Starting a specific task → `level: "action"`
- Completed something → `status: "complete"` (enables auto-prune)
- Hit a wall → `status: "blocked"` (clears failure flags)
- Changed direction → new `content` at appropriate level

**How often:** Every 3-5 meaningful actions. Too frequent = noise. Too rare = drift.

## Closing a Session — `compact_session`

```typescript
compact_session({
  summary?: "Optional 1-line summary of what was accomplished"
})
```

**What the internal scripts do automatically:**
1. Identify turning points from tree (timestamp gaps, status changes)
2. Generate context report (trajectory + active tactic + key decisions + files)
3. Generate next-compaction report (what to preserve for future compaction)
4. Auto-prune completed branches (if threshold exceeded)
5. Auto-export session as JSON + markdown
6. Auto-save summary to mems brain (survives across sessions)
7. Archive session file to `archive/` directory
8. Update manifest, increment `compaction_count`
9. Reset brain state for next session

**What you gain:**
- Clean session boundary with full archive
- Intelligence preserved in mems (decisions, findings)
- Next session gets curated context via `next_compaction_report`
- Tree pruned of completed work
- Compaction count tracked for pattern detection

**What skipping costs:**
- Session file grows unbounded → compaction quality drops
- No archive → session history lost
- No mems → next session starts from zero
- No report → next compaction is generic, not curated

## Typical Flow

```
1. declare_intent({ mode: "plan_driven", focus: "Build auth system" })

2. map_context({ level: "trajectory", content: "OAuth2 + JWT architecture" })

3. map_context({ level: "tactic", content: "Set up JWT middleware" })

4. map_context({ level: "action", content: "Install jose library" })
   [do work...]
   map_context({ level: "action", content: "Install jose", status: "complete" })

5. map_context({ level: "action", content: "Write token validator" })
   [do work...]
   map_context({ level: "action", content: "Token validator", status: "complete" })

6. compact_session({ summary: "JWT middleware foundation with jose" })
```

## Governance Modes

| Mode | Session Start | Warnings | Tracking |
|------|--------------|----------|----------|
| **strict** | LOCKED until `declare_intent` | Strong, every turn | Full |
| **assisted** | OPEN, warnings if no intent | Moderate | Full |
| **permissive** | OPEN, silent | None | Silent |

**Important:** Even in permissive mode, tracking still happens. Your future self benefits from the data even if you don't see warnings now.

## Drift Management

HiveMind tracks drift score (0-100):
- **>50**: Healthy — you've updated context recently
- **<50**: Warning — too many turns without checkpoint
- **Reset**: Call `map_context` with any level

## Verification Commands

```bash
# See current session state
node bin/hivemind-tools.cjs session active

# See full hierarchy tree
node bin/hivemind-tools.cjs state hierarchy

# Check session history
node bin/hivemind-tools.cjs session history

# Trace artifacts from a session
node bin/hivemind-tools.cjs session trace <stamp>
```

## Files to Know

- `.hivemind/sessions/{stamp}.md` — Current session (per-session, from template)
- `.hivemind/sessions/manifest.json` — Session registry (JSON, queryable)
- `.hivemind/hierarchy.json` — Tree hierarchy (source of truth)
- `.hivemind/brain.json` — Machine state (don't edit manually)
- `.hivemind/sessions/archive/` — Completed sessions

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll declare intent later" | Every tool call without intent is untracked. Do it first. |
| "I don't need to update context" | 5 turns without update = drift warning. 10 turns = stale context. |
| "I'll compact at the end" | Compaction may fire automatically. Compact when work is done. |
| "This session is too short to archive" | Short sessions still have decisions worth preserving. |
