---
phase: 37-async-result-harvesting
status: complete
completed: 2026-05-01
requirements: [PH37-01, PH37-02]
---

# Phase 37 — Async Result Harvesting (SUMMARY)

## Outcome

Both requirements verified complete on 2026-05-01. Phase 37 was previously
listed as PENDING (depends on Phase 36 PH36-03). The Phase 36 dependency
closed via PR #72 on the same day, and an audit of the source confirmed
PH37-01 and PH37-02 had already been implemented as part of earlier
delegation work — only the roadmap was stale.

## Verification

### PH37-01 — Extract child session results into `delegation.result` for completed delegations

Implemented for both delegation paths:

**SDK path (`src/lib/sdk-delegation.ts:241-261`):**
After the dual-signal completion gate fires, `finalizeSdkDelegation()`
calls `getSessionMessages(this.client, delegation.childSessionId)`, runs
the result through `extractAllAssistantText(messages)` (defined in
`src/lib/helpers.ts:222`), and stores the harvested text on
`delegation.result`. Empty results are treated as completion-evidence
failures and routed to a terminal `error` state, not `completed`.

**Command path (`src/lib/command-delegation.ts:281-282`):**
PTY/headless command outcomes set `delegation.result = outcome.output`
and propagate the truncation flag via `delegation.resultTruncated`.

### PH37-02 — Update `delegation-status` tool to return harvested results

Implemented at `src/tools/delegation-status.ts:31`:

```ts
result: delegation.result ? redactTextSecrets(delegation.result) : undefined,
```

Both single-delegation lookup and the list-all-delegations branch surface
the harvested result, and both apply `redactTextSecrets` from
`src/lib/security/redaction.ts` before returning it to the caller. The
same redaction is applied to `error` and `fallbackReason`.

## Test Coverage

- `tests/lib/sdk-delegation.test.ts:118` — "finalizes SDK delegation by calling client.session.messages for result extraction"
- `tests/lib/sdk-delegation.test.ts:212-364` — full dual-gate finalization matrix (idle time, stable polls, both, neither)
- `tests/lib/delegation-manager.test.ts:1083, 1730, 1887, 1992` — finalization paths exercised under recovery, stability, and SDK failure
- `tests/lib/command-delegation.test.ts:288-292, 404` — "captures PTY output as delegation result text" + premature-finalize negative case
- `tests/lib/delegation-persistence.test.ts:111` — redacts `delegation.result`, `error`, and `fallbackReason`

Full suite is green: 1164/1164 tests passing as of PR #72 merge.

## Gates

- `npm run typecheck` — green
- `npm run test` — 1164/1164 passing (87 test files)
- `npm run build` — green

## No Code Changes

This phase closure is **documentation-only**. The implementation was
already in place; only the planning artifacts were stale.
