# Phase BOOT-02: CLI Framework + Entry Point — Specification

**Created:** 2026-05-07
**Ambiguity score:** 0.084 (gate: ≤ 0.20)
**Requirements:** 13 locked

## Goal

The `hivemind` CLI binary accepts `init`, `doctor`, `recover`, `version`, and `help` subcommands through the existing `CliCommand` router, with Zod-validated write-side bootstrap tools, non-interactive `--yes` mode, and contract tests.

## Background

**Current state:** T01 delivered `src/lib/bootstrap-structure.ts` (124 LOC) — directory name constants (`HIVE_MIND_DIR`, `OPEN_CODE_DIR`, `META_BUILDER_DIR`), Tier-1 subdirectories, primitive types, doctor check names, default config JSON, and path resolution helpers. The existing CLI router (`src/cli/router.ts`) supports `CliCommand` registration through `extraCommands`. The existing `help` command (`src/cli/commands/help.ts`) serves as a reference implementation.

**What triggers this work:** No `hivemind init`, `doctor`, `recover`, or `version` commands exist. The bootstrap spec (`.planning/specs/bootstrap-cli-spec-2026-05-07.md`) defines 42 requirements across BOOT-02 through BOOT-07. `.hivemind/` state root has no creation mechanism. `.opencode/` symlinks have no creation or recovery mechanism. configs.json has no initialization path.

**Primary deliverable:** `npx hivemind --help` shows all 5 subcommands. `npx hivemind init` creates `.hivemind/` structure and `.opencode/` symlinks. `npx hivemind doctor` passes all health checks.

## Requirements

1. **Init tool (write-side):** `src/tools/bootstrap-init.ts` creates `.hivemind/` directory tree and `.opencode/` symlinks.
   - Current: No init tool exists. `src/lib/bootstrap-structure.ts` provides constants only.
   - Target: Tool accepts `projectRoot: string`, `nonInteractive: boolean`, `config: Partial<HivemindConfigs>`. Creates Tier-1 directories with `.gitkeep`. Creates `.opencode/agents|skills|commands/` with symlinks to `.hivefiver-meta-builder/`. Writes `configs.json` with `$schema` reference and wizard-provided values (or empty `{}` in non-interactive mode). Returns `BootstrapInitResult` with created/missing/existing counts.
   - Acceptance: Calling the tool on a test project root creates `.hivemind/state/`, `.hivemind/delegation/`, `.hivemind/event-tracker/` with `.gitkeep`; creates `.opencode/skills/` symlinks for all shipped skills; writes valid `configs.json`.

2. **Recover tool (write-side):** `src/tools/bootstrap-recover.ts` repairs missing or broken symlinks without overwriting real files.
   - Current: No recover tool exists.
   - Target: Tool walks `.hivefiver-meta-builder/agents|skills|commands/`. For each source entry, checks `.opencode/<type>/<name>`: MISSING → create symlink; BROKEN (symlink exists but target absent) → recreate symlink; FILE (real file, not symlink) → skip; OK → skip. Returns `BootstrapRecoverResult` with counts per status. Never deletes or overwrites real files.
   - Acceptance: After deleting 3 symlinks from `.opencode/skills/`, running recover restores exactly those 3. After replacing a symlink with a real file, recover skips it. After corrupting a symlink target, recover repairs it.

3. **Init CLI command:** `src/cli/commands/init.ts` wraps the init tool with TTY detection, `@clack/prompts` lazy-loading, and `--yes` flag support.
   - Current: No init command exists.
   - Target: `hivemind init` detects TTY. If TTY: lazy-loads `@clack/prompts`, runs full onboarding wizard (5 config fields: conversation_language, documents_and_artifacts_language, mode, user_expert_level, delegation_systems; meta-concept scope choice: global or project; summary before creation). If non-TTY or `--yes`: skips wizard, installs everything with defaults (`en`, `expert-advisor`, `intermediate-high-level`, all delegation enabled). Calls `bootstrapInitTool`. Reports results.
   - Acceptance: `hivemind init --yes` completes without prompting. `CI=true hivemind init` skips wizard. TTY mode presents a multi-step wizard with `@clack/prompts` (spinner, intro/outro, step indicators). Exit code 0 on success, 1 on error with `[Harness]` prefix.

