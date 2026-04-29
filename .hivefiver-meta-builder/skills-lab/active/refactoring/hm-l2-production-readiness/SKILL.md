---
name: hm-l2-production-readiness
description: >
  Use when the user asks "is it ready to ship", "production readiness check", "deployment verification",
  "go live check", "release readiness", "pre-deployment checklist", "production deployment validation",
  "verify deployment safety", "migration validation", "rollback plan check", "changelog completeness",
  "deployment evidence", "smoke test verification", "backward compatibility check", "monitoring setup validation",
  "pre-release check", "staging verification", "canary deployment readiness", or any pre-deployment gate.
  Bridges implementation completion to production deployment. Verifies deployment safety: changelogs,
  migrations, rollback plans, monitoring, smoke tests, backward compatibility, and evidence collection
  for quality gates. Feeds L1-L5 evidence to gate-evidence-truth for terminal gate verdict.
  NOT for performing the actual deployment or managing infrastructure — only verification.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["hm-gate-orchestrator", "gate-evidence-truth"]
  input-from: ["hm-feature-ecosystem", "hm-cross-cutting-change"]
  consumed-by: ["gate-evidence-truth", "hm-gate-orchestrator"]
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## The Iron Law

```
No code ships to production without verified changelog, reversible migrations, tested rollback, and monitoring in place.
```

# Production Readiness Verification

## Overview

Verify that implemented code is safe to deploy to production. This is the bridge between "code works in development" and "code is deployable to production." Does NOT perform the deployment — that is external tooling. This skill verifies deployment safety across eight dimensions, and collects evidence in the format required by `gate-evidence-truth` (L1 live runtime proof through L5 documentation).

**Works for any deployment target:** cloud, on-prem, serverless, CLI tools, npm packages, web apps, mobile backends. See adapter notes in each checklist for target-specific adjustments.

## On Load

1. Read `references/deployment-checklist.md` — the master pre-deployment verification checklist
2. Read `references/migration-validation.md` — migration script verification patterns
3. Read `references/evidence-collection-guide.md` — how to collect L1-L5 evidence
4. Read `references/rollback-plan-template.md` — structured rollback plan template

Determine the deployment target type (cloud, on-prem, serverless, CLI, npm package, etc.) before applying checklists — use adapter notes within each checklist.

## Core Verification Workflow

Follow this checklist in order. Each step produces evidence that feeds the final verdict:

```
- [ ] STEP 1: CHANGELOG — Verify changelog completeness
- [ ] STEP 2: MIGRATIONS — Validate migration scripts (up + down, edge cases, tested)
- [ ] STEP 3: ROLLBACK — Verify rollback plan exists and is tested
- [ ] STEP 4: MONITORING — Validate monitoring, alerts, and dashboards
- [ ] STEP 5: COMPATIBILITY — Check backward compatibility
- [ ] STEP 6: SMOKE TESTS — Verify smoke tests exist and pass in staging
- [ ] STEP 7: DEPLOYMENT CHECKLIST — Run the comprehensive pre-deployment checklist
- [ ] STEP 8: EVIDENCE — Classify collected evidence into L1-L5 format
- [ ] STEP 9: VERDICT — Render PASS/FAIL with remediation plan
```

## STEP 1: Changelog Completeness

Verify that every user-facing change is documented:

- [ ] Every user-facing feature, fix, and breaking change has a changelog entry
- [ ] Breaking changes are explicitly called out with migration notes
- [ ] Every database migration is listed with up/down descriptions
- [ ] Every config change is documented (env vars, feature flags, API keys)
- [ ] Every dependency version bump is listed
- [ ] Deprecation notices are included for any removed/deprecated APIs
- [ ] Changelog follows format: `[category] description (issue/PR ref)`
- [ ] Internal-only changes (refactors, test additions) are noted as non-user-facing

**Evidence collected:** Changelog file content → L5 (documentation). If changelog was auto-generated from commit messages, verify each entry manually.

## STEP 2: Migration Validation

Load `references/migration-validation.md` for the full protocol.

Core checks:

