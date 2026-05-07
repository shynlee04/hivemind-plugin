---
phase: BOOT-02-cli-framework-entry-point
plan: 02
type: execute
wave: 2
depends_on:
  - BOOT-02-01-schema-contract-PLAN.md
files_modified:
  - src/schema-kernel/bootstrap.schema.ts
  - src/schema-kernel/index.ts
  - src/tools/bootstrap-init.ts
  - src/tools/bootstrap-recover.ts
  - src/plugin.ts
  - tests/tools/bootstrap-init.test.ts
  - tests/tools/bootstrap-recover.test.ts
  - tests/plugin/bootstrap-tools-registration.test.ts
autonomous: true
requirements:
  - BOOT02-SPEC-01-init-tool
  - BOOT02-SPEC-02-recover-tool
  - BOOT02-SPEC-08-tool-schema-registration
  - BOOT02-SPEC-09-version-controlled-install
  - BOOT02-SPEC-10-config-initialization
  - BOOT02-SPEC-12-non-destructive-guarantee
  - BOOT02-SPEC-13-contract-tests
user_setup: []
must_haves:
  truths:
    - "Bootstrap init creates BOOT-02-owned Tier-1 directories, `.gitkeep` files, config files, version file, and directory-level primitive symlinks without overwriting real files."
    - "Bootstrap recover repairs missing/broken symlinks and skips real files."
    - "Bootstrap tools are registered in the plugin with Zod validation and no business logic moved into `plugin.ts`."
  artifacts:
    - path: "src/schema-kernel/bootstrap.schema.ts"
      provides: "Zod schemas and inferred types for bootstrap tools"
    - path: "src/tools/bootstrap-init.ts"
      provides: "write-side init implementation and OpenCode tool factory"
      exports: ["bootstrapInit", "createBootstrapInitTool"]
    - path: "src/tools/bootstrap-recover.ts"
      provides: "write-side recover implementation and OpenCode tool factory"
      exports: ["bootstrapRecover", "createBootstrapRecoverTool"]
    - path: "src/plugin.ts"
      provides: "bootstrap tool registration only"
  key_links:
    - from: "src/tools/bootstrap-init.ts"
      to: ".hivemind/configs.schema.json"
      via: "copy generated schema into target project"
      pattern: "configs.schema.json"
    - from: "src/plugin.ts"
      to: "src/tools/bootstrap-*.ts"
      via: "tool factories registered by name"
      pattern: "bootstrap-init|bootstrap-recover"
---

<objective>
Implement BOOT-02 write-side bootstrap tools and plugin tool registration.

Purpose: provide schema-validated mutation tools that CLI commands can call while preserving CQRS and non-destructive filesystem behavior.
Output: bootstrap Zod schemas, init/recover tools, plugin registration, and focused tool/plugin tests.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md
@src/lib/bootstrap-structure.ts
@src/schema-kernel/hivemind-configs.schema.ts
@src/shared/tool-response.ts
@src/shared/tool-helpers.ts
@src/plugin.ts

<interfaces>
Required existing constants from `src/lib/bootstrap-structure.ts`:
```ts
export const HIVE_MIND_DIR = ".hivemind" as const
export const OPEN_CODE_DIR = ".opencode" as const
export const META_BUILDER_DIR = ".hivefiver-meta-builder" as const
export const GITKEEP_FILE = ".gitkeep" as const
export const TIER_1_DIRECTORIES = ["state", "delegation", "event-tracker"] as const
export const PRIMITIVE_TYPES = ["agents", "skills", "commands"] as const
export function resolveHiveMindRoot(projectRoot: string): string
export function resolveOpenCodeRoot(projectRoot: string): string
export function resolveMetaBuilderRoot(projectRoot: string): string
```
</interfaces>
</context>

<tasks>
<task id="T02-1" type="auto" tdd="true">
  <name>Task 1: Define bootstrap schemas and init tool</name>
  <files>src/schema-kernel/bootstrap.schema.ts, src/schema-kernel/index.ts, src/tools/bootstrap-init.ts, tests/tools/bootstrap-init.test.ts</files>
  <behavior>
    - RED: temp-root test expects Tier-1 `.hivemind/state/.gitkeep`, `.hivemind/delegation/.gitkeep`, `.hivemind/event-tracker/.gitkeep` after init.
    - RED: temp-root test expects directory-level symlinks from `.opencode/agents|skills|commands/<name>` to relative `.hivefiver-meta-builder/<type>/<name>` targets per D-05.
    - RED: existing real files and existing `.hivemind/configs.json` remain byte-identical after init per SPEC-12.
    - RED: prior-version `.hivemind/state/version.json` causes backup to `.opencode-backup-<iso-date>/`; fresh install creates no backup per SPEC-09.
  </behavior>
  <action>Per SPEC-01, SPEC-09, SPEC-10, SPEC-12, D-03, D-04, D-05, D-07, and D-08, create `src/schema-kernel/bootstrap.schema.ts` with Zod input/result schemas and inferred types for init/recover. Implement `bootstrapInit(input)` in `src/tools/bootstrap-init.ts`. It must create only BOOT-02-owned Tier-1 dirs with `.gitkeep`, create `.opencode/agents|skills|commands`, create one directory-level symlink per `.hivefiver-meta-builder/<type>/<name>`, copy the generated `.hivemind/configs.schema.json` into the target `.hivemind/`, write `.hivemind/configs.json` as `$schema` only for non-interactive mode, merge wizard-provided config for interactive mode, and write `.hivemind/state/version.json`. If an existing version differs, back up existing `.opencode/` before replacing symlink-managed entries. Never overwrite non-symlink files or existing configs. Export `bootstrapInit` and `createBootstrapInitTool`. All exported functions/types intended for import must have JSDoc with params, return shape, side effects, non-destructive guarantee, and examples.</action>
  <verify>
    <automated>npx vitest run tests/tools/bootstrap-init.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Init tool creates required BOOT-02 filesystem surfaces, config/schema/version files, version backup behavior, symlinks, and result counts while preserving existing files.</done>
