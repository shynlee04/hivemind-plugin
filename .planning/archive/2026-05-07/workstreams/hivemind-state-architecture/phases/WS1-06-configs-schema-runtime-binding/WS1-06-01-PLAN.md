---
phase: WS1-06
plan: 01
type: tdd
wave: 1
depends_on: []
status: superseded
superseded_by: CA-01-01-PLAN.md
superseded_date: 2026-05-06
files_modified:
  - src/schema-kernel/hivemind-configs.schema.ts
  - tests/schema-kernel/hivemind-configs.schema.test.ts
  - .hivemind/configs.json
autonomous: true
requirements:
  - REQ-WS1-02
  - REQ-WS1-03
  - REQ-WS1-05

must_haves:
  truths:
    - "HivemindConfigsSchema parses the full skeleton v2 §9.1 schema including workflow object with ~15 toggles"
    - "Existing 5-field configs.json parses correctly under the expanded schema (backward compatible)"
    - "Invalid enum values for mode, user_expert_level, discuss_mode are rejected"
    - "All workflow toggle defaults match skeleton v2 §9.1 specification"
    - "parallelization, atomic_commit, commit_docs are top-level boolean fields"
  artifacts:
    - path: "src/schema-kernel/hivemind-configs.schema.ts"
      provides: "Expanded Zod schema for configs.json with workflow, parallelization, atomic_commit, commit_docs"
      exports: ["HivemindConfigsSchema", "HivemindConfigs", "WorkflowConfigSchema", "readConfigs", "writeConfigs", "getDefaultConfigs"]
    - path: "tests/schema-kernel/hivemind-configs.schema.test.ts"
      provides: "Test coverage for expanded schema validation (positive, negative, defaults)"
      contains: "describe.*HivemindConfigs"
    - path: ".hivemind/configs.json"
      provides: "Updated runtime config matching full skeleton v2 §9.1 schema"
  key_links:
    - from: "src/schema-kernel/hivemind-configs.schema.ts"
      to: ".hivemind/configs.json"
      via: "readConfigs() parses the JSON file through Zod schema"
      pattern: "HivemindConfigsSchema\\.safeParse"
    - from: "src/plugin.ts"
      to: "src/schema-kernel/hivemind-configs.schema.ts"
      via: "imports readConfigs at composition root"
      pattern: "import.*readConfigs"
---

<objective>
Expand the Hivemind configs.json Zod schema from the current 5-field minimal to the full skeleton v2 §9.1 specification, adding the `workflow` object (~15 toggles), `parallelization`, `atomic_commit`, and `commit_docs` fields.

Purpose: This is the schema foundation that Plan 02 (runtime binding) consumes. Without the expanded schema, no config-driven behavior can exist in plugin.ts or hooks. Per D-CONF-04, configs.json MUST match skeleton v2 §9.1 full schema.

Output: Expanded `hivemind-configs.schema.ts`, comprehensive tests, updated `.hivemind/configs.json`.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/workstreams/hivemind-state-architecture/CONTEXT.md
@.planning/workstreams/hivemind-state-architecture/ROADMAP.md
@.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md
@src/schema-kernel/hivemind-configs.schema.ts
@tests/schema-kernel/hivemind-configs.schema.test.ts
@.hivemind/configs.json

<interfaces>
<!-- Current schema exports the executor will build upon -->
From src/schema-kernel/hivemind-configs.schema.ts:
```typescript
export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "1.0.0"
export const SupportedLanguageSchema = z.enum(["en", "vi", "zh", "fr", "ja", "ko", "de", "es", "th", "id"])
export const HivemindModeSchema = z.enum(["expert-advisor", "hivemind-powered", "free-style"])
export const UserExpertLevelSchema = z.enum(["clumsy-vibecoder", "beginner-friendly", "intermediate-high-level", "architecture-driven", "absolute-expert"])
export const DelegationSystemsSchema = z.object({...}).default({...})
export const HivemindConfigsSchema = z.object({...}).strip()
export function getDefaultConfigs(): HivemindConfigs
export function getConfigsPath(projectRoot: string): string
export function readConfigs(projectRoot: string): HivemindConfigs
export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs
```

