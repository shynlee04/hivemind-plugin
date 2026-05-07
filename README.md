<div align="center">

# 🐝 HiveMind

### Runtime Composition Engine for OpenCode

**Agents' Intelligence = HIVE + MIND**

[![npm version](https://img.shields.io/npm/v/opencode-harness?color=blue)](https://www.npmjs.com/package/opencode-harness)
[![license](https://img.shields.io/npm/l/opencode-harness)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-1%2C739%20passing-brightgreen)](#testing)

*Multi-agent orchestration, session continuity, and compounding intelligence — as a TypeScript plugin for [OpenCode](https://github.com/anomalyco/opencode).*

</div>

---

## The Problem

Modern AI coding assistants are powerful but **memoryless**. Each session starts from scratch. The agent doesn't know your team's architectural decisions, which conventions you established, or which patterns failed in production. Agents are individually brilliant but collectively naive.

## The HiveMind Thesis

**Agent intelligence is not a property of the model — it is a property of the architecture surrounding the model.**

HiveMind provides two forces:

- **🏗️ The HIVE** — Structure, hierarchy, delegation protocols, domain boundaries, and guardrails that keep agents working on the right things in the right order.
- **🧠 The MIND** — Accumulated intelligence across sessions. Decisions, patterns, and lessons that compound over time instead of resetting to zero.

Together: **Intelligence that compounds.**

---

## Features

| Feature | Description |
|---------|-------------|
| **17 Custom Tools** | Zod v4 validated tools for delegation, session management, prompt enhancement, trajectory tracking |
| **10 Hook Factories** | Event observation, auto-loop orchestration, tool guards, context injection (CQRS read-side) |
| **WaiterModel Delegation** | Dispatch work to specialist agents, poll for results, dual-signal completion detection |
| **Keyed Semaphore Concurrency** | FIFO per-provider queuing with priority lanes |
| **Session Continuity** | Durable JSON persistence across restarts — sessions never start from zero |
| **PTY Integration** | Background command execution via `bun-pty` with graceful Node.js fallback |
| **Runtime Policy** | Configurable concurrency limits, tool budgets, category gates per workspace |
| **CQRS Architecture** | Tools mutate state (write-side), hooks observe events (read-side) — enforced at the boundary |
| **Schema Kernel** | 16 Zod v4 schema files for agent/command/skill validation |
| **Composable Ecosystem** | 120+ skills, agents, and commands — bring your own workflow |

---

## Quick Start

### Installation

```bash
npm install opencode-harness
```

**Requirements:** Node.js `>=20.0.0` · OpenCode `>=1.14.28` (peer dependency)

### Configuration

1. **Create a plugin loader** in your OpenCode project:

```ts
// .opencode/plugins/harness.ts
export { HarnessControlPlane as default } from "opencode-harness/plugin"
```

2. **Register the plugin** in `opencode.json`:

```json
{
  "plugins": ["./dist/plugin.js"]
}
```

3. **Start OpenCode** — HiveMind registers its tools and hooks automatically.

### CLI Tools

```bash
npx opencode-harness --help        # Show available commands
npx opencode-harness init          # Initialize .hivemind/ state directory
npx opencode-harness doctor        # Health check
```

---

## Architecture

HiveMind is architecturally split into two halves that serve fundamentally different purposes:

```
┌────────────────────────────────────────────────────────────────────┐
│                 Hard Harness (npm package: src/)                   │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  Tools (Write)   │  Hooks (Read)    │  Kernel (Shared)             │
│  CQRS mutation   │  CQRS observe    │  types, state, concurrency,  │
│  authority only  │  only — no       │  continuity, lifecycle,      │
│                  │  durable writes  │  delegation, session-api     │
├──────────────────┴──────────────────┴──────────────────────────────┤
│          Plugin Composition Root (plugin.ts — zero business logic) │
└────────────┬──────────────────────────────────────┬────────────────┘
             │                                      │
             ▼                                      ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│  Soft Meta-Concepts      │          │  Deep Module State           │
│  .opencode/              │          │  .hivemind/                  │
│  Skills, Agents,         │          │  Session continuity,         │
│  Commands, Rules         │          │  delegation records,         │
│  (user-configurable)     │          │  event journals              │
└──────────────────────────┘          └──────────────────────────────┘
```

### The Two Halves

| Half | What It Does | Where |
|------|-------------|-------|
| **Hard Harness** | Runtime engine — tools, hooks, plugin assembly, shared kernel | `src/` |
| **Soft Meta-Concepts** | User-configurable behavior — skills, agents, commands, rules | `.opencode/` |
| **Internal State** | Session journals, delegation records, runtime state | `.hivemind/` |

### Delegation Hierarchy

```
L0 Orchestrator  →  Routes intent, never implements
  └── L1 Coordinator  →  Wave-based dispatch, checkpoint gates
       └── L2 Specialist  →  Domain experts (researcher, builder, critic, reviewer)
            └── L3 Reference  →  Skills and stack references consumed by L2
```

### Design Principles

- **CQRS enforced**: `assertHookWriteBoundary()` prevents hooks from mutating state
- **Zero business logic in plugin**: Composition root is wiring only
- **No circular dependencies**: `types.ts` is leaf → max chain depth is 2
- **500 LOC module cap**: Every module stays readable and testable
- **`[Harness]` error prefix**: All thrown errors are identifiable
- **Deep-clone-on-read**: Continuity store prevents mutation aliasing

---

## The 5 Pillars

HiveMind is governed by five interlocking design principles:

1. **🏛️ Hierarchical Superiority** — Dependencies satisfied before work begins. No premature implementation.
2. **🤝 Collaborative Domains** — Bounded autonomy. Every agent has a domain, every cross-domain operation requires authorization.
3. **📊 Strategically Measurable** — Success defined before work starts, verified after it completes. Progressive trust-building.
4. **🔬 Iteratively Granular** — Break everything small enough to verify, trust, and retry. Loop until correct.
5. **🧠 Growing MEMS-BRAIN** — Intelligence compounds across sessions. Selective retrieval, not dump mining.

---

## Tools Reference

| Tool | Purpose |
|------|---------|
| `delegate-task` | Dispatch work to specialist agents (WaiterModel) |
| `delegation-status` | Poll delegation results or list all delegations |
| `run-background-command` | Execute CLI commands in PTY sessions |
| `prompt-skim` | Fast prompt scan (word count, URLs, complexity) |
| `prompt-analyze` | Deep analysis (contradictions, vagueness, clarity) |
| `session-patch` | Patch session file sections with backup |
| `session-journal-export` | Export session timeline as JSON/Markdown |
| `configure-primitive` | Configure OpenCode agents, commands, skills |
| `validate-restart` | Verify primitives are discoverable after restart |
| `hivemind-doc` | Search HiveMind documentation artifacts |
| `hivemind-trajectory` | Track execution trajectory for audit |
| `hivemind-pressure` | Runtime pressure classification |
| `hivemind-sdk-supervisor` | SDK health monitoring |
| `hivemind-command-engine` | Command execution with queue governance |
| `hivemind-agent-work-create` | Create agent work contracts |
| `hivemind-agent-work-export` | Export work contracts for audit |

---

## Testing

```bash
npm test                    # Run all tests (vitest)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

npm run typecheck           # Type-check without emitting
npm run build               # Clean + compile TypeScript to dist/
```

**Coverage thresholds enforced:** Statements 85% · Branches 72% · Functions 85% · Lines 85%

**Current:** 122 test files · 1,739 tests passing · 11 skipped (fixture-dependent integration tests that require internal state directories)

---

## Project Structure

```
src/
├── plugin.ts                  # Composition root (zero business logic)
├── index.ts                   # Public API re-exports
├── hooks/                     # Event hook factories (10 modules)
├── tools/                     # Plugin tools (17 tools)
├── lib/                       # Core library (34 modules)
│   ├── types.ts               # Shared types (leaf — no imports)
│   ├── delegation-manager.ts  # WaiterModel orchestrator (500 LOC)
│   ├── continuity.ts          # Durable JSON persistence (465 LOC)
│   ├── concurrency.ts         # Keyed semaphore (310 LOC)
│   ├── lifecycle-manager.ts   # Session state machine (243 LOC)
│   ├── completion-detector.ts # Dual-signal completion (157 LOC)
│   └── ...
├── shared/                    # Tool response envelope
├── schema-kernel/             # Zod v4 validation schemas (16 files)
└── cli/                       # CLI tools (commander-based)

tests/                         # Vitest test files (mirror src/)
docs/                          # Philosophy, architecture docs
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/shynlee04/hivemind-plugin.git
cd hivemind-plugin
npm install
npm run build
npm test
```

### Code Style

- TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- ES2022 target, NodeNext module resolution
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Max 500 LOC per module · No `any` types on new code
- `[Harness]` prefix on all thrown errors

---

## Philosophy

HiveMind is not a framework you must conform to. It is an **open architecture** — a runtime composition engine that can host GSD-style phase-gated workflows, BMAD-style constraints, or autonomous agent loops, depending on what your project needs.

It is designed for people who **explore** — who find the journey as valuable as the destination. HiveMind optimizes for **compounded learning**, ensuring every experiment makes future work better.

Read the full philosophy: [HIVEMIND-PHILOSOPHY.md](./docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md) · [Vietnamese version](./docs/draft/HIVEMIND-PHILOSOPHY-VI-2026-04-10.md)

---

## License

[MIT](./LICENSE) © 2026 Shyn Lee

---

<div align="center">

**Built with 🐝 for the OpenCode ecosystem**

[Documentation](./docs/) · [Report Bug](https://github.com/shynlee04/hivemind-plugin/issues) · [Request Feature](https://github.com/shynlee04/hivemind-plugin/issues)

</div>
