# STACK — Technology Stack Reference

**Generated:** 2026-06-02
**Source:** package.json, tsconfig.json, vitest.config.ts, sidecar/package.json, .github/workflows/

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Package name | `hivemind-3.0` |
| Version | 0.1.0 |
| Description | Runtime composition engine for multi-agent orchestration, session continuity, and compounding intelligence in OpenCode |
| License | MIT |
| Module system | ESM (`"type": "module"`) |
| Runtime target | Node.js >= 20.0.0, OpenCode >= 1.15.0 |
| Registry | npmjs.org (public) |
| Repository | `https://github.com/shynlee04/hivemind-plugin.git` |

---

## 2. Language & Compilation

### Primary Language
- **TypeScript 5.x** (strict mode) — all source code

### Compiler Configuration (`tsconfig.json`)

| Setting | Value |
|---------|-------|
| Target | ES2022 |
| Module | NodeNext |
| Module resolution | NodeNext |
| Library | ES2022 |
| Output directory | `./dist` |
| Source root | `./src` |
| Strict mode | `true` |
| `noUnusedLocals` | `true` |
| `noUnusedParameters` | `true` |
| `noImplicitReturns` | `true` |
| `noFallthroughCasesInSwitch` | `true` |
| `verbatimModuleSyntax` | `true` |
| `skipLibCheck` | `true` |
| Declarations | `true` + `declarationMap` |
| Source maps | `true` |

### Sidecar tsconfig (`sidecar/tsconfig.json`)

| Setting | Value |
|---------|-------|
| Target | ES2022 |
| Module | ESNext |
| Module resolution | Bundler |
| JSX | `preserve` (Next.js) |
| Lib | `dom`, `dom.iterable`, `ES2022` |
| Path alias | `@/*` → `./src/*` |
| Plugin | Next.js |
| Strict | `true` |

---

## 3. Runtime Environment

### Supported Runtimes
| Runtime | Minimum Version | Notes |
|---------|----------------|-------|
| Node.js | >= 20.0.0 | Primary runtime |
| Bun | ^1.3.x | Optional — PTY support via `bun-pty` |
| OpenCode | >= 1.15.0 | Plugin host |

### Package Entrypoints (npm exports)

| Export path | File |
|-------------|------|
| `hivemind` | `./dist/index.js` |
| `hivemind/plugin` | `./dist/plugin.js` |
| `hivemind/cli` | `./dist/cli/index.js` |
| Binary | `./bin/hivemind.cjs` |

### Published Distribution

| Included | Excluded |
|----------|----------|
| `dist/` | `dist/**/*.map` |
| `bin/` | — |
| `assets/agent-instructions/` | — |
| `assets/agents/` | — |
| `assets/commands/` | — |
| `assets/references/` | — |
| `assets/rules/` | — |
| `assets/skills/` | — |
| `assets/templates/` | — |
| `assets/workflows/` | — |
| `scripts/` | — |
| `.hivemind/configs.schema.json` | — |

---

## 4. Core Dependencies

