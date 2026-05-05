---
phase: CA-01
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/schema-kernel/hivemind-configs.schema.ts
  - src/schema-kernel/index.ts
  - .hivemind/configs.json
  - tests/schema-kernel/hivemind-configs.schema.test.ts
autonomous: true
requirements:
  - D-CONF-01
  - D-CONF-04
  - D-CONF-05
  - D-BIND-03

must_haves:
  truths:
    - "configs.json contains all fields from skeleton v2 §9.1: language, mode, expertise, delegation, execution, and workflow toggles"
    - "HivemindConfigsSchema validates the full skeleton v2 §9.1 schema with correct types and defaults"
    - "readConfigs() returns the expanded config with defaults for all new fields"
    - "writeConfigs() persists the expanded schema correctly"
    - "Existing 28 tests pass plus new tests for every added field"
  artifacts:
    - path: "src/schema-kernel/hivemind-configs.schema.ts"
      provides: "Full skeleton v2 §9.1 Zod schema with HivemindConfigsSchema, readConfigs, writeConfigs"
      exports: ["HivemindConfigsSchema", "WorkflowConfigSchema", "HivemindConfigs", "readConfigs", "writeConfigs", "getDefaultConfigs"]
    - path: ".hivemind/configs.json"
      provides: "Canonical configs.json matching skeleton v2 §9.1"
      contains: "workflow"
    - path: "tests/schema-kernel/hivemind-configs.schema.test.ts"
      provides: "Schema validation tests for all new fields"
      contains: "describe(\"WorkflowConfigSchema\""
  key_links:
    - from: "src/schema-kernel/hivemind-configs.schema.ts"
      to: ".hivemind/configs.json"
      via: "readConfigs / writeConfigs"
      pattern: "readConfigs\\(.*projectRoot"
---

<objective>
Expand the configs.json Zod schema from 5-field minimal to full skeleton v2 §9.1 schema including the `workflow` object with ~15 toggles, execution fields, and snake_case JSON key naming. Ensure backward compatibility with existing camelCase configs.

Purpose: This is the data foundation for all runtime binding. Every subsequent plan and phase depends on the expanded config schema being correct, tested, and loadable.

Output: Expanded Zod schema, updated configs.json, comprehensive test coverage.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/core-architecture/ROADMAP.md
@.planning/workstreams/core-architecture/STATE.md
@.planning/workstreams/hivemind-state-architecture/CONTEXT.md
@.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/schema-kernel/hivemind-configs.schema.ts (CURRENT — 5-field minimal):
```typescript
export const HivemindConfigsSchema = z.object({
  conversationLanguage: SupportedLanguageSchema.default("en"),
  documentsLanguage: SupportedLanguageSchema.default("en"),
  mode: HivemindModeSchema.default("expert-advisor"),
  userExpertLevel: UserExpertLevelSchema.default("intermediate-high-level"),
  delegationSystems: DelegationSystemsSchema,
}).strip()

export function readConfigs(projectRoot: string): HivemindConfigs
export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs
export function getDefaultConfigs(): HivemindConfigs
export function getConfigsPath(projectRoot: string): string
```

From src/schema-kernel/index.ts (re-exports):
```typescript
export {
  HIVEMIND_CONFIGS_SCHEMA_VERSION,
  HivemindConfigsSchema,
  getDefaultConfigs,
  getConfigsPath,
  readConfigs,
  writeConfigs,
} from "./hivemind-configs.schema.js"
```