- [ ] Every migration script has an UP (apply) and DOWN (revert) path
- [ ] DOWN path cleanly reverses the UP path (not a separate, incompatible script)
- [ ] Migration tested on empty state (no existing data) — passes
- [ ] Migration tested on populated state (realistic data volume) — passes
- [ ] Migration handles concurrent runs (idempotent or locked) — does not corrupt data
- [ ] Migration tested in staging/pre-production environment — passes
- [ ] Rollback migration tested (DOWN path executed, then UP re-applied) — passes
- [ ] No destructive operations (DROP TABLE, DELETE FROM) in UP path without explicit confirmation

**Evidence collected:** Migration test results → L4 (unit) or L3 (integration if tested against real DB). Staging execution → L2 (if continuity record captured).

**Adapter notes:**
- **npm packages / CLI tools:** No database migrations. Verify API backward compatibility instead: old API signatures still work, new parameters are optional, deprecated methods emit warnings.
- **Serverless:** Verify Infrastructure-as-Code (IaC) templates have rollback states defined. Verify DB migrations work against serverless DB providers (connection limits enforced).
- **Cloud/on-prem:** Standard migration validation. Verify DB connection pool limits during migration.

## STEP 3: Rollback Plan Verification

Load `references/rollback-plan-template.md` for the structured template.

Every deployable change must have a verified rollback — not just "revert the commit":

- [ ] Rollback plan exists as a documented, executable procedure
- [ ] Rollback plan covers: feature flag disable, database migration reversal, config reversion, DNS changes, cache invalidation
- [ ] Rollback trigger conditions are defined (error rate threshold, latency threshold, user-reported issues)
- [ ] Time-to-rollback is estimated and ≤ the acceptable downtime window
- [ ] Rollback plan has been tested in staging (dry run or actual rollback)
- [ ] Rollback does NOT depend on the same infrastructure it's rolling back (e.g., don't use the failing DB to run a DB restore)
- [ ] Communication plan: who gets notified on rollback, and through what channel

**Evidence collected:** Rollback plan document → L5. Staging rollback test execution → L3 (integration) or L2 (if continuity record from real staging run).

## STEP 4: Monitoring Setup Validation

Verify that monitoring, alerting, and observability are in place for the changed features:

- [ ] Key metrics are instrumented (error rate, latency p50/p95/p99, request volume, success rate)
- [ ] Business metrics are instrumented (conversion rate, active users, feature adoption)
- [ ] Alerts are configured with defined thresholds (not "alert on anything" or "no alerts")
- [ ] Alert thresholds have been validated (not so tight they fire constantly, not so loose they miss issues)
- [ ] Dashboards exist showing the feature's health at a glance
- [ ] Logging is configured for the new code paths (structured logging, correlation IDs)
- [ ] Error reporting is configured (Sentry, DataDog, CloudWatch, etc.) and verified working
- [ ] Health check endpoint exists and reports the new feature's dependencies
- [ ] Synthetic checks/canary tests are configured (if applicable)

**Evidence collected:** Monitoring dashboard screenshots/configs → L5. Live dashboard showing metrics in staging → L2 (if continuity record). Health check response with feature status → L1 (if from live production-equivalent environment).

**Adapter notes:**
- **npm packages / CLI tools:** No server monitoring. Verify: package size within budget, installation smoke test, `--version` flag works, help text accurate, telemetry opt-out respected.
- **Mobile backends:** Add client-side monitoring (crash rate, API error rate from client perspective).
- **Serverless:** Verify cold-start metrics, function timeout alerts, and concurrent execution limits are monitored.

## STEP 5: Backward Compatibility Check

Verify the new deployment does not break existing consumers:

- [ ] API endpoints: no removed fields, no changed field types, no stricter validation on existing inputs
- [ ] API endpoints: new fields are optional, new endpoints are additive
- [ ] Database: no dropped columns without migration, no renamed columns without backwards-compatible views/aliases
- [ ] File formats: old file format is still readable, old config format is still parseable
- [ ] Client contracts: mobile/web clients that haven't updated still function
- [ ] Environment variables: old env vars still respected (if renamed, old names work as aliases)
- [ ] Feature flags: default state matches current production behavior (new feature = OFF)

**Evidence collected:** API contract comparison diff → L5. Integration tests running against old and new versions → L3. Staging environment with old clients connected → L2.

**Check by running:**
```bash
# Compare API schemas between current and new version
git diff main HEAD -- api-spec.yaml swagger.json openapi.yaml 2>/dev/null
# Check for removed/changed fields that aren't additive
```

## STEP 6: Smoke Test Validation

Verify that smoke tests exist and pass in a staging/pre-production environment:

