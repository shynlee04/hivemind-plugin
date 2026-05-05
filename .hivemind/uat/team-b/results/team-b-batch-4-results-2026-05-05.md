# UAT Team-B Batch 4 Results — CRUD Tools Deep Testing
**Date:** 2026-05-05
**Tester:** Team-B (blind end-user)
**Marker:** team-b

---

## Summary Table

| Test ID | Tool | Action(s) Tested | Result | Notes |
|---------|------|-----------------|--------|-------|
| 4a.1 | hivemind-agent-work-create | create with L3_STATIC_REVIEW | **PASS** | Full contract with pressure decision included |
| 4a.2 | hivemind-agent-work-export | export JSON | **PASS** | Complete contract round-trip |
| 4a.3 | hivemind-agent-work-export | export markdown | **PASS** | Human-readable markdown with all fields |
| 4b.1 | hivemind-trajectory | attach | **PASS** | Created trajectory with root session |
| 4b.2 | hivemind-trajectory | checkpoint | **PASS** | Checkpoint with summary, auto-generated ID |
| 4b.3 | hivemind-trajectory | event | **PASS** | Event with custom ID and type |
| 4b.4 | hivemind-trajectory | traverse | **PASS** | Returns full trajectory tree with edges |
| 4b.5 | hivemind-trajectory | close | **PASS** | Status→closed with closeSummary |
| 4c.1 | hivemind-pressure | detect | **PASS** | Tier 0, band steady, allow for delegate-task |
| 4c.2 | hivemind-pressure | inspect_tool_catalog | **PASS** | 16 tools cataloged with full pressure behavior |
| 4c.3 | hivemind-pressure | attach_event | **PASS** | Evidence attached to closed trajectory |
| 4d.1 | hivemind-command-engine | discover | **PASS** | Full command registry (output truncated at ~45K) |
| 4d.2 | hivemind-command-engine | analyze_contract | **PASS** | Contract validity, failure states, context needs |
| 4d.3 | hivemind-command-engine | render_context | **PASS** | Bounded context rendering with truncation control |
| 4d.4 | hivemind-command-engine | route_preview | **PASS** | Full route preview with pressure + contract + transform |
| 4d.5 | hivemind-command-engine | transform_messages | **PASS** | Message transformation with exclusion list |
| 4e.1 | configure-primitive | list commands | **PASS** | 18 commands listed with file paths |
| 4e.2 | validate-restart | verbose validation | **FAIL** | 14 cross-primitive errors, 15 runtime errors |

**Score: 17 PASS, 1 FAIL**

---

## Detailed Results

### 4a: hivemind-agent-work-create / hivemind-agent-work-export

**Create (L3_STATIC_REVIEW evidence level):**
- Contract ID: `awc_f89f610c-cf09-4067-85ac-90e055b59c5b`
- All fields preserved: taskBoundary, allowedSurfaces, dependencies, nonGoals, requiredProof, verificationCommands, anchors, sourceRefs
- Pressure decision embedded: tier=0, band=steady, outcome=allow
- Pressure behavior: steady→allow, advisory→advise, gated→require_approval, blocking→block
- Authority: state, mutatesState: true, canExecute: false, evidenceAttachment: trajectory-ledger

**Export JSON:**
- Complete contract round-trip with all nested objects
- Format: `{ contract: { id, status, owner, scope, evidence, compaction, createdAt, updatedAt } }`

**Export Markdown:**
- Human-readable with sections: Status, Owner, Task Boundary, Allowed Surfaces, Dependencies, Non-Goals, Evidence Contract, Compaction Preservation
- All fields present including reinjectionPayload (empty string)

### 4b: hivemind-trajectory Full CRUD

**attach:** Created `traj_uat_team_b_batch4` with rootSessionId, status=active, empty checkpoints/events/evidenceRefs
**checkpoint:** Auto-generated checkpoint ID, summary preserved, appended to checkpoints array
**event:** Custom eventId and eventType accepted, appended to events array
**traverse:** Returns `{ trajectories: [...], edges: [] }` — single trajectory, no parent-child edges (flat)
**close:** status→closed, closeSummary appended at trajectory level, checkpoints and events preserved

**Observation:** trajectory `attach_event` from pressure successfully wrote to a CLOSED trajectory — no guardrail preventing mutation of closed trajectories.

### 4c: hivemind-pressure Full Actions

**detect(delegate-task):** tier=0, band=steady, outcome=allow
**inspect_tool_catalog:** 16 tools cataloged:
| Tool | Authority | mutatesState | canExecute | evidenceAttachment |
|------|-----------|-------------|------------|-------------------|
| delegate-task | execute | true | true | execution-lineage |
| delegation-status | read | false | false | none |
| run-background-command | execute | false | true | execution-lineage |
| prompt-skim | read | false | false | none |
| prompt-analyze | read | false | false | none |
| session-patch | write | true | false | session-journal |
| session-journal-export | read | false | false | none |
| hivemind-doc | read | false | false | none |
| hivemind-trajectory | state | true | false | trajectory-ledger |
| hivemind-pressure | state | true | false | trajectory-ledger |
| hivemind-sdk-supervisor | read | false | false | none |
| hivemind-command-engine | read | false | false | none |
| hivemind-agent-work-create | state | true | false | trajectory-ledger |
| hivemind-agent-work-export | read | false | false | none |
| configure-primitive | write | true | false | execution-lineage |
| validate-restart | read | false | false | none |

