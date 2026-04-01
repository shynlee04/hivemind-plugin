# HiveMind Tool LLM-Eval Scenarios

**Date:** 2026-04-01
**Purpose:** Manual eval of HiveMind custom tools via natural language prompts in OpenCode
**Setup:** `git checkout -b eval/tool-test-2026-04-01`

---

## How to Use

1. Create new branch: `git checkout -b eval/tool-test-2026-04-01`
2. Start OpenCode in this workspace
3. Paste each scenario prompt verbatim into the chat
4. Observe: which tools agent picks, success/failure, error messages, fallback behavior
5. Record results in the observation template at the bottom of this file

**Tips:**
- Test with different agents (hiveminder, hivemaker, hivexplorer, hiveq) to compare tool selection
- After each scenario, `/clear` the session to avoid context contamination
- Note the exact error messages — they reveal description quality issues

---

## Tool Inventory

| # | Tool | Actions | Args | Primary Domain |
|---|------|---------|------|----------------|
| 1 | `hivemind_task` | 7 (create, list, get, activate, rotate, verify, complete) | 8 | Task lifecycle |
| 2 | `hivemind_trajectory` | 6 (inspect, traverse, attach, checkpoint, event, close) | 12 | Session state |
| 3 | `hivemind_handoff` | 6 (create, read, list, update, validate, close) | 20 | Delegation |
| 4 | `hivemind_doc` | 5 (skim, skim_directory, read, chunk, search) | 6 | Document intelligence |
| 5 | `hivemind_runtime_status` | 0 (inspection only) | 0 | Runtime inspection |
| 6 | `hivemind_runtime_command` | 13 args (god tool wrapper for hm-* commands) | 13 | CLI passthrough |
| 7 | `hivemind_journal` | 4 args (sessionId, eventType, payload, timestamp) | 4 | Session events |
| 8 | `hivemind_hm_init` | 2 args (mode, force) | 2 | Project bootstrap |
| 9 | `hivemind_hm_doctor` | 2 args (scope, fix) | 2 | Diagnostics |
| 10 | `hivemind_hm_setting` | 8 args (group, key, value, locale, renderMode, dashboard) | 8 | Configuration |
| 11 | `hivemind_agent_work_create_contract` | 10+ args (complex nested objects) | 10+ | Work contracts |
| 12 | `hivemind_agent_work_export_contract` | 2 args (contractId, format) | 2 | Contract export |

---

## GROUP A: Tool Selection & Description Quality (Criterion 1)

*Do agents pick the right tool? Are descriptions distinct enough?*

### A1. Task Management — Basic CRUD

**Prompt:**
```
I need to track some work. Create a task called "Refactor tool descriptions" for workflow wf-001, then activate it.
```

**Expected:** `hivemind_task` (create → activate)
**Watch for:**
- Does agent pick `hivemind_task` or try innate tools?
- Does it know it needs a `workflowId`?
- Does it chain create then activate correctly?

**Known failure:** Agent may confuse with `hivemind_agent_work_create_contract`

---

### A2. Task vs Contract Confusion

**Prompt:**
```
Plan out a multi-step refactoring project. I need to break down the work into phases and track deliverables.
```

**Expected:** `hivemind_agent_work_create_contract` OR `hivemind_task`
**Watch for:**
- Does agent pick the right tool? Try both? Get confused?
- Does it understand the difference between a "task" and a "work contract"?
- Does it ask clarifying questions about scope?

**Known failure:** Both manage task-like state — descriptions overlap significantly

---

### A3. Document Reading — Heading vs Full File

**Prompt:**
```
Read the AGENTS.md file and tell me what's in it.
```

**Expected:** `hivemind_doc` (skim first, then read with heading if needed)
**Watch for:**
- Does agent try `read` without `heading`? Fail with "heading is required"?
- Does it recover by using `skim` instead?
- Does it fall back to innate file read?

