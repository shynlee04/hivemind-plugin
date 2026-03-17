# Technology Stack

**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Researched:** 2026-03-17
**Domain:** OpenCode-native AI coding governance plugin/CLI with runtime orchestration, agent tooling, and terminal UI
**Overall recommendation:** Keep the product `Node + TypeScript + OpenCode SDK/plugin` at its core, standardize all contracts on `Zod 4`, move testing to `Vitest 4` with a live OpenCode verification lane, and finish the current shipped TUI on `Ink 6 + React 19` while keeping `OpenTUI` behind an experimental adapter until official Node support is no longer "in-progress".

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@opencode-ai/sdk` | latest stable `1.x` | Authoritative client/server runtime control | Official docs expose `createOpencode()` to start a server+client pair and `createOpencodeClient()` to attach to an existing server. This is the correct foundation for deterministic harnesses and live contract probes; do not keep parallel runtime abstractions. **Confidence: HIGH** |
| `@opencode-ai/plugin` | latest stable `1.x` | Plugin hooks and custom tool surface | Official docs show plugins and custom tools are first-class, with hookable events, SDK client access, and `tool()`/`tool.schema` for tool definitions. This should remain the only plugin boundary. **Confidence: HIGH** |
| `TypeScript` | `5.9.x` | Single implementation language for plugin, CLI, harness, and TUI | Brownfield migration works best when every layer shares types, strict checking, and ESM packaging. Upgrade from the current `5.3.x` line to current stable and keep `tsc --noEmit` as the hard gate. **Confidence: HIGH** |
| `Node.js` | `20 LTS` baseline, `22` in CI | Product runtime for the npm package and CLI | The package already ships as a Node ESM package. Keeping Node as the product runtime avoids a destabilizing runtime rewrite while still allowing Bun-only behavior at the OpenCode plugin edge where official docs require it. **Confidence: HIGH** |

### Runtime and Orchestration Rules

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| OpenCode server started via `createOpencode()` | SDK-managed | Deterministic local harness and live verification | Official SDK docs say `createOpencode()` starts both server and client. Use this in integration/live tests so the harness exercises the same boundary the product depends on. **Confidence: HIGH** |
| OpenCode client attached via `createOpencodeClient()` | SDK-managed | External control of an already-running OpenCode instance | Use only when the test or tool intentionally targets an existing runtime. This keeps ownership of server lifecycle explicit and prevents the detached-client mistakes already present in the brownfield code. **Confidence: HIGH** |
| Bun at the plugin edge only | OpenCode-managed | Plugin/package installation and Bun shell access where OpenCode provides it | Official plugin docs state npm plugins are installed with Bun and plugin context exposes Bun's `$` shell API. Use that only inside OpenCode-facing plugin code. Do not make the whole package Bun-first. **Confidence: HIGH** |

### Validation and Contract Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `zod` | `4.x` | Single source of truth for runtime validation | OpenCode custom tools use `tool.schema`, and official docs state `tool.schema` is Zod-backed. Zod 4 also provides first-party `z.toJSONSchema()`, which is ideal for structured-output contracts and harness assertions. One schema layer is the right move for a refactor. **Confidence: HIGH** |
| `tool.schema` | bundled with `@opencode-ai/plugin` | Tool argument validation | Use it for every custom tool so plugin validation, TypeScript inference, and runtime enforcement stay aligned to OpenCode's own contract. **Confidence: HIGH** |
| JSON Schema generated from Zod | via `z.toJSONSchema()` | Structured output and deterministic response validation | Official SDK docs support `json_schema` output formats. Generate schemas from Zod instead of hand-maintaining a second schema system. **Confidence: HIGH** |

### Testing and Verification

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `vitest` | `4.x` | Primary test runner for unit, integration, and live contract suites | Vitest 4 supports TypeScript cleanly, has strong mocking, coverage, and multi-project configs. It is the right replacement for ad hoc `tsx --test` growth in a brownfield repo because it can separate `unit`, `integration`, and `live-opencode` projects without splitting tooling. **Confidence: HIGH** |
| `@playwright/test` | `1.58.x` | End-to-end verification for any browser-backed surfaces and traceable UI regressions | Playwright provides isolated contexts, web-first assertions, tracing, and API setup patterns. Use it only where there is actual browser UI or browser-hosted verification; it is not the primary harness for the terminal runtime. **Confidence: HIGH** |
| SDK-driven live probes | built on `@opencode-ai/sdk` + Vitest | Proof for runtime claims | Governance requires live OpenCode server/client/plugin proof. Implement those probes as a dedicated Vitest project that boots OpenCode, exercises hooks/tools, and fails on contract drift. **Confidence: HIGH** |
| `ink-testing-library` | latest stable | Snapshot-like and stdin/stdout tests for Ink views | Official package docs show `render()`, `lastFrame()`, `rerender()`, and simulated stdin. That makes it a practical way to harden the currently shipped terminal UI without waiting on OpenTUI test infrastructure to mature. **Confidence: MEDIUM** |
| `tsx` | `4.x` | Dev scripts, one-off probes, local utilities | Keep `tsx` for script execution and watch mode. Do not keep it as the main test platform once Vitest is in place. **Confidence: HIGH** |

### TUI / Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `ink` | `6.8.x` | Default shipped terminal UI during the migration | Ink is Node-native, already in the dependency graph, React-based, and has a mature testing utility. For a brownfield refactor, the safest path is to finish and stabilize the current shipped experience here first. **Confidence: MEDIUM** |
| `react` | `19.2.x` | Shared component model for terminal views | React keeps component logic familiar across the repo and works with both Ink now and OpenTUI later if the migration reaches that stage. **Confidence: MEDIUM** |
| `@opentui/core` + `@opentui/react` | experimental track only | Next-generation high-fidelity terminal UI layer | Official OpenTUI docs say it is Bun-exclusive today and Node support is still in progress. That makes it the wrong default renderer for a Node-shipped npm package right now, but the right experimental target behind a renderer adapter because OpenCode itself uses it. **Confidence: HIGH** |

### Data / State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| File-backed state (`JSON`, `YAML`, `Markdown`) | repo-owned | Runtime state, planning artifacts, handoffs, and generated records | This product is fundamentally local-workspace and artifact-driven. File-backed state matches existing `.hivemind/` and `.planning/` patterns, keeps migrations legible, and avoids introducing an unnecessary service boundary. **Confidence: HIGH** |
| `proper-lockfile` | `4.x` | Deterministic write coordination for local state | Local runtime files need safe writes if multiple commands, sessions, or harness flows touch them. Locking is enough here; a database is not yet justified. **Confidence: HIGH** |
| `yaml` | `2.x` | Human-editable configuration/state where JSON is too rigid | Use YAML only for configuration and authored artifacts, not for high-churn machine event logs. **Confidence: HIGH** |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `remark` | `15.x` | Markdown parsing for docs, skill, and handoff intelligence | Keep for the markdown-first doc surface and any structured document ingestion |
| `unist-util-visit` | `5.x` | AST traversal for markdown pipelines | Use with `remark` for deterministic section/chunk extraction |
| `magic-string` | `0.30.x` | Precise source edits with stable offsets | Use when exact text edits are safer than broad file rewrites |
| `@clack/prompts` | `1.x` | Lightweight command-line prompts outside full TUI flows | Use for setup/init/doctor flows; do not use it as a second application UI framework |

## Prescriptive Migration Decisions

1. **Standardize on one runtime contract:** Core runtime logic talks to OpenCode through `@opencode-ai/sdk`; plugin entry points talk through `@opencode-ai/plugin`; nothing else owns session/runtime truth.
2. **Standardize on one validation system:** Zod 4 defines tool args, internal records, and structured-output expectations. Generate JSON Schema from Zod rather than authoring both.
3. **Standardize on one primary test runner:** Vitest 4 runs everything except ad hoc local scripts.
4. **Keep the shipped TUI conservative:** Ink remains the production renderer during the migration. OpenTUI stays behind an adapter until Node support is officially ready.
5. **Keep state local and inspectable:** files + locks, not a database.

## What Not to Use Yet

| Category | Do Not Use Yet | Why |
|----------|----------------|-----|
| TUI runtime | `@opentui/core` / `@opentui/react` as the default shipped renderer | Official docs explicitly say OpenTUI is Bun-exclusive and Node support is still in progress. This repo ships as a Node package today. Make it experimental, not default. |
| Product runtime | Bun as the main package runtime/build assumption | Bun is relevant at the OpenCode plugin edge, but making the whole product Bun-first would expand migration risk and break the current Node contract. |
| Testing | `tsx --test` or raw Node test runner as the primary suite | Good for scripts, weak as the long-term home for multi-project deterministic harnessing, coverage, and live-contract lanes. |
| Persistence | SQLite/Drizzle/ORM adoption | The current milestone is runtime correctness and deterministic execution, not multi-user data management. A database would add migration surface before it solves a real problem. |
| Validation | Hand-written interfaces without runtime schemas | This project needs live contract proof and deterministic structured output. Type-only contracts are not enough. |
| Architecture | New wrapper abstractions around OpenCode sessions/tools before the SDK contract is proven | The brownfield risk is already detached abstractions. The refactor should remove them, not replace them with fresher ones. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Plugin/runtime integration | `@opencode-ai/sdk` + `@opencode-ai/plugin` | Custom internal runtime layer | The product's core problem is drift from the official boundary; another wrapper delays the fix |
| Validation | `Zod 4` | ad hoc runtime checks or a second schema stack | Extra schema systems multiply migration work and drift |
| Test runner | `Vitest 4` | stay on `tsx --test` | Too limited for a clean split between unit, integration, and live verification projects |
| Terminal UI | `Ink 6` now, OpenTUI later | immediate OpenTUI rewrite | Official OpenTUI Node support is not done yet, so the rewrite would be premature |
| Persistence | file-backed state + `proper-lockfile` | SQLite now | Unnecessary for the current local, artifact-centric workflow |

## Installation

```bash
# Core runtime and contracts
npm install @opencode-ai/sdk @opencode-ai/plugin zod proper-lockfile yaml

