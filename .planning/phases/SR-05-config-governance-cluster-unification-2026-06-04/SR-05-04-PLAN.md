---
phase: SR-05
plan: 04
type: auto
wave: 3
depends_on:
  - SR-05-02
  - SR-05-03
files_modified:
  - src/features/governance-engine/create-governance-session.ts
  - src/features/governance-engine/config-reader.ts
autonomous: true
requirements:
  - REQ-05
---

<objective>
Wire naming standards validation from the unified config into `create-governance-session.ts` so session titles are validated before creation, and ensure the governance evaluator integration fires correctly in tool-guard-hooks.

Purpose: Enforce naming standards at runtime (soft enforcement — warning for 1 phase per Decision 6) and verify the governance tool-guard integration works end-to-end.
Output: Updated create-governance-session with naming validation + facade config reader + integration tests.
</objective>

<context>
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-CONTEXT.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-RESEARCH.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-01-PLAN.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-02-PLAN.md
</context>

<tasks>
  <task id="01" type="auto">
    <name>Update readGovernanceConfig() facade to read from unified config</name>
    <files>
      <modified>src/features/governance-engine/config-reader.ts</modified>
    </files>
    <read_first>
      - src/features/governance-engine/config-reader.ts (full file — current readGovernanceConfig() at lines 103-135)
      - src/schema-kernel/hivemind-configs.schema.ts (extended schema from SR-05-01)
      - SR-05-CONTEXT.md Decision 2 (facade pattern)
      - SR-05-RESEARCH.md Pattern 1 (facade example)
    </read_first>
    <action>
Update `readGovernanceConfig()` at `src/features/governance-engine/config-reader.ts` to use facade pattern:

1. Keep the exported function signature unchanged:
   ```typescript
   export function readGovernanceConfig(projectRoot?: string): GovernanceConfig
   ```

2. Change implementation to read from unified config:
   ```typescript
   export function readGovernanceConfig(projectRoot?: string): GovernanceConfig {
     const root = projectRoot ?? process.cwd()
     const configs = readConfigs(root)
     return configs.governance as GovernanceConfig
   }
   ```

3. Remove the separate file reading logic (lines that read `.hivemind/governance/config.json`).

4. Remove `HIVEMIND_GOVERNANCE_CONFIG_PATH` env var override (line 84 per SPEC).

5. Preserve the `GovernanceConfig` return type — consumers should not need changes.

6. Update `resolveAgentForBrief()` and `validateNamingTitle()` to use the unified config source.
    </action>
    <verify>
      - `grep -c "readConfigs" src/features/governance-engine/config-reader.ts` returns >= 1
      - `grep -c "HIVEMIND_GOVERNANCE_CONFIG_PATH" src/features/governance-engine/config-reader.ts` returns 0
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
readGovernanceConfig() is now a facade over readConfigs().governance. Env var override removed. Backward compatible — same function signature and return type.
    </done>
    <acceptance_criteria>
      - `src/features/governance-engine/config-reader.ts` calls `readConfigs()` internally
      - `HIVEMIND_GOVERNANCE_CONFIG_PATH` env var reference removed
      - `readGovernanceConfig()` function signature unchanged
      - Return type unchanged (`GovernanceConfig`)
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="02" type="auto">
    <name>Add naming validation to create-governance-session</name>
    <files>
      <modified>src/features/governance-engine/create-governance-session.ts</modified>
    </files>
    <read_first>
      - src/features/governance-engine/create-governance-session.ts (full file — session creation logic at ~252 lines)
      - src/features/governance-engine/config-reader.ts (validateNamingTitle() function)
      - SR-05-CONTEXT.md Decision 6 (soft enforcement — warning for 1 phase)
      - SR-05-SPEC.md REQ-05 acceptance criteria
    </read_first>
    <action>
Add naming validation to `create-governance-session.ts` before session creation:

1. Import `validateNamingTitle` and `readGovernanceConfig` from config-reader.

2. Before the session creation logic, add validation:
   ```typescript
   const governanceConfig = readGovernanceConfig(projectRoot)
   const namingStandards = governanceConfig.naming_standards
   
   if (namingStandards) {
     const isValid = validateNamingTitle(sessionTitle, namingStandards)
     if (!isValid) {
       // Soft enforcement (Decision 6): warn but don't block
       logger.warn(`[Harness] Session title "${sessionTitle}" does not match naming standards`)
       // Optionally add warning to state manager
     }
   }
   ```

3. The session is still created even if validation fails (soft enforcement per Decision 6).

4. Log the warning using the project's logging mechanism.

