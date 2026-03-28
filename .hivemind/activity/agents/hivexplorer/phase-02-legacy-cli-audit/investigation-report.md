# Legacy CLI Audit — Phase 02

**Investigation ID:** phase-02-legacy-cli-audit
**Investigator:** hivexplorer
**Timestamp:** 2026-03-25T23:36:42+07:00
**Git HEAD:** 7183335
**Mode:** READ-ONLY audit

---

## File-by-File Analysis

### 1. `src/cli.ts` (194 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/cli.ts` |
| **Lines** | 194 |
| **Purpose** | Main CLI entry point — parses argv, resolves command dispatch, runs init/doctor/settings/harness/sync |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/cli.js` (7815 bytes, executable), registered as bin entry for 7 aliases |
| **Dependencies (imports)** | `./cli/command-routing.js`, `./cli/doctor.js`, `./cli/harness.js`, `./cli/init.js`, `./features/runtime-entry/index.js`, `./cli/runtime-assets.js`, `./cli/settings.js` |
| **Dependencies (imported by)** | `package.json` bin entries: `hivemind-context-governance`, `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, `hm-sync` all point to `dist/cli.js` |
| **Recommendation** | MODIFY — Remove `sync` command case (line 169-171) and `syncRuntimeSurface` import (line 10) when false sync is removed. Rest of CLI dispatch is core infrastructure. |
| **Risk if removed** | HIGH — This is the primary CLI entry. Removing it breaks all 7 bin aliases. |
| **Evidence** | `package.json` bin section: 7 entries all → `dist/cli.js`. `src/cli.ts:116-175` shows switch dispatch. `src/cli.ts:10` imports `syncRuntimeSurface`. `src/cli.ts:170` calls it. |

---