From skeleton v2 §9.1 (NEW fields to add):
```typescript
// Top-level additions:
parallelization: z.boolean().default(true)
atomic_commit: z.boolean().default(true)
commit_docs: z.boolean().default(true)

// workflow object:
workflow: z.object({
  research: z.boolean().default(true),
  cross_session_tasks_dependencies_validation: z.boolean().default(false),
  trajectory_control: z.boolean().default(false),
  advanced_continuity_validation: z.boolean().default(false),
  task_plus_enabled: z.boolean().default(false),
  plan_check: z.boolean().default(true),
  verifier: z.boolean().default(true),
  ui_phase: z.boolean().default(false),
  ui_safety_gate: z.boolean().default(false),
  ai_integration_phase: z.boolean().default(false),
  research_before_questions: z.boolean().default(true),
  discuss_mode: z.enum(["sufficient-phase-discussion", "intensive-phase-discussion", "skip-phase-discussion"]).default("sufficient-phase-discussion"),
  use_worktrees: z.boolean().default(false),
}).default({...all defaults...})
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Expand Zod schema to full skeleton v2 §9.1</name>
  <files>src/schema-kernel/hivemind-configs.schema.ts, tests/schema-kernel/hivemind-configs.schema.test.ts, .hivemind/configs.json</files>
  <behavior>
    - Test 1: Full config with all §9.1 fields (workflow object, parallelization, atomic_commit, commit_docs) parses successfully via HivemindConfigsSchema.safeParse()
    - Test 2: Empty object {} produces correct defaults matching skeleton v2 §9.1 exactly
    - Test 3: Invalid discuss_mode value "invalid-mode" is rejected
    - Test 4: Invalid mode value "custom" is rejected
    - Test 5: Invalid user_expert_level value "pro" is rejected
    - Test 6: workflow.discuss_mode accepts all 3 enum values ("sufficient-phase-discussion", "intensive-phase-discussion", "skip-phase-discussion")
    - Test 7: Partial config (missing workflow) fills workflow with defaults
    - Test 8: Unknown fields are stripped (existing test — verify still passes)
    - Test 9: readConfigs() returns defaults when file is missing
    - Test 10: readConfigs() returns defaults when JSON is invalid
    - Test 11: writeConfigs() validates and persists expanded config
    - Test 12: Existing 5-field configs.json (current production file) parses correctly under expanded schema
    - Test 13: parallelization, atomic_commit, commit_docs default to true, true, true respectively
    - Test 14: All workflow boolean toggles default to their skeleton v2 §9.1 values
  </behavior>
  <action>
    RED phase — Write failing tests first:

    1. Read `src/schema-kernel/hivemind-configs.schema.ts` (current 5-field schema) and `tests/schema-kernel/hivemind-configs.schema.test.ts` (existing tests).

    2. Add new test cases to the test file for ALL behaviors listed in `<behavior>` above. Run `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` — tests MUST fail (schema doesn't have workflow/parallelization/atomic_commit/commit_docs yet).

    3. GREEN phase — Expand `hivemind-configs.schema.ts`:

    a. Bump `HIVEMIND_CONFIGS_SCHEMA_VERSION` to `"2.0.0"` (breaking schema addition).

    b. Add `DiscussModeSchema` enum:
    ```typescript
    export const DiscussModeSchema = z.enum([
      "sufficient-phase-discussion",
      "intensive-phase-discussion",
      "skip-phase-discussion",
    ])
    export type DiscussMode = z.infer<typeof DiscussModeSchema>
    ```

    c. Add `WorkflowConfigSchema` object with all 13 workflow toggles per skeleton v2 §9.1:
    - `research: z.boolean().default(true)`
    - `cross_session_tasks_dependencies_validation: z.boolean().default(false)`
    - `trajectory_control: z.boolean().default(false)`
    - `advanced_continuity_validation: z.boolean().default(false)`
    - `task_plus_enabled: z.boolean().default(false)`
    - `plan_check: z.boolean().default(true)`
    - `verifier: z.boolean().default(true)`
    - `ui_phase: z.boolean().default(false)`
    - `ui_safety_gate: z.boolean().default(false)`
    - `ai_integration_phase: z.boolean().default(false)`
    - `research_before_questions: z.boolean().default(true)`
    - `discuss_mode: DiscussModeSchema.default("sufficient-phase-discussion")`
    - `use_worktrees: z.boolean().default(false)`
    Export `WorkflowConfigSchema` and `WorkflowConfig` type.

    d. Add to `HivemindConfigsSchema` the new top-level fields:
    - `parallelization: z.boolean().default(true)`
    - `atomic_commit: z.boolean().default(true)`
    - `commit_docs: z.boolean().default(true)`
    - `workflow: WorkflowConfigSchema` (uses the schema's default)

    e. Keep existing fields (`conversationLanguage`, `documentsLanguage`, `mode`, `userExpertLevel`, `delegationSystems`) unchanged.

    f. Ensure JSDoc on all new schema sections with `@example` per project code style.

    4. Update `.hivemind/configs.json` to include the full schema with all fields and their defaults matching skeleton v2 §9.1. Use snake_case for field names as specified in the skeleton (the Zod schema can use `z.object({...})` with `.transform()` or direct mapping — but the JSON file MUST use snake_case as skeleton specifies).

    IMPORTANT: The skeleton uses `snake_case` for JSON field names (`conversation_language`, `documents_and_artifacts_language`, `user_expert_level`) but the current schema uses `camelCase`. Per D-CONF-04, the schema MUST match skeleton v2 §9.1. Update field names in the Zod schema to use `snake_case` to match the skeleton JSON convention. Update all existing tests accordingly.

    5. Run `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` — all tests MUST pass.

    6. REFACTOR — Clean up: ensure no `any` types, all new types exported, JSDoc on public API, module stays under 500 LOC.

    7. Run full test suite: `npm test` — zero regressions.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>
    - HivemindConfigsSchema includes workflow object with 13 toggles matching skeleton v2 §9.1
    - Top-level parallelization, atomic_commit, commit_docs fields exist with correct defaults
    - All field names use snake_case matching skeleton v2 §9.1
    - Existing 5-field configs.json parses correctly under expanded schema (backward compatible)
    - Invalid enum values rejected for mode, user_expert_level, discuss_mode
    - All new types exported: WorkflowConfigSchema, WorkflowConfig, DiscussModeSchema, DiscussMode
    - Schema version bumped to 2.0.0
    - Test count for schema tests increased by ≥14 new test cases
    - Full test suite passes with 0 regressions
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| disk → schema | configs.json is user-editable, untrusted input |
| schema → runtime | Parsed config values flow to hooks/tools as trusted |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-WS1-06-01 | S | readConfigs() | mitigate | Schema validation via Zod strips unknown fields, rejects invalid enums — prevents injection of unexpected config values |
| T-WS1-06-02 | T | .hivemind/configs.json | mitigate | `readConfigs()` returns defaults on invalid JSON — corrupt file cannot crash plugin |
| T-WS1-06-03 | I | workflow toggles | accept | Config values control feature flags, not security boundaries — disclosure risk is minimal |
| T-WS1-06-04 | D | readConfigs() | mitigate | `existsSync` + try/catch with default fallback — missing file cannot block plugin startup |
</threat_model>

<verification>
- `npm test` passes with 0 regressions
- `npm run typecheck` passes with 0 errors
- `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` covers all 14+ new test cases
- `cat .hivemind/configs.json | jq .workflow.discuss_mode` returns "sufficient-phase-discussion"
</verification>

<success_criteria>
- configs.json Zod schema contains ALL fields from skeleton v2 §9.1
- Every new field has a default value matching the skeleton specification
- Backward compatible: existing configs.json files parse correctly
- Zero regressions: `npm test` passes
- Test coverage for schema validation ≥95% of branches
</success_criteria>

<output>
After completion, create `.planning/workstreams/hivemind-state-architecture/phases/WS1-06-configs-schema-runtime-binding/WS1-06-01-SUMMARY.md`
</output>