- [ ] Smoke tests cover the critical user flows (login, create, read, update, delete, payment, etc.)
- [ ] Smoke tests pass in the staging environment (not just local/CI)
- [ ] Smoke tests run against production-equivalent configuration
- [ ] Smoke tests include the new/changed features
- [ ] Smoke tests exercise real dependencies (not mocked databases or APIs)
- [ ] Smoke test results are captured as evidence (test output, screenshots, API responses)
- [ ] Smoke tests complete within the defined time threshold (e.g., <5 minutes)

**Evidence collected:** Smoke test output (passing) → L3 (integration). Smoke test run in staging with continuity record → L2. Manual smoke test in production-equivalent environment → L1.

## STEP 7: Deployment Checklist

Run the comprehensive deployment checklist from `references/deployment-checklist.md`. This covers:
- Configuration changes (env vars, secrets, feature flags)
- Infrastructure readiness (DNS, SSL, load balancer, CDN)
- Database readiness (migrations applied, backups taken, connection pools)
- Security verification (no secrets in code, dependency audit, access controls)
- Documentation readiness (README, API docs, runbooks updated)
- Communication readiness (team notified, changelog published, support docs ready)

## STEP 8: Evidence Collection

Load `references/evidence-collection-guide.md` for the full collection protocol.

Classify all evidence gathered in Steps 1–7 into the L1-L5 hierarchy required by `gate-evidence-truth`:

| Level | Source | Production Readiness Examples |
|-------|--------|------------------------------|
| **L1** | Live runtime proof | Manual smoke test in production-equivalent env; health check showing feature operational; real deployment dry-run with instrumentation |
| **L2** | Continuity record from real run | Staging deployment with captured session record; migration run with delegation log; rollback test with continuity record |
| **L3** | Integration test passing (real boundaries) | Smoke tests hitting real staging environment; migration tests against real staging DB; backward compatibility integration tests |
| **L4** | Unit test passing (mocked boundaries) | Migration unit tests; rollback script unit tests; changelog format validation tests |
| **L5** | Documentation | Changelog file; rollback plan document; deployment checklist (completed); monitoring dashboard configuration; API contract comparison diff |

**Minimum evidence for deployment gate (per gate-evidence-truth):** At least one L1 artifact proving a user-facing feature works in a production-equivalent environment. No mock-dependent evidence for release artifacts.

**Build the evidence report:**
```markdown
## Evidence Report (Production Readiness)

### Gate Type: Deployment (L1 minimum)
### Highest Evidence Level: [L1/L2/L3/L4/L5]
### Verdict: [PASS / FAIL]

### Evidence Catalog
| Artifact | Level | Source | Verified |
|----------|-------|--------|----------|
| Changelog file | L5 | CHANGELOG.md | Yes |
| Migration test (staging DB) | L3 | ci/migration-test.log | Pass |
| Rollback plan | L5 | docs/rollback-plan.md | Exists |
| Staging smoke test | L2 | .hivemind/state/session-*.json | Pass |
| Live feature verification | L1 | Manual run in staging | Pass |

### Remediation (if FAIL)
- Missing: [specific evidence needed]
- How to produce: [concrete steps]
- Re-run after: [conditions to retry]
```

## STEP 9: Verdict

Based on evidence collected and classified:

**PASS conditions (all must be true):**
- [ ] All deployment checklist items are green (references/deployment-checklist.md)
- [ ] All migrations are reversible and tested
- [ ] Rollback plan exists, is tested, and has defined trigger conditions
- [ ] Monitoring is configured for the changed features
- [ ] Backward compatibility is verified (no breaking changes without explicit approval)
- [ ] Smoke tests pass in staging
- [ ] Evidence meets the minimum level for the gate type (typically L1 for deployment)
- [ ] No evidence flagged as mock-only for integration boundaries

**If FAIL:** Produce a remediation plan. For each failing item, specify:
- What is missing
- What specific evidence would satisfy it
- How to produce that evidence (concrete steps)
- Under what conditions to re-run verification

## Evidence Handoff to Gate-Evidence-Truth

This skill produces structured evidence that feeds directly into `gate-evidence-truth`:

