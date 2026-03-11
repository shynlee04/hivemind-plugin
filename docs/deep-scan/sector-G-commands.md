# Sector G: Commands

> **Deep Scan Mission Report** — Generated from exhaustive analysis of `.opencode/commands/`

## Command Inventory

| Command | Purpose | Agent | Arguments | Auto-Exec |
|---------|---------|-------|-----------|-----------|
| **HIVERD — Research Commands** |||||
| `hiverd-research` | Run structured multi-source research with evidence gathering | hiverd | `$ARGUMENTS` — topic/question | No |
| `hiverd-synthesize` | Combine multiple research reports into unified document | hiverd | `$ARGUMENTS` — doc paths or goal | No |
| `hiverd-analyze` | Deep analysis of codebase/architecture/domain | hiverd | `$ARGUMENTS` — subject to analyze | No |
| `hiverd-compare` | Comparative analysis with weighted scoring matrix | hiverd | `$ARGUMENTS` — candidates to compare | No |
| `hiverd-brainstorm` | Divergent ideation with convergent evaluation | hiverd | `$ARGUMENTS` — problem to brainstorm | No |
| `hiverd-document` | Generate structured documentation from findings | hiverd | `$ARGUMENTS` — topic/source paths | No |
| **HIVEQ — Quality Commands** |||||
| `hiveq-verify` | Verify phase/task completion against acceptance criteria | hiveq | `$ARGUMENTS` — phase/task ID | No |
| `hiveq-regression` | Detect regressions by comparing against baselines | hiveq | `$ARGUMENTS` — scope (full/tests only) | No |
| `hiveq-audit` | Comprehensive audit against quality standards | hiveq | `$ARGUMENTS` — scope (codebase/module) | No |
| `hiveq-compliance` | Check framework convention compliance | hiveq | `$ARGUMENTS` — scope (all/naming only) | No |
| `hiveq-lint` | Static analysis of framework assets | hiveq | `$ARGUMENTS` — target directory | No |
| `hiveq-gate-check` | Run specific quality gate with pass/fail result | hiveq | `$ARGUMENTS` — gate ID or "all" | No |
| **HIVEMIND — Core Governance Commands** |||||
| `hivemind-status` | Show governance state, session health, recent activity | hiveminder | None | No |
| `hivemind-scan` | Brownfield reconnaissance and stabilization | hiveminder | None | No |
| `hivemind-pre-stop` | Validate context integrity before stopping | hiveminder | `--focus=<area>` (optional) | No |
| `hivemind-delegate` | Validate and standardize sub-agent delegation | hiveminder | `--depth`, `--task=<desc>` | No |
| `hivemind-context` | Enforce context-before-actions discipline | hiveminder | `--brownfield`, `--violations` | No |
| `hivemind-compact` | Archive session with context preservation | hiveminder | None | No |
| `hivemind-clarify` | Context clarification for low-confidence scenarios | hiveminder | None | No |
| `hivemind-dashboard` | Launch TUI dashboard for live monitoring | hiveminder | `--lang`, `--refresh` | No |
| `hivemind-lint` | Comprehensive linting and quality validation | hiveminder | None | No |
| `hivemind-debug-trigger` | Trigger debug orchestration session | hiveminder | JSON input (source, errors) | No |
| `hivemind-debug-verify` | Verify debug fix completion | hiveminder | JSON input (fix_summary) | No |
| **HIVEFIVER — Meta-Builder Pipeline Commands** |||||
| `hivefiver` | Root router — classifies intent and routes to stage | hivefiver | `<action>` or free-form intent | **YES** |
| `hivefiver-start` | Classify intent, bootstrap context | hivefiver | `$ARGUMENTS` — user intent | **YES** |
| `hivefiver-discovery` | Guided requirement discovery with adaptive QA | hivefiver | `$ARGUMENTS` — continuation | **YES** |
| `hivefiver-intake` | Gather structured requirements | hivefiver | `$ARGUMENTS` — user input | **YES** |
| `hivefiver-spec` | Distill intake into unambiguous specification | hivefiver | `$ARGUMENTS` — spec refinement | **YES** |
| `hivefiver-architect` | Design asset topology and dependency graph | hivefiver | `$ARGUMENTS` — architecture input | **YES** |
| `hivefiver-build` | Create/modify framework assets | hivefiver | `$ARGUMENTS` — build params | **YES** |
| `hivefiver-audit` | System-wide health check | hivefiver | `$ARGUMENTS` — scope | **YES** |
| `hivefiver-doctor` | Diagnose and repair broken chains | hivefiver | `$ARGUMENTS` — problem desc | **YES** |
| `hivefiver-continue` | Spawn fresh session that auto-continues pipeline | hivefiver | `--exec`, `--prompt`, `--json` | **YES** |
| `hivefiver-plan-spawn` | Materialize runtime plan nodes | hivefiver | `<PLAN_ID> <scope> "<title>"` | **YES** |

