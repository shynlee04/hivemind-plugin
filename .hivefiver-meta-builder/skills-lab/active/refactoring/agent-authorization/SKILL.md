---
name: agent-authorization
description: Authorization framework for agent creation with checkpoint gates. Use when authorizing agent creation, creating agent guardrails, defining specialist agent profiles, or setting up authorization checkpoints before agent dispatch. Triggers: "authorize agent creation", "create agent guardrails", "specialist agent profile", "checkpoint gate", "authorization gate for agents"
version: 1.0.0
metadata:
  layer: "domain-execution"
  role: "domain-execution"
  pattern: "P2"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Agent Authorization Framework

## First Action

When a user requests agent authorization, immediately load `references/gates.md` for the gate structure and specialist profiles. Run the authorization checklist before proceeding.

## Authorization Workflow

```
[Task Request] → [Gate 1: Skills Check] → [Gate 2: Specialist Check] → [Gate 3: Capability Match] → [Gate 4: Scope Definition] → [Checkpoint: Human Verify] → [Agent Creation]
```

### Authorization Checklist

Complete each gate before proceeding to the next:

- [ ] **Gate 1:** Sufficient skills loaded for the task domain (typically 2-4)
- [ ] **Gate 2:** At least 2 specialist subagents available for the task domain
- [ ] **Gate 3:** Task matches specialist capabilities
- [ ] **Gate 4:** File paths and scope defined
- [ ] **Checkpoint:** Human verification (for blocking gates)

## Gate Definitions

### Gate 1: Skills Loaded Check

**Purpose:** Ensure the session has enough context to author an agent.

**Criteria:**
- Sufficient skills loaded from `.opencode/skills/` for the task domain (typically 2-4)
- Skills cover the relevant domain for the task

**If Gate 1 fails:**
```
⚠️ GATE 1 BLOCKED: Insufficient skills loaded
Required: Sufficient skills for task domain (typically 2-4)
Loaded: {count}
Action: Load additional skills before proceeding
```

### Gate 2: Specialist Availability Check

**Purpose:** Verify specialist subagents are available for the task domain.

**Criteria:**
- At least 2 specialist profiles defined for the task domain
- Specialists match task requirements

**If Gate 2 fails:**
```
⚠️ GATE 2 BLOCKED: Insufficient specialists available
Required: At least 2 specialists for task domain
Available: {count}
Action: Define additional specialist profiles
```

### Gate 3: Capability Match Check

**Purpose:** Ensure the task aligns with specialist capabilities.

**Criteria:**
- Task intent matches at least one specialist profile
- No capability gaps in the delegation chain

**If Gate 3 fails:**
```
⚠️ GATE 3 BLOCKED: Task capability mismatch
Task: {task_description}
Specialists: {specialist_list}
Action: Refine task scope or define new specialist profile
```

### Gate 4: Scope Definition Check

**Purpose:** Confirm file paths and task boundaries are defined.

**Criteria:**
- Target file paths identified
- Task scope written in a scope document (conventionally `task_plan.md` if the planning-with-files skill is loaded, or any documented scope file)

**If Gate 4 fails:**
```
⚠️ GATE 4 BLOCKED: Scope not defined
Required: File paths + task scope in a scope document (conventionally task_plan.md)
Action: Document scope before proceeding
```

## Checkpoint Types

### Human-Verification Checkpoint (Blocking)

Requires explicit user approval before proceeding:

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <description>Agent creation requires human approval</description>
  <prompt>Authorize creation of [agent-type] for [task]?</prompt>
  <options>
    <option id="approve">
      <name>Approve</name>
      <action>Proceed with agent creation</action>
    </option>
    <option id="reject">
      <name>Reject</name>
      <action>Cancel agent creation</action>
    </option>
    <option id="modify">
      <name>Modify</name>
      <action>Adjust agent parameters before approval</action>
    </option>
  </options>
</task>
```

### Decision Checkpoint

For autonomous decisions within defined parameters:

```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <options>
    <option id="option-a">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
  </options>
</task>
```

### Human-Action Checkpoint

Requires human to perform an action before proceeding:

```xml
<task type="checkpoint:human-action" gate="blocking">
  <action_required>[Action human must perform]</action_required>
  <prerequisite>[What must be true first]</prerequisite>
</task>
```

## Gate Prompt Templates

### Authorization Request (Yes/No)

```
[AGENT] requests authorization to create [agent-type] for: [task]
─────────────────────────────────────────────────────────────
Specialist: [profile-name]
File paths: [paths]
Estimated complexity: [low|medium|high]
─────────────────────────────────────────────────────────────
Authorize? (yes/no/cancel)
```

### Checkpoint Prompt

```
⛩ CHECKPOINT REACHED: [checkpoint-name]
─────────────────────────────────────────────────────────────
[description of what's being authorized]
─────────────────────────────────────────────────────────────
Options:
  1. Approve - proceed with [action]
  2. Reject - cancel and return to planning
  3. Modify - adjust parameters before approval
─────────────────────────────────────────────────────────────
Choice:
```

## Specialist Profiles

> **Discovery note:** Specialist names are project-specific. Check `.opencode/agents/` for available specialists in your project. The names below are examples from the Hivefiver project.

| Specialist | Capabilities | Authorization Level |
|------------|--------------|-------------------|
| `hivefiver-skill-author` | Creates/audits/repairs skills, SKILL.md authoring | HIGH - requires Gate 1-4 + human verify |
| `hivefiver-agent-builder` | Creates agent definitions with YAML frontmatter | HIGH - requires Gate 1-4 + human verify |
| `hivefiver-command-builder` | Creates commands with $ARGUMENTS, !bash safety | HIGH - requires Gate 1-4 |
| `builder` | Atomic implementation, reads before writes | MEDIUM - requires Gate 1-3 |
| `critic` | Quality verification, correctness validation | LOW - requires Gate 1-2 |

## Specialist Capability Matrix

| Task Type | Recommended Specialist | Gate Requirements |
|-----------|----------------------|-------------------|
| Create new skill | `hivefiver-skill-author` | G1, G2, G3, G4, HUMAN-VERIFY |
| Audit existing skill | `hivefiver-skill-author` | G1, G2, G3 |
| Create agent definition | `hivefiver-agent-builder` | G1, G2, G3, G4, HUMAN-VERIFY |
| Create command | `hivefiver-command-builder` | G1, G2, G3, G4 |
| Implementation task | `builder` | G1, G2, G3 |
| Review/verification | `critic` | G1, G2 |
| Unknown/general | Check `.opencode/agents/` for a router or use the orchestrator | G1, G2 |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Bypassing Gates** | Skipping Gate 3-4 for speed | Always run full gate sequence |
| **Empty Checkpoints** | Human verify with no options | Provide clear approve/reject/modify options |
| **Scope Creep** | Gate 4 repeatedly failing | Break task into smaller scoped units |
| **Wrong Specialist** | Task not matching profile | Use capability matrix to re-select |

## Validation

After authorization is complete:

1. Confirm all gates passed with timestamps in `task_plan.md`
2. Log checkpoint decisions
3. Record specialist selected and rationale
4. Document any gate overrides with justification

## Reference Files

- `references/gates.md` — Full gate structure, checkpoint types, prompt templates, specialist profiles
