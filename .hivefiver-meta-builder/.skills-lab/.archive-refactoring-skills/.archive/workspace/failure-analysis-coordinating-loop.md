# Failure Analysis: coordinating-loop Skill Pack

**Date:** 2026-04-03
**Analyst:** Terminal Repository Investigator
**Subject:** Post-mortem of skill-failure-test1 — "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"

---

## Executive Summary

The coordinating-loop skill pack **failed to activate** during a real skill-authoring session. The user asked to create a skill modeled on a repomix deep-research command. The coordinator agent loaded `use-authoring-skills` and `skill-creator` but **never loaded `coordinating-loop`**. The agent proceeded to dispatch work without any coordination framework, no hand-off protocol, no execution-mode decision, and no parent-child cycle management.

This analysis identifies **12 distinct flaws** across the SKILL.md, all 4 reference files, and both scripts. The pack is structurally complete but operationally hollow — it lists concepts without teaching the agent how to act on them.

---

## Flaw 1: SKILL.md is Too Thin at 173 Lines — Lists Concepts, Doesn't Teach Coordination

**Evidence:** `SKILL.md` line 1-173

The file is 173 lines. Of those, approximately 60 lines are tables, lists, and cross-references that point to reference files. Only ~30 lines contain actual procedural guidance.

The SKILL.md body reads like a **table of contents for a coordination course**, not a coordination course itself. Compare to `use-authoring-skills` (886+ lines), which contains:
- Concrete operating discipline rules (15 numbered, labeled MANDATORY/HARD RULE/CRITICAL)
- A phase gate system with specific measures and pass criteria
- TDD methodology with RED-GREEN-REFACTOR steps
- Quality scoring with weighted dimensions and release thresholds
- Recovery protocol with exact file paths and git commands
- Anti-patterns with 11 named items

The coordinating-loop SKILL.md has:
- A 6-step loop summary (lines 39-48) with no detail on *how* to execute each step
- A 10-line decision flowchart (lines 54-65) that is incomplete (see Flaw 2)
- A 6-element hand-off table (lines 78-86) that is a checklist, not a protocol
- A 5-row gate table (lines 94-99) that references scripts that don't work independently (see Flaw 5)
- A 5-bullet parent-child summary (lines 109-115) with no construction guidance

**Verdict:** The SKILL.md is a routing shell (P1 pattern) pretending to be a domain skill (P2). An agent reading this knows *what* coordination is but has no idea *how* to coordinate.

---

## Flaw 2: Decision Flowchart Is Incomplete and Has Dead Ends

**Evidence:** `SKILL.md` lines 54-65

```
Multiple tasks? → No → Execute directly
  ↓ Yes
Tasks independent (no shared state, no file overlap)? → No → Sequential
  ↓ Yes
Tasks touch same files or resources? → Yes → Sequential
  ↓ No
Tasks have different root causes or domains? → No → Sequential (investigate together)
  ↓ Yes
3+ tasks? → Yes → Parallel dispatch
  ↓ No (1-2 tasks) → Sequential (overhead not worth it)
```

**Problems:**

1. **Redundant check:** Line 57 already checks "no shared state, no file overlap" — line 59 re-checks "touch same files or resources." This is the same criterion stated differently. If line 57 says Yes (independent), line 59 can never be Yes (touching same files). This is logically impossible.

2. **The "different root causes" gate is unactionable:** How does an agent determine "different root causes" before investigation? This requires the agent to already know the answer to the problem it's trying to solve.

3. **No recovery path:** What if the agent later discovers tasks it thought were independent are actually related? The flowchart has no "reassess" branch.

4. **No guidance on what to do AFTER the decision:** The flowchart ends at "Parallel dispatch" or "Sequential" but doesn't say what the agent should *do* next — construct envelopes? Set budgets? Launch agents?

The reference file `02-sequential-vs-parallel.md` (167 lines) is better but still doesn't fix the flowchart's logical contradiction.

---

## Flaw 3: Hand-off Protocol is a Checklist, Not a Protocol

**Evidence:** `SKILL.md` lines 74-87, `references/01-handoff-protocols.md` lines 1-155

The SKILL.md hand-off section is a 6-row table listing elements (task description, scope boundaries, context, etc.) with examples. It tells the agent *what* to include but not:

- **How to construct the prompt:** There is no template the agent can fill in. The reference file has a Task Envelope template (lines 28-44) but the SKILL.md doesn't point the agent to read it *at the moment of dispatch*.
- **How much context is "enough":** The reference file's Context Payload table (lines 50-57) is useful but the SKILL.md summary doesn't include it.
- **What to do when the child returns:** The SKILL.md says "Monitor" and "Integrate" but gives no procedure for reviewing child output against the original envelope.

The reference file `01-handoff-protocols.md` is actually decent (155 lines, has anti-patterns, multi-agent chains, receipt confirmation). But the SKILL.md doesn't surface any of this. It just says "→ Full protocol: references/01-handoff-protocols.md" — which means the agent must *choose* to read the reference file. In practice, agents skip references unless explicitly told to.

**Critical gap:** No worked example. There is no example of a complete hand-off from parent to child for a real task. The reference file has templates but no end-to-end example showing: "Here's what the parent writes, here's what the child receives, here's what the child returns."

---

## Flaw 4: Ralph-Loop Integration is Vague — Mentions But Doesn't Teach

**Evidence:** `SKILL.md` lines 91-103, `references/04-ralph-loop-integration.md` lines 1-297

The SKILL.md's ralph-loop section is a 5-row gate table referencing two scripts. It says:

> "All gates must pass before proceeding. Failure in any gate loops back to that phase."

This is a statement of *what* the loop does, not *how* to run it. The agent needs to know:

1. **How to define user stories** for a skill-creation workflow (not generic software development)
2. **How to map coordination gates to actual skill-authoring phases** — the reference file maps to `.stories/*.json` files, but skill authoring doesn't use story files
3. **How to actually invoke the hooks** — the reference file has `pre-dispatch.sh`, `post-completion.sh`, `stop.sh` but these are *scripts the agent is supposed to run*. The SKILL.md doesn't tell the agent to run them, when to run them, or what to do if they fail.
4. **How to handle the state JSON** — the reference file shows a state format (lines 233-255) but doesn't tell the agent who writes it, when, or how to read it on recovery.

The reference file includes scripts (`check-complete.sh`, `init-session.sh`) that are **not part of the skill pack's `scripts/` directory**. They're embedded as code blocks in the reference file. The agent would need to extract them manually.

**Critical gap:** The ralph-loop reference is written for a *generic software development* workflow (user stories, acceptance criteria, phase verification). It is not adapted to the *skill authoring* workflow that the coordinating-loop is supposed to support. There is no mapping like: "When creating a skill, your user stories are: SKILL.md exists, references are linked, scripts run, evals pass."

---

## Flaw 5: Scripts Don't Produce Useful Output Without Pre-existing Infrastructure

**Evidence:** `scripts/coordination-check.sh` (108 lines), `scripts/loop-status.sh` (125 lines)

Both scripts require:
1. A `.coordination/` directory to exist
2. A session subdirectory within it
3. `task_plan.md`, `findings.md`, `progress.md` files with specific format strings

**Test results:**

```
$ bash coordination-check.sh
[coordination-check] ERROR: No sessions found in .coordination
EXIT: 1

$ bash loop-status.sh
[loop-status] ERROR: No sessions found in .coordination
EXIT: 1
```

Both scripts fail silently (just an error message) when no session exists. They provide **zero guidance** on how to create a session. The `init-session.sh` script that *would* create a session exists only as an embedded code block in `references/04-ralph-loop-integration.md` (lines 82-127) — it is **not in the `scripts/` directory**.

**When a session does exist**, the scripts work but produce superficial output:

- `coordination-check.sh` only checks file existence and phase name validity. It does NOT check if the content is meaningful, if gates actually passed, or if child results are valid.
- `loop-status.sh` uses `grep` for keywords like "complete", "passed", "done" in `progress.md`. A progress file containing "ASSESS is not done yet" would match "done" and report the gate as passed. This is a **false positive vulnerability**.

**Critical gap:** Neither script can be run as a standalone validation. They are entirely dependent on the `planning-with-files` skill's output format. If the agent isn't using `planning-with-files`, the scripts are useless. The SKILL.md doesn't mention this dependency.

---

## Flaw 6: No Concrete Worked Example

**Evidence:** Entire skill pack — no worked example exists

There is **zero** worked example in the entire pack showing:

- How to coordinate 3 subagents through a skill creation workflow
- What the parent's dispatch prompt looks like
- What the child's response should look like
- How the parent integrates multiple child outputs
- What happens when one child fails and the other succeeds

Compare this to `skill-creator` which includes:
- Complete eval JSON schemas
- Exact bash commands for running the eval viewer
- Step-by-step iteration loop with directory structures
- Claude.ai and Cowork adaptation sections

