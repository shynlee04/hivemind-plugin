# BOOT-02 — CLI Commands Implementation Plan

**Date:** 2026-05-07 | **Status:** PLAN — AWAITING AUTHORIZATION
**Phase:** BOOT-02 (CLI Framework + Entry Point)
**Parent:** CA-04.1 Bootstrap CLI + Primitives Recovery
**Evidence Level:** L5 (planning artifact only)
**Source spec:** `.planning/specs/bootstrap-cli-spec-2026-05-07.md` — 42 REQs, BOOT-02 through BOOT-07
**Locked decisions:** D1–D7 (`.planning/research/bootstrap-cli-grey-areas-2026-05-07.md`)
**Ecosystem research:** `.planning/research/bootstrap-cli-ecosystem-research-2026-05-07.md`
**Roadmap:** `.planning/ROADMAP.md:58-67`

---

## 0. Plan Overview

BOOT-02 delivers four new CLI commands (`init`, `doctor`, `recover`, `version`) as `CliCommand` handlers on the existing Phase 40 CLI substrate, plus CQRS-compliant write-side tools for directory creation and symlink restoration. All commands are registered via the existing `discoverCommands` → `buildHarnessCli()` pipeline. No framework dependency is introduced. No existing router, discovery, or renderer module is modified.

BOOT-02 wraps BOOT-03 (State Init), BOOT-04 (Primitives Recovery), and BOOT-05 (Config Bootstrap) as sub-tasks because `init` is the single entry point that triggers all three: directory creation, symlink creation, and config file writing. The plan sequences them so the `init` command handler calls into the registered tools.

---

## 1. Task Breakdown

| ID | Task | Files to Create/Modify | Dependencies | Target LOC | REQ Coverage |
|----|------|------------------------|--------------|------------|-------------|
| **T01** | Shared bootstrap structure constants | `src/lib/bootstrap-structure.ts` (CREATE) | None (leaf) | ~80 | REQ-BOOT02-02, REQ-BOOT03-01, REQ-BOOT04-01 |
| **T02** | Write-side tool: `.hivemind/` directory + config creation | `src/tools/bootstrap-init.ts` (CREATE) | T01 | ~120 | REQ-BOOT02-02, REQ-BOOT03-01/02/04, REQ-BOOT05-01/02 |
| **T03** | Write-side tool: `.opencode/` symlink creation/restoration | `src/tools/bootstrap-recover.ts` (CREATE) | T01 | ~100 | REQ-BOOT02-07/08, REQ-BOOT04-01/02/04 |
| **T04** | `init` command handler | `src/cli/commands/init.ts` (CREATE) | T02, T03 | ~150 | REQ-BOOT02-01/02/03/04, REQ-BOOT03-03 |
| **T05** | `doctor` command handler | `src/cli/commands/doctor.ts` (CREATE) | T01 | ~200 | REQ-BOOT02-01/05/06, REQ-BOOT04-03, REQ-BOOT05-03/04, REQ-BOOT06-01/02/03/04/05/06/07/08/09 |
| **T06** | `recover` command handler | `src/cli/commands/recover.ts` (CREATE) | T03 | ~80 | REQ-BOOT02-01/07/08, REQ-BOOT04-02 |
| **T07** | `version` command handler | `src/cli/commands/version.ts` (CREATE) | None (leaf) | ~30 | REQ-BOOT02-01/09 |
| **T08** | Wire commands into CLI entry point | `src/cli/index.ts` (MODIFY — add imports + extraCommands) | T04, T05, T06, T07 | +15 | REQ-BOOT02-01/10 |
| **T09** | Contract tests: `init` command | `tests/cli/commands/init.test.ts` (CREATE) | T04 | ~100 | REQ-BOOT02-01/02/04, REQ-X03 |
| **T10** | Contract tests: `doctor` command | `tests/cli/commands/doctor.test.ts` (CREATE) | T05 | ~120 | REQ-BOOT02-01/05/06 |
| **T11** | Contract tests: `recover` command | `tests/cli/commands/recover.test.ts` (CREATE) | T06 | ~100 | REQ-BOOT02-01/07/08 |
| **T12** | Contract tests: `version` command | `tests/cli/commands/version.test.ts` (CREATE) | T07 | ~40 | REQ-BOOT02-01/09 |
| **T13** | Integration test: help lists all commands | `tests/cli/runCli.test.ts` (MODIFY — add 1 test case) | T08 | +20 | REQ-BOOT02-10 |

**Total NEW files:** 10 | **Total MODIFIED files:** 2 | **Total new LOC:** ~1,080 (all under 500 LOC cap per module)

---

## 2. Dependency Graph

```
                  ┌─────────┐
                  │   T01   │  src/lib/bootstrap-structure.ts (LEAF)
                  └────┬────┘
                       │
          ┌────────────┼────────────┐
          ▼            │            ▼
     ┌─────────┐       │      ┌──────────┐
     │   T02   │       │      │   T03    │  src/tools/ (CQRS write-side)
     └────┬────┘       │      └────┬─────┘
          │            │           │
          ▼            │           ▼
     ┌─────────┐       │      ┌──────────┐
     │   T04   │       │      │   T06    │  Wave 2: commands (PARALLEL)
     │  init   │◄──────┼──────│ recover  │
     └────┬────┘       │      └────┬─────┘
          │            │           │
          │       ┌────┴────┐      │
          │       │   T05   │      │
          │       │ doctor  │      │
          │       └────┬────┘      │
          │            │           │    ┌──────────┐
          │            │           │    │   T07    │  version (LEAF, no deps)
          │            │           │    │ version  │
          │            │           │    └────┬─────┘
          └────────────┼───────────┼─────────┘
                       │           │
                       ▼           ▼
                  ┌──────────────────────┐
                  │        T08           │  Wave 3: registration
                  │  src/cli/index.ts    │  (MODIFY buildHarnessCli)
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌─────────┐   ┌─────────┐   ┌──────────┐
         │   T09   │   │   T10   │   │   T11    │  Wave 4: tests (PARALLEL)
         │  init   │   │ doctor  │   │ recover  │
         │  .test  │   │ .test   │   │  .test   │
         └─────────┘   └─────────┘   └──────────┘
              │              │              │
              ▼              ▼              ▼
         ┌─────────┐   ┌──────────────────────┐
         │   T12   │   │        T13           │
         │ version │   │  runCli.test.ts      │
         │  .test  │   │  (MODIFY: +1 test)   │
         └─────────┘   └──────────────────────┘
```

**Wave summary:**

| Wave | Tasks | Execution Mode | Gate |
|------|-------|---------------|------|
| **W0** | T01 | Sequential (leaf) | — |
| **W1** | T02, T03 | Parallel (both dep T01 only) | T01 passing |
| **W2** | T04, T05, T06, T07 | Parallel (each deps T01–T03 as needed) | T02, T03 passing |
| **W3** | T08 | Sequential (deps all of W2) | T04–T07 passing |
| **W4** | T09, T10, T11, T12, T13 | Parallel (all deps W2/W3) | T08 passing |

**Total waves:** 5 | **Max parallel tasks in a wave:** 5 | **Total tasks:** 13

---

## 3. Task Detail

### T01 — Shared Bootstrap Structure Constants

**File:** `src/lib/bootstrap-structure.ts` (CREATE)
**Dependencies:** None (leaf module — imports only `src/lib/types.ts`)
**Target LOC:** ~80

**Exports:**
- `TIER_1_DIRECTORIES: readonly string[]` — `["state", "delegation", "event-tracker"]`
- `HIVE_MIND_DIR: ".hivemind"`
- `GITKEEP_FILE: ".gitkeep"`
- `DEFAULT_CONFIG_JSON: string` — `{ "$schema": "./configs.schema.json" }\n`
- `META_BUILDER_DIR: ".hivefiver-meta-builder"`
- `OPEN_CODE_DIR: ".opencode"`
- `PRIMITIVE_TYPES: readonly string[]` — `["agents", "skills", "commands"]`
- `DOCTOR_CHECKS: readonly string[]` — `["structure", "symlinks", "config", "sdk"]` (P0 only for BOOT-02)
- Helper: `resolveHiveMindRoot(projectRoot: string): string` → `${projectRoot}/.hivemind`
- Helper: `resolveOpenCodeRoot(projectRoot: string): string` → `${projectRoot}/.opencode`
- Helper: `resolveMetaBuilderRoot(projectRoot: string): string` → `${projectRoot}/.hivefiver-meta-builder`

**No runtime side effects.** Pure constants + path helpers. Conforms to `AGENTS.md` kebab-case module naming.

**Verification:** `npx vitest run tests/lib/bootstrap-structure.test.ts` (if created) or manual import check via `node -e "require('./dist/lib/bootstrap-structure.js')"` after build.

---

### T02 — Write-Side Tool: `.hivemind/` Directory + Config Creation

**File:** `src/tools/bootstrap-init.ts` (CREATE)
**Dependencies:** T01 (`src/lib/bootstrap-structure.ts`), `node:fs`, `node:path`
**Target LOC:** ~120

**Exports:**
```ts
export type InitResult = {
  status: "ok" | "already-initialized" | "error"
  created: string[]   // paths that were newly created
  existed: string[]   // paths that already existed
  errors: string[]    // paths that failed with error
}

export async function initHiveMind(projectRoot: string): Promise<InitResult>
export async function writeDefaultConfig(projectRoot: string): Promise<{ created: boolean }>
```

