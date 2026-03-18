# Technology Stack

**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Researched:** 2026-03-18

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `Node.js` | `20 LTS` | Shipped package runtime | The package already ships as a Node/npm CLI and plugin. Keep the product runtime stable instead of rewriting the whole repo around Bun. |
| `TypeScript` | current stable `5.x` | Shared implementation language | Strict typing already works across CLI, plugin, and dashboard code. Use it to keep contracts shared across backend and TUI. |
| `@opencode-ai/sdk` | current `1.x` | Server/client runtime control | Official docs expose event streaming, session APIs, and client/server control. This should remain the only server-facing authority. |
| `@opencode-ai/plugin` | current `1.x` | Hook and tool integration | Official docs make hooks and custom tools the supported extension model. Keep plugin code thin and surface-based. |

### Dashboard Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `Bun` | current stable | Runtime for the OpenTUI dashboard app | Official OpenTUI docs say it is Bun-exclusive today and Node support is still in progress. The current Node test already fails on OpenTUI asset loading. |
| `@opentui/core` | current `0.1.x` | Native TUI renderer | Keep it, but only inside an isolated dashboard app boundary. |
| `@opentui/react` | current `0.1.x` | React binding for OpenTUI | Fits the current `src/tui` component model and supports `createRoot(renderer)` cleanly. |
| `react` | `19.x` | Shared component model | Lets backend-adjacent dashboard state stay component-driven and keeps migration options open. |

### Contracts and State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `zod` | `4.x` | Shared runtime contracts | One schema source should define backend payloads, tool args, dashboard view models, and receipts. |
| `proper-lockfile` | `4.x` | Safe local state writes | Local runtime artifacts are still part of the product; locking is enough without adding a database. |
| File-backed JSON/Markdown | repo-owned | Local state and evidence | Fits this product better than a database because the workflow is local, auditable, and artifact-heavy. |

### Testing and Verification

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | current stable | Core package unit/integration tests | Use for Node-side runtime-entry, feature modules, contracts, and adapter layers. |
| `bun test` | current stable | OpenTUI app tests | Use for the Bun-only dashboard package because Node/`tsx` is not a reliable execution path for OpenTUI right now. |
| SDK-driven live probes | repo-owned | End-to-end harness proof | Use for server, plugin, tool, and event-stream verification against a real OpenCode instance. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Dashboard runtime | Bun + isolated OpenTUI app | Keep OpenTUI inside the root Node package | Current docs say Bun-only; local Node test fails with `.scm` asset loading. |
| Top-level organization | `features/` + `tools/` + `hooks/` hybrid | Pure technical layers only | The current tree already shows why this is hard to maintain: concepts are scattered across layers. |
| Package runtime | Node for core package | Bun for entire repo | Rewriting the shipped package runtime would add risk without solving the main maintainability problem. |
| Persistence | File-backed state + locks | Database/ORM now | The product's current pain is ownership and discoverability, not data scale. |

## Installation

```bash
# Core package
npm install @opencode-ai/sdk @opencode-ai/plugin zod proper-lockfile yaml

# Dashboard app package
bun add @opentui/core @opentui/react react

# Core testing
npm install -D vitest typescript tsx @types/node @types/react
```

## Sources

- OpenCode Plugins docs - https://opencode.ai/docs/plugins - HIGH
- OpenCode SDK JS docs via Context7 `/sst/opencode-sdk-js` - HIGH
- OpenTUI getting started - https://opentui.com/docs/getting-started - HIGH
- OpenTUI React docs via Context7 `/anomalyco/opentui` - HIGH
- Local evidence: `package.json`, `src/tui/**`, `tests/tui/client.test.ts`, `npm run build`, `npx tsx --test tests/tui/*.test.ts` - HIGH
