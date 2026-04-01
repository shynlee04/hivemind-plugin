# Project State Awareness

How to assess the current health and phase of any project before routing work.

---

## Project Phase Detection

| Signal | Greenfield | Active Dev | Maintenance | Legacy | Migration |
|--------|-----------|------------|-------------|--------|-----------|
| Git activity (30d) | Few | Daily | Sporadic | None | Bursts |
| Test coverage | < 20% | Growing | Stable | Declining | Unstable |
| Open decisions | Many | Some | Few | None | Many |
| Dependency age | Fresh | Mostly fresh | Some stale | Stale | Mixed |
| Doc-code alignment | Docs > Code | Balanced | Docs > Code | Docs < Code | Mixed |

### Detection Order
1. `git log` — last 30 days commit frequency/scope
2. Build status — does it pass? CI configured?
3. Open issues/TODOs — unresolved decisions
4. Dependency health — outdated/vulnerable
5. Docs vs code — do described features exist?

---

## Blockage vs Progress

| Signal | Blocked? | Severity | Verify By |
|--------|----------|----------|-----------|
| Build fails | YES | Critical | Run build |
| Tests fail | YES | Critical | Run tests |
| Merge conflicts | YES | High | `git status` |
| Uncommitted changes > 50 | MAYBE | High | `git diff --stat` |
| Stale docs | No | Medium | Timestamps |
| Dependency conflicts | YES | High | Package manager ls |

### Triage Rule
- **2+ Critical** → blocked. Fix before new work.
- **1 Critical** → plan only, no implementation.
- **0 Critical, 2+ High** → proceed with caution.
- **0 Critical, 0 High** → healthy.

---

## Documentation Trustworthiness

| Trustworthy | Untrustworthy |
|-------------|---------------|
| Described file exists at stated path | Doc date older than code change |
| API signatures match code | Claims "implemented" with no test |
| Architecture matches directory tree | References deleted files/modules |

### Verification Order
Source files → git history → build output → test output → **then** docs

---

## Distrust Levels

| Level | Triggers | Action | Autonomous? |
|-------|----------|--------|-------------|
| **CLEAN** | Code, docs, git all align | Proceed | YES |
| **SUSPECT** | One stale doc or unverified claim | Verify critical claims | YES |
| **DEGRADED** | Multiple conflicts, docs contradict code | Re-verify everything | YES, cautious |
| **POLLUTED** | Widespread stale material, false test signals | Code-only mental model | PARTIAL |
| **POISONED** | Cannot verify any claim | **STOP. Human intervention.** | NO |

---

## Detox vs Healthy

**Needs detox (do NOT start feature work):**
- Build broken > 3 days, test skip/flake > 20%, docs reference > 10 non-existent paths, no ownership clarity, circular dependencies

**Healthy enough:**
- Build passes, tests green (< 5% flake), docs < 30 days old, coherent git history, current dependencies

---

## Human Intervention Triggers

**STOP immediately:** POISONED level, build broken with no root cause in 2 attempts, architectural decisions seem wrong, security vulnerabilities detected, data migration needed, about to delete > 20 files

**Proceed with caution:** SUSPECT/DEGRADED, one build failure with clear fix, minor doc staleness, non-critical dependency updates
