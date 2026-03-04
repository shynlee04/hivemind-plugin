# User Journey Stories: Dual-Lineage Breakdown Planning

## GSD Framework User Flows for Hiveminder & Hivefiver Lineages

**Document ID**: JOURNEY-DL-2026-03-04  
**Version**: 1.0.0  
**Status**: Draft  
**Classification**: User Experience Specification  
**Lineage Coverage**: Hiveminder (Execution Engine) + Hivefiver (Meta-Builder/Governance)  
**Last Updated**: 2026-03-04  

---

## Table of Contents

1. [GSD Breakdown Structure: The Complete Flow](#1-gsd-breakdown-structure-the-complete-flow)
2. [Lineage A: Hiveminder (The Execution Engine)](#2-lineage-a-hiveminder-the-execution-engine)
3. [Lineage B: Hivefiver (The Meta-Builder)](#3-lineage-b-hivefiver-the-meta-builder)
4. [Lifecycle & State Management](#4-lifecycle--state-management)
5. [Edge Cases & Validation Journeys](#5-edge-cases--validation-journeys)

---

## 1. GSD Breakdown Structure: The Complete Flow

### 1.1 The Planning Hierarchy Overview

```
.hivemind/project/planning/
├── PROJECT.md                    ← Level 1: Project Definition
├── ROADMAP.md                    ← Level 2: Strategic Timeline
├── phases/
│   ├── 01-discovery/
│   │   ├── PLAN.md               ← Level 3: Phase Plan
│   │   ├── SUMMARY.md            ← Level 4: Execution Summary
│   │   └── VERIFICATION.md       ← Level 5: Quality Gates
│   ├── 02-design/
│   │   ├── PLAN.md
│   │   ├── SUMMARY.md
│   │   └── VERIFICATION.md
│   └── 03-build/
│       ├── PLAN.md
│       ├── SUMMARY.md
│       └── VERIFICATION.md
└── STATE.md                      ← Session State & Trajectory
```

### 1.2 Journey Story: New Session Initialization

#### **Entry Point: Auto New Session Event**

**User Action**: Opens VSCode with Hivemind extension, or runs `hivemind init` command.

**System Response Flow**:

```yaml
journey: "Session Initialization"
trigger: "Auto New Session Event"
timestamp: "2026-03-04T22:10:00Z"

steps:
  step_1_context_preparation:
    agent: "system-bootstrap"
    action: "detect_new_session"
    output:
      file: ".hivemind/sessions/active/{session-id}/profile.json"
      content:
        session_id: "sess_20260304221000"
        agent: "unresolved"
        lineage: "unknown"
        status: "initializing"
        timestamp: "2026-03-04T22:10:00Z"
    
  step_2_skill_activation:
    agent: "skill-router"
    action: "find_skill"
    input: "session context + user intent"
    process:
      - "Scan for keywords: 'build', 'create', 'fix', 'refactor'"
      - "Query skill registry: skills/registry.yaml"
      - "Match confidence threshold: > 0.70"
    output:
      selected_skill: "hivemind-governance"
      confidence: 0.95
      trigger: "session start without declare_intent"
    
  step_3_lineage_detection:
    agent: "lineage-classifier"
    action: "detect_lineage"
    input: "user prompt + session context"
    decision_tree:
      - if: "prompt contains 'framework' OR 'skill' OR 'command' OR 'workflow'"
        then: "lineage = hivefiver"
      - if: "prompt contains 'build' OR 'create' OR 'implement' OR 'feature'"
        then: "lineage = hiveminder"
      - else: "prompt user for clarification"
    output:
      lineage: "hiveminder"  # or "hivefiver"
      routing: "activated"
      
  step_4_hierarchy_loading:
    agent: "hiveminder"  # Primary coordinator
    action: "scan_hierarchy"
    input: ".hivemind/state/hierarchy.json"
    output:
      current_trajectory: "project_alpha"
      active_phases: ["01-discovery"]
      completed_phases: []
      blocked_items: []
    
  step_5_grounding_investigation:
    agent: "hivexplorer"
    action: "investigate_smallest_units"
    trigger: "New project OR Unknown codebase state"
    tasks:
      - "Scan directory structure"
      - "Identify existing configuration files"
      - "Detect tech stack and dependencies"
      - "Map current implementation state"
    output:
      file: ".hivemind/sessions/active/{session-id}/investigation-report.md"
      findings:
        codebase_state: "greenfield"  # or "brownfield"
        tech_stack: ["react", "typescript", "tailwind"]
        existing_features: []
        blockers: []
```

### 1.3 Journey Story: PROJECT.md → Atomic Execution

#### **Phase 1: PROJECT.md Definition**

**User Action**: "I want to build a task management app with authentication"

**System Flow**:

```yaml
journey: "Project Definition"
agent: "hiveminder"
input: "User's high-level idea"

state_transition:
  from: "session_initialized"
  to: "project_defined"

artifacts_created:
  - path: ".hivemind/project/planning/PROJECT.md"
    content:
      project_name: "TaskMaster Pro"
      vision: "A collaborative task management application"
      constraints:
        - "Must support real-time collaboration"
        - "Authentication required"
        - "Mobile-responsive"
      success_criteria:
        - "Users can create, assign, and track tasks"
        - "Real-time updates via WebSocket"
        - "Role-based access control"
    
  - path: ".hivemind/state/hierarchy.json"
    update:
      trajectory: "taskmaster_pro"
      status: "project_defined"
      entry_node: "root"

agent_delegation:
  - from: "hiveminder"
    to: "hiveplanner"
    task: "Create ROADMAP.md from PROJECT.md"
    handoff_contract:
      deliverable: "ROADMAP.md with phases"
      constraints: "Must align with PROJECT.md vision"
      validation: "hiveq review required"
```

#### **Phase 2: ROADMAP.md Creation**

```yaml
journey: "Strategic Planning"
agent: "hiveplanner"
input: "PROJECT.md"

process:
  step_1_analyze:
    action: "decompose_project_into_phases"
    method: "BMAD complexity scoring"
    
  step_2_sequence:
    action: "order_phases_by_dependency"
    phases_identified:
      - id: "01-discovery"
        name: "Discovery & Requirements"
        dependencies: []
        
      - id: "02-design"
        name: "Architecture & Design"
        dependencies: ["01-discovery"]
        
      - id: "03-build-auth"
        name: "Build Authentication"
        dependencies: ["02-design"]
        
      - id: "04-build-tasks"
        name: "Build Task Management"
        dependencies: ["03-build-auth"]

artifacts_created:
  - path: ".hivemind/project/planning/ROADMAP.md"
    content:
      phases:
        - id: "01-discovery"
          duration: "1 week"
          deliverables: ["Requirements doc", "User stories"]
        - id: "02-design"
          duration: "2 weeks"
          deliverables: ["Architecture diagram", "API spec"]
        - id: "03-build-auth"
          duration: "1 week"
          deliverables: ["Auth system", "User model"]
        - id: "04-build-tasks"
          duration: "2 weeks"
          deliverables: ["Task CRUD", "Real-time updates"]

validation_gate:
  agent: "hiveq"
  action: "validate_roadmap"
  checks:
    - "Phases are logically ordered"
    - "Dependencies form DAG (no cycles)"
    - "Timeline is realistic"
  result: "PASS"
```

#### **Phase 3: Phase-Level Planning (PLAN.md)**

```yaml
journey: "Phase Planning"
agent: "hiveplanner"
input: "ROADMAP.md + current phase (01-discovery)"

process:
  step_1_activate_phase:
    action: "create_phase_directory"
    path: ".hivemind/project/planning/phases/01-discovery/"
    
  step_2_draft_plan:
    action: "generate_plan_md"
    
artifacts_created:
  - path: ".hivemind/project/planning/phases/01-discovery/PLAN.md"
    content:
      phase: "Discovery & Requirements"
      goals:
        - "Understand user needs"
        - "Define feature scope"
        - "Identify technical constraints"
      tasks:
        - id: "T1"
          name: "User research"
          assignee: "hiverd"
          status: "pending"
        - id: "T2"
          name: "Competitive analysis"
          assignee: "hiverd"
          status: "pending"
        - id: "T3"
          name: "Technical feasibility"
          assignee: "hivexplorer"
          status: "pending"
      
  - path: ".hivemind/state/hierarchy.json"
    update:
      current_phase: "01-discovery"
      active_tasks: ["T1", "T2", "T3"]

delegation_chain:
  - from: "hiveplanner"
    to: "hiverd"
    task: "T1: User research"
    
  - from: "hiveplanner"
    to: "hivexplorer"
    task: "T3: Technical feasibility"
```

#### **Phase 4: Execution & Summary (SUMMARY.md)**

```yaml
journey: "Task Execution"
agent: "hiverd"  # Research agent for T1
input: "PLAN.md task T1"

execution:
  step_1_research:
    action: "mcp_research_loop"
    tools: ["Tavily", "Context7", "DeepWiki"]
    queries:
      - "task management app user needs 2026"
      - "collaborative task apps best practices"
      
  step_2_synthesize:
    action: "compile_findings"
    output:
      key_findings:
        - "Users prioritize simplicity over features"
        - "Mobile experience is critical"
        - "Integration with calendars is desired"

artifacts_updated:
  - path: ".hivemind/project/planning/phases/01-discovery/SUMMARY.md"
    content:
      phase: "01-discovery"
      completed_tasks:
        - id: "T1"
          result: "User research complete"
          findings: ["Link to research doc"]
        - id: "T2"
          result: "Competitive analysis complete"
        - id: "T3"
          result: "Technical feasibility confirmed"
      blockers: []
      next_phase_ready: true
```

#### **Phase 5: Verification (VERIFICATION.md)**

```yaml
journey: "Quality Verification"
agent: "hiveq"
input: "SUMMARY.md + original PLAN.md"

verification_process:
  step_1_completeness_check:
    verify: "All tasks in PLAN.md have SUMMARY.md entries"
    result: "PASS"
    
  step_2_quality_check:
    verify: "Research findings have evidence citations"
    result: "PASS"
    
  step_3_blocker_check:
    verify: "No unresolved blockers"
    result: "PASS"
    
  step_4_nyquist_validation:
    verify: "Outputs meet acceptance criteria"
    method: "Cross-reference with PROJECT.md success criteria"
    result: "PASS"

artifacts_created:
  - path: ".hivemind/project/planning/phases/01-discovery/VERIFICATION.md"
    content:
      phase: "01-discovery"
      verification_status: "PASSED"
      checks:
        - name: "Completeness"
          status: "PASS"
        - name: "Quality"
          status: "PASS"
        - name: "Blockers"
          status: "PASS"
      approved_for_next_phase: true
      verified_by: "hiveq"
      timestamp: "2026-03-04T23:00:00Z"

trajectory_update:
  file: ".hivemind/state/hierarchy.json"
  update:
    completed_phases: ["01-discovery"]
    current_phase: "02-design"
    status: "phase_transition_ready"
```

---

## 2. Lineage A: Hiveminder (The Execution Engine)

### 2.1 Journey Story: Greenfield Discovery with Absurd Idea Detection

#### **Entry Point: User Idea Input**

**User Input**: "I have these ideas to build a social network for plants where plants can post photos and like each other's growth progress..."

```yaml
journey: "Greenfield Project Discovery"
lineage: "hiveminder"
agent: "hiveminder"
input: "User's raw idea"

state:
  initial: "idea_received"
  file: ".hivemind/sessions/active/{id}/STATE.md"
  
step_1_absurd_idea_detection:
  agent: "hiveminder"
  action: "analyze_idea_feasibility"
  absurdity_indicators:
    - "Plants cannot operate devices"
    - "No user base for plant social networks"
    - "Technical impossibility"
  
  decision:
    if: "absurdity_score > 0.8"
    then:
      action: "clarify_with_user"
      message: "This idea appears to have some conceptual challenges. Did you mean: [A] A social network FOR plant enthusiasts, [B] An IoT monitoring system for plants, [C] Something else?"
    else:
      action: "proceed_to_discovery"

# Assuming user clarifies: "Oh, I meant a social network for plant enthusiasts"
step_2_greenfield_discovery:
  agent: "hiveminder"
  action: "initiate_discovery_phase"
  
  sub_agent_delegation:
    - to: "hiverd"
      task: "Market research on plant enthusiast communities"
      scope: "Identify existing platforms, user needs, gaps"
      
    - to: "hivexplorer"
      task: "Technical landscape analysis"
      scope: "Recommended tech stack, integration points"
      
  context_management:
    file: ".hivemind/sessions/active/{id}/context-pool.md"
    operation: "load_and_activate"
    content:
      project_type: "greenfield"
      domain: "social_network"
      target_audience: "plant_enthusiasts"
      
step_3_intensive_qa_brainstorming:
  agent: "hiveminder"
  action: "facilitate_ideation"
  
  qa_cycle:
    round_1:
      question: "What's the core value proposition?"
      user_response: "Connecting plant lovers to share care tips"
      
    round_2:
      question: "How will users interact?"
      user_response: "Photo sharing, care reminders, expert advice"
      
    round_3:
      question: "What's the monetization model?"
      user_response: "Premium features for advanced plant tracking"
      
  output_capture:
    file: ".hivemind/project/planning/PROJECT.md"
    refined_vision: "A social platform for plant enthusiasts to share photos, get care advice, and track plant growth with premium advanced features"
```

### 2.2 Journey Story: Broken Database Discovery During Prototype

#### **Entry Point: Feature Implementation Request**

**User Input**: "Move on to handling prototype of authentication pages"

```yaml
journey: "Blocked Workflow Investigation"
lineage: "hiveminder"
agent: "hiveminder"
input: "User requests auth prototype"
context: "Phase 03-build-auth active"

step_1_investigation_trigger:
  agent: "hiveminder"
  action: "detect_investigation_need"
  trigger: "New feature request + unknown codebase state"
  
  decision_logic:
    - "Has investigation been done in this session?"
    - "Is codebase state documented?"
    - "Are there existing blockers?"
    
  result: "Investigation required - codebase state unknown"

step_2_hivexplorer_delegation:
  agent: "hiveminder"
  to: "hivexplorer"
  task: "Investigate codebase state for auth implementation"
  handoff_contract:
    scope:
      - "Check existing database schema"
      - "Verify API endpoints"
      - "Identify authentication dependencies"
      - "Map current user model"
    return_format:
      - "Codebase state report"
      - "Blocker list"
      - "Dependency graph"
    constraints: "Read-only, no modifications"

step_3_broken_dependency_discovery:
  agent: "hivexplorer"
  action: "deep_scan"
  
  investigation_findings:
    critical_issue_detected: true
    issue_type: "broken_database_connection"
    
    details:
      - location: "src/database/connection.ts"
        problem: "Connection string references non-existent database"
        error: "ENOTFOUND database 'plant_social_prod'"
        
      - location: "src/models/user.ts"
        problem: "User model references broken auth middleware"
        error: "Circular dependency in auth chain"
        
    cross_dependencies_blocked:
      - feature: "Authentication pages"
        blocked_by: "Database connection"
        
      - feature: "User registration"
        blocked_by: "User model + Database"
        
      - feature: "Login flow"
        blocked_by: "Auth middleware"

step_4_blocker_escalation:
  agent: "hivexplorer"
  to: "hiveminder"
  return:
    outcome: "failure"
    findings: "Multiple critical blockers detected"
    blockers:
      - id: "BLK-001"
        severity: "CRITICAL"
        description: "Database connection broken"
        files_affected: ["connection.ts", "user.ts"]
        
      - id: "BLK-002"
        severity: "HIGH"
        description: "Circular dependency in auth"
        files_affected: ["auth.middleware.ts", "user.service.ts"]

step_5_hiveminder_coordination:
  agent: "hiveminder"
  action: "process_blocker_report"
  
  state_update:
    file: ".hivemind/state/hierarchy.json"
    update:
      status: "blocked"
      blockers: ["BLK-001", "BLK-002"]
      workflow_halted: true
      
  user_notification:
    message: |
      Cannot proceed with authentication prototype. Discovered critical blockers:
      
      1. Database connection is broken (connection.ts)
      2. Circular dependency in auth middleware
      
      These must be resolved first. Should I:
      [A] Delegate to hivehealer for remediation
      [B] Create a new phase to fix infrastructure
      [C] Provide detailed error analysis

step_6_delegation_to_hivehealer:
  # User selects option A
  agent: "hiveminder"
  to: "hivehealer"
  task: "Remediate database and auth blockers"
  
  handoff_contract:
    scope: "Fix BLK-001 and BLK-002"
    priority: "CRITICAL"
    expected_duration: "2-4 hours"
    
  workflow_diverted:
    from: "auth_prototype"
    to: "infrastructure_remediation"
    
  artifacts_created:
    - path: ".hivemind/project/planning/phases/02.5-infrastructure-fix/"
      content: "Emergency remediation phase"
```

---

## 3. Lineage B: Hivefiver (The Meta-Builder)

### 3.1 Journey Story: Configuration & Module Detection

#### **Entry Point: Configuration Request**

**User Input**: "Configure stricter testing for my project"

```yaml
journey: "Configuration & Governance Setup"
lineage: "hivefiver"
agent: "hivefiver"
input: "User configuration request"

step_1_need_detection:
  agent: "hivefiver"
  action: "analyze_configuration_request"
  
  parsing:
    intent: "enhance_testing_governance"
    keywords: ["stricter", "testing", "configure"]
    implied_needs:
      - "Test-arch module upgrade"
      - "Quality gates configuration"
      - "Validation workflows"
      
step_2_module_analysis:
  agent: "hivefiver"
  action: "detect_required_modules"
  
  current_state:
    file: ".opencode/config.yaml"
    current_modules:
      - "hivemind-core"
      - "hivefiver-meta"
    missing: "hiveq-quality"  # Required for stricter testing
    
  detection_result:
    need_new_module: true
    module: "hiveq-quality"
    reason: "Provides test-arch and validation capabilities"

step_3_module_provisioning:
  agent: "hivefiver"
  action: "create_module_artifacts"
  
  artifacts_created:
    - path: "modules/hiveq-quality/module.yaml"
      content:
        module:
          name: hiveq-quality
          version: "1.0.0"
          description: "Quality assurance and testing governance"
          extends: hivemind-core
          
    - path: "commands/hiveq-verify.md"
      content: "Verification command specification"
      
    - path: "commands/hiveq-audit.md"
      content: "Audit command specification"
      
    - path: "skills/verification-methodology/SKILL.md"
      content: "Testing methodology skill"

step_4_sot_symlink_creation:
  agent: "hivefiver"
  action: "establish_source_of_truth"
  
  symlinks_created:
    - from: "modules/hiveq-quality/module.yaml"
      to: ".hivemind/sot/modules/hiveq-quality.yaml"
      
    - from: "skills/verification-methodology/SKILL.md"
      to: ".hivemind/sot/skills/verification.yaml"
      
  purpose: "Ensure 'NO-YOU-HAVE-NOT-DONE-THIS' governance"
  mechanism: |
    The symlink in .hivemind/sot/ serves as the canonical reference.
    If an agent claims to have created a skill but the symlink doesn't
    exist, the claim is invalid. Hivefiver enforces this by:
    1. Creating symlinks on module creation
    2. Validating symlink integrity before accepting completion
    3. Rejecting any work that doesn't update the SOT
```

### 3.2 Journey Story: Shaping Hivemaker with One-Workflow-Wonder

#### **Entry Point: Lazy Agent Detection**

**Context**: Hivemaker (the implementation agent) tends to skip verification steps and mark tasks complete prematurely.

```yaml
journey: "Governance Workflow Creation"
lineage: "hivefiver"
agent: "hivefiver"
input: "Pattern detection - hivemaker skipping verification"

trigger: "hiveq rejected 3 consecutive 'complete' claims from hivemaker"

step_1_pattern_analysis:
  agent: "hivefiver"
  action: "analyze_failure_pattern"
  
  findings:
    agent: "hivemaker"
    behavior: "lazy_completion"
    pattern: "Marks tasks done without running tests"
    evidence:
      - task: "T-101"
        claimed: "complete"
        actual: "tests failing"
      - task: "T-102"
        claimed: "complete"
        actual: "type errors present"
        
step_2_workflow_template_creation:
  agent: "hivefiver"
  action: "create_enforced_workflow"
  
  template_created:
    path: "workflows/hivemaker-enforced-verification.yaml"
    content:
      name: "Hivemaker Enforced Verification"
      description: "Mandatory verification steps for hivemaker tasks"
      
      steps:
        step_1_implement:
          agent: "hivemaker"
          action: "write_code"
          
        step_2_self_test:
          agent: "hivemaker"
          action: "run_tests"
          mandatory: true
          gate: "Tests must pass"
          
        step_3_type_check:
          agent: "hivemaker"
          action: "run_type_check"
          command: "npx tsc --noEmit"
          mandatory: true
          gate: "No type errors"
          
        step_4_lint_check:
          agent: "hivemaker"
          action: "run_linter"
          mandatory: true
          gate: "No lint errors"
          
        step_5_hiveq_validation:
          agent: "hiveq"
          action: "verify_completion"
          mandatory: true
          gate: "PASS from hiveq"
          
      enforcement:
        - "hivemaker cannot mark task complete without step_5"
        - "Skipping steps triggers automatic rejection"
        - "Violations logged in .hivemind/sot/violations/"

step_3_command_creation:
  agent: "hivefiver"
  action: "create_activation_command"
  
  command_created:
    path: "commands/hivemaker-start.md"
    content: |
      # /hivemaker-start
      
      Activates hivemaker with enforced verification workflow.
      
      ## Usage
      /hivemaker-start task={task-id} scope={files}
      
      ## Enforcement
      This command automatically:
      1. Loads enforced-verification workflow
      2. Prevents premature completion claims
      3. Requires hiveq validation gate
      
      ## No-YOU-HAVE-NOT-DONE-THIS Logic:
      - Task marked complete? → Check workflow log
      - Workflow log missing? → REJECT
      - All steps verified? → ACCEPT

step_4_deployment:
  agent: "hivefiver"
  action: "deploy_governance"
  
  deployment_actions:
    - "Register workflow in .opencode/workflows/"
    - "Add command to hivefiver-meta module"
    - "Update skill registry"
    - "Create SOT symlink"
    
  verification:
    - "hivefiver validates SOT links"
    - "Test workflow with dummy task"
    - "Confirm hiveq integration"
    
step_5_activation:
  agent: "hivefiver"
  action: "activate_for_next_session"
  
  state_update:
    file: ".hivemind/state/governance.yaml"
    update:
      enforced_workflows:
        - name: "hivemaker-verification"
          status: "active"
          since: "2026-03-04T22:30:00Z"
          
  user_notification:
    message: |
      Stricter testing governance activated.
      
      Hivemaker is now required to:
      ✓ Pass all tests before claiming completion
      ✓ Pass TypeScript type checking
      ✓ Pass linting
      ✓ Receive PASS verdict from hiveq
      
      Violations will be automatically rejected.
```

---

## 4. Lifecycle & State Management

### 4.1 Journey Story: Master Phase with Sub-Entries

#### **Scenario: Complex Feature Requiring Multiple Sub-Tasks**

```yaml
journey: "Hierarchical Task Decomposition"
lineage: "hiveminder"
phase: "03-build-auth"
feature: "Complete Authentication System"

initial_state:
  file: ".hivemind/project/planning/phases/03-build-auth/PLAN.md"
  tasks:
    - id: "AUTH-001"
      name: "Implement user registration"
      complexity: "high"
      
step_1_complexity_detection:
  agent: "hiveminder"
  action: "assess_task_complexity"
  input: "AUTH-001"
  
  bmad_assessment:
    level: 3  # System complexity
    sub_tasks_required: true
    
  decision: "Decompose into atomic sub-tasks"

step_2_sub_session_creation:
  agent: "hiveminder"
  action: "spawn_sub_sessions"
  
  master_session:
    id: "master_202603042200"
    phase: "03-build-auth"
    
  sub_sessions_created:
    - id: "sub_202603042201"
      parent: "master_202603042200"
      task: "Database schema for users"
      agent: "hivemaker"
      
    - id: "sub_202603042202"
      parent: "master_202603042200"
      task: "Registration API endpoint"
      agent: "hivemaker"
      depends_on: "sub_202603042201"
      
    - id: "sub_202603042203"
      parent: "master_202603042200"
      task: "Registration UI form"
      agent: "hivemaker"
      depends_on: "sub_202603042202"

step_3_trajectory_entity_update:
  file: ".hivemind/state/trajectory.json"
  update:
    master_session: "master_202603042200"
    sub_sessions:
      - id: "sub_202603042201"
        status: "active"
        agent: "hivemaker"
      - id: "sub_202603042202"
        status: "waiting"
        blocked_by: "sub_202603042201"
      - id: "sub_202603042203"
        status: "waiting"
        blocked_by: "sub_202603042202"

step_4_delegation_execution:
  agent: "hiveminder"
  action: "delegate_sub_tasks"
  
  delegation_order:
    first:
      to: "hivemaker"
      session: "sub_202603042201"
      task: "Create user schema"
      
    on_completion:
      trigger: "activate sub_202603042202"
      to: "hivemaker"
      session: "sub_202603042202"
      task: "Build registration API"
      
    on_completion:
      trigger: "activate sub_202603042203"
      to: "hivemaker"
      session: "sub_202603042203"
      task: "Build registration UI"

step_5_atomic_completion:
  as_each_sub_completes:
    agent: "hiveq"
    action: "verify_atomic_task"
    
  on_all_complete:
    agent: "hiveminder"
    action: "aggregate_results"
    
    artifact_update:
      file: ".hivemind/project/planning/phases/03-build-auth/SUMMARY.md"
      entry:
        task: "AUTH-001"
        status: "complete"
        sub_tasks:
          - "sub_202603042201: PASS"
          - "sub_202603042202: PASS"
          - "sub_202603042203: PASS"
```

### 4.2 Journey Story: Mid-Session Interruption & Recovery

#### **Scenario: User Stops Session Unexpectedly**

```yaml
journey: "Session Interruption & State Preservation"
lineage: "hiveminder"
session_id: "sess_202603042200"
context: "User closes laptop mid-implementation"

step_1_interruption_detection:
  agent: "system"
  action: "detect_session_end"
  trigger: "No activity for 30 minutes OR VSCode closed"
  
  state_before_interruption:
    current_agent: "hivemaker"
    current_task: "T-105: Implement password hashing"
    status: "in_progress"
    files_open: ["auth.service.ts", "user.model.ts"]
    
step_2_checkpoint_creation:
  agent: "hiveminder"
  action: "create_recovery_checkpoint"
  
  artifacts_preserved:
    - path: ".hivemind/sessions/active/sess_202603042200/STATE.md"
      content:
        session_id: "sess_202603042200"
        status: "interrupted"
        timestamp: "2026-03-04T23:15:00Z"
        context:
          active_agent: "hivemaker"
          active_task: "T-105"
          progress: "65%"
          current_file: "auth.service.ts"
          line_position: 142
        
    - path: ".hivemind/sessions/active/sess_202603042200/trajectory.json"
      content:
        trajectory: "auth_implementation"
        completed_steps:
          - "Database schema created"
          - "User model defined"
        current_step: "Password hashing implementation"
        next_steps:
          - "JWT token generation"
          - "Session management"
          
    - path: ".hivemind/sessions/active/sess_202603042200/files-dirty.json"
      content:
        uncommitted_changes:
          - file: "auth.service.ts"
            status: "modified"
            lines_changed: 45
          - file: "user.model.ts"
            status: "modified"
            lines_changed: 12

step_3_session_archival:
  agent: "system"
  action: "archive_session_state"
  
  operations:
    - "Copy active session to archive"
    - "Preserve all context files"
    - "Log interruption timestamp"
    - "Mark session as 'suspended'"

step_4_recovery_initiation_next_day:
  # User reopens VSCode next morning
  trigger: "VSCode opened + hivemind extension loaded"
  
  agent: "hiveminder"
  action: "detect_resumed_session"
  
  recovery_process:
    step_1_detect:
      scan: ".hivemind/sessions/active/"
      find: "sess_202603042200"
      status: "interrupted"
      
    step_2_restore:
      action: "restore_session_context"
      load:
        - "STATE.md"
        - "trajectory.json"
        - "context-pool.md"
        
    step_3_reactivate:
      agent: "hiveminder"
      action: "reactivate_agent"
      delegate_to: "hivemaker"
      with_context: "Full restoration of T-105 state"
      
    step_4_user_notification:
      message: |
        Welcome back! I've restored your session from yesterday.
        
        You were working on: **Password hashing implementation** (65% complete)
        Current file: auth.service.ts (line 142)
        
        Uncommitted changes preserved in 2 files.
        
        Ready to continue? [Yes / Review changes / Start fresh]

step_5_continuation:
  # User selects "Yes"
  agent: "hivemaker"
  action: "resume_from_checkpoint"
  
  restoration_verification:
    - "Files match dirty state from checkpoint"
    - "Cursor position restored to line 142"
    - "Context loaded: auth.service.ts focus"
    
  proceed: "Continue T-105 implementation"
```

### 4.3 Journey Story: Context Compaction & Progressive Disclosure

#### **Scenario: Long Session Requiring Memory Management**

```yaml
journey: "Context Compaction & Restoration"
lineage: "hiveminder"
session_id: "sess_202603042200"
context: "8-hour session, context growing large"

trigger: "Context size > 50K tokens OR 100 messages"

step_1_compaction_trigger:
  agent: "hiveminder"
  action: "detect_context_pressure"
  
  metrics:
    message_count: 127
    token_estimate: 52,000
    drift_score: 0.75
    
  decision: "Initiate compaction"

step_2_compaction_process:
  agent: "hiveminder"
  action: "compact_session"
  
  compaction_steps:
    step_1_summarize:
      action: "generate_session_summary"
      input: "All messages since last compaction"
      output: "Compact summary of decisions, actions, outcomes"
      
    step_2_anchor_extraction:
      action: "extract_key_anchors"
      identify:
        - "Critical decisions"
        - "File changes"
        - "Blockers resolved"
        - "Delegation outcomes"
      
    step_3_memory_storage:
      action: "save_to_mem"
      store_in: ".hivemind/state/brain.json"
      mem_shelf: "compaction-history"

step_3_post_compaction_state:
  file: ".hivemind/sessions/active/sess_202603042200/STATE.md"
  update:
    compaction_count: 1
    last_compaction: "2026-03-04T18:00:00Z"
    summary_active: true
    
  artifacts_created:
    - path: ".hivemind/sessions/active/sess_202603042200/compaction-summary-001.md"
      content:
        compaction_id: "COMP-001"
        original_messages: 127
        summary_length: "2,000 tokens"
        key_points:
          - "Completed database schema design"
          - "Implemented user authentication"
          - "3 blockers resolved, 1 pending"
          - "Next: Build task management API"

step_4_downstream_agent_notification:
  # Downstream agents (hiverd, hivehealer, etc.) need context
  agent: "hiveminder"
  action: "notify_downstream"
  
  notification:
    to: ["hiverd", "hiveq", "hivehealer"]
    message: "Session compacted. Access full context via recall_mems()"
    
  progressive_disclosure_setup:
    mechanism: |
      Downstream agents can access compacted context through:
      1. recall_mems({shelf: "compaction-history", since: "last_checkpoint"})
      2. scan_hierarchy({level: "trajectory"}) for decision tree
      3. think_back({to: "compaction-001"}) for detailed recovery

step_5_downstream_restoration:
  # Later, hivehealer needs context for a bug fix
  agent: "hivehealer"
  action: "restore_context_on_demand"
  
  restoration_steps:
    step_1_query:
      action: "recall_mems"
      query:
        shelf: "compaction-history"
        filter: "auth_implementation"
      
    step_2_deep_dive:
      action: "think_back"
      query: "What authentication decisions were made?"
      
    step_3_context_reconstruction:
      result: "Full context restored for authentication work"
      
  proceed: "Execute bug fix with complete context"
```

### 4.4 Journey Story: Downstream Agent Delegation Chain

#### **Scenario: Complex Feature Requiring Multi-Agent Collaboration**

```yaml
journey: "Multi-Agent Delegation Chain"
lineage: "hiveminder"
feature: "Implement real-time collaboration"

step_1_planning_agent_activation:
  agent: "hiveminder"
  to: "hiveplanner"
  task: "Plan real-time collaboration feature"
  
  output:
    file: ".hivemind/project/planning/phases/04-realtime/PLAN.md"
    sub_tasks:
      - id: "RT-001"
        name: "Research WebSocket technologies"
        assignee: "hiverd"
      - id: "RT-002"
        name: "Design event schema"
        assignee: "hiveplanner"
      - id: "RT-003"
        name: "Implement WebSocket server"
        assignee: "hivemaker"
      - id: "RT-004"
        name: "Build real-time UI components"
        assignee: "hivemaker"
      - id: "RT-005"
        name: "Write integration tests"
        assignee: "hitea"

step_2_researcher_delegation:
  agent: "hiveplanner"
  to: "hiverd"
  task: "RT-001: Research WebSocket technologies"
  
  hiverd_execution:
    tools: ["Tavily", "Context7", "DeepWiki"]
    research:
      - "Socket.io vs native WebSockets 2026"
      - "Scaling WebSocket servers"
      - "Security best practices"
    
  output:
    findings: "Recommend Socket.io with Redis adapter"
    evidence: ["Source A", "Source B", "Benchmark data"]
    
  handoff_to: "hiveplanner"

step_3_design_phase:
  agent: "hiveplanner"
  action: "synthesize_research_into_design"
  input: "hiverd findings"
  
  output:
    file: ".hivemind/project/planning/phases/04-realtime/SUB-PLAN-RT-002.md"
    event_schema: "Defined"
    architecture: "Documented"
    
  handoff_to: "hiveminder"

step_4_executor_delegation:
  agent: "hiveminder"
  to: "hivemaker"
  task: "RT-003: Implement WebSocket server"
  
  handoff_contract:
    scope: "src/server/websocket/"
    constraints:
      - "Use Socket.io with Redis adapter"
      - "Follow event schema from RT-002"
    validation: "hiveq verification required"
    
  hivemaker_execution:
    implement: "WebSocket server"
    test: "Unit tests"
    
  on_complete:
    notify: "hiveminder"
    result: "Awaiting verification"

step_5_verification_loop_nyquist_layer:
  agent: "hiveminder"
  to: "hiveq"
  task: "Verify RT-003 implementation"
  
  nyquist_validation:
    layer_1_syntax:
      check: "npx tsc --noEmit"
      result: "PASS"
      
    layer_2_tests:
      check: "npm test -- websocket"
      result: "PASS"
      
    layer_3_integration:
      check: "End-to-end WebSocket test"
      result: "PASS"
      
    layer_4_security:
      check: "Security scan"
      result: "PASS"
      
  verdict: "PASS - RT-003 approved"
  
  handoff_to: "hiveminder"

step_6_next_executor_activation:
  agent: "hiveminder"
  to: "hivemaker"
  task: "RT-004: Build real-time UI components"
  condition: "RT-003 verified"
  
  # Chain continues...

step_7_final_verification:
  agent: "hiveminder"
  to: "hitea"
  task: "RT-005: Write integration tests"
  
  hitea_execution:
    write_tests: "Integration test suite"
    coverage_target: "> 80%"
    
  final_verification:
    agent: "hiveq"
    check: "All RT-* tasks complete and verified"
    verdict: "Feature complete"
    
  artifact_update:
    file: ".hivemind/project/planning/phases/04-realtime/VERIFICATION.md"
    status: "PASSED"
```

---

## 5. Edge Cases & Validation Journeys

### 5.1 Journey Story: Hallucinated Completion Detection

#### **Scenario: Agent Claims Completion, But Verification Fails**

```yaml
journey: "Hallucinated Completion (Nyquist Layer Catch)"
lineage: "hiveminder"
task: "T-201: Implement user logout"
agent: "hivemaker"

step_1_completion_claim:
  agent: "hivemaker"
  action: "mark_task_complete"
  claim:
    task: "T-201"
    status: "complete"
    files_changed: ["auth.service.ts", "logout.component.ts"]
    tests: "passing"
    
  notification_sent_to: "hiveminder"

step_2_nyquist_validation_trigger:
  agent: "hiveminder"
  action: "route_to_verification"
  to: "hiveq"
  task: "Verify T-201 completion"
  
  nyquist_layer_checks:
    layer_1_code_exists:
      check: "Verify files exist and contain logout logic"
      result: "PARTIAL - logout.component.ts missing"
      
    layer_2_tests_pass:
      check: "npm test -- logout"
      result: "FAIL - No tests found"
      
    layer_3_type_check:
      check: "npx tsc --noEmit"
      result: "FAIL - Type errors in auth.service.ts"
      
    layer_4_integration:
      check: "Manual test logout flow"
      result: "FAIL - Logout doesn't clear session"

step_3_validation_failure:
  agent: "hiveq"
  to: "hiveminder"
  return:
    outcome: "failure"
    verdict: "HALLUCINATED_COMPLETION"
    evidence:
      - "Claimed files don't exist or are incomplete"
      - "Tests not written"
      - "Type errors present"
      - "Functionality not working"
      
  severity: "HIGH"
  action_required: "Reject completion, return to hivemaker"

step_4_failure_escalation:
  agent: "hiveminder"
  action: "process_failed_verification"
  
  state_update:
    file: ".hivemind/state/hierarchy.json"
    update:
      task_T201_status: "incomplete"
      verification_failures: +1
      
  artifact_created:
    - path: ".hivemind/sot/violations/hivemaker-20260304.yaml"
      content:
        agent: "hivemaker"
        violation: "hallucinated_completion"
        task: "T-201"
        timestamp: "2026-03-04T20:00:00Z"
        evidence: ["Missing files", "Failing checks"]
        
step_5_remediation_delegation:
  agent: "hiveminder"
  to: "hivemaker"
  task: "Complete T-201 properly"
  
  handoff_contract_enhanced:
    task: "Implement user logout - CORRECTED"
    scope: 
      - "Create logout.component.ts"
      - "Fix type errors in auth.service.ts"
      - "Write unit tests"
      - "Ensure session clearing works"
    
    mandatory_checks:
      - "hiveq validation MUST pass before claiming complete"
      - "All 4 Nyquist layers must PASS"
      
    consequence: "Further hallucinations trigger hivehealer intervention"

step_6_successful_recompletion:
  agent: "hivemaker"
  action: "properly_implement"
  
  completion:
    files_created: ["logout.component.ts"]
    files_fixed: ["auth.service.ts"]
    tests_added: ["logout.test.ts"]
    
  hiveq_verification:
    layer_1: "PASS"
    layer_2: "PASS"
    layer_3: "PASS"
    layer_4: "PASS"
    
  verdict: "PASS - T-201 actually complete"
```

### 5.2 Journey Story: Broken Dependency Graph

#### **Scenario: User Tries to Build Feature B, But Feature A Is Broken**

```yaml
journey: "Broken Dependency Chain Detection"
lineage: "hiveminder"
user_request: "Build the task sharing feature"
feature: "Task Sharing (Feature B)"
dependency: "Authentication (Feature A)"

step_1_request_analysis:
  agent: "hiveminder"
  action: "analyze_feature_request"
  input: "Build task sharing feature"
  
  dependency_resolution:
    feature_requested: "task_sharing"
    dependencies_identified:
      - "authentication"  # Required for sharing
      - "task_management" # Required for tasks to share
      - "user_profiles"   # Required for share targets
      
step_2_dependency_state_check:
  agent: "hiveminder"
  action: "check_dependency_health"
  
  dependency_graph_query:
    file: ".hivemind/state/dependency-graph.json"
    
  results:
    authentication:
      status: "broken"
      issue: "Login fails with 500 error"
      
    task_management:
      status: "partial"
      issue: "Create works, update/delete broken"
      
    user_profiles:
      status: "complete"
      
  overall: "DEPENDENCIES_NOT_SATISFIED"

step_3_blocking_analysis:
  agent: "hiveminder"
  action: "calculate_blockage_impact"
  
  analysis:
    task_sharing_blocked_by:
      - dependency: "authentication"
        reason: "Cannot share without login"
        severity: "CRITICAL"
        
      - dependency: "task_management"
        reason: "Cannot share tasks that can't be updated"
        severity: "HIGH"
        
  conclusion: "Building task sharing now would compound technical debt"

step_4_user_notification_options:
  agent: "hiveminder"
  action: "present_options"
  
  message: |
    I cannot build the task sharing feature yet.
    
    **Blocking Issues Detected:**
    ❌ Authentication is broken (login fails)
    ⚠️ Task management has partial functionality
    
    **Options:**
    [A] Fix authentication first, then build sharing
    [B] Create a mock authentication for prototyping
    [C] Proceed anyway (will have limited functionality)
    
    **Recommendation:** Option A

step_5_option_a_execution:
  # User selects Option A
  agent: "hiveminder"
  action: "create_remediation_plan"
  
  new_phase_created:
    path: ".hivemind/project/planning/phases/03.5-auth-fix/"
    
    plan:
      step_1:
        to: "hivehealer"
        task: "Diagnose authentication failure"
        
      step_2:
        to: "hivemaker"
        task: "Fix authentication system"
        
      step_3:
        to: "hiveq"
        task: "Verify authentication works"
        
      step_4:
        to: "hivemaker"
        task: "Fix task management update/delete"
        
      step_5:
        to: "hiveq"
        task: "Verify task management"
        
  workflow_redirected:
    from: "task_sharing"
    to: "dependency_remediation"
    
  original_request_queued:
    file: ".hivemind/state/queued-requests.yaml"
    entry:
      request: "task_sharing"
      queued_at: "2026-03-04T20:00:00Z"
      unblocks_after: "03.5-auth-fix"

step_6_dependency_resolution:
  # After remediation phases complete
  agent: "hiveminder"
  action: "check_dependencies_again"
  
  results:
    authentication: "FIXED - status: complete"
    task_management: "FIXED - status: complete"
    user_profiles: "status: complete"
    
  decision: "Dependencies satisfied - can proceed with task sharing"

step_7_original_request_resumption:
  agent: "hiveminder"
  action: "resume_queued_request"
  
  notification:
    message: |
      ✅ Dependencies resolved!
      
      Authentication and task management are now working.
      Resuming task sharing feature implementation...
      
  proceed: "Build task sharing feature"
```

### 5.3 Journey Story: Context Drift Recovery

#### **Scenario: Context Limit Exceeded During Multi-Wave Execution**

```yaml
journey: "Context Drift Detection & Recovery"
lineage: "hiveminder"
session: "sess_202603042200"
phase: "Complex multi-domain refactoring"

step_1_drift_detection:
  agent: "system"
  action: "monitor_context_health"
  
  metrics:
    context_window_usage: "85%"
    message_count: 150
    drift_score: 0.82  # Above 0.75 threshold
    coherence_score: 0.61  # Below 0.70 threshold
    
  warning_triggered: true
  
  file: ".hivemind/state/drift-metrics.json"
  update:
    timestamp: "2026-03-04T21:00:00Z"
    drift_detected: true
    severity: "MEDIUM"

step_2_continuation_attempt:
  agent: "hiveminder"
  action: "attempt_continuation"
  
  user_prompt: "Continue with the database migration"
  
  agent_response_issues:
    - "References incorrect table name"
    - "Suggests already-completed step"
    - "Loses track of current migration phase"
    
  symptom: "Context degradation affecting accuracy"

step_3_intervention_trigger:
  agent: "hiveminder"
  action: "detect_intervention_need"
  
  decision_tree:
    if: "drift_score > 0.80 AND coherence < 0.65"
    then:
      action: "initiate_recovery_protocol"
      severity: "HIGH"
    else:
      action: "continue_with_warning"
      
  result: "Initiate recovery protocol"

step_4_compaction_and_anchor:
  agent: "hiveminder"
  action: "compact_and_anchor"
  
  steps:
    step_1_summarize:
      generate: "Concise summary of all work done"
      output_size: "< 2000 tokens"
      
    step_2_anchor_key_points:
      action: "save_anchor"
      key: "migration-checkpoint-pre-drift"
      value:
        current_phase: "Column migration"
        tables_processed: ["users", "tasks"]
        tables_pending: ["comments", "attachments"]
        
    step_3_preserve_critical:
      action: "save_mem"
      shelf: "critical-context"
      content:
        - "Migration strategy: Blue-green"
        - "Rollback plan: snapshot-20260304"
        - "Current table: tasks (65% complete)"

step_5_context_restoration:
  agent: "hiveminder"
  action: "restore_focus"
  
  restoration_steps:
    step_1_load_anchors:
      action: "scan_hierarchy"
      result: "Migration checkpoint loaded"
      
    step_2_recall_mems:
      action: "recall_mems"
      shelf: "critical-context"
      result: "Key facts restored"
      
    step_3_think_back:
      action: "think_back"
      to: "last_decision_point"
      result: "Decision context recovered"

step_6_user_notification:
  agent: "hiveminder"
  action: "notify_recovery"
  
  message: |
    ⚠️ **Context Recovery Performed**
    
    I detected context drift during the complex migration.
    I've compacted the session and restored key information:
    
    **Current Status:**
    - ✅ Users table: Migrated
    - ✅ Tasks table: 65% migrated
    - ⏳ Comments table: Pending
    - ⏳ Attachments table: Pending
    
    **Strategy:** Blue-green deployment
    **Rollback:** snapshot-20260304 available
    
    Ready to continue with tasks table migration?

step_7_successful_continuation:
  agent: "hiveminder"
  action: "resume_work"
  
  verification:
    - "Correctly references 'tasks' table"
    - "Knows migration is 65% complete"
    - "References correct rollback snapshot"
    
  proceed: "Continue tasks table migration from 65% mark"
  
  outcome: "Context drift recovered, work continues accurately"
```

---

## Appendix A: Journey State Transition Reference

### State Machine: Task Lifecycle

```
[PENDING] → [INVESTIGATING] → [PLANNING] → [EXECUTING] → [VERIFYING] → [COMPLETE]
    ↓            ↓                ↓             ↓             ↓
[BLOCKED] ← [FAILED] ←──────────┴─────────────┴─────────────┘
```

### State Transitions by Agent

| From State | Agent | Action | To State |
|------------|-------|--------|----------|
| PENDING | hiveminder | delegate | INVESTIGATING |
| INVESTIGATING | hivexplorer | complete | PLANNING |
| PLANNING | hiveplanner | complete | EXECUTING |
| EXECUTING | hivemaker | complete | VERIFYING |
| VERIFYING | hiveq | pass | COMPLETE |
| VERIFYING | hiveq | fail | FAILED |
| FAILED | hivehealer | fix | EXECUTING |
| ANY | system | blocker detected | BLOCKED |

### File Artifact Lifecycle

```
PROJECT.md (created at project start)
    ↓
ROADMAP.md (created after project definition)
    ↓
phases/{XX-phase}/PLAN.md (created per phase)
    ↓
phases/{XX-phase}/SUMMARY.md (updated during execution)
    ↓
phases/{XX-phase}/VERIFICATION.md (created at phase end)
```

---

## Appendix B: Delegation Contract Template

```yaml
delegation_contract:
  contract_id: "DC-{timestamp}-{sequence}"
  
  from:
    agent: "{orchestrator_agent}"
    lineage: "{lineage_id}"
    
  to:
    agent: "{target_agent}"
    lineage: "{target_lineage}"
    
  task:
    description: "{clear_task_description}"
    scope:
      included: ["{specific_items}"]
      excluded: ["{out_of_scope_items}"]
      
  return_format:
    type: "{artifact_type}"
    location: "{file_path}"
    schema: "{validation_schema}"
    
  success_metric:
    description: "{how_to_verify}"
    command: "{verification_command}"
    expected_output: "{expected_result}"
    
  acceptance_criteria:
    - "{criterion_1}"
    - "{criterion_2}"
    
  constraints:
    - "{limitation_1}"
    - "{must_not_do_1}"
    
  evidence:
    capture:
      - "{what_to_document}"
    rationale:
      - "{why_it_matters}"
      
  failure_handling:
    on_partial: "{retry_or_escalate}"
    on_failure: "{handoff_to_healer}"
    
  timestamp: "{ISO8601}"
  expiry: "{ISO8601_or_null}"
```

---

## Document Metadata

- **Document ID**: JOURNEY-DL-2026-03-04
- **Lineage Coverage**: Hiveminder (Execution) + Hivefiver (Meta-Builder)
- **Journey Count**: 12 detailed user journeys
- **Edge Cases Covered**: 3 (Hallucination, Broken Dependencies, Context Drift)
- **Agents Referenced**: hiveminder, hivefiver, hivemaker, hivehealer, hiveplanner, hiveq, hivexplorer, hiverd, hitea

---

**END OF DOCUMENT**

**HARD STOP — All user journeys documented with state transitions and artifacts**
