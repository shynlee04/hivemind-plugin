# Authorization Gates Reference

## Gate Architecture

Gates are sequential authorization checkpoints that must pass before agent creation. Each gate validates a specific dimension of readiness.

```
Gate Flow:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────┐
│   G1    │───▶│   G2    │───▶│   G3    │───▶│   G4    │───▶│ CHECKPOINT │
│ Skills  │    │Specialist│   │Capability│   │  Scope  │    │Human-Verify│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────────┘
   PASS          PASS           PASS           PASS              PASS
    │             │              │              │                 │
    ▼             ▼              ▼              ▼                 ▼
 Continue      Continue       Continue       Continue         Agent Creation
```

## Gate 1: Skills Loaded

**Type:** Pre-flight check  
**Blocking:** Yes  
**Purpose:** Ensure sufficient context exists for agent authoring

### Validation Criteria

| Check | Threshold | Command |
|-------|-----------|---------|
| Skills loaded | ≥ 3 | `ls .opencode/skills/` |
| Domain coverage | Matches task | Manual review |

### Failure Response

```yaml
GATE_1_BLOCKED:
  status: FAIL
  reason: Insufficient skills loaded
  required: 3-4 skills
  current: {count}
  action: |
    1. List available skills: ls .opencode/skills/
    2. Load required domain skills
    3. Re-run Gate 1 validation
```

## Gate 2: Specialist Availability

**Type:** Resource check  
**Blocking:** Yes  
**Purpose:** Verify specialist subagents can handle the task

### Validation Criteria

| Check | Threshold | Notes |
|-------|-----------|-------|
| Specialists defined | ≥ 2 | See Specialist Profiles section |
| Task domain match | Yes | At least one specialist matches |

### Specialist Registry

```
specialists/
├── hivefiver-skill-author/     # Skill creation/audit/repair
├── hivefiver-agent-builder/    # Agent YAML definitions
├── hivefiver-command-builder/  # Command creation
├── builder/                     # Implementation
├── critic/                     # Quality verification
└── router/                     # Meta-builder routing
```

### Failure Response

```yaml
GATE_2_BLOCKED:
  status: FAIL
  reason: Insufficient specialist availability
  required: 2 specialists minimum
  current: {count}
  action: |
    1. Check available specialist definitions
    2. Load or define required specialists
    3. Re-run Gate 2 validation
```

## Gate 3: Capability Match

**Type:** Alignment check  
**Blocking:** Yes  
**Purpose:** Confirm task aligns with specialist capabilities

### Validation Criteria

| Check | Method |
|-------|--------|
| Task intent matches specialist | Compare task description to profile capabilities |
| No capability gaps | Verify all required skills are covered |
| Authority level appropriate | Match specialist to authorization level |

### Capability Matching Algorithm

```
1. Extract task keywords from request
2. Match against specialist capability matrix
3. Score each specialist: exact=3, partial=2, weak=1, none=0
4. Select highest scoring specialist(s)
5. If top score < 2: reject with "no matching specialist"
```

### Failure Response

```yaml
GATE_3_BLOCKED:
  status: FAIL
  reason: Task does not match specialist capabilities
  task: {task_description}
  matched_specialists: []
  action: |
    1. Refine task scope to match known capabilities
    2. OR define new specialist profile for task domain
    3. Re-run Gate 3 validation
```

## Gate 4: Scope Definition

**Type:** Boundary check  
**Blocking:** Yes  
**Purpose:** Ensure task boundaries and file paths are defined

### Validation Criteria

| Check | Method |
|-------|--------|
| File paths identified | `task_plan.md` contains paths field |
| Task scope documented | `task_plan.md` contains Goal field |
| Scope is bounded | Scope is achievable in single session |

### Required Scope Fields

```yaml
task_plan.md:
  Goal: "[What to accomplish]"
  paths: 
    - /path/to/file1
    - /path/to/file2
  scope: |
    - In scope: [items]
    - Out of scope: [items]
  constraints: |
    - [constraint 1]
    - [constraint 2]
```

### Failure Response

