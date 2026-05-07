---
phase: BOOT-02-cli-framework-entry-point
plan: 03a
type: execute
wave: 3
depends_on:
  - BOOT-02-02-bootstrap-tools-PLAN.md
files_modified:
  - src/cli/commands/init.ts
  - src/cli/commands/doctor.ts
  - tests/cli/commands/init.test.ts
  - tests/cli/commands/doctor.test.ts
autonomous: true
requirements:
  - BOOT02-SPEC-03-init-cli
  - BOOT02-SPEC-04-doctor-cli
  - BOOT02-SPEC-05-recover-cli
  - BOOT02-SPEC-10-config-initialization
  - BOOT02-SPEC-12-non-destructive-guarantee
  - BOOT02-SPEC-13-contract-tests
user_setup: []
must_haves:
  truths:
    - "`hivemind init --yes` calls `bootstrapInit` without prompts, passes explicit D-03 primitive scope, and writes `$schema`-only config per D-08."
    - "TTY init lazy-loads `@clack/prompts` only inside the interactive branch and gathers D-02 fields plus D-03 scope."
    - "`hivemind doctor` is read-only and checks only BOOT-02 structure, symlinks, config, and SDK health for the selected or explicitly requested primitive scope; typecheck/test are not doctor runtime features."
  artifacts:
    - path: "src/cli/commands/init.ts"
      provides: "init CliCommand"
      exports: ["initCmd"]
    - path: "src/cli/commands/doctor.ts"
      provides: "doctor CliCommand"
      exports: ["doctorCmd"]
  key_links:
    - from: "src/cli/commands/init.ts"
      to: "src/tools/bootstrap-init.ts"
      via: "init handler delegates mutation with explicit scope"
      pattern: "bootstrapInit\(|scope"
    - from: "src/cli/commands/doctor.ts"
      to: "selected primitive target"
      via: "doctor resolves/receives project or global scope before read-only validation"
      pattern: "scope|project|global"
---

<objective>
Implement init and doctor CLI command handlers.

Purpose: expose the BOOT-02 user-facing CLI entry points for initialization and health checks while keeping commands thin and filesystem mutations inside write-side tools.
Output: `initCmd`, `doctorCmd`, and focused command contract tests.
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
@src/cli/commands/help.ts
@src/tools/bootstrap-init.ts
@src/tools/bootstrap-recover.ts

<interfaces>
From `src/cli/router.ts`:
```ts
export type CliCommandContext = { flags: Record<string, string | boolean>; positionals: readonly string[]; argv: readonly string[] }
export type CliRouterResult = { exitCode: number; error?: string; output?: string }
export type CliCommand = { name: string; summary: string; aliases?: readonly string[]; handler: (ctx: CliCommandContext) => Promise<CliRouterResult> }
```
</interfaces>
</context>

<tasks>
<task id="T03A-1" type="auto" tdd="true">
  <name>Task 1: Implement init CLI command</name>
  <files>src/cli/commands/init.ts, tests/cli/commands/init.test.ts</files>
  <behavior>
    - RED: `initCmd.handler({ flags: { yes: true }, ... })` calls `bootstrapInit` with `nonInteractive: true`, explicit `scope: "project"`, and D-04 defaults.
    - RED: `CI=true` and non-TTY mode do not import `@clack/prompts`.
    - RED: TTY mode dynamically imports `@clack/prompts`, gathers D-02 fields plus D-03 scope, and passes the selected scope into `bootstrapInit`.
    - RED: if `bootstrapInit` reports global-path fallback, command output makes the effective project-scope fallback visible to the user.
  </behavior>
  <action>Per SPEC-03, SPEC-10, D-01, D-02, D-03, D-04, and D-08, create `initCmd: CliCommand`. Parse `--yes`, `-y`, and `--root=<path>`. Resolve project root from `--root` or by walking upward to `package.json`/`.hivemind`; unresolved root returns exit code 64 with `[Harness]`. In non-interactive mode (`CI`, non-TTY, `--yes`, or `-y`), call `bootstrapInit` with defaults from D-04 and explicit `scope: "project"`. In TTY mode, dynamic import `@clack/prompts` inside the TTY branch only, gather D-02 fields and D-03 scope, and pass that exact scope into `bootstrapInit`. If the tool reports that requested global primitive install fell back to project scope because the global path was unavailable/unwritable, surface the effective scope in command output so the user sees what happened. Export `initCmd` with JSDoc documenting command behavior, flags, explicit scope passing, fallback reporting, side effects delegated to tool, and examples.</action>
  <verify>
    <automated>npx vitest run tests/cli/commands/init.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`hivemind init --yes` is scriptable, TTY wizard is lazy-loaded and config-complete, D-03 scope is passed explicitly into the tool contract, and fallback from global to project scope is user-visible.</done>
