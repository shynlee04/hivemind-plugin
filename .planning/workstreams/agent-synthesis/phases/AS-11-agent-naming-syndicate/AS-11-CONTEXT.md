---
phase: AS-11
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-8
  - SE-11
blocks:
  - AS-7
created: 2026-04-29
---

# AS-11: Agent Naming Syndicate — Context

## Phase Goal
Rename ALL ~45 hm-* and hf-* agents to consistent `hm-<domain>-<role>` or `hf-<domain>-<role>` format. Delete obsolete GSD agents (D-AD-03 transition safety: only after replacements verified in AS-7). Update ALL cross-references in AGENTS.md, 49+ skills, 13 commands, and ROADMAP/STATE files. Create `NAMING-SYNDICATE.md` with old→new mapping and machine-verifiable validation regex.

## Starting State
- AS-8 completed: all ~45 agents have enriched XML bodies with consistent 10 XML sections
- SE-11 completed: NAMING-SYNDICATE.md exists for skills, `[lineage]-[domain]-[function]` pattern formalized
- Agent names are currently descriptive but inconsistent:
  - hm-* agents from AS-4/AS-5: `hm-researcher.md`, `hm-builder.md`, `hm-code-reviewer.md`, etc. (informal schema)
  - hf-* agents from AS-6: `hf-orchestrator.md`, `hf-agent-builder.md`, `hf-prompter.md` (informal schema)
  - Core agents: `coordinator.md`, `orchestrator.md`, `conductor.md`, `critic.md`, `general.md`, `build.md`, `test-router.md`, `context-mapper.md`, etc. (no prefix)
  - 33 GSD agents: `gsd-*.md` (STILL EXIST — deletion happens in AS-7 after verification)
- Naming convention is needed for: consistency, machine-verifiability, and alignment with skill naming syndicate (SE-11)

## Deliverables
1. **`NAMING-SYNDICATE.md`** (agent-synthesis edition) — Full naming syndicate document:
   - Old→new name mapping table for all ~59 agents
   - Naming convention spec: `hm-<domain>-<role>` and `hf-<domain>-<role>`
   - Validation regex: `^(hm|hf)-[a-z]+(-[a-z]+)*$` (at least 2 segments after prefix)
   - Deletion schedule: which gsd-* agents deleted and exact timing (post-AS-7)
   - Core agent retention list: which agents keep current names (build, conductor, test-router)

2. **Naming patterns applied to all agents:**

| Category | Pattern | Examples |
|----------|---------|----------|
| hm-* orchestrator | `hm-orchestrator` | `hm-orchestrator` (L0, single) |
| hm-* coordinator | `hm-<domain>-coordinator` | `hm-phase-coordinator`, `hm-workstream-coordinator` |
| hm-* specialist | `hm-<domain>-<role>` | `hm-research-detective`, `hm-quality-critic`, `hm-phase-executor` |
| hf-* agents | `hf-<domain>-<role>` | `hf-meta-orchestrator`, `hf-agent-builder`, `hf-skill-author` |
| Core agents | keep current names | `build`, `conductor`, `test-router` (internal-only) |

3. **Cross-reference updates in ALL files:**
   - `AGENTS.md` — agent inventory section updated with new names
   - All 49+ SKILL.md files — agent references updated where skills mention specific agents
   - All 13 command `.md` files — agent references in command frontmatter
   - `ROADMAP.md` and `STATE.md` — agent name references in both workstreams
   - Per-agent `<delegation_boundary>` sections — L1 agents reference L2 specialists by correct new names
   - SE-14 INTEGRATION-CONTRACTS.md — agent names in contracts must match new names

4. **gsd-* agent deletion** — Remove all 33 gsd-* agent files (coordinated with AS-7 deletion; naming is a prerequisite).

## Acceptance Criteria
- [ ] `NAMING-SYNDICATE.md` (agent-synthesis edition) published with full old→new map
- [ ] All 34 hm-* agents follow `hm-<domain>-<role>` pattern (2+ segments after prefix)
- [ ] All 7 hf-* agents follow `hf-<domain>-<role>` pattern (2+ segments after prefix)
- [ ] No gsd-* agents remain (D-AD-03 satisfied, coordinated with AS-7)
- [ ] Core agents (build, conductor, test-router, etc.) retain their current names
- [ ] All cross-references in skills, commands, AGENTS.md resolve to correct new names
- [ ] Naming convention is machine-verifiable via regex: `^(hm|hf)-[a-z]+(-[a-z]+)*$`
- [ ] `hf-meta-builder` name fully resolved (fixes KI-01 — already fixed in SE-6 but verified here)
- [ ] No name collisions between hm-* and hf-* agents
- [ ] `<delegation_boundary>` sections in L1 agents reference L2 specialists by correct new names
- [ ] Ghost agent `explore` resolved: either named correctly if created, or removed from AGENTS.md

## Known Risks
- Renaming 59 agents in a single commit (atomicity requirement) is a large change — high merge conflict risk
- Cross-reference updates span 49+ skills, 13 commands, AGENTS.md, ROADMAP.md, STATE.md — easy to miss references
- gsd-* deletion timing must coordinate with AS-7 — this phase enables deletion but AS-7 authorizes it
- Naming pattern must be consistent with SE-11 skill naming syndicate — both syndicates must align
- Domain names are descriptive (e.g., "research", "quality") — must not conflict with skill domain names
- Core agent retention conflicts with naming convention (they break the pattern) — must clearly document why

## Skills/Agents Involved
- **Creates:** `NAMING-SYNDICATE.md` (agent-synthesis edition)
- **Renames:** All ~45 hm-* and hf-* agent files
- **Deletes:** 33 gsd-* agent files (coordinated with AS-7)
- **Updates cross-references:** AGENTS.md, 49+ SKILL.md files, 13 command files, ROADMAP.md, STATE.md
- **References:** SE-11 NAMING-SYNDICATE.md (skill edition — must align)
- **Output feeds:** AS-7 (capability wiring verification with final names)
