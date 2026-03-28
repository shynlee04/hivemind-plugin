---
name: hivemind-spec-driven
parent: use-hivemind
description: Spec-driven engineering — from vague requirements to testable specs with acceptance criteria and traceability.
---

<!-- LOAD-POSITION
slot: depth
role: depth
prerequisites: use-hivemind-planning
-->

## Load Position

**Layer: Depth**. Loads after entry router and planning domain skill are in place.

| Constraint | Rule |
|-----------|------|
| Position | Depth layer |
| Load order | After `use-hivemind` and `use-hivemind-planning` |
| Prerequisites | `use-hivemind-planning` |
| Conflict | Requires planning domain skill loaded |

# hivemind-spec-driven

You've got a feature to build. The requirements might be crystal clear or they might be a swamp of contradictions and half-formed ideas. Either way, you need a spec that's testable, traceable, and unambiguous before anyone writes a single line of code. That's what this skill does.

Consolidates: `hivemind-spec-driven` (expanded to full SDE lifecycle).

## Table of Contents

- [Load Position](#load-position)
- [When You Need This](#when-you-need-this)
- [Do Not Use This For](#do-not-use-this-for)
- [The Spec Flow](#the-spec-flow)
- [Requirements Classification](#requirements-classification)
- [Ambiguity Resolution](#ambiguity-resolution)
- [Acceptance Criteria Template](#acceptance-criteria-template)
- [Traceability Matrix](#traceability-matrix)
- [Spec Candidate Format](#spec-candidate-format)
- [Sibling Skills](#sibling-skills)
- [Feature Proposal Format](#feature-proposal-format)
- [Acceptance Criteria Patterns](#acceptance-criteria-patterns)
- [Anti-Patterns](#anti-patterns)
- [Bundled Resources](#bundled-resources)

## When You Need This

- Starting a new feature from scratch
- Requirements are vague, contradictory, or incomplete
- Multiple stakeholders gave conflicting input
- You need acceptance criteria that developers and testers agree on
- You need to prove that every requirement has a matching test

## Do Not Use This For

- Simple, clear, single-task requests — those go straight to execution
- Debug loops or course correction — use `use-hivemind-delegation`
- Refactoring existing code — use `hivemind-refactor`
- Writing tests — delegate to implementation agents after spec is approved

## The Spec Flow

```
Raw Input
    │
    ├── 1. Extract ─── Break into requirement atoms
    │
    ├── 2. Classify ── Sort into 5 buckets
    │
    ├── 3. Map ─────── Clear vs ambiguous vs contradictory
    │
    ├── 4. Clarify ─── MCQ-first loop (max 10 rounds)
    │
    ├── 5. Spec ────── Generate 2-3 candidates with tradeoffs
    │
    ├── 6. Criteria ── Given/When/Then acceptance tests
    │
    └── 7. Trace ───── Build traceability matrix
```

Each step feeds the next. Don't skip ahead. A spec built on unclassified requirements will have gaps. A spec built on ambiguous requirements will be wrong.

## Requirements Classification

Every requirement atom goes into exactly one bucket. Not two. Not "maybe both." Pick one.

| Bucket | What Goes Here | Example |
|--------|---------------|---------|
| **Functional** | What the system does | "User can export data as CSV" |
| **Non-functional** | How well it performs | "Export completes in under 2 seconds for 10k rows" |
| **Integration** | How it connects | "Export triggers webhook to analytics service" |
| **Risk/Compliance** | What could go wrong | "Export must not include PII without consent" |
| **Operations** | How it's deployed and maintained | "Export failures alert on-call via PagerDuty" |

If a requirement spans two buckets, split it. "The export must be fast and secure" is two atoms: one performance, one risk.

## Ambiguity Resolution

For each requirement atom, assess it honestly:

- **Clear** — anyone reading it knows exactly what to build. Add to spec draft.
- **Ambiguous** — there are multiple valid interpretations. Queue for clarification.
- **Contradictory** — it conflicts with another requirement. Register the conflict.

### Clarification Rules

1. **MCQ first.** Give the human 3-4 concrete options before asking for free text. People give better answers when they see the choices.
2. **One question at a time.** Don't dump five questions in one message. Resolve one, then move on.
3. **Block on HIGH-IMPACT ambiguity.** If the answer changes the architecture, you must clarify before proceeding. No exceptions.
4. **Max 10 rounds.** If you can't resolve it in 10 rounds, escalate. The requirement might be unspecifiable as-is.
5. **Show examples.** Abstract explanations confuse people. Concrete examples resolve ambiguity faster than paragraphs of prose.

### Terminal States

| State | Action |
|-------|--------|
| Spec complete | Proceed to acceptance criteria |
| Ambiguity unresolved | BLOCK — continue clarification loop |
| Contradiction detected | Document both sides, escalate to user for resolution |

## Acceptance Criteria Template

Every functional requirement gets at least one acceptance criterion. Use Given/When/Then. No exceptions.

```markdown
### AC-{number}: {requirement title}

**Given** {precondition / initial state}
**When** {action or trigger}
**Then** {expected outcome}
**And** {additional outcome if needed}

**Trace:** REQ-{requirement number}
**Priority:** P0 | P1 | P2
**Test type:** unit | integration | e2e
```

### Rules for Good Criteria

- **Testable.** If you can't write a test for it, it's not a criterion — it's a wish.
- **Atomic.** One assertion per criterion. "The button turns blue AND saves the file AND sends an email" is three criteria.
- **Specific.** "The system responds quickly" is garbage. "The response returns in under 200ms at p95" is a criterion.
- **Independent.** Criteria should not depend on execution order. If they do, split them or add explicit sequencing.

## Traceability Matrix

This is where the rubber meets the road. Every requirement must trace to at least one test. Every test must trace to at least one requirement. Orphans in either direction are defects.

```markdown
| REQ ID | Bucket       | Acceptance Criteria | Test File              | Status    |
|--------|-------------|---------------------|------------------------|-----------|
| REQ-01 | Functional   | AC-01, AC-02        | tests/export.test.ts   | covered   |
| REQ-02 | Non-functional | AC-03            | tests/perf/export.test.ts | covered |
| REQ-03 | Integration  | AC-04              | tests/webhook.test.ts  | covered   |
| REQ-04 | Risk         | AC-05              | —                      | UNCOVERED |
```

### Traceability Rules

1. **REQ without test = UNCOVERED.** This blocks completion. No shipping without test coverage.
2. **Test without REQ = ORPHAN.** Investigate. Either the test is testing the wrong thing, or there's a missing requirement. Fix one or the other.
3. **Trace is live, not static.** Update the matrix as requirements change. A stale traceability matrix is worse than none — it creates false confidence.

## Spec Candidate Format

Produce 2-3 candidates with tradeoffs. Don't just pick one and call it done.

```json
{
  "candidate_id": "spec-{name}-v1",
  "title": "...",
  "requirements": ["REQ-01", "REQ-02", "..."],
  "assumptions": ["..."],
  "tradeoffs": {
    "pros": ["..."],
    "cons": ["..."]
  },
  "rejected_reason": null
}
```

For rejected candidates, fill `rejected_reason` with a one-line explanation of why you didn't pick it. Future-you will thank present-you.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-planning` | Parent domain — this skill feeds specs into planning's decomposition |
| `use-hivemind-tdd` | Downstream — acceptance criteria become test gates |
| `use-hivemind-tdd` | Downstream — traceable requirements drive TDD red phase |

## Feature Proposal Format

Before writing specs, structure the feature proposal using Problem/Solution/Impact from `references/problem-solution-impact.md`:
- **Problem**: What breaks without this feature?
- **Solution**: What approach solves it?
- **Impact**: How do we measure success?

A proposal without evidence in all 3 sections is not ready for spec writing.

## Acceptance Criteria Patterns

Write acceptance criteria in Given/When/Then format from `references/acceptance-criteria-patterns.md`:
- Functional: Given [state], When [action], Then [result]
- Non-functional: Given [state], When [load], Then [threshold]
- Integration: Given [A state], When [call B], Then [B state]

## Anti-Patterns

**You're writing code before the spec is approved.** Stop. Every line you write on ambiguous requirements is a line you'll rewrite. Spec first, code second.

**You're treating "user wants X" as a requirement.** That's an input. A requirement is a classified, unambiguous, testable statement. Extract atoms first.

**You skipped the ambiguity map.** You think the requirements are clear. They're not. You just haven't looked hard enough. Build the map — you'll find surprises.

**Your acceptance criteria say "it works."** That's not a criterion. "Given a CSV with 10k rows, when the user clicks export, then a file downloads within 2 seconds and contains all rows" — that's a criterion.

**You have one spec candidate.** You can't evaluate tradeoffs with a single option. Generate at least two. If you can't think of an alternative, you haven't understood the problem deeply enough.

**Your traceability matrix has orphans.** Tests without requirements are testing something nobody asked for. Requirements without tests are promises nobody's keeping. Clean both sides.

**You're clarifying with open-ended questions.** "What do you want?" gets you "I don't know, something nice." MCQ gets you actionable answers. Use MCQ.

**You classified everything as "functional."** Performance constraints are non-functional. API contracts are integration. Audit requirements are risk. Use all five buckets or your spec has blind spots.

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Acceptance Criteria | `references/acceptance-criteria.md` | Criteria format and quality standards |
| Problem/Solution/Impact | `references/problem-solution-impact.md` | Feature proposal triad with scoring rubrics |
| Acceptance Criteria Patterns | `references/acceptance-criteria-patterns.md` | GWT patterns for functional, non-functional, and integration criteria |
| Traceability Matrix | `references/traceability-matrix.md` | Requirement-to-test traceability mapping |
| Verification Before Completion | `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |
| Spec Template | `templates/spec-template.md` | Template for spec document structure |
| Spec Scenario | `tests/spec-scenario.md` | Test scenario for spec-driven workflow |
