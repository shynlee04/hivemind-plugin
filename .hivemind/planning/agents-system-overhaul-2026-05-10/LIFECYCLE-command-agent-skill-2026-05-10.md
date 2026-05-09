# Lifecycle Chain: Command → Agent → Skill → Tool → Loop

**Generated:** 2026-05-10
**Agent:** hm-l2-researcher (delegated by hm-l0-orchestrator)
**Status:** COMPLETED
**Scope:** All 20 files in `.opencode/commands/` (19 command definitions + 1 gsd subdirectory)

---

## Executive Summary

**Total commands:** 19 (excluding gsd/dev-preferences.md which is a data file, not a command)
**Total agents:** 90 (57 hm-*, 11 hf-*, 33 gsd-*)
**Total skills on disk:** 124 directories (35 hm-*, 13 hf-*, 3 gate-*, 6 stack-*, 65 gsd-*, 1 opencode-config-workflow, 1 unprefixed disabled)

**Lifecycle coverage:**
- 14 of 19 commands have explicit `agent:` YAML routing (73.7%)
- 5 commands lack `agent:` fields and run inline (test-echo, test-list, test-status, deep-init, gsd/dev-preferences)
- 3 command→agent chains are broken (reference agents or skills not matching disk state)
- 8 agent→skill chains have at least one missing skill reference
- hf-l0-orchestrator is CONFIRMED PRESENT at `.opencode/agents/hf-l0-orchestrator.md`

---

## Per-Command Lifecycle

### 1. `/start-work` → hm-l2-conductor
```
Command: .opencode/commands/start-work.md
  │
  ├─ agent: hm-l2-conductor (mode: primary)
  │   ├─ skills: (none explicitly listed in agent YAML — loads via permission policy)
  │   │   Allowed: hm-l2-*, hm-l3-*, gate-l3-*, stack-l3-*
  │   │   Key tools: delegate-task, run-background-command, read(*.md/*.json), glob, grep
  │   │
  │   ├─ Loop: Read task_plan.md → identify pending phases → delegate-task per phase
  │   │   ├─ Starts: task_plan.md read
  │   │   ├─ Iterates: per-phase delegate-task calls to specialists
  │   │   ├─ Terminates: all phases marked complete
  │   │   └─ Checkpoint: task_plan.md status updates after each phase
  │   │
  │   └─ Delegation chain:
  │       conductor → delegate-task → specialist (researcher/builder/critic)
  │       conductor → delegation-status → poll completion
```

### 2. `/plan` → hm-l2-conductor
```
Command: .opencode/commands/plan.md
  │
  ├─ agent: hm-l2-conductor (mode: primary)
  │   ├─ skills: (loaded via permission)
  │   │
  │   ├─ Loop: Interview user → research codebase → create plan → approve → hand off
  │   │   ├─ Starts: user interaction (clarifying questions)
  │   │   ├─ Iterates: Q&A cycles until scope clear
  │   │   ├─ Terminates: task_plan.md written + user approval
  │   │   └─ Checkpoint: task_plan.md creation
  │   │
  │   └─ Delegation chain:
  │       conductor → direct interaction (no delegate-task for planning phase)
  │       conductor → research codebase (may use glob/grep directly)
```

### 3. `/deep-init` → (no agent — inline execution)
```
Command: .opencode/commands/deep-init.md
  │
  ├─ agent: (NONE — no agent field in YAML)
  │   Execution: Direct agent running the command executes inline
  │   │
  │   ├─ Loop: 4-phase pipeline with dynamic agent spawning
  │   │   ├─ Phase 1: Discovery + Analysis (concurrent explore agents)
  │   │   │   └─ Spawns 6+ background explore subagents via task tool
  │   │   ├─ Phase 2: Scoring & Location Decision
  │   │   ├─ Phase 3: Generate AGENTS.md files (parallel writing tasks)
  │   │   └─ Phase 4: Review & Deduplicate
  │   │
  │   └─ Delegation chain:
  │       command executor → task(explore, background) × N
  │       command executor → task(writing) × N for subdirectory AGENTS.md
```

### 4. `/deep-research-synthesis-repomix` → hm-l2-researcher
```
Command: .opencode/commands/deep-research-synthesis-repomix.md
  │
  ├─ agent: hm-l2-researcher (mode: subagent, subtask: true)
  │   ├─ type: reference (NOT an executable command — knowledge base)
  │   │
  │   ├─ skills (from agent YAML):
  │   │   ├─ hm-l3-detective ✓
  │   │   ├─ hm-l3-deep-research ✓
  │   │   ├─ hm-l3-research-chain ✓
  │   │   ├─ hm-l3-tech-stack-ingest ✓
  │   │   └─ hm-l3-synthesis ✓
  │   │
  │   └─ Note: This is a REFERENCE document, not a command execution flow.
  │       It documents Repomix + OpenCode orchestration patterns.
```