# TUI and authored-surface parsing
npm install ink react @clack/prompts remark unist-util-visit magic-string

# Dev, tests, and verification
npm install -D typescript tsx vitest @vitest/coverage-v8 @playwright/test ink-testing-library @types/node @types/react
```

## Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| OpenCode runtime/plugin stack | HIGH | Based on current official OpenCode SDK/plugin/custom-tools docs |
| Validation strategy | HIGH | Official OpenCode docs and Zod 4 docs align on Zod-backed schemas and JSON Schema generation |
| Testing stack | HIGH | Vitest and Playwright capabilities are current and well-documented |
| TUI recommendation | MEDIUM | Ink is stable for Node brownfield work, but the long-term ecosystem center of gravity is moving toward OpenTUI |
| OpenTUI deferment | HIGH | Official OpenTUI docs explicitly state Bun-exclusive today and Node support in progress |

## Sources

- OpenCode SDK docs - https://opencode.ai/docs/sdk - verified 2026-03-17 - **HIGH**
- OpenCode Plugins docs - https://opencode.ai/docs/plugins - verified 2026-03-17 - **HIGH**
- OpenCode Custom Tools docs - https://opencode.ai/docs/custom-tools - verified 2026-03-17 - **HIGH**
- OpenCode Tools docs - https://opencode.ai/docs/tools - verified 2026-03-17 - **HIGH**
- Context7: OpenCode Plugins (`/websites/opencode_ai_plugins`) - queried 2026-03-17 - **HIGH**
- Zod 4 docs - https://zod.dev/v4/ and Context7 `/websites/zod_dev_v4` - verified 2026-03-17 - **HIGH**
- Vitest v4 docs via Context7 `/vitest-dev/vitest/v4.0.7` - verified 2026-03-17 - **HIGH**
- Playwright docs via Context7 `/microsoft/playwright/v1.58.2` - verified 2026-03-17 - **HIGH**
- OpenTUI getting started - https://opentui.com/docs/getting-started - verified 2026-03-17 - **HIGH**
- OpenTUI React bindings - https://opentui.com/docs/bindings/react - verified 2026-03-17 - **HIGH**
- OpenTUI renderer/lifecycle docs - https://opentui.com/docs/core-concepts/renderer and https://opentui.com/docs/core-concepts/lifecycle - verified 2026-03-17 - **HIGH**
- Ink README and docs - https://raw.githubusercontent.com/vadimdemedes/ink/master/readme.md and Context7 `/vadimdemedes/ink` - verified 2026-03-17 - **MEDIUM**
- `ink-testing-library` package docs - https://www.npmjs.com/package/ink-testing-library - verified 2026-03-17 - **MEDIUM**
