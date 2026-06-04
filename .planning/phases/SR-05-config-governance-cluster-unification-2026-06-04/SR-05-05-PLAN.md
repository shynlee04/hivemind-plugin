---
phase: SR-05
plan: 05
type: auto
wave: 3
depends_on:
  - SR-05-02
  - SR-05-03
  - SR-05-04
files_modified:
  - .hivemind/governance/config.json (deleted)
  - src/cli/ (init command — config generation)
autonomous: true
requirements:
  - REQ-01
  - REQ-02
  - REQ-03
  - REQ-04
  - REQ-05
  - REQ-06
---

<objective>
Complete the migration by deleting the old governance config file, updating `hivemind init --yes` to generate the new extended config structure, and running full verification to ensure all requirements are met.

Purpose: Clean break from the old config system, ensure new projects get the correct config structure, and verify the entire phase deliverables.
Output: Old config deleted + init generates proper config + full verification passing.
</objective>

<context>
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-CONTEXT.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-RESEARCH.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-01-PLAN.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-02-PLAN.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-03-PLAN.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-04-PLAN.md
</context>

<tasks>
  <task id="01" type="auto">
    <name>Delete old governance/config.json</name>
    <files>
      <deleted>.hivemind/governance/config.json</deleted>
    </files>
    <read_first>
      - .hivemind/governance/config.json (verify content has been migrated to configs.json)
      - .hivemind/configs.json (verify governance field contains all migrated data)
      - SR-05-CONTEXT.md Decision 5 (delete immediately — no archive)
    </read_first>
    <action>
Delete `.hivemind/governance/config.json` per Decision 5 (clean break, no archive):

1. Verify all data from governance/config.json is present in configs.json.governance
2. Delete the file: `rm .hivemind/governance/config.json`
3. Verify no runtime consumers still reference the old file path (grep for `governance/config.json`)

The facade pattern in config-reader.ts (Plan 04) ensures all consumers read from the unified source.
    </action>
    <verify>
      - `test -f .hivemind/governance/config.json` exits 1 (file deleted)
      - `grep -r "governance/config.json" src/` returns no results (no consumers)
      - `.hivemind/configs.json` still has populated governance field
    </verify>
    <done>
Old governance/config.json deleted. No runtime consumers reference the old path. Unified config is the single source of truth.
    </done>
    <acceptance_criteria>
      - `.hivemind/governance/config.json` does not exist
      - `grep -r "governance/config.json" src/` returns no results
      - `.hivemind/configs.json` contains `governance` field with all migrated data
    </acceptance_criteria>
  </task>

  <task id="02" type="auto">
    <name>Update hivemind init to generate extended config with full registry</name>
    <files>
      <modified>src/cli/commands/init.ts</modified>
    </files>
    <read_first>
      - src/cli/commands/init.ts (init command — config generation logic)
      - src/schema-kernel/hivemind-configs.schema.ts (extended schema from SR-05-01)
      - .hivemind/configs.json (target structure with governance rules + full registry)
      - SR-05-SPEC.md REQ-04 and REQ-01 and REQ-06 acceptance criteria
      - SR-05-RESEARCH.md Registry Gap Analysis (discovery strategy)
    </read_first>
    <action>
Update `hivemind init --yes` to generate the extended config structure with full agent/command registry:

1. Update the default config template to include governance field with 5 rules AND full registry:
   - Glob `assets/agents/{hm,hf}-*.md` at init time to discover all 42 shipped agents
   - Glob `assets/commands/{hm,hf}-*.md` and `assets/command/{hm,hf}-*.md` to discover all shipped commands
   - Build `agent_configs` entries from each agent file's frontmatter (description, allowedCommands)
   - Build `command_agent_mappings` entries from each command file's frontmatter (description, agent)
   - Exclude all gsd-* entries from the registry
   - Include naming_standards with default values from governance/config.json

2. The generated governance section should look like:
   ```json
   {
     "governance": {
       "rules": [ ... 5 rules from SR-05-02 ... ],
       "naming_standards": {
         "allowed_frameworks": ["hm", "hf", "gate", "stack"],
         "allowed_classifications": ["orchestrator", "specialist", "coordinator"],
         "naming_format": "{framework}/{classification}/{domain}/{name}",
         "max_title_length": 128
       },
       "agent_configs": {
         "hm-architect": { "description": "...", "allowedCommands": [...] },
         "hm-executor": { "description": "...", "allowedCommands": [...] },
         ... 42 total entries ...
       },
       "command_agent_mappings": {
         "plan": { "description": "...", "agent": "hm-planner" },
         "audit": { "description": "...", "agent": "hm-nyquist-auditor" },
         ... 100+ total entries ...
       }
     }
   }
   ```