**Known failure:** Agent confuses `hivemind_doc read` (heading-based) with full file read

---

### A4. Document Search — File vs Directory

**Prompt:**
```
Search through the session files for any mentions of tool failures.
```

**Expected:** `hivemind_doc` (search with `dirPath`)
**Watch for:**
- Does agent use `filePath` instead of `dirPath`?
- Does it fail with "dirPath is required for search"?
- Does it fall back to `glob`/`grep` innate tools?

**Known failure:** Agent uses `filePath` for search action — wrong parameter

---

### A5. Trajectory vs Handoff Confusion

**Prompt:**
```
I want to save our progress so we can pick up where we left off later.
```

**Expected:** `hivemind_trajectory` (checkpoint)
**Watch for:**
- Does agent pick trajectory or handoff?
- Does it understand the difference between checkpointing and delegating?
- Does it use the `checkpoint` action specifically?

**Known failure:** Both record session state — descriptions overlap

---

### A6. Delegation Intent

**Prompt:**
```
I need to delegate this investigation work to a sub-agent. Set up a handoff with the scope and constraints.
```

**Expected:** `hivemind_handoff` (create)
**Watch for:**
- Does agent pick handoff? Know which fields to fill?
- Does it try trajectory instead?
- Does it understand `sourceSessionId`, `targetAgent`, `scope`, `constraints`?

**Known failure:** 20 args — agent may not know which are required vs optional

---

## GROUP B: Tool Frequency & Usefulness (Criterion 2)

*Are tools useful across many scenarios, or only narrow edge cases?*

### B1. Multi-Turn Workflow

**Prompt:**
```
Let's set up a full workflow. Create 3 tasks for: (1) audit tool descriptions, (2) fix overlapping descriptions, (3) verify the fixes. Activate the first one.
```

**Expected:** `hivemind_task` (create ×3, activate)
**Watch for:**
- Does agent chain calls correctly?
- Does it reuse the same `workflowId` across all 3 tasks?
- Does it activate only the first task as requested?

---

### B2. Runtime Inspection

**Prompt:**
```
What's the current state of the HiveMind runtime? Show me what's active.
```

**Expected:** `hivemind_runtime_status`
**Watch for:**
- Does agent know about this tool?
- Does it pick it over bash/glob for runtime inspection?
- Does the output show active workflows, trajectories, and sessions?

---

### B3. Diagnostics

**Prompt:**
```
Something feels off with the project setup. Run diagnostics to check for issues.
```

**Expected:** `hivemind_hm_doctor`
**Watch for:**
- Does agent pick doctor or try bash/npm commands?
- Does it know about the `scope` and `fix` parameters?
- Does it offer to run with `fix: true` after seeing issues?

---

### B4. Configuration

**Prompt:**
```
I want to change the governance mode to strict and set the expertise level to expert.
```

**Expected:** `hivemind_hm_setting`
**Watch for:**
- Does agent pick setting or try `runtime_command`?
- Does it know the `group`/`key`/`value` structure?
- Does it make two separate calls or try to batch?

---

## GROUP C: Tool Conflicts & Overlap (Criterion 3)

*Do tools conflict? Are there cumbersome preconditions?*

### C1. Settings via Two Paths

**Prompt:**
```
Change the language preference to Spanish.
```

**Expected:** `hivemind_hm_setting`
**Watch for:**
- Does agent try `hivemind_runtime_command` instead?
- Both can affect settings — does agent understand the difference?
- Does it use `group: "language"` correctly?

---

### C2. Runtime Command vs Direct Tools

**Prompt:**
```
Initialize HiveMind for this project.
```

**Expected:** `hivemind_hm_init`
**Watch for:**
- Does agent try `hivemind_runtime_command` with 'hm-init'?
- Or does it use `hm_init` directly?
- Which path is cleaner?

---

### C3. Journal — Who Calls It?

**Prompt:**
```
Record that we just completed the tool audit as a session event.
```

