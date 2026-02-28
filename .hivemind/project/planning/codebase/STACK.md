# Tech Stack Analysis

> Generated: 2026-02-28 | Source: src/ (134 core files, 23 dashboard-v2 files, 104 test files)

## Languages & Runtime

**Primary Language:**
- TypeScript ^5.3.0 — all source code (`src/`), all tests (`tests/`)
- Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- TSConfig: `tsconfig.json` (root)

**Compilation Target:**
- Target: `ES2022`
- Module system: `NodeNext` (ESM — `"type": "module"` in `package.json`)
- Module resolution: `NodeNext`
- Lib: `["ES2022"]`
- JSX: `react` (enabled for dashboard components, type declarations in `src/types/`)

**Runtime:**
- Node.js `>=20.0.0` (declared in `package.json` `engines` field)
- No `.nvmrc` or `.node-version` file present

**Package Manager:**
- npm (primary) — `package-lock.json` present at root
- Bun used exclusively for `src/dashboard-v2/` sub-project (`bun.lock` present)

## Core Framework

**OpenCode Plugin SDK:**
- Package: `@opencode-ai/plugin` ^1.1.53 (devDependency) / `>=1.1.0` (peerDependency, required)
- Entry point: `src/index.ts` — exports `HiveMindPlugin` as `Plugin` type
- Plugin factory pattern: async function receiving `{ directory, worktree, client, $: shell, serverUrl, project }`
- Returns hook registrations + tool definitions

**SDK Primitives Consumed (16 import sites):**

| Primitive | Import Path | Used In |
|-----------|-------------|---------|
| `Plugin` (type) | `@opencode-ai/plugin` | `src/index.ts` |
| `PluginInput` (type) | `@opencode-ai/plugin` | `src/hooks/sdk-context.ts` |
| `tool()` factory | `@opencode-ai/plugin/tool` | All 14 files in `src/tools/` |
| `ToolDefinition` (type) | `@opencode-ai/plugin/tool` | All 14 files in `src/tools/` |

**Hook Registration Points (from `src/index.ts`):**

| Hook | Factory Function | Purpose |
|------|------------------|---------|
| `event` | `createEventHandler()` | Session lifecycle events |
| `experimental.chat.system.transform` | `createSessionLifecycleHook()` | System prompt injection |
| `experimental.chat.messages.transform` | `createMessagesTransformHook()` | Message transformation |
| `tool.execute.after` | `createSoftGovernanceHook()` | Drift tracking, violation detection |
| `tool.execute.before` | `createToolGateHook()` | Governance enforcement |
| `experimental.session.compacting` | `createCompactionHook()` | Hierarchy preservation |

**14 Tool Registrations (from `src/index.ts` lines 134–149):**
- `hivemind_session`, `hivemind_inspect`, `hivemind_memory`, `hivemind_anchor`
- `hivemind_hierarchy`, `hivemind_cycle`, `hivemind_context`, `hivemind_session_memory`
- `hivemind_codemap`, `hivemind_ideate`, `hivemind_read_skeleton`, `hivemind_precision_patch`
- `hivemind_mesh_pull`, `hivemind_doc_weaver`

## Dependencies

### Production (`dependencies` in `package.json`)

| Package | Version | Import Sites | Where Used | Purpose |
|---------|---------|-------------|------------|---------|
| `zod` | ^4.3.6 | 11 files | `src/schemas/*.ts`, `src/lib/graph/shared.ts`, `src/lib/orphan-quarantine.ts` | Runtime schema validation for all state types (brain, graph, config, events, planning, delegation, ideation, governance) |
| `yaml` | ^2.3.4 | 6 files | `src/cli/sync-assets.ts`, `src/lib/fs/planning-ops.ts`, `src/lib/fs/planning-paths.ts`, `src/lib/fs/session-io.ts`, `src/lib/skill-registry.ts`, `src/lib/migrate.ts` | YAML parse/stringify for session files, planning ops, skill registry, asset sync |
| `web-tree-sitter` | ^0.26.5 | 1 file (dynamic) | `src/lib/code-intel/tree-sitter-loader.ts` (line 207: `await import("web-tree-sitter")`) | AST parsing for code intelligence — dynamically imported with graceful fallback to regex |
| `remark` | ^15.0.1 | 1 file | `src/lib/code-intel/doc-weaver.ts` | Markdown AST parsing for section-level document patching |
| `unist-util-visit` | ^5.1.0 | 1 file | `src/lib/code-intel/doc-weaver.ts` | Tree traversal for remark AST nodes |
| `proper-lockfile` | ^4.1.2 | 1 file | `src/lib/file-lock.ts` | Cross-process file locking for atomic state persistence |
| `magic-string` | ^0.30.21 | 1 file | `src/lib/code-intel/ast-surgeon.ts` | Byte-range string replacement for AST-based code patching |
| `ignore` | ^7.0.5 | 1 file | `src/lib/code-intel/gitignore-filter.ts` | .gitignore pattern matching for code scanning |
| `@clack/prompts` | ^1.0.0 | 1 file | `src/cli/interactive-init.ts` | Interactive CLI prompts for project initialization |
| `typescript` | ^5.3.0 | 0 (build tool) | Used via `tsc` CLI | ⚠️ Listed in `dependencies` but only used as build tool — should arguably be devDependency |
| `@types/proper-lockfile` | ^4.1.4 | 0 (type declarations) | Provides types for `proper-lockfile` | ⚠️ Listed in `dependencies` but should be in `devDependencies` |

