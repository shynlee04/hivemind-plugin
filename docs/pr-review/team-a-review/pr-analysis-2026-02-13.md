# Team A: PR Analysis (2026-02-13)

## Executive read

All Jules PRs in scope were merged, but current `origin/master` reflects a later consolidation pass that rolled back or reshaped many of them. Team A therefore scored PRs by **current integrated behavior**, not merge history alone.

## Scoring model (weighted)

- **Retention (0-3, weight 35%)**: how much of the claimed change survives at HEAD.
- **Risk (0-3, weight 30%)**: regression/security/operational risk if left as-is.
- **Integration Cost (0-3, weight 20%)**: complexity/conflict risk to restore or redesign.
- **Ecosystem Impact (0-3, weight 15%)**: real user/system impact in this plugin context.

## Domain slices

### Slice A: Performance and event-loop hygiene
- PR #4, #11, #14, #15 were directionally performance-focused.
- At HEAD, all four are no longer implemented as originally claimed.
- High-risk item: lock semantics and responsiveness tradeoff (`src/lib/persistence.ts:77`, `src/lib/persistence.ts:109`).

### Slice B: Refactoring and structure integrity
- PR #5, #6, #9, #16 targeted maintainability.
- At HEAD, structural gains from #6/#9/#16 are gone; #5 behavior remains but abstraction is removed.

### Slice C: Security/reliability
- PR #10 and #12 are reliability/security-sensitive.
- #10 is partial (warn in `save`, but not in `withState`).
- #12 shows regression in stamp-path sanitization fallback (`src/lib/planning-fs.ts:324`).

### Slice D: Testing and CI confidence
- PR #7 and #13 added tests; #17 fixed CI test targeting.
- Dedicated test files for #7/#13 were later removed, but #7 coverage remains represented in `tests/sdk-foundation.test.ts`.
- #13 has weaker direct guardrails after test removal.

## Per-PR weighted ledger

| PR | Retention | Risk | Integration Cost | Ecosystem Impact | Weighted read | Team A outcome |
|---|---:|---:|---:|---:|---|---|
| #4 | 1 | 1 | 2 | 1 | Low net gain currently | On-point, needs different direction |
| #5 | 2 | 2 | 2 | 2 | Medium priority restore | Makes it, needs more work |
| #6 | 1 | 1 | 2 | 1 | Low urgency, mostly maintainability | Sound good, no immediate leverage |
| #7 | 3 | 1 | 1 | 2 | Strongly retained by tests | Complete |
| #8 | 2 | 1 | 1 | 2 | Partial standardization | Makes it, needs more work |
| #9 | 0 | 2 | 2 | 2 | Removed utility, duplication returned | Totally out |
| #10 | 2 | 2 | 1 | 2 | Partial observability | Makes it, needs more work |
| #11 | 1 | 3 | 3 | 2 | Needs lock-model redesign, not naive swap | On-point, needs different direction |
| #12 | 1 | 3 | 2 | 3 | Security-sensitive regression | Makes it, needs more work |
| #13 | 1 | 2 | 1 | 2 | Coverage intent weakened | Makes it, needs more work |
| #14 | 1 | 3 | 2 | 1 | Unbounded Promise.all risk if restored as-is | On-point, needs different direction |
| #15 | 1 | 1 | 2 | 1 | Good micro-optimization, weak current bottleneck evidence | Sound good, no immediate leverage |
| #16 | 0 | 1 | 1 | 1 | Utility extraction removed | Totally out |
| #17 | 3 | 1 | 1 | 1 | CI behavior retained | Complete |

## Final classification requested by coordinator

### 1) Which make into with completion
- **PR #7** (`testing-improvement-sdk-context-2851667522612113337`)
- **PR #17** (`refactor/session-lifecycle-logic-6532391020275452137`)

### 2) Which also makes but need more work on
- **PR #5** migration extraction (behavior there, abstraction removed)
- **PR #8** config constants centralization (partial only)
- **PR #10** backup failure logging (partial path)
- **PR #12** path traversal fix (security follow-up required)
- **PR #13** agent behavior prompt tests (direct suite removed)

### 3) Which is on point but needs a different direction (or others break)
- **PR #4** flatten optimization: apply only with depth/size triggers + readability safeguards
- **PR #11** async lock release: requires lock model redesign, not direct async replacement
- **PR #14** concurrent cleanup: bounded concurrency required, not raw `Promise.all`

### 4) Which is totally out of list
- **PR #9** CliFormatter standardization (artifact removed)
- **PR #16** levenshtein utility extraction (artifact removed)

### 5) Which sounds good but currently no way to improve
- **PR #6** unified rendering helper (benefit mostly structural; low current operational pressure)
- **PR #15** `copyFile` backup optimization (high-gain mainly on very large state files; weak current bottleneck signal)

## Integration-level conclusion

Current codebase is stable (tests/typecheck/boundary all pass), but **history-to-head traceability is inconsistent** for a large part of the Jules PR set. This is the core coordination risk: merged provenance does not equal retained implementation.