---

## Hivefiver Pipeline

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HIVEFIVER META-BUILDER PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌───────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐ │
│  │  START  │───▶│ DISCOVERY │───▶│ INTAKE  │───▶│   SPEC   │───▶│ARCHITECT│ │
│  └─────────┘    └───────────┘    └─────────┘    └──────────┘    └─────────┘ │
│       │              │               │               │               │       │
│       │         [brainstorm]    [9 inputs]     [criteria]      [topology]   │
│       │         [QA clarify]    [validate]     [anti-pats]     [deps]       │
│       │                                                          │          │
│       │                                                          ▼          │
│       │                                                    ┌─────────┐     │
│       │                                                    │  BUILD  │     │
│       │                                                    └─────────┘     │
│       │                                                         │          │
│       │                                                    [create]        │
│       │                                                    [verify]        │
│       │                                                    [export]        │
│       │                                                         │          │
│       ▼                                                         ▼          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         PARALLEL PATHS                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                          ││
│  │   AUDIT ◀───────────── [standalone or post-build]                       ││
│  │     │                                                                    ││
│  │     └──▶ DOCTOR ◀────── [if critical findings]                          ││
│  │              │                                                           ││
│  │              └──▶ [fix] ──▶ [verify] ──▶ [recover]                      ││
│  │                                                                          ││
│  │   CONTINUE ◀────────── [session transfer / fresh context]               ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage Descriptions

| Stage | Purpose | Input | Output | Gate |
|-------|---------|-------|--------|------|
| **start** | Classify user intent, bootstrap pipeline | Free-form user input | `classified_intent`, `pipeline_id` | Gate check |
| **discovery** | Guided QA to clarify requirements | User answers | 8 structured fields | Ambiguity gate (0 critical) |
| **intake** | Gather 9 structured requirements | Discovery output | JSON intake summary | Promotion gate |
| **spec** | Distill unambiguous specification | Intake summary | Formal spec with acceptance criteria | Gate 1 (no TBD) |
| **architect** | Design asset topology | Approved spec | Dependency graph, build order | Gate 2 (acyclic deps) |
| **build** | Create/modify framework assets | Architecture plan | Asset files, verification evidence | Gate 3 (contract validation) |
| **audit** | System-wide health scan | Scope (optional) | Severity-ranked findings | Read-only |
| **doctor** | Diagnose and repair | Audit findings or user report | Fixes applied, verification | Gate 3, Gate 4 |
| **continue** | Session handoff | Current pipeline state | Fresh session command | Pipeline must be active |

### Intent-to-Pipeline Mapping

| Classified Intent | Pipeline ID | Sequence |
|-------------------|-------------|----------|
| `build_new` | full_build | start → discovery → intake → spec → architect → build |
| `extend` | full_build | start → discovery → intake → spec → architect → build |
| `fix_broken` | doctor_fix | start → doctor |
| `audit_health` | audit_only | start → audit |
| `improve` | audit_then_build | start → audit → intake → spec → architect → build |
| `learn` | guided_onboard | start → discovery |
| `custom/unknown` | adaptive | start → discovery |

---

## Hiverd Research Commands

### Command Overview

The **hiverd** agent is the research specialist. All hiverd commands share:
- **Agent**: `hiverd`
- **MCP Tool Priority**: DeepWiki > Context7 > Tavily > Google
- **Output Location**: `docs/research/`

### Process Comparison

| Command | Steps | Output Template |
|---------|-------|-----------------|
| `hiverd-research` | Frame → Discover → Evaluate → Gather → Synthesize → Report | `research-report-template.md` |
| `hiverd-synthesize` | Index → Extract → Resolve → Fill → Produce | Unified synthesis report |
| `hiverd-analyze` | Define scope → Investigate → Classify → Cross-ref → Report | Structured analysis report |
| `hiverd-compare` | Define criteria → Investigate → Score → Sensitivity → Recommend | `analysis-matrix-template.md` |
| `hiverd-brainstorm` | Define problem → Diverge → Categorize → Converge → Select | `brainstorm-session-template.md` |
| `hiverd-document` | Assess → Define structure → Draft → Cross-ref → Produce | Structured doc in `docs/` |

### MCP Tool Integration

```
hiverd-research MCP Priority:
1. DeepWiki + Repomix (repo-specific knowledge)
2. Context7 (library documentation)
3. Tavily search + extract (web sources)
4. Google search (broad discovery)
```

---

## Hiveq Quality Commands

### Command Overview

