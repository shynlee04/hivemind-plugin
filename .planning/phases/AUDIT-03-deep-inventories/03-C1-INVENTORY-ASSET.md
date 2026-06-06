# C1 Cluster Inventory: Governance + CLI + Config [AUDIT-03 - Deep Inventory]

**Analysis Date:** 2026-06-06

## Cluster Overview

The C1 cluster encompasses the governance, CLI substrate, configuration loading, schema definitions, bootstrap/primitive loading, and routing subsystems of the Hivemind harness. It is the foundational layer that all other clusters depend on for configuration, primitive discovery, and runtime governance.

**Total Files Scanned:** 89

---

## Sub-Groupings

| Sub-Group | Files | Purpose |
|-----------|-------|---------|
| **CLI Substrate** | 10 | Command-line interface entry point, router, renderer, discovery, and built-in commands |
| **Config Loading** | 8 | Configuration subscriber, compiler/decompiler, workflow state machine |
| **Schema Definitions** | 21 | Zod schemas for all config, tool, agent, command, skill, and runtime types |
| **Bootstrap/Primitive Loading** | 10 | Directory structure, primitive scanners, registry, framework detector, runtime validator |
| **Governance Engine** | 5 | Governance rule evaluation, config reading, session creation, persistence |
| **Routing** | 11 | Session entry intake, behavioral profile resolution, command engine |
| **Config Tools** | 5 | Bootstrap init/recover, configure-primitive, validate-restart |
| **Session Tools** | 3 | Command resolution, validation, workflow parsing |
| **Command Engine Tool** | 1 | Hivemind command engine read-side tool |
| **Hooks (Guards)** | 2 | Tool guard hooks, governance block builder |
| **Hooks (Transforms)** | 2 | Tool-before-guard, contract enforcement |
| **CLI Tests** | 8 | Unit tests for CLI substrate |
| **Schema Tests** | 6 | Unit tests for schema definitions |
| **Bin Scripts** | 4 | CLI entrypoint and validation scripts |
| **Build Scripts** | 5 | Asset sync, OSS sync, registry generation, GSD transform |
| **Assets/Rules** | 1 | Universal rules governance document |
| **Config** | 1 | opencode.json — OpenCode host configuration |

---

## File Inventory

### CLI Substrate

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/cli/index.ts` | CLI entry point; wires built-in commands into router, exposes `runCli()` | CLI Substrate | None |
| `src/cli/router.ts` | Framework-free CLI router with argv parsing and command dispatch | CLI Substrate | None |
| `src/cli/renderer.ts` | Pure formatting helpers for terminal output (error, JSON, table, help) | CLI Substrate | None |
| `src/cli/discovery.ts` | Command discovery and validation from multiple sources | CLI Substrate | None |
| `src/cli/ui/prompts.ts` | Interactive TUI prompts with TTY fallback | CLI Substrate | `@clack/prompts` (external) |
| `src/cli/commands/help.ts` | Built-in `help` command listing all registered commands | CLI Substrate | None |
| `src/cli/commands/init.ts` | Built-in `init` command for BOOT-02 bootstrap | CLI Substrate | C1: `bootstrap-init`, `bootstrap.schema`, `hivemind-configs.schema` |
| `src/cli/commands/doctor.ts` | Built-in `doctor` command for health checks | CLI Substrate | C1: `structure.ts`, `hivemind-configs.schema`, `generate-config-json-schema` |
| `src/cli/commands/recover.ts` | Built-in `recover` command for symlink repair | CLI Substrate | C1: `bootstrap-recover`, `bootstrap.schema` |
| `src/cli/commands/version.ts` | Built-in `version` command reading package.json | CLI Substrate | None |

### Config Loading

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/config/defaults.ts` | Default governance configs (rules, agent_configs, command mappings, tool registry) | Config Loading | C1: `hivemind-configs.schema` |
| `src/config/subscriber.ts` | Lazy-load + cache + fallback config reader | Config Loading | C1: `hivemind-configs.schema` |
| `src/config/compiler.ts` | Compile/decompile primitives from JSON/YAML to .md files with frontmatter | Config Loading | C1: `agent-frontmatter.schema`, `command-frontmatter.schema`, `skill-metadata.schema` |
| `src/config/workflow/index.ts` | Barrel export for config workflow module | Config Loading | None |
| `src/config/workflow/workflow-types.ts` | Config workflow state machine types (8-turn workflow) | Config Loading | None |
| `src/config/workflow/workflow-state.ts` | Turn transition logic, state creation, advancement (pure functions) | Config Loading | None |
| `src/config/workflow/workflow-persistence.ts` | Durable JSON persistence for config workflow state | Config Loading | C3: `task-management/continuity` |
| `src/config/workflow/workflow-guards.ts` | Precondition validators for each workflow turn | Config Loading | None |

