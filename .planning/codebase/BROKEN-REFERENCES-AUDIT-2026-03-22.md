# Broken References Audit — `refactor/product-detox-concerns`

**Audit Date:** 2026-03-22
**Branch:** `refactor/product-detox-concerns`
**Uncommitted Files:** 125 (121 deleted, 14 modified)
**TypeScript Compilation:** ✅ PASS (`npx tsc --noEmit` — zero errors)

---

## files_checked

### Source Files (`src/`)
- `src/shared/opencode-agent-registry.ts` — agent registry with hardcoded ID list
- `src/shared/opencode-skill-registry.ts` — skill discovery from `skills/` directory
- `src/shared/index.ts` — barrel export for both registries
- `src/features/runtime-observability/sync.ts` — runtime surface sync (rewritten)
- `src/features/runtime-entry/init.handler.ts` — init command handler
- `src/features/runtime-entry/doctor.ts` — doctor command handler
- `src/features/runtime-entry/command.ts` — command execution entry
- `src/cli/runtime-assets.ts` — CLI wrapper for syncRuntimeSurface
- `src/commands/slash-command/command-bundles.ts` — command definitions referencing agent IDs
- `src/tools/trajectory/types.ts` — lineage type definitions
- `src/shared/intake-record.validation.ts` — kernel lineage validation
- `src/plugin/messages-transform-adapter.ts` — default agent fallback

### Test Files (`tests/`)
- `tests/runtime-surface-sync.test.ts` — updated to match new sync API
- `tests/sync-dry-run.test.ts` — updated to match new sync API
- `tests/runtime-entry-contract.test.ts` — updated to remove mirroring assertions

### Scripts
- `scripts/check-agents-presence.sh` — checks AGENTS.md charters (no broken refs)
- `scripts/check-asset-refs.sh` — checks forbidden module imports (no broken refs)
- `scripts/validate-framework.sh` — framework contract validator (orphaned from CI)

### Package Config
- `package.json` — scripts section

### Agent Source Files
- `agents/*.deprecated.md` — 9 files still exist as canonical agent sources

---

## broken_references

### NONE in Source Code

All TypeScript source compiles cleanly. No import path references deleted files.

### Stale Documentation References (Non-Breaking)

| File | Line | Reference | Impact |
|------|------|-----------|--------|
| `AGENTS.md` | 31 | `.opencode/agents/` for available agents | Documentation only — references the deleted runtime projection directory but notes it's projected from `agents/*.deprecated.md` |
| `AGENTS.md` | 48 | `.opencode/agents/` may contain runtime projections | Documentation only |
| `AGENTS.md` | 248 | See `.opencode/agents/` or root `agents/` | Documentation only |
| `commands/hivefiver-audit.md` | 56 | Lists `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/` | Command behavior doc — references directories that `syncRuntimeSurface` no longer creates |
| `commands/hiveq-compliance.md` | 20 | `agents/` content matches `.opencode/agents/` content | Command behavior doc — parity check no longer valid |
| `docs/guide/installation.md` | 9 | "Do not hand-author `.opencode/agents/`" | Stale guidance |
| `docs/PITFALLS.md` | 159,705,968 | `diff -rq agents/ .opencode/agents/` | Drift detection recipe no longer valid |
| `docs/plans/archive/**` | Multiple | Various `.opencode/agents/` and `check-agent-registry-parity` refs | Archive docs — no runtime impact |

---

## dangling_imports

### NONE

- `src/shared/opencode-agent-registry.ts` imports from `../commands/slash-command/command-types.js` — file exists ✅
- `src/features/runtime-entry/command.ts` imports from `../../shared/opencode-agent-registry.js` — file exists ✅
- `src/shared/index.ts` exports from `./opencode-agent-registry.js` and `./opencode-skill-registry.js` — both exist ✅
- `tests/runtime-entry-contract.test.ts` imports from `../src/shared/opencode-agent-registry.js` — file exists ✅
- All other imports verified via TypeScript compilation pass.

---

## compilation_risks

### Risk Level: NONE

**TypeScript compilation passes with zero errors.** The `npx tsc --noEmit` gate confirms:

1. **Agent Registry API**: Unchanged. `OPENCODE_AGENT_REGISTRY_IDS` constant and `createOpencodeAgentRegistry()` function signature are identical to committed HEAD. The agent `.deprecated.md` files in `agents/` still exist on disk.

2. **Skill Registry API**: Backward-compatible change. `createOpencodeSkillRegistry(packageRoot)` still works — the added `excludedSkillIds` parameter is optional with default `[]`. No consumers pass the new parameter yet.

3. **Runtime Surface Sync API**: Fully rewritten but callers are updated. `RuntimeSurfaceSyncResult` was reduced from `{ pluginFile, mirroredCommandFiles, mirroredAgentFiles, mirroredSkillFiles, wouldDelete?, protected?, dryRun? }` to `{ pluginFile }`. All call sites in `init.handler.ts`, `doctor.ts`, and tests were updated to match.

4. **Script References**: `check-agent-registry-parity.sh`, `check-agent-registry-parity.ts`, and `sync-agent-registry.ts` are deleted from git. They are **not** referenced in `package.json` scripts, `lint:boundary`, or `test` commands. No active CI breakage.

5. **Command→Agent Binding**: `command-bundles.ts` references agent IDs (`hivefiver`, `hiverd`, `hiveq`, `hiveminder`) which are all present in `OPENCODE_AGENT_REGISTRY_IDS`. Validation via `assertSlashCommandAgentBindings` will pass at runtime since the `.deprecated.md` source files exist.

### Observation: Orphaned Script

`scripts/validate-framework.sh` exists on disk but is **not** in any CI chain (`lint:boundary`, `test`, or `package.json` scripts). It uses `for f in agents/*.md` — the glob WILL match `*.deprecated.md` files (since they end in `.md`), but the validation will **fail** because:
- The `.deprecated.md` files lack `name:` frontmatter field (checked by R01)
- They lack `identity:` field (checked by R01)
- They lack `delegation_policy:` field (checked by R01)

**Impact**: Zero. The script is orphaned and never runs. If someone executes it manually, it would report failures for all 9 agent files.

---

## confidence_level

**HIGH (95%)**

Evidence:
- `npx tsc --noEmit` — 0 errors (TypeScript compilation is the primary gate)
- All import paths resolved to existing files
- All agent `.deprecated.md` source files confirmed present on disk
- `OPENCODE_AGENT_REGISTRY_IDS` matches the 9 files in `agents/`
- No deleted script is referenced in `package.json` scripts, `lint:boundary`, or `test`
- Command bundle agent IDs validated against registry

**5% uncertainty** stems from:
- Possible runtime-only failures not caught by static analysis (e.g., YAML parsing edge cases in `.deprecated.md` files)
- `.opencode/` directory state at runtime depends on consumer project setup, not just this repo
- Documentation drift may confuse future developers but won't cause compilation or runtime failures
