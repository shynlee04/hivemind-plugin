# L1 traversal audit of agent ecosystem (@hm-l1-coordinator subagent)

**Session ID:** ses_1ef11c5a4ffeq0fxW22pofltfx
**Created:** 5/10/2026, 3:08:28 PM
**Updated:** 5/10/2026, 3:09:22 PM

---

## User

You are hm-l1-coordinator, being delegated by hm-l0-orchestrator. Dispatch L2 specialists to perform a TRAVERSAL AUDIT of the hm-* agent ecosystem. This is the SKELETON phase — before any merges or rewrites, we must understand how everything connects.

## TASK: Complete Traversal Audit of HM Agent Ecosystem

Map every initiation chain from user entry point through to terminal specialist, and inventory all gaps.

### Phase 1: Command → Agent Routing Map
Dispatch hm-l2-investigator to:
1. List ALL command files in `.opencode/commands/`
2. For each command, extract which agent it routes to (agent field in frontmatter)
3. For each command, extract which skills it references
4. Produce a table: Command → routes to Agent → Agent exists on disk? (yes/no)

### Phase 2: Agent → Skill Loading Map
Dispatch hm-l2-investigator to:
1. Read all 45 hm-l2-* agent files
2. Extract the `skills` field from each agent's YAML frontmatter
3. Verify each listed skill exists on disk at `.opencode/skills/`
4. Produce a table: Agent → listed skills → skill exists on disk? (yes/no)

### Phase 3: Agent Cross-Reference Verification
Dispatch hm-l2-auditor to:
1. For every hm-* agent (L0, L1, L2), read its body text
2. Find every reference to another agent (e.g., "spawned by hm-l1-coordinator", "delegates to hm-l2-reviewer")
3. Verify the referenced agent exists on disk
4. Check for: self-references (agent claiming to delegate to itself), circular references, dead references
5. Produce a table: Agent A → references Agent B → Agent B exists? (yes/no) → Self-reference? → Circular?

### Phase 4: Gap Inventory
From the above data, identify:
1. **Orphan agents**: agents with NO command that routes to them and NO agent that references them as downstream
2. **Dead-end agents**: agents referenced by others but don't exist on disk
3. **Unreachable agents**: agents that exist but no initiation path reaches them (no command→agent→delegation chain)
4. **Broken chains**: agents whose upstream/downstream references don't form valid paths back to L0
5. **Missing agents**: gaps where the system needs an agent that doesn't exist (based on command routing or delegation references)

### Phase 5: Domain Classification Audit
Verify each agent's claimed `domain` in YAML matches its actual body content and peer references:
1. Does the agent's body actually describe the domain it claims?
2. Are there agents claiming the same domain that SHOULD be one agent?
3. Are there domains with NO agent coverage?

### Output Format
Return a single structured report with:
1. Command→Agent routing table (all commands)
2. Agent→Skill loading table (all hm-* agents with skills)
3. Agent cross-reference matrix (all hm-* agents referencing each other)
4. Gap inventory: orphan, dead-end, unreachable, broken chain, missing
5. Domain coverage map

### Scope Boundaries
- Work on: reading command files, agent files, skill file existence checks
- Do NOT modify any files
- Do NOT create new documents in the planning directory
- Return results directly in your response
- Focus on hm-* lineage only (hf-* can be done later)

### Success Metrics
- Every hm-* agent categorized as: reachable / orphan / unclear
- Every command mapped to at least one agent
- Every cross-reference verified (exists/doesn't exist on disk)
- All gaps named with specific file references

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 53.6s)

_Thinking:_

The user is asking me to act as hm-l1-coordinator, being delegated by hm-l0-orchestrator, to dispatch L2 specialists for a TRAVERSAL AUDIT of the hm-* agent ecosystem. This is a coordination task where I need to:

1. Decompose the task into waves of L2 specialist dispatches
2. Dispatch parallel specialists
3. Collect and validate results
4. Consolidate into a unified report

Let me start by announcing my role, loading the necessary skills, and then decomposing the task into L2 specialist dispatches.

First, let me load the mandatory skills for hm-l1-coordinator and understand the task structure.

