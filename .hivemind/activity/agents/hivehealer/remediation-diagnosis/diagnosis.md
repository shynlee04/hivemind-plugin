# Remediation Diagnosis Report

**Agent:** hivehealer
**Slice ID:** remediation-diagnosis
**Timestamp:** 2026-03-26T18:33:45+07:00
**Mode:** diagnosis-only (no fixes applied)

---

## Problem A: `initSkillInjection()` Never Called

### Verified Evidence

| Fact | Source |
|------|--------|
| `initSkillInjection(packageRoot)` defined at `src/plugin/skill-exposure-map.ts:50-52` | Code read |
| `cachedConfig` initialized as `null` at line 28 | Code read |
| `resolveSkillBundle()` returns `[]` when `cachedConfig` is null (line 77-81) | Code read |
| `opencode-plugin.ts` imports `resolveDefaultAgent` from `skill-exposure-map.ts` (line 33) but **never** imports `initSkillInjection` | Code read |
| `opencode-plugin.ts` has `const directory = input.directory` at line 53 | Code read |
| `messages-transform-adapter.ts:119` calls `resolveSkillBundle()` — the primary consumer | Code read |
| `loadSkillInjectionConfig()` in `skill-injection-loader.ts` has a fallback default config (line 29-122) — would work if called | Code read |
| `grep` across all `src/` confirms `initSkillInjection` appears **only** in `skill-exposure-map.ts` itself (4 matches: JSDoc, comment, definition, warning) | Grep |

### Root Cause

**Wiring omission during module decomposition.** When `skill-exposure-map.ts` was extracted as a separate module (git: `c95b12a refactor: decompose 9 oversized files into focused modules`), the function `initSkillInjection` was defined and documented as "Must be called once at plugin startup" but the call site in `opencode-plugin.ts` was never added. The plugin imports `resolveDefaultAgent` (a read-only accessor) from the same module but missed the initialization function.

This is a classic decomposition-refactor regression: the function was created, the consumer was created, but the wiring between them was dropped.

### Blast Radius

| Component | Impact |
|-----------|--------|
| `resolveSkillBundle()` | Always returns `[]` — no skills ever injected |
| `messages-transform-adapter.ts` | Skill focus block is empty on every turn |
| `resolveDefaultAgent()` | Falls back to `'hiveminder'` (works by accident — default is correct) |
| `injection-store.ts` | `skillBundle` field in injection payload is always empty |
| `compaction-adapter.ts` | Compaction context has no skill awareness |
| `renderSkillFocusBlock()` | Renders empty block — cosmetic but signals no skills loaded |

**Total affected consumers:** Every message transform hook invocation across every session.

### Fix Strategy

**Minimal safe change:** Add one line to `opencode-plugin.ts` after `initSdkContext(input)`:

```typescript
import { initSkillInjection } from './skill-exposure-map.js'
// ...inside HiveMindPlugin:
initSkillInjection(directory)
```

Placement: immediately after `initSdkContext(input)` at line 54, before `createEventHandler(directory)`. This ensures config is loaded before any skill resolution occurs.

### Fix Risk

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `loadSkillInjectionConfig` reads `config/skill-injection.json` which doesn't exist | Certain | Already handled — fallback to `buildDefaultConfig()` at line 162 with a `console.warn` |
| Skills referenced in default config don't exist on disk | Known | Separate problem (Problem B) — but config loads fine, validation is non-blocking |
| Timing: config loading adds latency to plugin init | Low | File read is synchronous but small (~2KB JSON max); already cached |
| `cachedConfig` singleton conflict with `skill-injection-loader.ts`'s own `cachedConfig` | Medium | Both modules have their own `cachedConfig` — `initSkillInjection` sets the one in `skill-exposure-map.ts`, `loadSkillInjectionConfig` sets its own. No conflict because they serve different consumers. |

### Dependencies

**None.** This fix is independent. It can be applied immediately. Problem B affects whether the *validated* skills exist on disk, but the default config loads regardless.

---

## Problem B: Wrong Skill Discovery Path

### Verified Evidence