### 2. `src/cli/command-routing.ts` (50 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/cli/command-routing.ts` |
| **Lines** | 50 |
| **Purpose** | Resolves executable binary name and positional args to a CLI command; maps `hm-sync` → `sync` alias |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/cli/command-routing.js` |
| **Dependencies (imports)** | `node:path`, `../control-plane/index.js` (`CONTROL_PLANE_CLI_COMMANDS`, `discoverControlPlanePrimitives`) |
| **Dependencies (imported by)** | `src/cli.ts:5` |
| **Recommendation** | MODIFY — Remove `'hm-sync': 'sync'` alias from `BINARY_ALIASES` (line 14) when sync command is removed. Also remove `sync` from `CLI_COMMANDS` (line 4). |
| **Risk if removed** | HIGH — Core routing for all CLI commands. |
| **Evidence** | `src/cli/command-routing.ts:4` — `CLI_COMMANDS = [...CONTROL_PLANE_CLI_COMMANDS, 'sync', 'help']`. `src/cli/command-routing.ts:14` — `'hm-sync': 'sync'`. |

---

### 3. `src/cli/init.ts` (2 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/cli/init.ts` |
| **Lines** | 2 |
| **Purpose** | Thin re-export barrel: `export { initProject } from '../features/runtime-entry/index.js'` |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/cli/init.js` |
| **Dependencies (imports)** | `../features/runtime-entry/index.js` |
| **Dependencies (imported by)** | `src/cli.ts:8` |
| **Recommendation** | KEEP — Trivial barrel, no dead weight. If `src/cli.ts` inline-imports directly from `features/runtime-entry/`, this could be removed, but it's harmless at 2 lines. |
| **Risk if removed** | LOW — `src/cli.ts` could import directly from `features/runtime-entry/index.js`. |
| **Evidence** | `src/cli/init.ts:1` — single re-export. `dist/cli/init.js` exists. |

---

### 4. `src/cli/runtime-assets.ts` (26 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/cli/runtime-assets.ts` |
| **Lines** | 26 |
| **Purpose** | Thin wrapper around `syncRuntimeSurface()` from `features/runtime-observability/sync.ts`, providing hardcoded package constants |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/cli/runtime-assets.js` (811 bytes) |
| **Dependencies (imports)** | `node:url`, `../features/runtime-observability/sync.js` |
| **Dependencies (imported by)** | `src/cli.ts:10`, `src/features/runtime-entry/init.handler.ts:12`, `src/features/runtime-entry/doctor.ts:6` |
| **Recommendation** | REMOVE — This is the "sync bridge" that passes false sync into init and doctor. Once `sync.ts` is refactored or removed, this wrapper becomes dead. |
| **Risk if removed** | MEDIUM — Requires updating 3 callers: `src/cli.ts:10`, `init.handler.ts:12`, `doctor.ts:6`. |
| **Evidence** | `src/cli/runtime-assets.ts:24-25` — wraps `syncRuntimeSurfaceWithOptions`. `init.handler.ts:126` calls it. `doctor.ts:99` calls it conditionally. `src/cli.ts:170` calls it for `sync` command. |

---

### 5. `src/features/runtime-entry/init.handler.ts` (275 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/features/runtime-entry/init.handler.ts` |
| **Lines** | 275 |
| **Purpose** | Init handler — bootstraps workflow authority, trajectory ledger, recovery checkpoints, governance projection, and calls syncRuntimeSurface |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/features/runtime-entry/init.handler.js` (10819 bytes) |
| **Dependencies (imports)** | `../../core/index.js`, `../../governance/index.js`, `../../control-plane/control-plane-intake.js`, `../../control-plane/control-plane-registry.js`, `../../control-plane/sdk-runtime.js`, `../../cli/runtime-assets.js` (sync), `../../recovery/index.js`, `../../shared/entry-kernel-state.js`, `../../shared/runtime-attachment.js`, plus types |
| **Dependencies (imported by)** | `src/features/runtime-entry/index.js` (barrel) |
| **Recommendation** | MODIFY — Remove `syncRuntimeSurface` call at line 126 and `runtime_surface_sync` references from report at lines 213-216 and artifactRefs at line 269. The init handler's core bootstrap logic (workflow authority, trajectory, recovery) is legitimate and must stay. |
| **Risk if removed** | HIGH — Core init handler. Removing the sync call within it is LOW risk; removing the whole file is HIGH risk. |
| **Evidence** | `init.handler.ts:12` imports `syncRuntimeSurface`. `init.handler.ts:126` calls it. `init.handler.ts:213-216` includes sync result in report. `init.handler.ts:269` lists `runtimeSurfaceSync.pluginFile` in artifactRefs. |

---

### 6. `src/features/runtime-entry/doctor.ts` (161 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/features/runtime-entry/doctor.ts` |
| **Lines** | 161 |
| **Purpose** | Doctor handler — repairs recovery state, creates checkpoints, conditionally calls syncRuntimeSurface when healthy |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/features/runtime-entry/doctor.js` (5668 bytes) |
| **Dependencies (imports)** | `../../context/prompt-packet/index.js`, `../../core/index.js`, `../../governance/index.js`, `../../features/session-entry/start-work-types.js`, `../../recovery/index.js`, `../../cli/runtime-assets.js` (sync), `../../shared/entry-kernel-state.js`, `../../shared/runtime-attachment.js`, `../../shared/contracts/runtime-status.js`, `../../commands/slash-command/command-types.js`, `../../commands/slash-command/index.js`, `./handler-shared.js`, `./instruction-loader.js` |
| **Dependencies (imported by)** | `src/features/runtime-entry/index.js` (barrel), `src/cli/doctor.js` (re-export) |
| **Recommendation** | MODIFY — Remove `syncRuntimeSurface` call at line 99 and conditional `runtimeSurfaceSync` references at lines 125-129, 150, 155. Doctor's repair logic is legitimate. |
| **Risk if removed** | HIGH — Core doctor handler. Removing the sync call within it is LOW risk. |
| **Evidence** | `doctor.ts:6` imports `syncRuntimeSurface`. `doctor.ts:98-100` conditionally calls it. `doctor.ts:125-129` includes sync result in report. `doctor.ts:150` adds to stateTransitions. `doctor.ts:155` adds to artifactRefs. |

---

### 7. `src/features/runtime-observability/sync.ts` (108 lines) — **THE FALSE SYNC**

| Attribute | Value |
|-----------|-------|
| **Path** | `src/features/runtime-observability/sync.ts` |
| **Lines** | 108 |
| **Purpose** | Core "false sync" — writes a 4-line plugin stub to `.opencode/plugins/hivemind-context-governance.ts` and adds plugin path to `opencode.json` plugin array |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/features/runtime-observability/sync.js` (2486 bytes) |
| **Dependencies (imports)** | `node:fs/promises`, `node:path` |
| **Dependencies (imported by)** | `src/cli/runtime-assets.ts:4` (sole direct importer) |
| **Recommendation** | MODIFY or DEPRECATE — This is the "false sync" the user identified. See Special Analysis below. |
| **Risk if removed** | MEDIUM — Only 1 direct consumer (`runtime-assets.ts`), but that consumer is called by 3 sites (cli.ts, init.handler.ts, doctor.ts). |
| **Evidence** | `sync.ts:93-107` — main function. `sync.ts:24-31` — renders stub: `import plugin from 'hivemind-context-governance/plugin'; export default plugin`. `sync.ts:59-91` — `syncPluginConfig` adds `.opencode/plugins/hivemind-context-governance.ts` to `opencode.json` plugin array. |

