# Pre-Deploy Gate Workflow

The 6-check sequence that MUST pass before any production deploy.

## Check 1: Spec Locked

The feature has a locked SPEC.md with all 5 gates PASS.

**Verify**: `bash scripts/validate-spec-falsifiability.sh <SPEC.md>`

## Check 2: Tests Green

```bash
npm run typecheck  # 0 errors
npm test           # all green
```

## Check 3: Changelog + Version

- CHANGELOG.md updated
- package.json version bumped (semver)
- Breaking change: major bump + migration guide

## Check 4: Rollback Plan

- Previous version tagged
- Rollback command documented
- Data migrations reversible (or warning documented)

## Check 5: Backward Compat

- No breaking API without major bump
- Feature flag for opt-in
- Deprecation path documented

## Check 6: Monitoring

- Health check returns 200
- Logs include new feature
- Error reporting covers new paths
- Rollback signal actionable

## Run All 6

```bash
bash assets/skills/hm-ship-readiness/scripts/pre-deploy-check.sh SPEC.md PASS
```

Exits 0 if automated checks pass; manually verify the 3 WARN items.

## After Gate Passes

1. `git tag v<X>.<Y>.<Z>-pre-deploy` (last good)
2. Run deploy command
3. Smoke test
4. `git tag v<X>.<Y>.<Z>` (deployed)
5. Update CHANGELOG with date
6. Notify

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| "Just ship, fix in prod" | Run gate |
| Skip rollback plan | Always document |
| Friday deploy | Tue-Thu morning only |
| No smoke test | Always smoke after deploy |
| No monitoring | Always verify health check |
