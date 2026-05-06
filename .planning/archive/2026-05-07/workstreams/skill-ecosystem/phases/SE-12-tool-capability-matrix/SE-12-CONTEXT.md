---
phase: SE-12
workstream: skill-ecosystem
status: NOT STARTED
depends_on:
  - SE-9
blocks:
  - AS-9
created: 2026-04-29
---

# SE-12: Tool Capability Matrix (Skill Side) — Context

## Phase Goal
Create a formal tool capability matrix mapping every skill to the tools it requires, so that agents can determine their tool permissions from the skills they load. All 49 skills must declare their tool requirements in a verifiable, machine-checkable format.

## Starting State
- SE-9 completed: all 49 active skills are hardened and pass RICH gates
- No formal mapping exists of which tools map to which skills
- Tools are currently categorized into three groups but only informally:
  - **OpenCode native:** read, write, edit, bash, glob, grep, task, skill, todowrite
  - **Hivemind custom:** delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart
  - **MCP/external:** tavily-*, brave-*, deepwiki-*, github-*, repomix-*, context7-*, mcp-playwright-*, fetcher-*
- Skills reference tools in their body text but have no structured tool declaration
- Agents either over-provision or under-provision tool access because no skill→tool mapping guides their permission model

## Deliverables
1. **`TOOL-CAPABILITY-MATRIX.md`** — Complete matrix with:
   - All three tool categories listed with exact tool names
   - Each of the 49 skills declaring required tools from these categories
   - Columns: Skill Name, OpenCode Native Tools, Hivemind Custom Tools, MCP/External Tools
   - Documentation of which tools are exclusive to which skill lineage (hm/hf/gate/stack)
2. **Tool requirement declarations** in all 49 SKILL.md files — Either in YAML frontmatter (recommended) or a dedicated `<tool_requirements>` section in the body.
3. **Verification scan script** — Validates that every tool referenced in a skill's body text is declared in its tool requirements, and vice versa (no declared-but-unused tools).

## Acceptance Criteria
- [ ] `TOOL-CAPABILITY-MATRIX.md` published with all 49 skills and all tool categories
- [ ] All 49 skills have tool requirement declarations (in frontmatter or body section)
- [ ] Scan script confirms zero undeclared tool references across all skills
- [ ] Scan script confirms zero declared-but-unused tools per skill
- [ ] Matrix distinguishes between "required" and "optional" tools per skill
- [ ] Hivemind custom tools declared ONLY for skills that need them (not blanket-assigned)
- [ ] MCP tools declared ONLY for skills that perform web/external operations (research, tech-stack-ingest, context-absorb)
- [ ] stack-* reference skills declare read-only tool requirements (Read, Glob, Grep)

## Known Risks
- Tool requirement declarations are a new concept — no existing pattern to follow
- Some skills may reference tools in examples or error messages that aren't actual requirements (false positives in scan)
- MCP tool availability varies by environment — matrix must document which tools are optional vs required
- Skills that are reference-only (stack-*, hm-omo-reference) may have zero tool requirements — need a "none" convention
- Back-pressure to SE-9: if tool usage patterns change during matrix creation, skills may need re-hardening

## Skills/Agents Involved
- **Creates:** `TOOL-CAPABILITY-MATRIX.md`
- **Modifies:** All 49 active SKILL.md files (add tool requirement declarations)
- **Creates:** Verification scan script