**Behavior (BOOT-02 → delegates to BOOT-03 implementation):**
- `initHiveMind()`: For each `TIER_1_DIRECTORIES` entry in `resolveHiveMindRoot(projectRoot)`:
  - If directory does not exist → `fs.mkdirSync({ recursive: true })` → write `.gitkeep` → add to `created[]`
  - If directory exists → add to `existed[]`
  - Non-destructive: never overwrites existing files
- `writeDefaultConfig()`: If `.hivemind/configs.json` does not exist → atomically write `DEFAULT_CONFIG_JSON` (write to `.tmp` → rename). If exists → return `{ created: false }`.

**CQRS boundary:** This is a `src/tools/` module — it has CQRS write authority. The `init` command handler (T04) calls this tool but does NOT perform filesystem writes directly.

**Module cap check:** Must stay under 500 LOC. If init logic grows beyond 500 LOC, split into `src/tools/bootstrap-init.ts` (tool entry) + `src/lib/bootstrap-init-impl.ts` (business logic).

**Verification:** `npx vitest run tests/tools/bootstrap-init.test.ts` — or contract test via T09.

---

### T03 — Write-Side Tool: `.opencode/` Symlink Creation/Restoration

**File:** `src/tools/bootstrap-recover.ts` (CREATE)
**Dependencies:** T01 (`src/lib/bootstrap-structure.ts`), `node:fs`, `node:path`
**Target LOC:** ~100

**Exports:**
```ts
export type SymlinkEntry = {
  sourcePath: string    // relative path from .hivefiver-meta-builder/
  targetPath: string    // relative path in .opencode/
  status: "ok" | "broken" | "missing" | "skipped"
  reason?: string       // why skipped or broken
}

export type RecoverResult = {
  created: SymlinkEntry[]
  skipped: SymlinkEntry[]
  errors: string[]
}

export async function createPrimitiveSymlinks(
  projectRoot: string,
  options?: { replaceBroken?: boolean }
): Promise<RecoverResult>

export async function restoreMissingSymlinks(
  projectRoot: string
): Promise<RecoverResult>
```

**Behavior:**
- Walk `.hivefiver-meta-builder/agents/`, `skills/`, `commands/`
- For each entry, determine expected `.opencode/<type>/<name>` symlink target: `../.hivefiver-meta-builder/<type>/<name>` (relative path)
- `fs.lstatSync()` → if existing entry is a symlink and resolves correctly → `ok`
- If symlink is broken → `replaceBroken ? create : skip`
- If missing → create symlink
- If existing non-symlink file → skip with warning (D4: never overwrite)
- Symlinks use relative paths only (project remains relocatable)

**CQRS boundary:** Write-side tool. Only tools create symlinks. Doctor (T05) is read-only.

**Verification:** `npx vitest run tests/tools/bootstrap-recover.test.ts` — or contract test via T11.

---

### T04 — `init` Command Handler

**File:** `src/cli/commands/init.ts` (CREATE)
**Dependencies:** T02 (`src/tools/bootstrap-init.ts`), T03 (`src/tools/bootstrap-recover.ts`), T01 (`src/lib/bootstrap-structure.ts`), `node:path`, `node:process`
**Target LOC:** ~150

**Command shape:**
```ts
export const initCommand: CliCommand = {
  name: "init",
  summary: "Initialize Hivemind project structure",
  handler: async (ctx: CliCommandContext) => { /* ... */ }
}
```

**Flags accepted:**
- `--yes` / `-y` → boolean flag. Skip interactive prompts (CI-safe mode).
- `--root=<path>` → string flag. Explicit project root path (skips auto-discovery).
- `--no-symlinks` → boolean flag (optional). Skip symlink creation during init.

**Handler logic:**
1. **Root discovery** (REQ-BOOT03-03):
   - If `--root=<path>` provided → use directly, verify directory exists
   - Else → walk up from `process.cwd()`, looking for `package.json` or existing `.hivemind/`
   - If no root found within filesystem root → `{ exitCode: 64, error: "[Harness] No project root found..." }`
2. **Interactive mode** (REQ-BOOT02-03, P1 — initial stub):
   - If `process.stdout.isTTY && !--yes` → stub for now (deferred P1 wizard).
   - BOOT-02 ships non-interactive mode. `@clack/prompts` integration deferred to BOOT-02.1 (sub-task).
3. **Non-interactive mode** (REQ-BOOT02-04):
   - Call `T02.initHiveMind(root)` → creates Tier 1 dirs + .gitkeep
   - Call `T02.writeDefaultConfig(root)` → writes `configs.json` if not exists
   - Call `T03.createPrimitiveSymlinks(root)` → creates `.opencode/` symlinks
   - Collect results, format output listing "created" vs "existed" paths
   - Return `{ exitCode: 0, output: formattedSummary }`

