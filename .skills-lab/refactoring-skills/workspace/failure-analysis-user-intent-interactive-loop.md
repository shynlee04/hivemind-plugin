# Failure Analysis: user-intent-interactive-loop

**Date:** 2026-04-03
**Source:** skill-failure-test1.md (real session transcript)
**Skill Pack:** `.skills-lab/refactoring-skills/user-intent-interactive-loop/`
**Severity:** Critical — skill failed to prevent the actual failure mode observed

---

## Executive Summary

The `user-intent-interactive-loop` skill pack is a well-structured but fundamentally **generic** framework that describes *what* an interactive loop should do without providing enough *how* to prevent the specific failure that occurred. In the test session, the agent loaded two skill-authoring skills, understood the user's intent, and then immediately proceeded to execute — bypassing every single phase of the interactive loop this skill is supposed to enforce. **None of the anti-patterns, decision matrices, or probe protocols in this skill prevented the agent from skipping intent capture entirely.**

---

## Flaw 1: Probe Phase Is Generic — No Domain-Specific Question Selection

**Severity: HIGH**

The skill lists 5 question types in a table (SKILL.md:47-53) with generic examples:

```
| Scope boundary | "Should this include X, or focus only on Y?" |
| Success criteria | "What does 'working' look like for this?" |
```

**The problem:** When the user says "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md", the agent has **no guidance** on which question type to ask first, or what skill-creation-specific questions to ask. The reference file `01-question-protocols.md` provides a fixed 6-turn sequence (lines 113-120):

```
Turn 1:  Scope boundary (what are we building?)
Turn 2:  Success criteria (how do we know it's done?)
Turn 3:  Constraint check (what limits our approach?)
Turn 4:  Priority signal (what matters most?)
Turn 5:  Delegation appetite (how should I work?)
Turn 6:  Intent confirmation (did I understand correctly?)
```

This is a **rigid template** that assumes every interaction starts from zero ambiguity. For "I want to create a skill like this [file reference]", the scope is already partially bounded (the file exists), the success criteria is implied (replicate the pattern), and the constraint is implicit (follow the same format). The agent should recognize this and **compress the probe sequence** — but the skill gives no examples of what compressed probing looks like for skill creation specifically.

**Evidence from transcript:** The agent never asked a single probing question. It went straight to loading skills and dispatching subagents. The skill's anti-pattern "The Premature Executor" (SKILL.md:183) names this behavior but provides no mechanism to *prevent* it — only to *label* it after the fact.

---

## Flaw 2: No Skill-Specific Probing Examples

**Severity: HIGH**

The worked examples in `01-question-protocols.md` cover:
- "I want to improve our testing" (generic dev task)
- "Add a circuit breaker to the session API" (specific implementation task)
- "Build a dashboard for the metrics" → pivots to "CLI tool to export data" (scope change)

**Zero examples** cover:
- "I want to create a skill"
- "Clone this pattern into a new skill"
- "Turn this document into a reusable skill"

The SKILL.md's own "Good: Iterative Probing" example (SKILL.md:189-195) uses "I want to improve the skill system" — which is about *improving* skills, not *creating* them. This is a critical gap because skill creation involves unique considerations:

- Which existing skills does this overlap with?
- What pattern (P1/P2/P3) should it use?
- Where should it be installed?
- Does it need reference files or scripts?
- Should it follow TDD with evals?

The skill tells the agent to "probe" but gives it no domain vocabulary for probing about skill creation. The agent fills the gap by loading `use-authoring-skills` and `skill-creator` — which is correct — but then **skips the interactive loop entirely** and goes straight to execution. The skill has no "if the user wants to create a skill, do X before loading other skills" gate.

---

## Flaw 3: Delegation Rules Conflict with User Mandate

**Severity: MEDIUM-HIGH**

The decision matrix in SKILL.md:83-89 says:

```
| Task is well-scoped, independent | Dispatch subagent |
```

But the user's AGENTS.md mandates (via the `use-authoring-skills` skill loaded during the session):

> **NEVER edit skill files directly as coordinator** — Coordinator role is PLAN + DELEGATE, not execute. Must not pollute skill files. (HARD RULE)

And from CLAUDE.md:
> No execution of code changes, creation or removal are tolerable without a plan.

