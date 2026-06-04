# Phase SR-05: Config & Governance Cluster Unification — Research

**Researched:** 2026-06-04
**Domain:** Hivemind Config/Governance Architecture, Schema Kernel, Hook System, Zod v4
**Confidence:** HIGH (all findings verified against live source code)

## Summary

SR-05 unifies two disconnected governance config systems into a single authoritative surface. The primary config (`configs.json`) has a fully-wired Zod schema + evaluator + hook integration — but zero rules configured. A separate file (`governance/config.json`) contains naming standards, agent configs, and command mappings that are never enforced at runtime. The behavioral profile system has 4 security-relevant dimensions locked to a static lookup table with no config override capability.

The technical surface is well-understood: Zod v4.4.3 schemas (with a critical `.strip()` deprecation to handle), an existing `evaluateGovernance()` evaluator at `tool-guard-hooks.ts:158`, and the `@opencode-ai/plugin` v1.15.13 hook system. All 5 requirements from the SPEC are implementable within existing architecture — no new dependencies needed. The main risk is the dual-source session depth tracking (SDK parentID chain vs internal `getDelegationMeta()` fallback) which must be validated against the actual OpenCode SDK runtime.

**Primary recommendation:** Extend `GovernanceConfigsSchema` to include `naming_standards`, `agent_configs`, `command_agent_mappings`, and `templates` fields. Populate `configs.json.governance.rules` with 5 concrete rules. Add 4 optional fields to `HivemindConfigsSchema` for behavioral profile overrides. Replace the static `BehavioralProfiles` lookup with a config-first merge in `resolveBehavioralProfile()`. Archive `governance/config.json` and update `readGovernanceConfig()` to call `readConfigs().governance`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Config schema (configs.json) | Schema Kernel (`hivemind-configs.schema.ts`) | — | Zod validation, defaults, read/write helpers |
| Config caching | Config Subscriber (`config/subscriber.ts`) | — | Lazy-load, cache-per-project, `getFreshConfig()` for hot-reload |
| Tool governance evaluation | Governance Engine (`governance-engine/evaluator.ts`) | Tool Guard Hooks (`tool-guard-hooks.ts:158`) | `evaluateGovernance()` called from `tool.execute.before` |
| Separate governance config | Governance Engine (`governance-engine/config-reader.ts`) | Create Governance Session Tool | Independent file with independent pipeline — TO BE MERGED |
| Language governance (system prompt) | Core Hooks (`core-hooks.ts`) | Governance Block (`governance-block.ts`) | System transform injection at position 0 |
| Document language tool guard | Tool Guard Hooks (`tool-guard-hooks.ts:176-219`) | — | Pre-execution reminder for Write/Edit/apply_patch |
| Behavioral profile resolution | Behavioral Profile (`resolve-behavioral-profile.ts`) | Profiles (`profiles.ts`) | Config → mode → static profile → merged output |
| Governance violation persistence | Governance Persistence (`governance/persistence.ts`) | — | Atomic write to `.hivemind/state/governance-state.json` |
| Session depth tracking | OpenCode SDK (`parentID` chain) | `getDelegationMeta()` in `shared/state.ts` | Dual-source with cross-validation |

## Standard Stack

### Core

