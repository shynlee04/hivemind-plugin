# HiveMind Context Governance

> **The operating system for AI coding sessions.**

HiveMind is an [OpenCode](https://opencode.ai) plugin that prevents AI agents from drifting, forgetting, and losing coherence during long coding sessions. It enforces a simple backbone — *declare what you're doing, track as you go, archive when done* — and connects every piece into one unified system.

```
14 tools · 5 hooks · 5 skills · 3 slash commands · interactive CLI · Ink TUI dashboard · EN/VI
```

[![npm version](https://img.shields.io/npm/v/hivemind-context-governance)](https://www.npmjs.com/package/hivemind-context-governance)

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

### 1. Install

```bash
npm install hivemind-context-governance
```

### 2. Initialize (Interactive Wizard)

```bash
npx hivemind-context-governance
```

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
│  ○ retard   — Maximum handholding, skeptical of everything

◆  Configuration saved! .hivemind/ created.
```

### 3. Non-Interactive Alternative

```bash
npx hivemind-context-governance init --mode strict --lang vi --automation full
```

### 4. Open OpenCode

That's it. The plugin auto-activates. The AI agent gets governance context injected into every turn.

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

HiveMind fires **5 hooks automatically** on every turn:

| Hook | When | What It Does |
|------|------|-------------|
| `system.transform` | Every LLM turn | Injects `<hivemind>` block with hierarchy, drift, warnings |
| `tool.execute.before` | Before any tool | Governance gate — warns on writes without intent |
| `tool.execute.after` | After any tool | Tracks metrics, detects violations, captures cycles |
| `session.compacting` | On context compaction | Preserves hierarchy + metrics across compaction |
| `event` | On session events | Reacts to idle, file edits, compaction events |

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
| `retard` | Maximum handholding — strict governance, skeptical output, strongest discipline |

---

## Tools Reference (14)

### Core Lifecycle (3 tools)

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

### Awareness & Correction (4 tools)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `scan_hierarchy` | *"Quick status check"* | Shows session state, metrics, anchors |
| `think_back` | *"I feel lost"* | Deep refocus with plan review + chain analysis |
| `check_drift` | *"Am I still on track?"* | Verifies alignment with trajectory |
| `self_rate` | *"How am I doing?"* | Rate performance 1-10 for drift detection |

### Persistent Memory (3 tools)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `save_mem` | *"This is worth remembering"* | Store decisions/patterns to persistent memory |
| `list_shelves` | *"What do I know?"* | Browse Mems Brain by shelf |
| `recall_mems` | *"I've seen this before"* | Search past decisions by keyword |

### Immutable Facts (1 tool)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `save_anchor` | *"This must not be forgotten"* | Persist constraints that survive compaction + chaos |

### Hierarchy Tree (2 tools)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `hierarchy_prune` | *"Clean up finished work"* | Remove completed branches from tree |
| `hierarchy_migrate` | *"Upgrade the tree"* | Migrate flat hierarchy → navigable tree |

### Delegation Intelligence (1 tool)

| Tool | Agent Thought | What It Does |
|------|--------------|-------------|
| `export_cycle` | *"Subagent returned — capture it"* | Saves subagent results to hierarchy + mems |

---

## Slash Commands (Shipped)

HiveMind ships 3 OpenCode slash commands that work immediately after install:

| Command | Purpose |
|---------|---------|
| `/hivemind-scan` | Project reconnaissance — scans structure, detects stack, identifies stale artifacts |
| `/hivemind-status` | Full governance status — session, hierarchy, metrics, mems, config |
| `/hivemind-compact` | Guided session archival with pre-compact checklist |

---

## Skills (5 Behavioral Governance Skills)

Skills teach the agent *how* to use governance effectively:

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
| `--automation` | `manual` · `guided` · `assisted` · `full` · `retard` | `assisted` |
| `--expert` | `beginner` · `intermediate` · `advanced` · `expert` | `intermediate` |
| `--style` | `explanatory` · `outline` · `skeptical` · `architecture` · `minimal` | `explanatory` |
| `--code-review` | *(flag)* | off |
| `--tdd` | *(flag)* | off |
| `--force` | *(flag)* — removes existing .hivemind/ before re-init | off |

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

| Symptom | Cause | Fix |
|---------|-------|-----|
| Setup guidance keeps appearing | `.hivemind/config.json` missing | Run `npx hivemind-context-governance` |
| Framework conflict warning | Both `.planning/` and `.spec-kit/` exist | Select one framework via locked menu |
| Dashboard won't start | Optional deps not installed | `npm install ink react` |
| Session feels stale after idle | Auto-archive rotated state | Use `scan_hierarchy` + `think_back` |
| Want fresh start | Old config causing issues | `npx hivemind-context-governance purge` then re-init |

---

## Development

```bash
npm run build      # Full build (clean + compile + chmod)
npm run typecheck   # TypeScript type checking
npm test           # Run all 41 test files (705+ assertions)
npm run dev        # Watch mode
```

---

## License

MIT

---

---

# 🇻🇳 Hướng Dẫn Tiếng Việt (Chi Tiết)

> *Phần này không phải bản dịch — mà được viết riêng cho người dùng Việt Nam, với giải thích kỹ hơn về cách hoạt động và lý do tại sao.*

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

### Bước 1: Cài Package

```bash
npm install hivemind-context-governance
```

### Bước 2: Chạy Wizard Cấu Hình

```bash
npx hivemind-context-governance
```

Wizard sẽ hỏi bạn từng bước:

1. **Chế độ quản trị**: 
   - `strict` = Nghiêm ngặt (agent phải khai báo trước khi làm bất cứ gì)
   - `assisted` = Hỗ trợ (khuyên nhủ nhưng không chặn) ← **khuyến nghị cho người mới**
   - `permissive` = Tự do (chỉ theo dõi, không can thiệp)

2. **Ngôn ngữ**: Chọn `vi` để nhận cảnh báo bằng tiếng Việt

3. **Mức tự động hóa**: Từ `manual` (tự tay) đến `retard` (giám sát tối đa)

4. **Hành vi agent**: Mức chuyên gia, phong cách output, ràng buộc

### Bước 3: Mở OpenCode

Plugin tự động hoạt động. Không cần thêm bước nào.

### Bước 4: Sử Dụng Slash Command

Gõ `/hivemind-scan` trong OpenCode để quét dự án và tạo bản đồ cơ sở trước khi bắt đầu code.

## 14 Công Cụ — Giải Thích Chi Tiết

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
| `check_drift` | Trước khi kết luận xong | Kiểm tra có đúng hướng với mục tiêu ban đầu không |
| `self_rate` | Tự đánh giá | Chấm điểm 1-10 để phát hiện vấn đề sớm |

### Nhóm 3: Bộ Nhớ Dài Hạn

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `save_mem` | Học được bài học quan trọng | Quyết định, pattern, lỗi — tồn tại vĩnh viễn |
| `list_shelves` | Muốn xem có gì trong bộ nhớ | Tổng quan kho tri thức |
| `recall_mems` | Gặp vấn đề quen thuộc | Tìm giải pháp từ quá khứ |
| `save_anchor` | Sự thật bất biến | Port number, schema, API endpoint — không bao giờ quên |

### Nhóm 4: Quản Lý Cây & Subagent

| Công Cụ | Khi Nào Dùng | Tại Sao Quan Trọng |
|---------|-------------|---------------------|
| `hierarchy_prune` | Cây quá nhiều nhánh đã xong | Giữ cây gọn gàng |
| `hierarchy_migrate` | Nâng cấp từ bản cũ | Chuyển đổi hierarchy phẳng → cây |
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
│  │  │  (5)    │ │  (14)    │ │  handler │ │   │
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

*Built for developers who believe AI agents should be accountable, not just capable.*
