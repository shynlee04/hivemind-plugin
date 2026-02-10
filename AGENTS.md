# AGENTS.md — HiveMind Context Governance

**Version:** 1.2.0  
**Status:** Core implementation complete. 4 tools, 3 hooks, CLI, 131 test assertions passing.

---

## What HiveMind Is

A lightweight context governance layer for OpenCode that prevents drift and manages session state. HiveMind uses a simple 3-level hierarchy:

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

**Design principles:**
- **4 tools only** — declare_intent, map_context, compact_session, self_rate
- **Configurable governance** — strict / assisted / permissive modes
- **User-driven** — no agent hierarchy, you stay in control
- **Simple state** — 3-level hierarchy with automatic drift detection
- **Soft enforcement** — warns and logs, doesn't hard-block (by design)
- **Session brain** — every session is archived and traceable across compactions

---

## The 3 Tools

### 1. `declare_intent` — Start Your Session

**When to use:** At the beginning of any work session.

**Agent thought:** *"I want to start working on something"*

```typescript
declare_intent({
  mode: "plan_driven" | "quick_fix" | "exploration",
  focus: "What you're working on (1 sentence)",
  reason?: "Optional: why this mode?"
})
```

**Examples:**
```typescript
// Starting a feature
declare_intent({
  mode: "plan_driven",
  focus: "Implement user authentication system"
})
// → Session: "Implement user authentication system". Mode: plan_driven. Status: OPEN.

// Quick bug fix
declare_intent({
  mode: "quick_fix",
  focus: "Fix login redirect bug",
  reason: "Production issue, needs immediate fix"
})
// → Session: "Fix login redirect bug". Mode: quick_fix. Status: OPEN.
```

**What it does:**
1. Unlocks the session (sets governance_status to OPEN)
2. Sets the trajectory (Level 1 of hierarchy)
3. Creates/updates `.opencode/planning/active.md`
4. Initializes brain state in `.opencode/planning/brain.json`

---

### 2. `map_context` — Update Your Focus

**When to use:** When you change what you're working on within a session.

**Agent thought:** *"I need to update what I'm focused on"*

```typescript
map_context({
  level: "trajectory" | "tactic" | "action",
  content: "The new focus (1-2 sentences)",
  status?: "pending" | "active" | "complete" | "blocked"
})
```

**Examples:**
```typescript
// Switching to implementation phase
map_context({
  level: "tactic",
  content: "Implement JWT token validation",
  status: "active"
})
// → [tactic] "Implement JWT token validation" → active

// Current action
map_context({
  level: "action",
  content: "Write auth middleware tests"
})
// → [action] "Write auth middleware tests" → active

// Marking work complete
map_context({
  level: "action",
  content: "Auth middleware implementation",
  status: "complete"
})
// → [action] "Auth middleware implementation" → complete
```

**What it does:**
1. Updates the specified hierarchy level
2. Resets turn count (signals re-engagement)
3. Syncs to planning files (index.md for trajectory, active.md for tactic/action)

**Hierarchy rules:**
- `trajectory` → updates `index.md` (project-level goals)
- `tactic` / `action` → updates `active.md` (session-level work)

---

### 3. `compact_session` — Archive and Reset

**When to use:** When you're done with your current work.

**Agent thought:** *"I'm done, archive this session"*

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
// → Archived. 15 turns, 4 files saved. 3 total archives. Session reset.

// Archive without summary (auto-generated)
compact_session({})
// → Archived. 15 turns, 4 files saved. 3 total archives. Session reset.
```

**What it does:**
1. Archives current `active.md` to `.opencode/planning/archive/`
2. Appends summary line to `index.md`
3. Resets `active.md` to template
4. Creates fresh brain state (new session, LOCKED status)

---

## Governance Modes

HiveMind has 3 modes configured at init time:

| Mode | Behavior | Use Case |
|------|----------|----------|
| **strict** | Session starts LOCKED. Must call `declare_intent` before writes. | High-compliance projects |
| **assisted** | Session starts OPEN. Warnings logged but not blocking. | Balanced guidance |
| **permissive** | Session always OPEN. Silent tracking only. | Maximum autonomy |

**Current mode is shown in:**
- System prompt injection (`<hivemind-governance>` block)
- `hivemind status` CLI output
- Brain state: `session.governance_mode`

---

## Typical Workflow

```
1. Start session
   declare_intent({ mode: "plan_driven", focus: "Build auth system" })