| Fact | Source |
|------|--------|
| `discoverSkills()` at `src/shared/opencode-skill-registry.ts:88` scans `join(packageRoot, 'skills')` | Code read |
| Actual skills live at `skills/skills/{name}/SKILL.md` — 19 skills | `find` + `ls` |
| OpenCode-expected skills at `.opencode/skills/{name}/SKILL.md` — 15 skills | `ls` |
| Deprecated skills at `skills/_deprecated_hive/{name}/SKILL.md` — 29 skills | `ls` |
| `discoverSkills` filters `entry.name.startsWith('_')` — so `_deprecated_hive` is excluded | Code read line 95 |
| Net result: `discoverSkills` finds **zero** active skills | Computed |
| `validateSkillNames()` calls `createOpencodeSkillRegistry(packageRoot)` and checks config names against registry — all show as missing | Code read |
| OpenCode discovers from `.opencode/skills/` and `~/.config/opencode/skills/` | Delegation packet fact |

### Root Cause

**Path assumption stale after directory restructuring.** The `discoverSkills` function was written assuming a flat layout `{packageRoot}/skills/{name}/SKILL.md`. At some point, skills were reorganized into `skills/skills/{name}/SKILL.md` (double-nested), but the discovery function was never updated. Additionally, `.opencode/skills/` is OpenCode's official discovery path, which this function never scans.

The function scans `{packageRoot}/skills/`, finds `skills/skills/` (a directory, not starting with `_`) and `skills/_deprecated_hive/` (starts with `_`, excluded). When it enters `skills/skills/`, it checks for `skills/skills/{subdir}/SKILL.md` — BUT the code at line 96 constructs `skillDir = join(skillsRoot, entry.name)` which would be `{packageRoot}/skills/skills/`, and then checks for `SKILL.md` inside each subdirectory of that. Wait — let me re-verify.

Actually, re-reading the code: `discoverSkills` iterates `readdirSync(skillsRoot)` where `skillsRoot = join(packageRoot, 'skills')`. It finds `skills/skills/` as a directory entry. Since it doesn't start with `_`, it's not excluded. Then it checks `statSync(join(skillDir, 'SKILL.md'))` where `skillDir = join(skillsRoot, 'skills/skills')`. But `skills/skills/` is itself a directory containing skill subdirectories, not a skill directory with a `SKILL.md` at its root. So `statSync` fails and the entry is skipped.

**Confirmed:** The function finds `skills/skills/` as a directory but can't find `SKILL.md` directly inside it, so it's skipped. The actual skill directories nested inside `skills/skills/` are never iterated because the function only does a single-level scan.

### Blast Radius

| Component | Impact |
|-----------|--------|
| `createOpencodeSkillRegistry()` | Always returns `[]` — empty registry |
| `validateSkillNames()` | All config skill names report as "missing from registry" |
| Skill injection (after Problem A is fixed) | Config loads fine (default fallback), but registry validation reports false warnings |
| Any future consumer of the skill registry | No skills discoverable |

### Fix Strategy

**Option 1: Scan both paths (recommended minimal fix)**

Modify `discoverSkills` to scan two directories:
1. `.opencode/skills/` — OpenCode official discovery path (15 skills)
2. `skills/skills/` — project-internal skills (19 skills)

This requires changing the function to accept multiple scan roots, or scanning both paths and merging results.

**Option 2: Move skills to match the expected path**

Move `skills/skills/*` → `skills/*` (flatten the double-nest). This is a larger change with more risk.

**Option 3: Add `.opencode/skills/` as additional scan path**

Keep existing `skills/` scan (which finds nothing useful) and add `.opencode/skills/` as a second scan path.

**Recommended:** Option 1 or 3 — both are minimal safe changes that don't require moving files.

### Fix Risk

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Duplicate skill IDs across paths | Low | First-discovered wins; or deduplicate by ID |
| `_deprecated_hive` accidentally included | Already excluded | `_` prefix filter works |
| `.opencode/` directory write prohibition | N/A | This is a read-only scan — no writes to `.opencode/` |
| Breaking existing callers of `createOpencodeSkillRegistry` | Low | Signature change needed if adding paths — or change internal `discoverSkills` to scan both |

### Dependencies

**Problem A must be fixed first** for the skill registry to matter at runtime. Without `initSkillInjection` being called, `resolveSkillBundle` always returns `[]` regardless of what the registry contains. However, `validateSkillNames` can be tested independently.

---

## Problem C: Stale Loop Checkpoint

### Verified Evidence