**Output format:**
```
Hivemind initialized at /path/to/project
  .hivemind/state/ ............... created
  .hivemind/delegation/ .......... created
  .hivemind/event-tracker/ ....... created
  .hivemind/configs.json ......... created

  .opencode/ symlinks ............ created (N/N)
```

**Error handling:** All errors carry `[Harness]` prefix (REQ-X03). Handler errors caught by router → exit 70.

**Verification:** `npx vitest run tests/cli/commands/init.test.ts` (T09).

---

### T05 — `doctor` Command Handler

**File:** `src/cli/commands/doctor.ts` (CREATE)
**Dependencies:** T01 (`src/lib/bootstrap-structure.ts`), `node:fs`, `node:path`, `node:child_process`
**Target LOC:** ~200

**Command shape:**
```ts
export const doctorCommand: CliCommand = {
  name: "doctor",
  summary: "Run Hivemind health checks",
  handler: async (ctx: CliCommandContext) => { /* ... */ }
}
```

**Flags accepted:**
- `--check=<name>` → string flag. Run only the named check. Valid values: `structure`, `symlinks`, `config`, `sdk`. Omitting runs all.

**Handler logic:**
1. Resolve `--check=<name>` flag. If invalid name → `{ exitCode: 64, error: "[Harness] Unknown check: \"<name>\"" }`
2. Execute checks. Each check returns `{ label, status: "PASS" | "FAIL", detail }`:

   **a. Structure check** (REQ-BOOT06-02):
   - Verify `.hivemind/state/.gitkeep`, `.hivemind/delegation/.gitkeep`, `.hivemind/event-tracker/.gitkeep` exist
   - Label: `.hivemind/ structure`
   - Detail: list missing paths if any

   **b. Symlink check** (REQ-BOOT04-03, REQ-BOOT06-03):
   - Walk `.hivefiver-meta-builder/agents/`, `skills/`, `commands/`
   - For each entry, verify `.opencode/<type>/<name>` exists, is a symlink, resolves correctly
   - Label: `.opencode/ symlinks`
   - Detail: `PASS (N/N)` or `FAIL (M/N)` with broken/missing entries listed

   **c. Config check** (REQ-BOOT05-03, REQ-BOOT05-04):
   - If `.hivemind/configs.json` missing → `FAIL — configs.json not found`
   - If present → parse, validate against Zod schema (lazy import `src/schema-kernel/hivemind-configs.schema.ts`)
   - Check `$schema` reference points to an existing file
   - Label: `configs.json`
   - Detail: `PASS` or `FAIL — <Zod error>` or `FAIL — schema file not found`

   **d. SDK check** (REQ-BOOT06-05):
   - Attempt to resolve `@opencode-ai/plugin` → get version
   - Label: `OpenCode SDK`
   - Detail: `PASS (vX.Y.Z)` or `FAIL — @opencode-ai/plugin not found`

3. Format output per REQ-BOOT02-06 template:
   ```
   Hivemind Health Check
   =====================
   .hivemind/ structure ..... PASS
   .opencode/ symlinks ...... PASS (N/N)
   configs.json ............. PASS
   OpenCode SDK ............. PASS (vX.Y.Z)
   TypeScript typecheck ..... PASS
   Test suite ............... PASS (1767/1767)

   Verdict: ALL CHECKS PASS
   ```
4. Exit code = count of FAIL verdicts (REQ-BOOT06-08).

**P1/P2 checks deferred:**
- `typecheck` (REQ-BOOT06-06) — deferred to BOOT-06 extension
- `tests` (REQ-BOOT06-07) — deferred to BOOT-06 extension
- Module count, dependency freshness — P2, deferred

**Read-only guarantee** (REQ-BOOT06-09): Doctor NEVER calls `fs.writeFileSync`, `fs.mkdirSync`, `fs.symlinkSync`, or any write operation. Pure observation only.

**Verification:** `npx vitest run tests/cli/commands/doctor.test.ts` (T10).

---

### T06 — `recover` Command Handler

**File:** `src/cli/commands/recover.ts` (CREATE)
**Dependencies:** T03 (`src/tools/bootstrap-recover.ts`), T01 (`src/lib/bootstrap-structure.ts`)
**Target LOC:** ~80

**Command shape:**
```ts
export const recoverCommand: CliCommand = {
  name: "recover",
  summary: "Restore .opencode/ symlinks from .hivefiver-meta-builder/",
  handler: async (ctx: CliCommandContext) => { /* ... */ }
}
```

**Handler logic:**
1. Discover project root (same walk-up logic as init, or use `--root` flag if added)
2. Call `T03.restoreMissingSymlinks(root)` → get `RecoverResult`
3. Format output showing created/skipped/error counts
4. Return exit code 0 if all symlinks ok, or count of errors if > 0