### Development (`devDependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@opencode-ai/plugin` | ^1.1.53 | SDK for plugin development (also peer dep) |
| `@types/node` | ^20.10.0 | Node.js type declarations |
| `tsx` | ^4.7.0 | TypeScript execution for tests and CLI dev |

### Peer Dependencies (optional/required)

| Package | Version | Required | Where Used |
|---------|---------|----------|------------|
| `@opencode-ai/plugin` | >=1.1.0 | **Yes** | Core plugin entry, all tools, hooks |
| `ink` | >=5.0.0 | No (optional) | `src/dashboard-v2/` only (via sub-project, not main source) |
| `react` | >=18.0.0 | No (optional) | `src/dashboard-v2/` only — 14 import sites in dashboard sub-project |

## Build Pipeline

**Compilation:**
```bash
npm run build     # rm -rf dist && tsc && chmod +x dist/cli.js
npm run dev       # tsc --watch
```
- Input: `src/**/*` (rootDir: `./src`)
- Output: `dist/` (outDir: `./dist`)
- Produces: `.js` + `.d.ts` + `.d.ts.map` + `.js.map` files
- Excludes from compilation: `node_modules`, `dist`, `tests`, `src/dashboard-v2`

**Type Checking:**
```bash
npm run typecheck          # tsc --noEmit (core only)
npm run typecheck:core     # same
npm run typecheck:dashboard-v2  # separate tsconfig, installs deps if needed
npm run typecheck:all      # core + dashboard-v2
```

**Testing:**
```bash
npm test    # bash scripts/check-sdk-boundary.sh && tsx --test tests/*.test.ts
```
- Runner: Node.js native test runner (`node:test`)
- Executor: `tsx` (TypeScript execution without precompilation)
- 104 test files in `tests/` (includes `tests/code-intel/`, `tests/hooks/`, `tests/lib/`)
- Architecture boundary check runs BEFORE tests (`check-sdk-boundary.sh`)

**Linting/Boundary Enforcement:**
```bash
npm run lint:boundary    # bash scripts/check-sdk-boundary.sh
npm run guard:public     # bash scripts/guard-public-branch.sh origin/master HEAD
```
- `check-sdk-boundary.sh`: Enforces `src/lib/` NEVER imports `@opencode-ai/*` (architecture boundary)
- `guard-public-branch.sh`: Blocks sensitive dev-only content from reaching `master` branch
- `validate-framework.sh`: Framework validation script (exists at `scripts/validate-framework.sh`)

**Publishing:**
```bash
npm run prepublishOnly   # typecheck && test && build
```
- Published files: `dist/`, `bin/`, `skills/`, `commands/`, `agents/`, `workflows/`, `README.md`, `LICENSE`, `CHANGELOG.md`
- Registry: npm public (`"publishConfig": { "access": "public" }`)

**CLI Entry Points:**
- Binary names: `hivemind-context-governance`, `hivemind` → `dist/cli.js`
- Source: `src/cli.ts` (478 lines, shebang: `#!/usr/bin/env node`)
- Sub-commands: `init`, `migrate`, `scan`, `sync-assets`, `doctor`, `status`, `compact`, `dashboard`, `settings`, `purge`, `help`

## File Formats & Parsers

**Formats the project reads/writes:**

| Format | Read | Write | Library | Used For |
|--------|------|-------|---------|----------|
| JSON | ✅ | ✅ | Node.js built-in (`JSON.parse/stringify`) | Brain state, graph state, config, codemap, manifests — all in `.hivemind/` |
| YAML | ✅ | ✅ | `yaml` package (parse/stringify) | Session files, planning ops, skill registry, asset frontmatter, migration |
| Markdown | ✅ | ✅ | `remark` + `unist-util-visit` (AST), raw string ops | Session archives, active session, planning docs, doc-weaver patches |
| Source Code (TS/JS/Py/Go/Rust) | ✅ | ✅ | `web-tree-sitter` (AST), `magic-string` (byte patches) | Code intelligence: skeleton extraction, precision patching, codemap compression |
| .gitignore patterns | ✅ | ❌ | `ignore` package | File scanning exclusion in code-intel |

**Tree-sitter Language Support (from `src/lib/code-intel/tree-sitter-loader.ts`):**

| Language | Extension(s) | WASM File |
|----------|-------------|-----------|
| TypeScript | `.ts` | `tree-sitter-typescript.wasm` |
| TSX | `.tsx` | `tree-sitter-tsx.wasm` |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | `tree-sitter-javascript.wasm` |
| JSON | `.json` | `tree-sitter-json.wasm` |
| Python | `.py` | `tree-sitter-python.wasm` |
| Go | `.go` | `tree-sitter-go.wasm` |
| Rust | `.rs` | `tree-sitter-rust.wasm` |

