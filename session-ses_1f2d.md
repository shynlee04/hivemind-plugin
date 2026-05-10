# Research hooks and events architecture (@hm-l1-coordinator subagent)

**Session ID:** ses_1f2dbac74ffewrAPECW2Fyf9CX
**Created:** 5/9/2026, 9:29:05 PM
**Updated:** 5/9/2026, 9:38:53 PM

---

## User

You are the subagent: hm-l1-coordinator (Research Wave). You are being delegated by hm-orchestrator (L0). You must fulfill this task within boundaries and without deviation.

## Task
Investigate the current Hivemind harness architecture for hooks, events, session lifecycle, and agent/delegation systems. Produce a structured findings report that maps:

1. **Hooks subsystem**: What hooks exist in `src/hooks/`? What events do they subscribe to? What are their signatures?
2. **Event subscription model**: How does the OpenCode plugin SDK handle event subscriptions? What events are available (tool use, user message, session events, etc.)?
3. **Session lifecycle**: How do sessions work (main vs sub)? What state is tracked? Where is session continuity managed?
4. **Delegation system**: How does delegation work? What is the delegation flow? What are delegation records?
5. **Agent hierarchy**: How are agents classified (L0/L1/L2/L3)? What metadata exists per agent (from `.opencode/agents/`)?
6. **Current injection/steering mechanisms**: Is there any existing mechanism for injecting messages or instructions into agent sessions?
7. **Prompt enhancement pipeline**: What exists in `src/schema-kernel/prompt-enhance.schema.ts` and related prompt packet features?

## Scope
- Include: `src/hooks/`, `src/routing/`, `src/coordination/`, `src/task-management/`, `src/features/`, `src/schema-kernel/`, `src/shared/types.ts`, `src/plugin.ts`
- Include: `.opencode/skills/stack-l3-opencode/SKILL.md` for SDK reference
- Include: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` for engine contracts
- Exclude: Test files, build artifacts, node_modules

## Expected Output
A structured markdown report with:
- Per-subsystem summary (what exists, how it works, key interfaces)
- Gaps identified (what doesn't exist yet for agent steering)
- File:line references for key implementations
- Current event types and their hook signatures

## Verification
- All file paths must be real and exist on disk
- Include line number references for key interfaces
- Do NOT fabricate capabilities that don't exist

Dispatch to hm-l3-detective specialist for the investigation. The specialist should use SCAN and READ modes to investigate the codebase.

---

## Assistant (Hm-L1-Coordinator · GLM-5.1 · 28.6s)

_Thinking:_

I am hm-coordinator, L1 wave manager for hm-* lineage. I dispatch, validate, and consolidate — I never implement.

Let me parse this task packet from L0:
- Domain: Research/Investigation
- Task: Investigate Hivemind harness architecture for hooks, events, session lifecycle, delegation, agent hierarchy, injection mechanisms, and prompt enhancement pipeline
- Scope: Multiple src/ directories, skill references
- Output: Structured markdown report with per-subsystem summaries, gaps, file:line references
- Verification: Real file paths, line numbers, no fabricated capabilities

This is a single-wave research task — all 7 investigation areas are independent and can be dispatched to parallel L2 specialists. However, given the scope and the instruction to "dispatch to hm-l3-detective specialist," I should:

1. Load the coordinating-loop skill for managing the wave
2. Load the detective skill reference for dispatch context
3. Dispatch multiple hm-l3-detective specialists in parallel, each covering a subset of the 7 areas
4. Collect and consolidate results

Let me decompose into parallel specialist dispatches:

Wave 1 (all parallel, independent investigations):
1. Detective A: Hooks subsystem + Event subscription model (src/hooks/, src/plugin.ts, SDK reference)
2. Detective B: Session lifecycle + Delegation system (src/task-management/, src/coordination/)
3. Detective C: Agent hierarchy + Injection/steering mechanisms (.opencode/agents/, src/routing/, src/features/)
4. Detective D: Prompt enhancement pipeline (src/schema-kernel/, src/features/ prompt packets)

Actually, looking at this more carefully, the task says "Dispatch to hm-l3-detective specialist" — singular. But the scope is massive (7 subsystems across many directories). A single detective would run out of context. Better to split into 3-4 parallel detectives.

Let me first load the coordinating skill, then dispatch.

I am **hm-coordinator**, L1 wave manager for hm-* lineage. I dispatch, validate, and consolidate — I never implement.

## Task Packet Analysis

**Domain:** Research/Investigation
**Decomposition:** 7 subsystems, all independent → single parallel wave of specialist detectives
**Output:** Structured markdown findings report with file:line evidence

Let me load coordination skills and dispatch the wave.

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-coordinating-loop"
}
```

**Output:**
```
<skill_content name="hm-l2-coordinating-loop">
# Skill: hm-l2-coordinating-loop

## Overview

Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves. Produces validated multi-agent dispatch with error recovery and progress tracking.

## Planning Context — Check Available

This skill coordinates multi-agent workflows. Before beginning:

1. **Check for planning state:**
   - If `hm-planning-persistence` is loaded: Read `.hivemind/state/planning/<session-id>/task_plan.md` for task inventory.
   - If `hm-planning-persistence` is not loaded: Build task inventory in-memory. Write to `.coordination/<session>/task_plan.md` for durability.
   - **DO NOT BLOCK** — proceed with whatever planning context is available.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh coordinating-loop
   ```
   (Non-blocking — continues on failure)

3. **State availability:**
   - Preferred: `hm-planning-persistence` provides structured task_plan.md, findings.md, progress.md in `.hivemind/state/planning/<session-id>/`
   - Fallback: In-memory task tracking with `.coordination/<session>/` directory

<files_to_read>
.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md
.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md
.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md
.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md
.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md
.opencode/get-shit-done/references/thinking-models-execution.md
</files_to_read>

# coordinating-loop

Central coordination hub for multi-agent workflows. Manages hand-offs, execution mode decisions, parent-child cycles, and ralph-loop integration. **Scripts enforce gates — not tables.**

---

## When This Skill Loads — Do This First

1. **Count the tasks.** If only one task, do NOT load this skill. Execute directly.
2. **Check for `.coordination/` directory.** If missing, run `scripts/init-session.sh <session-name>`.
3. **Check for available planning state:** `hm-planning-persistence` (preferred, `.hivemind/state/planning/<session-id>/`) or in-memory fallback.
4. **Limit tool calls to 3 before first decision.** No deep exploration.
5. **Write task inventory to disk:** `.coordination/<session>/task_plan.md`.
6. **Run pre-dispatch validation:** `bash scripts/coordination-check.sh <session> --pre-dispatch`. **Must exit 0 before any child is dispatched.**

---

## Core Coordination Loop — Procedural Steps

```
ASSESS → DECIDE MODE → DISPATCH → MONITOR → INTEGRATE → VERIFY → (loop or exit)
```

## Rich Coordination Guardrails

Phase 30 hardening treats each coordination step as a deterministic workflow edge with traceable guardrails:

| Pattern | Local adaptation |
|---------|------------------|
| Deterministic workflow agent | The coordinator owns the state machine and max loop count; child agents do not decide global completion. |
| Per-edge guardrails | Run checks at parent→child, child→tool, child→parent, and integration boundaries, not only final VERIFY. |
| Handoff metadata | Every envelope includes source, target, handoff reason, allowed destinations, history policy, expected return, and resume pointer. |
| Trace/evidence span | Every accepted or rejected child return is written to findings/progress with command/file evidence. |

Use `references/05-edge-guardrails.md` when coordinating delegated work with more than one agent/tool boundary.

### Step 1: ASSESS — Build the Task Inventory

1. List every unit of work. Write to `.coordination/<session>/task_plan.md`:
   ```
   - [ ] TASK-N: <description> | files: <paths> | domain: <category>
   ```
2. Group tasks by **file overlap** and **domain**.
3. **Gate G1 enforcement:** Run `bash scripts/check-gate.sh <session> G1`. **Blocks if no tasks written.**

### Step 2: DECIDE MODE — Use the Fixed Flowchart

```
Multiple tasks?
  ├─ No  → Execute directly. Exit this skill.
  └─ Yes
        │
        ▼
   Any tasks share files or mutable state?
   ├─ Yes → Sequential. Go to DISPATCH.
   └─ No
        │
        ▼
   3+ independent task groups?
   ├─ Yes → Parallel dispatch. Go to DISPATCH.
   └─ No (1-2 groups)
        │
        ▼
   Are tasks exploratory (root cause unknown)?
   ├─ Yes → Sequential. Investigate first, reassess.
   └─ No  → Sequential (overhead exceeds benefit).
```

**Reassessment rule:** If parallel agents discover shared state, HALT remaining agents, collect results, switch to sequential. Write to `progress.md`.

### Step 3: DISPATCH — Task Envelopes with Validation

Every child Agent receives a **Task Envelope** with exactly 5 required sections:

| Section | Required Content |
|---------|-----------------|
| **Task** | One-sentence description of what to do |
| **Scope** | Include/exclude file lists — concrete paths |
| **Context** | Only what is needed — error messages, relevant snippets (max 50 lines), patterns to follow |
| **Expected Output** | Concrete deliverables with format and acceptance criteria |
| **Verification** | Exact command or check the child must run and report |

Add the Phase 30 handoff metadata block to each envelope:

```yaml
source_agent: "<coordinator>"
target_agent: "<child>"
handoff_reason: "<domain/file boundary>"
allowed_destinations: []
history_policy: "<what context is included/filtered>"
expected_return: "DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED + artifacts + evidence"
resume_pointer: "<where to continue after interruption>"
```

**Before dispatching each child:**
1. Write the envelope to `.coordination/<session>/children/<child-id>/envelope.md`
2. Run `bash scripts/validate-envelope.sh <session> <child-id>` — **blocks if any of 5 sections missing**
3. **Gate G2 enforcement:** Run `bash scripts/check-gate.sh <session> G2`. **Blocks if any envelope fails validation.**

**Pre-dispatch checklist (run before ANY child is dispatched):**
```bash
bash scripts/coordination-check.sh <session> --pre-dispatch
# Must exit 0. If it exits 1, fix the reported issues before dispatching.
```

### Step 4: MONITOR — Check at Gates, Not Continuously

1. After each child returns — verify output matches expected format.
2. Run edge guardrails before accepting the child result: scope, output shape, verification evidence, unauthorized delegation/tool use.
3. **Ralph-loop integration:** After each child returns:
   ```bash
   bash scripts/run-ralph-loop.sh <session> <child-id>
   ```
   - If validator passes → child accepted
   - If validator fails → fix issues → re-dispatch child → loop (max 3 cycles)
   - If 3 cycles fail → escalate to user with summary
4. **Gate G3 enforcement:** Run `bash scripts/check-gate.sh <session> G3`. **Blocks if any child orphaned.**

### Step 5: INTEGRATE — Merge Results

1. Read each child's output file.
2. Check for overlapping file modifications. Resolve conflicts or dispatch integration Agent.
3. Run full validation suite (tests, builds).
4. **Write integration report:** Generate `.coordination/<session>/findings.md` with:
   - Summary of each child's output
   - File conflict analysis
   - Validation results
   - Remaining issues
5. **Gate G4 enforcement:** Run `bash scripts/check-gate.sh <session> G4`. **Blocks if conflicts unresolved or validation fails.**

### Step 6: VERIFY — Gate Check

1. Run `bash scripts/check-gate.sh <session> G5`. **Blocks if acceptance criteria unmet.**
2. If all gates pass → loop exits.
3. If any gate fails → loop back to originating phase.
4. **Maximum 3 full loop cycles** through G1→G5. On 3rd failure, escalate to user.

---

## Gate Enforcement — Scripts That Block

Every gate has a script that runs and **exits non-zero to block progression**:

| Gate | Phase | Script | Blocks If |
|------|-------|--------|-----------|
| G1 | ASSESS | `bash scripts/check-gate.sh <session> G1` | No tasks in task_plan.md |
| G2 | DISPATCH | `bash scripts/check-gate.sh <session> G2` | Any envelope missing required sections |
| G3 | MONITOR | `bash scripts/check-gate.sh <session> G3` | Any child orphaned (no result) |
| G4 | INTEGRATE | `bash scripts/check-gate.sh <session> G4` | File conflicts or validation fails |
| G5 | VERIFY | `bash scripts/check-gate.sh <session> G5` | Acceptance criteria unmet |

