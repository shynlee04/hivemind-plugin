# Phase SR-11: Config Ecosystem Complete — Context & Decisions

**Created:** 2026-06-04
**Phase:** SR-11-config-ecosystem-complete
**Spec:** SR-11-SPEC.md (4 requirements, ambiguity 0.12)

---

## 1. Gray Area Resolution

### 1.1 tool_registry Schema Design

**Decision: Flat record keyed by tool name (not categorized).**

**Rationale:**
- Existing governance schema uses flat records: `agent_configs` is `z.record(z.string(), AgentConfigSchema)`, `command_agent_mappings` is `z.record(z.string(), CommandConfigSchema)`. Consistency with established patterns.
- Category is a metadata field ON each tool entry, not a structural grouping. Runtime lookup by tool name (`tool_registry["delegate-task"]`) is O(1) with a record; O(n) with a flat array.
- The governance evaluator (`src/features/governance-engine/evaluator.ts:62-64`) matches `rule.condition.toolNames` against tool name strings. A record keyed by name makes schema ↔ evaluator integration trivial.

**Schema shape:**
```typescript
export const ToolRegistryEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(["delegation", "session", "hivemind", "config", "prompt", "tmux"]),
  default_permission: z.enum(["allow", "ask", "deny"]),
  requires_governance: z.boolean().default(false),
})

// In GovernanceConfigsSchema:
tool_registry: z.record(z.string(), ToolRegistryEntrySchema).optional(),
```

**Why `z.record` not `z.array`:**
- Record lookup by name is native Zod — `schema.shape.tool_registry` gives direct key access
- Array would require `.find(t => t.name === x)` everywhere
- Matches existing `agent_configs` and `command_agent_mappings` patterns exactly

**Why `requires_governance` defaults to `false`:**
- Most tools are passive (read-only, status queries). Only delegation/write tools need governance evaluation.
- Explicit opt-in is safer than opt-out — false positives (missing governance) are easier to detect than false positives (unnecessary governance blocking).

**Alternatives rejected:**
- **Categorized nested record** (`{ delegation: {...}, session: {...} }`): Adds structural complexity. Category changes require schema migration. Flat record + category field achieves same discoverability without structural coupling.
- **Array with `.name` as identifier**: Breaks consistency with existing record-based governance fields. Array iteration for lookup is wasteful when name is the natural key.

---

### 1.2 Default Content Source

**Decision: Option A — Hardcoded in `getDefaultConfigs()`.**

**Rationale:**
- `getDefaultConfigs()` currently returns `HivemindConfigsSchema.parse({})` (line 395-397). It's the single source of truth for missing/empty/invalid config scenarios (`readConfigs()` lines 433-434, 450-454).
- Hardcoding is deterministic — no filesystem scan, no build step, no runtime surprises. Tests can assert exact values.
- SR-05 already populated `agent_configs` (42 agents) and `command_agent_mappings` (100+ commands) in the live `configs.json`. These values are known, stable, and source-backed. Encoding them as constants in the schema file (or a companion `defaults.ts`) is straightforward.
- Build-time generation (Option B) adds a build step dependency. If `scripts/sync-assets.js` fails or `assets/` is incomplete, defaults break silently.
- Runtime scanning (Option C) makes `getDefaultConfigs()` non-deterministic — different codebases produce different defaults. Breaks the contract that "defaults = known-good baseline."

**Implementation pattern:**
```typescript
// src/schema-kernel/hivemind-configs.defaults.ts (new file)
export const DEFAULT_GOVERNANCE_RULES: GovernanceRule[] = [/* 5+ rules from SR-05 */]
export const DEFAULT_AGENT_CONFIGS: Record<string, AgentConfig> = [/* 42 agents */]
export const DEFAULT_COMMAND_AGENT_MAPPINGS: Record<string, CommandConfig> = [/* 100+ commands */]
export const DEFAULT_TOOL_REGISTRY: Record<string, ToolRegistryEntry> = [/* 26+ tools */]
export const DEFAULT_NAMING_STANDARDS: NamingStandards = {/* ... */}
export const DEFAULT_TEMPLATES: Record<string, TemplateConfig> = {/* ... */}

// src/schema-kernel/hivemind-configs.schema.ts (updated)
export function getDefaultConfigs(): HivemindConfigs {
  return HivemindConfigsSchema.parse({
    governance: {
      rules: DEFAULT_GOVERNANCE_RULES,
      agent_configs: DEFAULT_AGENT_CONFIGS,
      command_agent_mappings: DEFAULT_COMMAND_AGENT_MAPPINGS,
      tool_registry: DEFAULT_TOOL_REGISTRY,
      naming_standards: DEFAULT_NAMING_STANDARDS,
      templates: DEFAULT_TEMPLATES,
    },
  })
}
```