**Output format:**
```
Symlink Recovery Report
=======================
  agents ................. restored 2, skipped 0, ok 87
  skills ................. restored 0, skipped 0, ok 35
  commands ............... restored 0, skipped 0, ok 18

Verdict: ALL SYMLINKS OK (140/140)
```

**Verification:** `npx vitest run tests/cli/commands/recover.test.ts` (T11).

---

### T07 — `version` Command Handler

**File:** `src/cli/commands/version.ts` (CREATE)
**Dependencies:** None (leaf — imports `node:fs` for `package.json` read)
**Target LOC:** ~30

**Command shape:**
```ts
export const versionCommand: CliCommand = {
  name: "version",
  summary: "Print the harness version",
  aliases: ["--version", "-V"],
  handler: async () => {
    const pkg = JSON.parse(fs.readFileSync(/* resolve package.json from __dirname */, "utf-8"))
    return { exitCode: 0, output: pkg.version }
  }
}
```

**Behavior (REQ-BOOT02-09):**
- Read version from `package.json` at runtime (not hardcoded)
- `hivemind --version` → prints e.g., `1.0.0` → exit 0

**Package.json resolution:** Walk up from `__dirname` (or use `import.meta.url`) to find the nearest `package.json`. The compiled output lives in `dist/cli/commands/version.js`, so the resolved path is `../../package.json` or walk-up discovery.

**Verification:** `npx vitest run tests/cli/commands/version.test.ts` (T12).

---

### T08 — Wire Commands into `buildHarnessCli()`

**File:** `src/cli/index.ts` (MODIFY — add 5 import lines, 4 extraCommands entries)
**Dependencies:** T04, T05, T06, T07
**Target LOC delta:** +15

**Changes:**
1. Add imports:
   ```ts
   import { initCommand } from "./commands/init.js"
   import { doctorCommand } from "./commands/doctor.js"
   import { recoverCommand } from "./commands/recover.js"
   import { versionCommand } from "./commands/version.js"
   ```
2. Modify `buildHarnessCli()` to pass all four new commands as `extraCommands`:
   ```ts
   export function buildHarnessCli(
     extraCommands: readonly CliCommand[] = [],
   ): CliRouter {
     let commands: readonly CliCommand[] = []
     const help = createHelpCommand(() => commands)
     commands = discoverCommands([
       { name: "core", commands: [help, versionCommand] },
       { name: "extras", commands: [initCommand, doctorCommand, recoverCommand, ...extraCommands] },
     ])
     return createRouter({ commands })
   }
   ```

**Design decision:** `versionCommand` goes in `"core"` source so it always appears before extras in help listing. Core order: help → version. Extras order: init → doctor → recover → user-provided.

**Verification:** `hivemind help` lists all 5 commands. `buildHarnessCli().commands().length === 5`.

---

### T09–T13 — Tests

All tests use Vitest globals (`describe`, `it`, `expect`, `vi`). Each test file mirrors the source file at `tests/cli/commands/<name>.test.ts`.

| Task | File | Key Test Cases | REQ Coverage |
|------|------|---------------|-------------|
| **T09** | `tests/cli/commands/init.test.ts` | (a) `initCommand` conforms to `CliCommand` contract (name, summary, handler). (b) `--yes` flag parsed correctly. (c) `--root=<path>` flag parsed correctly. (d) Non-TTY mode does not attempt interactive import. (e) Handler returns exit 0 on success. (f) `[Harness]` prefix on errors. | REQ-BOOT02-01/02/04, REQ-X03 |
| **T10** | `tests/cli/commands/doctor.test.ts` | (a) Conforms to `CliCommand` contract. (b) `--check=structure` routes to correct check. (c) `--check=bogus` returns exit 64. (d) Output matches format template. (e) All PASS → exit 0. (f) One FAIL → exit 1. (g) Zero write operations in handler. | REQ-BOOT02-01/05/06, REQ-BOOT06-01/08/09 |
| **T11** | `tests/cli/commands/recover.test.ts` | (a) Conforms to `CliCommand` contract. (b) Non-destructive: existing file at symlink path → skip + warn. (c) Existing correct symlink → untouched. (d) Missing symlink → created. (e) `[Harness]` prefix on errors. | REQ-BOOT02-01/07/08 |
| **T12** | `tests/cli/commands/version.test.ts` | (a) Conforms to `CliCommand` contract. (b) Output is non-empty string (version). (c) Exit code 0. (d) Reads from `package.json`, not hardcoded. | REQ-BOOT02-01/09 |
| **T13** | `tests/cli/runCli.test.ts` (MODIFY) | Add: "help lists all five commands including init, doctor, recover, version". Assert `stdout` contains all five command names with correct summaries. | REQ-BOOT02-10 |

**Test fixture pattern (from existing `runCli.test.ts`):**
```ts
function mkIO(): { io: CliIO; stdout: string[]; stderr: string[] } { /* ... */ }
```