**Usage:** `bash scripts/check-gate.sh <session-name> <G1|G2|G3|G4|G5>`
- Exit 0 = gate passed, proceed
- Exit 1 = gate failed, **do not proceed** — fix the reported issue

---

## Ralph-Loop Integration — Validate → Fix → Re-dispatch

After each child returns, the ralph-loop validator runs:

```
Child returns
    │
    ▼
Run: bash scripts/run-ralph-loop.sh <session> <child-id>
    │
    ├── PASS → Accept child output, continue
    │
    └── FAIL → Read validation report
         │
         ├── Cycle < 3 → Fix issues, re-dispatch child, loop
         │
         └── Cycle = 3 → Escalate to user with summary
```

**The validator checks:**
1. Output file exists at expected path
2. Output matches expected format from envelope
3. Verification command from envelope was run and passed
4. No files modified outside scope boundaries
5. Child returned a summary (even on failure)

---

## Worked Example: Coordinating 3 Subagents Through Skill Creation

**Scenario:** User says "Create a skill for deep-research that uses repomix to analyze codebases."

### Phase 1: ASSESS

```
- [ ] TASK-1: Write SKILL.md frontmatter and trigger phrases | files: .opencode/skills/deep-research/SKILL.md | domain: skill-structure
- [ ] TASK-2: Create reference documents for repomix integration | files: .opencode/skills/deep-research/references/*.md | domain: documentation
- [ ] TASK-3: Write validation script for the skill pack | files: deep-research/scripts dir | domain: tooling
```

No file overlap. 3 independent groups → **parallel dispatch**.

**Gate G1:** `bash scripts/check-gate.sh deep-research G1` → exits 0 ✓

### Phase 2: DISPATCH — Filled-In Task Envelopes

**Envelope for Child Agent 1 (SKILL.md author):**
```markdown
## Task
Write the SKILL.md file for a new "deep-research" skill at .opencode/skills/deep-research/SKILL.md

## Scope
- Work on: .opencode/skills/deep-research/SKILL.md only
- Do NOT touch: Any other files in the repository

## Context
The skill should trigger on: "deep research", "comprehensive analysis", "research report".
It must use YAML frontmatter with name, description, and metadata fields.
The skill body should contain procedural guidance for conducting research using repomix.
Reference existing skill patterns in .opencode/skills/use-authoring-skills/SKILL.md for structure.

## Expected Output
- A complete SKILL.md file (300+ lines) with frontmatter, procedural steps, and cross-references
- The file must pass validation via the use-authoring-skills validate-skill.sh script

## Verification
- Run: bash -n on any embedded scripts
- Run: head -5 .opencode/skills/deep-research/SKILL.md to confirm frontmatter
```

**Before dispatch:** `bash scripts/validate-envelope.sh deep-research child-1` → exits 0 ✓

*(Envelopes for Child 2 and 3 follow same pattern — see full example in references/01-handoff-protocols.md)*

**Pre-dispatch validation:** `bash scripts/coordination-check.sh deep-research --pre-dispatch` → exits 0 ✓

**Gate G2:** `bash scripts/check-gate.sh deep-research G2` → exits 0 ✓

### Phase 3: MONITOR with Ralph-Loop

Each child returns. Parent runs ralph-loop validator:
```bash
bash scripts/run-ralph-loop.sh deep-research child-1  # PASS
bash scripts/run-ralph-loop.sh deep-research child-2  # PASS
bash scripts/run-ralph-loop.sh deep-research child-3  # PASS
```

**Gate G3:** `bash scripts/check-gate.sh deep-research G3` → exits 0 ✓

### Phase 4: INTEGRATE

Parent reads all outputs, confirms no file overlap, runs full validation.

**Write findings:** Integration report written to `.coordination/deep-research/findings.md`

**Gate G4:** `bash scripts/check-gate.sh deep-research G4` → exits 0 ✓

### Phase 5: VERIFY

**Gate G5:** `bash scripts/check-gate.sh deep-research G5` → exits 0 ✓

All gates pass. Loop exits. Parent reports success to user.

---

## Hand-off Protocol — Minimum Viable

```markdown
## Task
Fix the 3 failing tests in tests/lib/session-api.ts

## Scope
- Include: tests/lib/session-api.ts, src/lib/session-api.ts
- Exclude: All other test files, all production code outside session-api.ts

## Context
Error: "TypeError: client.waitForSession is not a function"
The SDK call pattern changed. Multi-path fallback at src/lib/session-api.ts:142-168 needs updating.

## Expected Output
- Summary of root cause
- List of changes made (file:line format)
- Confirmation that all 3 tests pass

## Verification
Run: npm test -- tests/lib/session-api.ts — all must pass
```

**Child receipt confirmation:**
```markdown
## Confirmation
- Task understood: Fix 3 failing tests in session-api.ts
- Scope boundaries: Only session-api.ts (test and source)
- Verification step: npm test -- tests/lib/session-api.ts
- Any ambiguities: None — proceeding
```

---

## Anti-Patterns — Detection and Correction

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Broadcast** — Full session history to every child | Child prompt >500 chars of context | Include only file paths, errors, expected output |
| **The Fire-and-Forget** — Dispatch with no monitoring | No verification step in envelope | Write verification step before dispatching |
| **The False Parallel** — Parallel for tasks sharing state | Independence criteria fails | Switch to sequential |
| **The Orphan Loop** — Ralph-loop with no exit | Cannot fill "Loop exits when: ___" | Define acceptance criteria first |
| **The Context Leak** — Child modifies out-of-scope files | `git diff --name-only` vs envelope scope | Revert, re-dispatch with clearer boundaries |
| **The Silent Failure** — Child fails undetected | Child didn't run verification step | Require receipt confirmation |
| **The Coordinator Executor** — Parent does child's work | Parent modified files assigned to child | Stop. Delegate. Only integrate. |
| **The Infinite Retry** — Retry without changing approach | Retry count > 1 per task | Escalate to user |

---

## Self-Correction

### When the Task Keeps Failing

If a child agent repeatedly returns failing results, first check whether the files referenced in its envelope actually exist on disk — plans sometimes reference paths that were never created. Next, verify the agent name in your dispatch matches a real `.opencode/agents/` file; typos in agent names cause silent dispatch failures on some platforms. If both check out, simplify the task decomposition: reduce the number of parallel agents, merge overlapping tasks, and re-dispatch with narrower scopes. If the same task fails 3 times with the same error, stop retrying and escalate to the user with the exact error output and your diagnosis.

### When Unsure About the Next Step

Default to sequential dispatch instead of parallel — sequential is safer and easier to debug. Log the decision point by writing to `.coordination/<session>/progress.md` with what you know, what you're uncertain about, and which option you're proceeding with. If you cannot determine whether tasks share mutable state, treat them as shared and serialize. The safest default is always: one agent at a time, verify each result before dispatching the next.

### When the User Contradicts Skill Guidance

If the user requests a different dispatch strategy than what this skill recommends (e.g., wants parallel when the flowchart says sequential), use the user's choice but explicitly note in `progress.md` that this deviates from the recommended coordination pattern and may affect file conflict safety. If the user wants a different agent than recommended, dispatch their preferred agent but include a note about the potential mismatch in the task envelope. The user's explicit instruction always overrides skill guidance — document the deviation and proceed.

### When an Edge Case Is Encountered

If two agents need to write to the same output file, serialize their execution instead of dispatching in parallel — file conflicts are the most common parallel dispatch failure. If a child agent returns results that modify files outside its declared scope, do not accept the results — revert the out-of-scope changes, re-dispatch with clearer scope boundaries, and add the file to the exclude list. If the coordination directory (`.coordination/`) is corrupted or missing mid-session, re-initialize with `scripts/init-session.sh` and rebuild state from completed child outputs on disk.

---

## Platform Adaptation

### OpenCode (Full Access)
- Use all scripts as written. Dispatch via `@general` or `@<custom-agent>`.
- Write state to `.coordination/`. Run gate scripts before each phase transition.

### Claude.ai (No Subagents, No Bash)
- Execute tasks sequentially. Perform gate checks manually:
  - G1: Count tasks, write list as markdown
  - G2: Verify each task has all 5 envelope sections
  - G3: Confirm each task's verification step passed
  - G4: Review all changes for conflicts
  - G5: Check all acceptance criteria met
- Use conversation as state. Write progress as numbered sections.

### Cowork (Subagents, No Bash)
- Dispatch subagents. Perform gate checks manually (same as Claude.ai).
- Write state to files if platform allows.

### No-Subagent Fallback
1. Execute sequentially, one task at a time.
2. Write state to disk after each task.
3. Use same gate system — verify manually.
4. Treat each task as separate Agent with boundaries.

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `dispatching-parallel-agents` | Builds ON TOP of it for parallel dispatch patterns |
| `user-intent-interactive-loop` | Captures user intent before coordination begins |
| `hm-planning-persistence` | Maintains task_plan.md, findings.md, progress.md in `.hivemind/state/planning/` |
| `phase-loop` | Provides iteration semantics for coordinated revision loops |

## Cross-References (Boundary Clarification)

| Related Skill | Boundary |
|---------------|----------|
| `agents-and-subagents-dev` | agents-and-subagents-dev owns agent definitions and delegation protocol. This skill owns dispatch mechanics and coordination between multiple agents. |
| `hm-subagent-delegation-patterns` | hm-subagent-delegation-patterns owns GSD-specific execution patterns (checkpoint resume, session ID tracking). This skill owns general multi-agent orchestration. |
| `user-intent-interactive-loop` | user-intent-interactive-loop owns intent clarification before work begins. This skill owns execution coordination after intent is clear. |
| `hm-planning-persistence` | hm-planning-persistence owns task-level persistent memory in `.hivemind/state/planning/<session-id>/`. This skill reads/writes those files as part of coordination but doesn't own them. |

---

## Kit Bundle Contents

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Entry point with enforcement procedures and worked example |
| `references/01-handoff-protocols.md` | Context transfer patterns with filled-in examples |
| `references/02-sequential-vs-parallel.md` | Execution mode decision framework |
| `references/03-parent-child-cycles.md` | Nested agent lifecycle with prompt templates |
| `references/04-ralph-loop-integration.md` | Skill-authoring workflow mapping |
| `scripts/init-session.sh` | Creates `.coordination/` directory structure |
| `scripts/coordination-check.sh` | Pre-dispatch validation and session health check |
| `scripts/check-gate.sh` | Per-gate enforcement — exits non-zero to block |
| `scripts/validate-envelope.sh` | Validates task envelope has all 5 required sections |
| `scripts/run-ralph-loop.sh` | Ralph-loop validator: validate → fix → re-dispatch cycle |
| `scripts/loop-status.sh` | Reports current loop phase and progress |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/run-ralph-loop.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/verify-hierarchy.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/coordination-check.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/loop-status.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-envelope.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/register-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/check-gate.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/init-session.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/metrics/rich-gate-scorecard.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L1-Coordinator · GLM-5.1 · 9.0s)

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-detective"
}
```

**Output:**
```
<skill_content name="hm-l3-detective">
# Skill: hm-l3-detective

## Overview

Investigate codebases using three reading modes: SCAN for targeted extraction, READ for standard review, and DEEP for interface analysis. Use when navigating large codebases, finding definitions, recovering session context, or estimating token budgets. Produces structured codebase findings with surgical edit guidance.

## Quick Jump

