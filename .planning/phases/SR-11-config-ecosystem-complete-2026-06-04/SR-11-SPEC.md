# Phase SR-11: Config Ecosystem Complete — Specification

**Created:** 2026-06-04
**Ambiguity score:** 0.12 (gate: ≤ 0.20)
**Requirements:** 4 locked

## Goal

Complete the config ecosystem by adding a conversational governance configuration skill, registering all custom tools in configs.json, documenting default behavior when configs.json is missing/empty, and making `getDefaultConfigs()` return a complete config including all governance fields — so that every Hivemind installation starts with a fully functional, self-documenting governance surface.

## Background

SR-05 unified the governance system by merging `.hivemind/governance/config.json` into `.hivemind/configs.json.governance`, populated `agent_configs` and `command_agent_mappings`, and wired runtime enforcement. However, four gaps remain:

1. **No conversational governance configuration skill**: Users cannot ask "how do I block bash for child sessions?" and get guided through creating the right governance rule. The `hm-config` command exists but only toggles workflow flags — it does not guide governance rule creation.

2. **Custom tools not registered in configs.json**: The `governance` section has `agent_configs` (42 agents) and `command_agent_mappings` (100+ commands) but no `tool_registry`. The 26+ custom tools (delegate-task, session-tracker, hivemind-doc, etc.) have no governance metadata — their default permissions, categories, and descriptions are undocumented in the config surface.

3. **No default behavior documentation**: When `configs.json` is missing or empty, `readConfigs()` returns `getDefaultConfigs()` which calls `HivemindConfigsSchema.parse({})` — returning Zod defaults. But there is no REFERENCE.md documenting what those defaults are, what each field means, or what behavior users should expect from a fresh installation.

4. **getDefaultConfigs() returns minimal defaults**: The function returns `HivemindConfigsSchema.parse({})` which produces Zod schema defaults — but the `governance` field defaults to `{rules: []}` with no `agent_configs`, `command_agent_mappings`, `naming_standards`, or `tool_registry`. A fresh install has governance structure but no content.

## Requirements

### REQ-01: Conversational governance config skill

Create a skill that guides users through configuring `configs.json.governance` interactively.

- **Current:** `hm-config` command toggles workflow flags only. No skill exists for governance rule creation. Users must manually edit JSON to add rules, agent configs, or tool permissions. The governance schema is documented only in source code.
- **Target:** A new skill (e.g., `hm-l2-governance-config`) that:
  - Explains governance concepts (rules, conditions, actions, agent_configs, tool_registry)
  - Guides users through common scenarios: "block bash for child sessions", "warn on deep delegation", "allow only specific tools at depth 2"
  - Generates valid governance rule JSON that users can paste into configs.json
  - Validates user-provided rule snippets against the GovernanceRuleSchema
  - Covers all governance fields: rules, agent_configs, command_agent_mappings, naming_standards, templates, behavioral overrides
- **Acceptance:** User asks "how do I block bash for child sessions?" → skill returns a valid governance rule JSON with `condition.toolNames: ["bash"]`, `condition.depth.min: 1`, `action.type: "block"`. User asks "what tools are available?" → skill lists all registered tools from tool_registry. Skill is loadable via `skill({name: "hm-l2-governance-config"})`.

### REQ-02: Custom tools registry in configs.json

Add `governance.tool_registry` field to schema and register all 26+ custom tools.

- **Current:** No `tool_registry` field in `GovernanceConfigsSchema`. Custom tools have no governance metadata in configs.json. Tool permissions are only in source code (`AGENT_TOOLS` in plugin.ts). Users cannot see or configure which tools are available.
- **Target:** `GovernanceConfigsSchema` gains optional `tool_registry` field. Each entry has:
  - `name`: Tool identifier (e.g., "delegate-task")
  - `description`: Human-readable description
  - `category`: Tool category (e.g., "delegation", "session", "hivemind", "config", "prompt", "tmux")
  - `default_permission`: "allow" | "ask" | "deny"
  - `requires_governance`: boolean (true for tools that participate in governance evaluation)
