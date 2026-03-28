# Verification Report — Hivefiver Tools: Project vs Global Scope Detection

**Goal:** Verify that hivefiver tools and configuration system can detect and respect BOTH project-level (`.opencode/`) and global-level (`~/.config/opencode/`) settings.

**Status:** gaps_found
**Score:** 0/6 must-haves verified

---

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tools detect `.opencode/` (project) settings before proposing changes | FAILED | See artifact analysis below |
| 2 | Tools detect `~/.config/opencode/` (global) settings | FAILED | No global path resolution exists anywhere |
| 3 | Tools respect existing user configurations (not overwrite) | UNCERTAIN | Placeholders only; no actual read logic |
| 4 | Tools offer "archive and replace" vs "merge" options | FAILED | No such options exist |
| 5 | Skill injection scans both project and global skill directories | FAILED | Only scans `{packageRoot}/skills/` |
| 6 | Config groups read from `opencode.json` (which merges project + global) | FAILED | Reads from schema defaults only, never from disk |

---

## Required Artifacts

### 1. hm-init Tool (`src/tools/hivefiver-init/tools.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 78 |
| **Substance** | PLACEHOLDER — explicitly documented as "placeholder implementation" (line 4-7). Only checks `.hivemind/` directory existence, not `.opencode/`. No actual bootstrap logic. |
| **Wiring** | VERIFIED — exported via `src/tools/index.ts` line 13, registered in catalog line 111-118 |

**Detects project settings?** NO — Only checks `.hivemind/` exists; never reads `.opencode/` files.
**Detects global settings?** NO — No global path resolution at all.
**Respects existing configs?** PLACEHOLDER — Returns proposed changes list but has no actual merge/archive logic.
**Offers archive vs merge?** NO — Proposed changes only list "create" or "scan" actions.

**Evidence (file:line):**
- `src/tools/hivefiver-init/tools.ts:34`: Only checks `join(projectRoot, '.hivemind')`
- `src/tools/hivefiver-init/tools.ts:49-69`: Greenfield proposes creating `.hivemind/` dirs; brownfield proposes scan/validate/clean of `.hivemind/` only
- No reference to `.opencode/` anywhere in the file
- No reference to `~/.config/opencode/` anywhere in the file

---

### 2. hm-doctor Tool (`src/tools/hivefiver-doctor/tools.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 109 |
| **Substance** | PLACEHOLDER — explicitly documented as "placeholder implementation" (line 4-7). Superficial checks only. |
| **Wiring** | VERIFIED — exported via `src/tools/index.ts` line 14, registered in catalog line 119-127 |

**Detects project settings?** PARTIAL — checks `.opencode/skills/` and `.opencode/agents/` existence (lines 61-81), but only checks directory existence, never reads content. Does NOT read `opencode.json`.
**Detects global settings?** NO — All checks use `join(projectRoot, ...)` which resolves to project root only.
**Respects existing configs?** PLACEHOLDER — Just reports "directory missing" warnings.
**Offers archive vs merge?** NO — No such options exist.

**Evidence (file:line):**
- `src/tools/hivefiver-doctor/tools.ts:37`: Only checks `join(projectRoot, '.hivemind')`
- `src/tools/hivefiver-doctor/tools.ts:49`: Only checks `join(projectRoot, 'opencode.json')` — project root only
- `src/tools/hivefiver-doctor/tools.ts:61-81`: Checks `.opencode/skills/` and `.opencode/agents/` but project only
- No reference to `~/.config/opencode/` or any global path

---

### 3. hm-setting Tool (`src/tools/hivefiver-setting/tools.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 117 |
| **Substance** | PARTIAL — Has validation logic (via `config-groups.ts`), but never writes to disk. Always returns `written: false`. |
| **Wiring** | VERIFIED — exported via `src/tools/index.ts` line 15, registered in catalog line 128-136 |