**Expected:** `hivemind_journal` (if agent knows)
**Watch for:**
- Does agent know about this tool?
- Does it think hooks handle it automatically?
- Does it provide `sessionId`, `eventType`, `payload`, `timestamp`?

**Known issue:** Journal is hybrid — hooks auto-call it, agents rarely do manually

---

### C4. Trajectory Event vs Journal Event

**Prompt:**
```
Record an event that we started the tool evaluation.
```

**Expected:** `hivemind_trajectory` (event) OR `hivemind_journal`
**Watch for:**
- Does agent pick trajectory event or journal?
- Both can record events — does agent know the difference?
- Does it understand trajectory events are tied to a trajectory, journal events are session-wide?

---

## GROUP D: Framework Coherence (Criterion 4)

*Do tools fit HiveMind's hierarchy and context-engineering philosophy?*

### D1. Mid-Run Tool Usage

**Prompt:**
```
We've been working for a while. Save a checkpoint of our current trajectory, then create a new task for the next phase.
```

**Expected:** `hivemind_trajectory` (checkpoint) → `hivemind_task` (create)
**Watch for:**
- Does tool chaining work mid-conversation?
- Does state persist between calls?
- Does the agent understand it needs an active trajectory first?

---

### D2. Context-Aware Tool Usage

**Prompt:**
```
Look at what tasks we already have, then create a subtask under the most recent one.
```

**Expected:** `hivemind_task` (list) → `hivemind_task` (create with `parentTaskId`)
**Watch for:**
- Does agent use list result to inform create call?
- Does it extract the `parentTaskId` from the most recent task?
- Does it understand the parent-child relationship?

---

### D3. Evidence-Based Completion

**Prompt:**
```
We've finished reviewing all tool descriptions. Mark the task as complete with evidence pointing to the eval file.
```

**Expected:** `hivemind_task` (complete with `evidenceRefs`)
**Watch for:**
- Does agent include `evidenceRefs`?
- Does it know the format for evidence references?
- Does it verify the task exists first?

---

### D4. Workflow Hierarchy

**Prompt:**
```
Create a workflow with a parent task and two child subtasks. Then list all tasks to verify the hierarchy.
```

**Expected:** `hivemind_task` (create parent) → `hivemind_task` (create child ×2 with `parentTaskId`) → `hivemind_task` (list)
**Watch for:**
- Does agent understand `parentTaskId` vs `taskId`?
- Does list show the hierarchy correctly?
- Does it verify the parent-child relationship?

---

## GROUP E: Granularity & Chaining (Criterion 5)

*Are tools at right granularity? Can they be chained effectively?*

### E1. Full Task Lifecycle

**Prompt:**
```
Create a task "Test tool descriptions", activate it, verify it, then complete it with evidence.
```

**Expected:** `hivemind_task` (create → activate → verify → complete)
**Watch for:**
- Full lifecycle chain
- Does each step succeed?
- Does verify require `verificationContractId`?
- Does complete require `evidenceRefs`?

---

### E2. Full Handoff Lifecycle

**Prompt:**
```
Create a handoff to delegate work to hivexplorer. Then read it back to verify, then close it.
```

**Expected:** `hivemind_handoff` (create → read → close)
**Watch for:**
- Does handoff persist between calls?
- Does read return what was created?
- Does close work after read?
- Does the agent provide required fields for create?

---

### E3. Full Trajectory Lifecycle

**Prompt:**
```
Attach a trajectory to this session, record an event, create a checkpoint, then close it.
```

**Expected:** `hivemind_trajectory` (attach → event → checkpoint → close)
**Watch for:**
- Does trajectory state persist?
- Does close work after attach?
- Does the agent understand it needs `sessionId` for attach?
- Are the event and checkpoint linked to the same trajectory?

---

### E4. Contract Lifecycle