### Schema Definitions

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/schema-kernel/index.ts` | Barrel export + `validateWithFallback` utility | Schema Definitions | None |
| `src/schema-kernel/hivemind-configs.schema.ts` | Top-level `.hivemind/configs.json` schema (mode, language, workflow, governance) | Schema Definitions | C1: `config/defaults.ts`, `shared/helpers.ts` |
| `src/schema-kernel/bootstrap.schema.ts` | Bootstrap init/recover input/result schemas | Schema Definitions | C1: `hivemind-configs.schema` |
| `src/schema-kernel/agent-frontmatter.schema.ts` | Agent YAML frontmatter schema (description, mode, model, temperature, etc.) | Schema Definitions | None |
| `src/schema-kernel/command-frontmatter.schema.ts` | Command YAML frontmatter schema | Schema Definitions | None |
| `src/schema-kernel/skill-metadata.schema.ts` | Skill SKILL.md frontmatter schema | Schema Definitions | None |
| `src/schema-kernel/commands.schema.ts` | Execute-slash-command input schema | Schema Definitions | None |
| `src/schema-kernel/tool.schema.ts` | Custom tool definition schema | Schema Definitions | None |
| `src/schema-kernel/mcp-server.schema.ts` | MCP server config schema (local/remote discriminated union) | Schema Definitions | None |
| `src/schema-kernel/config-precedence.schema.ts` | Config precedence levels and OpenCode config schema | Schema Definitions | None |
| `src/schema-kernel/generate-config-json-schema.ts` | Generates JSON Schema from Zod config schema for IDE validation | Schema Definitions | C1: `hivemind-configs.schema` |
| `src/schema-kernel/prompt-enhance.schema.ts` | Prompt-enhance pipeline schemas (skim, analysis, budget, patch, output) | Schema Definitions | None |
| `src/schema-kernel/trajectory.schema.ts` | Trajectory tool input schema with action-specific validation | Schema Definitions | None |
| `src/schema-kernel/runtime-pressure.schema.ts` | Runtime pressure tool input schema | Schema Definitions | None |
| `src/schema-kernel/sdk-supervisor.schema.ts` | SDK supervisor tool input schema | Schema Definitions | None |
| `src/schema-kernel/command-engine.schema.ts` | Command engine tool input schema | Schema Definitions | None |
| `src/schema-kernel/doc-intelligence.schema.ts` | Document intelligence tool input schema | Schema Definitions | None |
| `src/schema-kernel/session-tracker.schema.ts` | Session-tracker, session-hierarchy, session-context tool schemas | Schema Definitions | None |
| `src/schema-kernel/session-delegation-query.schema.ts` | Session delegation query tool schema | Schema Definitions | C1: `session-tracker.schema` |
| `src/schema-kernel/session-view.schema.ts` | Session-view tool schema | Schema Definitions | C1: `session-tracker.schema` |
| `src/schema-kernel/agent-work-contract.schema.ts` | Agent work contract store and tool input schemas | Schema Definitions | C4: `features/agent-work-contracts/bounds.ts` |

### Bootstrap/Primitive Loading

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/features/bootstrap/structure.ts` | Shared constants (HIVE_MIND_DIR, TIER_1_DIRECTORIES, PRIMITIVE_TYPES) and path helpers | Bootstrap | None (leaf module) |
| `src/features/bootstrap/primitive-loader.ts` | Scans `.opencode/` for agents, commands, skills; reads opencode.json; cross-references | Bootstrap | C1: `schema-kernel` (lenient schemas) |
| `src/features/bootstrap/primitive-registry.ts` | Catalogs all primitives with metadata, dependency tracking, conflict detection | Bootstrap | C1: `primitive-scanners.ts`, C2: `shared/types.ts` |
| `src/features/bootstrap/primitive-scanners.ts` | Internal scanner helpers for primitive-registry.ts | Bootstrap | None |
| `src/features/bootstrap/framework-detector.ts` | Detects co-existing frameworks (GSD, BMAD, Speckit, Hivemind) and validates boundaries | Bootstrap | None |
| `src/features/bootstrap/runtime-validator.ts` | Topological and runtime validation (circular deps, missing deps, permission inheritance) | Bootstrap | None |
| `src/features/bootstrap/cross-primitive-validator.ts` | Cross-primitive validation (agent-command bindings, permission deadlocks, role overlaps) | Bootstrap | C1: `runtime-validator.ts`, C2: `shared/types.ts` |
| `src/features/bootstrap/control-plane/index.ts` | Control plane barrel export | Bootstrap | None |
| `src/features/bootstrap/control-plane/gatekeeper.ts` | Gatekeeper factory with built-in gates for message routing | Bootstrap | C1: `primitive-registry.ts`, `gate-decision.ts` |
| `src/features/bootstrap/control-plane/gate-decision.ts` | Gate decision types and classification utilities | Bootstrap | None |