**Detects project settings?** NO — `getConfigGroup()` returns schema defaults, never reads from `opencode.json` or any disk file.
**Detects global settings?** NO — No concept of config level (project vs global).
**Respects existing configs?** NO — Always returns `UserPreferences.parse({})` (schema defaults).
**Offers archive vs merge?** NO — No level selection (project vs global) exposed.

**Evidence (file:line):**
- `src/shared/config-groups.ts:92`: `UserPreferences.parse({})` — always schema defaults, never reads from disk
- `src/tools/hivefiver-setting/tools.ts:25`: `_projectRoot` parameter is unused (prefixed with `_`)
- `src/tools/hivefiver-setting/types.ts`: `HmSettingResult` has no `level` or `targetLocation` field

---

### 4. Skill Injection Loader (`src/shared/skill-injection-loader.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 229 |
| **Substance** | SUBSTANTIVE — Has real config loading, caching, validation logic. But limited to single location. |
| **Wiring** | VERIFIED — Used by `src/shared/skill-injection-loader.test.ts` |

**Scans `.opencode/skills/` (project)?** NO — Validation uses `createOpencodeSkillRegistry()` which scans `{packageRoot}/skills/` (line 183), NOT `.opencode/skills/`.
**Scans `~/.config/opencode/skills/` (global)?** NO — No global path scanning.
**Merges skills from both levels?** NO — Only reads one config file at `{packageRoot}/config/skill-injection.json`.

**Evidence (file:line):**
- `src/shared/skill-injection-loader.ts:140`: Config loaded from `join(packageRoot, 'config', 'skill-injection.json')` — single location only
- `src/shared/opencode-skill-registry.ts:88`: `discoverSkills` scans `join(packageRoot, 'skills')` — hardcoded to package root
- `src/shared/skill-injection-loader.ts:212`: Warning message says `${packageRoot}/skills/` — single location

---

### 5. Config Groups (`src/shared/config-groups.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 184 |
| **Substance** | PARTIAL — Has validation logic but no I/O. Pure schema defaults. |
| **Wiring** | VERIFIED — Used by `hm-setting` tool |

**Knows about project vs global?** NO — No concept of config levels at all.
**Reads from `opencode.json`?** NO — `getConfigGroup()` at line 92 calls `UserPreferences.parse({})` which returns schema defaults. Never reads from disk.

**Evidence (file:line):**
- `src/shared/config-groups.ts:92`: `const defaults = UserPreferences.parse({})` — hardcoded defaults
- `src/shared/config-groups.ts:160-183`: `applyConfigUpdate()` accepts optional `base` param but never loads from disk

---

### 6. Path Resolution (`src/shared/paths.ts`)

| Check | Result |
|-------|--------|
| **Existence** | VERIFIED — file exists at line 80 |
| **Substance** | SUBSTANTIVE — Clean path utilities for `.hivemind/` |
| **Wiring** | VERIFIED — Used across the codebase |

**Exposes both project and global paths?** NO — `getEffectivePaths()` only returns `.hivemind/` subdirectories. No `getGlobalPaths()`, no `~/.config/opencode/` paths.
**Has any concept of global config?** NO — Zero references to global paths, home directory, or `~/.config/opencode/`.

