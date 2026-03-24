---
name: skill-conflict-detect
description: "Use when auditing a skill pack for internal conflicts, validating new skills against the existing ecosystem, resolving conflicting advice when multiple skills are loaded, running pre-merge compatibility checks, or diagnosing any situation where skill overlap causes confusion or contradictory behavior."
---

# skill-conflict-detect

## Purpose

- Detect overlapping skill responsibilities (two skills claiming the same concern)
- Find contradictory instructions between loaded skills
- Identify shared state mutation conflicts
- Flag boundary violations between skill domains
- Provide resolution strategies for each conflict type
- Produce conflict reports with evidence and severity ratings

## Use This For

- Auditing a skill pack for internal conflicts before deployment
- Validating a new skill against the existing skill ecosystem
- Resolving conflicting advice when multiple skills are loaded simultaneously
- Pre-merge skill compatibility checks in CI or review workflows
- Diagnosing confusion or contradictory behavior caused by skill overlap
- Periodic ecosystem health scans as the skill pack grows

## Do Not Use This For

- Skill quality scoring (use `hivemind-skill-doctor`)
- Universal design validation (use `skill-universal-design`)
- Agent role boundary enforcement (use `agent-role-boundary`)
- Skill creation mechanics (use `use-hivemind-skill-writer`)
- Skill authoring conventions (use `hivemind-skill-write`)

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `hivemind-skill-doctor` | Overall skill quality auditing — references conflict detection but delegates depth to this skill |
| `skill-universal-design` | Universal design — this skill detects conflicts arising from non-universal or platform-locked patterns |
| `agent-role-boundary` | Role enforcement — role conflicts are a subtype of skill conflict that this skill can surface |
| `use-hivemind-delegation` | Delegation — delegation conflicts (circular dispatches, overlapping subagent claims) detected by this skill |
| `use-hivemind-skill-writer` | Skill creation — new skills should pass conflict detection before being authored |

## Prerequisites

- At least 2 skills loaded or available for comparison
- `hivemind-skill-doctor` loaded for overall quality context (optional but recommended)
- Access to SKILL.md files for each skill under analysis (filesystem or context)

## Conflict Taxonomy

### Type 1: Scope Overlap

Two skills claim responsibility for the same concern. The user has no clear signal which skill to activate.

**Detection signature:** The "Use This For" section of skill A and skill B describe the same scenario, trigger, or outcome.

| Example | Skills Involved |
|---------|-----------------|
| Both skills claim "audit skill quality" | `hivemind-skill-doctor` + hypothetical `skill-quality-analyzer` |
| Both skills claim "manage git operations" | `hivemind-atomic-commit` + hypothetical `git-manager` |

**Severity:** HIGH — user receives contradictory activation signals or loads redundant skills.

### Type 2: Contradictory Instructions

Skill A says do X. Skill B says do Y. Both address the same situation or decision point.

**Detection signature:** Decision rules, "must" statements, or workflow steps produce opposing guidance when applied to the same scenario.

| Example | Conflict |
|---------|----------|
| Skill A: "Always commit after every change" vs Skill B: "Batch changes before committing" | Opposing workflow guidance |
| Skill A: "Max 3 skills active" vs Skill B: "Load all domain skills at session start" | Contradictory stacking rules |

**Severity:** CRITICAL — agent behavior becomes non-deterministic depending on which skill was loaded last.

### Type 3: Shared State Conflict

Two skills mutate the same files, JSON keys, or runtime state without coordination.

**Detection signature:** Both skills write to the same path (e.g., `.hivemind/activity/state/*.json`), same JSON key, or same environment variable.

| Example | Conflict |
|---------|----------|
| Both skills write to `.hivemind/activity/state/active-context.json` | Uncoordinated file writes |
| Both skills set `HIVEMIND_PHASE` environment variable | Conflicting env mutation |

**Severity:** CRITICAL — last writer wins, prior state is silently overwritten.

### Type 4: Boundary Violation

Skill A encroaches on skill B's declared domain. Skill A's workflow steps perform actions that skill B explicitly owns.

**Detection signature:** Skill A's "Use This For" or workflow steps include actions that fall within skill B's "Purpose" or "Independence Rules" boundary.

