# SR-11-03-PLAN: Bootstrap Integration

## Objective
Update the bootstrap process to generate and merge configuration files non-destructively, ensuring that `configs.json` always contains a complete set of governance primitives with sensible defaults.

## Context
Phase SR-11 requires that the bootstrap process (initialization) creates a full configuration. This plan ensures that when `configs.json` is missing, empty, or incomplete, the system bootstraps with defaults and merges user customizations without data loss.

**Source References:**
- SPEC: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-SPEC.md`
- CONTEXT: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-CONTEXT.md`
- RESEARCH: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-RESEARCH.md`

## Tasks

### Task 1: Bootstrap Logic Update
**Type:** auto
**Files:** `src/config/bootstrap-init.ts`
**Action:**
1. Import `DEFAULT_GOVERNANCE_CONFIGS` from `./defaults`.
2. Modify `bootstrapInit()` to:
   - Read existing `configs.json` if present.
   - Parse and validate against `GovernanceConfigsSchema`.
   - Merge with `DEFAULT_GOVERNANCE_CONFIGS` using deep merge (user values override defaults).
   - Write merged config back to `configs.json`.
3. Ensure `tool_registry` is merged non-destructively (additive only).

**Verify:**
- Run `npm run typecheck`.
- Inspect logic for correct merge behavior.

**Done:** Bootstrap logic updated, typecheck passes.

### Task 2: Merge Utility
**Type:** auto
**Files:** `src/shared/helpers.ts` (add `deepMerge` if not exists)
**Action:**
1. Check if `deepMerge` exists in `helpers.ts`.
2. If not, implement a recursive deep merge utility that:
   - Merges objects recursively.
   - Arrays are replaced (not merged) unless specified.
   - Primitives are overwritten by source.
3. Export `deepMerge`.

**Verify:**
- `deepMerge` function exists and is exported.
- Unit tests for `deepMerge` (if new).

**Done:** `deepMerge` utility available.

### Task 3: Bootstrap Tests
**Type:** tdd
**Files:** `tests/config/bootstrap-init.test.ts` (new or extend)
**Action:**
1. Write tests for `bootstrapInit()`:
   - Test with missing `configs.json` → should create full default config.
   - Test with empty `configs.json` → should create full default config.
   - Test with partial `configs.json` → should merge defaults, preserving user values.
   - Test with complete `configs.json` → should not overwrite.
   - Test `tool_registry` specifically: default tools present, user tools preserved.
2. Mock file system operations.

**Verify:**
- Run `npm test -- tests/config/bootstrap-init.test.ts`.
- All tests pass.

**Done:** Tests written and passing.

### Task 4: Integration Test
**Type:** tdd
**Files:** `tests/integration/bootstrap-flow.test.ts` (new)
**Action:**
1. Write integration test that:
   - Calls `bootstrapInit()` in a temporary directory.
   - Reads resulting `configs.json`.
   - Validates against `GovernanceConfigsSchema`.
   - Asserts all expected fields are present (agents, commands, tools, rules, etc.).
2. Clean up temporary directory.

**Verify:**
- Run `npm test -- tests/integration/bootstrap-flow.test.ts`.
- Test passes.

**Done:** Integration test passes.

## Dependency Graph
- Task 1 (Bootstrap Logic) depends on SR-11-01 (Schema + Defaults).
- Task 2 (Merge Utility) can be done in parallel with Task 1.
- Task 3 (Bootstrap Tests) depends on Task 1.
- Task 4 (Integration Test) depends on Task 1.

## Threat Model
- **Risk:** Merge overwrites user customizations.
  - **Mitigation:** Use deep merge with user values taking precedence.
- **Risk:** Bootstrap fails on corrupt config.
  - **Mitigation:** Validate schema; fallback to defaults on error.

## Verification
1. Run `npm run typecheck` — passes.
2. Run `npm test` — all tests pass.
3. Manually test bootstrap in a clean directory.

## Success Criteria
- [ ] `bootstrapInit()` creates full default config when `configs.json` missing.
- [ ] `bootstrapInit()` merges defaults non-destructively.
- [ ] `tool_registry` is properly merged.
- [ ] Unit and integration tests pass.