The **hiveq** agent is the quality assurance specialist. All hiveq commands share:
- **Agent**: `hiveq`
- **Enforcement**: Pass/Fail with evidence

### Quality Gates Available

| Gate ID | Command | Pass Condition |
|---------|---------|----------------|
| `unit-tests` | `npm test` | 0 failures |
| `type-check` | `npx tsc --noEmit` | 0 errors |
| `release-safety` | `npm run guard:public` | Exit code 0 |
| `loc-check` | `wc -l` on target files | All ≤550 LOC |
| `cqrs-check` | `grep -r "stateManager.save" src/hooks/` | 0 matches |

### Compliance Rules Checked

1. **Agent names** — lowercase, no hyphens, file is `{name}.md`
2. **Command prefix** — matches owning agent
3. **Workflow prefix** — matches owning agent
4. **Skill directories** — kebab-case, contain `SKILL.md`
5. **No date-stamps** — filenames never contain dates
6. **Root↔.opencode sync** — content matches
7. **No orphan assets** — every asset referenced

### Verification Protocol (Goal-Backward Analysis)

```
hiveq-verify Process:
1. Extract criteria from planning artifact
2. Collect evidence (run commands, read files, grep)
3. Goal-backward: expected → actual → verdict
4. Produce PASS/FAIL per criterion
```

---

## Hivemind Core Commands

### Command Overview

The **hiveminder** agent is the governance specialist. Commands manage session lifecycle, context integrity, and delegation.

### Session Lifecycle Commands

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│   │     SCAN     │────▶│ DECLARE_INTENT │───▶│ MAP_CONTEXT  │       │
│   │  (brownfield)│     │  (trajectory)  │     │  (tactic)    │       │
│   └──────────────┘     └──────────────┘     └──────────────┘       │
│                                                     │               │
│                                                     ▼               │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│   │   COMPACT    │◀────│   PRE-STOP   │◀────│  EXECUTION   │       │
│   │  (archive)   │     │  (validate)  │     │   (work)     │       │
│   └──────────────┘     └──────────────┘     └──────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Pre-Stop Protocol (Critical)

The `hivemind-pre-stop` command is **MANDATORY** before session ends:

| Phase | Actions |
|-------|---------|
| **Phase 1: Context Validation** | Check trajectory completion, chain integrity, pending failures |
| **Phase 2: Intelligence Export** | export_cycle, save_mem, update anchors |
| **Phase 3: Verification** | Type check, tests, lint, git status |
| **Phase 4: Session Compact** | compact_session (REQUIRED) |

### Delegation Validation

`hivemind-delegate` enforces:
- Context investigation before Task() call
- Precise task descriptions with file paths
- Delegation depth warning (depth 2+ = danger)
- Parallel vs sequential decision
- Post-delegation verification

### Debug Orchestration

```
hivemind-debug-trigger → [creates session] → systematic-debugging skill
                                              ↓
hivemind-debug-verify ← [after fix] ← hivehealer fixes
```

---

## Command Chaining Patterns

### Explicit Chains

| Command | Chains To |
|---------|-----------|
| `hivefiver` | Routes to all `hivefiver-*` commands |
| `hivefiver-start` | → `/hivefiver-discovery` |
| `hivefiver-discovery` | → `/hivefiver-intake` |
| `hivefiver-intake` | → `/hivefiver-spec` |
| `hivefiver-spec` | → `/hivefiver-architect` |
| `hivefiver-architect` | → `/hivefiver-build` |
| `hivefiver-audit` | → `/hivefiver-doctor` (if critical) |
| `hivefiver-recover` | → `/hivefiver-doctor` |
| `hivemind-scan` | → `declare_intent` → `map_context` |
| `hivemind-lint` | → `hivemind-pre-stop` |

### Implicit Dependencies

| Command | Requires |
|---------|----------|
| `hivefiver-spec` | Discovery completed (gate check) |
| `hivefiver-architect` | Spec approved (gate check) |
| `hivefiver-build` | Architecture approved (gate check) |
| `hivefiver-continue` | Pipeline active (state check) |

---

## Auto-Execution vs Manual

### Auto-Executed Commands (Enforcement Blocks)

All `hivefiver-*` commands have `<enforcement>` blocks with auto-executed bash scripts:

