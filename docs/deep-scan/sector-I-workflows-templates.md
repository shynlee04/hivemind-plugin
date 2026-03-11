# Sector I: Workflows, Templates & Prompts

**Deep Scan Date:** 2025-01-11  
**Scope:** `.opencode/workflows/`, `.opencode/templates/`, `.opencode/prompts/`  
**Total Files Analyzed:** 46 files (30 workflows, 16 templates, 9 prompts)

---

## Workflow Inventory

### YAML Workflows (20 files)

| Workflow | Purpose | Format | Target Agent | Triggers |
|----------|---------|--------|--------------|----------|
| `feature-sprint.yaml` | Canonical implementation workflow for scoped feature delivery | YAML v2 | hivemaker | Delegation packet validated |
| `hivemind-brownfield-bootstrap.yaml` | Detect framework context, capture baseline, prepare safe execution | YAML v2 | hiveminder | Brownfield project detected |
| `hivefiver-enterprise.yaml` | Enterprise workflow for high-complexity requirements | YAML v2 | hivefiver | persona_lane == enterprise_architect |
| `hivefiver-enterprise-architect.yaml` | Compliance-first enterprise architect (regulatory/compliance) | YAML v2 | hivefiver | S4 == 2 AND S2 == 2 (max risk + scale) |
| `hivefiver-mcp-fallback.yaml` | Recovery when MCP providers unavailable | YAML v2 | hivefiver | MCP availability concern |
| `hivefiver-vibecoder.yaml` | Guided flow for low-technical users | YAML v2 | hivefiver | persona_lane == vibecoder |
| `hivefiver-floppy-engineer.yaml` | Distillation-heavy workflow for messy requirements | YAML v2 | hivefiver | persona_lane == floppy_engineer |
| `verification-gate.yaml` | Canonical verification gate for acceptance/release | YAML v2 | hiveq | Target deliverable identified |
| `spec-generation.yaml` | Canonical specification workflow for ambiguous requests | YAML v2 | hiveplanner | Intent captured |
| `hiveq-audit-workflow.yaml` | Comprehensive audit: scope, standards, findings, severity | YAML v2 | hiveq | Audit target identified |
| `hiveq-verification-pipeline.yaml` | Goal-backward verification: criteria, evidence, verdict | YAML v2 | hiveq | Target phase/task identified |
| `hiveq-regression-suite.yaml` | Detect regressions against saved baselines | YAML v2 | hiveq | Regression check triggered |
| `hiveq-gate-enforcement.yaml` | Execute quality gates: identify, run, parse, emit | YAML v2 | hiveq | Gate request received |
| `research-synthesis.yaml` | Canonical research with synthesis and contradiction handling | YAML v2 | hiverd | Topic defined |
| `bug-remediation.yaml` | Canonical bug remediation with root-cause-first policy | YAML v2 | hivehealer | Bug report available |
| `hiverd-deep-research.yaml` | Structured multi-source research | YAML v2 | hiverd | Research topic defined |
| `hiverd-brainstorm-session.yaml` | Divergent ideation with convergent evaluation | YAML v2 | hiverd | Brainstorm topic provided |
| `hiverd-synthesis-pipeline.yaml` | Combine multiple research outputs into unified report | YAML v2 | hiverd | Input documents provided |
| `hiverd-comparative-analysis.yaml` | Structured comparison of 2-5 candidates | YAML v2 | hiverd | Comparison topic identified |
| `sequential-delegation-workflow.yaml` | Robust orchestration with domain boundaries | YAML v2 | hiveminder | Session active |

### MD Workflows (10 HiveFiver Stage Files)

| Workflow | Purpose | Format | Triggers |
|----------|---------|--------|----------|
| `hivefiver/start.md` | Bootstrap pipeline: classify intent, initialize session | MD + YAML frontmatter | User input received |
| `hivefiver/intake.md` | Gather requirements through structured questions | MD + YAML frontmatter | Discovery completed |
| `hivefiver/discovery.md` | Guided requirement discovery with adaptive QA | MD + YAML frontmatter | Start completed |
| `hivefiver/router.md` | Root routing: classify action, dispatch to stage | MD + YAML frontmatter | /hivefiver invoked |
| `hivefiver/spec.md` | Transform requirements into specification | MD + YAML frontmatter | Intake completed |
| `hivefiver/architect.md` | Design asset topology, contracts, dependencies | MD + YAML frontmatter | Spec completed |
| `hivefiver/build.md` | Create framework assets per architecture | MD + YAML frontmatter | Architect completed |
| `hivefiver/audit.md` | System-wide health check, validate contracts | MD + YAML frontmatter | Assets exist |
| `hivefiver/doctor.md` | Diagnose and repair broken framework chains | MD + YAML frontmatter | Issues identified |
| `hivefiver/continue.md` | Spawn fresh session from pipeline state | MD + YAML frontmatter | Pipeline active |

