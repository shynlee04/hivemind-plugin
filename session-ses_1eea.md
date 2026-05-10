# Inventory & classify *-dev skills (@hm-l1-coordinator subagent)

**Session ID:** ses_1eeae6608ffeTnEZf8GOhTBKsd
**Created:** 5/10/2026, 4:57:01 PM
**Updated:** 5/10/2026, 4:58:40 PM

---

## User


You are the subagent hm-l1-coordinator. You are being delegated this task by hm-orchestrator (L0). You must fulfill this work within the specified boundaries and return structured results.

## TASK: Inventory, Classification, and Audit of Meta-Concept *-dev Skills

### CONTEXT
The Hivemind project has two lineages:
- **hm-*** (hiveminder): Product development lineage — building the harness itself. Skills for end-users to use with their projects.
- **hf-*** (hivefiver): Meta-builder lineage — tools to help end users create/customize/extend/audit OpenCode primitives (commands, agents, skills, tools, custom tools, plugins, workflows).

The user wants an inventory and audit of all skills that teach how to build/develop/create/audit/improve/customize/extend OpenCode meta concepts — these are the *-dev (development) skills. The user specifically wants focus on COMMANDS as the initiator/glue, with gaps identified against official OpenCode documentation.

### SCOPE BOUNDARIES

**IN SCOPE:**
1. Read all project hf-* skills under `.opencode/skills/` that relate to building/developing/creating/auditing OpenCode primitives
2. Read all global skills under `/Users/apple/.agents/skills/` that relate to building/developing/creating/auditing OpenCode primitives (agent-development, command-development, skill-development, create-skill, skill-creator, skill-judge, create-gsd-extension, create-workflow, create-mcp-server, create-agentsmd, agent-md-refactor, find-skills, writing-skills)
3. Classify each by:
   - Primitive type taught (commands, agents, skills, custom-tools, plugins, workflows, MCP servers)
   - Lineage (hf-*, hm-*, third-party, orphan/unprefixed)
   - L-level correctness (l0/l1/l2/l3 consistency)
   - What it teaches: create, audit, doctor, customize, extend, stack
