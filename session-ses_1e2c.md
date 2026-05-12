# Session-tracker deep research wave (@hm-l1-coordinator subagent)

**Session ID:** ses_1e2c8a285ffeiAV13cdZhZF887
**Created:** 5/13/2026, 12:23:48 AM
**Updated:** 5/13/2026, 12:26:32 AM

---

## User

You are the subagent hm-l1-coordinator, delegation coordinator for wave-based L2 specialist execution. You are being delegated by L0 hm-orchestrator. You must coordinate this research wave and return consolidated results.

## Mission
Execute a deep research wave to understand the complete session-tracker pipeline, OpenCode SDK architecture, and all edge cases — producing SPEC, CONTEXT, and Research documents for a proper Phase 14 plan (NOT patch fixes).

## Background
Phase 13 applied 5 fixes to session-tracker. All 256 tests pass, typecheck is clean, build is clean. HOWEVER, the user has declared ALL 5 fixes as "wrong logics" — the understanding was shallow, missing critical edge cases. The fixes will cause regressions in a loop.

## What You Must Research (DO NOT SKIP ANY)

### 1. OpenCode SDK Deep Dive
- Study the OpenCode SDK task tool: its arguments (subagent_type, description, prompt, task_id, command), its lifecycle (when session IDs are created — at INPUT time, not output), what information is available at each lifecycle stage
- Study plugin hooks: PreToolUse, PostToolUse, event observer signatures — what data fields are available
- Research how OpenCode handles session resume (via task_id), fork from message, revert/undo
- Use online resources: Context7, Deepwiki for anomalyco/opencode, GitHub code search
- Reference: src/shared/session-api.ts for the SDK wrapper in this project

### 2. Current Session-Tracker Code (ALL files)
Study EVERY file in src/features/session-tracker/:
- index.ts: SessionTracker class — ensureSessionReady(), handleChatMessage(), handleToolExecuteAfter(), handleSessionCreated()
- capture/tool-capture.ts: handleTask() — how task tool sessions are captured, hierarchy registration
- capture/message-capture.ts: message pipeline for user/assistant messages
- capture/event-capture.ts: session lifecycle events
- persistence/hierarchy-index.ts: in-memory Map — persistence gaps
- persistence/session-index-writer.ts: incrementTurnCount(), addChild()
- persistence/session-writer.ts, child-writer.ts, atomic-write.ts
- persistence/project-index-writer.ts
- recovery/session-recovery.ts
- transform/agent-transform.ts, schema-normalizer.ts
- types.ts: all type definitions

Map the COMPLETE event flow: OpenCode event → plugin hook → SessionTracker method → persistence action

### 3. Sample Session Exports (ALL 15 files)
Study these manual session exports to understand real-world session shapes:
- session-ses_1ed9.md, session-ses_1eea.md, session-ses_1ef1.md
- session-ses_1f2d.md, session-ses_1f10.md, session-ses_1f11.md
- session-ses_20bf.md, session-ses_22ee.md, session-ses_22fd.md
- session-ses_23a0.md, session-ses_207a.md, session-ses_2043.md
- session-ses_2069.md, session-ses_2096.md, session-ses_2176.md

For each session, identify: is it L0/L1/L2? What tools were used? Were there task delegations? What was the turn count? What agent messages exist?

### 4. Current .hivemind/session-tracker State
Study the actual on-disk state to identify orphans, misclassifications, missing data:
- .hivemind/session-tracker/project-continuity.json
- All session directories and their session-continuity.json files
- Identify: which sessions are orphans? Which have wrong parentID? Which are missing from project-continuity.json?

### 5. Previous Phase Context
- Phase 11: .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/
- Phase 12: .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/
- Phase 13 context: .planning/debug/session-parent-misclassify.md and .planning/debug/session-parent-misclassify-AWAITING-AUTH-2026-05-12.md
- Phase 13 UAT: .planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-UAT.md

### 6. Plugin Wiring
Study src/plugin.ts to understand how session-tracker hooks are wired into OpenCode event observers.

## Edge Cases You MUST Understand

1. **Task tool session ID creation:** Session ID is generated at INPUT dispatch time, not at output completion. This means even aborted/incomplete sessions exist and are resumable.

2. **L1 vs L2 distinction:** L1 = task tool from L0. L2 = task tool from L1. These are NOT the same level. How to detect? Parent chain lookup.

3. **Session resume:** When agent uses task tool with existing task_id, it resumes the SAME session — NOT a new one. The resumed session is still at its original depth (L1 or L2), not a new L3.

4. **Fork from message:** User can fork from a previous message to start a new session. This new session is L0 (main), but shares the same L1/L2 children as the original L0 it forked from.

5. **Revert/undo messages:** User can undo messages. This doesn't create new sessions but may affect turn counting.

6. **turnCount-based classification:** Main session = turnCount == 1 (first user prompt starts it). Resumed main = turnCount > 1. ALL task-tool sessions = children (L1 or L2).

7. **Race conditions:** Events arrive asynchronously. session.created may fire BEFORE tool.execute.after. HierarchyIndex is in-memory only — lost on restart.

8. **On-disk programmatic capture:** The SDK doesn't expose parentID at creation time or hierarchy depth. The session-tracker must hand-weave this through event observation ordering and on-disk state.

## Required Output Artifacts

### 1. RESEARCH.md (in .hivemind/planning/session-tracker-deep-fix-2026-05-13/)
Comprehensive research findings covering ALL 6 research areas above. Must include:
- OpenCode SDK task tool lifecycle (inputs, outputs, session ID generation timing)
- Complete event flow diagram
- All edge cases with analysis
- Current code flaws mapped to root causes
- Sample session analysis results
- Current .hivemind/ state analysis

### 2. SPEC.md (in same directory)
Formal specification for the session-tracker feature. Must include:
- Correct 3-level hierarchy model (L0→L1→L2)
- Classification rules for each level
- Edge case handling for fork, resume, revert
- Parent chain lookup algorithm
- Persistence requirements
- turnCount semantics
- Event ordering guarantees needed

### 3. CONTEXT.md (in same directory)
Complete context document capturing:
- What was previously understood (and why wrong)
- What the correct understanding is
- All edge cases documented
- Anti-patterns to avoid
- Design decisions and rationale

