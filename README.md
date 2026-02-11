# HiveMind Context Governance

A lightweight context governance layer for [OpenCode](https://opencode.ai) that prevents drift, manages session state, and preserves memory across agent lifecycles.

**14 tools** | **4 hooks** | **5 automation levels** | **688 test assertions**

## Quick Start

```bash
# Install
npm install hivemind-context-governance

# Initialize in your project
npx hivemind init

# Check status
npx hivemind status
```

This creates a `.hivemind/` directory and registers the plugin in `opencode.json`.

## How It Works

HiveMind uses a 3-level hierarchy to track what you're working on:

```
Trajectory (Level 1) → Tactic (Level 2) → Action (Level 3)
```

Every session starts with `declare_intent`, which sets the trajectory and unlocks the session. As you work, `map_context` updates your current focus. When done, `compact_session` archives everything and resets.

The plugin fires 4 hooks automatically — injecting context into every LLM turn, tracking metrics after every tool call, enforcing governance before writes, and preserving hierarchy across context compaction.

## Governance Modes

| Mode | Behavior | Best For |
|------|----------|----------|
| **strict** | Session starts LOCKED. Warns on writes without intent. | High-compliance projects |
| **assisted** | Session starts OPEN. Guidance without blocking. | Most projects (default) |
| **permissive** | Always OPEN. Silent tracking only. | Maximum autonomy |

```bash
# Initialize with a specific mode
npx hivemind init --mode strict
npx hivemind init --mode assisted --lang vi
```

## Tools (14)

### Core (3 tools)

| Tool | When | What It Does |
|------|------|--------------|
| `declare_intent` | Starting work | Set your focus and mode. Unlocks the session. |
| `map_context` | Changing focus | Update trajectory/tactic/action hierarchy. |
| `compact_session` | Finishing work | Archive session and reset for next work. |

```typescript
declare_intent({ mode: "plan_driven", focus: "Build auth system" })
// → Session: "Build auth system". Mode: plan_driven. Status: OPEN.

map_context({ level: "tactic", content: "Implement JWT validation" })
// → [tactic] "Implement JWT validation" → active

compact_session({ summary: "Auth middleware complete" })
// → Archived. 15 turns, 4 files. 3 total archives.
```

### Self-Awareness (1 tool)

| Tool | When | What It Does |
|------|------|--------------|
| `self_rate` | Self-reflection | Rate your own performance (1-10) for drift detection. |

### Cognitive Mesh (4 tools)

| Tool | When | What It Does |
|------|------|--------------|
| `scan_hierarchy` | Quick status check | Snapshot of session state, metrics, anchors. |
| `save_anchor` | Saving immutable facts | Persist constraints that survive compaction. |
| `think_back` | Feeling lost | Deep refocus with plan review and chain analysis. |
| `check_drift` | Before completing | Verify alignment with declared trajectory. |

### Mems Brain (3 tools)

| Tool | When | What It Does |
|------|------|--------------|
| `save_mem` | Saving a lesson | Store decisions, patterns, errors to persistent memory. |
| `list_shelves` | Browsing memories | See what's in the Mems Brain by shelf. |
| `recall_mems` | Searching memories | Search past decisions and patterns by keyword. |

### Hierarchy Ops (2 tools)

| Tool | When | What It Does |
|------|------|--------------|
| `hierarchy_prune` | Cleaning up | Remove completed branches from the tree. |
| `hierarchy_migrate` | Upgrading | Migrate flat hierarchy to navigable tree format. |

### Cycle Intelligence (1 tool)

| Tool | When | What It Does |
|------|------|--------------|
| `export_cycle` | After subagent returns | Capture subagent results into hierarchy + mems. |

## Hooks (4)

| Hook | Event | Purpose |
|------|-------|---------|
| `experimental.chat.system.transform` | Every LLM turn | Injects `<hivemind>` context into system prompt |
| `tool.execute.before` | Before tool calls | Governance enforcement (warns on writes without intent) |
| `tool.execute.after` | After tool calls | Tracks metrics, violations, drift detection |
| `experimental.session.compacting` | Context compaction | Preserves hierarchy across LLM context boundaries |

> **Note:** In OpenCode v1.1+, `tool.execute.before` cannot block execution. HiveMind provides governance through warnings and tracking only.

## Configuration

Configuration is stored in `.hivemind/config.json` and re-read from disk on every hook invocation (Rule 6: config persistence).

```json
{
  "governance_mode": "assisted",
  "max_turns_before_warning": 5,
  "auto_compact_on_turns": 15,
  "stale_session_days": 3,
  "commit_suggestion_threshold": 3,
  "max_active_md_lines": 50,
  "language": "en"
}
```

## CLI

```bash
npx hivemind init              # Initialize HiveMind in a project
npx hivemind init --mode strict # Initialize with strict governance
npx hivemind status            # Check current state
npx hivemind help              # Show help
npx hivemind --help            # Show help
```

### Ecosystem Verification (`bin/hivemind-tools.cjs`)

```bash
node bin/hivemind-tools.cjs source-audit    # Verify all source files
node bin/hivemind-tools.cjs list-tools      # List all 14 tools
node bin/hivemind-tools.cjs list-hooks      # List all 4 hooks
node bin/hivemind-tools.cjs verify-package  # Check npm package completeness
```

## Project Structure

```
.hivemind/
├── 10-commandments.md   # Tool design reference
├── sessions/
│   ├── index.md         # Project trajectory (goals, constraints, history)
│   ├── active.md        # Current session
│   ├── manifest.json    # Session registry
│   └── archive/         # Completed sessions
├── templates/
│   └── session.md       # Session template
├── hierarchy.json       # Navigable tree hierarchy
├── brain.json           # Machine state (session, metrics, hierarchy)
├── config.json          # Governance settings
├── anchors.json         # Immutable facts
└── mems.json            # Persistent memory brain
```

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

6. Finish session
   compact_session({ summary: "Auth system foundation complete" })
```

## Test Coverage

| Component | Assertions |
|-----------|-----------|
| Schema (BrainState, Hierarchy) | 35 |
| Init + Planning FS | 30 |
| Tool Gate (governance) | 12 |
| Soft Governance (tracking) | 27 |
| Self-Rate Tool | 28 |
| Complexity Detection | 28 |
| Integration (E2E workflow) | 74 |
| Auto-Hooks Pure Functions | 39 |
| Session Export | 32 |
| Session Structure | 18 |
| Round 3 Tools (Cognitive Mesh) | 32 |
| Round 4 Mems Brain | 40 |
| Hierarchy Tree Engine | 55 |
| Detection Engine | 45 |
| Compact Purification | 34 |
| Entry Chain (E2E lifecycle) | 56 |
| Cycle Intelligence | 36 |
| **Total** | **621** |

## License

MIT

---

## Tiếng Việt

### HiveMind là gì?

HiveMind là một lớp quản lý ngữ cảnh nhẹ cho OpenCode, giúp ngăn chặn sai lệch (drift) và quản lý trạng thái phiên làm việc xuyên suốt vòng đời của agent AI.

### Bắt đầu nhanh

```bash
npm install hivemind-context-governance
npx hivemind init --lang vi
```

### Các chế độ quản lý

| Chế độ | Hành vi |
|--------|---------|
| **strict** | Phiên bắt đầu ở trạng thái KHÓA. Cảnh báo khi ghi mà chưa khai báo ý định. |
| **assisted** | Phiên bắt đầu ở trạng thái MỞ. Hướng dẫn nhưng không chặn. |
| **permissive** | Luôn MỞ. Chỉ theo dõi im lặng. |

### 14 Công cụ

- **Cốt lõi:** `declare_intent`, `map_context`, `compact_session`
- **Tự đánh giá:** `self_rate`
- **Lưới nhận thức:** `scan_hierarchy`, `save_anchor`, `think_back`, `check_drift`
- **Bộ nhớ:** `save_mem`, `list_shelves`, `recall_mems`
- **Phân cấp:** `hierarchy_prune`, `hierarchy_migrate`
- **Chu trình:** `export_cycle`

### Quy trình làm việc

1. Khai báo ý định → `declare_intent`
2. Cập nhật ngữ cảnh → `map_context`
3. Làm việc → sử dụng các công cụ nhận thức khi cần
4. Lưu bài học → `save_mem`, `save_anchor`
5. Kết thúc → `compact_session`