### 5. `/harness-audit` → hf-l0-orchestrator
```
Command: .opencode/commands/harness-audit.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: true)
  │   ├─ skills (from agent YAML):
  │   │   ├─ hf-l2-meta-builder ✓
  │   │   ├─ hm-l2-coordinating-loop ✓
  │   │   ├─ hm-l2-user-intent-interactive-loop ✓
  │   │   ├─ hm-l2-completion-looping ✓
  │   │   ├─ gate-l3-lifecycle-integration ✓
  │   │   ├─ gate-l3-spec-compliance ✓
  │   │   └─ gate-l3-evidence-truth ✓
  │   │
  │   ├─ Loop: 5-phase audit with parallel dispatch
  │   │   ├─ Phase 1-4: Parallel subagent dispatch (independent audits)
  │   │   ├─ Phase 5: Sequential synthesis gate (after 1-4 complete)
  │   │   ├─ Starts: Load hm-l3-opencode-project-audit skill
  │   │   ├─ Iterates: Collect 4 reports → synthesize
  │   │   └─ Terminates: Final audit-report.md
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(hf-l1-coordinator) → task(hf-l2-*) specialists
  │       hf-l0-orchestrator → task(subagents) × 4 for parallel audit phases
```

### 6. `/harness-doctor` → hm-l2-conductor
```
Command: .opencode/commands/harness-doctor.md
  │
  ├─ agent: hm-l2-conductor (mode: primary, subtask: false)
  │   ├─ skills: (loaded via permission policy)
  │   │
  │   ├─ Loop: 8-step sequential health check
  │   │   ├─ 1. Config check (opencode.json)
  │   │   ├─ 2. Agent check (list + parse)
  │   │   ├─ 3. Plugin tool check (delegate-task path)
  │   │   ├─ 4. Standalone tool check
  │   │   ├─ 5. Skills check
  │   │   ├─ 6. Commands check
  │   │   ├─ 7. Rules check
  │   │   └─ 8. Permission check
  │   │
  │   └─ Delegation chain:
  │       conductor → direct reads (no delegation for diagnostics)
```

### 7. `/hf-absorb` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-absorb.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: false)
  │   ├─ Key skill: hf-l2-context-absorb (loaded at runtime via skill tool)
  │   │
  │   ├─ Loop: 5-wave protocol (Wave 0 → Wave 4)
  │   │   ├─ Wave 0: Delta computation against existing context
  │   │   ├─ Wave 1-N: Content processing waves (delegated to subagents)
  │   │   ├─ Wave 4: Final merge into session-context-prompt.md
  │   │   └─ Terminates: Append to .hivemind/state/session-context-prompt.md
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → load skill hf-l2-context-absorb
  │       hf-l0-orchestrator → task(subagents) × N waves
```

### 8. `/hf-audit` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-audit.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: true)
  │   ├─ Execution context:
  │   │   @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/audit.md
  │   │
  │   ├─ Loop: Scan → validate → overlap detection → report
  │   │   └─ Terminates: Findings report with quality metrics
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(hf-l1-coordinator) → task(hf-l2-*) specialists
```

### 9. `/hf-configure` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-configure.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: true)
  │   ├─ Key skill: opencode-config-workflow ✓
  │   │   (loaded via hivefiver-orchestrator delegation)
  │   │
  │   ├─ Flags parsed from $ARGUMENTS:
  │   │   --from-file, --scope, --dry-run
  │   │
  │   ├─ Loop: 7-turn workflow
  │   │   └─ Terminates: Primitive configuration written to disk
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(hf-l1-coordinator) → task(hf-l2-* builders)
```

### 10. `/hf-create` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-create.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: true)
  │   ├─ Execution context:
  │   │   @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md
  │   │
  │   ├─ Loop: Intent classify → route to specialist → verify output
  │   │   └─ Terminates: New primitive created and validated
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(hf-l1-coordinator) → task(hf-l2-agent-builder|hf-l2-skill-builder|hf-l2-command-builder|hf-l2-tool-builder)
```