| Example | Conflict |
|---------|----------|
| A delegation skill includes code quality checks in its workflow | Encroaches on `hivemind-skill-doctor` territory |
| A commit skill includes role boundary enforcement | Encroaches on `agent-role-boundary` territory |

**Severity:** MEDIUM — skill works but creates ownership confusion and maintenance risk.

### Type 5: Dependency Cycle

Skill A depends on Skill B. Skill B depends on Skill A. Neither can be activated without the other already being active.

**Detection signature:** Both skills list each other in Prerequisites, Sibling Skills with "required" relationship, or workflow steps that load the other skill.

| Example | Conflict |
|---------|----------|
| Skill A prerequisites Skill B; Skill B prerequisites Skill A | Circular activation dependency |
| Skill A workflow Step 3 loads Skill B; Skill B workflow Step 2 loads Skill A | Circular workflow dependency |

**Severity:** HIGH — neither skill can complete its workflow in isolation.

## Detection Methodology

### Step 1: Scope Mapping

Map each skill's declared scope from its SKILL.md.

**For each skill, extract:**

| Field | Source Section | Purpose |
|-------|---------------|---------|
| `triggers` | Description frontmatter | What activates this skill |
| `concerns` | Purpose | What this skill owns |
| `allowed_scenarios` | Use This For | Scenarios this skill claims |
| `excluded_scenarios` | Do Not Use This For | Scenarios explicitly rejected |
| `state_mutations` | Workflow steps, Independence Rules | What files/state this skill writes |
| `dependencies` | Prerequisites, Sibling Skills | What other skills are needed |

**Output:** A scope map per skill as structured data.

### Step 2: Overlap Analysis

Intersect scope maps to find potential conflicts.

**Algorithm:**

```
for each pair (skill_A, skill_B):
  overlap = skill_A.allowed_scenarios ∩ skill_B.allowed_scenarios
  if overlap is non-empty:
    flag POTENTIAL_SCOPE_OVERLAP (Type 1)

  contradiction = compare_decision_rules(skill_A, skill_B, overlap)
  if contradiction found:
    flag CONTRADICTORY_INSTRUCTION (Type 2)

  shared_state = skill_A.state_mutations ∩ skill_B.state_mutations
  if shared_state is non-empty:
    flag SHARED_STATE_CONFLICT (Type 3)

  violation = skill_A.workflow_actions ∩ skill_B.purpose
  if violation found:
    flag BOUNDARY_VIOLATION (Type 4)

  if skill_A ∈ skill_B.dependencies AND skill_B ∈ skill_A.dependencies:
    flag DEPENDENCY_CYCLE (Type 5)
```

**Output:** List of flagged pairs with conflict type and evidence.

### Step 3: Instruction Comparison

For each flagged overlap pair, compare decision rules.

**What to compare:**

- "Must" / "Must not" / "Shall" / "Shall not" prescriptive statements
- Workflow steps that produce different actions for the same input scenario
- "Do Not Use This For" entries that contradict the other skill's "Use This For"
- Precedence rules or escalation chains that conflict

**Decision rule extraction pattern:**

1. Find all imperative statements in each skill's workflow
2. Categorize by trigger scenario
3. For overlapping scenarios, check if resulting actions differ
4. If they differ, classify as Type 2 (Contradictory Instructions)

**Output:** Contradiction report with the conflicting statements and the shared scenario.

### Step 4: State Audit

Check for shared state mutation conflicts.

**What to audit:**

| State Surface | Detection Method |
|---------------|-----------------|
| File paths | Compare all file paths referenced in workflow steps and Independence Rules |
| JSON keys | Compare JSON structures emitted by each skill (activity records, gate results, etc.) |
| Environment variables | Compare env vars set or read by each skill |
| Runtime directories | Compare directory paths (`.hivemind/`, `.opencode/`, etc.) used for writes |

**Conflict criteria:** Two skills write to the same surface without a coordination protocol (e.g., one writes, one reads; or both write with different schemas).

**Output:** Shared state conflict list with the conflicting surfaces and skills involved.

### Step 5: Resolution

