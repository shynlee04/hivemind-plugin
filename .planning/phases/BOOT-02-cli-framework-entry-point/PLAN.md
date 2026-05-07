---
phase: BOOT-02-cli-framework-entry-point
plan: index
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/phases/BOOT-02-cli-framework-entry-point/PLAN.md
  - .planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-01-schema-contract-PLAN.md
  - .planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-02-bootstrap-tools-PLAN.md
  - .planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03a-init-doctor-cli-PLAN.md
  - .planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03b-recover-version-cli-PLAN.md
  - .planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-04-registration-evidence-PLAN.md
autonomous: true
requirements:
  - BOOT02-SPEC-01-init-tool
  - BOOT02-SPEC-02-recover-tool
  - BOOT02-SPEC-03-init-cli
  - BOOT02-SPEC-04-doctor-cli
  - BOOT02-SPEC-05-recover-cli
  - BOOT02-SPEC-06-version-cli
  - BOOT02-SPEC-07-command-registration
  - BOOT02-SPEC-08-tool-schema-registration
  - BOOT02-SPEC-09-version-controlled-install
  - BOOT02-SPEC-10-config-initialization
  - BOOT02-SPEC-11-schema-file-generation
  - BOOT02-SPEC-12-non-destructive-guarantee
  - BOOT02-SPEC-13-contract-tests
user_setup: []
research_decision: "skipped: BOOT-02 has SPEC, CONTEXT, DISCUSSION-LOG, bootstrap ecosystem research, grey-area decisions, and source references sufficient for planning; no additional RESEARCH.md is needed."
must_haves:
  truths:
    - "`npx hivemind --help` lists help, init, doctor, recover, and version."
    - "`hivemind init --yes` creates the BOOT-02-owned Tier-1 `.hivemind/` directories, `.opencode/` primitive symlinks, `.hivemind/configs.json`, `.hivemind/configs.schema.json`, and `.hivemind/state/version.json` without prompting."
    - "`hivemind doctor` reports PASS/FAIL/WARN health lines for BOOT-02-owned structure, symlinks, config, and SDK checks only; typecheck/test remain execution verification commands, not doctor runtime features."
    - "`hivemind recover` restores missing or broken primitive symlinks without overwriting real files."
    - "Version-controlled init backs up prior-version `.opencode/` primitives before replacement and fresh install creates no backup."
    - "All bootstrap commands preserve existing user files and tests prove this with temp directories only."
    - "SPEC-13 is proven with focused contract tests, `npm test`, and coverage evidence for new BOOT-02 files."
  artifacts:
    - path: ".planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-01-schema-contract-PLAN.md"
      provides: "schema artifact plan"
    - path: ".planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-02-bootstrap-tools-PLAN.md"
      provides: "bootstrap write-side tool plan"
    - path: ".planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03a-init-doctor-cli-PLAN.md"
      provides: "init and doctor CLI plan"
    - path: ".planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-03b-recover-version-cli-PLAN.md"
      provides: "recover and version CLI plan"
    - path: ".planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-04-registration-evidence-PLAN.md"
      provides: "registration and full evidence plan"
  key_links:
    - from: "BOOT-02-01-schema-contract-PLAN.md"
      to: "BOOT-02-02-bootstrap-tools-PLAN.md"
      via: "schema artifact consumed by init tool"
      pattern: "configs.schema.json"
    - from: "BOOT-02-02-bootstrap-tools-PLAN.md"
      to: "BOOT-02-03a-init-doctor-cli-PLAN.md"
      via: "init/doctor command handlers call/read bootstrap tool outputs"
      pattern: "bootstrapInit|classify"
    - from: "BOOT-02-02-bootstrap-tools-PLAN.md"
      to: "BOOT-02-03b-recover-version-cli-PLAN.md"
      via: "recover command wraps recover tool"
      pattern: "bootstrapRecover"
    - from: "BOOT-02-03a-init-doctor-cli-PLAN.md, BOOT-02-03b-recover-version-cli-PLAN.md"
      to: "BOOT-02-04-registration-evidence-PLAN.md"
      via: "CLI command exports registered in buildHarnessCli"
      pattern: "initCmd|doctorCmd|recoverCmd|versionCmd"
