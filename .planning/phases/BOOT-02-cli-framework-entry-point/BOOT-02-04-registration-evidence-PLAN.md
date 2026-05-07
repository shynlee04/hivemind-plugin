---
phase: BOOT-02-cli-framework-entry-point
plan: 04
type: execute
wave: 4
depends_on:
  - BOOT-02-03a-init-doctor-cli-PLAN.md
  - BOOT-02-03b-recover-version-cli-PLAN.md
files_modified:
  - src/cli/index.ts
  - tests/cli/runCli.test.ts
  - tests/cli/commands/init.test.ts
  - tests/plugin/bootstrap-tools-registration.test.ts
autonomous: true
requirements:
  - BOOT02-SPEC-07-command-registration
  - BOOT02-SPEC-08-tool-schema-registration
  - BOOT02-SPEC-13-contract-tests
user_setup: []
must_haves:
  truths:
    - "Default `buildHarnessCli()` reaches help, init, doctor, recover, and version without external command injection."
    - "`npx hivemind --help` equivalent test output lists all BOOT-02 commands."
    - "SPEC-13 evidence includes focused tests, `npm test`, and coverage verification for new BOOT-02 files."
  artifacts:
    - path: "src/cli/index.ts"
      provides: "BOOT-02 command registration"
    - path: "tests/cli/runCli.test.ts"
      provides: "default router/help contract tests"
    - path: "tests/plugin/bootstrap-tools-registration.test.ts"
      provides: "plugin tool registration contract tests"
  key_links:
    - from: "src/cli/index.ts"
      to: "src/cli/commands/*.ts"
      via: "built-in command registration"
      pattern: "initCmd|doctorCmd|recoverCmd|versionCmd"
    - from: "tests/cli/runCli.test.ts"
      to: "src/cli/index.ts"
      via: "default CLI registry assertion"
      pattern: "buildHarnessCli"
---

<objective>
Wire BOOT-02 commands into the default CLI and close SPEC-13 evidence.

Purpose: prove all new commands and tools are reachable through product entry points and that contract tests/full-suite/coverage evidence exists before phase completion.
Output: CLI registration, reachability tests, full-suite verification, and coverage evidence.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md
@src/cli/index.ts
@src/cli/discovery.ts
@src/cli/commands/help.ts
@tests/cli/runCli.test.ts
@src/plugin.ts
</context>

<tasks>
<task id="T04-1" type="auto" tdd="true">
  <name>Task 1: Register BOOT-02 commands in default CLI</name>
  <files>src/cli/index.ts, tests/cli/runCli.test.ts</files>
  <behavior>
    - RED: `buildHarnessCli().commands().map(c => c.name)` includes `help`, `init`, `doctor`, `recover`, and `version`.
    - RED: `runCli(["--help"])` output contains `init`, `doctor`, `recover`, and `version`.
    - RED: command-specific help for `doctor --help` or router-equivalent behavior is covered per SPEC-07.
  </behavior>
  <action>Per SPEC-07, import `initCmd`, `doctorCmd`, `recoverCmd`, and `versionCmd` into `src/cli/index.ts`; include them in the built-in command source passed to `discoverCommands()` so default `runCli()` reaches them without external `extraCommands`. Preserve `extraCommands` behavior for tests/extensions. Add reachability tests in `tests/cli/runCli.test.ts`. Any new exported helper in `src/cli/index.ts` must have JSDoc; existing exports touched by this task must not lose documentation.</action>
  <verify>
    <automated>npx vitest run tests/cli/runCli.test.ts tests/cli/router.test.ts tests/cli/discovery.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>All BOOT-02 CLI commands are reachable through existing router/discovery and listed by help.</done>
</task>