3. Ensure the generated config passes `HivemindConfigsSchema.parse()`.

4. Alternative approach if glob at init time is impractical: embed the full registry as a static JSON constant in the init module, generated by a build-time script. The constant must be updated when agents/commands are added. Document this in a code comment.
    </action>
    <verify>
      - `hivemind init --yes --root /tmp/test-init` creates configs.json with governance field
      - Generated configs.json has 5 governance rules
      - Generated configs.json has naming_standards
      - Generated configs.json has >= 42 agent_configs entries
      - Generated configs.json has >= 100 command_agent_mappings entries
      - `HivemindConfigsSchema.parse()` succeeds on generated config
      - No gsd-* entries in generated registry
    </verify>
    <done>
hivemind init --yes generates configs.json with populated governance field including 5 default rules, naming standards, and full agent/command registry (42 agents, 100+ commands).
    </done>
    <acceptance_criteria>
      - `hivemind init --yes` generates configs.json with `governance` field
      - Generated governance includes 5 rules (delegate-task, write/edit, create-session, bash)
      - Generated governance includes naming_standards with default values
      - Generated governance includes >= 42 agent_configs entries (all hm-* and hf-* agents)
      - Generated governance includes >= 100 command_agent_mappings entries (all shipped non-gsd-* commands)
      - No gsd-* entries in generated agent_configs or command_agent_mappings
      - Generated configs.json passes `HivemindConfigsSchema.parse()`
    </acceptance_criteria>
  </task>

  <task id="03" type="tdd">
    <name>Init config generation tests</name>
    <files>
      <created>tests/cli/init-governance-config.test.ts</created>
    </files>
    <read_first>
      - tests/cli/ (existing init test patterns if any)
      - src/cli/commands/init.ts (extended init from Task 02)
      - src/schema-kernel/hivemind-configs.schema.ts (schema for validation)
    </read_first>
    <action>
Create tests for init config generation:

1. Test: `hivemind init --yes` generates configs.json with governance field
2. Test: Generated governance.rules has exactly 5 entries
3. Test: Generated governance.rules contains all expected rule IDs
4. Test: Generated governance.naming_standards has expected fields
5. Test: Generated configs.json passes `HivemindConfigsSchema.parse()`
6. Test: Generated configs.json is backward compatible (existing fields preserved)
    </action>
    <verify>
      - `npx vitest run tests/cli/init-governance-config.test.ts` exits 0
      - All tests pass
    </verify>
    <done>
Init config generation tests. Verifies hivemind init produces valid governance config structure.
    </done>
    <acceptance_criteria>
      - `tests/cli/init-governance-config.test.ts` exists with at least 6 test cases
      - Tests verify governance rules count and content
      - Tests verify naming_standards structure
      - Tests verify schema validation passes
      - `npx vitest run tests/cli/init-governance-config.test.ts` exits 0
    </acceptance_criteria>
  </task>

  <task id="04" type="auto">
    <name>Full phase verification</name>
    <files>
      <created>.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-VERIFICATION.md</created>
    </files>
    <read_first>
      - SR-05-SPEC.md (all acceptance criteria)
      - SR-05-CONTEXT.md (all decisions)
      - All 5 PLAN.md files (deliverables)
    </read_first>
    <action>
Run full phase verification and create VERIFICATION.md:

1. Run typecheck: `npx tsc --noEmit`
2. Run all related tests:
   - `npx vitest run tests/schema-kernel/governance-config-schema.test.ts`
   - `npx vitest run tests/hooks/governance-evaluator.test.ts`
   - `npx vitest run tests/hooks/governance-integration.test.ts`
   - `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts`
   - `npx vitest run tests/features/governance-engine/create-governance-session.test.ts`
   - `npx vitest run tests/cli/init-governance-config.test.ts`
