# Phase 45: Validation Architecture

> Extracted from 45-RESEARCH.md §Validation Architecture + §Security Domain
> (workflow.nyquist_validation: enabled — default)

## Test Framework

| Property | Value |
|----------|-------|
| Framework | bats-core >= 1.7.0 |
| Install | `brew install bats-core` or `npm install -g bats` |
| Quick run command | `bats tests/scripts/sync-fork.bats` |
| Full suite command | `bats tests/scripts/` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Fetch and merge from fork | integration | `bats tests/scripts/sync-fork.bats` | ❌ Wave 0 |
| REQ-02 | Pinned file protection on conflict | integration | `bats tests/scripts/sync-fork.bats` | ❌ Wave 0 |
| REQ-03 | `--dry-run` preview without writing | integration | `bats tests/scripts/sync-fork.bats` | ❌ Wave 0 |
| REQ-04 | Idempotent execution | integration | `bats tests/scripts/sync-fork.bats` | ❌ Wave 0 |
| REQ-05 | Shell test suite — 3 scenarios | integration | `bats tests/scripts/sync-fork.bats` | ❌ Wave 0 |

## Sampling Rate

- **Per task commit:** `bats tests/scripts/sync-fork.bats` (1-3 second run time)
- **Per wave merge:** `bats tests/scripts/` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Wave 0 Gaps

- [ ] `tests/scripts/sync-fork.bats` — covers REQ-01 through REQ-05
- [ ] `tests/scripts/test_helper/common-setup.bash` — shared setup fixture
- [ ] `tests/scripts/.gitkeep` — ensures directory is tracked
- [ ] bats install: `brew install bats-core` — if not detected, add to phase plan

## Security Domain

> This phase creates a standalone shell script with no network-exposed surface, no user input processing beyond `--dry-run`, and no credential handling. Security domain baseline applies but is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `--dry-run` is the only argument; validate with explicit `case` match, reject unknown args |
| V7 Error Handling | yes | `set -euo pipefail` ensures early exit on unexpected failures; meaningful stderr messages |
| V12 File & Resources | yes | Script works within `opencode-tmux/` only; temp remote cleaned up via trap |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Argument injection via `--dry-run` spoofing | Spoofing | Only `--dry-run` accepted; any unrecognized arg → exit 1 (SPEC compliance) |
| Temp remote left behind on interrupt | Repudiation | `trap cleanup EXIT` guarantees remote removal even on SIGINT/SIGTERM |
| Race condition on pinned file detection | Tampering | `git merge-tree` is atomic read-only operation — no race possible |
| Insecure network fetch (no TLS verification) | Tampering | Github.com uses HTTPS with standard git TLS verification — no override flag used |
