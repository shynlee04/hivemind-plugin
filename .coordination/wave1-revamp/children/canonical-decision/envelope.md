# Task Envelope: TASK-W1-C5
## Task
Determine the canonical location for skills: `.claude/skills/` or `.opencode/skills/`. Research both locations, compare content, and write a decision document with rationale.

## Scope
- **Include (read only):**
  - `.claude/skills/` (all skill directories)
  - `.opencode/skills/` (all skill directories)
- **Do NOT modify any files** — this is a research and decision task only

## Context
The Hivefiver ecosystem has skills in both `.claude/skills/` and `.opencode/skills/`. Some skills exist in both locations with potentially different content. We need a single source of truth.

Key questions to answer:
1. Which location has MORE skills?
2. Which location has BETTER quality skills (by inspection)?
3. Are there skills in one location that are completely absent from the other?
4. Which location is the intended canonical source (check git history, AGENTS.md, etc.)?
5. What content is UNIQUE to each location (must be preserved during merge)?

## Expected Output
Write a decision document at `.hivemind/research/skills-audit/planning/canonical-location-decision-2026-04-10.md` with:
- Inventory of skills in each location
- Comparison table of duplicate skills (same name, different locations)
- Recommendation: which is canonical and WHY
- List of unique content that must be preserved from the non-canonical location

## Verification
Run: `ls .claude/skills/ | wc -l` and `ls .opencode/skills/ | wc -l` and include counts in the document.
Decision document must be written at the exact path above before this task is considered complete.