```
hm-production-readiness (YOU ARE HERE)
    │
    │ Produces: classified L1-L5 evidence, deployment checklist results,
    │           migration test results, smoke test output, rollback plan,
    │           monitoring config, backward compatibility report
    ↓
gate-evidence-truth ← Consumes this evidence
    │
    ├─ PASS → HM-GATE-ORCHESTRATOR receives unified verdict → deployment authorized
    └─ FAIL → Remediation plan returned to implementor → re-run after fixes
```

**Do NOT skip:** The evidence report must be in the format `gate-evidence-truth` expects. Load `gate-evidence-truth` if you need the exact evidence classification protocol and gate-type minimums.

## Cross-Skill Routing

| Skill | Relationship | Boundary |
|-------|-------------|----------|
| `hm-feature-ecosystem` | Input source | Provides the feature change set for verification |
| `hm-cross-cutting-change` | Input source | Provides change impact analysis for backward compatibility |
| `gate-evidence-truth` | Output consumer | Consumes the evidence report for terminal gate verdict |
| `hm-gate-orchestrator` | Output consumer | Receives unified verdict; coordinates gate sequencing |
| `hm-brainstorm` | Predecessor | Requirements were explored before implementation |
| `hm-spec-driven-authoring` | Predecessor | Spec was locked before implementation |

**Boundary:** This skill verifies deployment safety — it does NOT perform the deployment (external tooling), does NOT manage infrastructure (IaC tools), and does NOT approve the final deployment (that is `hm-gate-orchestrator` via `gate-evidence-truth`).

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Documentation-as-evidence** — claiming deployment readiness from L5-only artifacts | Evidence report has no L1-L3 artifacts | Require at minimum L3 integration test results; L1 runtime proof for deployment gates |
| **Missing rollback plan** — "revert the commit" as the entire rollback strategy | Rollback plan is a single line or missing | Produce structured rollback plan using `references/rollback-plan-template.md` |
| **Untested migrations** — migrations tested only locally or on empty DB | Migration validation skips populated state or staging environment | Run migrations against staging with realistic data volume |
| **Mock-only integration tests** — "smoke tests" that mock the entire system | Smoke tests use mocked databases, mocked APIs, mocked auth | Run smoke tests against staging with real dependencies |
| **No monitoring** — feature deployed without alerts or dashboards | Monitoring step produces no evidence artifacts | Instrument key metrics BEFORE deployment; add dashboard and alert config |
| **Changelog by git log** — auto-generated changelog from commit messages | Changelog has entries like "fix stuff" or "WIP" | Curate changelog manually; each entry must describe user-facing impact |
| **Forward-only thinking** — assuming deployment succeeds without planning for failure | Rollback plan verification is skipped | Every deployment has a verified rollback plan; test the rollback in staging |
| **Environment drift** — staging verification passes but production config differs | Smoke tests pass in staging but production check skipped | Compare staging and production configs; verify in production-equivalent environment |

## Reference Files

| File | Content |
|------|---------|
| `references/deployment-checklist.md` | Comprehensive pre-deployment checklist: config, secrets, migrations, DNS, SSL, CDN, monitoring, security, documentation |
| `references/migration-validation.md` | Migration script verification: up/down reversibility, testing patterns, edge cases, adapter notes per deployment target |
| `references/evidence-collection-guide.md` | How to collect and classify L1-L5 evidence for gate-evidence-truth handoff |
| `references/rollback-plan-template.md` | Structured rollback plan template with trigger conditions, execution steps, and verification protocol |

## Self-Correction

### When Target is Unclear

If the deployment target is ambiguous (e.g., user says "deploy to production" but the app runs on Kubernetes, Cloud Functions, and npm), ask: "Which deployment targets are in scope for this release?" Use the adapter notes in each checklist for target-specific verification.

### When Evidence Is Insufficient

If evidence is below the gate minimum (e.g., only L4 unit tests for a deployment gate requiring L1), do NOT lower the gate. Report FAIL with explicit remediation: "Produce L1 evidence by running a manual smoke test in the production-equivalent staging environment and capturing the session record."

### When Rollback Is Impractical

If a change is genuinely non-rollbackable (data deletion, schema destruction, irreversible API removal), flag it as a CRITICAL finding. The deployment must have explicit approval from a human who understands the risk. Document the approval in the evidence report.

### Adapter Switching

When the deployment target type changes mid-verification (e.g., from cloud to serverless), re-run the deployment checklist with the new target's adapter notes. Do not assume the same checklist items apply across targets.
