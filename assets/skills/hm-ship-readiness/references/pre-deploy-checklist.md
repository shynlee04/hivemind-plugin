# Pre-Deploy Checklist

## Check 1: Spec locked
- [ ] SPEC.md exists
- [ ] All 5 gates PASS (Source Audit, Ambiguity, REQ table, Acceptance, Handoff)
- [ ] `validate-spec-falsifiability.sh SPEC.md` exits 0

## Check 2: Tests green
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` all green
- [ ] `npm run test:coverage` reports PASS or PARTIAL (with documented gaps)

## Check 3: Changelog + version
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped (semver)
- [ ] For breaking change: major bump + migration guide

## Check 4: Rollback plan
- [ ] Previous version tagged
- [ ] Rollback command documented
- [ ] Data migrations reversible (or irreversible-warning documented)

## Check 5: Backward compat
- [ ] No breaking API changes without major bump
- [ ] Breaking changes have feature flag or opt-in path
- [ ] Public surface (tools, hooks, plugin) unchanged OR deprecation documented

## Check 6: Monitoring
- [ ] Health check returns 200
- [ ] Logs include the new feature
- [ ] Error reporting covers new code paths
- [ ] Rollback signal (error rate) is actionable
