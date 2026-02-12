# AGENTS.md — Developer Guide & Governance

**Current Context:** You are working on the `hivemind-plugin` repository. This is an OpenCode plugin for context governance.

## 1. Build & Test Commands

### Build
- **Full Build:** `npm run build`
  - Cleans `dist/`, compiles TypeScript, makes CLI executable.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`)
- **Watch Mode:** `npm run dev`

### Test
- **Run All Tests:** `npm test`
  - Uses `tsx` test runner across `tests/**/*.test.ts`.
- **Run Single Test File:**
  ```bash
  npx tsx --test tests/path/to/test.ts
  ```
  *Example:* `npx tsx --test tests/integration.test.ts`

### Testing Pattern (Integration)
- **No external assertion library**. Tests define a local `assert` helper:
  ```typescript
  function assert(cond: boolean, name: string) {
    if (cond) {
      passed++; process.stderr.write(`  PASS: ${name}\n`);
    } else {
      failed_++; process.stderr.write(`  FAIL: ${name}\n`);
    }
  }
  ```
- **Environment Setup:** Use `fs/promises` and `os.tmpdir()` to create isolated test environments.
  ```typescript
  import { mkdtemp, rm } from "fs/promises"
  import { tmpdir } from "os"
  import { join } from "path"

  let tmpDir: string
  async function setup() {
    tmpDir = await mkdtemp(join(tmpdir(), "hm-test-"))
    return tmpDir
  }
  async function cleanup() {
    await rm(tmpDir, { recursive: true, force: true })
  }
  ```
- **Structure:** `main()` function running async test functions sequentially, catching errors and exiting with code 1 on failure.

## 2. Code Style Guidelines

### Formatting & Syntax
- **Indentation:** 2 spaces.
- **Semicolons:** Avoid (mostly).
- **Quotes:** Double quotes `"string"`.
- **Trailing Commas:** Yes, in multi-line objects/arrays.
- **Imports:**
  - Use `import type` for type-only imports.
  - **Crucial:** Local imports MUST use `.js` extension (e.g., `import { foo } from "./bar.js"`) due to `NodeNext` resolution.
  - Grouping: External packages -> Internal modules (`../src/`) -> Utils.

### Naming Conventions
- **Variables/Functions:** `camelCase` (e.g., `createLogger`, `stateManager`).
- **Types/Classes:** `PascalCase` (e.g., `HiveMindPlugin`, `BrainState`).
- **Constants:** `UPPER_CASE` (e.g., `COMMANDS`, `DEFAULT_CONFIG`).
- **Files:** `kebab-case` (e.g., `session-lifecycle.ts`, `save-mem.ts`).

### TypeScript
- **Strict Mode:** Enabled (`strict: true`).
- **Module Resolution:** `NodeNext`.
- **Error Handling:** Use `unknown` in catch blocks (e.g., `catch (err: unknown)`).
- **Explicit Returns:** Prefer explicit return types for exported functions.

### Architecture Patterns
- **CLI Output:** `console.log` is allowed *only* in `src/cli.ts`. Library code (`src/lib/`, `src/tools/`, `src/hooks/`) must use the logger injected via `createLogger`.
- **Tools:** Implemented in `src/tools/`, exporting a factory function `createXTool(dir)`.
- **Hooks:** Implemented in `src/hooks/`.
- **State:** Managed via `src/lib/persistence.ts` (`BrainState`, `Hierarchy`).

---

# HiveMind Context Governance

**Version:** 2.6.0
**Status:** Iteration 6 complete. 14 tools, 4 hooks, CLI, 5 skills, Ink TUI dashboard, 705 test assertions passing.

---

## What HiveMind Is

A lightweight context governance layer for OpenCode that prevents drift and manages session state. HiveMind uses a simple 3-level hierarchy:

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

**Design principles:**
- **4 core tools + 10 extensions** — declare_intent, map_context, compact_session, self_rate, scan_hierarchy, save_anchor, think_back, check_drift, save_mem, list_shelves, recall_mems, hierarchy_prune, hierarchy_migrate, export_cycle
- **Configurable governance** — strict / assisted / permissive modes
- **User-driven** — no agent hierarchy, you stay in control
- **Simple state** — 3-level hierarchy with automatic drift detection
- **Soft enforcement** — warns and logs, doesn't hard-block (by design)
- **Session brain** — every session is archived and traceable across compactions

---

## Tools (14 Total)

HiveMind provides 14 tools organized in 6 groups:

| Group | Tools | Purpose |
|-------|-------|---------|
| **Core** | `declare_intent`, `map_context`, `compact_session` | Session lifecycle |
| **Self-Awareness** | `self_rate` | Agent self-assessment |
| **Cognitive Mesh** | `scan_hierarchy`, `save_anchor`, `think_back`, `check_drift` | Context awareness & drift detection |
| **Mems Brain** | `save_mem`, `list_shelves`, `recall_mems` | Persistent cross-session memory |
| **Hierarchy Ops** | `hierarchy_prune`, `hierarchy_migrate` | Tree maintenance & migration |
| **Cycle Intelligence** | `export_cycle` | Capture subagent results into hierarchy + mems |

### Core Tools

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
3. Creates/updates `.hivemind/sessions/active.md`
4. Initializes brain state in `.hivemind/brain.json`

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
1. Archives current `active.md` to `.hivemind/sessions/archive/`
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
- System prompt injection (`<hivemind>` block)
- `hivemind status` CLI output
- Brain state: `session.governance_mode`

---

## Governance Approach

HiveMind provides **soft governance** through guidance and tracking.

### How It Works

1. **System Prompt Injection** - Injects governance context into every LLM turn
2. **Event Tracking** - Reacts to tool executions and session events
3. **Drift Detection** - Warns when turn count exceeds threshold
4. **Violation Tracking** - Logs when agent ignores guidance
5. **Metrics** - Tracks turn count, drift score, files touched
6. **Notifications** - Sends warnings when patterns detected

### Important: No Hard Blocking

**Plugins CANNOT block tool execution in OpenCode v1.1+:**
- `tool.execute.before` returns `Promise<void>` - can only modify `output.args`, not block execution
- No `permission.ask` hook exists for plugins to implement blocking
- Only OpenCode's own `opencode.json` permission config can block actions

**What HiveMind CANNOT do:**
- Prevent tool execution
- Force agent compliance
- Block actions based on governance mode

**What HiveMind CAN do:**
- Modify tool arguments before execution (architecturally unsupported)
- Track metrics and violations through `tool.execute.after`
- Inject system prompts and warnings
- Send notifications when patterns detected

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
.hivemind/
├── 10-commandments.md   # Tool design reference
├── sessions/
│   ├── index.md         # Project trajectory (goals, constraints, history)
│   ├── active.md        # Current session (legacy fallback)
│   ├── manifest.json    # Session registry (new)
│   └── archive/         # Completed sessions
│       └── session_2026-02-10_abc123.md
├── templates/
│   └── session.md       # Session template (new)
├── hierarchy.json       # Tree hierarchy (new — navigable, timestamp-based)
├── brain.json           # Machine state (session, metrics, hierarchy)
└── config.json          # Governance settings (mode, language)
```

**Files you should read:**
- `active.md` — See current focus and session status
- `index.md` — See project trajectory and session history
- `10-commandments.md` — Tool design principles

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

## Git Integration

HiveMind provides git hooks to enforce best practices:

### Setup

```bash
./scripts/setup-git-hooks.sh
```

This installs a pre-commit hook that:
- Warns when `brain.json` is modified (verify session state)
- Warns when `active.md` is modified (check hierarchy consistency)

### Atomic Commit Guidelines

Follow these guidelines when committing:
1. Commit tool changes with their tests together
2. Keep commits focused: one feature or bug fix per commit
3. Run `npm test` before committing if tests are affected
4. Update `CHANGELOG.md` for user-facing changes

---

## Integration with OpenCode

**Plugin registration** (in `opencode.json`):
```json
{
  "plugin": ["hivemind-context-governance"]
}
```

**Hooks fire automatically:**
- `tool.execute.before` — Governance enforcement
- `tool.execute.after` — Tracking & drift detection
- `experimental.chat.system.transform` — Injects `<hivemind>` block
- `experimental.session.compacting` — Preserves hierarchy across compaction

---

## Hook Architecture

HiveMind uses 4 hooks to provide governance:

| Hook | Purpose | Behavior |
|------|---------|----------|
| `tool.execute.before` | Governance enforcement | Warns when tools used without declared intent. Cannot block (OpenCode v1.1+ limitation). |
| `tool.execute.after` | Tracking & drift detection | Increments turn count, checks drift, detects violations. |
| `experimental.chat.system.transform` | System prompt injection | Adds governance context to every LLM turn. |
| `experimental.session.compacting` | Context preservation | Preserves hierarchy across LLM context compaction. |

