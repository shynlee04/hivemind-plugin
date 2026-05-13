# Audit/improve L0/L1 agents with command-engine (@hf-l2-meta-builder subagent)

**Session ID:** ses_1de0b6f9bffe3yEdBXNhPzlJQh
**Created:** 5/13/2026, 10:28:56 PM
**Updated:** 5/13/2026, 10:34:24 PM

---

## User

Bạn là **subagent hf-l2-meta-builder**. Spawned bởi hf-l0-orchestrator.

## 🚨 NHIỆM VỤ: AUDIT + IMPROVE — KHÔNG TẠO MỚI

- KHÔNG tạo agents mới
- KHÔNG tạo skills mới
- CHỈ audit và improve những gì đã có

## 🎯 TARGET: EXISTING L0 & L1 AGENTS + ROUTING/COORDINATING SKILLS

Dưới đây là research đã hoàn tất về `execute-slash-command` tool, `hivemind-command-engine`, và CP-CMD-01 architecture. Nhiệm vụ của bạn là **audit** các agents và skills hiện có để xem chúng đã hiểu đúng về command execution architecture chưa, và **improve** (cập nhật) nội dung của chúng để phản ánh kiến thức chính xác.

## 📋 RESEARCH CONTEXT (đã verified từ source code)

### 1. execute-slash-command Tool (src/tools/session/execute-slash-command.ts)
**Schema fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| command | string | YES | Command name without leading slash |
| arguments | string | NO | Arguments string (defaults to "") |
| agent | string | NO | Agent context override |
| model | string | NO | Model override "providerID/modelID" |
| variant | string | NO | Model variant |

**SDK endpoint:** `POST /session/:sessionID/command` — deterministic, NOT LLM inference.

**Return:** `{ responseId, partsCount, errorType: "bad_request"|"not_found"|"internal" }`

### 2. hivemind-command-engine (CQRS Read-side)
**Tool:** `src/tools/hivemind/hivemind-command-engine.ts`
**Actions:**
- `discover` — Full command bundles with raw bodies
- `list_commands` — Compact summary: name, description, agent hint, acceptsArguments
- `analyze_contract` — Contract analysis for one command
- `render_context` — Bounded context rendering
- `transform_messages` — Narrow message transform
- `route_preview` — Preview without execution

**Agent workflow:** `hivemind-command-engine({action:"list_commands"})` → select → `execute-slash-command({command, arguments})`

### 3. CP-CMD-01 Architecture — Three Distinct Tiers

| Tier | SDK Endpoint | Tool | Semantics |
|------|-------------|------|-----------|
| Slash Commands | `POST /session/:id/command` | `execute-slash-command` | Deterministic, TUI-bound, agent-aware |
| Shell Commands | `POST /session/:id/shell` | `run-background-command` | PTY/headless, background processes |
| Agent Delegation | `POST /session/:id/message` | `delegate-task` | WaiterModel, dual-signal completion |

### 4. command-engine Core (src/routing/command-engine/index.ts)
- `discoverCommandBundles()` — Load all OpenCode command primitives
- `listCommands()` — Compact listing for agent decision-making
- `analyzeCommandContract()` — Validate command structure
- `routeCommandPreview()` — Full route preview with pressure check
- `renderCommandContext()` — Bounded context rendering
- `transformCommandMessages()` — Narrow message transform

### 5. Permission Model cho Command Tools
Trong agent YAML frontmatter, các tools này cần permission:
- `execute-slash-command: allow` — CHO L0/L1 agents
- `hivemind-command-engine: allow` — CHO L0 agents (discovery)
- L2 agents: `execute-slash-command: ask` (chỉ execute khi được L0/L1 approve)

## 📋 EXISTING TARGETS CẦN AUDIT & IMPROVE

### Agents cần audit:

**1. hf-l0-orchestrator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md`
- Đã có `hivemind-command-engine: allow` — TỐT
- Đã reference command routing trong context — cần CHECK có chính xác không
- **Check:** Permission có allow `execute-slash-command` không? Hiện tại nó dùng `delegate-task` để spawn agents — cần execute-slash-command để dispatch commands
- **Improve:** Thêm `execute-slash-command: allow` vào permission nếu thiếu
- **Improve:** Update context section với command tiers knowledge

**2. hf-l1-coordinator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md`
- L1 coordinator dispatch L2 specialists
- **Check:** Có hiểu về execute-slash-command trong wave coordination không?
- **Check:** Permission có execute-slash-command để dispatch commands trong waves?
- **Improve:** Thêm command execution pattern vào execution flow

**3. hm-l1-coordinator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md`
- Tương tự hf-l1-coordinator nhưng cho hm lineage
- **Check/Audit/Improve:** Tương tự

### Skills cần audit:

**4. hm-l2-lineage-router** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md`
- Đã có routing map cho 6 categories
- **Check:** Có command execution category không? Cần thêm "Command Routing & Execution" category?
- **Improve:** Nếu thiếu, thêm category cho command routing tasks với skill bundle: hivemind-command-engine (discovery) + execute-slash-command (execution) pattern

**5. hm-l2-coordinating-loop** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md`
- Đã có multi-agent dispatch pattern
- **Check:** Có biết cách dùng execute-slash-command để dispatch commands trong coordination waves không?
- **Improve:** Thêm command execution step vào coordination flow nếu phù hợp

**6. hf-l2-meta-builder-core** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md`
- Đã có routing table
- **Check:** Có reference tới command routing không?
- **Improve:** Nếu thiếu, thêm command dispatch như một meta-concept type

## 📝 PROCESS

### Phase 1: AUDIT — Delegate tới hf-l2-auditor
Delegate tới **hf-l2-auditor** để audit từng target ở trên:
- Agent: hf-l0-orchestrator, hf-l1-coordinator, hm-l1-coordinator
- Skills: hm-l2-lineage-router, hm-l2-coordinating-loop, hf-l2-meta-builder-core
- Check: permissions, references tới execute-slash-command, command tiers, CQRS pattern
- Output: Audit report với findings cho mỗi target

**Prompt cho hf-l2-auditor:**
```
Audit các agents và skills sau về mức độ hiểu biết và sử dụng đúng execute-slash-command tool,
hivemind-command-engine, và CP-CMD-01 architecture (3 tiers: slash commands/shell/agent delegation).

[Research context — chèn research context ở trên]

Targets:
1. .hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md
2. .hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md  
3. .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md
4. .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md
5. .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md
6. .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md

For each target, check:
- Permission: execute-slash-command và hivemind-command-engine có được allow không?
- Context: có reference đúng đến command tiers (slash vs shell vs delegation) không?
- Workflow: có sử dụng CQRS pattern (list_commands → execute) không?
- Gaps: thiếu kiến thức gì về command execution architecture?

Return structured audit report with findings per target.
```

### Phase 2: IMPROVE — Delegate tới hf-l2-refactorer
Sau audit, delegate tới **hf-l2-refactorer** để apply các improvements:
- Fix permissions (thêm execute-slash-command: allow cho L0/L1 agents)
- Update context sections với command tiers knowledge
- Thêm command execution patterns vào workflow/execution flow
- Cập nhật skill content với CQRS pattern và command routing

**Prompt cho hf-l2-refactorer:**
```
Apply improvements based on audit findings cho các targets sau.
Chỉ cập nhật nội dung đã có — KHÔNG tạo mới files.
KHÔNG restructure toàn bộ — chỉ fix gaps và update context.

Targets: [danh sách từ audit findings]
Changes:
- Fix permissions: thêm execute-slash-command: allow nếu thiếu ở L0/L1 agents
- Update context: thêm command tiers knowledge (slash vs shell vs delegation)
- Fix workflow: thêm CQRS pattern (list_commands → execute)

Return structured improvement report with changes made per target.
```

### Phase 3: VALIDATE
- Verify tất cả changes đã được apply
- Verify permissions pattern đúng
- Report structured results

## ⚠️ BOUNDARIES
- **CHỈ edit files trong:** `.hivefiver-meta-builder/agents-lab/active/refactoring/` và `.hivefiver-meta-builder/skills-lab/active/refactoring/`
- **KHÔNG tạo files mới**
- **KHÔNG delete files**
- **KHÔNG chạm vào** `.opencode/`
- **Audit trước, improve sau** — tuần tự
- **KHÔNG tự edit** — delegate tới hf-l2-auditor (audit) và hf-l2-refactorer (improve)

Return findings.md và structured completion report với audit findings, changes made, và verification results.

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 34.1s)

_Thinking:_

The user wants me to act as the hf-l2-meta-builder subagent and perform an audit and improvement workflow on existing L0/L1 agents and routing/coordinating skills. The task is to:

1. Phase 1: AUDIT - Delegate to hf-l2-auditor to read and audit each target file
2. Phase 2: IMPROVE - Delegate to hf-l2-refactorer to apply improvements
3. Phase 3: VALIDATE - Verify changes

Let me start by loading the relevant skills for this task. First, I need to load the skills that apply.

Let me think about which skills to load:
- I'm a subagent (hf-l2-meta-builder), so I need to follow subagent rules
- I need to load skills that match the task
- `hf-l2-use-authoring-skills` - for auditing/improving skills
- `hf-l2-auditor` related skills... but those are agents, not skills
- `hm-l2-coordinating-loop` - for coordinating multi-agent dispatch
- `hm-l2-lineage-router` - for routing tasks

Actually, as a subagent, I should:
1. First, read the target files to understand their current state
2. Then delegate audit work
3. Then delegate improvement work

But wait - the instructions say I should delegate to hf-l2-auditor and hf-l2-refactorer. Let me check if those are available as subagent types.

Looking at the available agent types for the Task tool:
- `hf-l2-auditor` - yes, available! "Audits OpenCode primitives (agents, skills, commands, tools) for quality compliance, drift detection, anti-pattern discovery, and structural integrity."
- `hf-l2-refactorer` - yes, available! "Refactors OpenCode skills and agents to improve structural quality, reduce technical debt, eliminate anti-patterns, and align with lineage standards."

So I need to use the Task tool to delegate to these subagents.

Let me start by loading relevant skills first. The task involves:
- Auditing agents and skills (so `hf-l2-use-authoring-skills` might apply)
- Coordinating multi-agent dispatch (so `hm-l2-coordinating-loop` might apply)
- Meta-builder core routing (so `hf-l2-meta-builder-core` might apply)

Let me load the skills first, then proceed with the delegation.

Actually, I need to be careful. The instructions say:
- "all agents at every turn (after PER USER's prompt, even mid-session), after each turn, entries, shift of workflows there should be matching SKILLS that you must load"
- "IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT."

So I need to load skills first. Let me identify which skills apply:

1. `hm-l2-coordinating-loop` - "Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves."
   - This applies because I'm delegating to subagents (hf-l2-auditor, hf-l2-refactorer)

2. `hf-l2-use-authoring-skills` - for auditing/improving skills
   - This applies because I'm auditing and improving skills

3. `hf-l2-meta-builder-core` - for meta-builder routing
   - This applies because I'm the hf-l2-meta-builder

Let me load these skills. But wait - I can only load max 3 skills per stack per the context.

Let me load the most relevant ones first.

Actually, let me first load skills, then start the work. Let me begin.

But actually, before loading skills, I should first read the target files to understand their current state. Let me do a batch of reads first.

Wait, the instructions say: "Skill check comes BEFORE clarifying questions." and "Skill check comes BEFORE any response or action."

So let me load skills first.

Let me load the skills that are clearly applicable:

1. `hm-l2-coordinating-loop` - for multi-agent dispatch coordination
2. `hf-l2-use-authoring-skills` - for skill audit/improvement
3. `hf-l2-meta-builder-core` - for meta-builder routing

Also, I should consider `hm-l2-lineage-router` for routing.

Let me start by loading the skills.

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
  "name": "hf-l2-use-authoring-skills"
}
```

**Output:**
```
<skill_content name="hf-l2-use-authoring-skills">
# Skill: hf-l2-use-authoring-skills

## The Iron Law

```
NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION
```

<files_to_read>
.opencode/skills/use-authoring-skills/references/01-skill-anatomy.md
.opencode/skills/use-authoring-skills/references/02-frontmatter-standard.md
.opencode/skills/use-authoring-skills/references/03-three-patterns.md
.opencode/skills/use-authoring-skills/references/05-skill-quality-matrix.md
.opencode/skills/use-authoring-skills/scripts/validate-gate.sh
.opencode/skills/use-authoring-skills/scripts/validate-skill.sh
.opencode/skills/use-authoring-skills/scripts/check-overlaps.sh
.opencode/get-shit-done/references/thinking-models-execution.md
</files_to_read>

The description is the ONLY thing the agent sees before deciding to load a skill. If it doesn't contain specific phrases a user would say, the skill is invisible. Dead on arrival.

**Not "the description should be good."** The description IS the skill. Without it, nothing else matters.

### What agents actually rationalize

| What agents say | Reality |
|-----------------|---------|
| "The description is clear enough" | It says "provides guidance for skill development." Agent will never load it. |
| "I'll add trigger phrases later" | Later never comes. The skill sits dead until someone audits it. |
| "The references are too long, I'll summarize" | References ARE the value. SKILL.md points to them. Summarizing = losing knowledge. |
| "This skill needs another skill to work" | Standalone contract. Push to load, don't require. If it can't work alone, it's not a skill — it's a chapter. |
| "The script stub exits 0 so validation passes" | A stub that always passes is a lie. Remove it or make it real. |
| "I'll keep the dead reference, it might be useful later" | Dead references are debt. The agent will try to load them, fail, and move on. |

## HIERARCHY ENFORCEMENT — Run This FIRST

This skill is LAYER 4 in the loading chain (domain execution). Before any action:

1. **Verify hierarchy chain:**
   ```bash
   bash scripts/verify-hierarchy.sh use-authoring-skills
   ```
   This checks that meta-builder exists and routed to this skill.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh use-authoring-skills
   ```

3. **Prerequisites:**
   - `meta-builder` must exist (routing source)
   - Background skills should already be loaded by upstream skills

**If hierarchy check fails → STOP. This skill should only be loaded after meta-builder routing.**

# Use Authoring Skills

## MANDATORY FIRST STEP — Run This Before Anything Else

**Every time this skill loads, run the preflight validator immediately:**

```bash
bash scripts/validate-gate.sh <create|edit|audit> "<user-request>" <skill-dir>
```

- `<create>` — building a new skill from scratch or from a document
- `<edit>` — modifying an existing skill
- `<audit>` — reviewing/grading an existing skill
- `<user-request>` — the user's exact words in quotes
- `<skill-dir>` — directory where the skill lives (default: `.`)

**If this exits non-zero, you are BLOCKED.** Fix the reported issue and re-run. Do not proceed to any other step until Gate 0 passes.

## Step-by-Step Checklist (Follow In Order)

Copy this checklist into `task_plan.md` and check off each item as you complete it. **You may not skip steps.**

```
- [ ] STEP 1: Run validate-gate.sh — must exit 0
- [ ] STEP 2: Run decision tree below — pick ONE path
- [ ] STEP 3: Load the ONE matching reference file (not all)
- [ ] STEP 4: Ask questions if unclear (max 3, question tool only)
- [ ] STEP 5: Write frontmatter — run validate-skill.sh
- [ ] STEP 6: Write body — follow agentskills.io principles (see below)
- [ ] STEP 7: Run validate-skill.sh — if FAIL, fix and repeat STEP 7
- [ ] STEP 8: Run check-overlaps.sh — if FAIL, fix and repeat STEP 8
- [ ] STEP 9: Dispatch critic subagent for review — if FAIL, fix and repeat STEP 9
- [ ] STEP 10: Final validate-gate.sh re-run — must exit 0
```

## Decision Tree — Pick Your Path

```
User says...                          → Load
─────────────────────────────────────────────────────────
"create a skill" / "make a skill"     → references/03-three-patterns.md
"create a skill like this @file"      → references/03-three-patterns.md (template path)
"audit this skill" / "review skill"   → references/05-skill-quality-matrix.md
"fix triggers" / "skill not loading"  → references/11-description-optimization.md
"improve this skill" / "refactor"     → references/07-iterative-refinement.md
"skill overlaps with..."              → references/08-conflict-detection.md
"write evals for skill"               → references/10-eval-lifecycle.md
"write scripts for skill"             → references/09-script-authoring.md
"make skill work on X platform"       → references/06-cross-platform-activation.md
"doctor" / "what's wrong with..."     → references/12-anti-deception.md
```

**Rule:** Load only ONE reference file from the decision tree. Do not load all references.

## agentskills.io Principles (Apply During STEP 6)

These are the core design principles from agentskills.io. Apply them when writing skill content:

1. **Procedures over declarations** — Teach HOW to do something, not WHAT something is. Use imperative verbs: "Run this script", "Check the output", "If X, do Y". Avoid: "This skill handles...", "The agent should...".

2. **Defaults, not menus** — Pick one approach as the primary path. Mention alternatives in one sentence. Do not present 5 options and ask the agent to choose. Example: "Use `bash scripts/validate-skill.sh` to validate. For Python-only skills, `pytest` is an acceptable alternative."

3. **Match specificity to fragility** — Be prescriptive for fragile steps (file formats, YAML syntax, tool invocation). Be flexible for creative steps (body content, examples). Frontmatter format = prescriptive. Example scenarios = flexible.

4. **Checklists for multi-step workflows** — Any workflow with 3+ steps must be a checklist with `[ ]` items. Agents check items off as they go.

5. **Validation loops** — Every significant action follows: do → validate → fix → repeat. Never declare done without running the validator.

6. **Bundle scripts in scripts/** — Reusable validation, initialization, and cleanup logic lives in `scripts/`. Reference them from SKILL.md, don't inline shell commands.

## Validation Loop (STEP 7–9)

After writing skill content, enter this loop:

```
LOOP START:
  1. Run: bash scripts/validate-skill.sh <skill-dir>
  2. If exit code ≠ 0:
     - Read the FAIL messages
     - Fix each issue
     - Go to step 1
  3. Run: bash scripts/check-overlaps.sh <skill-dir>
  4. If exit code ≠ 0:
     - Read overlap warnings
     - Resolve conflicts
     - Go to step 3
  5. Dispatch critic subagent:
     - Task: "Review this skill against agentskills.io principles"
     - Pass: skill-dir path + the agentskills.io principles from this file
     - If critic reports issues → fix them → go to step 1
  6. All checks passed → exit loop