---

<objective>
Master execution index for BOOT-02 (CLI Framework + Entry Point).

Purpose: split the previously oversized single plan into bounded wave plans that preserve all locked BOOT-02 SPEC requirements and D-01 through D-08 decisions while keeping BOOT-03 through BOOT-07, CA-04.2, f-04, and MCM out of scope.

Output: five executable wave plans. Execute the wave plan files, not this index, for runtime changes.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md
@.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-DISCUSSION-LOG.md
@.planning/specs/bootstrap-cli-spec-2026-05-07.md
@.planning/research/bootstrap-cli-ecosystem-research-2026-05-07.md
@.planning/research/bootstrap-cli-grey-areas-2026-05-07.md
@.planning/STATE.md
@.planning/ROADMAP.md

<interfaces>
Executor-facing interface references are repeated in the wave plans that need them. Do not infer scope from this index alone.

Required existing contracts:
- `src/cli/router.ts`: `CliCommand`, `CliCommandContext`, `CliRouterResult`.
- `src/lib/bootstrap-structure.ts`: Tier-1 directory constants, primitive type constants, path helpers, and `DOCTOR_CHECKS`.
- `src/schema-kernel/hivemind-configs.schema.ts`: `HivemindConfigsSchema`, defaults, and config path helpers.
- `src/plugin.ts`: tool registration stays a composition root; no business logic belongs there.
</interfaces>
</context>

<source_coverage_audit>
| Source Item | Coverage | Wave Plan |
|---|---|---|
| GOAL: CLI accepts init/doctor/recover/version/help through CliCommand router | COVERED | BOOT-02-03a, BOOT-02-03b, BOOT-02-04 |
| GOAL: Zod-validated write-side bootstrap tools | COVERED | BOOT-02-02, BOOT-02-04 |
| GOAL: non-interactive `--yes` mode | COVERED | BOOT-02-03a |
| GOAL: contract tests | COVERED | all wave plans, final full-suite verification in BOOT-02-04 |
| SPEC-01 Init tool | COVERED | BOOT-02-02 |
| SPEC-02 Recover tool | COVERED | BOOT-02-02 |
| SPEC-03 Init CLI command | COVERED | BOOT-02-03a |
| SPEC-04 Doctor CLI command | COVERED | BOOT-02-03a |
| SPEC-05 Recover CLI command | COVERED | BOOT-02-03b |
| SPEC-06 Version CLI command | COVERED | BOOT-02-03b |
| SPEC-07 Command registration wiring | COVERED | BOOT-02-04 |
| SPEC-08 Tool schema registration | COVERED | BOOT-02-02, BOOT-02-04 |
| SPEC-09 Version-controlled install backup | COVERED | BOOT-02-02 |
| SPEC-10 Config initialization | COVERED | BOOT-02-02, BOOT-02-03a |
| SPEC-11 Schema file generation | COVERED | BOOT-02-01 |
| SPEC-12 Non-destructive guarantee | COVERED | BOOT-02-02, BOOT-02-03a, BOOT-02-03b |
| SPEC-13 Contract tests | COVERED | all wave plans; BOOT-02-04 requires `npm test` and coverage |
| CONTEXT D-01 TTY wizard lazy-loads `@clack/prompts` | COVERED | BOOT-02-03a |
| CONTEXT D-02 wizard writes 5 config fields | COVERED | BOOT-02-03a |
| CONTEXT D-03 global/project meta-concept scope | COVERED | BOOT-02-02, BOOT-02-03a |
| CONTEXT D-04 `--yes` defaults | COVERED | BOOT-02-03a |
| CONTEXT D-05 directory-level symlinks | COVERED | BOOT-02-02 |
| CONTEXT D-06 recover/doctor symlink status classifications | COVERED | BOOT-02-02, BOOT-02-03a, BOOT-02-03b |
| CONTEXT D-07 schema generated build artifact | COVERED | BOOT-02-01 |
| CONTEXT D-08 `configs.json` schema-only in `--yes` | COVERED | BOOT-02-02, BOOT-02-03a |
| Deferred: Global OpenCode config integration | EXCLUDED by CONTEXT deferred scope | none |
| Deferred: hf-doctor / hf-meta-authoring | EXCLUDED by CONTEXT deferred scope | none |
| Deferred: config consumer runtime wiring CA-04.2 | EXCLUDED by CONTEXT deferred scope | none |
| Out-of-scope: BOOT-03 through BOOT-07 standalone features | EXCLUDED; BOOT-02 only creates entrypoint surfaces named by SPEC | none |
| Out-of-scope: f-04 and MCM | EXCLUDED by ROADMAP/CONTEXT boundaries | none |
</source_coverage_audit>

