<!-- generated-by: gsd-doc-writer -->

# Hướng dẫn bắt đầu / Getting Started

Hivemind là một **runtime composition engine** cho OpenCode. Hướng dẫn này sẽ giúp bạn cài đặt, cấu hình, và chạy những lệnh đầu tiên.

Hivemind is a **runtime composition engine** for OpenCode. This guide helps you install, configure, and run your first commands.

---

## Yêu cầu tiên quyết / Prerequisites

| Dependency | Version | Ghi chú / Notes |
|------------|---------|----------------|
| **Node.js** | `>= 20.0.0` | ES2022 target, NodeNext module resolution |
| **OpenCode** | `>= 1.15.0` | Plugin host — peer dependency (`@opencode-ai/plugin`) |
| **npm** | `>= 10.0.0` | Bundled with Node 20 |

Verify your environment:

```bash
node --version   # Must be >= 20.0.0
npm --version    # Must be >= 10.0.0
```

> **Note:** Hivemind does not require a database, Docker, or any system-level services. It is a pure TypeScript npm package.

---

## Cài đặt / Installation

### 1. Install the package

```bash
npm install hivemind
```

This installs the package and its production dependencies. The package entrypoints are:

| Entrypoint | Import path | Mục đích / Purpose |
|------------|-------------|-------------------|
| Core API | `hivemind` | Public API — re-exports all shared modules |
| Plugin | `hivemind/plugin` | `HarnessControlPlane` — the composition root OpenCode loads |
| CLI | `hivemind/cli` | `runCli(argv, io?)` — programmatic CLI dispatch |

### 2. Add the plugin to OpenCode

Create or edit `opencode.json` in your project root:

```json
{
  "plugin": ["hivemind/plugin"]
}
```

OpenCode resolves `hivemind/plugin` via Node module resolution automatically.

<!-- VERIFY: The exact opencode.json schema may vary by OpenCode version. Consult the OpenCode documentation for the canonical format. -->

### 3. Bootstrap local state and primitives

Run the interactive initialization wizard:

```bash
npx hivemind init
```

The wizard will ask you to configure:

- **Conversation language** — `en` (English), `vi` (Vietnamese), `zh` (Chinese), or `ja` (Japanese)
- **Documents language** — language for generated artifacts
- **Working mode** — `expert-advisor` (guided, default), `hivemind-powered` (stricter orchestration), or `free-style` (lighter guardrails)
- **User expertise level** — from `clumsy-vibecoder` to `absolute-expert`
- **Delegation systems** — `native_task`, `delegate_task`, `background_delegation`
- **Primitive install scope** — `project` (default) or `global`

For non-interactive mode (CI):

```bash
npx hivemind init --yes
```

This creates the local `.hivemind/` state directory with Tier-1 structure and installs primitive symlinks (agents, skills, commands, workflows, references, templates) from the package assets.

### 4. Verify the setup

```bash
npx hivemind doctor
```

This runs 7 read-only health checks:

| Check     | Validates                                   |
|-----------|---------------------------------------------|
| structure | BOOT-02 Tier-1 directories and `.gitkeep` files |
| primitives | Expected agent/skill/command files exist in the selected scope |
| config    | `configs.schema.json` matches the canonical runtime contract |
| sdk       | `@opencode-ai/plugin` is resolvable         |
| typecheck | `npm run typecheck` passes                  |
| tests     | `npm test` passes                           |
| modules   | TypeScript source modules exist under `src/` |

Example output:

```
Hivemind Health Check
Project root: /path/to/my-project
Primitive scope: project

Check       Status  Details
structure   PASS    All BOOT-02 Tier-1 directories and .gitkeep files are present.
primitives  PASS    All expected project primitive files are present.
config      PASS    configs.json is schema-valid.
sdk         PASS    Resolved @opencode-ai/plugin at <path>
typecheck   PASS    npm run typecheck passed.
tests       PASS    npm run test passed.
modules     PASS    150 TypeScript source modules found under src/.

Verdict: ALL CHECKS PASS
```

### 5. Optional: repair broken primitives

If `doctor` reports broken or missing primitives:

```bash
npx hivemind recover
```

This idempotently restores missing or broken symlinks without modifying user files.

---

## Chạy những lệnh đầu tiên / First Commands

After the plugin is loaded and primitives are installed, OpenCode will recognize Hivemind's slash commands.

### Try `/plan`

The `/plan` command enters strategic planning mode:

```
/plan
```

The agent will interview you, research the codebase, create a structured plan in `task_plan.md`, and present it for approval.

### Try `/ultrawork`

The `/ultrawork` command activates full autonomous orchestration:

```
/ultrawork
```

The agent classifies your intent (research, implementation, review, or planning), breaks the work into phases, and executes them through controlled `delegate-task` delegation.

### Other available commands

Hivemind ships over 80 commands. Here are key categories:

| Category | Examples |
|----------|----------|
| **Planning** | `/plan`, `/hm-plan-phase`, `/hm-specifier` |
| **Execution** | `/ultrawork`, `/hm-execute`, `/hm-execute-phase` |
| **Research** | `/hm-research`, `/hm-explore`, `/hm-deep-research-synthesis-repomix` |
| **Review** | `/hm-code-review`, `/hm-audit`, `/hm-audit-fix` |
| **Configuration** | `/hf-configure`, `/hf-create`, `/hf-absorb` |
| **Health** | `/harness-doctor`, `/harness-audit`, `/hm-health` |

List all available commands in OpenCode with:

```
/hm-help
```

---

## Khái niệm chính / Key Concepts

### Agents (tác nhân)

Agents là những AI specialist được định nghĩa sẵn, mỗi agent có một vai trò cụ thể (researcher, builder, critic, conductor, v.v.). Hivemind ships 75+ agents được tổ chức theo thứ bậc L0→L1→L2→L3.

Agents are predefined AI specialists, each with a specific role (researcher, builder, critic, conductor, etc.). Hivemind ships 75+ agents organized in a L0→L1→L2→L3 hierarchy.

- **L0 Orchestrator**: Front-facing agent that converses with the user and routes tasks
- **L1 Coordinator**: Manages multi-agent waves and cross-cutting concerns
- **L2 Specialist**: Performs domain-specific work (coding, testing, documentation, security)
- **L3 Gate**: Internal quality gates (lifecycle, spec compliance, evidence truth)

### Skills (kỹ năng)

Skills là những hướng dẫn chuyên biệt mà agent tải vào để thực hiện một loại tác vụ cụ thể. Hivemind ships 30+ skills bao gồm completion-detection, multi-agent-coordination, wave-execution, iterative-loop, và quality-gate-orchestration.

Skills are specialized instructions that agents load to perform a specific type of task. Hivemind ships 30+ skills including completion-detection, multi-agent-coordination, wave-execution, iterative-loop, and quality-gate-orchestration.

### Commands (lệnh)

Commands là các lệnh gạch chéo (`/plan`, `/ultrawork`, v.v.) mà bạn gõ trong OpenCode. Mỗi command được định nghĩa trong `.opencode/commands/` với YAML frontmatter xác định agent phụ trách và chế độ thực thi.

Commands are slash commands (`/plan`, `/ultrawork`, etc.) that you type in OpenCode. Each command is defined in `.opencode/commands/` with YAML frontmatter specifying the responsible agent and execution mode.

### Tools (công cụ)

Tools là những hàm TypeScript mà agent có thể gọi trong runtime. Hivemind đăng ký 23 custom tool thông qua plugin, bao gồm `delegate-task`, `delegation-status`, `session-tracker`, `hivemind-doc`, `configure-primitive`, `bootstrap-init`, `run-background-command`, và nhiều tool khác.

Tools are TypeScript functions that agents can call at runtime. Hivemind registers 23 custom tools via the plugin, including `delegate-task`, `delegation-status`, `session-tracker`, `hivemind-doc`, `configure-primitive`, `bootstrap-init`, `run-background-command`, and more.

---

## Các bước tiếp theo / Next Steps

- **Kiến trúc hệ thống / Architecture**: Xem sơ đồ component, luồng dữ liệu, và ranh giới CQRS — đọc [Architecture Overview](../architecture/overview.md).
- **Cấu hình / Configuration**: Tìm hiểu về biến môi trường, runtime policy, và cài đặt — đọc [Configuration](../configuration/settings.md).
- **Phát triển / Development**: Thiết lập môi trường phát triển, lệnh build, code style, và convention — đọc [Development Guide](development.md).
- **Kiểm thử / Testing**: Chạy bộ test, viết test mới, và yêu cầu coverage — đọc [Testing Guide](testing.md).
- **Thử ủy quyền / Try delegation**: Gọi thử `/ultrawork` với một tác vụ đơn giản để trải nghiệm cơ chế ủy quyền đa agent (multi-agent delegation).
- **Danh sách command đầy đủ / Full command list**: Gõ `/hm-help` trong OpenCode.

---

## Troubleshooting

### `npx hivemind` command not found

Ensure the package is installed:

```bash
npm install hivemind
```

If the package is installed but the command is missing, check that `node_modules/.bin/hivemind` exists:

```bash
ls -la node_modules/.bin/hivemind
```

### `hivemind init` cannot find project root

The command looks for `package.json` or `.hivemind/` in the current directory and parent directories. Run it from your project root, or pass `--root`:

```bash
npx hivemind init --root=/path/to/your/project
```

### Plugin fails to load in OpenCode

1. Verify `opencode.json` has the correct plugin entry
2. Ensure the package is installed: `npm ls hivemind`
3. Check OpenCode's plugin loading order (`.opencode/plugins/` is loaded before `opencode.json`)

### `doctor` reports "typecheck FAIL"

Hivemind uses `verbatimModuleSyntax: true` — type-only imports must use `import type`. Run:

```bash
npm run typecheck
```

To see the exact errors.

### Environment variable errors

Copy the `.env` file (or create one) with the required API keys for MCP providers used by Hivemind agents. For the full list, see the [Configuration guide](../configuration/settings.md).

> **Security:** The `.env` file is gitignored. Never commit API keys or secrets.
