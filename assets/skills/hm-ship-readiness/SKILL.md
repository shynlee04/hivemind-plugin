---
name: hm-ship-readiness
description: >
  Production readiness + deploy preparation. Use when the user wants to ship
  a release, deploy to production, run pre-deploy checks, validate rollback
  plan, or verify monitoring setup. Triggers on verbs like "ship", "deploy",
  "release", "production", "rollout", "publish", "tag", "changelog". Pattern
  3 Process — multi-step pre-deploy gate then deploy. Tech-agnostic +
  stack-agnostic. NOT for spec authoring (load `hm-spec-authoring`), NOT for
  TDD on a new feature (load `hm-test-driven`).
metadata:
  consumed-by:
    - "hm-shipper"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P3-Process"
  realm: "spec,test,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - delegate-task
  - validate-restart
---

# Ship Readiness

Pre-deploy gate + deploy execution. Two flows:
- **Flow A: Pre-deploy gate** (mandatory before any production change)
- **Flow B: Deploy** (after Flow A passes)

## Flow A: Pre-Deploy Gate (6 checks)

Every ship MUST pass these 6 checks. Run them in order. Halt on any
failure.

### Check 1: Spec locked

The feature has a locked SPEC.md with all 5 gates PASS:
- Source Audit, Ambiguity Gate, REQ table, Acceptance matrix, Handoff

**Verify:** `bash scripts/validate-spec-falsifiability.sh <SPEC.md>`

### Check 2: Tests green

```bash
npm run typecheck  # 0 errors
npm test           # all green
npm run test:coverage  # report state
```

Coverage state must be PASS or PARTIAL (with acknowledged gaps).

### Check 3: Changelog + version bump

- `CHANGELOG.md` updated with the new version
- `package.json` version bumped
- For breaking changes: migration guide linked

### Check 4: Rollback plan

- The previous version is tagged and pushable
- Rollback command documented (e.g., `git checkout v0.X.Y && npm run deploy`)
- Data migrations are reversible (or have a documented irreversible-warning)

### Check 5: Backward compatibility

- No breaking API changes without major version bump
- If breaking change: feature flag or opt-in path provided
- Public surface (tools, hooks, plugin interface) unchanged OR
  deprecation path documented

### Check 6: Monitoring + observability

- Health check endpoint (if applicable) returns 200
- Logs include the new feature
- Error reporting covers the new code paths
- Rollback signal (e.g., increased error rate) is actionable

**Evidence required:** 6 screenshots or output captures, one per check.

## Flow B: Deploy

Only run after Flow A passes all 6 checks.

### Step 1: Pre-deploy snapshot

```bash
git tag v<X>.<Y>.<Z>-pre-deploy  # last good commit
```

### Step 2: Deploy

Follow the project's deploy command. Capture:
- Command
- Exit code
- Time to deploy
- Any warnings

### Step 3: Smoke test

Run a quick smoke test in production:
- Health check returns 200
- One critical user flow works end-to-end
- No 500 errors in the first 5 minutes of logs

### Step 4: Post-deploy tag

```bash
git tag v<X>.<Y>.<Z>  # mark the deployed commit
```

### Step 5: Announce

- Update CHANGELOG.md with deploy date
- Notify relevant channels
- Document any follow-up actions

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|----|---|---|
| Skipping pre-deploy gate | Production breaks | All 6 checks are mandatory |
| "Just ship it, we'll fix in prod" | Rollback is expensive | Gate before, not after |
| Rollback plan = "git revert" | Doesn't handle data migrations | Plan for state too, not just code |
| "Backward compat? Nah, it's a refactor" | Surprises downstream users | Document or feature-flag |
| Deploy on Friday | No one to monitor over weekend | Deploy Tue-Thu morning |

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-spec-authoring` | Upstream — provides the locked spec |
| `hm-test-driven` | Upstream — provides the green test suite |
| `hm-arch-refactor` | For breaking changes, the ADR lives in this skill's domain |
| `hm-gate-triad` | Pre-deploy gate is a gate-triad instance (spec → test → evidence) |

## Additional Resources

### Reference Files
- **`references/pre-deploy-checklist.md`** — detailed 6-check gate
- **`references/rollback-playbook.md`** — generic rollback patterns

### Templates
- **`templates/deploy-checklist.md`** — fillable pre-deploy form
- **`templates/post-deploy-report.md`** — smoke test + tag record

### Workflows
- **`workflows/pre-deploy-gate.md`** — Flow A detailed
- **`workflows/deploy-execution.md`** — Flow B detailed

### Scripts
- **`scripts/pre-deploy-check.sh`** — runs all 6 checks, exits non-zero on first fail

### Evaluation
- **`evals/evals.json`** — 5 ship-readiness cases (gate → deploy)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
