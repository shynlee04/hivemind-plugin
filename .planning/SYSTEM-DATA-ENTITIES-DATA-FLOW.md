
# System Architecture: Entity Dataflow, Pipeline Schema & Hierarchical Task Orchestration

## 1. Core Entity Schema (Source of Truth)

Define the relational dataflow between these canonical entities:

- **Project**: Root container for scope, requirements, and lifecycle state
- **Codewiki**: Knowledge graph storing domain concepts, patterns, and architectural decisions
- **Codemap**: Structural representation of codebase topology, dependencies, and module relationships
- **Code-Intel**: Semantic analysis engine providing real-time context, symbol resolution, and cross-reference mapping
- **Tooling Layer**: Custom scripts, automation libraries, and schema validators
- **Main Session**: Primary execution context orchestrating user-agent interactions
- **Delegation Hierarchy**: 3-level nested agent delegation tree (L1: Orchestrator → L2: Specialist → L3: Worker)
- **Report Artifacts**: Structured outputs auto-parsed into hierarchical task trees

**Relationship Mapping**: 
Project ⊃ Codewiki ∪ Codemap ∪ Code-Intel
Main Session → Delegation Tree → Report Artifacts → Hierarchy of Tasks/Subtasks

## 2. Workflow Pipeline Specification

### Phase 1: Project Initialization
```
/gsd:new-project
├── Stakeholder Questionnaire
├── Domain Research & Discovery  
├── Requirements Elicitation
└── Strategic Roadmap Generation
```

### Phase 2: Iterative Phase Execution
For each development phase, enforce this state machine:

1. **`/gsd:discuss-phase`**: Lock architectural preferences and constraints
2. **`/gsd:plan-phase`**: Research synthesis → Technical planning → Constraint verification
3. **`/gsd:execute-phase`**: Parallel execution waves (see Section 3)
4. **`/gsd:verify-work`**: Manual UAT and acceptance criteria validation
5. **Phase Transition Gate**: Conditional progression based on verification status

### Phase 3: Milestone Governance
```
/gsd:audit-milestone → /gsd:complete-milestone
├── Milestone Acceptance Criteria Verification
└── Decision Gate: [New Milestone] vs [Project Completion]
```

## 3. Atomic Planning & Task Hierarchy Model

### 3.1 Task Taxonomy (Classification Schema)
Every atomic task MUST carry one classification tag:
- **Discovery**: Exploration, requirement gathering
- **Discussion**: Stakeholder alignment, architectural review
- **Planning**: Technical specification, resource allocation
- **Investigation**: Root cause analysis, debugging
- **Research**: Feasibility studies, technology evaluation
- **Concept/Brainstorming**: Ideation, pattern exploration
- **Implementation**: Code construction, integration
- **Refactoring**: Structural optimization, debt reduction
- **Testing/Verification**: Quality assurance, validation
- **Experimentation**: Proof-of-concept, spike solutions
- **Pivoting**: Strategic redirection, scope modification
- **Gate-keeping**: Quality control, compliance checks
- **House-keeping**: Maintenance, documentation, cleanup
- **Gap Analysis**: Missing requirement identification
- **Roadmap/Milestone**: Strategic planning artifacts
- **Architecture**: System design, structural decisions
- **Dependency Management**: External/internal dependency resolution
- **Stack Definition**: Technology selection, toolchain configuration

**Framework Alignment Rule**: All classified tasks map directly to `framework-based planning artifacts`, ensuring traceability between execution and strategic planning.

### 3.2 Wave-Based Parallel Execution
Execute atomic plans in dependency-respecting waves:

**Wave Structure**:
- **Wave 1 (Foundation)**: Parallel execution of independent base layers (e.g., User Model, Product Model)
- **Wave 2 (Integration)**: Dependent components requiring Wave 1 completion (e.g., Orders API, Cart API)
- **Wave 3 (Presentation)**: UI/UX layers requiring backend stabilization (e.g., Checkout UI)

**Dependency Resolution**:
```
Plan 03 ↑ Plan 01
Plan 04 ↑ Plan 02  
Plan 05 ↑ Plan 03 ∪ Plan 04
```