### tool.execute.before (Tool Gate)

The tool gate hook enforces governance based on mode:

| Mode | Behavior |
|------|----------|
| **strict** | Logs errors when write tools used without `declare_intent`. |
| **assisted** | Warns strongly when tools used without declared intent. |
| **permissive** | Silent tracking only. No warnings or blocks. |

**Note:** In OpenCode v1.1+, `tool.execute.before` cannot block execution. The hook logs warnings/errors but tools are always allowed to execute. This is a platform limitation.

### experimental.session.compacting (Context Preservation)

The compaction hook preserves hierarchy context across LLM context compaction:

- Reads current brain state hierarchy (trajectory/tactic/action)
- Injects context into `output.context[]`
- Preserves session info, metrics, and file tracking
- Budget-capped at ~500 tokens (2000 chars)

This ensures that after LLM context compaction, the agent still knows what it was working on.

---

## Skill System — Behavioral Governance

HiveMind ships 5 skills that teach agents HOW to use the tools effectively. Modeled after the `using-superpowers` pattern — a bootstrap gate forces a checkpoint, then discipline skills provide content.

### Architecture

```
skills/
├── hivemind-governance/        ← BOOTSTRAP (loaded every turn — gate + checkpoint)
├── session-lifecycle/          ← DISCIPLINE (starting, updating, closing sessions)
├── evidence-discipline/        ← DISCIPLINE (prove, don't claim; verify before completion)
├── context-integrity/          ← DISCIPLINE (detect drift, repair state, survive compaction)
└── delegation-intelligence/    ← DISCIPLINE (parallel vs sequential, export_cycle, team patterns)
```

### Three-Force Framework

Skills balance incentives, not just punishment:

| Force | Purpose | Order |
|-------|---------|-------|
| **REWARD** | Show how tools make agent smarter (cognitive prosthetics) | First |
| **CONSEQUENCE** | Natural cost of skipping (not punishment) | Second |
| **RATIONALIZATION** | Explicit "if you think X, reality is Y" defense | Last resort |

### Activation (Two Entry Points)

1. **AGENTS.md anchor** — `<EXTREMELY-IMPORTANT>` block read by any agent tool
2. **`session-lifecycle.ts` hook** — injects skill checkpoint into `<hivemind>` block every turn

### `export_cycle` — Capture Subagent Intelligence

**When to use:** After EVERY subagent (Task) returns a result.

**Agent thought:** *"Subagent just returned — I need to capture what happened"*

```typescript
export_cycle({
  outcome: "success" | "partial" | "failure",
  findings: "What was learned or decided (1-3 sentences)"
})
```

**What the internal scripts do automatically:**
1. Updates hierarchy tree — action node → complete/blocked
2. Saves findings to mems brain — shelf `cycle-intel`, tagged with timestamp
3. Links to timestamp chain — grep-able across all artifacts
4. Clears `pending_failure_ack` flag if present

**Auto-capture hook (safety net):**
The `tool.execute.after` hook auto-captures ALL Task returns into `brain.cycle_log[]`:
- Last message (first 500 chars)
- Failure signal detection → sets `pending_failure_ack`
- Tool use count from the cycle
- This fires regardless of whether `export_cycle` is called

**Failure accountability:**
If a subagent result contains failure signals (failed, error, blocked, partially, unable), `pending_failure_ack` is set in brain state. Until the agent calls `export_cycle` or `map_context({ status: "blocked" })`, the system prompt warns every turn:
```
⚠ SUBAGENT REPORTED FAILURE. Call export_cycle or map_context with status "blocked" before proceeding.
```

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
| Can't find planning files | Wrong directory | Check `.hivemind/` exists |

---

---

## Test Coverage

