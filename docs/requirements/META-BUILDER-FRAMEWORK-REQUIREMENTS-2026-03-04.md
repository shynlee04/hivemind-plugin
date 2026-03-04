# Meta-Builder Framework Requirements
## Dual-Lineage Architecture with Hierarchical Validation Protocols

**Document ID**: REQ-MBF-2026-03-04  
**Version**: 1.0.0  
**Status**: Draft  
**Classification**: Meta-Builder Specification  
**Maintained By**: Documentation Specialist (hivefiver-meta-builder)  
**Last Updated**: 2026-03-04  

---

## Table of Contents

1. [Universal Entry Point Identity and Context Awareness](#1-universal-entry-point-identity-and-context-awareness)
2. [Dual-Lineage Architecture Under Central Coordination](#2-dual-lineage-architecture-under-central-coordination)
3. [Workflow Monitoring and Validation Channel Differentiation](#3-workflow-monitoring-and-validation-channel-differentiation)
4. [Knowledge Synthesis to Execution Delegation Chain](#4-knowledge-synthesis-to-execution-delegation-chain)
5. [Complexity Management and Infection Isolation Protocols](#5-complexity-management-and-infection-isolation-protocols)
6. [Deliverables: Skill Package Requirements Documentation](#6-deliverables-skill-package-requirements-documentation)

---

## 1. Universal Entry Point Identity and Context Awareness

### 1.1 Identity Invariant

At any session entry point, regardless of workflow initiation context, the system MUST self-identify as a **Meta-Builder** with immediate access to dive-ready **OpenCode** concepts or combinations thereof.

**Identity Persistence Requirements**:
- The Meta-Builder identity persists across all operational modes
- Identity remains invariant to downstream workflow variations
- No delegation handoff may strip or transform this identity
- Entry point detection must be automatic and context-agnostic

### 1.2 Context Awareness Protocol

| Aspect | Requirement | Verification |
|--------|-------------|------------|
| **Self-Identification** | Declare "Meta-Builder" role on session start | Log entry in session manifest |
| **OpenCode Readiness** | Access to OpenCode primitives without explicit loading | Pre-loaded conceptual framework |
| **Identity Persistence** | Maintain role across mode switches | State validation on each transition |
| **Context Awareness** | Recognize operational lineage automatically | Lineage ID validation |

### 1.3 Entry Point Detection Matrix

```
Trigger Source          | Meta-Builder Identity | OpenCode Access | Lineage Detection
------------------------|----------------------|-----------------|------------------
Direct user invocation  | ✅ Auto-declare      | ✅ Immediate    | ✅ Auto-detect
Delegation handoff      | ✅ Preserve          | ✅ Immediate    | ✅ Validate
Workflow continuation   | ✅ Restore           | ✅ Immediate    | ✅ Re-establish
Session recovery        | ✅ Reconstruct       | ✅ Immediate    | ✅ Re-validate
```

---

## 2. Dual-Lineage Architecture Under Central Coordination

### 2.1 Lineage Definitions

The coordinator governs two distinct operational lineages:

#### **Hiveminder Lineage**
- **Purpose**: Meta-framework construction and phase-planning orchestration
- **Scope**: Framework-level architecture, governance patterns, strategic decomposition
- **Output**: Phase plans, architectural specifications, delegation contracts
- **Constraint**: No direct code implementation; pure orchestration

#### **Hivefiver Lineage**
- **Purpose**: Framework asset construction and surgical refactoring operations
- **Scope**: Skills, commands, workflows, modules, validation gates
- **Output**: Executable assets, compliance frameworks, quality protocols
- **Constraint**: No product-level implementation; meta-builder only

### 2.2 Resource Sharing Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED AGENT POOL                                │
├───────────────┬───────────────┬───────────────┬─────────────────────┤
│  hivemaker    │  hivehealer   │  hivexplorer  │  hiverd             │
│  (Executor)   │  (Remediation)│ (Investigator)│  (Research)         │
├───────────────┴───────────────┴───────────────┴─────────────────────┤
│                    DIVERGENT CONTROLS                               │
├───────────────────────────┬─────────────────────────────────────────┤
│   HIVEMINDER LINEAGE      │        HIVEFIVER LINEAGE                │
│   ─────────────────       │        ────────────────                 │
│   Pathing: .hivemind/     │        Pathing: .opencode/              │
│   State: hierarchy.json   │        State: module-registry           │
│   Control: phase-gates    │        Control: asset-validation        │
│   Focus: orchestration    │        Focus: construction              │
└───────────────────────────┴─────────────────────────────────────────┘
```

### 2.3 Separation of Concerns

| Resource Type | Sharing Model | Rationale |
|---------------|---------------|-----------|
| **Agents** | Fully shared pool | Resource efficiency, unified capability |
| **Skills** | Domain-bundled | Functional cohesion |
| **State Files** | Strictly separated | Prevents cross-contamination |
| **Path Configurations** | Lineage-specific | Isolation boundaries |
| **Control Files** | Non-overlapping | Authority segregation |

### 2.4 Cross-Lineage Communication Contract

When coordination between lineages is required:

1. **Explicit Handoff Only**: No implicit state sharing
2. **Validated Payloads**: All cross-lineage data passes through schema validation
3. **Audit Trail**: Every cross-lineage interaction logged with lineage IDs
4. **Rollback Capability**: Cross-lineage operations must be reversible

---

## 3. Workflow Monitoring and Validation Channel Differentiation

### 3.1 Universal Workflow Requirements

All workflows, regardless of lineage, require:

#### **Handoff Monitoring**
- Continuous tracking of delegation transfers between agents
- Handoff contract validation (task, scope, return format, success metric)
- Failure detection and escalation protocols
- Handoff completion acknowledgment

#### **Context-Aware Validation Channels**
Dynamic activation of validation protocols based on workflow type:

### 3.2 Validation Channel Matrix

```
Workflow Type              | Validation Channel        | Rule Set
---------------------------|---------------------------|---------------------------
Meta-Builder Phase-Planning| Hiveq Architecture Gate   | Macro-planning validation
                           |                           | Specification completeness
                           |                           | Constraint satisfaction
---------------------------|---------------------------|---------------------------
Project-Level Planning     | Hiveq Implementation Gate | Atomic task validation
                           |                           | Deliverable verification
                           |                           | Integration criteria
---------------------------|---------------------------|---------------------------
Framework Asset Creation   | Hiveq Compliance Gate     | Contract adherence
                           |                           | Quality thresholds
                           |                           | Reversibility checks
```

### 3.3 Critical Distinction

**Phase-planning for meta-builder operations follows fundamentally different validation rules than project-level planning.**

| Dimension | Meta-Builder Phase-Planning | Project-Level Planning |
|-----------|----------------------------|------------------------|
| **Scope** | Architectural, cross-cutting | Implementation, bounded |
| **Time Horizon** | Multi-phase, strategic | Single-phase, tactical |
| **Validation Depth** | Constraint satisfaction | Acceptance criteria |
| **Rollback Complexity** | High (cascade effects) | Low (localized) |
| **Success Criteria** | Framework coherence | Feature completion |

### 3.4 Monitoring Infrastructure

```yaml
Monitoring Layers:
  Layer_1_Realtime:
    - Handoff event capture
    - Agent state tracking
    - Context drift detection
    
  Layer_2_Validation:
    - Schema conformance checking
    - Contract validation
    - Gate passage logging
    
  Layer_3_Retrospective:
    - Cycle outcome analysis
    - Pattern detection
    - Quality trending
```

---

## 4. Knowledge Synthesis to Execution Delegation Chain

### 4.1 Delegation Sequence Overview

The following delegation sequence MUST execute with strict format-agnostic handoffs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE SYNTHESIS TO EXECUTION CHAIN                   │
├─────────────┬───────────────────────────────────────────────────────────────┤
│ Step 4.1    │ Knowledge Synthesis Output                                      │
│             │ → Validated artifacts routed to designated folders              │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Step 4.2    │ Hiveminder Delegation                                           │
│             │ → Delegate to Hiveplanner WITHOUT parsing synthesis content     │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Step 4.3    │ Hiveplanner Return                                              │
│             │ → Returns Valid Phase-Planning artifact                         │
│             │ → Hiveminder remains agnostic to internal format/structure      │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Step 4.4    │ Skill-Based Routing                                             │
│             │ → Skill layer auto-delegates to Hiveq for validation            │
│             │ → Hiveminder does NOT interpret or transform artifact           │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Step 4.5    │ Hiveq Validation Protocols                                      │
│             │ → Constitutional awareness required                             │
│             │ → Validate as macro-architectural planning                      │
│             │ → Reject misclassified artifacts                                │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Step 4.6    │ Incremental Integration Gatekeeping                             │
│             │ → Enforce Constitution on atomic plannings                      │
│             │ → Integration criteria verification                             │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

### 4.2 Step 4.1: Knowledge Synthesis Output

**Requirement**: Validated knowledge synthesis artifacts are routed to designated folder structures.

**Folder Structure Convention**:
```
synthesis-output/
├── {timestamp}_{lineage-id}/
│   ├── raw-evidence/
│   │   ├── external-research/
│   │   └── codebase-analysis/
│   ├── synthesis-report.md
│   ├── evidence-index.json
│   └── routing-manifest.yaml
```

**Validation Checklist**:
- [ ] Evidence citations present and verifiable
- [ ] Confidence scores assigned
- [ ] Source provenance documented
- [ ] Contradictions flagged with resolution
- [ ] Routing metadata complete

### 4.3 Step 4.2: Hiveminder Delegation

**Requirement**: Hiveminder delegates to **Hiveplanner** without parsing synthesis content.

**Delegation Contract**:
```yaml
delegation:
  from: hiveminder
  to: hiveplanner
  task: "Generate phase-planning artifact from synthesis"
  scope:
    - Read synthesis folder at PATH
    - Generate phase-planning artifact
    - Do NOT modify synthesis content
  return_format:
    type: "phase-planning-artifact"
    location: "docs/plans/"
    schema: "planning-schema-v1"
  success_metric: "Artifact passes schema validation"
  acceptance_criteria:
    - Valid YAML/Markdown structure
    - All required fields present
    - Lineage ID correctly stamped
  constraints:
    - No content transformation
    - No interpretation of evidence
    - Pass-through only
  evidence:
    - Artifact location
    - Schema validation result
    - Timestamp
```

### 4.4 Step 4.3: Hiveplanner Return

**Requirement**: Hiveplanner returns a **Valid Phase-Planning** artifact. Hiveminder operates as a pass-through agent and must remain agnostic to the artifact's internal format or structure.

**Pass-Through Contract**:
- Hiveminder MUST NOT inspect artifact contents
- Hiveminder MUST NOT transform artifact structure
- Hiveminder MUST preserve artifact integrity
- Hiveminder MAY log artifact metadata (size, timestamp, checksum)

### 4.5 Step 4.4: Skill-Based Routing

**Requirement**: The skill layer automatically delegates the phase-planning artifact to **Hiveq** for validation. Hiveminder does not interpret or transform the artifact during this transition.

**Routing Logic**:
```
IF artifact.type == "phase-planning"
  THEN route_to: hiveq
  WITH validation_mode: "macro-architectural"
  
IF artifact.type == "atomic-planning"
  THEN route_to: hiveq
  WITH validation_mode: "integration-gate"
```

### 4.6 Step 4.5: Hiveq Validation Protocols

**Requirement**: Hiveq must possess complete constitutional awareness to:
- Validate phase-planning as **macro-architectural planning** (not sub-planning or atomic planning)
- Reject phase-planning artifacts misclassified as incremental tasks
- Maintain distinct validation gates for architectural vs. implementation scopes

**Validation Decision Tree**:
```
artifact received
    ↓
Detect artifact lineage
    ↓
IF lineage == "hiveminder"
    ↓
    Validate as MACRO-ARCHITECTURAL
    ├── Check: Strategic decomposition present
    ├── Check: Cross-cutting concerns identified
    ├── Check: Phase boundaries clear
    ├── Check: Constraint satisfaction possible
    └── Gate: PASS / FAIL / REQUIRES_CLARIFICATION
    
IF lineage == "project-team"
    ↓
    Validate as IMPLEMENTATION
    ├── Check: Acceptance criteria defined
    ├── Check: Deliverables specified
    ├── Check: Dependencies identified
    └── Gate: PASS / FAIL / REQUIRES_CLARIFICATION
```

**Rejection Criteria**:
- Artifact claims to be phase-planning but contains only atomic tasks
- Missing strategic context
- No clear constraint boundaries
- Incompatible with stated lineage

### 4.7 Step 4.6: Incremental Integration Gatekeeping

**Requirement**: When atomic plannings (incremental approaches) are delegated for verification, Hiveq must enforce the **Constitution of Incremental Integration Gatekeeping**, ensuring each atomic unit passes integration criteria before advancement.

**Constitution of Incremental Integration Gatekeeping**:

```yaml
article_1_scope:
  applies_to: "All atomic planning artifacts"
  enforcer: "hiveq"
  trigger: "Integration gate checkpoint"

article_2_integration_criteria:
  criterion_1_backward_compatibility:
    description: "Atomic unit must not break existing contracts"
    verification: "Contract diff analysis"
    
  criterion_2_dependency_satisfaction:
    description: "All dependencies must be resolved or mocked"
    verification: "Dependency graph validation"
    
  criterion_3_state_isolation:
    description: "Atomic unit must not leak state"
    verification: "State boundary analysis"
    
  criterion_4_reversibility:
    description: "Atomic unit must be reversible"
    verification: "Rollback path validation"

article_3_gate_protocol:
  step_1: "Verify all criteria pass"
  step_2: "Log integration checkpoint"
  step_3: "IF all pass THEN advance"
  step_4: "IF any fail THEN block and report"
```

---

## 5. Complexity Management and Infection Isolation Protocols

### 5.1 Domain Entanglement Resolution

Address the "mesh of unregulated domains" through structured containment:

#### **5.1.1 Zoom-Out Protocol**
Establish high-level outlines and frames before drilling down.

**Protocol Steps**:
1. **Boundary Mapping**: Identify domain boundaries before exploration
2. **Constraint Identification**: List known constraints before solutioning
3. **Interface Definition**: Define touchpoints between domains
4. **Dependency Ordering**: Establish dependency directionality

```
Zoom-Out Application:
┌─────────────────────────────────────────────────────────┐
│  BEFORE drilling into details:                          │
│  ├── Map: What domains are involved?                    │
│  ├── List: What constraints apply?                      │
│  ├── Define: How do domains interact?                   │
│  └── Order: What depends on what?                       │
└─────────────────────────────────────────────────────────┘
```

#### **5.1.2 Infection Isolation**
Circle and quarantine context rot sources, ambiguous hierarchies, and cross-domain interference patterns.

**Isolation Protocol**:
```yaml
isolation_triggers:
  - context_rot_detected
  - hierarchy_ambiguity_score > threshold
  - cross_domain_interference_detected
  
isolation_actions:
  action_1_identify:
    task: "Mark infected region boundaries"
    output: "isolation-zone-{timestamp}.md"
    
  action_2_quarantine:
    task: "Prevent spread to adjacent domains"
    method: "Boundary hardening"
    
  action_3_remediation:
    task: "Root cause analysis within zone"
    constraint: "Do not affect external domains"
```

#### **5.1.3 Hypothesis-Driven Investigation**
Branch from isolated nodes only after hypothesis validation through iterative research, ingest-contrast-compare cycles, and rationale development.

**Investigation Cycle**:
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ┌──────────────┐                                         │
│   │  Hypothesis  │                                         │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │   Ingest     │ ← Gather evidence                       │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │   Contrast   │ ← Compare with existing knowledge       │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │   Compare    │ ← Evaluate against alternatives         │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │   Validate   │ ─┐                                      │
│   └──────────────┘  │                                      │
│          ↑          │ IF invalid, reformulate hypothesis   │
│          └──────────┘                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Context Integrity Protection

#### **5.2.1 Guard Against Graph-Based Infections**
Cross-domain, interconnected relationships that trigger multiple entry points via event-bus emissions, steering LLMs toward programmatic determinism disguised as meta-concepts.

**Detection Patterns**:
```
Graph Infection Indicators:
├── Multiple entry points activated simultaneously
├── Event-bus cascades across domain boundaries
├── Deterministic outputs masquerading as meta-reasoning
└── Circular references in domain dependencies

Protection Measures:
├── Domain boundary enforcement
├── Event emission auditing
├── Entry point access controls
└── Dependency cycle detection
```

#### **5.2.2 Neutralize Self-Inflicting Meta-Elements**
Prevent scenarios where meta-modules attempt self-healing within the same execution context.

**Prevention Protocol**:
```yaml
meta_element_safety:
  rule_1: "Meta-modules MUST NOT modify themselves"
  rule_2: "Self-healing requires external coordinator"
  rule_3: "All meta-modifications logged and audited"
  rule_4: "Rollback plan required before any meta-change"
  
detection_signals:
  - module_attempts_own_modification
  - circular_meta_reference
  - unvalidated_meta_mutation
```

#### **5.2.3 Filter Document Flooding**
Detect and exclude documents disguised as Source-of-Truth (SOT) containing pre-failing AI investigations.

**SOT Validation Gate**:
```
Document Assessment:
├── Source verification
│   └── Is the document from a validated author?
├── Content analysis
│   └── Does it contain speculative conclusions?
├── Evidence review
│   └── Are claims supported by verifiable data?
├── Timestamp check
│   └── Is the information current (not stale)?
└── Cross-reference
    └── Does it align with other validated sources?

Rejection Criteria:
├── Pre-failing conclusions without evidence
├── Circular self-references
├── Claims without supporting data
└── Contradictions with validated sources
```

### 5.3 Delegation Integrity Enforcement

All agent-to-subagent handoffs must maintain:

#### **Clear Boundary Definitions and Constraints**
```yaml
handoff_boundary_requirements:
  - Explicit task scope
  - Non-negotiable constraints listed
  - Success criteria quantified
  - Failure modes anticipated
```

#### **Sufficient Depth and Breadth Coverage**
```yaml
coverage_requirements:
  depth: "Subagent understands full context"
  breadth: "All relevant domains included"
  precision: "Specific files/locations identified"
  completeness: "No gaps in requirement specification"
```

#### **Explicit State Validation Before Context Transfer**
```
Pre-Handoff Checklist:
├── Source agent state validated
├── Context integrity verified
├── Dependency status confirmed
├── Rollback capability ensured
└── Monitoring hooks activated
```

---

## 6. Deliverables: Skill Package Requirements Documentation

### 6.1 Meta-Framework Builder Modules

#### **6.1.1 Core Meta-Builder Skill Packages**

**Package: meta-builder-core**
```yaml
package_id: MB-CORE-001
purpose: "Core meta-builder functionality with constitutional constraints"
components:
  - identity-management
  - lineage-detection
  - context-preservation
  - delegation-routing

constitutional_constraints:
  - "Must preserve Meta-Builder identity across all operations"
  - "Must enforce dual-lineage separation"
  - "Must validate handoff contracts"
  - "Must prevent context contamination"
  
triggers:
  - "Session initialization"
  - "Lineage context switch"
  - "Cross-lineage coordination"
  - "Meta-framework modification"
```

**Package: meta-builder-validation**
```yaml
package_id: MB-VAL-001
purpose: "Validation workflows for meta-builder operations"
components:
  - phase-planning-validation
  - architecture-gate-enforcement
  - constitutional-compliance-checking
  
workflow_chain:
  - hiveminder (pass-through)
  - hiveplanner (artifact generation)
  - hiveq (validation execution)
  
triggers:
  - "Phase-planning artifact submitted"
  - "Macro-architectural review required"
  - "Constitutional violation detected"
```

#### **6.1.2 Validation Workflow Definitions**

**Hiveminder → Hiveplanner → Hiveq Chain**:

```
┌─────────────────────────────────────────────────────────────────────┐
│ VALIDATION CHAIN: HIVE-MB-001                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │  Hiveminder │────▶│ Hiveplanner │────▶│    Hiveq    │           │
│  │  (Router)   │     │  (Synthesizer)     │  (Validator)│           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│    Pass-through       Artifact Gen       Quality Gate              │
│    No parsing         No interpretation    Constitutional          │
│    Preserve format    Format-agnostic      Awareness Required      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Chain Validation Points**:

| Checkpoint | Validator | Criteria |
|------------|-----------|----------|
| Handoff from Hiveminder | Contract layer | Proper delegation format, no content inspection |
| Hiveplanner output | Schema validator | Valid phase-planning structure |
| Pre-Hiveq routing | Lineage detector | Correct lineage ID, proper routing metadata |
| Hiveq validation | Constitutional checker | Macro-architectural compliance |

#### **6.1.3 State Control File Architectures**

**Dual-Lineage State Separation**:

```
.hivemind/
├── state/
│   └── (legacy - migration in progress)
├── lineage/
│   ├── hiveminder/
│   │   ├── hierarchy.json
│   │   ├── phase-registry.yaml
│   │   └── orchestration-state/
│   └── hivefiver/
│       ├── module-registry.yaml
│       ├── asset-inventory.json
│       └── validation-state/
└── sessions/
    └── active/
        └── {session-id}/
            ├── profile.json
            ├── lineage-context.json
            └── handoff-log/
```

**State Access Rules**:
```yaml
hiveminder_state:
  readable_by:
    - hiveminder
    - hiveplanner
  writable_by:
    - hiveminder
  constraints:
    - "No direct access from hivefiver lineage"
    - "Changes logged with lineage ID"

hivefiver_state:
  readable_by:
    - hivefiver
    - hiveq
  writable_by:
    - hivefiver
  constraints:
    - "No direct access from hiveminder lineage"
    - "Asset validation required before write"

shared_state:
  readable_by:
    - all_agents
  writable_by:
    - designated_coordinators
  constraints:
    - "Schema validation mandatory"
    - "Cross-lineage operations audited"
```

### 6.2 Project Execution Modules

#### **6.2.1 Project-Specific Skill Packages**

**Package Structure Template**:
```yaml
project_skill_package:
  package_id: "PROJ-{name}-{version}"
  domain: "Project-specific execution"
  lineage: "Project team (hiveminder-delegated)"
  
  components:
    implementation_skills:
      - "Language/framework specific"
      - "Domain expertise"
      
    verification_skills:
      - "Testing frameworks"
      - "Quality gates"
      
    coordination_skills:
      - "Team-specific workflows"
      - "Project conventions"

  constraints:
    - "Must respect meta-framework boundaries"
    - "Must validate against hiveq gates"
    - "Must maintain audit trail"
```

#### **6.2.2 Hiveminder Team Specifications for Concrete Deliverables**

**Team Structure**:
```
Project Team (under hiveminder coordination):
├── Implementation Agents
│   ├── hivemaker (primary executor)
│   └── domain specialists
├── Quality Agents
│   ├── hitea (testing)
│   └── hiveq (verification)
└── Support Agents
    ├── hivexplorer (investigation)
    └── hivehealer (remediation)
```

**Deliverable Workflow**:
```
1. Hiveminder receives project request
   ↓
2. Delegates to project team with:
   - Clear deliverable definition
   - Acceptance criteria
   - Quality gates
   ↓
3. Project team executes
   ↓
4. Hiveq validates against project criteria
   ↓
5. Hiveminder coordinates delivery
```

#### **6.2.3 Open Question: Agent Pool Sharing**

**Question**: Determine whether Meta-Framework and Project teams can share agent pools or require strict separation.

**Analysis Framework**:

| Factor | Shared Pool | Strict Separation |
|--------|-------------|-------------------|
| Resource Efficiency | ✅ High | ❌ Low |
| Context Isolation | ⚠️ Risk | ✅ Guaranteed |
| Flexibility | ✅ High | ❌ Low |
| Contamination Risk | ⚠️ Present | ✅ Eliminated |
| Coordination Overhead | ⚠️ Higher | ✅ Lower per-team |

**Recommendation Matrix**:
```
IF project_classification == "trusted"
  AND contamination_history == "clean"
  AND agent_capability == "dual-lineage-aware"
THEN
  sharing_model = "shared_pool_with_validation"
ELSE
  sharing_model = "strict_separation"
```

### 6.3 Refactoring Scope

#### **6.3.1 Audit Existing Skill Packages**

**Audit Dimensions**:
```yaml
audit_framework:
  dimension_1_delegation_chain_compliance:
    check: "Does the skill follow Hiveminder → Hiveplanner → Hiveq chain?"
    severity: "Critical"
    
  dimension_2_format_agnostic_handoffs:
    check: "Does the skill preserve artifact format through handoffs?"
    severity: "Critical"
    
  dimension_3_constitutional_awareness:
    check: "Does the skill validate against constitutional requirements?"
    severity: "High"
    
  dimension_4_lineage_separation:
    check: "Does the skill maintain hiveminder/hivefiver boundary?"
    severity: "Critical"
    
  dimension_5_context_preservation:
    check: "Does the skill prevent context contamination?"
    severity: "Critical"
```

**Audit Report Template**:
```markdown
## Skill Audit: {skill_name}

### Compliance Score: {X}/5

| Dimension | Status | Notes |
|-----------|--------|-------|
| Delegation Chain | ✅/⚠️/❌ | |
| Format Agnostic | ✅/⚠️/❌ | |
| Constitutional | ✅/⚠️/❌ | |
| Lineage Separation | ✅/⚠️/❌ | |
| Context Preservation | ✅/⚠️/❌ | |

### Required Actions:
- [ ] Action 1
- [ ] Action 2

### Refactoring Priority: {P0/P1/P2}
```

#### **6.3.2 Synthesize Cross-Cutting Concerns**

**Concern Matrix**:
```
Cross-Cutting Concerns Between Meta-Builder and Project Contexts:

Concern                | Meta-Builder         | Project              | Integration
-----------------------|----------------------|----------------------|-------------
Validation Gates       | Macro-architectural  | Implementation       | Chain link
Delegation Contracts   | Format-agnostic      | Task-specific        | Template
State Management       | Lineage-separated    | Session-isolated     | Boundary
Quality Assurance      | Constitutional       | Acceptance criteria  | Dual-gate
Error Handling         | Escalation protocol  | Remediation path     | Handoff
```

#### **6.3.3 Establish Incremental Integration Gatekeeping**

**Reusable Constitutional Framework**:

```yaml
framework: incremental-integration-constitution
version: "1.0.0"
applies_to:
  - "All atomic planning validations"
  - "All incremental task verifications"
  - "All sub-task integration checks"

articles:
  article_1_completeness:
    requirement: "Atomic unit must be complete and self-contained"
    verification: "Dependency analysis + scope validation"
    
  article_2_compatibility:
    requirement: "Atomic unit must not break existing contracts"
    verification: "Interface compatibility check"
    
  article_3_isolation:
    requirement: "Atomic unit must not leak state or side effects"
    verification: "State boundary analysis"
    
  article_4_reversibility:
    requirement: "Atomic unit must be reversible without cascade"
    verification: "Rollback impact analysis"
    
  article_5_verifiability:
    requirement: "Atomic unit must have measurable success criteria"
    verification: "Acceptance criteria validation"

gate_protocol:
  - Check all articles
  - Log results with evidence
  - IF all pass → ADVANCE
  - IF any fail → BLOCK + REPORT
```

---

## Success Criteria

Upon completion of refactoring, the framework must achieve:

| Capability | Target State | Measurement |
|------------|--------------|-------------|
| **Workflow Granularity** | State-of-the-art decomposition | All workflows have < 5 minute decision points |
| **Context Automation** | Zero manual context management | Context auto-propagates with validation |
| **Domain-Specific Collaboration** | Specialized agents per domain | Each domain has dedicated validation |
| **Lineage Separation** | Strict non-overlapping paths | Zero cross-contamination events |
| **Validation Protocol Integrity** | 100% gate compliance | All artifacts pass appropriate gates |
| **Maximum Complexity Handling** | Industry-leading capability | Successfully manages 4+ concurrent domains |

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Meta-Builder** | An agent/system that engineers the tools other engineers use |
| **Dual-Lineage** | The separation of Hiveminder (orchestration) and Hivefiver (construction) operational domains |
| **Phase-Planning** | Macro-architectural planning for framework construction |
| **Atomic Planning** | Implementation-level task planning for concrete deliverables |
| **Format-Agnostic Handoff** | Delegation that preserves artifact structure without transformation |
| **Context Poisoning** | Unwanted cross-contamination of operational context between domains |
| **Constitutional Awareness** | Knowledge of and adherence to governance constraints |

### Appendix B: Reference Documents

- AGENTS.md — Agent registry and delegation hierarchy
- modules/registry.yaml — Module definitions and dependencies
- CONTAMINATION-GUARDRAILS.md — Anti-patterns and safe protocols

### Appendix C: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-04 | Initial requirements specification | Documentation Specialist |

---

**END OF DOCUMENT**

**HARD STOP — Document complete and verified**
