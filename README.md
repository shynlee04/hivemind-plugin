# HiveMind Context Governance

> **The operating system for AI coding sessions.**

## 🇻🇳 Bản phát hành v2.8 ưu tiên thị trường Việt Nam

HiveMind là plugin [OpenCode](https://opencode.ai) giúp AI agent không bị trôi ngữ cảnh, không quên quyết định kiến trúc, và không mất trạng thái khi session kéo dài. Trọng tâm v2.8: onboarding rõ ràng, governance chặt, và triển khai thực chiến cho team Việt Nam trước.

> Note: this README describes the current revamp runtime. The authoritative product model is `docs/architecture/2026-03-16-hivemind-master-model.md`, and current source under `src/` wins when wording drifts.

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
| **Lost subagent work** | Task results vanish into the void | Handoff packets and trajectory continuity preserve delegated work |
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

After running `init`, verify the runtime attachment and mirrored surfaces:

```bash
npx hivemind-context-governance harness --json
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

HiveMind currently works as a plugin-native runtime layer for OpenCode. Instead of exposing the old session-verb toolset, this branch centers work around runtime attachment, command routing, workflow state, trajectory continuity, delegation handoffs, and read-only document intelligence.

### Runtime flow

1. Bootstrap or repair the project runtime with `hm-init`, `hm-doctor`, `hm-harness`, or `hm-settings`.
2. Let the plugin attach runtime context through hooks for prompt transformation, permission handling, and compaction continuity.
3. Use source-backed tools to inspect docs, manage workflow tasks, checkpoint trajectory state, and create delegation handoffs.
4. Run workflow bundles such as `hm-plan`, `hm-research`, `hm-implement`, `hm-tdd`, and `hm-verify` through the runtime bridge when a command path is appropriate.

### Runtime layers

| Layer | Current responsibility |
|------|------------------------|
| Plugin hooks | Attach runtime context, transform prompts, inject command context, gate tool use, preserve compaction continuity |
| Runtime tools | Expose `hivemind_doc`, `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`, and `hivemind_handoff` |
| Control-plane commands | Handle bootstrap, repair, harness readiness, and settings through `hm-init`, `hm-doctor`, `hm-harness`, and `hm-settings` |
| Workflow bundles | Provide plan, research, implementation, TDD, course-correction, and verification command assets |
| Project state | Persist runtime data under `.hivemind/` for continuity, checkpoints, and repair |

### Data surfaces

```
OpenCode runtime
  -> plugin hooks
  -> runtime tools and command bridge
  -> core workflow / trajectory / delegation state
  -> .hivemind/ runtime artifacts
```

---

## Governance Modes

| Mode | Session Start | Write Protection | Drift Warnings | Best For |
|------|-------------|-----------------|----------------|----------|
| **strict** | Highest governance pressure | Strongest preflight and recovery posture | Strong escalation | High-compliance, regulated projects |
| **assisted** | Balanced startup guidance | Runtime warns before risky actions | Balanced guidance | Most projects *(default)* |
| **permissive** | Lightest intervention | Minimal blocking beyond runtime invariants | Minimal | Expert users who want freedom |

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
| `hivemind_doc` | Read-only markdown document intelligence: skim outlines, read sections, chunk large docs, and search project artifacts |
| `hivemind_runtime_status` | Inspect runtime attachment, workflow state, and available command surfaces |
| `hivemind_runtime_command` | Run canonical `hm-*` control-plane and workflow bundles through the runtime bridge |
| `hivemind_task` | Create, inspect, activate, verify, and complete workflow tasks |
| `hivemind_trajectory` | Attach, checkpoint, traverse, and close trajectory state |
| `hivemind_handoff` | Create, validate, update, and close delegation handoff artifacts |

### Plugin hooks and command surfaces

- Plugin hooks drive runtime attachment, prompt transformation, command context, permission handling, and compaction context.
- Control-plane commands handle bootstrap, repair, harness, and settings via `hm-init`, `hm-doctor`, `hm-harness`, and `hm-settings`.
- Workflow command bundles such as `hm-plan`, `hm-research`, `hm-implement`, `hm-tdd`, and `hm-verify` remain source-backed command assets, not standalone runtime engines.

### What is live today

Use these current surfaces instead of the removed legacy verb tools:

| Surface | Use it for |
|---------|------------|
| `hivemind_doc` | Read-only markdown intelligence for skimming, section reads, chunking, and search |
| `hivemind_runtime_status` | Inspect runtime attachment and available command surfaces |
| `hivemind_runtime_command` | Route canonical `hm-*` commands through the runtime bridge |
| `hivemind_task` | Create, inspect, activate, verify, and complete workflow tasks |
| `hivemind_trajectory` | Attach sessions to trajectories, checkpoint progress, and record continuity events |
| `hivemind_handoff` | Create and manage delegation packets for resumable sub-session work |

---

## Command Assets

The package ships command assets under `commands/` in two main families:

- `hm-*` commands for bootstrap, runtime recovery, planning, research, implementation, TDD, course-correction, and verification.
- `hivemind-*` helper commands for scan, status, compact, delegation, clarify, and related operational guidance.

Treat command files as source-owned UX assets. If a command implies deterministic runtime behavior, the source of truth is the current runtime path in `src/control-plane/`, `src/commands/`, and `src/plugin/opencode-plugin.ts`.

---

## Skills

HiveMind ships project skills under `skills/`. The active registry in `skills/registry.yaml` is the source of truth for what is packaged, while the master model defines how those skills should support evidence-first, continuity-safe work.

The most important skill themes in the current runtime are:

- governance bootstrap and continuity discipline
- evidence-first verification
- context integrity and compaction safety
- delegation and handoff patterns
- workflow-specific operating guidance

---

## CLI Commands

```bash
npx hivemind-context-governance             # Interactive setup wizard
npx hivemind-context-governance init        # Bootstrap runtime entry surfaces
npx hivemind-context-governance doctor      # Repair runtime entry and recovery spine
npx hivemind-context-governance harness     # Validate runtime attachment and server health
npx hivemind-context-governance settings    # Persist runtime attachment defaults
npx hivemind-context-governance help        # Show help
```

### Flags

| Flag | Values | Default |
|------|--------|---------|
| `--mode` | `permissive` · `assisted` · `strict` | `assisted` |
| `--lang` | `en` · `vi` | `en` |
| `--automation` | `manual` · `guided` · `assisted` · `full` · `coach` | `assisted` |
| `--expert-level` | `beginner` · `intermediate` · `advanced` · `expert` | `intermediate` |
| `--output-style` | `explanatory` · `outline` · `skeptical` · `architecture` · `minimal` | `explanatory` |
| `--preset` | `guided-onboarding` | none |
| `--project-root` | absolute or relative path | current directory |
| `--server-url` | OpenCode server URL *(for harness)* | runtime default |
| `--session-id` | session identifier *(for doctor/settings)* | generated |
| `--json` | *(flag)* print structured output | off |
| `--force` | *(flag)* — removes existing `.hivemind/` before re-init | off |

### Runtime Surface Sync

The revamp branch does not ship a public `sync-assets` CLI. Instead, runtime mirroring happens through the live control-plane commands.

- `init` bootstraps `.hivemind/`, registers the plugin, and mirrors command and agent assets into `.opencode/`.
- `harness` re-checks runtime health and refreshes those mirrored surfaces before reporting readiness.
- `doctor` repairs damaged runtime state and returns the next safe command.

Public v2.8 package intentionally ships only the operational pack:
- `commands`
- `skills`
- `agents`
- `workflows`

Internal playbooks (`docs`, `templates`, `tasks`, and local dot-folders) are kept out of public release flow.

### Existing User Upgrade (No Re-init Required)

```bash
npm install hivemind-context-governance@latest
npx hivemind-context-governance harness --json
```

If the runtime is healthy, `harness` confirms the current attachment and mirrored surfaces. If it is not, it points you to `hm-init` or `hm-doctor`.

### Brownfield Scan via CLI

This revamp branch does not ship the older public `scan` or `dashboard` CLIs. For brownfield work, use the current runtime path instead:

```bash
npx hivemind-context-governance init --mode assisted
npx hivemind-context-governance harness --json
```

Then, inside OpenCode, inspect runtime context with `hivemind_runtime_status` and `hivemind_doc`, and route work through `hm-plan`, `hm-research`, `hm-implement`, and `hm-verify`.

---

## First-Run Experience

When OpenCode loads HiveMind **before** `hivemind init` was run:

1. **Setup guidance injected** — the agent sees instructions to run the wizard
2. **Project snapshot** — auto-detects project name, tech stack (20+ frameworks), top-level dirs, artifacts
3. **First-run recon protocol** — the agent is guided to inspect the repo, read docs, isolate stale context, and build a backbone *before* coding

This prevents the "agent starts coding immediately without understanding the project" failure mode.

## Brownfield Runbook ("Please scan my project and refactor it")

Recommended execution order:

1. Bootstrap and inspect runtime readiness:
```bash
npx hivemind-context-governance init --mode assisted
npx hivemind-context-governance harness --json
```
2. In OpenCode, inspect the runtime and project artifacts:
```text
hivemind_runtime_status + hivemind_doc
```
3. Route the work through the current workflow commands:
```text
hm-plan -> hm-research -> hm-implement -> hm-verify
```

This sequence keeps brownfield work on the current runtime path instead of the removed legacy session verbs.

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

# 3. Verify runtime readiness
npx hivemind-context-governance harness --json

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
| Session feels stale after idle | Runtime context is out of date or the branch needs re-attachment | Run `hm-harness`, then inspect `hivemind_runtime_status` |
| Want fresh start | Old config causing issues | Remove `.hivemind/` manually, then run `npx hivemind-context-governance init --mode assisted` |
| "Plugin already registered" message | Normal behavior on upgrade | No action needed |

---

## Development

```bash
npm run build      # Full build (clean + compile + chmod)
npm run typecheck   # TypeScript type checking
npm test           # Run all test files
npm run dev        # Watch mode
```

---

## License

MIT

---

---

# 🇻🇳 Hướng Dẫn Tiếng Việt (Chi Tiết)

> Lưu ý: tài liệu này mô tả runtime revamp hiện tại. Nguồn sự thật của sản phẩm là `docs/architecture/2026-03-16-hivemind-master-model.md` cùng các surface đang sống trong `src/`.

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

HiveMind hiện tại hoạt động như một lớp runtime cho OpenCode, không còn xoay quanh bộ tool verb cũ. Thay vào đó, plugin gắn ngữ cảnh vào prompt, định tuyến command, giữ continuity qua workflow và trajectory, và cung cấp một bề mặt doc-intel chỉ-đọc cho markdown.

### Luồng runtime hiện tại

1. Khởi tạo hoặc sửa runtime bằng `hm-init`, `hm-doctor`, `hm-harness`, hoặc `hm-settings`.
2. Để plugin gắn context vào prompt, permission flow, và compaction continuity.
3. Dùng tool source-backed để đọc tài liệu, quản lý task, checkpoint trajectory, và tạo handoff.
4. Khi cần một lane rõ ràng, đi qua các command như `hm-plan`, `hm-research`, `hm-implement`, `hm-tdd`, và `hm-verify`.

### Bề mặt đang sống

| Surface | Dùng để làm gì |
|---------|----------------|
| `hivemind_doc` | Đọc markdown: skim outline, đọc section, chia chunk, và search |
| `hivemind_runtime_status` | Kiểm tra runtime attachment và command surface đang có |
| `hivemind_runtime_command` | Chạy các command `hm-*` qua runtime bridge |
| `hivemind_task` | Tạo, inspect, activate, verify, complete workflow task |
| `hivemind_trajectory` | Gắn session vào trajectory, checkpoint tiến độ, record continuity event |
| `hivemind_handoff` | Tạo và quản lý gói handoff cho sub-session |

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

Wizard cho phép bạn chọn mode, ngôn ngữ, và mức automation rồi tạo `.hivemind/`, sync asset OpenCode, và đăng ký plugin trong `opencode.json`.

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
npx hivemind-context-governance harness --json
```

Hoặc kiểm tra thủ công `opencode.json` có chứa:
```json
{
  "plugin": ["hivemind-context-governance"]
}
```

### Sử Dụng CLI / Command Surface

Dùng CLI hoặc command asset hiện tại để quét dự án và dựng baseline trước khi sửa code:

```bash
npx hivemind-context-governance init --mode assisted
npx hivemind-context-governance harness --json
```

## Runbook Brownfield (Tiếng Việt)

Khi người dùng nói: *"Hãy quét dự án và refactor"*, đi theo thứ tự hiện tại:

1. Chạy `init` và `harness` để bootstrap runtime, mirror lại asset, và kiểm tra readiness.
2. Trong OpenCode, dùng `hivemind_runtime_status` và `hivemind_doc` để đọc runtime state và artifact trước khi sửa code.
3. Chuyển sang lane công việc rõ ràng qua `hm-plan`, `hm-research`, `hm-implement`, và `hm-verify`.

Mục tiêu vẫn là hiểu repo trước, cô lập drift, và chỉ sửa code khi runtime path đã rõ.

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

## Nâng Cấp Từ Bản Cũ

```bash
# 1. Cập nhật
npm install hivemind-context-governance@latest

# 2. Chạy lại wizard (dữ liệu cũ được giữ nguyên)
npx hivemind-context-governance

# 3. Kiểm tra runtime
npx hivemind-context-governance harness --json

# 4. Nếu cần reset hoàn toàn
npx hivemind-context-governance init --force
```

## Gợi Ý Vận Hành Tốt Nhất

1. **Bootstrap trước khi sửa** — chạy `hm-init`, `hm-doctor`, hoặc `hm-harness` nếu runtime chưa sạch.
2. **Chọn đúng lane** — dùng `hm-plan`, `hm-research`, `hm-implement`, `hm-tdd`, `hm-verify` thay vì trộn ý định.
3. **Giữ source of truth thống nhất** — README, command asset, AGENTS, và `src/` phải cùng kể một câu chuyện.
4. **Dùng `hivemind_doc` để đọc artifact lớn** — tránh nhảy vào sửa code khi chưa hiểu plan hay architecture.
5. **Dùng handoff và trajectory cho continuity** — nhất là khi chia nhỏ lane hoặc giao cho subagent.

## Về Tác Giả

HiveMind được xây dựng bởi [shynlee04](https://github.com/shynlee04) — một lập trình viên đã quá mệt mỏi với việc AI agent quên mất đang làm gì giữa chừng phiên code. Sau quá nhiều lần tự hỏi "khoan đã, tại sao mình lại quyết định kiến trúc này nhỉ?", ý tưởng về một hệ thống quản trị context đã ra đời.

Khi không bận xây dựng công cụ để AI "trung thực" hơn, mình thường làm việc với full-stack applications, mày mò developer tooling, và ủng hộ phong cách phát triển có sự hỗ trợ của AI mà thực sự hiệu quả.

**Cảm thấy hữu ích?** [Mời mình ly cà phê ☕](https://buymeacoffee.com/shynlee04l) — nó tiếp thêm năng lượng cho những đêm code muộn để tạo ra những công cụ như thế này.

---

> *Nếu bạn coi HiveMind như "bộ điều phối context" thay vì "một bộ tool phụ", chất lượng session sẽ khác biệt rõ rệt.*

---

## Architecture Overview

```
OpenCode runtime
  -> plugin/opencode-plugin.ts
     -> hooks/                (prompt transform, permission, compaction, runtime loader)
     -> tools/                (doc, runtime, task, trajectory, handoff)
     -> commands/ + control-plane/
     -> core/ + delegation/ + recovery/
     -> intelligence/doc/
     -> .hivemind/ runtime artifacts
```

**Architecture boundary**: `src/plugin/` is assembly only, `src/tools/` owns write-side agent surfaces, `src/hooks/` stays read-side, and `src/intelligence/doc/` currently exposes the markdown-first read foundation.

---

## About

HiveMind is built by [shynlee04](https://github.com/shynlee04), a developer who got tired of AI agents forgetting what they were doing halfway through coding sessions. After one too many "wait, why did we decide this architecture again?" moments, the idea for a context governance system was born.

When not building tools to keep AI honest, you'll find me working on full-stack applications, tinkering with developer tooling, and advocating for AI-assisted development that actually works.

**Found this useful?** [Buy me a coffee ☕](https://buymeacoffee.com/shynlee04l) — it fuels the late-night coding sessions that make tools like this possible.

---

*Built for developers who believe AI agents should be accountable, not just capable.*