### 3.3 Granular Subtask Decomposition
Since standard TODO systems support only single-level nesting, implement `.hivemind/*` storage for deep hierarchy:

**Orchestration Rule**: `hiveminder` agent spawns batches of ≤20 TODO subtasks per atomic plan, controlling flow and framework integration.

**Subtask Node Types** (Granularity Markers):
- **Node A**: Discussion/Discovery nodes (e.g., xx1A)
- **Node B**: Research compilation and synthesis
- **Node C**: Codebase investigation + architectural synthesis
- **Node D**: Context validation + planning verification
- **Node E**: Execution implementation
- **Node F**: Review/Verification checkpoints
- **Node G**: Iterative refinement loops
- **Node Z**: Incremental gate-keeping checkpoints

**Metadata Schema**: Each node carries UUID, relational parent ID, phase context, and framework artifact linkage.

## 4. Session Architecture & Delegation Framework

### 4.1 Session Topology
**Main Session**: Primary user-agent interaction channel
- **Events**: State transitions, execution triggers, action logs
- **User Anchoring**: Explicit feedback injection points
- **Agent Rationale**: Thinking process documentation
- **Session-Specific Memory**: Contextual state using session memory updates

**Delegation Tree** (Max Depth: 3 Levels):
```
L1: Main Session Orchestrator
└── L2: Domain Specialist Agents
    └── L3: Worker/Implementation Agents
```

### 4.2 Auto-Session Management
**Trigger**: Task/Plan completion event
**Action**: Auto-spawn new session with:
- Hierarchical naming convention
- Relational metadata linking to parent task branches
- Planning artifact associations
- Contextual continuity preservation

## 5. Trajectory Capture & Export Protocol

**Trajectory Definition**: Comprehensive export of session narrative with relational metadata.

**Export Components**:
- Main session + all sub-session final assistant outputs
- Interstitial execution logs (decisions, tool invocations, file operations)
- Agent-specific action evidences (read/edit/modify/diff operations)
- Temporal metadata (timestamps, sequence ordering)
- Pivot points and intention shifts
- Tool yield results and sequential action chains

**Schema Requirements**:
- Hierarchical structure (controlling all 3 delegation levels)
- Relational context mapping (relevancy links)
- Concise schematic representation
- Fast traversal and retraceability support
- Cross-session matching capabilities

**Integration**: Utilize hooks, libraries, and automation tools for zero-friction export.

## 6. Code-Intel Integration Layer

Leverage `code-intel` capabilities to enhance:
- Semantic context extraction during Node C operations
- Cross-reference validation during planning phases
- Automated schema generation for Codemap updates
- Symbol resolution for dependency mapping in Wave planning

## 7. Exception Handling: Orphaned Tasks

**Definition**: Tasks lacking framework alignment (non-plan-driven, outside specification scope).

**Handling Protocol**:
- Quarantine in `orphanage/` namespace
- Tag with `uncategorized` metadata
- Require manual classification before framework integration
- No impact on main trajectory metrics or planning artifacts until categorized

## 8. Implementation Directives

1. **Atomicity Enforcement**: Every task MUST equate to one atomic planning artifact
2. **Hierarchy Preservation**: Maintain 3-level delegation depth ceiling
3. **Metadata Integrity**: All entities require UUID, relational links, and temporal stamps
4. **Automation Hooks**: Implement auto-export triggers at session boundaries
5. **Framework Compliance**: Verify all tasks map to planning artifacts before execution authorization
```
```