- **Tool list (26+ tools):**
  - Delegation: delegate-task, delegation-status
  - Session: execute-slash-command, session-patch, session-journal-export, session-tracker, session-hierarchy, session-context, session-delegation-query
  - Hivemind: run-background-command, hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-session-view, hivemind-agent-work-create, hivemind-agent-work-export, create-governance-session
  - Config: bootstrap-init, bootstrap-recover, configure-primitive, validate-restart
  - Prompt: prompt-skim, prompt-analyze
  - Tmux: tmux-copilot, tmux-state-query
- **Acceptance:** `Object.keys(readConfigs().governance.tool_registry).length >= 26`. All 26 tools present by name. Each tool has all 5 required fields. Schema validation passes. `getDefaultConfigs()` includes full tool_registry.

### REQ-03: Default behavior documentation

Document what happens when configs.json is missing/empty and document default values for each field.

- **Current:** No REFERENCE.md exists. Default behavior is only discoverable by reading source code (`hivemind-configs.schema.ts:395-397`). Users do not know what a fresh installation provides.
- **Target:** Create `SR-11-REFERENCE.md` in the phase directory documenting:
  - What `readConfigs()` returns when file is missing (line 433-434)
  - What `readConfigs()` returns when file is empty/invalid (line 450-454)
  - Complete list of default values for every `HivemindConfigsSchema` field
  - Complete list of default values for every `GovernanceConfigsSchema` field
  - Default governance rules (from configs.json)
  - Default agent_configs (42 agents)
  - Default command_agent_mappings (100+ commands)
  - Default tool_registry (26+ tools)
  - Default behavioral profile dimensions
  - Default workflow flags
  - Migration notes for users upgrading from pre-SR-05 configs
- **Acceptance:** REFERENCE.md exists with all sections above. Every field in `HivemindConfigsSchema` has a documented default. Every field in `GovernanceConfigsSchema` has a documented default. Document is accurate against source code.

### REQ-04: Full config rebuild at defaults

Make `getDefaultConfigs()` return COMPLETE config including governance fields, and ensure `bootstrap-init` generates full config.

- **Current:** `getDefaultConfigs()` calls `HivemindConfigsSchema.parse({})` which returns Zod defaults. The `governance` field defaults to `{rules: []}` with no `agent_configs`, `command_agent_mappings`, `naming_standards`, or `tool_registry`. A `hivemind init --yes` produces a config with empty governance.
- **Target:**
  - `getDefaultConfigs()` returns config with populated governance fields: default rules (5+ rules from SR-05), default agent_configs (42 agents), default command_agent_mappings (100+ commands), default naming_standards, default templates, default tool_registry (26+ tools)
  - `bootstrap-init` generates configs.json with all governance fields populated
  - Config passes `HivemindConfigsSchema.parse()` validation
  - All existing tests continue to pass
- **Acceptance:** `getDefaultConfigs().governance.rules.length >= 5`. `getDefaultConfigs().governance.agent_configs` has 42+ keys. `getDefaultConfigs().governance.command_agent_mappings` has 100+ keys. `getDefaultConfigs().governance.tool_registry` has 26+ keys. `getDefaultConfigs().governance.naming_standards` is populated. `bootstrap-init` output matches `getDefaultConfigs()` structure. `npm run typecheck` passes. `npm test` passes.

## Boundaries

**In schema:**
- Schema extension for `GovernanceConfigsSchema` — add `tool_registry` field with Zod schema
- Schema extension for `HivemindConfigsSchema` — no changes needed (governance already exists)
- `getDefaultConfigs()` update — return complete governance content instead of empty defaults
- `bootstrap-init` update — generate full config with all governance fields
- New skill creation — `hm-l2-governance-config` SKILL.md
- REFERENCE.md creation — default behavior documentation
- Test coverage for new schema fields and default values

