---
name: hm-l3-subagent-delegation-patterns
description: Document and apply subagent delegation patterns for OpenCode. Use when dispatching subagents, resuming interrupted sessions, implementing checkpoint protocols, or designing wave-based execution. NOT for general task planning or project inspection.
metadata:
  layer: "3"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

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

When a session disconnects or you need to stack new work onto an existing session:

1. **DO NOT create new tasks** — resume or stack onto the existing session
2. Use the session ID from the previous `task` call or any completed session
3. **NEVER inject the session ID into the prompt text** — that creates an independent session with no hierarchy connection. Always pass it as a **parameter**:
   - **`task` tool:** set `task_id` = session ID → attaches new subagent as child of that session  
     *(works for both resume of incomplete work and stack-on of completed work)*
   - **`delegate-task` tool:** pass `context` = `{"parentSessionId": "<session-id>"}` → same effect
4. The prompt itself stays **simple** — context from the target session is preserved through the session chain. No need to re-describe old work.
5. This is the same principle as `subagent_type`/`agent`: the parameter selects the handler/session, not the prompt text.
6. Check `.planning/phases/NN-name/SUMMARY.md` for completion status
7. Re-query plan index to get incomplete plans
8. Re-execute only incomplete plans

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