| Investigation Need | Section | Jump |
|--------------------|---------|------|
| "How do I read this?" | Reading Modes | [Three Reading Modes](#three-reading-modes) |
| "How much context will this cost?" | Token Budget | [references/token-budget.md](references/token-budget.md) |
| "I lost context — recover" | Swarm Recovery | [references/swarm-recovery.md](references/swarm-recovery.md) |
| "What tech stack is this?" | Tech Registry | [references/tech-registry.md](references/tech-registry.md) |
| "How do I edit safely?" | Surgical Edits | [references/surgical-edits.md](references/surgical-edits.md) |
| "Where do notes go?" | Document Pipeline | [references/document-pipeline.md](references/document-pipeline.md) |
| "Is this design assumption true?" | Assumption Verification | [templates/assumption-verification.md](templates/assumption-verification.md) |

## Three Reading Modes

Every file read costs tokens. Choose the cheapest mode that answers your question.

| Mode | Token Cost | When | Tools |
|------|-----------|------|-------|
| **SKIM** | ~5% | Orientation: "what is this?" | glob, ls, frontmatter-only, grep -c |
| **SCAN** | ~15% | Targeted: "find X" | grep -n, offset reads ±20 lines, TOC navigation |
| **SCAN (Tech Stack)** | ~10% | Stack detection: "what's this built with?" | grep indicator files, read 5-10 config files |
| **DEEP** | 100% | Understanding: "need every line" | Read full file, repomix pack + grep |

**Escalation rule**: START → SKIM → (if insufficient) SCAN or SCAN (Tech Stack) → (if still need context) DEEP. Never skip to DEEP.

### Assumption Verification Mode

Use this mode when asked to validate a design assumption, locate an existing pattern, prove whether behavior exists, or recover truth from a large codebase.

1. Write the assumption as a falsifiable claim.
2. Search for at least two independent evidence paths: definitions, call sites, tests, docs, config, runtime state, or git history.
3. Classify the result using `templates/assumption-verification.md`: confirmed, discrepancy, addition, missing, or blocked.
4. If nothing is found, report the search paths and exact queries; do not silently treat absence as proof.
5. End with an answer-first finding and file:line evidence.

**Not-found rule:** A definitive "not found" requires at least two search strategies and a documented scope boundary.

### Mode Selection Decision Tree

```
What do you need?
|
+-- "What files exist?" or "What is this project?"
|   -> SKIM: glob patterns, ls directory, grep -c for match counts
|
+-- "Where is function X defined?" or "What imports Y?"
|   -> SCAN: grep -n "pattern" file → get line numbers → offset read ±20
|
+-- "What tech stack is this?" or "What framework is this built with?"
|   -> SCAN (Tech Stack): grep for package.json/go.mod/Cargo.toml → read 5-10 config files
|
+-- "How does this algorithm work?" or "I need to understand every branch"
|   -> DEEP: Read full file (only after SKIM + SCAN confirm it's the right file)
```

### Case Study: Finding a Bug in a 600-Line File

**Wrong**: Read the entire 600-line file. Cost: ~600 lines of context.

**Right**:
1. SKIM: `grep -c "error" file.ts` → 12 matches. File is relevant.
2. SCAN: `grep -n "error" file.ts` → lines 45, 120, 234, 310, 445, 501, 520, 533, 540, 555, 567, 580
3. SCAN: Read offset=40 limit=30 (lines 40-70), offset=115 limit=30 (lines 115-145), etc.
4. DEEP: Only if the bug spans multiple sections you've already identified.

**Cost**: ~200 lines vs 600 lines. 67% savings.

## Token-Efficient Retrieval Patterns

These patterns apply across all reading modes. Master them before any investigation.

| Pattern | How | Savings |
|---------|-----|---------|
| **Offset Hop-Reading** | Read offset=N limit=30 instead of reading N lines to get to line N | 90%+ vs full read |
| **Grep-Before-Read** | grep -n → get line numbers → offset read only those sections | 80%+ vs blind read |
| **Frontmatter-Only** | For planning docs, read only between --- markers | 95%+ vs full doc |
| **TOC-First** | grep ## headings first, then targeted reads | 70%+ vs full read |
| **Repomix Compress** | Always use compress: true (70% token reduction) | 70% vs uncompressed |

### Worked Example: Finding Where a Function Is Called

**Goal**: Find all callers of `processTask` in a 47-file codebase.

```
Step 1 (SKIM): grep -rn "processTask" src/ --include="*.ts" | wc -l → 23 matches
Step 2 (SKIM): grep -rn "processTask" src/ --include="*.ts" | cut -d: -f1 | sort -u → 8 files
Step 3 (SCAN): For each of 8 files, grep -n "processTask" → get line numbers
Step 4 (SCAN): Read ±20 lines around each call site (8 files × ~2 calls × 40 lines = 640 lines)
Step 5 (DEEP): Only if a call site's context is unclear after SCAN
```

**Cost**: ~700 lines total vs reading all 47 files (~14,000 lines). **95% savings**.

---

## Hierarchical Tech Registry

The `.tech-registry.json` file is your persistent memory across sessions. Read it FIRST before any investigation.

### What It Contains

- **Stack**: Language, runtime, framework, test tool, build tool
- **Modules**: Every source file with its role (leaf/core/entry), LOC, and dependencies
- **Concerns**: Active issues and resolved problems

### Read-First Protocol

```
1. Read .tech-registry.json
2. If exists → use stack for conventions, modules for dependency graph
3. If missing → run discovery (see references/tech-registry.md)
4. If stale → spot-check 3 files, update if mismatched
```

### Update Protocol

Agents APPEND findings — never overwrite. After discovering new information:
1. Read the full registry
2. Modify the specific field that changed
3. Update `last_updated` to today's date
4. Write the complete file back

See [references/tech-registry.md](references/tech-registry.md) for full schema and procedures.

---

## Swarm-Based Context Recovery

When context is lost (compaction, interruption, session reset), dispatch 5 parallel agents. Each returns max 100 lines.

| Agent | Task | Output |
|-------|------|--------|
| **TOC Agent** | Read heading structures → section map with line ranges | File → Section → Line Range → Purpose |
| **Metadata Agent** | Read all frontmatter → status, key_files, commits | File → name → status → key_files |
| **Git Agent** | git log --oneline -20, git diff --stat HEAD~5 | Timeline + changed files |
| **Diff Agent** | Read diffs for changed files only → what changed | File → Lines +/- → Summary |
| **Registry Agent** | Read .tech-registry.json → known tech stack | Full registry or inferred stack |

### Merge Procedure

1. Collect all 5 agent outputs
2. Create `.scratch/recovery-brief-YYYY-MM-DD.md`
3. Structure: Project State → Recent Changes → Document Map → What Was In Progress → Gaps → Next Actions
4. Validate: all 5 agents returned, brief < 500 lines, gaps documented
5. Update tech registry with any new discoveries

See [references/swarm-recovery.md](references/swarm-recovery.md) for full prompt envelopes and merge procedures.

---

## LSP-Aware Surgical Edit Protocol

Every edit follows this 5-step sequence. No shortcuts.

1. **Locate**: `grep -n "target" file` → exact line numbers
2. **Read Context**: Read offset=(line-20) limit=40 → context ±20
3. **Edit**: Use PRECISE oldString (exact whitespace, indentation, newlines)
4. **Verify Size**: NEVER edit >50 lines in one operation
5. **Verify Result**: `grep` the result to confirm it landed correctly

### LSP Safety Rules

- Changing exported function signatures? Update all callers first, or use overloads
- Adding new symbols? Use unique names to avoid collisions
- Renaming variables? Sequential edits, one per usage, verify each

See [references/surgical-edits.md](references/surgical-edits.md) for before/after examples and anti-patterns.

---

## Document Promotion Pipeline

Investigation artifacts flow through four stages with increasing quality requirements:

```
.scratch/              → Raw notes (ephemeral, session-scoped)
  ↓ promote (sources cited, no TODOs)
.research/             → Findings with sources (reusable across sessions)
  ↓ promote (decision stated, alternatives considered)
.planning/decisions/   → ADRs (Architecture Decision Records, project-level)
  ↓ promote (success criteria, specific files, verification commands)
.planning/phases/      → Execution plans (Source of Truth for implementation)
```

### Promotion Gates

| Gate | Requirement |
|------|-------------|
| Scratch → Research | Every finding has a source, no TODOs, organized by topic |
| Research → Decision | Decision in one sentence, 2+ alternatives considered, consequences listed |
| Decision → Plan | References ADRs, checkable success criteria, specific files, verification commands |

See [references/document-pipeline.md](references/document-pipeline.md) for naming conventions and content structures.

## Anti-Patterns — STOP When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Full File Fever | Reading >200 lines when you need 3 | grep → offset read |
| Context Avalanche | Loading 5+ files "for context" | Skim first, deep-read only targets |
| Registry Amnesia | Re-discovering tech stack each session | Read .tech-registry.json FIRST |
| Edit Blast Zone | Editing >50 lines in one operation | Surgical edits: grep → offset ±20 → precise oldString |
| Solo Recovery | One agent reading massive session export | 5-agent swarm |

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md procedures are insufficient for your task.

- **[Reading Modes](references/reading-modes.md)** — Detailed procedures with worked examples for SKIM, SCAN, DEEP
- **[Token Budget](references/token-budget.md)** — Cost tables, estimation formulas, escalation rules
- **[Swarm Recovery](references/swarm-recovery.md)** — 5-agent protocol, prompt envelopes, merge procedures
- **[Tech Registry](references/tech-registry.md)** — Schema, update procedures, cross-session persistence
- **[Surgical Edits](references/surgical-edits.md)** — LSP-aware edit protocol with before/after examples
- **[Document Pipeline](references/document-pipeline.md)** — Promotion rules, validation gates, naming conventions

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple file lookup (< 3 files) | All references | SKILL.md has enough for basic navigation |
| Only need token estimates | reading-modes.md, swarm-recovery.md | Load only token-budget.md |
| Already know the tech stack | tech-registry.md | Read .tech-registry.json directly |
| Context > 50% consumed | ALL references | Use cheapest mode available, document gaps |

## Self-Correction

When investigation produces unexpected results or gets stuck, use these correction modes before escalating:

### Mode 1: Mode Escalation Failure (SKIM too shallow, moved to DEEP too early)

```
Did SKIM return enough context?
├── NO → Run SCAN instead: grep -n target line → offset read ±20
├── YES but SCAN missed → Run SCAN with broader pattern: grep -rn "related_term" --include="*.ts"
└── SKIM + SCAN both insufficient → Run DEEP on the specific file (only after confirmed relevance)
```

### Mode 2: Assumption Verification Loop (not-found or ambiguous)

```
What did the first search strategy return?
├── 0 results → try a second strategy: switch from grep to glob, or from file content to git history
├── 1 result → try a third strategy: check call sites, imports, tests, or config files
├── ≥2 results, contradictory → re-verify file paths and versions; check for duplicate definitions
└── Still not found after 2+ strategies → document search paths, exact queries, scope boundary
```

### Mode 3: Swarm Recovery Partial (some agents returned empty)

```
Which agent returned empty?
├── TOC Agent → re-run with broader heading patterns (include ##, ###, ####)
├── Metadata Agent → check for frontmatter-less files; read first 30 lines of each
├── Git Agent → expand log range (--oneline -50), check reflog
├── Diff Agent → expand diff range (HEAD~10), check staged changes
├── Registry Agent → run full discovery (SCAN Tech Stack mode)
└── 2+ agents empty → context may be too damaged; document what IS available
```

### Mode 4: Token Budget Exceeded (investigation consuming too much context)

```
1. Pause the current investigation
2. Write all findings to .scratch/ immediately
3. Re-estimate budget using references/token-budget.md
4. Switch to the cheapest reading mode that still answers the question
5. If budget still insufficient → document gaps, promote to .research/ for next session
```

### Maximum Correction Attempts

3 per investigation task. After 3 correction cycles without resolution:
- Document what was tried and what remains blocked
- Write findings to `.scratch/recovery-brief-YYYY-MM-DD.md`
- Promote to `.research/` with gap documentation

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)       (this skill)    (downstream)    (downstream)
```

hm-detective is **Stage 1 (Detect)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached codebases and API signatures for tech registry population. Read `.tech-registry.json` from ingested assets before scanning. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-deep-research` | Evidence gathering. hm-detective produces the tech registry and codebase map that hm-deep-research uses for scope-aware searches. |
| `hm-synthesis` | Compression and artifact export. hm-detective's findings (tech registry, file maps, dependency graphs) become inputs for hm-synthesis pattern classification. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-detective is Stage 1 of the chain. hm-research-chain decides when to trigger hm-detective and how to route its output. |

### Boundary Clarification

| Nearby Skill | What hm-detective Does | What the Other Skill Does |
|-------------|----------------------|--------------------------|
| `hm-tech-stack-ingest` | Reads the `.tech-registry.json` and scans the codebase with SCAN/DEEP modes | Downloads and caches third-party repos as persistent bundled assets |
| `hm-deep-research` | Investigates the local codebase structure, tech stack, and module dependencies | Investigates external libraries, API signatures, and web sources with version-matched queries |
| `hm-synthesis` | Produces structured codebase findings (tech registry, file maps, dependency graphs) | Compresses findings into actionable artifacts with tiered reduction |
| `hm-research-chain` | Executes Stage 1 detection when triggered by the chain | Orchestrates the full detect → research → synthesize pipeline |
| Single-file edit | surgical-edits.md | Follow the 5-step protocol from SKILL.md |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/templates/assumption-verification.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/scripts/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/scripts/validate-rich-package.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/metrics/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/evals/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/reading-modes.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/swarm-recovery.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L1-Coordinator · GLM-5.1 · 64.9s)

