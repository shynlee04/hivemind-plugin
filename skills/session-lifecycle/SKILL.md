---
name: session-lifecycle
description: HiveMind session lifecycle management — declare_intent, map_context, compact_session. Use when starting, updating, or closing work sessions.
---

# Session Lifecycle Skill

Manage your work session context with HiveMind's 3-level hierarchy.

## When to Use

- **Starting work** → `declare_intent`
- **Changing focus** → `map_context`
- **Finishing work** → `compact_session`

## The 3-Level Hierarchy

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

- **Trajectory**: Project-level goals, milestones, direction
- **Tactic**: Session-level approach, implementation strategy
- **Action**: Specific task being worked on right now

## Quick Reference

### declare_intent — Start Your Session

```typescript
declare_intent({
  mode: "plan_driven" | "quick_fix" | "exploration",
  focus: "What you're working on (1 sentence)",
  reason?: "Optional: why this mode?"
})
```

**Examples:**

```typescript
// Feature implementation
declare_intent({
  mode: "plan_driven",
  focus: "Implement user authentication system"
})

// Quick bug fix
declare_intent({
  mode: "quick_fix",
  focus: "Fix login redirect bug",
  reason: "Production issue, needs immediate fix"
})

// Exploration
declare_intent({
  mode: "exploration",
  focus: "Research caching strategies",
  reason: "Evaluating options before implementation"
})
```

### map_context — Update Your Focus

```typescript
map_context({
  level: "trajectory" | "tactic" | "action",
  content: "The new focus (1-2 sentences)",
  status?: "pending" | "active" | "complete" | "blocked"
})
```

**Examples:**

```typescript
// Update trajectory
trajectory
map_context({
  level: "trajectory",
  content: "Build OAuth2 + JWT authentication",
  status: "active"
})

// Update tactic
map_context({
  level: "tactic",
  content: "Set up Passport.js with JWT strategy",
  status: "active"
})

// Update action
map_context({
  level: "action",
  content: "Install passport-jwt package",
  status: "active"
})

// Mark complete
map_context({
  level: "action",
  content: "Install passport-jwt package",
  status: "complete"
})
```

### compact_session — Archive and Reset

```typescript
compact_session({
  summary?: "Optional 1-line summary of what was accomplished"
})
```

**Examples:**

```typescript
// Archive with summary
compact_session({
  summary: "Completed auth middleware with JWT validation"
})

// Archive without summary (auto-generated)
compact_session({})
```

## Typical Workflow

```
1. Start session
   declare_intent({ mode: "plan_driven", focus: "Build auth system" })

2. Set trajectory
   map_context({ level: "trajectory", content: "OAuth2 + JWT architecture" })

3. Work on tactic
   map_context({ level: "tactic", content: "Set up Passport.js" })

4. Specific actions
   map_context({ level: "action", content: "Install passport-jwt" })
   [do work...]
   map_context({ level: "action", content: "Install passport-jwt", status: "complete" })
   
   map_context({ level: "action", content: "Configure JWT strategy" })
   [do work...]
   map_context({ level: "action", content: "Configure JWT strategy", status: "complete" })

5. Finish session
   compact_session({ summary: "Auth system foundation complete" })
```

## Drift Management

HiveMind tracks session health with a **drift score** (0-100):

- **100**: Fresh context, just updated
- **< 50**: Drift warning triggered
- **Reset**: Call `map_context` to reset drift

**When drift warnings appear:**
- You've made many tool calls without updating context
- Call `map_context` to signal re-engagement
- Updates reset turn count and boost drift score

## Governance Modes

Your session behavior depends on the governance mode:

| Mode | Behavior |
|------|----------|
| **strict** | Must call `declare_intent` before writes. Warns without active session (cannot block — OpenCode v1.1+ limitation). |
| **assisted** | Session starts OPEN. Warnings logged but not blocking. |
| **permissive** | Session always OPEN. Silent tracking only. |

## Best Practices

1. **Always start with `declare_intent`** — Sets trajectory and unlocks session
2. **Use `map_context` when switching focus** — Keeps drift score healthy
3. **Call `compact_session` when done** — Archives work, resets for next session
4. **Check `active.md` if confused** — Current focus is always there
5. **Update hierarchy when it feels useful** — Don't overthink it

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SESSION LOCKED" warning | Call `declare_intent` first |
| High drift warning | Call `map_context` to reset |
| No session data | Run `hivemind init` |
| Lost context | Check `.hivemind/sessions/active.md` |

## Files to Know

- `.hivemind/sessions/active.md` — Current session (read this)
- `.hivemind/sessions/index.md` — Project trajectory (read this)
- `.hivemind/brain.json` — Machine state (don't edit)
- `.hivemind/sessions/archive/` — Session history
