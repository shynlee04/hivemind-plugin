---
phase: AS-6
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-3
blocks:
  - AS-8
created: 2026-04-29
---

# AS-6: L2 hf-* Meta Builder Agent Authoring — Context

## Phase Goal
Create 7 hf-* L2 agents from existing hivefiver-* agent content. Apply the XML body standard from AS-1/AS-2. Migrate from hivefiver-* prefix to hf-* prefix. Fix known defects (KI-01: hf-meta-builder name mismatch, KI-02: hf-prompter missing name field).

## Starting State
- AS-3 completed: hf-orchestrator (L0) exists as the hf-* lineage entry point
- 6 hivefiver-* agents exist at `.opencode/agents/`:
  - `hivefiver.md` — meta builder orchestrator (L0/L1 candidate)
  - `hivefiver-agent-builder.md` — 361-line agent builder
  - `hivefiver-command-builder.md` — command builder
  - `hivefiver-skill-author.md` — skill author
  - `hivefiver-tool-builder.md` — tool builder
  - `hivefiver-orchestrator.md` — dedicated orchestrator
- 1 hf-* agent exists: `hf-prompter.md` — has KI-02 (missing `name:` field in YAML frontmatter; `hm-deep-research` appears in examples but agent's actual identity is unclear)
- 1 hf-* meta builder skill exists: `hf-meta-builder` — has KI-01 (frontmatter says `hr-meta-builder`, wrong prefix)
- D-AD-06 locked: "Existing hivefiver-* agents are candidates for hf-* lineage"

## Deliverables — 7 hf-* Agents

1. **`hf-orchestrator.md`** — Meta-builder L0 orchestrator (from `hivefiver.md` + `hivefiver-orchestrator.md` merge):
   - Mode: primary, temperature: 0.2-0.3, depth: L0
   - Skills: hf-skill-router (SE-10), hf-meta-builder
   - Merges orchestrator routing from both source agents
2. **`hf-agent-builder.md`** (from `hivefiver-agent-builder.md`):
   - Mode: subagent, temperature: 0.0-0.15, depth: L2
   - Creates, audits, repairs OpenCode agent definitions
   - Skills: hf-agent-composition, hf-agents-and-subagents-dev, hf-delegation-gates
3. **`hf-command-builder.md`** (from `hivefiver-command-builder.md`):
   - Mode: subagent, temperature: 0.0-0.15, depth: L2
   - Creates, audits, repairs OpenCode commands with shell safety
   - Skills: hf-command-dev, hf-command-parser, hm-opencode-non-interactive-shell
4. **`hf-skill-author.md`** (from `hivefiver-skill-author.md`):
   - Mode: subagent, temperature: 0.0-0.15, depth: L2
   - Creates, audits, repairs OpenCode skills following agentskills.io principles
   - Skills: hf-use-authoring-skills, hf-skill-synthesis
5. **`hf-tool-builder.md`** (from `hivefiver-tool-builder.md`):
   - Mode: subagent, temperature: 0.0-0.15, depth: L2
   - Creates, audits, repairs custom tools with Zod schemas
   - Skills: hf-custom-tools-dev
6. **`hf-agents-md-sync-agent.md`** — New agent extracted from hf-agents-md-sync skill:
   - Mode: subagent, temperature: 0.0-0.15, depth: L2
   - Detects and fixes drift between AGENTS.md and codebase state
   - Skills: hf-agents-md-sync
7. **`hf-prompter.md`** — Upgraded from existing hf-prompter:
   - Fix KI-02: add missing `name:` field to YAML frontmatter
   - Mode: subagent, temperature: 0.1-0.2, depth: L1 (prompt engineering is coordination)
   - Skills: (prompt engineering patterns)

## Acceptance Criteria
- [ ] 7 hf-* agent files created with full XML-tagged bodies per AS-1 standard
- [ ] Content migrated from hivefiver-* source agents (no content loss)
- [ ] All frontmatter fields present including `name:` (fixes KI-02 for hf-prompter)
- [ ] hf-meta-builder/hf-meta-builder naming resolved (fixes KI-01 — frontmatter `name:` must be `hf-meta-builder`)
- [ ] Cross-lineage skill access documented: hf-* agents may load hm-* skills per D-AD-01 FLEXIBLE
- [ ] hf-command-builder references hm-opencode-non-interactive-shell (legitimate cross-lineage access)
- [ ] hf-skill-author references hm-detective (for codebase pattern discovery before authoring)
- [ ] All 7 agents pass AQUAL-01 through AQUAL-08 quality contract
- [ ] Original hivefiver-* agents retained until AS-7 verification passes (transition safety)
- [ ] Agent files registered with `.gitkeep`

## Known Risks
- Merging `hivefiver.md` + `hivefiver-orchestrator.md` → `hf-orchestrator.md` may lose content if not careful
- hf-* agents have FLEXIBLE cross-lineage access (D-AD-01) — must document exactly which hm-skills each hf-agent loads and why
- `hf-agents-md-sync-agent` is a new agent extracted from a skill — no existing agent body to migrate
- hf-prompter's KI-02 fix is straightforward but must also validate that all content references are correct (not just add `name:`)
- hivefiver-* agents must remain until AS-7 — coexistence period with hf-* replacements

## Skills/Agents Involved
- **Creates:** 7 hf-* agent files
- **Migrates:** 6 hivefiver-* agents + 1 existing hf-prompter
- **Fixes:** KI-01 (hf-meta-builder name), KI-02 (hf-prompter missing name field)
- **Output feeds:** AS-8 (body enrichment), AS-7 (capability wiring)
