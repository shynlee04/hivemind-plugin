# Perspective Rubrics

Contextual activation rules and evaluation rubrics for PM, Architect, and Dev lenses.

## Activation Rules

Determine the active lens from the gate context provided by the calling workflow:

```text
GATE_CONTEXT from caller
  ├─ "code-review"           → Dev (primary) + Architect (secondary)
  ├─ "phase-audit"           → Architect (primary) + PM (secondary)
  ├─ "milestone-verification"→ PM (primary) + Architect (secondary)
  ├─ "integration-check"     → Architect (primary) + Dev (secondary)
  └─ "deployment-readiness"  → All three lenses sequentially
```

Apply primary lens first. Apply secondary lens as cross-check. For deployment readiness, apply PM → Architect → Dev in order; any lens FAIL blocks the gate.

## PM Lens

**Focus:** Deliverable completeness, scope retention, stakeholder value.

### Evaluation Criteria

| Criterion | PASS | FAIL |
|-----------|------|------|
| Deliverable completeness | Every SPEC requirement has a deliverable artifact | Deliverable is missing for a locked requirement |
| Scope retention | No features built outside SPEC scope without ADR | Code implements behaviors not in SPEC |
| Acceptance coverage | All ACs have verifiable outcomes | AC exists without verification method |
| Stakeholder value | Each requirement maps to a user/system need | Requirement serves no identified stakeholder |
| Milestone alignment | Implementation fits declared milestone scope | Implementation spans beyond milestone boundary |

### PM Rubric Scoring

| Score | Meaning |
|-------|---------|
| 5 | All deliverables present, scope tight, ACs fully verifiable |
| 4 | All deliverables present, minor scope questions |
| 3 | Most deliverables present, one gap requiring clarification |
| 2 | Multiple deliverables missing or scope significantly exceeded |
| 1 | Majority of requirements lack deliverables |

### PM Red Flags

- Requirements added during implementation without SPEC update
- Acceptance criteria that cannot be demonstrated to stakeholders
- Milestone scope creep (implementing "nice-to-haves" not in SPEC)
- Value delivery blocked by implementation gaps

## Architect Lens

**Focus:** Traceability, interface contracts, structural compliance, gap analysis.

### Evaluation Criteria

| Criterion | PASS | FAIL |
|-----------|------|------|
| Traceability integrity | Forward and backward trace complete for all requirements | Orphan artifacts or requirements exist |
| Interface matching | All documented interfaces exist and match signatures | Interface divergence between SPEC and code |
| Structural compliance | Code structure follows SPEC architecture constraints | Code violates declared architecture rules |
| Gap analysis | No HIGH severity gaps in gap matrix | HIGH severity gaps unresolved |
| Dependency correctness | Dependencies match SPEC dependency list | Undocumented dependencies introduced |

### Architect Rubric Scoring

| Score | Meaning |
|-------|---------|
| 5 | Full bidirectional traceability, zero gaps, interfaces exact |
| 4 | Full traceability, minor interface differences documented |
| 3 | One HIGH gap or trace break requiring resolution |
| 2 | Multiple trace breaks or interface mismatches |
| 1 | Traceability matrix unreliable, significant architectural drift |

### Architect Red Flags

- Circular dependencies not documented in SPEC
- Interface contracts changed without SPEC amendment
- Missing error handling paths that SPEC requires
- Orphan modules with no requirement origin

## Dev Lens

**Focus:** Interface contracts, testability, runtime behavior, code quality.

### Evaluation Criteria

| Criterion | PASS | FAIL |
|-----------|------|------|
| Contract implementation | All interface contracts implemented as documented | Method signatures differ from SPEC |
| Test coverage | Every requirement has passing test cases | Requirements without test coverage |
| Runtime compliance | Observable behavior matches SPEC success criteria | Runtime behavior diverges from SPEC |
| Code quality | Code follows project style rules (no `any`, JSDoc, <500 LOC) | Code violates declared quality standards |
| Error handling | All SPEC error conditions handled correctly | Error conditions missing or incorrectly handled |

### Dev Rubric Scoring

| Score | Meaning |
|-------|---------|
| 5 | All contracts implemented, tests pass, quality rules met |
| 4 | All contracts implemented, minor quality issues |
| 3 | One contract mismatch or test gap |
| 2 | Multiple contract mismatches or missing tests |
| 1 | Implementation does not match SPEC contracts |

### Dev Red Flags

- Test assertions that check implementation details, not behavior
- Mock-heavy tests that bypass actual code paths
- Missing edge case tests for SPEC boundary conditions
- `// TODO` or `// FIXME` comments in production code paths

## Cross-Lens Conflicts

When lenses produce conflicting evaluations:

| Conflict | Resolution |
|----------|------------|
| PM says PASS, Dev says FAIL | FAIL wins — implementation gaps block delivery |
| Architect says PASS, PM says FAIL | FAIL wins — scope issues indicate requirements problem |
| Dev says PASS, Architect says FAIL | FAIL wins — structural issues indicate architectural problem |
| Only secondary lens FAIL | WARN — document finding, allow pass with documented concern |

## Deployment Readiness Sequence

For deployment readiness context, apply lenses in order:

```text
PM Lens (deliverable check)
  └─ PASS → Architect Lens (structural check)
              └─ PASS → Dev Lens (implementation check)
                          └─ PASS → ALL CLEAR
                          └─ FAIL → STOP
              └─ FAIL → STOP
  └─ FAIL → STOP
```

Each lens produces its own evidence section in the compliance report. All three sections must be present for deployment readiness evaluation.