4. Produce a structured inventory table
5. Audit specifically for COMMAND development gaps against:
   - Official OpenCode docs (https://opencode.ai/docs/commands/)
   - OpenCode SDK, plugins, server API sections
   - How commands interact with: agents, skills, tools, MCP tools, custom tools, file references, templates, configurations
   - How slash commands differ from bash/shell commands
   - Advanced stacking and chaining patterns (non-breaking)
   - Cross-references to related skill-development, agent-development, custom-tools-dev skills
6. Research OpenCode command docs online using web-search-prime_web_search_prime or tavily_tavily_search to validate against current documentation
7. Produce artifact files under `.hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/`

**OUT OF SCOPE:**
- Writing or editing any skill files
- Modifying source code
- Analyzing non-development skills (e.g., hm-l2-brainstorm, hm-l2-debug, etc.)
- GSD-internal skills (gsd-audit-*, gsd-* — these are project build tools, not shipped)

### KNOWN SKILLS TO INVENTORY

**Project hf-* skills (under `.opencode/skills/`):**
- hf-l2-agent-composition
- hf-l2-agents-and-subagents-dev
- hf-l2-agents-md-sync
- hf-l2-command-dev
- hf-l2-command-parser
- hf-l2-context-absorb
- hf-l2-custom-tools-dev
- hf-l2-delegation-gates
- hf-l2-meta-builder-core
- hf-l2-naming-syndicate
- hf-l2-skill-router
- hf-l2-skill-synthesis
- hf-l2-use-authoring-skills

**Project hm-* skills that are dev-adjacent:**
- opencode-config-workflow (unprefixed, project)
- hm-l3-opencode-project-audit
- hm-l2-spec-driven-authoring
- hm-l2-refactor

**Global skills (under `/Users/apple/.agents/skills/`):**
- agent-development
- command-development
- skill-development
- create-skill
- skill-creator
- skill-judge
- writing-skills
- find-skills
- create-gsd-extension
- create-workflow
- create-mcp-server
- create-agentsmd
- agent-md-refactor
- agent-orchestrator
- dispatching-parallel-agents

### EXPECTED OUTPUTS (write to `.hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/`)

1. **inventory-classification-2026-05-10.md** — Complete inventory table with columns:
   | Skill Name | Location | Lineage | Primitive Type | L-level | Teaches | Naming Compliant | Has Trigger Phrases | Has Progressive Disclosure | Notes |
   
2. **lineage-groups-2026-05-10.md** — Skills grouped by:
   - hf-* lineage → sorted by primitive type
   - hm-* lineage → sorted by primitive type  
   - Third-party → with source identification
   - Orphan/unprefixed → with remediation suggestions

3. **command-audit-report-2026-05-10.md** — Focused audit on command development skills:
   - Inventory of all command-related skills
   - Gap analysis against OpenCode docs (validate via web search)
   - What's missing for advanced stacking/chaining/integration
   - Cross-references to agent/skill/tool development skills
   - Recommendations for improvement

4. **references/** subdirectory with:
   - opencode-commands-docs-2026-05-10.md — Fetched/summarized OpenCode command documentation
   - gaps-matrix-2026-05-10.md — Gap matrix across all primitive types

### VERIFICATION
- All 4 output files exist with substantial content
- Inventory table has all 28+ skills classified
- Lineage grouping is correct
- Command audit includes web-validated OpenCode doc references
- No hf-* skills loaded (you're hm lineage, but may READ hf-* skills as research material)

### PROCESS
1. First, read each skill's SKILL.md (just frontmatter and description — skim, don't deep-read)
2. Classify into the inventory table
3. Research OpenCode command docs online
4. Produce the audit report
5. Write all artifacts

### GATE EXPECTATIONS
- Lifecycle gate: All artifacts written to correct `.hivemind/planning/` directory with correct date stamps
- Spec gate: All requested columns/fields present in inventory table, all requested report sections present
- Evidence gate: All claims backed by file:line references to skill files or web-validated doc references


---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 29.0s)

_Thinking:_

I am hm-l1-coordinator, L1 wave manager for hm-* lineage. I have been dispatched as a subagent by hm-orchestrator (L0) to perform an inventory, classification, and audit of meta-concept *-dev skills.

Let me break this down into waves:

**Wave 1 (Parallel):** Read all the skills that need to be inventoried
- Project hf-* skills
- Project hm-* and unprefixed skills 
- Global skills

**Wave 2 (Sequential, depends on Wave 1):** 
- Online research of OpenCode command docs
- Classification and audit writing

**Wave 3 (Final):** 
- Write all artifact files
- Verification

Let me start by planning and then dispatching specialists.

First, let me announce my role and load necessary skills.

I need to:
1. Load hm-coordinating-loop and hm-subagent-delegation-patterns
2. Decompose the task into waves
3. Dispatch specialists

Let me first load the coordinating skills, then plan the decomposition.

Actually, I should follow the execution flow: announce role, receive task packet, decompose into waves, dispatch wave 1.

Let me start.

I am **hm-coordinator, L1 wave manager for hm-* lineage.** I dispatch, validate, and consolidate — I never implement.

Let me first load the necessary coordination skills, then decompose this task into waves.

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

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 62.7s)

_Thinking:_

Now I have both coordination skills loaded. Let me plan my approach:

## Task Decomposition

This is a large research/audit task. Let me break it down:

**Wave 1 (Parallel - Research/Skimming):**
- Task A: Skim all project hf-* skills (13 skills under .opencode/skills/)
- Task B: Skim all global dev skills (14+ skills under /Users/apple/.agents/skills/)
- Task C: Skim project hm-* dev-adjacent skills and unprefixed skills (4+ skills)

These are independent reads — no shared state.

**Wave 2 (Sequential, depends on Wave 1):**
- Task D: Research OpenCode command docs online
- Task E: Classify and build inventory table from Wave 1 results

**Wave 3 (Final, depends on Wave 2):**
- Task F: Write all 4+ artifact files
- Task G: Verify output files exist and are substantial

Actually, let me reconsider. The COORDINATOR role says I should delegate to L2 specialists, not do the work myself. But looking at this task carefully — it's a research, classification, and reporting task. I don't think I need to delegate to specialists for skimming files and classifying them. The coord-looping skill says if only a few tasks, execute directly.

However, the instructions from the user say:
- ALL orchestrator, coordinator agents MUST FOCUS ON DELEGATIONS - NEVER Implement the tasks yourself
- When delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT

So I should delegate the reading/classification work to specialists. Let me think about which specialists:

For reading and classifying skills:
- hm-l2-researcher or hm-l2-investigator for reading and analyzing skill files
- hm-l2-analyst for classification and gap analysis
- hm-l2-writer for producing the artifact files
- hm-l2-curator for quality curation

But wait - looking at the task more carefully, this is a straightforward research/classification task. The L2 specialists would be:
1. hm-l2-researcher: Read and analyze project hf-* skills
2. hm-l2-researcher: Read and analyze global dev skills  
3. hm-l2-scout: Read and analyze project hm-* dev-adjacent skills
4. hm-l2-researcher: Research OpenCode command docs online
5. hm-l2-analyst: Classify, gap analyze, and produce inventory
6. hm-l2-writer: Write artifact files

Actually, let me simplify. Looking at the constraints:
- "DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION"

So max 2 parallel delegations at a time. Let me design waves:

**Wave 1 (Parallel, 2 specialists):**
- Specialist A (hm-l2-researcher): Read ALL project hf-* skills (13 skills) + project hm-* dev-adjacent skills (4) = ~17 skill files. Skim frontmatter and descriptions, classify.
- Specialist B (hm-l2-researcher): Read ALL global dev skills (14+ skills from /Users/apple/.agents/skills/). Skim frontmatter and descriptions, classify. ALSO research OpenCode command docs online.

**Wave 2 (Sequential, depends on Wave 1):**
- Specialist C (hm-l2-analyst): Take results from A and B, produce inventory table, lineage grouping, command audit, gap analysis
- Specialist D (hm-l2-writer): Write all 4+ artifact files to .hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/

Actually, let me reconsider the approach. The task says "First, read each skill's SKILL.md (just frontmatter and description — skim, don't deep-read)". This is research work. Let me dispatch 2 researchers in parallel:

Wave 1:
- hm-l2-researcher A: Read all project hf-* skills + hm-* dev-adjacent skills
- hm-l2-researcher B: Read all global dev skills + research OpenCode docs

Then consolidate myself and write the artifacts.

Wait, but the coordination rules say I should never implement. I need to delegate the writing too. But actually, looking at my own role description: "Consolidating results (self-executed merge)" and "Running inline validation (self-executed check)" - these are things I do myself. But "Constructing dispatch context (self-executed preparation)" is also self-executed.

Let me re-read: "Delegates to L2 when: Task packet from L0 is decomposed into specialist dispatches, Wave 1 independent tasks are ready for parallel execution..."

OK so I should:
1. Decompose the task (self)
2. Dispatch Wave 1 (delegate to L2 specialists)
3. Monitor/validate Wave 1 (self)
4. Dispatch Wave 2 (delegate to L2 specialists)
5. Consolidate (self)
6. Return to L0 (self)

Let me dispatch 2 parallel researchers in Wave 1.

But wait, there's the constraint: "DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION." So I can have exactly 2 parallel.

Let me think about what the researchers need:

**Researcher A: Project Skills**
- Read all 13 hf-* skills under .opencode/skills/
- Read all hm-* dev-adjacent skills: opencode-config-workflow, hm-l3-opencode-project-audit, hm-l2-spec-driven-authoring, hm-l2-refactor
- For each: extract name, description, trigger phrases, what it teaches, lineage, L-level

**Researcher B: Global Skills + OpenCode Docs**
- Read all 14+ global dev skills under /Users/apple/.agents/skills/
- For each: extract name, description, trigger phrases, what it teaches, lineage
- ALSO: Research OpenCode command documentation at https://opencode.ai/docs/commands/ and related pages

Then I'll consolidate and write the artifacts.

Actually, I realize I should also dispatch a third researcher for the OpenCode docs part, but I'm limited to 2 parallel. So I'll have Researcher B do both the global skills read AND the OpenCode doc research. That's a lot of work but manageable.

Let me now prepare the dispatch envelopes and launch Wave 1.

First, let me create the output directory and prepare.

Now I'll decompose this task into waves and dispatch specialists.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "ASSESS: Decompose task into waves and build task inventory",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "WAVE 1A: Dispatch hm-l2-researcher to read & classify all project hf-* + hm-* dev-adjacent skills",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "WAVE 1B: Dispatch hm-l2-researcher to read global dev skills + research OpenCode command docs",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "MONITOR WAVE 1: Collect and validate results from both researchers",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "WAVE 2: Consolidate results, classify, gap-analyze, produce inventory",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "WRITE ARTIFACTS: Produce all 4+ files to .hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "VERIFY: Confirm all output files exist with substantial content",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "RETURN: Consolidated Wave Coordination Report to L0",
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
    "content": "ASSESS: Decompose task into waves and build task inventory",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "WAVE 1A: Dispatch hm-l2-researcher to read & classify all project hf-* + hm-* dev-adjacent skills",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "WAVE 1B: Dispatch hm-l2-researcher to read global dev skills + research OpenCode command docs",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "MONITOR WAVE 1: Collect and validate results from both researchers",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "WAVE 2: Consolidate results, classify, gap-analyze, produce inventory",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "WRITE ARTIFACTS: Produce all 4+ files to .hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "VERIFY: Confirm all output files exist with substantial content",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "RETURN: Consolidated Wave Coordination Report to L0",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 7.6s)

_Thinking:_

Good, now let me create the output directory and then dispatch Wave 1. Let me first ensure the output directory exists, then launch the two researchers in parallel.

Let me create the output directory and then dispatch Wave 1 in parallel.

**Tool: bash**

**Input:**
```json
{
  "command": "mkdir -p /Users/apple/hivemind-plugin-private/.hivemind/planning/meta-builder-dev-skills-audit-2026-05-10/references",
  "description": "Create output directory for audit artifacts"
}
```

**Output:**
```
(no output)
```

---

## Assistant (Hm-L1-Coordinator · DeepSeek V4 Pro · 793.2s)

_Thinking:_

Directory created. Now let me dispatch Wave 1 in parallel - two hm-l2-researcher specialists.

Researcher A: Project hf-* and hm-* dev-adjacent skills
Researcher B: Global dev skills + OpenCode docs research

I need to give each researcher clear task envelopes with scope, expected output, and verification.

Now dispatching Wave 1 in parallel — two hm-l2-researcher specialists.

**Tool: task**

**Input:**
```json
{
  "description": "Research project hf-* and hm-* dev skills",
  "prompt": "You are the subagent hm-l2-researcher, role: deep research specialist for multi-source investigation and structured reporting. You are being delegated this task by hm-l1-coordinator. You must fulfill this work within the specified boundaries.\n\n## TASK\nRead ALL project hf-* skills under `.opencode/skills/` and project hm-* / unprefixed dev-adjacent skills. Skim each skill's SKILL.md — read frontmatter, description, trigger phrases, and classification signals. Do NOT deep-read the full skill body. For each skill, extract structured classification data.\n\n## SCOPE\n**INCLUDE (read these exact files):**\n\nPROJECT hf-* skills (under .opencode/skills/):\n1. hf-l2-agent-composition/SKILL.md\n2. hf-l2-agents-and-subagents-dev/SKILL.md\n3. hf-l2-agents-md-sync/SKILL.md\n4. hf-l2-command-dev/SKILL.md\n5. hf-l2-command-parser/SKILL.md\n6. hf-l2-context-absorb/SKILL.md\n7. hf-l2-custom-tools-dev/SKILL.md\n8. hf-l2-delegation-gates/SKILL.md\n9. hf-l2-meta-builder-core/SKILL.md\n10. hf-l2-naming-syndicate/SKILL.md\n11. hf-l2-skill-router/SKILL.md\n12. hf-l2-skill-synthesis/SKILL.md\n13. hf-l2-use-authoring-skills/SKILL.md\n\nPROJECT hm-* / unprefixed dev-adjacent skills:\n14. opencode-config-workflow/SKILL.md (unprefixed, under .opencode/skills/)\n15. hm-l3-opencode-project-audit/SKILL.md\n16. hm-l2-spec-driven-authoring/SKILL.md\n17. hm-l2-refactor/SKILL.md\n\nAll paths are relative to /Users/apple/hivemind-plugin-private/.opencode/skills/\n\n**EXCLUDE:**\n- All hm-* skills NOT listed above\n- All gate-* skills\n- All stack-* skills\n- All gsd-* skills\n- All files under references/ subdirectories\n- Full body reading — skim frontmatter + description only\n\n## HOW TO PROCESS\nFor each skill, read the SKILL.md file. Focus on extracting:\n1. Exact filename and path\n2. The skill name (from frontmatter or first heading)\n3. Description / overview (first 2-3 paragraphs)\n4. Trigger phrases listed (the \"Triggers on:\" or \"Use when\" patterns)\n5. What primitive type it teaches (commands, agents, skills, custom-tools, plugins, workflows, MCP servers, other)\n6. What action it teaches (create, audit, doctor, customize, extend, stack, route, classify, validate, verify)\n7. L-level correctness (does the filename follow l0/l1/l2/l3 convention?)\n8. Naming compliance (does it follow hm-* or hf-* prefix rules?)\n9. Whether it has progressive disclosure (references/ subdirectory)\n10. Whether it has trigger phrases listed\n\n## EXPECTED OUTPUT\nReturn a structured markdown table with these exact columns:\n\n| # | Skill Name | File Path | Lineage | Primitive Type | L-Level | Teaches | Naming Compliant | Has Trigger Phrases | Has Progressive Disclosure | Key Notes |\n\nEach row should be filled with extracted data. Add a \"Key Notes\" column with any observations about the skill (e.g., \"teaches agent composition XML grammar\", \"routes meta-builder tasks\", \"parses $ARGUMENTS from commands\").\n\nAlso return a separate section listing ALL trigger phrases found across all skills, grouped by skill name.\n\n## VERIFICATION\n- Confirm you have exactly 17 rows in your table (one per skill)\n- Confirm each row has data in every column\n- Return the complete table in your final message\n\n## HANDOFF METADATA\nsource_agent: hm-l1-coordinator\ntarget_agent: hm-l2-researcher\nhandoff_reason: Parallel research wave for project skill inventory\nallowed_destinations: [] (do not delegate further)\nhistory_policy: Fresh context only — this task description is sufficient\nexpected_return: DONE with structured classification table and trigger phrases list\nresume_pointer: N/A (one-shot task)",
  "subagent_type": "hm-l2-researcher"
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
  "description": "Research global dev skills + OpenCode docs",
  "prompt": "You are the subagent hm-l2-researcher, role: deep research specialist for multi-source investigation and structured reporting. You are being delegated this task by hm-l1-coordinator. You must fulfill this work within the specified boundaries.\n\n## TASK\nPart 1: Read ALL global dev-related skills under `/Users/apple/.agents/skills/` that teach how to build/develop/create/audit OpenCode primitives. Skim each skill's SKILL.md — read frontmatter, description, trigger phrases, and classification signals.\n\nPart 2: Research OpenCode command documentation at https://opencode.ai/docs/commands/ and related pages. Use web-search-prime_web_search_prime or tavily_tavily_search or webfetch to find the latest OpenCode documentation on commands.\n\n## SCOPE — Part 1: Global Skills to Read\n\nThese are under `/Users/apple/.agents/skills/`:\n1. agent-development/SKILL.md\n2. command-development/SKILL.md\n3. skill-development/SKILL.md\n4. create-skill/SKILL.md\n5. skill-creator/SKILL.md\n6. skill-judge/SKILL.md\n7. writing-skills/SKILL.md\n8. find-skills/SKILL.md\n9. create-gsd-extension/SKILL.md\n10. create-workflow/SKILL.md\n11. create-mcp-server/SKILL.md\n12. create-agentsmd/SKILL.md\n13. agent-md-refactor/SKILL.md\n14. agent-orchestrator/SKILL.md\n15. dispatching-parallel-agents/SKILL.md\n\nFor each, also check if there are any additional skills NOT listed above that match the \"dev\" pattern (search for skills with \"create\", \"build\", \"develop\", \"audit\", \"improve\", \"customize\", \"extend\" in their directory names under /Users/apple/.agents/skills/).\n\n**EXCLUDE:**\n- Full body reading — skim frontmatter + description + trigger phrases only\n- Skills clearly NOT about building/creating OpenCode primitives\n- tandard non-dev skills like accessibility, ai-sdk, best-practices, etc.\n\n## SCOPE — Part 2: OpenCode Command Documentation Research\n\nUse web-search-prime_web_search_prime, tavily_tavily_search, or webfetch to find and summarize:\n\n1. https://opencode.ai/docs/commands/ — main command documentation\n2. Any related pages about: slash commands, command arguments, command stacking/chaining, command integration with agents/skills/tools\n3. Look for documentation on: `$ARGUMENTS`, command YAML frontmatter, command file references (@file), command agent delegation (agent: subtask:), bash/shell commands vs slash commands\n4. Also try: https://opencode.ai/docs/plugins/ and https://opencode.ai/docs/agents/ for cross-references to commands\n\nSearch queries to try:\n- \"opencode.ai slash commands documentation\"\n- \"opencode command arguments syntax\"\n- \"opencode command YAML frontmatter\"\n- \"opencode command stacking chaining\"\n\n## HOW TO PROCESS\nFor Part 1 — each skill: Read the SKILL.md file. Focus on extracting:\n1. Exact filename and path\n2. The skill name (from frontmatter or first heading)\n3. Description / overview (first 2-3 paragraphs)\n4. Trigger phrases listed\n5. What primitive type it teaches (commands, agents, skills, custom-tools, plugins, workflows, MCP servers, other)\n6. What action it teaches (create, audit, doctor, customize, extend, stack, route, classify, validate, verify)\n7. Lineage (hf-*, hm-*, third-party/orphan/unprefixed)\n8. Whether it has progressive disclosure (references/ subdirectory)\n9. Whether it has trigger phrases listed\n\nFor Part 2 — OpenCode docs: Capture:\n1. What command documentation exists (URLs, sections)\n2. Gaps between what the docs cover vs. what skills teach\n3. Advanced patterns mentioned (stacking, chaining, integration)\n4. Cross-references to agents, skills, tools, MCP tools, custom tools\n\n## EXPECTED OUTPUT\n\n**Section 1: Global Skills Inventory Table** (same format as the project inventory):\n\n| # | Skill Name | File Path | Lineage | Primitive Type | Teaches | Has Trigger Phrases | Has Progressive Disclosure | Key Notes |\n\n**Section 2: Any Additional Dev Skills Found** (list any skills you found beyond the 15 listed above that match the dev pattern)\n\n**Section 3: OpenCode Command Documentation Summary**\n- URLs found and accessed\n- Key topics covered in official docs\n- What official docs say about commands that skills DON'T cover (gaps)\n- Cross-references to agents, skills, tools\n\n**Section 4: Trigger Phrases** — list ALL trigger phrases found across all global skills, grouped by skill name\n\n## VERIFICATION\n- Confirm at least 15 rows in the global skills table\n- Confirm Section 3 has actual web-fetched content (not assumptions)\n- Return complete structured output\n\n## HANDOFF METADATA\nsource_agent: hm-l1-coordinator\ntarget_agent: hm-l2-researcher\nhandoff_reason: Parallel research wave for global skill inventory + OpenCode doc research\nallowed_destinations: [] (do not delegate further)\nhistory_policy: Fresh context only — this task description is sufficient\nexpected_return: DONE with global skills table, doc summary, and trigger phrases\nresume_pointer: N/A (one-shot task)",
  "subagent_type": "hm-l2-researcher"
}
```

**Output:**
```
task_id: ses_1eeaba45effecCX8Hnc1nXDICf (for resuming to continue this task if needed)

<task_result>
I now have all the data. Let me compile the comprehensive structured report.

---

## Research Report

**Agent:** hm-l2-researcher  
**Domain:** Research  
**Question:** Part 1: Inventory all global dev-related skills under /Users/apple/.agents/skills/ that teach building/creating/auditing OpenCode primitives. Part 2: Research OpenCode command documentation at opencode.ai/docs/  
**Status:** COMPLETED

---

### Section 1: Global Skills Inventory Table

| # | Skill Name | File Path | Lineage | Primitive Type | Teaches | Has Trigger Phrases | Has Progressive Disclosure | Key Notes |
|---|-----------|-----------|---------|---------------|---------|---------------------|---------------------------|-----------|
| 1 | **Agent Development** | `/Users/apple/.agents/skills/agent-development/SKILL.md` | Third-party (Claude Code plugin) | Agents | Create, validate | ✅ 9 phrases | ✅ references/ + examples/ + scripts/ | Teaches Claude Code plugin agent format (not OpenCode native). YAML frontmatter: name, description, model, color, tools. Two creation methods: AI-assisted + manual. 415 lines. |
| 2 | **Command Development** | `/Users/apple/.agents/skills/command-development/SKILL.md` | Third-party (Claude Code plugin) | Commands | Create, validate | ✅ 9 phrases | ✅ references/ + examples/ | Teaches Claude Code slash command format. Covers $ARGUMENTS, positional args, file refs (@), bash execution, CLADE_PLUGIN_ROOT, validation patterns, plugin integration. 834 lines. |
| 3 | **Skill Development** | `/Users/apple/.agents/skills/skill-development/SKILL.md` | Third-party (Claude Code plugin) | Skills | Create, validate | ✅ 5 phrases | ✅ references/ | Teaches creating skills for Claude Code plugins. Covers progressive disclosure, writing style (imperative), structure, validation, testing. 637 lines. |
| 4 | **create-skill** | `/Users/apple/.agents/skills/create-skill/SKILL.md` | Third-party/Orphan (GSD) | Skills | Create, audit, verify, upgrade | ⚠️ Implicit only | ✅ references/ + workflows/ + templates/ + scripts/ | GSD-oriented skill builder. Pure XML structure (no markdown headings). Router pattern for complex skills. Workflows for create-new, audit, verify, add-*. 186 lines. |
| 5 | **skill-creator** | `/Users/apple/.agents/skills/skill-creator/SKILL.md` | Third-party/Orphan (Official Anthropic) | Skills | Create, evaluate, iterate, benchmark | ⚠️ Implicit only | ✅ references/ + agents/ + scripts/ + eval-viewer/ | Official Anthropic skill creator. TDD approach: draft → test → evaluate → iterate. Evals framework, description optimization. Claude Code / Cowork / Claude.ai support. 485 lines. |
| 6 | **skill-judge** | `/Users/apple/.agents/skills/skill-judge/SKILL.md` | Third-party/Orphan | Skills | Audit, evaluate, score | ⚠️ Implicit only | ❌ Self-contained | 8-dimension scoring system (120 pts). Knowledge delta, mindset, anti-patterns, spec compliance, progressive disclosure, freedom calibration, pattern recognition, usability. 752 lines. |
| 7 | **writing-skills** | `/Users/apple/.agents/skills/writing-skills/SKILL.md` | Third-party (Superpowers) | Skills | Create, edit, verify | ⚠️ Implicit only | ✅ references/ | TDD for skills. RED-GREEN-REFACTOR. CSO (Claude Search Optimization). Flowchart usage. Testing all skill types. 655 lines. |
| 8 | **find-skills** | `/Users/apple/.agents/skills/find-skills/SKILL.md` | Third-party | Skills | Discover, install | ✅ 4 phrases | ❌ Self-contained | Teaches using `npx skills` CLI. Skill ecosystem search and install. 142 lines. |
| 9 | **create-gsd-extension** | `/Users/apple/.agents/skills/create-gsd-extension/SKILL.md` | Third-party (GSD) | Extensions (Tools, Commands, UI) | Create, debug | ✅ 8 phrases | ✅ workflows/ + references/ | GSD extension authoring. TypeScript modules: Events, Tools, Commands. Uses pi-ai, TypeBox. 89 lines. |
| 10 | **create-workflow** | `/Users/apple/.agents/skills/create-workflow/SKILL.md` | Third-party (GSD) | Workflows (YAML definitions) | Create | ✅ 6 phrases | ✅ references/ + templates/ + workflows/ | GSD YAML workflow definition authoring. V1 schema, verification policies, parameter substitution, path traversal guard. 130 lines. |
| 11 | **create-mcp-server** | `/Users/apple/.agents/skills/create-mcp-server/SKILL.md` | Third-party (GSD) | MCP Servers | Create, test, evaluate | ✅ 5 phrases | ❌ Self-contained | 6-step MCP server authoring. Research → scaffold → implement → test → evals → wire into GSD. 121 lines. |
| 12 | **create-agentsmd** | `/Users/apple/.agents/skills/create-agentsmd/SKILL.md` | Third-party/Orphan | AGENTS.md file | Create (generate) | ❌ None | ❌ Self-contained | Template-based AGENTS.md generator. Not for OpenCode primitives — generates documentation file. 249 lines. |
| 13 | **agent-md-refactor** | `/Users/apple/.agents/skills/agent-md-refactor/SKILL.md` | Third-party | AGENTS.md / CLAUDE.md | Refactor | ✅ 7 phrases | ❌ Self-contained | 5-phase refactor: Find contradictions → Extract essentials → Categorize → Structure → Prune. Progressive disclosure for agent instruction files. 287 lines. |
| 14 | **agent-orchestrator** | `/Users/apple/.agents/skills/agent-orchestrator/SKILL.md` | Third-party | Agent orchestration | Orchestrate, coordinate | ❌ None | ❌ Self-contained | Phase-gated multi-agent loop: audit → design → implement → review → validate → deliver. Delegation patterns for coordinating agents. 94 lines. |
| 15 | **dispatching-parallel-agents** | `/Users/apple/.agents/skills/dispatching-parallel-agents/SKILL.md` | Third-party (Superpowers) | Agent dispatch | Dispatch, coordinate | ⚠️ Vague only | ❌ Self-contained | Pattern for parallel agent dispatch. One agent per independent problem domain. 182 lines. |

---

### Section 2: Additional Dev Skills Found Beyond the 15 Listed

From the directory scan of `/Users/apple/.agents/skills/` (170 entries), the following additional skills teach development/build/create patterns — though they focus on general development rather than OpenCode primitives specifically:

| Skill Name | File Path | Type | Notes |
|-----------|-----------|------|-------|
| **autonomous-loops** | `/Users/apple/.agents/skills/autonomous-loops/SKILL.md` | Agent patterns | Teaches autonomous loop architectures |
| **breakdown-epic-arch** | `/Users/apple/.agents/skills/breakdown-epic-arch/SKILL.md` | Architecture | Teaches technical architecture design for epics |
| **breakdown-epic-pm** | `/Users/apple/.agents/skills/breakdown-epic-pm/SKILL.md` | Product | Teaches creating epic PRDs |
| **breakdown-feature-prd** | `/Users/apple/.agents/skills/breakdown-feature-prd/SKILL.md` | Product | Teaches creating feature PRDs |
| **breakdown-plan** | `/Users/apple/.agents/skills/breakdown-plan/SKILL.md` | Planning | Teaches comprehensive project planning |
| **breakdown-test** | `/Users/apple/.agents/skills/breakdown-test/SKILL.md` | Testing | Teaches test planning and QA |
| **decompose-into-slices** | `/Users/apple/.agents/skills/decompose-into-slices/SKILL.md` | Planning | Teaches task decomposition |
| **design-an-interface** | `/Users/apple/.agents/skills/design-an-interface/SKILL.md` | Architecture | Teaches API/module interface design (3+ approaches) |
| **feature-design-assistant** | `/Users/apple/.agents/skills/feature-design-assistant/SKILL.md` | Design | Teaches feature design via collaborative dialogue |
| **improve-codebase-architecture** | `/Users/apple/.agents/skills/improve-codebase-architecture/SKILL.md` | Architecture | Teaches architectural improvement |
| **observability** | `/Users/apple/.agents/skills/observability/SKILL.md` | DevOps | Teaches adding agent-first observability |
| **parallel-feature-development** | `/Users/apple/.agents/skills/parallel-feature-development/SKILL.md` | Development | Teaches parallel feature implementation coordination |
| **prompt-builder** | `/Users/apple/.agents/skills/prompt-builder/SKILL.md` | Prompts | Teaches creating GitHub Copilot prompts |
| **prompt-optimizer** | `/Users/apple/.agents/skills/prompt-optimizer/SKILL.md` | Prompts | Teaches EARS methodology prompt optimization |
| **structured-autonomy-generate** | `/Users/apple/.agents/skills/structured-autonomy-generate/SKILL.md` | Autonomy | Teaches structured autonomy generation |
| **structured-autonomy-implement** | `/Users/apple/.agents/skills/structured-autonomy-implement/SKILL.md` | Autonomy | Teaches structured autonomy implementation |
| **structured-autonomy-plan** | `/Users/apple/.agents/skills/structured-autonomy-plan/SKILL.md` | Autonomy | Teaches structured autonomy planning |
| **write-docs** | `/Users/apple/.agents/skills/write-docs/SKILL.md` | Documentation | Teaches collaborative document authoring |
| **write-milestone-brief** | `/Users/apple/.agents/skills/write-milestone-brief/SKILL.md` | Documentation | Teaches milestone brief (PRD) creation |
| **spike-wrap-up** | `/Users/apple/.agents/skills/spike-wrap-up/SKILL.md` | Skills | Teaches packaging spike findings into durable skills |

**Note:** These teach general development patterns, not specifically how to author OpenCode primitives (agents/commands/skills/tools/plugins). They are listed as potentially relevant dev skills.

---

### Section 3: OpenCode Command Documentation Summary

#### URLs Fetched and Accessed

1. **https://opencode.ai/docs/commands/** — Main command documentation (full fetch, May 10, 2026)
2. **https://opencode.ai/docs/agents/** — Agent documentation for cross-references (full fetch, May 10, 2026)
3. **https://opencode.ai/docs/plugins/** — Plugin documentation for cross-references (full fetch, May 10, 2026)
4. **https://opencode.ai/docs/skills/** — Skills documentation for cross-references (full fetch, May 10, 2026)

#### Key Topics Covered in Official OpenCode Docs (Commands Page)

| Topic | Covered? | Details |
|-------|----------|---------|
| **Create command files** | ✅ | `.opencode/commands/` (project) or `~/.config/opencode/commands/` (global) |
| **JSON config method** | ✅ | `opencode.json` with `command` key. Fields: `template`, `description`, `agent`, `model`, `subtask` |
| **Markdown config method** | ✅ | `.md` files with YAML frontmatter in commands/ directory |
| **$ARGUMENTS placeholder** | ✅ | Captures all arguments as single string |
| **Positional arguments** | ✅ | `$1`, `$2`, `$3` for individual args |
| **Shell output injection** | ✅ | `!`command`` syntax to inject bash output into prompt |
| **File references** | ✅ | `@src/components/Button.tsx` to include file content |
| **Template field** | ✅ | Required config option — the prompt content |
| **Description field** | ✅ | Brief description shown in TUI |
| **Agent field** | ✅ | Optional — specifies which agent executes the command |
| **Subtask field** | ✅ | Boolean — forces subagent invocation to isolate context |
| **Model field** | ✅ | Optional — override model for command |
| **Built-in commands** | ✅ | `/init`, `/undo`, `/redo`, `/share`, `/help` |
| **Custom override of built-ins** | ✅ | Custom commands can override built-in command names |

#### What the Command-Development Skill Teaches That OpenCode Docs DON'T Cover (Gaps in Official Docs)

| Feature | Skill Teaches | Official Docs | Gap Description |
|---------|--------------|---------------|-----------------|
| **allowed-tools field** | ✅ | ❌ (uses `permission` system) | Skill teaches `allowed-tools: Read, Write, Bash(git:*)`. OpenCode uses the permission system instead. |
| **argument-hint** | ✅ | ❌ | Frontmatter field for autocomplete hints. Not in official docs. |
| **disable-model-invocation** | ✅ | ❌ | Boolean to prevent programmatic invocation. Not in official docs. |
| **$IF() conditional logic** | ✅ | ❌ | `$IF($1, ..., ...)` for fallback handling. Not in official docs. |
| **CLAUDE_PLUGIN_ROOT** | ✅ | N/A | Plugin-specific variable — Claude Code only, not applicable to OpenCode. |
| **Command namespacing (subdirs)** | ✅ | ❌ | `commands/ci/test.md` → `/test (project:ci)`. Not in official docs. |
| **Bash scope restriction** | ✅ | ✅ | Skill: `Bash(git:*)`. Official: `permission.bash` with glob patterns. Different mechanism, same intent. |
| **Agent integration from commands** | ✅ | ❌ | Commands launching agents, coordinating with skills and hooks. Not explicitly documented. |
| **Skill integration from commands** | ✅ | ❌ | Commands referencing skill names for invocation. Not documented. |
| **Hook coordination** | ✅ | ✅ | Skill mentions hooks. Official docs have plugin hooks but not command-to-hook patterns. |
| **Validation patterns** | ✅ | ❌ | Argument validation, file existence checks, error handling patterns. Not in official docs. |
| **Multi-component workflows** | ✅ | ❌ | Commands combining agents + skills + scripts + templates. Not documented. |
| **Comment documentation** | ✅ | ❌ | `<!-- Usage: ... -->` comment conventions. Not documented. |

#### What Official OpenCode Docs Cover That Skills DON'T

| Feature | Official Docs | Skill Teaches |
|---------|--------------|---------------|
| **JSON config method (opencode.json)** | ✅ | ❌ |
| **subtask mode** | ✅ | ❌ |
| **Permission system integration** | ✅ | Partially |
| **Model override per command** | ✅ | ❌ |
| **Tab autocomplete for agents** | ✅ | ❌ |
| **Built-in agents (build, plan, general, explore, scout)** | ✅ | ❌ |

#### Cross-References Found

- **Commands → Agents**: The `agent` option in commands lets you specify which [agent](/docs/agents) executes the command. If the agent is a subagent, the command triggers subagent invocation.
- **Commands → Subagents**: The `subtask: true` option forces subagent invocation. Linked to [/docs/agents/#subagents](/docs/agents/#subagents).
- **Commands → Built-in commands**: `/init`, `/undo`, `/redo`, `/share`, `/help`. Linked to [/docs/tui#commands](/docs/tui#commands).
- **Commands → Plugins**: Plugin events include `command.executed` and `tui.command.execute`. Custom tools created via plugins are available to commands.
- **Commands → Skills**: Skills are loaded via the `skill` tool. Commands can trigger skill loading by mentioning skill names.
- **Commands → Custom Tools**: Custom tools are added via plugins and are available alongside built-in tools.

#### Additional Observations

1. **The `command-development` skill is Claude Code-specific.** It teaches `CLAUDE_PLUGIN_ROOT`, a Claude Code concept. OpenCode has its own plugin system with different APIs (`@opencode-ai/plugin` SDK).
2. **Different config patterns.** Claude Code uses `allowed-tools`, while OpenCode uses a `permission` system with glob patterns.
3. **No "command stacking/chaining" documented in either source.** OpenCode docs don't mention command chaining or stacking. The skill mentions multi-component workflows but not formal chaining.
4. **OpenCode's command system is simpler** than what the skill teaches. OpenCode has 5 config options (template, description, agent, subtask, model). The skill teaches 7+ frontmatter fields plus plugin-specific extensions.
5. **No formal "Command Developer Guide" exists.** The official docs page is concise (~500 words of actual content). The skill fills a substantial gap for teams building Claude Code commands but would need adaptation for OpenCode.

---

### Section 4: Trigger Phrases — Grouped by Skill Name

#### agent-development
- "create an agent"
- "add an agent"
- "write a subagent"
- "agent frontmatter"
- "when to use description"
- "agent examples"
- "agent tools"
- "agent colors"
- "autonomous agent"

#### command-development
- "create a slash command"
- "add a command"
- "write a custom command"
- "define command arguments"
- "use command frontmatter"
- "organize commands"
- "create command with file references"
- "interactive command"
- "use AskUserQuestion in command"

#### skill-development
- "create a skill"
- "add a skill to plugin"
- "write a new skill"
- "improve skill description"
- "organize skill content"

#### create-skill
- (No explicit trigger phrases — router pattern, route depends on sub-intent like "audit skill", "verify skill", "add workflow", etc.)

#### skill-creator
- "create a skill from scratch"
- "edit or optimize an existing skill"
- "run evals to test a skill"
- "benchmark skill performance with variance analysis"
- "optimize a skill's description"

#### skill-judge
- "reviewing, auditing, or improving SKILL.md files and skill packages"

#### writing-skills
- "creating new skills"
- "editing existing skills"
- "verifying skills work before deployment"

#### find-skills
- "how do I do X"
- "find a skill for X"
- "is there a skill that can..."
- "extending capabilities"

#### create-gsd-extension
- "create extension"
- "build extension"
- "add a tool"
- "register command"
- "hook into gsd"
- "custom tool"
- "gsd plugin"
- "gsd extension"

#### create-workflow
- "create a workflow"
- "new workflow definition"
- "build a workflow"
- "workflow YAML"
- "define workflow steps"
- "workflow from template"

#### create-mcp-server
- "build an MCP server"
- "create an MCP tool"
- "wrap this API as MCP"
- "expose X to Claude"
- "extending GSD with custom tool integrations"

#### create-agentsmd
- (None explicitly listed — description is "Prompt for generating an AGENTS.md file for a repository")

#### agent-md-refactor
- "refactor my AGENTS.md"
- "refactor my CLAUDE.md"
- "split my agent instructions"
- "organize my CLAUDE.md file"
- "my AGENTS.md is too long"
- "progressive disclosure for my instructions"
- "clean up my agent config"

#### agent-orchestrator
- (No explicit trigger phrases beyond description: "Orchestrate complex work via a phase-gated multi-agent loop...")

#### dispatching-parallel-agents
- "2+ independent tasks that can be worked on without shared state or sequential dependencies"

---

### Synthesized Artifact

**Key Finding:** The global skill ecosystem contains 15 clearly dev-related skills teaching how to build, create, audit, or improve OpenCode/Claude Code primitives. These split across three lineages:

1. **Claude Code plugin skills** (3): agent-development, command-development, skill-development — teach Claude Code's Markdown + YAML frontmatter format for primitives
2. **GSD ecosystem skills** (3): create-gsd-extension, create-workflow, create-mcp-server — teach GSD's TypeScript extension, YAML workflow, and MCP server authoring
3. **Skill authoring + evaluation skills** (6): create-skill, skill-creator, skill-judge, writing-skills, find-skills, create-agentsmd — teach the meta-skill of creating and evaluating skills across platforms
4. **Orchestration + coordination skills** (2): agent-orchestrator, dispatching-parallel-agents — teach how to coordinate agents
5. **Refactoring skills** (1): agent-md-refactor — teaches refactoring agent instruction files

**Critical Cross-Platform Gap:** The `command-development` skill teaches Claude Code's command format (allowed-tools, argument-hint, disable-model-invocation, CLAUDE_PLUGIN_ROOT), while OpenCode's official command docs use a different paradigm (permission system, subtask boolean, agent field, model override). These are NOT compatible. An OpenCode-native command skill would need different content.

**Official OpenCode Command Documentation** (https://opencode.ai/docs/commands/) covers 5 config options (template, description, agent, subtask, model) with $ARGUMENTS, positional args, shell injection, and file references — but lacks: argument validation patterns, multi-component workflow integration, namespaced command organization, and conditional logic patterns that the global skills teach.

### Knowledge Gaps

1. **No OpenCode-native command-development skill exists** in the global ecosystem. The existing `command-development` skill is Claude Code specific and would need substantial adaptation.
2. **No OpenCode-native agent-development skill exists** — current `agent-development` teaches Claude Code plugin format which differs from OpenCode's agent system.
3. **No OpenCode-native plugin/tool-development skill exists** — `create-gsd-extension` teaches GSD, not OpenCode plugins.
4. **Command chaining/stacking** is not documented in either official docs or global skills.
5. **Command-to-agent delegation patterns** (agent:, subtask:) are only briefly mentioned in official docs without deep workflow examples.
6. **No "Custom Tools" authoring skill** exists in the global ecosystem for OpenCode's `tool()` SDK helper.

### Recommendations

1. **Create OpenCode-native command-development skill** — Port the structure from the Claude Code skill but align with OpenCode's permission system, subtask, and JSON/Markdown dual-config paradigm.
2. **Create OpenCode-native agent-development skill** — Aligned with OpenCode's agent config (mode: primary|subagent, permission system, steps, hidden, task permissions, color as hex).
3. **Create OpenCode-native custom-tools skill** — Based on the `tool()` helper from `@opencode-ai/plugin` SDK shown in official plugins docs.
4. **Create OpenCode-native plugin-development skill** — Using SDK types, events, custom tools pattern.
5. **Update the 15 global skills inventory** into a canonical registry that tracks lineage, platform target, and cross-platform compatibility.

---

**Evidence chains verified:**
- All 15 skill files were read with SKILL.md content verified
- OpenCode docs (commands, agents, plugins, skills) were fetched live from opencode.ai on May 10, 2026
- Trigger phrases extracted directly from each skill's frontmatter description field
- No assumptions — all claims backed by file reads or web fetches
</task_result>
```

---