The coordinating-loop pack has **no adaptation sections** for different platforms. It assumes the agent has access to bash scripts, a `.coordination/` directory, and the `planning-with-files` skill. If any of these are missing, the agent has no fallback.

---

## Flaw 7: Parent-Child Cycle is Abstract — Doesn't Teach Prompt Construction

**Evidence:** `SKILL.md` lines 107-118, `references/03-parent-child-cycles.md` lines 1-182

The SKILL.md says:

> "Never let child agents inherit the parent's full session history. Construct exactly what each child needs."

This is a **prohibition without instruction**. It tells the agent what NOT to do but not HOW to do the right thing.

The reference file `03-parent-child-cycles.md` has a prompt template (lines 46-66):

```markdown
You are a specialized agent tasked with: <task description>

## Context
<Only the information needed for this task>
...
```

But this template has **placeholder text** (`<task description>`, `<Only the information needed for this task>`). It doesn't show a *filled-in* example. An agent reading this still doesn't know what "only the information needed" means in practice.

**Specific gaps:**

1. **No guidance on context filtering:** How does the parent decide what context to include vs exclude? The reference file has a table (lines 50-57 in `01-handoff-protocols.md`) but no algorithm.
2. **No budget construction:** The reference file mentions "Token budget: Inherited from session" (line 143) but doesn't tell the parent how to set or enforce it.
3. **No integration procedure:** After children return, the parent must "Write integration report" (line 99) but there's no template or example of what this report looks like.
4. **No failure classification guide:** The reference file distinguishes "retryable" vs "escalation" failures (lines 107-133) but the criteria are vague: "The task is fundamentally unclear" — how does an agent judge this?

---

## Flaw 8: Recovery Protocol is Useless Without Pre-existing State

**Evidence:** `SKILL.md` lines 165-173

```
When coordination state is lost or session interrupted:

1. Run `scripts/loop-status.sh` — What phase were we in?
2. Run `scripts/coordination-check.sh` — What gates passed?
3. Read `progress.md` (if using `planning-with-files`) — What was decided?
4. Re-assess remaining work from current state, not from memory.
5. Resume from the last passed gate.
```

**Problems:**

1. **Step 1 and 2 fail if `.coordination/` doesn't exist** — which it won't if the session was interrupted before initialization. The scripts exit with code 1 and print an error. They provide no recovery information.
2. **Step 3 is conditional** — "if using `planning-with-files`." If the agent wasn't using that skill, there is no `progress.md`. The protocol has no fallback.
3. **Step 4 is a platitude** — "Re-assess remaining work from current state" is not an actionable instruction. It's advice, not a protocol.
4. **Step 5 assumes gates were tracked** — If the agent didn't write gate status to disk (which the scripts require), there is no "last passed gate" to resume from.

**What a real recovery protocol needs:**
- A git-based recovery path (check `git log` for recent commits, read changed files)
- A filesystem scan for partial outputs (find `*.md` files modified in last N minutes)
- A decision tree for "what phase am I in?" based on observable artifacts
- A bootstrap procedure for when *nothing* exists (start from scratch with user context)

The `use-authoring-skills` skill has a better recovery protocol (lines 293-309): it reads specific files, runs `git log --oneline -5`, runs `git status`, and has a 5-question recovery framework. The coordinating-loop protocol is inferior to the skill it depends on.

---

## Flaw 9: Circular Dependency on `planning-with-files` Without Acknowledgment

**Evidence:** `SKILL.md` lines 18, 171; `references/04-ralph-loop-integration.md` lines 297

The coordinating-loop skill:
- Lists `planning-with-files` as a required skill (line 18)
- References `progress.md` in its recovery protocol (line 171)
- Depends on `task_plan.md` format for its scripts to work

But the SKILL.md never tells the agent:
- **When to load `planning-with-files`** — is it always required, or only for long-running sessions?
- **What to do if `planning-with-files` is not available** — is there a fallback?
- **How the two skills' file formats align** — does `planning-with-files` produce the exact format the coordination scripts expect?

The scripts assume `task_plan.md` contains `## Current Phase: <PHASE>` — this is the format produced by `init-session.sh` (embedded in reference file, not shipped). If `planning-with-files` produces a different format, the scripts silently fail to extract the phase.

---

## Flaw 10: Anti-Patterns List is Good But Unactionable

**Evidence:** `SKILL.md` lines 140-149

