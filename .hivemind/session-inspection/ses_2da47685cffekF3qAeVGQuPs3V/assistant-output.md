# Session Inspection Export

- ses_id: `ses_2da47685cffekF3qAeVGQuPs3V`
- prepared_at: `2026-03-25T16:03:37.249Z`

## Assistant Output

Now I have all the data needed. Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Legacy CLI init code (hm-init, hm-doctor, hm-settings, hm-harness, hm-sync) in `/Users/apple/hivemind-plugin/.worktrees/product-detox/`
**Question:** Find ALL legacy CLI init command implementations, sync assets, initialization/bootstrap code, compiled dist output, and command markdown files.

---

### Findings

#### 1. CLI Entry Point

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | Main CLI entry — dispatches init/doctor/settings/harness/sync commands | `src/cli.ts` | 1-194 | `#!/usr/bin/env node` entry, `runCli()` dispatches to `initProject`, `runDoctorCommand`, `runSettingsCommand`, `runHarnessCommand`, `syncRuntimeSurface` based on resolved command |
| 2 | Compiled CLI binary (ALIVE) | `dist/cli.js` | 1 | 7815 bytes, executable — this is what `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, `hm-sync` all point to |

#### 2. CLI Command Routing

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 3 | Command routing — resolves binary aliases to CLI commands | `src/cli/command-routing.ts` | 1-50 | Maps `hm-init`→`init`, `hm-doctor`→`doctor`, `hm-settings`→`settings`, `hm-harness`→`harness`, `hm-sync`→`sync`. Compiled to `dist/cli/command-routing.js` |

#### 3. CLI Thin Re-Export Wrappers (src/cli/)

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 4 | Init re-export | `src/cli/init.ts` | 1-2 | `export { initProject } from '../features/runtime-entry/index.js'` — thin barrel |
| 5 | Doctor re-export | `src/cli/doctor.ts` | 1-2 | `export { runDoctorCommand } from '../features/runtime-entry/index.js'` — thin barrel |
| 6 | Settings re-export | `src/cli/settings.ts` | 1-116 | **Substantive** — `updateProjectSettings()` and `runSettingsCommand()` with intake gate logic |
| 7 | Harness re-export | `src/cli/harness.ts` | 1-2 | `export { runHarnessCommand } from '../features/runtime-entry/index.js'` — thin barrel |
| 8 | Runtime assets sync wrapper | `src/cli/runtime-assets.ts` | 1-26 | `syncRuntimeSurface()` wraps `../features/runtime-observability/sync.js` with package-specific options. Compiled to `dist/cli/runtime-assets.js` |

All compiled to `dist/cli/*.js` — **ALIVE**.

#### 4. Feature Implementation — Runtime Entry (src/features/runtime-entry/)

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 9 | Init barrel/decoupler | `src/features/runtime-entry/init.ts` | 1-25 | Re-exports from `init.types.js`, `init.helpers.js`, `init-project.js`, `init.handler.js` |
| 10 | Init types | `src/features/runtime-entry/init.types.ts` | 1-57 | `InitOptions`, `InitProjectResult` interfaces |
| 11 | Init helpers | `src/features/runtime-entry/init.helpers.ts` | 1-37 | `buildInitReport()`, `createRuntimeId()` |
| 12 | **Init project entry** | `src/features/runtime-entry/init-project.ts` | 1-126 | `initProject()` — CLI entry point for hm-init. Resolves intake gates, executes hm-init command bundle |
| 13 | **Init handler** | `src/features/runtime-entry/init.handler.ts` | 1-275 | `runInitHandler()` — Deep handler that bootstraps workflow authority, trajectory ledger, recovery checkpoint, planning projection, calls `syncRuntimeSurface` (line 126) |
| 14 | **Doctor CLI entry** | `src/features/runtime-entry/doctor.ts` | 41-71 | `runDoctorCommand()` — finds hm-doctor bundle, executes it |
| 15 | **Doctor handler** | `src/features/runtime-entry/doctor.ts` | 73-161 | `runDoctorHandler()` — repairs recovery state, syncs runtime surface (line 99), creates checkpoint |
| 16 | Settings handler | `src/features/runtime-entry/settings.ts` | 1-21 | `runSettingsHandler` imported from here. Contains settings business logic |
| 17 | Feature barrel | `src/features/runtime-entry/index.ts` | 1-11 | Re-exports all runtime-entry modules including init, doctor, harness, settings |

All compiled to `dist/features/runtime-entry/*.js` — **ALIVE**.

#### 5. Sync/Runtime Assets

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 18 | **Core sync implementation** | `src/features/runtime-observability/sync.ts` | 1-108 | `syncRuntimeSurface()` — creates `.opencode/plugins/hivemind-context-governance.ts` stub, updates `opencode.json` plugin array. Writes files via `mkdir` + `writeFile`. Compiled to `dist/features/runtime-observability/sync.js` — **ALIVE** |
| 19 | Sync callers | `src/features/runtime-entry/init.handler.ts` | 12, 126 | `import { syncRuntimeSurface } from '../../cli/runtime-assets.js'` — called during init |
| 20 | Sync callers | `src/features/runtime-entry/doctor.ts` | 6, 99 | `import { syncRuntimeSurface } from '../../cli/runtime-assets.js'` — called during doctor when healthy |
| 21 | Sync CLI command | `src/cli.ts` | 169-171 | `case 'sync': result = await syncRuntimeSurface(directory)` |

#### 6. Control Plane Layer

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 22 | **Control plane handler dispatch** | `src/control-plane/control-plane-handler.ts` | 1-32 | Routes `hm-init`→`runInitHandler`, `hm-doctor`→`runDoctorHandler`, `hm-harness`→`runHarnessHandler`, `hm-settings`→`runSettingsHandler` |
| 23 | **Control plane registry** | `src/control-plane/control-plane-registry.ts` | 1-268 | Registers all 4 primitives with keywords, binary aliases, CLI commands, detection logic. Compiled to `dist/control-plane/` — **ALIVE** |
| 24 | Control plane types | `src/control-plane/control-plane-types.ts` | 4 | `type ControlPlanePrimitiveId = 'hm-init' \| 'hm-doctor' \| 'hm-harness' \| 'hm-settings'` |

#### 7. Command Bundle Registry

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 25 | **hm-init bundle** | `src/commands/slash-command/command-bundles.ts` | 5-22 | `id: 'hm-init'`, `commandFile: 'hm-init.md'`, `controlPlanePrimitiveId: 'hm-init'` |
| 26 | **hm-doctor bundle** | `src/commands/slash-command/command-bundles.ts` | 23-40 | `id: 'hm-doctor'`, `commandFile: 'hm-doctor.md'` |
| 27 | **hm-harness bundle** | `src/commands/slash-command/command-bundles.ts` | 41-58 | `id: 'hm-harness'`, `commandFile: 'hm-harness.md'` |
| 28 | **hm-settings bundle** | `src/commands/slash-command/command-bundles.ts` | 59-76 | `id: 'hm-settings'`, `commandFile: 'hm-settings.md'` |

#### 8. Command Markdown Files

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 29 | hm-init command (root) | `commands/hm-init.md` | 1-60 | Bootstrap control plane command — references `hivemind_runtime_command` with `command: "hm-init"` |
| 30 | hm-doctor command (root) | `commands/hm-doctor.md` | 1-39 | Repair command — diagnose, repair, recovery path |
| 31 | hm-settings command (root) | `commands/hm-settings.md` | 1-57 | Settings reconfiguration — references `hivemind_runtime_command` with `command: "hm-settings"` |
| 32 | hm-init command (.opencode) | `.opencode/commands/hm-init.md` | 1 | Mirror of root — **NOISE**: `.opencode/commands/` is dev projection, not shipped |
| 33 | hm-doctor command (.opencode) | `.opencode/commands/hm-doctor.md` | 1 | Mirror — **NOISE** |
| 34 | hm-settings command (.opencode) | `.opencode/commands/hm-settings.md` | 1 | Mirror — **NOISE** |

#### 9. package.json Binary Declarations

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 35 | **All 6 CLI binaries** | `package.json` | 18-26 | `hivemind-context-governance`, `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, `hm-sync` — ALL point to `dist/cli.js` |

#### 10. bin/ Directory

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 36 | **hivemind-tools.cjs** | `bin/hivemind-tools.cjs` | 1-1406+ | Separate legacy CLI tool (CJS). Contains `trace-paths`, `verify-install`, `migrate-check`, `inspect`, `validate`, `ecosystem-check`, `source-audit`. References `.hivemind/` init concepts (line 269: "`.hivemind/ directory missing — run \`hivemind init\`'"). NOT compiled to dist — **SEPARATE** from the main CLI |

#### 11. Deprecated Sync Scripts

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 37 | **Agent registry sync (DEAD)** | `scripts/sync-agent-registry.ts.deprecated` | 1-28 | Regenerates `.opencode/agents/*.md` from canonical `agents/*.deprecated.md`. Uses `createOpencodeAgentRegistry`. File extension `.deprecated` — **DEAD** |
| 38 | **Agent registry parity check (DEAD)** | `scripts/check-agent-registry-parity.sh.deprecated` | 1-8 | Shell script that runs the deprecated sync script — **DEAD** |

#### 12. .hivemind/ Directory Bootstrap

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 39 | No explicit `.hivemind/` mkdir in init code | `src/features/runtime-entry/` | N/A | The init handler does NOT directly `mkdir .hivemind/`. It delegates to subsystem modules (`bootstrapWorkflowAuthority`, `bootstrapTrajectoryLedger`, `createRecoveryCheckpoint`, etc.) which write to `.hivemind/` subdirectories. The only explicit `mkdir` in sync is for `.opencode/plugins/` (sync.ts line 101) |
| 40 | Test creates `.hivemind/agent-work-contract/` | `src/features/agent-work-contract/tools/export-contract-tool.test.ts` | 178 | `await mkdir(join(projectRoot, '.hivemind', 'agent-work-contract'), { recursive: true })` — test-only |

---

### Structure Map

```
CLI Flow:
  package.json bin → dist/cli.js → src/cli.ts → src/cli/command-routing.ts
                        │
                        ├── init    → src/cli/init.ts → src/features/runtime-entry/init-project.ts → init.handler.ts
                        ├── doctor  → src/cli/doctor.ts → src/features/runtime-entry/doctor.ts
                        ├── settings→ src/cli/settings.ts (substantive, runs via command bundle)
                        ├── harness → src/cli/harness.ts → src/features/runtime-entry/harness.ts
                        └── sync    → src/cli/runtime-assets.ts → src/features/runtime-observability/sync.ts

Control Plane:
  src/control-plane/control-plane-registry.ts  (primitives, detection, keywords)
  src/control-plane/control-plane-handler.ts    (routes to handler functions)
  src/control-plane/control-plane-intake.ts     (profile resolution, gates)

Command Contracts:
  commands/hm-init.md        (root projection — LIVE, registered)
  commands/hm-doctor.md      (root projection — LIVE, registered)
  commands/hm-settings.md    (root projection — LIVE, registered)
  .opencode/commands/*.md    (dev mirror — NOISE, not authoritative)

bin/hivemind-tools.cjs       (separate legacy CJS CLI — NOT part of dist/cli.js)
scripts/*.deprecated         (DEAD sync scripts)
```

### Summary: ALIVE vs DEAD

| Status | Files |
|--------|-------|
| **ALIVE** (compiled to `dist/`) | `src/cli.ts`, `src/cli/init.ts`, `src/cli/doctor.ts`, `src/cli/settings.ts`, `src/cli/harness.ts`, `src/cli/runtime-assets.ts`, `src/cli/command-routing.ts`, `src/features/runtime-entry/*.ts`, `src/features/runtime-observability/sync.ts`, `src/control-plane/*` |
| **ALIVE** (shipped as-is) | `commands/hm-init.md`, `commands/hm-doctor.md`, `commands/hm-settings.md`, `bin/hivemind-tools.cjs` |
| **DEAD** (deprecated) | `scripts/sync-agent-registry.ts.deprecated`, `scripts/check-agent-registry-parity.sh.deprecated` |
| **NOISE** (dev-only mirror) | `.opencode/commands/hm-init.md`, `.opencode/commands/hm-doctor.md`, `.opencode/commands/hm-settings.md` |