### Production Dependencies

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| `@ai-sdk/openai-compatible` | ^2.0.47 | OpenAI-compatible AI SDK provider for model routing | npm |
| `@clack/prompts` | ^1.4.0 | Terminal UI prompts (spinners, confirms, selects) | [bombshell-dev/clack](https://github.com/bombshell-dev/clack) |
| `@modelcontextprotocol/sdk` | ^1.29.0 | MCP (Model Context Protocol) server SDK | [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| `@opencode-ai/sdk` | ^1.15.10 | OpenCode SDK — session management, delegation, tool dispatch | [anomalyco/opencode](https://github.com/anomalyco/opencode) |
| `gray-matter` | ^4.0.3 | Frontmatter parsing for agent/command/skill YAML frontmatter | [jonschlinkert/gray-matter](https://github.com/jonschlinkert/gray-matter) |
| `yaml` | ^2.9.0 | YAML serialization/deserialization | [eemeli/yaml](https://github.com/eemeli/yaml) |
| `zod` | ^4.4.3 | Runtime schema validation | [colinhacks/zod](https://github.com/colinhacks/zod) |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@opencode-ai/plugin` | ^1.15.10 | OpenCode plugin API — `tool()`, hooks, plugin composition |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@opencode-ai/plugin` | ^1.15.10 | Plugin SDK for build-time type checking and testing |
| `@types/bun` | ^1.3.8 | Bun runtime type definitions |
| `@types/node` | ^20.0.0 | Node.js type definitions |
| `@vitest/coverage-v8` | ^4.1.7 | V8 coverage provider for vitest |
| `bats` | ^1.13.0 | Bash automated testing system |
| `bun-types` | ^1.3.14 | Bun type definitions |
| `typescript` | ^5.0.0 | TypeScript compiler |
| `vitest` | ^4.1.7 | Test runner and assertion library |

### Optional Dependencies

| Package | Version | Purpose | Activation |
|---------|---------|---------|------------|
| `@json-render/core` | ^0.18.0 | JSON Render — core rendering engine | Sidecar dashboard |
| `@json-render/ink` | ^0.18.0 | JSON Render — Ink terminal renderer | Sidecar TUI |
| `@json-render/next` | ^0.18.0 | JSON Render — Next.js integration | Sidecar web UI |
| `@json-render/react` | ^0.18.0 | JSON Render — React component renderer | Sidecar web UI |
| `@json-render/react-pdf` | ^0.18.0 | JSON Render — PDF renderer | Sidecar PDF output |
| `bun-pty` | ^0.4.8 | PTY (pseudo-terminal) support for Bun runtime | Background command execution |
| `react` | ^19.2.6 | React UI library | Sidecar web UI |

---

## 5. Sidecar Stack (`sidecar/`)

The sidecar is a **Next.js 15** application providing a read-only dashboard.

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.0.0 | React web framework (App Router) |
| `react` | ^19.0.0 | UI library |
| `react-dom` | ^19.0.0 | React DOM renderer |
| `@json-render/react` | ^0.1.0 | JSON Render React bindings |
| `@types/node` | ^20.0.0 | Node.js type defs |
| `@types/react` | ^19.0.0 | React type defs |
| `@types/react-dom` | ^19.0.0 | React DOM type defs |
| `typescript` | ^5.0.0 | TypeScript compiler |

---

## 6. Build System

### Build Pipeline

```
npm run build
  ├── 1. clean          rm -rf dist/
  ├── 2. sync-assets    node scripts/sync-assets.js
  ├── 3. compile        tsc
  └── 4. schema-gen     node dist/schema-kernel/generate-config-json-schema.js
```

### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | Full pipeline | Clean → sync assets → compile → generate JSON schema |
| `clean` | `rm -rf dist/` | Remove build output |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `test` | `vitest run` | Run all tests |
| `test:watch` | `vitest` | Watch mode |
| `test:coverage` | `vitest run --coverage` | Coverage report |
| `postinstall` | `node scripts/sync-assets.js --mode=install` | Post-install asset sync |
| `prepack` | `npm run build` | Pre-publish build |

### Post-Install Hook
- `postinstall` runs `scripts/sync-assets.js --mode=install` to reflect source-of-truth primitives from `assets/` to `.opencode/`

---

## 7. Testing Stack

### Test Framework
- **Vitest** ^4.1.7 — test runner with globals (`globals: true`)

### Test Configuration

| Setting | Value |
|---------|-------|
| Include patterns | `tests/**/*.test.ts`, `eval/**/*.test.ts` |
| Setup file | `vitest.setup.ts` |
| Globals | `true` (no imports for `describe`, `it`, `expect`) |

### Coverage Configuration

| Metric | Threshold |
|--------|-----------|
| Statements | >= 75% |
| Branches | >= 62% |
| Functions | >= 80% |
| Lines | >= 77% |

- Provider: `v8` (`@vitest/coverage-v8`)
- Included: `src/**/*.ts`
- Excluded: `src/index.ts`, `src/**/index.ts`
- Reporters: `text`, `lcov`, `json-summary`

### Test Layout
- `tests/lib/` — unit tests mirroring `src/` modules
- `tests/tools/` — tool-focused unit tests

---

## 8. CI/CD Pipeline (GitHub Actions)

### Workflows

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **CI** | `.github/workflows/ci.yml` | Push/PR to `oss-dev`, `main` | Build, typecheck, test, coverage on Node 20 & 22 |
| **Publish** | `.github/workflows/publish.yml` | Tag push (`v*`) or `workflow_dispatch` | npm publish with pre-flight dry-run and package validation |
| **OpenCode** | `.github/workflows/opencode.yml` | Issue/PR comments with `/oc` or `/opencode` | Trigger OpenCode agent in CI |
| **Sync OSS** | `.github/workflows/sync-oss.yml` | — | OSS mirror sync |
| **Qwen Triage** | `.github/workflows/qwen-triage.yml` | — | AI triage for issues |
| **Qwen Invoke** | `.github/workflows/qwen-invoke.yml` | — | AI invocation |
| **Qwen Scheduled Triage** | `.github/workflows/qwen-scheduled-triage.yml` | — | Periodic AI triage |
| **Qwen Dispatch** | `.github/workflows/qwen-dispatch.yml` | — | AI dispatch |

### CI Steps (ci.yml)
1. Checkout (`actions/checkout@v4`)
2. Setup Node (matrix: 20, 22) (`actions/setup-node@v4`, cache: npm)
3. `npm ci`
4. `npm run typecheck`
5. `npm run build`
6. `npm test`
7. `npm run test:coverage` (Node 22 only)

### Publish Steps (publish.yml)
1. Checkout + setup Node 22
2. `npm ci` → `typecheck` → `test` → `build`
3. Package validation (size check, no `.map` files, no `.hivemind/` leaks)
4. `npm publish --dry-run` (manual) or `npm publish` (tag push)

---

## 9. Source Code Metrics

| Metric | Count |
|--------|-------|
| Source files (`src/**/*.ts`) | ~262 |
| Test files (`tests/**/*.ts`) | ~258 |
| Plugin entry point | `src/plugin.ts` (756 lines) |
| Public API re-exports | `src/index.ts` (30 lines, 32+ exports) |
| Source modules | 13 top-level directories under `src/` |

---

## 10. Directory Architecture (src/)

```
src/
├── cli/                  # CLI substrate (commands, discovery, renderer, router, UI)
├── config/               # Config subscriber, compiler, workflow
├── coordination/         # Delegation, completion, concurrency, command/SDK delegation, spawner
├── features/             # 15 standalone runtime features
├── hooks/                # 5 hook categories
├── routing/              # Session entry, behavioral profile, command engine
├── schema-kernel/        # 21 Zod schemas
├── shared/               # Leaf utilities, types, SDK wrappers, runtime policy, security
├── sidecar/              # Read-only state contract surface (Phase 42)
├── task-management/      # Continuity, journal, lifecycle, trajectory
├── tools/                # 6 tool domains
├── index.ts              # Public API
└── plugin.ts             # Composition root
```

---

## 11. Key Architectural Patterns

| Pattern | Implementation |
|---------|---------------|
| **CQRS** | Write-side = tools; Read-side = hooks, observers |
| **Plugin pattern** | Composition root (`plugin.ts`) wires deps → registers tools + hooks |
| **Schema-first** | All config/state validated via Zod v4 schemas in `schema-kernel/` |
| **Dual-layer state** | Durable JSON (continuity) + in-memory Maps (state) |
| **WaiterModel** | Async delegation with completion detection and dual-signal verification |
| **Factory pattern** | All hooks and tools created via factory functions |
| **Dependency injection** | Manual DI via constructor parameters and factory arguments |
| **Progressive disclosure** | Session view aggregated across 3 data roots (tracker, delegations, trajectory) |

---

## 12. Development Tooling

| Tool | Purpose |
|------|---------|
| TypeScript 5.x | Language compiler |
| Vitest 4.x | Test runner |
| `@vitest/coverage-v8` | Code coverage |
| Bats | Bash-level testing |
| ast-grep | AST pattern matching (references only) |
| scripts/sync-assets.js | Asset reflection from `assets/` → `.opencode/` |
| scripts/generate-config-json-schema.js | JSON Schema generation from Zod |

---

## 13. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENCODE_HARNESS_STATE_DIR` | Override default state directory | No |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Override continuity file path | No |
| `ZAI_API_KEY` | ZAI API key (OpenCode CI workflow) | For CI |
| `NPM_TOKEN` | npm publish token | For publish |

---

## 14. Version Compatibility Matrix

| Component | Min Version | Max Tested | Notes |
|-----------|-------------|------------|-------|
| Node.js | 20.0.0 | 22.x | Tested on 20 and 22 |
| TypeScript | 5.0 | 5.x | strict mode required |
| `@opencode-ai/plugin` | 1.15.10 | latest | Peer + dev dependency |
| `@opencode-ai/sdk` | 1.15.10 | latest | Session/delegation API |
| Zod | 4.3.6 | 4.4.3 | v4 with breaking changes from v3 |
| Vitest | 4.1.5 | 4.1.7 | globals: true |
| Next.js (sidecar) | 15.0.0 | latest | App Router |
| Bun (optional) | 1.3.x | latest | PTY support only |

---

**End of STACK.md** — 303 lines
