# HiveMind Context Governance

A lightweight context governance layer for [OpenCode](https://opencode.ai) that prevents drift and manages session state across agent lifecycles.

**11 tools** | **4 hooks** | **3 governance modes** | **386 test assertions**

## Quick Start

```bash
# Install
npm install hivemind-context-governance

# Initialize in your project
npx hivemind init
```

This creates a `.hivemind/` directory and registers the plugin in `opencode.json`.

## How It Works

HiveMind uses a 3-level hierarchy to track what you're working on:

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

Every session starts with `declare_intent`, which sets the trajectory and unlocks the session. As you work, `map_context` updates your current focus. When done, `compact_session` archives everything and resets.

## Governance Modes

| Mode | Behavior | Best For |
|------|----------|----------|
| **strict** | Session starts LOCKED. Warns on writes without intent. | High-compliance projects |
| **assisted** | Session starts OPEN. Guidance without blocking. | Most projects (default) |
| **permissive** | Always OPEN. Silent tracking only. | Maximum autonomy |

## Tool Lifecycle

Use this guide to know which tool to call when:

| When | Tool | What It Does |
|------|------|-------------|
| Starting work | `declare_intent` | Set your focus and mode. Unlocks the session. |
| Changing focus | `map_context` | Update trajectory/tactic/action hierarchy. |
| Quick status check | `scan_hierarchy` | Snapshot of session state, metrics, anchors. |
| Feeling lost | `think_back` | Deep refocus with plan review and chain analysis. |
| Before completing | `check_drift` | Verify alignment with declared trajectory. |
| Rate yourself | `self_rate` | Self-assess performance (1-10) for drift detection. |
| Save a fact | `save_anchor` | Persist immutable constraints that survive compaction. |
| Save a lesson | `save_mem` | Store decisions, patterns, errors to Mems Brain. |
| Browse memories | `list_shelves` | See what's in the Mems Brain by shelf. |
| Search memories | `recall_mems` | Search past decisions and patterns by keyword. |
| Finishing work | `compact_session` | Archive session and reset for next work. |

## Tools Reference

### Session Lifecycle

#### `declare_intent`
Start a work session by declaring what you're working on.

```
declare_intent({ mode: "plan_driven", focus: "Build auth system" })
→ Session: "Build auth system". Mode: plan_driven. Status: OPEN.
→ Use map_context to break this into tactics and actions.
```

**Args:** `mode` (plan_driven | quick_fix | exploration), `focus` (string), `reason?` (string)

#### `map_context`
Update your current focus in the 3-level hierarchy.

```
map_context({ level: "tactic", content: "Implement JWT validation" })
→ [tactic] "Implement JWT validation" → active
→ Continue working, or use check_drift to verify alignment.
```

**Args:** `level` (trajectory | tactic | action), `content` (string), `status?` (pending | active | complete | blocked)

#### `compact_session`
Archive completed work and reset for next session.

```
compact_session({ summary: "Auth middleware complete" })
→ Archived. 15 turns, 4 files. 3 total archives.
→ Session is now LOCKED. Call declare_intent to start new work.
```

**Args:** `summary?` (string)

### Awareness Tools

#### `scan_hierarchy`
Quick snapshot of session state, hierarchy, metrics, and anchors.

#### `think_back`
Deep refocus — shows trajectory, plan progress, chain breaks, and anchors. Use when feeling lost.

#### `check_drift`
Verify your current work aligns with the declared trajectory. Shows drift score and chain integrity.

#### `self_rate`
Rate your own performance (1-10) with optional context. Helps detect drift patterns.

### Persistence Tools

#### `save_anchor`
Save immutable facts (DB schemas, port numbers, constraints) that survive session compaction. Supports upsert — updating an existing key shows the delta.

#### `save_mem`
Save decisions, patterns, errors, and solutions to the Mems Brain. Organized by shelf (decisions, errors, patterns, context). Deduplicates identical content.

#### `recall_mems`
Search the Mems Brain by keyword. Returns matching memories across all sessions.

#### `list_shelves`
Browse the Mems Brain — shows shelf counts and recent entries.

## Hooks

| Hook | Purpose |
|------|---------|
| `experimental.chat.system.transform` | Injects session context into every LLM turn |
| `tool.execute.before` | Governance enforcement (warns on writes without intent) |
| `tool.execute.after` | Tracks metrics, violations, drift detection |
| `experimental.session.compacting` | Preserves hierarchy across context compaction |

## Configuration

```bash
# Initialize with options
npx hivemind init --mode strict --lang vi
```

Configuration stored in `.hivemind/config.json`.

## Project Structure

```
.hivemind/
├── sessions/
│   ├── index.md         # Project trajectory
│   ├── active.md        # Current session
│   └── archive/         # Completed sessions
├── brain.json           # Machine state
├── config.json          # Settings
├── anchors.json         # Immutable facts
└── mems.json            # Mems Brain
```

## License

MIT