| Library | Version (package.json) | Version (installed) | Purpose | Why Standard |
|---------|----------------------|---------------------|---------|--------------|
| `zod` | `^4.4.3` | `4.4.3` [VERIFIED: npm] | Schema validation for configs, rules, inputs | Already used throughout schema-kernel; v4 is current stable |
| `@opencode-ai/plugin` | `^1.15.13` | `1.15.13` [VERIFIED: npm] | Plugin SDK: `tool()`, hook registration, session API | Peer dependency; provides `tool.execute.before/after` hooks |
| `@opencode-ai/sdk` | `^1.15.13` | `1.15.13` [VERIFIED: npm] | OpenCode SDK: `createSession`, `getSession`, `sendPrompt` | Used by governance session tool for session lifecycle |
| `typescript` | `^5.0.0` | `5.9.3` [VERIFIED: npm] | Type checking | Project-wide; strict mode enabled |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `yaml` | `^2.9.0` | YAML parsing | Not needed for SR-05 (config is JSON) |
| `gray-matter` | `^4.0.3` | Frontmatter parsing | Not needed for SR-05 |
| `vitest` | `^4.1.7` | Test framework | All new tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod `.catchall(z.unknown())` for rule conditions | Strict `z.object()` only | Loses forward-compatibility for new condition types; SR-05 SPEC explicitly allows `catchall` |
| JSON Schema validation | Zod | Zod is already the project standard; JSON Schema would add a dependency |
| File-based rule loading (separate rules.json) | Inline rules in configs.json | Extra file = extra reader + path resolution; SPEC says single source of truth |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Status | Disposition |
|---------|----------|-----|-----------|-------------|--------|-------------|
| `zod` | npm | 5+ years | 100M+ | colinhacks/zod | [VERIFIED: npm registry] | Use as-is |
| `@opencode-ai/plugin` | npm | 1+ year | Internal | anomalyco/opencode | [VERIFIED: npm registry] | Peer dep — use installed version |
| `@opencode-ai/sdk` | npm | 1+ year | Internal | anomalyco/opencode | [VERIFIED: npm registry] | Use installed version |
| `vitest` | npm | 3+ years | 50M+ | vitest-dev/vitest | [VERIFIED: npm registry] | Dev dep — use installed version |

No new packages required for SR-05. All work uses existing dependencies.

## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
    subgraph "Config Source"
        A[".hivemind/configs.json"] -->|readConfigs| B[Schema Kernel]
        C[".hivemind/governance/config.json"] -->|readGovernanceConfig| D[Config Reader]
    end

    subgraph "Schema Kernel"
        B -->|HivemindConfigsSchema.parse| E[HivemindConfigs]
        E -->|governance.rules| F[GovernanceConfigsSchema]
        E -->|mode| G[BehavioralProfiles lookup]
    end

    subgraph "Hook System"
        H["tool.execute.before"] -->|toolName, sessionID| I[Tool Guard]
        I -->|evaluateGovernance| J[Evaluator]
        J -->|rules from configs.governance| J
        I -->|depth tracking| K[getDelegationMeta / SDK parentID]
    end

    subgraph "Behavioral Profile"
        L[resolveBehavioralProfile] -->|config.mode| G
        L -->|config.guardrail_level| M[override]
        L -->|config.delegation_mode| M
        L -->|config.tool_access_pattern| M
        L -->|config.skill_filter| M
    end

    subgraph "SR-05 Target"
        A -->|merged governance| N[Single Config Source]
        C -.->|archived| O[config.json.archived]
        D -.->|facade: readConfigs().governance| N
    end

    style N fill:#2d6,stroke:#333
    style O fill:#999,stroke:#333
```

### Recommended Project Structure (post-SR-05)

```
src/
├── schema-kernel/
│   └── hivemind-configs.schema.ts    # Extended: GovernanceConfigsSchema gains naming_standards, agent_configs, command_agent_mappings, templates
│                                      # Extended: HivemindConfigsSchema gains guardrail_level, delegation_mode, tool_access_pattern, skill_filter
├── features/
│   └── governance-engine/
│       ├── config-reader.ts           # Modified: readGovernanceConfig() becomes facade calling readConfigs().governance
│       ├── evaluator.ts               # Extended: depth-based rule matching (condition.depth field)
│       └── create-governance-session.ts # Modified: naming validation before session creation
├── routing/
│   └── behavioral-profile/
│       ├── resolve-behavioral-profile.ts # Modified: config-first merge for 4 dimensions
│       └── profiles.ts                  # Unchanged (static lookup still used as fallback)
└── hooks/
    └── guards/
        └── tool-guard-hooks.ts        # Unchanged (already wired)

.hivemind/
├── configs.json                       # Extended: gains governance.naming_standards, governance.agent_configs, etc.
└── governance/
    └── config.json.archived           # Moved from config.json
```

### Pattern 1: Facade Pattern for readGovernanceConfig()

**What:** Keep `readGovernanceConfig()` exported function, change implementation to call `readConfigs().governance`. Backward compatible, zero consumer changes.

**When to use:** When migrating consumers from one config source to another without breaking the public API.

**Example (locked in CONTEXT.md Decision 2):**
```typescript
// BEFORE (reads separate file):
export async function readGovernanceConfig(projectRoot?: string): Promise<GovernanceConfig> {
  const root = projectRoot ?? process.cwd()
  const configPath = resolveConfigPath(root)
  const raw = await readFile(configPath, "utf-8")
  // ... parse and validate
}

