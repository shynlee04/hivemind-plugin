---
name: hiveminder-operation-guidelines
description: |
  Operational reference for the 15-skill HiveMind ecosystem. Documents how all skills interconnect, agent-to-skill mappings, workflow phase coverage, cross-skill handoff patterns, and the dispatch flow that governs multi-agent orchestration.
parent: use-hivemind
---

# Hiveminder Operation Guidelines

## Load Position

Layer: Reference (loaded on demand). No skill batch consumed.

This document serves as the operational reference for how all 15 HiveMind skills work together as an integrated system.

## When You Need This

| Situation | Route |
|-----------|-------|
| New orchestrator needs ecosystem overview | Read this file |
| Unclear which skill handles a workflow phase | → Skill-Phase Mapping |
| Agent selection confusion | → Agent-Skill Mapping |
| Cross-skill handoff not working | → Handoff Patterns |
| Verifying workflow coverage | → Workflow Coverage Matrix |

## The 15-Skill Ecosystem

```
use-hivemind (Entry Router)
├── Domain Skills (loaded on domain entry)
│   ├── use-hivemind-context      — Context health verification
│   ├── use-hivemind-delegation   — Subagent dispatch protocol
│   ├── use-hivemind-planning     — Plan lifecycle + decomposition
│   ├── use-hivemind-research     — Multi-source research routing
│   ├── use-hivemind-skill-authoring — Skill creation + audit
│   └── use-hivemind-git-memory   — Git-based semantic memory
│
└── Depth Skills (loaded based on task needs)
    ├── hivemind-atomic-commit    — Typed commit discipline
    ├── hivemind-codemap          — Codebase scanning + mapping
    ├── hivemind-gatekeeping      — Loop control + synthesis gates
    ├── hivemind-patterns         — Architecture patterns reference
    ├── hivemind-refactor         — Refactor methodology
    ├── hivemind-spec-driven      — Spec-driven engineering
    ├── hivemind-system-debug     — Debug-to-refactor transitions
    └── use-hivemind-tdd          — TDD lifecycle enforcement
```

Skills are loaded dynamically in conditional batches. Entry loads first. Domain loads on domain entry. Depth loads based on task methodology needs. There is no fixed slot limit — the orchestrator composes the batch based on workflow state.

## Workflow Phase → Skill Mapping

| Phase | Primary Skill | Supporting Skills |
|-------|--------------|-------------------|
| Session Entry | `use-hivemind` | — |
| Context Verification | `use-hivemind-context` | — |
| Investigation | `hivemind-codemap` | `use-hivemind-delegation` |
| Research | `use-hivemind-research` | `use-hivemind-delegation` |
| Planning | `use-hivemind-planning` | `hivemind-spec-driven` |
| Specification | `hivemind-spec-driven` | `use-hivemind-planning` |
| Implementation (TDD) | `use-hivemind-tdd` | `hivemind-gatekeeping` |
| Verification | `hivemind-gatekeeping` | `use-hivemind-tdd` |
| Code Review | (code-skeptic agent) | `hivemind-refactor`, `hivemind-patterns` |
| Refactoring | `hivemind-refactor` | `hivemind-patterns`, `hivemind-codemap` |
| Debugging | `hivemind-system-debug` | `hivemind-codemap` |
| Commit | `hivemind-atomic-commit` | `use-hivemind-git-memory` |
| Skill Authoring | `use-hivemind-skill-authoring` | — |

## Agent → Skill Mapping

| Agent | Default Skills to Load | Role |
|-------|----------------------|------|
| hiveminder | `use-hivemind` + `use-hivemind-delegation` | Orchestrator — coordinates, delegates, never implements |
| hivexplorer | `hivemind-codemap` | Read-only investigation + codebase scanning |
| hiverd | `use-hivemind-research` | External research via MCP tools |
| hiveplanner | `use-hivemind-planning` | Plan decomposition + dependency ordering |
| architect | `hivemind-patterns` | Architecture decisions + pattern selection |
| hitea | `use-hivemind-tdd` | Test-first writing (RED phase) |
| hivemaker | `use-hivemind-tdd` | Implementation (GREEN + REFACTOR phases) |
| hiveq | `hivemind-gatekeeping` | Verification + evidence validation |
| code-skeptic | `hivemind-refactor` | Adversarial code review |
| hivehealer | `hivemind-system-debug` | Debug + remediation |

## Dispatch Flow

### Standard Multi-Wave Pattern

```
Wave 1: Investigation (parallel)
  ├─ hivexplorer (codebase structure)
  ├─ hivexplorer (dependency map)
  └─ hivexplorer (test coverage)
        └─ SYNTHESIZE → ≤5 findings

Wave 2: Research (sequential to Wave 1)
  ├─ hiverd (external: API docs, patterns)
  └─ hivexplorer (internal: cross-validate)
        └─ SYNTHESIZE → ≤5 findings

Checkpoint: Master Plan
  ├─ hiveplanner (decompose into phases)
  └─ architect (validate architecture)
        └─ SYNTHESIZE → plan with gates

Wave 3: Implementation (sequential to Checkpoint)
  ├─ hivemaker (Phase 01)
  └─ hitea (write tests for Phase 01)
        └─ GATE → hiveq (verify)

Wave 4: Verification + Review
  ├─ hiveq (integration tests)
  └─ code-skeptic (adversarial review)
        └─ GATE → hivemind-atomic-commit
```

## Cross-Skill Handoff Patterns

### Planning → TDD Handoff
`use-hivemind-planning` produces plan records with phase decomposition → `use-hivemind-tdd` consumes phase boundaries and writes RED tests per slice.

### TDD → Gatekeeping Handoff
`use-hivemind-tdd` produces checkpoint JSON with pass/fail evidence → `hivemind-gatekeeping` validates against synthesis gates.

### Refactor → Patterns Handoff
`hivemind-refactor` identifies code smells → `hivemind-patterns` provides canonical terminology and pattern solutions.

### Debug → Refactor Handoff
`hivemind-system-debug` produces root cause evidence + containment posture → `hivemind-refactor` applies smallest safe fix.

### Commit → Git Memory Handoff
`hivemind-atomic-commit` produces typed commit with activity metadata → `use-hivemind-git-memory` indexes the commit for future retrieval.

## Sequential vs Parallel Rules

| Parallel is SAFE | Parallel is FORBIDDEN |
|-----------------|----------------------|
| Multiple hivexplorers (read-only) | Any write agents to same domain |
| hiverd + hivexplorer (independent) | hivemaker + hivemaker (shared files) |
| Investigation across modules | Implementation + test writing (shared state) |

**Absolute rule:** NEVER dispatch parallel agents that edit/write/change the same domain, same concerns, or dependent entities.

## Anti-Patterns

1. **Loading depth skills without domain skill** — Loading `hivemind-codemap` without `use-hivemind-delegation` loaded means no delegation protocol. The scan runs but can't hand off results properly.

2. **Skipping context verification after compaction** — After `/clear` or session disconnect, always load `use-hivemind-context` before resuming. Prior state is untrusted.

3. **Ignoring prerequisite chains** — Loading `hivemind-gatekeeping` without `use-hivemind-delegation` breaks the prerequisite chain. `hivemind-atomic-commit` requires `use-hivemind-git-memory`. Check prerequisites before loading.

4. **Dispatching implementation without investigation** — Every implementation wave must be preceded by investigation synthesis. Skipping Wave 1 means working on assumptions, not evidence.

5. **Accepting "done" without evidence** — Every delegated agent must return: file paths, command output, gate result JSON. "Tests pass" without output proof is not evidence.

## Conditional Batch Templates

| Workflow | Entry | Domain | Depth(s) |
|----------|-------|--------|----------|
| Full orchestration | `use-hivemind` | `use-hivemind-delegation` | `hivemind-gatekeeping` |
| Investigation | `use-hivemind` | `use-hivemind-delegation` | `hivemind-codemap` |
| Planning | `use-hivemind` | `use-hivemind-planning` | `hivemind-spec-driven`, `hivemind-codemap` |
| TDD Implementation | `use-hivemind` | `use-hivemind-tdd` | `hivemind-gatekeeping` |
| Code Review | `use-hivemind` | `use-hivemind-delegation` | `hivemind-refactor`, `hivemind-patterns` |
| Research | `use-hivemind` | `use-hivemind-research` | `hivemind-codemap` |
| Debug | `use-hivemind` | `use-hivemind-delegation` | `hivemind-system-debug`, `hivemind-codemap` |
| Commit | `use-hivemind` | `use-hivemind-git-memory` | `hivemind-atomic-commit` |
