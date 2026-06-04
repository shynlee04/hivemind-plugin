# Phase SR-05: Config & Governance Cluster Unification — Specification

**Created:** 2026-06-04
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Merge the two separate `.hivemind/governance/config.json` and `.hivemind/configs.json` governance configs into a single authoritative schema under `configs.json.governance`, populate the empty `governance.rules` with concrete tool governance rules so `evaluateGovernance()` actually enforces tool access, and make `guardrailLevel`/`delegationMode`/`toolAccessPattern`/`skillFilter` config-driven rather than static-only — producing a single, coherent, runtime-enforced governance surface.

## Background

The Hivemind config/governance system has **5 critical problems** identified by forensic research (`config-governance-forensic-research-2026-06-04.md`), all verified against live source code:

1. **Two separate governance configs with zero connection**: `.hivemind/configs.json` has a `governance.rules` field defined in the Zod schema (`GovernanceConfigsSchema`) but it is **missing from the actual file**, falling back to `{rules: []}` default. A completely separate file at `.hivemind/governance/config.json` has agent descriptions, `allowedCommands`, naming standards, and command-to-agent mappings — but it is **never enforced at runtime**. The two systems do not share a single config path, schema, or reader.
2. **Governance evaluator wired but empty**: `tool-guard-hooks.ts:158` calls `evaluateGovernance()` on every `tool.execute.before` event. Since `configs.json` has no `governance` field, the condition `depsHivemindConfig?.governance?.rules` evaluates to falsy and the entire governance evaluation branch is skipped. The schema, evaluator, and hook wire are all production-ready — but zero rules are configured.
3. **Behavioral profile guardrails are static, not config-driven**: The four security-relevant dimensions (`guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter`) come from a static lookup table in `profiles.ts`. They cannot be overridden per project or per session without changing source code. This was explicitly deferred from BOOT-09 to WS-4, which was never initiated.
4. **SR-05 config reconciliation was planned but never implemented**: The directory `.planning/phases/SR-05-config-to-config-realm/` exists but is empty (only `.gitkeep`). No SPEC, PLAN, or CONTEXT documents exist. The reconciliation of the two config spaces was scoped but abandoned.
5. **`.hivemind/governance/config.json` has no runtime enforcement**: The `allowedCommands` per-agent configs, the `naming_standards`, and the `commands` → agent mappings are documentation-only. No agent, hook, or tool guard enforces them at runtime.

## Requirements

### REQ-01: Unify two governance configs into one authoritative source

Merge `.hivemind/governance/config.json` fields into `.hivemind/configs.json` under the existing `governance` namespace.

- **Current:** Two separate config files with different schemas, readers, and consumers. No sharing between them. The governance/config.json has naming standards, agent configs, command mappings, and templates that configs.json knows nothing about.
- **Target:** `readConfigs()` returns a `HivemindConfigs` with populated `governance.naming_standards`, `governance.agent_configs`, `governance.command_agent_mappings`, and `governance.rules` (see REQ-02). `readGovernanceConfig()` reads from the unified config via `readConfigs()` as fallback. The separate governance/config.json is archived.
- **Acceptance:** `readConfigs()` returns governance data equivalent to the current governance/config.json content. All consumers of `readGovernanceConfig()` (create-governance-session, naming validation) still work with the unified source.

### REQ-02: Populate governance.rules with real tool governance rules

Add concrete governance rules to `.hivemind/configs.json.governance.rules` so that `evaluateGovernance()` actually enforces tool access.

- **Current:** `configs.json` has no `governance` field. `evaluateGovernance()` at `tool-guard-hooks.ts:158` checks `depsHivemindConfig?.governance?.rules` → falsy → full governance branch skipped. Zero enforcement exists.
- **Target:** At least 5 governance rules configured (delegate-task subagent-only, write delegation-depth, delegate-task subagent-deep, warn create-session, escalate unsafe-tools). Session depth tracking added to enable depth-based rule matching. Test coverage proves rules fire.
- **Acceptance:** `evaluateGovernance("delegate-task", "ses_child_1", populatedRules).blocked === true`. `evaluateGovernance("read", "ses_child_1", populatedRules).blocked === false`. Integration test proves governance branch executes on tool-guard-hooks.

