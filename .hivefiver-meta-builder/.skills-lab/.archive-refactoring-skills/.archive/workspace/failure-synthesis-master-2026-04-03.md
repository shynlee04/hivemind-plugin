# Master Failure Synthesis: All 5 Skill Packs

**Date:** 2026-04-03
**Source:** skill-failure-test1.md — real session where user asked "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"
**Method:** 5 parallel investigator agents, one per skill pack
**Total Flaws Found:** 56 (10 BLOCK/CRITICAL, 24 HIGH, 18 MEDIUM, 4 LOW)

---

## The One Root Cause

**All 5 skill packs are DOCUMENTATION masquerading as OPERATIONAL SYSTEMS.**

Every pack describes WHAT should happen but provides no mechanism to MAKE it happen. The agent in the test session loaded the right skills, understood the intent, and still bypassed every gate, every probe, every planning step — because nothing enforced compliance.

### The Pattern Across All 5 Packs

| What the Skill Claims | What Actually Exists |
|----------------------|---------------------|
| "Programmatic gate enforcement" | Scripts check file existence only |
| "Hooks auto-enforce discipline" | Zero hook files shipped |
| "Recovery protocol" | Fails if pre-existing state doesn't exist |
| "TDD RED-GREEN-REFACTOR" | Conflicts with skill-creator's draft-first workflow |
| "Loop until success" | No termination condition defined |
| "Hand-off protocol" | Checklist, not a template |
| "Cross-platform hooks" | YAML in documentation, not deployable configs |
| "Quality scoring" | Formula without worked examples |

---

## Per-Pack Critical/Block Flaws

### use-authoring-skills (4 CRITICAL, 6 MAJOR, 5 MINOR)
- **C1:** Phantom dependencies — `skill-judge`, `skill-review` don't exist
- **C2:** No pathway for "create from template" — the user's actual scenario
- **C3:** Conflicts with `skill-creator` — TDD vs draft-first, agent followed neither
- **C4:** 15 operating discipline rules, all ignored — designed for multi-session refactoring, not single-task creation
- **Root cause:** Overbuilt governance for a problem that doesn't exist. The most common use case is "convert document to skill" — a 10-minute task.

### meta-builder (2 BLOCK, 4 HIGH, 4 MEDIUM-HIGH, 2 MEDIUM)
- **BLOCK:** Description doesn't trigger on "I want to create a skill like this"
- **BLOCK:** No concrete "user says X → do Y" workflow — taxonomy, not instructions
- **HIGH:** Routing scoring formula is IDENTICAL for GROUP 1 and GROUP 2
- **HIGH:** 94% noise — 287 lines of OpenCode concepts, 17 lines relevant
- **Root cause:** Architecture document, not agent instruction set. The agent succeeded DESPITE meta-builder.

### coordinating-loop (3 CRITICAL, 4 HIGH, 4 MEDIUM, 1 LOW)
- **CRITICAL:** 173 lines too thin — ~30 lines of actual guidance, rest is tables
- **CRITICAL:** No worked example of coordinating subagents through any workflow
- **CRITICAL:** Recovery protocol useless without pre-existing `.coordination/` directory
- **HIGH:** Decision flowchart has logical contradiction (redundant check creates dead end)
- **Root cause:** Map of coordination territory, not vehicle for traversing it.

### planning-with-files (2 CRITICAL, 5 HIGH, 3 MEDIUM)
- **CRITICAL:** Goal-refresh mechanism is entirely voluntary — no hooks, no enforcement
- **CRITICAL:** Skill was INVISIBLE in real session — agent used in-memory todowrite instead
- **HIGH:** Templates pre-filled with Python todo-app example — agents must delete everything before using
- **HIGH:** session-catchup.py has critical git timestamp bug (`--since` filters commit date, not file mtime)
- **HIGH:** Cross-platform hooks are documentation only — zero actual config files shipped
- **Root cause:** Documentation package pretending to be operational system. Every enforcement mechanism exists only as prose.