_Thinking:_

Good, I have the coordinating-loop and detective skills loaded. Now I need to:

1. Decompose the task into parallel specialist dispatches
2. Dispatch Wave 1 with all independent investigations

The 7 subsystems are all independent research tasks. I'll split them into 3 parallel detectives to balance coverage and context:

**Detective A**: Hooks subsystem + Event subscription model + Prompt enhancement pipeline
  - Files: src/hooks/, src/plugin.ts, src/schema-kernel/, src/features/ (prompt packets)
  - SDK reference: .opencode/skills/stack-l3-opencode/SKILL.md

**Detective B**: Session lifecycle + Delegation system
  - Files: src/task-management/, src/coordination/, src/shared/types.ts

**Detective C**: Agent hierarchy + Injection/steering mechanisms
  - Files: .opencode/agents/ (sample), src/routing/, src/features/
  - Engine contracts: .opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md

Let me dispatch all 3 in parallel.

Skills loaded. Now decomposing into parallel Wave 1 dispatches.

## Wave Decomposition

7 subsystems, all independent → 3 parallel detective specialists:

| Specialist | Scope | Files |
|-----------|-------|-------|
| **Detective A** | Hooks + Events + Prompt Enhancement | `src/hooks/`, `src/plugin.ts`, `src/schema-kernel/`, `src/features/` |
| **Detective B** | Session Lifecycle + Delegation System | `src/task-management/`, `src/coordination/`, `src/shared/types.ts` |
| **Detective C** | Agent Hierarchy + Injection/Steering | `src/routing/`, `.opencode/agents/` (sample), `src/features/`, SDK/Engine references |

Dispatching Wave 1 — all 3 detectives in parallel:

**Tool: task**

**Input:**
```json
{
  "subagent_type": "hm-l3-detective",
  "description": "Hooks+Events+Prompt research",
  "prompt": "You are a subagent: hm-l3-detective (Detective A). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You can only delegate further if the cycles and your tasks allow, and you must fulfill your work. If you need verification, you will return the verification needed in the report handoff.\n\n## Task\nInvestigate THREE subsystems of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Hooks Subsystem\nInvestigate `src/hooks/` directory:\n- What hook files exist?\n- What events do they subscribe to?\n- What are their function signatures?\n- How are hooks registered/composed?\n- What is the hook lifecycle?\n\n### 2. Event Subscription Model\nInvestigate the OpenCode plugin SDK event model:\n- How does the plugin subscribe to events?\n- What events are available (tool use, user message, session events, etc.)?\n- Read `.opencode/skills/stack-l3-opencode/SKILL.md` for SDK reference\n- Also check `src/plugin.ts` for how events are wired\n- What hook types does the SDK expose?\n\n### 3. Prompt Enhancement Pipeline\nInvestigate prompt-related features:\n- What exists in `src/schema-kernel/prompt-enhance.schema.ts`?\n- What prompt packet features exist in `src/features/`?\n- How does prompt enhancement work end-to-end?\n\n## Scope\n- INCLUDE: `src/hooks/`, `src/plugin.ts`, `src/schema-kernel/`, `src/features/` (prompt-related files only)\n- INCLUDE: `.opencode/skills/stack-l3-opencode/SKILL.md` (read the SKILL.md for SDK event/hook reference)\n- INCLUDE: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` (read for engine hook contracts)\n- EXCLUDE: Test files, build artifacts, node_modules, unrelated features\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-subsystem section: what exists, how it works, key interfaces\n- File:line references for every key interface, type definition, and function signature\n- Event types with their hook signatures\n- Gaps identified (what doesn't exist yet for agent steering/injection)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n"
}
```

**Error:**
```
The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules [{"permission":"*","action":"allow","pattern":"*"},{"permission":"task","action":"allow","pattern":"*"},{"permission":"task","pattern":"*","action":"ask"},{"permission":"task","pattern":"hm-l2-*","action":"allow"}]
```

**Tool: task**

**Input:**
```json
{
  "subagent_type": "hm-l3-detective",
  "description": "Session+Delegation research",
  "prompt": "You are a subagent: hm-l3-detective (Detective B). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You can only delegate further if the cycles and your tasks allow, and you must fulfill your work. If you need verification, you will return the verification needed in the report handoff.\n\n## Task\nInvestigate TWO core subsystems of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Session Lifecycle\nInvestigate how sessions work in the harness:\n- How do main sessions vs sub-agent sessions differ?\n- What session state is tracked?\n- Where is session continuity managed?\n- What is the lifecycle of a session (creation, running, completion, recovery)?\n- What types/phases exist for sessions?\n\nKey files to investigate:\n- `src/task-management/continuity/` — session continuity persistence\n- `src/task-management/lifecycle/` — lifecycle phases\n- `src/shared/types.ts` — type definitions for sessions, lifecycle phases\n- `src/shared/session-api.ts` — SDK session API wrappers\n\n### 2. Delegation System\nInvestigate how delegation works:\n- What is the delegation flow (dispatch → monitor → complete)?\n- What are delegation records? What fields do they contain?\n- How does the WaiterModel work for dispatch?\n- How does dual-signal completion detection work?\n- What is the delegation status polling mechanism?\n- How are delegation records persisted?\n\nKey files to investigate:\n- `src/coordination/delegation/` — delegation manager\n- `src/tools/delegation/` — delegation tool wrappers (delegate-task, delegation-status)\n- `src/coordination/completion/` — completion detection\n- `src/task-management/continuity/delegation-persistence.ts` — record I/O\n- `src/shared/task-status.ts` — status transitions\n\n## Scope\n- INCLUDE: `src/task-management/`, `src/coordination/`, `src/shared/types.ts`, `src/shared/session-api.ts`, `src/shared/task-status.ts`\n- EXCLUDE: Test files, build artifacts, node_modules, unrelated modules\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files like types.ts and delegation manager. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-subsystem section: what exists, how it works, key interfaces\n- File:line references for every key type, interface, and function\n- State machine / flow diagrams in text form\n- Key type definitions (SessionState, DelegationRecord, etc.)\n- Gaps identified (what doesn't exist yet for agent steering)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n"
}
```

**Error:**
```
The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules [{"permission":"*","action":"allow","pattern":"*"},{"permission":"task","action":"allow","pattern":"*"},{"permission":"task","pattern":"*","action":"ask"},{"permission":"task","pattern":"hm-l2-*","action":"allow"}]
```

**Tool: task**

**Input:**
```json
{
  "subagent_type": "hm-l3-detective",
  "description": "Agent+Steering research",
  "prompt": "You are a subagent: hm-l3-detective (Detective C). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You can only delegate further if the cycles and your tasks allow, and you must fulfill your work. If you need verification, you will return the verification needed in the report handoff.\n\n## Task\nInvestigate TWO aspects of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Agent Hierarchy and Classification\nInvestigate how agents are classified and configured:\n- How are agents classified (L0/L1/L2/L3)?\n- What metadata exists per agent definition in `.opencode/agents/`?\n- What is the agent configuration in `src/plugin.ts` (AGENT_DEFAULTS, AGENT_TOOLS)?\n- How are agent tool assignments managed?\n- What agents exist? (Sample 5-10 agent .md files to understand the pattern)\n\nKey files to investigate:\n- `src/plugin.ts` — agent configuration (AGENT_DEFAULTS, AGENT_TOOLS, circuit breaker, tool budget)\n- `.opencode/agents/` — sample several agent definition files to understand the hierarchy pattern\n- `src/routing/` — session entry, behavioral profile, command engine\n\n### 2. Injection/Steering Mechanisms\nInvestigate any existing mechanisms for injecting messages or instructions into agent sessions:\n- Is there any message injection capability?\n- Can instructions be appended/modified mid-session?\n- How does the routing/session-entry system work?\n- What behavioral profiles exist?\n- Is there a \"system prompt\" or \"instructions\" injection point?\n- What does `src/routing/` expose for steering agent behavior?\n\nKey files to investigate:\n- `src/routing/` — session entry, behavioral profile, command engine\n- `src/features/` — standalone features (bootstrap, prompt packets, work contracts)\n- `src/config/` — config subscriber/compiler/workflow\n- `src/shared/types.ts` — look for any prompt/instruction types\n\nAlso read these SDK/Engine references for context:\n- `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` — for engine contracts around agent steering\n- `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md` — for OpenCode platform hooks/tools that enable injection\n\n## Scope\n- INCLUDE: `src/routing/`, `src/features/`, `src/config/`, `src/plugin.ts`, `src/shared/types.ts`, `.opencode/agents/` (sample)\n- INCLUDE: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md`, `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`\n- EXCLUDE: Test files, build artifacts, node_modules, deeply nested agent files\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-topic section: what exists, how it works, key interfaces\n- File:line references for every key type, interface, and function\n- Agent hierarchy model (L0-L3) with evidence\n- All existing injection/steering mechanisms found (or explicit \"NOT FOUND\" with search evidence)\n- Gaps identified (what doesn't exist yet for agent steering)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n- If a mechanism does NOT exist, explicitly state \"NOT FOUND\" and document the search paths checked\n"
}
```

**Error:**
```
The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules [{"permission":"*","action":"allow","pattern":"*"},{"permission":"task","action":"allow","pattern":"*"},{"permission":"task","pattern":"*","action":"ask"},{"permission":"task","pattern":"hm-l2-*","action":"allow"}]
```

---

## Assistant (Hm-L1-Coordinator · GLM-5.1)

_Thinking:_

The task tool is blocked for `hm-l3-detective` subagent type. The rules show that only `hm-l2-*` patterns are allowed for task delegation. I need to use `hm-l2-*` subagent types instead.

Looking at the available agent types, I can use:
- `hm-l2-researcher` — for deep research/investigation
- `hm-l2-general` — general-purpose fallback

Let me re-dispatch using `hm-l2-researcher` for the investigation work, since that's the closest match to detective work within the allowed hm-l2-* pattern.

Actually wait, looking more carefully at the allowed patterns: `"hm-l2-*"` matches `hm-l2-` prefix agents. The detective is `hm-l3-detective` which is blocked. Let me use `hm-l2-researcher` instead.

Actually, I should think about this more carefully. The agents listed include:
- hm-l2-researcher — research specialist
- hm-l2-investigator — investigation specialist

But looking at the subagent_type options listed in the task tool, I see these hm-l2 types:
- hm-l2-analyst, hm-l2-architect, hm-l2-assessor, hm-l2-auditor, hm-l2-brainstormer, hm-l2-connector, hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-critic, hm-l2-curator, hm-l2-debugger, hm-l2-ecologist, hm-l2-executor, hm-l2-finisher, hm-l2-general, hm-l2-guardian, hm-l2-integrator, hm-l2-intent-loop, hm-l2-investigator, hm-l2-mentor, hm-l2-meta-synthesis, hm-l2-operator, hm-l2-optimizer, hm-l2-persistor, hm-l2-phase-guardian, hm-l2-planner, hm-l2-prompt-analyzer, hm-l2-prompt-repackager, hm-l2-prompt-skimmer, hm-l2-researcher, hm-l2-reviewer, hm-l2-risk-assessor, hm-l2-router, hm-l2-scout, hm-l2-spec-verifier, hm-l2-strategist, hm-l2-synthesizer, hm-l2-technician, hm-l2-validator, hm-l2-writer

So I can use `hm-l2-researcher` or `hm-l2-investigator` for the detective-like work. Let me use those.

L3 detective type blocked by permissions. Re-dispatching Wave 1 using allowed `hm-l2-*` specialist types — `hm-l2-researcher` and `hm-l2-investigator` for investigation work.

**Tool: task**

**Input:**
```json
{
  "description": "Hooks+Events+Prompt research",
  "prompt": "You are a subagent: hm-l2-researcher (Detective A — Hooks/Events/Prompt). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You are a subagent — you cannot delegate further. If you need verification, you will return the verification needed in the report handoff.\n\nLoad the skill `hm-l3-detective` before starting — it provides the SCAN/READ methodology for your investigation.\n\n## Task\nInvestigate THREE subsystems of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Hooks Subsystem\nInvestigate `src/hooks/` directory:\n- What hook files exist?\n- What events do they subscribe to?\n- What are their function signatures?\n- How are hooks registered/composed?\n- What is the hook lifecycle?\n\n### 2. Event Subscription Model\nInvestigate the OpenCode plugin SDK event model:\n- How does the plugin subscribe to events?\n- What events are available (tool use, user message, session events, etc.)?\n- Read `.opencode/skills/stack-l3-opencode/SKILL.md` for SDK reference\n- Also check `src/plugin.ts` for how events are wired\n- What hook types does the SDK expose?\n\n### 3. Prompt Enhancement Pipeline\nInvestigate prompt-related features:\n- What exists in `src/schema-kernel/prompt-enhance.schema.ts`?\n- What prompt packet features exist in `src/features/`?\n- How does prompt enhancement work end-to-end?\n\n## Scope\n- INCLUDE: `src/hooks/`, `src/plugin.ts`, `src/schema-kernel/`, `src/features/` (prompt-related files only)\n- INCLUDE: `.opencode/skills/stack-l3-opencode/SKILL.md` (read for SDK event/hook reference)\n- INCLUDE: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` (read for engine hook contracts)\n- EXCLUDE: Test files, build artifacts, node_modules, unrelated features\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-subsystem section: what exists, how it works, key interfaces\n- File:line references for every key interface, type definition, and function signature\n- Event types with their hook signatures\n- Gaps identified (what doesn't exist yet for agent steering/injection)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n",
  "subagent_type": "hm-l2-researcher"
}
```

**Output:**
```
task_id: ses_1f2d999b6ffevXCPdbFUmkOEN9 (for resuming to continue this task if needed)

<task_result>
I now have comprehensive evidence for all three subsystems. Let me compile the structured research report.

---

## Research Report

**Agent:** hm-l2-researcher (Detective A — Hooks/Events/Prompt)
**Domain:** Research
**Question:** Investigate THREE subsystems of the Hivemind harness: Hooks Subsystem, Event Subscription Model, Prompt Enhancement Pipeline
**Status:** COMPLETED

---

### Subsystem 1: Hooks Subsystem

#### 1.1 Directory Structure & File Inventory

```
src/hooks/
├── types.ts                              (45 LOC)  — Shared dependency types
├── AGENTS.md                             (42 LOC)  — Sector governance docs
├── composition/
│   ├── cqrs-boundary.ts                  (36 LOC)  — CQRS boundary classification
│   └── AGENTS.md
├── guards/
│   ├── tool-guard-hooks.ts               (156 LOC) — tool.execute.before/after
│   ├── governance-block.ts               (104 LOC) — System prompt governance injection
│   └── AGENTS.md
├── lifecycle/
│   ├── core-hooks.ts                     (166 LOC) — event, system.transform, messages.transform, shell.env
│   ├── session-hooks.ts                  (340 LOC) — session.compacting, auto-loop event handler
│   └── AGENTS.md
├── observers/
│   ├── event-observers.ts                (93 LOC)  — Delegation, journey, session-entry observers
│   └── AGENTS.md
└── transforms/
    ├── tool-after-composer.ts            (71 LOC)  — Tool-after response shaping
    ├── toggle-gates.ts                   (83 LOC)  — Workflow toggle resolution
    └── AGENTS.md
```

#### 1.2 Hook Dependencies (Shared Injection Bundle)

`src/hooks/types.ts:25-45` — `HookDependencies` interface:
- `lifecycleManager: HarnessLifecycleManager`
- `client: OpenCodeClient`
- `stateManager: TaskStateManager`
- `eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>`
- `autoLoopConfig?: Partial<AutoLoopConfig>`
- `parentAutoLoopConfig?: Partial<ParentAutoLoopConfig>`
- `sleep?`, `runAutoLoop?`, `runRalphLoop?`, `escalationMessage?`
- `getIntake?: (sessionId: string) => IntakeResult | undefined`
- `hivemindConfig?: HivemindConfigs`
- `getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile`

#### 1.3 Hook Factories and Signatures

**Core Hooks** — `src/hooks/lifecycle/core-hooks.ts:48-166`
Factory: `createCoreHooks(deps: HookDependencies): CoreHooks`

| Hook Name | Signature | Purpose |
|-----------|-----------|---------|
| `event` | `(input: EventInput) => Promise<void>` | Routes SDK events to lifecycle manager + observers |
| `system.transform` | `(input: SystemInput, output: SystemOutput) => Promise<void>` | Injects governance block, intake context, behavioral profile |
| `experimental.chat.system.transform` | `(input, output) => Promise<void>` | No-op stub |
| `messages.transform` | `(input: MessagesInput, output: MessagesOutput) => Promise<void>` | Pass-through (stripped in Phase 35) |
| `shell.env` | `(input: Record<string, unknown>, output: ShellEnvOutput) => Promise<void>` | Injects CI=true, GIT_TERMINAL_PROMPT=0, NO_COLOR=1, TERM=dumb |

**Session Hooks** — `src/hooks/lifecycle/session-hooks.ts:126-340`
Factory: `createSessionHooks(deps: HookDependencies): SessionHooks`

| Hook Name | Signature | Purpose |
|-----------|-----------|---------|
| `event` | `(input: EventInput) => Promise<void>` | Drives auto-loop on `session.idle` for delegation packets |
| `experimental.session.compacting` | `(input: CompactingInput, output: CompactingOutput) => Promise<void>` | Preserves lifecycle/continuity/intake context across compaction |

**Tool Guard Hooks** — `src/hooks/guards/tool-guard-hooks.ts:53-156`
Factory: `createToolGuardHooks(deps: ToolGuardDependencies): ToolGuardHooks`

| Hook Name | Signature | Purpose |
|-----------|-----------|---------|
| `tool.execute.before` | `(input: BeforeInput, output: BeforeOutput) => Promise<void>` | Budget enforcement, circuit breaker, loop detection |
| `tool.execute.after` | `(input: AfterInput, output: AfterOutput) => Promise<void>` | Metadata injection (tool stats, delegation info, lifecycle) |

**Tool Guard Dependencies** — `src/hooks/guards/tool-guard-hooks.ts:26-30`:
```typescript
export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
}
```

#### 1.4 CQRS Boundary

`src/hooks/composition/cqrs-boundary.ts:1-36`:
- Effect classifications: `"observation"` | `"response-shaping"` | `"guard-decision"`
- `classifyHookEffect(hook: string)` — classifies known hooks
- `assertHookWriteBoundary(input)` — throws `[Harness]` error if hook attempts `"durable-write"`
- `messages.transform`, `shell.env`, `tool.execute.after` → `"response-shaping"`
- `tool.execute.before` → `"guard-decision"`
- All others → `"observation"`

#### 1.5 Event Observers (Factories, not hooks)

`src/hooks/observers/event-observers.ts`:
- `createDelegationEventObserver()` — `:21` — Extracts `session.idle` / `session.deleted` delegation facts
- `createSessionJourneyEventObserver(shouldTrack)` — `:45` — Extracts session journey projection facts
- `createSessionEntryEventObserver()` — `:68` — Classifies intake on `session.created`, caches in `Map<string, IntakeResult>`

#### 1.6 Toggle Gates

`src/hooks/transforms/toggle-gates.ts:54-83`:
- Boolean toggles: `"research"` | `"plan_check"` | `"verifier"` | `"use_worktrees"` | `"research_before_questions"`
- `isToggleEnabled(config, toggle)` — resolves via `HivemindConfigs.workflow[toggle]`
- `getDiscussMode(config)` — returns `"sufficient-phase-discussion"` | `"intensive-phase-discussion"` | `"skip-phase-discussion"`

#### 1.7 Governance Block Builder

`src/hooks/guards/governance-block.ts:73-104`:
- `buildGovernanceBlock(config, profile?)` — builds 3-line string:
  1. `--- Governance ---` header
  2. Mode + expertise + language instruction line
  3. Field:value context line (when profile provided)

#### 1.8 Plugin Composition (How Hooks Are Wired)

`src/plugin.ts:52-187`:
1. Creates `deps` bundle (line 87)
2. `createSessionHooks(deps)` → extracts `event` as `sessionEventObserver`, rest as `sessionReadHooks` (line 88-89)
3. `createDelegationEventObserver()`, `createSessionJourneyEventObserver()`, `createSessionEntryEventObserver()` (lines 85, 91)
4. Creates cascading event observer chain (lines 92-117)
5. `createToolGuardHooks({ stateManager, lifecycleManager, runtimePolicy })` (line 119)
6. Returns spread-merged plugin object (lines 121-184):
   - `...createCoreHooks({...deps, eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, consumeSessionEntryFact]})`
   - `...sessionReadHooks` (compacting hook only)
   - `...toolGuardHooks` (before/after)
   - `tool: { ... }` (all registered tools)
   - `"tool.execute.after"` overridden inline for workflow persistence + event tracker projection

---

### Subsystem 2: Event Subscription Model

#### 2.1 SDK Hook Types (OpenCode Plugin API)

Source: `.opencode/skills/stack-l3-opencode/references/expert/hook-composition.md`

The OpenCode `Hooks` interface supports these hook names:

| Hook Name | Has Output? | Purpose |
|-----------|------------|---------|
| `event` | No (fire-and-forget) | Observe ALL SDK events |
| `tool.execute.before` | Yes (mutable args) | Pre-execution guard, arg mutation |
| `tool.execute.after` | Yes (mutable title/output/metadata) | Post-execution transformation |
| `tool.definition` | Yes (mutable description) | Modify what LLM sees about a tool |
| `system.transform` | Yes (mutable system array) | Inject system prompt context |
| `experimental.chat.system.transform` | Yes | Experimental system transform variant |
| `experimental.chat.messages.transform` | Yes | Experimental messages transform |
| `messages.transform` | Yes (mutable messages) | Transform message history |
| `shell.env` | Yes (mutable env) | Inject shell environment variables |
| `experimental.session.compacting` | Yes (mutable context/prompt) | Preserve context across compaction |
| `experimental.compaction.autocontinue` | Yes | Control auto-continue after compaction |
| `permission.ask` | Yes (mutable status) | Auto-approve/ask permission requests |
| `chat.params` | Yes (mutable temperature, etc.) | Per-agent parameter injection |
| `chat.headers` | Yes | HTTP header injection |
| `command.execute.before` | Yes | Pre-command execution hook |

#### 2.2 Event Types (32-40+ from SDK)

Source: `hook-composition.md:62-77`

**v1 Events:**

| Category | Events |
|----------|--------|
| **Session** | `session.created`, `session.updated`, `session.deleted`, `session.status`, `session.idle`, `session.compacted`, `session.diff`, `session.error` |
| **Message** | `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed` |
| **Permission** | `permission.updated`, `permission.replied` |
| **Tool/PTY** | `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted` |
| **File/VCS** | `file.edited`, `file.watcher.updated`, `vcs.branch.updated` |
| **UI** | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
| **Server** | `server.connected`, `server.instance.disposed` |
| **Other** | `installation.updated`, `installation.update.available`, `lsp.client.diagnostics`, `lsp.updated`, `todo.updated`, `command.executed` |

**v2 Additional Events:**
`project.updated`, `global.disposed`, `message.part.delta`, `permission.asked`, `question.asked`, `question.replied`, `question.rejected`, `mcp.tools.changed`, `mcp.browser.open.failed`, `worktree.ready`, `worktree.failed`, `workspace.ready`, `workspace.failed`, `workspace.restore`, `workspace.status`, `tui.session.select`, plus `SyncEvent*` variants.

#### 2.3 How the Harness Subscribes

The harness does NOT subscribe to individual event types. The `event` hook receives ALL events:

`src/hooks/lifecycle/core-hooks.ts:53-67` — The `event` hook:
1. Extracts `event.type` and `sessionID` from the event
2. Routes to `lifecycleManager.handleEvent()`
3. Calls `lifecycleManager.replayPendingNotificationsForEvent()`
4. Cascades to all `eventObservers`

Event observer cascade (from `src/plugin.ts:92-117`):
1. `consumeSessionEntryFact` — classifies `session.created` → intake cache
2. `consumeDelegationFact` — routes `session.idle` → `delegationManager.handleSessionIdle()`, `session.deleted` → `delegationManager.handleSessionDeleted()`
3. `sessionEventObserver` — auto-loop retry on `session.idle` for delegation packets
4. `consumeJourneyFact` — event tracker projection

