---
phase: 24
title: Agent Hierarchy Restructure + Profile Quality
reviewed: 2026-05-26
status: draft
---

# Phase 24 — Agent System Redesign

## Overview

Complete redesign of Hivemind's agent system based on deep analysis of GSD's shipped agent architecture (33 agents across 21 primary + 12 specialized) and OpenCode's official agent schema.

**Key architectural decisions:**

### D-24-01: No GSD Primitives Shipped

GSD primitives (`gsd-*` commands, `gsd-*` agents, `get-shit-done/` workflows) are **never shipped** with Hivemind. When Hivemind is installed in a user's project, only `hm-*`, `hf-*`, `gate-*`, and `stack-*` primitives exist. All routing is done through Hivemind-native programmatic features:

- session-tracker (session persistence)
- delegation-status (subagent monitoring)
- coordination (multi-agent dispatch)
- agent-work-contract (scope/evidence)
- trajectory (progress tracking)
- pressure (health/circuit-breaker)
- injection (hook injection)

### D-24-02: Agent YAML Format (Minimal)

Following OpenCode's official agent schema (opencode.ai/docs/agents), agent frontmatter is:

```yaml
---
description: >
  [concise role description — what this agent does and what it produces]
mode: all
hidden: true
---
```

**Rules:**
- `mode: all` (default, allows both primary and subagent invocation)
- `hidden: true` for ALL L2 specialists (hides from @ menu, only callable programmatically by orchestrator via task tool)
- File name = agent name (e.g., `hm-executor.md`)
- NO `tools`, `permission`, `temperature`, `steps`, `color`, `model` in agent file — these are set at runtime by orchestrator via programmatic features
- NO looping/gating/hierarchy logic in agent profile body — these belong in programmatic features (tools, commands, workflows)
- Agent body contains: role description, execution flow, deviation rules, artifact specs, success criteria

### D-24-03: One Agent = One Domain

Each agent has a single, non-overlapping domain. No two agents can substitute for each other. Each agent is mapped 1:1 to a specific Hm command + workflow.

### D-24-04: Gate Agents Merged into Workflow

GSD's approach of separate gate agents (`gate-spec-compliance`, `gate-evidence-truth`, `gate-lifecycle`) is merged into Hm workflow:

- Spec compliance → `hm-code-reviewer` does it during review
- Evidence truth → `hm-verifier` checks it during verification
- Lifecycle → `hm-orchestrator` enforces it via programmatic features

## Complete Agent Roster (30 hm-* agents)

### L0 Front-Facing

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 1 | `hm-orchestrator` | — | — | Front-facing session orchestration, routing, governance | session, delegations.json |

### L2 Research

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 2 | `hm-project-researcher` | `/hm-new-project` | `hm-new-project.md` | Domain ecosystem research before roadmap | `.planning/research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md` |
| 3 | `hm-phase-researcher` | `/hm-plan-phase` | `hm-plan-phase.md` | Phase implementation research before planning | `{phase}-RESEARCH.md` |
| 4 | `hm-synthesizer` | `/hm-new-project` | `hm-new-project.md` | Combines parallel researcher outputs | `.planning/research/SUMMARY.md` |

### L2 Planning

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 5 | `hm-architect` | `/hm-architect` | `hm-architect.md` | Technical architecture design, ADRs | `ARCHITECTURE.md`, `ADR-*.md` |
| 6 | `hm-codebase-mapper` | `/hm-map-codebase` | `hm-map-codebase.md` | Codebase exploration, pattern extraction | `.planning/codebase/*.md` |
| 7 | `hm-planner` | `/hm-plan-phase` | `hm-plan-phase.md` | Task breakdown, dependency analysis | `{phase}-NN-PLAN.md` |
| 8 | `hm-pattern-mapper` | `/hm-plan-phase` | `hm-plan-phase.md` | Code pattern mapping for new files | `PATTERNS.md` |
| 9 | `hm-plan-checker` | `/hm-plan-phase` | `hm-plan-phase.md` | Plan verification (goal-backward) | PASS/FAIL verdict |
| 10 | `hm-roadmapper` | `/hm-new-project` | `hm-new-project.md` | Phase breakdown, requirement mapping | `ROADMAP.md` |