---

### 8. `scripts/sync-agent-registry.ts.deprecated` (28 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `scripts/sync-agent-registry.ts.deprecated` |
| **Lines** | 28 |
| **Purpose** | Regenerates `.opencode/agents/*.md` runtime projections from canonical `agents/*.deprecated.md` sources |
| **ALIVE/DEAD** | DEAD — file extension `.deprecated`, not referenced in `package.json` scripts, not in lint:boundary, not in test. |
| **Dependencies (imports)** | `node:fs`, `node:path`, `../src/shared/opencode-agent-registry.js` |
| **Dependencies (imported by)** | NONE — no live consumers. |
| **Companion files** | `scripts/check-agent-registry-parity.sh.deprecated` (8 lines), `scripts/check-agent-registry-parity.ts.deprecated` (35 lines) — both also DEAD |
| **Recommendation** | REMOVE — Already deprecated. Safe to delete all 3 `.deprecated` files. |
| **Risk if removed** | LOW — Confirmed no references in scripts, CI, or source code. The `.deprecated` extension is explicit tombstone. |
| **Evidence** | `scripts/sync-agent-registry.ts.deprecated:1-28` — imports `createOpencodeAgentRegistry` from `src/shared/opencode-agent-registry.js`. Grep for `sync-agent-registry` in source: 0 matches in `src/`. Grep in `package.json` scripts: 0 matches. `scripts/check-agent-registry-parity.sh.deprecated:8` calls deleted `check-agent-registry-parity.ts`. |

---

### 9. `bin/hivemind-tools.cjs` (1422 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `bin/hivemind-tools.cjs` |
| **Lines** | 1422 |
| **Purpose** | Standalone legacy CJS CLI — ecosystem verification, path tracing, state inspection, validation, source auditing, session management |
| **ALIVE/DEAD** | ALIVE as shipped asset (in `package.json` `"files": ["bin"]`), but NOT part of `dist/cli.js`. Orphaned from the TypeScript CLI pipeline. |
| **Dependencies (imports)** | `fs`, `path`, `child_process`, `os` (all Node built-ins — zero external deps) |
| **Dependencies (imported by)** | NONE in source code. Referenced in documentation/planning artifacts only. Not in `package.json` scripts. Not in bin entries. |
| **Recommendation** | DEPRECATE — See Special Analysis below. |
| **Risk if removed** | LOW — No source code imports it. Not in bin entries. Not in scripts. Only referenced in `.hivemind/` session artifacts (documentation). Ships via `"files": ["bin"]` in package.json but no consumer requires it. |
| **Evidence** | `package.json` `"files"` includes `"bin"` directory (only file: `hivemind-tools.cjs`). `package.json` `"scripts"` — no reference to `hivemind-tools.cjs`. `package.json` `"bin"` — 7 entries all → `dist/cli.js`. Grep for `hivemind-tools` in `src/`: 0 matches. |

---

### 10. `src/control-plane/control-plane-registry.ts` (268 lines)

| Attribute | Value |
|-----------|-------|
| **Path** | `src/control-plane/control-plane-registry.ts` |
| **Lines** | 268 |
| **Purpose** | Registers 4 control-plane primitives (hm-init, hm-doctor, hm-harness, hm-settings) with keyword detection, binary aliases, and gate resolution |
| **ALIVE/DEAD** | ALIVE — compiled to `dist/control-plane/control-plane-registry.js` |
| **Dependencies (imports)** | `../features/session-entry/start-work-types.js`, `../shared/pressure-contract.js`, `./control-plane-types.js` |
| **Dependencies (imported by)** | `src/cli/command-routing.ts:2` (CONTROL_PLANE_CLI_COMMANDS, discoverControlPlanePrimitives), `src/features/runtime-entry/init.handler.ts:10` (findControlPlanePrimitive), `src/control-plane/index.js` (barrel), `src/control-plane/control-plane-intake.js`, `src/control-plane/control-plane-handler.js` |
| **Recommendation** | KEEP — Core control plane infrastructure. No sync-related code. All 4 primitives are legitimate. |
| **Risk if removed** | HIGH — Central command registration. Removing breaks CLI dispatch, gate resolution, and intake. |
| **Evidence** | `control-plane-registry.ts:132-221` — defines 4 primitives. `control-plane-registry.ts:223` — exports `CONTROL_PLANE_CLI_COMMANDS`. `control-plane-registry.ts:225-267` — discovery and gate resolution functions. No sync references. |

---

## Special Analysis: The "False Sync"

### What does `syncRuntimeSurface()` actually write?

