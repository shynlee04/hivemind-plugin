---
description: "Ship workflow: code review gates → spec compliance → evidence truth → PR creation → version bump → release manifest."
---

# hm-ship

## Goal
Create a pull request with comprehensive review gates, generate CHANGELOG.md, bump version, and prepare release manifest for merge.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Shipping | hm-shipper | Orchestrates PR creation, gates, version bump, release manifest |
| Code Review | hm-code-reviewer | Adversarial code review against spec compliance |
| Verification | hm-verifier | Evidence truth check for completion claims |

## Execution Phases
1. **Gate: Code Review**: Run hm-code-reviewer for adversarial code review. Must PASS.
2. **Gate: Spec Compliance**: Run quality-gate-orchestration for spec-compliance gate. Must PASS.
3. **Gate: Evidence Truth**: Run quality-gate-orchestration for evidence-truth gate. Must PASS.
4. **CHANGELOG Generation**: Read git log since last tag, generate CHANGELOG.md with conventional commits.
5. **Version Bump**: Apply semver bump (major.minor.patch) to package.json.
6. **PR Creation**: Create PR branch, push, create PR via gh CLI.
7. **Release Manifest**: Write RELEASE.md with changelog, version, breaking changes, migration notes.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `human-verify` | Verify PR description and changelog before submission |
| `decision` | Confirm version bump magnitude before applying |

## Exit Criteria
- All 3 quality gates PASS.
- CHANGELOG.md written and committed.
- Version bumped in package.json.
- PR created with description and labels.
- RELEASE.md written.