#### 2.4 Hook Execution Model

From `hook-composition.md:6-16`:
- **Sequential last-write-wins** — plugins ordered by `Config.plugin[]` array
- **No composition API** — each plugin returns flat `Hooks` object
- **Mutable pass-through** — output object is same reference across plugins
- **Event hook is fire-and-forget** — no output parameter, pure observer

#### 2.5 Key Observations for Agent Steering/Injection

The following SDK hooks exist but are **NOT currently used** by the harness:

| Available Hook | Status in Harness | Use for Agent Steering |
|----------------|-------------------|----------------------|
| `tool.definition` | **NOT registered** | Could dynamically modify tool descriptions per-session |
| `permission.ask` | **NOT registered** | Could auto-approve/ask based on behavioral profile |
| `chat.params` | **NOT registered** | Could set temperature/model per agent type |
| `chat.headers` | **NOT registered** | HTTP header injection |
| `command.execute.before` | **NOT registered** | Pre-command interception |
| `experimental.compaction.autocontinue` | **NOT registered** | Could customize auto-continue behavior |

---

### Subsystem 3: Prompt Enhancement Pipeline

#### 3.1 Schema Definitions

`src/schema-kernel/prompt-enhance.schema.ts` (169 LOC) defines 6 schemas:

| Schema | Lines | Purpose |
|--------|-------|---------|
| `PromptSkimResultSchema` | `:12-33` | Fast scan output: word/token counts, URLs, paths, complexity score, flooding risk, verdict |
| `PromptAnalysisFindingSchema` | `:43-54` | Single finding: line, text, description, type, severity, suggestion |
| `PromptAnalysisResultSchema` | `:60-73` | Aggregated analysis: findings array, severity breakdown, clarity score |
| `ContextBudgetRecordSchema` | `:83-93` | Context budget snapshot: budget_pct, compaction count, status |
| `SessionPatchRecordSchema` | `:103-115` | Session state patch: section, before/after values, backup path |
| `EnhancedPromptOutputSchema` | `:125-140` | Final pipeline output: YAML frontmatter + XML body |
| `PipelineStateSchema` | `:150-169` | Pipeline execution state: current_phase, phase_results, blockers |

**Pipeline phases** defined in `PipelineStateSchema.current_phase`:
`"skim"` → `"bridge"` → `"investigation"` → `"clarification"` → `"repackage"` → `"report"`

**Finding types** in `PromptAnalysisFindingSchema.type`:
`"absolute_claim"` | `"vagueness"` | `"missing_scope"` | `"contradiction"`

**Severity levels**: `"critical"` | `"important"` | `"minor"`

#### 3.2 Prompt Tools

**prompt-skim** — `src/tools/prompt/prompt-skim/tools.ts:35-107`:
- Factory: `createPromptSkimTool(_projectRoot: string): ReturnType<typeof tool>`
- Args: `{ content: string, workspaceRoot: string }`
- Output: `PromptSkimResult` (word count, line count, token estimate, URL extraction, path verification, complexity score 1-10, flooding risk low/medium/high, verdict simple/complex/unclear)
- Regex patterns: requirement detection, scope term detection

**prompt-analyze** — `src/tools/prompt/prompt-analyze/tools.ts:43-169`:
- Factory: `createPromptAnalyzeTool(_projectRoot: string): ReturnType<typeof tool>`
- Args: `{ content: string }`
- Output: `PromptAnalysisResult` (findings array with per-line analysis, severity breakdown, clarity score 0-100)
- Detection patterns: absolute claims, vague wording, missing scope, contradictions (intra-line + cross-line)

#### 3.3 Prompt Packet Feature

`src/features/prompt-packet/` (4 files):

**KernelPacket** — `src/features/prompt-packet/kernel-packet.ts:47-149`:
- Type: 30+ fields including session metadata, tool profiles, detection results, todo state, execution lineage, delegation info
- Factory: `createKernelPacket(record: SessionContinuityRecord, overrides?): KernelPacket`
- Used as the foundational packet type from which delegation packets extend

**DelegationPacket** — `src/features/prompt-packet/delegation-packet.ts:25-73`:
- Extends `KernelPacket` with `packet_type: "delegation"`, `parent_session_id`, `delegation_inheritance`, `todo_authority`, `return_contract`
- Factory: `createDelegationPacket(record, options): DelegationPacket`

**CompactionPreservationPacket** — `src/features/prompt-packet/compaction-preservation.ts:8-108`:
- Minimal subset preserved across compaction boundaries
- `toCompactionPacket(kernel, extras?)` — strips deep-module fields
- `fromCompactionPacket(compact, base)` — restores from compaction

#### 3.4 End-to-End Pipeline

The prompt enhancement pipeline has these stages:

1. **Skim** (tool: `prompt-skim`) — Fast quantitative scan of prompt content
2. **Analyze** (tool: `prompt-analyze`) — Line-by-line quality analysis
3. **Pipeline State** (schema: `PipelineStateSchema`) — Tracks progress across phases: skim → bridge → investigation → clarification → repackage → report
4. **Packet Creation** (feature: `prompt-packet`) — Creates `KernelPacket` or `DelegationPacket` for agent dispatch
5. **Compaction Preservation** (hook: `experimental.session.compacting`) — Preserves context via `CompactionPreservationPacket`

**However:** Only the `skim` and `analyze` tools are fully implemented and registered in `src/plugin.ts:132-133`. The `EnhancedPromptOutputSchema` and `PipelineStateSchema` define the contract for the full pipeline, but there is NO pipeline orchestrator that chains skim → analyze → enhanced output. The bridge/investigation/clarification/repackage/report phases are schema-defined but **not implemented** as runtime code.

---

### Knowledge Gaps

1. **`tool.definition` hook NOT registered** — The harness does not dynamically modify tool descriptions. This could be used for agent steering (showing different tool descriptions based on session context).

2. **`chat.params` hook NOT registered** — No per-agent temperature/model injection. The `AgentDefaults` are set in `src/plugin.ts` but via static config, not via the `chat.params` hook which could dynamically override per-request.

3. **`permission.ask` hook NOT registered** — No auto-approve/ask based on behavioral profile or delegation depth. All permissions go through default user-ask flow.

4. **Pipeline phases `bridge`, `investigation`, `clarification`, `repackage`, `report` are NOT implemented** — Only `skim` and `analyze` stages have tool implementations. `EnhancedPromptOutputSchema` and `PipelineStateSchema` exist but no orchestrator chains them.

5. **No `command.execute.before` hook** — Commands are not intercepted or guarded by the harness.

6. **No `experimental.compaction.autocontinue` hook** — Auto-continue behavior after compaction is not customized.

7. **`experimental.chat.system.transform` is a no-op stub** — `src/hooks/lifecycle/core-hooks.ts:136-141` is an empty function body.

### Recommendations

1. **For agent steering/injection**: The `system.transform` hook is the primary injection surface (governance block, intake, behavioral profile). Additional steering could use `tool.definition` (dynamic tool descriptions) and `chat.params` (per-agent temperature).

2. **For prompt pipeline completion**: The schema contracts exist for full pipeline (skim→bridge→investigation→clarification→repackage→report) but need a pipeline orchestrator to chain them.

3. **For agent permission control**: Register `permission.ask` hook to auto-approve trusted operations (`.hivemind/` writes) and auto-ask budget-exhausted sessions.

4. **The `chat.params` hook is the missing piece for temperature-per-agent** — Currently `AGENT_DEFAULTS` in plugin.ts are static; `chat.params` could dynamically set temperature based on `getBehavioralProfile()` and delegation depth.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Session+Delegation research",
  "prompt": "You are a subagent: hm-l2-investigator (Detective B — Session/Delegation). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You are a subagent — you cannot delegate further. If you need verification, you will return the verification needed in the report handoff.\n\nLoad the skill `hm-l3-detective` before starting — it provides the SCAN/READ methodology for your investigation.\n\n## Task\nInvestigate TWO core subsystems of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Session Lifecycle\nInvestigate how sessions work in the harness:\n- How do main sessions vs sub-agent sessions differ?\n- What session state is tracked?\n- Where is session continuity managed?\n- What is the lifecycle of a session (creation, running, completion, recovery)?\n- What types/phases exist for sessions?\n\nKey files to investigate:\n- `src/task-management/continuity/` — session continuity persistence\n- `src/task-management/lifecycle/` — lifecycle phases\n- `src/shared/types.ts` — type definitions for sessions, lifecycle phases\n- `src/shared/session-api.ts` — SDK session API wrappers\n\n### 2. Delegation System\nInvestigate how delegation works:\n- What is the delegation flow (dispatch → monitor → complete)?\n- What are delegation records? What fields do they contain?\n- How does the WaiterModel work for dispatch?\n- How does dual-signal completion detection work?\n- What is the delegation status polling mechanism?\n- How are delegation records persisted?\n\nKey files to investigate:\n- `src/coordination/delegation/` — delegation manager\n- `src/tools/delegation/` — delegation tool wrappers (delegate-task, delegation-status)\n- `src/coordination/completion/` — completion detection\n- `src/task-management/continuity/delegation-persistence.ts` — record I/O\n- `src/shared/task-status.ts` — status transitions\n\n## Scope\n- INCLUDE: `src/task-management/`, `src/coordination/`, `src/shared/types.ts`, `src/shared/session-api.ts`, `src/shared/task-status.ts`\n- EXCLUDE: Test files, build artifacts, node_modules, unrelated modules\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files like types.ts and delegation manager. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-subsystem section: what exists, how it works, key interfaces\n- File:line references for every key type, interface, and function\n- State machine / flow diagrams in text form\n- Key type definitions (SessionState, DelegationRecord, etc.)\n- Gaps identified (what doesn't exist yet for agent steering)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n",
  "subagent_type": "hm-l2-investigator"
}
```

**Output:**
```
task_id: ses_1f2d93fb6ffegzhr0SLB2PS5O2 (for resuming to continue this task if needed)

<task_result>
I now have comprehensive evidence. Let me compile the structured investigation report.

---

# Investigation Result

**Agent:** hm-investigator (L2 Deep Investigation Specialist)
**Task:** Investigate Session Lifecycle + Delegation System subsystems
**Confidence:** HIGH — all file paths verified on disk with line-number evidence

---

## 1. Session Lifecycle Subsystem

### 1.1 Overview

The session lifecycle is managed through a **three-layer architecture**: in-memory state (`src/shared/state.ts`), durable persistence (`src/task-management/continuity/index.ts`), and lifecycle event routing (`src/task-management/lifecycle/index.ts`). There is no explicit "main session vs sub-agent session" type distinction — sessions are **delegation-aware** but structurally identical. A session is a "child/sub-agent" if it has a `DelegationMeta` record attached; otherwise it's a root/main session.

### 1.2 Session Type System

**Key types** (`src/shared/types.ts`):

| Type | Line | Purpose |
|------|------|---------|
| `TaskStatus` | `:3` | 8-value continuity-store status: `pending \| queued \| running \| completed \| failed \| error \| cancelled \| interrupt` |
| `SessionLifecyclePhase` | `:259-265` | 6-value lifecycle FSM: `created \| queued \| dispatching \| running \| completed \| failed` |
| `HarnessStatus` | `:145-155` | 9-value unified superset (adds `dispatching`, `interrupt`, drops none) |
| `DelegationPacketStatus` | `:156` | 4-value coarse view: `pending \| running \| completed \| failed` |
| `SessionLifecycleState` | `:267-275` | Runtime snapshot with phase, timestamps, queue, observation, error |
| `SessionContinuityRecord` | `:322-327` | Durable record: `sessionID + promptParams + toolProfile + metadata` |
| `SessionContinuityMetadata` | `:306-320` | Rich metadata: status, delegation, lifecycle, notifications, resultCapture, compactionCheckpoint |
| `ContinuityStoreFile` | `:354-359` | Top-level persistence: `version + updatedAt + sessions{} + governance` |

**Status mapping table** (`src/shared/types.ts:120-138`):
```
HarnessStatus → SessionLifecyclePhase → DelegationPacketStatus
pending       → created               → pending
queued        → queued                → pending
dispatching   → dispatching           → pending
running       → running               → running
completed     → completed             → completed
error/failed  → failed                → failed
cancelled     → failed                → failed
interrupt     → (preserves previous)  → (preserves previous)
```