## Coordinated Path Rules
- Dispatch L2 specialists sequentially (max 2 parallel)
- Each specialist gets a clear scope boundary
- Do NOT show specialists HOW to implement — show WHAT to investigate, expected output format, verification
- Collect all results and synthesize into the 3 output documents
- Verify all documents are written to disk before returning

## Specialist Assignment Suggestions
- hm-l2-researcher: OpenCode SDK research (online + code)
- hm-l2-scout / hm-l2-context-mapper: Current code mapping, sample session analysis
- hm-l2-investigator: Current .hivemind/ state analysis
- hm-l2-synthesizer: Synthesize all findings into final documents

## Verification
- All 3 documents exist on disk at .hivemind/planning/session-tracker-deep-fix-2026-05-13/
- RESEARCH.md covers all 6 areas
- SPEC.md contains correct 3-level hierarchy
- CONTEXT.md captures anti-patterns and rationale
- All findings are traceable to source evidence

## Boundary
- Do NOT implement any code fixes
- Do NOT create a phase plan (that's the next wave)
- This wave is RESEARCH + SPEC + CONTEXT only
- Return structured results: what was found, what documents were created, evidence references

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 49.7s)

_Thinking:_

I'm hm-l1-coordinator, the L1 delegation coordinator for wave-based L2 specialist execution. I've been dispatched by L0 hm-orchestrator to execute a deep research wave about the session-tracker pipeline. Let me carefully analyze this task.

Key observations:
1. This is a RESEARCH wave - I need to produce 3 documents: RESEARCH.md, SPEC.md, CONTEXT.md
2. I need to study 6 major research areas
3. I need to dispatch L2 specialists sequentially (max 2 parallel)
4. I must NOT implement anything - only coordinate, validate, and consolidate

Let me follow my execution flow:
1. Announce role
2. Receive task packet (already done from the prompt)
3. Decompose into waves
4. Dispatch wave 1 (parallel independent tasks)
5. Validate wave 1 results
6. Dispatch sequential waves if needed
7. Consolidate
8. Return to L0

First, let me load the mandatory skills and understand the scope better before dispatching.

Let me think about the wave decomposition:

**Wave 1 (Parallel - independent research):**
- Specialist A: OpenCode SDK research (online + examining src/shared/session-api.ts)
- Specialist B: Map current session-tracker code (all files in src/features/session-tracker/)

**Wave 2 (Sequential - depends on wave 1):**
- Specialist C: Sample session analysis (15 files)
- Specialist D: Current .hivemind/ state analysis

**Wave 3 (Sequential - depends on waves 1+2):**
- Specialist E: Previous phase context (Phase 11, 12, 13, plugin wiring)
- Specialist F: Synthesize all findings

But actually, looking more carefully, Wave 1 tasks are truly independent. Wave 2 depends on understanding the code and SDK. Wave 3 depends on all prior findings. But with the "max 2 parallel" rule, I need to sequence carefully.

Actually wait - the instructions say "Dispatch L2 specialists sequentially (max 2 parallel)". So I can do 2 parallel in each wave, but waves must be sequential (validated before next wave).

Let me re-plan:

**Wave 1 (2 parallel):**
- hm-l2-researcher: Research OpenCode SDK task tool lifecycle, hooks, session resume (online + code)
- hm-l2-scout: Map current session-tracker code files (all files, event flow)

**Wave 2 (2 parallel, depends on wave 1):**
- hm-l2-investigator: Analyze sample session exports (15 files) + current .hivemind/ state
- hm-l2-context-mapper: Map previous phase context (Phase 11, 12, 13) + plugin wiring

**Wave 3 (1, depends on all prior):**
- hm-l2-synthesizer: Synthesize all findings into RESEARCH.md, SPEC.md, CONTEXT.md

This makes sense. Let me first load the mandatory skills and then start dispatching.

But wait - I need to load skills first. Let me load:
- hm-l2-coordinating-loop (mandatory for L1)
- hm-l3-subagent-delegation-patterns (mandatory for L1)
- gate-l3-lifecycle-integration (for inline validation)
- gate-l3-spec-compliance (for spec validation)

Actually, looking at my role description more carefully, these are the mandatory skills to load:
- hm-coordinating-loop
- hm-subagent-delegation-patterns

And on-demand: hm-completion-looping, hm-phase-execution, hm-phase-loop, gate-lifecycle-integration, gate-spec-compliance

Let me just load the mandatory ones first and start the decomposition.

Actually, I realize I should just get going. The task description is extremely detailed. Let me:
1. Load mandatory skills
2. Start setting up the todo list
3. Dispatch wave 1

Let me be strategic. I'll load the skills, then immediately dispatch the first wave while the skills are fresh.

Let me start by loading mandatory skills and then decomposing.

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
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/register-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/verify-hierarchy.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/coordination-check.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/loop-status.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-envelope.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/init-session.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/scripts/check-gate.sh</file>
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

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

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
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/checkpoint-protocols.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/wave-execution.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/delegation-envelopes.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/references/handoff-edge-guardrails.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/metrics/rich-gate-scorecard.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:**
```
<skill_content name="hivemind-power-on">
# Skill: hivemind-power-on

# Hivemind Power-On — Session Governance Core

## LOAD THIS FIRST. LOAD IT EVERY TURN.

This skill is how the entire Hivemind agent system stays alive across disconnects, aborts, compacts, and multi-day sessions. Every agent at L0/L1 loads this before anything else. **If you loaded it at session start, load it again at every user turn** — especially sessions that last many turns. The context changes. The session state evolves. You need the current picture.

**You are NOT loading this for the rules. You are loading this to see what is alive RIGHT NOW.**

---

## 1. THE ONLY THING THAT MATTERS: SESSION-TRACKER KNOWS EVERYTHING

The session-tracker at `.hivemind/session-tracker/` saves **every** session that ever ran on this project. Aborted. Completed. Cancelled. Active. It doesn't matter. Every single one has:

- A `.md` file with the full conversation
- A `session-continuity.json` with the delegation hierarchy
- A `project-continuity.json` index of all sessions

```json
// .hivemind/session-tracker/project-continuity.json
{
  "sessions": {
    "ses_1e665f792ffel0aC0a0qM0Oxo1": {
      "status": "active",       // aborted mid-work
      "childCount": 0,
      "totalDelegationDepth": 0
    }
  },
  "chronologicalOrder": ["ses_...", "ses_..."]
}
```

**This means:** There are NO lost sessions. Everything is recoverable. The only thing you need is the session ID. And the session-tracker gives you that.

### What you do at every power-on (start, resume, every user turn):

```
1. session-tracker({action:"list-sessions"})         // → get ALL session IDs
2. Read project-continuity.json                       // → see statuses, depths, children
3. Filter: "active" sessions that might need resume    // → aborted = active, completed = completed
4. For each aborted/active session → note the ID
5. Continue your routing with those IDs in your pocket
```

**That's it.** Three tool calls. You now know everything alive in this project.

---

## 2. THE DELEGATION PATTERN: "NO THOUGHT MUST" — BY ALL COSTS CONTINUE

This is the most important thing this skill teaches you. **Memorize it.**

```
WHEN you see a session ID from session-tracker (ANY status):
  → task({subagent_type: <same>, task_id: <exact ID>, prompt: "Continue"})
  → NO reasoning about whether it's the right session
  → NO checking if context was preserved (it IS — automatically)
  → NO asking "but what if it completed?" (it returns safely if wrong)
  → JUST DELEGATE
