---
phase: P45-cli-redesign
plan: P45
subsystem: cli
tags: init-wizard, deprecation-shims, @clack/prompts, primitive-backup

requires:
  - phase: P40
    provides: CLI substrate with router, commands, parseArgs
provides:
  - Slimmed CLI router (only `init` as real command, 4 deprecation shims)
  - Interactive init wizard with p.group(), 10-language support, rich hints
  - Pre-install primitive backup logic (conflict-safe reinstall)
  - Updated test suite matching slimmed CLI surface

tech-stack:
  added: []
  patterns:
    - Deprecation shim pattern for CLI → TUI slash command migration
    - p.group() wizard pattern for multi-step config prompts
    - Backup-then-install pattern for non-destructive reinstall

key-files:
  created: []
  modified:
    - src/cli/index.ts
    - src/cli/commands/init.ts
    - src/cli/ui/prompts.ts
    - tests/cli/runCli.test.ts
    - tests/cli/commands/init.test.ts

key-decisions:
  - "Removed commands are UNREGISTERED from router, not deleted from disk (files stay for slash command phases)"
  - "Deprecation shims exit 0 and output [Harness] message + redirect to /hm-*"
  - "Help deprecation shim registers --help/-h aliases for backward compatibility"
  - "10 language options match the config schema (en, vi, zh, fr, ja, ko, de, es, th, id)"
  - "Backup uses rename (not copy) to preserve disk space, timestamp suffix in base36"
  - "Backup is injectable via InitCommandDeps for testability"

patterns-established:
  - "Wave execution: A (router) → B (wizard) → C (backup) → D (tests), sequential"
  - "Deprecation shim: inline factory function creating CliCommand with [Harness] error output"
  - "Backup-verify-install: check assets overlap, backup conflicts, then install fresh"

requirements-completed:
  - REQ-P45-01: Only init + deprecation shims registered
  - REQ-P45-02: init as functional CLI command
  - REQ-P45-03: Interactive 6-step wizard
  - REQ-P45-04: --yes skips all prompts
  - REQ-P45-05: Cancel returns exit 0, writes zero files
  - REQ-P45-06: Dynamic import fallback
  - REQ-P45-07: Deprecation messages with /hm-* redirect
  - REQ-P45-09: Source files stay on disk
  - REQ-P45-12: typecheck passes
  - REQ-P45-14: Default help listing on no args
  - REQ-P45-15: --help and --version alias deprecation
  - REQ-P45-16: prompts.ts remains importable

duration: 23min
completed: 2026-06-07
---

# Phase P45: CLI Redesign Summary

**Slimmed CLI surface with deprecation shims, interactive `@clack/prompts` init wizard with `p.group()` grouping, expanded language options, dynamic import fallback, and pre-install primitive backup logic**

## Performance

- **Duration:** 23 min
- **Started:** 2026-06-07T20:26:00Z
- **Completed:** 2026-06-07T20:49:00Z
- **Tasks:** 4 waves (6 atomic commits)
- **Files modified:** 5 (3 source + 2 test)

## Accomplishments

- **Wave A:** Router slimming — replaced `createHelpCommand`, `doctorCmd`, `recoverCmd`, `versionCmd` imports with inline `createDeprecationShim()` factory. `buildHarnessCli()` now registers 5 commands: help (→/hm-help), init (real), doctor (→/hm-doctor), recover (→/hm-recover), version (→/hm-about). All source files remain on disk.
- **Wave B:** Init wizard refinement — wrapped 6 sequential prompts in `p.group()` for visual grouping. Expanded languages from 4 to 10 (matching config schema). Added `hint` fields to every option. Added `loadClackPrompts` dynamic import fallback with `console.warn()` on failure. Added `createLanguageSelect`/`createModeSelect` helpers in `prompts.ts`.
- **Wave C:** Backup-then-install — added `backupExistingPrimitives()` helper that backs up same-named shipped primitives to `.backup/` with timestamp suffix before fresh install. Skips user-only files. Injectable via `InitCommandDeps` for testability.
- **Wave D:** Test updates — removed 3 obsolete test files (doctor, recover, version). Updated `runCli.test.ts` for deprecation shim assertions (help outputs `[Harness]` + `/hm-help` instead of command listing). Updated `init.test.ts` with `p.group()` mock, backup test, cancel test, and dynamic import fallback test.

## Task Commits

Each task was committed atomically:

1. **Wave A: Router slimming** — `a69ada0f` (feat)
2. **Wave B: Init wizard refinement** — `3d2e5399` (feat)
3. **Wave C: Backup logic** — `4b67f979` (feat)
4. **Wave D: Test updates** — `1595c36a` (test)

**Plan metadata:** Included in Wave D commit above.

_Note: Sequential execution (no parallel waves)._

## Files Modified

- `src/cli/index.ts` — Slimmed `buildHarnessCli()`: 5 commands registered (help/init/doctor/recover/version), all except init are deprecation shims
- `src/cli/commands/init.ts` — `promptForInitConfig()` rewritten with `p.group()`, expanded 10 languages, dynamic import fallback, `backupExistingPrimitives()` helper
- `src/cli/ui/prompts.ts` — Added `createLanguageSelect()`, `createModeSelect()` helpers, `LANGUAGE_OPTIONS` constant
- `tests/cli/runCli.test.ts` — Updated for deprecation shim assertions
- `tests/cli/commands/init.test.ts` — Updated mock for `p.group()`, added backup/cancel/fallback tests

## Files Removed

- `tests/cli/commands/doctor.test.ts`
- `tests/cli/commands/recover.test.ts`
- `tests/cli/commands/version.test.ts`

## Decisions Made

- **Deprecation shims exit 0** — user gets a clear message but no error exit code
- **Files stay on disk** — only UNREGISTERED from router, not deleted
- **Backup uses rename** — saves disk space and is atomic (unlike copy-then-delete)
- **Backup is injectable** — through `InitCommandDeps.backupPrimitives` for test isolation
- **Help aliases preserved** — `--help`/`-h` still dispatch to the (now deprecation) help command

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

CLI surface slimmed for slash command migration. The deprecation shims provide clear upgrade paths. Init wizard is production-ready with 10-language support, fallback handling, and backup safety. Next: implement `/hm-doctor`, `/hm-recover`, `/hm-about`, `/hm-help` slash commands.

---

*Phase: P45-cli-redesign*
*Completed: 2026-06-07*
