# HiveMind Context Governance

> **The operating system for AI coding sessions.**

## 🇻🇳 Bản phát hành v2.8 ưu tiên thị trường Việt Nam

HiveMind là plugin [OpenCode](https://opencode.ai) giúp AI agent không bị trôi ngữ cảnh, không quên quyết định kiến trúc, và không mất trạng thái khi session kéo dài. Trọng tâm v2.8: onboarding rõ ràng, governance chặt, và triển khai thực chiến cho team Việt Nam trước.

> Note: this README is being aligned to the current revamp runtime. The authoritative product model is `docs/architecture/2026-03-16-hivemind-master-model.md`. If examples below mention older workflow names such as `declare_intent`, `map_context`, `scan_hierarchy`, or `save_mem`, or older subsystem labels such as `FileGuard` or `Mems Brain`, treat them as legacy vocabulary rather than the current runtime contract.

### 10 kịch bản demo ấn tượng để ra mắt
1. `SaaS 0→1 cho người không biết code`: menu hỏi đáp + auto-lane để ra PRD có thể triển khai.
2. `Giải cứu prompt hỗn loạn của team enterprise`: bóc tách yêu cầu, ambiguity map, risk register.
3. `War-room production incident`: ép agent đi theo checklist bằng chứng trước khi kết luận fix.
4. `TDD autopilot`: agent chuyển tự động từ `spec -> build -> validate` với gate kiểm thử.
5. `MCP-first research sprint`: phối hợp Context7/DeepWiki/Tavily/Exa/Repomix và chấm điểm confidence.
6. `Brownfield modernization`: quét codebase cũ, lập workflow refactor theo từng lane và checkpoint.
7. `Cross-domain planning`: cùng một khung cho dev + marketing + finance + office-ops.
8. `Subagent swarm governance`: giao việc song song nhưng vẫn giữ được trace, export, và hồi cứu.
9. `Bilingual coaching mode`: đầu ra EN/VI cùng cấu trúc, hỗ trợ onboarding team đa vai trò.
10. `No-command recovery`: người dùng nói tự nhiên, hệ thống tự realign sang lệnh phù hợp và xin quyền bước tiếp theo.

### English Snapshot

HiveMind is an [OpenCode](https://opencode.ai) plugin that prevents AI agents from drifting, forgetting, and losing coherence during long coding sessions. It enforces one backbone: *declare what you're doing, track as you go, archive when done*.

```
Plugin runtime · command bundles · CLI entry surfaces · project skills · EN/VI docs
```

[![npm version](https://img.shields.io/npm/v/hivemind-context-governance)](https://www.npmjs.com/package/hivemind-context-governance)

**Found this useful?** [![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-orange?logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/shynlee04l)

---

## The Problem

Without governance, long AI sessions decay:

| Problem | What Happens | HiveMind's Solution |
|---------|-------------|---------------------|
| **Drift** | Agent changes focus without checkpointing | Drift detection + escalating warnings |
| **Amnesia** | Context compaction erases *why* decisions were made | Hierarchy + anchors survive compaction |
| **Blind spots** | Agent writes code without reading first | FileGuard tracks write-before-read |
| **Lost subagent work** | Task results vanish into the void | `export_cycle` captures into hierarchy + mems |
| **Session restart chaos** | New session starts from zero | Mems Brain persists across sessions |
| **No accountability** | No record of what was planned vs. what happened | Full session archive with metrics |

---

 ## Quick Start

### One Command - That's It

```bash
npx hivemind-context-governance init --mode assisted
```

**What happens (guaranteed):**
1. Downloads from npm automatically (no manual install needed)
2. Creates `.hivemind/` directory with brain.json, config.json
3. Registers plugin in `opencode.json` (so OpenCode auto-loads it)
4. Syncs commands/skills into `.opencode/`
5. Creates session template files
6. Opens a session in `OPEN` mode (assisted) or `LOCKED` mode (strict)

**Works on any machine, any project. No exceptions.**

### Verify Installation (Optional)

The wizard walks you through step by step:

```
◆  Welcome to HiveMind Context Governance!

◆  Select governance mode:
│  ○ strict    — Session starts LOCKED. Must declare intent before writes.
│  ● assisted  — Session starts OPEN. Guidance without blocking. (recommended)
│  ○ permissive — Always OPEN. Silent tracking only.

◆  Select language:
│  ● English
│  ○ Tiếng Việt

◆  Select automation level:
│  ○ manual   — No automation, you control everything
│  ○ guided   — Suggestions only
│  ● assisted — Balanced automation (recommended)
│  ○ full     — Maximum automation
│  ○ coach    — Maximum handholding, skeptical of everything

◆  Configuration saved! .hivemind/ created.
```

### Non-Interactive Alternative

```bash
npx hivemind-context-governance init --mode strict --lang vi --automation full
```

This does **exactly the same** as the interactive wizard:
- Creates `.hivemind/` structure
- Registers plugin in `opencode.json` 
- Syncs OpenCode assets
- Initializes brain state with your chosen settings

### Verify Installation

After running `init`, verify everything is set up:

```bash
npx hivemind-context-governance status
```

Or manually check `opencode.json` contains:
```json
{
  "plugin": ["hivemind-context-governance"]
}
```

### Open OpenCode

That's it. The plugin auto-activates. The AI agent gets governance context injected into every turn.

**Important:** If you run `init` again on an existing project, it will:
- Keep your existing `.hivemind/` state
- Refresh OpenCode assets
- Ensure plugin is still registered in `opencode.json`

**How it works:**
- `init` automatically registers `hivemind-context-governance` in `opencode.json`'s `plugin` array
- OpenCode reads this on startup and auto-loads the plugin
- If you manually edit `opencode.json`, make sure `plugin` is an array containing `"hivemind-context-governance"`

---

## How It Works

### The Backbone

Every HiveMind session follows one pattern:

```
declare_intent → map_context → [work] → compact_session
```

This creates a 3-level hierarchy:

```
Trajectory (Level 1) — "Build authentication system"
  └─ Tactic (Level 2) — "Implement JWT validation"
       └─ Action (Level 3) — "Write middleware tests"
```

### Under the Hood

HiveMind fires **6 hooks automatically** on every turn:

| Hook | When | What It Does |
|------|------|-------------|
| `experimental.chat.system.transform` | Every LLM turn | Injects `<hivemind>` block with hierarchy, drift, warnings |
| `experimental.chat.messages.transform` | Before LLM response | Injects stop-checklist and continuity context (`<anchor-context>`, `<focus>`) |
| `tool.execute.before` | Before any tool | Governance gate — warns on writes without intent |
| `tool.execute.after` | After any tool | Tracks metrics, detects violations, captures cycles |
| `session.compacting` | On context compaction | Preserves hierarchy + metrics across compaction |
| `event` | On session events | Reacts to idle/file edits/compaction and persists `todo.updated` into task manifest |

### Data Flow

```
                  ┌──────────────┐
                  │  brain.json  │ ← Session state, metrics, counters
                  └──────┬───────┘
                         │
   ┌─────────────────────┼─────────────────────┐
   │                     │                     │
   ▼                     ▼                     ▼
┌──────────┐    ┌────────────────┐    ┌─────────────┐
│hierarchy │    │  sessions/     │    │  mems.json  │
│  .json   │    │  manifest.json │    │  (memory)   │
│  (tree)  │    │  archive/      │    │             │
└──────────┘    └────────────────┘    └─────────────┘
```

---

## Governance Modes

| Mode | Session Start | Write Protection | Drift Warnings | Best For |
|------|-------------|-----------------|----------------|----------|
| **strict** | LOCKED | Must `declare_intent` first | Strong escalation | High-compliance, regulated projects |
| **assisted** | OPEN | Warnings on blind writes | Balanced guidance | Most projects *(default)* |
| **permissive** | OPEN | Silent tracking only | Minimal | Expert users who want freedom |

### Automation Levels

| Level | Behavior |
|-------|---------|
| `manual` | No automation — you control everything |
| `guided` | Suggestions only, never auto-acts |
| `assisted` | Balanced automation *(default)* |
| `full` | Maximum automation, minimal prompting |
| `coach` | Maximum handholding — strict governance, skeptical output, strongest discipline |

---

## Runtime Surfaces

This branch currently exposes its dependable runtime through plugin hooks, agent-callable tools, control-plane commands, and shipped command assets. The master model and current `src/` tree are the authority when README wording falls behind.

### Agent-callable tools

The current source-backed tool set is:

| Tool | Purpose |
|------|---------|
| `hivemind_runtime_status` | Inspect runtime attachment, workflow state, and available command surfaces |
| `hivemind_runtime_command` | Run canonical `hm-*` control-plane and workflow bundles through the runtime bridge |
| `hivemind_task` | Create, inspect, activate, verify, and complete workflow tasks |
| `hivemind_trajectory` | Attach, checkpoint, traverse, and close trajectory state |
| `hivemind_handoff` | Create, validate, update, and close delegation handoff artifacts |

### Plugin hooks and command surfaces

- Plugin hooks drive runtime attachment, prompt transformation, command context, permission handling, and compaction context.
- Control-plane commands handle bootstrap, repair, harness, and settings via `hm-init`, `hm-doctor`, `hm-harness`, and `hm-settings`.
- Workflow command bundles such as `hm-plan`, `hm-research`, `hm-implement`, `hm-tdd`, and `hm-verify` remain source-backed command assets, not standalone runtime engines.

### Legacy vocabulary in older sections

Some sections below still describe older governance-oriented tool names and session verbs. Until the full README rewrite lands, use `docs/architecture/2026-03-16-hivemind-master-model.md` and current source under `src/` as the canonical runtime truth.

### Core Lifecycle (legacy vocabulary)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `declare_intent` | *"I want to start working"* | Sets focus + mode, unlocks session |
| `map_context` | *"I'm switching focus"* | Updates hierarchy, resets drift |
| `compact_session` | *"I'm done, archive this"* | Archives session, preserves memory |

```typescript
// Start working
declare_intent({ mode: "plan_driven", focus: "Build auth system" })
// → Session: "Build auth system". Mode: plan_driven. Status: OPEN.

// Switch focus
map_context({ level: "tactic", content: "Implement JWT validation" })
// → [tactic] "Implement JWT validation" → active

// Done
compact_session({ summary: "Auth middleware complete" })
// → Archived. 15 turns, 4 files. Session reset.
```

### Awareness & Correction (2 tools)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `scan_hierarchy` | *"Quick status check"* | Shows session state, metrics, anchors |
| `think_back` | *"I feel lost"* | Deep refocus with plan review + chain analysis |

### Persistent Memory (2 tools)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `save_mem` | *"This is worth remembering"* | Store decisions/patterns to persistent memory |
| `recall_mems` | *"I've seen this before"* | Search or list Mems Brain by keyword/shelf |

### Immutable Facts (1 tool)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `save_anchor` | *"This must not be forgotten"* | Persist constraints that survive compaction + chaos |

### Hierarchy Tree (1 tool)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `hierarchy_manage` | *"Clean up or migrate the tree"* | Unified `prune` and `migrate` operations |

### Delegation Intelligence (1 tool)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `export_cycle` | *"Subagent returned — capture it"* | Saves subagent results to hierarchy + mems |

---

## Slash Commands (legacy snapshot)

Older README snapshots describe three project-facing slash commands here. The current repo ships a larger command asset set under `commands/`, including both `hm-*` workflow/control-plane bundles and `hivemind-*` helper commands.

| Command | Purpose |
|---------|---------|
| `/hivemind-scan` | Brownfield reconnaissance — analyze, recommend, orchestrate baseline context |
| `/hivemind-status` | Full governance status — session, hierarchy, metrics, mems, config |
| `/hivemind-compact` | Guided session archival with pre-compact checklist |

`/hivemind-scan` runs a practical sequence with `scan_hierarchy` actions:
1. `action: "analyze"` — detect framework mode (`gsd/spec-kit/both/none`) + BMAD signals
2. `action: "recommend"` — generate remediation runbook
3. `action: "orchestrate"` — persist non-destructive baseline anchors + memory

---

## Skills (legacy snapshot)

Older README snapshots describe a smaller governance skill set here. The current package ships project skills under `skills/`, and the registry in `skills/registry.yaml` is the best source of truth for active root skills.

| Skill | Purpose |
|-------|---------|
| `hivemind-governance` | Bootstrap gate — loaded every turn, activates discipline |
| `session-lifecycle` | Teaches declare → update → archive workflow |
| `evidence-discipline` | Prove claims with output before concluding |
| `context-integrity` | Detect drift, repair state, survive compaction |
| `delegation-intelligence` | Subagent patterns, parallel dispatch, export_cycle |

---

## CLI Commands

```bash
npx hivemind-context-governance             # Interactive setup wizard
npx hivemind-context-governance init        # Same (or use flags)
npx hivemind-context-governance scan        # Brownfield scan wrapper
npx hivemind-context-governance sync-assets # Sync packaged OpenCode assets to .opencode
npx hivemind-context-governance status      # Show session state
npx hivemind-context-governance settings    # Show configuration
npx hivemind-context-governance dashboard   # Launch live TUI dashboard
npx hivemind-context-governance purge       # Remove .hivemind/ entirely
npx hivemind-context-governance help        # Show help
```

### Flags

| Flag | Values | Default |
|------|--------|---------|
| `--mode` | `permissive` · `assisted` · `strict` | `assisted` |
| `--lang` | `en` · `vi` | `en` |
| `--automation` | `manual` · `guided` · `assisted` · `full` · `coach` | `assisted` |
| `--expert` | `beginner` · `intermediate` · `advanced` · `expert` | `intermediate` |
| `--style` | `explanatory` · `outline` · `skeptical` · `architecture` · `minimal` | `explanatory` |
| `--code-review` | *(flag)* | off |
| `--tdd` | *(flag)* | off |
| `--target` | `project` · `global` · `both` *(for init/sync-assets)* | `project` |
| `--overwrite` | *(flag, for sync-assets)* | off |
| `--force` | *(flag)* — removes existing .hivemind/ before re-init | off |
| `--action` | `status` · `analyze` · `recommend` · `orchestrate` *(for scan)* | `analyze` |
| `--json` | *(flag, for scan)* | off |
| `--include-drift` | *(flag, for scan status)* | off |

### OpenCode Asset Sync

HiveMind can sync packaged OpenCode assets (`commands`, `skills`, and optional ecosystem groups) into OpenCode paths.

```bash
# Default: project-local .opencode/
npx hivemind-context-governance sync-assets

# Global OpenCode config path (~/.config/opencode or platform equivalent)
npx hivemind-context-governance sync-assets --target global

# Sync both project and global targets
npx hivemind-context-governance sync-assets --target both

# Replace existing files (default behavior is no-clobber)
npx hivemind-context-governance sync-assets --overwrite
```

`init` also performs asset sync automatically. Re-running `init` on an existing project refreshes missing assets without resetting `.hivemind` state.

Public v2.8 package intentionally ships only the operational pack:
- `commands`
- `skills`
- `agents`
- `workflows`

Internal playbooks (`docs`, `templates`, `tasks`, and local dot-folders) are kept out of public release flow.

### Existing User Upgrade (No Re-init Required)

```bash
npm install hivemind-context-governance@latest
npx hivemind-context-governance sync-assets --target project
```

Use `--target both` if you want project-local and global OpenCode paths updated together.

### Brownfield Scan via CLI

```bash
# Analyze framework + stack + artifact risks
npx hivemind-context-governance scan --action analyze --json

# Generate remediation sequence
npx hivemind-context-governance scan --action recommend

# Persist safe baseline anchors + memory
npx hivemind-context-governance scan --action orchestrate --json
```

### Dashboard (Optional TUI)

The live terminal dashboard requires optional peer dependencies:

```bash
npm install ink react
npx hivemind-context-governance dashboard --refresh 1
```

Shows real-time: session state, hierarchy tree, drift score, tool call metrics, recent activity.

---

## First-Run Experience

When OpenCode loads HiveMind **before** `hivemind init` was run:

1. **Setup guidance injected** — the agent sees instructions to run the wizard
2. **Project snapshot** — auto-detects project name, tech stack (20+ frameworks), top-level dirs, artifacts
3. **First-run recon protocol** — the agent is guided to scan the repo, read docs, isolate stale context, and build a backbone *before* coding

This prevents the "agent starts coding immediately without understanding the project" failure mode.

## Brownfield Runbook (\"Please scan my project and refactor it\")

Recommended execution order:

1. Analyze:
```ts
scan_hierarchy({ action: "analyze", json: true })
```
2. Recommend:
```ts
scan_hierarchy({ action: "recommend" })
```
3. Orchestrate baseline:
```ts
scan_hierarchy({ action: "orchestrate", json: true })
```
4. Lock execution focus:
```ts
declare_intent({ mode: "exploration", focus: "Brownfield stabilization" })
map_context({ level: "tactic", content: "Context purification and framework resolution" })
map_context({ level: "action", content: "Execute safe cleanup checkpoints" })
```

This sequence ensures framework detection, context purification, baseline persistence, and drift-safe execution before large refactors.

---

## `.hivemind/` Directory Structure

```
.hivemind/
├── config.json          # Governance settings (mode, language, automation)
├── brain.json           # Session state machine (metrics, counters, hierarchy)
├── hierarchy.json       # Navigable decision tree (timestamp-based nodes)
├── anchors.json         # Immutable facts (survive everything)
├── mems.json            # Persistent memory brain (cross-session)
├── logs/                # Runtime logs
│   └── HiveMind.log
├── templates/
│   └── session.md       # Session template
└── sessions/
    ├── manifest.json    # Session registry
    ├── active.md        # Current session (legacy compat)
    ├── index.md         # Project trajectory history
    └── archive/         # Completed sessions
        └── exports/     # Export data
```

---

## Upgrade Guide

### From v2.5.x or earlier

```bash
# 1. Update
npm install hivemind-context-governance@latest

# 2. Re-initialize (preserves existing data)
npx hivemind-context-governance

# 3. Verify
npx hivemind-context-governance settings

# 4. Optional: clean re-init
npx hivemind-context-governance init --force
```

**Migration handled automatically:**
- Brain state fields backfilled via `??=` operators
- New detection counters initialized to zero
- Framework selection state added
- Deprecated `sentiment_signals` cleaned up

---

## Troubleshooting

### "Plugin not loading" or "Setup guidance keeps appearing"

**Cause:** The plugin was never registered in `opencode.json`.

**Fix:** Run the init command **once**:
```bash
npx hivemind-context-governance init --mode assisted
```

This does **all** of the following:
- Creates `.hivemind/` directory structure
- Registers plugin in `opencode.json` (so OpenCode auto-loads it)
- Syncs commands/skills into `.opencode/`
- Initializes brain state

**Important:** If you run `init` again on an existing project:
- It keeps your existing `.hivemind/` state ✅
- It refreshes OpenCode assets ✅
- It ensures plugin is still registered ✅

### Other Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Setup guidance keeps appearing | `.hivemind/config.json` missing | Run `npx hivemind-context-governance init --mode assisted` |
| Framework conflict warning | Both `.planning/` and `.spec-kit/` exist | Select one framework via locked menu |
| Dashboard won't start | Optional deps not installed | `npm install ink react` |
| Session feels stale after idle | Auto-archive rotated state | Use `scan_hierarchy` + `think_back` |
| Want fresh start | Old config causing issues | `npx hivemind-context-governance purge` then re-init |
| "Plugin already registered" message | Normal behavior on upgrade | No action needed |

---

## Development

```bash
npm run build      # Full build (clean + compile + chmod)
npm run typecheck   # TypeScript type checking
npm test           # Run all test files (700+ assertions)
npm run dev        # Watch mode
```

---

## License

MIT

---

---

# 🇻🇳 Hướng Dẫn Tiếng Việt (Chi Tiết)

> Lưu ý: phần README này đang được chỉnh lại để khớp với runtime revamp hiện tại. Nguồn sự thật của sản phẩm là `docs/architecture/2026-03-16-hivemind-master-model.md`. Nếu bên dưới còn nhắc các tên cũ như `declare_intent`, `map_context`, `scan_hierarchy`, hoặc `save_mem`, hay các nhãn hệ cũ như `FileGuard` hoặc `Mems Brain`, hãy xem đó là ngôn ngữ lịch sử chứ không phải hợp đồng runtime hiện tại.

> *Phần này không phải bản dịch — mà được viết riêng cho người dùng Việt Nam, với giải thích kỹ hơn về cách hoạt động và lý do tại sao.*

**Cảm thấy hữu ích?** [![Mời cà phê](https://img.shields.io/badge/Mời%20cà%20phê-ủng%20hộ-orange?logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/shynlee04l)

## HiveMind Là Gì?

Hãy tưởng tượng bạn thuê một lập trình viên AI rất giỏi, nhưng anh ta có một vấn đề: **mỗi 30 phút anh ta quên hết mọi thứ đang làm**.

Đó chính xác là điều xảy ra với các AI coding agent hiện tại:
- Đang làm feature A, tự nhiên nhảy sang feature B mà không checkpoint
- Sau context compaction (khi hết bộ nhớ), quên hết lý do tại sao đã quyết định kiến trúc X
- Giao việc cho subagent, nhận kết quả nhưng không tổng hợp lại
- Session mới bắt đầu từ con số 0 — không biết gì về session trước

**HiveMind giải quyết tất cả** bằng một hệ thống quản trị context đơn giản nhưng hiệu quả.

## Cách Hoạt Động (Giải Thích Dễ Hiểu)

Mỗi session làm việc với AI đều tuân theo một quy trình:

```
declare_intent → map_context → [làm việc] → compact_session
   (khai báo)     (cập nhật)     (code)      (lưu trữ)
```

### Bước 1: Khai Báo Ý Định — `declare_intent`

Trước khi bắt đầu bất kỳ công việc nào, agent phải nói rõ:
- **Đang làm gì**: "Xây dựng hệ thống xác thực"
- **Làm theo cách nào**: `plan_driven` (có kế hoạch), `quick_fix` (sửa nhanh), hoặc `exploration` (tìm hiểu)

Nếu không khai báo, ở chế độ `strict` agent sẽ bị khóa — không thể ghi file cho đến khi khai báo. Điều này đảm bảo mọi công việc đều có mục tiêu rõ ràng.

### Bước 2: Cập Nhật Ngữ Cảnh — `map_context`

Khi agent chuyển focus (ví dụ: từ "thiết kế database" sang "viết API"), nó phải gọi `map_context` để HiveMind biết. Hệ thống theo dõi 3 cấp:

| Cấp | Ý Nghĩa | Ví Dụ |
|-----|---------|-------|
| **Trajectory** | Mục tiêu lớn | "Xây dựng hệ thống thanh toán" |
| **Tactic** | Chiến thuật cụ thể | "Tích hợp Stripe API" |
| **Action** | Hành động đang làm | "Viết test cho webhook handler" |

Nếu agent làm nhiều turn mà không cập nhật, HiveMind phát hiện **drift** (trôi dạt) và cảnh báo ngay.

### Bước 3: Lưu Trữ — `compact_session`

Khi xong việc, `compact_session` sẽ:
1. Lưu toàn bộ session vào archive (có thể đọc lại)
2. Ghi tóm tắt vào lịch sử dự án
3. Reset để sẵn sàng cho session tiếp theo

**Quan trọng**: Mems Brain (bộ nhớ dài hạn) vẫn tồn tại sau compact. Những gì agent đã học được (`save_mem`) sẽ không bao giờ mất.

## Cài Đặt Từ Đầu Đến Cuối

### Một Lệnh - Xong Ngay

```bash
npx hivemind-context-governance init --mode assisted
```

**Điều gì sẽ xảy ra (đảm bảo):**
1. Tự động tải từ npm (không cần cài thủ công)
2. Tạo thư mục `.hivemind/` với brain.json, config.json
3. Đăng ký plugin trong `opencode.json` (để OpenCode tự động load)
4. Đồng bộ commands/skills vào `.opencode/`
5. Tạo các file session template
6. Mở session ở chế độ `OPEN` (assisted) hoặc `LOCKED` (strict)

**Hoạt động trên mọi máy, mọi project. Không ngoại lệ.**

### Xác Nhận Cài Đặt (Tùy Chọn)

Wizard sẽ hướng dẫn bạn từng bước:

```
◆  Welcome to HiveMind Context Governance!

◆  Select governance mode:
│  ○ strict    — Session starts LOCKED. Must declare intent before writes.
│  ● assisted  — Session starts OPEN. Guidance without blocking. (recommended)
│  ○ permissive — Always OPEN. Silent tracking only.

◆  Select language:
│  ○ English
│  ● Tiếng Việt

◆  Select automation level:
│  ○ manual   — No automation, you control everything
│  ○ guided   — Suggestions only
│  ● assisted — Balanced automation (recommended)
│  ○ full     — Maximum automation
│  ○ coach    — Maximum handholding, skeptical of everything

◆  Configuration saved! .hivemind/ created.
```

### Cài Đặt Không Tương Tác

```bash
npx hivemind-context-governance init --mode strict --lang vi --automation full
```

Lệnh này làm **đúng như** wizard tương tác:
- Tạo cấu trúc `.hivemind/`
- Đăng ký plugin trong `opencode.json`
- Đồng bộ OpenCode assets
- Khởi tạo brain state với cài đặt đã chọn

### Mở OpenCode

Xong. Plugin tự động hoạt động. AI agent sẽ nhận governance context được inject vào mỗi turn.

### Xác Nhận Cài Đặt (Tùy Chọn)

```bash
npx hivemind-context-governance status
```

Hoặc kiểm tra thủ công `opencode.json` có chứa:
```json
{
  "plugin": ["hivemind-context-governance"]
}
```

### Sử Dụng Slash Command

Gõ `/hivemind-scan` trong OpenCode để quét dự án và tạo bản đồ cơ sở trước khi bắt đầu code.

Hoặc dùng CLI trực tiếp:

```bash
npx hivemind-context-governance scan --action analyze --json
npx hivemind-context-governance scan --action recommend
npx hivemind-context-governance scan --action orchestrate --json
```

## Runbook Brownfield (Tiếng Việt)

Khi người dùng nói: *\"Hãy quét dự án và refactor\"*, chạy theo thứ tự:

1. `scan_hierarchy({ action: "analyze", json: true })`
2. `scan_hierarchy({ action: "recommend" })`
3. `scan_hierarchy({ action: "orchestrate", json: true })`
4. `declare_intent(...)` + `map_context(...)` để khóa focus trước khi sửa code

Mục tiêu:
- Phát hiện framework (`gsd/spec-kit/both/none`) và tín hiệu BMAD
- Cô lập artifact cũ/stale có nguy cơ nhiễm context
- Lưu baseline anchors + memory trước khi refactor diện rộng

## 10 Công Cụ — Giải Thích Chi Tiết

### Nhóm 1: Vòng Đời Session

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `declare_intent` | Bắt đầu làm việc | Không có ý định rõ ràng = không có cơ sở để đánh giá drift |
| `map_context` | Đổi hướng/focus | Mỗi lần đổi mà không cập nhật = context bị ô nhiễm |
| `compact_session` | Xong việc | Không compact = mất toàn bộ intelligence tích lũy |

### Nhóm 2: Nhận Thức & Sửa Lỗi

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `scan_hierarchy` | Muốn xem nhanh trạng thái | Nắm bắt tình hình trong 1 giây |
| `think_back` | Cảm thấy lạc | Hồi phục context sâu sau compaction |
| `scan_hierarchy` (`include_drift`) | Trước khi kết luận xong | Kiểm tra độ lệch hướng theo trajectory/tactic/action |

### Nhóm 3: Bộ Nhớ Dài Hạn

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `save_mem` | Học được bài học quan trọng | Quyết định, pattern, lỗi — tồn tại vĩnh viễn |
| `recall_mems` | Gặp vấn đề quen thuộc | Tìm giải pháp từ quá khứ |
| `save_anchor` | Sự thật bất biến | Port number, schema, API endpoint — không bao giờ quên |

### Nhóm 4: Quản Lý Cây & Subagent

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `hierarchy_manage` | Cây nhiều nhánh hoặc cần nâng cấp | Gộp cả prune và migrate trong một công cụ |
| `export_cycle` | Subagent vừa trả kết quả | Không export = mất intelligence từ subagent |

## Lần Đầu Mở OpenCode (Quan Trọng!)

Khi HiveMind được load nhưng chưa cấu hình:

1. **Không tự động tạo session mặc định** — tránh tình trạng config không đúng ý người dùng
2. **Quét project tự động** — phát hiện tên project, tech stack (20+ framework), cấu trúc thư mục, tài liệu
3. **Hướng dẫn recon protocol** — agent được yêu cầu:
   - Quét cấu trúc repo
   - Đọc tài liệu cốt lõi (README, AGENTS.md, package.json)
   - Phát hiện context bị "nhiễm" (plan cũ, artifact trùng lặp, framework xung đột)
   - Xây dựng backbone dự án trước khi code

**Mục tiêu**: Tránh tình trạng "vừa vào đã sửa code" khi chưa hiểu project.

## Dashboard (TUI Trực Tiếp)

Dashboard hiển thị trạng thái real-time trên terminal:

```bash
# Cài đặt phụ thuộc
npm install ink react

# Chạy dashboard
npx hivemind-context-governance dashboard --lang vi --refresh 1
```

Dashboard hiển thị:
- Trạng thái session (ID, mode, locked/open)
- Cây hierarchy (trajectory → tactic → action)
- Điểm drift và sức khỏe session
- Số lượt gọi tool và tỷ lệ thành công
- Hoạt động gần nhất

## Nâng Cấp Từ Bản Cũ

```bash
# 1. Cập nhật
npm install hivemind-context-governance@latest

# 2. Chạy lại wizard (dữ liệu cũ được giữ nguyên)
npx hivemind-context-governance

# 3. Kiểm tra
npx hivemind-context-governance settings

# 4. Nếu cần reset hoàn toàn
npx hivemind-context-governance init --force
```

## Gợi Ý Vận Hành Tốt Nhất

1. **Luôn bắt đầu bằng `declare_intent`** — Đây là "chìa khóa" mở session
2. **Gọi `map_context` khi đổi hướng** — Giữ điểm drift cao, agent không bị lạc
3. **Dùng `save_mem` cho bài học quan trọng** — Intelligence tích lũy qua nhiều session
4. **Gọi `export_cycle` sau subagent** — Đừng để kết quả subagent biến mất
5. **Kết thúc bằng `compact_session`** — Lưu trữ có cấu trúc, session sau vào lại không bị "reset trí nhớ"
6. **Dùng `/hivemind-scan` khi mới vào project** — Hiểu project trước khi code

## Về Tác Giả

HiveMind được xây dựng bởi [shynlee04](https://github.com/shynlee04) — một lập trình viên đã quá mệt mỏi với việc AI agent quên mất đang làm gì giữa chừng phiên code. Sau quá nhiều lần tự hỏi "khoan đã, tại sao mình lại quyết định kiến trúc này nhỉ?", ý tưởng về một hệ thống quản trị context đã ra đời.

Khi không bận xây dựng công cụ để AI "trung thực" hơn, mình thường làm việc với full-stack applications, mày mò developer tooling, và ủng hộ phong cách phát triển có sự hỗ trợ của AI mà thực sự hiệu quả.

**Cảm thấy hữu ích?** [Mời mình ly cà phê ☕](https://buymeacoffee.com/shynlee04l) — nó tiếp thêm năng lượng cho những đêm code muộn để tạo ra những công cụ như thế này.

---

> *Nếu bạn coi HiveMind như "bộ điều phối context" thay vì "một bộ tool phụ", chất lượng session sẽ khác biệt rõ rệt.*

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              OpenCode Runtime                    │
│  ┌──────────────────────────────────────────┐   │
│  │     HiveMind Plugin (src/index.ts)       │   │
│  │                                          │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │  Hooks  │ │  Tools   │ │  Events  │ │   │
│  │  │  (6)    │ │  (10)    │ │  handler │ │   │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ │   │
│  │       │           │            │        │   │
│  │       ▼           ▼            ▼        │   │
│  │  ┌─────────────────────────────────┐    │   │
│  │  │        src/lib/ (Core)          │    │   │
│  │  │  persistence · detection ·      │    │   │
│  │  │  hierarchy-tree · planning-fs · │    │   │
│  │  │  mems · anchors · staleness     │    │   │
│  │  └──────────────┬──────────────────┘    │   │
│  │                 │                       │   │
│  │                 ▼                       │   │
│  │         .hivemind/ (Disk)               │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Skills (5) · Commands (3) · CLI         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Architecture boundary**: `src/lib/` never imports `@opencode-ai/plugin` (platform-portable). Only `src/hooks/` touches the SDK.

---

## About

HiveMind is built by [shynlee04](https://github.com/shynlee04), a developer who got tired of AI agents forgetting what they were doing halfway through coding sessions. After one too many "wait, why did we decide this architecture again?" moments, the idea for a context governance system was born.

When not building tools to keep AI honest, you'll find me working on full-stack applications, tinkering with developer tooling, and advocating for AI-assisted development that actually works.

**Found this useful?** [Buy me a coffee ☕](https://buymeacoffee.com/shynlee04l) — it fuels the late-night coding sessions that make tools like this possible.

---

*Built for developers who believe AI agents should be accountable, not just capable.*