**Prompt:**
```
Create a work contract for this session with a workflow containing 2 tasks. Then export it.
```

**Expected:** `hivemind_agent_work_create_contract` → `hivemind_agent_work_export_contract`
**Watch for:**
- Does contract creation work with nested workflow/tasks?
- Does export return the right format?
- Does the agent understand the complex nested structure?
- Does it use `format: "contract"` or `format: "summary"`?

---

### E5. Document Intelligence Chain

**Prompt:**
```
First skim the project to understand the structure, then read the section about tools, then search for any mentions of "handoff" across all docs.
```

**Expected:** `hivemind_doc` (skim → read with heading → search)
**Watch for:**
- Does agent chain all three doc actions?
- Does skim inform the read heading choice?
- Does search use `dirPath` correctly?
- Does it recover from the known `read` heading bug?

---

## GROUP F: Concept Harmony (Criterion 6)

*Do tools harmonize with other HiveMind concepts (skills, hooks, agents)?*

### F1. Skill + Tool Interaction

**Prompt:**
```
Load the use-hivemind skill, then check the current trajectory state.
```

**Expected:** skill (use-hivemind) → `hivemind_trajectory` (inspect)
**Watch for:**
- Does skill loading affect tool availability?
- Does trajectory show skill load event?
- Does the agent understand the skill/tool relationship?

---

### F2. Agent-Specific Tool Access

**Prompt:**
```
I'm the hiveminder. Show me all available tools and their permissions.
```

**Expected:** `hivemind_runtime_status`
**Watch for:**
- Does status show correct tool matrix for current agent?
- Does it list all 12 tools?
- Does the agent understand permission boundaries?

---

### F3. Multi-Agent Delegation Chain

**Prompt:**
```
Create a task, then create a handoff to delegate it to hivexplorer, then attach a trajectory to track the delegation.
```

**Expected:** `hivemind_task` (create) → `hivemind_handoff` (create) → `hivemind_trajectory` (attach)
**Watch for:**
- Do all three tools work together?
- Do IDs cross-reference correctly?
- Does the handoff reference the task?
- Does the trajectory reference the handoff?

---

### F4. Doctor + Setting Recovery

**Prompt:**
```
Run diagnostics on the project, and if you find any issues, try to fix them automatically.
```

**Expected:** `hivemind_hm_doctor` (scope: "all", fix: false) → `hivemind_hm_doctor` (scope: "all", fix: true)
**Watch for:**
- Does agent run doctor first without fix?
- Does it then re-run with `fix: true`?
- Does it verify fixes after applying them?

---

## GROUP G: Innate Tool Replacement (Criterion 7)

*Are custom tools better than OpenCode's innate tools?*

### G1. Doc vs File Read

**Prompt:**
```
Read the AGENTS.md file and summarize its key points.
```

**Expected:** `hivemind_doc` (skim → read with heading)
**Watch for:**
- Does agent pick `hivemind_doc` or innate file read?
- Which gives better results?
- Does `hivemind_doc` handle the heading requirement gracefully?

---

### G2. Runtime Command vs Shell

**Prompt:**
```
Run the hm-doctor command to check project health.
```

**Expected:** `hivemind_hm_doctor` (direct) OR `hivemind_runtime_command` (with 'hm-doctor')
**Watch for:**
- Does agent use direct tool or wrap in `runtime_command`?
- Which is cleaner?
- Does the agent understand both paths exist?

---

### G3. Task vs Innate Todo

**Prompt:**
```
Keep track of these 5 things we need to do: (1) review tool descriptions, (2) fix overlapping tools, (3) update agent permissions, (4) test doc tool, (5) verify handoff lifecycle
```

**Expected:** `hivemind_task` (create ×5)
**Watch for:**
- Does agent use `hivemind_task` or just list in conversation?
- Does the tool add value over a simple todo list?
- Does it assign a `workflowId`?

---

### G4. Trajectory vs Conversation Memory