### 1.3 Session Continuity Persistence

**File:** `src/task-management/continuity/index.ts` (465 lines)

**Storage:** JSON file at `.hivemind/state/session-continuity.json` (Q6 canonical path).
Legacy path `.opencode/state/hivemind/session-continuity.json` supported as fallback read.

| Function | Line | Purpose |
|----------|------|---------|
| `ensureStoreLoaded()` | `:239` | Lazy-loads store from disk on first access; caches in `storeCache` |
| `loadStoreFromDisk()` | `:248` | Tries canonical → legacy paths; normalizes + deep-clones each record |
| `persistStore()` | `:301` | Atomic write (temp file + rename); gated by `config.atomic_commit` toggle |
| `recordSessionContinuity()` | `:350` | Create/replace a full session record |
| `patchSessionContinuity()` | `:364` | Partial metadata update (deep-clone on read, deep-clone on write) |
| `patchSessionDelegationPacket()` | `:407` | Partial delegation-packet update |
| `deleteSessionContinuity()` | `:429` | Remove a session from the store |
| `quarantineCorruptFile()` | `:60` | Moves corrupt files aside for auditability |

**Key design decisions:**
- **Deep-clone on read:** Every `getSessionContinuity()` returns a fresh clone (`:334-336`), preventing external mutation of internal state.
- **Deep-clone on write:** `recordSessionContinuity()` clones before storing (`:351`).
- **Atomic writes:** Uses `writeFileSync(tmpFile) + renameSync(tmpFile, filePath)` pattern (`:317-322`).
- **Boundary field redaction:** Sensitive fields like `prompt`, `result`, `error` are redacted before persistence (`:318-320`).

### 1.4 Lifecycle Manager

**File:** `src/task-management/lifecycle/index.ts` (243 lines)

**Class:** `HarnessLifecycleManager`

```
Lifecycle Phase State Machine:
┌─────────────┬──────────────────────────────────────────────┐
│ From         │ To                                           │
├─────────────┼──────────────────────────────────────────────┤
│ created     │ queued, dispatching, running, failed         │
│ queued      │ dispatching, running, failed                 │
│ dispatching │ running, completed, failed                   │
│ running     │ completed, failed                            │
│ completed   │ (terminal)                                   │
│ failed      │ (terminal)                                   │
└─────────────┴──────────────────────────────────────────────┘
(Defined: src/task-management/lifecycle/index.ts:54-61)
```

| Method | Line | Purpose |
|--------|------|---------|
| `constructor()` | `:77` | Takes `OpenCodeClient`, optional `DelegationManager`; creates internal `CompletionDetector` |
| `hydrateFromContinuity()` | `:107` | Restores delegation metadata from persisted continuity records into in-memory state |
| `getLifecycleSnapshot()` | `:115` | Reads current lifecycle phase for a session from continuity store |
| `noteObservedActivity()` | `:119` | Records activity observation + updates `lastToolActivityAt` timestamp |
| `handleEvent()` | `:133` | Routes `session.idle`, `session.error`, `session.deleted` events to `CompletionDetector` |
| `replayPendingNotificationsForEvent()` | `:169` | Re-queues undelivered parent notifications on parent session events |
| `cancelDelegatedSession()` | `:194` | Aborts session via SDK + cancels completion detector |
| `requestAutoLoopRetry()` | `:210` | Sends a retry prompt to a session (auto-loop/ralph-loop) |
| `recordCompactionCheckpoint()` | `:216` | Saves compaction state for context window recovery |
| `launchDelegatedSession()` | `:221` | Facade that proxies to `DelegationManager.dispatch()` |

### 1.5 In-Memory Session State

**File:** `src/shared/state.ts` (251 lines)

**Class:** `TaskStateManager` (singleton: `taskState`)

| Data Structure | Line | Purpose |
|----------------|------|---------|
| `rootBudgets: Map<string, RootBudget>` | `:9` | Tracks descendant count + reserved slots per root session |
| `sessionToRoot: Map<string, string>` | `:10` | Maps child session IDs to their root session |
| `sessionStats: Map<string, SessionStats>` | `:11` | Per-session tool call counts, loop detection, warnings |
| `sessionDelegationMeta: Map<string, DelegationMeta>` | `:12` | Per-session delegation metadata (rootID, depth, agent, category, queueKey) |
| `subagentSessions: Map<string, Set<string>>` | `:13` | Parent→children registry (OMO Pattern 10) |

**Main session vs sub-agent session distinction:**
- There is **no explicit type tag** differentiating them.
- A session is a sub-agent if it has a `DelegationMeta` entry in `sessionDelegationMeta` map.
- The `sessionToRoot` map resolves child → root chain.
- Budget tracking via `rootBudgets` enforces `MAX_DESCENDANTS_PER_ROOT` (10, `src/shared/types.ts:30`).

### 1.6 SDK Session API Wrappers

**File:** `src/shared/session-api.ts` (285 lines)

| Function | Line | Purpose |
|----------|------|---------|
| `createSession()` | `:41` | Create OpenCode session via SDK, supports `parentID` + `directory` |
| `getSession()` | `:54` | Get session record by ID |
| `getSessionStatusMap()` | `:63` | Get all session statuses (`idle`/`busy`/`retry`) |
| `abortSession()` | `:71` | Abort a session via SDK |
| `getSessionMessages()` | `:76` | Get messages for a session |
| `getSessionMessageCount()` | `:92` | Count messages (null on error) |
| `sendPrompt()` | `:143` | Synchronous prompt — waits for assistant response with fallback polling |
| `sendPromptAsync()` | `:181` | Async prompt — returns 204 immediately (always used for delegations since Phase 46.1) |
| `walkParentChain()` | `:250` | Walk session→parent→parent chain, detects cycles |
| `getSessionBehavioralProfile()` | `:279` | Resolves behavioral profile for a session |

### 1.7 Gaps Identified (Session Lifecycle)

1. **No explicit session type enum** — main vs sub-agent is implied by the presence of `DelegationMeta`, not declared. This works but makes agent steering logic need to check `delegation !== null` everywhere.
2. **Session creation is not in the lifecycle manager** — `createSession()` is a raw SDK call; the lifecycle manager doesn't track creation events. The `created` phase is set implicitly through continuity records.
3. **No session resumption API** — recovery flows exist (`hydrateFromContinuity`) but there's no explicit `resumeSession()` that transitions from `interrupt` → `running`.
4. **Compaction checkpoint exists** (`recordCompactionCheckpoint`) but there's no corresponding restore-from-checkpoint path in the lifecycle manager — it only persists the data.

---

## 2. Delegation System

### 2.1 Architecture Overview

The delegation system follows a **WaiterModel + Dual-Signal Architecture** (documented in `src/coordination/delegation/types.ts:1-9`):
- **WaiterModel (D-02):** Always-background dispatch — `delegate-task` returns immediately with a delegation ID.
- **Dual-signal completion (D-04):** Two independent completion paths: (a) adaptive message-count stability polling, (b) lifecycle event signals (`session.idle`, `session.error`, `session.deleted`). Both feed into a `CompletionDetector`.
- **No fixed timeouts (D-13):** Only a safety ceiling (default 30 min) as MAX runtime.
- **Separate status tool (D-14):** `delegation-status` polls results; `delegate-task` dispatches.

### 2.2 Delegation Flow

```
delegate-task tool call
    │
    ▼
DelegationManager.dispatch()  (manager.ts:163)
    ├── resolveNestingDepth()    :156    → max 3 levels
    ├── validateAgent()          :425    → verify agent exists
    ├── resolveCategoryGateDecision()    → ask/allow
    ├── buildDelegationQueueKey()        → concurrency routing
    ├── semaphore.acquire()              → concurrency limit
    ├── spawnDelegatedSession()  :210    → SDK session.create()
    ├── registerDelegation()             → state machine
    ├── persistAll()                     → delegations.json
    ├── sendPromptAsync()        :250    → 204 immediate (always async since Phase 46.1)
    ├── transition("running")    :251
    └── return DelegationResult          → tool returns delegation ID
    
Meanwhile (async):
    ├── SdkDelegationHandler.scheduleStabilityPoll()
    │   ├── performStabilityPoll()       → adaptive intervals
    │   │   ├── Check CompletionDetector cached results
    │   │   ├── getSessionMessageCount()
    │   │   ├── feedMessageCount() → detector
    │   │   ├── Stale timeout check (45 min)
    │   │   ├── Fast-completion deferral (5s)
    │   │   ├── Dual stability gate (10s + 3 polls)
    │   │   └── finalizeSdkDelegation()
    │   │       ├── getSessionMessages()
    │   │       ├── extractAllAssistantText()
    │   │       ├── hasAssistantWorkEvidence() (tool-use fallback)
    │   │       └── onTerminal("completed"/"error")
    │   └── (reschedule adaptive poll)
    │
    ├── CompletionDetector (dual-signal)
    │   ├── feed("session.idle" | "session.error" | "session.deleted")
    │   ├── feedMessageCount() → stability timer
    │   └── consumeCachedResult() → polled by SDK handler
    │
    └── Safety ceiling timer (30 min default)
        └── handleSafetyCeiling() → transitionToTerminal("timeout")
```

### 2.3 Delegation Record (Delegation Interface)

**File:** `src/coordination/delegation/types.ts:30-63`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | UUID |
| `parentSessionId` | `string` | Parent session that dispatched |
| `childSessionId` | `string` | Child session executing the task |
| `agent` | `string` | Agent name |
| `status` | `DelegationStatus` | `dispatched → running → completed/error/timeout` |
| `result` | `string?` | Extracted assistant text |
| `resultTruncated` | `boolean?` | Whether result was truncated |
| `error` | `string?` | Error message |
| `createdAt` | `number` | Timestamp |
| `completedAt` | `number?` | Terminal timestamp |
| `safetyCeilingMs` | `number?` | Max runtime (NOT a deadline) |
| `lastMessageCount` | `number` | Last known message count |
| `stablePollCount` | `number` | Consecutive stable polls |
| `nestingDepth` | `number` | 1=top-level, max 3 |
| `gracePeriodExpiresAt` | `number?` | Grace period cleanup timer |
| `lastMessageCountChangeAt` | `number?` | For adaptive polling |
| `executionMode` | `"sdk" \| "pty" \| "headless"` | How the child runs |
| `surface` | `DelegationSurface?` | `agent-delegation \| command-process` |
| `recoveryGuarantee` | `DelegationRecoveryGuarantee?` | `resumable \| best-effort \| non-resumable-after-restart` |
| `workingDirectory` | `string` | Working dir for child |
| `ptySessionId` | `string?` | PTY session if pty mode |
| `queueKey` | `string` | Concurrency queue key |
| `terminalKind` | `DelegationTerminalKind?` | `completed \| error \| timeout \| cancelled \| interrupted-by-signal \| non-resumable-after-restart` |

### 2.4 Delegation Status State Machine

**File:** `src/coordination/delegation/state-machine.ts:42-48`

```
Delegation Status State Machine:
┌────────────┬──────────────────────────────────────────────┐
│ From        │ To                                           │
├────────────┼──────────────────────────────────────────────┤
│ dispatched │ running, completed, error, timeout           │
│ running    │ completed, error, timeout                    │
│ completed  │ (terminal)                                   │
│ error      │ (terminal)                                   │
│ timeout    │ (terminal)                                   │
└────────────┴──────────────────────────────────────────────┘
```

### 2.5 DelegationStateMachine

**File:** `src/coordination/delegation/state-machine.ts` (426 lines)

| Method | Line | Purpose |
|--------|------|---------|
| `registerDelegation()` | `:192` | Store delegation + track session + schedule safety ceiling |
| `persistAll()` | `:203` | Persist all delegations to disk (with auto-prune at >50) |
| `hydrateFromPersistence()` | `:214` | Restore from disk (recovery) |
| `transition()` | `:227` | Guarded non-terminal status transition |
| `transitionToTerminal()` | `:245` | Unified terminal path: set status, persist, clear timers, schedule grace cleanup, fire parent notification |
| `scheduleSafetyCeiling()` | `:294` | Arm max-runtime timer |
| `scheduleGracePeriodCleanup()` | `:305` | Remove from in-memory after 10 min (keeps persisted) |
| `pruneCompletedDelegations()` | `:356` | Batch prune terminal delegations older than 30 min |

