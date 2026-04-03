# Failure Analysis: planning-with-files Skill Pack

**Date:** 2026-04-03
**Analyst:** Hivexplorer (Terminal Repository Investigator)
**Source:** Failure transcript `skill-failure-test1.md` + full pack audit
**Verdict:** BLOCK — Multiple structural flaws prevent reliable use

---

## Executive Summary

The `planning-with-files` skill pack is a **theoretical framework masquerading as an operational tool**. It reads well as documentation but fails at every point where an agent needs to act deterministically. The failure transcript proves this: the agent never loaded `planning-with-files` during the skill-creation task (a 5+ phase, multi-file operation that should have triggered it), and instead relied on `use-authoring-skills` + `skill-creator` alone. The planning files existed on disk but were invisible to the agent's decision-making.

---

## Flaw 1: Templates Are Half-Placeholder, Half-Hardcoded-Example

**Severity: HIGH**

The three templates are unusable without heavy editing because they mix placeholder brackets with fully populated example content from a different domain.

### `templates/task_plan.md` (53 lines)
- Lines 1-2: `# Task Plan: [Brief Description]` — placeholder
- Lines 11-15: Phase 1 has **generic checklist items** ("Understand user intent", "Identify constraints") that are meaningless for any specific task
- Lines 17-39: Phases 2-5 have **equally generic items** ("Execute the plan step by step", "Verify all requirements met")
- Lines 42-43: `## Key Questions` has `[Question to answer during the task]` × 2 — literally zero guidance
- The template forces a **5-phase waterfall** (Requirements → Planning → Implementation → Testing → Delivery) that fits zero percent of real tasks. A research task doesn't have "Implementation." A debugging task doesn't have "Delivery."

### `templates/findings.md` (47 lines)
- **Worse:** This template is pre-filled with content from a **Python CLI todo app** tutorial
- Lines 3-10: Hardcoded requirements for a "Command-line interface for managing tasks"
- Lines 13-17: Research findings about Python's `argparse`, `json` module, `UUID4`
- Lines 19-27: Technical decisions table filled with todo-app-specific choices
- Lines 29-33: Issues about `JSONDecodeError` and `argparse` subcommand conflicts
- Lines 36-38: Resources pointing to Python docs and `src/main.py`
- An agent copying this template gets a **fully populated todo-app findings doc** and must delete every line before using it. This is the opposite of a template — it's a completed example disguised as a skeleton.
- Lines 42-43: "Visual/Browser Findings" section with more hardcoded examples about screenshots and API documentation

### `templates/progress.md` (73 lines)
- Same problem: pre-filled with a **Python CLI todo app** session log
- Lines 5-17: Phase 1 complete with specific actions about "argparse subcommand patterns"
- Lines 19-30: Phase 2 with `src/main.py` scaffolding details
- Lines 53-59: Test Results table with `python todo.py add "Buy milk"` test cases
- Lines 67-73: 5-Question Reboot Check filled with "Python CLI todo app with CRUD + JSON persistence"

**Impact:** An agent that follows the "Copy templates to project root" instruction (SKILL.md line 210) gets a todo-app project plan, not a template. The cognitive load to strip all example content exceeds the value of the template. Agents will skip templates entirely and write from scratch — defeating the entire purpose.

---

## Flaw 2: Scripts Produce Trivial Output and One Has a Critical Bug

**Severity: HIGH**

### `scripts/check-complete.sh` — Works but is shallow
- Only counts `**Status:** complete` occurrences vs `### Phase` headers
- Cannot distinguish between a phase that's genuinely done vs one where the agent typed `**Status:** complete` prematurely
- No verification that checkboxes are actually checked — just string matching on the status line
- The fallback to `[complete]` inline format (line 24) is a format the skill itself never documents
- **Tested output:** `[planning-with-files] Task in progress (0/5 phases complete). Update progress.md before stopping.` — correct but trivial

### `scripts/init-session.sh` — Works but creates the broken templates
- Copies the same placeholder-ridden templates verbatim
- Uses `set -e` (line 5) which means any failure in file creation aborts silently — the agent gets no error message
- The `progress.md` template it generates (lines 112-171) uses `$DATE` for the Started field instead of a proper timestamp — produces `**Started:** 2026-04-03` with no time
- **Tested:** Creates 3 files successfully, but all contain the same placeholder/example pollution

### `scripts/session-catchup.py` — Has a critical design bug
- **Bug:** `get_git_changes_since()` (line 48-71) uses `git diff --stat --since={timestamp}` — but `git diff --since` filters by **commit date**, not by file modification time. This means:
  - If the last plan update was at 08:47 and there are uncommitted changes from 09:00, `git diff --since` returns them (correct by accident)
  - If the last plan update was at 08:47 but the last **commit** was at 08:30, `git diff --since=08:47` returns **nothing** even though uncommitted changes exist
  - The script then reports "No uncommitted changes detected" when there actually are changes