**Prompt:**
```
Remember that we decided to use strict governance mode. We'll need this later.
```

**Expected:** `hivemind_trajectory` (checkpoint or event)
**Watch for:**
- Does agent use trajectory to persist the decision?
- Or does it just acknowledge and rely on conversation memory?
- Does the agent understand trajectory as persistent memory?

---

### G5. Handoff vs Direct Subagent

**Prompt:**
```
I want hivexplorer to investigate the tool overlap issue. Set that up.
```

**Expected:** `hivemind_handoff` (create)
**Watch for:**
- Does agent use handoff tool or just invoke subagent directly?
- Does handoff add structure over direct invocation?
- Does the agent fill in scope, constraints, and target agent?

---

## GROUP H: Intelligence Enhancement (Criterion 8)

*Do tools make agents think more like humans — planning, delegating, reflecting?*

### H1. Planning Before Acting

**Prompt:**
```
Before we start, create a work contract that outlines our approach. Then execute the first task.
```

**Expected:** `hivemind_agent_work_create_contract` → `hivemind_task` (create → activate)
**Watch for:**
- Does agent plan first?
- Does contract inform task creation?
- Does the agent understand the contract→task relationship?

---

### H2. Reflection & Checkpointing

**Prompt:**
```
We've done a lot. Save a checkpoint of our progress, record what we accomplished, and note what's next.
```

**Expected:** `hivemind_trajectory` (checkpoint + event)
**Watch for:**
- Does agent reflect and record?
- Is checkpoint useful for resuming?
- Does it include summary, accomplishments, and next steps?

---

### H3. Delegation with Context

**Prompt:**
```
I need to hand off the remaining work. Create a handoff that includes the current trajectory, active tasks, and success criteria.
```

**Expected:** `hivemind_trajectory` (inspect) → `hivemind_task` (list) → `hivemind_handoff` (create)
**Watch for:**
- Does agent gather context before creating handoff?
- Is handoff comprehensive?
- Does it include `trajectoryId`, `taskIds`, `successMetrics`?

---

### H4. Recovery After Failure

**Prompt:**
```
The last tool call failed. Check what went wrong and try again with the correct parameters.
```

**Expected:** Agent inspects error → retries with corrected params
**Watch for:**
- Does agent understand the error message?
- Does it correct the parameter (e.g., `filePath` → `dirPath`)?
- Does it recover gracefully or give up?

---

### H5. Multi-Tool Investigation

**Prompt:**
```
I need a full picture of our current state. Show me active trajectories, running workflows, recent tasks, and any open handoffs.
```

**Expected:** `hivemind_trajectory` (inspect) → `hivemind_runtime_status` → `hivemind_task` (list) → `hivemind_handoff` (list)
**Watch for:**
- Does agent chain multiple inspection tools?
- Does it synthesize the results into a coherent picture?
- Does it miss any relevant tools?

---

## GROUP I: Edge Cases & Error Handling

*How do tools behave at boundaries and under stress?*

### I1. Missing Required Parameters

**Prompt:**
```
Create a task with no title.
```

**Expected:** Tool returns validation error
**Watch for:**
- Does the tool return a clear error message?
- Does the agent understand what's missing?
- Does it recover by providing the title?

---

### I2. Invalid Workflow ID

**Prompt:**
```
Create a task for workflow "nonexistent-workflow-xyz".
```

**Expected:** Tool creates task or returns error
**Watch for:**
- Does the tool validate workflow existence?
- Does it create task anyway?
- Does the agent notice the workflow doesn't exist?

---

### I3. Double Activation

**Prompt:**
```
Create a task, activate it, then try to activate it again.
```

**Expected:** Second activation returns error or no-op
**Watch for:**
- Does the tool handle double activation gracefully?
- Does it return a clear message?
- Does the agent understand the state?

---

### I4. Close Without Open

**Prompt:**
```
Close a trajectory that was never attached.
```