LOOP END
```

**Maximum iterations:** 5. If the loop hasn't passed after 5 iterations, stop and report what's blocking.

## Question Enforcement (STEP 4)

When intent is unclear:

- **Maximum 3 questions per session.** Not 4. Not "just one more."
- **Use the question tool only.** Do not ask questions in plain text output.
- **Wait for answers** before proceeding to implementation.
- If still unclear after 3 questions, proceed with the most reasonable default and document the assumption in `task_plan.md`.

## Gate System

| Gate | When | Criteria | Enforcement |
|------|------|----------|-------------|
| G1: Intent | Before any work | User intent in task_plan.md Goal field | `validate-gate.sh` checks Goal non-empty |
| G2: Structure | Before writing body | SKILL.md frontmatter has name + description | `validate-skill.sh` checks frontmatter |
| G3: Pattern | Before body content | Pattern (P1/P2/P3) selected in task_plan.md | `validate-gate.sh` checks pattern field |
| G4: Quality | Before declaring done | Quality score ≥ 3/5 on all 5 dimensions | `gate-enforce.sh G4` runs scoring |
| G5: Validation | Final step | validate-skill.sh + check-overlaps.sh both pass | `validate-gate.sh` re-run |
| G6: Subagent Review | After G5 | Critic subagent review passes | Manual dispatch + loop |

**Run enforcement:** `bash scripts/validate-gate.sh <action> "<request>" <dir>` — exits non-zero if blocked.

## Worked Example: Document → Skill Conversion

**Input:** User provides a 200-line markdown command file to convert into a skill.

**STEP 1:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0, creates task_plan.md.

**STEP 2:** Decision tree → "create a skill like this @file" → load `references/03-three-patterns.md`.

**STEP 3:** Pattern decision: focused how-to guide → **P2** (balanced depth). Record in task_plan.md.

**STEP 4:** Questions if needed (max 3 via question tool).

**STEP 5:** Write frontmatter:
```yaml
---
name: hf-l2-use-authoring-skills
description: Synthesizes Repomix-packed codebase analysis into structured research reports with citations. Use when the user asks to analyze a codebase deeply, create research reports from Repomix output, or synthesize findings from multiple code sources.
---
```
Run `bash scripts/validate-skill.sh .` → passes.

**STEP 6:** Write body following agentskills.io principles (procedures, defaults, checklists).

**STEP 7–9:** Validation loop → validate-skill.sh → check-overlaps.sh → critic subagent → all pass.

**STEP 10:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0.

**Output:** Complete skill at target directory with `references/` and `scripts/`.

## Anti-Patterns — With Detection

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Phantom dependencies** — referencing skills that don't exist | `grep -r "skill(" SKILL.md references/` → verify each exists | Remove or create the missing skill |
| **Identity crisis** — P1 router with P3 depth content | Count lines: >300 in SKILL.md = likely P3 masquerading | Split into thin SKILL.md + reference files |
| **Unenforceable gates** — claims "programmatic" with no scripts | `ls scripts/` → must have validate-gate.sh + validate-skill.sh | Create enforcement scripts or remove gate claims |
| **Template TDD mismatch** — forcing RED phase on template conversion | Check task type: if "convert document" → skip RED | Use template-driven workflow |
| **Banned field usage** — `compatibility` in frontmatter | `grep "compatibility:" SKILL.md` | Remove per agentskills.io spec |
| **Skipping validation loop** — declaring done without running validators | Check task_plan.md: STEP 7–9 unchecked | Run the loop before claiming complete |

## Platform Adaptation

| Platform | Skill Location | Hook Format | Notes |
|----------|---------------|-------------|-------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `opencode.json` hooks | Use `skill` tool to load |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `.claude/hooks/` | Same frontmatter spec |
| **Codex** | `.codex/skills/<name>/SKILL.md` | `.codex/hooks/` | May need `allowed-tools` field |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `.cursor/rules/` | Frontmatter may vary |

Always write frontmatter per agentskills.io spec — it is the lowest common denominator.

## Scripts

All 8 scripts passed audit — each has real validation logic, exits non-zero on failure, and contains no placeholder/TODO text. Unlike stub scripts (which exit 0 always), these enforce actual constraints.

| Script | Purpose | Lines |
|--------|---------|-------|
| `validate-gate.sh` | Preflight: intent, pattern, planning files | 118 |
| `validate-skill.sh` | Structure: frontmatter, sections, terminology | 187 |
| `check-overlaps.sh` | Content duplication detection across reference files | 203 |
| `gate-enforce.sh` | Gate G1-G5 enforcement with pass/fail | 109 |
| `check-complete.sh` | Phase completion status reporter | 37 |
| `init-session.sh` | Planning file initialization | 121 |
| `register-skill.sh` | Skill load recording in loaded-skills.json | 122 |
| `verify-hierarchy.sh` | Prerequisite chain verification | 295 |

Enforcement lives primarily in SKILL.md text (Iron Law + Validation Gate). Scripts supplement for mechanical checks (structure validation, gate enforcement). If a script ever becomes a stub (exits 0 without checking), delete it — the text enforcement is the source of truth.

## Validation Gate

Before a skill is done:
- [ ] Description has trigger phrases (specific things users would say)
- [ ] Description uses third person
- [ ] SKILL.md body uses imperative form
- [ ] SKILL.md is lean (1,500-2,000 words, <5k max)
- [ ] All referenced files exist and have real content (not stubs)
- [ ] No script stubs that exit 0 always
- [ ] No dead references to files/scripts that don't exist
- [ ] Works standalone — doesn't require other HiveMind skills

## Three Operating Rules

1. **Run validate-gate.sh first** — before reading, writing, or planning anything.
2. **Procedures over declarations** — teach HOW, not WHAT. Use checklists for 3+ step workflows.
3. **Validate before done** — run the validation loop (STEP 7–9). No exceptions.

## Self-Correction

### When the Task Keeps Failing
[Detection] validate-skill.sh repeatedly fails (3+ iterations). check-overlaps.sh reports persistent conflicts. Critic subagent keeps flagging the same issues after 3 fix cycles.
[Recovery] STOP the validation loop. Read the exact failure messages from each failing script. Address the root cause rather than patching symptoms. If overlap conflicts persist: the skill may need scope reduction or should be merged with the overlapping skill. If critic reports are unclear: ask the user which specific principle is violated before continuing. Do not exceed 5 total iterations — beyond that, the skill needs redesign, not refinement.

### When Unsure About the Next Step
[Detection] The user's request doesn't clearly map to any decision tree path. validate-gate.sh exits with an ambiguous error. Pattern selection (P1/P2/P3) is unclear for the task.
[Recovery] Run `bash scripts/validate-gate.sh <action> "<user-request>" <dir>` to create task_plan.md — this will clarify intent and pattern. Check the pattern field in task_plan.md: if unset, default to P2 (balanced depth) for most authoring tasks. Use the question tool for up to 3 clarifications — but proceed with reasonable defaults if still unclear after 3 questions.

### When the User Contradicts Skill Guidance
[Detection] User says "don't bother with the checklist" or "skip validation, just write it" or "I know the agentskills.io spec, ignore it." User wants to bypass the 10-step checklist or validation loop.
[Recovery] Acknowledge the user's authority but warn: "Skipping validation means the skill may have broken frontmatter, phantom references, or dead trigger phrases. The skill may silently fail to load." If the user insists, document skipped steps in task_plan.md and mark the skill as "unvalidated." Never claim a skill passed validation if any gate was skipped.

### When an Edge Case Is Encountered
[Detection] Skill being audited uses a non-standard frontmatter format (different YAML spec). User wants to author a skill for a platform not in the adaptation table. Script fails due to missing dependency (bash version, jq not installed). Skill has content in multiple languages.
[Recovery] For non-standard frontmatter: validate against agentskills.io spec and flag deviations. For unsupported platforms: apply agentskills.io patterns as the lowest common denominator, then document platform-specific adaptations. For missing dependencies: check if the script has fallback logic — if not, inform the user which dependency is needed. For multi-language skills: treat the primary language as canonical and flag translations for separate review.

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/task_plan.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/trigger-queries.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/grading-rubric.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/03-three-patterns.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/08-conflict-detection.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/04-tdd-workflow.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/06-cross-platform-activation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/07-iterative-refinement.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/02-frontmatter-standard.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hf-l2-meta-builder-core"
}
```

**Output:**
```
<skill_content name="hf-l2-meta-builder-core">
# Skill: hf-l2-meta-builder-core

# meta-builder

## Overview

Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to the right specialist. Receives intent → classifies → navigates step-by-step → reports back. Does NOT create, edit, or execute domain work.

**When to load this skill:** The user wants to create, audit, stack, or configure any OpenCode meta-concept but hasn't gone directly to the specialist. This skill figures out what they need and routes them.

**When NOT to load this skill:** The user's request already matches a specialist skill directly (e.g., they said "audit this skill" and `use-authoring-skills` is available). Route directly instead.

### What This Skill Handles

| Concept | What Gets Produced (per agentskills.io spec) | Where It Lives |
|---------|---------------------------------------------|----------------|
| **Skills** | `SKILL.md` (required) + `scripts/` (optional) + `references/` (optional) + `assets/` (optional) | `.hivefiver-meta-builder/skills-lab/` → symlinked to `.opencode/skills/` |
| **Agents** | `.md` with YAML frontmatter, permissions, execution flows | `.hivefiver-meta-builder/agents-lab/` → symlinked to `.opencode/agents/` |
| **Commands** | Thin shells with `$ARGUMENTS` parsing, agent binding, CI=true safety | `.hivefiver-meta-builder/commands-lab/` → symlinked to `.opencode/commands/` |
| **Tools** | Zod schema designs, plugin hook patterns, lifecycle management | `.opencode/` config + `src/lib/` for custom tools |

### What This Skill Does NOT Handle

| Not This Skill | Route To Instead |
|----------------|-----------------|
| "Build a NextJS app" / "Add an API endpoint" | Project-building agents (Hiveminder lineage) |
| "Fix a TypeScript bug in src/" | Builder or critic agents |
| "Run the test suite" | Direct execution — no routing needed |
| "Explain how React hooks work" | Web search or direct answer |

## The Subject Matter

Meta-concepts are the building blocks of an OpenCode project. Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. This skill teaches agents how to create, audit, stack, and manage those building blocks effectively.

## Principles

- **Iterative few-step interactive** — one step, validate, show user, confirm, proceed. NOT autonomous long-horizon execution.
- **No direct execution** — route to specialists. Never create skills/agents/commands yourself.
- **Max 3 skills per stack** — context window is shared. If you can't explain why each skill is needed in one sentence, don't load it.
- **Standalone-first** — every meta-concept works with OpenCode alone. HiveMind runtime is bonus, not required.
- **Edit in labs, test via symlinks** — source of truth is `.hivefiver-meta-builder/**-lab/`. `.opencode/` is a symlink for live testing. Never edit `.opencode/` directly.

## On Load

1. **Load background skill** per the conditional table below — NOT all of them.

   | If user asks about... | Load this ONE skill |
   |----------------------|---------------------|
   | Agents, commands, tools, permissions | `opencode-platform-reference` |
   | Codebase analysis, repo exploration | `repomix-exploration-guide` |
   | Shell safety, non-interactive execution | `opencode-non-interactive-shell` |
   | Ambiguous intent, unclear scope | `user-intent-interactive-loop` |
   | Multi-step planning needed | `hm-planning-persistence` |
   | Nothing specific yet | None — wait for routing decision |

2. **Read planning files if they exist:** `task_plan.md`, `findings.md`, `progress.md`.

3. **For skill stacking (max 3 per stack), MANDATORY** — read `references/04-skills-chaining.md` for loading order and composition rules.

4. **Understand the Hivefiver workspace:**

   | File | Why It Matters |
   |------|---------------|
   | `.hivefiver-meta-builder/AGENTS.md` | Agent team, delegation protocol, iron laws |
   | `.hivefiver-meta-builder/distinguish-hivefiver-meta-builder.md` | Entity boundaries (OpenCode / HiveMind / Hivefiver / Hiveminder) |
   | `.hivefiver-meta-builder/GENERAL-KNOWLEDGE.md` | Platform synthesis requirements, skill lineages |
   | `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` | Onboarding protocol, skill stack, routing tree |
   | `.hivefiver-meta-builder/SKILLS-AGENTS-COMMANDS-TOOLS.md` | Core lexicon, execution dynamics |
   | `.hivefiver-meta-builder/updating-for-hivefiver-onboarding.md` | Misconceptions, prevention mechanisms |
   | `.hivefiver-meta-builder/workflows-lab/active/refactoring/` | Workflow source of truth |

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What Agents Actually Rationalize

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |
| "I'll load find-skills to find similar skills first" | Spent context budget on vague self-referential search | Never use find-skills as a pre-creation rabbit hole. |
| "I'll read all 20 skill files at once for the audit" | Blew context, produced unusable report | Chunk audits. One phase at a time. |

## OpenCode Meta Concepts — Mind Map

Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. Workflows sequence steps. Permissions gate access. Rules constrain behavior. Configs wire it all together.

**Key relationships:**
- Skills are loaded by agents via the `skill` tool — progressive disclosure in action
- Commands bind to agents via `agent:` frontmatter — deterministic entry points
- Tools are invoked by agents during execution — bash, read, write, grep, glob, etc.
- Workflows are procedural files that agents execute step-by-step
- Permissions (in `opencode.json`) gate which tools each agent can use
- Rules (in `.opencode/rules/`) constrain agent behavior globally

### Example: An Agentic Workflow in Action

```
User: "Create a skill for deep research"
  ↓
Command: /hf-create skill=deep-research
  ↓
Agent: hivefiver-orchestrator loads meta-builder skill
  ↓
meta-builder routes to: use-authoring-skills (hivefiver-skill-author)
  ↓
Step 1: Write frontmatter → validate-skill.sh → show user → confirm
  ↓
Step 2: Write body → validate-skill.sh → show user → confirm
  ↓
Step 3: Create references/ → check-overlaps.sh → show user → confirm
  ↓
Step 4: Critic subagent review → fix issues → final validate → commit
  ↓
Result: Skill at .hivefiver-meta-builder/skills-lab/active/refactoring/deep-research/
        Symlinked to .opencode/skills/deep-research/ for live testing
```

## Domain Routing — When to Create What

| User Need | Create | Why | Example |
|-----------|--------|-----|---------|
| Persistent behavioral change across sessions | **Skill** | Teaches expertise, loaded on demand | "Teach the agent how to audit skills" |
| Autonomous execution with specific permissions | **Agent** | LLM + tools + permissions + memory | "Create a researcher that can web search but not edit files" |
| Deterministic one-shot action | **Command** | Bypasses reasoning, forces action | "Run the audit pipeline" |
| Environment interaction (API, DB, filesystem) | **Tool** | External function the LLM invokes | "Add a tool that queries our internal API" |
| Multi-step procedural logic | **Workflow** | Sequential steps executed by agents | "Onboarding flow: context load → skill activation → intent classification" |

## Power Tools — Built-in Capabilities Often Misused

These OpenCode built-in tools are the most powerful primitives for meta-builder work. Know them. Use them correctly. Reference their depth-skill files when needed.

### `question` — Gate Execution Before Acting

**What it does:** Presents structured choices to the user during execution. Each question has a header, text, and options. Users can select or type custom answers.

**Why it matters:** Setting `question: allow` in agent permissions **prevents execution before user approval**. The agent MUST stop and ask. This is the primary guardrail against autonomous long-horizon execution.

```json
{
  "permission": {
    "question": "allow",
    "edit": "ask",
    "bash": "ask"
  }
}
```

**When to use:** Before routing to a specialist, before committing changes, before loading skills beyond the max-3 limit.

### `todowrite` — Track Progress Visibly

**What it does:** Creates and updates task lists during complex operations.

**Why it matters:** Every meta-concept workflow ends with a TODO list showing completion status. This is Step 5 of the 5-step workflow.

```
- [ ] Frontmatter written and validated
- [ ] Body content complete
- [ ] References created
- [ ] Validation loop passed
- [ ] Committed to git
```

**Note:** Disabled for subagents by default. Enable manually when needed.

### `patch` — Apply Diffs Safely

**What it does:** Applies patch files to your codebase. Controlled by the `edit` permission (along with `edit`, `write`, `multiedit`).

**Why it matters:** When auditing and fixing skills across multiple files, patches are safer than full rewrites. They show exactly what changed.

**When to use:** Applying critic review fixes, syncing lab changes to `.opencode/` copies, updating frontmatter across multiple skills.

### `grep` + `glob` — Find Before You Read

**What they do:** `grep` searches file contents with regex. `glob` finds files by pattern. Both use ripgrep under the hood, respecting `.gitignore`.

**Why it matters:** Never read full files when frontmatter or specific sections are needed. Grep first, read only what's necessary.

```bash
# Find all skills with missing trigger phrases
grep -r "description:" .opencode/skills/*/SKILL.md | grep -v "Use when"

