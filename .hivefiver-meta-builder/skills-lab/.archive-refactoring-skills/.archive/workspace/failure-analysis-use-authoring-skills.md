# Failure Analysis: use-authoring-skills

## Critical Flaws (block proper execution)

### C1. Phantom Skill Dependencies — Agent asked to load skills that don't exist

**The skill says (SKILL.md:18-19):**
```
| Creating/improving | `skill-creator`, `skill-development`, `writing-skills` |
| Auditing/refactoring | `skill-judge`, `skill-review` |
```

**Reality:** `skill-judge` and `skill-review` do not exist anywhere on the filesystem. A search across `~/.agents/skills/`, `~/.config/opencode/skills/`, and `.opencode/skills/` found zero matches. Only `skill-development` exists globally.

**Impact:** The agent cannot fulfill the "Required Skill Loads" table. It has no way to load `skill-judge` or `skill-review` for auditing work. The skill promises a capability it cannot deliver. The agent in the transcript loaded `skill-creator` (which exists) but had no auditing companion to use.

---

### C2. No Actionable First Step for "Create a Skill from a Template File"

**The user asked:** "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"

**The "When to Load" table has 11 rows.** The closest match is:
```
| Creating a new skill from scratch | → references/01-skill-anatomy.md + references/02-frontmatter-standard.md + TDD workflow |
```

**But the user is NOT creating from scratch** — they have a source file to convert. None of the 11 rows cover "create a skill from an existing template/document." The agent had to guess.

**What the agent actually did:** It skipped the "When to Load" routing entirely. It dispatched a subagent to audit existing skills, then started writing files directly. The skill provided no decision path for this scenario.

**Impact:** The agent ignored the skill's routing table because the table didn't cover the actual use case. The entire "When to Load" section was dead weight.

---

### C3. `skill-creator` and `use-authoring-skills` Have Conflicting Workflows — Agent Followed Neither

**`use-authoring-skills` says (SKILL.md:159-165):**
```
## TDD for Skills
1. RED — Document a specific scenario that fails without the skill
2. GREEN — Write minimum skill content that resolves that failure
3. REFACTOR — Remove duplication, tighten triggers, validate structure
```

**`skill-creator` says (loaded at line 414-897):**
```
At a high level, the process of creating a skill goes like this:
- Decide what you want the skill to do
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the outputs
- Rewrite the skill based on feedback
- Repeat until you're satisfied
```

**These are fundamentally different methodologies.** `use-authoring-skills` demands RED-GREEN-REFACTOR (write the failing test FIRST). `skill-creator` says write the draft first, test later. The agent followed `skill-creator`'s workflow (draft → write → validate) and completely ignored TDD.

**Transcript evidence (line 1620-1740):** The agent went straight to `mkdir` → `write` without any RED phase. No failing scenario was documented. No baseline was captured.

**Impact:** The TDD gate system is entirely bypassed. The skill talks about TDD but the agent's actual behavior follows a completely different skill's workflow.

---

### C4. Operating Discipline Section Is 15 Rules / ~60 Lines of Abstract Governance — Zero Applied to This Task

**The skill says (SKILL.md:43-102):** 15 "NON-NEGOTIABLE" rules including:
- "Frame skeleton first — Map the architecture, identify nodes, map branches"
- "Max 3 domains, max 5k LOC/text"
- "Sequential preference — Favor sequential over parallel"
- "Write-to-disk every turn"
- "Record and commit ALL changes"

**What the agent actually did:** None of these were followed. The agent did not frame a skeleton. It did not write to disk every turn. It did not commit changes. It did not run `git status` before planning. It launched a parallel subagent (violating "sequential preference").

**Why:** These rules are written for **large-scale skill pack refactoring** (multi-session, multi-agent work), not for "create one skill from a template." The agent correctly recognized they were irrelevant and ignored them.

**Impact:** ~60 lines of SKILL.md body (17% of the skill) are dead weight for the most common use case. The agent learns to ignore this skill's governance language because it never applies to real tasks.

---

## Major Flaws (degrade quality)

### M1. Token Bloat — 350-line SKILL.md + 3,712 lines of references = 4,062 total lines loaded

**The full reference bundle is 4,062 lines.** The SKILL.md alone is 350 lines. For a task that should take 3 steps (read source → pick pattern → write files), the agent loaded a library of governance documents.

**Specific bloat:**
- "Terminology Mandate" (SKILL.md:73-86, 14 lines) — Tells the agent to say "Agent" not "Claude." The agent already knows this from AGENTS.md.
- "Cross-Package Integration" (SKILL.md:338-383, 46 lines) — Describes relationships to "Agent authoring," "Tool authoring," "Command authoring" packages that may not exist. Pure speculation.
- "GROUP 1 Dependencies" (SKILL.md:326-335, 10 lines) — Lists `user-intent-interactive-loop`, `coordinating-loop`, `planning-with-files` as dependencies. The agent did not load any of these.
- "Recovery Protocol" (SKILL.md:260-277, 18 lines) — Instructions for restarting interrupted sessions. Irrelevant for a fresh session.
- "Dynamic Breadth-Depth Resolution" (SKILL.md:238-240, 3 lines) — Vague platitude: "Balance exploration with exploitation." Zero actionable content.

