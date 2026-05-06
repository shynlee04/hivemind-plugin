---
phase: AS-9
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-8
  - SE-12
blocks:
  - AS-7
created: 2026-04-29
---

# AS-9: Agent Tool Integration — Context

## Phase Goal
Define formal tool capability per agent based on SE-12's TOOL-CAPABILITY-MATRIX.md. Create agent-side tool declarations in all agent `.md` files with granular, role-appropriate permissions. No agent gets blanket `"*"` tool access — every permission is explicit.

## Starting State
- AS-8 completed: all ~45 agents have enriched XML bodies with 10 sections
- SE-12 completed: TOOL-CAPABILITY-MATRIX.md exists with skill→tool mappings for all 49 skills
- Current agent tool declarations are inconsistent:
  - Some agents have no `tools:` field in YAML frontmatter
  - Some agents have blanket access patterns
  - GSD agents (still existing) have per-agent tool lists
- Tool categories from SE-12:
  - **OpenCode native:** read, write, edit, bash, glob, grep, task, skill, todowrite
  - **Hivemind custom:** delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart
  - **MCP/external:** tavily-*, brave-*, deepwiki-*, github-*, repomix-*, context7-*, mcp-playwright-*, fetcher-*

## Deliverables
1. **Agent-side `TOOL-CAPABILITY-MATRIX.md` integration** — Cross-reference column linking agent→tools via agent's loaded skills (from `<skill_loading>` section added in AS-8).
2. **Tool declarations in all ~45 agent `.md` files** — `tools:` array in YAML frontmatter:
   - OpenCode native tools relevant to agent's domain
   - Hivemind custom tools ONLY where the agent's role requires them
   - MCP/external tools ONLY where the task requires web/external access
3. **Permission rule enforcement:**
   - No agent has blanket `"*"` allow — all permissions are explicit
   - L0 orchestrators: `delegate-task` only (no other custom tools)
   - L1 coordinators: `delegate-task` + `delegation-status`
   - L2 specialists: no delegation tools, write access only to domain-specific directories
   - Research agents: MCP tools (Tavily, Brave, Context7) documented as optional
   - Quality agents: Read/Glob/Grep only (read-only reviewers)
   - Builder agents: Read/Write/Edit/Bash for test execution

## Acceptance Criteria
- [ ] All ~45 agents have explicit `tools:` array in YAML frontmatter
- [ ] No agent uses `tools: ["*"]` — all permissions are granular
- [ ] Hivemind custom tools declared ONLY where role-appropriate
- [ ] MCP tools match agent's domain (researcher=yes, code-reviewer=no)
- [ ] L0 orchestrators have only `delegate-task` custom tool
- [ ] L1 coordinators have `delegate-task` + `delegation-status`
- [ ] L2 specialists have zero delegation tools
- [ ] Tool permissions validated against AQUAL-05 granularity requirement
- [ ] Agent tool permissions consistent with SE-12 skill→tool mappings (agent loads skill → agent gets skill's required tools)
- [ ] Tool permissions do not exceed what the agent's loaded skills require

## Known Risks
- Tool permission derivation from skill→tool mappings (SE-12) requires accurate skill-loading rules from AS-8
- Some agents need MCP tools but MCP availability varies by environment — must document as optional vs required
- Run-background-command is a powerful custom tool — must be restricted to agents that legitimately need PTY access
- configure-primitive and validate-restart are meta-builder tools — should only appear on hf-* agents
- Overly restrictive permissions → agents can't do their job; overly permissive → security risk. Finding the right balance per agent is challenging.

## Skills/Agents Involved
- **Modifies:** All ~45 hm-* and hf-* agent YAML frontmatters (add `tools:` array)
- **References:** SE-12 TOOL-CAPABILITY-MATRIX.md (skill→tool mappings)
- **References:** AS-8 `<skill_loading>` sections (which skills each agent loads)
- **Output feeds:** AS-7 (capability wiring verification)