```

### Why this works without thinking:

| What you worry about | What actually happens |
|---------------------|----------------------|
| "Is this the right session?" | Even if wrong, the subagent gets context from the wrong session → returns safely. No harm. |
| "Was context preserved after abort?" | YES. OpenCode saves conversation state on every turn. Abort = last saved state is restored. |
| "Should I repeat the prompt?" | NO. Context is auto-restored. Repeating prompt wastes context. Just say "Continue." |
| "The front agent doesn't know what the downstream was doing" | **That's fine.** The downstream agent knows. Its context was preserved. You don't need to know. |
| "The session completed, should I start new?" | Resume the completed session with the SAME ID. It continues the chain. If it's truly done, the subagent tells you. |

### Real example from this project:

```
Session-tracker shows: ses_1e665f792ffel0aC0a0qM0Oxo1 (status: "active", gsd-planner)

The correct response:
  → task({description:"resume", subagent_type:"gsd-planner", task_id:"ses_1e665f792ffel0aC0a0qM0Oxo1"})
  → The planner resumes with its FULL context (844 lines of prompt, all tool calls)
  → It continues from where it was interrupted
  → NO need to re-send requirements, research, or context
```

**The WRONG response (what most agents do):**
```
  → Read the .md file (waste)
  → Re-read all the context files (waste)
  → Reason about whether it's the right session (waste)
  → Start a NEW task with a different ID (WRONG — loses the chain)
  → Re-send the full prompt (waste)
```

---

## 3. LOAD THIS AT EVERY USER TURN

This is **not** a "load once at start" skill. You must load it:

| When | Why |
|------|-----|
| Session start | Get the current session landscape |
| **Every user turn** | Session state may have changed. New aborts. New children. |
| After disconnect | Find sessions that need resume |
| After compact | Reconstruct state from disk |
| Before delegation | Check if there's a session to resume vs create new |
| After delegation returns | Check if the subagent left something to continue |

**Multi-turn sessions:** The session-tracker is being written to by YOUR OWN previous turns. If you don't reload this skill, you won't see the sessions YOU created.

---

## 4. ROUTING: WHICH LINEAGE, WHICH LEVEL

Decision tree for where work goes. Read TOP to BOTTOM.

```
USER SENDS REQUEST
│
├──→ Is this about meta-concepts? (agents, skills, commands, tools)
│   └──→ hf-lineage
│       ├── Single concept, known type → FAST PATH → hf-l2-* directly
│       └── Multi-concept, investigation, remediation → hf-l1-coordinator
│
├──→ Is this about features, bugs, architecture, implementation?
│   └──→ hm-lineage
│       ├── Simple, well-defined → hm-l1-coordinator (direct L2 dispatch)
│       └── Complex, research needed → hm-l1-coordinator (waves)
│
├──→ Is this an ambiguous command?
│   └──→ hm-l2-intent-loop for clarification
│
├──→ Is this a disconnected/resume scenario?
│   └──→ BY ALL COSTS CONTINUE → task tool with EXACT session ID
│       ├── Aborted? → same ID, context preserved
│       ├── Completed? → same ID, context preserved
│       └── Cancelled? → same ID or new (check with user)
│
└──→ Is this a cross-lineage request?
    └──→ hf needs codebase investigation? → hm-l1-coordinator (cross-lineage)
        hm needs meta-concept? → hf-l1-coordinator (cross-lineage)
```

### Depth rules (non-negotiable):

```
L0 → L1 → L2  (one level per delegation)
L0 → L2       (ONLY for fast-path single-concept hf-* tasks)
L2 → L2       (NEVER — L2 cannot delegate)
L0 → L2 skip  (NEVER — always through coordinator for multi-concept)
Depth > 3     (NEVER — escalate to user)
```

---

## 5. FINDING AND RESUMING SESSIONS — THE ACTUAL WORKFLOW

### When you think "I should continue a session":

```
STEP 1: session-tracker({action:"list-sessions"})
        → Gets all session IDs + statuses
STEP 2: session-tracker({action:"search-sessions", query:"aborted"})
        → Finds sessions that were interupted
STEP 3: For each aborted/active session:
        session-hierarchy({action:"get-delegation-depth", sessionId:"ses_xxx"})
        → Check depth, find deepest active child
STEP 4: task({subagent_type:"<matching type>", task_id:"<deepest active ID>"})
        → Continue. Context preserved. No thinking.
```

### When you're mid-session and need to re-delegate to a completed sub:

```
The subagent returned. You got its results. But you need it to do MORE.

  → task({task_id:"<SAME subagent session ID>", prompt:"Now do this additional thing..."})
  → The same subagent continues with its previous context PLUS your new instruction
  → No need to re-establish anything — it remembers everything