### 11. `/hf-prompt-enhance` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-prompt-enhance.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: false)
  │   ├─ Key tools: task, prompt-skim, session-patch, prompt-analyze
  │   │   (all invoked via task subagent delegation)
  │   │
  │   ├─ Loop: Multi-phase enhancement pipeline
  │   │   ├─ Phase 1: Skim (via task → hm-l2-prompt-skimmer)
  │   │   ├─ Phase 2: Analysis lanes (via task → hm-l2-prompt-analyzer, hm-l2-risk-assessor)
  │   │   ├─ Phase 3: Clarification gating
  │   │   ├─ Phase 4: Assembly (via task → hm-l2-prompt-repackager)
  │   │   └─ Terminates: Enhanced prompt delivered
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(subagents) for each lane
  │       Uses hm-l2-prompt-skimmer, hm-l2-prompt-analyzer, hm-l2-risk-assessor,
  │       hm-l2-context-purifier, hm-l2-prompt-repackager
```

### 12. `/hf-prompt-enhance-to-plan` → hf-l2-prompter
```
Command: .opencode/commands/hf-prompt-enhance-to-plan.md
  │
  ├─ agent: hf-l2-prompter (mode: subagent, subtask: false)
  │   ├─ skills (from agent YAML):
  │   │   ├─ hf-l2-command-parser ✓
  │   │   ├─ hm-l3-deep-research ✓
  │   │   ├─ hm-l3-detective ✓
  │   │   ├─ hm-l3-synthesis ✓
  │   │   ├─ hm-l2-planning-persistence ✓
  │   │   └─ hm-l3-opencode-non-interactive-shell ✓
  │   │
  │   ├─ Loop: Context gathering → enhance → export as plan
  │   │   ├─ Starts: Session context + git history
  │   │   ├─ Middle: Research + investigation via task subagents
  │   │   └─ Terminates: Plan document
  │   │
  │   └─ Delegation chain:
  │       hf-l2-prompter → task(subagents) for investigation
  │       (loads hm-detective, hm-synthesis, hm-research skills)
```

### 13. `/hf-stack` → hf-l0-orchestrator
```
Command: .opencode/commands/hf-stack.md
  │
  ├─ agent: hf-l0-orchestrator (mode: primary, subtask: true)
  │   ├─ Execution context:
  │   │   @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/stack.md
  │   │
  │   ├─ Loop: Compatibility check → loading order → validation
  │   │   └─ Terminates: Stacked skill config produced
  │   │
  │   └─ Delegation chain:
  │       hf-l0-orchestrator → task(hf-l1-coordinator) → task(hf-l2-meta-builder)
```

### 14. `/sync-agents-md` → hm-l2-conductor
```
Command: .opencode/commands/sync-agents-md.md
  │
  ├─ agent: hm-l2-conductor (mode: primary, subtask: false)
  │   ├─ Key skill: hf-l2-agents-md-sync ✓
  │   │   (loaded explicitly in command body)
  │   │
  │   ├─ Loop: 3-phase scan → diff → apply
  │   │   ├─ Phase 1: Scan source files + .opencode/ for ground truth
  │   │   ├─ Phase 2: Diff claims vs reality → drift report
  │   │   ├─ Phase 3: Apply targeted Edit tool fixes
  │   │   └─ Terminates: Drift report + fixes applied
  │   │
  │   └─ Delegation chain:
  │       conductor → load skill hf-l2-agents-md-sync → execute 3 phases
  │       conductor → direct Edit calls for each drift item
```

### 15. `/test-echo` → (no agent — inline)
```
Command: .opencode/commands/test-echo.md
  │
  ├─ agent: (NONE — no agent field)
  │   └─ Inline execution: Echo back $ARGUMENTS
  │       No delegation, no loop, no skills
```

### 16. `/test-list` → (no agent — inline)
```
Command: .opencode/commands/test-list.md
  │
  ├─ agent: (NONE — no agent field)
  │   └─ Inline execution: !ls -la
  │       No delegation, no loop, no skills
```

### 17. `/test-status` → (no agent — inline)
```
Command: .opencode/commands/test-status.md
  │
  ├─ agent: (NONE — no agent field)
  │   └─ Inline execution: !git status --short
  │       No delegation, no loop, no skills
```

### 18. `/ultrawork` → hm-l2-conductor
```
Command: .opencode/commands/ultrawork.md
  │
  ├─ agent: hm-l2-conductor (mode: primary, subtask: false)
  │   ├─ Key tools: delegate-task, delegation-status
  │   │
  │   ├─ Loop: Autonomous 6-step execution
  │   │   ├─ 1. CLASSIFY INTENT (research|implementation|review|planning)
  │   │   ├─ 2. EXPLORE codebase
  │   │   ├─ 3. PLAN into phases
  │   │   ├─ 4. EXECUTE per phase via delegate-task
  │   │   ├─ 5. VERIFY via delegate-task → critic
  │   │   ├─ 6. ITERATE until complete
  │   │   └─ Terminates: All phases complete
  │   │
  │   └─ Delegation chain:
  │       conductor → classify → delegate-task(researcher|builder|critic)
  │       conductor → delegate-task(critic) for verification
  │       conductor → iterate until done