For each detected conflict, apply a resolution strategy.

**Resolution decision tree:**

```
if conflict is Type 1 (Scope Overlap):
  if one skill is more specific → SPECIALIZE: narrow the general skill's scope
  if both are equally specific → MERGE: combine into one skill or CLARIFY: add explicit boundary declarations
  if overlap is intentional (e.g., skill loads another) → PRECEDENCE: declare which activates first

if conflict is Type 2 (Contradictory Instructions):
  if one instruction is newer → DEPRECATE: mark the older instruction as superseded
  if both are valid in different contexts → CONTEXTUALIZE: add context guards to each skill
  if neither can be reconciled → ESCALATE: surface to orchestrator for human decision

if conflict is Type 3 (Shared State Conflict):
  if one skill only reads → COORDINATE: declare reader/writer relationship
  if both write → PARTITION: split state surfaces (different files or keys)
  if writes are sequential → ORDER: declare execution order dependency

if conflict is Type 4 (Boundary Violation):
  if violation is incidental → REMOVE: strip the violating action from the encroaching skill
  if violation is structural → RELOCATE: move the action to the owning skill
  if ownership is ambiguous → CLARIFY: add explicit ownership declaration

if conflict is Type 5 (Dependency Cycle):
  if one dependency is optional → BREAK: make the optional dependency non-required
  if both are required → EXTRACT: pull shared logic into a third skill
  if cycle is in workflow steps → INLINE: embed the dependency's steps directly
```

**Output:** Resolution plan per conflict with the chosen strategy and implementation steps.

## Resolution Strategies

| Conflict Type | Strategy | Action |
|---------------|----------|--------|
| Type 1: Scope Overlap | **Specialize** | Narrow the general skill's "Use This For" to exclude the overlapping scenario |
| Type 1: Scope Overlap | **Merge** | Combine both skills into one if the overlap is fundamental |
| Type 1: Scope Overlap | **Clarify** | Add explicit boundary declarations in both skills' "Independence Rules" |
| Type 1: Scope Overlap | **Precedence** | Declare which skill activates first when both match |
| Type 2: Contradictory | **Deprecate** | Mark older instruction as superseded with reference to the authoritative skill |
| Type 2: Contradictory | **Contextualize** | Add context guards so each instruction applies only in its valid scenario |
| Type 2: Contradictory | **Escalate** | Surface to orchestrator for human decision when neither can be reconciled |
| Type 3: Shared State | **Coordinate** | Declare reader/writer relationship and sequencing |
| Type 3: Shared State | **Partition** | Assign different files, keys, or namespaces to each skill |
| Type 3: Shared State | **Order** | Declare execution order dependency to prevent last-writer-wins |
| Type 4: Boundary | **Remove** | Strip the violating action from the encroaching skill's workflow |
| Type 4: Boundary | **Relocate** | Move the action to the skill that owns that domain |
| Type 4: Boundary | **Clarify** | Add explicit ownership declaration to resolve ambiguity |
| Type 5: Cycle | **Break** | Make one side of the dependency optional |
| Type 5: Cycle | **Extract** | Pull shared logic into a third, independent skill |
| Type 5: Cycle | **Inline** | Embed the dependency's steps directly to eliminate the circular reference |

## Precedence Rules

When conflicts are unavoidable (e.g., two legitimately overlapping skills are both loaded), apply these precedence rules in order:

| Priority | Rule | Rationale |
|----------|------|-----------|
| 1 | **User instructions** | Explicit user commands override all skill guidance |
| 2 | **Loaded order** | First-loaded skill has precedence (most recently activated = most intentional) |
| 3 | **Specificity** | More specific skill overrides more general skill for the overlapping scenario |
| 4 | **Recency** | Newer skill version overrides older version (check frontmatter `updated` if present) |
| 5 | **Framework authority** | Skills governing framework-level concerns (roles, boundaries) override domain skills |

**Implementation:** When a conflict is detected at runtime, emit a warning with the conflict type, the skills involved, and which precedence rule resolved it. Log to `.hivemind/activity/state/conflict-log.json`.

## Anti-Patterns