**Why a separate `defaults.ts` file:**
- `hivemind-configs.schema.ts` is already 535 LOC. Adding 200+ lines of default data pushes past the 500 LOC guideline.
- Separation of schema (structure) from defaults (content) is cleaner.
- `defaults.ts` is a leaf module — no circular dependency risk.

**Alternatives rejected:**
- **Option B (build-time generation)**: Adds `scripts/sync-assets.js` dependency to the schema layer. If assets are incomplete, defaults break. Build-time code generation is harder to test.
- **Option C (runtime scanning)**: Non-deterministic. `getDefaultConfigs()` must return identical output regardless of filesystem state. Runtime scanning violates this contract.

---

### 1.3 Skill Structure for Conversational Config

**Decision: New skill `hm-l2-governance-config` (not extending `hm-config`).**

**Rationale:**
- `hm-config` is a **command** (`.opencode/commands/hm-config.md`), not a skill. It routes to workflow files for interactive toggle configuration. It does not handle governance rule creation.
- Governance config is a fundamentally different domain: schema-aware JSON generation, rule validation, concept explanation. The existing `hm-config` command's routing model (flag → workflow) doesn't fit.
- Hivemind naming conventions: `hm-l2-*` skills are domain-specific instruction sets. `hm-l2-governance-config` fits the pattern alongside `hm-l2-brainstorm`, `hm-l2-debug`, etc.
- The skill needs to reference `GovernanceRuleSchema`, `ToolRegistryEntrySchema`, and governance concepts. Embedding this in the existing command would bloat it.

**Skill scope:**
```
Trigger phrases:
- "how do I block bash for child sessions"
- "configure governance rules"
- "set tool permissions"
- "what tools are available"
- "create a governance rule"
- "governance config help"

Capabilities:
1. Explain governance concepts (rules, conditions, actions, agent_configs, tool_registry)
2. Guide users through common scenarios with step-by-step JSON generation
3. Validate user-provided rule snippets against GovernanceRuleSchema
4. List available tools from tool_registry
5. Generate complete governance section for configs.json
```

**Alternatives rejected:**
- **Extend `hm-config` command**: Mixing command routing with skill-based guidance creates a confused interface. Commands are imperative ("do this"); skills are instructional ("here's how"). Different interaction models.
- **New command `hm-governance-config`**: Commands are dispatch-oriented. Governance config requires interactive Q&A, explanation, and JSON generation — skill territory.

---

### 1.4 bootstrap-init Integration

**Decision: `bootstrap-init` generates full config from `getDefaultConfigs()`. Only adds missing fields to existing configs (non-destructive merge).**

**Rationale:**
- `bootstrap-init` is BOOT-02 — initial project setup. Its contract is "ensure all required surfaces exist."
- User customizations must survive re-init. If a user has customized `agent_configs` for 5 agents, re-init must NOT overwrite those 5 entries.
- `getDefaultConfigs()` returns the complete baseline. `bootstrap-init` should write this baseline ONLY when `configs.json` does not exist. When it exists, `bootstrap-init` should merge missing top-level fields but leave existing values untouched.

**Merge strategy:**
```
if configs.json does NOT exist:
  write getDefaultConfigs() → configs.json (full write)
else:
  read existing configs.json
  for each top-level field in getDefaultConfigs():
    if field is missing in existing:
      add field from defaults
    else:
      keep existing value
  write merged result → configs.json
```

**Why top-level merge, not deep merge:**
- Deep merging governance subfields (e.g., per-tool, per-agent) is ambiguous: should a missing tool entry be added? What if the user intentionally removed it?
- Top-level merge is predictable: if `governance` key exists, keep it entirely. If missing, add the full default governance block.
- This matches the existing `readConfigs()` behavior: missing file → full defaults; present file → parse and validate.

**Alternatives rejected:**
- **Full regeneration always**: Destroys user customizations. Unacceptable for a tool that may be re-run during troubleshooting.
- **Deep merge at field level**: Too complex. Merging `agent_configs` (42 entries) with user's partial list requires conflict resolution logic that doesn't exist. Top-level merge is safe and predictable.
- **No merge (only write if missing)**: Too conservative. If user deletes the `governance` key, re-init should restore it.

---

## 2. Assumptions