---

## Hivefiver Stage Pipeline

### The 10-Stage Chain

```
START → DISCOVERY → INTAKE → SPEC → ARCHITECT → BUILD → AUDIT
   ↓         ↓
DOCTOR ← ROUTER
   ↑
CONTINUE (session resume)
```

### Stage Descriptions Table

| Stage | Purpose | Entry Criteria | Exit Criteria | Next Stage |
|-------|---------|----------------|---------------|------------|
| **START** | Classify user intent, initialize pipeline | User input received | Intent classified, pipeline activated | discovery/doctor/audit |
| **DISCOVERY** | Guided requirement discovery with adaptive QA | Start completed | 8 structured fields populated, promotion gate passed | intake |
| **INTAKE** | Gather detailed requirements via structured questions | Discovery completed | Requirements documented, ambiguities resolved | spec |
| **SPEC** | Transform requirements into formal specification | Intake completed | Spec with acceptance criteria approved | architect |
| **ARCHITECT** | Design asset topology, contracts, dependencies | Spec completed | Architecture approved, build order established | build |
| **BUILD** | Create/modify framework assets | Architect completed | Assets created, contracts validated, parity synced | audit |
| **AUDIT** | System-wide health check | Assets exist | Findings classified, triage complete | doctor or END |
| **DOCTOR** | Diagnose and repair issues | Issues identified | Fixes applied, regressions checked | audit |
| **ROUTER** | Dispatch /hivefiver to correct stage | /hivefiver invoked | Target command dispatched | any stage |
| **CONTINUE** | Session handoff with full context | Pipeline active | Handoff prompt composed, record written | new session |

### Journey-Specific Pipelines

| Journey | Pipeline Sequence |
|---------|-------------------|
| build_new | start → discovery → intake → spec → architect → build → audit |
| extend | start → discovery → intake → spec → architect → build → audit |
| fix_broken | start → doctor → audit |
| audit_health | start → audit → doctor (if issues) |
| improve | start → audit → intake → spec → architect → build → audit |
| learn | start → discovery (guided) |
| custom | start → discovery → router (reclassification) |

---

## Workflow Triggers

### Trigger Mechanisms

1. **Slash Command Invocation**
   - /hivefiver → Router dispatches to stage command
   - /hivefiver-start, /hivefiver-discovery, etc. → Direct stage execution

2. **Intent Classification**
   - Keywords: "build me an agent" → build_new intent
   - "it's broken", "fix my framework" → fix_broken intent
   - "audit my commands", "health check" → audit_health intent

3. **Persona Lane Selection** (YAML workflows)
   - persona_lane == enterprise_architect → hivefiver-enterprise.yaml
   - S4 == 2 AND S2 == 2 → hivefiver-enterprise-architect.yaml (higher precedence)
   - persona_lane == vibecoder → hivefiver-vibecoder.yaml
   - persona_lane == floppy_engineer → hivefiver-floppy-engineer.yaml

4. **Pipeline State Resume**
   - STATE.md contains pipeline_active: true → Continue stage reads state
   - current_stage determines where to resume

5. **Error State Routing**
   - pipeline_error set in STATE.md → Route to doctor

6. **Gate Check Scripts**
   - gate-check.sh validates entry criteria
   - runtime-gate.sh pre-turn runs before any action
   - runtime-gate.sh post-turn runs after stage completion

---

## Template Inventory

### Plan Templates (4 files)

| Template | Purpose | When Used |
|----------|---------|-----------|
| root-plan.template.md | Root-level plan node | Top-level objective decomposition |
| sub-plan.template.md | Sub-level plan node | Mid-level decomposition |
| atomic-plan.template.md | Atomic execution node | Deterministic execution block |
| validation-plan.template.md | Validation artifact for plan | Evidence linking, gap analysis |

### HiveFiver Stage Output Templates (11 files)

| Template | Purpose | When Used |
|----------|---------|-----------|
| stage-output-start.md | Start stage JSON output | Intent classification, pipeline init |
| stage-output-discovery.md | Discovery stage JSON output | User profile, 8 structured fields |
| stage-output-router.md | Router stage JSON output | Action resolution, dispatch |
| stage-output-intake.md | Intake stage JSON output | Requirements, ambiguities |
| stage-output-spec.md | Spec stage JSON output | Specification, acceptance criteria |
| stage-output-architect.md | Architect stage JSON output | Topology, contracts, dependencies |
| stage-output-build.md | Build stage JSON output | Assets created/modified, validations |
| stage-output-audit.md | Audit stage JSON output | Findings, anti-patterns, triage |
| stage-output-doctor.md | Doctor stage JSON output | Diagnostics, fixes, regressions |
| stage-output-continue.md | Continue stage JSON output | Handoff content, session resume |
| transition-contract.md | Cross-stage handoff contract | Stage transition validation |

