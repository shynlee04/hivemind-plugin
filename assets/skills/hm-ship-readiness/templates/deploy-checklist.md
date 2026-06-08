# Deploy Checklist

Fill before any production deploy.

```markdown
# Deploy Checklist: <release-tag>

**Release:** v<X>.<Y>.<Z>
**Date:** YYYY-MM-DD
**Owner:** <name>

## Pre-Deploy Gate (6 checks, all MUST pass)

### Check 1: Spec locked
- [ ] SPEC.md exists
- [ ] All 5 gates PASS (Source Audit, Ambiguity, REQ table, Acceptance, Handoff)
- [ ] `bash scripts/validate-spec-falsifiability.sh SPEC.md` exits 0

### Check 2: Tests green
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` all green
- [ ] `npm run test:coverage` reports PASS or PARTIAL (with gaps)

### Check 3: Changelog + version
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped (semver)
- [ ] For breaking change: major bump + migration guide

### Check 4: Rollback plan
- [ ] Previous version tagged
- [ ] Rollback command documented
- [ ] Data migrations reversible (or warning documented)

### Check 5: Backward compat
- [ ] No breaking API changes without major bump
- [ ] Breaking changes have feature flag or opt-in path
- [ ] Public surface unchanged OR deprecation documented

### Check 6: Monitoring
- [ ] Health check returns 200
- [ ] Logs include new feature
- [ ] Error reporting covers new code paths
- [ ] Rollback signal (error rate) actionable

## Deploy Steps

- [ ] `git tag v<X>.<Y>.<Z>-pre-deploy`
- [ ] Run deploy command
- [ ] Smoke test in production
- [ ] `git tag v<X>.<Y>.<Z>`
- [ ] Update CHANGELOG with deploy date

## Post-Deploy

- [ ] Health check still 200
- [ ] No 500 errors in first 5min logs
- [ ] Critical user flow works end-to-end
- [ ] Notify channels
```

## Usage

Save as `cycles/<release>/deploy-checklist.md` and check off each
item before deploy.