### REQ-03: Connect behavioral profile to config values

Make `guardrailLevel`, `delegationMode`, `toolAccessPattern`, and `skillFilter` config-driven rather than static-only.

- **Current:** `resolveBehavioralProfile()` at `resolve-behavioral-profile.ts:64` uses `BehavioralProfiles[mode]` static lookup. The four security dimensions are locked to the mode selection. No config fields exist for overriding them.
- **Target:** `HivemindConfigsSchema` gains optional fields for all four dimensions. `resolveBehavioralProfile()` checks config values first — if a config field is defined, it overrides the static profile dimension. Child sessions inherit these overrides from parent's resolved profile.
- **Acceptance:** With `guardrail_level: "strict"` in configs.json, `resolveBehavioralProfile()` returns `behavioralProfile.guardrailLevel === "strict"` regardless of mode. With config values undefined, returns static profile values unchanged.

### REQ-04: Implement SR-05 config reconciliation

Reconcile the two config spaces by ensuring the merged structure preserves all existing functionality and provides a migration path.

- **Current:** Two parallel config systems with zero connection. `create-governance-session.ts:108-109` reads from the separate governance/config.json. No migration path exists.
- **Target:** All consumers of `readGovernanceConfig()` and `resolveAgentForBrief()` receive equivalent data from the unified config. The old file is archived with deprecation warning startup. `hivemind init --yes` produces the new extended config structure including default governance rules. No external API changes for existing tools.
- **Acceptance:** `create-governance-session` tool returns identical results before and after migration. Startup warning emitted when old config exists. `hivemind init --yes` produces configs.json with populated `governance` field.

### REQ-05: Enforce naming standards at runtime

Wire naming standards validation from the unified config into a runtime enforcement point.

- **Current:** `.hivemind/governance/config.json` has `naming_standards` with allowed frameworks, workflows, classifications, and naming format — but these are documentation-only. `validateNamingTitle()` exists and is technically functional but is never called at any enforcement point. `create-governance-session.ts` does not validate session titles before creation.
- **Target:** `create-governance-session.ts` validates session titles against `naming_standards` before session creation, rejecting non-conforming titles with a descriptive error. Agent command enforcement fires on `create-governance-session` tool calls: resolve the target agent and check its `allowedCommands`.
- **Acceptance:** `validateNamingTitle("hm/governance/root/mapper/data-collection@0", config.naming_standards) === true`. `validateNamingTitle("invalid/title", config.naming_standards) === false`. `create-governance-session` with invalid title returns error. Agent command enforcement test proves warning/block fires on disallowed commands.

## Boundaries

**In scope:**
- Schema extension for `GovernanceConfigsSchema` — add `naming_standards`, `agent_configs`, `command_agent_mappings`, `templates`
- Schema extension for `HivemindConfigsSchema` — add `guardrail_level`, `delegation_mode`, `tool_access_pattern`, `skill_filter`
- Schema extension for `GovernanceRuleSchema` — add `depth` condition field
- Reader migration — `config-reader.ts` reads from unified source with fallback
- Config population — write actual governance content to `.hivemind/configs.json.governance`
- Behavioral profile resolver update — config values override static profile dimensions
- Archive old governance/config.json with deprecation notice
- Naming validation enforcement in `create-governance-session.ts`
- Agent command enforcement in governance tool pipeline
- Test coverage: governance evaluator (depth-based rules), behavioral profile merging, naming validation, tool-guard-hooks integration
- Startup deprecation warning for old config
- `hivemind init --yes` support for new extended config structure
- Remove `HIVEMIND_GOVERNANCE_CONFIG_PATH` env var override