| Component | Assertions | Status |
|-----------|-----------|--------|
| Schema (BrainState, Hierarchy) | 35 | ✅ Pass |
| Init + Planning FS | 30 | ✅ Pass |
| Tool Gate (governance) | 12 | ✅ Pass |
| Soft Governance (tracking) | 27 | ✅ Pass |
| Self-Rate Tool | 28 | ✅ Pass |
| Complexity Detection | 28 | ✅ Pass |
| Integration (E2E workflow) | 84 | ✅ Pass |
| Auto-Hooks Pure Functions | 39 | ✅ Pass |
| Session Export | 32 | ✅ Pass |
| Session Structure | 18 | ✅ Pass |
| Round 3 Tools (Cognitive Mesh) | 32 | ✅ Pass |
| Round 4 Mems Brain | 40 | ✅ Pass |
| Hierarchy Tree Engine | 55 | ✅ Pass |
| Detection Engine | 45 | ✅ Pass |
| Evidence Gate System | 44 | ✅ Pass |
| Compact Purification | 34 | ✅ Pass |
| Entry Chain (E2E lifecycle) | 69 | ✅ Pass |
| Cycle Intelligence (export_cycle + auto-capture) | 36 | ✅ Pass |
| **Total** | **688** | ✅ **All Pass** |

---

## Version History

- **1.0.0** — Core implementation: 3 tools, 3 hooks, CLI, 103 tests
- **1.2.0** — 8 bug fixes, self-rate tool (4th tool), sentiment regex, standalone packaging, 131 tests
- **1.4.0** — Migrated from `.opencode/planning/` to `.hivemind/` directory structure, added 10 Commandments, 132 tests
- **1.5.0** — Full architecture: Auto-hooks governance (R1), session management & auto-export (R2), cognitive mesh tools (R3), Mems Brain (R4). 11 tools, 4 hooks, 331 tests
- **1.6.0** — Integration reality check: 6 critical bugs fixed
- **2.0.0** — Integration hardening: 35 issues resolved, dead code removed, production gate cleanup. 11 tools, 4 hooks
- **2.1.0** — Hierarchy redesign: navigable tree engine, detection engine, per-session files, manifest, configurable thresholds, migration path. 13 tools, 4 hooks, 489 tests
- **2.2.0** — Iteration 1 complete: export_cycle tool (14th tool), auto-capture hook for Task returns, pending_failure_ack system, cycle_log in brain state, skill system (5 behavioral governance skills), tool activation (7 priorities), enhanced CLI (23 commands). 14 tools, 4 hooks, 5 skills, 607 tests
- **2.3.0** — Iteration 2: Entry testing + foundation hardening. JSONC config handling, re-init guard, config persistence verification, master plan file tree accuracy. 14 tools, 4 hooks, 5 skills, 621 tests
- **2.5.0** — Iteration 5: Evidence Gate System. Escalating prompt pressure (INFO→WARN→CRITICAL→DEGRADED), evidence-based argument-back with counter-excuses, "I am retard" mode (5 automation levels), write-without-read FileGuard tracking. 14 tools, 4 hooks, 5 skills, 688 test assertions
- **2.4.0** — Iteration 4: Agent behavioral activation (L7). Behavioral bootstrap in system prompt (teaches agent HiveMind workflow on first turns), AGENTS.md/CLAUDE.md auto-injection during `hivemind init` (idempotent). 14 tools, 4 hooks, 5 skills, 644 tests

---

*This file is the ground truth for what exists in the codebase. If you see a conflict between this file and the code, the code wins — but file an issue.*

<!-- HIVEMIND-GOVERNANCE-START -->

## HiveMind Context Governance

This project uses **HiveMind** for AI session management. It prevents drift, tracks decisions, and preserves memory across sessions.

### Required Workflow

1. **START** every session with:
   ```
   declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "What you're working on" })
   ```
2. **UPDATE** when switching focus:
   ```
   map_context({ level: "trajectory" | "tactic" | "action", content: "New focus" })
   ```
3. **END** when done:
   ```
   compact_session({ summary: "What was accomplished" })
   ```

### Available Tools (14)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Self-Awareness | `self_rate` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back`, `check_drift` |
| Memory | `save_mem`, `list_shelves`, `recall_mems` |
| Hierarchy | `hierarchy_prune`, `hierarchy_migrate` |
| Delegation | `export_cycle` |

### Why It Matters

- **Without `declare_intent`**: Drift detection is OFF, work is untracked
- **Without `map_context`**: Context degrades every turn, warnings pile up
- **Without `compact_session`**: Intelligence lost on session end
- **`save_mem` + `recall_mems`**: Persistent memory across sessions — decisions survive

### State Files

- `.hivemind/brain.json` — Machine state (do not edit manually)
- `.hivemind/hierarchy.json` — Decision tree
- `.hivemind/sessions/` — Session files and archives

<!-- HIVEMIND-GOVERNANCE-END -->