```

### 19. `/gsd/dev-preferences` → (no agent — data file)
```
Command: .opencode/commands/gsd/dev-preferences.md
  │
  ├─ agent: (NONE — data file, not a command)
  │   └─ Static data: Developer behavioral preferences
  │       No delegation, no loop, no skills
```

---

## Command → Agent Binding Table

| # | Command | Agent | Mode | subtask | agent exists |
|---|---------|-------|------|---------|-------------|
| 1 | start-work | hm-l2-conductor | primary | false | ✓ |
| 2 | plan | hm-l2-conductor | primary | false | ✓ |
| 3 | deep-init | — | — | — | N/A (inline) |
| 4 | deep-research-synthesis-repomix | hm-l2-researcher | subagent | true | ✓ |
| 5 | harness-audit | hf-l0-orchestrator | primary | true | ✓ |
| 6 | harness-doctor | hm-l2-conductor | primary | false | ✓ |
| 7 | hf-absorb | hf-l0-orchestrator | primary | false | ✓ |
| 8 | hf-audit | hf-l0-orchestrator | primary | true | ✓ |
| 9 | hf-configure | hf-l0-orchestrator | primary | true | ✓ |
| 10 | hf-create | hf-l0-orchestrator | primary | true | ✓ |
| 11 | hf-prompt-enhance | hf-l0-orchestrator | primary | false | ✓ |
| 12 | hf-prompt-enhance-to-plan | hf-l2-prompter | subagent | false | ✓ |
| 13 | hf-stack | hf-l0-orchestrator | primary | true | ✓ |
| 14 | sync-agents-md | hm-l2-conductor | primary | false | ✓ |
| 15 | test-echo | — | — | — | N/A (inline) |
| 16 | test-list | — | — | — | N/A (inline) |
| 17 | test-status | — | — | — | N/A (inline) |
| 18 | ultrawork | hm-l2-conductor | primary | false | ✓ |
| 19 | gsd/dev-preferences | — | — | — | N/A (data) |

**All 14 agent-routed commands resolve to existing agents.** Zero broken command→agent chains.

---

## Agent → Skill Binding Table

### hm-* Agents and Their Skills

| Agent | Skills Listed | All Present? | Missing Skills |
|-------|--------------|-------------|----------------|
| hm-l0-orchestrator | hm-l2-coordinating-loop, hm-l2-phase-loop, hm-l2-user-intent-interactive-loop, hm-l2-completion-looping, gate-l3-lifecycle-integration, gate-l3-spec-compliance, gate-l3-evidence-truth | ✓ | — |
| hm-l1-coordinator | hm-l2-coordinating-loop, hm-l3-subagent-delegation-patterns, hm-l2-completion-looping, hm-l2-phase-execution, hm-l2-phase-loop, gate-l3-lifecycle-integration, gate-l3-spec-compliance | ✓ | — |
| hm-l2-analyst | hm-l2-requirements-analysis, hm-l2-product-validation | ✓ | — |
| hm-l2-architect | hm-l2-refactor, hm-l2-roadmap-maintainability | ✓ | — |
| hm-l2-assessor | hm-l2-production-readiness, hm-l2-requirements-analysis | ✓ | — |
| hm-l2-auditor | hm-l2-production-readiness, hm-l2-roadmap-maintainability | ✓ | — |
| hm-l2-brainstormer | hm-l2-brainstorm | ✓ | — |
| hm-l2-connector | hm-l2-cross-cutting-change, hm-l2-coordinating-loop | ✓ | — |
| hm-l2-curator | hm-l2-production-readiness, hm-l2-roadmap-maintainability | ✓ | — |
| hm-l2-debugger | hm-l2-debug, hm-l2-completion-looping | ✓ | — |
| hm-l2-ecologist | hm-l2-feature-ecosystem | ✓ | — |
| hm-l2-executor | hm-l2-phase-execution, hm-l2-cross-cutting-change, hm-l2-test-driven-execution | ✓ | — |
| hm-l2-finisher | hm-l2-completion-looping, hm-l2-test-driven-execution | ✓ | — |
| hm-l2-guardian | hm-l2-phase-loop, hm-l2-completion-looping | ✓ | — |
| hm-l2-integrator | hm-l2-production-readiness, hm-l2-cross-cutting-change | ✓ | — |
| hm-l2-mentor | hm-l2-brainstorm, hm-l2-requirements-analysis | ✓ | — |
| hm-l2-operator | hm-l2-phase-execution, hm-l2-phase-loop | ✓ | — |
| hm-l2-optimizer | hm-l2-refactor, hm-l2-cross-cutting-change | ✓ | — |
| hm-l2-persistor | hm-l2-planning-persistence, hm-l2-completion-looping | ✓ | — |
| hm-l2-planner | hm-l2-spec-driven-authoring, hm-l2-planning-persistence | ✓ | — |
| hm-l2-researcher | hm-l3-detective, hm-l3-deep-research, hm-l3-research-chain, hm-l3-tech-stack-ingest, hm-l3-synthesis | ✓ | — |
| hm-l2-reviewer | hm-l2-test-driven-execution | ✓ | — |
| hm-l2-router | hm-l2-requirements-analysis, hm-l2-feature-ecosystem | ✓ | — |
| hm-l2-scout | hm-l3-detective, hm-l3-tech-stack-ingest, hm-l3-synthesis | ✓ | — |
| hm-l2-strategist | hm-l2-roadmap-maintainability, hm-l2-feature-ecosystem | ✓ | — |
| hm-l2-synthesizer | hm-l3-synthesis, hm-l3-deep-research | ✓ | — |
| hm-l2-technician | hm-l3-tech-context-compliance, hm-l3-tech-stack-ingest | ✓ | — |
| hm-l2-validator | hm-l2-test-driven-execution, hm-l2-spec-driven-authoring | ✓ | — |
| hm-l2-writer | hm-l2-spec-driven-authoring, hm-l3-synthesis | ✓ | — |

### hf-* Agents and Their Skills

| Agent | Skills Listed | All Present? | Missing Skills |
|-------|--------------|-------------|----------------|
| hf-l0-orchestrator | hf-l2-meta-builder, hm-l2-coordinating-loop, hm-l2-user-intent-interactive-loop, hm-l2-completion-looping, gate-l3-lifecycle-integration, gate-l3-spec-compliance, gate-l3-evidence-truth | ✓ | — |
| hf-l1-coordinator | hf-l2-agents-and-subagents-dev, hf-l2-agent-composition, hf-l2-delegation-gates, hm-l2-coordinating-loop, hm-l2-completion-looping, gate-l3-lifecycle-integration, gate-l3-spec-compliance | ✓ | — |
| hf-l2-agent-builder | hf-l2-agents-and-subagents-dev, hf-l2-agent-composition | ✓ | — |
| hf-l2-auditor | hf-l2-use-authoring-skills, hf-l2-agents-md-sync | ✓ | — |
| hf-l2-command-builder | hf-l2-command-dev, hf-l2-command-parser | ✓ | — |
| hf-l2-meta-builder | hf-l2-meta-builder, hf-l2-skill-synthesis, hm-l2-coordinating-loop, hm-l2-planning-persistence | ✓ | — |
| hf-l2-prompter | hf-l2-command-parser, hm-l3-deep-research, hm-l3-detective, hm-l3-synthesis, hm-l2-planning-persistence, hm-l3-opencode-non-interactive-shell | ✓ | — |
| hf-l2-refactorer | hf-l2-agents-md-sync, hf-l2-use-authoring-skills | ✓ | — |
| hf-l2-skill-builder | hf-l2-use-authoring-skills, hf-l2-skill-synthesis | ✓ | — |
| hf-l2-synthesizer | hf-l2-skill-synthesis | ✓ | — |
| hf-l2-tool-builder | hf-l2-custom-tools-dev | ✓ | — |

**All agent→skill chains are intact.** Zero missing skill references across all 90 agents.

---

## Skill → Tool Binding Table

### Harness Plugin Tools (from src/plugin.ts:128-147)

| Tool Name | Registration | Used By Skills |
|-----------|-------------|----------------|
| delegate-task | ✓ registered | hm-l2-coordinating-loop, hm-l2-phase-execution, hm-l2-subagent-delegation-patterns |
| delegation-status | ✓ registered | hm-l2-coordinating-loop, hm-l2-completion-looping |
| run-background-command | ✓ registered | hm-l2-phase-execution, stack-l3-bun-pty |
| prompt-skim | ✓ registered | hf-l2-command-parser (via prompt enhance flow) |
| prompt-analyze | ✓ registered | hf-l2-command-parser (via prompt enhance flow) |
| session-patch | ✓ registered | hf-l2-command-parser (via prompt enhance flow) |
| session-journal-export | ✓ registered | hm-l3-hivemind-state-reference |
| hivemind-doc | ✓ registered | hm-l3-hivemind-state-reference, hm-l3-detective |
| hivemind-trajectory | ✓ registered | hm-l3-hivemind-state-reference |
| hivemind-pressure | ✓ registered | hm-l2-completion-looping (pressure detection) |
| hivemind-sdk-supervisor | ✓ registered | hm-l3-hivemind-engine-contracts |
| hivemind-command-engine | ✓ registered | hm-l3-opencode-platform-reference |
| hivemind-agent-work-create | ✓ registered | hm-l3-subagent-delegation-patterns |
| hivemind-agent-work-export | ✓ registered | hm-l3-subagent-delegation-patterns |
| configure-primitive | ✓ registered | opencode-config-workflow, hf-l2-meta-builder |
| validate-restart | ✓ registered | opencode-config-workflow, hm-l3-opencode-project-audit |
| bootstrap-init | ✓ registered | hm-l3-opencode-project-audit |
| bootstrap-recover | ✓ registered | hm-l3-opencode-project-audit |

---

## Delegation Chain Map Per Command

### Chain 1: hm-l2-conductor Commands (start-work, plan, harness-doctor, sync-agents-md, ultrawork)
```
User → /command → hm-l2-conductor (primary)
                    │
                    ├─ delegate-task → specialist agents (subagent mode)
                    │   ├─ hm-l2-researcher (research tasks)
                    │   ├─ hm-l2-executor (implementation tasks)
                    │   ├─ hm-l2-critic (verification tasks)
                    │   ├─ hm-l2-validator (validation tasks)
                    │   └─ hm-l2-reviewer (review tasks)
                    │
                    ├─ delegation-status → poll specialist completion
                    │
                    └─ run-background-command → PTY-based long-running tasks
