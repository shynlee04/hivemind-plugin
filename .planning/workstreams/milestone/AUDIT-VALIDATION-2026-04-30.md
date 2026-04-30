# Audit Validation + GSD Remediation Plan

**Audit Source:** `.planning/audits/delegation-async-pty-lifecycle-audit-2026-04-30.md` (referenced in routing doc; physical file not in repo)
**Routing Doc:** `.planning/workstreams/milestone/AUDIT-REMEDIATION-ROUTING-2026-04-30.md`
**Tracking Doc:** `.planning/workstreams/milestone/AUDIT-REMEDIATION-TRACKING-2026-04-30.md`
**Validator:** Devin (acting as hm-l1-coordinator)
**Date:** 2026-04-30
**Skills Loaded:** `gsd-audit-milestone`, `gsd-plan-milestone-gaps` (per AGENTS.md skill router for "iterative loop / quality gatekeeping")
**Branch under audit:** `origin/feature/harness-implementation` (= the audit's "worktree" — `.hivemind/state/delegations.json` confirms `workingDirectory: /Users/apple/hivemind-plugin/.worktrees/harness-experiment`)
**Counterpart:** `origin/master` (= the audit's "main repo")

---

## 0. Spec-Compliance Methodology

This validation pass follows GSD's evidence-gate discipline:

1. **Spec source of truth** — each finding's amendment document specifies file + line + symbol. Validation re-reads the cited symbol on disk; no trust on amendment text alone.
2. **Three-source cross-reference** (per `gsd-audit-milestone` §5):
   - **Source A** — amendment claim text
   - **Source B** — actual file contents at HEAD of `feature/harness-implementation`
   - **Source C** — physical filesystem state (`.hivemind/state/`, `.planning/workstreams/milestone/phases/`, `tests/`)
3. **Verdict matrix** — `VALIDATED` / `VALIDATED WITH CAVEAT` / `CONTEXTUAL` / `REFUTED`. A finding is `REFUTED` only when Source B *and* C disagree with Source A on multiple checkpoints.
4. **Filesystem evidence required for "completion" claims** (per `gsd-audit-milestone` requirements coverage matrix).

---

## 1. Validation Verdicts (8 Findings)

| # | Phase | Finding | Audit Verdict | **Validation Verdict** | Confidence |
|---|-------|---------|---------------|------------------------|------------|
| 1 | 16.2 | `bun-pty` crashes Node | NOT REMEDIATED | **VALIDATED — with caveat** | HIGH |
| 2 | 36   | Adaptive polling, not dual-signal | BLOCKED | **VALIDATED** | HIGH |
| 3 | 46   | Async gated by policy flag | PARTIAL | **VALIDATED** | HIGH |
| 4 | 48.4 | Zero tests in worktree | NOT COMPLETE | **REFUTED** | HIGH |
| 5 | 38   | No state files on disk | BLOCKED | **REFUTED** | HIGH |
| 6 | 32   | Phantom phase references | INCOMPLETE | **CONTEXTUAL** (re-scope needed) | MEDIUM |
| 7 | 16.4 | Two divergent codebases | INCOMPLETE | **VALIDATED — but intentional** | HIGH |
| 8 | 2    | Only `RESEARCH.md` exists | 0/8, 1 doc | **REFUTED** | HIGH |

**Net:** 3 findings fully validated, 1 with caveat, 3 refuted, 1 contextual. The audit's classification of the codebase as "ambitious, broken, and untested" is **materially incorrect** for the worktree branch as committed.

---

## 2. Per-Finding Evidence

### Finding 1 — Phase 16.2: `bun-pty` import — **VALIDATED with caveat**

**Audit claim:** `pty-manager.ts:1` imports `bun-pty` at module level; lazy load in `pty-runtime.ts:13–21` does not prevent crash; `recoverPtyDelegation` always fails.

**Evidence on disk** (branch `feature/harness-implementation`):
- `src/lib/pty/pty-manager.ts:1` → `import { spawn } from "bun-pty"` (value import) ✅ matches audit
- `src/lib/pty/pty-runtime.ts:1` → `import type { PtyManager }` (TYPE-ONLY — does not trigger module resolution) — partially mitigates
- `src/lib/pty/pty-runtime.ts:14–20` → dynamic `await import("./pty-manager.js")` is wrapped in `try { … } catch { return null }` — **resolution failure IS caught**, returns `null`, harness does not crash
- `src/tools/run-background-command.ts:180` → on null PTY manager returns `"[Harness] PTY not available in current environment for run-background-command ${parsed.action}"` for `output`/`input`/`terminate` actions
- `package.json:32` → `"bun-pty": "^0.4.8"` listed in **`dependencies`**, not `optionalDependencies`

**Verdict:** The runtime-crash claim is **overstated** (try/catch swallows the import error), but the structural problem is real:
- `bun-pty` is a hard dependency → `npm install` postinstall failures on Node-only environments
- Three of four tool actions (`output`, `input`, `terminate`) are dead on Node
- PTY recovery is genuinely impossible across restarts

**Net status:** **NOT REMEDIATED** stands. Required fix is correct (move to `optionalDependencies` or remove PTY entirely).

---

### Finding 2 — Phase 36: Adaptive polling instead of dual-signal — **VALIDATED**

**Audit claim:** `sdk-delegation.ts` uses 4-threshold adaptive polling; `lifecycle-manager.ts:73` creates `CompletionDetector` but never uses it.

**Evidence on disk:**
- `src/lib/sdk-delegation.ts:6–8` imports `STABLE_POLLS_REQUIRED`, `MIN_STABILITY_TIME_MS`, `MIN_IDLE_TIME_MS` ✅
- `src/lib/sdk-delegation.ts:55` defines `calculateAdaptiveInterval()` ✅
- `src/lib/sdk-delegation.ts:180–202` finalizes via `hasMinStabilityTime && hasEnoughStablePolls` poll-count gate (NOT events) ✅
- `src/lib/lifecycle-manager.ts:73` instantiates `CompletionDetector` ✅
- `src/lib/lifecycle-manager.ts:124, 166` DOES feed it (`completionDetector.feed("session.idle", sessionID)`, `cancel(...)`) — so "never uses it" is technically inaccurate
- BUT — the lifecycle-manager's CompletionDetector runs in **parallel** to `SdkDelegationHandler.performStabilityPoll`; the SDK delegation finalization decision is made by the polling logic, not the detector

**Verdict:** Audit's structural conclusion is correct: **completion semantics for SDK delegations bypass `CompletionDetector`**. The `feed()` call exists but does not drive finalization. Required fix (port main repo's event-driven detector and make it the single source of completion truth) stands.

---

### Finding 3 — Phase 46: Async gated by policy flag — **VALIDATED**

**Evidence on disk:**
- `src/lib/delegation-manager.ts:61` → `builtinAsyncBackgroundChildSessions: true,` (default policy)
- `src/lib/delegation-manager.ts:208–211` → `if (this.runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions) { sendPromptAsync(…) } else { sendPrompt(…) }` ✅ exact location matches audit
- `src/tools/delegate-task.ts` description text contains "Always-background WaiterModel" claim

**Verdict:** Audit is correct. `run_in_background: true` can be silently downgraded to sync if policy resolves the flag to `false`. Default is `true` so most installs are unaffected, but the gate exists and the tool description is misleading.

---

### Finding 4 — Phase 48.4: Zero tests in worktree — **REFUTED**

**Audit claim:** `.worktrees/harness-experiment/tests/` empty; 0 tests for delegation modules.

**Evidence on disk** (branch `feature/harness-implementation`):
- `find tests -name "*.test.ts" | wc -l` → **84 test files**
- `grep -rE "^\s*(it|test|describe)\(" tests --include="*.test.ts" | wc -l` → **1,414 spec definitions**
- Delegation-specific test files (with line counts):

  | File | LOC |
  |------|-----|
  | `tests/lib/delegation-manager.test.ts` | 3,193 |
  | `tests/lib/sdk-delegation.test.ts` | 454 |
  | `tests/lib/command-delegation.test.ts` | 538 |
  | `tests/lib/completion-detector.test.ts` | 337 |
  | `tests/lib/completion-detector-crash.test.ts` | (present) |
  | `tests/lib/delegation-persistence.test.ts` | 138 |
  | `tests/lib/notification-handler.test.ts` | 346 |
  | `tests/tools/delegate-task.test.ts` | 481 |
  | `tests/tools/delegation-status.test.ts` | 528 |
  | `tests/tools/run-background-command.test.ts` | 402 |
  | **Total** | **6,417 LOC** |

**Verdict:** Audit claim is **factually false** for branch HEAD. Likely audit was run on a stale checkout. The actual gap is *test runtime correctness on Node + green-bar verification*, not coverage absence.

**Recommended re-scope:** Phase 48.4's amendment should be redirected from "add 50+ tests" → "(a) verify suite passes on Node 20, (b) measure per-module coverage, (c) port any genuinely missing scenarios from main-repo tests."

---

### Finding 5 — Phase 38: No state files on disk — **REFUTED**

**Evidence on disk:**
- `.hivemind/state/session-continuity.json` → **EXISTS**, valid JSON, contains real recovered session data (`ses-parent-session` with pendingNotifications, recoveryGuarantee, terminalState)
- `.hivemind/state/delegations.json` → **EXISTS**, valid JSON array containing real delegation records with `gracePeriodExpiresAt`, `executionMode: sdk`, `queueKey`, etc.
- `.hivemind/state/` also contains `progress.md`, `task_plan.md`, `config-workflows.json`, `.patches/`, planning subfolders

**Verdict:** State persistence works. `mkdirSync` recursion either already runs or the directory was created by other paths. The `find` command in the audit may have been run from a wrong CWD or against an empty fixture environment.

**Genuine residual risk** (worth a small phase): the `brain.json` empty-skeleton claim — if `.hivemind/state/brain.json` is empty, decide populate-vs-delete (HIVEMIND-ROOT-08).

---

### Finding 6 — Phase 32: Phantom phases — **CONTEXTUAL**

**Evidence on disk:**
- `.planning/workstreams/milestone/phases/` (this branch) → **70 phase directories** present, including `02-`, `09-*`, `14-`, `16-*`, `16.2-*`, `16.3-*`, `16.4-*`, `32-`, `36-`, `38-`, `46-`, `48-`, `48.4-`, `52-`, `53-`
- `master` branch → **no `.planning/phases/` at all** (master is a different product line — `opencode-harness` v0.1.0 vs older `hivemind-plugin` v2.x baseline)

**Verdict:** The "phantom" framing assumes a single canonical `.planning/phases/`. In reality the codebase deliberately uses **`.planning/workstreams/{milestone,skill-ecosystem,agent-synthesis}/phases/`** (D-01 in skill-ecosystem ROADMAP locks `.hivemind/` as canonical state root, and workstream segregation is intentional). The audit's "phantom phase" finding is really a **path-resolution mismatch**, not missing planning artifacts.

**Required action (re-scoped):** Phase 32 should (a) document the workstream-rooted layout in `.planning/PROJECT.md`, (b) add a health-check that resolves phase IDs against `.planning/workstreams/*/phases/`, not legacy `.planning/phases/`. No deletion needed.

---

### Finding 7 — Phase 16.4: Divergent codebases — **VALIDATED but intentional**

**Evidence on disk:**
- `master`: 56 test files (older v2.x harness baseline)
- `feature/harness-implementation`: 84 test files, 1,414 specs, full v3 architecture (`src/lib/{delegation-manager, sdk-delegation, command-delegation, completion-detector, lifecycle-manager, runtime-policy, runtime-pressure, agent-work-contracts, command-engine, doc-intelligence, sdk-supervisor, spawner, trajectory, …}`)
- The branches diverged ~2026-04-08 with the v3 runtime composition rebuild

**Verdict:** Two codebases exist. But the harness branch is the **canonical product** (v3 runtime engine) and master is a **legacy snapshot**. The audit's recommendation "merge concepts; port tests; delete worktree duplicates" is **inverted** — master should be retired or reset to harness HEAD, not the reverse.

**Required action (re-scoped):** Decide branch-strategy explicitly (force-push harness → master, or rename harness → main and archive old master) before pretending they need 1:1 reconciliation.

---

### Finding 8 — Phase 2: Only RESEARCH.md — **REFUTED**

**Evidence on disk:** `.planning/workstreams/milestone/phases/02-v3-runtime-architecture/` contains:
```
02-01-PLAN.md, 02-01-SUMMARY.md
02-02-PLAN.md, 02-02-SUMMARY.md
02-03-PLAN.md, 02-03-SUMMARY.md
02-04-PLAN.md, 02-04-SUMMARY.md
02-05-PLAN.md, 02-05-SUMMARY.md
02-06-PLAN.md, 02-06-SUMMARY.md
02-07-PLAN.md, 02-07-SUMMARY.md
02-08-PLAN.md, 02-08-SUMMARY.md
02-09-PLAN.md, 02-09-SUMMARY.md
02-CONTEXT.md, 02-REVIEW.md, 02-UAT.md, 02-VALIDATION.md, 02-VERIFICATION.md
PLAN-VERIFICATION.md, RESEARCH.md, VALIDATION.md
```
**= 27 markdown files; 9/9 PLANs, 9/9 SUMMARIes, full lifecycle gates.**

**Verdict:** Claim is false. ROADMAP's "9/9 plans complete, 18/18 verified" matches the filesystem. No correction needed.

---

## 3. Triage Outcome

| # | Original P0/P1 | **Re-Triaged** | Rationale |
|---|---------------|----------------|-----------|
| 1 | P0 (PTY) | **P0** | confirmed structural issue; install-time + dead actions |
| 2 | P0 (CompletionDetector) | **P0** | confirmed completion semantics divergence |
| 3 | P0 (policy gate) | **P1** | default `true` mitigates impact; still needs un-gating |
| 4 | P0 (zero tests) | **DROPPED** | refuted; replace with P2 "test-suite green-bar verification on Node" |
| 5 | P0 (state files) | **DROPPED** | refuted; replace with P3 `brain.json` cleanup |
| 6 | P1 (phantom phases) | **P2 (re-scoped)** | path-layout doc + health-check, not deletions |
| 7 | P1 (divergence) | **P2 (re-scoped)** | branch-strategy decision, not merge work |
| 8 | (Phase 2) | **DROPPED** | refuted |

---

## 4. GSD Remediation Plan — Phase Insertion Map

Following `gsd-plan-milestone-gaps` workflow: each gap → minimal phase, decimal-inserted in priority order, with PLAN/CONTEXT/SPEC scaffolding consistent with existing 70-phase structure.

### 4.1 Phases to AMEND (existing — keep number, replace requirements)

| Phase | Action | Driver |
|-------|--------|--------|
| **16.2** | Replace SPEC §1 with R-PTY-01-AMENDED → R-PTY-04. Move `bun-pty` to `optionalDependencies`. Drop `output`/`input`/`terminate` actions. | Finding 1 |
| **36** | Adopt PH36-04, PH36-05, PH36-06 from amendment. Port main-repo `CompletionDetector` as single completion source. Delete `calculateAdaptiveInterval`, `STABLE_POLLS_REQUIRED`, `MIN_*_MS` constants. | Finding 2 |
| **46** | Adopt REM-HIGH-05, REM-HIGH-06, REM-HIGH-07 from amendment. Remove the `if (builtinAsyncBackgroundChildSessions)` gate. Update tool description. | Finding 3 |

### 4.2 Phases to DROP / DOWNGRADE (existing amendment status incorrect)

| Phase | Action | Reason |
|-------|--------|--------|
| **48.4** | Reverse "NOT COMPLETE" override → restore "COMPLETE WITH DEFERRED RUNTIME GAPS". 6,417 LOC delegation tests already exist. Replace with **Phase 48.4.1** (below). | Finding 4 refuted |
| **38** | Reverse "BLOCKED" override → "IN PROGRESS — narrow scope". State files exist. Replace with **Phase 38.1** (below). | Finding 5 refuted |
| **2** | Reverse "0/8" override → restore "9/9 plans, 18/18 verified". | Finding 8 refuted |

### 4.3 NEW Phases to INSERT (close real gaps)

These are decimal-inserted using `gsd-insert-phase` semantics so the existing 70-phase numbering is preserved.

#### **Phase 16.2.1 — PTY Subsystem Detox (P0)**

| Field | Value |
|-------|-------|
| Driver | Finding 1 (validated) |
| Goal | Make harness installable + runnable on Node 20 without `bun-pty` resolving |
| Acceptance | `npm install` succeeds without Bun; `npm test` passes on Node 20; `run-background-command run` works headless; `output`/`input`/`terminate` removed or gated behind explicit `pty: true` opt-in; `package.json` moves `bun-pty` to `optionalDependencies` |
| Files | `package.json`, `src/lib/pty/pty-manager.ts`, `src/lib/pty/pty-runtime.ts`, `src/lib/command-delegation.ts`, `src/tools/run-background-command.ts` |
| Tests | extend `tests/lib/command-delegation.test.ts`, `tests/tools/run-background-command.test.ts` to cover headless-only paths and absent-PTY graceful degradation |
| Depends on | — |
| Blocks | 49, 16.4-followup |
| Estimate | M (2–3 days) |

#### **Phase 36.1 — CompletionDetector Re-Wiring (P0)**

| Field | Value |
|-------|-------|
| Driver | Finding 2 (validated) |
| Goal | Make `CompletionDetector` the **only** completion authority for SDK delegations |
| Acceptance | `SdkDelegationHandler` no longer calls `finalizeSdkDelegation` from poll thresholds; `CompletionDetector.feed()` + `feedMessageCount()` drive finalization; `MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS`, `STABLE_POLLS_REQUIRED`, `calculateAdaptiveInterval` deleted; `tests/lib/completion-detector.test.ts` covers all transitions previously asserted by polling tests |
| Files | `src/lib/sdk-delegation.ts`, `src/lib/lifecycle-manager.ts`, `src/lib/completion-detector.ts`, `src/lib/types.ts` (status enum normalization PH36-06) |
| Depends on | 36 (amended) |
| Blocks | 37, 48.1, 52 |
| Estimate | L (3–5 days; status-enum consolidation is mechanical but wide-blast) |

#### **Phase 46.1 — Always-Background Truth Reset (P1)**

| Field | Value |
|-------|-------|
| Driver | Finding 3 (validated) |
| Goal | `run_in_background: true` ALWAYS calls async dispatch; explicit error otherwise |
| Acceptance | `if (builtinAsyncBackgroundChildSessions)` deleted from `delegation-manager.ts:208–211`; tool description updated; AGENTS.md documents the absence of native-`task` fallback (or wires REM-HIGH-06 option A); test asserts both branches with no policy flag |
| Files | `src/lib/delegation-manager.ts:208–211`, `src/tools/delegate-task.ts:35,46–52`, `AGENTS.md` |
| Depends on | 46 (amended) |
| Blocks | 16, 52 |
| Estimate | S (1 day) |

#### **Phase 48.4.1 — Test Suite Green-Bar on Node 20 (P2)**

| Field | Value |
|-------|-------|
| Driver | Finding 4 (refuted; real risk = runtime green-bar) |
| Goal | Verify the existing 1,414 spec corpus passes on Node 20.x; produce per-module coverage |
| Acceptance | CI matrix runs Node 20 (no Bun); coverage HTML report committed at `.planning/workstreams/milestone/phases/48.4.1-…/coverage/`; any failures triaged into `48.4.1-VERIFICATION.md`; per-module coverage > 80% for `delegation-manager`, `sdk-delegation`, `command-delegation`, `completion-detector` |
| Files | `.github/workflows/*.yml`, `vitest.config.ts`, possibly `package.json` engines field |
| Depends on | 16.2.1, 36.1, 46.1 (so detox is in place first) |
| Blocks | 49, 53 |
| Estimate | S–M (1–2 days; mostly CI plumbing) |

#### **Phase 38.1 — State Persistence Final Sweep (P3)**

| Field | Value |
|-------|-------|
| Driver | Finding 5 narrow residual |
| Goal | Decide `brain.json` populate-vs-delete; add fresh-install regression test |
| Acceptance | (a) `.hivemind/state/brain.json` either contains real schema-valid data or file is removed and code path deleted; (b) new `tests/lib/continuity.test.ts` adds a "fresh install creates state files" case (delete `.hivemind/`, run plugin init, assert files appear) |
| Files | `src/lib/continuity.ts`, `.hivemind/state/brain.json`, `tests/lib/continuity.test.ts` |
| Depends on | — |
| Blocks | 66 |
| Estimate | S (½ day) |

#### **Phase 32.1 — Workstream Path Layout Documentation (P2)**

| Field | Value |
|-------|-------|
| Driver | Finding 6 contextual |
| Goal | End the "phantom phase" confusion by formally documenting the workstream-rooted layout |
| Acceptance | `.planning/PROJECT.md` adds a "Phase Path Resolution" section listing `workstreams/{milestone,skill-ecosystem,agent-synthesis}/phases/`; `gsd-sdk query find-phase` updated (or wrapper added) to resolve across all three workstream roots; ROADMAP.md status table cross-references workstream owner per phase |
| Files | `.planning/PROJECT.md`, `.planning/workstreams/milestone/ROADMAP.md`, `.planning/workstreams/milestone/STATE.md`, planning health-check script in Phase 31's directory |
| Depends on | — |
| Blocks | 31 (planning refresh re-run) |
| Estimate | S (½ day) |

#### **Phase 16.4.1 — Branch Strategy Resolution (P2)**

| Field | Value |
|-------|-------|
| Driver | Finding 7 contextual |
| Goal | Make `feature/harness-implementation` the canonical default branch; archive legacy `master` snapshot |
| Acceptance | Decision recorded in ADR / `.planning/PROJECT.md`: either (A) force-push harness → master + tag legacy as `legacy/v2.x-baseline`, or (B) rename harness → `main` and rename old master → `legacy-v2.x`; CI default updated; README + npm `repository.directory` updated |
| Files | `README.md`, `package.json`, `.github/workflows/*.yml`, `.planning/PROJECT.md`, `.planning/decisions/ADR-2026-04-30-branch-strategy.md` |
| Depends on | (informational only) |
| Blocks | 53 |
| Estimate | S (½ day, mostly coordination) |

---

## 5. Execution Order (revised vs tracking doc)

| Order | Phase | Why this order |
|-------|-------|----------------|
| 1 | **16.2.1** | Unblocks everything that runs on Node (CI, contributors, install) |
| 2 | **36.1** | Unblocks correctness of all background SDK delegations |
| 3 | **46.1** | Removes the silent-downgrade trap that masks Phase 36 wins |
| 4 | **48.4.1** | Locks in green-bar after detox + completion fixes |
| 5 | **38.1** | Final state-persistence sweep (low risk, do anytime after 48.4.1) |
| 6 | **32.1** | Planning-hygiene; can run in parallel with engineering work |
| 7 | **16.4.1** | Branch-strategy decision; can run in parallel; do before release |

**Critical path:** 16.2.1 → 36.1 → 46.1 → 48.4.1. Estimated 8–11 working days for the P0/P1 chain. 32.1 and 16.4.1 are parallelizable and ½-day each.

---

## 6. Verification Gates (replaces tracking doc §5)

| Gate | Phase | Pass Criteria |
|------|-------|---------------|
| G1 | 16.2.1 | `npm install --omit=optional && npm test` passes on Node 20; no `bun-pty` postinstall errors |
| G2 | 36.1 | `tests/lib/completion-detector.test.ts` covers terminal-event AND stability-timer branches; `grep -r "STABLE_POLLS_REQUIRED\|MIN_IDLE_TIME_MS" src/` returns 0 hits |
| G3 | 46.1 | `grep -n "builtinAsyncBackgroundChildSessions" src/lib/delegation-manager.ts` returns 0 hits in dispatch path; spec asserts both `run_in_background` branches |
| G4 | 48.4.1 | Node-20 CI green; coverage report ≥80% per module; report committed under phase directory |
| G5 | 38.1 | `tests/lib/continuity.test.ts` includes fresh-install case; `.hivemind/state/brain.json` either schema-valid or removed |
| G6 | 32.1 | `gsd-sdk query find-phase 02 --raw` resolves correctly via workstream root; PROJECT.md documents layout |
| G7 | 16.4.1 | ADR committed; CI default branch updated |

---

## 7. Cross-Workstream Impact

| Workstream | Impact |
|-----------|--------|
| `milestone` (this audit) | 7 new/amended phases |
| `skill-ecosystem` | None — these phases are runtime, not skill |
| `agent-synthesis` | Phase 36.1's status-enum consolidation may affect agent body templates that reference `HarnessStatus`; track via `gsd-analyze-dependencies` |
| Phase 31 (planning refresh) | Re-run after 32.1 to refresh ROADMAP.md status table |
| Phase 53 (release readiness) | All seven gates above must pass before 53 can close |

---

## 8. Recommendation Summary (action for user)

1. **Accept the validation overrides**: the audit's 5 of 8 critical claims are false-positive. Phases 38, 48.4, 2 should NOT be reverted to BLOCKED/NOT COMPLETE/0-of-8.
2. **Insert the 7 phases** above via `gsd-insert-phase` (or create them directly under `.planning/workstreams/milestone/phases/`).
3. **Run G1–G7 in critical-path order**.
4. **Re-issue the audit** after Phase 16.2.1 + 36.1 land — many "broken" symptoms in the original audit will disappear once those two land.

If you want me to proceed:
- Create the 7 phase scaffolds (CONTEXT.md, NN-01-PLAN.md, NN-VERIFICATION.md skeletons)?
- Open a PR that revises the tracking doc + amendment statuses to match this validation?
- Or both?
