# QA Discovery Playbook

Last Updated: 2026-03-01
Scope: requirement clarification before intake/spec promotion

## Purpose

Provide a deterministic framework for brainstorming and QA-oriented discovery so user pain and requirements are clarified before architecture/build stages.

## Inputs

- user intent (build_new, extend, improve, learn, fix_broken, audit_health)
- user maturity level (L0-L3)
- input length band (short, medium, long)

## Question Groups

1. problem_pain
   - identify the core pain and affected actors
2. scope_boundaries
   - define what is in and out of scope
3. success_and_failures
   - define acceptance signals and failure modes
4. discovery_unknowns
   - expose assumptions and blocking unknowns
5. qa_verification
   - define required evidence and verification method

## Required Answers

The following answers must exist before promotion to intake/spec:

- problem_statement
- primary_user_pain
- in_scope
- out_of_scope
- non_negotiable_constraints
- acceptance_signals
- failure_modes
- verification_evidence

## Promotion Gate

- unresolved_critical must equal 0
- unresolved_minor must be <= 1
- verification_evidence must be explicit (script output, checks, or measurable criteria)

If gate fails, remain in discovery and ask targeted follow-up.

## Follow-up Limits

- L0: 1 follow-up per ambiguity
- L1: 2 follow-ups per ambiguity
- L2: 3 follow-ups per ambiguity
- L3: 2 follow-ups per ambiguity (compact mode)

## Long Input Handling

If input length band is long:

1. summarize input into 3 sections
2. ask user to rank section priority
3. run question groups only against top-priority section first

## Quality Signals

High quality discovery output is:

- testable
- bounded
- free from contradictory constraints
- explicit about acceptance and evidence

Low quality output contains:

- vague goals ("make it better")
- no anti-goals
- no measurable success criteria
- no evidence plan

## Recommended Next Commands

- promotion_allowed = true  -> `/hivefiver-intake`
- promotion_allowed = false -> `/hivefiver-discovery --continue`

## Deterministic Script

Use:

```bash
bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh auto L1 medium
```

The script returns the canonical question pack and control limits.