**attach_event:** Successfully attached pressure evidence event to trajectory ledger.

### 4d: hivemind-command-engine Deep Actions

**analyze_contract(start-work):** valid=true, failureStates=[missing_command, invalid_contract, pressure_blocked, context_overflow], acceptsArguments=false, contextNeeds=[bounded-context, pressure-decision], outputShape=route-preview

**render_context(start-work, 5000 chars):** Renders bounded context JSON, truncated=false

**render_context(plan, 3000 chars):** Renders plan command context with workflowState, truncated=false

**route_preview(start-work):** Returns full route preview:
- executable=false (preview only)
- pressure: tier=0, steady→allow
- route: action=preview_only, filePath resolved, status=ready
- contract: same as analyze_contract
- context: rendered
- transform: messages with exclusions=[broad-system-transform, process-launch, command-execution]

**transform_messages(start-work, 2 messages):** Returns 3 messages (original 2 + extracted command), exclusions list preserved

### 4e: configure-primitive + validate-restart

**configure-primitive list:** 18 commands listed, file paths resolved, one warning:
- Invalid skill frontmatter in hm-l2-planning-persistence/SKILL.md: missing name+description fields

**validate-restart:** **FAIL** — 54 total issues found:
- 14 cross-primitive errors (commands reference non-existent agents)
- 24 cross-primitive warnings (agent description overlaps)
- 15 runtime errors (missing agent references)
- 1 load warning (invalid skill frontmatter)

**Missing agents referenced by commands:**
- `conductor` (6 commands: start-work, plan, sync-agents-md, ultrawork, harness-doctor)
- `hivefiver-orchestrator` (7 commands: hf-create, harness-audit, hf-stack, hf-absorb, hf-configure, hf-audit, hf-prompt-enhance)
- `researcher` (1 command: deep-research-synthesis-repomix)
- `hf-prompter` (1 command: hf-prompt-enhance-to-plan)

**Agent description overlaps (>50% keyword overlap):**
- hm-l2-test-router ↔ hm-l2-conductor
- hm-l2-test-router ↔ hf-l0-orchestrator
- hm-l2-test-router ↔ hm-l0-orchestrator
- hm-l2-conductor ↔ hm-l2-build
- hm-l2-conductor ↔ hf-l0-orchestrator
- hm-l2-build ↔ hf-l0-orchestrator
- hm-l2-build ↔ hm-l0-orchestrator
- hf-l0-orchestrator ↔ hm-l0-orchestrator

---

## Critical Findings

### CRITICAL-4.1: validate-restart — 14 Commands Reference Non-Existent Agents
**Severity:** HIGH
**Impact:** 14 of 18 commands (78%) will fail at runtime when dispatching to their configured agent
**Root Cause:** Agent definitions were renamed/restructured but command frontmatter still references old agent names
**Evidence:** validate-restart verbose output listing all 14 cross-primitive + 15 runtime errors

### FINDING-4.2: Trajectory Mutation on Closed State
**Severity:** LOW
**Impact:** hivemind-pressure attach_event successfully wrote to a trajectory with status=closed
**Root Cause:** No guardrail checking trajectory status before mutation
**Evidence:** Event `pressure_test_batch4` attached after trajectory close action

### FINDING-4.3: Invalid Skill Frontmatter
**Severity:** MEDIUM
**Impact:** hm-l2-planning-persistence/SKILL.md has missing name+description fields
**Root Cause:** Skill was renamed/disabled (directory renamed to donotusethis-*) but frontmatter not updated
**Evidence:** configure-primitive list warning + validate-restart load warning

---

## Statistics

| Metric | Value |
|--------|-------|
| Tools tested | 8 (agent-work-create, agent-work-export, trajectory, pressure, command-engine, sdk-supervisor, configure-primitive, validate-restart) |
| Actions tested | 25 |
| PASS | 17 |
| FAIL | 1 (validate-restart — configuration drift, not tool malfunction) |
| Critical findings | 1 |
| Low findings | 1 |
| Medium findings | 1 |
| Total issues logged | 3 |

---

## Contract IDs
- Work contract: `awc_f89f610c-cf09-4067-85ac-90e055b59c5b`
- Trajectory: `traj_uat_team_b_batch4`
- Checkpoint: `checkpoint-091064c8-dc93-4cf5-b216-8eb1a72109b9`
- Events: `evt_batch4a_complete`, `pressure_test_batch4`