4. **Doctor CLI command:** `src/cli/commands/doctor.ts` runs health checks and outputs a formatted table.
   - Current: No doctor command exists. `src/lib/bootstrap-structure.ts` exports `DOCTOR_CHECKS`.
   - Target: `hivemind doctor` runs structure, symlinks, config, and SDK checks. Output format exactly matches spec REQ-BOOT02-06: ASCII table with check name, PASS/FAIL/WARN verdict, details column; verdict line at bottom. Exit code 0 if all PASS, 1 if any FAIL. Uses `renderError()` for internal errors.
   - Acceptance: On a healthy project, `hivemind doctor` outputs all PASS and exits 0. After deleting `.hivemind/state/.gitkeep`, doctor reports FAIL for structure check and exits 1. Table format matches spec exactly.

5. **Recover CLI command:** `src/cli/commands/recover.ts` wraps the recover tool with status reporting.
   - Current: No recover command exists.
   - Target: `hivemind recover` calls `bootstrapRecoverTool`. Reports counts: OK (already healthy), REPAIRED (fixed), SKIPPED (real files, not overwritten). Non-interactive only — no prompts. Exit code 0 always (recover is idempotent; no failures block completion).
   - Acceptance: After deleting 3 symlinks, `hivemind recover` reports 3 REPAIRED and exits 0. Running again immediately reports 0 REPAIRED (all OK). Exit code 0 even when nothing to repair.

6. **Version CLI command:** `src/cli/commands/version.ts` reads and prints the installed version.
   - Current: No version command exists.
   - Target: `hivemind version` or `hivemind --version` reads from `package.json` at runtime (not hardcoded). Prints version string to stdout. Exit code 0.
   - Acceptance: `hivemind version` prints the version matching `package.json:version`. `hivemind --version` prints the same output.

7. **Command registration wiring:** `src/cli/index.ts` registers all new commands with the existing router.
   - Current: `src/cli/index.ts` exports `buildHarnessCli()` with `extraCommands` array. Currently empty or contains only help.
   - Target: Add `initCmd`, `doctorCmd`, `recoverCmd`, `versionCmd` to `extraCommands`. Each command implements `CliCommand` interface. Discovery via `discoverCommands()` picks them up automatically.
   - Acceptance: `npx hivemind --help` lists init, doctor, recover, version, and help. `npx hivemind doctor --help` shows doctor-specific help. No orphan commands (all are reachable).

8. **Tool schema registration:** Write-side tools are registered with Zod schemas in `src/plugin.ts`.
   - Current: No bootstrap tools registered. Plugin registers 16 existing tools.
   - Target: Register `bootstrapInitTool` and `bootstrapRecoverTool` with Zod input schemas. Both accept `{ projectRoot: string, ... }`. Init additionally accepts `{ nonInteractive: boolean, config: object }`. The tools' Zod schemas live in `src/schema-kernel/`.
   - Acceptance: `npm run typecheck` passes. Tool schemas are importable and validatable. Test that invalid input (wrong types, missing fields) produces Zod validation errors.

9. **Version-controlled install:** Init detects existing `.opencode/` primitives from a different version and backs them up.
   - Current: No version tracking or backup mechanism exists.
   - Target: Before creating symlinks, init checks if `.opencode/` contains symlinks from a prior Hivemind version. If the tracked version (stored in `.hivemind/state/version.json`) differs from the installed version, backup existing `.opencode/` to `.opencode-backup-<iso-date>/` before replacing. Doctor can reference the backup for recovery. New installs (no prior `.hivemind/`) skip backup.
   - Acceptance: Installing Hivemind v3.0 over a project previously bootstrapped with v2.x creates `.opencode-backup-2026-05-07/` with the old symlinks. Fresh install creates no backup directory. Version file is created on first init.

10. **Config initialization:** `hivemind init` writes `configs.json` with the `$schema` reference and wizard-provided values.
    - Current: `src/lib/bootstrap-structure.ts` exports `DEFAULT_CONFIG_JSON` as `'{ "$schema": "./configs.schema.json" }\n'`. No configs.json creation mechanism exists.
    - Target: Init writes `.hivemind/configs.json`. If wizard ran: includes wizard-provided values for the 5 core fields plus `$schema`. If `--yes`: writes only `$schema` reference (all fields resolve from Zod defaults at runtime). `$schema` points to `.hivemind/configs.schema.json` (relative path within `.hivemind/`).
    - Acceptance: After `hivemind init --yes`, `.hivemind/configs.json` contains valid JSON with `$schema` field. After TTY wizard run, configs.json contains all 5 user-selected values. `hivemind doctor config` check validates the file is parseable JSON with a valid `$schema` reference.

