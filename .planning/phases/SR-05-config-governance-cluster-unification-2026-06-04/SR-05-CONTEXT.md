# Phase SR-05: Config & Governance Cluster Unification — Context & Decisions

## Design Decisions

### Decision 1: Merge Strategy
- **Status:** LOCKED
- **Approach:** Single file `.hivemind/configs.json` is the main and only governance config. ALL fields from `.hivemind/governance/config.json` are added to `HivemindConfigsSchema.governance` as proper Zod schema fields — not just JSON blobs. Old file is deleted immediately after merge (Decision 5).
- **Rationale:** Fields must have schema validation, bootstrap injection, and downstream workflow chaining — not arbitrary JSON. Single source of truth for ALL governance configuration.

### Decision 2: Reader Fallback Pattern
- **Status:** LOCKED
- **Approach:** Facade pattern — keep `readGovernanceConfig()` exported function, change implementation to call `readConfigs().governance`. Backward compatible, zero consumer changes, extendable for future governance fields.
- **Rationale:** Industrial best practice for maintainability. Any new governance field just needs schema addition + facade returns it.

### Decision 3: Session Depth Tracking
- **Status:** LOCKED
- **Approach:** Dual-source — OpenCode SDK native parentID chain as primary authoritative source, `getDelegationMeta(sessionID).depth` as fallback when SDK data unavailable. Cross-validation: log warning when sources mismatch.
- **Rationale:** All three tools (task, execute-slash-command, delegate-task) use OpenCode SDK — SDK is the most authoritative hierarchy source. Fallback prevents flaws in internal module tracking from blocking governance.

### Decision 4: Config Field Naming Convention
- **Status:** LOCKED
- **Approach:** snake_case in `.hivemind/configs.json` (matching existing config convention). Convert to camelCase via schema transformation when injecting into `BehavioralProfiles` interface.
- **Rationale:** Config files use snake_case throughout. Schema layer handles the snake→camel conversion at injection time — zero confusion, clean separation.

### Decision 5: Old Config File Handling
- **Status:** LOCKED
- **Approach:** Delete `.hivemind/governance/config.json` immediately after merge completion. No archive, no warning. Clean break.
- **Rationale:** File never had runtime enforcement. Cleanest approach per user preference.

### Decision 6: Naming Validation Enforcement
- **Status:** LOCKED
- **Approach:** Warning (soft enforce) for 1 phase. Session is created but validation failure is logged. Graduates to blocking in a follow-up phase.
- **Rationale:** Allows downstream agents to adapt to new naming convention before strict enforcement.

## Governance Rules Content (from Decision 3 discussion)

### Rule 1: delegate-task subagent-only (block in root sessions)
- Condition: toolName=delegate-task, depth=0
- Action: block with guidance "Use native task for root orchestration"
- SDK depth primary, getDelegationMeta() fallback

### Rule 2: write/edit depth-warn (warn at depth >= 2)
- Condition: toolName IN [write, edit], depth >= 2
- Action: warn with guidance
- SDK depth primary, getDelegationMeta() fallback

### Rule 3: delegate-task depth-block (block at depth >= 3)
- Condition: toolName=delegate-task, depth >= 3
- Action: block

### Rule 4: create-session warn (warn for unnamed sessions)
- Condition: toolName=create-governance-session, missing naming standards
- Action: warn (soft enforce — Decision 6)

### Rule 5: unsafe-tools escalate (bash at depth >= 1 for unknown agents)
- Condition: toolName=bash, depth >= 1, agent not in known list
- Action: escalate to user

### Decision 7: Full Registry Populate
- **Status:** LOCKED
- **Approach:** Populate `configs.json.governance.agent_configs` with ALL 42 shipped agents (31 hm-* + 11 hf-*) and `configs.json.governance.command_agent_mappings` with ALL shipped commands (non-gsd-* from `.opencode/commands/` and `.opencode/command/`). Current state: only 7 agents and 4 commands registered — a critical governance gap.
- **Rationale:** Runtime governance rules (agent command enforcement, naming validation) require complete registry data. Partial registry means most agents/commands bypass governance entirely. Full populate ensures `resolveAgentForBrief()` and agent command enforcement have complete data.

## Assumptions
- **A-01:** `HivemindConfigsSchema` uses `.strip()` — additive schema changes are backward compatible
- **A-02:** Existing consumers of `readGovernanceConfig()` work unchanged with facade pattern
- **A-03:** OpenCode SDK provides parentID chain for session hierarchy (validate during implementation)
- **A-04:** `getDelegationMeta()` is available in all hook contexts (verified in tool-guard-hooks.ts)

## Risks
- **R-01:** If SDK parentID chain is not available, fallback to getDelegationMeta() may not track cross-process sessions
- **R-02:** Deleting old config file immediately may break any tool that reads it directly (grep to verify zero consumers)

## Evidence References
- `.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md`
- `src/features/governance-engine/config-reader.ts`
- `src/schema-kernel/hivemind-configs.schema.ts:266-305`
- `src/hooks/guards/tool-guard-hooks.ts:84,158`
- `src/shared/state.ts` — getDelegationMeta()