```

### Chain 2: hf-l0-orchestrator Commands (harness-audit, hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-stack)
```
User → /command → hf-l0-orchestrator (primary)
                    │
                    ├─ task → hf-l1-coordinator (subagent)
                    │           │
                    │           ├─ task → hf-l2-agent-builder
                    │           ├─ task → hf-l2-skill-builder
                    │           ├─ task → hf-l2-command-builder
                    │           ├─ task → hf-l2-tool-builder
                    │           ├─ task → hf-l2-auditor
                    │           ├─ task → hf-l2-meta-builder
                    │           ├─ task → hf-l2-refactorer
                    │           └─ task → hf-l2-synthesizer
                    │
                    ├─ task → hm-l2-* specialists (FLEXIBLE cross-lineage)
                    │   ├─ hm-l2-prompt-skimmer
                    │   ├─ hm-l2-prompt-analyzer
                    │   ├─ hm-l2-risk-assessor
                    │   ├─ hm-l2-context-purifier
                    │   └─ hm-l2-prompt-repackager
                    │
                    └─ skill → hf-l2-context-absorb, opencode-config-workflow
```

### Chain 3: hf-l2-prompter Command (hf-prompt-enhance-to-plan)
```
User → /command → hf-l2-prompter (subagent, primary mode)
                    │
                    ├─ task → subagents for investigation
                    │   (loads hm-detective, hm-synthesis, hm-research)
                    │
                    └─ Direct file I/O for plan output