Tree-sitter is loaded lazily via dynamic `import()` with graceful degradation — if WASM files are unavailable, the system falls back to regex-based signature extraction.

## Node.js Built-in Modules Used

| Module | Import Style | Used Across |
|--------|-------------|-------------|
| `fs` / `fs/promises` | `node:fs`, `node:fs/promises`, `fs/promises` | 77+ import sites — core I/O layer |
| `path` | `node:path` | 30+ import sites — path resolution |
| `crypto` | `node:crypto` | `randomUUID()`, `createHash()` — session IDs, content hashing |
| `events` | `events` | EventEmitter for event bus (`src/lib/event-bus.ts`) and file watcher (`src/lib/watcher.ts`) |
| `child_process` | `node:child_process` | `execSync()` in `src/lib/code-intel/knowledge-commits.ts` — git operations |
| `process` | `node:process` | CLI argv parsing in `src/cli.ts` |
| `url` | `node:url` | `fileURLToPath()` for `import.meta.url` resolution |
| `os` | `node:os` | `homedir()` in `src/cli/sync-assets.ts` |
| `module` | `node:module` | `createRequire()` in tree-sitter-loader for WASM resolution |

## Sub-Projects

### dashboard-v2 (`src/dashboard-v2/`)

**Status:** Excluded from main `tsconfig.json` (line 24: `"exclude": [..., "src/dashboard-v2"]`). Fully independent sub-project.

**Runtime:** Bun (not Node.js) — `bun.lock` present, scripts use `bun run`

**Package:** `dashboard-v2` (private, not published)

**Framework Stack:**
- React `^19.2.4` — UI rendering
- Ink `^4.4.1` — Terminal UI rendering with React
- `@opentui/core` `^0.1.83` + `@opentui/react` `^0.1.83` — TUI component framework
- `react-devtools-core` `^7.0.1` — dev tooling

**TSConfig Differences from main:**
- Target: `ESNext` (vs `ES2022`)
- Module: `Preserve` (vs `NodeNext`)
- JSX: `react-jsx` with `jsxImportSource: "@opentui/react"` (vs plain `react`)
- Module resolution: `bundler` (vs `NodeNext`)
- Less strict: `noUnusedLocals: false`, `noUnusedParameters: false`
- `noEmit: true` — no compilation output (runs directly via Bun)

**Source Structure:** `src/dashboard-v2/src/` contains panels, components, hooks, snapshot reader

**23 source files** including:
- 10 panel components (Overview, Hierarchy, Governance, CodeIntel, Settings, etc.)
- Custom hooks (`useKeyboardHandler`, `useDashboardData`)
- Snapshot data reader (`snapshot.ts`)

## Key Observations

1. **Architecture Boundary Enforcement:** The `check-sdk-boundary.sh` script enforces that `src/lib/` (the "Subconscious Engine") never imports `@opencode-ai/*`. Only `src/tools/` and `src/hooks/` may depend on the SDK. This is run as part of `npm test`.

2. **Misplaced Dependencies:** `typescript` and `@types/proper-lockfile` are in `dependencies` but should be in `devDependencies`. They are not runtime imports — `typescript` is a build tool and `@types/proper-lockfile` provides compile-time types only.

3. **Dynamic Import Strategy:** `web-tree-sitter` is the only dependency loaded via dynamic `import()` (in `src/lib/code-intel/tree-sitter-loader.ts`). This enables graceful degradation when WASM binaries are unavailable.

4. **Zod v4 (not v3):** The project uses `zod` ^4.3.6 which is a major version ahead of the more common v3. This affects API surface (e.g., `z.output` vs `z.infer`, schema methods).

5. **Dual Package Manager:** npm for the main project, Bun exclusively for dashboard-v2. The two are completely decoupled — different runtimes, different lockfiles, different tsconfigs.

6. **Heavy Node.js Built-in Usage:** 77+ import sites for `fs`/`fs/promises` alone. The project is deeply coupled to Node.js filesystem APIs — this is by design (stateful governance layer persisting to `.hivemind/`).

7. **ESM-Only:** The project is pure ESM (`"type": "module"`) with `.js` extensions on all local imports. No CommonJS compatibility layer.

8. **No Bundler:** The main project uses raw `tsc` compilation — no webpack, esbuild, rollup, or vite. Output goes directly to `dist/` as individual `.js` files with source maps and declarations.

9. **No Formatter/Linter Config Files:** No `.eslintrc`, `.prettierrc`, `biome.json`, or similar config files detected at root level. Code style is enforced by TypeScript strict mode + custom boundary scripts only.

10. **Test-to-Source Ratio:** 104 test files for 134 source files (0.78 ratio) — strong test coverage presence, though concentrated in certain areas (code-intel has dedicated `tests/code-intel/` with 15 test files).

---

*Stack analysis: 2026-02-28*
