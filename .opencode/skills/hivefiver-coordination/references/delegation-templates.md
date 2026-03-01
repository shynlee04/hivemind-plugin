# Delegation Templates Reference

> Self-delegation packet templates for HiveFiver V2.
> Covers ALL intent paths: build_new, fix_broken, audit_health, extend, improve, learn, custom.

## Self-Delegation Packet Structure

All self-delegations must follow this YAML structure:

```yaml
delegation_packet:
  objective: "single measurable outcome"
  in_scope_paths:
    - ".opencode/skills/hivefiver-mode/**"
    - ".opencode/skills/hivefiver-coordination/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "preserve loaded skills"
    - "no recursive delegation"
    - "pass quality gate before claim"
  required_outputs:
    - "findings"
    - "file references with line numbers"
    - "verification evidence"
  return_schema:
    status: "pass|fail|partial"
    risk: "string — residual risk description"
    next_actions: "array — deterministic next steps"
```

## Stage Continuation Template

Used when advancing from one stage to the next:

```yaml
delegation_packet:
  objective: "Continue from ${CURRENT_STAGE} to ${NEXT_STAGE}"
  in_scope_paths:
    - ".opencode/skills/hivefiver-mode/**"
  constraints:
    - "preserve loaded skills"
    - "no recursive delegation"
  context:
    current_stage: "${CURRENT_STAGE}"
    completed_gates: ["Gate 0", "Gate 1"]
    next_stage: "${NEXT_STAGE}"
  required_outputs:
    - "stage_advance_evidence"
    - "next_action"
  return_schema:
    status: "pass|fail"
    completed_stage: "string"
    next_command: "string"
```

## Checkpoint/Resume Template

Used when creating a checkpoint for later resumption:

```yaml
delegation_packet:
  objective: "Create checkpoint for ${WORKFLOW_NAME}"
  in_scope_paths:
    - ".hivemind/state/**"
  constraints:
    - "persist current state"
    - "no execution"
  context:
    workflow: "${WORKFLOW_NAME}"
    completed_steps: ["step1", "step2"]
    pending_steps: ["step3", "step4"]
    blockers: []
  required_outputs:
    - "checkpoint_file"
    - "resume_command"
  return_schema:
    status: "checkpointed"
    checkpoint_file: "string — file path"
    resume_command: "string — exact command"
```

## Investigation Template (hivexplorer)

Used when delegating to hivexplorer for code/asset investigation:

```yaml
delegation_packet:
  objective: "Investigate ${TOPIC}"
  in_scope_paths:
    - ".opencode/**"
    - ".hivemind/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "read-only analysis"
    - "no destructive operations"
    - "no file creation or modification"
  context:
    investigation_type: "pattern|drift|evidence|inventory"
    scope: "${SCOPE_DEFINITION}"
    questions: ["specific question 1", "specific question 2"]
  required_outputs:
    - "findings"
    - "file_references"
    - "confidence_score"
  return_schema:
    status: "pass|fail|partial"
    findings: "array of {file, line, description, severity}"
    confidence: "high|medium|low"
```

## Research Template (hiverd)

Used when delegating to hiverd for external research and evidence synthesis:

```yaml
delegation_packet:
  objective: "Research ${TOPIC} for ${PURPOSE}"
  in_scope_paths:
    - "docs/**"
    - ".hivemind/**"
    - ".opencode/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "cite all sources"
    - "confidence threshold: medium or higher"
    - "output to docs/ or .hivemind/"
  context:
    research_questions: ["question 1", "question 2"]
    source_preferences: ["official docs", "GitHub repos", "technical blogs"]
    comparison_needed: true|false
  required_outputs:
    - "research_report"
    - "source_citations"
    - "confidence_scores"
  return_schema:
    status: "complete|partial|insufficient_sources"
    report: "string — structured research report"
    sources: "array of {url, title, confidence}"
    recommendations: "array of actionable items"
```

## Planning Template (hiveplanner)

Used when delegating to hiveplanner for execution planning:

