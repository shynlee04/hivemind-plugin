# Phase BOOT-02: CLI Framework + Entry Point - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the `hivemind` CLI with `init`, `doctor`, `recover`, `version`, and `help` commands through the existing `CliCommand` router. T01 already delivered `src/lib/bootstrap-structure.ts` (constants + path helpers). T02-T08 implement the write-side tools and CLI command handlers. T09-T13 add contract tests. `.hivefiver-meta-builder/` is shipped with the npm package; init creates symlinks from `.opencode/` to the shipped meta-builder source.

In scope: CLI commands (init, doctor, recover, version), bootstrap tools (init, recover), doctor health checks (structure, symlinks, config, SDK), command registration wiring.

Out of scope: f-04 auto-routing, MCM migration, config consumer runtime wiring (CA-04.2), state directory ownership modules (CA-04.3).
</domain>

<decisions>
## Implementation Decisions

### Init Wizard Flow
- **D-01:** Interactive mode (`process.stdout.isTTY`) presents a full onboarding wizard using `@clack/prompts` v1.3.0 (already in package.json, lazy-loaded only in TTY branch). Non-interactive mode (`CI` or `--yes` flag) skips all prompts.
- **D-02:** The wizard includes config setup steps — user selects `conversation_language`, `documents_and_artifacts_language`, `mode` (expert-advisor / hivemind-powered / free-style), `user_expert_level` (clumsy-vibecoder through absolute-expert), and `delegation_systems` toggles. These write into `.hivemind/configs.json` alongside the `$schema` reference.
- **D-03:** The wizard asks whether to install meta-concepts globally or project-scoped. Global = symlinks in `~/.config/opencode/` (or equivalent OpenCode global path). Project = symlinks in `<project>/.opencode/`. Default is project-scoped.
- **D-04:** Non-interactive mode (`--yes`) creates everything with sensible defaults: `en` for languages, `expert-advisor` mode, `intermediate-high-level` expertise, all delegation systems enabled.

### Symlink Granularity
- **D-05:** Directory-level symlinks (one per skill/agent/command). `.opencode/skills/hm-l2-debug` → `../.hivefiver-meta-builder/skills/hm-l2-debug`. The entire skill directory tree (`SKILL.md`, `references/`, `evals/`, `scripts/`) is accessible through one symlink. OpenCode discovers skills by directory presence.
- **D-06:** `recover` walks `.hivefiver-meta-builder/` and creates missing symlinks. `doctor` validates each expected symlink: OK (exists, resolves correctly), BROKEN (exists but target missing), MISSING (no entry at all). Neither overwrites existing real files.

### Config Schema Distribution
- **D-07:** `configs.schema.json` is a **build artifact** — generated from the Zod schema (`src/schema-kernel/hivemind-configs.schema.ts`) during `npm run build`, shipped in the npm package, and copied into `.hivemind/` by `hivemind init`. Runtime validation uses Zod directly; the JSON Schema file enables IDE autocomplete and doctor schema-reference integrity checks.
- **D-08:** `configs.json` created by init contains `{ "$schema": "./configs.schema.json" }` plus any values set during the wizard. If the wizard was skipped (`--yes`), only the `$schema` reference is written. All other fields resolve from Zod schema defaults at runtime.

### the agent's Discretion
- Exact wizard step count and prompt wording — implementer discretion, must cover the fields listed in D-02.
- Global OpenCode path discovery — `~/.config/opencode/` on macOS/Linux, equivalent on Windows. Fall back to project-scoped if global path not found or not writable.
- Schema generation script location — `scripts/generate-config-schema.ts` or inline in build step.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 0 Governance (blocking gate — PASSED)
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Canonical naming: product Hivemind, package/bin `hivemind`, lineages hm-*/hf-*/gate-*/stack-*
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership: `src/` = hard harness, `.opencode/` = primitives only, `.hivemind/` = state only
- `.planning/config/hivemind-config-contract-2026-05-07.md` — Config fields, consumers, `delegation_systems` subfields, planned `hf-doctor`/`hf-meta-authoring`
- `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md` — `.hivefiver-meta-builder/` → `.opencode/` boundary, shipped/dev/internal split

### Bootstrap Spec + Research
- `.planning/specs/bootstrap-cli-spec-2026-05-07.md` — 42 requirements across BOOT-02 through BOOT-07, 7 locked decisions (D1-D7), CQRS boundary, exit codes, doctor output format
- `.planning/research/bootstrap-cli-ecosystem-research-2026-05-07.md` — CLI ecosystem research, OMO/GSD patterns, dependency-to-feature map
- `.planning/research/bootstrap-cli-grey-areas-2026-05-07.md` — 7 grey area decisions now locked (D1-D7 incorporated into spec)