5. Note: This graduates to blocking enforcement in a follow-up phase.
    </action>
    <verify>
      - `grep -c "validateNamingTitle" src/features/governance-engine/create-governance-session.ts` returns >= 1
      - `grep -c "naming_standards" src/features/governance-engine/create-governance-session.ts` returns >= 1
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
create-governance-session validates titles against naming standards. Soft enforcement — warns but does not block. Ready for graduation to blocking in follow-up phase.
    </done>
    <acceptance_criteria>
      - `src/features/governance-engine/create-governance-session.ts` imports `validateNamingTitle` and `readGovernanceConfig`
      - Session titles are validated against `naming_standards` before creation
      - Invalid titles produce a warning (not a block — soft enforcement per Decision 6)
      - Session is still created even when validation fails
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="03" type="tdd">
    <name>Naming validation and tool-guard integration tests</name>
    <files>
      <modified>tests/features/governance-engine/create-governance-session.test.ts</modified>
      <created>tests/hooks/governance-integration.test.ts</created>
    </files>
    <read_first>
      - tests/features/governance-engine/create-governance-session.test.ts (existing test patterns)
      - tests/hooks/governance-evaluator.test.ts (evaluator test patterns from SR-05-02)
      - tests/hooks/governance-block.test.ts (block format tests)
      - src/features/governance-engine/create-governance-session.ts (extended with naming validation from Task 02)
      - src/hooks/guards/tool-guard-hooks.ts (governance wire at line 158)
    </read_first>
    <action>
Create comprehensive tests for naming validation and tool-guard integration:

**File 1: tests/features/governance-engine/create-governance-session.test.ts** (extend existing)

1. Test: Valid session title passes validation — no warning logged
2. Test: Invalid session title triggers warning — session still created
3. Test: Missing naming_standards in config — no validation performed
4. Test: `validateNamingTitle("hm/governance/root/mapper/data-collection@0", standards)` returns true
5. Test: `validateNamingTitle("invalid/title", standards)` returns false

**File 2: tests/hooks/governance-integration.test.ts** (new)

1. Test: `tool.execute.before` hook calls `evaluateGovernance()` when rules are populated
2. Test: `tool.execute.before` hook skips governance when rules array is empty
3. Test: Block rule fires — tool execution blocked with `[Harness] Tool execution blocked by governance` error
4. Test: Warn rule fires — tool proceeds with warning added
5. Test: Escalate rule fires — escalation event recorded
6. Test: Depth-based rule fires correctly with mocked delegation metadata
7. Test: Multiple rules match — most restrictive action wins (block > warn > escalate)
    </action>
    <verify>
      - `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` exits 0
      - `npx vitest run tests/hooks/governance-integration.test.ts` exits 0
      - All new tests pass
    </verify>
    <done>
Comprehensive tests for naming validation (soft enforcement) and tool-guard integration (block/warn/escalate). Proves governance branch executes when rules are populated.
    </done>
    <acceptance_criteria>
      - `tests/features/governance-engine/create-governance-session.test.ts` contains at least 5 naming validation tests
      - `tests/hooks/governance-integration.test.ts` exists with at least 7 integration tests
      - Integration tests prove governance branch executes in tool-guard-hooks when rules populated
      - Integration tests prove governance branch skips when rules empty
      - Tests verify block/warn/escalate actions fire correctly
      - `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` exits 0
      - `npx vitest run tests/hooks/governance-integration.test.ts` exits 0
    </acceptance_criteria>
  </task>
</tasks>

<verification>
1. `npx tsc --noEmit` — typecheck clean
2. `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` — all tests pass
3. `npx vitest run tests/hooks/governance-integration.test.ts` — all tests pass
4. `npx vitest run tests/hooks/governance-evaluator.test.ts` — existing tests still pass
5. `readGovernanceConfig()` returns data from unified configs.json
6. Invalid session titles produce warnings (not blocks)
</verification>

<success_criteria>
- readGovernanceConfig() facade reads from unified config (readConfigs().governance)
- HIVEMIND_GOVERNANCE_CONFIG_PATH env var removed
- create-governance-session validates titles against naming standards (soft enforcement)
- Tool-guard integration tests prove governance branch executes when rules populated
- 12+ new tests pass (5 naming + 7 integration)
- Existing tests still pass (no regressions)
</success_criteria>

<must_haves>
  <truths>
    - "readGovernanceConfig() is a facade over readConfigs().governance"
    - "HIVEMIND_GOVERNANCE_CONFIG_PATH env var removed"
    - "create-governance-session validates titles before creation"
    - "Naming validation is soft enforcement (warn, not block) per Decision 6"
    - "tool-guard-hooks governance branch fires when rules are populated"
    - "tool-guard-hooks governance branch skips when rules array is empty"
  </truths>
  <artifacts>
    - src/features/governance-engine/config-reader.ts (modified — facade pattern)
    - src/features/governance-engine/create-governance-session.ts (modified — naming validation)
    - tests/features/governance-engine/create-governance-session.test.ts (modified — naming tests)
    - tests/hooks/governance-integration.test.ts (created — integration tests)
  </artifacts>
</must_haves>
