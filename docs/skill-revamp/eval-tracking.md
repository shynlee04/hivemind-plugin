# Skill Revamp Evaluation Tracking

**Last updated:** 2026-03-19  
**Status:** Evaluation model drafted

## 1. Purpose

This file tracks how the skill revamp will decide whether a pack is ready to draft, ready to branch, or ready to promote.

## 2. Shared Rubric

| Dimension | Weight | What good looks like |
|-----------|--------|----------------------|
| Trigger clarity | 20 | The right pack activates from realistic prompts without swallowing unrelated work |
| Degree-of-freedom control | 15 | The pack stays flexible where needed and strict where fragility requires it |
| Branch clarity | 15 | Pattern 1, 2, and 3 boundaries are obvious |
| Context-rot defense | 20 | The pack behaves well under degraded, polluted, or conflicting context |
| Cross-framework resilience | 10 | The pack recognizes mixed surfaces without inheriting them blindly |
| TDD and eval readiness | 10 | Baselines and pressure scenarios are runnable |
| Packaging discipline | 10 | References stay shallow, names stay stable, scripts stay safe |

**Total:** 100

## 3. Candidate Pack Ledger

| Pack | Role | Stage | Score | Notes |
|------|------|-------|-------|-------|
| `context-intelligence` | Pack 1 entry pack | planning | not scored | must-load target |
| `meta-builder-hivemind` / `hivemind-skill-writer` | companion pack | planning | not scored | naming not frozen |
| delegation branch | Pattern 2 | planning | not scored | delegated-session lane |
| workflow coordination branch | Pattern 2 | planning | not scored | hierarchy lane |
| context rot recovery branch | Pattern 3 | planning | not scored | specialist recovery lane |

## 4. Pressure-Test Lanes

| Lane | Why it exists |
|------|---------------|
| Baseline no-skill | Show current failure or confusion mode |
| With-pack run | Show the improvement with the pack available |
| Delegated-session stress | Test child-session scope clarity |
| Mid-session degradation stress | Test resumed, interrupted, and late-session behavior |
| Pollution stress | Test false authority, stale docs, or conflicting emitters |
| Cross-framework stress | Test mixed platform directories and mirrored surfaces |
| Skill-judge pass | Score knowledge delta and anti-pattern quality |

## 5. Planned Scenarios

| Scenario | Situation | Expected result |
|----------|-----------|-----------------|
| CI-01 | Fresh front-facing session | Broad entry routing without unnecessary depth |
| CI-02 | Delegated subagent | Delegated status becomes explicit and bounded |
| CI-03 | Interrupted or resumed session | Latest trusted human intent is re-anchored |
| CI-04 | Polluted governance signal | Suspect authority is downgraded, not obeyed blindly |
| CI-05 | Mixed platform surfaces | OpenCode-first stance with cross-platform awareness |
| MB-01 | User wants to write a HiveMind pack | Companion pack guidance stays HiveMind-specific |
| MB-02 | User wants to audit or consolidate packs | Audit lane stays systematic and non-destructive |

## 6. Promotion Gates

### Pack Draft Readiness

- Role is clear in the Pattern 1 / 2 / 3 system.
- Naming is stable enough to avoid forks.
- The pack can stay concise enough to remain load-attractive.

### Evaluation Readiness

- At least one baseline scenario exists.
- At least one with-pack scenario exists.
- Expected gains and failure modes are explicit.

### Promotion Readiness

- `context-intelligence` reaches at least 80/100.
- Delegated-session stress passes.
- At least one pollution-stress scenario passes.

## 7. Evaluation Notes

- Evaluation is comparative, not purely descriptive.
- A pack that works only in clean sessions is not ready.
- A pack that is technically correct but too large or too rigid still fails the revamp’s purpose.