Target schema from skeleton v2 §9.1 (ALL fields):
```jsonc
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "expert-advisor",
  "user_expert_level": "intermediate-high-level",
  "delegation_systems": { "native_task": true, "delegate_task": true, "background_delegation": false },
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "workflow": {
    "research": true,
    "cross_session_tasks_dependencies_validation": false,
    "trajectory_control": false,
    "advanced_continuity_validation": false,
    "task_plus_enabled": false,
    "plan_check": true,
    "verifier": true,
    "ui_phase": false,
    "ui_safety_gate": false,
    "ai_integration_phase": false,
    "research_before_questions": true,
    "discuss_mode": "sufficient-phase-discussion",
    "use_worktrees": false
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Expand Zod schema to full skeleton v2 §9.1 with snake_case JSON keys</name>
  <files>src/schema-kernel/hivemind-configs.schema.ts, src/schema-kernel/index.ts</files>
  <behavior>
    - Test: WorkflowConfigSchema validates all 13 workflow toggle fields with correct defaults
    - Test: WorkflowConfigSchema rejects invalid discuss_mode values
    - Test: HivemindConfigsSchema validates full config with all new fields (parallelization, atomic_commit, commit_docs, workflow)
    - Test: HivemindConfigsSchema applies defaults for all new fields when omitted
    - Test: readConfigs() accepts legacy camelCase JSON keys and migrates to snake_case
    - Test: writeConfigs() always writes snake_case JSON keys
    - Test: Existing tests (28) continue to pass unchanged
  </behavior>
  <action>
    **READ FIRST:** `src/schema-kernel/hivemind-configs.schema.ts` (current schema), `.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md` lines 536-623 (skeleton v2 §9.1 target), `tests/schema-kernel/hivemind-configs.schema.test.ts` (existing test patterns)

    1. **Rename JSON keys to snake_case** — Use Zod's `.transform()` or a key-mapping layer so the canonical JSON format uses snake_case (`conversation_language`, `documents_and_artifacts_language`, `user_expert_level`, `delegation_systems`) per skeleton v2 §9.1, while TypeScript types can remain camelCase internally. Add a `LEGACY_KEY_MAP` that maps old camelCase keys to new snake_case keys. In `readConfigs()`, apply key migration before parsing: iterate `LEGACY_KEY_MAP` entries, rename any old keys found in the parsed JSON.

    2. **Add execution fields** — Add to `HivemindConfigsSchema`:
       - `parallelization: z.boolean().default(true)`
       - `atomic_commit: z.boolean().default(true)`
       - `commit_docs: z.boolean().default(true)`

    3. **Create WorkflowConfigSchema** — New nested object schema:
       ```typescript
       export const WorkflowConfigSchema = z.object({
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
       }).default({})
       ```

    4. **Add workflow field to HivemindConfigsSchema** — `workflow: WorkflowConfigSchema`

    5. **Rename top-level fields** — Change JSON key names:
       - `conversationLanguage` → `conversation_language`
       - `documentsLanguage` → `documents_and_artifacts_language`
       - `userExpertLevel` → `user_expert_level`
       Keep TypeScript type property names as-is (camelCase) via key mapping.

    6. **Update `writeConfigs()`** — Always write snake_case JSON keys. Use a `toSnakeCase()` mapping at the serialization boundary.

    7. **Export new types** — Add `WorkflowConfigSchema`, `WorkflowConfig`, `DiscussMode` to `src/schema-kernel/index.ts` re-exports.

    8. **Update `HIVEMIND_CONFIGS_SCHEMA_VERSION`** — Bump to `"2.0.0"` (breaking schema change).

    **CONSTRAINTS:** Module must stay under 500 LOC. If adding key migration logic pushes over 500 LOC, extract the migration logic into a separate `src/schema-kernel/config-migration.ts` helper. Do NOT use `any` types. Use `import type` for type-only imports per `verbatimModuleSyntax: true`.
  </action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts</automated>
  </verify>
  <done>
    - HivemindConfigsSchema validates full skeleton v2 §9.1 with all fields
    - WorkflowConfigSchema validates 13 workflow toggles with defaults
    - readConfigs() accepts both camelCase (legacy) and snake_case (canonical) JSON keys
    - writeConfigs() always outputs snake_case JSON keys
    - All existing 28 tests + new tests pass
    - Module under 500 LOC
    - Schema version bumped to 2.0.0
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update configs.json and expand test coverage</name>
  <files>.hivemind/configs.json, tests/schema-kernel/hivemind-configs.schema.test.ts</files>
  <behavior>
    - Test: readConfigs() reads the updated .hivemind/configs.json with all new fields
    - Test: readConfigs() migrates old camelCase configs.json to snake_case
    - Test: Each workflow toggle independently defaults correctly
    - Test: round-trip writeConfigs → readConfigs preserves all fields
    - Test: getDefaultConfigs() returns complete config with all new fields
  </behavior>
  <action>
    **READ FIRST:** `.hivemind/configs.json` (current minimal config), `tests/schema-kernel/hivemind-configs.schema.test.ts` (existing tests to extend)

    1. **Update `.hivemind/configs.json`** to the full skeleton v2 §9.1 schema with snake_case keys:
       ```json
       {
         "conversation_language": "en",
         "documents_and_artifacts_language": "en",
         "mode": "expert-advisor",
         "user_expert_level": "intermediate-high-level",
         "delegation_systems": {
           "native_task": true,
           "delegate_task": true,
           "background_delegation": false
         },
         "parallelization": true,
         "atomic_commit": true,
         "commit_docs": true,
         "workflow": {
           "research": true,
           "cross_session_tasks_dependencies_validation": false,
           "trajectory_control": false,
           "advanced_continuity_validation": false,
           "task_plus_enabled": false,
           "plan_check": true,
           "verifier": true,
           "ui_phase": false,
           "ui_safety_gate": false,
           "ai_integration_phase": false,
           "research_before_questions": true,
           "discuss_mode": "sufficient-phase-discussion",
           "use_worktrees": false
         }
       }
       ```

    2. **Add test cases** to `tests/schema-kernel/hivemind-configs.schema.test.ts`:
       - `describe("WorkflowConfigSchema")` — test each toggle default, test invalid discuss_mode, test all defaults applied when empty object
       - `describe("HivemindConfigsSchema — expanded fields")` — test parallelization/atomic_commit/commit_docs defaults, test workflow nested validation
       - `describe("Key migration")` — test readConfigs() with camelCase legacy file produces snake_case output, test writeConfigs→readConfigs round-trip
       - `describe("Full config read")` — test readConfigs() against updated `.hivemind/configs.json` returns all fields
       - `describe("getDefaultConfigs — expanded")` — test that defaults include all new fields with correct values

    **CONSTRAINTS:** Follow existing test patterns (describe/it, `sp()` helper for safeParse). No `any` types except the existing `sp()` helper. Use temp directories for file-based tests (follow existing `beforeEach`/`afterEach` pattern with `tmpdir()`).
  </action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts</automated>
  </verify>
  <done>
    - configs.json updated to full skeleton v2 §9.1 with snake_case keys
    - WorkflowConfigSchema test suite covers all 13 toggles
    - Key migration tests prove backward compatibility
    - Round-trip tests prove write→read fidelity
    - All tests pass (existing + new)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| disk → schema | configs.json is user-editable, untrusted input |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CA-01-01 | T | readConfigs() | mitigate | Zod `.strip()` removes unknown fields; `.safeParse()` catches malformed JSON; defaults applied on any parse failure |
| T-CA-01-02 | I | writeConfigs() | mitigate | Zod `.parse()` validates before write; mkdirSync with `recursive: true` prevents path traversal |
| T-CA-01-03 | D | readConfigs() | accept | Missing/corrupt config returns defaults — no crash, degraded functionality only |
</threat_model>

<verification>
1. `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` — all tests pass
2. `npm run typecheck` — 0 errors
3. `grep -c "workflow" src/schema-kernel/hivemind-configs.schema.ts` — ≥ 5 (workflow schema defined)
4. `grep "conversation_language" .hivemind/configs.json` — key present in snake_case
5. `grep "HIVEMIND_CONFIGS_SCHEMA_VERSION" src/schema-kernel/hivemind-configs.schema.ts` — version is "2.0.0"
</verification>

<success_criteria>
- configs.json has all fields from skeleton v2 §9.1 (12 top-level keys including workflow)
- HivemindConfigsSchema validates the full schema with correct types and defaults
- readConfigs() handles both legacy camelCase and canonical snake_case JSON keys
- writeConfigs() always outputs snake_case JSON keys
- All existing tests + new tests pass
- `npm run typecheck` passes with 0 errors
</success_criteria>

<output>
After completion, create `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-01-SUMMARY.md`
</output>