| # | Assumption | Risk | Validation |
|---|-----------|------|------------|
| A1 | SR-05 governance rules, agent_configs, and command_agent_mappings are stable and correct | LOW | Source: live `.hivemind/configs.json` — verified by SR-05 acceptance |
| A2 | All 26+ custom tools are discoverable from source code | LOW | Source: grep for tool registrations in `src/tools/` |
| A3 | `GovernanceConfigsSchema` extension is backward compatible (optional field) | LOW | Zod `.optional()` on new fields — existing configs without `tool_registry` parse successfully |
| A4 | The 6 tool categories (delegation, session, hivemind, config, prompt, tmux) cover all current tools | MEDIUM | Needs verification against full tool list — if a 7th category emerges, schema needs update |
| A5 | `bootstrap-init` has access to `getDefaultConfigs()` at runtime | LOW | Both are in the same package — import is trivial |
| A6 | Skill file goes in `.opencode/skills/hm-l2-governance-config/SKILL.md` | LOW | Follows `hm-l2-*` naming convention established by 15+ existing skills |
| A7 | No new governance enforcement logic needed — tool_registry is metadata-only | LOW | SPEC explicitly states "registry is metadata-only for this phase" |

---

## 3. Decision Log

| # | Decision | Context | Locked | Deferred |
|---|---------|---------|--------|----------|
| D1 | tool_registry is `z.record` keyed by tool name | Schema design | ✓ | — |
| D2 | Default content hardcoded in `getDefaultConfigs()` via `defaults.ts` | Content source | ✓ | — |
| D3 | New skill `hm-l2-governance-config` | Skill structure | ✓ | — |
| D4 | `bootstrap-init` does non-destructive top-level merge | Init behavior | ✓ | — |
| D5 | tool_registry category enum: 6 values | Categorization | ✓ | — |
| D6 | `requires_governance` defaults to `false` | Safety default | ✓ | — |
| D7 | Separate `defaults.ts` file for default constants | Code organization | ✓ | — |
| D8 | Skill triggers on "governance", "tool registry", "block bash", "set permissions" | UX routing | ✓ | Deferred: full trigger list during skill authoring |
| D9 | REFERENCE.md covers all HivemindConfigsSchema fields | Documentation scope | ✓ | — |
| D10 | No runtime tool scanning — tool list is static in defaults | Architecture | ✓ | Dynamic scanning deferred to future phase |

---

## 4. Remaining Unknowns

| # | Unknown | Impact | Resolution Path |
|---|---------|--------|-----------------|
| U1 | Exact list of 26+ tool descriptions and categories | MEDIUM | Grep `src/tools/` for tool names, cross-reference with `.opencode/` tool definitions |
| U2 | Which 5+ governance rules to include in defaults | LOW | Extract from live `.hivemind/configs.json` (SR-05 populated) |
| U3 | Whether `hm-l2-governance-config` needs JSDoc skill reference | LOW | Follow existing `hm-l2-*` skill structure — check during authoring |
| U4 | Whether `bootstrap-init` needs a `--force` flag for full overwrite | LOW | Default: non-destructive merge. Force flag can be added in future phase if needed |

---

## 5. Implementation Boundaries

### Allowed surfaces
- `src/schema-kernel/hivemind-configs.schema.ts` — add `ToolRegistryEntrySchema`, extend `GovernanceConfigsSchema`
- `src/schema-kernel/hivemind-configs.defaults.ts` — new file for default constants
- `src/features/bootstrap-init/` — update to generate full config
- `.opencode/skills/hm-l2-governance-config/SKILL.md` — new skill
- `.planning/phases/SR-11-*/SR-11-REFERENCE.md` — default behavior documentation
- `tests/schema-kernel/` — new tests for tool_registry, defaults, bootstrap-init

### Forbidden surfaces
- `src/features/governance-engine/evaluator.ts` — no changes (metadata-only)
- `src/shared/types.ts` — no changes (existing GovernanceRule type sufficient)
- `src/config/subscriber.ts` — no changes (already calls `getDefaultConfigs()`)
- Existing governance rules content — SR-05 already populated

---

## 6. Verification Commands

```bash
npm run typecheck          # Schema changes compile
npm test                   # All tests pass (existing + new)
grep -c "tool_registry" src/schema-kernel/hivemind-configs.schema.ts  # Schema has tool_registry
grep -c "ToolRegistryEntry" src/schema-kernel/hivemind-configs.schema.ts  # Entry schema exists
ls .opencode/skills/hm-l2-governance-config/SKILL.md  # Skill exists
```

---

*Context locked: 2026-06-04*
*Next: PLAN.md via /hm-plan-phase SR-11*
