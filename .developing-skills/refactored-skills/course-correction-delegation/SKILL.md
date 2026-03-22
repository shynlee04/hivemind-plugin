---
name: course-correction-delegation
description: |
  Domain-specific delegation for course correction. Use when: delegating debug loops (reproduce→narrow→contain→evidence), delegating refactor work (assess→plan→execute→verify), delegating architecture audits (scan→analyze→recommend), or applying course correction patterns when initial delegation fails. Extends use-hivemind-delegation with domain-specific packet fields and escalation paths.
---

# course-correction-delegation

Domain-specific delegation for course correction workflows. Governs debug loop delegation, refactor delegation, architecture audit delegation, and cross-domain transitions.

## Purpose

- Delegate debug loops with reproduce→narrow→contain→evidence phases
- Delegate refactor work with assess→plan→execute→verify phases
- Delegate architecture audits with scan→analyze→recommend phases
- Handle course correction when initial delegation fails
- Manage cross-domain transitions (debug→refactor, audit→refactor, refactor→debug)

## Use This For

- Debug loops delegated to subagents
- Refactor work delegated with explicit phase boundaries
- Architecture audits delegated for scan and analysis
- Course correction when standard delegation produces wrong results
- Cross-domain escalation (debug needs refactor, audit finds issues)

## Do Not Use This For

- Single-pass delegation — use `use-hivemind-delegation`
- TDD loops — use `tdd-delegation`
- Research or evidence collection — use `research-delegation`
- Pure code scanning — use `hivemind-codemap` directly

## Prerequisites

- `use-hivemind-delegation` MUST be loaded first — this skill extends it with domain fields
- Domain-specific skills recommended for mechanics: `hivemind-system-debug`, `use-hivemind-detox-refactor`, `hivemind-codemap`

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Base delegation protocol — this skill extends it |
| `hivemind-gatekeeping-delegation` | Loop governance — used for domain loop iteration control |
| `hivemind-system-debug` | Debug mechanics — debug delegation uses debug methodology |
| `use-hivemind-detox-refactor` | Refactor mechanics — refactor delegation uses refactor methodology |
| `hivemind-codemap` | Audit mechanics — audit delegation uses codemap methodology |
| `tdd-delegation` | TDD fallback — if refactor breaks tests, transition to TDD delegation |

## Debug Delegation

Pattern: `reproduce → narrow → contain → evidence`

### Phase Breakdown

| Phase | Goal | Child Output |
|-------|------|-------------|
| Reproduce | Confirm bug is real and reproducible | Repro steps, failing behavior, environment |
| Narrow | Isolate the failing component | Hypotheses ranked, failing file/function identified |
| Contain | Prevent the bug from spreading | Fix boundary, affected scope, blast radius |
| Evidence | Prove the fix works | Before/after behavior, test output, regression prevention |

### Debug Packet Fields

| Field | Type | Purpose |
|-------|------|---------|
| `debug_phase` | `reproduce \| narrow \| contain \| evidence` | Current debug phase |
| `failing_behavior` | string | What goes wrong |
| `repro_steps` | string[] | Steps to reproduce |
| `hypotheses` | string[] | Ranked hypotheses |

Cross-reference: `hivemind-system-debug` for debug methodology.

## Refactor Delegation

Pattern: `assess → plan → execute → verify`

### Phase Breakdown

| Phase | Goal | Child Output |
|-------|------|-------------|
| Assess | Understand current state | Code smells, dependencies, risk areas |
| Plan | Design the refactor | Refactor steps, seam inventory, rollback plan |
| Execute | Apply changes | Modified files, diff summary |
| Verify | Confirm behavior preserved | Test output, type check, no regressions |

### Refactor Packet Fields

| Field | Type | Purpose |
|-------|------|---------|
| `refactor_phase` | `assess \| plan \| execute \| verify` | Current refactor phase |
| `seam_inventory` | string[] | Available refactor seams |
| `risk_assessment` | string | Risk level and mitigation |

Cross-reference: `use-hivemind-detox-refactor` for refactor methodology.

## Architecture Audit Delegation

Pattern: `scan → analyze → recommend`

### Phase Breakdown

| Phase | Goal | Child Output |
|-------|------|-------------|
| Scan | Map the architecture | Structure, dependencies, entry points |
| Analyze | Identify issues | Hotspots, violations, debt areas |
| Recommend | Suggest improvements | Prioritized recommendations with evidence |

### Audit Packet Fields

| Field | Type | Purpose |
|-------|------|---------|
| `audit_phase` | `scan \| analyze \| recommend` | Current audit phase |
| `scan_scope` | string[] | Files/dirs to scan |
| `analysis_focus` | string | What to look for |

Cross-reference: `hivemind-codemap` for scan methodology.

## Course Correction Patterns

When initial delegation fails or produces wrong results, transition to the appropriate domain.

### Debug → Refactor Transition

When debug reveals the bug is actually a structural problem:
1. Stop debug loop — the bug is a symptom, not the cause
2. Package debug findings as refactor assessment input
3. Start refactor delegation from `assess` phase
4. Reference debug evidence in refactor packet

### Audit → Refactor Transition

When audit identifies actionable issues:
1. Complete audit `recommend` phase
2. Package recommendations as refactor scope
3. Start refactor delegation from `plan` phase
4. Each recommendation becomes a refactor task

### Refactor → Debug Transition

When refactor breaks existing behavior:
1. Stop refactor `execute` phase
2. Identify what broke via test output
3. Start debug delegation from `reproduce` phase
4. Fix the break before resuming refactor

## Domain-Specific Escalation

| From | To | Trigger |
|------|----|---------|
| Debug | Codemap | Bug scope exceeds single file — need architecture context |
| Refactor | Audit | Refactor scope unclear — need architecture assessment |
| Audit | Research | Audit needs external pattern references |
| Any | User | Domain escalation fails or requires business decision |

### Escalation Protocol

1. Current domain child returns `status: "blocked"` with `escalation_target`
2. Orchestrator reads the return evidence
3. New delegation packet inherits relevant context from prior domain
4. Cross-domain evidence is preserved — not discarded

## Anti-Patterns

| Anti-Pattern | Why Dangerous |
|--------------|---------------|
| Debugging without reproduce phase | Fix may not address the real bug |
| Refactoring without assess phase | May refactor the wrong thing |
| Auditing without scan phase | Recommendations lack evidence |
| Skipping domain transitions | Structural bugs treated as surface bugs |
| Losing evidence across domain transitions | New domain starts blind — duplicate work |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/debug-delegation.md` | Debug delegation phases and mechanics |
| `references/refactor-delegation.md` | Refactor delegation phases and mechanics |
| `references/architecture-audit-delegation.md` | Audit delegation phases and mechanics |
| `references/domain-escalation.md` | Cross-domain transition patterns |
| `templates/debug-delegation-packet.md` | Debug packet JSON template |
| `templates/refactor-delegation-packet.md` | Refactor packet JSON template |
| `templates/audit-delegation-packet.md` | Audit packet JSON template |
| `tests/course-correction.md` | Course correction scenario with validation |

## Independence Rules

- This package extends `use-hivemind-delegation` — it does not replace it
- It may be selected directly or composed with `hivemind-gatekeeping-delegation` for loop control
- Domain artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime
