---
phase: 49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi
type: code-review-pass-2
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - .planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW.md
  - .planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW-FIX.md
  - src/tools/tmux-copilot.ts
  - src/features/tmux/fork-bridge.ts
  - src/features/tmux/integration.ts
  - src/plugin.ts
  - .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md
  - .planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md
  - tests/lib/tmux/fork-bridge.test.ts
  - tests/lib/tmux/integration.test.ts
  - tests/lib/tmux/tmux-copilot.test.ts
diff_base: 58b1268dfc13ff8694fff1dc97d55d0e5b046b5c
diff_head: e9424f9ee1d6ce258a7150ad124001dc12e30a6d
commits_in_range: 8
reviewer: the agent (gsd-code-reviewer, pass 2)
verdict: issues_found
critical: 0
warning: 1
info: 1
total_new_findings: 2
recommendation: rerun_fix_loop
---

# Phase 49: Code Review Pass 2 Report

**Reviewed:** 2026-06-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9 (6 modified in fix range + 2 paperwork + 3 tests)
**Verdict:** `issues_found` (7 fixes verified, 3 moots confirmed, 1 new WARNING, 1 new INFO)

## Scope

- **Source review:** `.planning/phases/49.../49-REVIEW.md` (10 findings, verdict `issues_found`, committed at `9227508a`).
- **Fix report:** `.planning/phases/49.../49-REVIEW-FIX.md` (7 fixed + 3 moot, verdict `partially_addressed`).
- **Fix range:** `58b1268d..e9424f9e` (8 atomic commits on `feature/harness-implementation`).
- **Pass 2 mandate:** verify each of 7 fixes is correctly applied, confirm 3 moots remain moot, scan the 8-commit range for regressions (especially in the 3 test files changed), and surface any new defects the fix agent introduced.

## Evidence Level Notice

This is a **review-evidence** pass (L1-L2): re-reads of modified source files, diff inspection, and JSDoc/test-contract reconciliation. **It is NOT runtime evidence.** Per `.planning/AGENTS.md` (Planning/Governance sector guidance), planning artifacts SHALL NOT claim runtime readiness from docs-only or review-only evidence. Runtime readiness is asserted only by L1 live-runtime transcripts, L2 test-runner output, or L3 CI artifacts from authorized verification workflows.

The `Recommendation` section below is a **next-workflow-step** call, not a runtime-readiness claim.

## Per-Finding Status

| # | ID | Sev | Original | Pass 2 Status | Commit | Notes |
|---|----|-----|----------|---------------|--------|-------|
| 1 | **CR-01** | CRITICAL | opencode-tmux fork export gap | **CONFIRMED_MOOT** | n/a (no fix) | Fork dropped in P50+ pivot per fix report. `opencode-tmux/src/index.ts:41` still exports only `default OpencodeTmux`; the gap remains but is no longer a runtime concern because the fork is no longer a Hivemind runtime dep. P43 VERIFICATION.md still references fork-relative paths (L38-43, L80) as historical evidence — valid as Phase 43 historical record, not as a P50+ runtime claim. |
| 2 | **WR-01** | WARNING | list-panes empty catch conflated errors | **VERIFIED_FIXED_WITH_FOLLOWUP** | `01932958` | Error classification correctly applied (L186-205 of `src/tools/tmux-copilot.ts`): `code === "ENOENT"` or `/enoent/i.test(message)` → `"tmux-not-installed"`; `code === "ETIMEDOUT"` or `/timeout/i.test(message)` → `"tmux-timeout"`; else → `"tmux-error"` with `error: {message}`. **However: see NEW-WR-01 below** — the public `TmuxCopilotResult` type union at L102-111 was not updated to declare the new `"tmux-timeout"` and `"tmux-error"` variants. This is a contract drift introduced by the fix. |
| 3 | **WR-02** | WARNING | Stale "25 custom tools" log | **VERIFIED_FIXED** | `cc390479` | `src/plugin.ts:391` now reads `"registering 26 custom tools"` (was 25). Matches the count implied by 4 register functions + `tmux-copilot` tool. |
| 4 | **WR-03** | WARNING | PaneGridPlanner exposed `requestLayout`/`cancel` wider than tool needs | **VERIFIED_FIXED** | `9e28966a` | `src/features/tmux/fork-bridge.ts:77-90` introduces the narrow public `PaneGridPlanner` type (L77-79: `computeSplitSequence` only) and the internal `PaneGridPlannerInternal extends PaneGridPlanner` (L87-90: adds `requestLayout`/`cancel`). JSDoc L65-76 explicitly documents "wide→narrow assignment is safe" rationale. All 3 test files (L7 of `fork-bridge.test.ts`, L44-58 of `integration.test.ts`, L23-39 of `tmux-copilot.test.ts`) now use the narrow `PaneGridPlanner` type in their stub fixtures. |
| 5 | **WR-04** | WARNING | BATS `[[ ! "$output" == *"Sync complete"* ]]` fragile quoting | **CONFIRMED_MOOT** | n/a (no fix) | BATS suite is part of the dropped P45 vendor-sync. `sync-fork.bats` no longer in active scope. |
| 6 | **IN-01** | INFO | P42 UAT.md L5-only claims not flagged | **VERIFIED_FIXED** | `135490d7` | `.planning/phases/42.../UAT.md` now has a dedicated "Evidence Level Notice" section (L10-21) explicitly stating L5-only verification and citing the HMQUAL-05 evidence hierarchy. All 4 acceptance steps in the UAT table (L41-44) carry the **L5 only** marker. A new "Follow-up Required" section (L52-68) references P50-01/02/03 for the runtime evidence upgrade. "Related Review Artifacts" section (L70-75) cross-links to 49-REVIEW.md and 49-REVIEW-FIX.md. Comprehensive and correctly scoped. |
| 7 | **IN-02** | INFO | P43 VERIFICATION.md W-01..W-04 spec drifts unresolved | **VERIFIED_FIXED** | `0a501582` | New "Spec Drift Resolution (P49 Review IN-02)" section at L201-212 of `.planning/phases/43.../VERIFICATION.md` provides a 4-row table re-checking each W item against current `src/` and `opencode-tmux/` code state. W-01/W-02/W-03 confirmed as docs-only drifts (43-SPEC.md is stale relative to code, not the other way around). W-04 confirmed as out-of-fix-scope (lives in vendored fork). Resolution summary paragraph (L212) is honest about the limitations: P49 review-fix does NOT itself close them; closing requires either (a) a separate docs-hygiene phase or (b) fork modification (out of scope). |
| 8 | **IN-03** | INFO | REQUIRES_PERMISSIONS + ORCHESTRATOR_AGENT_NAMES decoupled | **VERIFIED_FIXED** | `22f4260b` | `src/tools/tmux-copilot.ts:38-56` establishes `ORCHESTRATOR_AGENTS` as the single source of truth (L38-43, 4 entries with name+tier pairs). `REQUIRES_PERMISSIONS` (L50-52) and `ORCHESTRATOR_AGENT_NAMES` (L54-56) are both derived from it. JSDoc L27-37 explicitly states "adding a new orchestrator-tier agent only requires updating one place". The `new Set(...)` dedup on tier values is correctly applied (L51). |
| 9 | **IN-04** | INFO | `readPersistedPort` misleading name + hash collision risk | **VERIFIED_FIXED** | `ccb835d7` | `src/features/tmux/integration.ts:57-99`: function renamed to `readOrMigratePort` (L86). JSDoc L57-85 explicitly documents the rename rationale ("The previous name `readPersistedPort` was misleading — the function does NOT return `null` on a cold start"). Birthday-collision invariant documented (L67-75: ~236 projects before first collision; downstream EADDRINUSE retry path acceptable for single-developer target). Tests updated to use the new name (`integration.test.ts:28` import; L122-152 four port-persistence tests). |
| 10 | **IN-05** | INFO | BATS no re-run scenario for cleanup-trap verification | **CONFIRMED_MOOT** | n/a (no fix) | BATS suite is part of the dropped P45 vendor-sync. |