The task has 5 phases but they fall into a clear wave structure:
- Wave 1 (parallel): Phase 1 + Phase 2 can run in parallel since they're independent (both read different things)
- Wave 2 (depends on Wave 1): Phase 3 depends on results from Phase 1 and 2
- Wave 3 (depends on Wave 2): Phase 4 + Phase 5 depend on all previous results

Actually, let me think more carefully:
- Phase 1: Command→Agent routing - independent
- Phase 2: Agent→Skill loading - independent  
- Phase 3: Agent cross-reference - independent of phases 1 and 2 result-wise, but conceptually grouped
- Phase 4: Gap inventory - depends on phases 1, 2, 3
- Phase 5: Domain classification - depends on phase 3

So actually, Phase 1, 2, and 3 are all independent of each other! They all read different aspects of the same files. I can dispatch them all in parallel as Wave 1, then do Phase 4 and 5 as Wave 2.

But the rules say max 2 parallel delegations. Let me do:
- Wave 1: Phase 1 + Phase 2 (2 parallel)
- Wave 2: Phase 3 (depends on nothing, but following the 2-parallel rule)
- Wait, Phase 3 is independent too. But since we can only do 2 parallel, let me batch:

Actually, re-reading: "DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION."

So I can do:
- Wave 1: Phase 1 + Phase 3 (2 parallel) - wait, 3 is independent
- Wave 1: Phase 1 + Phase 2 (2 parallel) - these are most tightly related

Then:
- Wave 2: Phase 3 (1 sequential - depends on having all agent files read)
- Actually Phase 3 doesn't depend on results of 1 and 2, but running it after makes sense for consolidation.

Let me plan the waves:
- Wave 1: Phase 1 (command→agent) + Phase 2 (agent→skill) in parallel
- Wave 2: Phase 3 (agent cross-reference) - could run in parallel with 1 and 2 since it's independent... Let me maximize parallelism:
  - Wave 1: Phase 1 + Phase 2 (2 parallel)
  - Wave 2: Phase 3 (single - auditor)
  - Wave 3: Phase 4 + Phase 5 (2 parallel, depend on all previous)

Actually wait - the rule says max 2 parallel. So:
- Wave 1: Phase 1 and Phase 2 (2 parallel investigations)
- Wave 2: Phase 3 (1 auditor, since we can only do 2 at a time and Phase 1+2 were the other 2)
- Wave 3: Phase 4 and Phase 5 (2 parallel, depends on all earlier)

Hmm, but Phase 3 doesn't actually depend on Phase 1 or 2 results. The task description says I should identify "parallel-executable vs. sequential tasks." Phases 1, 2, and 3 are ALL independent. So:
- Wave 1: Phase 1 and Phase 2 (2 parallel) + Phase 3 could also run in parallel but we're limited to 2

Let me think about whether to combine Phase 1+2 into one delegation or keep them separate...

I think the cleanest approach:
- Wave 1: Phase 1 (investigator) + Phase 2 (investigator) in parallel (2 parallel max)
- Wave 2: Phase 3 (auditor) - runs after Wave 1 completes (but is independent)
- Wave 3: Phase 4 + Phase 5 in parallel (after all data collected)

Actually, since Phase 3 is independent of Phases 1-2, I could run it in Wave 1 with them as a 3-way parallel if not for the 2-parallel limit. But since I'm limited to 2, I'll batch Phase 1+2 together in Wave 1, then Phase 3 in Wave 2.

Alternatively, I could have one investigator do both Phase 1 and 2. But they're conceptually distinct and would make for a very long task. Let me keep them separate.

Let me now load the mandatory skills and start dispatching. First, the mandatory skills for hm-l1-coordinator:
- hm-l2-coordinating-loop
- hm-l3-subagent-delegation-patterns

Also, given the task involves completion verification, I might need hm-l2-completion-looping.

Let me load the skills and start the dispatch.

I am **hm-coordinator**, L1 wave manager for hm-* lineage. I dispatch, validate, and consolidate — I never implement.

For this TRAVERSAL AUDIT, I'll load my mandatory coordination skills, then decompose into waves and dispatch L2 specialists. Let me start.

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
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/references/04-ralph-loop-integration.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-subagent-delegation-patterns"
}
```

**Output:**
```
<skill_content name="hm-l3-subagent-delegation-patterns">
# Skill: hm-l3-subagent-delegation-patterns

## Overview