The `user-intent-interactive-loop` skill tells the agent to decide between "execute directly" and "delegate" based on task granularity (SKILL.md:74-79). It does **not** account for the scenario where the agent is a Coordinator that is **forbidden from executing** certain classes of work (skill file edits). The decision matrix should have a row like:

```
| Task is skill file creation/edit AND agent is Coordinator | Delegate to writer subagent |
```

Instead, the agent sees "Single file change → Execute directly" and proceeds to write skill files itself. In the transcript, the Coordinator writes SKILL.md and 3 reference files directly — violating the mandate that coordinators should not edit skill files.

**The coordinating-loop skill** (which this skill cross-references as a "sibling") explicitly states: "The Coordinator NEVER executes directly" — but `user-intent-interactive-loop` doesn't reinforce this constraint in its own decision matrix.

---

## Flaw 4: Session Persistence Is Theoretical — No Concrete Paths

**Severity: MEDIUM**

The Session Persistence Protocol (SKILL.md:142-155) says:

```
| What to Persist | Where | When |
|-----------------|-------|------|
| User's stated intent | progress.md or session notes | Every confirmation |
| Current phase + step | task_plan.md | Every phase change |
```

**Where?** It doesn't say. Not `.opencode/research/`, not project root, not `.skills-lab/workspace/`. The `planning-with-files` skill (which this references) says "project root" but that's ambiguous when the project has multiple root-level directories.

In the failure transcript, the agent **never wrote a single persistence file**. No `progress.md`, no `task_plan.md`, no `findings.md`. The skill says "write to disk every turn" but:

1. Doesn't specify the directory path
2. Doesn't provide a file template the agent can copy-paste
3. Doesn't tell the agent to check if files already exist before creating new ones
4. Doesn't explain what happens if the agent writes to the wrong location

The `02-context-preservation.md` reference file (lines 43-78) provides template structures but again — no concrete paths. The `04-long-session-management.md` reference (line 84-95) provides a checkpoint template but again — no path.

**Compare to `use-authoring-skills`** which explicitly says (line 253-260):
> "For long-running multi-session work, maintain three files at **project root**"

Even that is vague. The `user-intent-interactive-loop` skill should specify: "Write to `<workspace-root>/.opencode/skills/<skill-name>-workspace/`" or similar.

---

## Flaw 5: Scripts Are Broken — intent-verify.sh Has a Runtime Bug

**Severity: MEDIUM**

Both scripts pass `bash -n` syntax check, but `intent-verify.sh` has a **runtime bug** that causes a crash:

```
.skills-lab/refactoring-skills/user-intent-interactive-loop/scripts/intent-verify.sh: line 116: [: 0
0: integer expression expected
```

**Root cause** (intent-verify.sh:113-116):
```bash
COMPLETED_PHASES="$(grep -c -E '\*\*Status:\*\* complete' "$TASK_PLAN_FILE" 2>/dev/null || echo "0")"
IN_PROGRESS_PHASES="$(grep -c -E '\*\*Status:\*\* in_progress' "$TASK_PLAN_FILE" 2>/dev/null || echo "0")"

if [ "$COMPLETED_PHASES" -eq 0 ] && [ "$IN_PROGRESS_PHASES" -eq 0 ]; then
```

When `grep -c` finds no matches, it returns `0` with exit code 1. The `|| echo "0"` then **also** fires, producing `"0\n0"` (two lines). The `-eq` comparison fails because `"0\n0"` is not a valid integer.

**session-checkpoint.sh** runs successfully (EXIT: 0) but has a cosmetic issue: it uses emoji characters (`⚠`) on lines 58, 63, 72 which may not render correctly in all terminal environments. More importantly, it relies on `sed` patterns that assume `task_plan.md` has a `## Current Phase` header — but the template in `02-context-preservation.md:46` uses `## Current Phase: [Phase name]` (with colon inline), while the sed pattern on session-checkpoint.sh:69 looks for `^## Current Phase` as a section header. These are inconsistent.

**Neither script is referenced from the SKILL.md body.** The skill pack includes scripts but never tells the agent to use them. They're dead code.

---

## Flaw 6: Anti-Patterns Don't Cover the Actual Failure

**Severity: CRITICAL**

The failure transcript shows this sequence:

1. User: "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"
2. Agent loads `use-authoring-skills`
3. Agent loads `skill-creator`
4. Agent dispatches subagent to examine existing skills
5. Agent proceeds to **create the skill directly** — no probing, no confirmation, no persistence

The skill's anti-patterns (SKILL.md:172-183):

| # | Anti-Pattern | Covers This Failure? |
|---|-------------|---------------------|
| 1 | The Interrogator | No — opposite problem (too few questions) |
| 2 | The Yes-Agent | Partially — "accepting vague requests without probing" |
| 3 | The Abandoner | No — agent didn't delegate and disappear |
| 4 | The Amnesiac | No — agent didn't lose context |
| 5 | The Micromanager | No |
| 6 | The Silent Worker | No — agent was communicative |
| 7 | The Scope Creep | No |
| 8 | The Orphan Dispatcher | No |
| 9 | The Context Hoarder | No |
| 10 | **The Premature Executor** | **Yes — "Acting before understanding. Probe first, always."** |

Anti-pattern #10 **does** name the failure. But it's buried at position 10 of 10, with no enforcement mechanism. The skill has no **gate** that says "before any file write, verify you have completed the PROBE phase." The anti-pattern is descriptive, not prescriptive.

Additionally, there is **no anti-pattern** for the specific failure of "loading related skills but then ignoring the loaded skill's instructions." The agent loaded `use-authoring-skills` which has a 6-phase gate system (G1-G6, see transcript lines 170-188), but the agent skipped all gates and went straight to implementation. The `user-intent-interactive-loop` skill should have an anti-pattern like:

> **The Skill Ignorer** — Loads a skill for its file list but bypasses its workflow. If you load a skill with gates or phases, you must follow them.

---

## Flaw 7: No Loop Termination Condition

**Severity: HIGH**

Phase 6 (SKILL.md:115-124) is titled "REPEAT — Loop Until Done":

```
After each phase, check:
1. Is the user's intent still being served?
2. Has anything changed (new constraints, new info)?
3. Are we closer to the success criteria?
4. Should we delegate, execute, or probe more?

If any answer is unclear → return to PROBE.
```

**Problems:**

1. **"Loop Until Done"** — "Done" is never defined. The `01-question-protocols.md` stop conditions (lines 130-147) define when to stop *probing*, but not when to stop the *entire loop*.

2. **No terminal state.** The loop has no "exit" condition. The four checks are all about whether to continue or return to PROBE — none say "the loop is complete, deliver results."

3. **The `04-long-session-management.md` reference** has budget enforcement (lines 48-63) with 75%/90% warnings, but these are turn-budget warnings, not completion criteria. A session could hit 90% of its turn budget without ever reaching a "done" state.

4. **No explicit handoff to delivery.** After the loop ends, what happens? The skill doesn't say. The agent should transition to a "deliver" phase, but there's no Phase 7.

Compare to the `coordinating-loop` skill which has explicit gates with pass criteria:
```
| G5: Verify | Gates pass | All acceptance criteria met | scripts/coordination-check.sh |
```

The `user-intent-interactive-loop` skill has no equivalent verification gate.

---

## Flaw 8: Cross-Reference Is Circular But Not Problematic

**Severity: LOW (not a loading loop, but a responsibility gap)**

The cross-references are:

- `user-intent-interactive-loop` → `coordinating-loop`: "Sibling skill in GROUP 1. Handles orchestration patterns; this skill handles user engagement." (SKILL.md:234)
- `coordinating-loop` → `user-intent-interactive-loop`: "Captures user intent before coordination begins." (coordinating-loop/SKILL.md:158)

This is **not** a circular dependency in the loading sense — neither skill requires the other to be loaded first. But it **is** a responsibility gap:

- `user-intent-interactive-loop` says coordinating-loop handles "orchestration patterns"
- `coordinating-loop` says user-intent-interactive-loop handles "intent capture before coordination"

**Neither skill defines the boundary.** When does intent capture end and coordination begin? In the failure transcript, the agent loaded intent-capture skills, understood the intent, and then... went straight to execution. It never transitioned to coordination. The handoff point between these two skills is undefined.

The `user-intent-interactive-loop` skill should specify: "When intent is confirmed and work is scoped, load `coordinating-loop` to plan execution." It does not.