<task id="T04-2" type="auto" tdd="true">
  <name>Task 2: Complete contract-test coverage assertions</name>
  <files>tests/cli/runCli.test.ts, tests/cli/commands/init.test.ts, tests/plugin/bootstrap-tools-registration.test.ts</files>
  <behavior>
    - Tests assert invalid bootstrap tool input returns validation errors before mutation.
    - Tests assert CLI contract coverage includes exit codes, stdout/stderr, `--yes`, help text, and aliases.
    - Tests assert no interactive prompt is attempted in non-TTY/CI mode.
  </behavior>
  <action>Per SPEC-08 and SPEC-13, fill any remaining contract-test gaps after Waves 1-3. Keep tests focused on BOOT-02 surfaces. Do not add BOOT-06 doctor checks or CA-04.2 config consumer assertions. Add a comment in tests where a full-suite assertion is intentionally not embedded because full `npm test` is run as plan verification below.</action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/generate-config-json-schema.test.ts tests/tools/bootstrap-init.test.ts tests/tools/bootstrap-recover.test.ts tests/plugin/bootstrap-tools-registration.test.ts tests/cli/commands/init.test.ts tests/cli/commands/doctor.test.ts tests/cli/commands/recover.test.ts tests/cli/commands/version.test.ts tests/cli/runCli.test.ts</automated>
  </verify>
  <done>Focused contract tests cover every BOOT-02 command/tool requirement without expanding runtime feature scope.</done>
</task>

<task id="T04-3" type="auto">
  <name>Task 3: Run full-suite, build, and coverage evidence</name>
  <files>tests/cli/runCli.test.ts, tests/plugin/bootstrap-tools-registration.test.ts</files>
  <action>Per SPEC-13, run the full verification set and record output in the BOOT-02 summary. This task must not modify doctor runtime behavior. If `npm test` has pre-existing unrelated failures, do not hide them: capture failing test names, prove the focused BOOT-02 suite passes, and mark the full-suite exception as pre-existing in the summary. Coverage for new BOOT-02 files is required; if coverage tooling cannot isolate files, run full coverage and report the coverage entries for `src/schema-kernel/generate-config-json-schema.ts`, `src/tools/bootstrap-init.ts`, `src/tools/bootstrap-recover.ts`, `src/cli/commands/init.ts`, `src/cli/commands/doctor.ts`, `src/cli/commands/recover.ts`, and `src/cli/commands/version.ts`.</action>
  <verify>
    <automated>npm test</automated>
    <automated>npm run test:coverage</automated>
    <automated>npm run typecheck</automated>
    <automated>npm run build</automated>
    <automated>node -e "JSON.parse(require('node:fs').readFileSync('.hivemind/configs.schema.json','utf8')); console.log('schema-json-ok')"</automated>
  </verify>
  <done>SPEC-13 evidence includes full suite or documented pre-existing exception, coverage output for new BOOT-02 files, typecheck, build, and schema parse proof.</done>
</task>
</tasks>

<review_checklist>
- `src/cli/index.ts` preserves `extraCommands` behavior and adds built-ins deterministically.
- No doctor typecheck/test/module-count runtime feature was introduced anywhere in BOOT-02.
- All new exported functions/classes across BOOT-02 source files have JSDoc before this plan is marked complete.
- Full `npm test` and coverage evidence are present in the summary, or a focused-test exception is explicitly justified with pre-existing failure details.
</review_checklist>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-04-01 | Repudiation | command reachability | mitigate | Default CLI registry tests assert command list and help output. |
| T-BOOT02-04-02 | Repudiation | SPEC-13 evidence | mitigate | Require focused tests, `npm test`, coverage, typecheck, build, and explicit exception handling for unrelated failures. |
</threat_model>

<verification>
This wave closes the phase with full verification commands. Coverage verification is mandatory for new BOOT-02 source files.
</verification>

<success_criteria>
SPEC-07, SPEC-08 registration reachability, and SPEC-13 full evidence are satisfied without adding out-of-scope runtime validation features.
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-04-SUMMARY.md` and update `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SUMMARY.md` with final evidence.
</output>
