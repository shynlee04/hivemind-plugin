# Phase 18: Root Cleanup, Sync Boundary, Sync Manifest - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 18-root-cleanup-sync-boundary-sync-manifest
**Areas discussed:** Dead code deletion order, Context rot handling, Noise/stub cleanup policy, Boundary sync + manifest update

**Mode:** Advisor (USER-PROFILE.md found, calibration tier: standard)

---

## Dead Code Deletion Order

| Option | Description | Selected |
|--------|-------------|----------|
| Module-batched (2 commits) | Recommended — one commit per module boundary | ✓ |
| All-in-one (1 commit) | Single clean commit | |
| Let agent decide | Delegate final choice | |

**User's choice:** Module-batched (2 commits)
**Notes:** Audit correction: 2 files from Phase 17 findings are active (permission.schema.ts, tool-definition.schema.ts). Actual dead code: 6 files, 795 LOC.

---

## Context Rot Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Extract storeCache, defer split | Recommended — fixes test isolation now | ✓ (agent pick) |
| Add resetStoreCache API only | Minimal change, doesn't fix root cause | |
| Let agent decide | Delegate final choice | |

**User's choice:** Yes, extract storeCache (confirmed after agent pick)
**Notes:** Research found session-tracker at 561 LOC (12% over 500 cap) is well-factored — acceptable exception. storeCache singleton is the higher priority fix.

---

## Noise/Stub Cleanup Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow barrel, keep stubs | Recommended — fix public surface, preserve reservations | ✓ |
| Full cleanup — delete stubs too | Cleanest filesystem, lose reservations | |
| Let agent decide | Delegate final choice | |

**User's choice:** Narrow barrel, keep stubs
**Notes:** export \* in src/index.ts for command-engine is the priority fix — unnecessarily exposes 6 internal functions. stub dirs are reserved per STRUCTURE.md.

---

## Boundary Sync + Manifest Update

| Option | Description | Selected |
|--------|-------------|----------|
| Verify-then-cleanup | Recommended — catch boundary drifts first | ✓ (agent pick) |
| Cleanup-first-then-sync | Clean delta but temporary drift period | |
| Let agent decide | Delegate final choice | |

**User's choice:** Yes, verify first (confirmed after agent pick)
**Notes:** Project has known CQRS boundary issues in CONCERNS.md — verifying first prevents regressions. ARCHITECTURE.md tracks last_mapped_commit: 906b21a0.

---

## the agent's Discretion

- **Context rot:** agent chose "extract storeCache, defer split" based on research recommendation (genuine test isolation gap, session-tracker overage is acceptable)
- **Boundary sync:** agent chose "verify-then-cleanup" based on research recommendation (CONCERNS.md documents known CQRS violations)

## Deferred Ideas

None.
