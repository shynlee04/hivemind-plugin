# HiveMind Context Governance

A lightweight context governance layer for [OpenCode](https://opencode.ai) that prevents drift, manages session state, and preserves memory across agent lifecycles.

**14 tools** | **4 hooks** | **5 automation levels** | **Ink TUI dashboard** | **Interactive setup wizard**

## Quick Start

```bash
# Install
npm install hivemind-context-governance

# Interactive setup wizard (recommended)
npx hivemind-context-governance

# Or initialize with flags
npx hivemind-context-governance init --mode strict --lang vi
```

The interactive wizard guides you through:
- **Governance mode** — strict / assisted / permissive
- **Language** — English / Tiếng Việt
- **Automation level** — manual → guided → assisted → full → retard
- **Expert level** — beginner → intermediate → advanced → expert
- **Output style** — explanatory / outline / skeptical / architecture / minimal
- **Constraints** — code review, TDD enforcement

This creates a `.hivemind/` directory and registers the plugin in `opencode.json`.

### First-Run Detection

When the plugin loads in OpenCode without configuration, it automatically injects setup guidance into the system prompt — telling the agent to guide you through `npx hivemind-context-governance`.

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

## Hooks (4 + event handler)

| Hook | Event | Purpose |
|------|-------|---------|
| `experimental.chat.system.transform` | Every LLM turn | Injects `<hivemind>` context into system prompt |
| `tool.execute.before` | Before tool calls | Governance enforcement (warns on writes without intent) |
| `tool.execute.after` | After tool calls | Tracks metrics, violations, drift detection |
| `experimental.session.compacting` | Context compaction | Preserves hierarchy across LLM context boundaries |
| `event` | SDK events | Handles session.idle, session.compacted, file.edited |

> **Note:** In OpenCode v1.1+, `tool.execute.before` cannot block execution. HiveMind provides governance through warnings and tracking only.

## CLI

```bash
npx hivemind-context-governance              # Interactive setup wizard
npx hivemind-context-governance init         # Same as above
npx hivemind-context-governance init --mode strict  # Non-interactive with flags
npx hivemind-context-governance status       # Current session and governance state
npx hivemind-context-governance settings     # View current configuration
npx hivemind-context-governance dashboard    # Live TUI dashboard (requires ink + react)
npx hivemind-context-governance help         # Show all commands and options
```

### Live TUI Dashboard

```bash
# Install optional dependencies
npm install ink react

# Launch dashboard
npx hivemind-context-governance dashboard --lang vi --refresh 1
```

The Ink-based TUI dashboard shows live panels for:
- **Session** — status, mode, governance, automation level
- **Hierarchy** — navigable ASCII tree with node stats
- **Metrics** — drift score, turns, files, violations, health score
- **Escalation Alerts** — evidence-based warnings with tier (INFO/WARN/CRITICAL/DEGRADED)
- **Traceability** — timestamps, git hash, session timeline

Controls: `[q]` quit, `[l]` toggle language, `[r]` refresh.

### Ecosystem Verification (`bin/hivemind-tools.cjs`)

```bash
node bin/hivemind-tools.cjs ecosystem-check # Full truth check + semantic validation
node bin/hivemind-tools.cjs source-audit    # Verify all source files
node bin/hivemind-tools.cjs list-tools      # List all 14 tools
node bin/hivemind-tools.cjs list-hooks      # List all 4 hooks
node bin/hivemind-tools.cjs verify-package  # Check npm package completeness
```

## Configuration

Configuration is stored in `.hivemind/config.json` and re-read from disk on every hook invocation.

```json
{
  "governance_mode": "assisted",
  "language": "en",
  "automation_level": "assisted",
  "max_turns_before_warning": 5,
  "auto_compact_on_turns": 15,
  "stale_session_days": 3,
  "max_active_md_lines": 50,
  "agent_behavior": {
    "language": "en",
    "expert_level": "intermediate",
    "output_style": "explanatory",
    "constraints": {
      "require_code_review": false,
      "enforce_tdd": false,
      "max_response_tokens": 2000,
      "explain_reasoning": true,
      "be_skeptical": false
    }
  }
}
```

View settings anytime with `npx hivemind-context-governance settings`.

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

## License

MIT

---

## Tiếng Việt

### HiveMind là gì?

HiveMind là một lớp quản lý ngữ cảnh nhẹ cho OpenCode, giúp ngăn chặn sai lệch (drift) và quản lý trạng thái phiên làm việc xuyên suốt vòng đời của agent AI.

### Bắt đầu nhanh

```bash
# Cài đặt
npm install hivemind-context-governance

# Trình hướng dẫn tương tác (khuyến nghị)
npx hivemind-context-governance

# Hoặc cài đặt với flags
npx hivemind-context-governance init --lang vi --mode assisted
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

### CLI

```bash
npx hivemind-context-governance              # Trình hướng dẫn tương tác
npx hivemind-context-governance status       # Trạng thái hiện tại
npx hivemind-context-governance settings     # Xem cấu hình
npx hivemind-context-governance dashboard    # Bảng điều khiển TUI (cần ink + react)
```

### Quy trình làm việc

1. Khai báo ý định → `declare_intent`
2. Cập nhật ngữ cảnh → `map_context`
3. Làm việc → sử dụng các công cụ nhận thức khi cần
4. Lưu bài học → `save_mem`, `save_anchor`
5. Kết thúc → `compact_session`