**Out of scope:**
- Modifying existing governance rules or agent_configs content — SR-05 already populated these
- Adding new custom tools — only registering existing 26+ tools
- Changing runtime governance evaluation logic — `evaluateGovernance()` unchanged
- Modifying behavioral profile resolver — SR-05 already connected config to profile
- Adding governance enforcement for tool_registry — registry is metadata-only for this phase
- CLI commands for governance configuration — skill-based guidance only
- Migration tooling for pre-SR-05 configs — SR-05 already handled migration

## Constraints

- Schema extension must be additive (backward compatible) — existing `configs.json` files without `tool_registry` must continue to work with defaults
- `getDefaultConfigs()` must return valid `HivemindConfigs` that passes `HivemindConfigsSchema.parse()`
- `bootstrap-init` output must be valid and loadable by `readConfigs()`
- All existing tests must continue to pass (no regressions)
- New skill must follow hf-* naming conventions and AQUAL quality standards
- REFERENCE.md must be accurate against source code — no aspirational documentation

## Acceptance Criteria

- [ ] SR11-AC-01: `GovernanceConfigsSchema` includes optional `tool_registry` field with correct Zod type.
- [ ] SR11-AC-02: `getDefaultConfigs().governance.tool_registry` contains all 26+ custom tools with name, description, category, default_permission, requires_governance fields.
- [ ] SR11-AC-03: `getDefaultConfigs().governance.rules` contains 5+ governance rules (not empty array).
- [ ] SR11-AC-04: `getDefaultConfigs().governance.agent_configs` contains 42+ agent entries.
- [ ] SR11-AC-05: `getDefaultConfigs().governance.command_agent_mappings` contains 100+ command entries.
- [ ] SR11-AC-06: `getDefaultConfigs().governance.naming_standards` is populated with allowed_frameworks, allowed_classifications, naming_format.
- [ ] SR11-AC-07: `getDefaultConfigs().governance.templates` is populated with at least governance-brief and audit-brief.
- [ ] SR11-AC-08: `readConfigs()` with missing file returns complete config with all governance fields populated.
- [ ] SR11-AC-09: `readConfigs()` with empty/invalid file returns complete config with all governance fields populated.
- [ ] SR11-AC-10: `bootstrap-init` generates configs.json that matches `getDefaultConfigs()` structure.
- [ ] SR11-AC-11: `SR-11-REFERENCE.md` exists with documented defaults for every HivemindConfigsSchema field.
- [ ] SR11-AC-12: `SR-11-REFERENCE.md` documents default behavior for missing, empty, and invalid configs.json scenarios.
- [ ] SR11-AC-13: Skill `hm-l2-governance-config` exists and is loadable via `skill()` tool.
- [ ] SR11-AC-14: Skill guides users through governance rule creation with valid JSON output.
- [ ] SR11-AC-15: `npm run typecheck` passes with no errors.
- [ ] SR11-AC-16: `npm test` passes with no regressions.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | 4 concrete requirements with clear current/target/acceptance |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Explicit in-scope/out-of-scope with reasoning |
| Constraint Clarity | 0.85  | 0.65 | ✓      | Backward compatibility, schema validation, test preservation |
| Acceptance Criteria| 0.88  | 0.70 | ✓      | 16 pass/fail criteria with measurable outcomes |
| **Ambiguity**      | 0.12  | ≤0.20| ✓      | Gate passed on initial assessment — auto mode, interview skipped |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|-----------------|
| N/A   | —           | [auto] Initial ambiguity 0.12 — below gate threshold | Requirements derived from user prompt + SR-05 artifacts + codebase scout without interview |

---

*Phase: SR-11-config-ecosystem-complete*
*Spec created: 2026-06-04*
*Next step: /hm-discuss-phase SR-11 — implementation decisions (tool_registry schema design, default content source, skill structure)*