<wave_structure>
| Wave | Plan | Tasks | Files | Depends On | Autonomous |
|---|---|---:|---:|---|---|
| 1 | `BOOT-02-01-schema-contract-PLAN.md` | 2 | 5 | none | true |
| 2 | `BOOT-02-02-bootstrap-tools-PLAN.md` | 3 | 8 | BOOT-02-01 | true |
| 3 | `BOOT-02-03a-init-doctor-cli-PLAN.md` | 2 | 4 | BOOT-02-02 | true |
| 3 | `BOOT-02-03b-recover-version-cli-PLAN.md` | 2 | 4 | BOOT-02-02 | true |
| 4 | `BOOT-02-04-registration-evidence-PLAN.md` | 3 | 4 | BOOT-02-03a, BOOT-02-03b | true |
</wave_structure>

<scope_boundaries>
- Doctor runtime feature scope is limited to BOOT-02 SPEC checks: structure, symlinks, config, and SDK. Do not add doctor typecheck/test/module-count runtime checks in BOOT-02; those belong to BOOT-06 unless a later spec revises scope.
- `npm run typecheck`, `npm test`, `npm run test:coverage`, and `npm run build` are execution verification commands only.
- Do not implement CA-04.2 config consumers, BOOT-03 full state ownership modules, BOOT-04 full primitive migration, BOOT-05 runtime config consumers, BOOT-06 validation expansion, BOOT-07 E2E proof, f-04 routing, or MCM diagnostics.
- All new exported functions/classes in runtime source require JSDoc with summary, parameters, return values, thrown errors where relevant, and an example when the export is intended for direct use.
</scope_boundaries>

<tasks>
No runtime implementation tasks live in this master index. Execute the wave plan files listed above.
</tasks>

<threat_model>
Threat modeling is repeated in each executable wave plan at the boundary it touches. This index adds one planning-level threat:

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-BOOT02-IDX-01 | Tampering | phase scope | mitigate | Wave plans explicitly exclude BOOT-03 through BOOT-07, CA-04.2, f-04, and MCM; doctor typecheck/test checks are verification-only. |
</threat_model>

<verification>
Plan-level verification after all waves:

```bash
npx vitest run tests/schema-kernel/generate-config-json-schema.test.ts tests/tools/bootstrap-init.test.ts tests/tools/bootstrap-recover.test.ts tests/cli/commands/init.test.ts tests/cli/commands/doctor.test.ts tests/cli/commands/recover.test.ts tests/cli/commands/version.test.ts tests/cli/runCli.test.ts
npm run typecheck
npm run build
npm test
npm run test:coverage
node -e "JSON.parse(require('node:fs').readFileSync('.hivemind/configs.schema.json','utf8')); console.log('schema-json-ok')"
```

If full `npm test` has pre-existing unrelated failures, the executor summary must include: failing test names, proof focused BOOT-02 tests pass, and why failures are unrelated. Coverage is not optional for new BOOT-02 files; if project coverage tooling cannot isolate changed files, run full coverage and report the new-file entries from the coverage output.
</verification>

<success_criteria>
- The phase has five bounded executable wave plans, each with at most 3 tasks and fewer than 15 files in `files_modified`.
- All 13 SPEC requirements and D-01 through D-08 decisions are covered exactly once or more across the wave plan set.
- No wave implements deferred or out-of-scope BOOT-03 through BOOT-07, CA-04.2, f-04, or MCM work.
- SPEC-13 requires focused contract tests, `npm test`, and coverage verification.
- AGENTS.md JSDoc policy is reflected in acceptance criteria and review checklist items.
</success_criteria>

<output>
After implementation completion, create `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SUMMARY.md` with per-wave commits, verification output, deviations, and evidence levels.
</output>