### L2 Implementation

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 11 | `hm-executor` | `/hm-execute-phase` | `hm-execute-phase.md` | Plan execution, atomic commits | code changes, `{phase}-NN-SUMMARY.md` |
| 12 | `hm-verifier` | `/hm-execute-phase` | `hm-execute-phase.md` | Goal-backward verification, evidence truth | `{phase}-VERIFICATION.md` |
| 13 | `hm-code-reviewer` | `/hm-code-review` | `hm-code-review.md` | Adversarial code review, spec compliance | `REVIEW.md` |
| 14 | `hm-code-fixer` | `/hm-code-review --fix` | `hm-code-review-fix.md` | Apply review fixes, atomic per-fix commits | `REVIEW-FIX.md` |
| 15 | `hm-integration-checker` | `/hm-audit-milestone` | `hm-audit-milestone.md` | Cross-phase integration, E2E flow check | Integration report |

### L2 Debug

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 16 | `hm-debug-session-manager` | `/hm-debug` | `hm-debug.md` | Multi-cycle debug session orchestration | debug session, checkpoint logs |
| 17 | `hm-debugger` | `/hm-debug` | `hm-debug.md` | Bug investigation, root cause analysis | `.planning/debug/*.md` |

### L2 Security

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 18 | `hm-security-auditor` | `/hm-secure-phase` | `hm-secure-phase.md` | STRIDE threat model verification | `{phase}-SECURITY.md` |

### L2 Documentation

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 19 | `hm-doc-writer` | `/hm-docs-update` | `hm-docs-update.md` | Documentation authoring | Project docs (README, API, etc.) |
| 20 | `hm-doc-verifier` | `/hm-docs-update` | `hm-docs-update.md` | Factual claim verification against code | JSON verification per doc |

### L2 Profiling

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 21 | `hm-user-profiler` | `/hm-profile-user` | `hm-profile-user.md` | Developer behavioral profiling | `USER-PROFILE.md` |

### L2 UI (optional, frontend only)

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 22 | `hm-ui-researcher` | `/hm-ui-phase` | `hm-ui-phase.md` | UI design contract creation | `{phase}-UI-SPEC.md` |
| 23 | `hm-ui-checker` | `/hm-ui-phase` | `hm-ui-phase.md` | UI design contract validation | BLOCK/FLAG/PASS verdict |
| 24 | `hm-ui-auditor` | `/hm-ui-review` | `hm-ui-review.md` | 6-pillar visual audit | `{phase}-UI-REVIEW.md` |

### L2 Cross-Cutting

| # | Agent | Command | Workflow | Domain | Artifact |
|---|-------|---------|----------|--------|----------|
| 25 | `hm-intent-loop` | `/hm-plan-phase` | `hm-plan-phase.md` | Intent clarification, Q&A | `INTENT.md` |
| 26 | `hm-ecologist` | `/hm-ecologis`t | `hm-ecologist.md` | Feature dependency mapping, impact | `ECOSYSTEM.md` |
| 27 | `hm-shipper` | `/hm-ship` | `hm-ship.md` | Release coordination | `CHANGELOG.md`, release manifests |
| 28 | `hm-specifier` | `/hm-plan-phase` | `hm-plan-phase.md` | Spec-driven authoring | `SPEC.md` |
| 29 | `hm-nyquist-auditor` | `/hm-validate-phase` | `hm-validate-phase.md` | Nyquist validation gap filling | Test files, `VALIDATION.md` |
| 30 | `hm-intel-updater` | `/hm-map-codebase --query` | `hm-map-codebase.md` | Codebase intelligence writing | `.planning/intel/*.json` |

## Command-to-Agent Mapping