3. Verify all 12 acceptance criteria from SPEC.md (including REQ-06: SR05-AC-11, SR05-AC-12)
4. Verify all 6 decisions from CONTEXT.md are implemented
5. Verify full registry populate (REQ-06):
   - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.agent_configs).length)"` outputs >= 42
   - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.command_agent_mappings).length)"` outputs >= 100
   - No gsd-* entries in registry
6. Create VERIFICATION.md with results

VERIFICATION.md template:
```markdown
# Phase SR-05 Verification

**Date:** 2026-06-04
**Status:** [PASSED/FAILED]

## Acceptance Criteria

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SR05-AC-01 | governance field in configs.json | ✅ | ... |
| SR05-AC-11 | All 42 agents in agent_configs | ✅ | Object.keys(...).length >= 42 |
| SR05-AC-12 | All shipped commands in command_agent_mappings | ✅ | Object.keys(...).length >= 100 |
| ... | ... | ... | ... |

## Decisions Implemented

| ID | Decision | Status | Evidence |
|----|----------|--------|----------|
| D-01 | Merge Strategy | ✅ | ... |
| ... | ... | ... | ... |

## Test Results

| Test Suite | Result |
|------------|--------|
| governance-config-schema.test.ts | X/X pass |
| ... | ... |

## Typecheck

`npx tsc --noEmit`: [PASS/FAIL]

## Registry Coverage

| Registry | Count | Target | Status |
|----------|-------|--------|--------|
| agent_configs | X | >= 42 | ✅/✗ |
| command_agent_mappings | X | >= 100 | ✅/✗ |
| governance.rules | X | >= 5 | ✅/✗ |
```
    </action>
    <verify>
      - `npx tsc --noEmit` exits 0
      - All test suites pass
      - All 10 acceptance criteria verified
      - SR-05-VERIFICATION.md created with status PASSED
    </verify>
    <done>
Full phase verification complete. All acceptance criteria met. All decisions implemented. All tests passing. Typecheck clean.
    </done>
    <acceptance_criteria>
      - `npx tsc --noEmit` exits 0
      - All 6 test suites pass
      - All 12 SPEC acceptance criteria verified as PASSED (including SR05-AC-11, SR05-AC-12)
      - All 6 CONTEXT decisions verified as implemented
      - `configs.json.governance.agent_configs` has >= 42 entries
      - `configs.json.governance.command_agent_mappings` has >= 100 entries
      - No gsd-* entries in registry
      - `SR-05-VERIFICATION.md` exists with status PASSED
    </acceptance_criteria>
  </task>
</tasks>

<verification>
1. `npx tsc --noEmit` — typecheck clean
2. All 6 test suites pass
3. `.hivemind/governance/config.json` deleted
4. `hivemind init --yes` generates valid governance config with full registry
5. `configs.json.governance.agent_configs` has >= 42 entries (no gsd-*)
6. `configs.json.governance.command_agent_mappings` has >= 100 entries (no gsd-*)
7. SR-05-VERIFICATION.md created with status PASSED
</verification>

<success_criteria>
- Old governance/config.json deleted (clean break per Decision 5)
- hivemind init --yes generates configs.json with governance rules + naming standards + full registry
- configs.json.governance.agent_configs has all 42 shipped agents (REQ-06)
- configs.json.governance.command_agent_mappings has all shipped commands (REQ-06)
- All 12 SPEC acceptance criteria pass (including SR05-AC-11, SR05-AC-12)
- All 6 CONTEXT decisions implemented
- All tests pass (6 test suites)
- Typecheck clean
- VERIFICATION.md created with status PASSED
</success_criteria>

<must_haves>
  <truths>
    - "governance/config.json deleted — single source of truth is configs.json"
    - "hivemind init --yes generates governance rules, naming standards, and full registry"
    - "configs.json.governance.agent_configs contains ALL 42 shipped agents (31 hm-* + 11 hf-*)"
    - "configs.json.governance.command_agent_mappings contains ALL shipped non-gsd-* commands (>= 100)"
    - "No gsd-* entries in shipped registry"
    - "All 12 acceptance criteria from SPEC.md are met"
    - "All 6 decisions from CONTEXT.md are implemented"
    - "Full test suite passes without regressions"
  </truths>
  <artifacts>
    - .hivemind/governance/config.json (deleted)
    - src/cli/commands/init.ts (modified — governance config generation with full registry)
    - tests/cli/init-governance-config.test.ts (created)
    - .planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-VERIFICATION.md (created)
  </artifacts>
</must_haves>