// AFTER (facade over unified config):
export function readGovernanceConfig(projectRoot?: string): GovernanceConfig {
  const root = projectRoot ?? process.cwd()
  const configs = readConfigs(root)
  return configs.governance  // Already validated by HivemindConfigsSchema
}
```

### Pattern 2: Config-First Merge for Behavioral Profile

**What:** `resolveBehavioralProfile()` checks config values first — if a config field is defined, it overrides the static profile dimension.

**When to use:** When you need backward-compatible config overrides for previously-hardcoded values.

**Example (from SPEC REQ-03):**
```typescript
export function resolveBehavioralProfile(
  _sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  const config = getFreshConfig(projectRoot)
  const mode = config.mode as keyof typeof BehavioralProfiles
  const staticProfile = BehavioralProfiles[mode]

  // Config-first merge: config values override static profile
  const behavioralProfile: BehavioralProfile = {
    guardrailLevel: config.guardrail_level ?? staticProfile.guardrailLevel,
    delegationMode: config.delegation_mode ?? staticProfile.delegationMode,
    toolAccessPattern: config.tool_access_pattern ?? staticProfile.toolAccessPattern,
    skillFilter: config.skill_filter ?? staticProfile.skillFilter,
  }
  // ... rest of resolution
}
```

### Pattern 3: Depth-Based Governance Rules

**What:** Extend `GovernanceRuleSchema.condition` with a `depth` field for delegation-depth-based matching.

**When to use:** When rules need to fire based on session hierarchy depth, not just tool name or session ID.

**Example:**
```typescript
// Schema extension
export const GovernanceRuleSchema = z.object({
  id: z.string(),
  condition: z.object({
    toolNames: z.array(z.string()).optional(),
    sessionIDs: z.array(z.string()).optional(),
    depth: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).catchall(z.unknown()),
  action: z.object({
    type: z.string(),
    escalation: z.record(z.string(), z.unknown()).optional(),
  }).catchall(z.unknown()),
  enabled: z.boolean().default(true),
})
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config validation | Custom JSON validators | Zod schemas | Already project standard; type inference built-in |
| Config caching | Custom cache invalidation | `config/subscriber.ts` (`getConfig`/`getFreshConfig`) | Already handles lazy-load, cache-per-project |
| Session depth tracking | Custom depth counter | OpenCode SDK `parentID` chain + `getDelegationMeta()` fallback | SDK is authoritative; fallback prevents internal tracking flaws from blocking governance |
| Config file reading | Raw `fs.readFile` + JSON.parse | `readConfigs()` | Handles migration, defaults, validation in one call |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `.hivemind/state/governance-state.json` — violation records | Verify `GovernancePersistenceState` schema unchanged after rule additions |
| Live service config | No external services | N/A |
| OS-registered state | None | N/A |
| Secrets and env vars | `HIVEMIND_GOVERNANCE_CONFIG_PATH` — overrides governance config path | **REMOVE** per SPEC: "Remove `HIVEMIND_GOVERNANCE_CONFIG_PATH` env var override" |
| Build artifacts | `.hivemind/configs.schema.json` — generated by `npm run build` | Regenerate after schema changes |

## Common Pitfalls

### Pitfall 1: Zod v4 `.strip()` Deprecation
**What goes wrong:** `HivemindConfigsSchema` uses `.strip()` at line 303. In Zod v4.4.3, `.strip()` is deprecated because stripping unknown keys is the DEFAULT behavior of `z.object()`. The call is harmless (no-op) but will generate deprecation warnings in future Zod versions.
**How to avoid:** Remove `.strip()` call from `HivemindConfigsSchema`. The schema already strips by default. This is a cleanup item, not a blocker.

### Pitfall 2: `readConfigs()` Silent Default Swallowing
**What goes wrong:** `readConfigs()` returns `getDefaultConfigs()` if the file is missing, corrupt, or fails schema validation. Adding governance fields that default to `{rules: []}` means there's no way to distinguish "not configured" from "configured with no rules."
**How to avoid:** Use `validateConfigsFile()` (strict variant, line 407) for diagnostics. Runtime behavior should treat empty rules as intentional (no governance = no restrictions).

### Pitfall 3: Two Config Files, Two Error Strategies
**What goes wrong:** `readConfigs()` silently returns defaults on error. `readGovernanceConfig()` THROWS on error. After migration, the facade must preserve the throwing behavior for consumers that depend on it (e.g., `create-governance-session.ts`).
**How to avoid:** The facade `readGovernanceConfig()` should validate that `configs.governance` has required fields and throw if missing, preserving existing consumer contracts.

### Pitfall 4: Schema Extension Must Be Additive
**What goes wrong:** Adding required fields to `GovernanceConfigsSchema` would break existing `configs.json` files that lack the `governance` field entirely.
**How to avoid:** All new fields must be optional with defaults. The existing `.default({ rules: [] })` pattern on `GovernanceConfigsSchema` is the template.

### Pitfall 5: Session Depth Tracking — SDK vs Internal Mismatch
**What goes wrong:** OpenCode SDK `parentID` chain may not always be available (e.g., cross-process sessions, SDK version differences). `getDelegationMeta(sessionID).depth` is the internal fallback but may not track sessions created outside the harness.
**How to avoid:** Dual-source with cross-validation (locked in CONTEXT.md Decision 3). Log warning when sources mismatch. Never block governance on depth tracking failure alone.

## Code Examples

### Example 1: Extended GovernanceConfigsSchema [VERIFIED: from hivemind-configs.schema.ts:279-281]

```typescript
// CURRENT (line 279-281):
export const GovernanceConfigsSchema = z.object({
  rules: z.array(GovernanceRuleSchema).default([]),
})

// TARGET (extended):
export const GovernanceConfigsSchema = z.object({
  rules: z.array(GovernanceRuleSchema).default([]),
  naming_standards: NamingStandardsSchema.optional(),
  agent_configs: z.record(z.string(), AgentConfigSchema).optional(),
  command_agent_mappings: z.record(z.string(), CommandConfigSchema).optional(),
  templates: z.record(z.string(), TemplateConfigSchema).optional(),
})
```

### Example 2: Extended HivemindConfigsSchema [VERIFIED: from hivemind-configs.schema.ts:283-303]

```typescript
// CURRENT (line 283-303):
export const HivemindConfigsSchema = z
  .object({
    // ... existing fields ...
    governance: GovernanceConfigsSchema.default({ rules: [] }),
  })
  .strip()

// TARGET (extended — remove .strip(), add behavioral override fields):
export const HivemindConfigsSchema = z
  .object({
    // ... existing fields ...
    governance: GovernanceConfigsSchema.default({ rules: [] }),
    guardrail_level: GuardrailLevelSchema.optional(),
    delegation_mode: DelegationModeSchema.optional(),
    tool_access_pattern: ToolAccessPatternSchema.optional(),
    skill_filter: SkillFilterSchema.optional(),
  })
  // .strip() removed — Zod v4 strips by default
```

### Example 3: evaluateGovernance() with depth condition [VERIFIED: from evaluator.ts:21-106]

```typescript
// CURRENT: matches by toolNames and/or sessionIDs only
// TARGET: also matches by delegation depth

// In the rule matching loop, add:
if (rule.condition.depth) {
  criteriaChecked++
  const delegation = getDelegationMeta(sessionID)
  const currentDepth = delegation?.depth ?? 0
  const minDepth = rule.condition.depth.min ?? 0
  const maxDepth = rule.condition.depth.max ?? Infinity
  if (currentDepth >= minDepth && currentDepth <= maxDepth) {
    depthMatched = true
  }
}
```

### Example 4: 5 Default Governance Rules

```json
{
  "governance": {
    "rules": [
      {
        "id": "gov-delegate-task-subagent-only",
        "condition": { "toolNames": ["delegate-task"], "depth": { "max": 0 } },
        "action": { "type": "block" },
        "enabled": true
      },
      {
        "id": "gov-write-depth-warn",
        "condition": { "toolNames": ["write", "edit"], "depth": { "min": 2 } },
        "action": { "type": "warn" },
        "enabled": true
      },
      {
        "id": "gov-delegate-task-depth-block",
        "condition": { "toolNames": ["delegate-task"], "depth": { "min": 3 } },
        "action": { "type": "block" },
        "enabled": true
      },
      {
        "id": "gov-create-session-naming-warn",
        "condition": { "toolNames": ["create-governance-session"] },
        "action": { "type": "warn" },
        "enabled": true
      },
      {
        "id": "gov-unsafe-tools-escalate",
        "condition": { "toolNames": ["bash"], "depth": { "min": 1 } },
        "action": { "type": "escalate", "escalation": { "reason": "bash in child session" } },
        "enabled": true
      }
    ]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two separate governance configs | **SR-05 TARGET:** Single unified config | This phase | Eliminates config fragmentation |
| Static behavioral profile lookup | **SR-05 TARGET:** Config-first merge with static fallback | This phase | Per-project guardrail customization |
| Empty governance rules | **SR-05 TARGET:** 5 concrete rules | This phase | Runtime tool governance enforcement |
| `readGovernanceConfig()` reads separate file | **SR-05 TARGET:** Facade over `readConfigs().governance` | This phase | Single config source, backward compatible |
| No naming validation enforcement | **SR-05 TARGET:** `create-governance-session` validates titles | This phase | Runtime naming standard enforcement |

## Assumptions Log

| # | Claim | Section | Risk if Wrong | Source |
|---|-------|---------|---------------|--------|
| 1 | `HivemindConfigsSchema` uses `.strip()` — additive schema changes are backward compatible | Schema Extension | MEDIUM — `.strip()` is deprecated in Zod v4 but still functional; removing it is safe since Zod v4 strips by default | [VERIFIED: Zod v4 changelog] |
| 2 | Existing consumers of `readGovernanceConfig()` work unchanged with facade pattern | Migration | LOW — facade preserves function signature and return type; only internal implementation changes | [VERIFIED: config-reader.ts:103-135] |
| 3 | OpenCode SDK provides `parentID` chain for session hierarchy | Depth Tracking | HIGH — if SDK doesn't provide parentID, depth-based rules cannot fire; fallback to `getDelegationMeta()` covers most cases | [ASSUMED: needs runtime validation] |
| 4 | `getDelegationMeta()` is available in all hook contexts | Depth Tracking | LOW — verified in `tool-guard-hooks.ts:69` and `state.ts:12` | [VERIFIED: source code] |
| 5 | `GovernanceConfigsSchema.default({ rules: [] })` allows empty governance field | Backward Compatibility | LOW — already tested in production; configs.json currently has no governance field | [VERIFIED: configs.json] |
| 6 | `evaluateGovernance()` signature `(toolName, sessionID, rules)` remains unchanged | API Stability | LOW — SPEC REQ-02 explicitly states this constraint | [VERIFIED: SR-05-SPEC.md] |
| 7 | Zod v4 `.catchall(z.unknown())` still works for forward-compatible rule conditions | Schema | LOW — Zod v4 supports `.catchall()` | [VERIFIED: Context7 Zod v4 docs] |

## Open Questions

1. **SDK parentID chain availability:** Does `@opencode-ai/plugin` v1.15.13 expose `parentID` on session objects? Must validate at runtime — if not available, depth tracking falls back to `getDelegationMeta()` only.

2. **Governance rule depth matching — SDK vs internal source of truth:** When SDK parentID and `getDelegationMeta().depth` disagree, which wins? CONTEXT.md Decision 3 says SDK is primary, but the cross-validation warning mechanism needs implementation.

3. **Naming validation soft enforcement:** CONTEXT.md Decision 6 says "Warning (soft enforce) for 1 phase." Does this mean the governance rule fires as `warn` type (not `block`)? Confirm that `create-governance-session` logs a warning but does NOT reject the session.

4. **`HIVEMIND_GOVERNANCE_CONFIG_PATH` removal:** SPEC says "Remove env var override." Is there any CI/CD or test infrastructure that depends on this env var? Grep shows it's only used in `config-reader.ts:84` — safe to remove.

5. **Existing test coverage for governance evaluator:** `governance-evaluator.test.ts` covers block/warn/escalate/sessionID matching. Missing: depth-based matching tests, integration test with `tool-guard-hooks.ts`, and test proving empty rules correctly skips governance.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | >= 20.0.0 | — |
| npm | Dependencies | ✓ | Latest | — |
| Zod | Schema validation | ✓ | 4.4.3 | — |
| @opencode-ai/plugin | Hook system | ✓ (peer dep) | 1.15.13 | — |
| @opencode-ai/sdk | Session API | ✓ | 1.15.13 | — |
| TypeScript | Type checking | ✓ | 5.9.3 | — |
| Vitest | Testing | ✓ | 4.1.7 | — |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run tests/hooks/governance-evaluator.test.ts tests/hooks/governance-block.test.ts tests/schema-kernel/hivemind-configs.schema.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Unified governance config in configs.json | Unit | `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` | YES |
| REQ-02 | evaluateGovernance() with depth-based rules | Unit + Integration | `npx vitest run tests/hooks/governance-evaluator.test.ts` | YES (needs extension) |
| REQ-03 | Config-driven behavioral profile overrides | Unit | `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` | YES (needs extension) |
| REQ-04 | readGovernanceConfig() facade | Unit | `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` | YES (needs extension) |
| REQ-05 | Naming validation enforcement | Unit | `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` | YES (needs extension) |
| AC-02 | Block rule fires on tool.execute.before | Integration | `npx vitest run tests/hooks/governance-block.test.ts` | YES |
| AC-05 | Config-defined behavioral profile values | Unit | `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` | YES (needs extension) |
| AC-07 | Naming validation rejects invalid titles | Unit | `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` | YES (needs extension) |

### Wave 0 Gaps

- [ ] No tests for `evaluateGovernance()` with `depth` condition field (new feature)
- [ ] No integration test proving governance branch executes in `tool-guard-hooks.ts` when rules are populated
- [ ] No test for `readGovernanceConfig()` facade pattern (reading from unified config)
- [ ] No test for config-driven behavioral profile override (4 new config fields)
- [ ] No test for naming validation in `create-governance-session` (soft enforcement)
- [ ] No test for startup deprecation warning when old config file exists

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | NO | No auth changes in SR-05 |
| V3 Session Management | Partial | Session depth tracking enables depth-based governance rules |
| V4 Access Control | YES | Governance rules enforce tool access control at runtime |
| V5 Input Validation | YES | Zod schema validation on config files; naming title validation |
| V6 Cryptography | NO | No crypto changes |

### Known Threat Patterns

| Pattern | STRIDE | Severity | Standard Mitigation |
|---------|--------|----------|---------------------|
| **T1: Governance rule injection via configs.json** | Tampering | HIGH | Zod schema validation + `.strip()` removes unknown fields; only schema-defined fields pass through |
| **T2: Tool execution without governance (current state)** | Elevation | HIGH | SR-05 populates rules; `evaluateGovernance()` fires on every `tool.execute.before` |
| **T3: Config file corruption → silent fallback** | Tampering | MEDIUM | `readConfigs()` silently returns defaults; `validateConfigsFile()` provides strict checking for diagnostics |
| **T4: Governance rules bypass via hook removal** | Elevation | MEDIUM | Hook is registered in plugin.ts composition root; removal requires source code change (detectable via git) |
| **T5: Session depth spoofing** | Spoofing | MEDIUM | Dual-source tracking (SDK parentID + getDelegationMeta) with cross-validation warning |
| **T6: Naming standard bypass** | Elevation | LOW | Soft enforcement (warn) for 1 phase; graduates to block in follow-up |
| **T7: Old config file read after migration** | Tampering | LOW | Startup deprecation warning; `readGovernanceConfig()` facade reads from unified source; old file archived |

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|----|------|----------|------------|------------|-------|
| R-01 | SDK parentID chain not available for depth tracking | HIGH | LOW | Fallback to `getDelegationMeta()`; log warning on mismatch | Implementer |
| R-02 | Deleting old config breaks direct consumers | MEDIUM | LOW | Grep for `governance/config.json` consumers; facade preserves API | Implementer |
| R-03 | Zod v4 `.strip()` removal causes unexpected field passthrough | LOW | VERY LOW | Zod v4 strips by default; test with extra fields in configs.json | Implementer |
| R-04 | Depth-based rules fire incorrectly due to SDK/internal mismatch | MEDIUM | MEDIUM | Cross-validation with warning; never block on depth alone until validated | Implementer |
| R-05 | Existing tests break after schema extension | LOW | LOW | All new fields are optional with defaults; existing configs.json passes validation | Implementer |
| R-06 | `hivemind init --yes` generates invalid config with new governance fields | MEDIUM | LOW | Test `HivemindConfigsSchema.parse()` with generated config | Implementer |
| R-07 | Naming validation soft enforcement confused with hard enforcement | LOW | MEDIUM | Document clearly in governance rule; warn type (not block) | Implementer |

## Evidence Registry

### Source Files Read

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/schema-kernel/hivemind-configs.schema.ts` | 464 | Master schema for configs.json | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:266-277` | 12 | `GovernanceRuleSchema` definition | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:279-281` | 3 | `GovernanceConfigsSchema` with `{rules: []}` default | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:283-303` | 21 | `HivemindConfigsSchema` — governance field with default + `.strip()` | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:359-385` | 27 | `readConfigs()` — reads configs.json from disk with silent fallback | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:407-431` | 25 | `validateConfigsFile()` — strict variant for diagnostics | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:457-463` | 7 | `writeConfigs()` — validates and writes | [VERIFIED: file read] |
| `src/features/governance-engine/evaluator.ts` | 106 | `evaluateGovernance()` — rule evaluation engine | [VERIFIED: file read] |
| `src/features/governance-engine/config-reader.ts` | 203 | `readGovernanceConfig()`, `resolveAgentForBrief()`, `validateNamingTitle()` | [VERIFIED: file read] |
| `src/features/governance-engine/create-governance-session.ts` | 252 | Governance session tool factory | [VERIFIED: file read] |
| `src/hooks/guards/tool-guard-hooks.ts` | 296 | Tool guard hooks with governance wire at line 158 | [VERIFIED: file read] |
| `src/routing/behavioral-profile/resolve-behavioral-profile.ts` | 86 | `resolveBehavioralProfile()` — config-to-profile merge | [VERIFIED: file read] |
| `src/routing/behavioral-profile/profiles.ts` | 45 | Static `BehavioralProfiles` lookup table | [VERIFIED: file read] |
| `src/routing/behavioral-profile/types.ts` | 100 | `BehavioralProfile`, `ResolvedBehavioralProfile`, `BehavioralOverrides` | [VERIFIED: file read] |
| `src/shared/types.ts:334-360` | 27 | `GovernanceRule`, `GovernanceViolation`, `GovernancePersistenceState` | [VERIFIED: file read] |
| `src/shared/state.ts` | 251 | `TaskStateManager` with `getDelegationMeta()` | [VERIFIED: file read] |
| `src/plugin.ts:758` | 1 | `createToolGuardHooks` wiring with `hivemindConfig` | [VERIFIED: file read] |
| `.hivemind/configs.json` | 30 | Current config — NO governance field | [VERIFIED: file read] |
| `.hivemind/governance/config.json` | 67 | Separate governance config — naming, agents, commands | [VERIFIED: file read] |

### Test Files

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `tests/hooks/governance-evaluator.test.ts` | 148 | Evaluator unit tests (block/warn/escalate/sessionID) | [VERIFIED: file read] |
| `tests/hooks/governance-block.test.ts` | 175 | Governance block format tests | [VERIFIED: file read] |
| `tests/features/governance-engine/create-governance-session.test.ts` | — | Governance session tool tests | [VERIFIED: file exists] |
| `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` | — | Behavioral profile resolution tests | [VERIFIED: file exists] |

### Planning Artifacts

| File | Purpose | Evidence |
|------|---------|----------|
| `SR-05-SPEC.md` | Locked requirements (5 REQs, 10 ACs) | [VERIFIED: file read, 131 lines] |
| `SR-05-CONTEXT.md` | Design decisions (6 locked), governance rules, assumptions | [VERIFIED: file read, 74 lines] |
| `.planning/research/config-governance-forensic-research-2026-06-04.md` | Deep forensic research (570 lines) | [VERIFIED: file read, 570 lines] |

---

*Phase: SR-05-config-governance-cluster-unification*
*Research completed: 2026-06-04*
*Next step: /hm-plan-phase SR-05 — task decomposition and execution plan*