**Expected:** Tool returns error
**Watch for:**
- Does the tool validate trajectory state?
- Does it return a clear error?
- Does the agent understand the lifecycle requirement?

---

### I5. Handoff to Non-Existent Agent

**Prompt:**
```
Create a handoff to delegate work to an agent called "nonexistent-agent-xyz".
```

**Expected:** Tool creates handoff or returns error
**Watch for:**
- Does the tool validate agent existence?
- Does it create handoff anyway?
- What happens when the handoff is read back?

---

### I6. Contract Export Before Creation

**Prompt:**
```
Export a work contract with ID "nonexistent-contract-xyz".
```

**Expected:** Tool returns error
**Watch for:**
- Does the tool handle missing contract gracefully?
- Does it return null or a clear error?
- Does the agent understand the issue?

---

### I7. Doc Read Without Heading

**Prompt:**
```
Read the full contents of AGENTS.md using the doc tool.
```

**Expected:** Tool fails with "heading is required for read"
**Watch for:**
- Does the tool return a clear error?
- Does the agent recover by using `skim` instead?
- Does the agent understand the heading requirement?

**Known bug:** `hivemind_doc read` requires `heading` param — fails without it

---

### I8. Doc Search With Wrong Param

**Prompt:**
```
Search for "hivemind" in the AGENTS.md file.
```

**Expected:** Tool fails with "dirPath is required for search"
**Watch for:**
- Does the agent use `filePath` instead of `dirPath`?
- Does it recover by using `dirPath`?
- Does it fall back to innate tools?

**Known bug:** `hivemind_doc search` requires `dirPath` not `filePath`

---

## GROUP J: Stress Testing

*Can tools handle complex, real-world scenarios?*

### J1. Full Project Bootstrap

**Prompt:**
```
Set up HiveMind for this project from scratch. Initialize it, run diagnostics, set governance to strict, and create an initial task for the first phase of work.
```

**Expected:** `hivemind_hm_init` → `hivemind_hm_doctor` → `hivemind_hm_setting` → `hivemind_task` (create)
**Watch for:**
- Does agent chain all four tools correctly?
- Does each step succeed?
- Does the agent understand the bootstrap sequence?

---

### J2. Multi-Agent Workflow

**Prompt:**
```
Create a work contract with 3 tasks. Create handoffs for each task to different agents (hivexplorer, hiveq, hivemaker). Attach a trajectory to track the whole workflow.
```

**Expected:** `hivemind_agent_work_create_contract` → `hivemind_handoff` (create ×3) → `hivemind_trajectory` (attach)
**Watch for:**
- Does the agent handle the complexity?
- Do all handoffs reference the correct tasks?
- Does the trajectory track the whole workflow?

---

### J3. Recovery After Session Clear

**Prompt:**
```
/clear

We were in the middle of a tool evaluation. Check what state we were in and continue from where we left off.
```

**Expected:** `hivemind_trajectory` (inspect) → `hivemind_task` (list)
**Watch for:**
- Does agent check trajectory state after clear?
- Does it find active tasks?
- Does it understand it needs to resume, not restart?

---

## OBSERVATION TEMPLATE

Copy this template for each scenario you test. Fill it in after running the prompt.

```markdown
### Scenario: [ID]

| Field | Value |
|-------|-------|
| **Scenario ID** | A1, B2, etc. |
| **Agent Used** | hiveminder, hivemaker, etc. |
| **Tools Called** | List of tools agent actually used |
| **Expected Tools** | What we expected |
| **Match?** | YES / PARTIAL / NO |
| **Errors** | Any error messages (exact text) |
| **Fallback** | Did agent fall back to innate tools? Which ones? |
| **Recovery** | Did agent recover from errors? How? |
| **Tool Confusion** | Did agent pick wrong tool first? Which one? |
| **Value Add** | Did custom tool add value over innate tools? |
| **Time to First Tool** | ~seconds before agent picked a tool |
| **Notes** | Any observations |
```