**Impact:** The agent's context window is consumed by governance language instead of actionable skill-authoring guidance. The actual useful content (frontmatter rules, pattern selection, TDD) is buried under ~150 lines of abstract process language.

---

### M2. Gate System (G1-G6) Is Unenforceable — Claims "Programmatic" But Provides No Scripts

**The skill says (SKILL.md:133-155):**
```
### Gate Enforcement
- All gates must pass before proceeding to next phase.
- Gates are boolean or scoring — not subjective.
- Programmatic enforcement — scripts validate gates automatically where possible.
```

**Reality:** The bundled scripts (`validate-skill.sh`, `check-overlaps.sh`, `check-complete.sh`, `init-session.sh`) do NOT implement G1-G6 gates. They check basic file existence and frontmatter format. There is no script that:
- Measures "duplication <5%" (G4)
- Validates "12-file structure with progressive tiers" (G3)
- Checks "cross-package linkage spec" (G6)
- Scores "quality scores for all files identified" (G1)

**The agent in the transcript ran `validate-skill.sh` (line 1966-1991)** and got basic PASS/FAIL on frontmatter. It did NOT run any gate enforcement because no such scripts exist.

**Impact:** The gate system is theater. It looks rigorous but has no enforcement mechanism. The agent cannot "enforce" G1-G6 because the skill provides no tools to do so.

---

### M3. TDD Reference File (04-tdd-workflow.md, 375 lines) Is Unusable for Skill Creation from Templates

**The TDD workflow (04-tdd-workflow.md) assumes you're writing a skill to fix a known failure.** It says:
```
### Step 1: Capture the Failing Scenario
Question: What specific scenario does NOT work without this skill?
```

**But when converting a template file to a skill, there is no "failing scenario."** The user has working content they want to repackage. The RED phase makes no sense here.

**Impact:** The TDD section actively misleads agents working on template-to-skill conversion. It forces them to invent a failure scenario that doesn't exist, or skip TDD entirely (which is what the agent did).

---

### M4. Quality Scoring Section Has No Worked Example

**The skill says (SKILL.md:176-200):**
```
## Quality Scoring
5 dimensions, scored 1–5 each:
| Dimension | Weight | What It Measures |
| Trigger Accuracy | 25% | ...
```

**But there is no example of actually scoring a skill.** The agent has never seen what a "3 vs 4" looks like for Trigger Accuracy. The reference file (05-skill-quality-matrix.md, 378 lines) has an evaluation template but no real scored example.

**The `07-iterative-refinement.md` has one worked example** (context-boundary-guard skill), but it's for improving an existing skill, not scoring a newly created one.

**Impact:** The agent cannot actually perform quality scoring. It can only go through the motions of filling in the template without real judgment criteria.

---

### M5. Recovery Protocol References Files That Don't Exist

**The skill says (SKILL.md:264-266):**
```
1. Read `.skills-lab/findings.md` — locked decisions and current state
2. Read `.skills-lab/realignment-2026-04-03.md` — hard constraints for all future sessions
3. Read `.skills-lab/task_plan.md` — current phase and blockers
```

**These files are project-specific and may not exist.** The recovery protocol assumes a specific project state (`.skills-lab/`) that is not universal. If the agent is working on a different project, these reads will fail.

**Impact:** Recovery protocol is brittle. It hardcodes paths that only work in one specific project configuration.

---

### M6. The Skill Tries to Be Both P1 (Routing) and P3 (Expertise) Simultaneously

**The skill's own pattern definitions (SKILL.md:114-127):**
```
| P1 — Routing | Thin entry, delegates to sub-skills | <200 lines |
| P3 — Expertise | Deep reference-heavy content | 500+ or reference-heavy |
```

**This skill is 350 lines with 12 reference files (3,712 lines).** It has routing logic ("When to Load" table with 11 rows) AND deep expertise content (quality scoring formulas, gate systems, iteration protocols, anti-patterns, recovery procedures).

**It violates its own anti-pattern #3 (SKILL.md:284):**
```
3. The Identity Crisis — Depth skill with routing logic. Pick a lane.
```

**Impact:** The agent doesn't know whether to use this as a router (pick a reference file and go) or as a depth guide (follow all the instructions in the body). The result is confusion and partial compliance.

---

## Minor Flaws (cosmetic)

### m1. Terminology Mandate Contradicts Itself

