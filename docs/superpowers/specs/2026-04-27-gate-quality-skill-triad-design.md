# Gate Quality Skill Triad Design

**Date:** 2026-04-27
**Status:** Approved
**Author:** Hivefiver (orchestrated via brainstorming skill)
**Scope:** Internal quality gate skills for harness lifecycle evaluation

---

## 1. Purpose

Create 3 independent evaluation framework skills (`gate-*`) that audit and verify implementations against harness lifecycle criteria. These are INTERNAL development tools — not shipping to end users. They activate during every gatekeeping workflow related to the Hivemind harness project and OpenCode platform work.

## 2. Design Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary purpose | Audit + Verification | Quality gate system first, implementation guidance secondary |
| Structure | Layered Triad (3 skills) | Evidence → Spec → Lifecycle depth progression |
| Prefix | `gate-*` | Distinguishes from `hm-*` production skills |
| Integration | Independent frameworks | Own evaluation criteria, doesn't call `hm-*` skills |
| Perspectives | Contextual activation | Detects who/when, activates relevant PM/Architect/Dev lens |
| Third-party synthesis | Top 3 from skills.sh per skill | Ingest-transform-adopt into `gate-*` references |

## 3. The Triad

### 3.1 `gate-lifecycle-integration`

**Evaluates:** Does an implementation correctly participate in the harness lifecycle?

Checklist dimensions:
- Lifecycle initiation (hook subscriber, tool handler, event observer, state writer)
- Actor hierarchy (main/sub session boundaries, role-awareness)
- Event-driven wiring (CQRS correctness, proper event subscription)
- Classification fit (hard `src/` vs soft `.opencode/` vs state `.hivemind/`)
- OpenCode surface (SDK interface correctness, API surface coverage)

**Pattern:** Process (~250 lines SKILL.md + references/)
**Triggers during:** Phase audits, code reviews of new modules, milestone integration checks

### 3.2 `gate-spec-compliance`

**Evaluates:** Does the built implementation match what was specified?

Checklist dimensions:
- Spec-to-code traceability (requirement → implementation mapping)
- Interface contract (signatures match documentation)
- Behavioral compliance (runtime matches spec success criteria)
- Acceptance criteria (all testable and tested)
- Gap detection (spec-without-code, code-without-spec)

**Pattern:** Process (~250 lines SKILL.md + references/)
**Triggers during:** Phase completion reviews, milestone audits, PR reviews against PLAN.md

### 3.3 `gate-evidence-truth`

**Evaluates:** Is there sufficient evidence that the implementation actually works?

Checklist dimensions:
- Evidence hierarchy (live > continuity-from-live > mock > summary)
- Runtime proof (live OpenCode session evidence)
- Test integrity (integration surface vs mocked internals)
- Completion honesty (evidence-backed completion claims)
- Regression awareness (cross-phase impact checks)

**Pattern:** Process (~250 lines SKILL.md + references/)
**Triggers during:** Verification gates, deployment readiness, "prove it works" moments

## 4. Cross-Skill Routing

```
gate-lifecycle-integration → FAIL? → STOP (redesign needed)
                          → PASS → gate-spec-compliance
                                      → FAIL? → STOP (implementation gap)
                                      → PASS → gate-evidence-truth
                                                  → FAIL? → STOP (need runtime proof)
                                                  → PASS → GATE PASSED
```

Each skill independently usable. Composes into full pipeline when needed.

## 5. Contextual Perspective Activation

| Context | Primary Lens | Secondary Lens | Evaluation Emphasis |
|---------|-------------|----------------|-------------------|
| Code review | Dev | Architect | Code quality, interface correctness |
| Phase audit | Architect | PM | Architecture integrity, scope retention |
| Milestone verification | PM | Architect | Deliverable completeness, extensibility |
| Integration check | Architect | Dev | Cross-module wiring, SDK compliance |
| Deployment readiness | All three | — | Full evaluation |
| New feature review | All three | — | Lifecycle fit + spec match + evidence |

## 6. Relationship to Existing Ecosystem

- Does NOT replace `hm-*` production skills
- Does NOT call `hm-*` skills (independent criteria)
- Does NOT ship to end users (internal dev team only)
- Lives alongside `hm-*` in `.opencode/skills/` with `gate-*` prefix
- Activates in gatekeeping workflows identified in AGENTS.md skill router

## 7. Third-Party Ingestion Strategy

For each skill, ingest top 3 relevant skills from skills.sh:
- Extract SKILL.md, references/, scripts/, templates/
- Transform to align with harness lifecycle evaluation context
- Adopt patterns that improve audit/verification capability
- Store adopted patterns in skill references/

Target search terms:
- "code audit framework", "quality gate checklist", "runtime verification"
- "spec compliance", "acceptance testing", "evidence-based review"
- "integration testing", "lifecycle evaluation", "platform audit"

## 8. Quality Target

All 3 skills must pass HMQUAL-01 through HMQUAL-08:
- HMQUAL-01: Trigger accuracy (no false positives, clear activation conditions)
- HMQUAL-02: Body depth (executable guidance, decision gates, anti-patterns)
- HMQUAL-03: 6-NON defence (audit, contextual, cycles, hierarchy, ecosystem, systematic)
- HMQUAL-04: Eval coverage (realistic eval bundles with assertions)
- HMQUAL-05: Reference completeness (resolvable references, one-level deep)
- HMQUAL-06: Integration wiring (agent roles, tool contracts, hook behavior)
- HMQUAL-07: Cross-platform (OpenCode-native, Hivemind harness, arbitrary projects)
- HMQUAL-08: Self-correction (retry/rollback, honest handoff, stop rules)

## 9. Implementation Pipeline

```
RESEARCH → SYNTHESIS → DEVELOPMENT → QUALITY → LOOP → PRODUCTION
   ↓           ↓           ↓            ↓        ↓        ↓
 skills.sh   refine      write 3      HMQUAL   fix &     commit &
 + patterns  concept     skills       audit    re-eval   register
```

## 10. File Structure (Per Skill)

```
gate-<name>/
├── SKILL.md                    (~250 lines, Process pattern)
├── references/
│   ├── evaluation-checklist.md (per-dimension audit criteria)
│   ├── perspective-rubrics.md  (PM/Architect/Dev contextual rubrics)
│   ├── anti-patterns.md        (common failures with WHY)
│   └── adopted-patterns.md     (synthesized from third-party skills)
├── evals/
│   └── evals.json              (4+ test scenarios with assertions)
├── scripts/
│   └── run-gate-eval.sh        (deterministic evaluation runner)
└── templates/
    └── gate-report.md          (standardized gate report template)
```