### Report Templates (4 files)

| Template | Purpose | When Used |
|----------|---------|-----------|
| audit-report-template.md | Structured audit report | HiveQ audit workflow output |
| verification-report-template.md | Verification PASS/FAIL report | HiveQ verification pipeline |
| gate-checklist-template.md | Gate execution checklist | HiveQ gate enforcement |
| analysis-matrix-template.md | Comparative analysis matrix | Hiverd comparative analysis |

---

## Plan Templates

### Hierarchy Structure

```
ROOT-PLAN (type: root)
├── id: "META01-PLAN"
├── parent: null
├── SUB-PLAN (type: sub)
│   ├── id: "META01-SUB01-PLAN"
│   ├── parent: "META01-PLAN"
│   └── ATOMIC-PLAN (type: atomic)
│       └── id: "META01-SUB01-ATOMIC01"
```

### Frontmatter Fields (All Plan Types)

| Field | Required | Description |
|-------|----------|-------------|
| id | YES | Unique plan identifier |
| parent | YES | Parent plan ID (null for root) |
| status | YES | active / completed / pivoting / blocked |
| priority | YES | critical / high / normal / low |
| scope | YES | Scope description |
| type | YES | root / sub / atomic |
| tags | YES | Array of tags |
| symlink_context | YES | Path to synthesis context |
| validation_log | YES | Path to validation artifact |
| created | YES | Creation timestamp |
| last_sync | YES | Last sync timestamp |
| completion_criteria | YES | Array of completion conditions |

### Plan Materialize Contract

- Authoring templates: .opencode/templates/planning
- Runtime artifacts: .hivemind/plans (generated only by plan-materialize.sh)
- Naming: META01-PLAN.md, META01-SUB01-PLAN.md, META01-SUB01-ATOMIC01.md
- Validation: Every plan creates sibling VALIDATION-*.md artifact

---

## Stage Output Templates

### Common Fields (All Stages)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| stage | string | YES | Stage name (matches workflow) |
| status | string | YES | completed / failed |
| timestamp | string | YES | ISO 8601 timestamp |
| state_updates | object | YES | Pipeline state mutations |
| next_command | string | YES | Exact command to run next |
| gate_result | string | YES | passed / failed |

### Stage-Specific Key Fields

**START:** intent.classified, intent.confidence, pipeline.id, pipeline.sequence

**DISCOVERY:** discovery_summary (8 fields), user_profile, unresolved_critical, unresolved_minor, promotion_allowed

**INTAKE:** asset_type, requirements (purpose, scope, behavior, inputs, outputs, constraints), ambiguities

**SPEC:** specification (name, purpose, scope, behavior), acceptance_criteria (Given-When-Then), ambiguity_map

**ARCHITECT:** topology.assets, contracts.per_asset, dependencies.graph, dependencies.build_order, risk_assessment

**BUILD:** assets_created, assets_modified, validations (frontmatter_valid, contracts_passed, parity_synced, quality_check)

**AUDIT:** summary (total_assets, passed, warnings, failures), findings (severity, category, fix_suggestion), anti_patterns, parity_status

**DOCTOR:** diagnostics (total_issues, critical_found, critical_fixed), fixes_applied, regressions

**CONTINUE:** pipeline_state, continuation_command, handoff_file, handoff_content

---

## Transition Contracts

### Schema Structure

```json
{
  "transition": {
    "id": "build_new:start->discovery",
    "journey": "build_new",
    "from_stage": "start",
    "to_stage": "discovery",
    "trigger_command": "/hivefiver-discovery",
    "gate": { "name": "Gate 0", "result": "passed", "evidence": [] }
  },
  "payload": {
    "source_output_template": "stage-output-start",
    "source_output_fields": ["intent.classified"],
    "target_expects": ["intent.classified"],
    "compatibility": "exact"
  },
  "state_mutation": {
    "add_completed": "start",
    "set_stage": "discovery",
    "pipeline_active": true
  },
  "recovery": {
    "on_failure": "halt_and_route_doctor",
    "fallback_command": "/hivefiver-doctor"
  }
}
```

### Supported Transitions

| Journey | Transitions |
|---------|-------------|
| build_new | start→discovery→intake→spec→architect→build→audit |
| extend | start→discovery→intake→spec→architect→build→audit |
| fix_broken | start→doctor→audit |
| audit_health | start→audit→doctor (optional) |
| improve | start→audit→intake→spec→architect→build→audit |
| learn | start→discovery |
| custom | start→discovery→router |

---

## Prompt Injection

### Prompt Files (9 files)

| Prompt | Purpose | Injection Point |
|--------|---------|------------------|
| hivemind-brownfield-remediation.md | High-risk refactor support | Brownfield bootstrap |
| compliance-rules.md | Framework naming/structure rules | HiveQ compliance checking |
| verification-criteria.md | Acceptance criteria extraction rules | HiveQ verification |
| research-question-framing.md | Transform vague topics into sub-questions | Hiverd research |
| synthesis-instruction.md | Combine multiple evidence sources | Hiverd synthesis |
| temporary-ordained.md | Temporary authority grants | Special operations |
| the-team-b-granular-investigation.md | Granular investigation protocol | Debug sessions |
| node-refactor/node-1-proposal.md | Refactor proposal template | Refactoring |
| node-refactor/the-red-flag.md | Red flag detection | Code review |

### Injection Mechanisms

1. **Skill Bundle Loading** - Workflows specify skill_bundles: in step definitions
2. **Command Frontmatter** - Commands specify required_skills: that load prompts
3. **Workflow Args** - Some workflows pass prompt content via args:
4. **Template References** - Templates loaded by workflow steps

---

## Brownfield Bootstrap Flow

### Workflow Steps

1. **WAVE 1: ANALYZE** - scan_hierarchy (action: analyze)
2. **WAVE 2: RECOMMEND** - scan_hierarchy (action: recommend)
3. **WAVE 3: ORCHESTRATE** - scan_hierarchy (action: orchestrate)
4. **WAVE 4: LOCK-FOCUS** - map_context (level: tactic)

### Guards

- hierarchy_present: scan_hierarchy_returns_valid
- context_locked: tactic_level_context_set

---

## Feature Sprint Flow

### Workflow Steps

1. **WAVE 1: SCOPE-LOCK** - hivemind-delegate (delegation-intelligence)
2. **WAVE 2: TEST-FIRST** - hiveq-verify (verification-methodology, evidence-discipline)
3. **WAVE 3: IMPLEMENT** - hivemaker (implementation-discipline)
4. **WAVE 4: VERIFY** - hiveq-verify (verification-methodology, gate-enforcement)

### Guards

- no_scope_drift: scope_paths_respected
- evidence_required: verification_evidence_present

---

## Cross-Sector Dependencies

### Workflows → Skills

| Workflow | Required Skills |
|----------|-----------------|
| feature-sprint | delegation-intelligence, verification-methodology, evidence-discipline, gate-enforcement |
| hivemind-brownfield-bootstrap | context-integrity |
| hivefiver-enterprise | meta-builder-governance, hivefiver-persona-routing, hivefiver-spec-distillation |
| hiveq-audit-workflow | verification-methodology, gate-enforcement, evidence-discipline |
| research-synthesis | research-methodology, source-evaluation, synthesis-patterns |
| bug-remediation | systematic-debugging-hivemind, research-methodology |
| sequential-delegation-workflow | context-integrity, delegation-intelligence |

### Workflows → Templates

| Workflow | Required Templates |
|----------|-------------------|
| hiveq-audit-workflow | audit-report-template.md |
| hiveq-verification-pipeline | verification-report-template.md |
| hiveq-gate-enforcement | gate-checklist-template.md |
| hiverd-deep-research | research-report-template.md |
| hiverd-brainstorm-session | brainstorm-session-template.md |
| hiverd-comparative-analysis | analysis-matrix-template.md |

---

## Knowledge Gaps

### After Deep Scan Analysis

1. **Script Implementation Details**
   - Scripts like gate-check.sh, state-update.sh, quality-check.sh referenced but not scanned
   - Located in .opencode/skills/hivefiver-coordination/scripts/
   - Need to verify implementations match workflow specifications

2. **Skill Content**
   - Skills like hivefiver-mode, hivefiver-coordination referenced but not scanned
   - Need Sector II scan for SKILL.md files

3. **Command Definitions**
   - Commands like /hivefiver-start referenced but not scanned
   - Need Sector III scan for command frontmatter and behavior

4. **Agent Profiles**
   - Target agents like hivefiver, hiveq, hiverd referenced but not scanned
   - Need Sector IV scan for agent profiles

5. **STATE.md Schema**
   - Pipeline state file structure referenced but not documented
   - Need to understand state mutations and recovery patterns

6. **Quality Gate G-01 through G-10**
   - Anti-patterns referenced in audit/doctor stages
   - Full detection logic not documented in scanned files

---

*End of Sector I Deep Scan*
