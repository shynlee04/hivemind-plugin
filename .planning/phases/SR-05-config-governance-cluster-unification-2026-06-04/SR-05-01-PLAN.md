---
phase: SR-05
plan: 01
type: auto
wave: 1
depends_on: []
files_modified:
  - src/schema-kernel/hivemind-configs.schema.ts
  - .hivemind/configs.json
autonomous: true
requirements:
  - REQ-01
  - REQ-04
  - REQ-06
---

<objective>
Extend the Zod schema for `GovernanceConfigsSchema` and `HivemindConfigsSchema` to support the unified governance surface, then migrate all fields from `.hivemind/governance/config.json` into `.hivemind/configs.json` under the `governance` namespace.

Purpose: Establish the schema foundation that all subsequent plans (governance rules, behavioral profile, naming validation) build on.
Output: Extended schema with backward-compatible optional fields + migrated configs.json with populated governance data.
</objective>

<context>
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-CONTEXT.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-RESEARCH.md
@.hivemind/configs.json
@.hivemind/governance/config.json
</context>

<tasks>
  <task id="01" type="auto">
    <name>Extend GovernanceConfigsSchema with new fields</name>
    <files>
      <modified>src/schema-kernel/hivemind-configs.schema.ts</modified>
    </files>
    <read_first>
      - src/schema-kernel/hivemind-configs.schema.ts (full file — current schema definitions at lines 266-303)
      - .hivemind/governance/config.json (source data to understand field shapes)
      - SR-05-RESEARCH.md Example 1 (target schema shape)
    </read_first>
    <action>
Add 4 new optional fields to `GovernanceConfigsSchema` at `src/schema-kernel/hivemind-configs.schema.ts`:

1. Define `NamingStandardsSchema` as `z.object()` with fields:
   - `allowed_frameworks`: `z.array(z.string()).optional()`
   - `allowed_classifications`: `z.array(z.string()).optional()`
   - `naming_format`: `z.string().optional()`
   - `max_title_length`: `z.number().optional()`

2. Define `AgentConfigSchema` as `z.object()` with fields:
   - `description`: `z.string().optional()`
   - `allowedCommands`: `z.array(z.string()).optional()`
   - `tools`: `z.array(z.string()).optional()`
   - `temperature`: `z.number().optional()`

3. Define `CommandConfigSchema` as `z.object()` with fields:
   - `agent`: `z.string().optional()`
   - `workflow`: `z.string().optional()`
   - `description`: `z.string().optional()`

4. Define `TemplateConfigSchema` as `z.object()` with fields:
   - `description`: `z.string().optional()`
   - `content`: `z.string().optional()`

5. Add to `GovernanceConfigsSchema` (currently at line 279-281):
   - `naming_standards`: `NamingStandardsSchema.optional()`
   - `agent_configs`: `z.record(z.string(), AgentConfigSchema).optional()`
   - `command_agent_mappings`: `z.record(z.string(), CommandConfigSchema).optional()`
   - `templates`: `z.record(z.string(), TemplateConfigSchema).optional()`

6. Remove `.strip()` call from `HivemindConfigsSchema` (line 303) — Zod v4 strips by default; `.strip()` is deprecated.

7. Add 4 optional behavioral override fields to `HivemindConfigsSchema`:
   - `guardrail_level`: `z.enum(["strict", "moderate", "permissive"]).optional()`
   - `delegation_mode`: `z.enum(["waiter", "direct", "autonomous"]).optional()`
   - `tool_access_pattern`: `z.enum(["restricted", "standard", "full"]).optional()`
   - `skill_filter`: `z.enum(["curated", "domain", "full"]).optional()`

All new fields are optional with no defaults (except where existing `.default()` patterns apply). This ensures backward compatibility — existing configs.json files without these fields continue to parse.
    </action>
    <verify>
      - `npx tsc --noEmit` exits 0 (typecheck clean)
      - `grep -c "NamingStandardsSchema" src/schema-kernel/hivemind-configs.schema.ts` returns >= 1
      - `grep -c "guardrail_level" src/schema-kernel/hivemind-configs.schema.ts` returns >= 1
      - `grep -c "\.strip()" src/schema-kernel/hivemind-configs.schema.ts` returns 0 (removed)
      - Existing `.hivemind/configs.json` still parses: `node -e "require('./src/schema-kernel/hivemind-configs.schema.ts')"` does not throw (or equivalent test)
    </verify>
    <done>
Schema extended with all governance + behavioral override fields. Typecheck clean. Backward compatible — existing configs.json parses without error.
    </done>
    <acceptance_criteria>
      - `src/schema-kernel/hivemind-configs.schema.ts` contains `NamingStandardsSchema` definition
      - `src/schema-kernel/hivemind-configs.schema.ts` contains `AgentConfigSchema` definition
      - `src/schema-kernel/hivemind-configs.schema.ts` contains `CommandConfigSchema` definition
      - `src/schema-kernel/hivemind-configs.schema.ts` contains `TemplateConfigSchema` definition
      - `GovernanceConfigsSchema` includes `naming_standards`, `agent_configs`, `command_agent_mappings`, `templates` fields
      - `HivemindConfigsSchema` includes `guardrail_level`, `delegation_mode`, `tool_access_pattern`, `skill_filter` fields
      - `HivemindConfigsSchema` does NOT contain `.strip()` call
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="02" type="auto">
    <name>Populate configs.json.governance with full agent/command registry</name>
    <files>
      <modified>.hivemind/configs.json</modified>
    </files>
    <read_first>
      - .hivemind/governance/config.json (source — existing naming_standards, templates)
      - .hivemind/configs.json (target — current structure)
      - src/schema-kernel/hivemind-configs.schema.ts (extended schema from Task 01)
      - SR-05-RESEARCH.md Registry Gap Analysis section (discovery strategy)
    </read_first>
    <action>
Populate `.hivemind/configs.json.governance` with ALL shipped agents and commands (REQ-06):

1. **Discover all agents** — glob `assets/agents/{hm,hf}-*.md` to find all 42 shipped agent definition files. Extract agent name from filename (e.g., `hm-architect.md` → `hm-architect`).

2. **Build agent_configs** — for each discovered agent file:
   - Read the YAML frontmatter to extract `description` field
   - Read the agent instruction profile to determine `allowedCommands` (tools/commands the agent is permitted to use)
   - If frontmatter lacks description, use a sensible default: `"{agent-name} specialist agent"`
   - If allowedCommands cannot be determined from frontmatter, set to `[]` (empty — no restrictions)
   - Result: `agent_configs["hm-architect"] = { description: "...", allowedCommands: [...] }`

3. **Discover all commands** — glob `assets/commands/{hm,hf}-*.md` and `assets/command/{hm,hf}-*.md` to find all shipped command definition files. Extract command name from filename.

4. **Build command_agent_mappings** — for each discovered command file:
   - Read YAML frontmatter to extract `description` and `agent` field (the agent that executes this command)
   - If `agent` field missing from frontmatter, set to `null` (unmapped)
   - Result: `command_agent_mappings["plan"] = { description: "Create phase plans", agent: "hm-planner" }`

5. **Merge with existing governance/config.json data** — the existing 7 agent configs and 4 command mappings from governance/config.json take precedence over auto-discovered data (they may have hand-tuned descriptions). Merge by key: existing entries override auto-discovered entries.

6. **Migrate naming_standards and templates** — copy these directly from governance/config.json (unchanged from original plan).

7. **Exclude gsd-* entries** — do NOT include any gsd-* agents or commands in the shipped registry (they are developer tooling, not shipped primitives).

8. **Write to configs.json** under the `governance` key:
   ```json
   {
     "governance": {
       "rules": [],
       "naming_standards": { ... from governance/config.json ... },
       "agent_configs": { ... 42 entries from auto-discovery + merge ... },
       "command_agent_mappings": { ... 100+ entries from auto-discovery + merge ... },
       "templates": { ... from governance/config.json ... }
     }
   }
   ```

9. Keep the original `governance/config.json` file intact for now (Plan 05 handles removal).
    </action>
    <verify>
      - `.hivemind/configs.json` contains `governance.naming_standards` with data from governance/config.json
      - `.hivemind/configs.json` contains `governance.agent_configs` with >= 42 agent entries
      - `.hivemind/configs.json` contains `governance.command_agent_mappings` with >= 100 command entries
      - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.agent_configs).length)"` outputs >= 42
      - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.agent_configs).includes('hm-architect'))"` outputs `true`
      - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.agent_configs).includes('hf-meta-builder'))"` outputs `true`
      - No gsd-* entries: `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(Object.keys(c.governance.agent_configs).filter(k=>k.startsWith('gsd-')))"` outputs `[]`
    </verify>
    <done>