- **Tested output:** The script ran and found 6 files changed, but this is because there were recent commits. The `--since` flag is comparing against commit timestamps, not planning file mtimes. The `find_last_plan_update()` function returns file mtime (line 41), but `git diff --since` interprets it as a commit date filter. These are different clocks.
- The "Recommended Actions" section (lines 213-224) is hardcoded decision logic that doesn't account for edge cases like "all phases complete but git shows changes" (which could mean the plan is stale, not that work is done)

---

## Flaw 3: File Schema Is Rigid and Domain-Inappropriate

**Severity: HIGH**

The skill forces a single file schema across all use cases:

### Required sections that don't fit many tasks:
- `task_plan.md` **requires** `## Errors Encountered` table (SKILL.md line 57, ref 01 line 62) — but many tasks complete without errors, leaving an empty table
- `findings.md` **requires** `## Requirements` and `## Research Findings` sections (SKILL.md lines 67-72) — but a debugging task or refactoring task may have neither
- `progress.md` **requires** `## Error Log` table (SKILL.md line 84, ref 01 line 285) — same problem

### The 5-phase waterfall is baked into every template:
1. Requirements & Discovery
2. Planning & Structure
3. Implementation
4. Testing & Verification
5. Delivery

This schema assumes **software development**. It does not fit:
- **Research tasks** (no implementation, no delivery)
- **Debugging** (no requirements phase, no delivery)
- **Skill authoring** (the actual task from the failure transcript — phases would be: analyze existing skills, draft SKILL.md, write references, validate, iterate)
- **Code review** (no implementation, no testing)
- **Documentation** (no implementation in the code sense)

### The skill acknowledges >5 tool calls as a trigger (SKILL.md line 13) but provides no mechanism for dynamically generating appropriate phases. The agent must manually override the template every time.

---

## Flaw 4: Goal-Refresh Mechanism Has No Enforcement

**Severity: CRITICAL**

This is the skill's core value proposition and it is entirely voluntary.

### What the skill claims (SKILL.md lines 100-113):
> "After ~50 tool calls, the original goal drifts out of the attention window"
> "Rule: Re-read `task_plan.md` before every major decision. This is non-negotiable for tasks >10 tool calls."

### What actually happens:
- **No hook enforces this.** The hooks described in `references/04-cross-platform-hooks.md` are **documentation only** — no actual hook config files exist in the skill pack
- The skill has **no `hooks/` directory** (confirmed: glob returned zero results)
- The agent must **remember** to re-read the file. In the failure transcript, the agent made 7+ tool calls across the skill-creation task and never once read `task_plan.md`
- The "goal-refresh" section (references/03-goal-refresh.md) is 136 lines of **explaining why** the agent should re-read the file, but provides no mechanism to make it happen
- The claim "This is why Manus can handle ~50 tool calls without losing track" (ref 03, line 108) is an **unsupported assertion** about a third-party product with no evidence

### The PreToolUse hook (ref 04, lines 48-55) claims to re-read the plan before every tool call:
```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash|Read|Glob|Grep"
      hooks:
        - type: command
          command: "cat task_plan.md 2>/dev/null | head -30 || true"
```
But:
1. This would inject 30 lines of the plan into context **before every single tool call** — burning tokens aggressively
2. The hook config is **YAML in documentation** — not an actual deployable config file
3. OpenCode's actual hook format may not support this matcher syntax (the skill doesn't verify against the real OpenCode schema)

### The "After ~50 tool calls" threshold is arbitrary:
- No evidence is cited for why 50 is the number
- The skill contradicts itself: SKILL.md line 111 says "non-negotiable for tasks >10 tool calls" but ref 03 line 9 says "approximately 50 tool calls"
- The agent has no way to count its own tool calls

---

## Flaw 5: Cross-Platform Hooks Are Documentation, Not Configuration

**Severity: HIGH**

The `references/04-cross-platform-hooks.md` file (232 lines) provides hook examples for 4 platforms but **ships zero actual hook files**:

### What's claimed:
| Platform | Hook Config Location |
|----------|---------------------|
| OpenCode | `.opencode/` hooks |
| Claude Code | `.cursor/hooks/` |
| Gemini CLI | `.gemini/hooks/` |
| Cursor | `.cursor/hooks/` |

### What exists:
- **Nothing.** No `.opencode/hooks/`, no `.cursor/hooks/`, no `.gemini/hooks/`
- The skill describes hook JSON configs and shell scripts but doesn't include them as installable files
- The agent would need to manually create every hook file from the documentation — a multi-step task the skill itself doesn't automate