Tests import command handlers directly (no subprocess spawning). Integration tests for actual directory creation/symlink operations belong in BOOT-03 test suite.

---

## 4. Spec Traceability Matrix

### BOOT-02 Requirements (10 REQs)

| REQ ID | Description | Covered By | Verification |
|--------|-------------|-----------|-------------|
| REQ-BOOT02-01 | Command registration via existing router | T08, T04–T07 (command shape) | `buildHarnessCli().commands().length === 5` |
| REQ-BOOT02-02 | Init command shape + Tier 1 creation | T04, T02 | `init --yes` creates structure |
| REQ-BOOT02-03 | Init interactive mode (TTY) | T04 (stub — P1 deferred) | Manual TTY test |
| REQ-BOOT02-04 | Init non-interactive mode (CI/--yes) | T04 | `CI=true init` → no interactive output |
| REQ-BOOT02-05 | Doctor command shape + exit code | T05 | `doctor` exit 0 on healthy |
| REQ-BOOT02-06 | Doctor output format | T05 | Format matches spec template |
| REQ-BOOT02-07 | Recover command shape | T06, T03 | `recover` restores missing symlinks |
| REQ-BOOT02-08 | Recover non-destructive | T06, T03 | Existing files not overwritten |
| REQ-BOOT02-09 | Version flag | T07 | `--version` prints package.json version |
| REQ-BOOT02-10 | Help lists all commands | T08, T13 | `help` output includes all 5 commands |

### Cross-Cutting Requirements (8 REQs)

| REQ ID | Description | Covered By | Verification |
|--------|-------------|-----------|-------------|
| REQ-X01 | CQRS compliance | T02, T03 (tools own writes), T05 (read-only) | Code review |
| REQ-X02 | Non-destructive principle | T02, T03, T06 | Integration test |
| REQ-X03 | `[Harness]` error prefix | All command handlers (T04–T07) | Unit tests |
| REQ-X04 | Module size cap (500 LOC) | All new files | `wc -l` check |
| REQ-X05 | TypeScript strict mode | All new files | `npm run typecheck` |
| REQ-X06 | Zero circular dependencies | All new files | `npx madge --circular src/` |
| REQ-X07 | kebab-case file naming | All new files | Glob check |
| REQ-X08 | No new npm dependencies | N/A (no new deps added) | Diff `package.json` |

### Sub-Phase Requirements (BOOT-03/04/05/06 — traced for completeness)

BOOT-02 creates the command shells that trigger these sub-phases. Actual implementation is in BOOT-03 through BOOT-06 tasks. See the SPEC Section 3–6 for full traceability.

| Sub-Phase | REQs | Triggered By | Implementation Phase |
|-----------|------|-------------|---------------------|
| BOOT-03 (State Init) | REQ-BOOT03-01 through 04 | T04 → T02 | BOOT-03 |
| BOOT-04 (Primitives Recovery) | REQ-BOOT04-01 through 04 | T04 → T03 (init), T06 → T03 (recover) | BOOT-04 |
| BOOT-05 (Config Bootstrap) | REQ-BOOT05-01 through 04 | T04 → T02.writeDefaultConfig | BOOT-05 |
| BOOT-06 (Health Checks) | REQ-BOOT06-01 through 09 | T05 → inline checks | BOOT-06 |

---

## 5. Verification Commands

### Per-Task Verification

| Task | Command | Expected |
|------|---------|----------|
| T01 | `npx tsc --noEmit src/lib/bootstrap-structure.ts` | No type errors |
| T02 | `npx vitest run tests/tools/bootstrap-init.test.ts` | All pass |
| T03 | `npx vitest run tests/tools/bootstrap-recover.test.ts` | All pass |
| T04 | `npx vitest run tests/cli/commands/init.test.ts` | All pass |
| T05 | `npx vitest run tests/cli/commands/doctor.test.ts` | All pass |
| T06 | `npx vitest run tests/cli/commands/recover.test.ts` | All pass |
| T07 | `npx vitest run tests/cli/commands/version.test.ts` | All pass |
| T08 | `npm run build && npx vitest run tests/cli/runCli.test.ts` | All pass, including new test |
| T09–T13 | `npx vitest run tests/cli/` | All tests pass |

### Phase-Level Verification (BOOT-02 Completed)

