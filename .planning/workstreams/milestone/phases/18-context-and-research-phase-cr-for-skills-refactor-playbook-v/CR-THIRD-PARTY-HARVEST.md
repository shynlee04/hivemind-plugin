# CR-THIRD-PARTY-HARVEST.md — Third-Party Pattern Harvest

**Deliverable:** CR-05
**Date:** 2026-04-23
**Method:** Pattern extraction from GSD workflows, superpowers skills, and retired skills
**Policy:** Per Playbook I.6 — patterns are abstracted and attributed, never copied verbatim

---

## Source Inventory

### Source 1: GSD Workflows (`.opencode/get-shit-done/workflows/`)

[PROBE: `ls .opencode/get-shit-done/workflows/*.md | wc -l`] → [RESULT: 78] [DATE: 2026-04-23]

Key workflow files with pattern value:
- `execute-phase.md` — wave-based parallel execution
- `execute-plan.md` — sequential task execution with atomic commits
- `verify-work.md` — conversational UAT verification
- `do.md` — intent routing and command dispatch
- `discuss-phase.md` — Socratic context gathering
- `plan-phase.md` — detailed phase plan creation
- `research-phase.md` — domain research before planning
- `code-review.md` — automated code review pipeline
- `debug.md` — systematic debugging with checkpoints

### Source 2: Superpowers Skills (`~/.agents/skills/`)

[PROBE: `ls ~/.agents/skills/ 2>/dev/null | wc -l`] → [RESULT: 30+] [DATE: 2026-04-23]

Key superpowers skills with pattern value:
- `verification-before-completion` — evidence-before-claims gate
- `dispatching-parallel-agents` — parallel agent coordination
- `planning-with-files` — 3-file external memory system
- `tdd-workflow` — red-green-refactor discipline
- `parallel-debugging` — competing hypotheses investigation
- `receiving-code-review` — rigorous feedback handling

### Source 3: Retired Skills (`.hivefiver-meta-builder/skills-lab/retired/`)

[PROBE: `ls .hivefiver-meta-builder/skills-lab/retired/`] → [RESULT: repomix-exploration-guide, repomix-explorer, research-operations] [DATE: 2026-04-23]

Retired skills available for pattern salvage (per I.6 policy: re-author, do not restore):
- `repomix-exploration-guide` — CLI commands and MCP tools for repo exploration
- `repomix-explorer` — Skill generation from codebase analysis
- `research-operations` — Multi-source research with citation tracking

---

## Harvested Patterns

### Patterns for G-A (Looping / Guardrails / Gatekeeping)

| # | Source | Pattern Name | Abstracted Pattern | Target hm-* Skill | Cluster | Attribution |
|---|--------|-------------|-------------------|-------------------|---------|-------------|
| 1 | GSD execute-phase.md | Wave-based parallel execution with dependency resolution | Plans assigned to waves by dependency graph. Same-wave plans run in parallel. File overlap detection forces sequential fallback. Each plan produces SUMMARY.md. Orchestrator updates shared STATE.md/ROADMAP.md after wave completion. | hm-phase-execution | G-D (also G-A) | GSD execute-phase workflow |
| 2 | GSD execute-phase.md | Post-merge test gate | After parallel worktrees merge, run full test suite to catch cross-plan integration failures that individual agent self-checks miss. Timeout: 5 minutes. Failures block tracking updates. | hm-completion-looping | G-A | GSD execute-phase §5.6 |
| 3 | GSD execute-plan.md | Atomic task commits with SUMMARY.md | Each task within a plan commits atomically. Plan completes only when SUMMARY.md is created and committed. Prevents partial execution state. | hm-phase-execution | G-D | GSD execute-plan workflow |
| 4 | Superpowers verification-before-completion | Evidence-before-claims gate | Block completion claims until verification evidence produced in current message. Rule: fresh output or no claim. Prevents false-positive completion signals. | hm-completion-looping | G-A | Superpowers verification-before-completion |
| 5 | GSD verify-work.md | Conversational UAT loop | Verification through structured dialogue: present checkpoint → user responds → spawn continuation agent with explicit state. Fresh agent per continuation, not resume. | hm-completion-looping | G-A | GSD verify-work workflow |
| 6 | Superpowers dispatching-parallel-agents | Parallel agent coordination with ownership | Establish file ownership per agent to prevent merge conflicts. Design interface contracts so parallel implementers build against APIs before ready. Vertical slices preferred over horizontal layers. | hm-coordinating-loop | G-A | Superpowers dispatching-parallel-agents |

### Patterns for G-B (Spec-driven + Test-driven)

| # | Source | Pattern Name | Abstracted Pattern | Target hm-* Skill | Cluster | Attribution |
|---|--------|-------------|-------------------|-------------------|---------|-------------|
| 7 | GSD plan-phase.md | Falsifiable requirements in plan frontmatter | Plans include `must_haves.truths[]` — verifiable claims that can be checked programmatically. Each truth must be provable true or false. | hm-spec-driven-authoring | G-B | GSD plan-phase workflow |
| 8 | Superpowers tdd-workflow | Red-green-refactor with tracer bullets | Tests built around vertical slices (tracer bullets), not horizontal layers. Red: write failing test. Green: minimum implementation. Refactor: clean without changing behavior. | hm-test-driven-execution | G-B | Superpowers tdd-workflow |
| 9 | GSD execute-phase.md | TDD review checkpoint at phase end | Collect all TDD plan summaries. Verify RED gate (failing test commit exists), GREEN gate (implementation commit), REFACTOR gate (optional cleanup). Flag missing gates. | hm-test-driven-execution | G-B | GSD execute-phase §tdd_review_checkpoint |
| 10 | Superpowers receiving-code-review | Rigorous feedback verification | Before implementing review suggestions: verify technical correctness, check if feedback is actionable, seek clarification on unclear points. Never blind implementation. | hm-spec-driven-authoring | G-B | Superpowers receiving-code-review |