### Specific problems in the hook documentation:
1. **Claude Code uses `.cursor/hooks/`** (ref 04, line 85) — but Cursor also uses `.cursor/hooks/` (line 166). These are different products sharing the same path. The skill doesn't address this collision.
2. **PowerShell hook references a missing script** (ref 04, line 181): `$checkScript = Join-Path $scriptDir "..\scripts\check-complete.ps1"` — but `check-complete.ps1` **does not exist**. Only `check-complete.sh` exists.
3. **OpenCode hook YAML format** (ref 04, lines 29-77) — the skill doesn't verify this matches OpenCode's actual hook schema. The `matcher` field and nested `hooks` structure may not be valid.
4. **The Stop hook path resolution** (ref 04, line 76): `sh "$(dirname \"$0\")/scripts/check-complete.sh"` — this assumes the hook script lives in a directory adjacent to `scripts/`, which is not how OpenCode hooks are typically structured.

---

## Flaw 6: Duplicate Content Was NOT Fully Eliminated

**Severity: MEDIUM**

The "5-Question Reboot Test" appears in **4 locations** across the pack:

| Location | Heading | Content |
|----------|---------|---------|
| SKILL.md line 183 | `## The 5-Question Reboot Test` | Table format |
| references/02-session-lifecycle.md line 123 | `## The 5-Question Reboot Test` | Table format (identical) |
| templates/progress.md line 66 | `## 5-Question Reboot Check` | Q&A format (different) |
| scripts/init-session.sh line 163 | `## 5-Question Reboot Check` | Q&A format (different) |

The table-format versions (SKILL.md and ref 02) are **identical** — same 5 questions, same answer sources. The Q&A format versions (templates and script) are **different** — they include an "Answer" column instead of "Answer Source."

This means:
- The skill has **two different formats** for the same concept
- An agent reading SKILL.md sees one format, reading progress.md sees another
- The `init-session.sh` script generates the Q&A format into `progress.md`, but SKILL.md describes the table format

**Also duplicated:**
- The anti-patterns table appears in SKILL.md (lines 195-207) and is partially echoed in ref 03 (lines 113-134 as "Common Drift Scenarios")
- The planning cycle diagram (`INIT → PLAN → EXECUTE → UPDATE → VERIFY → COMPACT`) appears in SKILL.md line 36 and is described differently in ref 02's lifecycle states

---

## Flaw 7: No Integration Protocol With Coordinating Skills

**Severity: HIGH**

SKILL.md lines 217-222 list coordinating skills:
```
- `coordinating-loop` — For dispatching subagents and managing iterative cycles
- `user-intent-interactive-loop` — For clarifying requirements before planning
- `gcc` — For git-backed memory across sessions
- `skill-creator` / `writing-skills` — When creating or improving skills
```

This is a **bare list with no integration protocol**. The skill does not answer:

1. **Load order:** Which skill should be loaded first? If `planning-with-files` creates `task_plan.md` and `coordinating-loop` dispatches subagents, which runs first?
2. **State sharing:** If `user-intent-interactive-loop` clarifies requirements, where do those requirements go? Into `findings.md`? Into `task_plan.md`? The skill doesn't say.
3. **Conflict resolution:** If `coordinating-loop` says "dispatch parallel agents" and `planning-with-files` says "work through phases one at a time" (SKILL.md line 41), which wins?
4. **GCC interaction:** If `gcc` provides git-backed memory and `planning-with-files` provides file-based memory, which is the source of truth? What happens when they disagree?

### Evidence from the failure transcript:
The agent loaded `use-authoring-skills` which itself references `planning-with-files` as a dependency (transcript line 54: "Long-running planning → `planning-with-files`"). But the agent **never loaded `planning-with-files`** during the entire skill-creation session. The skill's own dependency graph is not followed by agents because there's no protocol for how skills invoke each other.

---

## Flaw 8: Anti-Patterns Table Lists Problems Without Decision Procedures

**Severity: MEDIUM-HIGH**

The anti-patterns table (SKILL.md lines 195-207) identifies 8 anti-patterns but provides **no algorithm for avoiding them**:

| Anti-Pattern | "Fix" Given | Is It Actionable? |
|-------------|-------------|-------------------|
| Using TodoWrite for persistence | "Use `task_plan.md` file" | Yes, but trivial |
| Stating goals once, never re-reading | "Re-read `task_plan.md` before decisions" | Yes, but unenforced |
| Hiding errors, retrying silently | "Log every error in `task_plan.md`" | Yes, but unenforced |
| Writing web content to `task_plan.md` | "Write external content to `findings.md` only" | Yes, but no validation |
| Starting execution without a plan | "Create `task_plan.md` FIRST" | Yes, but no gate |
| Repeating failed actions | "Track attempts, mutate approach" | Vague — how to track? |
| Creating files in skill directory | "Create planning files in project root" | Yes, but no enforcement |
| Stuffing everything in context | "Store large content in files, keep pointers" | Vague — what counts as "large"? |

