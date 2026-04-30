---
phase: 8
phase_name: "Repair durable parent observability for delegated sessions"
project: "opencode-harness"
generated: "2026-04-22"
counts:
  decisions: 8
  lessons: 6
  patterns: 6
  surprises: 4
missing_artifacts:
  - "UAT files (no *-UAT.md found)"
---

# Phase 8 Learnings: Repair durable parent observability for delegated sessions

## Decisions

### D-01: Trusted Parent Override Inheritance
Only inherit `runtimePolicyOverride` from trusted parent runtime metadata; never from public tool args or prompt text.

**Rationale:** Public tool arguments and prompt text are untrusted surfaces. Only runtime state already owned by the harness can safely carry policy overrides into child sessions.
**Source:** 08-01-SUMMARY.md (key-decisions)

---

### D-02: Continuity as Canonical Truth Source
Keep continuity as the canonical source of session override truth through write, persist, reload, and hydration.

**Rationale:** In-memory state is lost on restart. Persisted continuity data is the only durable proof that a parent override was actually applied.
**Source:** 08-01-SUMMARY.md (key-decisions)

---

### D-03: Lifecycle-First Observability
Lifecycle reconciliation remains authoritative; notifications are delivery artifacts, not the source of truth.

**Rationale:** If notification delivery fails, the parent must still see correct status via polling. Making notifications authoritative creates a fragile single point of failure.
**Source:** 08-02-SUMMARY.md (key-decisions)

---

### D-04: Failed Parent Delivery Persists Pending Notifications
Failed parent delivery persists pending notifications instead of silently dropping async state changes.

**Rationale:** Best-effort delivery is not good enough for status-critical events. Pending notifications provide a durable fallback queue.
**Source:** 08-02-SUMMARY.md (key-decisions)

---

### D-05: Evidence-Driven Phase Closure
Do not claim Phase 02 closure from bounded Phase 08 tests alone; require full typecheck + full suite evidence.

**Rationale:** Corrective phases touch shared infrastructure. Bounded tests may miss side effects. Full suite verification is the minimum bar for authoritative closure claims.
**Source:** 08-03-SUMMARY.md (key-decisions)

---

### D-06: Atomic Commit for Coupled Changes
When multiple plan tasks modify the same surface and intermediate states would be invalid, combine into one atomic commit.

**Rationale:** Plan 02's notification durability and stale-signal suppression were coupled in shared observer/process-runner surfaces. A split commit would have left an invalid intermediate state.
**Source:** 08-02-SUMMARY.md (deviations)

---

### D-07: Boolean Return Contracts Need Full-Suite Verification
Adding a boolean return to a function used by multiple callers requires full-suite verification, not just targeted tests.

**Rationale:** Returning `true/false` from `notifyParentSession()` accidentally skipped toast delivery when prompt delivery failed. Only the full suite caught this regression.
**Source:** 08-02-SUMMARY.md (deviations)

---

### D-08: Corrective Phases Update Roadmap After Fresh Verification
Corrective phases update roadmap/state only after fresh verification evidence exists.

**Rationale:** Updating planning artifacts before verification risks propagating incorrect assumptions. Evidence must precede claims.
**Source:** 08-03-SUMMARY.md (key-decisions)

---

## Lessons

### L-01: Missing Dev Dependencies Block RED Verification
The local worktree was missing installed dev dependencies even though `package.json` declared them. This blocked the RED (Run Early, Detect) test step.

**Context:** Plan 01 task 1 could not run vitest because node_modules was incomplete. The fix was `npm install --no-audit --no-fund`.
**Source:** 08-01-SUMMARY.md (issues)

---

### L-02: Tuple Predicates in TypeScript Normalizers Are Fragile
A per-key concurrency normalizer used an invalid tuple predicate and failed `tsc --noEmit`.

**Context:** The fix was to rewrite the helper to build a typed entry array explicitly. Type-level bugs in normalizers are easy to introduce and require full typecheck to catch.
**Source:** 08-01-SUMMARY.md (deviations)

---

### L-03: Notification Handler Regressions Surface During Full-Suite Runs
A notification-handler regression from Plan 02 was only exposed during the full-suite run for Plan 03.

**Context:** Bounded tests for Plan 02 passed. The regression only appeared when the full suite ran. This validates the rule: always run the full suite before claiming closure.
**Source:** 08-03-SUMMARY.md (issues)

---

### L-04: Stale Terminal Signals Must Be Suppressed at the Lifecycle Layer
Out-of-order lifecycle transitions (e.g., late async notifications) must be rejected at the reconciliation layer, not just in the observer.