### Governance Engine

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/features/governance-engine/index.ts` | Governance engine barrel export | Governance | None |
| `src/features/governance-engine/evaluator.ts` | Evaluates tool calls against governance rules (block/warn/escalate) | Governance | C2: `shared/types.ts`, `shared/state.ts`, C1: `governance/persistence.ts` |
| `src/features/governance-engine/config-reader.ts` | Facade over unified configs.json for governance config access | Governance | C1: `hivemind-configs.schema` |
| `src/features/governance-engine/create-governance-session.ts` | Tool factory for creating governance sessions with naming, git commit, agent dispatch | Governance | C2: `shared/session-api.ts`, `shared/session-naming.ts`, `shared/tool-helpers.ts`, `shared/tool-response.ts` |
| `src/features/governance/persistence.ts` | Atomic read/write for `.hivemind/state/governance-state.json` | Governance | C3: `task-management/continuity` |

### Routing

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/routing/session-entry/index.ts` | Session entry intake pipeline barrel export | Routing | None |
| `src/routing/session-entry/purpose-classifier.ts` | Classifies user input into 8 purpose classes via keyword matching | Routing | None |
| `src/routing/session-entry/language-resolution.ts` | Detects dominant language/script via Unicode range analysis | Routing | None |
| `src/routing/session-entry/profile-resolver.ts` | Resolves developer profile from session context hints | Routing | None |
| `src/routing/session-entry/intake-gate.ts` | Combines purpose, language, profile into routing decision | Routing | C1: `purpose-classifier`, `language-resolution`, `profile-resolver` |
| `src/routing/behavioral-profile/index.ts` | Behavioral profile barrel export | Routing | None |
| `src/routing/behavioral-profile/types.ts` | Behavioral profile type definitions | Routing | C1: `hivemind-configs.schema`, `profile-resolver` |
| `src/routing/behavioral-profile/profiles.ts` | Static mode → behavioral profile lookup table | Routing | C1: `hivemind-configs.schema` |
| `src/routing/behavioral-profile/resolve-behavioral-profile.ts` | Resolves unified behavioral profile merging config, mode, and runtime | Routing | C1: `config/subscriber.ts`, `profiles.ts`, `profile-resolver.ts` |
| `src/routing/command-engine/index.ts` | Command engine library API (discover, analyze, render, transform, preview, list) | Routing | C1: `primitive-loader.ts`, C4: `runtime-pressure` |
| `src/routing/command-engine/types.ts` | Command engine type definitions | Routing | C4: `runtime-pressure/types.ts` |

