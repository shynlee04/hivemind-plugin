---
sessionID: ses_19fd14e41ffeP3SFDnpHBFI54K
created: 2026-05-25T17:28:53.485Z
updated: 2026-05-25T18:07:37.758Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-05-25T17:28:53.438Z
lastMessage: >-
  # Hivemind Agent System - Redefined


  Tôi hiểu rồi. **Agent profiles KHÔNG chứa permissions/tools/skills** - đó là
  runtime decision của orchestrator. Agent profile chỉ định:


  1. **Expert role** - chuyên môn

  2. **Artifacts** - documents/code/tests tạo ra

  3. **Workflow position** - khi nào được gọi

  4. **Naming/pathing/format** - quy cách làm việc


  ## Core Principle


  ```

  L0 (front-facing) → L2/L3 (hidden specialists)
      ↓                    ↓
  Programmatic routing   Expert execution

  via tools/commands     via artifacts

  ```


  ---


  ## Agent System by Workflow Pipeline


  ### Phase 0: Intent Clarification


  ### 1. `hm-orchestrator`

  **Role**: Front-facing coordinator, workflow router

  **When**: User initiates work

  **Artifacts**:

  - `.hivemind/planning/PROJECT.md` (updated)

  - Main session with TUI prompt

  - Delegation log (`.hivemind/state/delegations.json`)


  **Workflow position**: ALWAYS first, routes to L2 specialists


  ---


  ### Phase 1: Research


  ### 2. `hm-researcher`

  **Role**: Multi-source investigation, evidence gathering

  **When**: After intent clarified, before spec

  **Artifacts**:

  - `.hivemind/research/RESEARCH.md` (date-stamped)

  - Evidence reports with citations

  - Gap analysis (`GAPS.md`)


  **Workflow position**: After `hm-orchestrator`, before `hm-specifier`


  ---


  ### Phase 2: Specification


  ### 3. `hm-specifier`

  **Role**: Requirements authoring, acceptance criteria

  **When**: After research complete

  **Artifacts**:

  - `.hivemind/planning/REQUIREMENTS.md`

  - SPEC.md files (date-stamped)

  - Acceptance criteria matrices


  **Workflow position**: After `hm-researcher`, before `hm-architect`


  ---


  ### Phase 3: Architecture


  ### 4. `hm-architect`

  **Role**: Technical design, dependency mapping

  **When**: After spec locked

  **Artifacts**:

  - `.hivemind/planning/architecture/ARCHITECTURE.md`

  - Dependency graphs (`.hivemind/planning/graphs/`)

  - ADRs (`.hivemind/planning/adr/`)


  **Workflow position**: After `hm-specifier`, before `hm-planner`


  ---


  ### Phase 4: Planning


  ### 5. `hm-planner`

  **Role**: Task breakdown, phase planning

  **When**: After architecture locked

  **Artifacts**:

  - `.hivemind/planning/phases/M###-PLAN.md`

  - Phase manifests (`.planning/phases/M###/*/`)

  - Task lists (`.hivemind/planning/task-lists/`)


  **Workflow position**: After `hm-architect`, before `hm-builder`


  ---


  ### Phase 5: Implementation


  ### 6. `hm-builder`

  **Role**: Code implementation, test-first

  **When**: After plan locked

  **Artifacts**:

  - Source code (`src/**/*.ts`)

  - Tests (`tests/**/*.test.ts`)

  - Commit messages (via git)


  **Workflow position**: After `hm-planner`, before `hm-reviewer`


  ---


  ### Phase 6: Quality Gates


  ### 7. `hm-reviewer`

  **Role**: Code review, security, performance

  **When**: After implementation, before merge

  **Artifacts**:

  - `.hivemind/planning/reviews/REVIEW.md`

  - Findings with severity (CRITICAL/HIGH/MEDIUM/LOW)

  - Fix recommendations


  **Workflow position**: After `hm-builder`, before `hm-verifier`


  ---


  ### 8. `hm-verifier`

  **Role**: Quality gates, validation, verification

  **When**: After review pass

  **Artifacts**:

  - `.hivemind/planning/gates/GATE-M###.md`

  - L1-L3 evidence reports

  - PASS/FAIL verdicts


  **Workflow position**: After `hm-reviewer`, before shipping


  ---


  ### Phase 7: Verification & Shipping


  ### 9. `hm-verifier` (same as #8)

  **Role**: Integration verification, regression testing

  **When**: After quality gates pass

  **Artifacts**:

  - Verification reports (`.hivemind/planning/verification/`)

  - Regression test results

  - Release notes


  **Workflow position**: After `hm-verifier`, before shipping


  ---


  ### 10. `hm-shipper`

  **Role**: Release coordination, changelog, deployment prep

  **When**: After all verification pass

  **Artifacts**:

  - `.hivemind/planning/releases/CHANGELOG.md`

  - Release manifests

  - Deployment checklists


  **Workflow position**: Final L2 agent before L0 routes to next phase


  ---


  ## L2 Coordination Agents (Cross-Cutting)


  ### 11. `hm-coordinator`

  **Role**: Multi-agent dispatch, handoff protocols

  **When**: When task requires multiple specialists

  **Artifacts**:

  - `.hivemind/planning/coordination/COORDINATION.md`

  - Delegation tree (`.hivemind/state/delegations.json`)

  - Handoff logs


  **Workflow position**: Called by `hm-orchestrator` when complex work needed


  ---


  ### 12. `hm-loop-mananger`

  **Role**: Iterative refinement, completion gating

  **When**: Task requires multiple iterations

  **Artifacts**:

  - Loop logs (`.hivemind/planning/loops/`)

  - Iteration checkpoints

  - Completion evidence


  **Workflow position**: Embedded in `hm-builder`/`hm-reviewer` when iterations
  needed


  ---


  ### 13. `hm-ecologist`

  **Role**: Feature ecosystem mapping, dependency tracking

  **When**: New feature added to existing system

  **Artifacts**:

  - `.hivemind/planning/ecosystem/ECOSYSTEM.md`

  - Dependency DAGs

  - Impact assessments


  **Workflow position**: After `hm-builder` for new features


  ---


  ## L2 Meta-Builder Agents


  ### 14. `hf-agent-builder`

  **Role**: Agent definition creation/repair

  **When**: New agent needed or existing agent broken

  **Artifacts**:

  - Agent YAML frontmatter

  - SKILL.md packages

  - Command definitions


  **Workflow position**: Called by `hm-orchestrator` for meta-work


  ---


  ### 15. `hf-skill-builder`

  **Role**: Skill package creation/audit

  **When**: New skill needed or existing skill broken

  **Artifacts**:

  - SKILL.md files

  - Trigger phrase definitions

  - Skill evals


  **Workflow position**: Called by `hf-agent-builder` or `hm-orchestrator`


  ---


  ## L2 Quality Gate Agents


  ### 16. `gate-spec-compliance`

  **Role**: Spec-to-code traceability, gap detection

  **When**: Before quality gates

  **Artifacts**:

  - `.hivemind/planning/gates/COMPLIANCE.md`

  - Gap reports

  - Traceability matrices


  **Workflow position**: After `hm-builder`, before `gate-evidence-truth`


  ---


  ### 17. `gate-evidence-truth`

  **Role**: L1-L5 evidence verification

  **When**: Before phase completion

  **Artifacts**:

  - `.hivemind/planning/gates/EVIDENCE.md`

  - Verification verdicts (PASS/FAIL)

  - Evidence hierarchy reports


  **Workflow position**: Final gate before shipping


  ---


  ## Summary: 17 Core Agents


  | Phase | Agent | Role | Artifacts |

  |-------|-------|------|-----------|

  | 0 | `hm-orchestrator` | Front-facing router | Main session, delegations.json
  |

  | 1 | `hm-researcher` | Investigation | RESEARCH.md, evidence reports |

  | 2 | `hm-specifier` | Requirements authoring | REQUIREMENTS.md, SPEC.md |

  | 3 | `hm-architect` | Technical design | ARCHITECTURE.md, ADRs |

  | 4 | `hm-planner` | Task breakdown | M###-PLAN.md, manifests |

  | 5 | `hm-builder` | Implementation | Source code, tests, commits |

  | 6 | `hm-reviewer` | Code review | REVIEW.md, findings |

  | 7 | `hm-verifier` | Quality gates | GATE-###.md, evidence reports |

  | 8 | `hm-shipper` | Release coordination | CHANGELOG.md, manifests |

  | - | `hm-coordinator` | Multi-agent dispatch | COORDINATION.md, delegation
  tree |

  | - | `hm-loop-manager` | Iterative refinement | Loop logs, checkpoints |

  | - | `hm-ecologist` | Ecosystem mapping | ECOSYSTEM.md, DAGs |

  | - | `hf-agent-builder` | Agent creation | Agent YAML, frontmatter |

  | - | `hf-skill-builder` | Skill creation | SKILL.md, triggers |

  | - | `gate-spec-compliance` | Spec traceability | COMPLIANCE.md, gaps |

  | - | `gate-evidence-truth` | Evidence verification | EVIDENCE.md, verdicts |


  ---


  **Điểm khác biệt:**

  - **17 agents** (down from 89) - only essential ones

  - **No permissions/tools/skills in YAML** - those are runtime

  - **Clear workflow positions** - when each agent gets called

  - **Artifact-focused** - what each agent produces

  - **L0 = 1 agent** (orchestrator), L2 = 16 specialists

  - **Gate agents** merged into workflow (not separate cluster)


  Bạn thấy thiếu agent nào hoặc thừa agent nào không?
---

## USER (turn 1)

