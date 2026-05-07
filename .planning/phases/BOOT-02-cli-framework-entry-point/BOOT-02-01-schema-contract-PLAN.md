---
phase: BOOT-02-cli-framework-entry-point
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/schema-kernel/generate-config-json-schema.ts
  - src/schema-kernel/index.ts
  - package.json
  - .hivemind/configs.schema.json
  - tests/schema-kernel/generate-config-json-schema.test.ts
autonomous: true
requirements:
  - BOOT02-SPEC-11-schema-file-generation
  - BOOT02-SPEC-13-contract-tests
user_setup: []
must_haves:
  truths:
    - "Generated `.hivemind/configs.schema.json` is valid JSON and contains the BOOT-02 config fields from D-02/D-08."
    - "`npm run build` regenerates the schema artifact from source and ships it in package files."
    - "Schema generator behavior is covered by a focused contract test."
  artifacts:
    - path: "src/schema-kernel/generate-config-json-schema.ts"
      provides: "deterministic config JSON Schema generation"
      exports: ["generateHivemindConfigsJsonSchema", "writeConfigJsonSchema"]
    - path: ".hivemind/configs.schema.json"
      provides: "committed generated JSON Schema artifact"
    - path: "tests/schema-kernel/generate-config-json-schema.test.ts"
      provides: "SPEC-11 contract tests"
  key_links:
    - from: "src/schema-kernel/generate-config-json-schema.ts"
      to: "src/schema-kernel/hivemind-configs.schema.ts"
      via: "schema source of truth"
      pattern: "HivemindConfigsSchema|HIVEMIND_CONFIGS_SCHEMA_VERSION"
    - from: "package.json"
      to: "dist/schema-kernel/generate-config-json-schema.js"
      via: "post-tsc build command"
      pattern: "generate-config-json-schema"
---

<objective>
Create the generated config JSON Schema contract required by SPEC-11 and D-07.

Purpose: make `configs.schema.json` a shipped, build-regenerated artifact that BOOT-02 init can copy into target projects and doctor can validate.
Output: generator source, committed schema artifact, package build/package wiring, and focused contract tests.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md
@src/schema-kernel/hivemind-configs.schema.ts
@src/schema-kernel/index.ts
@package.json

<interfaces>
Expected existing exports from `src/schema-kernel/hivemind-configs.schema.ts`:
```ts
export const HivemindConfigsSchema
export type HivemindConfigs
export function getDefaultConfigs(): HivemindConfigs
export function getConfigsPath(projectRoot: string): string
```
</interfaces>
</context>

<tasks>
<task id="T01-1" type="auto" tdd="true">
  <name>Task 1: Add config schema generator contract</name>
  <files>src/schema-kernel/generate-config-json-schema.ts, src/schema-kernel/index.ts, tests/schema-kernel/generate-config-json-schema.test.ts</files>
  <behavior>
    - RED: test expects `generateHivemindConfigsJsonSchema()` to return an object with `$schema`, `type: "object"`, and properties for `conversation_language`, `documents_and_artifacts_language`, `mode`, `user_expert_level`, and `delegation_systems` per D-02/D-08.
    - RED: test expects `writeConfigJsonSchema(tempRoot)` to write valid JSON at `<tempRoot>/.hivemind/configs.schema.json` without modifying repository state.
  </behavior>
  <action>Per SPEC-11 and D-07, create `src/schema-kernel/generate-config-json-schema.ts` with exported functions `generateHivemindConfigsJsonSchema()` and `writeConfigJsonSchema(projectRoot = process.cwd())`. Use deterministic manual serialization or existing in-repo schema metadata; do not add dependencies. Export these helpers from `src/schema-kernel/index.ts`. All exported functions must have JSDoc describing purpose, parameters, return value, filesystem side effects, and an example call.</action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/generate-config-json-schema.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Generator exports are documented, tests cover returned schema shape and temp-root write behavior, and TypeScript passes.</done>
</task>

<task id="T01-2" type="auto" tdd="true">
  <name>Task 2: Wire build and shipped schema artifact</name>
  <files>package.json, .hivemind/configs.schema.json, tests/schema-kernel/generate-config-json-schema.test.ts</files>
  <behavior>
    - RED: test or source assertion expects `package.json` build script to run `node dist/schema-kernel/generate-config-json-schema.js` after `tsc`.
    - RED: test expects `package.json.files` to include `.hivemind/configs.schema.json`.
    - GREEN: `.hivemind/configs.schema.json` parses as valid JSON and contains D-02 fields.
  </behavior>
  <action>Per SPEC-11 and D-07, update `package.json` build script so schema generation runs after TypeScript compilation, and ensure package files include `.hivemind/configs.schema.json`. Generate and commit `.hivemind/configs.schema.json`. Do not add or remove dependencies.</action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/generate-config-json-schema.test.ts</automated>
    <automated>npm run build</automated>
    <automated>node -e "JSON.parse(require('node:fs').readFileSync('.hivemind/configs.schema.json','utf8')); console.log('schema-json-ok')"</automated>
  </verify>
  <done>Build regenerates a committed schema artifact, package metadata ships it, and schema JSON parses successfully.</done>
</task>
</tasks>

<review_checklist>
- Every new exported function in `generate-config-json-schema.ts` has JSDoc with summary, params, returns, side effects, and example.
- No new npm dependency was added for schema conversion.
- `tests/schema-kernel/generate-config-json-schema.test.ts` is present in frontmatter and validates both generator output and write behavior.
</review_checklist>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-01-01 | Tampering | schema output path | mitigate | `writeConfigJsonSchema` must resolve the target under the provided project root and only write `.hivemind/configs.schema.json`. |
| T-BOOT02-01-02 | Repudiation | generated artifact drift | mitigate | Build command regenerates artifact; tests parse committed output and assert required properties. |
</threat_model>

<verification>
Run this plan's focused tests plus build. Full-suite and coverage are deferred to `BOOT-02-04-registration-evidence-PLAN.md` so SPEC-13 is verified once all new files exist.
</verification>

<success_criteria>
SPEC-11 and the schema portion of SPEC-13 are satisfied with a documented generator, generated artifact, build integration, and focused contract tests.
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-01-SUMMARY.md`.
</output>