### Config Tools

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/tools/config/bootstrap-init.ts` | Write-side tool for BOOT-02 bootstrap init | Config Tools | C1: `structure.ts`, `bootstrap.schema`, `generate-config-json-schema`, `defaults.ts` |
| `src/tools/config/bootstrap-recover.ts` | Write-side tool for BOOT-02 primitive symlink repair | Config Tools | C1: `structure.ts`, `bootstrap.schema` |
| `src/tools/config/configure-primitive.ts` | Tool for compile/decompile/read/list/inspect primitives | Config Tools | C1: `compiler.ts`, `primitive-loader.ts`, `workflow/`, `configure-primitive-paths.ts`, C2: `shared/security/path-scope.ts` |
| `src/tools/config/configure-primitive-paths.ts` | Path resolution helpers for configure-primitive tool | Config Tools | None |
| `src/tools/config/validate-restart.ts` | Post-restart validation tool for OpenCode primitives | Config Tools | C1: `framework-detector.ts`, `primitive-loader.ts`, `cross-primitive-validator.ts`, `runtime-validator.ts` |

### Session Tools

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/tools/session/resolve-command.ts` | Resolves command name/text against discovered bundles with 5s TTL cache | Session Tools | C1: `command-engine/index.ts`, C2: `shared/errors/commands.ts` |
| `src/tools/session/validate-command.ts` | Validates command contract structural fields | Session Tools | C2: `shared/types.ts` |
| `src/tools/session/workflow-parser.ts` | Parses YAML workflow files | Session Tools | C2: `shared/types.ts` |

### Command Engine Tool

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/tools/hivemind/hivemind-command-engine.ts` | Command-engine tool (CQRS read-side) for discovery, contracts, context, transforms, previews | Command Engine Tool | C1: `command-engine/index.ts`, `command-engine.schema.ts` |

### Hooks (Guards)

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/hooks/guards/tool-guard-hooks.ts` | Tool guard hooks: circuit breaker, budget, governance, tool intelligence | Hooks (Guards) | C3: `task-management/continuity`, C2: `shared/helpers.ts`, `shared/runtime-policy.ts`, `shared/state.ts`, C1: `governance-engine/evaluator.ts`, C4: `tool-intelligence` |
| `src/hooks/guards/governance-block.ts` | Builds structured governance block for system prompt injection | Hooks (Guards) | C1: `hivemind-configs.schema`, `behavioral-profile/types.ts` |

### Hooks (Transforms)

| File | Purpose | Sub-Group | Cross-Cutting Deps |
|------|---------|-----------|-------------------|
| `src/hooks/transforms/tool-before-guard.ts` | Tool.execute.before hook: runs guard, then session tracker, then contract enforcement | Hooks (Transforms) | C4: `agent-work-contracts/types.ts`, C2: `session-tracker` |
| `src/hooks/transforms/contract-enforcement.ts` | Contract enforcement hook: enforces allowedSurfaces on file-modifying tools | Hooks (Transforms) | C4: `agent-work-contracts/types.ts` |

### CLI Tests

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `tests/cli/runCli.test.ts` | Integration tests for CLI entrypoint | CLI Tests |
| `tests/cli/router.test.ts` | Unit tests for CLI router (parseArgs, dispatch, aliases) | CLI Tests |
| `tests/cli/renderer.test.ts` | Unit tests for CLI renderer (error, JSON, table, help) | CLI Tests |
| `tests/cli/discovery.test.ts` | Unit tests for command discovery and validation | CLI Tests |
| `tests/cli/commands/version.test.ts` | Unit tests for version command | CLI Tests |
| `tests/cli/commands/recover.test.ts` | Unit tests for recover command | CLI Tests |
| `tests/cli/commands/init.test.ts` | Unit tests for init command | CLI Tests |
| `tests/cli/commands/doctor.test.ts` | Unit tests for doctor command | CLI Tests |

### Schema Tests

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `tests/schema-kernel/hivemind-configs.schema.test.ts` | Comprehensive tests for config schema (691 lines) | Schema Tests |
| `tests/schema-kernel/governance-config-schema.test.ts` | Tests for governance config schema and behavioral overrides | Schema Tests |
| `tests/schema-kernel/prompt-enhance.schema.test.ts` | Tests for prompt-enhance pipeline schemas | Schema Tests |
| `tests/schema-kernel/opencode-config.schemas.test.ts` | Tests for agent/command/skill/tool/MCP schemas | Schema Tests |
| `tests/schema-kernel/generate-config-json-schema.test.ts` | Tests for JSON Schema generation | Schema Tests |
| `tests/schema-kernel/commands.schema.test.ts` | Tests for execute-slash-command schema | Schema Tests |