The function in `src/features/runtime-observability/sync.ts:93-107` does exactly two things:

1. **Writes a plugin stub file** (`sync.ts:102`):
   - Creates `.opencode/plugins/hivemind-context-governance.ts` with content:
     ```typescript
     import plugin from 'hivemind-context-governance/plugin'
     export default plugin
     ```
   - Uses `writeFileIfChanged` to avoid unnecessary writes.

2. **Updates `opencode.json`** (`sync.ts:105` → `sync.ts:59-91`):
   - Reads `opencode.json`
   - Ensures `plugin` array exists
   - Adds `.opencode/plugins/hivemind-context-governance.ts` to the array if not present
   - Writes back

### What calls it?

| Caller | File:Line | Context |
|--------|-----------|---------|
| CLI `sync` command | `src/cli.ts:170` | `result = await syncRuntimeSurface(directory)` |
| Init handler | `src/features/runtime-entry/init.handler.ts:126` | `const runtimeSurfaceSync = await syncRuntimeSurface(input.projectRoot)` |
| Doctor handler | `src/features/runtime-entry/doctor.ts:99` | Conditional: only when `repaired.status === 'healthy'` |

The chain is: `src/cli.ts` → `src/cli/runtime-assets.ts` → `src/features/runtime-observability/sync.ts`.

### Does it conflict with the hivefiver approach?

**YES.** The false sync has two conflicts:

1. **Writes to `.opencode/plugins/`** — The AGENTS.md `.opencode/ Write Prohibition` states: "Direct file writes to `.opencode/` directory are **prohibited** without explicit user confirmation." This function writes to `.opencode/plugins/` without any permission check.

2. **Mutates `opencode.json`** — The function modifies the user's config file by pushing plugin paths into the array. This is a state mutation that should go through `permission.ask` or `context.ask()` but doesn't.

3. **Redundant with npm install** — The plugin is registered via `package.json` bin entries (7 aliases all → `dist/cli.js`). The `.opencode/plugins/` stub is a legacy mechanism from before the npm bin registration existed.

### What would break if it were removed?

| Impact | What Breaks |
|--------|-------------|
| **CLI `sync` command** | Would need to be removed from `src/cli.ts:169-171` and `command-routing.ts:4,14` |
| **Init handler** | Would lose `runtime_surface_sync.pluginFile` from report (line 213-216) and artifactRefs (line 269). **No functional breakage** — the init handler's core bootstrap logic doesn't depend on sync output. |
| **Doctor handler** | Would lose `runtimeSurfaceSync` from report (lines 125-129) and stateTransitions (line 150). **No functional breakage** — the repair logic doesn't depend on sync output. |
| **Plugin loading** | OpenCode already loads plugins via `package.json` bin registration. The `.opencode/plugins/` stub is a secondary/legacy path. Removing it means OpenCode only uses the primary bin-based registration. |

### Recommendation

**MODIFY**: Remove the false sync entirely. Steps:
1. Remove `syncRuntimeSurface` call from `init.handler.ts:126` and report/artifactRefs references
2. Remove `syncRuntimeSurface` call from `doctor.ts:99` and related report/stateTransitions/artifactRefs
3. Remove `sync` command case from `src/cli.ts:169-171` and import at line 10
4. Remove `'sync'` from `CLI_COMMANDS` and `'hm-sync': 'sync'` from `BINARY_ALIASES` in `command-routing.ts`
5. Remove `hm-sync` from `package.json` bin entries
6. Delete `src/cli/runtime-assets.ts` (the bridge wrapper)
7. Either refactor `src/features/runtime-observability/sync.ts` to be read-only (status check) or delete it

---

## Special Analysis: `bin/hivemind-tools.cjs`

### Does it have unique functionality?

**YES.** The CJS file has functionality NOT present in the TypeScript CLI:

| Command | CJS Feature | TypeScript CLI Equivalent |
|---------|-------------|--------------------------|
| `trace-paths` | Shows all `.hivemind/` paths with existence checks | NONE |
| `verify-install` | Checks `.hivemind/` core files, brain schema, config schema, plugin registration | NONE |
| `migrate-check` | Detects old structures (legacy planning dir, flat hierarchy, no manifest) | NONE |
| `inspect brain` | Pretty-prints brain.json state | NONE |
| `inspect tree` | ASCII hierarchy tree renderer | NONE |
| `inspect config` | Pretty-prints config.json | NONE |
| `inspect sessions` | Lists sessions with manifest | NONE |
| `inspect detection` | Shows detection counters/flags | NONE |
| `state load/get/hierarchy` | JSON state queries with dot notation | NONE |
| `session active/history/trace` | Session management, stamp grep | NONE |
| `config get` | Dot-notation config reader | NONE |
| `validate schema/chain/stamps` | JSON schema validation, hierarchy chain check, stamp validation | NONE |
| `ecosystem-check` | Full 9-step chain verification (install→init→config→brain→hierarchy→plugin→hooks→tools→semantic) | NONE |
| `source-audit` | Maps `src/` files to responsibilities | NONE |
| `filetree` | Lists `.hivemind/` file tree | NONE |

