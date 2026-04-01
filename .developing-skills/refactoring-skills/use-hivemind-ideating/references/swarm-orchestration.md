# Swarm Orchestration

Active in **Phase 6** of `use-hivemind-ideating` SKILL.md. Multi-wave investigation for complex ideas that require parallel deep-dives.

## Table of Contents

- Wave Definitions
- Gate Between Waves
- Agent Dispatch
- Synthesis
- When to Trigger
- Anti-Patterns

## Wave Definitions

### Wave 1: Investigate

**Purpose:** Map the problem space. Understand what exists, what's broken, what's possible.

| Aspect | Detail |
|--------|--------|
| **Agents** | 2-3 `hivexplorer` agents with bounded slices |
| **Input** | Context brief + confirmed approach from Phase 2 |
| **Output** | Findings per slice: current state, gaps, risks |
| **Duration** | Single dispatch cycle |

**Bounded Slices for Wave 1:**
- Slice A: Codebase structure relevant to the feature
- Slice B: Existing patterns and similar implementations
- Slice C: Constraint and dependency mapping

### Wave 2: Research & Plan

**Purpose:** Based on Wave 1 findings, research solutions and generate implementation options.

| Aspect | Detail |
|--------|--------|
| **Agents** | 2-3 agents: mix of `hivexplorer` (research) and `hiveq` (validation) |
| **Input** | Wave 1 synthesized findings |
| **Output** | Research results, feasibility assessment, plan options |
| **Duration** | Single dispatch cycle |

**Bounded Slices for Wave 2:**
- Slice A: External pattern research (MCP tools)
- Slice B: Internal feasibility validation
- Slice C: Risk assessment and mitigation options

### Wave 3: Validate

**Purpose:** Cross-check Wave 2 plans against Wave 1 findings. Final feasibility gate.

| Aspect | Detail |
|--------|--------|
| **Agents** | 1-2 `hiveq` agents for validation |
| **Input** | Wave 2 plans + Wave 1 raw findings |
| **Output** | Validated plan with confidence score |
| **Duration** | Single dispatch cycle |

**Validation Checks:**
- Do plans address all Wave 1 gaps?
- Are Wave 2 assumptions grounded in Wave 1 evidence?
- Is the complexity estimate realistic?

## Gate Between Waves

Each wave has a gate that must pass before the next wave begins.

### Wave 1 → Wave 2 Gate

| Check | Pass Condition |
|-------|---------------|
| All slices returned | Every dispatched agent produced output |
| Findings are structured | Each slice has: current state, gaps, risks |
| No critical unknowns | All "I don't know" items have follow-up plans |
| Synthesis complete | Findings merged into coherent problem space map |

### Wave 2 → Wave 3 Gate

| Check | Pass Condition |
|-------|---------------|
| Research is graded | Evidence graded per `cross-stack-research.md` |
| Plans are comparable | ≥2 options with trade-off analysis |
| Feasibility assessed | Each plan has complexity + risk estimate |
| No blocked routes | All plans have a viable path forward |

### Wave 3 → Phase 7 Gate

| Check | Pass Condition |
|-------|---------------|
| Validation passed | Plan survives cross-check against Wave 1 |
| Confidence score assigned | Numeric confidence (0-100) with rationale |
| Gaps documented | Known limitations explicitly listed |

## Agent Dispatch

### Bounded Slice Rules

1. **Each agent gets ONE slice.** Never combine multiple concerns in one agent.
2. **Slices are independent.** No agent depends on another agent's runtime output within the same wave.
3. **Slice scope is ≤5 files or one concern domain.** Larger scopes must be split.
4. **Every agent gets a return contract.** What it must produce and in what format.

### Dispatch Format

```
Wave [N] — Agent [X/Y]
  Description: [What to investigate/research/validate]
  Scope: [Bounded file paths or concern domain]
  Constraints: [Read-only, time limit, specific questions to answer]
  Return Contract: [Expected output format]
```

## Synthesis

After each wave, synthesize findings before the next wave.

### Synthesis Format

```markdown
## Wave [N] Synthesis
**Date:** [ISO 8601]
**Agents dispatched:** [count]
**Agents returned:** [count]

### Key Findings
1. [Finding 1 — with evidence reference]
2. [Finding 2 — with evidence reference]
3. [Finding 3 — with evidence reference]

### Surprises
- [Unexpected finding that changes the problem space]

### Open Questions
- [Question that needs Wave N+1 to answer]

### Confidence
[0-100] — [rationale]
```

### Merge Rules

| Scenario | Action |
|----------|--------|
| Findings agree | Merge into single stronger finding |
| Findings conflict | Log both — flag for Wave 3 validation |
| Finding is novel | Add to key findings — no prior context to merge with |
| Agent failed to return | Note the gap — does it block the gate? |

## When to Trigger

Swarm mode is expensive. Only trigger when complexity warrants it.

### Complexity Threshold

| Signal | Swarm? |
|--------|--------|
| Feature touches >3 concern domains | ✅ Yes |
| Unknown external dependencies | ✅ Yes |
| Multiple valid approaches need parallel evaluation | ✅ Yes |
| Single-file change, known pattern | ❌ No — skip to Phase 7 |
| Already validated by Phase 4 review | ❌ No — Phase 5 is sufficient |
| User explicitly requests deep investigation | ✅ Yes |

### Cost/Benefit

Each wave adds ~2-3 turns of overhead. For simple features, this overhead exceeds the value. Default to non-swarm path unless the feature genuinely requires multi-perspective investigation.

## Anti-Patterns

| # | Anti-Pattern | What Happens | Correct Behavior |
|---|--------------|--------------|------------------|
| 1 | Skip wave gates | Bad input propagates to next wave, compounding errors | Enforce gate checks between every wave |
| 2 | Combine slices in one agent | Agent context overloaded, shallow analysis | One slice per agent — keep scope bounded |
| 3 | Run all 3 waves for simple ideas | Massive overhead for trivial features | Check complexity threshold first |
| 4 | Skip synthesis between waves | Next wave starts with raw, unmerged noise | Always synthesize before dispatching next wave |
| 5 | Let agents share state within a wave | Race conditions, inconsistent findings | Slices must be independent within a wave |