### Patterns for G-C (Research / Investigation / Synthesis)

| # | Source | Pattern Name | Abstracted Pattern | Target hm-* Skill | Cluster | Attribution |
|---|--------|-------------|-------------------|-------------------|---------|-------------|
| 11 | Retired research-operations | Multi-source research with citation tracking | Research across multiple sources with explicit citation markers. Evidence trace format: [PROBE: command] → [RESULT: value] [DATE: YYYY-MM-DD]. Prevents ungrounded claims. | hm-deep-research | G-C | Retired research-operations |
| 12 | Retired repomix-explorer | Codebase packing for agent analysis | Pack repository into consolidated file with configurable compression (snapshot/focused/signature tiers). Extract essential code signatures while removing implementation details. | hm-detective | G-C | Retired repomix-explorer |
| 13 | GSD research-phase.md | Research chain protocol | Canonical research chain: detective (scan) → deep-research (version-matched) → synthesis (compression) → skill-synthesis (pattern extraction). Each stage feeds the next. | hm-research-chain | G-C | GSD research-phase workflow |
| 14 | Superpowers planning-with-files | 3-file external memory system | Task plan + findings + progress files persist state across agent handoffs. Prevents goal drift. Files: task_plan.md, findings.md, progress.md. | hm-synthesis | G-C | Superpowers planning-with-files |
| 15 | Retired repomix-exploration-guide | CLI exploration commands | Repomix CLI for packing, skill generation, token budget management. Cross-repo analysis workflows. | hm-detective | G-C | Retired repomix-exploration-guide |

### Patterns for G-D (Debug / Refactor / Planning / Execution)

| # | Source | Pattern Name | Abstracted Pattern | Target hm-* Skill | Cluster | Attribution |
|---|--------|-------------|-------------------|-------------------|---------|-------------|
| 16 | GSD debug.md | Systematic debugging with competing hypotheses | Debug using scientific method: evidence gathering → hypothesis generation → hypothesis testing → rigorous verification. Parallel investigation of multiple hypotheses. | hm-debug | G-D | GSD debug workflow |
| 17 | Superpowers parallel-debugging | Parallel hypothesis investigation | Spawn competing hypotheses as parallel agents. Each agent investigates independently. Evidence collected centrally. Root cause arbitration via evidence weight. | hm-debug | G-D | Superpowers parallel-debugging |
| 18 | GSD execute-phase.md | Wave safety check with file overlap detection | Before spawning agents, detect `files_modified` overlap within wave. If overlap found: warn user, force sequential execution for that wave. Safety net for planning defects. | hm-phase-execution | G-D | GSD execute-phase §execute_waves |
| 19 | Superpowers improve-codebase-architecture | Architectural improvement via module deepening | Explore codebase for architectural improvement opportunities. Focus on deepening shallow modules. Consolidate tightly-coupled modules. Make codebase more AI-navigable. | hm-refactor | G-D | Superpowers improve-codebase-architecture |
| 20 | GSD execute-phase.md | Checkpoint handling between waves | Plans with `autonomous: false` require user checkpoint. Present: completed tasks, current blocker, checkpoint type. User responds → spawn fresh continuation agent (not resume). | hm-phase-execution | G-D | GSD execute-phase §checkpoint_handling |

### Patterns for Non-Cluster Skills (Cross-cutting)

| # | Source | Pattern Name | Abstracted Pattern | Target hm-* Skill | Cluster | Attribution |
|---|--------|-------------|-------------------|-------------------|---------|-------------|
| 21 | GSD do.md | Intent routing with fallback | Parse freeform text → match against routing rules → confirm match → dispatch to specialist command. First matching rule wins. Ambiguity resolved via user question. | hm-meta-builder | G-D | GSD do workflow |
| 22 | Superpowers skill-creator | Skill quality evaluation framework | Evaluate skills against official specifications: trigger accuracy, description quality, frontmatter completeness, reference organization, script determinism. Multi-dimensional scoring. | hm-skill-synthesis | G-C | Superpowers skill-creator |
| 23 | GSD code-review.md | Automated code review pipeline | Review source files for bugs, security issues, code quality. Produce structured REVIEW.md with severity-classified findings. Spawns fixer agent for auto-fix. | hm-opencode-project-audit | G-D | GSD code-review workflow |

---

## Verification

- [x] No pattern entry contains verbatim copy from source (abstracted to mechanism only)
- [x] Every pattern has a target hm-* skill
- [x] Every pattern has attribution to source file
- [x] Every pattern maps to at least one differential cluster
- [x] 23 patterns harvested from 3 sources (GSD workflows, superpowers skills, retired skills)

---

*Deliverable: CR-05*
*Date: 2026-04-23*