```bash
# 1. Typecheck
npm run typecheck                                                    # exit 0

# 2. All CLI tests
npx vitest run tests/cli/                                           # all pass

# 3. Full test suite (no regressions)
npm test                                                            # 1767/1767 pass

# 4. CLI smoke tests
npm run build                                                       # compiles cleanly
node bin/hivemind.cjs help                                    # lists all 5 commands
node bin/hivemind.cjs --version                               # prints version, exit 0
node bin/hivemind.cjs bogus                                   # exit 64, [Harness] error

# 5. Module size check
wc -l src/cli/commands/init.ts src/cli/commands/doctor.ts \
      src/cli/commands/recover.ts src/cli/commands/version.ts \
      src/tools/bootstrap-init.ts src/tools/bootstrap-recover.ts \
      src/lib/bootstrap-structure.ts                                # all < 500

# 6. Circular dependency check
npx madge --circular src/                                           # no new circulars

# 7. Naming convention check
ls src/cli/commands/*.ts src/tools/bootstrap-*.ts src/lib/bootstrap-*.ts  # all kebab-case
```

### BOOT-07 E2E Proof (post-BOOT-06, pre-authorized)

```bash
rm -rf .hivemind/
rm -rf .opencode/agents/ .opencode/skills/ .opencode/commands/
node bin/hivemind.cjs init --yes                              # exit 0
node bin/hivemind.cjs doctor                                  # exit 0, ALL CHECKS PASS
npm run typecheck                                                   # exit 0
npm test                                                            # 1767/1767 PASS
```

---

## 6. Gate Checklist

### Gate 1 — Lifecycle Integration (CQRS + CLI Contract)

| Check | Criteria | Status |
|-------|----------|--------|
| L1a | Tool modules (`src/tools/`) own all write operations (mkdir, writeFile, symlink) | ✅ T02, T03 are tools |
| L1b | CLI handlers (`src/cli/commands/`) do NOT perform durable writes | ✅ T04–T07 call tools |
| L1c | Doctor handler contains ZERO write calls (read-only) | ✅ T05 is pure observation |
| L1d | All commands conform to `CliCommand` contract (`{ name, summary, handler }`) | ✅ All T04–T07 |
| L1e | Handler errors carry `[Harness]` prefix or pass through `renderError()` | ✅ T09–T12 tests verify |
| L1f | No modification to `router.ts`, `discovery.ts`, `renderer.ts`, or `help.ts` | ✅ Scope boundary |
| L1g | Commands registered via `discoverCommands()` → `createRouter()` pipeline | ✅ T08 |

### Gate 2 — Spec Compliance (REQ Coverage)

| Check | Criteria | Status |
|-------|----------|--------|
| S2a | All 10 BOOT-02 REQs mapped to tasks | ✅ Section 4 traceability |
| S2b | All 8 cross-cutting REQs addressed | ✅ Section 4 traceability |
| S2c | All 7 Locked Decisions (D1–D7) respected | ✅ See Section 7 |
| S2d | Exit code table correct (0/64/70) | ✅ Router handles this |
| S2e | `[Harness]` prefix policy on all errors | ✅ All handlers + tests |
| S2f | Non-destructive guarantees (no overwrite) | ✅ T02, T03, T06 design |
| S2g | Q6 compliance (`.hivemind/` not `.opencode/state/`) | ✅ T01 constants |
| S2h | Framework-free router (Decision D1) | ✅ No commander/yargs |

### Gate 3 — Evidence Truth (Test + Build)

| Check | Criteria | Status |
|-------|----------|--------|
| E3a | `npm run typecheck` passes with all new files | ⬜ Pending implementation |
| E3b | `npm test` → 1767/1767 pass (no regressions) | ⬜ Pending implementation |
| E3c | All CLI tests pass (`npx vitest run tests/cli/`) | ⬜ Pending implementation |
| E3d | `hivemind help` lists all 5 commands | ⬜ Pending implementation |
| E3e | `hivemind --version` prints version | ⬜ Pending implementation |
| E3f | No new circular dependencies | ⬜ Pending implementation |
| E3g | All modules < 500 LOC | ⬜ Pending implementation |
| E3h | No new npm dependencies added | ⬜ Pending implementation |

---

## 7. Locked Decision Compliance

| Decision | Rule | How Each Task Complies |
|----------|------|----------------------|
| **D1 (1A)** | Keep Phase 40 framework-free router | All commands are `CliCommand` handlers. No commander/yargs imported. |
| **D2 (2C)** | CI-aware interactive detection | T04 stub: checks `process.stdout.isTTY`. `--yes`/`-y` flag for non-interactive. |
| **D3 (3C)** | Tiered state initialization | T01 defines Tier 1: `state/`, `delegation/`, `event-tracker/`. T02 creates only these. |
| **D4 (4C)** | Symlink lifecycle: init creates, doctor validates, recover restores | T03 (create), T05 (validate), T06 (restore). Clear separation. |
| **D5 (5A)** | Minimal config bootstrap | T02 writes `{ "$schema": "./configs.schema.json" }` only. All defaults from Zod schema. |
| **D6** | Doctor P0 scope | T05 implements P0: structure, symlinks, config, SDK. P1/P2 checks deferred. |
| **D7** | BOOT-07 L1 evidence | E2E proof script in Section 5. Blocked until BOOT-06 complete. |