```yaml
GATE_4_BLOCKED:
  status: FAIL
  reason: Scope not properly defined
  missing_fields: [field1, field2]
  action: |
    1. Document task goal in task_plan.md
    2. Identify and list target file paths
    3. Define scope boundaries
    4. Re-run Gate 4 validation
```

## Checkpoint Types

### Human-Verification Checkpoint

**Gate Type:** blocking  
**Trigger:** High-authorization actions (skill creation, agent creation)

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <description>Agent creation requires human approval</description>
  <agent_type>[Type of agent being created]</agent_type>
  <task_description>[What the agent will do]</task_description>
  <specialist>[Selected specialist profile]</specialist>
  <file_paths>[Target files]</file_paths>
  <prompt>Authorize creation of [agent-type] for [task]?</prompt>
  <options>
    <option id="approve">
      <name>Approve</name>
      <description>Proceed with agent creation</description>
      <action>dispatch_agent</action>
    </option>
    <option id="reject">
      <name>Reject</name>
      <description>Cancel agent creation</description>
      <action>cancel_and_return</action>
    </option>
    <option id="modify">
      <name>Modify</name>
      <description>Adjust parameters before approval</description>
      <action>return_to_planning</action>
    </option>
  </options>
</task>
```

### Decision Checkpoint

**Gate Type:** blocking  
**Trigger:** Multi-option decisions within parameters

```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <context>[Background context for decision]</context>
  <options>
    <option id="option-a">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
      <confidence>[0-100]</confidence>
    </option>
    <option id="option-b">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
      <confidence>[0-100]</confidence>
    </option>
  </options>
  <selection_criteria>
    - [Criterion 1]
    - [Criterion 2]
  </selection_criteria>
</task>
```

### Human-Action Checkpoint

**Gate Type:** blocking  
**Trigger:** Requires human to perform external action

```xml
<task type="checkpoint:human-action" gate="blocking">
  <action_required>[Action human must perform]</action_required>
  <prerequisite>[What must be true first]</prerequisite>
  <verification>[How to verify action completed]</verification>
  <timeout>[Optional timeout]</timeout>
</task>
```

## Gate Prompt Templates

### Authorization Request Prompt

```
╔══════════════════════════════════════════════════════════════╗
║  AGENT AUTHORIZATION REQUEST                                 ║
╠══════════════════════════════════════════════════════════════╣
║  Agent Type: [agent-type]                                    ║
║  Specialist: [profile-name]                                  ║
║  Task: [task-description]                                    ║
╠══════════════════════════════════════════════════════════════╣
║  File Paths:                                                 ║
║    - [path 1]                                                 ║
║    - [path 2]                                                 ║
╠══════════════════════════════════════════════════════════════╣
║  Complexity: [low|medium|high]                               ║
║  Authorization Level: [HIGH|MEDIUM|LOW]                      ║
╠══════════════════════════════════════════════════════════════╣
║  Gates Passed: G1 ✓  G2 ✓  G3 ✓  G4 ✓                       ║
╚══════════════════════════════════════════════════════════════╝

Authorize agent creation? (yes/no/cancel)
>
```

### Checkpoint Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  ⛩  CHECKPOINT: [checkpoint-name]                         │
├─────────────────────────────────────────────────────────────┤
│  [description of what's being authorized]                   │
│                                                             │
│  Recommended Action: [specialist] for [task]               │
│                                                             │
│  Options:                                                   │
│    [1] Approve  - proceed with creation                     │
│    [2] Reject   - cancel and return to planning            │
│    [3] Modify   - adjust parameters before approval         │
└─────────────────────────────────────────────────────────────┘
Choice: 
```