The TypeScript CLI only has: `init`, `doctor`, `settings`, `harness`, `sync`.

### Does anything reference or call it?

- **Source code:** 0 references in `src/`
- **package.json scripts:** 0 references
- **package.json bin:** NOT registered (only `dist/cli.js` aliases)
- **Documentation:** Referenced extensively in `.hivemind/` session artifacts and `packed-hivemind-codebase.zip.xml` (historical planning docs)
- **npm distribution:** Shipped via `"files": ["bin"]` — consumers get it but nothing calls it automatically

### Recommendation

**DEPRECATE** — The CJS file is a diagnostic/inspection tool with legitimate unique functionality, but it's:
1. CJS in an ESM project
2. Not integrated into the TypeScript CLI pipeline
3. Not referenced by any source code
4. Not in any npm scripts or bin entries
5. 1422 lines of untested, untyped JavaScript

**Options:**
- **Option A (recommended):** Rename to `bin/hivemind-tools.cjs.deprecated` (tombstone). Port the most valuable commands (`ecosystem-check`, `validate`, `inspect`) into the TypeScript CLI as a `diagnose` or `inspect` command in a future phase.
- **Option B:** Leave as-is but remove from `"files"` in package.json so it stops shipping to consumers.
- **Option C:** Rewrite as TypeScript in `src/cli/inspect.ts` — but this is a separate phase of work.

---

## Summary Table

| # | File | Lines | Status | Recommendation | Risk | Key Evidence |
|---|------|-------|--------|----------------|------|-------------|
| 1 | `src/cli.ts` | 194 | ALIVE | MODIFY | HIGH | Remove sync command case + import |
| 2 | `src/cli/command-routing.ts` | 50 | ALIVE | MODIFY | HIGH | Remove sync from CLI_COMMANDS + BINARY_ALIASES |
| 3 | `src/cli/init.ts` | 2 | ALIVE | KEEP | LOW | Trivial barrel, harmless |
| 4 | `src/cli/runtime-assets.ts` | 26 | ALIVE | REMOVE | MEDIUM | Sync bridge — 3 callers must update |
| 5 | `src/features/runtime-entry/init.handler.ts` | 275 | ALIVE | MODIFY | HIGH | Remove sync call at line 126, keep bootstrap logic |
| 6 | `src/features/runtime-entry/doctor.ts` | 161 | ALIVE | MODIFY | HIGH | Remove sync call at line 99, keep repair logic |
| 7 | `src/features/runtime-observability/sync.ts` | 108 | ALIVE | MODIFY/DEPRECATE | MEDIUM | The "false sync" — rewrite as read-only or delete |
| 8 | `scripts/sync-agent-registry.ts.deprecated` | 28 | DEAD | REMOVE | LOW | + 2 companion `.deprecated` files, zero consumers |
| 9 | `bin/hivemind-tools.cjs` | 1422 | ORPHAN | DEPRECATE | LOW | Unique functionality, no consumers, CJS in ESM project |
| 10 | `src/control-plane/control-plane-registry.ts` | 268 | ALIVE | KEEP | HIGH | Core command registration, no sync references |

**Total lines across all files:** 2,534
**Lines that are ALIVE and need modification:** ~718 (files 1,2,4,5,6,7)
**Lines that are DEAD or ORPHAN:** ~1,478 (files 8,9)

---

## Blocked Routes

None. All 10 files were readable and analyzed.

## Recommended Next Action

Phase 10 of the hivefiver plan ("Legacy removal") should execute these steps in order:
1. Remove 3 `.deprecated` scripts (file 8) — zero risk
2. Remove `syncRuntimeSurface` from init handler (file 5) and doctor handler (file 6)
3. Remove `sync` command from CLI dispatch (file 1) and routing (file 2)
4. Delete `src/cli/runtime-assets.ts` (file 4)
5. Refactor or delete `src/features/runtime-observability/sync.ts` (file 7)
6. Remove `hm-sync` from `package.json` bin entries
7. Deprecate `bin/hivemind-tools.cjs` (file 9) — rename or remove from `"files"`
8. Run `npx tsc --noEmit` + `npm test` gate
