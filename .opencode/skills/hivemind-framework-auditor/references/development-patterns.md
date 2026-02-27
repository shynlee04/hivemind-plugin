# Development Patterns — GREEN-FLAG Entity Design

> Load this reference in Mode 2 (EVALUATE) for pattern-matching, and Mode 5 (REFACTOR) for restructuring.
> For Mode 2: load ONLY the section relevant to the entity type being evaluated.

---

## Table of Contents

1. [Command Design Pattern](#1-command-design-pattern)
2. [Workflow Design Pattern](#2-workflow-design-pattern)
3. [Skill Design Pattern](#3-skill-design-pattern)
4. [Delegation Packet Contract](#4-delegation-packet-contract)
5. [Deviation Classification](#5-deviation-classification-r1-r4)

---

## 1. Command Design Pattern

A GREEN-FLAG command has these characteristics. Compare target commands against this template.

### Required Frontmatter Fields

```yaml
---
name: hivemind:command-name           # namespace:action format
description: One-line what + when     # Agent sees this for discovery
argument-hint: [what user provides]   # Guides user input
owner_agent: hiveminder               # Who owns this command
kind: router                          # ALWAYS router for core commands
execution_context: workflows/name.yaml  # Links to workflow — MANDATORY
required_skills:
  - relevant-skill-bundle             # Only bundles this command needs
required_templates:
  - templates/output-format.md        # Output structure
required_references:
  - references/domain-knowledge.md    # Domain context
required_prompts:
  - prompts/instruction-format.md     # Formatted instructions
chain_group: hiveminder               # Chaining namespace
group: hiveminder                     # Display group
entry_gate: session_declared          # Precondition check
---
```

### Required Body Structure

```markdown
<objective>
WHAT this command achieves (2-3 lines).
WHY it uses subagent isolation if applicable (context burn reason).
</objective>

<context>
User input: $ARGUMENTS

```bash
# Deterministic context check FIRST — never rely on agent memory
HIERARCHY_STATUS=$(scan_hierarchy --action status --json)
ACTIVE_PLAN=$(recall_mems --query "active plan" --limit 1)
```
</context>

<process>
## 0. Initialize Context (DETERMINISTIC)
# Check hierarchy before any action; declare if missing

## 1. Gate Check
# Verify prerequisites. If not met, STOP with actionable message.

## 2. Prepare Delegation (if sub-agent needed)
# Read required files. Construct delegation packet.

## 3. Execute or Delegate
# Inline execution OR Task() with full packet.

## 4. Handle Result
# Parse structured return. Update hierarchy. Report to user.
</process>

<success_criteria>
- [ ] Hierarchy verified before action
- [ ] Context loaded from STATE.md / recall_mems
- [ ] Delegation packet has scope + constraints + return format
- [ ] Result updates trajectory / planning artifacts
</success_criteria>
```

### RED FLAGS in Commands

- Missing `execution_context` → command runs without workflow guardrails
- Missing `required_skills` → no progressive disclosure control
- No `<context>` bash checks → agent relies on memory instead of filesystem
- No `<success_criteria>` → no way to verify command completed correctly
- Body references files by assumption → should use `[ -f path ]` checks

---

## 2. Workflow Design Pattern

Two tiers based on complexity.

### Tier 1 — Orchestration (hiveminder only)

7-10 steps with domains, hierarchy management, gatekeeping, result_handling, timeouts.

```yaml
contract_version: 2
name: orchestration-workflow-name
target_agent: hiveminder
description: "High-level orchestration: what it coordinates"
version: 1
domains:
  - context-governance
  - delegation
  - quality-assurance
steps:
  - name: initialize-context
    description: "Load hierarchy, verify trajectory, set scope"
    tool: hivemind_session
    wave: 1
    skill_bundles: [governance-core]
    args:
      action: status
    entry_criteria: "Session exists"
    exit_criteria: "Hierarchy loaded, trajectory confirmed"

  - name: delegate-work
    description: "Dispatch to target agent with full packet"
    tool: task
    wave: 2
    skill_bundles: [governance-core]
    args:
      subagent_type: target-agent
    entry_criteria: "Scope and constraints defined from step 1"
    exit_criteria: "Sub-agent returns structured result"

  - name: validate-result
    description: "Check result against acceptance criteria"
    tool: hivemind_inspect
    wave: 3
    skill_bundles: [verification-core]
    args:
      action: scan
    entry_criteria: "Sub-agent result received"
    exit_criteria: "Result passes all acceptance criteria"

guards:
  - rule: session_active
    check: "hierarchy.trajectory exists"
  - rule: scope_bounded
    check: "delegation_packet.scope.in_scope_paths is non-empty"
```

### Tier 2 — Persona/Utility (all other agents)

4-6 steps, minimal schema. Used by hivemaker, hivexplorer, hiveq, etc.

```yaml
contract_version: 2
name: utility-workflow-name
target_agent: hivemaker
description: "One-line: what this workflow does"
version: 1
steps:
  - name: step-name
    description: "What this step does — specific enough to verify"
    tool: tool-name
    wave: 1
    skill_bundles:
      - relevant-bundle              # ONLY what this step needs
    args:
      action: do_thing
    entry_criteria: "Precondition that MUST be true"
    exit_criteria: "Postcondition that MUST be verifiable"

guards:
  - rule: guard_name
    check: condition_to_verify       # Deterministic check
```

### RED FLAGS in Workflows

- Missing `contract_version: 2` → v1 workflows lack guard enforcement
- Missing `target_agent` → unclear who executes this workflow
- Steps without `skill_bundles` → triggers D-02 (skill avalanche) or D-15 (unrouted skill)
- Steps without `entry_criteria` → triggers D-13 (broken chain)
- Same `wave` number for dependent steps → they'll run in parallel when they need sequential
- Guards with vague `check` values → can't be programmatically verified

---

## 3. Skill Design Pattern

Following Pattern 2 (domain organization) + Pattern 3 (conditional details) hybrid.

### Directory Structure

```
skill-name/
├── SKILL.md                        # REQUIRED: <500 lines
│   ├── frontmatter: name + description (ALWAYS in context, ~100 tokens)
│   └── body: Mode router + core workflows + "READ THIS WHEN" pointers
├── scripts/                        # Deterministic bash/python
│   └── check-something.sh          # Executed without reading into context
├── references/                     # Domain knowledge (on-demand)
│   ├── domain-a.md                 # Loaded ONLY when skill routes to domain A
│   └── domain-b.md                 # Loaded ONLY when skill routes to domain B
└── assets/                         # Templates for output
    └── output-template.md          # Used in output, not read into context
```

### SKILL.md Template

```markdown
---
name: skill-name
description: "WHAT it does + WHEN to use it + trigger KEYWORDS. Use when [specific conditions]. Triggers on: [searchable terms]."
---

# Skill Name

## Purpose
One-sentence: what problem this skill solves.

## Router (if multi-domain)
Decision tree routing to the correct reference file.

## Core Workflow
Minimal steps for the default/common case.

## Reference Index
| File | Lines | Load When | Do NOT Load When |
|---|---|---|---|
| references/a.md | ~N | [condition] | [counter-condition] |

## NEVER Do
- Specific anti-patterns with WHY
```

### Key Principles

1. **Description = trigger**: ALL agents see ONLY the description until the skill activates. Be specific about WHEN.
2. **Body = router + minimal instructions**: If >500 lines, split into references.
3. **References = on-demand with explicit triggers**: Include "MANDATORY — READ" and "Do NOT Load" guidance.
4. **Scripts = deterministic**: Never rely on agent to "write the same bash every time" — bundle it.
5. **Assets = output templates**: Used in output, never read into context window.

### RED FLAGS in Skills

- Description says WHAT but not WHEN → skill may never trigger
- Body >500 lines without references → context bloat when triggered
- References listed but no loading guidance → agent either loads all (D-02) or none
- No "NEVER Do" section → agent applies skill incorrectly without guardrails
- Script logic written inline in body → agent may rewrite it differently each time

---

## 4. Delegation Packet Contract

Every `Task()` call MUST include these fields. Incomplete packets trigger D-07, D-10, D-11, D-12.

```yaml
delegation_packet:
  # Identity
  intent_id: "UUID linking to active trajectory"
  source_command: "command that initiated this"

  # Chain awareness
  delegation_source: "agent"          # vs "human" — sub-agent MUST know
  delegation_depth: 1                 # How many levels deep
  parent_agent: "hiveminder"          # Who delegated
  parent_context_summary: "2-3 lines of what parent knows and why this task exists"

  # Routing
  target_agent: "hivemaker"
  target_workflow: "workflows/example.yaml"
  skills_to_load:
    - specific-skill-bundle           # NOT "all skills"

  # Boundaries
  scope:
    in_scope_paths:
      - "path/to/specific/file.ts"
    out_of_scope_paths:
      - "src/**"                      # Everything else OFF LIMITS
  constraints:
    - "Do NOT modify any file outside in_scope_paths"
    - "Do NOT run npm install"
    - "Do NOT create new files without explicit path"

  # Success definition
  success_metrics:
    - "File X exists with function Y exported"
    - "npx tsc --noEmit passes"
  acceptance_criteria: "One-sentence: what MUST be true when done"

  # Evidence
  required_evidence:
    - "git diff showing changes"
    - "test output showing pass"

  # Failure handling
  failure_policy: "STOP and return error — do NOT attempt workaround"

  # Return contract
  return_schema:
    format: "structured"
    fields:
      - status: "success | partial | failure"
      - files_modified: "string[]"
      - evidence: "string"
      - issues: "string[]"
```

### Minimum Viable Packet (for simple delegations)

Even "quick" delegations need at minimum:

```yaml
delegation_packet:
  delegation_source: "agent"
  target_agent: "agent-name"
  scope:
    in_scope_paths: ["path/to/file"]
  constraints: ["Do NOT modify other files"]
  success_metrics: ["Specific measurable outcome"]
  return_schema:
    fields: [status, evidence]
```

---

## 5. Deviation Classification (R1-R4)

Adapted from GSD's deviation rules. When agents encounter unplanned situations during execution:

| Rule | Trigger | Action | Permission |
|---|---|---|---|
| **R1: Bug** | Broken behavior, type errors, crashes, security holes | Fix → test → verify → track `[R1-Bug]` | Auto |
| **R2: Missing Critical** | Missing error handling, validation, auth, rate limiting | Add → test → verify → track `[R2-Critical]` | Auto |
| **R3: Blocking** | Missing deps, wrong types, broken imports, missing config | Fix blocker → verify → track `[R3-Blocking]` | Auto |
| **R4: Architectural** | New schema, switching libs, breaking API, new service | **STOP → present decision → get approval** | Ask user |

**Priority**: R4 (STOP) > R1-R3 (auto) > unsure → R4

**Decision tree**:
```
Encounter unplanned situation
├── Is it a bug/crash/security issue? → R1 (fix immediately)
├── Is critical functionality missing? → R2 (add immediately)
├── Does it block progress? → R3 (unblock and continue)
├── Does it change architecture/contracts? → R4 (STOP and ask)
└── Unsure which rule applies? → R4 (STOP and ask — always safe)
```

**Tracking format**: Add `[R1-Bug]`, `[R2-Critical]`, `[R3-Blocking]`, or `[R4-Architectural]` prefix to commit messages and session notes for traceability.