**Context:** Without lifecycle reconciliation guarding against stale signals, a delayed async notification could overwrite a more recent terminal state.
**Source:** 08-02-SUMMARY.md (accomplishments)

---

### L-05: Runtime Policy Override Must Survive Continuity Reload
Policy overrides injected at dispatch time are meaningless if they disappear after a continuity reload.

**Context:** The real proof of `RUN-3h` is not the initial injection, but the persisted/reloaded override data driving tool-budget enforcement.
**Source:** 08-01-SUMMARY.md (decisions)

---

### L-06: Downstream Planning Gates Should Reference Corrected Dependency Chains
Later planning work must reference corrected sequences, not stale roadmap ordering.

**Context:** Phase 08 corrected the dependency chain between Phase 02 and downstream phases. Using the old ordering would create false dependencies.
**Source:** 08-03-SUMMARY.md (key-decisions)

---

## Patterns

### P-01: Trusted-Parent-Override-Inheritance
Thread runtime policy overrides from trusted parent state into child metadata without adding public tool arguments.

**When to use:** When a child session needs to inherit policy constraints from its parent session. Never expose override fields in tool arguments.
**Source:** 08-01-SUMMARY.md (patterns-established)

---

### P-02: Lifecycle-First-Parent-Observability
Parent-visible status follows continuity-backed lifecycle truth, with notifications as delivery artifacts.

**When to use:** Any system where parent sessions poll for child status. The lifecycle record is the single source of truth; notifications are optimizations.
**Source:** 08-02-SUMMARY.md (patterns-established)

---

### P-03: Pending-Notification-Fallback
When best-effort parent notification delivery fails, persist the notification for later retry instead of silently dropping.

**When to use:** Any async status delivery where dropped messages are unacceptable. Create a pending queue that the parent can drain on reconnection.
**Source:** 08-02-SUMMARY.md (patterns-established)

---

### P-04: Continuity-Backed-Session-Overrides
Normalize, clone, and hydrate runtime policy overrides through the continuity system so they survive reload.

**When to use:** Any session-level metadata that must persist across process restarts. The continuity system (not in-memory maps) is the canonical store.
**Source:** 08-01-SUMMARY.md (patterns-established)

---

### P-05: Notification-Success-Bool
Return a boolean from notification delivery so callers can persist fallback notifications while preserving best-effort UI behavior.

**When to use:** Any dual-channel notification (prompt + toast) where the prompt channel may fail but the toast channel should still fire.
**Source:** 08-02-SUMMARY.md (patterns-established)

---

### P-06: Evidence-Driven-Phase-Closure
Refresh verification artifacts with fresh full-suite evidence before updating roadmap/state closure claims.

**When to use:** Any corrective phase that modifies shared infrastructure. Bounded tests are necessary but not sufficient for closure claims.
**Source:** 08-03-SUMMARY.md (patterns-established)

---

## Surprises

### S-01: Full-Suite Pass Time Varies Wildly
Plan 01 (35 min), Plan 02 (32 min), Plan 03 (22 min). The verification-heavy plan took the least time.

**Impact:** Planning estimates should not assume uniform duration. Verification-only phases can be faster than implementation phases.
**Source:** 08-01/02/03-SUMMARY.md (duration fields)

---

### S-02: Boolean Return Contracts Have Unexpected Side Effects
Adding `return boolean` to `notifyParentSession()` to support fallback persistence accidentally broke toast delivery.

**Impact:** Changing return types of widely-used functions requires full-suite verification, not just unit tests of the changed function.
**Source:** 08-02-SUMMARY.md (deviations)

---

### S-03: Notification and Lifecycle Surfaces Are More Coupled Than Expected
Plan 02 expected two separate tasks (notification durability, stale-signal suppression) but they shared the same observer/process-runner surfaces.

**Impact:** Task boundaries in planning should be verified against actual code coupling. Coupled surfaces require atomic commits.
**Source:** 08-02-SUMMARY.md (deviations)

---

### S-04: Phase 02 Re-Verification Was the Longest Step
Despite being Plan 03 (the "verification" plan), the actual bounded corrective implementation took longer than the full-suite re-run.

**Impact:** Don't underestimate the time required to fix the runtime seam (Plan 01) and harden the observer (Plan 02). Verification is fast once the code is correct.
**Source:** 08-01/02/03-SUMMARY.md (duration fields)

---

*Phase 8 Learnings — extracted from completed plan artifacts*
*Source artifacts: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-CONTEXT.md*
