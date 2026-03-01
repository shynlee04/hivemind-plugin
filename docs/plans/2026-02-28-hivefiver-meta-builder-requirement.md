# HiveFiver Meta-Builder Self-Audit & Revamp Requirements

**Document ID:** REQ-HIVEMIND-V3-META-BUILDER-2026-02-28  
**Status:** DRAFT - For HiveFiver Self-Audit  
**Scope:** Meta-builder framework for OpenCode + HiveMind integration  
**Target:** Audit and revamp HiveFiver concepts, skills, commands, and packages  

---

## SECTION 1: ROLE DEFINITION

### 1.1 What HiveFiver IS

**HiveFiver** is a **meta-builder** - a front-facing agent that produces metadata concepts compatible with BOTH OpenCode and HiveMind frameworks. Its core responsibilities:

1. **Concept Generation:** Creates structured metadata (skills, commands, agents, workflows) that work under OpenCode and HiveMind
2. **User Journey Orchestration:** Guides users from L0 (beginner) to L3 (expert) across all tech stacks
3. **Framework Bridge:** Ensures seamless integration between OpenCode's command system and HiveMind's session governance
4. **Progressive Disclosure:** Implements L0-L3 skill loading with context engineering

### 1.2 What HiveFiver IS NOT

HiveFiver is **NOT:**
- An implementation agent (that's `hivemaker`)
- A debugging agent (that's `hivehealer`)
- A research agent (that's `hiverd`)
- A QA agent (that's `hiveq`)
- A planner agent (that's `hiveplanner`)

**Boundary:** HiveFiver produces metadata and structures. It does NOT execute code changes.

### 1.3 Target Users

| Level | Description | Example Scenario |
|-------|-------------|------------------|
| **L0 - Beginner** | Tech-agnostic, confused, needs guidance | "I want to build a website but don't know where to start" |
| **L1 - Intermediate** | Some tech knowledge, needs structure | "I need to refactor this React component" |
| **L2 - Advanced** | Clear requirements, needs delegation | "Build a TanStack Router integration with auth" |
| **L3 - Expert** | Precise specs, needs efficiency | "Create command: `/custom-deploy --env prod --skip-tests`" |

### 1.4 The Contract

**Input:** User intent (ambiguous or specific)  
**Output:** Metadata concepts that work under OpenCode AND HiveMind:
- `commands/` - Command definitions with YAML frontmatter
- `skills/` - Skill packages with progressive disclosure
- `agents/` - Agent configurations with permissions
- `workflows/` - Workflow templates with delegation chains

---

## SECTION 2: USER JOURNEY MAPPING

### 2.1 Level 1/4 (Beginner) Journey

```
User Input (ambiguous/absurd)
    ↓
[hivefiver-persona-routing] → Detect skill level + intent
    ↓
Guided Wizard Mode
    ↓
    ├─ Clarifying questions (YAGNI/KISS checks)
    ├─ Tech stack discovery
    ├─ Requirements distillation
    ↓
Spec Candidate Generation
    ↓
[hivefiver-spec-distillation] → Structured requirements
    ↓
Template Selection
    ↓
Command/Skill Generation
    ↓
Validation Checklist
    ↓
Output: Working metadata concepts
```

**Entry Points:**
- `/hivefiver-start` - Default guided entry
- `/hivefiver-intake` - Structured requirement gathering
- Wall-of-text → auto-chunking → progressive disclosure

**Escalation Triggers:**
- User demonstrates clear tech knowledge → L2 path
- Requirements exceed single-session scope → Delegate to `hiveplanner`

### 2.2 Level 2/4 (Intermediate) Journey

```
User Input (structured requirements)
    ↓
[hivefiver-spec-distillation] → Extract structured specs
    ↓
Template Selection
    ├─ Command templates
    ├─ Skill templates  
    ├─ Agent templates
    ↓
Context Assembly
    ├─ Load relevant skills (L0-L1 disclosure)
    ├─ Fetch references
    ├─ Build delegation packet
    ↓
[delegation-intelligence] → Route to optimal subagent
    ↓
Metadata Generation
    ↓
Validation & Verification
    ↓
Output: Production-ready metadata
```

**Entry Points:**
- `/hivefiver-spec` - Direct spec input
- `/hivefiver-build` - Build from spec

### 2.3 Level 3/4 (Advanced) Journey

```
User Input (precise requirements)
    ↓
Direct Command/Skill/Agent Generation
    ├─ Skip persona routing
    ├─ Load L2+ skills immediately
    ↓
Subagent Chains
    ├─ Parallel delegation where possible
    ├─ Sequential where dependencies exist
    ↓
Quality Gates
    ├─ Automated validation
    ├─ Evidence verification
    ↓
Output: Advanced metadata with delegation chains
```

**Entry Points:**
- `/hivefiver-skillforge` - Create skill packages
- `/hivefiver-workflow` - Create workflow chains

### 2.4 Level 4/4 (Expert) Journey

```
User Input (exact specifications with flags)
    ↓
Direct Flag-Based Execution
    ├─ --phase-1, --force, --dry-run
    ├─ Command chaining: cmd1 | cmd2 && cmd3
    ↓
Minimal Context Loading
    ├─ L3 skills only
    ├─ No progressive disclosure
    ↓
Parallel Execution
    ├─ Fire-and-forget subagents
    ├─ Async result aggregation
    ↓
Output: Expert-level metadata with zero hand-holding
```

**Entry Points:**
- `/hivefiver --phase 1 --skip-verify`
- Command chaining syntax

---

## SECTION 3: EDGE CASES

### 3.1 Absurd/Ambiguous Inputs

**Detection:**
- No clear tech stack mentioned
- Contradictory requirements
- Nonsensical combinations

**Response Protocol:**
1. Activate `hivefiver-persona-routing` clarification mode
2. Ask: "Why?" (YAGNI check)
3. Ask: "Simpler?" (KISS check)
4. Guide toward concrete requirements
5. If still ambiguous after 3 cycles → escalate to user

**Example:**
```
User: "Build me a thing that does stuff"
HiveFiver: "Let me clarify your requirements:
  1. What domain is this for? (web/mobile/backend/AI)
  2. What problem are you solving?
  3. What's the simplest version that would work?"
```

### 3.2 Wall-of-Text Inputs

**Detection:**
- Input > 500 tokens
- Multiple topics mixed
- No clear structure

**Response Protocol:**
1. Chunk into semantic sections
2. Summarize each section
3. Identify primary vs secondary topics
4. Ask user to prioritize
5. Progressive disclosure: process primary first

**Auto-Mechanism:**
```yaml
trigger: input_tokens > 500
action: chunk_and_summarize
output: structured_sections
next: user_prioritization
```

### 3.3 Conflicting Requirements

**Detection:**
- Multiple incompatible constraints
- Circular dependencies
- Impossible combinations

**Response Protocol:**
1. Build dependency tree
2. Identify conflicts using `hierarchy-tree.ts`
3. Present trade-offs with evidence
4. Ask user to resolve
5. Document decision as anchor

**Example:**
```
Conflict detected:
- Requirement A: "Must work offline" (PWA)
- Requirement B: "Real-time collaboration" (WebSocket)
Trade-off: Service Workers vs WebSocket persistence
Resolution options: [A] [B] [Hybrid with fallback]
```

### 3.4 Tech-Agnostic Users

**Detection:**
- No framework/tech mentioned
- Generic terminology only
- "I don't know what's possible"

**Response Protocol:**
1. Discovery questions
2. Present tech matrix from `skills/hivefiver-domain-pack-router/`
3. Recommend based on use case
4. Explain trade-offs
5. Confirm before proceeding

### 3.5 Expert Users

**Detection:**
- Precise terminology
- Clear architecture vision
- Specific requirements

**Response Protocol:**
1. Skip L0-L1 disclosure
2. Load L2-L3 skills immediately
3. Enable command flags
4. Offer parallel execution
5. Minimal explanation

### 3.6 Context Hallucination Prevention

**Mechanisms:**
1. **Drift Detection:** Score every turn (intent, trajectory, hierarchy, action, context)
2. **think_back Trigger:** When drift_score < 60
3. **Anchor Validation:** Cross-reference with `.hivemind/state/anchors.json`
4. **Evidence Hierarchy:** L1 (direct observation) required for L4-L5 claims

**Auto-Response:**
```yaml
drift_score < 40:
  action: HALT
  message: "Context drift detected. Let me re-align..."
  tool: think_back
  next: user_guidance_request
```

---

## SECTION 4: COMMAND REQUIREMENTS

### 4.1 Atomic Commands with Flag Support

**Required Flag Schema:**
```yaml
# commands/hivefiver-example.md
---
name: hivefiver-example
description: "Example command with flags"
flags:
  - name: phase
    type: integer
    default: 1
    description: "Phase number for phased execution"
  - name: force
    type: boolean
    default: false
    description: "Skip validation gates"
  - name: dry-run
    type: boolean
    default: false
    description: "Preview without execution"
  - name: skip-verify
    type: boolean
    default: false
    description: "Skip verification step"
---
```

**Usage:**
```
/hivefiver-example --phase 2 --force
/hivefiver-example --dry-run
```

### 4.2 Compound Commands

**Group Organization:**
```
/hivefiver:plan-phase     # Planning group
/hivefiver:execute-phase  # Execution group
/hivefiver:verify-work    # Verification group
```

**Command Chaining Syntax:**
```
# Pipeline (output → input)
/hivefiver-intake | /hivefiver-spec --auto-approve

# Conditional AND
/hivefiver-build && /hivefiver-validate

# Conditional OR  
/hivefiver-build || /hivefiver-doctor --auto-fix

# Sequential
/hivefiver-intake; /hivefiver-spec; /hivefiver-build
```

### 4.3 Flag Parser Implementation

**Requirements:**
```typescript
// src/lib/command-parser.ts
interface FlagSchema {
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'array';
  required?: boolean;
  default?: unknown;
  choices?: string[];
  description: string;
}

interface ParsedCommand {
  command: string;
  flags: Record<string, unknown>;
  positional: string[];
  chain?: {
    type: 'pipe' | 'and' | 'or' | 'sequence';
    next?: ParsedCommand;
  };
}
```

**Validation:**
- Type checking
- Required flag enforcement
- Choice validation
- Default application

---

## SECTION 5: SKILL REQUIREMENTS

### 5.1 Progressive Disclosure Enforcement

**L0 - Discovery (Always Loaded):**
- Skill name + description
- Trigger patterns
- ~100 tokens

**L1 - Triage (On Trigger Match):**
- SKILL.md body
- Basic instructions
- ~500-2K tokens

**L2 - Domain (On Explicit Need):**
- Reference sections
- Domain-specific patterns
- ~1K-5K tokens

**L3 - Deep (Full Audit Mode):**
- Complete references
- Scripts and templates
- ~5K-15K tokens

**Registry Schema:**
```yaml
# skills/registry.yaml
skills:
  skill-name:
    disclosure_level: L0 | L1 | L2 | L3
    triggers: ["pattern1", "pattern2"]
    knowledge_delta_score: 0.46-0.95
    bundle: governance-core | routing-core | planning-core | verification-core
```

### 5.2 Skill Chaining Mechanisms

**Linear Chain:**
```
Skill A → Skill B → Skill C
(Output of A → Input of B)
```

**Branch Chain:**
```
        ┌→ Skill B →
Skill A ─┤
        └→ Skill C →
```

**Merge Chain:**
```
Skill A ─┐
         ├→ Skill C
Skill B ─┘
```

**Conditional Chain:**
```
Skill A → [condition] → Skill B or Skill C
```

### 5.3 Template Injection for Workflows

**Template Engine Requirements:**
```yaml
# workflows/example-workflow.yaml
template_engine: handlebars
variables:
  - name: context.agent
    source: session.agent_id
  - name: session.id
    source: session.uuid
  - name: trajectory.id
    source: hierarchy.current_trajectory

steps:
  - name: step-1
    template: |
      Delegating to {{context.agent}}:
      Session: {{session.id}}
      Trajectory: {{trajectory.id}}
```

**Variable Sources:**
- Session context
- Hierarchy state
- Environment variables
- Previous step outputs

### 5.4 Agent Spawn/Context Isolation Templates

**Spawn Template:**
```yaml
# templates/agent-spawn/hivemaker.yaml
agent_type: hivemaker
context_isolation: true
resource_quota:
  max_turns: 20
  max_tokens: 100000
inherit_from_parent:
  - trajectory_id
  - tactic_id
  - context_summary
isolate_from_parent:
  - skill_registry
  - session_memory
```

**Lifecycle Hooks:**
- `pre_spawn` - Validate resources
- `post_spawn` - Initialize context
- `pre_handoff` - Package results
- `post_terminate` - Cleanup

---

## SECTION 6: DELEGATION PATTERNS

### 6.1 Delegation Packet Contract

**Required Schema:**
```yaml
delegation_packet:
  metadata:
    delegation_source: "agent"
    delegation_depth: 1
    parent_agent: "hivefiver"
    packet_id: "uuid"
    timestamp: "iso8601"
    
  parent_context:
    trajectory_id: "uuid"
    tactic_id: "uuid"
    context_summary: "2-3 lines"
    active_assumptions: []
    blockers: []
    
  task:
    objective: "Clear, measurable goal"
    type: "implementation | research | debug | planning | qa"
    complexity: 1-10
    urgency: "critical | high | normal | low"
    in_scope_paths: []
    out_of_scope_paths: []
    constraints: []
    success_criteria: []
    
  resources:
    skills_to_load: []
    references_to_read: []
    
  return_schema:
    format: "structured"
    required_fields:
      status: "success | partial | failure"
      confidence: 0-100
      files_modified: []
      evidence: {}
```

### 6.2 Sequential vs Parallel Decision Tree

**Default: SEQUENTIAL**

Parallel requires ALL conditions:
```
Zero file overlap?
Zero state dependency?
Zero output dependency?
Failure isolation possible?
    ↓
YES → Parallel subagents (fresh 200K context each)
NO (default) → Sequential execution
```

**Validation:**
- File path analysis
- State dependency graph
- Output contract inspection
- Failure mode assessment

### 6.3 Subagent Handoff Protocols

**Synchronous Handoff:**
```
Parent → Spawn Subagent → Wait for Result → Continue
```

**Asynchronous Handoff:**
```
Parent → Spawn Subagent → Continue → Callback on Result
```

**Fire-and-Forget:**
```
Parent → Spawn Subagent → Continue (no callback)
```

**Protocol Selection:**
- Synchronous: When result needed immediately
- Asynchronous: When result can be processed later
- Fire-and-Forget: For telemetry/logging

---

## SECTION 7: AUTO-MECHANISMS

### 7.1 Drift Detection Scoring

**5 Dimensions:**
1. **Intent Drift** - Has user goal changed?
2. **Trajectory Drift** - Are we still on planned path?
3. **Hierarchy Drift** - Is tree structure valid?
4. **Action Drift** - Are actions aligned with goals?
5. **Context Drift** - Is context window healthy?

**Scoring:**
```yaml
drift_score: 0-100
  80-100: Excellent → Proceed
  60-79:  Caution → Gather more context
  40-59:  Warning → STOP, run think_back
  0-39:   Critical → HALT, request guidance
```

**Auto-Response:**
```yaml
drift_score < 60:
  trigger: think_back
  action: context_realignment
drift_score < 40:
  trigger: HALT
  action: user_guidance_request
```

### 7.2 Context Compaction Triggers

**Trigger Conditions:**
```yaml
turn_count > 20:
  action: suggest_compaction
  
token_count > 150000:
  action: force_compaction
  
drift_score < 60 AND turn_count > 10:
  action: compact_session
  
user_request == "compact":
  action: immediate_compaction
```

**Compaction Process:**
1. Archive old turns
2. Preserve anchors
3. Summarize trajectory
4. Update hierarchy
5. Reset drift score

### 7.3 Session Boundary Detection

**Boundary Indicators:**
- Task completion
- Context switch
- Natural break in conversation
- User explicit "done"

**Auto-Actions:**
```yaml
boundary_detected:
  - compact_session
  - update_hierarchy
  - archive_session
  - reset_for_new_session
```

### 7.4 Quality Gate Automation

**Gate Types:**
- **Syntax Gate** - Validate YAML/JSON/TypeScript
- **Schema Gate** - Check against Zod schemas
- **Contract Gate** - Verify delegation packet
- **Evidence Gate** - Require L1-L2 evidence

**Automation:**
```yaml
gate_status:
  PASS: Continue to next phase
  WARN: Continue with warnings logged
  FAIL: HALT, return to previous phase
```

---

## SECTION 8: BUNDLES & REFERENCES

### 8.1 Skill Bundle Organization

**Core Bundles:**
```yaml
bundles:
  governance-core:
    - hivemind-governance
    - session-lifecycle
    - context-first-gatekeeping
    
  routing-core:
    - delegation-intelligence
    - hivefiver-persona-routing
    
  planning-core:
    - hivemind-architect-strategist
    - hiveplanner-orchestration
    
  verification-core:
    - gate-enforcement
    - verification-methodology
```

**Loading Strategy:**
- L0: Always load governance-core
- L1: Add routing-core based on trigger
- L2: Add planning-core for complex tasks
- L3: Add verification-core for audit mode

### 8.2 Reference Documentation Structure

**Reference Levels:**
```
references/
├── domain-boundaries.md          # Domain separation rules
├── quality-gate-definitions.md   # Gate criteria
├── workflow-briefing.md          # Workflow patterns
└── research-quality-criteria.md  # Evidence standards
```

**Evidence Hierarchy:**
| Level | Type | Reliability |
|-------|------|-------------|
| L1 | Direct observation | Highest |
| L2 | Indirect inference | High |
| L3 | Historical record | Medium |
| L4 | Pattern recognition | Medium |
| L5 | Expert judgment | Lowest |

**Rule:** L4-L5 claims require L1-L2 verification.

### 8.3 Template Registry

**Template Types:**
```yaml
templates/
├── commands/          # Command templates
├── skills/            # Skill SKILL.md templates
├── agents/            # Agent configuration templates
├── workflows/         # Workflow YAML templates
└── delegation/        # Delegation packet templates
```

**Versioning:**
```yaml
template:
  name: skill-standard
  version: 1.2.0
  compatible_with:
    - opencode: ">=2.0.0"
    - hivemind: ">=3.0.0"
```

---

## SECTION 9: ACCEPTANCE CRITERIA

### 9.1 Success Metrics by Level

**L0 (Beginner):**
- User can express intent in natural language
- System guides to concrete requirements
- Output: Working metadata concepts
- Metric: User satisfaction ≥ 4/5

**L1 (Intermediate):**
- User provides structured requirements
- System selects appropriate templates
- Output: Production-ready metadata
- Metric: First-pass success ≥ 80%

**L2 (Advanced):**
- User provides precise specifications
- System chains subagents efficiently
- Output: Advanced metadata with chains
- Metric: Subagent success ≥ 90%

**L3 (Expert):**
- User uses flags and chaining
- System executes with minimal overhead
- Output: Expert-level metadata
- Metric: Execution time ≤ 50% of L0

### 9.2 Quality Gate Definitions

**PASS Criteria:**
- All required fields present
- Schema validation passes
- Evidence hierarchy satisfied
- No critical drift

**WARN Criteria:**
- Optional fields missing
- Minor schema violations
- Some L3-L4 evidence only
- Drift score 60-79

**FAIL Criteria:**
- Required fields missing
- Schema validation fails
- No L1-L2 evidence
- Drift score < 60

### 9.3 Verification Checklist

**Pre-Completion:**
- [ ] Metadata syntax validated
- [ ] Schema constraints satisfied
- [ ] Evidence documented
- [ ] Drift score > 80
- [ ] Hierarchy updated
- [ ] Anchors preserved

**Post-Completion:**
- [ ] compact_session called
- [ ] export_cycle completed
- [ ] Session archived
- [ ] Intelligence preserved

### 9.4 Non-Intervention Thresholds

**Auto-Approval:**
```yaml
drift_score: > 80
turn_count: < 20
evidence_level: L1-L2
schema_valid: true
confidence: > 90
```

**Manual Review Required:**
```yaml
drift_score: 60-80
turn_count: 20-30
evidence_level: L3-L4
schema_valid: true
confidence: 70-90
```

**Auto-HALT:**
```yaml
drift_score: < 60
turn_count: > 30
evidence_level: L5 only
schema_valid: false
confidence: < 70
```

---

## SECTION 10: GAPS FROM ANALYSIS

Based on GSD pattern analysis, the following gaps have been identified:

### Gap 1: Flag Parsing Infrastructure (HIGH PRIORITY)
**Current:** Commands use static `argument_hint`  
**Required:** Dynamic flag parsing with types, validation, defaults  
**Files:** `commands/*.md`, `src/lib/command-parser.ts`  
**Effort:** 2-3 days  

### Gap 2: Template Engine for Workflows (HIGH PRIORITY)
**Current:** Static YAML workflows  
**Required:** Variable interpolation, dynamic generation  
**Files:** `workflows/*.yaml`, `src/lib/template-engine.ts`  
**Effort:** 3-4 days  

### Gap 3: Command Chaining Utilities (MEDIUM PRIORITY)
**Current:** Single command execution  
**Required:** Pipeline, conditional, sequential chaining  
**Files:** `src/lib/command-chain.ts`  
**Effort:** 2-3 days  

### Gap 4: Agent Lifecycle Templates (MEDIUM PRIORITY)
**Current:** No standardized spawn/terminate lifecycle  
**Required:** Templates for each agent type with hooks  
**Files:** `templates/agent-spawn/*.yaml`  
**Effort:** 2 days  

### Gap 5: Context Pass-Through Between Commands (MEDIUM PRIORITY)
**Current:** Commands are isolated  
**Required:** Shared state between chained commands  
**Files:** `src/lib/context-passthrough.ts`  
**Effort:** 1-2 days  

### Gap 6: Drift Detection Automation (HIGH PRIORITY)
**Current:** Manual drift assessment  
**Required:** Automated 5-dimension scoring  
**Files:** `src/lib/drift-detector.ts`  
**Effort:** 3-4 days  

### Gap 7: Evidence Validation (MEDIUM PRIORITY)
**Current:** No enforcement of evidence hierarchy  
**Required:** L4-L5 claims require L1-L2 verification  
**Files:** `src/lib/evidence-validator.ts`  
**Effort:** 2 days  

### Gap 8: Parallel Execution Validation (LOW PRIORITY)
**Current:** Manual parallel decision  
**Required:** Automated file/state/output dependency analysis  
**Files:** `src/lib/parallel-validator.ts`  
**Effort:** 3-4 days  

### Gap 9: Skill Bundle Loading (MEDIUM PRIORITY)
**Current:** Individual skill loading  
**Required:** Bundle-based progressive disclosure  
**Files:** `skills/registry.yaml`, `src/lib/skill-bundles.ts`  
**Effort:** 2 days  

### Gap 10: Auto-Compaction Triggers (HIGH PRIORITY)
**Current:** Manual compaction  
**Required:** Automated triggers based on turn/token count  
**Files:** `src/lib/auto-compaction.ts`  
**Effort:** 1-2 days  

---

## APPENDIX: REFERENCES

### Key Documents
- `docs/OPENCODE-ARCHITECTURE-NARRATIVE.md`
- `docs/OPENCODE-CONCEPTS-ADVANCED.md`
- `docs/OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md`
- `docs/OPENCODE-PRIMARY-COORDINATOR-AGENT.md`
- `docs/CHAIN-BRIDGE-ARCHITECTURE.md`
- `AGENT_RULES.md`

### Key Skills
- `skills/hivefiver-persona-routing/SKILL.md`
- `skills/hivefiver-spec-distillation/SKILL.md`
- `skills/delegation-intelligence/SKILL.md`
- `skills/hivemind-governance/SKILL.md`

### Key Tools
- `src/tools/hivemind-session.ts`
- `src/tools/hivemind-hierarchy.ts`
- `src/tools/hivemind-cycle.ts`

---

**END OF REQUIREMENTS DOCUMENT**

*This document serves as the specification for HiveFiver to audit and revamp its meta-builder capabilities. All sections are non-normative and subject to iterative refinement.*