**SKILL.md:84-85:**
```
| Config file | "config file" | opencode.json, .claude/settings.json |
| Agent | "Agent" | Claude |
```

But the skill body uses `opencode.json` (line 385 in the loaded output from the real skill), references `gcc` (a project-specific tool name), and mentions `ralph-loop` (jargon not defined in the terminology table).

### m2. "Compatibility" Field Banned in SKILL.md But Used in Reference Examples

**SKILL.md:100:** `~~compatibility~~ — BANNED. Do not use.`

**02-frontmatter-standard.md:126:** Shows an example WITH `compatibility: Requires git CLI and Node.js >=20.`

**05-skill-quality-matrix.md:177:** Checklist includes `compatibility is max 500 chars and describes real requirements (if present)`.

The reference files contradict the SKILL.md ban.

### m3. `09-script-authoring.md` Has Duplicate Content

Lines 158-193 repeat the "Key Patterns" table and "Structured Output Pattern" block verbatim from lines 141-157. Lines 308-328 repeat the `init-session.sh` and "Loop Structure" blocks from lines 288-306.

### m4. `03-three-patterns.md` Has Duplicate Decision Tree

The decision tree appears at line 187-197 AND again at line 254-266 with identical content.

### m5. No Concrete "Create Skill from Template" Example

The skill has zero worked examples of the most common task: taking an existing document and converting it into a skill. All examples are about creating from scratch or improving existing skills.

---

## Root Cause Analysis

**The fundamental design flaw is that `use-authoring-skills` was designed for a problem that doesn't exist: large-scale, multi-session skill pack refactoring with formal gates and cross-package coordination.**

The skill's architecture assumes:
1. You are managing a **pack of skills** (not creating one)
2. You have **multiple agents** working in parallel
3. You need **formal gate enforcement** between phases
4. You have **persistent project state** in `.skills-lab/`
5. You are doing **iterative refinement over multiple sessions**

But the most common use case is: **"I have a document, turn it into a skill."** This is a 10-minute, single-agent, single-session task. The skill's entire governance apparatus — 15 operating rules, 6 phase gates, 5-dimension scoring, recovery protocols, cross-package integration tables — is designed for a scenario that almost never happens.

The result: when an agent loads this skill for a simple task, it sees a wall of process language with no clear first step. It ignores the governance (correctly), ignores the routing table (because it doesn't cover the actual scenario), ignores TDD (because it doesn't fit), and just starts writing files — following the simpler `skill-creator` workflow instead.

**The skill is a P3 expertise document masquerading as a P1 router, loaded with phantom dependencies, enforcing gates it cannot enforce, and teaching TDD for a workflow that doesn't need it.**

---

## Recommended Fix Priority

### 1. [HIGHEST] Split into two skills: a thin P1 router + a separate P3 depth guide

**P1 Router (`use-authoring-skills`):** Keep under 200 lines. Contains only:
- "When to Load" decision tree (reduced to 3-4 paths, not 11)
- Pattern selection (P1/P2/P3) with decision tree
- Frontmatter quick reference (name + description rules)
- Links to reference files for depth

**P3 Depth Guide (`skill-authoring-depth` or similar):** Contains all the governance:
- Operating discipline rules
- Gate system (with actual scripts)
- Quality scoring methodology
- Iteration protocols
- Recovery procedures
- Cross-package integration

This fixes the Identity Crisis anti-pattern the skill itself identifies.

### 2. Remove phantom dependencies

Delete references to `skill-judge` and `skill-review` from the "Required Skill Loads" table. Either these skills need to be created, or the table needs to list only skills that actually exist.

### 3. Add a "Convert Document to Skill" pathway

Add a row to "When to Load" that covers the most common scenario:
```
| Converting an existing document/template to a skill | → references/01-skill-anatomy.md + references/02-frontmatter-standard.md + skip TDD (use template-driven workflow) |
```

### 4. Cut Operating Discipline section by 80%

Replace 15 abstract rules with 3 concrete rules:
1. "Before writing, read the source document and identify the skill's single purpose"
2. "Write frontmatter first (name + description), validate it, then write the body"
3. "Run `validate-skill.sh` before declaring done"

### 5. Make gates actually programmatic

Either provide scripts that implement G1-G6, or remove the gate system entirely. Currently it's decorative — it looks rigorous but has no enforcement.

### 6. Resolve contradictions between SKILL.md and reference files

- Remove the `compatibility` field example from 02-frontmatter-standard.md and 05-skill-quality-matrix.md
- Remove duplicate content from 09-script-authoring.md and 03-three-patterns.md
- Ensure terminology is consistent across all files

### 7. Add a worked example of "document → skill" conversion

Include a complete before/after showing a source document transformed into a skill with proper frontmatter, pattern selection, and reference structure. This is the single most useful thing the skill could provide and it's entirely absent.