11. **Schema file generation:** `configs.schema.json` is a build artifact generated from the Zod schema.
    - Current: `$schema` references `./configs.schema.json` which does not exist. Zod schema in `src/schema-kernel/hivemind-configs.schema.ts` is the source of truth.
    - Target: `src/schema-kernel/generate-config-json-schema.ts` reads the Zod schema, converts to JSON Schema format (using `zod-to-json-schema` or manual serialization), and writes `.hivemind/configs.schema.json`. This file is committed and shipped in the npm package. `npm run build` includes schema generation. Init copies the file into `.hivemind/` alongside `configs.json`.
    - Acceptance: `.hivemind/configs.schema.json` exists in the repo and validates as valid JSON Schema. `npm run build` regenerates it if the Zod schema changed. Init copies it to the project's `.hivemind/` directory. Doctor checks it exists and is valid JSON Schema.

12. **Non-destructive guarantee:** No command overwrites existing user files.
    - Current: N/A — no bootstrap commands exist.
    - Target: Init skips `.hivemind/` directories that already exist (reports "exists"). Recover skips real files (reports "skipped"). Neither command deletes or overwrites anything. Doctor is read-only.
    - Acceptance: Running `hivemind init` twice on the same project produces no errors and reports "exists" for all paths. Running `hivemind recover` after manually creating a real file in `.opencode/agents/` skips that file. No file is ever deleted by these commands.

13. **Contract tests:** Each CLI command has at least one contract test.
    - Current: No bootstrap CLI tests exist. Test suite has 1767 existing tests.
    - Target: `tests/cli/commands/init.test.ts`, `doctor.test.ts`, `recover.test.ts`, `version.test.ts` verify: exit codes, stdout/stderr output, `--yes` behavior, help text. `tests/tools/bootstrap-init.test.ts` and `bootstrap-recover.test.ts` verify tool contracts: input validation, directory creation, symlink creation, idempotency. Tests operate on temporary directories (`os.tmpdir()`), never real project state.
    - Acceptance: All new tests pass with `npm test`. Test coverage for new files meets project threshold (90%+). Tests run in CI without external dependencies.

## Boundaries

**In scope:**
- `src/tools/bootstrap-init.ts` — write-side init tool (creates directories, symlinks, configs.json)
- `src/tools/bootstrap-recover.ts` — write-side recover tool (repairs symlinks)
- `src/cli/commands/init.ts` — init CLI command with TTY wizard or `--yes` mode
- `src/cli/commands/doctor.ts` — doctor CLI command with formatted health check table
- `src/cli/commands/recover.ts` — recover CLI command with status reporting
- `src/cli/commands/version.ts` — version CLI command
- `src/cli/index.ts` modification — register new commands in `extraCommands`
- `src/plugin.ts` modification — register bootstrapInitTool and bootstrapRecoverTool
- `src/schema-kernel/generate-config-json-schema.ts` — build script for JSON Schema generation
- `.hivemind/configs.schema.json` — generated build artifact
- `tests/cli/commands/*` — contract tests for all 4 new commands
- `tests/tools/bootstrap-*` — unit tests for both write-side tools
- Version tracking via `.hivemind/state/version.json`
- Backup of existing `.opencode/` to `.opencode-backup-<date>/` on version change

**Out of scope:**
- f-04 auto-routing engine — separate phase, blocked until BOOT + MCM complete
- MCM meta-concept migration — separate workstream, blocked until BOOT-04 symlinks exist
- CA-04.2 config consumer runtime wiring — making config fields actually affect behavior (language changes agent output, mode changes guardrails, etc.) is a separate phase
- CA-04.3 state directory ownership modules — typed CRUD modules for each `.hivemind/` subdirectory come after bootstrap
- CA-04.4 lifecycle audit — synthesizing gate criteria from ARCHITECTURE.md comes after state modules
- BOOT-03 state initialization (`.hivemind/` full creation) — separate phase
- BOOT-04 primitives recovery (full `.opencode/` management) — separate phase
- BOOT-05 config bootstrap — separate phase
- BOOT-06 validation — separate phase
- BOOT-07 E2E proof — separate phase
- `@clack/prompts` interactive flows beyond the init wizard
- `ink`/`react` rich terminal output — deferred, optional
- hf-doctor / hf-meta-authoring CLI commands — MCM workstream
- Global OpenCode config integration — post-BOOT-07