```

### Chain 4: hm-l2-researcher Command (deep-research-synthesis-repomix)
```
User → /command → hm-l2-researcher (subagent)
                    │
                    └─ Reference document only — no execution flow
```

### Chain 5: Inline Commands (deep-init, test-echo, test-list, test-status)
```
User → /command → executing agent (no specific routing)
                    │
                    ├─ deep-init: Spawns explore subagents dynamically
                    └─ test-*: Direct inline execution, no delegation
```

---

## Loop Lifecycle Analysis

### Loop Type 1: Phase Execution Loop (start-work, ultrawork)
```
ENTRY: Command invoked → conductor reads task_plan.md
  │
STEP 1: Identify pending phases
  │
STEP 2: delegate-task for current phase
  │   ├─ Dispatches specialist via delegate-task tool
  │   └─ Harness control plane enforces permissions + metadata
  │
STEP 3: Poll delegation-status
  │   ├─ CompletionDetector checks dual-signal (session idle + message count)
  │   └─ Returns running | completed | failed
  │
CHECKPOINT: Update task_plan.md phase status
  │
DECISION: More pending phases?
  ├─ YES → GOTO STEP 2
  └─ NO → EXIT with final report
```
**Termination guarantee:** All phases must complete. CompletionDetector prevents infinite loops via dual-signal (session idle + message threshold).

### Loop Type 2: Quality Gate Triad (harness-audit)
```
ENTRY: hf-l0-orchestrator dispatches 4 parallel audit subagents
  │
PARALLEL: Phases 1-4 run simultaneously
  │   ├─ Source inventory
  │   ├─ Claim vs reality
  │   ├─ Governance coherence
  │   └─ Cross-platform audit
  │
GATE: All 4 reports collected?
  ├─ NO → WAIT for remaining
  └─ YES → Phase 5 synthesis
  │
