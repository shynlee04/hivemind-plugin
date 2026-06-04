# SR-11-02-PLAN: Skill Creation

## Objective
Create a new skill `hm-l2-governance-config` that provides guidance on configuring Hivemind governance primitives (rules, agents, tools, naming standards) using the configuration system.

## Context
Phase SR-11 requires a conversational skill to guide users through governance configuration. This skill will be the primary interface for users to understand and modify their Hivemind configuration.

**Source References:**
- SPEC: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-SPEC.md`
- CONTEXT: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-CONTEXT.md`
- RESEARCH: `.planning/phases/SR-11-config-ecosystem-complete-2026-06-04/SR-11-RESEARCH.md`

## Tasks

### Task 1: Skill Scaffolding
**Type:** auto
**Files:** `assets/skills/hm-l2-governance-config/SKILL.md` (new)
**Action:**
1. Create directory `assets/skills/hm-l2-governance-config/`.
2. Create `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: hm-l2-governance-config
   description: Guide for configuring Hivemind governance primitives (rules, agents, tools, naming standards).
   triggers:
     - "configure governance"
     - "set up rules"
     - "add agent config"
     - "tool registry setup"
     - "naming standards"
   lineage: hm
   level: l2
   ---
   ```
3. Add markdown body with:
   - **Overview**: What the skill does.
   - **When to Use**: Trigger conditions.
   - **Workflow**: Step-by-step guide.
   - **Sections**: Rule Creation, Agent Config, Tool Registry, Naming Standards.

**Verify:**
- File exists at `assets/skills/hm-l2-governance-config/SKILL.md`.
- YAML frontmatter is valid.
- Content covers all required guides.

**Done:** Skill file created with correct structure.

### Task 2: Rule Creation Guide
**Type:** auto
**Files:** `assets/skills/hm-l2-governance-config/SKILL.md` (section)
**Action:**
1. In the SKILL.md, add a section `## Rule Creation Guide`.
2. Explain how to define rules in `configs.json` under `governance.rules`.
3. Provide examples of rule objects: `{ id, name, description, enforcement }`.
4. Reference the schema from `hivemind-configs.schema.ts`.

**Verify:**
- Section exists and is clear.
- Examples are syntactically correct.

**Done:** Rule creation guide complete.

### Task 3: Agent Config Guide
**Type:** auto
**Files:** `assets/skills/hm-l2-governance-config/SKILL.md` (section)
**Action:**
1. Add section `## Agent Configuration Guide`.
2. Explain how to configure agents in `configs.json` under `governance.agents`.
3. Provide examples: `{ name, temperature, tools, permissions }`.
4. Mention default agent list from `defaults.ts`.

**Verify:**
- Section exists with examples.
- References defaults correctly.

**Done:** Agent config guide complete.

### Task 4: Tool Registry Guide
**Type:** auto
**Files:** `assets/skills/hm-l2-governance-config/SKILL.md` (section)
**Action:**
1. Add section `## Tool Registry Guide`.
2. Explain how to register tools in `configs.json` under `governance.tool_registry`.
3. Provide examples: `{ name, description, permissions }`.
4. Note that tool registry is optional; defaults exist.

**Verify:**
- Section exists with examples.
- Clarifies optionality.

**Done:** Tool registry guide complete.

### Task 5: Naming Standards Guide
**Type:** auto
**Files:** `assets/skills/hm-l2-governance-config/SKILL.md` (section)
**Action:**
1. Add section `## Naming Standards Guide`.
2. Explain naming conventions for skills, agents, commands.
3. Reference `hf-naming-syndicate` skill for detailed rules.
4. Provide quick reference table.

**Verify:**
- Section exists.
- References naming syndicate skill.

**Done:** Naming standards guide complete.

### Task 6: Asset Sync
**Type:** auto
**Files:** `.opencode/skills/hm-l2-governance-config/SKILL.md` (synced copy)
**Action:**
1. Run `node scripts/sync-assets.js` to sync assets.
2. Verify the skill appears in `.opencode/skills/`.

**Verify:**
- File exists at `.opencode/skills/hm-l2-governance-config/SKILL.md`.
- Content matches `assets/` version.

**Done:** Skill synced to `.opencode/`.

## Dependency Graph
- Task 1 (Scaffolding) must complete before Tasks 2-5 (Content).
- Tasks 2-5 can be done in parallel.
- Task 6 (Sync) depends on all content being complete.

## Threat Model
- **Risk:** Skill content is inaccurate or outdated.
  - **Mitigation:** Reference schema and defaults from SR-11-01.
- **Risk:** Sync fails.
  - **Mitigation:** Run sync manually and verify.

## Verification
1. Inspect `SKILL.md` for completeness.
2. Run `node scripts/sync-assets.js` and check `.opencode/skills/`.
3. Test skill loading in OpenCode (if possible).

## Success Criteria
- [ ] `hm-l2-governance-config` skill exists in `assets/skills/`.
- [ ] Skill covers rule creation, agent config, tool registry, naming standards.
- [ ] Skill synced to `.opencode/skills/`.
- [ ] YAML frontmatter is valid and includes triggers.