## Constraints

- Must use existing `CliCommand` interface (`src/cli/router.ts:44-49`) for all new commands
- `@clack/prompts` v1.3.0 lazy-loaded via dynamic `import()` only in TTY branch
- All errors use `[Harness]` prefix (`src/cli/renderer.ts:22-37`)
- Non-destructive: never overwrite existing files, never delete
- kebab-case file naming: `src/cli/commands/init.ts`, `src/tools/bootstrap-init.ts`
- Max 500 LOC per file — split command handler + tool if approaching limit
- No new npm dependencies beyond what's already in `package.json`
- TypeScript strict mode, `npm run typecheck` must pass
- CQRS: CLI commands are thin handlers → call write-side tools → tools mutate filesystem
- CI-aware: detect `process.stdout.isTTY`, `CI` env var, `--yes` flag

## Acceptance Criteria

- [ ] `npx hivemind --help` lists init, doctor, recover, version, and help subcommands
- [ ] `hivemind init --yes` creates `.hivemind/` tree and `.opencode/` symlinks without prompting
- [ ] `hivemind init` (TTY) presents wizard with 5 config fields + scope selection
- [ ] `hivemind init --yes` writes configs.json with `$schema` reference only
- [ ] `hivemind init` (wizard) writes configs.json with all 5 user-selected values
- [ ] `hivemind doctor` outputs PASS for all checks on a healthy project
- [ ] `hivemind doctor` outputs FAIL for missing `.hivemind/state/.gitkeep`
- [ ] `hivemind recover` restores deleted symlinks without touching real files
- [ ] `hivemind recover` is idempotent — second run reports all OK
- [ ] `hivemind version` prints version from `package.json`
- [ ] Version-controlled install backs up existing `.opencode/` before replacing
- [ ] Fresh install creates `.hivemind/state/version.json` with current version
- [ ] `configs.schema.json` exists in repo and is valid JSON Schema
- [ ] `npm run build` generates `configs.schema.json` from Zod source
- [ ] `npm run typecheck` passes with zero errors
- [ ] All new contract tests pass (`npm test`)
- [ ] Non-destructive: running init twice produces no errors
- [ ] CI mode (`CI=true`) skips wizard, uses defaults

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | 13 specific, testable requirements |
| Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit in/out scope lists        |
| Constraint Clarity | 0.90  | 0.65 | ✓      | CQRS, non-destructive, LOC cap, no new deps, `@clack/prompts` lazy |
| Acceptance Criteria| 0.92  | 0.70 | ✓      | 18 pass/fail checkboxes            |
| **Ambiguity**      | 0.084 | ≤0.20| ✓      | All dimensions above minimums      |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective     | Question summary                          | Decision locked                                              |
|-------|-----------------|-------------------------------------------|--------------------------------------------------------------|
| 1     | Researcher      | Current CLI state? What exists?           | CliCommand router exists, help command reference, no bootstrap tools |
| 3     | Boundary Keeper | What's NOT in BOOT-02?                    | f-04, MCM, CA-04.2/4.3/4.4, BOOT-03–07 all separate |
| 4     | Failure Analyst | What gaps in existing bootstrap spec?     | GAP-01 (wizard steps), GAP-02 (symlink granularity), GAP-03 (schema distribution) |
| 5     | Seed Closer     | Wizard: install everything or choose?     | Install all by default; version-controlled backup on upgrade |
| 5     | Seed Closer     | Schema generation script location?        | `src/schema-kernel/generate-config-json-schema.ts`, co-located with Zod source |
| 5     | Seed Closer     | Config fields have downstream consumers?  | Yes — but consumers are CA-04.2. BOOT-02 only writes values. |

---

*Phase: BOOT-02 — CLI Framework + Entry Point*
*Spec created: 2026-05-07*
*Next step: /gsd-discuss-phase BOOT-02 — implementation decisions (wizard flow details, doctor output format, recover edge cases)*
