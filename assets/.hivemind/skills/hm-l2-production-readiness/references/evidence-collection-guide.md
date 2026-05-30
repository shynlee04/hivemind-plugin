# Evidence Collection Guide for Production Readiness

## Collection Purpose

Structured protocol for collecting and classifying deployment readiness evidence into the L1-L5 hierarchy recognized by `gate-evidence-truth`. Follow this guide to produce evidence that the terminal gate can consume directly — no rework or reclassification needed.

## Understanding the L1-L5 Hierarchy

`gate-evidence-truth` classifies all evidence into five levels. Production readiness verification must produce evidence at each applicable level:

| Level | Definition | Key Question |
|-------|-----------|-------------|
| **L1** | Live runtime proof — feature exercised in actual operation | "Did we see it WORK in a real (or production-equivalent) environment?" |
| **L2** | Continuity record from real execution | "Is there a machine-verifiable record of it running successfully?" |
| **L3** | Integration test — real boundaries, no mocks | "Do tests exercise the actual system boundaries?" |
| **L4** | Unit test — mocked boundaries acceptable | "Do isolated tests prove the logic works?" |
| **L5** | Documentation — plans, checklists, specs | "Is the design documented and the process recorded?" |

**Critical rule:** L5 alone never passes any gate. You MUST have L3+ evidence for any gate. Deployment gates require L1.

## Protocol: Collect → Classify → Report

### Phase 1: Collect

For each dimension of production readiness, collect ALL available evidence — both positive (passing) and negative (failing):

**Sources of evidence:**

| Dimension | Positive Evidence Sources | Negative Evidence to Watch For |
|-----------|--------------------------|-------------------------------|
| **Changelog** | CHANGELOG.md file with dated entries | Auto-generated "fix stuff" entries; missing breaking changes |
| **Migrations** | Migration test output, staging migration log, rollback test log | Tests that pass locally but not against populated data; mock-only tests |
| **Rollback** | Rollback plan document, staging rollback test output | "Revert the commit" as only plan; untested rollback |
| **Monitoring** | Dashboard screenshots, alert config, health check response | "We'll add monitoring later"; alerts with no thresholds |
| **Compatibility** | API diff, integration tests against old clients | Breaking changes not called out; API changes without version bump |
| **Smoke tests** | Test output against staging, manual test session record | Mock-heavy tests; tests that only hit /health endpoint |
| **Deployment checklist** | Completed checklist with all items marked | Partial checklist; skipped critical items |

**Collection efficiency:** Use existing automation first:
```bash
# Grab recent CI pipeline results
gh run list --limit 5 --json name,conclusion,createdAt --jq '.[]'

# Validate migration reversibility
<your-migration-tool> status  # e.g., prisma migrate status, knex migrate:list

# Check API backward compatibility
git diff main HEAD -- api-spec.yaml openapi.yaml 2>/dev/null

# Verify health check
curl -s https://staging.example.com/health | jq .
```

### Phase 2: Classify

Map each collected artifact to exactly ONE evidence level. Apply these classification rules:

| Rule | Example |
|------|---------|
| If a test mocks the external boundary (database, API, auth), classify as L4 | "Integration test" that mocks `fetch()` → L4 |
| If a record contains session ID, delegation ID, and timestamps from real execution, classify as L2 | Staging migration run captured in `.hivemind/state/` → L2 |
| If a human exercised the feature in a production-equivalent environment and captured output, classify as L1 | Manual smoke test with screenshots and session log → L1 |
| If ambiguous between two levels, classify at the LOWER level | Be conservative — downgrading is safer than inflating |
| Documentation, plans, specs, and checklists are ALWAYS L5 | CHANGELOG.md file → L5; Completed deployment checklist → L5 |

**Never misclassify:**
- A test named "integration" that mocks all external calls → NOT L3 (it's L4)
- A "continuity record" that was manually written (not machine-generated) → NOT L2 (it's L5)
- A "live session" that was simulated (not actually executed in the environment) → NOT L1 (it's L5)

### Phase 3: Report

Produce the evidence report using this template:

```markdown
## Production Readiness Evidence Report
**Date:** [YYYY-MM-DD]
**Deployment:** [feature/release name]
**Gate Type:** [PR review | Phase | Merge | Milestone | Deployment]
**Required Minimum Level:** [L3 | L2 | L1]

### Highest Evidence Level Achieved: [L1/L2/L3/L4/L5]

### Evidence Catalog

| # | Artifact | Level | Source | Verified At | Notes |
|---|----------|-------|--------|------------|-------|
| 1 | Changelog entries | L5 | CHANGELOG.md v2.3.0 | 2026-04-28 | All 12 entries verified |
| 2 | Migration integration test | L3 | ci/test-results/migration-test.log | 2026-04-28 | Passed against staging DB clone |
| 3 | Migration staging run | L2 | .hivemind/state/session-mig-0428.json | 2026-04-28 | UP+DOWN+UP sequence, 42s total |
| 4 | Rollback plan | L5 | docs/rollback-plan-2026-04-28.md | 2026-04-28 | All trigger conditions defined |
| 5 | Staging smoke test | L3 | ci/smoke-test-output.txt | 2026-04-28 | 15/15 tests pass, 8.3s |
| 6 | Manual feature verification | L1 | Manual session capture | 2026-04-28 | Exercised in staging, screenshot attached |
| 7 | Completed deployment checklist | L5 | docs/pre-deploy-checklist-0428.md | 2026-04-28 | 42/42 items pass |

### Verdict: [PASS / FAIL]

### Gate Compliance Check
- Minimum required level: L1 (Deployment gate)
- Highest achieved level: L1 ✓
- No mock-only evidence ✓
- No L5-only claims ✓

### Remediation (if FAIL)
[Only populated if verdict is FAIL]

| Gap | Missing Evidence | How to Produce | Re-run Condition |
|-----|-----------------|----------------|-----------------|
| [gap description] | [what's missing] | [concrete steps] | [when to retry] |
```

### Phase 4: Handoff

The evidence report is consumed by `gate-evidence-truth`. The handoff path:

```
hm-production-readiness produces → evidence report (this file)
    ↓
gate-evidence-truth consumes → classifies → evaluates → renders PASS/FAIL
    ↓
hm-gate-orchestrator receives → unified verdict → authorizes deployment or blocks
```

**Make sure the report is consumable:**
- [ ] Evidence levels match the L1-L5 classification (not custom levels)
- [ ] Each artifact has a verifiable source (file path, URL, session ID)
- [ ] The highest achieved level is explicitly stated
- [ ] Gate minimum compliance is explicitly checked
- [ ] No ambiguous classifications (every artifact assigned ONE level)

## Gate-Specific Minimum Requirements

Per `gate-evidence-truth` specification:

| Gate Type | Minimum Level | Production Readiness Implications |
|-----------|---------------|----------------------------------|
| PR review | L3 | At least migration integration tests against staging |
| Phase completion | L2 | Continuity record from real staging deployment run |
| Merge | L2 | Continuity record from real execution |
| Milestone completion | L2 + one L1 | Continuity record + at least one live session proof |
| **Release/Deployment** | **L1** | **Live runtime proof for every user-facing feature** |

**For deployment gates (our primary use case):**
- Every user-facing feature must have L1 proof (exercised in production-equivalent environment)
- No mock-dependent evidence in the release artifact set
- Production-equivalent environment used for L1 evidence (not localhost, not dev)