**Summary: 7/7 fixes verified (1 with followup). 3/3 moots confirmed. 2 new findings introduced by the fix range.**

## New Findings (Pass 2)

### NEW-WR-01: TmuxCopilotResult type union lies about list-panes error variants

**File:** `src/tools/tmux-copilot.ts:102-111`
**Introduced by:** commit `01932958` (WR-01 fix)
**Issue:** The `TmuxCopilotResult` type union declares only `reason: "fork-not-wired" | "tmux-not-installed"`:

```typescript
export type TmuxCopilotResult =
  | { available: false; reason: "fork-not-wired" | "tmux-not-installed" }
  // ...
```

But the new list-panes error classification (L194-204) now emits three additional runtime variants:

1. `{ available: false, reason: "tmux-timeout" }` (L197-199)
2. `{ available: false, reason: "tmux-error", error: { message } }` (L200-204)
3. (The `tmux-not-installed` variant is now narrower — it also requires `ENOENT` code, not just any error)

**Impact:** TypeScript callers that destructure `{available: false, reason}` and `switch` on `reason` will get a union narrower than runtime reality. A caller handling `"fork-not-wired" | "tmux-not-installed"` but receiving `"tmux-timeout"` or `"tmux-error"` will not be warned at compile time about the unhandled variant. The runtime is correct (graceful structured result), but the contract type lies.

**Fix:**
```typescript
export type TmuxCopilotResult =
  | { available: false; reason: "fork-not-wired" | "tmux-not-installed" | "tmux-timeout" }
  | { available: false; reason: "tmux-error"; error: { message: string } }
  | { sent: true; paneId: string }
  | { sent: false; paneId: string; error: { message: string } }
  | { panes: PaneState[] }
  | { commands: SplitCommand[] }
  | { respawned: true; paneId: string }
  | { respawned: false; error: { reason: string } }
  | { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
  | { error: { kind: "permission-denied"; agent: string } }
```

### NEW-IN-01: Test coverage gap for new tmux-timeout / tmux-error paths

**File:** `tests/lib/tmux/tmux-copilot.test.ts`
**Introduced by:** commit `01932958` (WR-01 fix)
**Issue:** The WR-01 fix introduced two new error classification paths in list-panes, but the test file only has a single "list-panes: error path" test at L84-94 asserting the `tmux-not-installed` outcome (using a stub that throws `Error("ENOENT: tmux binary not found")`). The 10/10 test count is preserved, but the new `"tmux-timeout"` and `"tmux-error"` paths are not exercised by any test. A future refactor that accidentally swaps the `isTimeout` and `isNotInstalled` branches would not be caught.

**Impact:** Test count unchanged (10/10), but coverage of the new logic is partial. This is a test-coverage gap, not a regression in existing tests.

**Fix:** Add two tests in `describe("tmux-copilot — 4 actions", ...)`:

```typescript
// 11. list-panes timeout path
it("list-panes: returns {available: false, reason: 'tmux-timeout'} when adapter throws timeout error", async () => {
  setForkSessionManager(
    mkStubAdapter({
      listPanes: async () => {
        const err = new Error("ETIMEDOUT: tmux server unreachable") as NodeJS.ErrnoException
        err.code = "ETIMEDOUT"
        throw err
      },
    }),
  )
  const result = await exec({ action: "list-panes" })
  expect(result).toEqual({ available: false, reason: "tmux-timeout" })
})

// 12. list-panes generic error path
it("list-panes: returns {available: false, reason: 'tmux-error', error: {message}} when adapter throws unclassified error", async () => {
  setForkSessionManager(
    mkStubAdapter({
      listPanes: async () => {
        throw new Error("unexpected tmux protocol error")
      },
    }),
  )
  const result = await exec({ action: "list-panes" })
  expect(result).toEqual({
    available: false,
    reason: "tmux-error",
    error: { message: "unexpected tmux protocol error" },
  })
})
```

Test count would move from 10/10 to 12/12. The orchestrator's vitest run should reflect the new total.