The 8 anti-patterns are well-named and accurately described:
1. The Broadcast
2. The Fire-and-Forget
3. The False Parallel
4. The Orphan Loop
5. The Context Leak
6. The Silent Failure
7. The Coordinator Executor
8. The Infinite Retry

But they are **descriptions of problems without detection procedures**. An anti-pattern list should tell the agent:

- How to detect if you're committing the anti-pattern *before* it happens
- What the early warning signs are
- What the corrective action is

For example, "The False Parallel" says "Dispatching parallel agents for related tasks that share state or files." The corrective action should be: "Before dispatching, run the independence criteria from `references/02-sequential-vs-parallel.md` — if any criterion fails, do not dispatch in parallel."

---

## Flaw 11: Gate System is Decorative, Not Enforceable

**Evidence:** `SKILL.md` lines 91-103

The 5 gates (G1-G5) reference `scripts/coordination-check.sh` for G1, G3, and G5. But:

- **G2 (Dispatch):** "Each agent has focused prompt" — no script, no measurable criterion. How does the agent verify this?
- **G4 (Integrate):** "No conflicts, validation passes" — no script, no definition of "conflicts" or "validation."
- **G1 and G5 use the same script** (`coordination-check.sh`) but the script doesn't differentiate between assess and verify phases — it just checks file existence and phase name.

The gate system *looks* programmatic but is actually subjective. The script checks are necessary but not sufficient — they verify infrastructure exists, not that coordination actually happened.

---

## Flaw 12: No Platform Adaptation — Assumes Full Tool Access

**Evidence:** Entire skill pack

The `skill-creator` skill has dedicated sections for:
- Claude.ai (no subagents, no browser)
- Cowork (subagents, no browser, different feedback mechanism)

The coordinating-loop skill has **no platform adaptation**. It assumes:
- Bash script execution is available
- `.coordination/` directory can be created
- `planning-with-files` skill is loaded
- Subagent dispatch is available
- File system writes are permitted

If any of these are unavailable (e.g., a restricted environment, a platform without subagents, a read-only filesystem), the agent has no fallback guidance.

---

## Summary Table

| # | Flaw | Severity | Location | Fix Required |
|---|------|----------|----------|-------------|
| 1 | Too thin — lists concepts, doesn't teach | **Critical** | SKILL.md | Expand to 300+ lines with procedural guidance |
| 2 | Decision flowchart has logical contradiction | **High** | SKILL.md:54-65 | Fix redundant check, add reassessment path |
| 3 | Hand-off is checklist, not protocol | **High** | SKILL.md:74-87 | Add filled-in example, surface reference content |
| 4 | Ralph-loop vague — mentions but doesn't teach | **High** | SKILL.md:91-103, ref 04 | Map to skill-authoring workflow, ship hooks as scripts |
| 5 | Scripts require pre-existing infrastructure | **High** | scripts/*.sh | Ship init-session.sh, add bootstrap mode |
| 6 | No concrete worked example | **Critical** | Entire pack | Add end-to-end 3-agent coordination example |
| 7 | Parent-child abstract — no prompt construction | **High** | SKILL.md:107-118, ref 03 | Add filled-in prompt template, context filtering guide |
| 8 | Recovery protocol useless without state | **Critical** | SKILL.md:165-173 | Add git-based recovery, filesystem scan, bootstrap |
| 9 | Circular dependency on planning-with-files | **Medium** | SKILL.md:18, 171 | Acknowledge dependency, add fallback |
| 10 | Anti-patterns unactionable | **Medium** | SKILL.md:140-149 | Add detection procedures and corrective actions |
| 11 | Gate system decorative, not enforceable | **Medium** | SKILL.md:91-103 | Add measurable criteria for G2/G4, differentiate scripts |
| 12 | No platform adaptation | **Medium** | Entire pack | Add Claude.ai/Cowork/no-subagent fallbacks |

---

## Root Cause Analysis

The coordinating-loop skill pack suffers from **abstraction debt**. Every section describes *what* coordination is rather than *how* to coordinate. The pack was written as a reference manual for a human who already knows coordination, not as an operational guide for an agent that needs to execute coordination in real time.

The test session failure confirms this: when the agent needed to coordinate skill creation work, it had no procedural guidance to follow. It fell back to the `skill-creator` skill's built-in coordination guidance (which is embedded in the eval workflow) and ignored `coordinating-loop` entirely — because `coordinating-loop` had nothing actionable to offer.

**The pack's fundamental problem:** It is a map of coordination territory, not a vehicle for traversing it.
