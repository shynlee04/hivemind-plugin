# AUDIT-04 Cycle 3 — Stage 2 DESIGN

**Cycle ID**: 04-skill-03

## 1. Source inventory

- `assets/skills/hm-l2-phase-loop/SKILL.md` (162 LOC) — phase-specific mechanics (durable phase cursor, issue severity, exit criteria, stall detection). F01.
- `assets/skills/iterative-loop/SKILL.md` (270 LOC) — framework-agnostic loop discipline (5-phase protocol, decision matrix, max-iteration guard, checkpoint recovery, anti-patterns, loop contract template). F03.

## 2. Composition strategy

### 2.1 Foundation (from `iterative-loop`)

Adopt wholesale:
- 5-phase protocol (Setup → Execute → Verify → Gate → Exit)
- Decision Matrix (loop vs no-loop classification)
- Max-Iteration Guard (with override protocol)
- Checkpoint Recovery (what to save, recovery procedure)
- Loop Contract Template
- Anti-Patterns (8 from iterative-loop; consolidated with 4 from phase-loop)

### 2.2 Mechanics layer (from `hm-l2-phase-loop`)

Adopt as the phase-specific instantiation:
- Durable Phase Cursor schema
- Issue Severity Levels (PASSED / INFO / WARNING / BLOCKER)
- Exit Criteria (PASSED marker, INFO-only, max iterations)
- Stall Detection (issue_count >= prev_issue_count)
- Validation Checklist (extended to include cursor + termination predicates)

### 2.3 Hivemind binding layer (NEW)

- `delegation-status` for orchestrator polling
- `hivemind-trajectory` for loop log audit
- `delegate-task` for re-dispatch on failure
- `hivemind-sdk-supervisor` for session lifecycle
- Cursor at `.hivemind/state/loops/<phase_id>.yaml`

### 2.4 GSD Compatibility (G.8)

`## GSD Compatibility` mapping `gsd-execute-phase` → `hm-loop-phase`.

### 2.5 Consumed-by re-binding

| Old | New |
|---|---|
| `hm-l2-guardian` | `hm-guardian` (phantom ABOLISH; keep for traceability) |
| (add) | `hm-operator` (phantom ABOLISH) |
| (add) | `hm-executor` |
| (add) | `hm-coord-loop` (C1 output) |

### 2.6 Items REMOVED

- Cross-reference to `hm-planning-persistence` (abolished per 04-03 §3.5)
- `layer: "2"` frontmatter (F01 implicit)
- Cross-reference to `hm-phase-execution` (separate skill, separate cycle)

## 3. New SKILL.md skeleton

- frontmatter with `consumed-by` (4 names, all post-rename)
- `## GSD Compatibility` (G.8)
- `## Overview`, `## When This Skill Loads`, `## Iron Law`, `## Decision Matrix`
- `## Loop Protocol (5 Phases)`
- `## Durable Phase Cursor`, `## Issue Severity Levels`, `## Exit Criteria`, `## Stall Detection`
- `## Max-Iteration Guard`, `## Checkpoint Recovery`, `## Loop Contract Template`
- `## Hivemind Runtime Bindings`
- `## Anti-Patterns` (consolidated 13 patterns)
- `## Self-Correction`, `## Cross-References`

## 4. Length

~280 lines (under 500 hard cap).

## 5. Naming validation

```bash
bash assets/.hivemind-config/validate-name.sh "hm-loop-phase" skill
# Expected: exit 0
```

## 6. Cross-ref sweep plan (Stage 4)

18 unique files: 1 agents (hm-l0-orchestrator), 6 skills (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs, wave-execution), 4 .hivemind/agents (hm-l0/l1-coordinator, hm-l2-guardian/operator), 4 .hivemind/skills (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs).

Mirror deletion of `assets/.hivemind/skills/hm-l2-phase-loop/` and `assets/.hivemind/skills/iterative-loop/`.

## 7. Gate plan

Same 3-gate triad: lifecycle-integration (12/12), spec-compliance (5-realm ≥12/15), evidence-truth (L1 runtime).

## 8. Done when

- [x] 6/6 sub-sections.
- [x] Foundation + mechanics + Hivemind + GSD + consumed-by + removals.
- [x] New SKILL.md written.
- [x] Naming plan.
- [x] Sweep plan (18 files).
- [x] Gate plan.