---

## 8. Deferred Items (Not in BOOT-02 Scope)

| Item | Deferred To | Reason |
|------|------------|--------|
| `@clack/prompts` interactive wizard in `init` | BOOT-02.1 (sub-task) or BOOT-06 | P1 priority. Non-interactive `--yes` mode satisfies P0 requirements. |
| Doctor `typecheck` check (`--check=typecheck`) | BOOT-06 | P0 structure/symlinks/config/SDK come first. |
| Doctor `tests` check (`--check=tests`) | BOOT-06 | Requires test runner output parsing. |
| Doctor P2 checks (module count, dependency freshness) | BOOT-07 | Low priority. |
| Windows symlink fallback (junction points) | Future phase | GAP-05 acknowledged. Unix-first. |
| Config schema distribution (`.hivemind/configs.schema.json`) | BOOT-05 | GAP-03 acknowledged. Need build artifact or copy step. |
| Typed CRUD ownership modules per `.hivemind/` subdirectory | CA-04.3 | Post-bootstrap work. |

---

## 9. File Manifest

### New Files (10)

```
src/lib/bootstrap-structure.ts          # T01 — shared constants + path helpers
src/tools/bootstrap-init.ts             # T02 — .hivemind/ dir + config creation tool
src/tools/bootstrap-recover.ts          # T03 — .opencode/ symlink creation/restoration tool
src/cli/commands/init.ts                # T04 — init command handler
src/cli/commands/doctor.ts              # T05 — doctor command handler
src/cli/commands/recover.ts             # T06 — recover command handler
src/cli/commands/version.ts             # T07 — version command handler
tests/cli/commands/init.test.ts         # T09 — init contract tests
tests/cli/commands/doctor.test.ts       # T10 — doctor contract tests
tests/cli/commands/recover.test.ts      # T11 — recover contract tests
tests/cli/commands/version.test.ts      # T12 — version contract tests
```

### Modified Files (2)

```
src/cli/index.ts                        # T08 — +5 imports, +1 line extraCommands
tests/cli/runCli.test.ts               # T13 — +1 test case
```

### Files NOT Modified (by Scope Boundary)

```
src/cli/router.ts                       # UNTOUCHED
src/cli/discovery.ts                    # UNTOUCHED
src/cli/renderer.ts                     # UNTOUCHED
src/cli/commands/help.ts               # UNTOUCHED
bin/hivemind.cjs                 # UNTOUCHED
package.json                           # UNTOUCHED (no new deps)
```

---

## 10. Known Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| **R1: init over-reaches scope** | High | Low | The init command triggers BOOT-03/04/05 sub-tasks. Each sub-task's tool is independently testable. If a sub-task fails, init reports which step failed. |
| **R2: Doctor format divergence** | Medium | Medium | The doctor output format is specified verbatim in REQ-BOOT02-06. T10 tests assert exact format. Any deviation caught by test. |
| **R3: `@clack/prompts` not lazy-loaded** | Low | High (violates D1) | T04 uses dynamic `import()` inside TTY branch only. T09 test verifies no static import. |
| **R4: Symlink creation on macOS vs Linux** | Low | Low | Node.js `fs.symlinkSync()` works consistently on both platforms. Relative path targets are OS-agnostic. |
| **R5: package.json resolution fails from dist/** | Medium | Medium | T07 walks up from `import.meta.url` to find `package.json`. Test both dev (tsx) and compiled (node dist/) paths. |
| **R6: Module cap violation** | Low | Low | All modules designed under 500 LOC. Doctor (T05) is the largest at ~200 LOC. Split into `doctor.ts` + `doctor-checks.ts` if it grows. |
| **R7: 1767 hardcoded test count** | High | Medium | GAP-04 acknowledged. For BOOT-02, doctor's test check is deferred (BOOT-06). When implemented, read dynamically from test runner output. |

---

## 11. Execution Ordering

1. **Authorize this plan** → user approval required before implementation.
2. **Execute W0–W4** in order per the dependency graph.
3. **After each wave:** run verification commands for completed tasks. Run `npm run typecheck` to catch cross-module type errors early.
4. **After T08 (index.ts wiring):** run full CLI test suite. Manual smoke test with `node bin/hivemind.cjs help`.
5. **After all tasks:** run `npm test` (full suite, 1767 tests) to confirm zero regressions.
6. **BOOT-02 exit gate:** all 13 tasks complete, all tests pass, typecheck clean, `help` lists 5 commands, `--version` works.
7. **Handoff to BOOT-03:** tools (T02, T03) are implemented and testable. BOOT-03 extends with integration tests for actual filesystem operations.

---

*Plan prepared by hm-coordinator (L1). Requires L0 hm-orchestrator authorization before Cycle 2 Bootstrap Recovery execution begins.*
