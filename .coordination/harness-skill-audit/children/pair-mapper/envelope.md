# Task Envelope: Pair Mapping Analysis

## Task
Build the definitive skill assignment configurations for HiveMind agents, identifying pair-of-3 (front-facing orchestrator) and pair-of-2 (subagent delegated) skill sets based on Cycle 1 bundle scan findings.

## Scope
### Include
- `.hivemind/research/skills-audit/synthesis/cycle1-aggregate-bundle-findings-2026-04-09.md` — source synthesis
- `.hivemind/research/skills-audit/inventory/bundle-scan-*.md` — supporting evidence
- `.opencode/agents/*.md` — agent definitions (coordinator, conductor, researcher, builder, critic, explore)
- `.claude/skills/*/SKILL.md` — all 20 skill definitions for capability mapping

### Exclude
- All test files
- All implementation code (src/, tests/)
- Node modules, build artifacts

## Context
**From Cycle 1 findings:**
- 20 skills cataloged with bundle grades (A to F)
- 8 skills graded D/F (zero or minimal bundle)
- 5 skills have evals (25% coverage)
- 9 cross-skill conflict pairs identified
- Front-facing orchestrators need pair-of-3 skill sets (orchestrator + 2 supporting)
- Subagents need pair-of-2 skill sets (specialist + 1 supporting)

**What "pair" means:**
- Pair-of-3: Primary skill + 2 augmentation skills (e.g., coordinating-loop + planning-with-files + user-intent-interactive-loop)
- Pair-of-2: Primary skill + 1 augmentation skill (e.g., builder + test harness)

**Agent types from `.opencode/agents/`:**
- coordinator — front-facing orchestrator
- conductor — workflow orchestrator
- researcher — investigation agent
- builder — implementation agent
- critic — review/verification agent
- explore — codebase navigation agent

## Expected Output
**File:** `planning/pair-mapping-2026-04-09.md`

**Section 1: Pair-of-3 Configurations**
- For each front-facing agent (coordinator, conductor)
- List the primary skill + 2 supporting skills
- Justify each augmentation (complementarity, handoff pattern)

**Section 2: Pair-of-2 Configurations**
- For each subagent type (researcher, builder, critic, explore)
- List primary skill + 1 supporting skill
- Justify the pair

**Section 3: Agent ↔ Skill Assignment Matrix**
- Rows: All 6 agent types
- Columns: All 20 skills
- Cells: Assignment category (primary, supporting, not-assigned, blocked-by-conflict)

**Section 4: Domain Coverage Map**
- Group skills by domain (orchestration, authoring, platform, analysis, debugging)
- Identify gaps where no skill covers a needed domain
- Identify overlaps where 2+ skills claim same domain

**Format:** Markdown with tables. Min 150 lines.

## Verification
1. Run: `wc -l planning/pair-mapping-2026-04-09.md` — must be ≥ 150 lines
2. Run: `grep -c "Pair-of-3" planning/pair-mapping-2026-04-09.md` — must find at least 2 entries
3. Run: `grep -c "Pair-of-2" planning/pair-mapping-2026-04-09.md` — must find at least 4 entries
4. Confirm all 6 agent types appear in the matrix
5. Confirm all 20 skills appear in the matrix