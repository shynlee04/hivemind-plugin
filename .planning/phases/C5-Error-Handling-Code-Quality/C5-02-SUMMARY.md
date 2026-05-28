---
phase: C5-Error-Handling-Code-Quality
plan: 02
subsystem: security
tags: [env-scoping, process-env, security, information-disclosure]

requires:
  - phase: C2
    provides: Existing process.env hardening patterns
provides:
  - Scoped env allowlist in create-governance-session.ts (REQ-03)
  - Safety rationale comment in doctor.ts (REQ-04)
affects: [C6, C7, security audit]

tech-stack:
  added: []
  patterns:
    - "buildMinimalEnv allowlist pattern replicated inline for child process env scoping"

key-files:
  created: []
  modified:
    - src/features/governance-engine/create-governance-session.ts
    - src/cli/commands/doctor.ts

key-decisions:
  - "Used direct object literal instead of Object.fromEntries + filter pattern (simpler for single call site)"
  - "Included git-related env vars (GIT_AUTHOR_NAME, GIT_AUTHOR_EMAIL, etc.) alongside allowlisted system vars"
  - "Omitted GIT_DIR and GIT_WORK_TREE — execFileAsync uses cwd parameter, making these unnecessary"

patterns-established:
  - "Child process env: explicit allowlist (PATH, HOME, TERM, LANG, PWD + tool-specific vars) instead of full process.env spread"

requirements-completed: [REQ-03, REQ-04]

duration: 5min
completed: 2026-05-28
---

# Phase C5 Plan 02: Scoped Env Allowlist + Safety Comment Summary

**Replaced full process.env spread in create-governance-session.ts with scoped allowlist; added safety rationale comment to doctor.ts env spread**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-28T20:12:30Z
- **Completed:** 2026-05-28T20:12:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced `{ ...process.env }` in create-governance-session.ts git commit with scoped env allowlist (PATH, HOME, TERM, LANG, PWD + git config) — prevents accidental exposure of API keys, tokens, or secrets to child git process
- Added inline safety rationale comment to doctor.ts env spread documenting that it's a diagnostic CLI tool (not a production delegation path)

## Task Commits

1. **Tasks 1+2: Scoped env + doctor.ts safety comment** - `f75682c9` (feat)

## Verification

- **Typecheck:** `npm run typecheck` — CLEAN
- **Full test suite:** `npm test` — 2630/2630 pass, 0 regressions
- **grep acceptance:**
  - `...process.env` in create-governance-session.ts — zero matches
  - Safety comment in doctor.ts — found at line 244

## Decisions Made
- Used direct object literal instead of `Object.fromEntries` + `filter` pattern from `buildMinimalEnv` — simpler, same effect for a single call site
- Included git-specific env vars (AUTHOR_NAME/EMAIL, COMMITTER_NAME/EMAIL) alongside allowlisted system vars — these are already hardcoded, not from process.env
- Omitted GIT_DIR and GIT_WORK_TREE — execFileAsync uses `cwd` parameter, making these unnecessary

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- None

## Next Phase Readiness
- REQ-03 and REQ-04 complete
- Ready for C5-03 verification and phase completion

---

*Phase: C5-Error-Handling-Code-Quality*
*Plan: 02*
*Completed: 2026-05-28*