configs.json.governance populated with full registry: all 42 shipped agents with descriptions and allowedCommands, all shipped commands with agent mappings. Naming standards and templates migrated from governance/config.json. Original governance/config.json preserved for Plan 05 cleanup.
    </done>
    <acceptance_criteria>
      - `.hivemind/configs.json` has `governance` field with `rules`, `naming_standards`, `agent_configs`, `command_agent_mappings` keys
      - `governance.naming_standards` contains data migrated from `.hivemind/governance/config.json`
      - `governance.agent_configs` contains >= 42 entries (all hm-* and hf-* agents)
      - `governance.agent_configs` includes hm-architect, hm-executor, hm-planner, hf-meta-builder, hf-l0-orchestrator (spot check)
      - Each agent entry has `description` (non-empty string) and `allowedCommands` (array)
      - `governance.command_agent_mappings` contains >= 100 entries (all shipped non-gsd-* commands)
      - Each command entry has `description` (string) and `agent` (string or null)
      - No gsd-* entries in agent_configs or command_agent_mappings
      - `.hivemind/governance/config.json` still exists (not deleted yet — Plan 05 handles removal)
    </acceptance_criteria>
  </task>

  <task id="03" type="tdd">
    <name>Schema validation tests for extended governance fields</name>
    <files>
      <created>tests/schema-kernel/governance-config-schema.test.ts</created>
    </files>
    <read_first>
      - tests/schema-kernel/hivemind-configs.schema.test.ts (existing test patterns)
      - src/schema-kernel/hivemind-configs.schema.ts (extended schema from Task 01)
      - .hivemind/configs.json (migrated config from Task 02)
    </read_first>
    <action>
Create `tests/schema-kernel/governance-config-schema.test.ts` with TDD RED tests:

1. Test: `GovernanceConfigsSchema.parse()` accepts valid governance object with all new fields
2. Test: `GovernanceConfigsSchema.parse()` accepts governance object with only `rules` (backward compat)
3. Test: `GovernanceConfigsSchema.parse()` accepts empty governance object (defaults to `{rules: []}`)
4. Test: `HivemindConfigsSchema.parse()` accepts config with `guardrail_level: "strict"`
5. Test: `HivemindConfigsSchema.parse()` accepts config without behavioral override fields (backward compat)
6. Test: `HivemindConfigsSchema.parse()` rejects invalid `guardrail_level` value (not in enum)
7. Test: `HivemindConfigsSchema.parse()` with `.hivemind/configs.json` content (real file) passes validation
8. Test: `NamingStandardsSchema.parse()` accepts valid naming standards object
9. Test: `AgentConfigSchema.parse()` accepts valid agent config object
10. Test: `CommandConfigSchema.parse()` accepts valid command config object

Run tests — all must FAIL (RED) since implementation is in Task 01. Then after Task 01 completes, tests turn GREEN.
    </action>
    <verify>
      - `npx vitest run tests/schema-kernel/governance-config-schema.test.ts` exits 0 after Task 01 completes
      - All 10 tests pass
    </verify>
    <done>
TDD RED tests written for schema extension. Tests validate backward compatibility, new field acceptance, enum validation, and real file parsing.
    </done>
    <acceptance_criteria>
      - `tests/schema-kernel/governance-config-schema.test.ts` exists
      - File contains at least 10 test cases covering GovernanceConfigsSchema, HivemindConfigsSchema, NamingStandardsSchema, AgentConfigSchema, CommandConfigSchema
      - Tests include backward compatibility cases (empty governance, missing behavioral fields)
      - Tests include rejection cases (invalid enum values)
      - `npx vitest run tests/schema-kernel/governance-config-schema.test.ts` exits 0
    </acceptance_criteria>
  </task>
</tasks>

<verification>
1. `npx tsc --noEmit` — typecheck clean
2. `npx vitest run tests/schema-kernel/governance-config-schema.test.ts` — all tests pass
3. `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` — existing tests still pass (no regressions)
4. `.hivemind/configs.json` validates against extended schema
</verification>

<success_criteria>
- GovernanceConfigsSchema extended with naming_standards, agent_configs, command_agent_mappings, templates
- HivemindConfigsSchema extended with guardrail_level, delegation_mode, tool_access_pattern, skill_filter
- .strip() removed from HivemindConfigsSchema
- configs.json.governance populated with full registry: 42 agents, 100+ commands (REQ-06)
- Naming standards and templates migrated from governance/config.json
- 10+ schema validation tests pass
- Typecheck clean, no regressions
</success_criteria>

<must_haves>
  <truths>
    - "GovernanceConfigsSchema has 4 new optional fields (naming_standards, agent_configs, command_agent_mappings, templates)"
    - "HivemindConfigsSchema has 4 new optional behavioral override fields"
    - ".strip() removed from HivemindConfigsSchema — Zod v4 strips by default"
    - "configs.json.governance.agent_configs contains ALL 42 shipped agents (31 hm-* + 11 hf-*)"
    - "configs.json.governance.command_agent_mappings contains ALL shipped non-gsd-* commands (>= 100)"
    - "No gsd-* entries in shipped registry"
    - "All changes are backward compatible — existing configs.json files without new fields continue to parse"
  </truths>
  <artifacts>
    - src/schema-kernel/hivemind-configs.schema.ts (modified)
    - .hivemind/configs.json (modified)
    - tests/schema-kernel/governance-config-schema.test.ts (created)
  </artifacts>
</must_haves>