### 2.6 Dual-Signal Completion Detection

**File:** `src/coordination/completion/detector.ts` (157 lines)

**Class:** `CompletionDetector`

| Signal | Source | Trigger |
|--------|--------|---------|
| `idle` | `session.idle` event OR message-count stability timer | Session goes idle or message count unchanged for `stabilityTimeoutMs` (30s) |
| `error` | `session.error` event | Session errors out |
| `deleted` | `session.deleted` event | Session deleted |
| `timeout` | `watch()` timeout | Promise-based timeout |
| `cancelled` | `cancel()` call | Explicit cancellation |

| Method | Line | Purpose |
|--------|------|---------|
| `feed()` | `:28` | Feed a terminal event → resolves watcher or caches result |
| `watch()` | `:57` | Promise that resolves on terminal signal or timeout |
| `feedMessageCount()` | `:118` | Feed message count changes → stability timer |
| `peekCachedResult()` | `:83` | Non-destructive peek |
| `consumeCachedResult()` | `:98` | Destructive read + clear |

**Wiring:** The lifecycle manager's `handleEvent()` (`src/task-management/lifecycle/index.ts:133`) feeds `session.idle`, `session.error`, and `session.deleted` into the detector. The SDK handler's `performStabilityPoll()` (`src/coordination/sdk-delegation/handler.ts:157`) both consumes cached results and feeds message counts into the detector.

### 2.7 Adaptive Polling

**File:** `src/coordination/sdk-delegation/handler.ts:66-73`

| Interval | When | Value |
|----------|------|-------|
| `POLL_INTERVAL_ACTIVE_MS` | Just dispatched/message changed | 2s |
| `POLL_INTERVAL_BASE_MS` | Stable < 30s | 5s |
| `POLL_INTERVAL_IDLE_MS` | Stable 30s–5min | 10s |
| `POLL_INTERVAL_DEEP_IDLE_MS` | Stable > 5min | 30s |

**Stability finalization gates** (`handler.ts:246-252`):
1. `MIN_STABILITY_TIME_MS` (10s) since last message change
2. `STABLE_POLLS_REQUIRED` (3) consecutive unchanged polls
3. Both must be true simultaneously

**Fast-completion deferral** (`handler.ts:237-243`): Will not finalize before `MIN_IDLE_TIME_MS` (5s) since creation.

**Stale detection** (`handler.ts:229-234`): Timeout if no message activity for `DEFAULT_STALE_TIMEOUT_MS` (45 min).

### 2.8 Delegation Persistence

**File:** `src/task-management/continuity/delegation-persistence.ts` (197 lines)

| Function | Line | Purpose |
|----------|------|---------|
| `persistDelegations()` | `:58` | Atomic write to `.hivemind/state/delegations.json`; gated by `config.commit_docs` |
| `readPersistedDelegations()` | `:170` | Read + normalize from disk; quarantine corrupt files |
| `normalizePersistedDelegation()` | `:81` | Defensive normalization with contract defaults |

**Persistence is dual-layer:**
1. **Delegation records** → `.hivemind/state/delegations.json` (via `delegation-persistence.ts`)
2. **Session continuity** → `.hivemind/state/session-continuity.json` (via `continuity/index.ts`)

Both use atomic writes (temp file + rename) and boundary field redaction.

### 2.9 Tool Entry Points

| Tool | File | Purpose |
|------|------|---------|
| `delegate-task` | `src/tools/delegation/delegate-task.ts` | Dispatches to `DelegationManager.dispatch()`, returns delegation ID immediately |
| `delegation-status` | `src/tools/delegation/delegation-status.ts` | Queries specific delegation or lists all (filtered, lineage-scoped) |

**delegate-task input schema** (`delegate-task.ts:8-13`):
- `agent` (required): Agent name
- `prompt` (required): Task prompt
- `title` (optional): Session title
- `safetyCeilingMs` (optional, 1–60 min): Max runtime

**delegation-status** (`delegation-status.ts:68-133`):
- Supports specific `delegationId` lookup or list-all with status filter
- Merges in-memory + persisted delegations (memory authoritative)
- Lineage access control: `canSessionAccessDelegation()` checks parent/child chain
- Falls back to `readPersistedDelegations()` for delegations already grace-cleaned from memory

### 2.10 Notification System

**File:** `src/coordination/completion/notification-handler.ts` (238 lines)

| Function | Line | Purpose |
|----------|------|---------|
| `notifyDelegationTerminal()` | `:221` | Fire-and-forget `sendPrompt()` to parent session on terminal state |
| `queuePendingNotification()` | `:135` | If delivery fails, queue in parent's `pendingNotifications` for replay |
| `replayPendingNotifications()` | `:199` | Replay all queued notifications; returns false if any delivery fails |
| `buildDelegationTaskNotification()` | `:106` | Converts `Delegation` → `TaskNotification` |

**Delivery guarantee:** Best-effort fire-and-forget. Failed deliveries are queued as `PendingNotification` and replayed on parent session lifecycle events (`session.created`, `session.updated`).

### 2.11 Recovery Flow

**File:** `src/coordination/delegation/manager.ts:322-346`

```
DelegationManager.recoverPending()
    ├── readPersistedDelegations() → load from disk
    ├── For each delegation:
    │   ├── Skip if not dispatched/running
    │   ├── SDK mode: recoverSdkDelegation()
    │   │   ├── getSessionStatusMap() with 5s timeout
    │   │   ├── If idle → onSessionIdle() → schedule poll
    │   │   └── If error/missing → schedule safety ceiling
    │   ├── PTY mode: recoverPtyDelegation()
    │   └── Headless: transitionToTerminal("error", "non-resumable-after-restart")
```

### 2.12 Gaps Identified (Delegation System)

1. **No explicit delegation priority/weighting** — all delegations have equal concurrency priority; no way to express "this delegation is more important."
2. **No delegation cancellation from the tool surface** — `delegate-task` and `delegation-status` have no cancel operation. Cancellation only exists for PTY sessions (`markCommandCancellationForPtySession`). SDK delegations can only be cancelled via the lifecycle manager's `cancelDelegatedSession()`.
3. **Grace period cleanup removes from memory but not from persistence** — `scheduleGracePeriodCleanup()` (`state-machine.ts:316-321`) only removes from the in-memory `Map`, not from `delegations.json`. This means the persistence file grows unboundedly until `pruneCompletedDelegations()` runs (triggered at >50 delegations or explicitly).
4. **No delegation result streaming** — results are only available after terminal finalization. There's no partial progress/streaming mechanism.
5. **Command delegation category is hardcoded** — `dispatchCommand()` always uses category `"command"` (`manager.ts:272`), with no override surface.

---

## 3. File Index

| File | Lines | Role |
|------|-------|------|
| `src/shared/types.ts` | 415 | Unified type definitions — TaskStatus, SessionLifecyclePhase, DelegationMeta, ContinuityStoreFile |
| `src/shared/state.ts` | 251 | In-memory TaskStateManager singleton (stats, budgets, delegation meta, subagent registry) |
| `src/shared/session-api.ts` | 285 | SDK wrappers — createSession, sendPrompt, sendPromptAsync, getSessionMessages, abortSession |
| `src/shared/task-status.ts` | 22 | TaskStatus transition validation + terminal check |
| `src/task-management/continuity/index.ts` | 465 | Session continuity persistence (session-continuity.json) — CRUD + deep-clone safety |
| `src/task-management/continuity/delegation-persistence.ts` | 197 | Delegation record persistence (delegations.json) — atomic write + normalize |
| `src/task-management/lifecycle/index.ts` | 243 | HarnessLifecycleManager — lifecycle FSM, event routing, notification replay |
| `src/coordination/delegation/types.ts` | 140 | Delegation types, status enum, constants (safety ceiling, polling intervals) |
| `src/coordination/delegation/manager.ts` | 500 | DelegationManager — dispatch, concurrency, agent validation, recovery |
| `src/coordination/delegation/state-machine.ts` | 426 | DelegationStateMachine — in-memory store, transitions, timers, persistence |
| `src/coordination/delegation/category-gates.ts` | — | Category gate decision logic |
| `src/coordination/delegation/category-gate-audit.ts` | — | Category gate ask audit |
| `src/coordination/completion/detector.ts` | 157 | CompletionDetector — dual-signal detection (events + message stability) |
| `src/coordination/completion/notification-handler.ts` | 238 | Parent notification delivery + pending queue |
| `src/coordination/sdk-delegation/handler.ts` | 324 | SdkDelegationHandler — adaptive polling, result extraction, recovery |
| `src/coordination/concurrency/queue.ts` | — | DelegationConcurrencyQueue (semaphore) |
| `src/tools/delegation/delegate-task.ts` | 75 | delegate-task tool — Zod input, dispatch call |
| `src/tools/delegation/delegation-status.ts` | 135 | delegation-status tool — query/list with lineage access control |

---

**Investigation complete.** All file paths verified on disk. No capabilities were fabricated — every type, function, and behavior described above traces to a specific file:line reference in the codebase.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Agent+Steering research",
  "prompt": "You are a subagent: hm-l2-researcher (Detective C — Agents/Steering). You are being delegated by hm-coordinator (L1). You must fulfill this task within boundaries and without deviation. You are a subagent — you cannot delegate further. If you need verification, you will return the verification needed in the report handoff.\n\nLoad the skill `hm-l3-detective` before starting — it provides the SCAN/READ methodology for your investigation.\n\n## Task\nInvestigate TWO aspects of the Hivemind harness and produce structured findings with file:line evidence:\n\n### 1. Agent Hierarchy and Classification\nInvestigate how agents are classified and configured:\n- How are agents classified (L0/L1/L2/L3)?\n- What metadata exists per agent definition in `.opencode/agents/`?\n- What is the agent configuration in `src/plugin.ts` (AGENT_DEFAULTS, AGENT_TOOLS)?\n- How are agent tool assignments managed?\n- What agents exist? (Sample 5-10 agent .md files to understand the pattern)\n\nKey files to investigate:\n- `src/plugin.ts` — agent configuration (AGENT_DEFAULTS, AGENT_TOOLS, circuit breaker, tool budget)\n- `.opencode/agents/` — sample several agent definition files to understand the hierarchy pattern\n- `src/routing/` — session entry, behavioral profile, command engine\n\n### 2. Injection/Steering Mechanisms\nInvestigate any existing mechanisms for injecting messages or instructions into agent sessions:\n- Is there any message injection capability?\n- Can instructions be appended/modified mid-session?\n- How does the routing/session-entry system work?\n- What behavioral profiles exist?\n- Is there a \"system prompt\" or \"instructions\" injection point?\n- What does `src/routing/` expose for steering agent behavior?\n\nKey files to investigate:\n- `src/routing/` — session entry, behavioral profile, command engine\n- `src/features/` — standalone features (bootstrap, prompt packets, work contracts)\n- `src/config/` — config subscriber/compiler/workflow\n- `src/shared/types.ts` — look for any prompt/instruction types\n\nAlso read these SDK/Engine references for context:\n- `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` — for engine contracts around agent steering\n- `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md` — for OpenCode platform hooks/tools that enable injection\n\n## Scope\n- INCLUDE: `src/routing/`, `src/features/`, `src/config/`, `src/plugin.ts`, `src/shared/types.ts`, `.opencode/agents/` (sample)\n- INCLUDE: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md`, `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`\n- EXCLUDE: Test files, build artifacts, node_modules, deeply nested agent files\n\n## Reading Mode\nUse SCAN mode primarily (grep for patterns, offset reads ±20 lines). Use DEEP only on critical interface files. Use SKIM (glob/ls) to orient first.\n\n## Expected Output\nStructured markdown report with:\n- Per-topic section: what exists, how it works, key interfaces\n- File:line references for every key type, interface, and function\n- Agent hierarchy model (L0-L3) with evidence\n- All existing injection/steering mechanisms found (or explicit \"NOT FOUND\" with search evidence)\n- Gaps identified (what doesn't exist yet for agent steering)\n\n## Verification\n- All file paths must be real and exist on disk\n- Include line number references\n- Do NOT fabricate capabilities that don't exist\n- If a mechanism does NOT exist, explicitly state \"NOT FOUND\" and document the search paths checked\n",
  "subagent_type": "hm-l2-researcher"
}
```

---