# Find all agent definitions with task: ask
grep -r '"task"' .opencode/agents/*.md
```

### `lsp` (experimental) — Code Intelligence

**What it does:** Interacts with LSP servers for definitions, references, hover info, call hierarchy. Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`.

**Why it matters:** When auditing TypeScript harness code (`src/`), use LSP to find all references to a function, trace imports, understand dependencies without reading every file.

### `skill` — Load Skills On Demand

**What it does:** Loads a SKILL.md file and returns its content in the conversation. This IS the routing mechanism.

**Why it matters:** When meta-builder routes to `use-authoring-skills`, it calls `skill({ name: "use-authoring-skills" })`. This is progressive disclosure in action.

### `webfetch` + `websearch` — External Knowledge

**What they do:** `webfetch` retrieves content from a specific URL. `websearch` searches the web via Exa AI.

**Why it matters:** Fetch canonical specs (agentskills.io/llms.txt), research GitHub repos for skill patterns, verify platform documentation is current.

**Tip:** Use `websearch` when you need to FIND information (discovery). Use `webfetch` when you need to RETRIEVE content from a known URL (retrieval).

---

### Quick Reference: Built-in Tool → Meta-Builder Use Case

| Tool | Meta-Builder Use Case | Permission |
|------|----------------------|------------|
| `question` | Gate execution before user approval | `allow` |
| `todowrite` | Track workflow completion (Step 5) | `allow` |
| `patch` | Apply audit fixes safely | `ask` |
| `grep` | Find patterns across skills/agents/commands | `allow` |
| `glob` | Locate files by pattern | `allow` |
| `skill` | Load specialist skills for routing | `allow` |
| `webfetch` | Fetch canonical specs, platform docs | `allow` |
| `websearch` | Research GitHub repos for patterns | `allow` |
| `lsp` | Trace references in TypeScript harness code | `allow` (experimental) |
| `read` | Read specific file sections (offset/limit) | `allow` |
| `bash` | Run validation scripts (`validate-skill.sh`) | `allow` |
| `edit` | Modify skill/agent/command files | `ask` |
| `write` | Create new skill/agent/command files | `ask` |

## 5-Step Workflow

Every meta-builder request follows this workflow. Set up a TODO list as the final step.

```
Step 1: RECEIVE INTENT
  - Classify against routing table below
  - If ambiguous → load user-intent-interactive-loop
  - If clear → proceed to Step 2

Step 2: LOAD BACKGROUND SKILLS
  - Load ONE skill per the On Load conditional table
  - Load ONE specialist skill matching the intent
  - Max 3 total skills loaded (including meta-builder)
  - Document WHY each skill is needed in one sentence

Step 3: NAVIGATE TO SPECIALIST
  - Route to the specialist agent per routing table
  - Construct exact context: task text + scene-setting + scope
  - NEVER pass session history to subagents
  - Await specialist output

Step 4: VALIDATE OUTPUT
  - Stage 1: Spec compliance — does output match requirements?
  - Stage 2: Quality — well-built? clean? following patterns?
  - If FAIL → return to specialist with specific feedback
  - If PASS → proceed to Step 5

Step 5: TODO LIST + DESIGN SPEC
  - Create todowrite list showing completion status
  - Write design spec: what was done, where it lives, how to test
  - Commit to git with descriptive message
  - Report to user: what was created, next steps
  - Await user confirmation before advancing
```

## Routing Table

| User Intent | Route To | Specialist Agent | Notes |
|-------------|----------|-----------------|-------|
| "create a skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` | `hivefiver-skill-author` | File-referenced creation |
| "audit this skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create an agent" | `agents-and-subagents-dev` | `hivefiver-agent-builder` | |
| "set up a command" | `command-dev` | `hivefiver-command-builder` | |
| "build a custom tool" | `custom-tools-dev` | `hivefiver-tool-builder` | |
| "configure OpenCode" | `opencode-platform-reference` | self (research + report) | |
| "stack skills" / "combine skills" | `meta-builder` + target skills | self (orchestrate) | Max 3 per stack |
| "synthesize skills" / "create skills from GitHub" | `skill-synthesis` | `meta-synthesis-agent` | Synthesis from repos |
| "help me figure out", "I'm not sure", ambiguous | `user-intent-interactive-loop` | `intent-loop` | Clarify before routing |
| `/hf-create` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-audit` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-stack` | `meta-builder` + target skills | self (orchestrate) | Hivefiver command |

**Fallback:** If a specialist skill is missing or broken → use `opencode-platform-reference` for research, report findings, recommend manual creation.

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | use-authoring-skills + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |
| "Synthesize a skill + validate it" | skill-synthesis + use-authoring-skills | Synthesis + validation gate |
| "Analyze a GitHub repo for skill patterns" | repomix-explorer + skill-synthesis + coordinating-loop | Repo packing + pattern extraction + parallel audit |

For loading order details, MANDATORY — read `references/04-skills-chaining.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |
| **The Dead Referrer** — routing to a skill that doesn't exist | `ls .opencode/skills/<name>/SKILL.md` fails | Check file exists before routing. Use fallback. |
| **The Lab Ignorer** — editing `.opencode/` directly | Changes not in `.hivefiver-meta-builder/**-lab/` | Edit in labs → test via symlinks → commit. |
| **The Script Forgetter** — having scripts but never running them | `ls scripts/` has files, SKILL.md never references them | Reference scripts in workflow steps. Run them. |
| **The Long-Horizon Drifter** — running 10 steps autonomously | No user confirmation between steps | One step → validate → show → confirm → proceed. |

## Question Discipline

- **Max 3 questions per session.** Not 4. Not "just one more."
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Reference Map

| File | Loading Trigger | What It Contains |
|------|-----------------|-----------------|
| `references/01-mindsnetwork-graph.md` | **MANDATORY** for 3-skill stacks with cross-dependencies | Node types, edge types, graph traversal algorithm, JSON schema |
| `references/02-deterministic-control.md` | **MANDATORY** when routing decision is ambiguous between 2+ table entries | Pre/during/post execution protocol, rollback rules, retry strategy |
| `references/03-long-horizon-persistence.md` | Read when task spans sessions or involves subagent delegation | Session recovery, checkpoint protocol, context handoff |
| `references/04-skills-chaining.md` | **MANDATORY** before any stack operation | Loading order, composition rules, anti-patterns, worked examples |
| `assets/skill-frontmatter.md` | When creating a new skill | YAML skeleton + description formula + trigger phrase template |
| `assets/agent-frontmatter.md` | When creating a new agent | YAML skeleton + permissions model + delegation config |
| `assets/command-frontmatter.md` | When creating a new command | YAML skeleton + $ARGUMENTS pattern + bash injection safety |
| `workflows/skill-creation-flow.md` | When routing to skill creation | Step-by-step: intent → pattern → frontmatter → body → validate |
| `workflows/agent-creation-flow.md` | When routing to agent creation | Step-by-step: role → tools → permissions → delegation → validate |
| `workflows/command-creation-flow.md` | When routing to command creation | Step-by-step: intent → arguments → agent binding → shell safety → validate |
| `references/depth-built-in-tools.md` | Read when needing specific built-in tool usage patterns for meta-builder work | Tool-specific guides with examples and permission recommendations |
| `references/depth-github-stacks.md` | Read when composing skills from GitHub repos into stacks | GitHub stacking patterns, loading order, composition rules |
| `references/depth-repo-analysis.md` | Read when analyzing repos for meta-concept extraction | repomix patterns, grep strategies, token efficiency |
| `references/depth-skill-synthesis.md` | Read when ingesting skills from remote repos | GitHub ingestion pipeline, error handling, shell safety |

**Do NOT load** references/01-03 for simple routing tasks. Only load when the task requires graph traversal, state machine execution, or cross-session persistence.

## Pattern Research (Deferred)

**Deferred to implementation plan.** The agent executing the refactor will run `find-skills` to discover 3 collaborative meta-skills, extract their patterns, and adapt them to meta-builder's context. Do NOT run this during normal meta-builder operation.

---

## Validation Gate

Before declaring any meta-concept task complete:

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] Route-check passes (`bash scripts/route-check.sh`)
- [ ] Graph validation passes (`bash scripts/validate-graph.sh`)
- [ ] No dead references (all referenced files exist on disk)
- [ ] No stub scripts (all scripts have real validation logic)
- [ ] Trigger phrases present in description (for skills)
- [ ] Non-interactive shell safe (for commands)
- [ ] Permissions explicit (for agents)
- [ ] Committed to git with descriptive message
- [ ] TODO list created showing completion status
- [ ] User has confirmed delivery

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/assets/skill-frontmatter.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/assets/agent-frontmatter.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/assets/command-frontmatter.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/route-check.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/graph-init.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/graph-traverse.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/validate-graph.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/register-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/scripts/state-persist.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-meta-builder-core/references/depth-built-in-tools.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 12.1s)

_Thinking:_

Skills loaded. Now let me set up the task and start the workflow.

I am a **subagent hf-l2-meta-builder**. My task is:

1. **Phase 1: AUDIT** - Read and audit the target files, then delegate audit to hf-l2-auditor
2. **Phase 2: IMPROVE** - Delegate improvements to hf-l2-refactorer
3. **Phase 3: VALIDATE** - Verify changes

Let me follow the coordinating-loop skill's procedure:

1. **ASSESS** - Build the task inventory
2. **DECIDE MODE** - Multiple tasks, determine if parallel or sequential
3. **DISPATCH** - Delegate with task envelopes
4. **MONITOR** - Check results
5. **INTEGRATE** - Merge results
6. **VERIFY** - Gate check

But first, I need to read the target files to understand their current state before delegating the audit. Let me read the 6 target files.

Actually, the coordinating-loop skill says:
- "If only one task, do NOT load this skill. Execute directly."
- I have multiple tasks (audit 6 targets, then improve 6 targets) - so this skill applies.

But actually, I can't run bash scripts for the coordinating-loop gates as those are for the Hivemind environment. Let me adapt.

Let me start by reading the target files to understand current state, then delegate the audit.

Let me create a task plan and then start Phase 1: AUDIT.

I'll read all 6 target files first to understand their current content, then delegate the audit to hf-l2-auditor.

Wait, actually the instructions say:
- "Audit trước, improve sau — tuần tự"
- "KHÔNG tự edit — delegate tới hf-l2-auditor (audit) và hf-l2-refactorer (improve)"

So I should:
1. Read files (I can do this)
2. Create audit task for hf-l2-auditor
3. Create improvement task for hf-l2-refactorer
4. Validate

Let me read the files first.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
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
    "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 128.1s)

_Thinking:_

Let me read all 6 target files to understand their current state. I'll batch the reads together.

Let me first read all 6 target files to understand their current state before delegating audit work.

**Tool: task**

**Input:**
```json
{
  "description": "Read hf-l0-orchestrator agent",
  "prompt": "Read the file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md` and return its complete contents. I need the full file text including YAML frontmatter, permissions, and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5fafffe045t94fXiLYF4D (for resuming to continue this task if needed)

<task_result>
Đây là nội dung đầy đủ của file `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md` (657 dòng):

```yaml
---
name: hf-l0-orchestrator
description: Front-facing high-reasoning L0 strategist and battle commander for hf-* meta-builder lineage. Forms complete end-to-end task landscape before delegating. Routes all execution through L1/L2/L3 specialists. NEVER executes inline — all detail work is delegated.
mode: primary
temperature: 0.25
steps: 100
color: "#8B5CF6"
permission:
  read:
    "*": deny
  edit:
    "*": deny
  write:
    "*": deny
  bash:
    "*": deny
    git *: allow
    node *: allow
    npx *: allow
  glob: allow
  grep: allow
  task:
    "*": ask
    hf-l1-coordinator: allow
    hm-l1-coordinator: allow
    hf-l2-*: allow
    hm-l2-*: allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: allow
  prompt-analyze: allow
  session-patch: ask
  session-tracker: allow
  hivemind-trajectory: allow
  hivemind-pressure: allow
  hivemind-doc: allow
  hivemind-sdk-supervisor: allow
  hivemind-command-engine: allow
  hivemind-agent-work-create: allow
  hivemind-agent-work-export: allow
  webfetch: allow
  websearch: allow
  skill:
    "*": ask
    hf-l2-*: allow
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
depth: L0
lineage: hf
domain: Meta-Concept Orchestration
delegation_routing:
  fast_path:
    criteria:
      - single_concept: Task involves exactly one meta-concept type (e.g., one skill)
      - known_routing: Command or intent maps to known hf-l2 specialist
      - immediate_execution: No multi-wave coordination or dependent creation steps
      - user_authorized: User directly requested a specific meta-concept type
      - simple_audit: Single-concept audit or quality check
    targets:
      - hf-l2-*
  coordinated_path:
    criteria:
      - multi_concept: Task requires 2+ meta-concepts (e.g., agent + skill + command)
      - dependent_waves: Output of one meta-concept feeds another
      - unknown_scope: Task needs decomposition before meta-concept building
      - cross_lineage_investigation: Codebase investigation needed before creation
      - remediation_loop: Previous attempt failed and needs coordinated re-dispatch
    targets:
      - hf-l1-coordinator
  cross_lineage_path:
    criteria:
      - product_dev_task: User asks for implementation/debug/testing work
      - hm_requires_meta_concept: hm-* needs meta-concept understanding
    targets:
      - hm-l0-orchestrator
      - hm-l1-coordinator
intent_classification:
  domains:
    - Agent Building
    - Skill Authoring
    - Command Building
    - Tool Building
    - Prompt Engineering
    - Context/Audit
    - Orchestration
    - Research
    - Audit
    - Investigation
    - Review
    - Gatekeeping
    - Verification
    - Risk Regression
    - Codebase Mapping
    - Architecture
    - Feature Design
    - Planning
    - Roadmap Updates
    - Health Check
    - Implementation
    - Test Design
    - Documentation
    - Phase Lifecycle
    - Debug
    - Meta-Concept
  routing_skills:
    - hf-l2-meta-builder-core
    - hm-l2-lineage-router
  session_context_fields:
    - current_session_id
    - active_delegations
    - pending_gates
    - interrupted_sessions
    - command_invoked
    - delegation_depth
    - cross_lineage_justification
    - landscape_documented
    - artifact_verification_pending
skills:
  - hf-l2-meta-builder-core
  - hm-l2-lineage-router
  - hm-l2-coordinating-loop
  - hm-l2-user-intent-interactive-loop
  - hm-l2-completion-looping
  - gate-l3-lifecycle-integration
  - gate-l3-spec-compliance
  - gate-l3-evidence-truth
instruction:
  - .opencode/rules/universal-rules.md
  - AGENTS.md
---
```

Phần còn lại bắt đầu từ dòng 135:

```markdown
# hf-orchestrator — front-facing L0 strategist and battle commander

<identity front_facing="true" strategist="true" executor="false" execution_banned="true" delivery_tracking="strict"/>

<role>
Front-facing high-reasoning L0 strategist and battle commander for hf-* meta-builder lineage. Forms the complete end-to-end task landscape before delegating any piece. Routes execution through intelligent delegation based on workflow classification, complexity assessment, and user intent. Routes through L1 (coordinated multi-wave), direct to L2/L3 (fast-path single-concept), or cross-lineage to hm-* agents. NEVER executes inline — delegates to L1, L2, or L3 specialists for ALL detail work. Enforces quality gate triad on every return. FLEXIBLE cross-lineage access to hm-* skills for codebase investigation. Never implements directly.
</role>

<depth>
L0 Orchestrator — top-level meta-concept routing and delegation brain with strategist/commander authority. Manages workflow routing, gate decisions, user intent classification, and cross-lineage coordination.

**Delegation model — tri-path:**
- **Fast-path (direct-to-hf-l2):** For single-meta-concept tasks (e.g., create one skill, audit one agent). Bypasses L1 to avoid context waste.
- **Coordinated-path (via hf-l1-coordinator):** For multi-concept waves, cross-lineage investigations, or remediation loops.
- **Cross-lineage (to hm-*):** Product-development tasks (implement, debug, test) or codebase investigation.

**Decision authority:** Makes path decision based on: (1) user intent classification (domain + scope), (2) session runtime context (delegations, trajectory depth, pressure tier), (3) workflow requirements (single vs multi-concept), and (4) cross-lineage needs. FLEXIBLE lineage binding enables hm-* skill access for codebase investigation.
</depth>

<lineage>
hf-* (FLEXIBLE). Loads hf-* skills as primary, but may access hm-* skills when meta-concept building requires codebase investigation or quality validation. Examples: creating an agent that uses hm-detective to understand existing patterns, or using hm-deep-research to investigate a library before creating a skill for it. Also loads gate-* quality triad and stack-* reference skills.
</lineage>

<task>
1. Receive user request for meta-concept creation, audit, repair, or cross-domain routing.
2. Classify into 26 hf-* domains including Research, Audit, Investigation, Review, Gatekeeping, Verification, Risk Regression, Codebase Mapping, Architecture, Feature Design, Planning, Roadmap Updates, Health Check, Implementation, Test Design, Documentation, Phase Lifecycle, Debug, Meta-Concept, and 7 original meta-concept domains.
3. **Form complete end-to-end task landscape** before any delegation — see `<landscape_protocol>`.
4. **Determine delegation path** based on landscape, intent, and session runtime:
   a. **Fast-path** (direct to hf-l2-*): single-concept, known routing, immediate execution.
   b. **Coordinated-path** (via hf-l1-coordinator): multi-concept system, cross-lineage investigation, unknown scope, remediation.
   c. **Cross-lineage** (to hm-*): product-dev task → hm-orchestrator; codebase investigation → hm-l1-coordinator.
5. Select delegation target from `<agent_pool>` based on domain classification and path.
6. Dispatch with structured context: task, domain, scope, boundaries, output format, gate expectations.
7. Monitor delegation via delegation-status polling. Track sessions.
8. Run quality gate triad: lifecycle → spec → evidence. Verify artifact persistence.
9. If gates PASS: report completion with evidence summary and artifact links.
10. If gates FAIL: return with specific gap remediation. Max 3 cycles per path.
11. Record session outcome. Update continuity. Write landscape and tracking artifacts to `.hivemind/planning/<session>/`.
</task>

<scope>
**In scope:**
- Meta-concept intent classification and domain routing (26 domains)
- Delegation path decision (fast-path vs coordinated-path vs cross-lineage)
- Fast-path direct dispatch to hf-l2 specialists (single-concept, known-routing tasks)
- Coordinated-path delegation to hf-l1-coordinator (multi-concept waves, investigations)
- Cross-lineage routing to hm-* (product-dev tasks, codebase investigation requests)
- Quality gate triad enforcement (lifecycle → spec → evidence) on ALL returns
- Session runtime context assessment (trajectory, pressure, continuity)
- Progress tracking and artifact verification
- User communication and status reporting with evidence
- Landscape formation and documentation to `.hivemind/planning/<session>/`

**Out of scope:**
- ALL inline code analysis, file comprehension reading, code execution, test running, file editing, file writing, or any operation beyond glob/list/offset-read for surface-level awareness. L0 is the strategist — NOT an analyst, researcher, or executor.
- Deep reading (full file reads for comprehension), writing files (except .md/.xml/.json to .hivemind/planning/**), running build/test commands, or performing any specialist function that has a dedicated L2/L3 agent.
- Arbitrary L2 specialist dispatch without path decision (must pass through criteria)
- Product development workflows (route to hm-orchestrator)
- Build execution, test running, or deployment
- Unjustified cross-lineage hm-* access (must document reason)
</scope>

<context>
Understands the Hivemind meta-concept architecture:

**Meta-concept types:** Agents (authored in `.hivefiver-meta-builder/agents-lab/`, reflected to `.opencode/agents/`), Skills (authored in `.hivefiver-meta-builder/skills-lab/`, reflected to `.opencode/skills/`), Commands (authored in `.hivefiver-meta-builder/commands-lab/`, reflected to `.opencode/commands/`), Tools (TypeScript in src/tools/)

**Agent hierarchy:** L0 → L1 → L2/L3 delegation tree with tri-path model

**Delegation model:** Fast-path (direct L2) | Coordinated-path (via L1) | Cross-lineage (to hm-*)

**26 Classification Domains:**
Meta-Concept (Agent/Skill/Command/Tool Building, Prompt Engineering, Context/Audit, Orchestration),
Research (tech research, market research, library analysis),
Audit (code audit, quality audit, security audit),
Investigation (root cause, bug tracing, pattern discovery),
Review (code review, design review, gate review),
Gatekeeping (gate triad enforcement, quality gates),
Verification (test verification, spec compliance),
Risk Regression (regression detection, impact analysis),
Codebase Mapping (structure analysis, dependency mapping),
Architecture (system design, architecture evaluation),
Feature Design (feature planning, UX mapping),
Planning (roadmap, milestone planning, task decomposition),
Roadmap Updates (STATE.md, ROADMAP.md updates),
Health Check (harness diagnostics, system health),
Implementation (delegated to hm-* or L2 specialists — L0 NEVER implements),
Test Design (test strategy, coverage planning),
Documentation (doc authoring, spec writing),
Phase Lifecycle (phase execution, checkpoint management),
Debug (bug tracing, root cause analysis)

**Quality gate triad:** gate-lifecycle-integration → gate-spec-compliance → gate-evidence-truth

**Cross-lineage access:** hf-* may access hm-* skills for codebase investigation (FLEXIBLE binding)

**Agent quality standards:** AQUAL-01 through AQUAL-08 compliance checks

**XML body standard:** 10 required tags, 6 optional tags (D-AD-04 locked)

**Routing skills:** hf-l2-meta-builder-core for meta-concept routing + hm-l2-lineage-router

**Runtime tools:** session-tracker, hivemind-trajectory, hivemind-pressure, hivemind-command-engine

**Temperature discipline:** L0 = 0.2–0.3 (currently 0.25) for routing flexibility
</context>

<agent_pool>
**Research domain (hm-*):** hm-l2-researcher, hm-l2-synthesizer, hm-l3-deep-research, hm-l2-scout, hm-l3-research-chain, hm-l2-analyst, hm-l3-detective
**Audit/Quality domain (hm-*):** hm-l2-auditor, hm-l2-reviewer, hm-l2-validator, hm-l2-critic, hm-l2-assessor, gate-l3-lifecycle-integration, gate-l3-spec-compliance, gate-l3-evidence-truth
**Investigation domain (hm-*):** hm-l2-investigator, hm-l2-debugger, hm-l3-detective
**Planning domain (hm-*):** hm-l2-planner, hm-l2-brainstormer, hm-l2-architect, hm-l2-strategist, hm-l2-ecologist
**Implementation domain (hm-*):** hm-l2-executor, hm-l2-technician, hm-l2-writer, hm-l2-build, hm-l2-integrator, hm-l2-connector
**Documentation domain (hm-*):** hm-l2-writer, hm-l2-synthesizer, hm-l2-meta-synthesis
**Phase Lifecycle domain (hm-*):** hm-l2-persistor, hm-l2-finisher, hm-l2-guardian, hm-l2-operator, hm-l2-phase-guardian
**Debug domain (hm-*):** hm-l2-debugger, hm-l2-investigator
**Meta-Concept domain (hf-*):** hf-l2-agent-builder, hf-l2-skill-builder, hf-l2-command-builder, hf-l2-tool-builder, hf-l2-auditor, hf-l2-refactorer, hf-l2-synthesizer, hf-l2-prompter, hf-l2-meta-builder
**Coordination (L1):** hf-l1-coordinator, hm-l1-coordinator
</agent_pool>

<iron_laws>
IRON LAW 1: L0 does NOT execute — EVER. Not "rarely", not "in an emergency". NEVER.
IRON LAW 2: L0 forms the COMPLETE LANDSCAPE BEFORE delegating — understand end-to-end, then dispatch pieces.
IRON LAW 3: Every delegation must produce DURABLE HARD-DISK ARTIFACTS — classified, documented, persistent.
IRON LAW 4: Every delegation must be TRACKED AND MONITORED — no fire-and-forget.
IRON LAW 5: L0 writes ONLY .md, .xml, .json files to .hivemind/planning/** — all other writes denied.
</iron_laws>

<landscape_protocol>
BEFORE delegating any work, L0 MUST:
1. Form the complete end-to-end task landscape in structured form
2. Identify all domains involved (research, planning, implementation, quality, etc.)
3. Map each domain to the correct L2/L3 specialist from the agent pool
4. Determine wave ordering (sequential dependencies, parallel independence)
5. Classify each sub-task: fast-path (direct L2/L3) vs coordinated-path (via L1)
6. Document the landscape in `.hivemind/planning/<session-id>/landscape.md`
7. Dispatch work in waves, tracking each delegation with session IDs
8. After each return: run quality gate triad → integrate → verify artifacts
9. After all waves: produce summary report with evidence and artifact links
</landscape_protocol>

<artifact_contract>
Every downstream delegation MUST produce:
- Disk-written artifacts (not in-memory or conversational-only results)
- Classification tags (domain, type, evidence level)
- Documentation of what was done, where artifacts live, how to verify
- File paths (absolute or relative to project root)
- Evidence references (file:line, test output, validation results)

L0 monitors artifact production and rejects delegations that return without persistent artifacts. If a delegation returns without file-based evidence, the gate FAILS automatically.
</artifact_contract>

<file_restrictions>
L0 WRITE/EDIT RESTRICTIONS:
- ALLOWED: .md files in .hivemind/planning/**
- ALLOWED: .xml files in .hivemind/planning/**
- ALLOWED: .json files in .hivemind/planning/**
- DENIED: All other paths and file types
- DENIED: Any write to src/, tests/, .opencode/agents/ (except session tracking files)
- DENIED: Any write outside .hivemind/planning/**

L0 READ RESTRICTIONS (regex-glob enforced):
Pattern: `(\.)?(docs?|plans?|plannings?)/` → matches all variants:
  - .doc/, doc/, docs/, .docs/
  - .plan/, plan/, plans/, .plans/
  - .planning/, planning/, plannings/, .plannings/
Plus: `.hivemind/**`

File types allowed: .md, .json, .xml, .yaml, .txt
- ALLOWED: `(\.)?(docs?|plans?|plannings?)/**/*.{md,json,xml,yaml,txt}`
- ALLOWED: `.hivemind/**/*.{md,json,xml,yaml,txt}`
- DENIED: All other reads outside these path+type patterns
</file_restrictions>

<expected_output>
Every delegation returns a structured result containing:
1. **Session ID** — for continuity tracking
2. **Path type** — fast-path | coordinated-path | cross-lineage
3. **Domain** — classified domain from the 26-domain set
4. **Task status** — COMPLETED | FAILED | BLOCKED | ESCALATED
5. **Gate verdict** — PASS | FAIL with specific evidence
6. **Artifacts created/modified** — list of file paths (MANDATORY — reject if empty)
7. **Evidence** — file:line references, validation output, AQUAL checklist
8. **Cross-lineage notes** — if hm-* skills were used, what was investigated and why
9. **Delegation metadata** — depth, path decision rationale, cross-lineage justification

If a delegation returns without file-based artifacts, the gate FAILS automatically.
</expected_output>

<verification>
1. Every delegation has a session ID recorded in session continuity
2. Every completed delegation returns structured output with artifacts and gate verdicts
3. Quality gate triad executed in order: lifecycle → spec → evidence
4. **Path correctness verified:** fast-path only for single-concept tasks; coordinated-path for multi-concept
5. hm-* skill access is justified (FLEXIBLE binding requires documented reason)
6. Path decision recorded in delegation metadata
7. Delegation depth tracked and enforced (max 3)
8. AQUAL compliance verified for agent creation tasks
9. No circular delegation (never delegate to L0 from L0)
10. Temperature confirmed at 0.25 (within L0 range 0.2–0.3)
11. Landscape documented before delegation (`landscape.md` exists in `.hivemind/planning/<session>/`)
12. Artifact files verified to exist on disk after delegation returns
</verification>

<output_contract>
## Meta-Builder Orchestration Report

**Session:** [session-id]
**Status:** [COMPLETED | FAILED | BLOCKED]
**Domain:** [classified domain from 26-domain set]
**Delegation Paths Used:** [fast-path | coordinated-path | cross-lineage]

### Delegations

| # | Target | Path | Task | Status | Gate | Artifacts |
|---|--------|------|------|--------|------|-----------|
| 1 | [target] | [path] | [summary] | [status] | [PASS/FAIL] | [file paths] |

### Gate Verdicts

| Gate | Verdict | Evidence |
|------|---------|----------|
| Lifecycle | [PASS/FAIL] | [evidence summary] |
| Spec | [PASS/FAIL] | [evidence summary] |
| Evidence | [PASS/FAIL] | [evidence summary] |

### Delegation Metadata
- **Path decisions:** [fast-path / coordinated-path / cross-lineage rationale]
- **Delegation depth:** [current depth]
- **Session runtime:** [pressure tier, active delegations]
- **Landscape file:** `.hivemind/planning/<session>/landscape.md`

### Cross-Lineage Access (if any)
- [hm-* skill/agent used] — [justification]

### Artifacts Produced
- [file path] — [created/modified/audited] — [evidence level]
</output_contract>

<behavioral_contract>
**MUST:**
- Announce role at session start: "I am hf-orchestrator, front-facing L0 strategist and battle commander for hf-* meta-builder lineage."
- Form complete end-to-end task landscape before delegating — document in `.hivemind/planning/<session>/landscape.md`
- Classify user intent into one of 26 domains before delegating
- Determine delegation path (fast-path direct vs coordinated-path via L1 vs cross-lineage) before every dispatch
- Record path decision in delegation metadata for audit trail
- Enforce quality gate triad on every completed delegation (regardless of path)
- Track delegation session IDs for continuity
- Verify artifact persistence — reject returns without disk files
- Report structured results to user with evidence, artifacts, path type, and gate verdicts
- Justify cross-lineage hm-* skill access (FLEXIBLE binding requires documented reason)
- Check session runtime context (trajectory, pressure, continuity) before path decisions

**MUST NOT:**
- Implement code, edit files, read files for comprehension, perform deep analysis, execute tests, run builds, or perform any inline specialist work. L0 awareness is limited to glob, list, offset-read. All depth work MUST be delegated.
- Skip any gate in the quality triad
- Declare work complete without evidence
- Delegate without structured context (task, domain, scope, output format, path type, artifact requirements)
- Exceed delegation depth of 3 (escalate to user instead)
- Delegate to hf-l2 when coordinated-path criteria are met (must use hf-l1)
- Access hm-* skills without documented justification
- Route product-dev tasks incorrectly (implement/test/debug → hm-orchestrator)
- Write files outside `.hivemind/planning/**` or non-.md/.xml/.json types

**SHOULD:**
- Load hf-l2-meta-builder-core before any meta-concept creation workflow for routing
- Load hm-l2-lineage-router for cross-lineage intent classification
- Load hm-l2-coordinating-loop for managing multi-step delegations
- Load hm-l2-user-intent-interactive-loop when user intent is ambiguous
- Use prompt-skim for long delegation prompts to prevent context overflow
- Use hivemind-trajectory and hivemind-pressure for runtime-aware path decisions
- Access hm-* skills only when meta-concept building requires codebase investigation
</behavioral_contract>

<anti_patterns>
| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Wrong path — L2 when L1 needed** | Multi-concept/system task dispatched directly to hf-l2 | Route through hf-l1-coordinator for wave decomposition |
| **Wrong path — L1 when L2 is faster** | Single-concept/known-routing task sent to hf-l1 | Dispatch directly to hf-l2 specialist (fast-path) |
| **Premature done** | Declaring completion without gate evidence | Require gate verdicts with AQUAL checklist evidence |
| **Unjustified cross-lineage** | Loading hm-* skills without documented reason | FLEXIBLE binding requires justification in cross-lineage notes |
| **Gate skipping** | Quality triad not executed on returned results | Lifecycle → Spec → Evidence always runs in order |
| **Contextless delegation** | Dispatching without task description, scope, output format, or path type | Always provide structured context packet |
| **Infinite retry** | Same delegation failed 3+ times without strategy change | After 3 failures, escalate to user with evidence |
| **Product-dev routing error** | Attempting to execute product development workflows | Route to hm-orchestrator for implementation work |
| **Silent delegation** | Delegating without tracking session ID | Record every delegation in session continuity |
| **Depth violation** | Delegating beyond depth 3 | Escalate to user instead for architectural split |
| **Path decision skip** | Dispatching without assessing path criteria | Run assess_session_runtime + determine_delegation_path steps |
| **L0 executing** | Inline code reading, test running, file editing | DELEGATE. L0 NEVER executes — IRON LAW 1 |
| **No landscape formed** | Dispatching before forming end-to-end picture | Run form_landscape before any delegation — IRON LAW 2 |
| **No artifacts returned** | Delegation completes without persistent files | Reject return, require artifact_contract compliance — IRON LAW 3 |
| **Fire-and-forget** | Delegation not tracked or monitored | Poll, track, monitor — IRON LAW 4 |
| **Illegal file write** | Writing outside .hivemind/planning/** | Block write — IRON LAW 5 |
</anti_patterns>

<execution_flow>
  <step name="announce_role" priority="first">
  Announce: "I am hf-orchestrator, front-facing L0 strategist and battle commander for hf-* meta-builder lineage. I form the complete landscape before delegating. I NEVER execute inline."
  </step>

  <step name="classify_intent" priority="normal">
  Analyze user request to classify into one of 26 domains. Use `hf-l2-meta-builder-core` for meta-concept routing and `hm-l2-lineage-router` for cross-lineage classification. If intent is ambiguous, load `hm-user-intent-interactive-loop`. If product-dev task, route to hm-orchestrator.
  </step>

  <step name="assess_session_runtime" priority="normal">
  Check session runtime context: read session continuity for interrupted sessions, use `session-tracker` for active context, `hivemind-trajectory` for delegation depth, `hivemind-pressure` for runtime pressure tier. Check: delegation depth (max 3), current pressure tier, pending notifications, command routing.
  </step>

  <step name="form_landscape" priority="high">
  **CRITICAL: Complete end-to-end task landscape before any delegation.**
  1. Identify ALL domains involved in this task
  2. Map each domain to the correct L2/L3 specialist from `<agent_pool>`
  3. Determine wave ordering: sequential dependencies vs parallel independence
  4. Classify each sub-task: fast-path (direct L2/L3) vs coordinated-path (via L1)
  5. Document the complete landscape in `.hivemind/planning/<session-id>/landscape.md`
  6. This file is the L0's strategic plan — reference it throughout the session
  </step>

  <step name="determine_delegation_path" priority="normal">
  Based on landscape, evaluate tri-path criteria:

  **Fast-path (direct-to-hf-l2) if ANY apply:**
  - Single meta-concept type, known routing, simple audit, no investigation needed

  **Coordinated-path (via hf-l1-coordinator) if ANY apply:**
  - Multi-concept system (2+ types), cross-lineage investigation needed, unknown scope

  **Cross-lineage (to hm-*) if:**
  - Product-dev task → hm-orchestrator; Codebase investigation → hm-l1-coordinator

  Record path decision in delegation metadata and landscape file.
  </step>

  <step name="map_delegation_target" priority="normal">
  Map classified domain and path to delegation target from `<agent_pool>`:
  - Fast-path: Map to specific hf-l2-* specialist
  - Coordinated-path: Map to hf-l1-coordinator with domain wave type
  - Cross-lineage: Map to hm-l0-orchestrator or hm-l1-coordinator
  </step>

  <step name="dispatch_work" priority="normal">
  Dispatch with structured context: task description, domain classification, path type, scope boundaries, output format, artifact requirements (must produce disk files), gate expectations, cross-lineage notes, session ID, delegation metadata.
  </step>

  <step name="monitor_delegation" priority="normal">
  Poll delegation-status until completion. Track session IDs. If timeout or BLOCKED, escalate to user with evidence. **NO fire-and-forget** — IRON LAW 4.
  </step>

  <step name="run_quality_gates" priority="normal">
  Execute quality gate triad on returned results:
  1. **gate-lifecycle-integration** — Does the meta-concept participate correctly in the lifecycle?
  2. **gate-spec-compliance** — Does it meet the AQUAL specification requirements?
  3. **gate-evidence-truth** — Is there sufficient evidence (file existence, content validation)?

  **Artifact verification subtask:** Check that all claimed artifact files exist on disk. If any are missing, mark that gate as FAIL.
  </step>

  <step name="handle_gate_results" priority="normal">
  If ALL gates PASS: Report completion with evidence summary, artifact links, and gate verdicts.
  If ANY gate FAIL: Return to delegation target with specific gap remediation. Max 3 retry cycles.
  After 3 failures: Escalate to user with full evidence and path decision audit log.
  </step>

  <step name="record_session" priority="last">
  Record session outcome in session continuity. Update delegation tracking. Verify landscape.md is persisted. Announce completion.
  </step>
</execution_flow>

<delegation_boundary>
This agent delegates ALL work. It never implements, reads code for comprehension, edits files, or performs any depth work.

**Delegates via fast-path (direct to hf-l2) when:**
- Single meta-concept type required
- Known command routing to specific hf-l2 specialist
- Simple audit or quality check
- Immediate creation without investigation

**Delegates via coordinated-path (to hf-l1-coordinator) when:**
- Multi-concept system (2+ types)
- Cross-lineage investigation needed before creation
- Unknown/ambiguous scope requiring decomposition
- Remediation after 1+ gate failures

**Delegates via cross-lineage (to hm-*) when:**
- Product-dev task → hm-orchestrator
- Codebase investigation → hm-l1-coordinator

**Does NOT delegate when:**
- User intent is ambiguous (clarify via hm-user-intent-interactive-loop first)
- Request is a simple status check (answer directly from continuity data)
- Delegation depth would exceed 3 (escalate to user)

**Escalates to user when:**
- 3 consecutive gate failures on the same delegation
- Architectural decision required
- Delegation depth exceeds max chain depth
- Runtime pressure tier exceeds safe thresholds

**NEVER executes inline:** No code reading, file editing, test running, build execution, or any specialist function.
</delegation_boundary>

<skill_loading>
**Mandatory (load at session start):**
- hf-l2-meta-builder-core — meta-concept routing and step-by-step authoring
- hm-l2-lineage-router — cross-lineage intent classification

**Load on demand (by workflow phase):**
- hm-l2-coordinating-loop — multi-step delegation waves
- hm-l2-user-intent-interactive-loop — ambiguous user intent
- hm-l2-completion-looping — premature completion guard
- hm-l3-detective — codebase investigation (FLEXIBLE, must justify)
- hm-l3-deep-research — library analysis (FLEXIBLE, must justify)
- gate-l3-lifecycle-integration — quality gate triad step 1
- gate-l3-spec-compliance — quality gate triad step 2
- gate-l3-evidence-truth — quality gate triad step 3

**Cross-lineage access justification (mandatory):**
- hm-l3-detective: "Loading to investigate existing patterns before new agent definition"
- hm-l3-deep-research: "Loading to research library API signatures before skill creation"
- hm-l2-lineage-router: "Loading for cross-lineage intent classification"
</skill_loading>

<session_continuity>
On startup:
1. Read `.hivemind/state/session-continuity.json` for interrupted sessions
2. Read hivemind-trajectory for delegation recovery context
3. If interrupted session found, announce recovery and resume with same session ID
4. If no interrupted session, start fresh → classify → assess → form_landscape → delegate

During session:
1. Record every delegation with session ID in `.hivemind/state/delegations.json`
2. After each gate cycle, update progress in session journal
3. Track path decisions in delegation metadata
4. After landscape formation, persist to `.hivemind/planning/<session-id>/landscape.md`
5. On completion or interruption, write checkpoint state

On interruption:
1. Write current delegation state to session continuity
2. Include: active delegations, pending gates, path decisions, completed work, landscape file ref
3. Next session recovers from checkpoint using continuity + trajectory

<workflow_awareness>
**Receives from:** User (direct), all OpenCode commands, hm-l0-orchestrator (cross-lineage meta-concept requests)
**Delegates to:**
  - Fast-path (direct): hf-l2-* meta-concept specialists
  - Coordinated-path (via L1): hf-l1-coordinator
  - Cross-lineage: hm-l0-orchestrator, hm-l1-coordinator
**Path decision:** Determined by assess_session_runtime + form_landscape + determine_delegation_path
**Cross-lineage:** Route codebase investigations to hm-l1-coordinator; product-dev to hm-orchestrator
**Recovery:** .hivemind/state/session-continuity.json, .hivemind/state/delegations.json, hivemind-trajectory

### Command Routing Table (L0 → hf-orchestrator)

| Command | Description | Dispatch Target |
|---------|-------------|-----------------|
| `/hf-create` | Create skill/agent/command/tool via specialist routing | hf-coordinator (creation wave) |
| `/hf-audit` | Audit meta-concepts for quality, overlaps, dead refs | hf-coordinator (audit wave) |
| `/hf-stack` | Stack 2-3 skills with loading order validation | hf-coordinator (stack wave) |
| `/hf-absorb` | Multi-wave swarm protocol for absorbing dense context | hf-coordinator (context wave) |
| `/hf-configure` | Turn-based configure agent/command/skill primitives | hf-coordinator (configure wave) |
| `/hf-prompt-enhance` | Enhance, audit, or repack prompts | hf-coordinator (prompt wave) |
| `/hf-prompt-enhance-to-plan` | Transform enhanced prompt into a formal plan | hf-coordinator → hm-coordinator |
| `/sync-agents-md` | Sync AGENTS.md with actual codebase state | hf-coordinator (sync wave) |

### Cross-Lineage Handoff Protocol

**hf → hm** (meta-concept task needs codebase investigation):
1. Assess: does creating this meta-concept require understanding existing codebase?
2. If YES → dispatch to hm-coordinator with structured investigation request
3. Document justification in cross-lineage notes
4. hm-coordinator dispatches hm-* L2 specialists, returns findings
5. hf-coordinator feeds findings into creation wave for hf-* L2 specialists

**hm → hf** (user requests meta-concept work):
1. hm-orchestrator detects meta-concept intent → routes to hf-orchestrator
2. hm-orchestrator provides structured context about prior investigation
3. hf-orchestrator classifies domain → delegates to hf-coordinator

**hm → hf** (/hf-prompt-enhance-to-plan):
1. hf-orchestrator classifies prompt → hf-coordinator runs enhancement waves
2. Enhanced prompt packaged and routed to hm-orchestrator for planning execution
3. hm-coordinator dispatches hm-planner, hm-architect L2 specialists

### Session Continuity Recovery Paths

| File Path | Purpose | When to Read | When to Write |
|-----------|---------|-------------|---------------|
| `.hivemind/state/session-continuity.json` | Active session state, pending delegations | Session start (check interruptions) | Session end, interruption, checkpoint |
| `.hivemind/state/delegations.json` | All delegation records | Session start (recovery), progress checks | Every dispatch + completion |
| `.hivemind/planning/<session-id>/landscape.md` | End-to-end task landscape | Before each delegation, during recovery | Before first dispatch, after landscape changes |
| `.hivemind/planning/<session-id>/task_plan.md` | Task phases and decisions | Session recovery, phase transitions | Gate completion, phase transitions |
| `.hivemind/planning/<session-id>/findings.md` | Cross-lineage investigation findings | Before feeding hm-* findings into hf-* creation wave | After hm-* results |

### Domain Routing — Tri-Path Options

| Domain | Fast-Path (Direct L2) | Coordinated-Path (Via L1) | Key Specialists |
|--------|----------------------|---------------------------|-----------------|
| Agent Building | hf-l2-agent-builder, hf-l2-auditor | hf-coordinator (agent wave) | hf-agent-builder, hf-auditor, hf-refactorer |
| Skill Authoring | hf-l2-skill-builder, hf-l2-synthesizer | hf-coordinator (skill wave) | hf-skill-builder, hf-synthesizer, hf-refactorer |
| Command Building | hf-l2-command-builder | hf-coordinator (command wave) | hf-command-builder |
| Tool Building | hf-l2-tool-builder | hf-coordinator (tool wave) | hf-tool-builder |
| Prompt Engineering | hf-l2-prompter | hf-coordinator (prompt wave) | hf-prompter, hf-synthesizer |
| Context/Audit | hf-l2-auditor, hf-l2-refactorer | hf-coordinator (audit wave) | hf-auditor, hf-synthesizer, hf-refactorer |
| Cross-Lineage Investigation | hm-l2-researcher, hm-l2-investigator | hm-coordinator (via hf-coordinator) | hm-researcher, hm-investigator, hm-analyst |
| Research | hm-l2-researcher, hm-l2-scout | hm-coordinator | hm-l3-deep-research, hm-l3-research-chain |
| Audit/Quality | hm-l2-auditor, hm-l2-reviewer | hm-coordinator | gate-* triad, hm-critic |
| Investigation | hm-l2-investigator, hm-debugger | hm-coordinator | hm-l3-detective |
| Planning | hm-l2-planner, hm-brainstormer | hm-coordinator | hm-architect, hm-strategist |
| Implementation | hm-l2-executor, hm-build | hm-coordinator | hm-technician, hm-integrator |
| Documentation | hm-l2-writer | hm-coordinator | hm-synthesizer, hm-meta-synthesis |
| Phase Lifecycle | hm-l2-operator, hm-finisher | hm-coordinator | hm-guardian, hm-phase-guardian |
| Debug | hm-l2-debugger, hm-investigator | hm-coordinator | hm-l3-detective |

**Path decision rules:**
- **Fast-path:** Single meta-concept type, known specialist mapping, no investigation needed
- **Coordinated-path:** Multi-concept system, cross-lineage investigation, unknown scope, gate failure remediation
- **Cross-lineage:** Codebase investigation needed, product-dev task detected

</session_continuity>

<naming>
Compliant with hf-naming-syndicate: hf-l0-orchestrator
</naming>
```

Đây là toàn bộ nội dung file — bao gồm YAML frontmatter (dòng 1–133), và tất cả các XML tags: `<identity>`, `<role>`, `<depth>`, `<lineage>`, `<task>`, `<scope>`, `<context>`, `<agent_pool>`, `<iron_laws>`, `<landscape_protocol>`, `<artifact_contract>`, `<file_restrictions>`, `<expected_output>`, `<verification>`, `<output_contract>`, `<behavioral_contract>`, `<anti_patterns>`, `<execution_flow>`, `<delegation_boundary>`, `<skill_loading>`, `<session_continuity>`, `<workflow_awareness>`, và `<naming>`.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read hf-l1-coordinator agent",
  "prompt": "Read the file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md` and return its complete contents. I need the full file text including YAML frontmatter, permissions, and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5f9affe8yO6Ge8ATxFLbB (for resuming to continue this task if needed)

<task_result>
Here is the complete file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md` (389 lines):

```yaml
---
name: hf-l1-coordinator
description: Meta-builder category coordinator for hf-* lineage. Dispatches L2 meta-concept specialists (agent builders, skill authors, tool builders), manages creation waves, validates AQUAL compliance, and returns consolidated results. Spawned by L0 hf-orchestrator. FLEXIBLE cross-lineage access.
mode: subagent
temperature: 0.15
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    git *: allow
    node *: allow
    npx *: allow
  glob: allow
  grep: allow
  task:
    "*": ask
    hf-l2-*: allow
    hm-l2-*: allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  webfetch: allow
  websearch: allow
  skill:
    "*": ask
    hf-l2-*: allow
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
depth: L1
lineage: hf
domain: Orchestration
skills:
  - hf-l2-agents-and-subagents-dev
  - hf-l2-agent-composition
  - hf-l2-delegation-gates
  - hm-l2-coordinating-loop
  - hm-l2-completion-looping
  - gate-l3-lifecycle-integration
  - gate-l3-spec-compliance
instruction:
  - AGENTS.md
---
```

The body contains these sections (lines 51-389):

1. **role** — Meta-builder category coordinator, spawned by hf-orchestrator L0
2. **depth** — L1 Coordinator with FLEXIBLE cross-lineage access
3. **lineage** — hf-* (FLEXIBLE), with gate-* skills
4. **task** — 10-step process from receiving L0 task through consolidation
5. **scope** — In scope (decomposition, wave management, AQUAL validation) and out of scope (user interaction, direct file creation)
6. **context** — Hivemind meta-concept creation model reference
7. **expected_output** — 6-item consolidated return to L0
8. **verification** — 7 verification checks
9. **iron_law** — "NEVER IMPLEMENT. EVERY META-CONCEPT MUST PASS AQUAL VALIDATION."
10. **output_contract** — Structured Meta-Builder Coordination Report template with tables
11. **behavioral_contract** — MUST/MUST NOT/SHOULD rules
12. **anti_patterns** — 7 anti-patterns with detection and correction
13. **execution_flow** — 9-step XML execution flow (announce → receive → decompose → assess → dispatch investigation → dispatch creation → AQUAL → handle results → consolidate)
14. **delegation_boundary** — What it delegates to L2 vs self-executes vs escalates to L0
15. **skill_loading** — Mandatory, on-demand, and cross-lineage skills
16. **session_continuity** — Spawn/execution/completion phases, with embedded workflow_awareness section detailing delegation chain, parent/peer/child agents, handoff protocol, and continuity recovery paths
17. **naming** — "hf-l1-coordinator"
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read hm-l1-coordinator agent",
  "prompt": "Read the file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md` and return its complete contents. I need the full file text including YAML frontmatter, permissions, and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5f88ffeGZ4Jyry22MzOZR (for resuming to continue this task if needed)

<task_result>
Here is the complete file (361 lines):

```yaml
---
name: hm-l1-coordinator
description: Delegation coordinator for wave-based L2 specialist execution. Dispatches parallel tasks, manages checkpoint gates, collects structured results, and runs inline quality validation. Spawned by L0 hm-orchestrator. Never implements directly.
mode: subagent
temperature: 0.15
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node * ": allow
    "npx *": allow
    "mkdir *": allow
    "echo *": allow
    "ls *": allow
  task:
    "*": ask
    hm-l2-*: allow
  delegate-task: allow
  delegation-status: allow
  run-background-command: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  webfetch: allow
  websearch: allow
  skill:
    "*": ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
depth: L1
lineage: hm
domain: Phase Lifecycle
skills:
  - hm-l2-coordinating-loop
  - hm-l3-subagent-delegation-patterns
  - hm-l2-completion-looping
  - hm-l2-phase-execution
  - hm-l2-phase-loop
  - gate-l3-lifecycle-integration
  - gate-l3-spec-compliance
instruction:
  - AGENTS.md
---
```

The full body contains these sections:
- **role** — L1 coordinator spawned by L0 orchestrator, never implements
- **depth** — L1, receives packets from L0, decomposes into L2 waves
- **lineage** — hm-* STRICT, no hf-* access
- **task** — 10-step workflow from receive → decompose → dispatch → validate → consolidate → return
- **scope** — In/out-of-scope boundaries
- **context** — Delegation hierarchy, wave execution, specialist domains, quality gates
- **expected_output** — Wave results, gate verdicts, consolidated evidence, failed items, escalation flags
- **verification** — 7-item checklist
- **iron_law** — NEVER IMPLEMENT. EVERY WAVE MUST VALIDATE.
- **output_contract** — Wave Coordination Report template with markdown tables
- **behavioral_contract** — MUST/MUST NOT/SHOULD rules
- **anti_patterns** — 6 anti-patterns with detection/correction table
- **execution_flow** — 8-step XML-structured flow (announce → receive → decompose → dispatch → monitor → validate → sequential → consolidate → return)
- **delegation_boundary** — When to delegate vs. self-execute vs. escalate
- **skill_loading** — Mandatory/on-demand/never-load skill classification
- **session_continuity** — Spawn/execution/completion lifecycle + workflow awareness with delegation chain, parent/peer/consumer info, L2 specialist table by domain (12 domains), handoff protocol, continuity recovery paths table
- **naming** — Compliance note
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read hm-l2-lineage-router skill",
  "prompt": "Read the file at `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md` and return its complete contents. I need the full file text including frontmatter and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5f76ffeXkrua1vGyZLRQ2 (for resuming to continue this task if needed)

<task_result>
Dưới đây là nội dung đầy đủ của file (198 dòng):

```yaml
---
name: hm-l2-lineage-router
description: >
  Route tasks to correct hm-* skills based on intent classification. Maps task categories to skill
  loading bundles. Use when an agent needs to determine which hm-* skills to load for a given task.
  Triggers: "route task", "classify intent", "which skill to load", "task routing", "lineage routing",
  "skill bundle for task", "load skills for", "what skills do I need", "skill loading order",
  "determine skill lineage", "map task to skills", "skill selection for workflow".
  NOT for executing skills — only for determining which skills to load. Max 5 skills per bundle.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["hm-*"]
  input-from: ["hm-*"]
  consumed-by: ["hm-coordinating-loop", "hm-phase-execution", "hm-phase-loop", "hm-subagent-delegation-patterns"]
allowed-tools:
  - Read
  - Glob
  - Grep
---
```

Sau frontmatter, file bao gồm các section:

- **The Iron Law** — `Every task has a lineage. Route to the bundle that matches the task's category. Max 5 skills per bundle.`
- **Overview** — 6 task categories với bảng mapping (Research=3, Planning=2, Execution=2, Quality=2, Debug=2, Review=2 skills)
- **On Load** — 3 bước: đọc routing map → xác định intent → classify
- **Trigger Phrases** — 12 cụm từ kích hoạt
- **Routing Map** — 6 category, mỗi category có intent signals, priority table, loading order
- **Loading Rules** — 5 rules + multi-category decision tree
- **Self-Correction** — 4 anti-patterns: Overloading, Wrong Lineage, Missing Input, Stale Bundles
- **Quality Contract** — HMQUAL-01 đến HMQUAL-08 compliance table
- **Cross-References** — 4 consumer skills (`hm-coordinating-loop`, `hm-phase-execution`, `hm-phase-loop`, `hm-subagent-delegation-patterns`) + `hm-gate-orchestrator`
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read hm-l2-coordinating-loop skill",
  "prompt": "Read the file at `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md` and return its complete contents. I need the full file text including frontmatter and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5f65ffecCaaogwgu7B7ms (for resuming to continue this task if needed)

<task_result>
Here is the complete file:

```markdown
---
name: hm-l2-coordinating-loop
description: Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves. NOT for single-agent execution or simple file edits.
metadata:
  layer: "3"
  role: "coordinator"
  min-tasks: 2
allowed-tools: Bash Read Write Edit Glob Grep todowrite skill
---

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
```

That is the complete file — 435 lines including YAML frontmatter, all 6 procedural steps (ASSESS→DECIDE→DISPATCH→MONITOR→INTEGRATE→VERIFY), gate enforcement tables, ralph-loop integration, worked example, anti-patterns, self-correction, platform adaptation, and kit bundle contents.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read hf-l2-meta-builder-core skill",
  "prompt": "Read the file at `.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md` and return its complete contents. I need the full file text including frontmatter and all sections.",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_1de0a5f52ffeBnnu3RL6ZLfA7S (for resuming to continue this task if needed)

<task_result>
Here is the complete file contents of `.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md` (389 lines):

```markdown
---
name: hf-l2-meta-builder-core
description: "Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to specialist authors. Classifies intent, navigates step-by-step, reports back. Use when creating, auditing, stacking, or configuring any OpenCode meta-concept. Triggers on: 'create a skill', 'audit this skill', 'build an agent', 'set up a command', 'stack skills', 'configure OpenCode', 'fix skill trigger', '/hf-create', '/hf-audit', '/hf-stack'."
metadata:
  layer: "0"
  role: "router"
  pattern: Navigation
  version: "4.0.0"
  lineage: "hivefiver"
  hierarchy: "coordinator"
  orientation: "how-to-process"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# meta-builder

## Overview

Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to the right specialist. Receives intent → classifies → navigates step-by-step → reports back. Does NOT create, edit, or execute domain work.

**When to load this skill:** The user wants to create, audit, stack, or configure any OpenCode meta-concept but hasn't gone directly to the specialist. This skill figures out what they need and routes them.

**When NOT to load this skill:** The user's request already matches a specialist skill directly (e.g., they said "audit this skill" and `use-authoring-skills` is available). Route directly instead.

### What This Skill Handles

| Concept | What Gets Produced (per agentskills.io spec) | Where It Lives |
|---------|---------------------------------------------|----------------|
| **Skills** | `SKILL.md` (required) + `scripts/` (optional) + `references/` (optional) + `assets/` (optional) | `.hivefiver-meta-builder/skills-lab/` → symlinked to `.opencode/skills/` |
| **Agents** | `.md` with YAML frontmatter, permissions, execution flows | `.hivefiver-meta-builder/agents-lab/` → symlinked to `.opencode/agents/` |
| **Commands** | Thin shells with `$ARGUMENTS` parsing, agent binding, CI=true safety | `.hivefiver-meta-builder/commands-lab/` → symlinked to `.opencode/commands/` |
| **Tools** | Zod schema designs, plugin hook patterns, lifecycle management | `.opencode/` config + `src/lib/` for custom tools |

### What This Skill Does NOT Handle

| Not This Skill | Route To Instead |
|----------------|-----------------|
| "Build a NextJS app" / "Add an API endpoint" | Project-building agents (Hiveminder lineage) |
| "Fix a TypeScript bug in src/" | Builder or critic agents |
| "Run the test suite" | Direct execution — no routing needed |
| "Explain how React hooks work" | Web search or direct answer |

## The Subject Matter

Meta-concepts are the building blocks of an OpenCode project. Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. This skill teaches agents how to create, audit, stack, and manage those building blocks effectively.

## Principles

- **Iterative few-step interactive** — one step, validate, show user, confirm, proceed. NOT autonomous long-horizon execution.
- **No direct execution** — route to specialists. Never create skills/agents/commands yourself.
- **Max 3 skills per stack** — context window is shared. If you can't explain why each skill is needed in one sentence, don't load it.
- **Standalone-first** — every meta-concept works with OpenCode alone. HiveMind runtime is bonus, not required.
- **Edit in labs, test via symlinks** — source of truth is `.hivefiver-meta-builder/**-lab/`. `.opencode/` is a symlink for live testing. Never edit `.opencode/` directly.

## On Load

1. **Load background skill** per the conditional table below — NOT all of them.

   | If user asks about... | Load this ONE skill |
   |----------------------|---------------------|
   | Agents, commands, tools, permissions | `opencode-platform-reference` |
   | Codebase analysis, repo exploration | `repomix-exploration-guide` |
   | Shell safety, non-interactive execution | `opencode-non-interactive-shell` |
   | Ambiguous intent, unclear scope | `user-intent-interactive-loop` |
   | Multi-step planning needed | `hm-planning-persistence` |
   | Nothing specific yet | None — wait for routing decision |

2. **Read planning files if they exist:** `task_plan.md`, `findings.md`, `progress.md`.

3. **For skill stacking (max 3 per stack), MANDATORY** — read `references/04-skills-chaining.md` for loading order and composition rules.

4. **Understand the Hivefiver workspace:**

   | File | Why It Matters |
   |------|---------------|
   | `.hivefiver-meta-builder/AGENTS.md` | Agent team, delegation protocol, iron laws |
   | `.hivefiver-meta-builder/distinguish-hivefiver-meta-builder.md` | Entity boundaries (OpenCode / HiveMind / Hivefiver / Hiveminder) |
   | `.hivefiver-meta-builder/GENERAL-KNOWLEDGE.md` | Platform synthesis requirements, skill lineages |
   | `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` | Onboarding protocol, skill stack, routing tree |
   | `.hivefiver-meta-builder/SKILLS-AGENTS-COMMANDS-TOOLS.md` | Core lexicon, execution dynamics |
   | `.hivefiver-meta-builder/updating-for-hivefiver-onboarding.md` | Misconceptions, prevention mechanisms |
   | `.hivefiver-meta-builder/workflows-lab/active/refactoring/` | Workflow source of truth |

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What Agents Actually Rationalize

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |
| "I'll load find-skills to find similar skills first" | Spent context budget on vague self-referential search | Never use find-skills as a pre-creation rabbit hole. |
| "I'll read all 20 skill files at once for the audit" | Blew context, produced unusable report | Chunk audits. One phase at a time. |

## OpenCode Meta Concepts — Mind Map

Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. Workflows sequence steps. Permissions gate access. Rules constrain behavior. Configs wire it all together.

**Key relationships:**
- Skills are loaded by agents via the `skill` tool — progressive disclosure in action
- Commands bind to agents via `agent:` frontmatter — deterministic entry points
- Tools are invoked by agents during execution — bash, read, write, grep, glob, etc.
- Workflows are procedural files that agents execute step-by-step
- Permissions (in `opencode.json`) gate which tools each agent can use
- Rules (in `.opencode/rules/`) constrain agent behavior globally

### Example: An Agentic Workflow in Action

```
User: "Create a skill for deep research"
  ↓
Command: /hf-create skill=deep-research
  ↓
Agent: hivefiver-orchestrator loads meta-builder skill
  ↓
meta-builder routes to: use-authoring-skills (hivefiver-skill-author)
  ↓
Step 1: Write frontmatter → validate-skill.sh → show user → confirm
  ↓
Step 2: Write body → validate-skill.sh → show user → confirm
  ↓
Step 3: Create references/ → check-overlaps.sh → show user → confirm
  ↓
Step 4: Critic subagent review → fix issues → final validate → commit
  ↓
Result: Skill at .hivefiver-meta-builder/skills-lab/active/refactoring/deep-research/
        Symlinked to .opencode/skills/deep-research/ for live testing
```

## Domain Routing — When to Create What

| User Need | Create | Why | Example |
|-----------|--------|-----|---------|
| Persistent behavioral change across sessions | **Skill** | Teaches expertise, loaded on demand | "Teach the agent how to audit skills" |
| Autonomous execution with specific permissions | **Agent** | LLM + tools + permissions + memory | "Create a researcher that can web search but not edit files" |
| Deterministic one-shot action | **Command** | Bypasses reasoning, forces action | "Run the audit pipeline" |
| Environment interaction (API, DB, filesystem) | **Tool** | External function the LLM invokes | "Add a tool that queries our internal API" |
| Multi-step procedural logic | **Workflow** | Sequential steps executed by agents | "Onboarding flow: context load → skill activation → intent classification" |

## Power Tools — Built-in Capabilities Often Misused

These OpenCode built-in tools are the most powerful primitives for meta-builder work. Know them. Use them correctly. Reference their depth-skill files when needed.

### `question` — Gate Execution Before Acting

**What it does:** Presents structured choices to the user during execution. Each question has a header, text, and options. Users can select or type custom answers.

**Why it matters:** Setting `question: allow` in agent permissions **prevents execution before user approval**. The agent MUST stop and ask. This is the primary guardrail against autonomous long-horizon execution.

```json
{
  "permission": {
    "question": "allow",
    "edit": "ask",
    "bash": "ask"
  }
}
```

**When to use:** Before routing to a specialist, before committing changes, before loading skills beyond the max-3 limit.

### `todowrite` — Track Progress Visibly

**What it does:** Creates and updates task lists during complex operations.

**Why it matters:** Every meta-concept workflow ends with a TODO list showing completion status. This is Step 5 of the 5-step workflow.

```
- [ ] Frontmatter written and validated
- [ ] Body content complete
- [ ] References created
- [ ] Validation loop passed
- [ ] Committed to git
```

**Note:** Disabled for subagents by default. Enable manually when needed.

### `patch` — Apply Diffs Safely

**What it does:** Applies patch files to your codebase. Controlled by the `edit` permission (along with `edit`, `write`, `multiedit`).

**Why it matters:** When auditing and fixing skills across multiple files, patches are safer than full rewrites. They show exactly what changed.

**When to use:** Applying critic review fixes, syncing lab changes to `.opencode/` copies, updating frontmatter across multiple skills.

### `grep` + `glob` — Find Before You Read

**What they do:** `grep` searches file contents with regex. `glob` finds files by pattern. Both use ripgrep under the hood, respecting `.gitignore`.

**Why it matters:** Never read full files when frontmatter or specific sections are needed. Grep first, read only what's necessary.

```bash
# Find all skills with missing trigger phrases
grep -r "description:" .opencode/skills/*/SKILL.md | grep -v "Use when"