**source:** real-human

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep > (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep >:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

## USER (turn 2)

**source:** real-human

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep > (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep >:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

## USER (turn 3)

**source:** real-human

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep > (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep >:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_c0a58f5a914342cd90379643"
}
```


## USER (turn 4)

**source:** real-human

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep > (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in <.planning/phases/24.1-agent-hierarchy-restructure
.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep
.planning/phases/24.2-agent-profile-quality-enforcement
.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep >:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/PROJECT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_9b0e63e7b0944251851ca670"
}
```


## ASSISTANT (turn 1)

# Phase 24.1 — Agent Hierarchy Restructure

Tôi đã load prior context và phân tích phase này. Đây là phase **Cluster A** đầu tiên trong nhóm Agent Quality.

## Domain Boundary

Phase 24.1 deliver: **Restructure agent hierarchy by removing L1 agent layer, reorganize L2/L3 agents by domain (product-dev, meta-builder, quality gates, stack reference)**.

## Prior Decisions Carried Forward

Từ PROJECT.md và STATE.md:
- **D-P24.1-INSERT**: Remove L1 agent, restructure L2/L3 by domain
- **Lineage conventions**: hm-* (product dev), hf-* (meta-builder), gate-* (quality), stack-* (reference)
- **gds-* excluded**: Internal developer tooling, never shipped
- **Agent quality gaps**: C-1, C-3, H-2, M-1, L-2/L-3 identified in DEBTS-REGISTER

## Gray Areas

Dựa trên ROADMAP.md và prior context, đây là 3 gray areas cần decision:

### 1. Agent Directory Structure

**How should restructured agents be organized in `.opencode/agents/`?**

Options:
- **By lineage prefix** (recommended): `.opencode/agents/hm-*/`, `.opencode/agents/hf-*/`, etc.
- **By functional domain**: `.opencode/agents/product-dev/`, `.opencode/agents/meta-builder/`, etc.
- **Hybrid**: Subdirectories by function under lineage roots

**Context**: Current structure has flat listing. STATE.md shows 89 agents (45 hm-* + 11 hf-* + 33 gsd-*). Need to exclude gsd-*.

### 2. L2/L3 Boundary Definition

**What criteria determine an agent is L2 vs L3?**

Options:
- **By delegation depth**: L2 = delegates to L3 specialists; L3 = terminal execution
- **By tool access**: L2 = broad tool access; L3 = restricted tool set
- **By workflow role**: L2 = orchestrator/coordinator; L3 = researcher/builder/critic specialist

**Context**: ROADMAP.md mentions L0→L1→L2→L3 chain. L1 being removed means L2 becomes new top-level (after L0).

### 3. Quality Enforcement Mechanism

**How do we enforce agent profile quality standards?**

Options:
- **Manual review**: Each agent manually audited before merge
- **Automated gates**: CI checks for frontmatter, permissions, required fields
- **Template-based**: All agents generated from validated SKILL.md/agent frontmatter templates

**Context**: STATE.md shows Phase 24.2 will handle "Agent Profile Quality Enforcement" — this phase focuses on hierarchy structure.

---

**Bạn muốn thảo luận những gray area nào?** Chọn 1-3 areas để deep-dive, hoặc nói "tất cả" để discuss từng cái.

## USER (turn 5)

**source:** real-human

all

## ASSISTANT (turn 2)

# Deep-Dive Session

Tôi sẽ discuss từng gray area với bạn. Bắt đầu với:

---

## Gray Area 1: Agent Directory Structure

**Question**: How should restructured agents be organized in `.opencode/agents/`?

### Option A: By Lineage Prefix (Recommended)
```
.opencode/agents/
├── hm-orchestrator/
├── hm-analyst/
├── hm-architect/
├── hm-assessor/
├── hm-auditor/
├── hm-brainstormer/
├── hm-build/
├── ... (all 35 hm-* agents)
├── hf-l2-agent-builder/
├── hf-l2-auditor/
├── ... (all 13 hf-* agents)
└── gate-l3-evidence-truth/
   └── ... (gate-* agents)
```

**Pros**:
- Matches existing lineage naming conventions
- Clear separation of concerns (product vs meta-builder vs quality)
- Easy to discover by lineage when building new agents

**Cons**:
- Some agents span multiple domains (e.g., `hm-l2-coordinating-loop`)
- Directory count = agent count (86 directories)

### Option B: By Functional Domain
```
.opencode/agents/
├── coordination/
│   ├── hm-orchestrator/
│   ├── hm-conductor/
│   └── hm-connector/
├── analysis/
│   ├── hm-analyst/
│   └── hm-assessor/
├── meta-builder/
│   ├── hf-l2-agent-builder/
│   └── hf-l2-skill-builder/
```

**Pros**:
- Logical grouping by responsibility
- Easier to find related agents
- Fewer directories (approx 8-12)

**Cons**:
- Blurs lineage boundaries
- Harder to audit by lineage type
- Requires understanding agent roles to navigate

### Option C: Hybrid (Lineage First, Domain Subdirs)
```
.opencode/agents/
├── hm/
│   ├── coordination/
│   ├── analysis/
│   └── quality-gates/
├── hf/
│   ├── meta-builder/
│   └── skill-authoring/
└── gate/
    └── quality/
```

**Pros**:
- Best of both worlds
- Maintains lineage boundaries
- Logical domain grouping within lineages

**Cons**:
- Some nesting depth
- Mixed convention from current flat structure

---

**Bạn nghĩ option nào phù hợp nhất? Hoặc bạn muốn đề xuất option khác?**

(After your answer, we'll move to Gray Area 2)

## USER (turn 6)

**source:** real-human

A nhưng không nhóm tất cả gate vào hm-* luôn và audit tất cả số agent này và nó có liên quan tới các phase nối liền theo sau của phase này nên thêm phần nghiên cứu vào dể tạo một thin mapping dựa trên gsd routing (gsd command sẽ route agents) vì thế sẽ có những agents dư ra những agents conflict, những agents còn thiếu v..v.. tập trung vào hm-* trước hf-* TBD

## USER (turn 8)

**source:** real-human

A nhưng không nhóm tất cả gate-* *nhóm gate vào hm không tạo nhóm riêng cho gate vào hm-* luôn và audit tất cả số agent này và nó có liên quan tới các phase nối liền theo sau của phase này nên thêm phần nghiên cứu vào dể tạo một thin mapping dựa trên gsd routing (gsd command sẽ route agents) vì thế sẽ có những agents dư ra những agents conflict, những agents còn thiếu v..v.. tập trung vào hm-* trước hf-* TBD

## ASSISTANT (turn 8)

# Refined Option A

Tôi đã hiểu rõ hơn. Đây là cấu trúc đề xuất:

```
.opencode/agents/
├── hm-orchestrator/
├── hm-analyst/
├── hm-architect/
├── hm-assessor/
├── hm-auditor/
├── hm-brainstormer/
├── hm-build/
├── hm-code-reviewer/
├── hm-critic/
├── hm-curator/
├── hm-debugger/
├── hm-ecologist/
├── hm-executor/
├── hm-finisher/
├── hm-general/
├── hm-guardian/
├── hm-integrator/
├── hm-l2-brainstorm/
├── hm-l2-completion-looping/
├── hm-l2-coordinating-loop/
├── hm-l2-cross-cutting-change/
├── hm-l2-debug/
├── hm-l2-feature-ecosystem/
├── hm-l2-gate-orchestrator/
├── hm-l2-lineage-router/
├── hm-l2-phase-execution/
├── hm-l2-phase-loop/
├── hm-l2-product-validation/
├── hm-l2-production-readiness/
├── hm-l2-refactor/
├── hm-l2-requirements-analysis/
├── hm-l2-roadmap-maintainability/
├── hm-l2-skill-router/
├── hm-l2-spec-driven-authoring/
├── hm-l2-test-driven-execution/
├── hm-l2-user-intent-interactive-loop/
├── hm-l3-deep-research/
├── hm-l3-detective/
├── hm-l3-hivemind-engine-contracts/
├── hm-l3-hivemind-state-reference/
├── hm-l3-integration-contracts/
├── hm-l3-omo-reference/
├── hm-l3-opencode-non-interactive-shell/
├── hm-l3-opencode-platform-reference/
├── hm-l3-opencode-project-audit/
├── hm-l3-research-chain/
├── hm-l3-subagent-delegation-patterns/
├── hm-l3-synthesis/
├── hm-l3-tech-context-compliance/
├── hm-l3-tech-stack-ingest/
├── hm-l3-tool-capability-matrix/
├── hm-l2-agent-orchestrator/
├── hm-l2-ecologist/
├── hm-l2-executor/
├── hm-l2-integrator/
├── hm-l2-moderator/
├── hm-l2-operator/
├── hm-l2-prompt-analyzer/
├── hm-l2-prompt-repackager/
├── hm-l2-prompt-skimmer/
├── hm-l2-router/
├── hm-l2-strategist/
├── hm-l2-synthesizer/
├── hm-l2-validator/
├── hm-l2-writer/
├── hf-l2-agent-builder/
├── hf-l2-auditor/
├── hf-l2-command-builder/
├── hf-l2-context-absorb/
├── hf-l2-custom-tools-dev/
├── hf-l2-delegation-gates/
├── hf-l2-meta-builder-core/
├── hf-l2-naming-syndicate/
├── hf-l2-skill-router/
├── hf-l2-skill-synthesis/
├── hf-l2-use-authoring-skills/
└── gate-l3-evidence-truth/
   └── gate-l3-lifecycle-integration/
   └── gate-l3-spec-compliance/
```

---

## Research Requirement: Agent-to-GSD Command Mapping

Trước khi implement, chúng ta cần:

1. **Map

## USER (turn 9)

**source:** real-human

sai

## USER (turn 10)

**source:** real-human

đọc kỹ lại

## ASSISTANT (turn 9)

Bạn nói "đọc kỹ lại" - tôi cần đọc kỹ hơn yêu cầu của bạn.

Hãy để tôi hiểu lại:

Bạn muốn **không** tạo subdirectories cho gate-*. Tức là gate-* agents vẫn nằm flat như hm-*, không group vào hm directory.

Và bạn muốn tôi **nghiên cứu** (research) để tạo mapping giữa:
- GSD commands (từ `/gsd-*` commands)
- Agents (hm-*, hf-*)

Để phát hiện:
- Agents dư (không được dùng bởi GSD commands)
- Agents thiếu (command có nhưng không có agent tương ứng)
- Agents conflict (nhiều agents làm cùng role)
- Dependencies với downstream phases (24.2, 24.3, v.v.)

Tập trung vào **hm-* agents** trước, hf-* TBD.

**Đúng vậy chứ?**

## USER (turn 11)

**source:** real-human

nói chung audit lại toàn  bộ nghiên cứu sâu hãy cho rằng tất cả agents này đều sai ## Các thiếu sót đang ghi nhận của hệ thống Hivemind vs. GSD vs. OMO

Hãy đối xử với các mục sau là một cluster rất lớn mà nhiều vấn đề con trong đó cần triển khai theo thứ tự và liên đới - ở phần này bạn chỉ cần đưa ra mapping cluster nào nên được sử lý trước  vì các vấn đề con bên trong tôi sẽ không liệt kê ra mà bạn phải biết được nó là gì qua cách sắp xếp toàn bộ phases qua ROADMAP và STATE

OVERVIEW results mong muốn cuối cùng: Hivemind là sự kết hợp mạnh mẽ khắc phục các điểm yếu của cả GSD và OMO tức là giữ được context intellgence qua các session dài, các command và workflows following strictly các giao thức spec-driven, research-driven, context-driven, dependencies , tech compliances,  patterns và feature completeness driven và test-driven với hệ thống quản lý state, roadmap, project, architecture  với các gatekeeping (quality, validation, verification và  tự động hoá etc nói chung adapt nâng cao các cho hệ thống agents vs subagent, commands, workflows, references và templates tương tự như GSD nhưng agents với các công cụ quản lý  task, context, hierarchy, tự động routing command và workflow manipulated qua skills và commands routing và điều phối agents quản lý context qua commits và delegation logics (task và delegate-task)  dựa trên sự học hỏi của OMO để đưa tính tự động này vào nhưng vẫn duy trì được sự collaboration với người dùng 

1. Hê thống routing thông qua commands và skills (sử dụng field subtask và agents ) để parse vs workflows, references, templates  và tự điều phối agents → tự động route workflows bài bản qua agents và subagents chúng ta vẫn chưa làm được do các điểm yếu sau
    1. Hoàn toàn thiếu commands, references và templates để parse tự động thiết lập các routing chặt chẽ
    2. thiếu looping được chia nhỏ hợp lý, có hệ thống thông qua việc hệ thống các artifacts documents → tưc agents khi tạo các artifacts trong planning, research, audit, gatekeeping quản lý code và project, requirements, dependencies thực hiện debug, review v..v… đều thiếu do việc các hệ thống tài liệu này chưa được quy định về quy cách, tính dependent, governance theo thứ tự thế nào. Ngay cả  naming các document này phải theo quy cách gì, yaml heading gồm các trường gì để chain và parse và khi nào tạo mới khi nào phải edit khi các documents và artifacts này đòi hỏi structured chặt chẽ để parse các context cần thiết - nên biết rằng context management cho workflow cho một session dài rất phức tạp
    3. hệ thống agents yếu kém chất lưượng và sự đồng nhất theo tôi qua cách hiện nay thay vì thiết lập permissions skills, custom tools ngay tại yaml của agents qua hm-* và l0, l1, l2, l3 hiện nay rất yếu kém và thiếu chủ động và không hề kiểm soát được qua các yếu tố sau
        1. agent context chỉ thiết lập ngay lần đầu profile nó sẽ prune  khi context kéo dài , qua turns và có compacts → các bước quy định looping hay gating , hierarchy, delegation logics, và checkpoints gay tại profile agents sẽ không hiệu quả ⇒ thay vào đó agent profile nên được thiết kế để nó hoàn thành chuyên môn của nó chứ không phải là nơi build logics looping hay logics check points và ngay cả logics hierarchy → 3 thứ trên phải được xây dựng trên programatic approaches mà tôi nó phụ thuộc rất lớn vào main front facing orchestrator - thứ logics duy nhất có thể build tại profile agents là logics switch agents và commands - wokrlfows (ví dụ như orchéstrator giao việc debug cho executor thì executor detect đó không phải specialist của mình thì switch qua debugger để tiếp tục) - các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents. Nhưng logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints sẽ không hiệu quả → phát triển lại hệ thống agent này về quality as expert và như các điều nói trên và thin framing cho routing logics trong đó việc naming l0, l1, l2, l3 sẽ cơ cấu lại như sau (cho cả agents và skills nhưng với knowledge sau)
            1. bỏ đi l1 agent → l0 agent sẽ in charge frontfacing duy nhất
            2. các context về looping logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints → sẽ phải absorb để đưa về các programatic features phía dưới (hoặc là programatic injections, hay các tools để điều phối task và coordination của l0 agent) và qua các primitives như command và skills
            3. agent mode thành “all” hết nhưng các agents không front facing sẽ bị hidden để nó chỉ có thể được call bở l0 agent
            4. các logic về  các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents - chú ý về việc agents đó phải làm việc gì tham khảo cách viết của GSD agents , tạo ra artifacts nào, control documents nào, dùng context nào, đọc context, execute việc gì đưa ra format ra sau etc đó là focus → nhóm l2 và l3 agent hoàn toàn phải làm lại hết vì thay vì l2 và l3 thì phải classify theo nhóm công việc trong một quy trình chặt chẽ của một dự án rất phức tạp với các yếu tố tôi nêu trên 
        2. Từ ý trên ta rõ ràng thấy rằng có các mảng chưa hoàn thành đã nói ở trên và đang sẵn có như session-tracker, delegation-status, coordination, agent-work-contract, injection, trajectory etc phải cần đuược thiết kế theo như trên để có thể làm được điều này
        3. và hệ thống planning và artìacts và documents cũng cần phải build theo structured output và schema bây giờ thống nhất là nó sẽ là .hivemind/planning/subdirs → nếu người dùng lựa chọn hivemind để xây dựng và một đường dẫn khác cho các framework khác nhưng thứ này phải được thiết lập dynamic qua user config plane
        4. tiếp theo là cách quản lý của chúng ta cho shipped-with primitives dạng assets đang hoàn toàn sai → tôi đề xuất nó phải quản lý qua schema và dạng code và được dụng tại assets/subdirs thay vì như bây giờ → và .opencode/subdirs hiện đang là symlinks cũng là sai nó phải là các file được trực tiếp extracted ra qua quy trình install của users và nên nhớ .opencode này lấy cả số ít và số nhiều cho agent(s), command(s) và skill(s) còn các primitives khác thì tôi không biết sao và phải nhớ rằng nó có cả global và project-based, và có cả cách dùng opencode.json để config các fields và primitives này và người dùng có thể có nhiều thứ khác từ các frameworks khác và hệ thống cả features lẫn tools hiện nay vẫn không dynamic nhận diện được nó một cách tự động và chủ động và nhất là permissions hiện nay rất conflicts cao độ

Vậy cuối cùng theo bạn thì chúng ta nên thực hiện các cluster nào theo thứ tự ra sao có cần thêm phase nào nữa vào đám sau đây không chúng ta đang ở phase 23.2 và có hơn 40+ phases vẫn chưa hoàn chỉnh của dự án này.

---

để hoàn thành mục tiêu này 

```markdown
OVERVIEW results mong muốn cuối cùng: Hivemind là sự kết hợp mạnh mẽ khắc phục các điểm yếu của cả GSD và OMO tức là giữ được context intellgence qua các session dài, các command và workflows following strictly các giao thức spec-driven, research-driven, context-driven, dependencies , tech compliances,  patterns và feature completeness driven và test-driven với hệ thống quản lý state, roadmap, project, architecture  với các gatekeeping (quality, validation, verification và  tự động hoá etc nói chung adapt nâng cao các cho hệ thống agents vs subagent, commands, workflows, references và templates tương tự như GSD nhưng agents với các công cụ quản lý  task, context, hierarchy, tự động routing command và workflow manipulated qua skills và commands routing và điều phối agents quản lý context qua commits và delegation logics (task và delegate-task)  dựa trên sự học hỏi của OMO để đưa tính tự động này vào nhưng vẫn duy trì được sự collaboration với người dùng 
```

Thì việc can thiệp sâu vào governance routing (phụ thuộc vào các cluster như governance config ban đầu của user tại .hivemind/config.json và các cluster như trajectory và agent-work-contract và injection và task managements etc đều cần phải thiết kế lại.) Nhưng một yếu tố mang tính kỹ thuật cần được nghiên cứu xem để agent có thể programmatically và deterministically qua tools hoặc các features có thể làm được điều này hay không

Khi user config họ muốn full-scale governance và agent-advisor tự động tức agent sẽ phải tự biết được giới hạn, biết được dependencies tự lập contract và trajectory để từ đó một session sẽ chỉ cover những luồng công việc được lên kế hoạch trước 

- Orchestrator Agent làm chủ để route đúng workflows thực hiện governance thay cho người dùng xác định đúng được workflows, routing và governance và checkpoints để điều phối các luồng con và xác định chuyển hướng nếu workflow mà users đề nghị đó không an toàn để thực hiện mà những workflows trước đó hay gatekeeping và dependent tasks trước đó cần phải làm và xác nhận ghi lên disk trước khi workflow dự định được thi hành → cơ chế cần ở đây là agent tự tạo một session mới (main session) và tạo prompt tại session mới đó với agent đề xuất để chạy → điều này liên quan tới interface tạo session và TUI main session sẽ được tạo một cách programatic và đưa người dùng tới ngay session mới đó mà họ không phải làm một cách thủ công. Tôi không biết SDK của OpenCode và Plugins SDK của nó có thể làm được điều này không hãy nghiên cứu và nếu được tôi cần triển khai một prototype để xem nó hoạt động được hay không trước khi kết nối nó vào đúng cluster feature của nó

---

Tình hình là với phase 24.x là một chuỗi các clusters liên kết rất chặt chẽ với nhau trong đó ngoài sự liên quan đã nói ở trên có các vấn đề sau phát sinh

- Đó là sự thay đổi của main repo GSD thành do owner của GSD đã allegedly scam và abandon his repo nên maintainer thay thế bằng  https://github.com/open-gsd/get-shit-done-redux
- Thêm đó là architecture của GSD có sử dụng gsd sdk khi chuyển đổi qua Hivemind với các features như session-tracker, delegation-status, coordination, agent-work-contract, injection, trajectory ;và mechanism riêng của nó cùng tính nâng cao của quy trình loops, định looping hay gating , hierarchy, delegation logics, và checkpoints → sẽ phải absorb để đưa về các programatic features phía dưới (hoặc là programatic injections, hay các tools để điều phối task và coordination của l0 agent) và qua các primitives như command và skills
- cũng như hoạt động gắn liền chặt chẽ với user intents, workflows, phases, mục đích của development phase qua cơ chế đã nêu ở đây “strictly các giao thức spec-driven, research-driven, context-driven, dependencies , tech compliances,  patterns và feature completeness driven và test-driven với hệ thống quản lý state, roadmap, project, architecture  với các gatekeeping (quality, validation, verification và  tự động hoá etc nói chung adapt nâng cao các cho hệ thống agents vs subagent, commands, workflows, references và templates tương tự như GSD nhưng agents với các công cụ quản lý  task, context, hierarchy, tự động routing command và workflow manipulated qua skills và commands routing và điều phối agents quản lý context qua commits và delegation logics (task và delegate-task)”
- Vì các lý do trên các mục kiến thức này không còn khả dụng mà phải được nghiên cứu đúng và đưa đúng về nội dung của nó

```markdown
/Users/apple/hivemind-plugin-private/.hivemind/registries
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md
```

- Thêm vào đó việc hoàn toàn hoàn thành 1 phase như một đơn vị độc lập là không thể mà nó sẽ phát sinh  rất nhiều các yếu tố sau đây
- các TBD - các integration checkpoints, các tracking và graphing dependencies giữa các phần này như một traversal notes và defer để có thể quay lại và gradually stack on
- sẽ cần các live UAT nghiệm ngặt dạng node để live test trên môi trường OpenCode này 

## ASSISTANT (turn 10)

Tôi hiểu rồi. Đây là yêu cầu lớn hơn - bạn muốn tôi **research và audit toàn bộ hệ thống** để đề xuất thứ tự priority cho các clusters, không phải discuss phase 24.1 ngay.

Đây là các vấn đề chính cần research:

## 1. GSD Repository Change Impact
- Old GSD repo abandoned (scam)
- New maintainer: `open-gsd/get-shit-done-redux`
- 11 research documents in `.planning/phases/23-notification-fix-and-tool-surface-docs/` based on OLD repo - **NEEDS RE-VALIDATION**

## 2. Agent Quality System Issues
- L1 agents removed, need to restructure L2/L3
- Agent profiles lack programmatic looping/gating/hierarchy logic
- Need to move these to programmatic features (tools, commands, skills)
- L0 = front-facing only, L2/L3 = hidden specialists
- All agent modes = "all", non-front-facing agents hidden

## 3. Primitives Management Issues
- Current assets/symlinks approach is wrong
- Need schema-based, code-based primitives in `assets/subdirs`
- `.opencode/subdirs` should extract from install, not symlinks
- Permissions conflicts need fixing

## 4. Need to Research OpenCode SDK Capabilities
- Can SDK programmatically create sessions with auto-routing?
- Prototype needed before full implementation
- Interface for TUI session creation

## Next Step

Tôi sẽ **delegate task tool** để:
1. Research OpenCode SDK session creation + auto-routing capabilities
2. Audit GSD research docs from old repo
3. Map agents to GSD commands in new repo
4. Propose priority order for clusters

Bạn có đồng ý không?

## USER (turn 12)

**source:** real-human

bây giờ hãy tưởng tượng hệ thống agents hiện tại không tồn tại đi để thiết kế theo hệ thống hiện nay đề xuất agents nào và nó tên gì chỉ cầnv ậy thôi và vì sao 

## ASSISTANT (turn 11)

# Agent System Redesign from Scratch

Tưởng tượng clean slate - thiết kế agents cho Hivemideals với đầy đủ auto-routing, governance, context management.

## L0: Front-Facing Orchestrators

### 1. `hm-orchestrator`
**Why**: Single front-facing entry point. User talks to orchestrator only. It:
- Parses user intent → routes to correct workflow
- Manages session lifecycle (create main session, TUI injection)
- Orchestrates L2/L3 agents via delegation
- Enforces governance boundaries (spec-driven, research-driven, context-driven)
- Creates child sessions programmatically for each phase
- Handles checkpoints, trajectory, compaction

### 2. `hm-conductor` (optional, if complex routing needed)
**Why**: Specialized for workflow routing when orchestrator delegates routing task.
- Routes commands to correct L2 agents
- Validates workflow dependencies before execution
- Manages phase traversal order

---

## L2: Domain Specialists

### Product Development Cluster

### 3. `hm-analyst`
**Why**: Requirements diagnosis, gap analysis, constraint discovery.
- Creates: REQUIREMENTS.md, gap analysis reports
- Input: User stories, PRDs
- Output: Falsifiable requirements, acceptance criteria

### 4. `hm-architect`
**Why**: Technical architecture, refactoring opportunities, maintainability scoring.
- Creates: ARCHITECTURE.md, refactoring plans
- Input: Codebase, requirements
- Output: Architecture decisions, dependency graphs

### 5. `hm-auditor`
**Why**: Production readiness, maintainability metrics, deployment safety.
- Creates: AUDIT.md, quality reports with metrics
- Input: Codebase, requirements
- Output: Scored reports (L1-L3 evidence), readiness verdicts

### 6. `hm-brainstormer`
**Why**: Ideation, requirements gathering, structured exploration before specification.
- Creates: BRAINSTORM.md, user journey maps
- Input: Vague user ideas
- Output: Structured requirements brief

### 7. `hm-build`
**Why**: Implementation specialist with test-first execution.
- Creates: Implementation code + comprehensive tests (80%+ coverage)
- Input: Requirements, specs
- Output: Working code, unit/integration/E2E tests

### 8. `hm-code-reviewer`
**Why**: Security, performance, bug, quality analysis against specs.
- Creates: REVIEW.md with severity-classified findings
- Input: Code changes, specs
- Output: Code review report with fixes

### 9. `hm-debugger`
**Why**: Systematic bug investigation with hypothesis testing.
- Creates: DEBUG.md with root cause analysis, evidence
- Input: Bugs, error logs
- Output: Root cause, fix implementation

### 10. `hm-ecologist`
**Why**: Feature ecosystem mapping, cross-dependency analysis, delivery sequencing.
- Creates: ECOSYSTEM.md, dependency graphs
- Input: Feature list
- Output: Dependency DAG, delivery order

### 11. `hm-executor`
**Why**: GSD-style phase execution with wave-based parallelization.
- Creates: VERIFICATION.md, execution logs
- Input: Phase plans
- Output: Completed phase, verification artifacts

### 12. `hm-finisher`
**Why**: Completion-looping, verification, regression guardrails.
- Creates: COMPLETION.md, verification evidence
- Input: Phase completion claims
- Output: Verified completion, regression prevention

### 13. `hm-l2-product-validation`
**Why**: Product-lens methodology, user impact, business value.
- Creates: VALIDATION.md, RICE scores
- Input: Feature proposals
- Output: Product validation with success metrics

### 14. `hm-l2-roadmap-maintainability`
**Why**: Long-term roadmap planning with maintainability scoring.
- Creates: ROADMAP.md, maintainability assessments
- Input: Feature backlog
- Output: Ordered roadmap, technical debt tracking

---

## L2: Meta-Builder Cluster

### 15. `hf-l2-meta-builder-core`
**Why**: Routes requests about OpenCode meta-concepts.
- Creates: ARCHITECTURE.md for meta-concepts
- Input: Meta-concept requests
- Output: Designed agents/skills/commands

### 16. `hf-l2-agent-builder`
**Why**: Creates, audits, repairs OpenCode agent definitions.
- Creates: Agent YAML frontmatter, XML execution flows
- Input: Agent requirements
- Output: Shipped agent definitions

### 17. `hf-l2-skill-builder`
**Why**: Creates, audits SKILL.md packages.
- Creates: SKILL.md with progressive disclosure
- Input: Skill requirements
- Output: Conformed skill packages

### 18. `hf-l2-command-builder`
**Why**: Creates, audits OpenCode command definitions.
- Creates: Command YAML frontmatter, $ARGUMENT schemas
- Input: Command requirements
- Output: Shipped command definitions

### 19. `hf-l2-naming-syndicate`
**Why**: Formal naming convention for meta-concepts.
- Creates: NAMING.md, validation rules
- Input: New primitive proposals
- Output: Validated naming, prefix assignment

---

## L2: Quality Gates Cluster

### 20. `gate-l3-spec-compliance`
**Why**: Spec compliance gate - bidirectional traceability, gap detection.
- Creates: COMPLIANCE.md, gap reports
- Input: Implemented code, specs
- Output: Compliance verdict, gap remediation

### 21. `gate-l3-lifecycle-integration`
**Why**: Lifecycle quality gate - 9-surface authority, CQRS boundaries.
- Creates: LIFECYCLE.md, integration reports
- Input: Source files
- Output: Lifecycle compliance verdict

### 22. `gate-l3-evidence-truth`
**Why**: Evidence truth gate - L1-L5 evidence hierarchy verification.
- Creates: EVIDENCE.md, verification reports
- Input: Implementation claims
- Output: Evidence verdict (PASS/FAIL)

---

## L2: Coordination Cluster

### 23. `hm-l2-coordinating-loop`
**Why**: Multi-agent dispatch with validation gates, handoff protocols.
- Creates: COORDINATION.md, delegation logs
- Input: Multi-agent tasks
- Output: Coordinated execution results

### 24. `hm-l2-phase-execution`
**Why**: GSD-style phase plans execution with checkpoint recovery.
- Creates: EXECUTION.md, checkpoint logs
- Input: Phase plans
- Output: Executed phases, checkpoint artifacts

### 25. `hm-l2-completion-looping`
**Why**: Guardrail workflows against regression with non-completion detection.
- Creates: COMPLETION.md, loop-back logs
- Input: Task completion claims
- Output: Verified completion, regression prevention

### 26. `hm-l2-ecologist`
**Why**: (Duplicate with #11 - remove or rename)
- Suggested rename: `hm-ecosystem-mapper`

---

## L2: Reference Cluster

### 27. `stack-l3-nextjs`
**Why**: Next.js 16.x stack reference.
- Creates: NEXTJS.md, code patterns
- Input: Next.js questions
- Output: Framework patterns, best practices

### 28. `stack-l3-zod`
**Why**: Zod v4 schema validation reference.
- Creates: ZOD.md, validation patterns
- Input: Zod questions
- Output: Schema patterns, v3→v4 migration

### 29. `stack-l3-vitest`
**Why**: Vitest testing framework reference.
- Creates: VITEST.md, testing patterns
- Input: Vitest questions
- Output: Testing patterns, harness conventions

### 30. `stack-l3-bun-pty`
**Why**: Bun-pty pseudo-terminal integration reference.
- Creates: BUN-PTY.md, PTY patterns
- Input: PTY questions
- Output: PTY management patterns

---

## Summary: 30 Agents Total

| Cluster | Count | Agents |
|---------|-------|--------|
| L0 Orchestrators | 1-2 | hm-orchestrator, hm-conductor |
| L2 Product Dev | 10 | analyst, architect, auditor, brainstormer, build, code-reviewer, debugger, executor, finisher, product-validation, roadmap-maintainability |
| L2 Meta-Builder | 5 | meta-builder-core, agent-builder, skill-builder, command-builder, naming-syndicate |
| L2 Quality Gates | 3 | spec-compliance, lifecycle-integration, evidence-truth |
| L2 Coordination | 4 | coordinating-loop, phase-execution, completion-looping, ecosystem-mapper |
| L2/Stack Reference | 4 | nextjs, zod, vitest, bun-pty |

---

**Điểm khác biệt so với hiện trạng:**
- Namesake rõ ràng hơn (giả dụ: `hm-build` thay vì `hm-l2-executor`)
- Mỗi agent có responsibility đơn nhất
- Không có overlap role
- L0 = front-facing duy nhất (orchestrator)
- L2/L3 = hidden specialists với domain rõ ràng

Bạn muốn tôi phát triển chi tiết agent nào trước, hoặc có adjustment nào cho đề xuất này?

## USER (turn 13)

**source:** real-human

tập trung vào nhóm hm và chuyển gate vào hm và dựa trên workflow lúc nào agents nào được kêu ra vì như đã nói "1. Hê thống routing thông qua commands và skills (sử dụng field subtask và agents ) để parse vs workflows, references, templates  và tự điều phối agents → tự động route workflows bài bản qua agents và subagents chúng ta vẫn chưa làm được do các điểm yếu sau
    1. Hoàn toàn thiếu commands, references và templates để parse tự động thiết lập các routing chặt chẽ
    2. thiếu looping được chia nhỏ hợp lý, có hệ thống thông qua việc hệ thống các artifacts documents → tưc agents khi tạo các artifacts trong planning, research, audit, gatekeeping quản lý code và project, requirements, dependencies thực hiện debug, review v..v… đều thiếu do việc các hệ thống tài liệu này chưa được quy định về quy cách, tính dependent, governance theo thứ tự thế nào. Ngay cả  naming các document này phải theo quy cách gì, yaml heading gồm các trường gì để chain và parse và khi nào tạo mới khi nào phải edit khi các documents và artifacts này đòi hỏi structured chặt chẽ để parse các context cần thiết - nên biết rằng context management cho workflow cho một session dài rất phức tạp
    3. hệ thống agents yếu kém chất lưượng và sự đồng nhất theo tôi qua cách hiện nay thay vì thiết lập permissions skills, custom tools ngay tại yaml của agents qua hm-* và l0, l1, l2, l3 hiện nay rất yếu kém và thiếu chủ động và không hề kiểm soát được qua các yếu tố sau
        1. agent context chỉ thiết lập ngay lần đầu profile nó sẽ prune  khi context kéo dài , qua turns và có compacts → các bước quy định looping hay gating , hierarchy, delegation logics, và checkpoints gay tại profile agents sẽ không hiệu quả ⇒ thay vào đó agent profile nên được thiết kế để nó hoàn thành chuyên môn của nó chứ không phải là nơi build logics looping hay logics check points và ngay cả logics hierarchy → 3 thứ trên phải được xây dựng trên programatic approaches mà tôi nó phụ thuộc rất lớn vào main front facing orchestrator - thứ logics duy nhất có thể build tại profile agents là logics switch agents và commands - wokrlfows (ví dụ như orchéstrator giao việc debug cho executor thì executor detect đó không phải specialist của mình thì switch qua debugger để tiếp tục) - các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents. Nhưng logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints sẽ không hiệu quả → phát triển lại hệ thống agent này về quality as expert và như các điều nói trên và thin framing cho routing logics trong đó việc naming l0, l1, l2, l3 sẽ cơ cấu lại như sau (cho cả agents và skills nhưng với knowledge sau)
            1. bỏ đi l1 agent → l0 agent sẽ in charge frontfacing duy nhất
            2. các context về looping logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints → sẽ phải absorb để đưa về các programatic features phía dưới (hoặc là programatic injections, hay các tools để điều phối task và coordination của l0 agent) và qua các primitives như command và skills
            3. agent mode thành “all” hết nhưng các agents không front facing sẽ bị hidden để nó chỉ có thể được call bở l0 agent
            4. các logic về  các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents - chú ý về việc agents đó phải làm việc gì tham khảo cách viết của GSD agents , tạo ra artifacts nào, control documents nào, dùng context nào, đọc context, execute việc gì đưa ra format ra sau etc đó là focus → nhóm l2 và l3 agent hoàn toàn phải làm lại hết vì thay vì l2 và l3 thì phải classify theo nhóm công việc trong một quy trình chặt chẽ của một dự án rất phức tạp với các yếu tố tôi nêu trên " có rất nhiều agents ở trên không  bao giờ được gọi và dùng tới

## ASSISTANT (turn 12)

# Agent System Redesign from Scratch

Tưởng tượng clean slate - thiết kế agents cho Hivemideals với đầy đủ auto-routing, governance, context management.

## L0: Front-Facing Orchestrators

### 1. `hm-orchestrator`
**Why**: Single front-facing entry point. User talks to orchestrator only. It:
- Parses user intent → routes to correct workflow
- Manages session lifecycle (create main session, TUI injection)
- Orchestrates L2/L3 agents via delegation
- Enforces governance boundaries (spec-driven, research-driven, context-driven)
- Creates child sessions programmatically for each phase
- Handles checkpoints, trajectory, compaction

### 2. `hm-conductor` (optional, if complex routing needed)
**Why**: Specialized for workflow routing when orchestrator delegates routing task.
- Routes commands to correct L2 agents
- Validates workflow dependencies before execution
- Manages phase traversal order

---

## L2: Domain Specialists

### Product Development Cluster

### 3. `hm-analyst`
**Why**: Requirements diagnosis, gap analysis, constraint discovery.
- Creates: REQUIREMENTS.md, gap analysis reports
- Input: User stories, PRDs
- Output: Falsifiable requirements, acceptance criteria

### 4. `hm-architect`
**Why**: Technical architecture, refactoring opportunities, maintainability scoring.
- Creates: ARCHITECTURE.md, refactoring plans
- Input: Codebase, requirements
- Output: Architecture decisions, dependency graphs

### 5. `hm-auditor`
**Why**: Production readiness, maintainability metrics, deployment safety.
- Creates: AUDIT.md, quality reports with metrics
- Input: Codebase, requirements
- Output: Scored reports (L1-L3 evidence), readiness verdicts

### 6. `hm-brainstormer`
**Why**: Ideation, requirements gathering, structured exploration before specification.
- Creates: BRAINSTORM.md, user journey maps
- Input: Vague user ideas
- Output: Structured requirements brief

### 7. `hm-build`
**Why**: Implementation specialist with test-first execution.
- Creates: Implementation code + comprehensive tests (80%+ coverage)
- Input: Requirements, specs
- Output: Working code, unit/integration/E2E tests

### 8. `hm-code-reviewer`
**Why**: Security, performance, bug, quality analysis against specs.
- Creates: REVIEW.md with severity-classified findings
- Input: Code changes, specs
- Output: Code review report with fixes

### 9. `hm-debugger`
**Why**: Systematic bug investigation with hypothesis testing.
- Creates: DEBUG.md with root cause analysis, evidence
- Input: Bugs, error logs
- Output: Root cause, fix implementation

### 10. `hm-ecologist`
**Why**: Feature ecosystem mapping, cross-dependency analysis, delivery sequencing.
- Creates: ECOSYSTEM.md, dependency graphs
- Input: Feature list
- Output: Dependency DAG, delivery order

### 11. `hm-executor`
**Why**: GSD-style phase execution with wave-based parallelization.
- Creates: VERIFICATION.md, execution logs
- Input: Phase plans
- Output: Completed phase, verification artifacts

### 12. `hm-finisher`
**Why**: Completion-looping, verification, regression guardrails.
- Creates: COMPLETION.md, verification evidence
- Input: Phase completion claims
- Output: Verified completion, regression prevention

### 13. `hm-l2-product-validation`
**Why**: Product-lens methodology, user impact, business value.
- Creates: VALIDATION.md, RICE scores
- Input: Feature proposals
- Output: Product validation with success metrics

### 14. `hm-l2-roadmap-maintainability`
**Why**: Long-term roadmap planning with maintainability scoring.
- Creates: ROADMAP.md, maintainability assessments
- Input: Feature backlog
- Output: Ordered roadmap, technical debt tracking

---

## L2: Meta-Builder Cluster

### 15. `hf-l2-meta-builder-core`
**Why**: Routes requests about OpenCode meta-concepts.
- Creates: ARCHITECTURE.md for meta-concepts
- Input: Meta-concept requests
- Output: Designed agents/skills/commands

### 16. `hf-l2-agent-builder`
**Why**: Creates, audits, repairs OpenCode agent definitions.
- Creates: Agent YAML frontmatter, XML execution flows
- Input: Agent requirements
- Output: Shipped agent definitions

### 17. `hf-l2-skill-builder`
**Why**: Creates, audits SKILL.md packages.
- Creates: SKILL.md with progressive disclosure
- Input: Skill requirements
- Output: Conformed skill packages

### 18. `hf-l2-command-builder`
**Why**: Creates, audits OpenCode command definitions.
- Creates: Command YAML frontmatter, $ARGUMENT schemas
- Input: Command requirements
- Output: Shipped command definitions

### 19. `hf-l2-naming-syndicate`
**Why**: Formal naming convention for meta-concepts.
- Creates: NAMING.md, validation rules
- Input: New primitive proposals
- Output: Validated naming, prefix assignment

---

## L2: Quality Gates Cluster

### 20. `gate-l3-spec-compliance`
**Why**: Spec compliance gate - bidirectional traceability, gap detection.
- Creates: COMPLIANCE.md, gap reports
- Input: Implemented code, specs
- Output: Compliance verdict, gap remediation

### 21. `gate-l3-lifecycle-integration`
**Why**: Lifecycle quality gate - 9-surface authority, CQRS boundaries.
- Creates: LIFECYCLE.md, integration reports
- Input: Source files
- Output: Lifecycle compliance verdict

### 22. `gate-l3-evidence-truth`
**Why**: Evidence truth gate - L1-L5 evidence hierarchy verification.
- Creates: EVIDENCE.md, verification reports
- Input: Implementation claims
- Output: Evidence verdict (PASS/FAIL)

---

## L2: Coordination Cluster

### 23. `hm-l2-coordinating-loop`
**Why**: Multi-agent dispatch with validation gates, handoff protocols.
- Creates: COORDINATION.md, delegation logs
- Input: Multi-agent tasks
- Output: Coordinated execution results

### 24. `hm-l2-phase-execution`
**Why**: GSD-style phase plans execution with checkpoint recovery.
- Creates: EXECUTION.md, checkpoint logs
- Input: Phase plans
- Output: Executed phases, checkpoint artifacts

### 25. `hm-l2-completion-looping`
**Why**: Guardrail workflows against regression with non-completion detection.
- Creates: COMPLETION.md, loop-back logs
- Input: Task completion claims
- Output: Verified completion, regression prevention

### 26. `hm-l2-ecologist`
**Why**: (Duplicate with #11 - remove or rename)
- Suggested rename: `hm-ecosystem-mapper`

---

## L2: Reference Cluster

### 27. `stack-l3-nextjs`
**Why**: Next.js 16.x stack reference.
- Creates: NEXTJS.md, code patterns
- Input: Next.js questions
- Output: Framework patterns, best practices

### 28. `stack-l3-zod`
**Why**: Zod v4 schema validation reference.
- Creates: ZOD.md, validation patterns
- Input: Zod questions
- Output: Schema patterns, v3→v4 migration

### 29. `stack-l3-vitest`
**Why**: Vitest testing framework reference.
- Creates: VITEST.md, testing patterns
- Input: Vitest questions
- Output: Testing patterns, harness conventions

### 30. `stack-l3-bun-pty`
**Why**: Bun-pty pseudo-terminal integration reference.
- Creates: BUN-PTY.md, PTY patterns
- Input: PTY questions
- Output: PTY management patterns

---

## Summary: 30 Agents Total

| Cluster | Count | Agents |
|---------|-------|--------|
| L0 Orchestrators | 1-2 | hm-orchestrator, hm-conductor |
| L2 Product Dev | 10 | analyst, architect, auditor, brainstormer, build, code-reviewer, debugger, executor, finisher, product-validation, roadmap-maintainability |
| L2 Meta-Builder | 5 | meta-builder-core, agent-builder, skill-builder, command-builder, naming-syndicate |
| L2 Quality Gates | 3 | spec-compliance, lifecycle-integration, evidence-truth |
| L2 Coordination | 4 | coordinating-loop, phase-execution, completion-looping, ecosystem-mapper |
| L2/Stack Reference | 4 | nextjs, zod, vitest, bun-pty |

---

**Điểm khác biệt so với hiện trạng:**
- Namesake rõ ràng hơn (giả dụ: `hm-build` thay vì `hm-l2-executor`)
- Mỗi agent có responsibility đơn nhất
- Không có overlap role
- L0 = front-facing duy nhất (orchestrator)
- L2/L3 = hidden specialists với domain rõ ràng

Bạn muốn tôi phát triển chi tiết agent nào trước, hoặc có adjustment nào cho đề xuất này?

## ASSISTANT (turn 13)

# Hivemind Agent System - Workflow-Based Design

Tôi sẽ thiết kế lại agents theo **workflow lifecycle** - chỉ những agents được dùng trong quy trình spec-driven, research-driven, context-driven.

## Workflow Pipeline

```
User Request
    ↓
[Phase 0: Intent Clarification]
    ↓
[Phase 1: Research & Discovery]
    ↓
[Phase 2: Specification]
    ↓
[Phase 3: Architecture & Design]
    ↓
[Phase 4: Planning]
    ↓
[Phase 5: Implementation]
    ↓
[Phase 6: Quality Gates]
    ↓
[Phase 7: Verification & Shipping]
```

## Agents by Workflow Stage

### Stage 0: Intent Clarification (L0 Front-Facing)

### 1. `hm-orchestrator`
**Role**: Front-facing entry point, workflow routing
**When called**: User initiates any work
**Why essential**: 
- Parses user intent → routes to correct workflow
- Creates main session + TUI injection
- Manages delegation to L2 specialists
- Enforces governance boundaries

```yaml
tools: [task, delegate-task, session-create]
skills: [hm-l2-user-intent-interactive-loop, hm-l2-gate-orchestrator]
mode: all
frontfacing: true
```

---

### Stage 1: Research & Discovery

### 2. `hm-researcher`
**Role**: Multi-source investigation, evidence gathering, structured reporting
**When called**: After intent clarified, before any spec
**Why essential**:
- Researches domain, patterns, existing solutions
- Creates: RESEARCH.md, evidence reports

## USER (turn 14)

**source:** real-human

không permission lên schema đọc kỹ agent context chỉ thiết lập ngay lần đầu profile nó sẽ prune  khi context kéo dài , qua turns và có compacts → các bước quy định looping hay gating , hierarchy, delegation logics, và checkpoints gay tại profile agents sẽ không hiệu quả ⇒ thay vào đó agent profile nên được thiết kế để nó hoàn thành chuyên môn của nó chứ không phải là nơi build logics looping hay logics check points và ngay cả logics hierarchy → 3 thứ trên phải được xây dựng trên programatic approaches mà tôi nó phụ thuộc rất lớn vào main front facing orchestrator - thứ logics duy nhất có thể build tại profile agents là logics switch agents và commands - wokrlfows (ví dụ như orchéstrator giao việc debug cho executor thì executor detect đó không phải specialist của mình thì switch qua debugger để tiếp tục) - các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents. Nhưng logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints sẽ không hiệu quả → phát triển lại hệ thống agent này về quality as expert và như các điều nói trên và thin framing cho routing logics trong đó việc naming l0, l1, l2, l3 sẽ cơ cấu lại như sau (cho cả agents và skills nhưng với knowledge sau)  ko để các field opencode ko nhận dạng

## ASSISTANT (turn 14)

# Hivemind Agent System - Redefined

Tôi hiểu rồi. **Agent profiles KHÔNG chứa permissions/tools/skills** - đó là runtime decision của orchestrator. Agent profile chỉ định:

1. **Expert role** - chuyên môn
2. **Artifacts** - documents/code/tests tạo ra
3. **Workflow position** - khi nào được gọi
4. **Naming/pathing/format** - quy cách làm việc

## Core Principle

```
L0 (front-facing) → L2/L3 (hidden specialists)
    ↓                    ↓
Programmatic routing   Expert execution
via tools/commands     via artifacts
```

---

## Agent System by Workflow Pipeline

### Phase 0: Intent Clarification

### 1. `hm-orchestrator`
**Role**: Front-facing coordinator, workflow router
**When**: User initiates work
**Artifacts**:
- `.hivemind/planning/PROJECT.md` (updated)
- Main session with TUI prompt
- Delegation log (`.hivemind/state/delegations.json`)

**Workflow position**: ALWAYS first, routes to L2 specialists

---

### Phase 1: Research

### 2. `hm-researcher`
**Role**: Multi-source investigation, evidence gathering
**When**: After intent clarified, before spec
**Artifacts**:
- `.hivemind/research/RESEARCH.md` (date-stamped)
- Evidence reports with citations
- Gap analysis (`GAPS.md`)

**Workflow position**: After `hm-orchestrator`, before `hm-specifier`

---

### Phase 2: Specification

### 3. `hm-specifier`
**Role**: Requirements authoring, acceptance criteria
**When**: After research complete
**Artifacts**:
- `.hivemind/planning/REQUIREMENTS.md`
- SPEC.md files (date-stamped)
- Acceptance criteria matrices

**Workflow position**: After `hm-researcher`, before `hm-architect`

---

### Phase 3: Architecture

### 4. `hm-architect`
**Role**: Technical design, dependency mapping
**When**: After spec locked
**Artifacts**:
- `.hivemind/planning/architecture/ARCHITECTURE.md`
- Dependency graphs (`.hivemind/planning/graphs/`)
- ADRs (`.hivemind/planning/adr/`)

**Workflow position**: After `hm-specifier`, before `hm-planner`

---

### Phase 4: Planning

### 5. `hm-planner`
**Role**: Task breakdown, phase planning
**When**: After architecture locked
**Artifacts**:
- `.hivemind/planning/phases/M###-PLAN.md`
- Phase manifests (`.planning/phases/M###/*/`)
- Task lists (`.hivemind/planning/task-lists/`)

**Workflow position**: After `hm-architect`, before `hm-builder`

---

### Phase 5: Implementation

### 6. `hm-builder`
**Role**: Code implementation, test-first
**When**: After plan locked
**Artifacts**:
- Source code (`src/**/*.ts`)
- Tests (`tests/**/*.test.ts`)
- Commit messages (via git)

**Workflow position**: After `hm-planner`, before `hm-reviewer`

---

### Phase 6: Quality Gates

### 7. `hm-reviewer`
**Role**: Code review, security, performance
**When**: After implementation, before merge
**Artifacts**:
- `.hivemind/planning/reviews/REVIEW.md`
- Findings with severity (CRITICAL/HIGH/MEDIUM/LOW)
- Fix recommendations

**Workflow position**: After `hm-builder`, before `hm-verifier`

---

### 8. `hm-verifier`
**Role**: Quality gates, validation, verification
**When**: After review pass
**Artifacts**:
- `.hivemind/planning/gates/GATE-M###.md`
- L1-L3 evidence reports
- PASS/FAIL verdicts

**Workflow position**: After `hm-reviewer`, before shipping

---

### Phase 7: Verification & Shipping

### 9. `hm-verifier` (same as #8)
**Role**: Integration verification, regression testing
**When**: After quality gates pass
**Artifacts**:
- Verification reports (`.hivemind/planning/verification/`)
- Regression test results
- Release notes

**Workflow position**: After `hm-verifier`, before shipping

---

### 10. `hm-shipper`
**Role**: Release coordination, changelog, deployment prep
**When**: After all verification pass
**Artifacts**:
- `.hivemind/planning/releases/CHANGELOG.md`
- Release manifests
- Deployment checklists

**Workflow position**: Final L2 agent before L0 routes to next phase

---

## L2 Coordination Agents (Cross-Cutting)

### 11. `hm-coordinator`
**Role**: Multi-agent dispatch, handoff protocols
**When**: When task requires multiple specialists
**Artifacts**:
- `.hivemind/planning/coordination/COORDINATION.md`
- Delegation tree (`.hivemind/state/delegations.json`)
- Handoff logs

**Workflow position**: Called by `hm-orchestrator` when complex work needed

---

### 12. `hm-loop-mananger`
**Role**: Iterative refinement, completion gating
**When**: Task requires multiple iterations
**Artifacts**:
- Loop logs (`.hivemind/planning/loops/`)
- Iteration checkpoints
- Completion evidence

**Workflow position**: Embedded in `hm-builder`/`hm-reviewer` when iterations needed

---

### 13. `hm-ecologist`
**Role**: Feature ecosystem mapping, dependency tracking
**When**: New feature added to existing system
**Artifacts**:
- `.hivemind/planning/ecosystem/ECOSYSTEM.md`
- Dependency DAGs
- Impact assessments

**Workflow position**: After `hm-builder` for new features

---

## L2 Meta-Builder Agents

### 14. `hf-agent-builder`
**Role**: Agent definition creation/repair
**When**: New agent needed or existing agent broken
**Artifacts**:
- Agent YAML frontmatter
- SKILL.md packages
- Command definitions

**Workflow position**: Called by `hm-orchestrator` for meta-work

---

### 15. `hf-skill-builder`
**Role**: Skill package creation/audit
**When**: New skill needed or existing skill broken
**Artifacts**:
- SKILL.md files
- Trigger phrase definitions
- Skill evals

**Workflow position**: Called by `hf-agent-builder` or `hm-orchestrator`

---

## L2 Quality Gate Agents

### 16. `gate-spec-compliance`
**Role**: Spec-to-code traceability, gap detection
**When**: Before quality gates
**Artifacts**:
- `.hivemind/planning/gates/COMPLIANCE.md`
- Gap reports
- Traceability matrices

**Workflow position**: After `hm-builder`, before `gate-evidence-truth`

---

### 17. `gate-evidence-truth`
**Role**: L1-L5 evidence verification
**When**: Before phase completion
**Artifacts**:
- `.hivemind/planning/gates/EVIDENCE.md`
- Verification verdicts (PASS/FAIL)
- Evidence hierarchy reports

**Workflow position**: Final gate before shipping

---

## Summary: 17 Core Agents

| Phase | Agent | Role | Artifacts |
|-------|-------|------|-----------|
| 0 | `hm-orchestrator` | Front-facing router | Main session, delegations.json |
| 1 | `hm-researcher` | Investigation | RESEARCH.md, evidence reports |
| 2 | `hm-specifier` | Requirements authoring | REQUIREMENTS.md, SPEC.md |
| 3 | `hm-architect` | Technical design | ARCHITECTURE.md, ADRs |
| 4 | `hm-planner` | Task breakdown | M###-PLAN.md, manifests |
| 5 | `hm-builder` | Implementation | Source code, tests, commits |
| 6 | `hm-reviewer` | Code review | REVIEW.md, findings |
| 7 | `hm-verifier` | Quality gates | GATE-###.md, evidence reports |
| 8 | `hm-shipper` | Release coordination | CHANGELOG.md, manifests |
| - | `hm-coordinator` | Multi-agent dispatch | COORDINATION.md, delegation tree |
| - | `hm-loop-manager` | Iterative refinement | Loop logs, checkpoints |
| - | `hm-ecologist` | Ecosystem mapping | ECOSYSTEM.md, DAGs |
| - | `hf-agent-builder` | Agent creation | Agent YAML, frontmatter |
| - | `hf-skill-builder` | Skill creation | SKILL.md, triggers |
| - | `gate-spec-compliance` | Spec traceability | COMPLIANCE.md, gaps |
| - | `gate-evidence-truth` | Evidence verification | EVIDENCE.md, verdicts |

---

**Điểm khác biệt:**
- **17 agents** (down from 89) - only essential ones
- **No permissions/tools/skills in YAML** - those are runtime
- **Clear workflow positions** - when each agent gets called
- **Artifact-focused** - what each agent produces
- **L0 = 1 agent** (orchestrator), L2 = 16 specialists
- **Gate agents** merged into workflow (not separate cluster)

Bạn thấy thiếu agent nào hoặc thừa agent nào không?

## USER (turn 15)

**source:** real-human

bỏ hf ra chưa đụng tới nhìn vào đây so sánh với gsd /Users/apple/hivemind-plugin-private/.opencode/agents
/Users/apple/hivemind-plugin-private/.opencode/agents/.gitkeep
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-agent-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-command-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-meta-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-prompter.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-refactorer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-skill-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-tool-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-analyst.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-architect.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-brainstormer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-connector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-purifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-critic.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-curator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-ecologist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-finisher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-general.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-integrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-intent-loop.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-investigator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-mentor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-meta-synthesis.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-operator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-optimizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-persistor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-repackager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-skimmer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-risk-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-scout.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-spec-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-strategist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-technician.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-test-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-validator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-writer.md
/Users/apple/hivemind-plugin-private/.opencode/command
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-capture.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-code-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-config.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-debug.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-explore.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-fast.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-forensics.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-graphify.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-health.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-help.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-import.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-inbox.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-manager.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-context.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-ideate.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-manage.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-workflow.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-progress.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-quick.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-resume-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-settings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ship.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-sketch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spike.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-stats.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-surface.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-thread.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-undo.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workstreams.md '/Users/apple/hivemind-plugin-private/.opencode/gsd-file-manifest.json' /Users/apple/hivemind-plugin-private/.opencode/get-shit-done
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/000-first-time-baseline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/001-legacy-orphan-files.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/active-workstream-store.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/adr-parser.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/artifacts.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/audit.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-command-router-adapter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-sdk-bridge.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/clusters.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/code-review-flags.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-aliases.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-routing-hub.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/commands.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config-schema.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/configuration.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/context-utilization.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/core.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/docs.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/drift.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/fallow-runner.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/frontmatter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gap-checker.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/graphify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gsd2-import.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/install-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-authoring.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-report.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/intel.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/learnings.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/milestone.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-catalog.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phases-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/planning-workspace.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-output.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-pipeline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/project-root.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/prompt-budget.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/review-reviewer-selection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-artifact-layout.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-homes.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-slash.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/security.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/shell-command-projection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/surface.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/template.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/uat.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory-builder.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/worktree-safety.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-defaults.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-schema.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/model-catalog.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/check-latest-version.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/verify-reapply-patches.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/dev.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/verifier.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-frameworks.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/artifact-types.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/autonomous-smart-discuss.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/common-bug-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/continuation-format.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/debugger-philosophy.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/decimal-phase-calculation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/doc-conflict-engine.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/execute-mvp-tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-integration.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-planning-commit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ios-scaffold.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mandatory-initial-read.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profile-resolution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profiles.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mvp-concepts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/phase-argument-parsing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-chunked.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-gap-closure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-graphify-auto-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-human-verify-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-interface-context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-reviews.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-revision.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-source-audit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planning-config.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/project-skills-discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/questioning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-interactivity.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-theme-system.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-tooling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-variant-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-execution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-planning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-verification.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-partner.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-profiling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-overrides.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verify-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/workstream-flag.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/architecture.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/concerns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/conventions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/stack.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/structure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/testing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/ARCHITECTURE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/FEATURES.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/PITFALLS.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/STACK.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/SUMMARY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/AI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/claude-md.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/config.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/continue-here.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/copilot-instructions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/debug-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/DEBUG.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/dev-preferences.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone-archive.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/phase-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/planner-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/README.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/requirements.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/retrospective.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/roadmap.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/SECURITY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/state.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-complex.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-minimal.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-standard.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UAT.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-profile.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-setup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/verification-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/advisor.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/all.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/analyze.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/auto.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/batch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/chain.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/text.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/checkpoint.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/brief.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/full.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/topic.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-todo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/analyze-dependencies.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/check-todos.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/diagnose-issues.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discovery-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/explore.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/fast.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/graduation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/health.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/import.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/inbox.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-workspaces.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/manager.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/node-repair.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/note.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-milestone-gaps.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plant-seed.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/reapply-patches.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/resume-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/scan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/session-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-advanced.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sync-skills.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/thread.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/transition.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/undo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/VERSION  và hiểu sự khác nhau của hivemind và GSD thì các agents trên có đúng chưa sự khác nhau cơ bản là chúng ta có các programatic features và chúng ta có l0 call được các agents ở dưới và l2 và l3 vẫn đang rất lộn xộn mặc dù nó loop cho nhau được nhưng cần programatic routing qua commands và workflow để nó loop theo một governance cho phép nên đừng tạo ra những agent quá vô lý trong khi thiếu hụt những agent mang tính chủ chốt

## USER (turn 19)

**source:** real-human

bỏ hf ra chưa đụng tới nhìn vào đây so sánh với gsd /Users/apple/hivemind-plugin-private/.opencode/agents
/Users/apple/hivemind-plugin-private/.opencode/agents/.gitkeep
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-agent-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-command-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-meta-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-prompter.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-refactorer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-skill-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-tool-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-analyst.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-architect.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-brainstormer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-connector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-purifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-critic.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-curator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-ecologist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-finisher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-general.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-integrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-intent-loop.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-investigator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-mentor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-meta-synthesis.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-operator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-optimizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-persistor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-repackager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-skimmer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-risk-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-scout.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-spec-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-strategist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-technician.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-test-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-validator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-writer.md
/Users/apple/hivemind-plugin-private/.opencode/command
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-capture.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-code-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-config.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-debug.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-explore.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-fast.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-forensics.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-graphify.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-health.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-help.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-import.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-inbox.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-manager.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-context.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-ideate.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-manage.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-workflow.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-progress.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-quick.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-resume-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-settings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ship.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-sketch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spike.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-stats.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-surface.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-thread.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-undo.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workstreams.md '/Users/apple/hivemind-plugin-private/.opencode/gsd-file-manifest.json' /Users/apple/hivemind-plugin-private/.opencode/get-shit-done
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/000-first-time-baseline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/001-legacy-orphan-files.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/active-workstream-store.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/adr-parser.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/artifacts.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/audit.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-command-router-adapter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-sdk-bridge.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/clusters.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/code-review-flags.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-aliases.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-routing-hub.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/commands.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config-schema.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/configuration.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/context-utilization.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/core.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/docs.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/drift.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/fallow-runner.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/frontmatter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gap-checker.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/graphify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gsd2-import.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/install-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-authoring.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-report.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/intel.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/learnings.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/milestone.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-catalog.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phases-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/planning-workspace.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-output.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-pipeline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/project-root.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/prompt-budget.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/review-reviewer-selection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-artifact-layout.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-homes.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-slash.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/security.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/shell-command-projection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/surface.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/template.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/uat.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory-builder.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/worktree-safety.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-defaults.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-schema.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/model-catalog.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/check-latest-version.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/verify-reapply-patches.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/dev.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/verifier.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-frameworks.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/artifact-types.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/autonomous-smart-discuss.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/common-bug-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/continuation-format.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/debugger-philosophy.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/decimal-phase-calculation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/doc-conflict-engine.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/execute-mvp-tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-integration.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-planning-commit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ios-scaffold.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mandatory-initial-read.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profile-resolution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profiles.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mvp-concepts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/phase-argument-parsing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-chunked.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-gap-closure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-graphify-auto-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-human-verify-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-interface-context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-reviews.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-revision.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-source-audit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planning-config.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/project-skills-discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/questioning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-interactivity.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-theme-system.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-tooling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-variant-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-execution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-planning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-verification.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-partner.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-profiling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-overrides.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verify-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/workstream-flag.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/architecture.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/concerns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/conventions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/stack.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/structure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/testing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/ARCHITECTURE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/FEATURES.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/PITFALLS.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/STACK.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/SUMMARY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/AI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/claude-md.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/config.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/continue-here.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/copilot-instructions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/debug-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/DEBUG.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/dev-preferences.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone-archive.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/phase-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/planner-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/README.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/requirements.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/retrospective.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/roadmap.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/SECURITY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/state.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-complex.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-minimal.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-standard.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UAT.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-profile.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-setup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/verification-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/advisor.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/all.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/analyze.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/auto.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/batch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/chain.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/text.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/checkpoint.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/brief.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/full.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/topic.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-todo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/analyze-dependencies.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/check-todos.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/diagnose-issues.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discovery-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/explore.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/fast.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/graduation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/health.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/import.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/inbox.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-workspaces.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/manager.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/node-repair.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/note.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-milestone-gaps.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plant-seed.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/reapply-patches.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/resume-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/scan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/session-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-advanced.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sync-skills.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/thread.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/transition.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/undo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/VERSION  và hiểu sự khác nhau của hivemind và GSD thì các agents trên có đúng chưa sự khác nhau cơ bản là chúng ta có các programatic features và chúng ta có l0 call được các agents ở dưới và l2 và l3 vẫn đang rất lộn xộn mặc dù nó loop cho nhau được nhưng cần programatic routing qua commands và workflow để nó loop theo một governance cho phép nên đừng tạo ra những agent quá vô lý trong khi thiếu hụt những agent mang tính chủ chốt sai artifacts sau này phụ thuộc hoàn toàn vào setting ban đầu của user họ sẽ lựa chọn path này và các subdir sẽ tự cố định vào một nơi đó. Các thông tin của GSD đều sai '/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md' không có looping nào nằm trong profile của các agents của GSD cả, Nói chung tất cả bản so sánh với GSD đều sai và hallucination trầm trọng 

## ASSISTANT (turn 21)

# Hivemind Agent System - Redefined

Tôi hiểu rồi. **Agent profiles KHÔNG chứa permissions/tools/skills** - đó là runtime decision của orchestrator. Agent profile chỉ định:

1. **Expert role** - chuyên môn
2. **Artifacts** - documents/code/tests tạo ra
3. **Workflow position** - khi nào được gọi
4. **Naming/pathing/format** - quy cách làm việc

## Core Principle

```
L0 (front-facing) → L2/L3 (hidden specialists)
    ↓                    ↓
Programmatic routing   Expert execution
via tools/commands     via artifacts
```

---

## Agent System by Workflow Pipeline

### Phase 0: Intent Clarification

### 1. `hm-orchestrator`
**Role**: Front-facing coordinator, workflow router
**When**: User initiates work
**Artifacts**:
- `.hivemind/planning/PROJECT.md` (updated)
- Main session with TUI prompt
- Delegation log (`.hivemind/state/delegations.json`)

**Workflow position**: ALWAYS first, routes to L2 specialists

---

### Phase 1: Research

### 2. `hm-researcher`
**Role**: Multi-source investigation, evidence gathering
**When**: After intent clarified, before spec
**Artifacts**:
- `.hivemind/research/RESEARCH.md` (date-stamped)
- Evidence reports with citations
- Gap analysis (`GAPS.md`)

**Workflow position**: After `hm-orchestrator`, before `hm-specifier`

---

### Phase 2: Specification

### 3. `hm-specifier`
**Role**: Requirements authoring, acceptance criteria
**When**: After research complete
**Artifacts**:
- `.hivemind/planning/REQUIREMENTS.md`
- SPEC.md files (date-stamped)
- Acceptance criteria matrices

**Workflow position**: After `hm-researcher`, before `hm-architect`

---

### Phase 3: Architecture

### 4. `hm-architect`
**Role**: Technical design, dependency mapping
**When**: After spec locked
**Artifacts**:
- `.hivemind/planning/architecture/ARCHITECTURE.md`
- Dependency graphs (`.hivemind/planning/graphs/`)
- ADRs (`.hivemind/planning/adr/`)

**Workflow position**: After `hm-specifier`, before `hm-planner`

---

### Phase 4: Planning

### 5. `hm-planner`
**Role**: Task breakdown, phase planning
**When**: After architecture locked
**Artifacts**:
- `.hivemind/planning/phases/M###-PLAN.md`
- Phase manifests (`.planning/phases/M###/*/`)
- Task lists (`.hivemind/planning/task-lists/`)

**Workflow position**: After `hm-architect`, before `hm-builder`

---

### Phase 5: Implementation

### 6. `hm-builder`
**Role**: Code implementation, test-first
**When**: After plan locked
**Artifacts**:
- Source code (`src/**/*.ts`)
- Tests (`tests/**/*.test.ts`)
- Commit messages (via git)

**Workflow position**: After `hm-planner`, before `hm-reviewer`

---

### Phase 6: Quality Gates

### 7. `hm-reviewer`
**Role**: Code review, security, performance
**When**: After implementation, before merge
**Artifacts**:
- `.hivemind/planning/reviews/REVIEW.md`
- Findings with severity (CRITICAL/HIGH/MEDIUM/LOW)
- Fix recommendations

**Workflow position**: After `hm-builder`, before `hm-verifier`

---

### 8. `hm-verifier`
**Role**: Quality gates, validation, verification
**When**: After review pass
**Artifacts**:
- `.hivemind/planning/gates/GATE-M###.md`
- L1-L3 evidence reports
- PASS/FAIL verdicts

**Workflow position**: After `hm-reviewer`, before shipping

---

### Phase 7: Verification & Shipping

### 9. `hm-verifier` (same as #8)
**Role**: Integration verification, regression testing
**When**: After quality gates pass
**Artifacts**:
- Verification reports (`.hivemind/planning/verification/`)
- Regression test results
- Release notes

**Workflow position**: After `hm-verifier`, before shipping

---

### 10. `hm-shipper`
**Role**: Release coordination, changelog, deployment prep
**When**: After all verification pass
**Artifacts**:
- `.hivemind/planning/releases/CHANGELOG.md`
- Release manifests
- Deployment checklists

**Workflow position**: Final L2 agent before L0 routes to next phase

---

## L2 Coordination Agents (Cross-Cutting)

### 11. `hm-coordinator`
**Role**: Multi-agent dispatch, handoff protocols
**When**: When task requires multiple specialists
**Artifacts**:
- `.hivemind/planning/coordination/COORDINATION.md`
- Delegation tree (`.hivemind/state/delegations.json`)
- Handoff logs

**Workflow position**: Called by `hm-orchestrator` when complex work needed

---

### 12. `hm-loop-mananger`
**Role**: Iterative refinement, completion gating
**When**: Task requires multiple iterations
**Artifacts**:
- Loop logs (`.hivemind/planning/loops/`)
- Iteration checkpoints
- Completion evidence

**Workflow position**: Embedded in `hm-builder`/`hm-reviewer` when iterations needed

---

### 13. `hm-ecologist`
**Role**: Feature ecosystem mapping, dependency tracking
**When**: New feature added to existing system
**Artifacts**:
- `.hivemind/planning/ecosystem/ECOSYSTEM.md`
- Dependency DAGs
- Impact assessments

**Workflow position**: After `hm-builder` for new features

---

## L2 Meta-Builder Agents

### 14. `hf-agent-builder`
**Role**: Agent definition creation/repair
**When**: New agent needed or existing agent broken
**Artifacts**:
- Agent YAML frontmatter
- SKILL.md packages
- Command definitions

**Workflow position**: Called by `hm-orchestrator` for meta-work

---

### 15. `hf-skill-builder`
**Role**: Skill package creation/audit
**When**: New skill needed or existing skill broken
**Artifacts**:
- SKILL.md files
- Trigger phrase definitions
- Skill evals

**Workflow position**: Called by `hf-agent-builder` or `hm-orchestrator`

---

## L2 Quality Gate Agents

### 16. `gate-spec-compliance`
**Role**: Spec-to-code traceability, gap detection
**When**: Before quality gates
**Artifacts**:
- `.hivemind/planning/gates/COMPLIANCE.md`
- Gap reports
- Traceability matrices

**Workflow position**: After `hm-builder`, before `gate-evidence-truth`

---

### 17. `gate-evidence-truth`
**Role**: L1-L5 evidence verification
**When**: Before phase completion
**Artifacts**:
- `.hivemind/planning/gates/EVIDENCE.md`
- Verification verdicts (PASS/FAIL)
- Evidence hierarchy reports

**Workflow position**: Final gate before shipping

---

## Summary: 17 Core Agents

| Phase | Agent | Role | Artifacts |
|-------|-------|------|-----------|
| 0 | `hm-orchestrator` | Front-facing router | Main session, delegations.json |
| 1 | `hm-researcher` | Investigation | RESEARCH.md, evidence reports |
| 2 | `hm-specifier` | Requirements authoring | REQUIREMENTS.md, SPEC.md |
| 3 | `hm-architect` | Technical design | ARCHITECTURE.md, ADRs |
| 4 | `hm-planner` | Task breakdown | M###-PLAN.md, manifests |
| 5 | `hm-builder` | Implementation | Source code, tests, commits |
| 6 | `hm-reviewer` | Code review | REVIEW.md, findings |
| 7 | `hm-verifier` | Quality gates | GATE-###.md, evidence reports |
| 8 | `hm-shipper` | Release coordination | CHANGELOG.md, manifests |
| - | `hm-coordinator` | Multi-agent dispatch | COORDINATION.md, delegation tree |
| - | `hm-loop-manager` | Iterative refinement | Loop logs, checkpoints |
| - | `hm-ecologist` | Ecosystem mapping | ECOSYSTEM.md, DAGs |
| - | `hf-agent-builder` | Agent creation | Agent YAML, frontmatter |
| - | `hf-skill-builder` | Skill creation | SKILL.md, triggers |
| - | `gate-spec-compliance` | Spec traceability | COMPLIANCE.md, gaps |
| - | `gate-evidence-truth` | Evidence verification | EVIDENCE.md, verdicts |

---

**Điểm khác biệt:**
- **17 agents** (down from 89) - only essential ones
- **No permissions/tools/skills in YAML** - those are runtime
- **Clear workflow positions** - when each agent gets called
- **Artifact-focused** - what each agent produces
- **L0 = 1 agent** (orchestrator), L2 = 16 specialists
- **Gate agents** merged into workflow (not separate cluster)

Bạn thấy thiếu agent nào hoặc thừa agent nào không?

## USER (turn 1)

**source:** real-human

bỏ hf ra chưa đụng tới nhìn vào đây so sánh với gsd /Users/apple/hivemind-plugin-private/.opencode/agents
/Users/apple/hivemind-plugin-private/.opencode/agents/.gitkeep
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-agent-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-command-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-meta-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-prompter.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-refactorer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-skill-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-tool-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-analyst.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-architect.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-brainstormer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-connector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-purifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-critic.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-curator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-ecologist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-finisher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-general.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-integrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-intent-loop.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-investigator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-mentor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-meta-synthesis.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-operator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-optimizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-persistor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-repackager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-skimmer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-risk-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-scout.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-spec-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-strategist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-technician.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-test-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-validator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-writer.md
/Users/apple/hivemind-plugin-private/.opencode/command
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-capture.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-code-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-config.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-debug.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-explore.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-fast.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-forensics.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-graphify.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-health.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-help.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-import.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-inbox.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-manager.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-context.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-ideate.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-manage.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-workflow.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-progress.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-quick.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-resume-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-settings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ship.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-sketch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spike.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-stats.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-surface.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-thread.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-undo.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workstreams.md '/Users/apple/hivemind-plugin-private/.opencode/gsd-file-manifest.json' /Users/apple/hivemind-plugin-private/.opencode/get-shit-done
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/000-first-time-baseline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/001-legacy-orphan-files.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/active-workstream-store.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/adr-parser.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/artifacts.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/audit.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-command-router-adapter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-sdk-bridge.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/clusters.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/code-review-flags.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-aliases.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-routing-hub.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/commands.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config-schema.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/configuration.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/context-utilization.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/core.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/docs.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/drift.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/fallow-runner.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/frontmatter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gap-checker.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/graphify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gsd2-import.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/install-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-authoring.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-report.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/intel.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/learnings.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/milestone.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-catalog.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phases-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/planning-workspace.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-output.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-pipeline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/project-root.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/prompt-budget.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/review-reviewer-selection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-artifact-layout.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-homes.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-slash.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/security.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/shell-command-projection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/surface.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/template.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/uat.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory-builder.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/worktree-safety.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-defaults.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-schema.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/model-catalog.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/check-latest-version.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/verify-reapply-patches.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/dev.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/verifier.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-frameworks.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/artifact-types.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/autonomous-smart-discuss.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/common-bug-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/continuation-format.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/debugger-philosophy.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/decimal-phase-calculation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/doc-conflict-engine.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/execute-mvp-tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-integration.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-planning-commit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ios-scaffold.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mandatory-initial-read.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profile-resolution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profiles.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mvp-concepts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/phase-argument-parsing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-chunked.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-gap-closure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-graphify-auto-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-human-verify-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-interface-context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-reviews.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-revision.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-source-audit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planning-config.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/project-skills-discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/questioning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-interactivity.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-theme-system.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-tooling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-variant-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-execution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-planning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-verification.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-partner.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-profiling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-overrides.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verify-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/workstream-flag.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/architecture.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/concerns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/conventions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/stack.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/structure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/testing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/ARCHITECTURE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/FEATURES.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/PITFALLS.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/STACK.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/SUMMARY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/AI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/claude-md.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/config.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/continue-here.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/copilot-instructions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/debug-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/DEBUG.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/dev-preferences.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone-archive.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/phase-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/planner-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/README.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/requirements.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/retrospective.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/roadmap.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/SECURITY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/state.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-complex.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-minimal.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-standard.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UAT.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-profile.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-setup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/verification-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/advisor.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/all.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/analyze.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/auto.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/batch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/chain.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/text.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/checkpoint.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/brief.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/full.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/topic.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-todo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/analyze-dependencies.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/check-todos.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/diagnose-issues.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discovery-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/explore.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/fast.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/graduation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/health.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/import.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/inbox.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-workspaces.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/manager.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/node-repair.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/note.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-milestone-gaps.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plant-seed.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/reapply-patches.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/resume-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/scan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/session-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-advanced.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sync-skills.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/thread.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/transition.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/undo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/VERSION  và hiểu sự khác nhau của hivemind và GSD thì các agents trên có đúng chưa sự khác nhau cơ bản là chúng ta có các programatic features và chúng ta có l0 call được các agents ở dưới và l2 và l3 vẫn đang rất lộn xộn mặc dù nó loop cho nhau được nhưng cần programatic routing qua commands và workflow để nó loop theo một governance cho phép nên đừng tạo ra những agent quá vô lý trong khi thiếu hụt những agent mang tính chủ chốt sai artifacts sau này phụ thuộc hoàn toàn vào setting ban đầu của user họ sẽ lựa chọn path này và các subdir sẽ tự cố định vào một nơi đó. Các thông tin của GSD đều sai '/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md' không có looping nào nằm trong profile của các agents của GSD cả, Nói chung tất cả bản so sánh với GSD đều sai và hallucination trầm trọng 

## USER (turn 2)

**source:** real-human

bỏ hf ra chưa đụng tới nhìn vào đây so sánh với gsd /Users/apple/hivemind-plugin-private/.opencode/agents
/Users/apple/hivemind-plugin-private/.opencode/agents/.gitkeep
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-agent-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-command-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-meta-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-prompter.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-refactorer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-skill-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l2-tool-builder.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-analyst.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-architect.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-brainstormer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-connector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-purifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-critic.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-curator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-ecologist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-finisher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-general.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-integrator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-intent-loop.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-investigator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-mentor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-meta-synthesis.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-operator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-optimizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-persistor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-repackager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-prompt-skimmer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-risk-assessor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-scout.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-spec-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-strategist.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-technician.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-test-router.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-validator.md
/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-writer.md
/Users/apple/hivemind-plugin-private/.opencode/command
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-capture.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-code-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-config.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-debug.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-explore.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-fast.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-forensics.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-graphify.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-health.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-help.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-import.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-inbox.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-manager.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-context.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-ideate.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-manage.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-workflow.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-progress.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-quick.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-resume-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-settings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ship.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-sketch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spike.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-stats.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-surface.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-thread.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-undo.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workstreams.md '/Users/apple/hivemind-plugin-private/.opencode/gsd-file-manifest.json' /Users/apple/hivemind-plugin-private/.opencode/get-shit-done
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/000-first-time-baseline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/001-legacy-orphan-files.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/active-workstream-store.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/adr-parser.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/artifacts.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/audit.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-command-router-adapter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/cjs-sdk-bridge.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/clusters.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/code-review-flags.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-aliases.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/command-routing-hub.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/commands.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config-schema.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/config.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/configuration.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/context-utilization.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/core.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/decisions.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/docs.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/drift.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/fallow-runner.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/frontmatter.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gap-checker.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/graphify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/gsd2-import.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/init.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/install-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-authoring.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migration-report.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/installer-migrations.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/intel.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/learnings.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/milestone.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-catalog.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/model-profiles.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase-lifecycle.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phase.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/phases-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/plan-scan.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/planning-workspace.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-output.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/profile-pipeline.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/project-root.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/prompt-budget.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/review-reviewer-selection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/roadmap.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-artifact-layout.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-homes.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/runtime-slash.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/schema-detect.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/secrets.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/security.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/shell-command-projection.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state-document.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/state.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/surface.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/template.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/uat.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/validate.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify-command-router.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/verify.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory-builder.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-inventory.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream-name-policy.generated.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/workstream.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/lib/worktree-safety.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-defaults.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/config-schema.manifest.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/shared/model-catalog.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/check-latest-version.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/verify-reapply-patches.cjs
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/dev.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/contexts/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/few-shot-examples/verifier.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-frameworks.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/artifact-types.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/autonomous-smart-discuss.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/common-bug-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/continuation-format.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/debugger-philosophy.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/decimal-phase-calculation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/doc-conflict-engine.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/execute-mvp-tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-integration.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-planning-commit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ios-scaffold.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mandatory-initial-read.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profile-resolution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/model-profiles.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/mvp-concepts.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/phase-argument-parsing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-chunked.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-gap-closure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-graphify-auto-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-human-verify-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-interface-context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-reviews.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-revision.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-source-audit.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planning-config.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/project-skills-discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/questioning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-interactivity.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-theme-system.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-tooling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/sketch-variant-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-execution.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-planning.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-models-verification.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/thinking-partner.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-profiling.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-overrides.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verification-patterns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/verify-mvp-mode.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/workstream-flag.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/architecture.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/concerns.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/conventions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/stack.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/structure.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/codebase/testing.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/ARCHITECTURE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/FEATURES.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/PITFALLS.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/STACK.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research-project/SUMMARY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/AI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/claude-md.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/config.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/continue-here.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/copilot-instructions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/debug-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/DEBUG.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/dev-preferences.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discovery.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone-archive.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/phase-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/planner-subagent-prompt.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/README.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/requirements.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/research.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/retrospective.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/roadmap.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/SECURITY.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/state.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-complex.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-minimal.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary-standard.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UAT.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/UI-SPEC.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-profile.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-setup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/verification-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/advisor.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/all.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/analyze.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/auto.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/batch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/chain.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/text.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/checkpoint.json
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/brief.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/default.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/full.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help/modes/topic.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-tests.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-todo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/analyze-dependencies.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/check-todos.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review-fix.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/debug.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/diagnose-issues.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discovery-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-power.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/explore.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/fast.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/graduation.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/health.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/import.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/inbox.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-workspaces.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/manager.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/new-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/node-repair.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/note.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-milestone-gaps.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plant-seed.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/reapply-patches.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/resume-project.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/scan.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/session-report.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-advanced.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings-integrations.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/settings.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sketch.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike-wrap-up.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spike.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/sync-skills.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/thread.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/transition.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/undo.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/update.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-phase.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md
/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/VERSION  và hiểu sự khác nhau của hivemind và GSD thì các agents trên có đúng chưa sự khác nhau cơ bản là chúng ta có các programatic features và chúng ta có l0 call được các agents ở dưới và l2 và l3 vẫn đang rất lộn xộn mặc dù nó loop cho nhau được nhưng cần programatic routing qua commands và workflow để nó loop theo một governance cho phép nên đừng tạo ra những agent quá vô lý trong khi thiếu hụt những agent mang tính chủ chốt sai artifacts sau này phụ thuộc hoàn toàn vào setting ban đầu của user họ sẽ lựa chọn path này và các subdir sẽ tự cố định vào một nơi đó. Các thông tin của GSD đều sai '/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md' không có looping nào nằm trong profile của các agents của GSD cả, Nói chung tất cả bản so sánh với GSD đều sai và hallucination trầm trọng 

## ASSISTANT (turn 1)

# Hivemind Agent System - Redefined

Tôi hiểu rồi. **Agent profiles KHÔNG chứa permissions/tools/skills** - đó là runtime decision của orchestrator. Agent profile chỉ định:

1. **Expert role** - chuyên môn
2. **Artifacts** - documents/code/tests tạo ra
3. **Workflow position** - khi nào được gọi
4. **Naming/pathing/format** - quy cách làm việc

## Core Principle

```
L0 (front-facing) → L2/L3 (hidden specialists)
    ↓                    ↓
Programmatic routing   Expert execution
via tools/commands     via artifacts
```

---

## Agent System by Workflow Pipeline

### Phase 0: Intent Clarification

### 1. `hm-orchestrator`
**Role**: Front-facing coordinator, workflow router
**When**: User initiates work
**Artifacts**:
- `.hivemind/planning/PROJECT.md` (updated)
- Main session with TUI prompt
- Delegation log (`.hivemind/state/delegations.json`)

**Workflow position**: ALWAYS first, routes to L2 specialists

---

### Phase 1: Research

### 2. `hm-researcher`
**Role**: Multi-source investigation, evidence gathering
**When**: After intent clarified, before spec
**Artifacts**:
- `.hivemind/research/RESEARCH.md` (date-stamped)
- Evidence reports with citations
- Gap analysis (`GAPS.md`)

**Workflow position**: After `hm-orchestrator`, before `hm-specifier`

---

### Phase 2: Specification

### 3. `hm-specifier`
**Role**: Requirements authoring, acceptance criteria
**When**: After research complete
**Artifacts**:
- `.hivemind/planning/REQUIREMENTS.md`
- SPEC.md files (date-stamped)
- Acceptance criteria matrices

**Workflow position**: After `hm-researcher`, before `hm-architect`

---

### Phase 3: Architecture

### 4. `hm-architect`
**Role**: Technical design, dependency mapping
**When**: After spec locked
**Artifacts**:
- `.hivemind/planning/architecture/ARCHITECTURE.md`
- Dependency graphs (`.hivemind/planning/graphs/`)
- ADRs (`.hivemind/planning/adr/`)

**Workflow position**: After `hm-specifier`, before `hm-planner`

---

### Phase 4: Planning

### 5. `hm-planner`
**Role**: Task breakdown, phase planning
**When**: After architecture locked
**Artifacts**:
- `.hivemind/planning/phases/M###-PLAN.md`
- Phase manifests (`.planning/phases/M###/*/`)
- Task lists (`.hivemind/planning/task-lists/`)

**Workflow position**: After `hm-architect`, before `hm-builder`

---

### Phase 5: Implementation

### 6. `hm-builder`
**Role**: Code implementation, test-first
**When**: After plan locked
**Artifacts**:
- Source code (`src/**/*.ts`)
- Tests (`tests/**/*.test.ts`)
- Commit messages (via git)

**Workflow position**: After `hm-planner`, before `hm-reviewer`

---

### Phase 6: Quality Gates

### 7. `hm-reviewer`
**Role**: Code review, security, performance
**When**: After implementation, before merge
**Artifacts**:
- `.hivemind/planning/reviews/REVIEW.md`
- Findings with severity (CRITICAL/HIGH/MEDIUM/LOW)
- Fix recommendations

**Workflow position**: After `hm-builder`, before `hm-verifier`

---

### 8. `hm-verifier`
**Role**: Quality gates, validation, verification
**When**: After review pass
**Artifacts**:
- `.hivemind/planning/gates/GATE-M###.md`
- L1-L3 evidence reports
- PASS/FAIL verdicts

**Workflow position**: After `hm-reviewer`, before shipping

---

### Phase 7: Verification & Shipping

### 9. `hm-verifier` (same as #8)
**Role**: Integration verification, regression testing
**When**: After quality gates pass
**Artifacts**:
- Verification reports (`.hivemind/planning/verification/`)
- Regression test results
- Release notes

**Workflow position**: After `hm-verifier`, before shipping

---

### 10. `hm-shipper`
**Role**: Release coordination, changelog, deployment prep
**When**: After all verification pass
**Artifacts**:
- `.hivemind/planning/releases/CHANGELOG.md`
- Release manifests
- Deployment checklists

**Workflow position**: Final L2 agent before L0 routes to next phase

---

## L2 Coordination Agents (Cross-Cutting)

### 11. `hm-coordinator`
**Role**: Multi-agent dispatch, handoff protocols
**When**: When task requires multiple specialists
**Artifacts**:
- `.hivemind/planning/coordination/COORDINATION.md`
- Delegation tree (`.hivemind/state/delegations.json`)
- Handoff logs

**Workflow position**: Called by `hm-orchestrator` when complex work needed

---

### 12. `hm-loop-mananger`
**Role**: Iterative refinement, completion gating
**When**: Task requires multiple iterations
**Artifacts**:
- Loop logs (`.hivemind/planning/loops/`)
- Iteration checkpoints
- Completion evidence

**Workflow position**: Embedded in `hm-builder`/`hm-reviewer` when iterations needed

---

### 13. `hm-ecologist`
**Role**: Feature ecosystem mapping, dependency tracking
**When**: New feature added to existing system
**Artifacts**:
- `.hivemind/planning/ecosystem/ECOSYSTEM.md`
- Dependency DAGs
- Impact assessments

**Workflow position**: After `hm-builder` for new features

---

## L2 Meta-Builder Agents

### 14. `hf-agent-builder`
**Role**: Agent definition creation/repair
**When**: New agent needed or existing agent broken
**Artifacts**:
- Agent YAML frontmatter
- SKILL.md packages
- Command definitions

**Workflow position**: Called by `hm-orchestrator` for meta-work

---

### 15. `hf-skill-builder`
**Role**: Skill package creation/audit
**When**: New skill needed or existing skill broken
**Artifacts**:
- SKILL.md files
- Trigger phrase definitions
- Skill evals

**Workflow position**: Called by `hf-agent-builder` or `hm-orchestrator`

---

## L2 Quality Gate Agents

### 16. `gate-spec-compliance`
**Role**: Spec-to-code traceability, gap detection
**When**: Before quality gates
**Artifacts**:
- `.hivemind/planning/gates/COMPLIANCE.md`
- Gap reports
- Traceability matrices

**Workflow position**: After `hm-builder`, before `gate-evidence-truth`

---

### 17. `gate-evidence-truth`
**Role**: L1-L5 evidence verification
**When**: Before phase completion
**Artifacts**:
- `.hivemind/planning/gates/EVIDENCE.md`
- Verification verdicts (PASS/FAIL)
- Evidence hierarchy reports

**Workflow position**: Final gate before shipping

---

## Summary: 17 Core Agents

| Phase | Agent | Role | Artifacts |
|-------|-------|------|-----------|
| 0 | `hm-orchestrator` | Front-facing router | Main session, delegations.json |
| 1 | `hm-researcher` | Investigation | RESEARCH.md, evidence reports |
| 2 | `hm-specifier` | Requirements authoring | REQUIREMENTS.md, SPEC.md |
| 3 | `hm-architect` | Technical design | ARCHITECTURE.md, ADRs |
| 4 | `hm-planner` | Task breakdown | M###-PLAN.md, manifests |
| 5 | `hm-builder` | Implementation | Source code, tests, commits |
| 6 | `hm-reviewer` | Code review | REVIEW.md, findings |
| 7 | `hm-verifier` | Quality gates | GATE-###.md, evidence reports |
| 8 | `hm-shipper` | Release coordination | CHANGELOG.md, manifests |
| - | `hm-coordinator` | Multi-agent dispatch | COORDINATION.md, delegation tree |
| - | `hm-loop-manager` | Iterative refinement | Loop logs, checkpoints |
| - | `hm-ecologist` | Ecosystem mapping | ECOSYSTEM.md, DAGs |
| - | `hf-agent-builder` | Agent creation | Agent YAML, frontmatter |
| - | `hf-skill-builder` | Skill creation | SKILL.md, triggers |
| - | `gate-spec-compliance` | Spec traceability | COMPLIANCE.md, gaps |
| - | `gate-evidence-truth` | Evidence verification | EVIDENCE.md, verdicts |

---

**Điểm khác biệt:**
- **17 agents** (down from 89) - only essential ones
- **No permissions/tools/skills in YAML** - those are runtime
- **Clear workflow positions** - when each agent gets called
- **Artifact-focused** - what each agent produces
- **L0 = 1 agent** (orchestrator), L2 = 16 specialists
- **Gate agents** merged into workflow (not separate cluster)

Bạn thấy thiếu agent nào hoặc thừa agent nào không?