```

### When you're sure it's the wrong session:

```
task returns garbage or subagent says "I don't recognize this"
  → It returns safely (user's words: "even it is wrong it will returns safely")
  → Start fresh with a new task. No harm done.
```

---

## 6. QUALITY GATES: WHAT TO RUN BEFORE CLAIMING DONE

Every delegation that returns must pass the triad. In order. No skipping.

```
1. gate-lifecycle-integration   → Does it participate in the runtime correctly?
2. gate-spec-compliance         → Does it meet the spec requirements?
3. gate-evidence-truth          → Is there actual proof? (not just claims)
```

**Sequence:** Load `gate-l3-lifecycle-integration` → run it → returns PASS or FAIL.
→ If PASS: Load `gate-l3-spec-compliance` → run it → returns PASS or FAIL.
→ If PASS: Load `gate-l3-evidence-truth` → run it → returns PASS or FAIL.
→ If ALL PASS: Done.
→ If ANY FAIL: Return to the delegation target with the specific remediation.

Max 3 retry cycles. After 3, escalate to user with the full gap report.

---

## 7. WHAT EACH LAYER ACTUALLY DOES WITH THIS

| Layer | What they NEED from this skill |
|-------|-------------------------------|
| **L0 Orchestrator** | Full routing: find aborted sessions, resume them, know all active work |
| **L1 Coordinator** | Delegation management: track children, know which to resume, gate their returns |
| **L2 Specialist** | NOTHING from this skill. But they MUST know: "I was loaded by an L1 who loaded this. If I get interrupted, my session WILL be saved and can be resumed." |

---

## 8. REFERENCE FILES (read on demand, not all at once)

| File | What it has | Read when |
|------|------------|-----------|
| `references/01-session-tracker-anatomy.md` | Full session-tracker structure and schemas | You need to navigate `.hivemind/session-tracker/` manually |
| `references/02-task-tool-resume.md` | Task tool resume mechanics and worked examples | You're resuming an aborted session |
| `references/03-lineage-routing-tree.md` | Complete hm vs hf decision tree with command maps | You're unsure which lineage to route to |
| `references/04-project-phase-routing.md` | Phase-to-specialist mapping tables | You're dispatching a phase and need the right L2 |
| `references/05-continuity-navigation.md` | project-continuity.json navigation patterns | You're recovering from disconnect and need to find your place |
| `references/06-delegation-depth-recovery.md` | Multi-level recovery cascade protocol | You're recovering from a deep delegation (L1→L2→...) |

---

## 9. THE SHORT VERSION (for when context is tight)

```
1. session-tracker({action:"list-sessions"}) → see what exists
2. Any aborted/active session → task with its ID → context preserved
3. "No thought must" — even if wrong, it returns safely
4. Every user turn → reload this skill
5. Every delegation return → quality gate triad
6. Depth max = 3 → escalate to user
```

---

## 10. ESCALATION — WHEN TO TELL THE USER

| Situation | What to do |
|-----------|-----------|
| 3 consecutive gate failures on same delegation | Escalate with full gap report, evidence, and retry history |
| delegation depth reaches 3 | Escalate: "This chain is too deep. Need architectural split." |
| session-tracker not responding | Fallback: `glob(".hivemind/session-tracker/*/")` → find directories directly |
| Ambiguous hm vs hf lineage | Load `hm-l2-user-intent-interactive-loop` → clarify with user |
| task_id not found (session doesn't exist) | Export the `.md` session content, extract the prompt, create NEW dispatch with same params |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/01-session-tracker-anatomy.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/06-delegation-depth-recovery.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/05-continuity-navigation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/02-task-tool-resume.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/04-project-phase-routing.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/03-lineage-routing-tree.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 39.2s)

_Thinking:_

I've loaded all three mandatory skills. Now let me follow the execution flow as prescribed by my role and the coordinating-loop skill.

## Step 1: ANNOUNCE ROLE

I need to announce my role first.

## Step 2: ASSESS - Build Task Inventory

Let me analyze the task packet from L0:

The task is to execute a deep research wave about the session-tracker pipeline. I need to:
1. Research 6 major areas
2. Produce 3 documents: RESEARCH.md, SPEC.md, CONTEXT.md
3. Decompose into L2 specialist dispatches

Let me identify independent vs dependent tasks:

**Independent tasks (can be parallel):**
- Research OpenCode SDK (online + code)
- Map current session-tracker code (local files)

**Depends on code understanding:**
- Analyze sample sessions (needs to understand the tracker)
- Analyze current .hivemind/ state (needs to understand the persistence model)

**Depends on all prior:**
- Previous phase context (needs understanding of what was broken)
- Final synthesis

Let me plan the waves:

**Wave 1 (2 parallel):**
- hm-l2-researcher: OpenCode SDK deep dive
- hm-l2-scout: Current session-tracker code mapping

**Wave 2 (depends on wave 1):**
- hm-l2-investigator: Sample session analysis + .hivemind/ state analysis

**Wave 3 (depends on wave 2):**
- hm-l2-synthesizer: Synthesize all findings into RESEARCH.md, SPEC.md, CONTEXT.md

But wait - I also need to cover previous phase context (Phase 11, 12, 13) and plugin wiring. Those can be folded into the appropriate specialists.

Actually, looking at the task more carefully, the "max 2 parallel" rule means I should structure this as:

**Wave 1 (2 parallel):**
- hm-l2-researcher: SDK research (online + session-api.ts) + plugin wiring (src/plugin.ts)
- hm-l2-scout: Current session-tracker code mapping (all files) + previous phase context

**Wave 2 (sequential after wave 1):**
- hm-l2-investigator: Sample session analysis (15 files) + current .hivemind/ state

**Wave 3 (sequential after wave 2):**
- hm-l2-synthesizer: Synthesize all into 3 documents

Let me start with role announcement and then dispatch wave 1. But first, I need to set up the output directory and check state.

Actually, I need to think about what to dispatch. The specialists from the prompt are:
- hm-l2-researcher: OpenCode SDK research
- hm-l2-scout / hm-l2-context-mapper: Current code mapping, sample session analysis  
- hm-l2-investigator: Current .hivemind/ state analysis
- hm-l2-synthesizer: Synthesize all findings

Let me now: 
1. Announce my role
2. Set up todo list
3. Create output directory
4. Dispatch wave 1

Let me first do a quick check on what already exists on disk for context, and then start dispatching.

**I am hm-coordinator, L1 wave manager for hm-* lineage. I dispatch, validate, and consolidate — I never implement.**

Let me first assess the landscape: check what already exists on disk, examine the output directory target, and understand the current state before dispatching.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Wave 1: Dispatch hm-l2-researcher (OpenCode SDK deep dive + plugin wiring)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Wave 1: Dispatch hm-l2-scout (Session-tracker code mapping + previous phase context)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Inline validation: Verify wave 1 results meet spec compliance",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Wave 2: Dispatch hm-l2-investigator (Sample session analysis + .hivemind/ state analysis)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Inline validation: Verify wave 2 results",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Wave 3: Dispatch hm-l2-synthesizer (Consolidate into RESEARCH.md, SPEC.md, CONTEXT.md)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Final gate: Verify all 3 documents on disk at target directory",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Return consolidated Wave Coordination Report to L0",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Wave 1: Dispatch hm-l2-researcher (OpenCode SDK deep dive + plugin wiring)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Wave 1: Dispatch hm-l2-scout (Session-tracker code mapping + previous phase context)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Inline validation: Verify wave 1 results meet spec compliance",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Wave 2: Dispatch hm-l2-investigator (Sample session analysis + .hivemind/ state analysis)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Inline validation: Verify wave 2 results",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Wave 3: Dispatch hm-l2-synthesizer (Consolidate into RESEARCH.md, SPEC.md, CONTEXT.md)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Final gate: Verify all 3 documents on disk at target directory",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Return consolidated Wave Coordination Report to L0",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 14.3s)

_Thinking:_

Good, todos are set up. Now let me check the state: verify the output directory exists (or create it), check what's already on disk, and then proceed to dispatch wave 1.

Let me quickly check:
1. Does .hivemind/planning/session-tracker-deep-fix-2026-05-13/ exist?
2. What's in the sample sessions directory?
3. What's the current session-tracker code look like (quick structural check)?

Then I'll create the output directory and dispatch.

Now let me verify the state landscape before dispatching — check what already exists:

**Tool: glob**

**Input:**
```json
{
  "pattern": ".hivemind/planning/session-tracker-deep-fix-2026-05-13/**"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".hivemind/session-tracker/*/session-*.md"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/features/session-tracker/**/*.ts"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/hierarchy-index.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/index.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/tool-capture.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/child-writer.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/session-index-writer.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/transform/schema-normalizer.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/message-capture.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/session-writer.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/project-index-writer.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/recovery/session-recovery.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/transform/agent-transform.ts
/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/atomic-write.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".hivemind/session-tracker/project-continuity.json"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 12.4s)

_Thinking:_

Key findings:
1. Output directory `.hivemind/planning/session-tracker-deep-fix-2026-05-13/` does NOT exist yet — I need to create it
2. No session sample markdown files found in `.hivemind/session-tracker/` — they might be elsewhere. Let me search more broadly
3. Session-tracker source code files exist (14 files)
4. project-continuity.json exists

Let me now search for the sample session files and also look for the Phase 13 and other context documents.

Let me search more broadly for sample session files and phase context:

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/session-ses_*.md"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/session-ses_23a0.md
/Users/apple/hivemind-plugin-private/session-ses_22fd.md
/Users/apple/hivemind-plugin-private/session-ses_22ee.md
/Users/apple/hivemind-plugin-private/session-ses_2176.md
/Users/apple/hivemind-plugin-private/session-ses_20bf.md
/Users/apple/hivemind-plugin-private/session-ses_2096.md
/Users/apple/hivemind-plugin-private/session-ses_207a.md
/Users/apple/hivemind-plugin-private/session-ses_2069.md
/Users/apple/hivemind-plugin-private/session-ses_2043.md
/Users/apple/hivemind-plugin-private/session-ses_1f2d.md
/Users/apple/hivemind-plugin-private/session-ses_1f11.md
/Users/apple/hivemind-plugin-private/session-ses_1f10.md
/Users/apple/hivemind-plugin-private/session-ses_1ef1.md
/Users/apple/hivemind-plugin-private/session-ses_1eea.md
/Users/apple/hivemind-plugin-private/session-ses_1ed9.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/team-b-references/session-ses_1f2e-another-team-work-toward-agent-role-steering-reccomendation.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2b53.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2b52.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2b27.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2b0c.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2b05.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2ae8.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2aaa.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_2a77.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_29c0.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_29f7_toll_failures.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_29f_fuckingmorehallucinative.md
/Users/apple/hivemind-plugin-private/.archive/stale-session-files/session-ses_29ae.md
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".planning/phases/13*/**"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-UAT.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-06-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-05-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-06-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/.gitkeep
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".planning/debug/session-parent-misclassify*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/debug/session-parent-misclassify-AWAITING-AUTH-2026-05-12.md
/Users/apple/hivemind-plugin-private/.planning/debug/session-parent-misclassify.md
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".hivemind/session-tracker/**"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2c8a285ffeiAV13cdZhZF887/ses_1e2c8a285ffeiAV13cdZhZF887.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2c8a285ffeiAV13cdZhZF887/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2cf4ed5ffe61lJPiBTd2YCmK/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2cf4ed5ffe61lJPiBTd2YCmK/ses_1e2cf4ed5ffe61lJPiBTd2YCmK.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2fad834ffepaqLaeiBID5AMy.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2e20f6fffeTLZCxAYFr96JHD/ses_1e2e20f6fffeTLZCxAYFr96JHD.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2e20f6fffeTLZCxAYFr96JHD/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2d300d3ffeAhOGz9v6b75Gwh/ses_1e2d300d3ffeAhOGz9v6b75Gwh.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2d300d3ffeAhOGz9v6b75Gwh/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2d300d3ffeAhOGz9v6b75Gwh/ses_1e2d164f7ffeS9NWlVllw7lk4C.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3148ab6ffepXoYWF6BdYc5Fk/ses_1e3148ab6ffepXoYWF6BdYc5Fk.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3148ab6ffepXoYWF6BdYc5Fk/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3148ab6ffepXoYWF6BdYc5Fk/ses_1e2d47f72ffeJ9zwSCdpfJHj6P.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2d47f72ffeJ9zwSCdpfJHj6P/ses_1e2d47f72ffeJ9zwSCdpfJHj6P.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2d47f72ffeJ9zwSCdpfJHj6P/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2e25d7bffeGMB0h27U213lYA.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2e25d7bffeGMB0h27U213lYA/ses_1e2e25d7bffeGMB0h27U213lYA.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2e25d7bffeGMB0h27U213lYA/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2e51025ffef0ZNveYdBcMb5B.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2e54addffes3El7Urb4pkBQF.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2e9c0e2ffe9ZcHVV1k3Z4nh0.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2ea55baffe8eQ9lH3vUDBzpk.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2f1bbfbffeCLMVDsn2sxxMn1.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2fad834ffepaqLaeiBID5AMy/ses_1e2f23f76ffe8XKoz0AUUjdNZM.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2f1bbfbffeCLMVDsn2sxxMn1/ses_1e2f1bbfbffeCLMVDsn2sxxMn1.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2f1bbfbffeCLMVDsn2sxxMn1/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2f23f76ffe8XKoz0AUUjdNZM/ses_1e2f23f76ffe8XKoz0AUUjdNZM.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e2f23f76ffe8XKoz0AUUjdNZM/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e30ac548ffeM2BdO4feP4vyKK/ses_1e30ac548ffeM2BdO4feP4vyKK.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e30ac548ffeM2BdO4feP4vyKK/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e30ac548ffeM2BdO4feP4vyKK/ses_1e3086efbffeWUFbQl6uUtvX5e.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e30ac548ffeM2BdO4feP4vyKK/ses_1e308d896ffeqx8FfnnppujUV3.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3148ab6ffepXoYWF6BdYc5Fk/ses_1e30ac548ffeM2BdO4feP4vyKK.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e308d896ffeqx8FfnnppujUV3/ses_1e308d896ffeqx8FfnnppujUV3.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e308d896ffeqx8FfnnppujUV3/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3086efbffeWUFbQl6uUtvX5e/ses_1e3086efbffeWUFbQl6uUtvX5e.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3086efbffeWUFbQl6uUtvX5e/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/ses_1e6332a93ffeGKEUaIEpmHJJPz.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/ses_1e31dca8effewoVLnEUZqUhOR6.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/ses_1e3a8f243ffelROn8suj6s6f7g.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/ses_1e39a5762ffewhHoJIU4SAincl.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e39a5762ffewhHoJIU4SAincl/ses_1e39a5762ffewhHoJIU4SAincl.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e39a5762ffewhHoJIU4SAincl/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e6332a93ffeGKEUaIEpmHJJPz/ses_1e39d2a36ffeghuIScWRi5CeWl.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e39d2a36ffeghuIScWRi5CeWl/ses_1e39d2a36ffeghuIScWRi5CeWl.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e39d2a36ffeghuIScWRi5CeWl/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3a4bf2affeMipgSecgA0TDMO/ses_1e3a4bf2affeMipgSecgA0TDMO.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3a4bf2affeMipgSecgA0TDMO/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3a8f243ffelROn8suj6s6f7g/ses_1e3a8f243ffelROn8suj6s6f7g.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3a8f243ffelROn8suj6s6f7g/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3daa16bffeDgRBPhfOgd9ztL/ses_1e3daa16bffeDgRBPhfOgd9ztL.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3daa16bffeDgRBPhfOgd9ztL/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3be93f0ffeVu9H8JWzT26X18/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3be93f0ffeVu9H8JWzT26X18/ses_1e3be93f0ffeVu9H8JWzT26X18.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3c51297ffe0Zlmqg2iu3HiYo/ses_1e3c51297ffe0Zlmqg2iu3HiYo.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3c51297ffe0Zlmqg2iu3HiYo/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3cc4eb7ffeDhDyqbOChaPTTw/ses_1e3cc4eb7ffeDhDyqbOChaPTTw.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3cc4eb7ffeDhDyqbOChaPTTw/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3daa16bffeDgRBPhfOgd9ztL/ses_1e3d9e498ffeydUFRtRHyyCfyU.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3d9e498ffeydUFRtRHyyCfyU/ses_1e3d9e498ffeydUFRtRHyyCfyU.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3d9e498ffeydUFRtRHyyCfyU/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3dbeaaeffevUB50RQEQdjw19/ses_1e3dbeaaeffevUB50RQEQdjw19.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3dbeaaeffevUB50RQEQdjw19/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3dfd345ffe2mFP07gQ2GavRl/ses_1e3dfd345ffe2mFP07gQ2GavRl.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3dfd345ffe2mFP07gQ2GavRl/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3e69cc2ffe6jhKwp4vNQkvEm/ses_1e3e69cc2ffe6jhKwp4vNQkvEm.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3e69cc2ffe6jhKwp4vNQkvEm/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3ef9e16ffe1Pr72ptsBjSHnl/ses_1e3ef9e16ffe1Pr72ptsBjSHnl.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3ef9e16ffe1Pr72ptsBjSHnl/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3f5e3eaffeLD6EAZ9nWDGTgE/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e3f5e3eaffeLD6EAZ9nWDGTgE/ses_1e3f5e3eaffeLD6EAZ9nWDGTgE.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e405ffd2ffeDQLBguviVJwhEt/ses_1e405ffd2ffeDQLBguviVJwhEt.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e405ffd2ffeDQLBguviVJwhEt/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e405ffd2ffeDQLBguviVJwhEt/ses_1e403382fffeM091NT5zt5OId4.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e403382fffeM091NT5zt5OId4/ses_1e403382fffeM091NT5zt5OId4.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e403382fffeM091NT5zt5OId4/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e405ffd2ffeDQLBguviVJwhEt/ses_1e402c451ffeaSQsqA4ezTWchc.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e402c451ffeaSQsqA4ezTWchc/ses_1e402c451ffeaSQsqA4ezTWchc.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e402c451ffeaSQsqA4ezTWchc/session-continuity.json
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e414f192ffe6wzuC2AYMdFBXK/ses_1e414f192ffe6wzuC2AYMdFBXK.md
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e414f192ffe6wzuC2AYMdFBXK/session-continuity.json
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 25.9s)