---

## Flaw 9: Missing — No "Load Order" Enforcement

**Severity: MEDIUM**

The skill lists "Required Skill Loads" (SKILL.md:12-21) as a table:

```
| Purpose | Skills |
| Parallel dispatch | dispatching-parallel-agents |
| File-based planning | planning-with-files |
| Deep investigation | deep-research or deep-investigation |
| Git-backed memory | gcc |
| Skill creation | skill-creator, writing-skills |
```

But it never says **when** to load each one. The `use-authoring-skills` skill (which the agent actually loaded in the test) has a much more actionable "When to Load" table that maps specific situations to specific reference files. The `user-intent-interactive-loop` skill's table just says "if you need X, load Y" — but the agent in the test session needed skill creation guidance and loaded `use-authoring-skills` and `skill-creator` **instead of** following the interactive loop.

The skill should say: "Before loading any other skill, complete the PROBE phase. The interactive loop owns the user relationship — other skills are tools you use *within* the loop, not replacements for it."

---

## Flaw 10: Description Triggers Are Too Narrow

**Severity: MEDIUM**

The skill's description (SKILL.md:3):

```
Triggers on: "figure out what I want", "help me think through", "keep going with this",
"what should we do next", "stay focused on", "don't lose track of", "delegate this",
"keep me updated", "long session", "interactive loop"
```

The user's actual message was: **"I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"**

None of the trigger phrases match this. The skill would not have been auto-selected by the platform's skill matching. It was only available in the `available_skills` list because it's installed locally. The `use-authoring-skills` skill won the trigger competition because its description includes "Creating a new skill from scratch" — which directly matches the user's intent.

The `user-intent-interactive-loop` skill should include trigger phrases like: "I want to create", "help me build", "let's work on this together", "I need help figuring out" — or it should accept that it's a **meta-skill** that gets loaded by other skills (as `use-authoring-skills` does in its GROUP 1 Dependencies section, line 365).

---

## Summary Table

| # | Flaw | Severity | File | Lines |
|---|------|----------|------|-------|
| 1 | Probe phase too generic, no domain-specific question selection | HIGH | SKILL.md, 01-question-protocols.md | SKILL.md:47-53, ref:113-120 |
| 2 | No skill-creation-specific probing examples | HIGH | 01-question-protocols.md | ref:200-263 (all examples generic) |
| 3 | Delegation matrix conflicts with Coordinator mandate | MEDIUM-HIGH | SKILL.md | 74-89 |
| 4 | Persistence protocol has no concrete file paths | MEDIUM | SKILL.md, 02-context-preservation.md | SKILL.md:142-155 |
| 5 | intent-verify.sh runtime bug (grep -c produces multiline output) | MEDIUM | scripts/intent-verify.sh | 113-116 |
| 6 | Anti-patterns don't prevent the actual failure mode | CRITICAL | SKILL.md | 172-183 |
| 7 | No loop termination condition or delivery phase | HIGH | SKILL.md | 115-124 |
| 8 | Cross-reference boundary with coordinating-loop undefined | LOW | SKILL.md, coordinating-loop/SKILL.md | SKILL.md:234, coord:158 |
| 9 | No load-order enforcement for required skills | MEDIUM | SKILL.md | 12-21 |
| 10 | Description triggers too narrow for actual use cases | MEDIUM | SKILL.md | 3 |

---

## Root Cause Diagnosis

The fundamental flaw is that `user-intent-interactive-loop` is a **process description** masquerading as an **enforcement mechanism**. It tells the agent what a good interactive loop looks like but provides no gates, no hooks, no scripts, and no decision rules that would *force* the agent to follow the loop when under pressure to execute.

In the failure transcript, the agent was under no pressure — it had time, context, and the right skills loaded. It still skipped the loop because:

1. The loaded skills (`use-authoring-skills`, `skill-creator`) had more specific, actionable instructions
2. The `user-intent-interactive-loop` skill has no mechanism to assert priority over other loaded skills
3. The anti-pattern that names the failure ("The Premature Executor") is the last item in a list of 10, with no enforcement

The skill needs **gates**, not just **guidance**. It needs to say: "Do not write any files until the PROBE phase is complete and the user has confirmed." It needs a concrete checklist, not a conceptual framework.