| Anti-Pattern | Description | Example | Fix |
|--------------|-------------|---------|-----|
| **Scope creep** | A skill gradually absorbs concerns from neighboring skills | Delegation skill adds code quality checks | Revert to original scope; use `hivemind-skill-doctor` for quality |
| **Shadow authority** | A skill implicitly overrides another without declaring the relationship | New commit skill overwrites atomic-commit behavior | Declare precedence or merge the skills |
| **Uncoordinated writes** | Multiple skills write to the same state surface without a protocol | Two skills both write to `.hivemind/activity/state/active-context.json` | Partition state surfaces or declare writer/reader roles |
| **Circular prerequisites** | Skill A requires B, B requires A | Both list each other in Prerequisites | Extract shared logic to a third skill |
| **Implicit overlap** | Overlap exists but is not declared in either skill's "Do Not Use This For" | Both skills claim "audit" without boundary declarations | Add explicit exclusions to both skills |
| **Stale conflict resolution** | A previous resolution was applied but the skills have since diverged | Merge decision was made but skills were updated independently | Re-run conflict detection after skill updates |
| **God skill** | Single skill claims too many concerns, creating implicit conflicts with everything | A "do-everything" skill overlaps with 10+ specialized skills | Decompose into focused skills |

## Conflict Report Format

When conflict detection completes, emit a structured report.

```json
{
  "_meta": {
    "format": "skill-conflict-report-v1",
    "created_at": "2026-03-24T10:00:00Z",
    "skills_analyzed": ["skill-a", "skill-b", "skill-c"]
  },
  "conflicts": [
    {
      "id": "conflict-001",
      "type": "scope_overlap",
      "severity": "high",
      "skills": ["skill-a", "skill-b"],
      "scenario": "Both skills claim responsibility for auditing skill quality",
      "evidence": {
        "skill_a": { "section": "Use This For", "text": "Auditing skill quality..." },
        "skill_b": { "section": "Purpose", "text": "Evaluate and score skill quality..." }
      },
      "resolution": {
        "strategy": "specialize",
        "action": "Narrow skill-b's Use This For to exclude quality auditing; delegate to skill-a",
        "status": "proposed"
      }
    }
  ],
  "summary": {
    "total_conflicts": 1,
    "by_type": { "scope_overlap": 1, "contradictory": 0, "shared_state": 0, "boundary_violation": 0, "dependency_cycle": 0 },
    "by_severity": { "critical": 0, "high": 1, "medium": 0, "low": 0 },
    "health_score": 95
  }
}
```

## Core Process

1. **Select skills** — identify the set of skills to analyze (full pack or subset)
2. **Scope map** — extract each skill's scope from SKILL.md sections
3. **Overlap scan** — intersect scope maps and flag potential conflicts
4. **Instruction compare** — for each flagged pair, compare decision rules for contradictions
5. **State audit** — check for shared state mutation surfaces
6. **Classify** — assign conflict type (1–5) and severity (critical/high/medium/low)
7. **Resolve** — apply resolution strategy from the decision tree
8. **Report** — emit the conflict report in the standard JSON format
9. **Verify** — confirm the resolution eliminates the conflict without creating new ones

## Independence Rules

This skill covers:

- Detecting overlapping responsibilities between skills
- Finding contradictory instructions in multi-skill contexts
- Identifying shared state mutation conflicts
- Flagging boundary violations between skill domains
- Providing resolution strategies and precedence rules

This skill does NOT cover:

- Skill quality scoring (use `hivemind-skill-doctor`)
- Universal design validation (use `skill-universal-design`)
- Agent role boundary enforcement (use `agent-role-boundary`)
- Skill creation mechanics (use `use-hivemind-skill-writer`)
- Skill authoring conventions (use `hivemind-skill-write`)

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/conflict-taxonomy.md` | Detailed conflict type definitions with edge cases |
| `references/resolution-decision-tree.md` | Full decision tree with branching logic |
| `references/precedence-rules.md` | Extended precedence rules with examples |
| `templates/scope-map.md` | JSON template for per-skill scope extraction |
| `templates/conflict-report.md` | JSON template for the conflict detection report |
| `templates/resolution-plan.md` | JSON template for per-conflict resolution plans |