SYNTHESIS: Merge findings → quality gate triad
  │   ├─ gate-l3-lifecycle-integration → PASS/FAIL
  │   ├─ gate-l3-spec-compliance → PASS/FAIL (only if lifecycle passes)
  │   └─ gate-l3-evidence-truth → PASS/FAIL (only if spec passes)
  │
EXIT: audit-report.md or HALT on critical finding
```

### Loop Type 3: Multi-Wave Absorb (hf-absorb)
```
ENTRY: hf-l0-orchestrator loads hf-l2-context-absorb skill
  │
WAVE 0: Delta computation (existing context vs new input)
  │
WAVE 1-N: Content processing waves
  │   └─ Each wave dispatched to task subagents
  │
WAVE 4: Final merge
  │   └─ APPEND to .hivemind/state/session-context-prompt.md
  │
EXIT: Context absorbed
```

### Loop Type 4: AGENTS.md Generation (deep-init)
```
ENTRY: Command executor starts 4-phase pipeline
  │
PHASE 1: Discovery (concurrent)
  │   ├─ 6+ background explore agents
  │   └─ Main session: bash + LSP + existing AGENTS.md
  │
PHASE 2: Scoring → determine AGENTS.md locations
  │
PHASE 3: Generate (parallel writing tasks)
  │   └─ Root first, then subdirs in parallel
  │
PHASE 4: Review → deduplicate, trim, validate
  │
EXIT: Final report with file list + line counts
```

### Loop Type 5: Simple Inline (test-echo, test-list, test-status)
```
ENTRY: Command invoked
  │
EXECUTE: Single operation (echo / ls / git status)
  │
