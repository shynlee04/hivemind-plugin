---
phase: AS-0
workstream: agent-synthesis
status: NOT STARTED
depends_on: []
blocks:
  - AS-1
created: 2026-04-29
---

# AS-0: Agent Inventory & Classification Audit — Context

## Phase Goal
Produce a complete inventory and classification matrix of all 58 agents on disk plus 1 ghost agent (`explore`). Every agent gets quality-scored on frontmatter completeness, body depth, execution flow presence, and output contract clarity. This is the foundational audit that all subsequent agent-synthesis phases build upon.

## Starting State
- 58 agents on disk at `.opencode/agents/`
- 1 ghost agent (`explore`) referenced in AGENTS.md but missing from disk
- Agent quality is wildly inconsistent:
  - `orchestrator.md` is a 16-line stub (no execution flow)
  - `general.md` is a thin stub (minimal body content)
  - `gsd-planner` has 1248 lines with 22 execution steps
  - `gsd-debugger` has 1445 lines with 9 steps
  - `hivefiver-agent-builder` has 361 lines
- Zero hm-* prefixed agents exist
- 33 GSD agents are internal-only (not shipped)
- 9 known defects documented in ROADMAP (KI-01 through KI-09)

## Deliverables
1. **`AGENT-INVENTORY.md`** — Full classification matrix with columns:
   - Agent name, file path, line count, body LOC
   - Category: gsd-* (33), hivefiver-* (6), hf-* (1), core (18)
   - Frontmatter completeness: name, description, mode, temperature, tools present/missing
   - Body format: XML tagged, Markdown, Mixed, Flat/stub
   - Quality score: HIGH (>200 LOC, XML body, execution flow), MEDIUM (100-200 LOC), LOW (<100 LOC or stub), NONE (missing field)
   - Shipped?: Yes/No (D-AD-01: gsd-* = No)
2. **`AGENT-BODY-CATALOG.md`** — Body format catalog:
   - GSD XML pattern (25 agents): `<role>`, `<task>`, `<scope>`, execution steps, guardrails
   - Hivefiver Markdown pattern (6 agents): flat sections, YAML frontmatter, !bash patterns
   - Mixed format (4 agents): partial XML + markdown
   - Flat/stub (24 agents): minimal or no body content
3. **Defect register** — Confirm/fix all 9 known defects (KI-01 through KI-09) plus any new ones discovered.

## Acceptance Criteria
- [ ] All 58 on-disk agents cataloged with full frontmatter extraction
- [ ] Each agent classified into category: gsd-* (33), hivefiver-* (6), hf-* (1), core (18)
- [ ] Quality score assigned per agent (HIGH/MEDIUM/LOW/NONE)
- [ ] Body format cataloged: GSD XML (25), Markdown (6), Mixed (4), Flat/stubs (24)
- [ ] All 9 known defects (KI-01 through KI-09) confirmed or resolved
- [ ] Ghost agent `explore` documented as MISSING-FROM-DISK with AGENTS.md reference noted
- [ ] Agent count discrepancy resolved: 58 on disk vs 59 in AGENTS.md listing
- [ ] `AGENT-INVENTORY.md` published and committed

## Known Risks
- Agent quality scoring is subjective — need clear, objective scoring criteria upfront
- 58 agents is context-heavy for manual audit — may require script-assisted extraction
- Ghost agent `explore` may have been intentionally removed or accidentally deleted — need git history check
- Some agents may have incorrect frontmatter fields that went undetected (e.g., `hf-prompter` missing `name:` field KI-02)
- Body format categorization may be ambiguous for agents with mixed patterns

## Skills/Agents Involved
- **Creates:** `AGENT-INVENTORY.md`, `AGENT-BODY-CATALOG.md`
- **Audits:** All 58 agents at `.opencode/agents/`
- **Reads:** `AGENTS.md` (agent inventory section for cross-reference)
