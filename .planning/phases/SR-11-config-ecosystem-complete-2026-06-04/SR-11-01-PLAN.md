# SR-11-01-PLAN: Schema + Defaults

## Objective
Extend the configuration schema to include a tool registry and provide comprehensive default governance content, ensuring the configuration system can represent the full set of agents, commands, tools, rules, and templates required by the Hivemind ecosystem.

## Context
Phase SR-11 requires completing the config ecosystem. This plan focuses on the foundational schema and defaults layer. The SPEC defines 4 requirements; this plan addresses the first two: ensuring the schema can represent all governance primitives and that sensible defaults exist.

**Source References:**
- SPEC: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-SPEC.md`
- CONTEXT: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-CONTEXT.md`
- RESEARCH: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-RESEARCH.md`

## Tasks

### Task 1: Schema Extension
**Type:** auto
**Files:** `src/schema-kernel/hivemind-configs.schema.ts`
**Action:**
1. Add `tool_registry` field to `GovernanceConfigsSchema` using `z.record(z.string(), z.object({...}))`.
2. Define the tool registry item schema: `{ name: string, description: string, permissions: z.array(z.string()) }`.
3. Ensure the schema is exported and type-safe.

**Verify:**
- Run `npm run typecheck` to ensure schema compiles.
- Inspect the generated types for `GovernanceConfigs`.

**Done:** Schema includes `tool_registry` field, typecheck passes.

### Task 2: Default Content Creation
**Type:** auto
**Files:** `src/config/defaults.ts` (new)
**Action:**
1. Create `defaults.ts` file.
2. Export `DEFAULT_GOVERNANCE_CONFIGS` object containing:
   - `agents`: 42 agent configurations (names + basic settings).
   - `commands`: 124 command definitions.
   - `tools`: 27 tool registry entries.
   - `rules`: 5 core rules.
   - `naming_standards`: naming convention map.
   - `templates`: standard templates.
3. Ensure all values match the schema from Task 1.

**Verify:**
- Import `DEFAULT_GOVERNANCE_CONFIGS` in a test file and validate against the schema.
- Run `npm run typecheck`.

**Done:** `defaults.ts` exists, exports valid default config object.

### Task 3: Default Provider Integration
**Type:** auto
**Files:** `src/config/index.ts`
**Action:**
1. Import `DEFAULT_GOVERNANCE_CONFIGS` from `./defaults`.
2. Modify `getDefaultConfigs()` to return `DEFAULT_GOVERNANCE_CONFIGS` (or merge with existing defaults).
3. Ensure the return type matches `GovernanceConfigs`.

**Verify:**
- Call `getDefaultConfigs()` in a test and assert it returns the expected structure.
- Run existing tests to ensure no regressions.

**Done:** `getDefaultConfigs()` returns full governance defaults.

### Task 4: Schema Unit Tests
**Type:** tdd
**Files:** `tests/schema/hivemind-configs.test.ts` (new or extend)
**Action:**
1. Write tests validating `GovernanceConfigsSchema` accepts valid `tool_registry` data.
2. Write tests validating schema rejects invalid `tool_registry` entries (e.g., missing fields, wrong types).
3. Write tests validating `DEFAULT_GOVERNANCE_CONFIGS` passes schema validation.

**Verify:**
- Run `npm test -- tests/schema/hivemind-configs.test.ts`.
- All tests pass.

**Done:** Tests written and passing.

## Dependency Graph
- Task 1 (Schema) must complete before Task 2 (Defaults) and Task 3 (Integration).
- Task 2 must complete before Task 3.
- Task 4 can run in parallel with Task 3 but depends on Task 1.

## Threat Model
- **Risk:** Schema changes break existing config loading.
  - **Mitigation:** Ensure backward compatibility; add `tool_registry` as optional or with defaults.
- **Risk:** Default values are incorrect or incomplete.
  - **Mitigation:** Validate defaults against schema in tests.

## Verification
1. Run `npm run typecheck` — passes.
2. Run `npm test` — all tests pass.
3. Manually inspect `defaults.ts` for completeness.

## Success Criteria
- [ ] `GovernanceConfigsSchema` includes `tool_registry`.
- [ ] `defaults.ts` exports complete default governance config.
- [ ] `getDefaultConfigs()` returns the new defaults.
- [ ] Unit tests for schema and defaults pass.
