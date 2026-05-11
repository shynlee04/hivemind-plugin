# Reference 04: Delegation Chain

> **Jump targets:** [ref-04 §1]–[ref-04 §5]

## §1 — Hierarchy & Dispatch Rules

### Hierarchy (non-negotiable)

```
L0 (Orchestrator) → L1 (Coordinator) → L2 (Specialist) → [L3 conditional]
```

### Dispatch Rules

| From | To | Allowed | When |
|------|----|---------|------|
| L0 | L1 | ALWAYS | All complex tasks |
| L0 | L2 | **NEVER** | Except explicit user override |
| L1 | L2 | ALWAYS | Domain-specific work |
| L2 | L3 | CONDITIONAL | Deep research, synthesis, stack reference |

### Delegation Loading Order

```
1. L0 classifies lineage and domain
2. L0 dispatches L1 coordinator with task domain and expected specialist type
3. L1 maps domain to specific L2 specialist
4. L1 dispatches L2 with full task envelope
5. L1 monitors, integrates, quality-gates, verifies
6. L1 reports back to L0
```

### Delegation Task Envelope Format

```
Task tool (<specialist>):
  description: "Task N: [name]"
  prompt: |
    You are [role]. Your task: [FULL TASK TEXT]

    ## Context
    [Scene-setting — where this fits, why it matters]

    ## Scope
    - Include: [specific files/paths]
    - Exclude: [what NOT to touch]

    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - [Specific output requirements]
```

**NEVER pass session history to subagents. Construct exact context.**

## §2 — Delegation Records & Verification

### Before Dispatch Verification

```
1. For each delegation, check session-continuity.json:
   - Is there already an active child for this domain?
   - If yes → RESUME, don't create new.

2. After dispatch, the session-tracker hook captures:
   - task_id (= child session ID)
   - agent_type (= delegatedBy)
   - depth (= parent depth + 1)

3. When child returns, status updates to "completed" or "error"
```

### Resume Discipline

```
DISCONNECTED? → Read project-continuity.json → find active → resume with task_id

NEVER: "Let me start a new delegation for this."
ALWAYS: "Let me check if there's an aborted delegation to resume."
```

### Child Output Status Protocol

| Status | Meaning | Action |
|--------|---------|--------|
| DONE | Complete, verified | Accept → quality gates → report |
| DONE_WITH_CONCERNS | Complete but doubts | Read concerns → address if correctness, note if observation |
| NEEDS_CONTEXT | Knowledge gap | Provide context → re-dispatch |
| BLOCKED | Cannot proceed | Assess: context? model? size? plan? → escalate if needed |

### Two-Stage Review After Child Return

1. **Stage 1: Spec Compliance** — Does output match requirements? Nothing extra? Nothing missing?
2. **Stage 2: Code Quality** — Well-built? Clean? Following patterns?

**Stage 1 MUST pass before Stage 2.**

## §3 — L0 Orchestrator Routing Logic

```
1. Receive task
2. Classify lineage (hm-* or hf-*) → [ref-01 §1]
3. Classify domain within lineage → [ref-01 §2] or [ref-01 §3]
4. Select L1 coordinator:
   - hm-* tasks → hm-l1-coordinator
   - hf-* tasks → hf-l1-coordinator
5. Dispatch with:
   - Task domain
   - Expected L2 specialist type
   - Required quality gates
   - Context budget
6. L1 coordinator maps domain to specific L2 specialist
7. L1 dispatches L2 with task envelope
8. L1 monitors, integrates, verifies
```

### Example: "Audit the session-tracker module"

```
L0: "audit" + "session-tracker module" → hm-* lineage, Audit domain
L0 → hm-l1-coordinator: "Audit session-tracker module, expect hm-l2-auditor"

L1: Session-tracker → source code audit → hm-l2-auditor
L1 → hm-l2-auditor: task envelope with scope, context, verification

L2: Runs code review, produces AUDIT.md
L1: Runs quality gate triad on AUDIT.md → PASS → accepts
L1 → L0: "Audit complete. 12 flaws found."

L0: Reports to user
```

### Example: "Create a skill for session-tracker recovery"

```
L0: "create" + "skill" → hf-* lineage, Skill Authoring domain
L0 → hf-l1-coordinator: "Create skill for session-tracker recovery, expect hf-l2-skill-builder"

L1: Skill authoring → hf-l2-skill-builder
L1 → hf-l2-skill-builder: task envelope with skill name, domain, trigger phrases

L2: Drafts SKILL.md + references/ in .hivefiver-meta-builder/skills-lab/
L1: Runs quality gate triad → PASS → accepts
L1 → L0: "Skill created."

L0: Reports to user, syncs to .opencode/skills/ if needed
```

## §4 — Depth Limits & Concurrency

### Depth Rules

- Max depth: 3 (L0→L1→L2→[L3 conditional])
- L3 depth is reserved for: deep research chains, synthesis pipelines, stack reference lookup
- L2 specialists do NOT spawn further delegations (they are terminal executors)

### Concurrency Rules

- Max 2 parallel tasks per L1 coordinator
- Sequential dispatch for all other cases
- On resume, re-serialize parallel children → resume sequentially, one at a time

## §5 — Delegation Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fresh Starter** — creates new session when aborted exists | New session ID appears while active children exist | Check project-continuity.json before every new session |
| **The Prompt Repeater** — repeats original prompt on resume | Child agent receives duplicate user text | Use task_id resume — context is preserved, no prompt needed |
| **The Layer Skipper** — L0 dispatches directly to L2 | No L1 in delegation chain | Insert L1 coordinator |
| **The Gate Skipper** — accepts child output without quality gates | No gate skill loaded before accepting | Load gate triad → [ref-05 §1] |
| **The Context Hog** — reads full 7000-line session .md | Full read on .md file >1000 lines | grep + offset only → [ref-03 §2] |
| **The Multi-Loader** — loads 5+ skills at once | >3 Load Skill calls in one turn | Cascade loading: router first, then domain |
| **The Silent Crosser** — loads hm-* skills without documenting | hm-* skill loaded by hf-* agent without justification | Add to Cross-Lineage Access log |
| **The Context Polluter** — passing session history to subagent | Subagent prompt includes "earlier in conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path | Paste full task text into the prompt. Always. |
| **The Hallucinator** — inventing architecture | Making assumptions without evidence | Ground in lineage. Read session exports. Verify with grep. |