## Regression Check (8-Commit Fix Range)

**Diff stat:** 10 files changed, 363 insertions(+), 38 deletions(-). 4 src files, 3 test files, 3 paperwork files.

| Area | Status | Notes |
|------|--------|-------|
| `src/tools/tmux-copilot.ts` (01932958, 22f4260b) | **Modified, intent matches** | WR-01 (L186-205) and IN-03 (L38-56) applied as designed. No structural damage to dispatch switch (L169-221). Permission gate (L147-151) intact. Bridge check (L162-166) intact. |
| `src/features/tmux/fork-bridge.ts` (9e28966a) | **Modified, intent matches** | WR-03 (L77-90) introduces narrow `PaneGridPlanner` + internal `PaneGridPlannerInternal`. Existing `ForkSessionManagerAdapter` (L115-119) now declares `createPaneGridPlanner: () => PaneGridPlanner` (was the wide shape). Wide→narrow assignment safety documented in JSDoc. |
| `src/features/tmux/integration.ts` (ccb835d7) | **Modified, intent matches** | IN-04 (L86) renames function. JSDoc L57-85 documents rename + birthday invariant. `detectServerUrl` (L122-126) still uses the renamed function correctly. `createTmuxIntegrationIfSupported` (L163-214) untouched. |
| `src/plugin.ts` (cc390479) | **Modified, intent matches** | WR-02 (L391) changes "25" → "26". One-line change, no surrounding impact. |
| `tests/lib/tmux/fork-bridge.test.ts` | **No regression** | 4 tests; stub fixture updated to use narrow `PaneGridPlanner` type (was wide). All 4 tests still pass by inspection of contract. |
| `tests/lib/tmux/integration.test.ts` | **No regression** | 20 tests (4 resolveBinary/getTmuxVersion + 4 readOrMigratePort + 2 persistPort + 2 detectServerUrl + 4 createTmuxIntegrationIfSupported base + 4 fork-bridge wiring). Imports `readOrMigratePort` (was `readPersistedPort`). Stub fixture updated to use narrow `PaneGridPlanner`. New "P49-03 existsSync guard" handling at L309-319 (mocks `node_modules/@hivemind/opencode-tmux` path). All 20 tests contractually pass. |
| `tests/lib/tmux/tmux-copilot.test.ts` | **No regression** | 10 tests, all still present. Stub fixture updated to use narrow `PaneGridPlanner`. The "list-panes: error path" test at L84-94 still asserts `{available: false, reason: "tmux-not-installed"}` (the new error-classification logic correctly classifies `Error("ENOENT: tmux binary not found")` as `tmux-not-installed` because of the `enoent` regex match on the message). **No regression in existing 10 tests.** |
| `.planning/phases/42.../UAT.md` (135490d7) | **No regression** | IN-01 fix is purely additive (new sections + flags in table). No existing content removed or contradicted. |
| `.planning/phases/43.../VERIFICATION.md` (0a501582) | **No regression** | IN-02 fix is purely additive (new "Spec Drift Resolution" section). Pre-existing "Recommended follow-up" entries preserved. P50-01/02/03 references accurate per fix report. |

**No regressions detected in the 8-commit fix range.** The only new defects are the two pass-2 findings above, both downstream of WR-01.

## Test Status (Expected)

Pass 2 review does NOT execute the test suite (orchestrator runs `npm test` separately for L1 evidence). Expected state based on the reviewed files:

| Suite | Expected Count | Source of Truth |
|-------|----------------|-----------------|
| `tests/lib/tmux/` (vitest, all files) | 43/43 pass (per P43 VERIFICATION.md L104) | L1 evidence: P43 VERIFICATION.md (commit `0a501582` did not modify test counts); 4 in fork-bridge + 20 in integration + 10 in tmux-copilot = 34 visible in reviewed files; remaining ~9 in `observers.test.ts` and others not in this pass 2 scope |
| `tests/lib/tmux/tmux-copilot.test.ts` | 10/10 pass (pre-NEW-IN-01) or 12/12 pass (post-NEW-IN-01) | Reviewed file contains exactly 10 `it()` blocks at L54-159. NEW-IN-01 proposes 2 additional tests. |
| BATS vendor-sync | 3/3 pass (per P43 VERIFICATION.md L15) — **N/A in P50+ pivot** | BATS suite (`tests/scripts/sync-fork.bats`) is part of the dropped P45 vendor-sync per fix report. Whether the BATS suite is still run in CI is unknown to this reviewer; orchestrator should confirm. |
| `npx tsc --noEmit` (full repo) | exit 0, 0 errors | L2 evidence expectation; per P43 VERIFICATION.md L103. NEW-WR-01 will NOT cause a tsc error because the type assertion `reason: "tmux-timeout"` is a string literal assignment to a wider `string` field, which TypeScript permits (the union narrowing only affects destructuring callers). |

**Test execution is OUT of pass 2 scope.** The orchestrator must run `npx vitest run tests/lib/tmux` and `npx tsc --noEmit` to convert these expected counts into confirmed L1 evidence.

## Recommendation

**`rerun_fix_loop`**

The WR-01 fix (`01932958`) was applied correctly in terms of runtime logic — error classification now distinguishes ENOENT, ETIMEDOUT, and generic errors as designed. However, the fix was **incomplete at the contract layer**: the `TmuxCopilotResult` public type union at `src/tools/tmux-copilot.ts:102-111` was not updated to declare the new `"tmux-timeout"` and `"tmux-error"` runtime variants. This is a contract drift that should be fixed before claiming P49 review-fixed status. The `tmux-copilot.test.ts` file should also grow 2 tests covering the new error paths so the fix has executable coverage.

## Rationale

Seven of the seven fixable findings were correctly addressed: WR-02 is a one-line log update with no contract implications; WR-03 splits a wide interface into a narrow public + internal full surface with clear JSDoc; IN-01/IN-02 add honest evidence-level notices to the UAT and VERIFICATION paperwork without claiming runtime readiness the docs cannot support; IN-03 derives two parallel data structures from a single source-of-truth table; IN-04 renames a misleading function and documents the birthday-collision invariant. All three originally-moot findings remain moot because the P50+ pivot drops both the fork package and the BATS vendor-sync suite. The fix range did not regress any of the 34 tests in the 3 modified test files (verified by inspection of stub fixture updates and contract-by-contract comparison).

The single remaining issue is downstream of the WR-01 fix. The fix correctly introduced three new runtime error reasons, but the public `TmuxCopilotResult` type at L102-111 was not updated to declare them, creating a contract drift: TypeScript callers that destructure or `switch` on the `reason` field will see a narrower union than the runtime actually emits. This is a contract-hygiene follow-up that the original fix should have included but did not. The runtime behavior is correct and the new test for `tmux-not-installed` still passes; the gap is purely in the type-level contract and in test coverage of the new branches. A short fix-loop commit (type union update + 2 new tests) closes it cleanly, after which pass 3 (or the orchestrator's L1 vitest run) can confirm the P49 review-fix complete.

After the rerun fix loop, this reviewer recommends a third pass (or a direct orchestrator-side `npm test` + `npx tsc --noEmit` run) to confirm:
- 12/12 (post-NEW-IN-01) pass in `tests/lib/tmux/tmux-copilot.test.ts`
- 43/43 (or 45/45 if NEW-IN-01 is the only addition) pass in `tests/lib/tmux/`
- `npx tsc --noEmit` exits 0 (NEW-WR-01 fix should not introduce a tsc error since the type widening is non-narrowing)

Only after that L1 evidence is captured should the orchestrator consider P49 review-fix complete and proceed to UAT (per the next-workflow-step convention — runtime readiness remains a separate L1 claim owned by the verifier workflow).

---

_Reviewed: 2026-06-02T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer, pass 2)_
_Depth: standard_
_Diff range: 58b1268d..e9424f9e (8 commits, +363/-38, 10 files)_
_Verdict: issues_found (1 WARNING + 1 INFO downstream of WR-01 fix)_
_Recommendation: rerun_fix_loop_