```yaml
delegation_packet:
  objective: "Create execution plan for ${OBJECTIVE}"
  in_scope_paths:
    - ".opencode/**"
    - ".hivemind/**"
    - "docs/plans/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "no implementation"
    - "output to docs/plans/"
    - "respect existing architecture decisions"
  context:
    objective: "${MEASURABLE_OUTCOME}"
    complexity: "1|2|3|4"
    dependencies: []
    existing_assets: ["list of relevant existing assets"]
  required_outputs:
    - "plan_file"
    - "knots"
    - "wave_plan"
  return_schema:
    status: "complete|needs_clarification"
    plan_file: "string — file path"
    knots: "array of {id, title, dependencies, deliverable}"
    estimated_sessions: "number"
```

## Discovery → Intake Transition Template

Used when promoting from discovery to intake after QA clarification:

```yaml
delegation_packet:
  objective: "Transition from discovery to intake with clarified requirements"
  in_scope_paths:
    - ".opencode/commands/hivefiver-intake.md"
    - ".hivemind/**"
  constraints:
    - "carry forward all discovery outputs"
    - "preserve user profile"
  context:
    discovery_summary:
      problem_statement: "${PROBLEM}"
      primary_user_pain: "${PAIN}"
      in_scope: ["${SCOPE_ITEMS}"]
      out_of_scope: ["${OUT_OF_SCOPE}"]
    user_profile:
      language: "${LANG}"
      maturity: "${LEVEL}"
    intent: "${CLASSIFIED_INTENT}"
    unresolved_items: []
  required_outputs:
    - "intake_started"
    - "discovery_context_preserved"
  return_schema:
    status: "pass|fail"
    intake_session: "string — session ID"
    preserved_fields: "array"
```

## Audit → Doctor Escalation Template

Used when audit finds critical issues that need doctor remediation:

```yaml
delegation_packet:
  objective: "Escalate ${COUNT} critical audit findings to doctor for remediation"
  in_scope_paths:
    - ".opencode/**"
    - ".hivemind/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "fix only critical/high severity findings"
    - "read before write"
    - "verify each fix"
  context:
    audit_findings:
      critical: ["${CRITICAL_FINDINGS}"]
      high: ["${HIGH_FINDINGS}"]
    total_findings: "${TOTAL}"
    audit_timestamp: "${TIMESTAMP}"
  required_outputs:
    - "fixes_applied"
    - "verification_evidence"
    - "residual_risks"
  return_schema:
    status: "all_fixed|partial_fix|blocked"
    fixes: "array of {file, change, verified}"
    residual: "array of unresolved issues"
```

## Error Recovery Template

Used when pipeline encounters an error and needs recovery:

```yaml
delegation_packet:
  objective: "Recover from pipeline error: ${ERROR_DESCRIPTION}"
  in_scope_paths:
    - ".opencode/**"
    - ".hivemind/**"
  constraints:
    - "diagnose root cause before applying fix"
    - "preserve pipeline state"
    - "clear error state only after verified fix"
  context:
    pipeline_error: "${ERROR}"
    last_checkpoint: "${CHECKPOINT}"
    current_stage: "${STAGE}"
    completed_stages: "${COMPLETED}"
  required_outputs:
    - "root_cause"
    - "fix_applied"
    - "error_cleared"
  return_schema:
    status: "recovered|needs_manual|abandoned"
    root_cause: "string"
    fix: "string — what was done"
    resume_command: "string — how to continue pipeline"
```

## Quality Gate Check Template

Used when running quality validation:

```yaml
delegation_packet:
  objective: "Validate ${ASSET_TYPE} at stage ${STAGE}"
  in_scope_paths:
    - ".opencode/skills/hivefiver-coordination/scripts/quality-check.sh"
  constraints:
    - "execute quality-check.sh"
    - "collect evidence"
  context:
    asset_type: "skill|command|workflow|agent"
    stage: "${STAGE}"
  required_outputs:
    - "pass|fail"
    - "failures"
    - "warnings"
  return_schema:
    status: "pass|fail"
    findings: "array of {id, severity, message, file}"
    total: "number"
```