```yaml
# Example from hivefiver-start.md
<enforcement>
Gate check: !`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh start .`
Pipeline state: !`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`
Intent classifier: !`bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"`
User profile: !`bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"`
Runtime gate pre-turn: !`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`
MUST pack: !`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh start "$ARGUMENTS" .`
</enforcement>
```

### Manual Commands (No Enforcement Blocks)

All `hiverd-*`, `hiveq-*`, and `hivemind-*` commands lack enforcement blocks. They:
- Require explicit user invocation
- Have no auto-executed pre-turn scripts
- Return structured output without background automation

---

## Context Injection

### Enforcement Block Outputs

| Script | Injects |
|--------|---------|
| `gate-check.sh` | `allowed: true/false`, `reason` |
| `state-update.sh read` | Full STATE.md as context |
| `classify-intent.sh` | `intent`, `confidence`, `next_command` |
| `guided-discovery.sh` | `language`, `maturity`, `input_band`, `guidance` |
| `runtime-gate.sh pre-turn` | Quality baseline checks |
| `hivefiver-must-pack.sh` | Unified MUST obligations payload |
| `pipeline-orchestrator.sh` | Pipeline sequence and status |

### Context Files Referenced

| File | Commands That Read It |
|------|----------------------|
| `STATE.md` | All hivefiver-* commands |
| `PLAN-MATERIALIZE-CONTRACT-*.md` | hivefiver-plan-spawn |
| `vi-en-terminology.md` | hivefiver-discovery (bilingual) |
| `qa-discovery-playbook.md` | hivefiver-discovery |
| `.hivemind/config.json` | hivemind-status, hivemind-clarify |

---

## Cross-Sector Dependencies

### Agent Dependencies

| Command Category | Owning Agent | Agent File |
|------------------|--------------|------------|
| hiverd-* | hiverd | `.opencode/agents/hiverd.md` |
| hiveq-* | hiveq | `.opencode/agents/hiveq.md` |
| hivemind-* | hiveminder | `.opencode/agents/hiveminder.md` |
| hivefiver-* | hivefiver | `.opencode/agents/hivefiver.md` |

### Skill Dependencies

| Command | Loads Skills |
|---------|--------------|
| `hivemind-delegate` | `delegation-intelligence`, `task-coordination-strategies` |
| `hivemind-context` | `context-integrity`, `evidence-discipline` |
| `hivemind-lint` | `verification-before-completion` |
| `hivefiver-discovery` | `hivefiver-guided-discovery` |

### Script Dependencies

All hivefiver-* commands depend on:
- `.opencode/skills/hivefiver-coordination/scripts/`
- `.opencode/skills/hivefiver-mode/scripts/`

---

## Knowledge Gaps

### Missing Files

1. **`hivemind-orchestrate.md`** — Listed in mission but file not found. May have been renamed or deleted.

### Unclear Areas

1. **Subagent Type Mapping**: The commands reference `subagent_type: "hivemaker" | "hivexplorer" | "hivehealer"` but these agents are not in the commands directory. Need to check `.opencode/agents/`.

2. **Template References**: Commands reference templates that may or may not exist:
   - `research-report-template.md`
   - `analysis-matrix-template.md`
   - `brainstorm-session-template.md`
   - `verification-report-template.md`
   - `audit-report-template.md`

3. **G-01 through G-10 Anti-Patterns**: Referenced in hivefiver-spec, hivefiver-architect, hivefiver-audit, hivefiver-doctor. Need to find the canonical definition.

4. **Dead Reference Scan Pattern**: The grep pattern in hivefiver-doctor references deleted assets:
   - `meta-builder-governance`
   - `hivefiver-persona-routing`
   - `hivefiver-spec-distillation`
   - `hivefiver-specforge`
   - `hivefiver-skillforge`
   - `hivefiver-gsd-bridge`
   - `hivefiver-ralph-bridge`
   - `hivefiver-gsd-compat`
   
   These appear to be historical assets that were removed but references may persist.

5. **Schema Guard Scripts**: `schema-guard.sh snapshot` and `schema-guard.sh verify` are referenced but script location unclear.

### Questions for Further Investigation

1. What is the relationship between `hivefiver-plan-spawn` and the planning templates?
2. How does `hivemind-debug-trigger` integrate with external debugging tools?
3. What is the full list of G-anti-patterns (G-01 through G-10)?
4. Where are the subagent definitions for hivemaker, hivexplorer, hivehealer?

---

## Appendix: Enforcement Block Anatomy

Every hivefiver-* command has this enforcement structure:

```yaml
<enforcement>
  # Gate check — blocks if prerequisites not met
  !`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh [stage] .`
  
  # Pipeline state — reads STATE.md
  !`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`
  
  # Stage-specific automation
  !`bash .opencode/skills/hivefiver-mode/scripts/[script].sh "$ARGUMENTS"`
  
  # Runtime baseline — MANDATORY
  !`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`
  
  # MUST obligations — unified payload
  !`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh [stage] "$ARGUMENTS" .`
  
  ⛔ IF gate check shows "allowed": false — STOP. DO NOT proceed.
</enforcement>
```

---

**End of Sector G Deep Scan Report**