### user-intent-interactive-loop (1 CRITICAL, 3 HIGH, 4 MEDIUM, 1 LOW, 1 MEDIUM-HIGH)
- **CRITICAL:** Anti-patterns don't prevent the actual failure — "Premature Executor" is #10 of 10 with no enforcement gate
- **HIGH:** No loop termination condition — "Loop Until Done" never defines "done"
- **HIGH:** No skill-creation-specific probing examples — all examples are generic dev tasks
- **HIGH:** Probe phase too generic — no guidance on which question to ask first for skill creation
- **Root cause:** Process description masquerading as enforcement mechanism. Needs gates, not guidance.

---

## Common Patterns (Systemic, Not Per-Pack)

### 1. Phantom Enforcement
Every pack claims "programmatic," "measurable," "enforced" — but provides no actual enforcement. Gates check file existence, not content quality. Scripts fail without pre-existing infrastructure.

### 2. No Worked Examples
Zero end-to-end examples across all 5 packs showing: "User says X → Agent does Y → Result is Z." Every pack has templates with placeholders, not filled-in examples.

### 3. Circular Dependencies Without Resolution
- `user-intent-interactive-loop` → `coordinating-loop` → `user-intent-interactive-loop`
- `coordinating-loop` → `planning-with-files` → `coordinating-loop`
- `use-authoring-skills` → all GROUP 1 skills → none define load order or conflict resolution

### 4. Scripts That Don't Work in Isolation
- `coordination-check.sh` — exits 1 if no `.coordination/` directory
- `loop-status.sh` — exits 1 if no `.coordination/` directory
- `route-check.sh` — can't find skills in global paths
- `stack-validate.sh` — single search path, no fallback
- `intent-verify.sh` — runtime bug (`grep -c` produces multiline output)
- `session-catchup.py` — critical git timestamp bug
- `init-session.sh` — creates broken templates

### 5. No Platform Adaptation
Only `skill-creator` has Claude.ai/Cowork sections. The other 4 packs assume full tool access, bash execution, subagent dispatch, and writable filesystem.

---

## Fix Priority (What to Do Next)

### Phase 1: Kill the Dead Weight (Highest Impact, Lowest Effort)
1. Remove phantom dependencies (`skill-judge`, `skill-review`)
2. Remove HiveMind v3 alignment from meta-builder (architecture docs, not agent guidance)
3. Remove duplicate content across all packs
4. Fix script bugs (intent-verify.sh grep, session-catchup.py git timestamp)

### Phase 2: Add What's Missing (Highest Impact, Medium Effort)
5. Add worked examples to EVERY pack — "user says X → agent does Y → result is Z"
6. Add concrete first-action directives — "When this skill loads, do THIS first"
7. Add skill-creation-specific probing examples to user-intent-interactive-loop
8. Replace todo-app templates with clean skeletons in planning-with-files

### Phase 3: Make Gates Real (Medium Impact, High Effort)
9. Implement actual gate enforcement scripts (not just file existence checks)
10. Ship actual hook config files (not YAML in documentation)
11. Add termination conditions to all loops
12. Add platform adaptation sections to all packs

### Phase 4: Resolve Conflicts (Medium Impact, Medium Effort)
13. Resolve TDD vs draft-first conflict between use-authoring-skills and skill-creator
14. Fix meta-builder routing formula (GROUP 1 and GROUP 2 scores are identical)
15. Define load order and conflict resolution for cross-referenced skills
16. Fix coordinating-loop decision flowchart logical contradiction

---

## Confidence Assessment

| Assessment | Confidence | Evidence |
|------------|-----------|----------|
| All 5 packs fail on real tasks | HIGH | Demonstrated in skill-failure-test1.md |
| Root cause is documentation-vs-operational | HIGH | Same pattern across all 5 packs |
| Fix priority order is correct | MEDIUM-HIGH | Based on impact/effort analysis |
| 56 total flaws is complete | MEDIUM | 5 investigators, but more may exist |
