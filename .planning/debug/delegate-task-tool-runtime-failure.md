---
status: resolved
root_cause: "session-creator.ts local PermissionRule missing required 'pattern' field — 8 rules × 1 missing field = 8 Zod validation errors"
fix_commit: "pending — Wave A applied in worktree, needs commit"
third_party_validation: "Devin investigation 3ac1654154854ed7a7d05c711c8d67ac independently confirmed root cause 2026-04-23"
---

## Resolution — Root Cause Found & Fixed

### The Bug

`src/lib/spawner/session-creator.ts:5-8` declared a **local** `PermissionRule` type missing the required `pattern` field. The 8 rules in `WRITE_CAPABLE_PERMISSION_RULES` each lacked `pattern`, causing the OpenCode server's Zod validator (Effect Schema → Zod v4, `Permission.Rule` requires `{ permission, pattern, action }`) to emit exactly **8× "expected string, received undefined"** errors on `POST /session`.

**Math:** 8 rules × 1 missing required string = 8 Zod errors. Perfect match.

### The Fix (applied in worktree)

- **Deleted** local `PermissionRule` type in `session-creator.ts`
- **Imported** canonical `PermissionRule` from `../types.js` (already has `pattern: string`)
- **Added** `pattern: "*"` to all 8 permission rules (matches oh-my-openagent convention)
- **Updated** test assertion to match

### Third-Party Validation

Devin investigation session `3ac1654154854ed7a7d05c711c8d67ac` (2026-04-22) independently reached the identical conclusion by:
- Consulting OpenCode server source (`packages/opencode/src/permission/index.ts:25-36`) confirming `pattern: Schema.String` is required
- Consulting oh-my-openagent reference (16+ call sites ALL include `pattern`)
- Performing regression analysis: Phase 14 did NOT call `session.create` → not a Phase 14 regression
- Correctly identified this as a Phase 16 regression (introduced by spawner extraction in Plan 05-06)

### Corrective Note on Prior Hypothesis

The earlier hypothesis (Part 1 in this file) that `validateAgent()` was the source was **incorrect**. The R-AGENT-01 shim in `delegation-manager.ts:358-377` was masking the symptom but not the cause. The real error originated from `session.create()` in `spawnDelegatedSession`, not from `app.agents()`. Devin's analysis confirms this conclusively.

### Verification

- `npm run build` ✅ (0 errors)
- `npm run typecheck` ✅ (0 errors)
- `npm test` — **503 passed, 0 failed, 1 skipped** ✅

### Files Changed

- `src/lib/spawner/session-creator.ts` (canonical import + pattern fields)
- `tests/lib/spawner/session-creator.test.ts` (updated assertion)

### Remaining Cleanup (Wave B per Devin report)

The R-AGENT-01 graceful-degradation shim (`delegation-manager.ts:358-377`) should be reverted once runtime verification confirms the root fix works. The shim masks real schema validation errors and trusts arbitrary agent strings. See Devin report `.planning/reports/2026-04-23-delegate-task-remediation-findings-devin.md` §3.2.

### Next Step

**Start a brand new OpenCode session** to load the fresh build:

```bash
cd /Users/apple/hivemind-plugin/.worktrees/harness-experiment
opencode
```

Then test `delegate-task`. The permission array now matches the server's schema — `session.create` should return `201 Created` instead of `400 Bad Request`.

If you still see errors after a fresh session, paste the output and we'll investigate further.