</task>

<task id="T02-2" type="auto" tdd="true">
  <name>Task 2: Implement recover tool with symlink classification</name>
  <files>src/schema-kernel/bootstrap.schema.ts, src/schema-kernel/index.ts, src/tools/bootstrap-recover.ts, tests/tools/bootstrap-recover.test.ts</files>
  <behavior>
    - RED: deleting three symlinks in temp `.opencode/skills/` returns `repaired: 3` and recreates exactly those symlinks.
    - RED: replacing an expected symlink with a real file returns skipped count and leaves file contents unchanged.
    - RED: broken symlink is detected and recreated to the correct relative target.
  </behavior>
  <action>Per SPEC-02, SPEC-12, D-05, and D-06, implement `bootstrapRecover(input)` in `src/tools/bootstrap-recover.ts` with project/global scope support. Walk `.hivefiver-meta-builder/agents`, `skills`, and `commands`; classify each target as `OK`, `MISSING`, `BROKEN`, or `FILE`; create MISSING symlinks; unlink and recreate BROKEN symlinks only; leave OK and FILE untouched. Return counts per primitive type and status. Export `bootstrapRecover` and `createBootstrapRecoverTool`. All exports must include JSDoc with params, return counts, mutation boundaries, and examples.</action>
  <verify>
    <automated>npx vitest run tests/tools/bootstrap-recover.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Recover tool restores missing/broken symlinks only and preserves every real file.</done>
</task>

<task id="T02-3" type="auto" tdd="true">
  <name>Task 3: Register bootstrap tools in plugin</name>
  <files>src/plugin.ts, tests/plugin/bootstrap-tools-registration.test.ts, tests/tools/bootstrap-init.test.ts, tests/tools/bootstrap-recover.test.ts</files>
  <behavior>
    - RED: plugin tool registry exposes `bootstrap-init` and `bootstrap-recover`.
    - RED: invalid bootstrap init/recover input fails schema validation before mutation.
  </behavior>
  <action>Per SPEC-08, import `createBootstrapInitTool` and `createBootstrapRecoverTool` into `src/plugin.ts` and register them under tool names `bootstrap-init` and `bootstrap-recover`. Preserve plugin as composition root: no filesystem business logic in `plugin.ts`. Add focused registration/invalid-input tests using existing plugin test patterns or a new `tests/plugin/bootstrap-tools-registration.test.ts` if no suitable file exists.</action>
  <verify>
    <automated>npx vitest run tests/plugin/bootstrap-tools-registration.test.ts tests/tools/bootstrap-init.test.ts tests/tools/bootstrap-recover.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>OpenCode plugin exposes both bootstrap tools through schema-validated registrations, and `plugin.ts` remains below 500 LOC.</done>
</task>
</tasks>

<review_checklist>
- New exports in `bootstrap.schema.ts`, `bootstrap-init.ts`, and `bootstrap-recover.ts` have JSDoc.
- Tests use temp directories and never mutate repository `.opencode/` or `.hivemind/` except reading committed fixtures.
- No non-symlink path is deleted or overwritten.
- `plugin.ts` contains registration only, not bootstrap business logic.
</review_checklist>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-02-01 | Tampering | projectRoot and symlink paths | mitigate | Normalize paths under selected root/global root; derive primitive names from filesystem entries, not user input. |
| T-BOOT02-02-02 | Tampering | `.opencode/` real files | mitigate | Use `lstat`; skip non-symlink entries; tests prove byte-identical preservation. |
| T-BOOT02-02-03 | Information disclosure | `.opencode-backup-<date>/` | accept | Backup remains inside user project and is not transmitted. |
| T-BOOT02-02-04 | Elevation of privilege | global scope | mitigate | Default project scope per D-03; fall back to project scope if global path unavailable or unwritable; never escalate privileges. |
</threat_model>

<verification>
Focused verification only in this wave; full-suite and coverage run in BOOT-02-04 after all new files exist.
</verification>

<success_criteria>
SPEC-01, SPEC-02, SPEC-08, SPEC-09, SPEC-10, SPEC-12, and tool portions of SPEC-13 are satisfied with bounded, documented, tested write-side tools.
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-02-SUMMARY.md`.
</output>
