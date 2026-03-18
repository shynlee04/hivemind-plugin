# HiveMind Skill Module Evaluation Tracking

**Last updated:** 2026-03-19  
**Status:** Evaluation model authored, execution not started

## 1. Purpose

This file tracks how the skill-module branch will judge whether a pack is ready to draft, ready to branch, ready to stress-test, or ready to promote.

The goal is not to force fake certainty. The goal is to make evaluation visible, comparable, and reusable across packs.

## 2. Evaluation Philosophy

The module uses four complementary lenses:

- quality of activation and routing
- quality of pack content and knowledge delta
- resilience under degraded or mixed-reality context
- safety of packaging and workflow impact

No pack should be considered successful because it “sounds good.” It must survive comparative pressure scenarios.

## 3. Shared Readiness Rubric

| Dimension | Weight | What good looks like |
|-----------|--------|----------------------|
| Trigger clarity | 20 | The right pack activates from realistic prompts without swallowing unrelated work |
| Degree-of-freedom control | 15 | The pack stays broad where uncertainty is real and gets strict only where fragility requires it |
| Branch and route clarity | 15 | Pattern 1, 2, and 3 boundaries are easy to understand and hard to misuse |
| Context-rot defense | 20 | The pack handles drift, pollution, false authority, and degraded sessions without overreacting |
| Cross-framework resilience | 10 | The pack recognizes mixed platform surfaces without blindly inheriting them |
| TDD and eval readiness | 10 | Baselines, pressure scenarios, and pass/fail gates can actually be run |
| Packaging discipline | 10 | References stay shallow, scripts stay safe, names stay stable, and the pack remains non-breaking |

**Total:** 100 points

## 4. Candidate Pack Ledger

| Pack | Role | Stage | Score | Notes |
|------|------|-------|-------|-------|
| `context-intelligence` | Must-load entry pack | planning | not scored | Pack 1 |
| `meta-builder-hivemind` / `hivemind-skill-writer` | Companion authoring and audit pack | planning | not scored | Naming not frozen |
| Delegation branch | Context-aware delegated-session branch | planning | not scored | Should stay Pattern 2 |
| Workflow coordination branch | Hierarchy and workflow branch | planning | not scored | Depends on Pack 1 terminology |
| Context rot recovery branch | Recovery and contamination branch | planning | not scored | Depends on rot model acceptance |

## 5. Pressure-Test Lanes

| Lane | Why it exists | Evidence type |
|------|---------------|---------------|
| Baseline no-skill | Show the current failure, drift, or confusion mode without the pack | qualitative + outcome notes |
| With-pack run | Show what changes when the pack is available | qualitative + outcome notes |
| Delegated-session stress | Test main-session vs subagent routing and scope clarity | comparative |
| Mid-session degradation stress | Test post-tool, post-cancel, or late-session continuation | comparative |
| Pollution stress | Test false authority, stale docs, or conflicting emitters | comparative |
| Cross-framework stress | Test mixed platform directories and mirrored surfaces | comparative |
| Skill-judge pass | Score knowledge delta, anti-pattern quality, and description quality | scored review |

## 6. Planned Scenario Matrix

| Scenario ID | Situation | Primary pack under test | Expected outcome |
|-------------|-----------|-------------------------|------------------|
| CI-01 | Fresh front-facing session | `context-intelligence` | Broad entry routing without unnecessary depth |
| CI-02 | Delegated subagent with partial context | `context-intelligence` + delegation branch | Delegated status becomes explicit and bounded |
| CI-03 | Mid-session continuation after interruption | `context-intelligence` | Latest trusted user intent is re-anchored |
| CI-04 | Polluted governance signal from nested docs | `context-intelligence` + recovery branch | Suspect authority is downgraded, not blindly trusted |
| CI-05 | Mixed platform surfaces in one repo | `context-intelligence` | OpenCode-first posture with explicit cross-platform awareness |
| MB-01 | User wants to write a new HiveMind pack | companion pack | Guidance stays HiveMind-specific without becoming generic skill-writing fluff |
| MB-02 | User wants to audit or consolidate packs | companion pack + scoring lane | Audit route stays systematic and non-destructive |

## 7. Pack Promotion Gates

### Gate A: Draft Readiness

- The pack has a clear role in the Pattern 1 / 2 / 3 system.
- Naming is stable enough to avoid accidental forked variants.
- The pack body can be kept concise enough to remain load-attractive.

### Gate B: Evaluation Readiness

- At least one baseline scenario exists.
- At least one with-pack scenario exists.
- Expected failures and expected gains are explicit.

### Gate C: Promotion Readiness

- `context-intelligence` reaches at least 80/100.
- The pack passes delegated-session stress and at least one pollution-stress scenario.
- The pack does not require contradictory or duplicate companion loading.

### Gate D: Companion Pack Start

- Pack 1 naming is accepted.
- Pack 1 branch language is accepted.
- The companion pack boundary is explicit and non-overlapping.

## 8. External Evaluation Anchors

| Reference | What it contributes |
|-----------|---------------------|
| `writing-skills` | RED -> GREEN -> REFACTOR loop for skill behavior |
| `skill-judge` | Detailed scoring lens for knowledge delta, anti-patterns, and discovery quality |
| `skill-creator` | Draft, test prompt, and iterative refinement discipline |

## 9. Evaluation Notes

- Evaluation should be comparative, not purely descriptive.
- A pack that helps in one clean scenario but fails in delegated or polluted scenarios is not ready for promotion.
- A pack that is technically correct but too large or too rigid still fails the module’s purpose.