| Hm Command | Workflow | Primary Agent | Secondary Agent(s) |
|-----------|----------|---------------|-------------------|
| `/hm-new-project` | `hm-new-project.md` | hm-project-researcher | hm-synthesizer, hm-roadmapper |
| `/hm-plan-phase` | `hm-plan-phase.md` | hm-planner | hm-phase-researcher, hm-pattern-mapper, hm-plan-checker, hm-intent-loop, hm-specifier |
| `/hm-execute-phase` | `hm-execute-phase.md` | hm-executor | hm-verifier |
| `/hm-code-review` | `hm-code-review.md` | hm-code-reviewer | hm-code-fixer (--fix flag) |
| `/hm-debug` | `hm-debug.md` | hm-debug-session-manager | hm-debugger |
| `/hm-secure-phase` | `hm-secure-phase.md` | hm-security-auditor | — |
| `/hm-docs-update` | `hm-docs-update.md` | hm-doc-writer | hm-doc-verifier |
| `/hm-map-codebase` | `hm-map-codebase.md` | hm-codebase-mapper | hm-pattern-mapper, hm-intel-updater |
| `/hm-audit-milestone` | `hm-audit-milestone.md` | hm-integration-checker | — |
| `/hm-validate-phase` | `hm-validate-phase.md` | hm-nyquist-auditor | — |
| `/hm-ui-phase` | `hm-ui-phase.md` | hm-ui-researcher | hm-ui-checker |
| `/hm-ui-review` | `hm-ui-review.md` | hm-ui-auditor | — |
| `/hm-profile-user` | `hm-profile-user.md` | hm-user-profiler | — |
| `/hm-ship` | `hm-ship.md` | hm-shipper | — |
| `/hm-architect` | `hm-architect.md` | hm-architect | — |
| `/hm-ecologist` | `hm-ecologist.md` | hm-ecologist | — |

## Agent Frontmatter Template

```yaml
---
description: >
  [One sentence: what this agent does. Second sentence: what artifact it produces.
  Third sentence: when/why the orchestrator calls it.]
mode: all
hidden: true
---
```

## Key Differences from Current Hm Agents

| Current | Corrected |
|---------|-----------|
| `mode: subagent` | `mode: all` with `hidden: true` |
| `permission: { read: allow, edit: deny }` | REMOVED — permissions set at runtime |
| `temperature: 0.3` | REMOVED — model settings at runtime |
| `steps: 100` | REMOVED — steps at runtime |
| `color: "#3B82F6"` | REMOVED — UI concern |
| `tools: [Read, Write, Bash]` | REMOVED — deprecated field in OpenCode |
| Looping/gating logic in body | REMOVED — belongs in programmatic features |
| `name:` in frontmatter | REMOVED — name comes from filename |
| L1 agents | REMOVED — L1 deleted, only L0 + L2 |

## Downstream Phase Dependencies

| Phase | Description | Depends on |
|-------|-------------|------------|
| 24.2 | Agent profile quality enforcement | 24 agent list finalized |
| 24.3 | Commands infrastructure | Agent-to-command mapping |
| 24.4 | References + templates system | Agent artifact specs |
| 24.5 | Workflow files architecture | Command/agent mapping |
| 24.6 | Build Hm commands | Commands spec |
| 24.7 | Primitives asset schema | Install/extract design |
| 24.8 | Primitives install/extraction | Asset schema |
| 24.9 | Bootstrap init flow | Install process |

## OpenCode Schema Reference (Validated 2026-05-26)

Source: opencode.ai/docs/agents

**Valid fields for agent markdown files:**
- `description` (required) — one sentence role, one sentence artifact, one sentence spawn condition
- `mode` — `primary`, `subagent`, or `all` (default: `all`)
  - `all` = can be both primary (Tab cycle) and subagent (@ invoke)
  - `primary` = only in Tab cycle
  - `subagent` = only via @ invoke or task tool
- `hidden: true` — hides from @ autocomplete menu (only applies to `subagent` mode)
- `temperature` — 0.0-1.0 (runtime override, not in shipped file)
- `steps` — max agentic iterations (runtime override)
- `permission` — fine-grained tool control (runtime override via orchestrator)
- `model` — model override (runtime override)
- `color` — hex color or theme token
- `disable: true` — disable agent
- `top_p` — response diversity

**Deprecated:** `tools` field (use permission instead)