### Existing Source Code
- `src/cli/router.ts` — `CliCommand` interface, `createRouter()`, exit code constants, `[Harness]` prefix enforcement
- `src/cli/discovery.ts` — `discoverCommands()` from `CommandSource[]`, deduplication
- `src/cli/renderer.ts` — `renderError()` with `[Harness]` prefix
- `src/cli/index.ts` — `buildHarnessCli()` factory, `extraCommands` array for registration
- `src/cli/commands/help.ts` — Existing help command (reference implementation)
- `src/lib/bootstrap-structure.ts` — T01 deliverable: `HIVE_MIND_DIR`, `TIER_1_DIRECTORIES`, `PRIMITIVE_TYPES`, `DOCTOR_CHECKS`, `DEFAULT_CONFIG_JSON`, path resolution helpers
- `src/schema-kernel/hivemind-configs.schema.ts` — Zod schema for all 29 config fields, defaults, validation — source of truth for `configs.schema.json` generation

### Project State
- `.planning/STATE.md` — Current phase BOOT-02, T01 complete, T02-T13 pending, Phase 0 gate passed
- `.planning/ROADMAP.md` — BOOT workstream, CA-04 restructured scope, evidence levels required per phase
- `package.json` — `@clack/prompts` v1.3.0 available, bin entry `hivemind`
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/bootstrap-structure.ts`** — All directory names, Tier-1 subdirectories, primitive types, doctor check names, default config JSON, and path resolution helpers. Import these constants — no hardcoded strings.
- **`src/cli/router.ts`** — `CliCommand` contract, `createRouter()` + `discoverCommands()` pipeline. All new commands are `CliCommand` handlers registered through `extraCommands`.
- **`src/cli/commands/help.ts`** — Reference for command structure: `name`, `summary`, `aliases?`, `handler(ctx: CliCommandContext) → Promise<CliRouterResult>`.
- **`@clack/prompts` v1.3.0** — Available in `package.json`. Lazy-load with dynamic `import()` only inside the TTY branch of the init handler.

### Established Patterns
- **CQRS write-side:** CLI commands are thin handlers that call tool functions in `src/tools/`. Tools own `.hivemind/` directory creation, symlink creation, and config file writing.
- **Non-destructive:** No command overwrites existing files. Init reports "exists" for already-present paths. Recover skips non-symlink files.
- **kebab-case naming:** `src/cli/commands/init.ts`, `src/tools/bootstrap-init.ts`, `src/tools/bootstrap-recover.ts`.
- **`[Harness]` prefix:** All errors pass through `renderError()` or carry the prefix directly.
- **Module cap:** 500 LOC per file. Split command handlers into `src/cli/commands/<name>.ts` + `src/tools/<name>.ts` + `src/lib/<name>.ts` if approaching the limit.

### Integration Points
- **Command registration:** Add `initCmd`, `doctorCmd`, `recoverCmd`, `versionCmd` to the `extraCommands` array in `src/cli/index.ts:buildHarnessCli()`.
- **Tool registration:** Register `bootstrapInitTool` and `bootstrapRecoverTool` in `src/plugin.ts` with Zod schemas.
- **Config loading:** Config JSON path is `.hivemind/configs.json` (not `config.json`). Use `src/schema-kernel/hivemind-configs.schema.ts` for Zod validation.
- **Root discovery:** Walk up from `process.cwd()` looking for `package.json` or existing `.hivemind/`. Respect `--root=<path>` flag to override.
</code_context>

<specifics>
## Specific Ideas

- The init wizard should feel like a polished onboarding, not a form. Use `@clack/prompts` spinner, intro/outro, and step indicators.
- Mode selection (`expert-advisor` / `hivemind-powered` / `free-style`) should include a brief description of each mode so non-technical users understand the difference.
- Doctor output format exactly matches the spec (REQ-BOOT02-06): ASCII table with PASS/FAIL per check, verdict line at bottom.
- `--version` reads from `package.json` at runtime (not hardcoded).
- No new npm dependencies beyond what's already in `package.json`.
</specifics>

<deferred>
## Deferred Ideas

- **Global OpenCode config integration** — Syncing `.hivemind/configs.json` with OpenCode's global config. Deferred to post-BOOT-07.
- **hf-doctor meta-authoring diagnostics** — YAML frontmatter validation, lineage compliance, binding drift. Deferred to MCM/hf-doctor phases.
- **hf-meta-authoring interactive CLI** — Create/audit/repair agents, skills, commands via CLI. Deferred to MCM phases.
- **Config consumer runtime wiring** (CA-04.2) — Making `delegation_systems`, `conversation_language` etc. actually affect runtime behavior. Deferred to CA-04.2.
</deferred>

---

*Phase: BOOT-02 — CLI Framework + Entry Point*
*Context gathered: 2026-05-07*