### Bin Scripts

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `bin/hivemind.cjs` | CommonJS CLI entrypoint shim forwarding to `dist/cli/index.js` | Bin Scripts |
| `bin/validate-agent-config.sh` | Runs typecheck + vitest + schema validation | Bin Scripts |
| `bin/validate-load-order.sh` | Validates `.opencode/` directory structure and loading order | Bin Scripts |
| `bin/validate-runtime-paths.sh` | Validates all file paths referenced in configs exist | Bin Scripts |

### Build Scripts

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `scripts/sync-assets.js` | Reflects primitives from `assets/` to `.opencode/` with backup protection | Build Scripts |
| `scripts/sync-oss.sh` | Syncs whitelisted source to oss-dev branch | Build Scripts |
| `scripts/generate-registry.cjs` | Generates agent_configs and command_agent_mappings from `.opencode/` primitives | Build Scripts |
| `scripts/verify-sr11.sh` | Verification script for Phase SR-11 (config ecosystem) | Build Scripts |
| `scripts/transform-gsd-to-hm.js` | Transforms GSD primitives to Hivemind naming conventions | Build Scripts |

### Assets/Rules

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `assets/rules/universal-rules.md` | Universal rules governance document (L0 hierarchy, TDD, quality gates) | Assets/Rules |

### Config

| File | Purpose | Sub-Group |
|------|---------|-----------|
| `opencode.json` | OpenCode host configuration (providers, models, plugins, instructions) | Config |

---

## Design Patterns

### 1. Strict/Lenient Schema Pattern
All schemas in `src/schema-kernel/` follow a dual-schema pattern:
- **Strict schema** (`.strict()`) — rejects unknown fields
- **Lenient schema** (`.strip()`) — strips unknown fields, accepts forward-compatible configs
- **`validateWithFallback()`** — tries strict first, falls back to lenient if only unknown keys fail

### 2. Factory Pattern
Tools and hooks use factory functions that accept dependencies via closure injection:
- `createBootstrapInitTool()` — tool factory
- `createToolGuardHooks(deps)` — hook factory
- `createGatekeeper({ projectRoot })` — gatekeeper factory
- `createGovernanceSessionTool(client, coordinator)` — tool factory with SDK client

### 3. CQRS Read/Write Separation
- **Read-side**: `hivemind-command-engine.ts` (discovery, analysis, preview)
- **Write-side**: `execute-slash-command.ts` (actual dispatch)

### 4. Atomic Persistence
- `workflow-persistence.ts` — tmp + rename pattern
- `governance/persistence.ts` — tmp + rename with PID+UUID temp files
- `hivemind-configs.schema.ts` — `writeFileSync` with `mkdirSync` for parent dirs

### 5. Dependency Injection via Closure
CLI commands use a deps pattern for testability:
```typescript
export function createInitCommand(deps: Partial<InitCommandDeps> = {}): CliCommand {
  const resolvedDeps: InitCommandDeps = {
    bootstrapInitFn: deps.bootstrapInitFn ?? bootstrapInit,
    // ...
  }
}
```

### 6. Graceful Degradation
Config readers never crash — they return defaults on missing/invalid files:
- `readConfigs()` → returns `getDefaultConfigs()` on failure
- `readGovernanceState()` → returns empty state on failure
- `loadPrimitives()` → collects warnings, never throws

---

## Cross-Cutting Dependencies

| Dependency Target | Count | Examples |
|-------------------|-------|----------|
| **C2 (Shared/Core)** | 12 | `shared/types.ts`, `shared/helpers.ts`, `shared/state.ts`, `shared/session-api.ts`, `shared/tool-helpers.ts`, `shared/tool-response.ts`, `shared/runtime-policy.ts`, `shared/security/path-scope.ts`, `shared/errors/commands.ts`, `shared/session-naming.ts` |
| **C3 (Task Management)** | 3 | `task-management/continuity/index.ts`, `task-management/continuity/continuity-reader.ts` |
| **C4 (Features/Runtime)** | 5 | `features/runtime-pressure/`, `features/agent-work-contracts/`, `features/tool-intelligence/` |
| **External** | 3 | `@opencode-ai/plugin`, `@clack/prompts`, `gray-matter` |

---

## Conflicts, Gaps, and Flaws