_Thinking:_

Now I have a clear picture:

1. **Output directory does not exist** — I need to create it: `.hivemind/planning/session-tracker-deep-fix-2026-05-13/`
2. **15 sample session files** found at root level (session-ses_1ed9.md through session-ses_23a0.md)
3. **Session-tracker source** (14 files) mapped
4. **Phase 13 context** exists under `.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/`
5. **Debug documents** exist at `.planning/debug/session-parent-misclassify*.md`
6. **Current .hivemind/session-tracker/** has many sessions (20+ directories)
7. **project-continuity.json** exists
8. **Phase 11 and 12** exist: need to check

Now I have the full landscape. Let me create the output directory and proceed to dispatch.

Actually, let me think about wave decomposition more carefully. The key constraint is "max 2 parallel" per wave. Let me plan:

**Wave 1 (2 parallel): This is the "understand the code and SDK" wave**
- hm-l2-researcher: Research OpenCode SDK (online) + examine src/shared/session-api.ts + src/plugin.ts wiring
- hm-l2-scout: Map all session-tracker source files and their event flow + previous phase context

**Wave 2 (sequential): "Analyze real data" wave** 
- hm-l2-investigator: Analyze 15 sample session exports + current .hivemind/session-tracker state

**Wave 3 (sequential): "Synthesize" wave**
- hm-l2-synthesizer: Produce RESEARCH.md, SPEC.md, CONTEXT.md from all findings

This is good. Let me proceed with dispatch.

Now, for each specialist, I need to follow the envelope format from the coordinating-loop skill:
- Task (one-sentence)
- Scope (include/exclude files)
- Context (only what's needed)
- Expected Output (concrete with format)
- Verification (exact check)

Plus handoff metadata:
- source_agent: hm-coordinator
- target_agent: <specialist>
- handoff_reason: domain/file boundary
- allowed_destinations: [] (no further delegation)
- history_policy: what context is included
- expected_return: DONE with structured output
- resume_pointer: where to continue

Let me now create the output directory and dispatch wave 1.

But first - I should create the directory. Let me do that, then dispatch both specialists in parallel.

State assessment complete. Now let me create the output directory and dispatch Wave 1 (2 parallel specialists).

**Tool: execute-command**

**Input:**
```json
{
  "command": "mkdir",
  "arguments": "-p .hivemind/planning/session-tracker-deep-fix-2026-05-13"
}
```

**Output:**
```
{"success":false,"error":"Unable to connect. Is the computer able to access the url?"}
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 22.4s)

_Thinking:_

The execute-command tool failed. Let me try the run-background-command tool instead, or just use the bash tool. Or I can use the repomix file system tool... Actually, let me just try using the `run-background-command` tool or `glob` to create the directory.

Wait, I don't have a bash tool. Let me check what tools I have that could create a directory. I have:
- execute-command (failed)
- run-background-command (action: "run")
- execute-slash-command

Let me try run-background-command with action "run" to create the directory.

Actually, looking again at the available tools, I don't see a direct way to create a directory. But the glob tool finds files, the repomix tools can read directories, and the github tools are for GitHub. Let me try run-background-command.

Actually wait - I don't need to create the directory separately. The specialists will write to disk and can create the directory themselves. Let me just proceed with dispatch. But I should direct them to create the directory before writing files.

Alternatively, I can try `run-background-command` with action "run".

Directory creation via execute-command failed. Let me try alternative approach and proceed directly to Wave 1 dispatch — I'll instruct specialists to create the output directory.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Wave 1: Dispatch hm-l2-researcher (OpenCode SDK deep dive + plugin wiring)",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Wave 1: Dispatch hm-l2-scout (Session-tracker code mapping + previous phase context)",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Inline validation: Verify wave 1 results meet spec compliance",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Wave 2: Dispatch hm-l2-investigator (Sample session analysis + .hivemind/ state analysis)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Inline validation: Verify wave 2 results",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Wave 3: Dispatch hm-l2-synthesizer (Consolidate into RESEARCH.md, SPEC.md, CONTEXT.md)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Final gate: Verify all 3 documents on disk at target directory",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Return consolidated Wave Coordination Report to L0",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Wave 1: Dispatch hm-l2-researcher (OpenCode SDK deep dive + plugin wiring)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Wave 1: Dispatch hm-l2-scout (Session-tracker code mapping + previous phase context)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Inline validation: Verify wave 1 results meet spec compliance",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Wave 2: Dispatch hm-l2-investigator (Sample session analysis + .hivemind/ state analysis)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Inline validation: Verify wave 2 results",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Wave 3: Dispatch hm-l2-synthesizer (Consolidate into RESEARCH.md, SPEC.md, CONTEXT.md)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Final gate: Verify all 3 documents on disk at target directory",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Return consolidated Wave Coordination Report to L0",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro)

_Thinking:_

Good, now let me dispatch both Wave 1 specialists in parallel. Let me construct the task envelopes carefully.

**Specialist A: hm-l2-researcher**
- Task: Research OpenCode SDK task tool lifecycle, hooks, and session resume mechanics
- Scope: Online research (Context7, Deepwiki, GitHub) + local src/shared/session-api.ts + src/plugin.ts
- Expected output: Detailed findings on SDK lifecycle, event hooks, session model

**Specialist B: hm-l2-scout**
- Task: Map all session-tracker source files, event flow, and previous phase context
- Scope: All 14 files in src/features/session-tracker/ + Phase 11/12/13 docs + debug docs
- Expected output: Complete event flow map, code architecture overview, phase context summary

Let me dispatch both now.

## Wave 1: DISPATCH — 2 Parallel Specialists

Now dispatching both Wave 1 specialists in parallel. Each gets a structured envelope with clear boundaries.

**Tool: task**

**Input:**
```json
{
  "description": "Research OpenCode SDK task lifecycle",
  "prompt": "\nYou are the subagent hm-l2-researcher. You are being delegated by hm-l1-coordinator (me). You must do as this prompt instructs and knowing that you are being delegated. You cannot delegate further.\n\n## Task\nResearch the OpenCode SDK task tool lifecycle, plugin hook signatures, and session model to document how session IDs are created/managed at each lifecycle stage.\n\n## Scope\n**INCLUDE:**\n- Online research via Context7, Deepwiki on anomalyco/opencode — specifically the task tool (subagent dispatch) and plugin hook system\n- Local file: src/shared/session-api.ts — the SDK wrapper in this project\n- Local file: src/plugin.ts — how session-tracker hooks are wired into OpenCode event observers\n- Research what PreToolUse, PostToolUse events provide (what fields, what timing)\n\n**EXCLUDE:**\n- Do NOT read session-tracker source files (src/features/session-tracker/*)\n- Do NOT analyze sample session exports\n- Do NOT read phase planning documents\n- Do NOT implement anything\n\n## Context\nThis project has a session-tracker that captures OpenCode session state via plugin hooks. The current understanding of the task tool lifecycle is flawed — fixes were applied that are \"wrong logics.\" Key questions you must answer:\n\n1. **Task tool session ID creation:** When is a session ID generated — at INPUT dispatch time or OUTPUT completion? What information is available at each lifecycle stage?\n\n2. **Plugin hook signatures:** What data fields are available in PreToolUse and PostToolUse events? Can the session-tracker detect parentID from them?\n\n3. **Session resume:** How does OpenCode handle session resume via task_id? Does resuming create a new session or continue the existing one? What depth does the resumed session have?\n\n4. **Fork/revert:** How does forking from a previous message work? What about undo/revert?\n\n5. **Session hierarchy model:** Does the SDK expose any concept of delegation depth (L0→L1→L2)? How is parent-child relationship tracked?\n\n## Expected Output\nReturn a structured markdown report covering:\n\n1. **Task Tool Lifecycle Summary**: When session IDs are created, what info exists at each stage\n2. **Plugin Hook Signatures**: Exact fields available in PreToolUse/PostToolUse events\n3. **Session Resume Mechanics**: How task_id resume works, depth preservation\n4. **Fork/Revert/Undo Behavior**: How these actions affect sessions\n5. **Parent-Child Model**: How hierarchy is (or isn't) exposed by the SDK\n6. **Key Gaps**: What the SDK does NOT expose that the session-tracker needs\n\nCite sources: URLs, file:line references, SDK version numbers.\n\n## Verification\n- Your report must reference at least 2 online sources (Context7 URLs or Deepwiki references)\n- Your report must reference at least 3 file:line locations from src/shared/session-api.ts or src/plugin.ts\n- Required sections must all be present\n- Each finding must have evidence (source, line, or URL)\n",
  "subagent_type": "hm-l2-researcher"
}
```

**Tool: task**

**Input:**
```json
{
  "description": "Map session-tracker code and event flow",
  "prompt": "\nYou are the subagent hm-l2-scout. You are being delegated by hm-l1-coordinator (me). You must do as this prompt instructs and knowing that you are being delegated. You cannot delegate further.\n\n## Task\nMap ALL session-tracker source files, their event flow, and previous phase context to produce a complete architectural understanding.\n\n## Scope\n**INCLUDE — read these files:**\n- ALL 14 source files in src/features/session-tracker/:\n  - index.ts: SessionTracker class — ensureSessionReady(), handleChatMessage(), handleToolExecuteAfter(), handleSessionCreated()\n  - capture/tool-capture.ts: handleTask() — how task tool sessions are captured, hierarchy registration\n  - capture/message-capture.ts: message pipeline for user/assistant messages\n  - capture/event-capture.ts: session lifecycle events\n  - persistence/hierarchy-index.ts: in-memory Map — persistence gaps\n  - persistence/session-index-writer.ts: incrementTurnCount(), addChild()\n  - persistence/session-writer.ts, child-writer.ts, atomic-write.ts\n  - persistence/project-index-writer.ts\n  - recovery/session-recovery.ts\n  - transform/agent-transform.ts, schema-normalizer.ts\n  - types.ts: all type definitions\n\n- Previous phase context (skim for key facts):\n  - Phase 11: .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/ (check if exists)\n  - Phase 12: .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/\n  - Phase 13: .planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-CONTEXT.md, 13-RESEARCH.md, 13-UAT.md, and all 13-xx-SUMMARY.md files\n  - Debug docs: .planning/debug/session-parent-misclassify.md and session-parent-misclassify-AWAITING-AUTH-2026-05-12.md\n\n- src/plugin.ts: How session-tracker hooks are wired (just the session-tracker-related sections)\n\n**EXCLUDE:**\n- Do NOT read sample session exports (.md files at root level)\n- Do NOT read .hivemind/session-tracker/* contents\n- Do NOT implement anything\n- Do NOT do online research (that's another specialist's job)\n\n## Context\nThe session-tracker captures OpenCode sessions via plugin hooks. Phase 13 applied 5 fixes, but all were declared \"wrong logics\" — the understanding was shallow. You need to produce a COMPLETE architectural map showing exactly how events flow through the system.\n\nKey focus areas:\n1. Map the COMPLETE event flow: OpenCode event → plugin hook → SessionTracker method → persistence action\n2. How does handleTask() detect parent sessions? What's the current classification logic?\n3. What is HierarchyIndex? Is it in-memory only? What happens on restart?\n4. How does session creation vs. session resume work in the current code?\n5. What are the terminal-state gaps? Where can session capture fail silently?\n6. What did Phase 13's 5 fixes change, and why are they wrong?\n\n## Expected Output\nReturn a structured markdown report covering:\n\n1. **Complete File Map**: Every file with its role, key functions, and line references\n2. **Event Flow Diagram** (text-based): Complete chain from OpenCode event → method → persistence\n3. **Classification Logic**: How L0/L1/L2 distinction is currently attempted (and where it fails)\n4. **Persistence Gaps**: What's in-memory vs on-disk, what's lost on restart\n5. **Phase 13 Fixes Analysis**: What each of the 5 fixes changed, why they're wrong\n6. **Silent Failure Points**: Where capture can fail without detection\n7. **Key Architectural Flaws**: Root causes of misclassification, missing parentID, depth issues\n\n## Verification\n- Your report must cover ALL 14 source files with at least 1 function reference per file\n- Event flow diagram must be complete (no missing edges)\n- Phase 13 analysis must reference specific commits or file changes\n- Each finding must have file:line evidence\n",
  "subagent_type": "hm-l2-scout"
}
```

---

