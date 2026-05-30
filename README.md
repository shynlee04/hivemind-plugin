<!-- generated-by: gsd-doc-writer -->

<div align="center">

# 🐝 HiveMind

### Runtime Composition Engine for OpenCode

**Agents' Intelligence = HIVE + MIND**

[![npm version](https://img.shields.io/npm/v/hivemind?color=blue)](https://www.npmjs.com/package/hivemind)
[![license](https://img.shields.io/npm/l/hivemind)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-2%2C961%20passing-brightgreen)](#testing)

*Multi-agent orchestration, session continuity, and compounding intelligence — as a TypeScript plugin for [OpenCode](https://github.com/anomalyco/opencode).*

</div>

---

## Table of Contents

- [English](#english)
  - [The Problem](#the-problem)
  - [The HiveMind Thesis](#the-hivemind-thesis)
  - [The 5 Pillars](#the-5-pillars)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Architecture](#architecture)
  - [Key Features](#key-features)
  - [CLI Reference](#cli-reference)
  - [Testing](#testing)
  - [What HiveMind Is NOT](#what-hivemind-is-not)
  - [Contributing](#contributing)
  - [License](#license)
- [Tiếng Việt](#tiếng-việt)

---

## English

### The Problem

Modern AI coding assistants are powerful but **memoryless**. Each session starts from scratch. The agent does not know your team's architectural decisions, which conventions you established, or which patterns failed in production. Agents are individually brilliant but collectively naive.

### The HiveMind Thesis

**Agent intelligence is not a property of the model — it is a property of the architecture surrounding the model.**

HiveMind provides two forces:

- **🏗️ The HIVE** — Structure, hierarchy, delegation protocols, domain boundaries, and guardrails that keep agents working on the right things in the right order.
- **🧠 The MIND** — Accumulated intelligence across sessions. Decisions, patterns, and lessons that compound over time instead of resetting to zero.

Together: **Intelligence that compounds.**

### The 5 Pillars

HiveMind is governed by five interlocking design principles that enforce correct behavior through architecture rather than convention:

#### 1. 🏛️ Hierarchical Superiority

**Dependencies satisfied before work begins.** Every task, delegation, and artifact must have its parent dependencies resolved before child actions are attempted. This prevents premature implementation — the most common source of failure in complex systems. In practice: `types.ts` is a leaf module with zero imports; `plugin.ts` is the composition root that imports everything; no circular dependencies are possible.

#### 2. 🤝 Collaborative Domains

**Bounded autonomy with explicit authorization.** Every agent operates within a defined domain boundary with permission profiles. Delegation flows through explicit channels with return contracts. Cross-domain operations require authorization. Agents report not just completion, but findings — feeding the collective intelligence.

#### 3. 📊 Strategically Measurable

**Success defined before work starts, verified after it completes.** Every task has defined success criteria with programmatic verification. HiveMind uses incremental guardrails rather than monolithic gates: each phase transition requires evidence before proceeding, building confidence progressively.

#### 4. 🔬 Iteratively Granular

**Break everything small enough to verify, trust, and retry.** Modules are capped at 500 LOC. Functions use chain-breaking complexity. Tasks decompose through a chain: intent → spec → plan → implement → verify → integrate. Each step produces artifacts consumed by the next, and each step's output is verified before proceeding.

#### 5. 🧠 Growing MEMS-BRAIN

**Intelligence compounds across sessions.** Knowledge is decomposed into MEMS (Micro-Electro-Mechanical knowledge pieces) — small, specialized knowledge fragments that can be retrieved and synthesized as needed. The MEMS-BRAIN uses selective retrieval rather than dump mining: agents ask precise questions and receive synthesized answers, not raw transcripts.

Read the full philosophy: [HIVEMIND-PHILOSOPHY.md](./docs/philosophy/HIVEMIND-PHILOSOPHY.md)

---

### Installation

```bash
npm install hivemind
```

**Requirements:**

| Runtime | Version |
|---------|---------|
| Node.js | `>= 20.0.0` |
| OpenCode | `>= 1.15.0` (peer dependency) |
| TypeScript | `>= 5.0.0` (dev dependency) |

---

### Quick Start

#### 1. Create a plugin loader

```ts
// .opencode/plugins/harness.ts
export { HarnessControlPlane as default } from "hivemind/plugin"
```

The [`HarnessControlPlane`](./src/plugin.ts) is the composition root that wires **23 custom tools** and **10+ hook factories** into OpenCode. It contains zero business logic — only assembly.

#### 2. Register the plugin

```json
{
  "plugins": [".opencode/plugins/harness.ts"]
}
```

#### 3. Start OpenCode

HiveMind registers all its tools and hooks automatically on plugin load. The plugin logs `"[Harness] Hivemind plugin loaded — registering 23 custom tools"` at startup.

#### 4. Try the CLI

```bash
npx hivemind --help        # Show available commands
npx hivemind init          # Initialize .hivemind/ state directory
npx hivemind doctor        # Health check and diagnostics
```

---

### Architecture

HiveMind is split into three distinct layers that serve fundamentally different purposes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Hard Harness (npm package: src/)                      │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│  Tools (Write)   │  Hooks (Read)    │  Kernel (Shared)                  │
│  CQRS mutation   │  CQRS observe    │  types, state, concurrency,       │
│  authority only  │  only — no       │  continuity, lifecycle,           │
│                  │  durable writes  │  delegation, session-api          │
├──────────────────┴──────────────────┴───────────────────────────────────┤
│          Plugin Composition Root (plugin.ts — zero business logic)      │
└────────────────────────┬─────────────────────────────────┬──────────────┘
                         │                                 │
                         ▼                                 ▼
┌────────────────────────────┐         ┌──────────────────────────────────┐
│  Soft Meta-Concepts        │         │  Deep Module State               │
│  .opencode/                │         │  .hivemind/                      │
│  Skills, Agents,           │         │  Session continuity,             │
│  Commands, Rules,          │         │  delegation records,             │
│  Permissions, Custom Tools │         │  event journals, trajectory      │
│  (user-configurable)       │         │  (runtime state — never in src/) │
└────────────────────────────┘         └──────────────────────────────────┘
```

#### The Two Halves

| Layer | What It Does | Location | Persistence |
|-------|-------------|----------|-------------|
| **Hard Harness** | Runtime engine — tools, hooks, shared kernel, plugin assembly | `src/` | npm package (`hivemind`) |
| **Soft Meta-Concepts** | User-configurable behavior — skills, agents, commands, rules, permissions | `.opencode/` | Version-controlled with project |
| **Internal State** | Session journals, delegation records, trajectory, runtime state | `.hivemind/` | Durable JSON files |

#### Delegation Hierarchy

```
L0 Orchestrator  →  Routes intent, never implements
  └── L1 Coordinator  →  Wave-based dispatch, checkpoint gates
       └── L2 Specialist  →  Domain experts (researcher, builder, critic, reviewer)
            └── L3 Reference  →  Skills and stack references consumed by L2
```

#### Design Principles

- **CQRS enforced**: Tools mutate state (write-side), hooks observe events (read-side) — `assertHookWriteBoundary()` prevents mutation in hooks
- **Zero business logic in plugin**: Composition root is wiring only
- **No circular dependencies**: `types.ts` is leaf → max chain depth is 2
- **500 LOC module cap**: Every module stays readable and testable
- **`[Harness]` error prefix**: All thrown errors are identifiable
- **Deep-clone-on-read**: Continuity store prevents mutation aliasing

---

### Key Features

#### 🚀 WaiterModel Delegation

Dispatch work to specialist agents and poll for results. Uses dual-signal completion detection (doer + verifier must agree) to prevent premature completion claims. Manages 20+ delegation modules including coordinator, dispatcher, lifecycle, monitor, retry handler, and notification router.

Key delegation modules: [`manager.ts`](./src/coordination/delegation/manager.ts), [`coordinator.ts`](./src/coordination/delegation/coordinator.ts), [`lifecycle.ts`](./src/coordination/delegation/lifecycle.ts), [`dispatcher.ts`](./src/coordination/delegation/dispatcher.ts), [`monitor.ts`](./src/coordination/delegation/monitor.ts)

#### 💾 Session Continuity

Durable JSON persistence across restarts — sessions never start from zero. Dual-layer model:
- **Durable JSON store** (`continuity/index.ts`): Source of truth for long-term state
- **In-Memory Maps** (`state.ts`): Fast read/write for current session state, flushed to durable store at checkpoints

#### 📊 Trajectory Tracking

Every delegation, tool call, and state transition is recorded in the trajectory ledger. Enables full auditability: "how did this task reach this state?" is answered by reading the trajectory, not by guessing.

#### ⚖️ Runtime Pressure

Classification system that detects runtime pressure (tier 0-9) and routes to appropriate control-plane outcomes. Pure control-plane detection prevents false positives.

#### 🔧 23 Custom Tools

| Domain | Tools | Count |
|--------|-------|-------|
| **Delegation** | `delegate-task`, `delegation-status`, `run-background-command` | 3 |
| **Session** | `execute-slash-command`, `session-patch`, `session-journal-export`, `session-tracker`, `session-hierarchy`, `session-context`, `create-governance-session` | 7 |
| **Hivemind** | `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export` | 8 |
| **Config** | `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`, `prompt-skim`, `prompt-analyze` | 6 |

All tools are validated with Zod v4 schemas and registered via domain-specific registration functions in `plugin.ts` (`registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools`).

#### 🧩 Composable Primitives

HiveMind ships with a full ecosystem of configurable meta-concepts:
- **19 commands**: `start-work`, `plan`, `deep-init`, `harness-doctor`, `ultrawork`, and more
- **89+ agents**: L0 orchestrators, L1 coordinators, L2 specialists, GSD tooling
- **100+ skills**: Domain expertise for research, debugging, delegation, auditing, and workflow execution
- **34 non-GSD skills**: Composable meta-builder skills for agent/command/skill authoring

#### 🔄 PTY Integration

Background command execution via `bun-pty` with graceful Node.js fallback to `node:child_process`. Recovery of PTY delegations surfaces `terminalKind: "non-resumable-after-restart"` because OS PTY processes do not survive parent restart.

#### 🧵 Keyed Semaphore Concurrency

FIFO per-provider queuing with priority lanes and slot management. Prevents overload while maximizing throughput. Managed by [`SlotManager`](./src/coordination/delegation/slot-manager.ts).

---

### CLI Reference

```bash
npx hivemind --help        # Show help
npx hivemind init          # Initialize state directory
npx hivemind doctor        # Run health checks
```

CLI entry point: `bin/hivemind.cjs`

---

### Testing

```bash
npm test                    # Run all tests (vitest) — 2,961 passing
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report (src/**/*.ts)
npm run typecheck           # Type-check without emitting
```

**Test suite:** 245 test files · 2,961 tests passing · 2 skipped (fixture-dependent integration tests)

---

### What HiveMind Is NOT

#### Not a Corporate-Spec-Driven Framework

Frameworks like **GSD** (Get Shit Done) and **BMAD** impose structured procedures that must be followed in sequence. HiveMind does not impose these procedures — it provides the **infrastructure** for any procedure, including GSD or BMAD if that is what your team needs. It is a **platform for composing agentic workflows**, not a workflow in a box.

If your team needs phase gates, you can implement them with HiveMind's hooks and tools. If your team needs to skip phases for rapid prototyping, you can do that too.

#### Not the All-In-SOTA Harness

**Oh-My-OpenAgents (OMO)** aims to provide fully autonomous agentic coding from intent to deployment with minimal human intervention. HiveMind is **collaborative** by default — it assumes humans and agents work together, that humans provide intent and verify outcomes, and that agents provide execution and pattern recognition. Full autonomy is available as an option (through task queuing and auto-loop features), but not the default mode.

#### Not a Framework for Nerds

HiveMind does not require deep expertise in agentic systems, prompt engineering, or any specific technology stack. It is designed to be **approachable** — to meet users at their current level of expertise and help them grow. Every task, no matter how complex, can be decomposed into steps small enough for a non-expert to understand and verify.

Read the full distinction: [What HiveMind Is NOT](./docs/philosophy/HIVEMIND-PHILOSOPHY.md#5-what-hivemind-is-not)

---

### Project Structure

```
src/
├── plugin.ts                  # Composition root (zero business logic)
├── index.ts                   # Public API re-exports
├── coordination/              # Delegation, completion, concurrency, spawner
│   └── delegation/            # 20 modules (manager, coordinator, lifecycle, etc.)
├── task-management/           # Continuity, journal, trajectory, lifecycle
│   └── continuity/            # Durable JSON store (3 modules)
├── hooks/                     # Lifecycle, guards, observers, transforms (10+ factories)
├── tools/                     # 23 custom tools (4 domain groups)
├── shared/                    # Leaf utilities, types, state, session-api
├── features/                  # Bootstrap, PTY, doc intelligence, pressure, contracts
├── config/                    # Config subscriber, compiler, workflow
├── routing/                   # Session entry, behavioral profile, command engine
└── schema-kernel/             # Zod v4 validation schemas

tests/                         # 245 test files mirroring src/
docs/                          # Philosophy, architecture, proposals
bin/                           # hivemind CLI (hivemind.cjs)
```

---

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### License

[MIT](./LICENSE) © 2026 HiveMind Contributors

---

## Tiếng Việt

### HiveMind Là Gì?

HiveMind là một **hệ thống điều phối AI agent** — không phải một công cụ đơn lẻ, mà là một "khung vận hành" giống như hệ điều hành cho máy tính, nhưng dành cho các đội ngũ agent AI trong OpenCode.

Cốt lõi của HiveMind là sự kết hợp giữa **HIVE** và **MIND**:

- **🐝 HIVE** là kết cấu — cách tổ chức công việc, cách phân quyền, cách đảm bảo mọi thứ được kiểm soát mà không cần giám sát liên tục.
- **🧠 MIND** là trí nhớ tích lũy — hệ thống này không bao giờ "quên" những gì đã học được. Mỗi phiên làm việc đều đóng góp vào kho kiến thức chung.

### Vấn Đề

Các hệ thống AI coding hiện tại rất mạnh nhưng **không có trí nhớ**. Mỗi phiên làm việc bắt đầu từ con số không. Agent không nhớ quyết định kiến trúc nào đã được đưa ra, pattern nào đã thất bại, hay convention nào đã được thiết lập. Kết quả: những sai lầm lặp đi lặp lại.

### Luận Đề Cốt Lõi

> **Trí tuệ của agent không nằm ở model — mà nằm ở kiến trúc xung quanh model.**

Một agent đơn lẻ không thể giữ toàn bộ ngữ cảnh của dự án qua nhiều phiên. Nhưng một **hệ thống phân cấp agent** với ranh giới rõ ràng và bộ nhớ dùng chung có thể xây dựng tiếp công việc thay vì bắt đầu lại.

### Năm Trụ Cột (5 Pillars)

1. **🏛️ Hierarchical Superiority** — Phụ thuộc được giải quyết trước khi công việc bắt đầu. Module con không thể hoàn thành trước khi interface được định nghĩa.
2. **🤝 Collaborative Domains** — Mỗi agent có ranh giới trách nhiệm rõ ràng. Ủy quyền có kiểm soát với hợp đồng hoàn trả.
3. **📊 Strategically Measurable** — Tiêu chí thành công được định nghĩa trước, kiểm tra sau. Guardrails tăng dần thay vì cổng kiểm tra lớn.
4. **🔬 Iteratively Granular** — Mọi thứ được chia nhỏ đủ để kiểm tra và sửa lỗi từng phần. Module giới hạn 500 dòng.
5. **🧠 Growing MEMS-BRAIN** — Trí tuệ tích lũy qua các phiên. Kiến thức được lưu dưới dạng MEMS — những mảnh kiến thức nhỏ, chuyên biệt, có thể truy xuất chính xác.

### Cài Đặt

```bash
npm install hivemind
```

Yêu cầu: Node.js `>= 20.0.0` · OpenCode `>= 1.15.0`

### Bắt Đầu Nhanh

**1. Tạo file plugin loader:**

```ts
// .opencode/plugins/harness.ts
export { HarnessControlPlane as default } from "hivemind/plugin"
```

**2. Đăng ký plugin trong `opencode.json`:**

```json
{
  "plugins": [".opencode/plugins/harness.ts"]
}
```

**3. Khởi động OpenCode** — HiveMind tự động đăng ký tất cả tools và hooks.

**4. Dùng CLI:**

```bash
npx hivemind --help        # Xem danh sách lệnh
npx hivemind init          # Khởi tạo thư mục trạng thái .hivemind/
npx hivemind doctor        # Kiểm tra sức khỏe hệ thống
```

### Kiến Trúc

HiveMind được chia thành ba tầng riêng biệt:

| Tầng | Chức Năng | Vị Trí |
|------|-----------|--------|
| **Hard Harness** | Động cơ runtime — tools, hooks, shared kernel | `src/` (npm package) |
| **Soft Meta-Concepts** | Hành vi do người dùng cấu hình — skills, agents, commands | `.opencode/` |
| **Internal State** | Trạng thái phiên, bản ghi ủy quyền, dữ liệu runtime | `.hivemind/` |

### Tính Năng Chính

| Tính năng | Mô tả |
|-----------|-------|
| **WaiterModel Delegation** | Giao việc cho agent chuyên gia, kiểm tra kết quả, phát hiện hoàn thành kép (doer + verifier) |
| **Session Continuity** | Lưu trữ JSON bền vững — phiên làm việc không bao giờ bắt đầu từ số không |
| **Trajectory Tracking** | Ghi lại mọi hành động để truy xuất và kiểm toán |
| **Runtime Pressure** | Phân loại áp lực runtime để đưa ra quyết định kiểm soát |
| **23 Custom Tools** | Tools cho delegation, session, config, prompt, và hivemind |
| **PTY Integration** | Thực thi lệnh nền qua `bun-pty` với fallback Node.js |
| **CQRS Architecture** | Tools = write-side, Hooks = read-side — enforced at the boundary |

### Kiểm Thử

```bash
npm test                    # Chạy toàn bộ 2.961 bài kiểm tra
npm run test:watch          # Chế độ theo dõi
npm run test:coverage       # Báo cáo độ phủ mã nguồn
```

**Bộ kiểm tra:** 245 file · 2.961 bài kiểm tra đạt · 2 bỏ qua

### HiveMind Không Phải Là Gì?

- **Không phải GSD hay BMAD** — HiveMind không áp đặt quy trình cứng nhắc. Nó cung cấp **cơ sở hạ tầng** cho bất kỳ quy trình nào, bao gồm GSD và BMAD nếu bạn muốn.
- **Không phải OMO** — HiveMind mặc định là **cộng tác**: con người và agent làm việc cùng nhau. Tự động hóa hoàn toàn là tùy chọn, không phải mặc định.
- **Không chỉ dành cho chuyên gia** — HiveMind được thiết kế để tiếp cận được với mọi cấp độ người dùng.

Đọc thêm: [HIVEMIND-PHILOSOPHY-VI.md](./docs/philosophy/HIVEMIND-PHILOSOPHY-VI.md)

### Giấy Phép

[MIT](./LICENSE) © 2026 HiveMind Contributors

---

<div align="center">

**Built with 🐝 for the OpenCode ecosystem**

[Documentation](./docs/) · [Report Bug](https://github.com/shynlee04/hivemind-plugin/issues) · [Request Feature](https://github.com/shynlee04/hivemind-plugin/issues)

</div>