2. Work on high-level planning
   map_context({ level: "trajectory", content: "OAuth2 + JWT architecture" })

3. Switch to implementation
   map_context({ level: "tactic", content: "Set up Passport.js" })

4. Specific action
   map_context({ level: "action", content: "Install passport-jwt package" })
   [do the work...]

5. Mark complete, next action
   map_context({ level: "action", content: "Install passport-jwt", status: "complete" })
   map_context({ level: "action", content: "Configure JWT strategy" })
   [do the work...]

6. Finish session
   compact_session({ summary: "Auth system foundation complete" })
```

---

## Physical Architecture

```
.opencode/planning/
├── index.md          # Project trajectory (goals, constraints, history)
├── active.md         # Current session (hierarchy, notes)
├── brain.json        # Machine state (session, metrics, hierarchy)
├── config.json       # Governance settings (mode, language)
└── archive/          # Completed sessions
    └── session_2026-02-10_abc123.md
```

**Files you should read:**
- `active.md` — See current focus and session status
- `index.md` — See project trajectory and session history

**Files you should NOT edit directly:**
- `brain.json` — Managed by tools, will be overwritten
- `config.json` — Set at init, rarely changes

---

## Metrics and Drift

HiveMind tracks session health:

| Metric | Description | Good Range |
|--------|-------------|------------|
| **Turns** | Number of tool calls since last context update | Varies |
| **Drift Score** | 0-100, higher = more focused | >50 |
| **Files** | Unique files touched in session | Varies |
| **Updates** | Number of `map_context` calls | Higher = more focused |

**Drift warning triggers when:**
- Turn count > `max_turns_before_warning` (default: 5)
- Drift score < 50

**To reset drift:** Call `map_context` — this resets turn count and boosts drift score.

---

## CLI Commands

Users can run these outside OpenCode:

```bash
# Initialize HiveMind in a project
hivemind init
hivemind init --mode strict --lang vi

# Check current state
hivemind status

# Show help
hivemind help
```

---

## Integration with OpenCode

**Plugin registration** (in `opencode.json`):
```json
{
  "plugins": [".worktrees/hivemind-context-governance"]
}
```

**Hooks fire automatically:**
- `tool.execute.before` — Logs governance events
- `experimental.chat.system.transform` — Injects `<hivemind-governance>` block
- `experimental.session.compacting` — Preserves hierarchy across compaction

---

## Best Practices

1. **Always start with `declare_intent`** — Sets the trajectory and unlocks session
2. **Use `map_context` when switching focus** — Keeps drift score healthy
3. **Call `compact_session` when done** — Archives work, resets for next session
4. **Check `active.md` if confused** — Current focus is always there
5. **Don't worry about perfect hierarchy** — Update when it feels useful

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "SESSION LOCKED" warning | strict mode, no `declare_intent` | Call `declare_intent` |
| High drift warning | Too many turns without context update | Call `map_context` |
| No session data | Plugin not initialized | Run `hivemind init` |
| Can't find planning files | Wrong directory | Check `.opencode/planning/` exists |

---

---

## Test Coverage

| Component | Assertions | Status |
|-----------|-----------|--------|
| Schema (BrainState, Hierarchy) | 35 | ✅ Pass |
| Init + Planning FS | 29 | ✅ Pass |
| Tool Gate (governance) | 12 | ✅ Pass |
| Self-Rate Tool | 28 | ✅ Pass |
| Integration (E2E workflow) | 27 | ✅ Pass |
| **Total** | **131** | ✅ **All Pass** |

---

## Version History

- **1.0.0** — Core implementation: 3 tools, 3 hooks, CLI, 103 tests
- **1.2.0** — 8 bug fixes, self-rate tool (4th tool), sentiment regex, standalone packaging, 131 tests

---

*This file is the ground truth for what exists in the codebase. If you see a conflict between this file and the code, the code wins — but file an issue.*