The 3-Strike Protocol (SKILL.md lines 154-161) is slightly better — it gives a numbered escalation path. But:
- Attempt 3 says "Question assumptions, search for solutions, consider updating the plan" — this is **three different actions** bundled into one step
- "After 3: Escalate to user" — but the skill doesn't define what "escalate" means. A message? A tool call? A specific format?
- There's no mechanism to **count** attempts across tool calls. The agent must remember how many times it tried something.

### What's missing:
A decision procedure would look like:
```
Before each tool call:
1. Is task_plan.md in my last 5 tool calls? If no, read it.
2. Have I tried this exact action before? Check Errors Encountered table.
3. Is my current phase still in_progress? If no, update status first.
```

The skill describes the **what** but not the **when** or **how to remember**.

---

## Flaw 9: The Failure Transcript Proves the Skill Is Invisible

**Severity: CRITICAL**

The failure transcript (`skill-failure-test1.md`) documents a real session where the agent created a new skill (`opencode-research-orchestrator`) across 5+ phases:
1. Analyzed existing skills (subagent dispatch)
2. Designed the new skill structure
3. Created directory structure
4. Wrote 4 files (SKILL.md + 3 references)
5. Validated structure and frontmatter
6. Ran overlap checks

This is **exactly** the kind of multi-phase, multi-file, >5 tool-call task that `planning-with-files` claims to handle. Yet:

- The agent **never loaded** `planning-with-files`
- The agent **never created** `task_plan.md`, `findings.md`, or `progress.md`
- The agent used `todowrite` (in-memory) for task tracking — the exact anti-pattern the skill warns against
- The agent tracked progress through its own thinking blocks and todo list — both volatile

The skill's trigger phrases include "plan this", "break down", "multi-step", "complex task" (SKILL.md line 14). The agent's thinking blocks contain phrases like "Let me check what skills and patterns are available" and "Let me examine the existing similar skills" — multi-step reasoning that should have triggered planning. It didn't.

**Root cause:** The skill relies on the agent's **self-awareness** to trigger planning. But agents don't have a meta-cognitive layer that says "I'm about to do something complex, I should plan." They react to user prompts. If the user doesn't say "plan this," the skill stays dormant.

---

## Flaw 10: Security Claim Is Unsubstantiated

**Severity: MEDIUM**

The skill claims (SKILL.md line 74, ref 01 line 195):
> "Web/search/browser results go here, NOT in `task_plan.md`. `task_plan.md` is auto-read by hooks; untrusted content there amplifies on every tool call."

This is a **valid security concern** but:
- The hooks that would auto-read `task_plan.md` **don't exist** (see Flaw 5)
- So the amplification attack is theoretical — no hooks means no auto-injection
- The skill creates a security rule for a mechanism it doesn't actually implement
- This is cargo-cult security: defending against a threat that doesn't exist in the current configuration

---

## Summary of Findings

| # | Flaw | Severity | Status |
|---|------|----------|--------|
| 1 | Templates are placeholder/example hybrids, not usable skeletons | HIGH | Confirmed |
| 2 | `session-catchup.py` has critical git timestamp bug; `init-session.sh` creates broken templates | HIGH | Confirmed |
| 3 | File schema forces 5-phase waterfall that fits only software dev | HIGH | Confirmed |
| 4 | Goal-refresh has no enforcement mechanism — entirely voluntary | CRITICAL | Confirmed |
| 5 | Cross-platform hooks are documentation only, zero actual configs shipped | HIGH | Confirmed |
| 6 | Duplicate content (5-Question test in 4 locations, 2 formats) | MEDIUM | Confirmed |
| 7 | No integration protocol with coordinating skills — bare list only | HIGH | Confirmed |
| 8 | Anti-patterns lack decision procedures — no algorithm to avoid them | MEDIUM-HIGH | Confirmed |
| 9 | Skill was invisible in real failure session — proves trigger mechanism broken | CRITICAL | Confirmed |
| 10 | Security rule defends against non-existent threat (hooks don't exist) | MEDIUM | Confirmed |

## Root Cause Analysis

The fundamental flaw is **architectural**: the skill is a **documentation package** pretending to be an **operational system**. It describes mechanisms (hooks, enforcement, integration) that don't exist as deployable artifacts. The agent is expected to:

1. Read the documentation
2. Remember all the rules
3. Self-enforce the discipline
4. Create its own hooks
5. Resolve conflicts between skills
6. Count its own tool calls
7. Know when to re-read files

None of this is automated. The skill's value is proportional to the agent's discipline — and the failure transcript proves the agent has no such discipline when the skill isn't explicitly loaded.