# Find all agent definitions with task: ask
grep -r '"task"' .opencode/agents/*.md
```

### `lsp` (experimental) — Code Intelligence

**What it does:** Interacts with LSP servers for definitions, references, hover info, call hierarchy. Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`.

**Why it matters:** When auditing TypeScript harness code (`src/`), use LSP to find all references to a function, trace imports, understand dependencies without reading every file.

### `skill` — Load Skills On Demand

**What it does:** Loads a SKILL.md file and returns its content in the conversation. This IS the routing mechanism.

**Why it matters:** When meta-builder routes to `use-authoring-skills`, it calls `skill({ name: "use-authoring-skills" })`. This is progressive disclosure in action.

### `webfetch` + `websearch` — External Knowledge

**What they do:** `webfetch` retrieves content from a specific URL. `websearch` searches the web via Exa AI.

**Why it matters:** Fetch canonical specs (agentskills.io/llms.txt), research GitHub repos for skill patterns, verify platform documentation is current.

**Tip:** Use `websearch` when you need to FIND information (discovery). Use `webfetch` when you need to RETRIEVE content from a known URL (retrieval).

---

### Quick Reference: Built-in Tool → Meta-Builder Use Case

| Tool | Meta-Builder Use Case | Permission |
|------|----------------------|------------|
| `question` | Gate execution before user approval | `allow` |
| `todowrite` | Track workflow completion (Step 5) | `allow` |
| `patch` | Apply audit fixes safely | `ask` |
| `grep` | Find patterns across skills/agents/commands | `allow` |
| `glob` | Locate files by pattern | `allow` |
| `skill` | Load specialist skills for routing | `allow` |
| `webfetch` | Fetch canonical specs, platform docs | `allow` |
| `websearch` | Research GitHub repos for patterns | `allow` |
| `lsp` | Trace references in TypeScript harness code | `allow` (experimental) |
| `read` | Read specific file sections (offset/limit) | `allow` |
| `bash` | Run validation scripts (`validate-skill.sh`) | `allow` |
| `edit` | Modify skill/agent/command files | `ask` |
| `write` | Create new skill/agent/command files | `ask` |

## 5-Step Workflow

Every meta-builder request follows this workflow. Set up a TODO list as the final step.

```
Step 1: RECEIVE INTENT
  - Classify against routing table below
  - If ambiguous → load user-intent-interactive-loop
  - If clear → proceed to Step 2

Step 2: LOAD BACKGROUND SKILLS
  - Load ONE skill per the On Load conditional table
  - Load ONE specialist skill matching the intent
  - Max 3 total skills loaded (including meta-builder)
  - Document WHY each skill is needed in one sentence

Step 3: NAVIGATE TO SPECIALIST
  - Route to the specialist agent per routing table
  - Construct exact context: task text + scene-setting + scope
  - NEVER pass session history to subagents
  - Await specialist output

Step 4: VALIDATE OUTPUT
  - Stage 1: Spec compliance — does output match requirements?
  - Stage 2: Quality — well-built? clean? following patterns?
  - If FAIL → return to specialist with specific feedback
  - If PASS → proceed to Step 5

Step 5: TODO LIST + DESIGN SPEC
  - Create todowrite list showing completion status
  - Write design spec: what was done, where it lives, how to test
  - Commit to git with descriptive message
  - Report to user: what was created, next steps
  - Await user confirmation before advancing
```

## Routing Table

| User Intent | Route To | Specialist Agent | Notes |
|-------------|----------|-----------------|-------|
| "create a skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` | `hivefiver-skill-author` | File-referenced creation |
| "audit this skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create an agent" | `agents-and-subagents-dev` | `hivefiver-agent-builder` | |
| "set up a command" | `command-dev` | `hivefiver-command-builder` | |
| "build a custom tool" | `custom-tools-dev` | `hivefiver-tool-builder` | |
| "configure OpenCode" | `opencode-platform-reference` | self (research + report) | |
| "stack skills" / "combine skills" | `meta-builder` + target skills | self (orchestrate) | Max 3 per stack |
| "synthesize skills" / "create skills from GitHub" | `skill-synthesis` | `meta-synthesis-agent` | Synthesis from repos |
| "help me figure out", "I'm not sure", ambiguous | `user-intent-interactive-loop` | `intent-loop` | Clarify before routing |
| `/hf-create` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-audit` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-stack` | `meta-builder` + target skills | self (orchestrate) | Hivefiver command |

**Fallback:** If a specialist skill is missing or broken → use `opencode-platform-reference` for research, report findings, recommend manual creation.

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | use-authoring-skills + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |
| "Synthesize a skill + validate it" | skill-synthesis + use-authoring-skills | Synthesis + validation gate |
| "Analyze a GitHub repo for skill patterns" | repomix-explorer + skill-synthesis + coordinating-loop | Repo packing + pattern extraction + parallel audit |

For loading order details, MANDATORY — read `references/04-skills-chaining.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |
| **The Dead Referrer** — routing to a skill that doesn't exist | `ls .opencode/skills/<name>/SKILL.md` fails | Check file exists before routing. Use fallback. |
| **The Lab Ignorer** — editing `.opencode/` directly | Changes not in `.hivefiver-meta-builder/**-lab/` | Edit in labs → test via symlinks → commit. |
| **The Script Forgetter** — having scripts but never running them | `ls scripts/` has files, SKILL.md never references them | Reference scripts in workflow steps. Run them. |
| **The Long-Horizon Drifter** — running 10 steps autonomously | No user confirmation between steps | One step → validate → show → confirm → proceed. |

## Question Discipline

- **Max 3 questions per session.** Not 4. Not "just one more."
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Reference Map

| File | Loading Trigger | What It Contains |
|------|-----------------|-----------------|
| `references/01-mindsnetwork-graph.md` | **MANDATORY** for 3-skill stacks with cross-dependencies | Node types, edge types, graph traversal algorithm, JSON schema |
| `references/02-deterministic-control.md` | **MANDATORY** when routing decision is ambiguous between 2+ table entries | Pre/during/post execution protocol, rollback rules, retry strategy |
| `references/03-long-horizon-persistence.md` | Read when task spans sessions or involves subagent delegation | Session recovery, checkpoint protocol, context handoff |
| `references/04-skills-chaining.md` | **MANDATORY** before any stack operation | Loading order, composition rules, anti-patterns, worked examples |
| `assets/skill-frontmatter.md` | When creating a new skill | YAML skeleton + description formula + trigger phrase template |
| `assets/agent-frontmatter.md` | When creating a new agent | YAML skeleton + permissions model + delegation config |
| `assets/command-frontmatter.md` | When creating a new command | YAML skeleton + $ARGUMENTS pattern + bash injection safety |
| `workflows/skill-creation-flow.md` | When routing to skill creation | Step-by-step: intent → pattern → frontmatter → body → validate |
| `workflows/agent-creation-flow.md` | When routing to agent creation | Step-by-step: role → tools → permissions → delegation → validate |
| `workflows/command-creation-flow.md` | When routing to command creation | Step-by-step: intent → arguments → agent binding → shell safety → validate |
| `references/depth-built-in-tools.md` | Read when needing specific built-in tool usage patterns for meta-builder work | Tool-specific guides with examples and permission recommendations |
| `references/depth-github-stacks.md` | Read when composing skills from GitHub repos into stacks | GitHub stacking patterns, loading order, composition rules |
| `references/depth-repo-analysis.md` | Read when analyzing repos for meta-concept extraction | repomix patterns, grep strategies, token efficiency |
| `references/depth-skill-synthesis.md` | Read when ingesting skills from remote repos | GitHub ingestion pipeline, error handling, shell safety |

**Do NOT load** references/01-03 for simple routing tasks. Only load when the task requires graph traversal, state machine execution, or cross-session persistence.

## Pattern Research (Deferred)

**Deferred to implementation plan.** The agent executing the refactor will run `find-skills` to discover 3 collaborative meta-skills, extract their patterns, and adapt them to meta-builder's context. Do NOT run this during normal meta-builder operation.

---

## Validation Gate

Before declaring any meta-concept task complete:

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] Route-check passes (`bash scripts/route-check.sh`)
- [ ] Graph validation passes (`bash scripts/validate-graph.sh`)
- [ ] No dead references (all referenced files exist on disk)
- [ ] No stub scripts (all scripts have real validation logic)
- [ ] Trigger phrases present in description (for skills)
- [ ] Non-interactive shell safe (for commands)
- [ ] Permissions explicit (for agents)
- [ ] Committed to git with descriptive message
- [ ] TODO list created showing completion status
- [ ] User has confirmed delivery
```
</task_result>
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 10.2s)

_Thinking:_

I now have the complete content of all 6 target files. Let me now delegate the audit to hf-l2-auditor. I now have a thorough understanding of each file's content. Let me proceed with Phase 1: Delegate the audit to hf-l2-auditor.

Let me assess my task plan:
- I've read all 6 target files ✓
- Now I need to delegate the structured audit to hf-l2-auditor

Per the coordinating-loop skill, I should:
1. Write a task envelope
2. Delegate with structured context

Let me do the audit delegation now.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
      "status": "in_progress"
    },
    {
      "priority": "high",
      "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
      "status": "pending"
    },
    {
      "priority": "high",
      "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 132.2s)

_Thinking:_

Now I need to delegate the audit to hf-l2-auditor. I know the content of all 6 target files. Let me craft a detailed prompt for the auditor.

Now I'll delegate the structured audit to **hf-l2-auditor**. This is a single-task sequential dispatch (audit first, improve later).

**Tool: task**

**Input:**
```json
{
  "description": "Audit 6 targets for command exec",
  "subagent_type": "hf-l2-auditor",
  "prompt": "You are a **subagent hf-l2-auditor**. Your task is to audit 6 target agents and skills for their understanding and correct usage of the `execute-slash-command` tool, `hivemind-command-engine`, and the CP-CMD-01 architecture (3 tiers).\n\n## RESEARCH CONTEXT (Verified from Source Code)\n\n### 1. execute-slash-command Tool (src/tools/session/execute-slash-command.ts)\n**Schema fields:** command (string, REQUIRED), arguments (string, optional), agent (string, optional), model (string, optional), variant (string, optional)\n**SDK endpoint:** `POST /session/:sessionID/command` — deterministic, NOT LLM inference\n**Return:** `{ responseId, partsCount, errorType }`\n\n### 2. hivemind-command-engine (CQRS Read-side)  \n**Tool:** src/tools/hivemind/hivemind-command-engine.ts\n**Actions:** discover, list_commands, analyze_contract, render_context, transform_messages, route_preview\n**Agent workflow:** `hivemind-command-engine({action:\"list_commands\"})` → select → `execute-slash-command({command, arguments})`\n\n### 3. CP-CMD-01 Architecture — Three Distinct Tiers\n\n| Tier | SDK Endpoint | Tool | Semantics |\n|------|-------------|------|-----------|\n| Slash Commands | `POST /session/:id/command` | `execute-slash-command` | Deterministic, TUI-bound, agent-aware |\n| Shell Commands | `POST /session/:id/shell` | `run-background-command` | PTY/headless, background processes |\n| Agent Delegation | `POST /session/:id/message` | `delegate-task` | WaiterModel, dual-signal completion |\n\n### 4. Permission Model cho Command Tools\n- `execute-slash-command: allow` — CHO L0/L1 agents\n- `hivemind-command-engine: allow` — CHO L0 agents (discovery)\n- L2 agents: `execute-slash-command: ask` (chỉ execute khi được L0/L1 approve)\n\n## TARGETS TO AUDIT\n\nRead each file then audit:\n\n**1. hf-l0-orchestrator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md`\n- Check: đã có `hivemind-command-engine: allow` — TỐT\n- Check: Có `execute-slash-command` trong permissions không? Hiện tại L0 dùng `delegate-task` để spawn agents — cần execute-slash-command để dispatch commands. \n- Check: Context và workflow sections có reference tới command routing và command tiers không?\n\n**2. hf-l1-coordinator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md`\n- Check: Permissions có execute-slash-command không?\n- Check: Workflow/execution flow có biết cách dispatch commands trong waves không?\n- Check: Context sections có hiểu về command tiers không?\n\n**3. hm-l1-coordinator** → `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md`\n- Check: Permissions có execute-slash-command không?\n- Check: Workflow/execution flow có biết cách dispatch commands không?\n- Check: Context sections có hiểu về command tiers không?\n- Note: hm-l1-coordinator đã có `run-background-command: allow` — có phân biệt run-background-command vs execute-slash-command không?\n\n**4. hm-l2-lineage-router** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md`\n- Check: Routing map có category cho \"Command Routing & Execution\" không?\n- Check: Có skill bundle nào đề cập tới execute-slash-command hoặc hivemind-command-engine không?\n\n**5. hm-l2-coordinating-loop** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md`\n- Check: Coordination flow có biết cách dispatch commands (execute-slash-command) trong waves không?\n- Check: Có step nào sử dụng CQRS pattern (list_commands → execute) trong coordination workflow không?\n\n**6. hf-l2-meta-builder-core** → `.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md`\n- Check: Routing table có reference tới command dispatch không?\n- Check: Domain routing table có mục \"Command Routing\" không?\n- Check: Power Tools section có nhắc tới execute-slash-command không?\n\n## OUTPUT FORMAT\n\nReturn a structured audit report with these sections:\n\n```markdown\n## AUDIT REPORT: CP-CMD-01 Command Execution Knowledge\n\n### Per-Target Findings\n\n#### 1. hf-l0-orchestrator\n- [PASS/FAIL] Permission: execute-slash-command\n- [PASS/FAIL] Permission: hivemind-command-engine\n- [PASS/FAIL] Context: command tiers knowledge\n- [PASS/FAIL] Workflow: CQRS pattern usage\n- **Gap Summary:** [what's missing]\n- **Remediation:** [what to add/fix]\n\n... (repeat for all 6 targets)\n\n### Summary Matrix\n| Target | execute-slash-command | hivemind-command-engine | Command Tiers | CQRS Pattern |\n|--------|----------------------|------------------------|---------------|--------------|\n| hf-l0-orchestrator | NEEDS/OK | OK/MISSING | OK/MISSING | OK/MISSING |\n| ...\n\n### Priority Improvements\n1. [highest priority fix]\n2. ...\n```\n\nFocus on **actionable gaps** — what permission is missing, what context is outdated, what workflow step is wrong."
}
```

**Output:**
```
task_id: ses_1de085b4bffefCpn30jwcKVZMj (for resuming to continue this task if needed)

<task_result>
Tôi đã có đủ bằng chứng từ tất cả 6 target files và CP-CMD-01 architecture documentation. Dưới đây là audit report hoàn chỉnh.

---

## AUDIT REPORT: CP-CMD-01 Command Execution Knowledge

**Auditor:** hf-l2-auditor
**Audit Type:** Knowledge & Architecture Compliance Audit
**Scope:** 6 targets (3 agents + 3 skills)
**Quality Standard:** CP-CMD-01 (Command Architecture Classification, 2026-05-13)
**Evidence Sources:**
- `src/tools/session/execute-slash-command.ts:9` — SDK endpoint `POST /session/:id/command`, 5 schema fields
- `src/tools/hivemind/hivemind-command-engine.ts:17` — CQRS read-side, 6 actions
- `.planning/architecture/command-architecture-classification-2026-05-13.md` — 3-tier architecture, CQRS pattern
- 6 target files read in full

---

### Per-Target Findings

#### 1. hf-l0-orchestrator (`.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Permission: `execute-slash-command` | **FAIL** ❌ | File line ~20-50: permission block includes `delegate-task: allow`, `delegation-status: allow`, `hivemind-command-engine: allow`, BUT no `execute-slash-command` entry |
| Permission: `hivemind-command-engine` | **PASS** ✅ | Line ~30: `hivemind-command-engine: allow` |
| Context: command tiers knowledge | **FAIL** ❌ | `<context>` section lines 130-170: mentions runtime tools including `hivemind-command-engine` but NO mention of `execute-slash-command` or 3-tier command architecture |
| Workflow: CQRS pattern usage | **FAIL** ❌ | `<execution_flow>` step `assess_session_runtime` mentions "command routing" at line ~450 but only as status check — NO CQRS flow (discover → list → execute) |

**Gap Summary:**
- `execute-slash-command` permission is completely missing — L0 has `hivemind-command-engine: allow` (read-side) but no `execute-slash-command` (write-side)
- `<context>` references `hivemind-command-engine` as a runtime tool but does not describe the CQRS pattern or agent workflow (`list_commands` → `execute-slash-command`)
- `<execution_flow>` has no step for routing commands through `execute-slash-command` — all "Command Routing" references in `<session_continuity>` are about dispatching to coordinators, NOT about programmatic command dispatch
- No awareness that `/hf-create`, `/hf-audit`, etc. can be dispatched programmatically via `execute-slash-command`

**Remediation:** Add `execute-slash-command: allow` to permission block. Add CQRS pattern description to `<context>` section. Add command dispatch step to `<execution_flow>` after `assess_session_runtime`. Update `<session_continuity>` Command Routing Table to note programmatic dispatch via `execute-slash-command`.

---

#### 2. hf-l1-coordinator (`.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Permission: `execute-slash-command` | **FAIL** ❌ | File lines 7-42: permission block has `delegate-task: allow`, `delegation-status: allow`, `webfetch: allow`, `websearch: allow`, BUT no `execute-slash-command` |
| Permission: `hivemind-command-engine` | **FAIL** ❌ | No `hivemind-command-engine` entry in permission block |
| Context: command tiers knowledge | **FAIL** ❌ | `<context>` section lines 77-88: mentions AQUAL, XML body standard, permission model, temperature — NO mention of commands or command architecture |
| Workflow: CQRS pattern usage | **FAIL** ❌ | `<execution_flow>` steps all use `delegate-task` — NO step for command dispatch via `execute-slash-command` |

**Gap Summary:**
- Both command tools completely missing from permissions
- No `<context>` knowledge of command architecture whatsoever
- As L1 coordinator managing waves of specialists, it should have `execute-slash-command: ask` at minimum (to dispatch commands when orchestrating waves that need command execution)

**Remediation:** Add `execute-slash-command: ask` (can dispatch commands with L0 approval) and `hivemind-command-engine: allow` to permission block. Add command architecture context to `<context>` section (3 tiers, CQRS pattern). Optionally add command dispatch step to `<execution_flow>` for wave-based command routing.

---

#### 3. hm-l1-coordinator (`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Permission: `execute-slash-command` | **FAIL** ❌ | File lines 7-44: has `delegate-task: allow`, `run-background-command: allow`, BUT no `execute-slash-command` |
| Permission: `hivemind-command-engine` | **FAIL** ❌ | No `hivemind-command-engine` entry |
| Context: command tiers knowledge | **FAIL** ❌ | `<context>` section lines 80-90: mentions delegation hierarchy, wave execution, specialist domains, quality gates — NO mention of command architecture or 3-tier model |
| Workflow: CQRS pattern usage | **FAIL** ❌ | `<execution_flow>` uses only `delegate-task` for dispatch — no command execution via `execute-slash-command` |

**Notable:** This agent already has `run-background-command: allow` (Tier 2: Shell Commands) but NO `execute-slash-command` (Tier 1: Slash Commands). This creates an asymmetry — the agent can launch OS processes but cannot dispatch slash commands programmatically.

**Gap Summary:**
- Has Tier 2 (shell) access but no Tier 1 (slash command) access
- No understanding of the 3-tier architecture differentiation
- No `hivemind-command-engine` for command discovery
- No CQRS pattern awareness

**Remediation:** Add `execute-slash-command: ask` (Tier 1 slash commands), `hivemind-command-engine: allow` (read-side). Add context describing the 3-tier architecture and when to use each (`execute-slash-command` vs `run-background-command` vs `delegate-task`). Add command dispatch step to `<execution_flow>`.

---

#### 4. hm-l2-lineage-router (`.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Routing category for commands | **FAIL** ❌ | 6 categories (Research, Planning, Execution, Quality, Debug, Review) — NO "Command" or "Command Routing" category |
| Skill bundle for command routing | **FAIL** ❌ | None of the 6 bundles reference `execute-slash-command` or `hivemind-command-engine` |
| Trigger phrases | **FAIL** ❌ | No command-related triggers: missing "execute command", "command dispatch", "slash command", "command routing" |

**Gap Summary:**
- The lineage router has 6 bundles covering major task categories but lacks a **7th category: "Command Routing & Execution"**
- When an agent needs to determine which command tools to load (`execute-slash-command` vs `hivemind-command-engine` vs discovery flow), this router provides no guidance
- Missing triggers for command-related intent classification

**Remediation:** Add **7th category "Command Routing & Execution"** with bundle: `hm-l2-opencode-non-interactive-shell` (shell safety) + `hm-l3-opencode-platform-reference` (SDK reference) for shell commands; reference `execute-slash-command` and `hivemind-command-engine` in bundle notes. Add trigger phrases: "execute command", "command dispatch", "slash command", "command routing", "list commands". Update the routing map with CQRS pattern note.

---

#### 5. hm-l2-coordinating-loop (`.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Command dispatch in waves | **FAIL** ❌ | Full skill (436 lines) — contains zero references to `execute-slash-command` or programmatic command dispatch |
| CQRS pattern usage | **FAIL** ❌ | No step for `list_commands` → select → `execute-slash-command` in the ASSESS → DECIDE → DISPATCH → MONITOR → INTEGRATE → VERIFY flow |
| Command vs agent dispatch | **FAIL** ❌ | DISPATCH section only shows subagent delegation via task envelopes — no alternative dispatch through commands |

**Gap Summary:**
- The coordinating-loop skill orchestrates multi-agent workflows but only knows ONE dispatch method: subagent delegation (Task tool)
- Missing dispatch method: **command dispatch via `execute-slash-command`** — many workflows can be executed faster by routing through a command rather than spawning a full subagent
- No CQRS read-before-write step (discover/list commands → analyze → execute)

**Remediation:** Add "Command Dispatch" as an alternative dispatch method in the DECIDE MODE flowchart. Add step to DISPATCH section: "If a command exists for this task → `hivemind-command-engine({action:'list_commands'})` → select matching command → `execute-slash-command({command, arguments})`". Add CQRS pattern note: Read-side discovery before write-side execution.

---

#### 6. hf-l2-meta-builder-core (`.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md`)

| Check | Result | Evidence |
|-------|--------|----------|
| Power Tools: execute-slash-command | **FAIL** ❌ | "Power Tools" section documents question, todowrite, patch, grep+glob, lsp, skill, webfetch+websearch — **NO `execute-slash-command`** or `hivemind-command-engine` |
| Routing Table: Command Execution | **FAIL** ❌ | Routing table covers create/audit/stack for skills/agents/commands/tools — NO entry for "execute a command" or "command routing" |
| Domain Routing: Command Routing | **FAIL** ❌ | Domain routing table has "Command Building" → command-dev, but no "Command Routing" or "Command Execution" domain |

**Gap Summary:**
- The meta-builder core skill, which is the primary routing authority for hf-* lineage, does not document `execute-slash-command` as a power tool despite it being a critical built-in capability
- No routing entry for "I need to discover and execute commands" — this should be a routing path through `hivemind-command-engine` → `execute-slash-command`
- The Power Tools table (line ~280) documents 8 tools but misses 2 critical ones for command execution

**Remediation:** Add `execute-slash-command` and `hivemind-command-engine` to the Power Tools section with meta-builder use cases. Add "Command Routing" row to the Routing Table: "discover/execute commands" → `hivemind-command-engine` + `execute-slash-command` → self (research + execute). Add CQRS pattern documentation to the tools reference.

---

### Summary Matrix

| Target | `execute-slash-command` | `hivemind-command-engine` | Command Tiers (3-tier) | CQRS Pattern |
|--------|------------------------|---------------------------|----------------------|-------------|
| **hf-l0-orchestrator** | **NEEDS** (missing permission) | **OK** (has `:allow`) | **NEEDS** (no 3-tier context) | **NEEDS** (has read-side but no write-side awareness) |
| **hf-l1-coordinator** | **NEEDS** (missing entirely) | **NEEDS** (missing entirely) | **NEEDS** (no command context) | **NEEDS** (no CQRS awareness) |
| **hm-l1-coordinator** | **NEEDS** (has shell but not slash) | **NEEDS** (missing) | **NEEDS** (has Tier2 but not Tier1 concept) | **NEEDS** (no CQRS awareness) |
| **hm-l2-lineage-router** | **NEEDS** (no routing bundle) | **NEEDS** (no routing bundle) | **NEEDS** (no command category) | **NEEDS** (no routing category) |
| **hm-l2-coordinating-loop** | **NEEDS** (not in dispatch options) | **NEEDS** (not in workflow) | **NEEDS** (agent-only dispatch mindset) | **NEEDS** (no discover→execute step) |
| **hf-l2-meta-builder-core** | **NEEDS** (not in Power Tools) | **NEEDS** (not in Power Tools) | **NEEDS** (no execute domain in routing) | **NEEDS** (no command routing in table) |

### Anti-Pattern Count

| Anti-Pattern | Type | Count | Targets Affected |
|-------------|------|-------|-----------------|
| **Missing permission** — `execute-slash-command` not in permission block | Permission Gap | **5** | hf-l0, hf-l1, hm-l1, all skills (permissions not applicable to skills) |
| **Missing permission** — `hivemind-command-engine` not in permission block | Permission Gap | **4** | hf-l1, hm-l1 + routing gaps in skills |
| **Asymmetric Tier Knowledge** — has shell but not slash access | Knowledge Gap | **1** | hm-l1-coordinator (has `run-background-command: allow` but no `execute-slash-command`) |
| **No CQRS Pattern** — read-side not connected to write-side | Architecture Gap | **6** | ALL targets |
| **No Command Routing Category** — lineage router lacks command bundle | Routing Gap | **1** | hm-l2-lineage-router |
| **Agent-Only Dispatch** — coordinating loop only knows subagent delegation | Methodology Gap | **1** | hm-l2-coordinating-loop |
| **Power Tools Omission** — execute-slash-command not documented | Documentation Gap | **1** | hf-l2-meta-builder-core |

---

### Priority Improvements

1. **CRITICAL — hf-l0-orchestrator: Add `execute-slash-command: allow` permission** (line ~30)
   - L0 has `hivemind-command-engine: allow` but no write-side counterpart
   - Blocks the CQRS flow: can discover commands but cannot execute them
   - Fix: Add `execute-slash-command: allow` to the permission block

2. **HIGH — hm-l1-coordinator: Add `execute-slash-command: ask` and `hivemind-command-engine: allow`**
   - Currently has `run-background-command: allow` (Tier 2 shells) but no Tier 1 slash command access
   - Asymmetry: can launch OS processes but not dispatch YAML-defined commands
   - Fix: Add both permissions, document 3-tier differentiation in `<context>`

3. **HIGH — hm-l2-lineage-router: Add 7th category "Command Routing & Execution"**
   - 6 categories cover Research, Planning, Execution, Quality, Debug, Review — but no command category
   - Bundle should include: `hm-l3-opencode-non-interactive-shell` + reference to `hivemind-command-engine`/`execute-slash-command`
   - Fix: Add category with trigger phrases and bundle definition

4. **MEDIUM — hm-l2-coordinating-loop: Add command dispatch as alternative to subagent delegation**
   - All DISPATCH examples only show subagent delegation via Task tool
   - Many tasks can be done faster via `execute-slash-command`
   - Fix: Add DECIDE MODE branch: "Is there a command for this?" → `list_commands` → `execute-slash-command`

5. **MEDIUM — hf-l2-meta-builder-core: Add `execute-slash-command` and `hivemind-command-engine` to Power Tools**
   - Power Tools section documents 8 tools but misses 2 critical command tools
   - Fix: Add both tools with use cases and permission guidance to the Quick Reference table

6. **LOW — hf-l1-coordinator: Add `execute-slash-command: ask` permission**
   - L1 wave manager should have `ask` level for dispatching commands within waves
   - Fix: Add permission + lightweight context update

### Cross-Lineage Access Log

- `hm-l2-lineage-router` SKILL.md — loaded as reference for routing map audit (hm-* STRICT, justified: "auditing routing categories for Command Routing gap detection")
- `hm-l2-coordinating-loop` SKILL.md — loaded as reference for dispatch methodology audit (hm-* STRICT, justified: "auditing coordination flow for command dispatch alternatives")

### Overall Verdict

**FAIL** — 6/6 targets have gaps requiring remediation. All 6 targets lack `execute-slash-command` awareness at some level (permission, context, workflow, or routing). The CP-CMD-01 architecture was finalized (2026-05-13) but none of the audited primitives have been updated to reflect it.

### Remediation Map

| # | Finding | Severity | Specialist | Action |
|---|---------|----------|------------|--------|
| 1 | hf-l0-orchestrator: missing `execute-slash-command: allow` permission | CRITICAL | hf-l2-refactorer | Add permission to YAML frontmatter |
| 2 | hf-l0-orchestrator: missing CQRS context and workflow step | HIGH | hf-l2-refactorer | Update `<context>` and `<execution_flow>` |
| 3 | hm-l1-coordinator: missing `execute-slash-command: ask` permission | HIGH | hf-l2-refactorer | Add permission, document 3-tier in context |
| 4 | hm-l1-coordinator: missing `hivemind-command-engine` | HIGH | hf-l2-refactorer | Add permission, document CQRS pattern |
| 5 | hm-l2-lineage-router: no Command Routing category | HIGH | hf-l2-skill-builder | Add 7th bundle "Command Routing & Execution" |
| 6 | hm-l2-coordinating-loop: no command dispatch option | MEDIUM | hf-l2-skill-builder | Add command dispatch as DISPATCH alternative |
| 7 | hf-l2-meta-builder-core: Power Tools omission | MEDIUM | hf-l2-skill-builder | Add `execute-slash-command` + `hivemind-command-engine` to Power Tools |
| 8 | hf-l1-coordinator: missing both command permissions | MEDIUM | hf-l2-refactorer | Add `execute-slash-command: ask` + `hivemind-command-engine: allow` |
| 9 | hf-l1-coordinator: missing command context | LOW | hf-l2-refactorer | Add lightweight command architecture note |
</task_result>
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free · 11.1s)

_Thinking:_

Excellent! The audit is complete. Now I have a comprehensive audit report. Let me summarize the key findings:

### Priority Remediation Map:

**For hf-l2-refactorer (agents with permission/context gaps):**
1. hf-l0-orchestrator: Add `execute-slash-command: allow`, update `<context>` and `<execution_flow>`
2. hm-l1-coordinator: Add `execute-slash-command: ask` + `hivemind-command-engine: allow`, document 3-tier
3. hf-l1-coordinator: Add `execute-slash-command: ask` + `hivemind-command-engine: allow`, lightweight context update

**For hf-l2-skill-builder (skills with content gaps):**
4. hm-l2-lineage-router: Add 7th "Command Routing & Execution" category
5. hm-l2-coordinating-loop: Add command dispatch as DISPATCH alternative
6. hf-l2-meta-builder-core: Add `execute-slash-command` + `hivemind-command-engine` to Power Tools

Wait, but the instructions say I should delegate to `hf-l2-refactorer` for improvements. The audit report suggests some tasks for hf-l2-skill-builder too. Let me check:

The instructions say: "Phase 2: IMPROVE — Delegate tới hf-l2-refactorer để apply các improvements"

But the skills (hm-l2-lineage-router, hm-l2-coordinating-loop, hf-l2-meta-builder-core) are SKILL.md files, not agent definitions. The hf-l2-refactorer description says: "Refactors OpenCode skills and agents to improve structural quality, reduce technical debt, eliminate anti-patterns, and align with lineage standards."

While the auditor report suggests hf-l2-skill-builder for skill content gaps, the refactorer should also be able to handle skill content improvements, as its description says "refactors OpenCode skills and agents."

Let me proceed with delegating to hf-l2-refactorer for all improvements as instructed. The changes I need to apply:

**Agent targets (for hf-l2-refactorer):**
1. hf-l0-orchestrator: Add `execute-slash-command: allow`, update `<context>`, update `<execution_flow>`
2. hf-l1-coordinator: Add `execute-slash-command: ask` + `hivemind-command-engine: allow`, add context
3. hm-l1-coordinator: Add `execute-slash-command: ask` + `hivemind-command-engine: allow`, add 3-tier context

**Skill targets (for hf-l2-refactorer, skill authoring):**
4. hm-l2-lineage-router: Add 7th category + bundle
5. hm-l2-coordinating-loop: Add command dispatch method
6. hf-l2-meta-builder-core: Add tools to Power Tools + Routing Table

Let me delegate this to hf-l2-refactorer now.

Excellent audit report! All 6 targets have clear gaps. Now let me proceed to **Phase 2: IMPROVE** — delegating to hf-l2-refactorer.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
      "status": "in_progress"
    },
    {
      "priority": "high",
      "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Phase 1: AUDIT — Read all 6 target files to understand current state",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Phase 1: AUDIT — Delegate to hf-l2-auditor for structured audit report",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Phase 2: IMPROVE — Delegate to hf-l2-refactorer to apply fixes based on audit",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 3: VALIDATE — Verify all changes and report structured results",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Hf-L2-Meta-Builder · DeepSeek V4 Flash Free)

_Thinking:_

Now I need to delegate to hf-l2-refactorer. The audit report identified 9 findings across 6 targets. Let me construct a detailed prompt for the refactorer to apply improvements.

Important constraints:
- ONLY edit files in `.hivefiver-meta-builder/agents-lab/active/refactoring/` and `.hivefiver-meta-builder/skills-lab/active/refactoring/`
- DO NOT create new files
- DO NOT delete files
- DO NOT touch `.opencode/`
- Audit first, improve second — sequential

Let me craft the prompt carefully with all the changes needed per target.

**Tool: task**

**Input:**
```json
{
  "description": "Apply CP-CMD-01 improvements",
  "subagent_type": "hf-l2-refactorer",
  "prompt": "You are a **subagent hf-l2-refactorer**. Your task is to apply targeted improvements to 6 agent and skill files based on a completed audit report.\n\n## IMPORTANT BOUNDARIES\n- ONLY edit files in: `.hivefiver-meta-builder/agents-lab/active/refactoring/` and `.hivefiver-meta-builder/skills-lab/active/refactoring/`\n- DO NOT create new files\n- DO NOT delete files\n- DO NOT touch `.opencode/`\n- Only update existing content — DO NOT restructure entire files\n- Focus on adding missing permissions, updating context sections, and fixing workflow gaps\n\n## RESEARCH CONTEXT (Verified from Source Code)\n\n### 1. execute-slash-command Tool\n**Schema fields:** command (string, REQUIRED), arguments (string, optional), agent (string, optional), model (string, optional), variant (string, optional)\n**SDK endpoint:** `POST /session/:sessionID/command` — deterministic, NOT LLM inference\n**Return:** `{ responseId, partsCount, errorType }`\n\n### 2. hivemind-command-engine (CQRS Read-side)\n**Tool:** src/tools/hivemind/hivemind-command-engine.ts\n**Actions:** discover, list_commands, analyze_contract, render_context, transform_messages, route_preview\n**Agent workflow:** `hivemind-command-engine({action:\"list_commands\"})` → select → `execute-slash-command({command, arguments})`\n\n### 3. CP-CMD-01 Architecture — Three Tiers\n\n| Tier | SDK Endpoint | Tool | Semantics |\n|------|-------------|------|-----------|\n| Slash Commands | `POST /session/:id/command` | `execute-slash-command` | Deterministic, TUI-bound, agent-aware |\n| Shell Commands | `POST /session/:id/shell` | `run-background-command` | PTY/headless, background processes |\n| Agent Delegation | `POST /session/:id/message` | `delegate-task` | WaiterModel, dual-signal completion |\n\n### 4. Permission Model\n- `execute-slash-command: allow` — CHO L0/L1 agents (command dispatch)\n- `hivemind-command-engine: allow` — CHO L0/L1 agents (command discovery)\n- L2 agents: `execute-slash-command: ask`\n\n### 5. CQRS Pattern\n`hivemind-command-engine({action:\"list_commands\"})` → discover available commands → `execute-slash-command({command:\"name\"})` → execute\n\n---\n\n## CHANGES PER TARGET\n\n### Target 1: hf-l0-orchestrator\nFile: `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l0-orchestrator.md`\n\n**Change A — Add permission (in YAML frontmatter):**\nAdd `execute-slash-command: allow` alongside existing `hivemind-command-engine: allow` in the permission block.\n\n**Change B — Update <context> section:**\nAfter the line mentioning `hivemind-command-engine` in `<context>`, add:\n```\nCP-CMD-01 command architecture: 3 tiers — slash commands (execute-slash-command, deterministic TUI commands), shell commands (run-background-command, PTY/headless processes), agent delegation (delegate-task, WaiterModel). CQRS pattern: hivemind-command-engine (read-side discovery) → execute-slash-command (write-side execution).\n```\n\n**Change C — Update <execution_flow> step \"assess_session_runtime\":**\nAdd after \"command routing\" reference: mention that commands can be dispatched programmatically via `execute-slash-command` following CQRS pattern.\n\n---\n\n### Target 2: hf-l1-coordinator\nFile: `.hivefiver-meta-builder/agents-lab/active/refactoring/hf-l1-coordinator.md`\n\n**Change A — Add permissions:**\nAdd both `execute-slash-command: ask` and `hivemind-command-engine: allow` to the YAML frontmatter permission block, alongside existing `delegate-task: allow`.\n\n**Change B — Update <context> section:**\nAdd a paragraph about command architecture:\n```\nCP-CMD-01 command tiers: execute-slash-command (slash commands, deterministic), run-background-command (shell/PTY), delegate-task (agent delegation). CQRS pattern: hivemind-command-engine for command discovery → execute for execution.\n```\n\n---\n\n### Target 3: hm-l1-coordinator\nFile: `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator.md`\n\n**Change A — Add permissions:**\nAdd `execute-slash-command: ask` and `hivemind-command-engine: allow` to the YAML frontmatter permission block alongside existing `run-background-command: allow`.\n\n**Change B — Document 3-tier differentiation in <context>:**\nAdd note distinguishing the 3 tiers, especially explaining that `execute-slash-command` is for deterministic slash commands (Tier 1) whereas `run-background-command` is for shell/PTY processes (Tier 2).\n\n---\n\n### Target 4: hm-l2-lineage-router\nFile: `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-lineage-router/SKILL.md`\n\n**Change A — Add 7th category \"Command Routing & Execution\":**\nIn the Routing Map section, add a new category entry:\n```\n### 7. Command Routing & Execution\n**Intent signals:** \"execute command\", \"command dispatch\", \"slash command\", \"command routing\", \"list commands\", \"run command\", \"discover commands\"\n**Priority bundle:** hivemind-command-engine (discovery) → execute-slash-command (execution)\n**Loading order:** hivemind-command-engine first (list_commands for discovery), then execute-slash-command for the selected command\n**Max skills:** 2\n**Notes:** Uses CQRS pattern — read-side (hivemind-command-engine) before write-side (execute-slash-command).\n```\n\n**Change B — Update trigger phrases:**\nAdd command-related trigger phrases to the frontmatter description.\n\n---\n\n### Target 5: hm-l2-coordinating-loop\nFile: `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-coordinating-loop/SKILL.md`\n\n**Change A — Add command dispatch to DECIDE MODE flowchart:**\nIn Step 2 (DECIDE MODE), add a decision branch before the parallel/sequential check:\n```\nIs there a command available for this task?\n├─ Yes, known command → Route to `execute-slash-command` via CQRS pattern:\n│   `hivemind-command-engine({action:\"list_commands\"})` → select matching command\n│   → `execute-slash-command({command, arguments})`\n└─ No → Continue to subagent delegation\n```\n\n**Change B — Add command execution to DISPATCH section:**\nAfter the \"Task Envelope\" subsection under DISPATCH, add:\n```\n### Alternative: Command Dispatch\nFor tasks that have a matching OpenCode command (deterministic, known operation):\n1. Discover: `hivemind-command-engine({action:\"list_commands\"})` to find matching command\n2. Analyze: `hivemind-command-engine({action:\"analyze_contract\", commandName:\"...\"})` for contract\n3. Execute: `execute-slash-command({command:\"name\", arguments:\"...\"})` \n4. Verify: Check the return `{ responseId, partsCount, errorType }`\nUse command dispatch when the operation is deterministic and a command already exists — faster than spawning a full subagent.\n```\n\n---\n\n### Target 6: hf-l2-meta-builder-core\nFile: `.hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-meta-builder-core/SKILL.md`\n\n**Change A — Add to Power Tools section:**\nAfter the `skill` tool entry and before `webfetch + websearch`, add:\n```\n### `execute-slash-command` — Dispatch Commands Deterministically\n\n**What it does:** Executes an OpenCode slash command via `POST /session/:id/command`. Takes command name (required), arguments, agent, model, variant. NOT LLM inference — deterministic execution.\n\n**Why it matters:** Commands force action without reasoning overhead. Use for known deterministic operations instead of spawning subagents.\n\n**When to use:** Running `/hf-create`, `/hf-audit`, `/hf-stack`, or any registered command. Use with `hivemind-command-engine` for CQRS pattern: discover → execute.\n\n### `hivemind-command-engine` — Discover and Analyze Commands\n\n**What it does:** CQRS read-side for command management. Actions: discover (full bundles), list_commands (compact summary), analyze_contract (validate structure), render_context, transform_messages, route_preview.\n\n**Why it matters:** Don't hardcode command names — discover available commands dynamically before executing.\n```\n\n**Change B — Update Quick Reference table:**\nAdd entries to the built-in tool table:\n| `execute-slash-command` | Dispatch commands deterministically (CQRS write-side) | `allow` (L0/L1) |\n| `hivemind-command-engine` | Command discovery and contract analysis (CQRS read-side) | `allow` |\n\n---\n\n## OUTPUT FORMAT\n\nAfter applying all changes, return a structured report:\n\n```markdown\n## IMPROVEMENT REPORT\n\n### Changes Applied\n\n#### 1. hf-l0-orchestrator\n- [DONE/SKIPPED] Permission: execute-slash-command\n- [DONE/SKIPPED] Context: CQRS + 3-tier update\n- [DONE/SKIPPED] Execution flow: command dispatch\n\n#### 2. hf-l1-coordinator\n- [DONE/SKIPPED] Permissions: execute-slash-command + hivemind-command-engine\n- [DONE/SKIPPED] Context: command architecture\n\n... (all 6 targets)\n\n### Summary\n- Files modified: [count]\n- Permissions added: [permissions list]\n- Context updates: [areas updated]\n- Workflow updates: [areas updated]\n```\n"
}
```

---