Document and apply delegation patterns for subagent dispatch in OpenCode. Use when dispatching subagents, resuming interrupted sessions, implementing checkpoint protocols, or designing wave-based execution flows. Produces validated delegation configurations with session tracking and recovery procedures.

## The Iron Law

```
Delegation without session tracking is fire-and-forget. Always track, always resume, never recreate.
```

# Subagent Delegation Patterns
## On Load

1. Read `references/delegation-envelopes.md` — canonical dispatch envelope templates
2. Read `references/checkpoint-protocols.md` — checkpoint types, return formats, resume logic
3. Read `references/wave-execution.md` — wave-based parallel execution patterns
4. Read `references/handoff-edge-guardrails.md` — metadata and guardrails for every agent boundary

## Delegation Protocol

## Rich Handoff Lineage

Phase 30 adopts handoff and boundary concepts from OpenAI Agents SDK handoffs/guardrails, AutoGen `HandoffMessage`, and Claude Code subagent lifecycle hooks. Local rule: a delegation is a durable handoff edge with metadata, guardrails, and a return envelope; it is not just a prompt.

### Handoff Metadata Required

Every dispatch or resume envelope must include:

| Field | Purpose |
|-------|---------|
| `source_agent` | Who initiated the handoff and owns verification. |
| `target_agent` | Exact specialist identity or configured agent name. |
| `handoff_reason` | Why this child is the correct boundary crossing. |
| `allowed_destinations` | Whether the child may delegate further; empty means no. |
| `history_policy` | What context is included, filtered, or intentionally omitted. |
| `expected_return` | Status values, artifacts, evidence, and checkpoint format. |
| `resume_pointer` | Exact continuation point if interrupted. |

Before accepting a child return, run boundary guardrails: output shape, scope compliance, verification evidence, and unauthorized-tool/delegation detection.

### The Real Execution Model

Subagent dispatch is NOT fire-and-forget. It is:

```bash
# 1. INIT — load context via CLI tool or state file
INIT=$(cat .planning/STATE.md 2>/dev/null)

# 2. PARSE — extract current phase, incomplete plans, session state
# Fields: current_phase, completed_plans, incomplete_plans, blockers

# 3. CONNECT — verify session exists and is resumable
# Check task_id from previous delegation; if absent, treat as new

# 4. LAUNCH — execute with explicit session tracking
# Each task gets atomic commit with hash tracking
git add <specific-files>  # NEVER git add .
git commit -m "phase: {phase}-{plan} — {description}"
TASK_COMMIT=$(git rev-parse --short HEAD)

# 5. FAIL/RESUME — checkpoint detection
grep -n "type=\"checkpoint\"" [plan-path]
# Pattern A: No checkpoints → execute all
# Pattern B: Has checkpoints → execute until checkpoint, STOP, return structured message
# Pattern C: Continuation → verify commits exist, resume from specified task
```

### Resume by Session ID (NEVER Recreate)

When a session disconnects:
1. **DO NOT create new tasks** — resume the existing delegated task
2. Use the session ID from the previous `task` call
3. The task tool supports `task_id` parameter for resuming
4. Check `.planning/phases/NN-name/SUMMARY.md` for completion status
5. Re-query plan index to get incomplete plans
6. Re-execute only incomplete plans

### Handoff Edge Guardrails

| Edge | Guardrail | Reject if |
|------|-----------|-----------|
| Parent → child | Envelope has identity, scope, allowed destinations, history policy | Missing field or ambiguous owner |
| Child → tool | Tool use is within envelope permissions | Tool changes out-of-scope files or hidden state |
| Child → parent | Return includes evidence and status protocol | DONE without verification evidence |
| Parent → next child | Prior child accepted and trace recorded | Handoff chain has unresolved blocker |

### Checkpoint Return Format

When a checkpoint is reached, the subagent returns:

```markdown
## CHECKPOINT REACHED
**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1    | [name] | [hash] | [key files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]
```

### Deviation Rules (Auto-Fix Protocol)

| Rule | Action | When |
|------|--------|------|
| 1 | Auto-fix bugs | Broken behavior, errors, null pointers |
| 2 | Auto-add missing functionality | Error handling, auth, validation |
| 3 | Auto-fix blocking issues | Missing deps, broken imports |
| 4 | Stop and ask | Architectural changes (new DB tables, major schema) |