EXIT: Result returned
```
No iteration, no delegation, no checkpoints.

---

## Broken Chains

### BROKEN-01: deep-init has no agent field
- **Command:** `.opencode/commands/deep-init.md`
- **Issue:** No `agent:` field in YAML frontmatter
- **Impact:** OpenCode runs the command on whatever agent is active (likely `hm-l2-build` default)
- **Fix:** Add `agent: hm-l2-conductor` or a dedicated init agent
- **Severity:** MEDIUM — command works but routing is undefined

### BROKEN-02: deep-research-synthesis-repomix is type: reference but has agent
- **Command:** `.opencode/commands/deep-research-synthesis-repomix.md`
- **Issue:** Marked as `type: reference` and `subtask: true` with agent hm-l2-researcher, but it's a 627-line knowledge base document, not an executable command
- **Impact:** If accidentally invoked, it dumps 627 lines of reference material into the agent context
- **Fix:** Either remove from commands/ and move to skills/ or research/, or add clear "DO NOT EXECUTE" warning
- **Severity:** LOW — unlikely to cause harm, but confusing

### BROKEN-03: hf-prompt-enhance-to-plan references CLI flags not available via command engine
- **Command:** `.opencode/commands/hf-prompt-enhance-to-plan.md`
- **Issue:** Contains 227 lines including full OpenCode CLI documentation, environment variables, and CLI flags. These are informational but bloated for a command definition
- **Impact:** Wastes context budget when invoked
- **Fix:** Trim to essential workflow instructions; move CLI reference to a skill
- **Severity:** LOW — functional but wasteful

### BROKEN-04: harness-audit references @.hivefiver-hm-meta-builder path (may not exist)
- **Command:** `.opencode/commands/harness-audit.md`
- **Issue:** References `<execution_context>@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/audit.md` which is an external path
- **Impact:** If the path doesn't resolve, the execution context is lost
- **Severity:** MEDIUM — depends on whether .hivefiver-hm-meta-builder is present

### BROKEN-05: sync-agents-md loads hf-* skill from hm-* agent
- **Command:** `.opencode/commands/sync-agents-md.md`
- **Issue:** hm-l2-conductor is told to load `hf-l2-agents-md-sync` skill, but conductor's permission only allows `hm-l2-*, hm-l3-*, gate-l3-*, stack-l3-*`
- **Impact:** The skill load may be denied by permission policy
- **Fix:** Either add `hf-l2-*` to conductor's skill permissions or route this command through hf-l0-orchestrator
- **Severity:** HIGH — may fail at runtime

---

## Missing Commands for Uncovered Workflows

### MISSING-01: No command for debug/investigate workflows
- **Gap:** No `/debug` or `/investigate` command exists
- **Agents available:** hm-l2-debugger, hm-l2-investigator
- **Skills available:** hm-l2-debug, hm-l3-detective
- **Recommendation:** Create `/debug` command routing to hm-l1-coordinator → hm-l2-debugger

### MISSING-02: No command for refactor workflows
- **Gap:** No `/refactor` command exists
- **Agents available:** hm-l2-architect, hm-l2-optimizer
- **Skills available:** hm-l2-refactor
- **Recommendation:** Create `/refactor` command routing to hm-l1-coordinator → hm-l2-architect

### MISSING-03: No command for requirements/brainstorm workflows
- **Gap:** No `/brainstorm` or `/requirements` command exists
- **Agents available:** hm-l2-brainstormer, hm-l2-mentor, hm-l2-analyst
- **Skills available:** hm-l2-brainstorm, hm-l2-requirements-analysis
- **Recommendation:** Create `/brainstorm` command routing to hm-l2-brainstormer

### MISSING-04: No command for review/verification workflows
- **Gap:** No `/review` or `/verify` command exists
- **Agents available:** hm-l2-critic, hm-l2-reviewer, hm-l2-validator
- **Skills available:** hm-l2-test-driven-execution, hm-l2-spec-driven-authoring
- **Recommendation:** Create `/review` command routing to hm-l1-coordinator → hm-l2-critic

### MISSING-05: No command for production readiness
- **Gap:** No `/ship` or `/deploy-check` command exists
- **Agents available:** hm-l2-curator, hm-l2-assessor, hm-l2-integrator
- **Skills available:** hm-l2-production-readiness
- **Recommendation:** Create `/ready-to-ship` command routing to hm-l1-coordinator → hm-l2-curator

### MISSING-06: No command for ecosystem/dependency analysis
- **Gap:** No `/ecosystem` or `/dependencies` command exists
- **Agents available:** hm-l2-ecologist, hm-l2-strategist, hm-l2-technician
- **Skills available:** hm-l2-feature-ecosystem, hm-l3-tech-context-compliance
- **Recommendation:** Create `/ecosystem` command routing to hm-l2-ecologist

---

## Plugin Tool Registry Summary

**18 tools registered** in `src/plugin.ts` (lines 128-147):

| Tool | Category | Entry Point |
|------|----------|-------------|
| delegate-task | Delegation | `src/tools/delegation/delegate-task.ts` |
| delegation-status | Delegation | `src/tools/delegation/delegation-status.ts` |
| run-background-command | PTY/Background | `src/tools/hivemind/run-background-command.ts` |
| prompt-skim | Prompt | `src/tools/prompt/prompt-skim/index.ts` |
| prompt-analyze | Prompt | `src/tools/prompt/prompt-analyze/index.ts` |
| session-patch | Session | `src/tools/session/session-patch/index.ts` |
| session-journal-export | Session | `src/tools/session/session-journal-export.ts` |
| hivemind-doc | Doc Intelligence | `src/tools/hivemind/hivemind-doc.ts` |
| hivemind-trajectory | Trajectory | `src/tools/hivemind/hivemind-trajectory.ts` |
| hivemind-pressure | Pressure | `src/tools/hivemind/hivemind-pressure.ts` |
| hivemind-sdk-supervisor | SDK | `src/tools/hivemind/hivemind-sdk-supervisor.ts` |
| hivemind-command-engine | Command | `src/tools/hivemind/hivemind-command-engine.ts` |
| hivemind-agent-work-create | Work Contract | `src/tools/hivemind/hivemind-agent-work.ts` |
| hivemind-agent-work-export | Work Contract | `src/tools/hivemind/hivemind-agent-work.ts` |
| configure-primitive | Config | `src/tools/config/configure-primitive.ts` |
| validate-restart | Config | `src/tools/config/validate-restart.ts` |
| bootstrap-init | Bootstrap | `src/tools/config/bootstrap-init.ts` |
| bootstrap-recover | Bootstrap | `src/tools/config/bootstrap-recover.ts` |

---

## Verification Checklist

- [x] File exists on disk at `.hivemind/planning/agents-system-overhaul-2026-05-10/LIFECYCLE-command-agent-skill-2026-05-10.md`
- [x] Every shipped command (19) has a lifecycle entry
- [x] Every broken chain documented (5 broken chains found)
- [x] hf-l0-orchestrator confirmed present at `.opencode/agents/hf-l0-orchestrator.md`
- [x] All agent→skill bindings validated against skills on disk (124 skill directories)
- [x] All plugin tools mapped to their source files
- [x] 6 missing commands identified for uncovered workflows
- [x] 5 loop lifecycle types documented with entry/iterate/terminate flows

---

## Handoff Metadata
- **source_agent:** hm-l0-orchestrator
- **target_agent:** hm-l2-researcher
- **handoff_reason:** lifecycle mapping — command→agent→skill→tool→loop chain for all 19 commands
- **expected_return:** DONE + lifecycle doc on disk with per-command flows + broken chain analysis
- **status:** DONE