### 1. Duplicated Path Resolution Logic
**Files:** `src/cli/commands/init.ts:272-293`, `src/cli/commands/recover.ts:115-126`, `src/cli/commands/doctor.ts:304-315`
**Issue:** Three separate `resolveProjectRoot()` implementations with identical logic (walk up from cwd looking for `package.json` or `.hivemind`).
**Impact:** Maintenance burden; bug fixes must be applied in 3 places.
**Fix approach:** Extract to shared utility in `src/features/bootstrap/structure.ts`.

### 2. Duplicated Scope Parsing
**Files:** `src/cli/commands/init.ts:304-314`, `src/cli/commands/recover.ts:128-138`, `src/cli/commands/doctor.ts:317-327`
**Issue:** Three identical `parseScopeFlag()` implementations.
**Fix approach:** Extract to shared CLI utility.

### 3. Duplicated Helper Functions
**Files:** `src/cli/commands/init.ts:295-301`, `src/cli/commands/recover.ts:140-146`, `src/cli/commands/doctor.ts:329-335`
**Issue:** `getStringFlag()` and `hasHelpFlag()` duplicated across 3 command files.
**Fix approach:** Extract to `src/cli/router.ts` or shared CLI helpers.

### 4. `opencode.json` Contains API Key
**File:** `opencode.json:38`
**Issue:** The CrofAI provider configuration contains a hardcoded API key (`nahcrof_oXTVoayMHBLpXrNPqWTI`).
**Impact:** Security risk if committed to public repo.
**Fix approach:** Move to environment variable reference (`{env:CROFAI_API_KEY}`).

### 5. `gate-decision.ts` Enum Naming Inconsistency
**File:** `src/features/bootstrap/control-plane/gate-decision.ts:26`
**Issue:** `GateDecisionType.ask` uses lowercase while other enum members use UPPERCASE (`ALLOW`, `WARN`, `BLOCK`).
**Fix approach:** Rename to `GateDecisionType.DENY` or `GateDecisionType.BLOCK_ASK` for consistency.

### 6. `workflow-persistence.ts` Cross-Cluster Dependency
**File:** `src/config/workflow/workflow-persistence.ts:16`
**Issue:** Config workflow persistence imports from `task-management/continuity` (C3), creating a cross-cluster dependency from C1 to C3.
**Impact:** Tight coupling between config and task management layers.
**Fix approach:** Abstract path resolution behind an interface or move workflow persistence to C3.

### 7. Missing `runtime-pressure` Schema Re-export
**File:** `src/schema-kernel/index.ts`
**Issue:** `runtime-pressure.schema.ts` is re-exported but `runtime-pressure/types.ts` is imported by `command-engine/types.ts` directly, bypassing the schema kernel.
**Impact:** Inconsistent import paths for pressure types.

### 8. `resolveCommand.ts` Console.log in Production
**File:** `src/tools/session/resolve-command.ts:24`
**Issue:** `logCacheStats()` writes to `console.log` unconditionally.
**Impact:** Noisy logs in production.
**Fix approach:** Use structured logging or make debug-only.

### 9. `governance-engine/evaluator.ts` Console.error
**File:** `src/features/governance-engine/evaluator.ts:131`
**Issue:** Uses `console.error` for governance violation recording failures.
**Fix approach:** Use structured logging.

### 10. Test Coverage Gap: Bootstrap Control Plane
**Files:** `src/features/bootstrap/control-plane/`
**Issue:** No dedicated test files for gatekeeper or gate-decision modules.
**Impact:** Gate classification logic untested.
**Fix approach:** Add `tests/bootstrap/control-plane/gatekeeper.test.ts` and `gate-decision.test.ts`.

### 11. Test Coverage Gap: Behavioral Profile Resolution
**Files:** `src/routing/behavioral-profile/`
**Issue:** No dedicated test files for behavioral profile resolution.
**Impact:** Config-first merge logic and expertise mapping untested.
**Fix approach:** Add `tests/routing/behavioral-profile/resolve-behavioral-profile.test.ts`.

### 12. Test Coverage Gap: Governance Engine
**Files:** `src/features/governance-engine/`
**Issue:** No dedicated test files for evaluator, config-reader, or create-governance-session.
**Impact:** Governance rule evaluation and session creation untested.
**Fix approach:** Add `tests/governance-engine/evaluator.test.ts` and `config-reader.test.ts`.

---

*Inventory analysis: 2026-06-06*