**Evidence (file:line):**
- `src/shared/paths.ts:56-79`: `getEffectivePaths()` — all paths relative to `projectRoot/.hivemind/` only
- No function named `getGlobalPaths`, `getGlobalConfigPath`, or similar exists
- `grep` for `global.*path|~/.config/opencode|getGlobalPaths` across all `.ts` files: zero matches

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| hm-init | `.opencode/` files | fs check | NOT_WIRED | Only checks `.hivemind/`, never `.opencode/` |
| hm-init | `~/.config/opencode/` | fs check | NOT_WIRED | No global path concept |
| hm-doctor | `.opencode/` files | fs check | PARTIAL | Checks dir existence but never reads content |
| hm-doctor | `~/.config/opencode/` | fs check | NOT_WIRED | No global path concept |
| hm-setting | `opencode.json` | read | NOT_WIRED | Returns schema defaults only |
| skill-injection-loader | `.opencode/skills/` | scan | NOT_WIRED | Scans `{packageRoot}/skills/` instead |
| skill-injection-loader | `~/.config/opencode/skills/` | scan | NOT_WIRED | No global path concept |
| config-groups | `opencode.json` | read | NOT_WIRED | Schema defaults only |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `config-groups.ts` | 92 | `UserPreferences.parse({})` — always returns defaults | HIGH | Tool claims to show "current config" but shows schema defaults, never actual user config |
| `hm-setting/tools.ts` | 25 | `_projectRoot` unused parameter | MEDIUM | Dead parameter suggests incomplete implementation |
| `skill-injection-loader.ts` | 140 | Hardcoded single config path | HIGH | Cannot load user-customized skill bundles from `.opencode/config/` or global locations |
| `paths.ts` | 56-79 | No global path resolution | HIGH | Entire codebase has zero awareness of `~/.config/opencode/` |
| `hm-init/tools.ts` | 4-7 | Self-documented as "placeholder" | INFO | Known incomplete state |

---

## Verification Commands

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit` | No errors (exit 0) | PASS |
| `npm test` | Boundary check FAILS — 5 hook files have direct filesystem writes | FAIL (pre-existing, unrelated) |
| `grep getGlobalPaths ~/.ts` | Zero matches | CONFIRMED — no global path resolution exists |
| `grep "~/.config/opencode" *.ts` | Zero matches | CONFIRMED — no global config awareness |

---

## Gaps Summary

### What's Missing to Meet the User's Requirements

1. **No global path resolution layer.** `src/shared/paths.ts` needs a `getGlobalPaths()` (or equivalent) that resolves `~/.config/opencode/` paths. Currently the entire codebase is project-root-only.

2. **No `.opencode/` detection in hm-init.** The tool only checks `.hivemind/` existence. It needs to detect existing `.opencode/` files (commands, agents, skills, plugins) before proposing changes. Currently it would propose overwriting user customizations.

3. **No `~/.config/opencode/` detection in hm-doctor.** The tool only checks project-level directories. It needs a parallel scan of global config to report what exists at each level.

4. **No config level awareness in hm-setting.** The tool needs to know whether to write to project-level or global-level `opencode.json`. The `_projectRoot` parameter is unused. No level selection exists in the args or types.

5. **Config groups reads defaults, not disk.** `getConfigGroup()` returns `UserPreferences.parse({})` (Zod defaults) instead of reading actual config from `opencode.json`. This makes hm-setting useless for viewing real user configuration.

6. **Skill injection scans wrong directory.** `discoverSkills()` scans `{packageRoot}/skills/` (the installed package's skills), not `.opencode/skills/` (project) or `~/.config/opencode/skills/` (global). This means user-installed skills are invisible to the validation system.

7. **No archive vs merge strategy.** None of the tools offer a choice between "archive existing and replace" vs "merge with existing". The types (`HmInitResult`, `HmSettingResult`) have no fields for this.

8. **No `context.ask()` calls.** Despite the descriptions claiming "requires user authorization via context.ask()", none of the three hivefiver tools actually call `context.ask()`. The `_context` parameter is received but unused (prefixed with `_`).

---

## Overall Assessment

All 6 components fail the user's requirements. The hivefiver tools are **structurally wired** (they exist in the tool catalog and are exported) but **substantively placeholder** — they cannot detect global settings, cannot detect project `.opencode/` content, cannot respect existing configurations, and cannot offer archive vs merge options. The path resolution layer has no concept of global paths. The config groups system reads only schema defaults, never actual disk state.

The codebase compiles cleanly (`npx tsc --noEmit` passes) but the boundary lint check fails due to 5 hook files performing direct filesystem writes (pre-existing issue, not related to this verification).