</task>

<task id="T03A-2" type="auto" tdd="true">
  <name>Task 2: Implement read-only doctor CLI command</name>
  <files>src/cli/commands/doctor.ts, tests/cli/commands/doctor.test.ts</files>
  <behavior>
    - RED: healthy project-scope temp project outputs `Hivemind Health Check`, PASS lines for structure/symlinks/config/SDK, and `Verdict: ALL CHECKS PASS`.
    - RED: explicit global-scope doctor check validates the global primitive target while still validating local `.hivemind/` structure/config under the selected project root.
    - RED: missing `.hivemind/state/.gitkeep` returns exit code 1 and structure FAIL.
    - RED: `--check=structure` runs only structure; `--check=bogus` returns exit code 64.
    - RED: doctor source and behavior are read-only; tests assert no write APIs are called.
  </behavior>
  <action>Per SPEC-04, SPEC-05, SPEC-12, D-03, and D-06, create `doctorCmd: CliCommand` with read-only checks for structure, symlinks, config, and SDK only. Scope semantics must be explicit and consistent with init/recover: default to validating the local project-scope primitive target, support `--scope=project|global` for explicit primitive-target selection, and continue validating local `.hivemind/` structure/config under `projectRoot` because BOOT-02 state is project-local even when primitives were installed globally. Do not implement BOOT-06-style doctor runtime typecheck/test/module-count checks in BOOT-02. Render the ASCII PASS/FAIL/WARN table required by BOOT-02 SPEC and return exit code 0 if all PASS, 1 if any FAIL, 64 for invalid check. Use fixed read-only filesystem APIs and `renderError()` for internal errors. Export `doctorCmd` with JSDoc documenting checks, scope semantics, exit codes, read-only guarantee, and examples.</action>
  <verify>
    <automated>npx vitest run tests/cli/commands/doctor.test.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Doctor reports deterministic BOOT-02 health status, validates the selected primitive scope consistently with init/recover while keeping `.hivemind/` local, and remains read-only without typecheck/test runtime checks.</done>
</task>
</tasks>

<review_checklist>
- `initCmd` and `doctorCmd` exports have JSDoc.
- `@clack/prompts` appears only in a dynamic import inside the TTY branch.
- `initCmd` passes explicit D-03 scope into `bootstrapInit` and surfaces effective fallback scope when global install cannot be used.
- Doctor command contains no typecheck/test/module-count runtime health checks.
- Doctor command scope semantics are explicit: primitive target defaults to project, supports `--scope=project|global`, and local `.hivemind/` checks remain project-rooted.
- Doctor tests include read-only assertions and no-write API guards.
</review_checklist>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-03A-01 | Spoofing | `--root` | mitigate | Resolve and validate project root before delegating mutation to tools; return 64 for unresolved roots. |
| T-BOOT02-03A-02 | Tampering | doctor command | mitigate | Doctor uses read-only APIs only and tests assert no write/symlink/unlink calls. |
| T-BOOT02-03A-03 | Denial of service | doctor output | mitigate | Limit BOOT-02 doctor checks to structure/symlinks/config/SDK; typecheck/test remain verification commands outside doctor runtime. |
</threat_model>

<verification>
Focused command tests only in this wave; full-suite and coverage run in BOOT-02-04.
</verification>

<success_criteria>
SPEC-03, SPEC-04, SPEC-10, SPEC-12, and command portions of SPEC-13 are satisfied without importing BOOT-06 validation scope.
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03A-SUMMARY.md`.
</output>