---

## KNOWN BUGS TO WATCH FOR

| # | Bug | Affected Tool | Severity | Workaround |
|---|-----|---------------|----------|------------|
| 1 | `read` requires `heading` param | `hivemind_doc` | HIGH | Use `skim` for full file reads |
| 2 | `search` requires `dirPath` not `filePath` | `hivemind_doc` | HIGH | Pass `dirPath` for search action |
| 3 | `addEvent()`/`addDiagnostic()` are no-op stubs | `hivemind_journal` | MEDIUM | Events silently fail — V3 migration broke event tracking |
| 4 | `readHandoffFile()` returns null for both 'not found' and 'corrupted JSON' | `hivemind_handoff` | MEDIUM | Can't distinguish missing from corrupted |
| 5 | `hivemind_hm_setting` is a god tool (1,121 LOC, 4 layer violations) | `hivemind_hm_setting` | LOW | Works but may have unexpected behavior |
| 6 | `hivemind_journal` is hybrid — hooks auto-call it, agents rarely do | `hivemind_journal` | LOW | Agents may not know they need to call it |

---

## KNOWN WEAKNESSES (Description Quality)

| # | Weakness | Severity | Impact |
|---|----------|----------|--------|
| 1 | `hivemind_trajectory` ↔ `hivemind_handoff` — CRITICAL shadowing (both record session state) | CRITICAL | Agent picks wrong tool 50% of the time |
| 2 | `hivemind_task` ↔ `hivemind_agent_work_create_contract` — HIGH overlap (both manage task state) | HIGH | Agent confused about which to use |
| 3 | `hivemind_runtime_status` ↔ `hivemind_hm_doctor` — MEDIUM overlap (both inspect state) | MEDIUM | Agent may pick either |
| 4 | `hivemind_runtime_command` ↔ `hivemind_hm_setting` — MEDIUM overlap (settings via two paths) | MEDIUM | Agent may use wrong path |
| 5 | Descriptions use jargon: "canonical authority", "runtime story", "bounded sub-session work" | MEDIUM | Agent may not understand when to use |
| 6 | Missing trigger phrases in most tool descriptions | HIGH | Agent doesn't know what prompts should trigger the tool |
| 7 | No per-action descriptions for multi-action tools | HIGH | Agent doesn't know which action to pick |

---

## AGENT-TOOL PERMISSION MATRIX

| Agent | Available Tools |
|-------|----------------|
| **hiveminder** | All hivemind_* tools |
| **hivefiver** | All hivemind_* tools |
| **hivemaker** | trajectory, task, doc, journal, runtime_status |
| **hivexplorer** | trajectory, doc, runtime_status, journal |
| **hiveq** | trajectory, task, doc, runtime_status, journal |
| **hiveplanner** | trajectory, task, contract, runtime_status, doc, journal |
| **architect** | trajectory, task, doc, runtime_status, contract, journal |
| **code-skeptic** | trajectory, task, doc, runtime_status, journal |
| **hitea** | trajectory, task, doc, runtime_status, journal |
| **hivehealer** | trajectory, task, doc, runtime_status, journal |
| **hiverd** | doc, runtime_status, trajectory, journal |
| **general** | trajectory, task, doc, runtime_status, journal |
| **explore** | doc, runtime_status, trajectory |
| **explore-small** | doc, runtime_status |

**Test with at least 3 different agents** to verify permission boundaries work correctly.

---

## SCORING RUBRIC

Score each tool 1-5 on each criterion after testing all scenarios.