**Fix attempt limit:** 3 per task → STOP, document in SUMMARY.md

### Wave-Based Parallel Execution

```
Phase → Plans grouped by wave number
Wave 1: Plans with depends_on: [] (run parallel via Promise.allSettled)
Wave 2: Plans with depends_on: ["01"] (run after Wave 1 completes)
Wave N: Plans with depends_on: [previous waves]
```

## Context Continuity

### Session ID Tracking

Every delegation MUST capture and persist the session ID:

```bash
# After dispatch, record the task_id
TASK_ID="${DELEGATION_RESULT}"
echo "$TASK_ID" > .planning/phases/${PHASE}/.last-delegation-id
```

### State Persistence Across Sessions

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `.planning/STATE.md` | Project state, phase completion | After every phase |
| `.planning/phases/NN/.last-delegation-id` | Last delegated task ID | After every delegation |
| `.planning/phases/NN/SUMMARY.md` | Phase execution summary | After phase completes |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fire-and-Forget** | Dispatches subagents without session tracking | Track session IDs, support resume |
| **The Re-Creator** | Creates new tasks instead of resuming existing ones | Use session ID to resume delegated tasks |
| **The Context Polluter** | Passes session history to subagents | Construct fresh context: task text + scene-setting + scope |
| **The Silent Fail** | Subagent returns without checkpoint or status | Enforce structured return format on every delegation |
| **The Infinite Retry** | Retries same failing approach >3 times | STOP at 3, document, escalate |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/delegation-envelopes.md` | Always — canonical dispatch envelopes |
| `references/checkpoint-protocols.md` | When implementing checkpoint/resume logic |
| `references/wave-execution.md` | When executing multi-plan phases with dependencies |
| `references/handoff-edge-guardrails.md` | When accepting/rejecting a child return or designing a handoff edge |

## Self-Correction

### When the Task Keeps Failing

[Detection] If subagent dispatch keeps failing (agent not found, invalid envelope, timeout), first verify that the agent name in the dispatch matches a real `.opencode/agents/` file — typos are the most common cause of silent dispatch failures. Check whether the target agent has the necessary tool permissions for the task scope. If the same subagent returns DONE without verification evidence 3 times, stop re-dispatching and escalate — the subagent may not be capable of the assigned verification.

[Recovery] Verify agent name against filesystem. Check tool permissions match task scope. After 3 evidence-free returns, escalate with exact subagent output and missing evidence types.

### When Unsure About the Next Step

[Detection] If you cannot determine whether to resume an existing delegation or create a new one, check `.last-delegation-id` and `.planning/STATE.md` for the task's current status. If a session ID exists but the task appears to have completed (SUMMARY.md shows done), create a new delegation for follow-up work. If the session ID exists and the task is incomplete, resume using task_id. If no session ID exists and no state files reference the task, create a new delegation.

[Recovery] Check state files before deciding. Resume with task_id for incomplete work. Create new delegation only for genuinely new tasks.

### When the User Contradicts Skill Guidance

[Detection] If the user wants to dispatch without handoff metadata ("just send it"), explain that missing metadata prevents proper session tracking and resume — a fire-and-forget dispatch cannot be recovered if interrupted. If the user insists, dispatch with minimal metadata (at minimum: source_agent, target_agent, expected_return) but document the missing fields as a deviation. If the user wants to exceed the 3-retry fix attempt limit, allow it but warn that repeated retries without approach changes are likely to fail.

[Recovery] Minimum viable metadata: source, target, expected_return. Document deviations from full envelope. Allow retry override with documented warning.

### When an Edge Case Is Encountered

[Detection] If a subagent is dispatched but the session is interrupted before it returns, the delegation state may be lost — check `.hivemind/state/delegations.json` for the delegation record, and if absent, treat as a new dispatch with a note about the possible duplicate. If two parallel subagents modify overlapping files, serialize their execution and use git to resolve conflicts — never let parallel agents write to the same file. If a subagent delegates further (child-of-child), verify that allowed_destinations in the original envelope permitted it before accepting the grandchild's results.

[Recovery] Check delegations.json for lost records. Serialize overlapping-file agents. Verify allowed_destinations before accepting grandchild results.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hf-agents-and-subagents-dev` | Owns agent definitions and permission profiles. This skill owns the dispatch patterns and resume protocols. |
| `hm-coordinating-loop` | Owns general multi-agent dispatch and orchestration. This skill owns the subagent-specific execution mechanics. |
| `hm-planning-persistence` | Owns task_plan.md/findings.md/progress.md in `.hivemind/state/planning/<session-id>/`. This skill consumes those files for state-aware dispatch. |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/handoff-edge-guardrails.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/delegation-envelopes.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/wave-execution.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/checkpoint-protocols.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-completion-looping"
}
```

**Output:**
```
<skill_content name="hm-l2-completion-looping">
# Skill: hm-l2-completion-looping