| Fact | Source |
|------|--------|
| Checkpoint file reports `current_iteration: 3`, `phases_completed: 3` (phases 01-03) | File read |
| `phases_total: 11` claimed | File read |
| Delegation folder contains evidence for phases P0 through P11 | `ls` |
| `phase-11-full-verification.json` exists, timestamped 2026-03-26T01:46 | File read |
| Phase 11 verification shows `overall_gate: "FAIL"` with 685/713 tests passing | File read |
| Checkpoint `_meta.updated_at: "2026-03-25T23:56"` — updated BEFORE phase 11 verification | File read |
| Multiple P4-P9 red/green test files exist in delegation folder | `ls` |

### Root Cause

**Checkpoint write was never updated after initial creation.** The checkpoint was created at iteration 3 after phases 01-03 completed. Subsequent phases (P0, P1, P3, P4, P7, P8, P9, P11) wrote their own delegation records to the same folder but never updated the loop checkpoint. This is a missed-update problem, not a tracking architecture failure.

The delegation records themselves are complete — each phase wrote its own JSON. The checkpoint is a rollup summary that was abandoned after phase 03.

### Blast Radius

| Component | Impact |
|-----------|--------|
| Loop orchestration | If resumed, would restart from phase 04 even though phases P0-P9 completed |
| Stop condition evaluation | `all_phases_complete` check would show 3/11 instead of actual ~10/11 |
| Carry-forward context | Lists only phases 01-03 findings; P4-P9 findings are lost from the rollup |

**Scope:** This affects loop resume/restart, not current execution. If the loop is being closed (not resumed), this is a documentation issue only.

### Fix Strategy

**Option A: Update checkpoint to reflect actual state**

Scan the delegation folder, enumerate completed phases, update `phases_completed`, `current_iteration`, and `carry_forward`. This is the minimal fix.

**Option B: Accept stale checkpoint and close the loop**

If the loop is being terminated (not resumed), the stale checkpoint is irrelevant. Archive it.

**Option C: Rebuild checkpoint from delegation records**

Write a script that reads all `p*-*.json` and `verification-*.json` files and reconstructs the checkpoint. More thorough but higher effort.

**Recommended:** Option A if resuming; Option B if closing.

### Fix Risk

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Miscounting phases | Low | Each delegation file has explicit phase/slice IDs |
| Phase 11 is FAIL — should it count as complete? | Decision needed | Gate was FAIL but all subsystem checks passed except 28 pre-existing test failures |
| Overwriting legitimate checkpoint state | Low | Back up before editing |

### Dependencies

**None.** This is an isolated metadata issue. No code changes needed.

---

## Cross-Problem Dependency Graph

```
Problem A (initSkillInjection never called)
  └── Independent fix — add one import + one call to opencode-plugin.ts
  └── Unblocks: skill injection at runtime

Problem B (wrong skill discovery path)
  └── Depends on: Problem A (for runtime to matter)
  └── Independent for: validateSkillNames testing
  └── Fix: add .opencode/skills/ scan path to discoverSkills

Problem C (stale checkpoint)
  └── Fully independent
  └── Fix: update JSON or archive
```

**Recommended fix order:** A → B → C

---

## Design Flaw Flag

**Problem B exposes a design issue:** The skill discovery path is hardcoded to a single location. OpenCode's official discovery uses `.opencode/skills/` and `~/.config/opencode/skills/`. The HiveMind registry should scan **both** the project-local skills directory AND the OpenCode standard paths. This is a design consideration for the architect — whether to:
- Keep a single configurable scan path
- Scan multiple paths with merge/dedup
- Delegate discovery entirely to OpenCode's native mechanism

---

## Verification Plan (for fix phase)

| Problem | Verification Command | Expected |
|---------|---------------------|----------|
| A | `npx tsc --noEmit` | Clean compile with new import |
| A | Add test: `initSkillInjection(dir)` then `resolveSkillBundle(...)` returns non-empty | Non-empty array |
| B | `createOpencodeSkillRegistry(projectRoot)` returns entries | Array with length > 0 |
| B | `validateSkillNames(config, projectRoot).missing_skills` | Reduced or empty |
| C | Check updated checkpoint JSON | `phases_completed` reflects actual state |
| All | `npm test` | No new failures (existing 28 pre-existing may remain) |

---

## Summary

| # | Problem | Root Cause | Fix Complexity | Risk | Independence |
|---|---------|-----------|----------------|------|--------------|
| A | `initSkillInjection` never called | Wiring omission during refactor | Trivial (1 line) | Low | Independent |
| B | Wrong skill discovery path | Stale path assumption after directory restructure | Low (add scan path) | Low | Needs A first |
| C | Stale loop checkpoint | Missed update after phase 03 | Trivial (JSON edit) | None | Independent |