```markdown
tree
.
└── en
    ├── content
    │   ├── Agent System
    │   │   ├── Agent Hierarchy.md
    │   │   ├── Agent System.md
    │   │   ├── Builder Agent.md
    │   │   ├── High Governance.md
    │   │   ├── Low Validator.md
    │   │   ├── Mid Coordinator.md
    │   │   └── Supreme Coordinator.md
    │   ├── API Reference
    │   │   ├── API Reference.md
    │   │   ├── Data Models.md
    │   │   ├── Event System.md
    │   │   ├── Plugin API
    │   │   │   ├── Message Transform Hooks.md
    │   │   │   ├── Permission Events.md
    │   │   │   ├── Plugin API.md
    │   │   │   ├── Session Compaction Hook.md
    │   │   │   ├── Session Events.md
    │   │   │   └── Tool Interception.md
    │   │   └── Tool API
    │   │       ├── Configuration API.md
    │   │       ├── Performance API.md
    │   │       ├── Security API.md
    │   │       ├── State Management API.md
    │   │       ├── Tool API.md
    │   │       └── Validation API.md
    │   ├── Command System
    │   │   ├── Command Architecture.md
    │   │   ├── Command System.md
    │   │   ├── Core Commands.md
    │   │   ├── Project Management Commands.md
    │   │   ├── Specialized Commands.md
    │   │   └── Workflow Commands.md
    │   ├── Configuration System
    │   │   ├── Completion Definitions.md
    │   │   ├── Configuration Management.md
    │   │   ├── Configuration System.md
    │   │   ├── Model Profiles.md
    │   │   └── Permission Deny Rules.md
    │   ├── Framework Overview
    │   │   ├── Agent Hierarchy.md
    │   │   ├── Architecture Overview.md
    │   │   ├── Building With Agents Framework.md
    │   │   ├── Framework Overview.md
    │   │   ├── OpenCode Plugin Integration.md
    │   │   ├── Permission System.md
    │   │   ├── State Management.md
    │   │   └── Workflow Orchestration.md
    │   ├── Getting Started.md
    │   ├── Permission System
    │   │   ├── Chain Enforcement.md
    │   │   ├── Deny Rules Configuration.md
    │   │   ├── Permission Auditing.md
    │   │   ├── Permission System.md
    │   │   └── Prerequisite Validation.md
    │   ├── Security System
    │   │   ├── Monitoring and Auditing.md
    │   │   ├── Security Policies.md
    │   │   ├── Security System.md
    │   │   ├── Threat Models and Mitigations.md
    │   │   └── Validation Utilities.md
    │   ├── Skill System
    │   │   ├── Governance Skills.md
    │   │   ├── Meta Framework Skills.md
    │   │   ├── Skill Architecture Overview.md
    │   │   ├── Skill Development Guide.md
    │   │   ├── Skill System.md
    │   │   ├── Support Skills.md
    │   │   └── Validation Skills.md
    │   ├── State Management
    │   │   ├── Checkpoint System.md
    │   │   ├── Context Preservation.md
    │   │   ├── Session Tracking.md
    │   │   ├── State Architecture.md
    │   │   ├── State Management.md
    │   │   └── State Operations.md
    │   ├── Templates and Standards
    │   │   ├── Standards and Protocols
    │   │   │   ├── Model Profiles.md
    │   │   │   ├── Standards and Protocols.md
    │   │   │   ├── Test-Driven Development Practices.md
    │   │   │   ├── UI Branding Standards.md
    │   │   │   └── Verification Patterns.md
    │   │   ├── Template System
    │   │   │   ├── Codebase Templates.md
    │   │   │   ├── Style Templates.md
    │   │   │   ├── Template System.md
    │   │   │   └── Workflow Templates.md
    │   │   └── Templates and Standards.md
    │   ├── Testing Guide.md
    │   ├── Tool System
    │   │   ├── Configuration Tool.md
    │   │   ├── Orchestration Tool.md
    │   │   ├── Performance Tool.md
    │   │   ├── Security Tool.md
    │   │   ├── State Management Tool.md
    │   │   ├── Tool System.md
    │   │   ├── Utility Tools.md
    │   │   └── Validation Tool.md
    │   ├── Troubleshooting Guide.md
    │   └── Workflow System
    │       ├── Brainstorm Workflow.md
    │       ├── Execute Phase Workflow.md
    │       ├── Init Workflow.md
    │       ├── Plan Phase Workflow.md
    │       ├── Research Platforms Script.md
    │       ├── Research Workflow.md
    │       ├── Roadmap Workflow.md
    │       ├── Validate Workflow.md
    │       ├── Workflow Architecture.md
    │       ├── Workflow Customization.md
    │       └── Workflow System.md
    └── meta
        └── repowiki-metadata.json

20 directories, 97 files
```