## Overview

Guardrail skill that prevents premature task completion by enforcing verification loops. Use when building autonomous agent workflows, verifying subagent results, or ensuring tasks actually complete before moving on. Produces self-verifying execution flows with automatic loop-back on failure detection.

## The Iron Law

```
A task is not done when the subagent says it is done. A task is done when verification proves it is done.
```

# Completion Looping
## On Load

1. Read `references/verification-checklist.md` — criteria for true completion
2. Read `references/loop-patterns.md` — loop types and when to use each
3. Read `references/durable-completion-cursors.md` — resumable cursor schema for interrupted loops

## Completion Detection

## Rich Guardrail Lineage

Phase 30 hardening adopts three third-party guardrail patterns without adding runtime dependencies:

| Pattern | Source lineage | Local rule |
|---------|----------------|------------|
| Durable cursor loop | LangGraph durable execution/checkpointers | Persist loop cursor before any resume claim: task id, iteration, verification command, last gate result, and next resume pointer. |
| Composable termination predicates | AutoGen termination conditions | Completion requires named predicates, not a single "done" sentence: output, quality, scope, max-iteration, timeout/budget, and external/human stop. |
| Per-edge guardrail evidence | OpenAI guardrails/tracing | Each child return is a traceable guardrail edge; parent must record which gate accepted or rejected it. |

Load `references/durable-completion-cursors.md` when a loop may span turns, sessions, subagents, or human checkpoints.

### The Three Gates

| Gate | Check | Failure Action |
|------|-------|---------------|
| **Output Gate** | Did the subagent produce the expected artifacts? | Re-dispatch with corrected scope |
| **Quality Gate** | Do artifacts pass basic validation (syntax, structure, references)? | Return DONE_WITH_CONCERNS, fix then re-verify |
| **Scope Gate** | Does output match the task envelope (nothing extra, nothing missing)? | Re-dispatch with spec-compliance emphasis |

### Loop Types

| Type | Use When | Max Iterations |
|------|----------|---------------|
| **Verify-After** | Subagent returns → verify → loop if fail | 5 |
| **Verify-During** | Subagent works in iterations, verifies each | 10 |
| **Guardrail** | External monitor watches for premature completion | 3 |

### Durable Cursor Fields

Every loop that can resume later MUST write a cursor before stopping or asking a human:

```yaml
task_id: "<stable task/session id>"
iteration: 2
max_iterations: 5
verification_command: "<command or manual check>"
last_gate_result: "output:pass quality:fail scope:pass"
termination_predicates: [output_gate, quality_gate, scope_gate, max_iteration, external_stop]
resume_pointer: "rerun quality gate after fixing <specific issue>"
```

No cursor means no resume claim; restart from a verified checkpoint instead of trusting chat memory.

## Self-Verification Envelope

When dispatching a subagent that must self-verify:

```
## Your Task
<full task text>

## Verification Requirements
Before returning DONE, you MUST:
1. [ ] Run <verification command>
2. [ ] Confirm <output condition>
3. [ ] If any check fails, return DONE_WITH_CONCERNS, not DONE

## Loop-Back Trigger
If verification fails, you will be re-dispatched with:
- Previous attempt findings
- Specific check that failed
- Corrected scope if needed
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Premature Done** | Subagent returns DONE without running tests/validation | Enforce verification requirements in task envelope |
| **The Infinite Loop** | Same failing approach retried >5 times | Cap iterations, escalate to orchestrator |
| **The Silent Fix** | Loop iteration makes changes without logging | Require progress logging in each iteration |
| **The Skipped Gate** | Quality gate passes but scope gate fails | Run ALL gates before accepting completion |

## Self-Correction

### When the Task Keeps Failing

If completion keeps failing to verify, first check whether the verification command in PLAN.md is actually runnable — sometimes plan-specified commands reference missing scripts, wrong paths, or tools not installed in the environment. If the verification command references a test file that doesn't exist, report it as a planning gap rather than a completion failure — the plan should have included test creation. If the same verification gate fails 3 times, stop retrying and escalate with the exact command output, the expected result, and the actual result so the user can assess whether the verification criteria are achievable.

### When Unsure About the Next Step

Default to the most conservative interpretation — if you cannot verify completion, treat the task as incomplete and report exactly why verification failed. Do not guess at what "done" means; re-read the task's acceptance criteria and run the specified verification commands. If the task has no automated verification at all, flag it as a verification gap and suggest adding explicit verification before claiming done. The safe default is always: unverified = incomplete.

### When the User Contradicts Skill Guidance

If the user says "it's done" but automated verification fails, run the failing verification command in front of the user and show the specific output — let the user see the evidence rather than taking their word against the test results. If the user wants to accept a partial completion, document which acceptance criteria passed and which were waived, along with the user's rationale. The user can override verification, but the override must be explicit and documented — never silently waive a failing gate.

### When an Edge Case Is Encountered

If a task has no automated verification at all (no test command, no file existence check, no grep pattern), flag it as a Nyquist gap — a missing verification that means completion cannot be objectively assessed — and suggest adding verification criteria before claiming done. If a subagent returns DONE_WITH_CONCERNS but the concerns are unrelated to the task scope (e.g., linting warnings in files the subagent didn't touch), accept the result and note the out-of-scope concerns separately rather than looping. If the loop count exceeds the maximum for the loop type, escalate immediately rather than adjusting the cap.

| File | When to Read |
|------|-------------|
| `references/verification-checklist.md` | Need criteria for true completion |
| `references/loop-patterns.md` | Need to choose loop type for a task |
| `references/durable-completion-cursors.md` | Need resumable loop state, evidence spans, or human checkpoint continuity |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Owns general multi-agent dispatch. This skill adds completion guardrails to that dispatch. |
| `hm-phase-loop` | Owns iterative phase semantics. This skill owns the verification logic within iterations. |
| `hm-planning-persistence` | Owns task_plan.md tracking in `.hivemind/state/planning/<session-id>/`. This skill updates verification status in the plan. |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/references/verification-checklist.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/references/loop-patterns.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/references/durable-completion-cursors.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-completion-looping/metrics/rich-gate-scorecard.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 446.4s)

_Thinking:_

Skills loaded. Now let me plan the waves:

**Wave decomposition:**

This is a read-only traversal audit — no files are modified. Tasks are:
1. Phase 1 (Command→Agent routing) - investigator: independent
2. Phase 2 (Agent→Skill loading) - investigator: independent
3. Phase 3 (Agent cross-reference) - auditor: independent of 1+2 results

Actually, all three are independent. But we're limited to 2 parallel. Let me reconsider: Phase 3 needs agent files read, but it doesn't need Phase 1 or 2 results. So I could run Phase 1 + Phase 2 in Wave 1 (parallel), then Phase 3 in Wave 2, then Phase 4 + 5 in Wave 3.

But wait — Phase 3 is reading the same agent files that Phase 2 reads. While the tasks don't share mutable state (they're all read-only), the "2 parallel max" rule from AGENTS.md is hard. Let me structure:

- **Wave 1 (parallel, 2 specialists):** Phase 1 (commands→agents) + Phase 2 (agents→skills)
- **Wave 2 (single):** Phase 3 (agent cross-references)  
- **Wave 3 (single or parallel):** Phase 4 (gap inventory) + Phase 5 (domain classification) — these depend on all prior data

Actually, Phase 5 depends on Phase 3 data but Phase 4 depends on ALL data. So:
- After Wave 2 completes, I'll have all data needed for Phase 4 and 5.
- I could run Phase 4 + Phase 5 in parallel as Wave 3.

Let me proceed with this plan. First, let me build the task inventory and dispatch Wave 1.

Actually wait - I need to think about whether Phase 1 and 2 can truly run in parallel. Phase 1 reads 18 command files. Phase 2 reads 45 hm-l2-* agent files. These are different files, so no file overlap. They're both read-only. Parallel is fine.

But I should also consider: should I dispatch Phase 3 alongside Phase 1 and 2 in Wave 1? Phase 3 reads the same agent files as Phase 2 but doesn't modify them. However, "max 2 parallel" rule says no.

Let me also consider a practical approach: since all phases are read-only and independent (Phase 3 depends only on files existing, not on results of 1-2), I could batch Phase 1+2 as Wave 1 and Phase 3 as Wave 2. Then Phase 4+5 as Wave 3.

Actually, I realize I could be smarter about this. Phase 3 can batch with Phase 1 and Phase 2... but 2 at a time. So:

Wave 1: Phase 1 + Phase 3 (both are investigator/auditor reading different files)
Wave 2: Phase 2 (depends on... nothing, but there are only 2 parallel slots)
Wait no, Phase 2 reads agent files for skills, Phase 3 reads agent files for cross-references. Same files. Better to serialize these.

Let me just go with:
- Wave 1 (parallel 2): Phase 1 + Phase 2
- Wave 2 (single): Phase 3  
- Wave 3 (parallel 2): Phase 4 + Phase 5

Let me now write the task inventory to a coordination file and then dispatch Wave 1.

Actually, the coordinating-loop skill says to write task plan, run scripts etc. But since these scripts might not exist or work in this environment, I should focus on the core pattern: ASSESS, DISPATCH, MONITOR, INTEGRATE, VERIFY.

Let me proceed with dispatching. I'll build structured task envelopes for each wave's specialists.

Let me now dispatch Wave 1: Phase 1 (command→agent) and Phase 2 (agent→skill) in parallel using the Task tool.

Skills loaded. Now ASSESS → DECIDE → DISPATCH.

## Phase 0: Task Inventory

| Task | Domain | Files | Dependencies |
|------|--------|-------|-------------|
| T1: Command→Agent routing map | Intelligence | `.opencode/commands/*.md` | None |
| T2: Agent→Skill loading map | Intelligence | `.opencode/agents/hm-*.md`, `.opencode/skills/` | None |
| T3: Agent cross-reference verification | Audit | `.opencode/agents/hm-*.md` | None (reads same files as T2) |
| T4: Gap inventory | Synthesis | Results from T1, T2, T3 | T1, T2, T3 |
| T5: Domain classification audit | Audit | Results from T3 | T3 |

**Decision:** All read-only, no shared mutable state. T1+T2 independent (different files). Limited to 2 parallel per rules.

**Wave plan:**
- **Wave 1 (parallel):** T1 + T2 — 2 investigators
- **Wave 2 (single):** T3 — 1 auditor
- **Wave 3 (parallel):** T4 + T5 — 1 investigator + 1 auditor

---

## Wave 1: Dispatch T1 + T2 in parallel

**Tool: task**

**Input:**
```json
{
  "description": "Phase 1: Command→Agent routing",
  "subagent_type": "hm-l2-investigator",
  "prompt": "You are the subagent hm-l2-investigator. You are being delegated by hm-l1-coordinator as part of a TRAVERSAL AUDIT of the hm-* agent ecosystem. You must fulfill your work within these boundaries. This is READ-ONLY — never modify files.\n\n## Task\nProduce a complete Command→Agent routing table for ALL command files.\n\n## Scope\n- INCLUDE: All files in `.opencode/commands/` directory\n- EXCLUDE: Do NOT read agent files, skill files, or any files outside `.opencode/commands/`\n- This is READ-ONLY. Do NOT create, edit, or delete any files.\n\n## Context\nThis is Phase 1 of a 5-phase traversal audit. We need to map every initiation chain from user entry point (commands) through to the agents they route to. The project has ~18 command files in `.opencode/commands/`. Each command file has YAML frontmatter with fields like `agent`, `skills`, etc.\n\n## Expected Output\nProduce a structured table with these exact columns:\n1. **Command file** (filename only, e.g., `start-work.md`)\n2. **Agent routed to** (the `agent` field from YAML frontmatter)\n3. **Agent file exists on disk?** (YES if a matching `.opencode/agents/<agent-name>.md` file exists, NO if not — you MUST check)\n4. **Skills referenced** (list from frontmatter)\n5. **Command description** (the `description` field from frontmatter)\n\nReturn the table in this markdown format:\n\n```\n## Phase 1: Command → Agent Routing Map\n\n| # | Command | Agent | Agent Exists? | Skills | Description |\n|---|---------|-------|---------------|--------|-------------|\n| 1 | cmd.md | agent-name | YES/NO | skill1, skill2 | desc |\n```\n\nAfter the table, list:\n- **Total commands:** N\n- **Commands routing to missing agents:** (list with file:line references)\n- **Commands with no agent field:** (list)\n\n## Verification\nBefore returning, verify:\n1. Every `.opencode/commands/*.md` file is represented in the table\n2. Every \"Agent Exists?\" field was verified by checking actual filesystem (glob `.opencode/agents/<name>.md`)\n3. Include file paths in your results (e.g., `.opencode/commands/start-work.md` line 3 for agent field)\n\nReturn ONLY your findings. No recommendations, no code changes."
}
```

**Error:**
```
Tool execution aborted
```

**Tool: task**

**Input:**
```json
{
  "description": "Phase 2: Agent→Skill loading map",
  "subagent_type": "hm-l2-investigator",
  "prompt": "You are the subagent hm-l2-investigator. You are being delegated by hm-l1-coordinator as part of a TRAVERSAL AUDIT of the hm-* agent ecosystem. You must fulfill your work within these boundaries. This is READ-ONLY — never modify files.\n\n## Task\nProduce a complete Agent→Skill loading table for ALL hm-* agents.\n\n## Scope\n- INCLUDE: All agent files matching `.opencode/agents/hm-*.md` (this covers hm-l0-*, hm-l1-*, hm-l2-*)\n- INCLUDE: Verify skill existence by checking `.opencode/skills/<skill-name>/SKILL.md` for each skill listed\n- EXCLUDE: hf-* agents, gsd-* agents\n- This is READ-ONLY. Do NOT create, edit, or delete any files.\n\n## Context\nThis is Phase 2 of a 5-phase traversal audit. We need to map which skills each hm-* agent loads. Each agent file has YAML frontmatter that may include a `skills` field listing skills the agent should load. We must verify each skill actually exists on disk. There are 45+ hm-* agent files. Some agents may not have a `skills` field in their frontmatter at all. Some skills may be referenced but not exist on disk.\n\n## Expected Output\nProduce a structured table with these exact columns:\n1. **Agent** (filename without .md, e.g., `hm-l2-researcher`)\n2. **Skills listed in frontmatter** (comma-separated list, or \"(none)\" if no skills field)\n3. **Each skill exists on disk?** (for each skill, YES/NO with the path checked, e.g., `hm-detective:YES (.opencode/skills/hm-l3-detective/SKILL.md)`)\n4. **Total skills listed** (count)\n5. **Missing skills** (list any skills that don't exist on disk)\n\nReturn the main table grouped by agent level (L0, L1, L2):\n\n```\n## Phase 2: Agent → Skill Loading Map\n\n### L0 Agents\n\n| # | Agent | Skills Listed | Exist? | Count | Missing |\n|---|-------|--------------|--------|-------|---------|\n| 1 | hm-l0-orchestrator | skill-a, skill-b | skill-a:YES, skill-b:NO | 2 | skill-b |\n\n### L1 Agents\n\n| # | Agent | Skills Listed | Exist? | Count | Missing |\n|---|-------|--------------|--------|-------|---------|\n\n### L2 Agents\n\n| # | Agent | Skills Listed | Exist? | Count | Missing |\n|---|-------|--------------|--------|-------|---------|\n```\n\nAfter the tables, produce a summary:\n- **Total hm-* agents analyzed:** N\n- **Agents with NO skills field:** (list)\n- **Agents with ALL skills existing:** N\n- **Agents with missing skills:** N (list with missing skill names)\n- **Orphan skills** (skills referenced by agents but don't exist on disk): (list)\n\n## Verification\nBefore returning, verify:\n1. Every `.opencode/agents/hm-*.md` file is represented in the table\n2. Every skill reference was verified against actual filesystem (check `.opencode/skills/<name>/SKILL.md`)\n3. Include exact file paths and line numbers for frontmatter fields\n\nReturn ONLY your findings. No recommendations, no code changes."
}
```

**Error:**
```
Tool execution aborted
```

---