### Multi-Specialist Selection Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  ⛩  SPECIALIST SELECTION CHECKPOINT                         │
├─────────────────────────────────────────────────────────────┤
│  Task: [task-description]                                   │
│                                                             │
│  Candidate Specialists:                                     │
│                                                             │
│  [A] hivefiver-skill-author (confidence: 95%)               │
│      Pros: Creates skills with proper triggers              │
│      Cons: Takes longer for simple tasks                    │
│                                                             │
│  [B] builder (confidence: 70%)                              │
│      Pros: Fast implementation                              │
│      Cons: May miss skill quality best practices           │
│                                                             │
│  [C] hivefiver-agent-builder (confidence: 40%)              │
│      Pros: Expert agent definitions                        │
│      Cons: Overkill for this task type                     │
└─────────────────────────────────────────────────────────────┘
Recommended: [A] - highest confidence match
Choice: [A/B/C]
```

## Specialist Profiles

### hivefiver-skill-author

```yaml
profile: hivefiver-skill-author
description: Creates, audits, and repairs agent skills
capabilities:
  - SKILL.md authoring with trigger phrases
  - Frontmatter validation (name, description, YAML)
  - Reference file structure
  - Pattern selection (P1/P2/P3)
  - Script creation with real validation
authorization_level: HIGH
gate_requirements:
  - G1: skills_loaded (3+)
  - G2: specialists_available (2+)
  - G3: capability_match (exact)
  - G4: scope_defined
  checkpoint: human-verify
```

### hivefiver-agent-builder

```yaml
profile: hivefiver-agent-builder
description: Creates agent definitions with YAML frontmatter
capabilities:
  - Agent YAML structure
  - Tool permissions
  - System prompts
  - Session configuration
authorization_level: HIGH
gate_requirements:
  - G1: skills_loaded (3+)
  - G2: specialists_available (2+)
  - G3: capability_match (exact)
  - G4: scope_defined
  checkpoint: human-verify
```

### hivefiver-command-builder

```yaml
profile: hivefiver-command-builder
description: Creates commands with $ARGUMENTS and safety patterns
capabilities:
  - Command definition syntax
  - $ARGUMENTS parsing
  - !bash safety guards
  - Option handling
authorization_level: HIGH
gate_requirements:
  - G1: skills_loaded (3+)
  - G2: specialists_available (2+)
  - G3: capability_match (exact)
  - G4: scope_defined
  checkpoint: none
```

### builder

```yaml
profile: builder
description: Atomic implementation, reads before writes
capabilities:
  - File creation and editing
  - Code implementation
  - Test writing
  - Documentation
authorization_level: MEDIUM
gate_requirements:
  - G1: skills_loaded (3+)
  - G2: specialists_available (2+)
  - G3: capability_match (partial)
  checkpoint: none
```

### critic

```yaml
profile: critic
description: Quality verification and correctness validation
capabilities:
  - Code review
  - Correctness validation
  - Best practices verification
  - Anti-pattern detection
authorization_level: LOW
gate_requirements:
  - G1: skills_loaded (3+)
  - G2: specialists_available (2+)
  checkpoint: none
```

## Specialist Capability Matrix

| Task Category | Best Specialist | Alternatives | Authorization |
|--------------|-----------------|---------------|---------------|
| Create skill | `hivefiver-skill-author` | `builder` | HIGH + human-verify |
| Audit skill | `hivefiver-skill-author` | `critic` | MEDIUM |
| Repair skill | `hivefiver-skill-author` | `builder` | MEDIUM |
| Create agent | `hivefiver-agent-builder` | `meta-builder` | HIGH + human-verify |
| Create command | `hivefiver-command-builder` | `builder` | HIGH |
| Implementation | `builder` | - | MEDIUM |
| Code review | `critic` | `hivefiver-skill-author` | LOW |
| General task | `meta-builder` (router) | - | Variable |

## Authorization Level Thresholds

| Level | Checkpoint Required | Gate Requirements |
|-------|--------------------|-------------------|
| **HIGH** | Human-verify | G1, G2, G3, G4 + checkpoint |
| **MEDIUM** | None (autonomous) | G1, G2, G3 |
| **LOW** | None (autonomous) | G1, G2 |

## Gate Override Protocol

Gates may be overridden only with explicit user authorization:

```
Override Request:
  Gate: [G1|G2|G3|G4]
  Reason: [Why override is needed]
  User Authorization: [explicit yes from user]

Override Logged:
  - Timestamp
  - User who authorized
  - Original gate status
  - Override reason
```
