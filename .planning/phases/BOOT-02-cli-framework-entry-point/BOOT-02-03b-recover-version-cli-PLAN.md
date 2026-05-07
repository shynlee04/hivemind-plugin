---
phase: BOOT-02-cli-framework-entry-point
plan: 03b
type: execute
wave: 3
depends_on:
  - BOOT-02-02-bootstrap-tools-PLAN.md
files_modified:
  - src/cli/commands/recover.ts
  - src/cli/commands/version.ts
  - tests/cli/commands/recover.test.ts
  - tests/cli/commands/version.test.ts
autonomous: true
requirements:
  - BOOT02-SPEC-05-recover-cli
  - BOOT02-SPEC-06-version-cli
  - BOOT02-SPEC-13-contract-tests
user_setup: []
must_haves:
  truths:
    - "`hivemind recover` wraps `bootstrapRecover`, repairs the selected primitive scope only, reports OK/REPAIRED/SKIPPED plus effective scope, and remains idempotent."
    - "`hivemind version` and `hivemind --version` print package metadata version without hardcoding."
  artifacts:
    - path: "src/cli/commands/recover.ts"
      provides: "recover CliCommand"
      exports: ["recoverCmd"]
    - path: "src/cli/commands/version.ts"
      provides: "version CliCommand"
      exports: ["versionCmd"]
  key_links:
    - from: "src/cli/commands/recover.ts"
      to: "src/tools/bootstrap-recover.ts"
      via: "recover handler delegates mutation"
      pattern: "bootstrapRecover\("
    - from: "src/cli/commands/version.ts"
      to: "package.json"
      via: "runtime package metadata read"
      pattern: "version"
---

<objective>
Implement recover and version CLI command handlers.

Purpose: expose symlink repair and package version reporting through the existing `CliCommand` router without expanding scope into MCM or BOOT-06 validation.
Output: `recoverCmd`, `versionCmd`, and focused command contract tests.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md
@src/cli/router.ts
@src/cli/renderer.ts
@src/tools/bootstrap-recover.ts
@package.json
</context>

<tasks>
<task id="T03B-1" type="auto" tdd="true">
  <name>Task 1: Implement recover CLI command</name>
  <files>src/cli/commands/recover.ts, tests/cli/commands/recover.test.ts</files>
  <behavior>
    - RED: command reports `REPAIRED 3` after three missing project-scope symlinks and exits 0.
    - RED: explicit `--scope=global` repairs only the global primitive target and reports effective scope in output.
    - RED: second run reports `REPAIRED 0` or all OK and exits 0.
    - RED: real-file conflict is reported as SKIPPED and exits 0.
  </behavior>
  <action>Per SPEC-05, D-03, and D-06, create `recoverCmd: CliCommand`. Parse optional `--root=<path>` and `--scope=project|global`, defaulting to project. Call `bootstrapRecover` and render counts grouped as `OK`, `REPAIRED`, and `SKIPPED`, including warning paths for real-file conflicts and the effective scope used. Scope semantics must match init/doctor: recover repairs only the selected primitive target (project `.opencode/` or resolved OpenCode global path) and does not mutate local `.hivemind/` state. Return exit code 0 for completed recover attempts; return 70 only for unexpected tool errors with `[Harness]`. Export `recoverCmd` with JSDoc documenting flags, scope semantics, result rendering, idempotency, and side effects delegated to the tool.</action>
  <verify>
    <automated>npx vitest run tests/cli/commands/recover.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`hivemind recover` is non-interactive, idempotent, scope-consistent with init/doctor, and reports recovery counts plus effective scope without blocking on skipped real files.</done>
</task>

<task id="T03B-2" type="auto" tdd="true">
  <name>Task 2: Implement version CLI command and --version alias</name>
  <files>src/cli/commands/version.ts, tests/cli/commands/version.test.ts</files>
  <behavior>
    - RED: `versionCmd.handler()` returns output equal to `package.json.version`.
    - RED: router dispatch through alias `--version` returns same output and exit code 0.
  </behavior>
  <action>Per SPEC-06, create `versionCmd: CliCommand` with name `version`, summary, and alias `--version`. Read package version at runtime from `package.json` using robust package-root resolution; do not hardcode a version string. Export `versionCmd` and any helper intended for import with JSDoc documenting lookup behavior, return value, and fallback behavior.</action>
  <verify>
    <automated>npx vitest run tests/cli/commands/version.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`hivemind version` and `hivemind --version` print installed version from package metadata.</done>
</task>
</tasks>

<review_checklist>
- `recoverCmd`, `versionCmd`, and exported helpers have JSDoc.
- Recover command delegates symlink writes to `bootstrapRecover` and does not create symlinks directly.
- Recover command scope semantics are explicit and consistent: default project, explicit `--scope=project|global`, effective scope surfaced in output.
- Version command does not hardcode version values.
</review_checklist>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-03B-01 | Tampering | recover command | mitigate | CLI delegates all filesystem mutation to schema-validated recover tool. |
| T-BOOT02-03B-02 | Repudiation | version output | mitigate | Runtime reads package metadata and tests compare to `package.json`. |
</threat_model>

<verification>
Focused command tests only in this wave; full-suite and coverage run in BOOT-02-04.
</verification>

<success_criteria>
SPEC-05, SPEC-06, and related SPEC-13 command tests are satisfied in a wave parallelizable with BOOT-02-03a.
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03B-SUMMARY.md`.
</output>