| Criterion | Description | Score (1-5) |
|-----------|-------------|-------------|
| **Discoverability** | Does the agent find and pick the right tool from natural language? | |
| **Clarity** | Are descriptions clear about WHEN to use the tool? | |
| **Distinctiveness** | Is the tool clearly different from other tools? | |
| **Reliability** | Does the tool work without errors across scenarios? | |
| **Value Add** | Does the tool provide value over innate tools? | |
| **Granularity** | Is the tool at the right level of abstraction? | |
| **Chainability** | Can the tool be chained with other tools effectively? | |
| **Framework Fit** | Does the tool fit HiveMind's philosophy? | |

### Score Definitions

| Score | Meaning |
|-------|---------|
| **5** | Excellent — works perfectly, no issues, clearly better than alternatives |
| **4** | Good — minor issues, mostly works, small improvements needed |
| **3** | Acceptable — works but has noticeable issues, needs description fixes |
| **2** | Poor — frequently fails or confused with other tools, needs rework |
| **1** | Broken — doesn't work, actively harmful, should be removed |

---

## TOOL-LEVEL SCORES

Fill this table after completing all scenarios.

| Tool | Disc. | Clar. | Dist. | Rel. | Value | Gran. | Chain | Fit | **Avg** |
|------|-------|-------|-------|------|-------|-------|-------|-----|---------|
| `hivemind_task` | | | | | | | | | |
| `hivemind_trajectory` | | | | | | | | | |
| `hivemind_handoff` | | | | | | | | | |
| `hivemind_doc` | | | | | | | | | |
| `hivemind_runtime_status` | | | | | | | | | |
| `hivemind_runtime_command` | | | | | | | | | |
| `hivemind_journal` | | | | | | | | | |
| `hivemind_hm_init` | | | | | | | | | |
| `hivemind_hm_doctor` | | | | | | | | | |
| `hivemind_hm_setting` | | | | | | | | | |
| `hivemind_agent_work_create_contract` | | | | | | | | | |
| `hivemind_agent_work_export_contract` | | | | | | | | | |

---

## SESSION LOG

Record each test session here.

| # | Scenario | Agent | Result | Notes |
|---|----------|-------|--------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |
| 14 | | | | |
| 15 | | | | |
| 16 | | | | |
| 17 | | | | |
| 18 | | | | |
| 19 | | | | |
| 20 | | | | |
| 21 | | | | |
| 22 | | | | |
| 23 | | | | |
| 24 | | | | |
| 25 | | | | |
| 26 | | | | |
| 27 | | | | |
| 28 | | | | |
| 29 | | | | |
| 30 | | | | |
| 31 | | | | |
| 32 | | | | |
| 33 | | | | |
| 34 | | | | |
| 35 | | | | |
| 36 | | | | |
| 37 | | | | |
| 38 | | | | |
| 39 | | | | |
| 40 | | | | |

---

## REAL SESSION EVIDENCE (ses_2ba7)

Documented failures from actual session that should be reproduced:

| Observation | Details |
|-------------|---------|
| **50% doc tool failure rate** | 3 out of 6 `hivemind_doc` calls failed |
| **Heading confusion** | Agent tried `read` without `heading` — failed |
| **filePath vs dirPath** | Agent used `filePath` for `search` — failed |
| **Fallback to innate tools** | Agent fell back to glob/grep after HiveMind tool failures |
| **No tool chaining** | No successful tool chaining observed in the session |

**Reproduction steps:**
1. Start session with hiveminder
2. Ask agent to read a file using doc tool
3. Ask agent to search for content using doc tool
4. Observe failure rate and fallback behavior

---

## POST-EVAL ACTION ITEMS

After completing all scenarios, create action items for each tool that scored below 4.

| Tool | Score | Issue | Fix Priority | Action Item |
|------|-------|-------|--------------|-------------|
| | | | | |
| | | | | |
| | | | | |

---

## NOTES

- This eval is a **manual testing guide** — a human creates a branch, pastes prompts, and observes behavior
- Results should be committed to this file after each testing session
- Use the session log table to track progress through all 40 scenarios
- The scoring rubric helps prioritize which tools need description rewrites
- Known bugs should be reproduced and verified before fixing
