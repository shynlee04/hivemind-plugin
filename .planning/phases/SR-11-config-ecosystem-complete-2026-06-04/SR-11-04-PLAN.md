# SR-11-04-PLAN: Documentation + Verification

## Objective
Document the default behavior of the configuration system and verify that all components work together correctly.

## Context
Phase SR-11 requires documentation of default behaviors and a full verification pass. This plan ensures that the system is well-documented and that all previous plans integrate correctly.

**Source References:**
- SPEC: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-SPEC.md`
- CONTEXT: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-CONTEXT.md`
- RESEARCH: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-RESEARCH.md`

## Tasks

### Task 1: Reference Documentation
**Type:** auto
**Files:** `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-REFERENCE.md` (new)
**Action:**
1. Create `SR-11-REFERENCE.md`.
2. Document:
   - **Default Behavior**: What `getDefaultConfigs()` returns.
   - **Bootstrap Behavior**: What happens when `configs.json` is missing, empty, or invalid.
   - **Schema Fields**: Description of each field in `GovernanceConfigs`.
   - **Tool Registry**: How tools are registered and merged.
   - **Skill Usage**: How to use `hm-l2-governance-config` skill.
3. Include examples.

**Verify:**
- File exists.
- Content is accurate and complete.

**Done:** Reference documentation created.

### Task 2: Verification Script
**Type:** auto
**Files:** `scripts/verify-sr11.sh` (new)
**Action:**
1. Create a shell script that runs:
   - `npm run typecheck`
   - `npm test`
   - Checks that `assets/skills/hm-l2-governance-config/SKILL.md` exists.
   - Checks that `.opencode/skills/hm-l2-governance-config/SKILL.md` exists.
2. Script exits with code 0 if all checks pass, 1 otherwise.

**Verify:**
- Script exists and is executable.
- Running script passes.

**Done:** Verification script created.

### Task 3: Manual Verification
**Type:** checkpoint
**Files:** N/A
**Action:**
1. Run `npm run typecheck` — passes.
2. Run `npm test` — all tests pass.
3. Run `node scripts/sync-assets.js` — syncs skill.
4. Run `bash scripts/verify-sr11.sh` — passes.
5. Inspect `configs.json` after bootstrap — contains all fields.

**Verify:**
- All commands succeed.
- `configs.json` structure matches schema.

**Done:** Manual verification complete.

### Task 4: Commit Documentation
**Type:** auto
**Files:** `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-REFERENCE.md`
**Action:**
1. `git add .planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-REFERENCE.md`
2. `git commit -m "docs: add SR-11 reference documentation"`

**Verify:**
- Commit created.

**Done:** Documentation committed.

## Dependency Graph
- Task 1 (Reference Docs) can be done in parallel with other plans.
- Task 2 (Verification Script) depends on all other plans being complete.
- Task 3 (Manual Verification) depends on all other plans being complete.
- Task 4 (Commit) depends on Task 1.

## Threat Model
- **Risk:** Documentation is inaccurate.
  - **Mitigation:** Verify against actual code and tests.

## Verification
1. `SR-11-REFERENCE.md` exists and is accurate.
2. `scripts/verify-sr11.sh` passes.
3. All tests pass.

## Success Criteria
- [ ] `SR-11-REFERENCE.md` created with default behavior documentation.
- [ ] `scripts/verify-sr11.sh` created and passes.
- [ ] Full verification passes (typecheck, tests, sync).
- [ ] Documentation committed.
