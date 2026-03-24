# Session Inspection Export

- ses_id: `ses_2dfebd96fffeh8E4FH4HZMS2uN`
- prepared_at: `2026-03-24T13:44:47.826Z`

## Assistant Output

---

## Codebase Investigation Report: `src/commands/` Dead Code Audit

**Scope:** `src/commands/` directory
**Question:** Which files are LIVE (imported/used), DEAD (defined but never imported), or ORPHANED (only in index re-exports)?
**Commit:** `61ac25b` (head)

---

### Findings

| # | File | Status | Imports (count) | Tests | Notes |
|---|------|--------|-----------------|-------|-------|
| 1 | `src/commands/slash-command/command-types.ts` | **LIVE** | 18 src files | NO (type-only) | Exported interfaces/types used across runtime-entry, control-plane, session-entry |
| 2 | `src/commands/slash-command/command-bundles.ts` | **LIVE** | 2 (index re-export, self) | NO | Contains `slashCommandBundles` array — consumed via `command-discovery.ts` and index re-export |
| 3 | `src/commands/slash-command/command-discovery.ts` | **LIVE** | 2 (command.ts, index re-export) | NO | `discoverSlashCommandBundles()` and `findSlashCommandBundle()` used by 11+ source files |
| 4 | `src/commands/slash-command/command-runner.ts` | **LIVE** | 4 src files + tests | YES | `executeSlashCommandBundle`, `previewSlashCommandBundle`, `executeRecoveryHandler` |
| 5 | `src/commands/slash-command/index.ts` | **LIVE** | 11 src files + 4 test files | NO | Main barrel export — heavily used |
| 6 | `src/commands/index.ts` | **LIVE** | 0 src files | NO | Single re-export of slash-command/index, likely for package-level API |

---

### Detailed Findings

#### 1. `src/commands/slash-command/command-types.ts`
- **Status:** LIVE
- **Imports:** 18 source files import types from here:
  - `src/shared/opencode-agent-registry.ts`
  - `src/features/session-entry/settings-delta.ts`, `language-resolution.ts`, `profile-resolution.ts`, `intake.gates.ts`
  - `src/features/runtime-entry/workflow-continuity.ts`, `workflow-command-handler.ts`, `runtime-command-handlers.ts`, `settings.ts`, `inspection-command-handler.ts`, `init.handler.ts`, `harness.ts`, `command.ts`, `handler-shared.ts`, `doctor.ts`
  - `src/features/agent-work-contract/engine/command-session-contract.ts`
  - `src/control-plane/control-plane-handler.ts`
- **Tests:** NO (type-only file)
- **Notes:** Pure type definitions — 135 lines, zero runtime cost

#### 2. `src/commands/slash-command/command-bundles.ts`
- **Status:** LIVE
- **Imports:** Only `index.ts` (re-export) and `command-discovery.ts` (self-import at line 2)
- **Tests:** NO
- **Notes:** Static registry of 10 `SlashCommandBundle` objects. Consumed exclusively through `command-discovery.ts`

#### 3. `src/commands/slash-command/command-discovery.ts`
- **Status:** LIVE
- **Imports:** 
  - `src/features/runtime-entry/command.ts` (line 11)
  - `index.ts` (re-export)
- **Tests:** NO direct tests, but `discoverSlashCommandBundles()` is tested indirectly via bundle usage
- **Notes:** Only 10 lines — thin wrapper returning `[...slashCommandBundles]`

#### 4. `src/commands/slash-command/command-runner.ts`
- **Status:** LIVE
- **Imports:** 4 src files + 4 test files
- **Tests:** YES
  - `tests/runtime-entry-contract.test.ts` (line 8 — imports `previewSlashCommandBundle`)
  - `tests/runtime-resilience.test.ts`, `tests/plugin-runtime.test.ts`, `tests/runtime-authority-live-sanity.test.ts`
- **Notes:** Contains `executeRecoveryHandler` (lines 27-32) which was supposed to be in a separate `recovery-handlers.ts` per AGENTS.md (see issue below)

#### 5. `src/commands/slash-command/index.ts`
- **Status:** LIVE
- **Imports:** 11 src files + 4 test files
- **Tests:** YES (indirect via importing modules)
- **Notes:** Main barrel — all exports flow through this file

#### 6. `src/commands/index.ts`
- **Status:** LIVE (but minimal utility)
- **Imports:** 0 source files (only `slash-command/index.js`)
- **Tests:** NO
- **Notes:** Single-line re-export `export * from './slash-command/index.js'`

---

### Critical Issue: STALE Documentation

| File | Evidence | Issue |
|------|----------|-------|
| `src/commands/slash-command/AGENTS.md:13` | Documents `recovery-handlers.ts` | **FILE DOES NOT EXIST** |

**AGENTS.md line 13 claims:**
```
| `recovery-handlers.ts` | Recovery-specific command execution path |
```

**Reality:** `recovery-handlers.ts` is NOT a physical file. The `executeRecoveryHandler` function is defined **inline** within `command-runner.ts:27-32`:

```typescript
export async function executeRecoveryHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
) {
  return executeControlPlaneHandler(bundle, asset, input)
}
```

**Evidence of inline implementation:**
- `src/commands/slash-command/command-runner.ts:27` — function defined here
- `src/commands/slash-command/command-runner.ts:24` — injected into `executeRuntimeEntryCommandBundle(...)`
- `src/features/runtime-entry/command.ts:50,94-95` — consumed via `RecoveryHandler` type and called conditionally

**AGENTS.md is stale on this point** — the boundary table does not match physical file layout.

---

### Index Re-Export Verification

| Re-export in `index.ts` | Corresponds to real module? |
|------------------------|----------------------------|
| `command-types.js` | ✅ YES |
| `command-bundles.js` | ✅ YES |
| `command-discovery.js` | ✅ YES |
| `command-runner.js` | ✅ YES |

**All re-exports are valid.** No phantom index exports.

---

### Test Coverage

| Test File | Imports From slash-command |
|-----------|---------------------------|
| `tests/runtime-entry-contract.test.ts` | ✅ YES (`executeSlashCommandBundle`, `findSlashCommandBundle`, `previewSlashCommandBundle`) |
| `tests/runtime-resilience.test.ts` | ✅ YES (`findSlashCommandBundle`) |
| `tests/runtime-authority-live-sanity.test.ts` | ✅ YES (`executeSlashCommandBundle`, `findSlashCommandBundle`) |
| `tests/plugin-runtime.test.ts` | ✅ YES (`executeSlashCommandBundle`, `findSlashCommandBundle`) |
| `src/features/agent-work-contract/hooks/compaction-preservation.test.ts` | ✅ YES (`executeSlashCommandBundle`, `findSlashCommandBundle`) |

**No orphaned test imports** — all test imports resolve to real modules.

---

### Summary

| Status | Count | Files |
|--------|-------|-------|
| **LIVE** | 6 | All physical `.ts` files are actively imported |
| **DEAD** | 0 | No files are unused |
| **ORPHANED** | 0 | No index-only files without external consumers |
| **STALE DOC** | 1 | `AGENTS.md` references non-existent `recovery-handlers.ts` |

**No dead code detected.** All TypeScript files in `src/commands/` are live and imported. The only issue is **stale documentation** in `AGENTS.md` which lists a file (`recovery-handlers.ts`) that was apparently merged inline into `command-runner.ts` but the AGENTS.md boundary table was never updated.