**Out of scope:**
- Post-hoc content validation for language governance — explicitly deferred by BOOT-09 D-12; enforcement is via instruction, not validation
- Per-path or per-document language override — deferred to WS-4; no evidence WS-4 was initiated
- `user_expert_level` runtime enforcement — also deferred to WS-4
- Full OpenCode SDK permission boundary redesign — Phase 45 already covers delegation-time tool permission maps
- Migration of legacy `.hivemind/state/governance-state.json` — persistence format unchanged; only source config path changes
- New tools or CLI commands — modifies existing config schemas, config files, hooks, and tools; no new custom tools or CLI commands
- Generic condition expressions in governance rules — D-13 specified YAML/JSON-definable rules but did not require full expression engines; toolNames + sessionIDs matching is sufficient for MVP

## Constraints

- Schema extension must be additive (backward compatible) — existing `configs.json` files without `governance` field must continue to work with defaults
- `resolveBehavioralProfile()` must continue to read fresh config from disk (current behavior at line 62 of resolve-behavioral-profile.ts) — config changes take effect without plugin restart
- `evaluateGovernance()` signature (toolName, sessionID, rules) must remain unchanged — consumer is `tool-guard-hooks.ts:159`
- Session depth tracking must be compatible with existing session ID naming conventions (e.g., `ses_child_1`, `ses_grandchild_1`)
- `hivemind init --yes` must produce a valid `configs.json` that passes `HivemindConfigsSchema.parse()`
- All existing tests must continue to pass (no regressions)

## Acceptance Criteria

- [ ] SR05-AC-01: The `governance` field in `.hivemind/configs.json` SHALL contain `rules`, `naming_standards`, `agent_configs`, and `command_agent_mappings` after config initialization (`hivemind init --yes`).
- [ ] SR05-AC-02: When a tool is called and a matching governance rule with `type: "block"` exists, the tool SHALL be blocked with an `[Harness] Tool execution blocked by governance` error.
- [ ] SR05-AC-03: When a tool is called and a matching governance rule with `type: "warn"` exists, the tool SHALL proceed and a warning SHALL be added via `stateManager.addWarning()`.
- [ ] SR05-AC-04: When `delegate-task` is called in a child session (depth >= 1), it SHALL be blocked by the relevant governance rule (depth-based matching).
- [ ] SR05-AC-05: `resolveBehavioralProfile()` SHALL return config-defined values for `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter` when their corresponding config fields are set, overriding the static mode lookup.
- [ ] SR05-AC-06: When config fields from REQ-03 are undefined, `resolveBehavioralProfile()` SHALL return the static `BehavioralProfiles[mode]` values unchanged.
- [ ] SR05-AC-07: The `create-governance-session` tool SHALL validate session titles against `naming_standards` and reject non-conforming titles with a descriptive error.
- [ ] SR05-AC-08: `.hivemind/governance/config.json` SHALL NOT be read by any runtime component after migration. The file MAY exist as an archived copy (`.hivemind/governance/config.json.archived`).
- [ ] SR05-AC-09: A startup warning SHALL be emitted if `.hivemind/governance/config.json` (non-archived) still exists.
- [ ] SR05-AC-10: When `hivemind init --yes` runs, the generated `.hivemind/configs.json` SHALL include a populated `governance` field with default rules from REQ-02.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | 5 concrete requirements with sub-requirements |
| Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit in-scope/out-of-scope with reasoning |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Backward compatibility, evaluator API stability, fresh config, depth tracking |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 10 pass/fail criteria with EARS notation |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      | Gate passed on initial assessment — auto mode, interview skipped |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|-----------------|
| N/A   | —           | [auto] Initial ambiguity 0.10 — below gate threshold | Requirements derived from existing SPEC.md + forensic research + codebase scout without interview |

---

*Phase: SR-05-config-governance-cluster-unification*
*Spec created: 2026-06-04*
*Next step: /hm-discuss-phase SR-05 — implementation decisions (schema design, migration strategy, rule content)*
