---
phase: 16
phase_name: "Background Delegation Revamp + PTY Integration"
project: "opencode-harness"
generated: "2026-04-22"
counts:
  decisions: 25
  lessons: 10
  patterns: 8
  surprises: 6
missing_artifacts:
  - "UAT files (no *-UAT.md found)"
---

# Phase 16 Learnings: Background Delegation Revamp + PTY Integration

## Decisions

### D-01: WaiterModel Preservation
Keep the WaiterModel delegation pattern from Phase 14 as the foundation for the revamp.

**Rationale:** The WaiterModel (dispatch + poll for completion) is battle-tested and the dual-signal completion model (tool-done + message-stability) is the right abstraction for background delegation.
**Source:** 16-CONTEXT.md

---

### D-02: Dual-Signal Completion Detection
Use two signals for delegation completion: tool-done (primary) and message-count stability (secondary), not fixed timeouts.

**Rationale:** Fixed timeouts are fragile and context-dependent. Message-count stability polling via `getSessionMessageCount()` provides runtime-adaptive completion detection.
**Source:** 16-CONTEXT.md, 16-05-PLAN.md

---

### D-03: Canonical Queue-Key Authority
`concurrency.ts` is the sole authority for queue-key computation. All delegation paths must use the canonical `getQueueKey()` function.

**Rationale:** Prevents key drift between tools and spawner paths. In Phase 14, mismatched queue keys caused concurrency violations.
**Source:** 16-CONTEXT.md, 16-04-PLAN.md

---

### D-04: Dual-Mode Execution Architecture (D-04A Amendment)
PTY for command/process surfaces only. SDK child-session path for agent delegations. This amends the original D-04 which proposed PTY for ALL delegations.

**Rationale:** Verification proved that PTY-only for agent delegations produced disconnected metadata. The child-session SDK path preserves OpenCode's internal tracking. PTY is correct for CLI/process surfaces where stream capture is needed.
**Source:** 16-CONTEXT.md, 16-VERIFICATION.md (D-04A amendment)

---

### D-05: Lazy PTY Loading with Graceful Fallback
Load `bun-pty` only when PTY features are actually needed. If unavailable, fall back to non-PTY path silently.

**Rationale:** PTY is a native module that may not build on all platforms. Lazy loading prevents import-time crashes and the fallback ensures the harness works without PTY support.
**Source:** 16-01-PLAN.md, 16-01-SUMMARY.md

---

### D-06: Bounded Output Buffer (pty-buffer.ts)
PTY output stored in a ring buffer with configurable max size. Never let PTY output grow unbounded.

**Rationale:** Background processes can produce massive output streams. Bounded buffers prevent memory exhaustion while preserving recent output for completion detection.
**Source:** 16-02-PLAN.md, 16-02-SUMMARY.md

---

### D-07: Single Lifecycle Owner
Each delegation has exactly one lifecycle owner. No shared mutable state between PTY and SDK paths.

**Rationale:** Prevents race conditions where PTY manager and SDK session manager both try to update the same delegation record.
**Source:** 16-CONTEXT.md

---

### D-08: DelegationManager Decomposition
Extract CommandDelegationHandler and SdkDelegationHandler from DelegationManager using callback-based composition.

**Rationale:** DelegationManager grew from 450 LOC to 687 LOC during integration. Extracting to 309 LOC (manager) + 285 LOC (command) + 161 LOC (sdk) respects the 500 LOC module limit and separates concerns.
**Source:** 16-04-SUMMARY.md, 16-06-SUMMARY.md

---

### D-09: Separate extractAssistantText Exports
Two different `extractAssistantText` functions with different semantics — one returns LAST assistant message, the other collects ALL messages. Both are separate exports.

**Rationale:** The Phase 14 baseline had an ambiguous single function that was misused. Explicit separate exports with clear names prevent semantic confusion.
**Source:** 16-01-PLAN.md, 16-01-SUMMARY.md

---

### D-10: No Fixed Timeouts for Completion
Never use `setTimeout` or fixed-duration waits for delegation completion. Use polling-based detection.

**Rationale:** Fixed timeouts are either too short (missed completions) or too long (wasted cycles). Polling with stability windows adapts to actual runtime behavior.
**Source:** 16-CONTEXT.md, 16-05-PLAN.md

---

### D-11: Runtime-Truthful Test Strategy
Tests must use real OpenCode SDK patterns (session-api wrappers), not mocked internals.

**Rationale:** Phase 14 tests mocked too aggressively and passed despite broken runtime behavior. Real SDK wrappers in tests catch integration issues.
**Source:** 16-VERIFICATION.md

---

### D-12: Concurrency Authority Centralization
`concurrency.ts` owns the queue-key computation, semaphore lifecycle, and FIFO ordering. No other module computes queue keys.

**Rationale:** Centralized authority prevents key format drift and ensures FIFO ordering is consistent across all delegation paths.
**Source:** 16-03-PLAN.md, 16-03-SUMMARY.md

---

### D-13: Thin Spawner Adapters
Spawner adapters (session creator, PTY setup) are thin wrappers around canonical functions, not independent implementations.

**Rationale:** Prevents logic duplication between SDK and PTY paths. Each adapter delegates to the canonical function in concurrency.ts or pty-manager.ts.
**Source:** 16-03-PLAN.md

---

### D-14: Thread childSessionId Through PTY Path
PTY-launched delegations must thread the childSessionId to link PTY output with the delegation record.

**Rationale:** Without childSessionId, PTY output is orphaned metadata not tied to any tracked delegation. Found in code review (WR-01).
**Source:** 16-REVIEW.md, 16-REVIEW-FIX.md

---

### D-15: Minimal PTY Environment Allowlist
PTY processes receive only explicitly allowlisted environment variables, not the full parent environment.

**Rationale:** Security: full environment variable passthrough leaks secrets and configuration to child processes. Found in code review (CR-01).
**Source:** 16-REVIEW.md, 16-REVIEW-FIX.md

---

### D-16: Expand Delegation Recovery Filter
Recovery after crash/restart must find delegations in `dispatched` state, not just `running`.

**Rationale:** If the harness crashes between dispatch and start, delegations are stranded in `dispatched` state and never recovered. Found in code review (WR-02).
**Source:** 16-REVIEW.md, 16-REVIEW-FIX.md

---

### D-17: Real Message-Count Stability Polling
Replace blind counter increment with `getSessionMessageCount()` for actual stability detection.

**Rationale:** The original implementation just incremented a counter — it didn't check if messages were actually stable. Real polling checks if the count has been stable for N consecutive checks.
**Source:** 16-05-PLAN.md, 16-05-SUMMARY.md

---

### D-18: Standalone PTY Tool (Gap Closure)
Add a standalone `pty-exec` tool for direct PTY process execution outside delegation flow.

**Rationale:** Users need PTY access for ad-hoc command execution without going through the full delegation pipeline. Provides utility and validates PTY infrastructure independently.
**Source:** 16-06-PLAN.md

---

### D-19: Dual-Mode Execution in DelegationManager
DelegationManager's `dispatch()` method routes to either SDK or PTY path based on delegation type, using callback-based handler composition.

**Rationale:** Clean separation of concerns while maintaining a single entry point. The manager doesn't need to know HOW execution happens, just WHICH handler to invoke.
**Source:** 16-04-SUMMARY.md, 16-06-SUMMARY.md

---

### D-20: 500 LOC Module Limit Enforcement
Any module exceeding 500 LOC must be decomposed before merge.

**Rationale:** Large modules become unmaintainable and violate the project's architecture rules. The DelegationManager 687→309 LOC refactor is the model.
**Source:** 16-CONTEXT.md, 16-04-SUMMARY.md

---

### D-21: Graceful Degradation for PTY
If bun-pty fails to load or PTY setup fails, silently fall back to non-PTY execution. Never crash.

**Rationale:** PTY is optional infrastructure. The harness must work without it, just without PTY features (stream capture, interactive process support).
**Source:** 16-01-SUMMARY.md, 16-02-SUMMARY.md

---

### D-22: PTY Manager Lifecycle
PtyManager follows acquire-use-release lifecycle with reference counting for shared PTY sessions.

**Rationale:** Prevents resource leaks from abandoned PTY sessions. Reference counting allows multiple delegations to share a PTY session safely.
**Source:** 16-02-PLAN.md

---

### D-23: Review Findings Must Be Fixed Atomically
Each code review finding (CR-01, WR-01, WR-02) gets its own atomic commit with verification.

**Rationale:** Atomic fixes prevent partial remediation and make rollback possible per-finding. Each fix is independently verifiable.
**Source:** 16-REVIEW-FIX.md

---

### D-24: 16.2 Requirements Scoping
24 requirements (8 P0, 10 P1, 6 P2) identified for Phase 16.2, with 6 already implemented in PTY wiring.

**Rationale:** Clear prioritization prevents scope creep. P0 items (grace periods, parent notifications, adaptive polling) are the minimum viable next step.
**Source:** 16.2-SPEC-2026-04-22.md

---

### D-25: Codebase Validation Before 16.2
Must fix partial merge breakage (undefined constants, missing imports) before starting 16.2 work.

**Rationale:** Current codebase has 3 typecheck errors and 58/71 test failures from a subagent's partial merge. This must be resolved before building on top.
**Source:** 16.2-SPEC-CODEBASE-VALIDATION-2026-04-22.md

---

## Lessons

### L-01: Verification-Backed Decision Amendments Work
The D-04A amendment (dual-mode instead of PTY-only) was discovered through verification, not planning.

**Context:** Original plan proposed PTY for ALL delegations. Verification showed disconnected metadata for agent delegations. The amendment preserved the WaiterModel while routing correctly per delegation type.
**Source:** 16-VERIFICATION.md

---

### L-02: LOC Growth During Integration is Inevitable
DelegationManager grew from 450→687 LOC during integration before refactoring down to 309.

**Context:** Integration often requires temporary growth before decomposition. The lesson: plan for a "grow then shrink" cycle, and enforce the 500 LOC limit as a post-integration gate, not a pre-integration constraint.
**Source:** 16-04-SUMMARY.md

---

### L-03: ExtractAssistantText Semantics Matter
Two functions with the same name but different return semantics (last message vs. all messages) caused subtle bugs.

**Context:** Phase 14 had a single ambiguous function. The fix: explicit separate exports with clear names. Lesson: when functions have different semantics, different names are mandatory.
**Source:** 16-01-SUMMARY.md

---

### L-04: Code Review Catches What Verification Misses
Code review found 3 issues (env leakage, orphaned metadata, missing recovery) that passed verification.

**Context:** Verification tested behavioral correctness (does it work?), but review caught security and operational issues (what leaks? what's orphaned?). Both are needed.
**Source:** 16-REVIEW.md

---

### L-05: Partial Merges Create Technical Debt Bombs
A subagent partially merged pruning code that introduced undefined constants and broken imports.

**Context:** The 16.2 SPEC validation found the codebase broken — 3 typecheck errors and 58/71 tests failing. The lesson: never allow partial merges. Either merge fully or not at all.
**Source:** 16.2-SPEC-CODEBASE-VALIDATION-2026-04-22.md

---

### L-06: Canonical Authority Pattern Prevents Drift
Centralizing queue-key computation in concurrency.ts eliminated format inconsistencies.

**Context:** Phase 14 had multiple modules computing queue keys independently, leading to mismatched keys and concurrency violations. The canonical authority pattern solved this completely.
**Source:** 16-03-SUMMARY.md, 16-04-SUMMARY.md

---

### L-07: Callback-Based Composition Over Inheritance
DelegationManager uses callback-based handler composition (inject SDK/PTY handlers) instead of class inheritance.

**Context:** The original design considered a Handler base class. Callbacks are simpler, more testable, and avoid deep inheritance hierarchies. Lesson: prefer composition over inheritance for delegation routing.
**Source:** 16-04-SUMMARY.md

---

### L-08: Stability Polling Needs Real Data
Blind counter increment for stability detection is meaningless — it doesn't check actual state.

**Context:** The original "stability" check just incremented a number. Real stability polling via `getSessionMessageCount()` checks if the count has been unchanged for N consecutive polls.
**Source:** 16-05-SUMMARY.md

---

### L-09: Gap Closure Plans Are High-Value
Plans 05 and 06 (gap closure) were the most impactful — they fixed real behavioral issues that the initial plans missed.

**Context:** The verification gap analysis identified specific defects. Plans 05-06 targeted those gaps precisely and closed them. Lesson: invest in gap analysis before gap closure.
**Source:** 16-05-PLAN.md, 16-06-PLAN.md, 16-VERIFICATION.md

---

### L-10: Lazy Loading Prevents Import-Time Failures
Loading bun-pty eagerly would crash on platforms where native modules can't build.

**Context:** The lazy-load pattern with dynamic `import()` and try/catch ensures the harness boots regardless of PTY availability. Lesson: native modules should always be lazy-loaded with graceful fallback.
**Source:** 16-01-SUMMARY.md

---

## Patterns

### P-01: Canonical Authority Pattern
A single module owns a computation and all consumers delegate to it.

**When to use:** When multiple modules need to compute the same value (queue keys, status transitions, type guards). Prevents format drift and ensures consistency.
**Source:** 16-03-PLAN.md, 16-04-PLAN.md

---

### P-02: Dual-Mode Handler with Callback Injection
A manager routes to different handlers based on type, injecting handlers via callbacks rather than hardcoding paths.

**When to use:** When a single entry point needs to support multiple execution strategies (SDK vs PTY, local vs remote). Callbacks allow runtime selection without coupling.
**Source:** 16-04-SUMMARY.md, 16-06-SUMMARY.md

---

### P-03: Grow-Then-Shrink Refactoring
Allow temporary LOC growth during integration, then enforce module size limits post-integration.

**When to use:** When integrating new features into existing modules. Growth is natural during wiring; decomposition follows once the integration is proven.
**Source:** 16-04-SUMMARY.md

---

### P-04: Verification-Backed Amendment
Use verification results to amend architectural decisions rather than treating plans as immutable.

**When to use:** When verification reveals that a planned approach has defects. Amend the decision with evidence rather than forcing the original plan through.
**Source:** 16-VERIFICATION.md, 16-CONTEXT.md

---

### P-05: Lazy-Load with Graceful Fallback
Load optional native modules lazily with try/catch and provide a non-native fallback path.

**When to use:** For any native module dependency (PTY, SQLite, native crypto). Ensures the application boots on all platforms.
**Source:** 16-01-PLAN.md, 16-01-SUMMARY.md

---

### P-06: Atomic Review Fix Commits
Each code review finding gets its own commit with its own verification, rather than a bulk fix commit.

**When to use:** For any code review with multiple findings. Enables per-finding rollback and independent verification.
**Source:** 16-REVIEW-FIX.md

---

### P-07: Two-Signal Completion Detection
Use a primary signal (tool-done) and a secondary signal (message-count stability) for completion, with no fixed timeouts.

**When to use:** For any async operation where completion timing is unpredictable. The secondary signal catches cases where the primary signal is unreliable.
**Source:** 16-CONTEXT.md, 16-05-PLAN.md

---

### P-08: Bounded Ring Buffer for Streaming Output
Store streaming output in a ring buffer with configurable max size, discarding oldest entries when full.

**When to use:** For any long-running process that produces continuous output. Prevents memory exhaustion while preserving the most recent output.
**Source:** 16-02-PLAN.md, 16-02-SUMMARY.md

---

## Surprises

### S-01: DelegationManager LOC Tripled Then Halved
DelegationManager went 450→687→309 LOC — the growth was expected but the final reduction to BELOW the original was surprising.

**Impact:** Positive: the final 309 LOC is the cleanest version yet, with clear separation of concerns. The extraction to CommandDelegationHandler (285 LOC) and SdkDelegationHandler (161 LOC) was unplanned but architecturally superior.
**Source:** 16-04-SUMMARY.md

---

### S-02: Verification Score Was Higher Than Expected
Initial verification scored 10/11 must-haves, which was higher than expected given the scope of changes.

**Impact:** Positive: the dual-signal completion architecture proved robust. The one gap (blind counter increment) was a known design debt, not a fundamental flaw.
**Source:** 16-VERIFICATION.md

---

### S-03: Code Review Found Security Issues Verification Missed
CR-01 (PTY environment variable leakage) was a security issue that behavioral verification couldn't catch.

**Impact:** Medium: led to the decision that security review is mandatory for any PR that touches process spawning or environment passing.
**Source:** 16-REVIEW.md

---

### S-04: A Subagent Partially Merged Breaking Code
A subagent's partial merge of pruning code left the codebase with 3 typecheck errors and 58/71 test failures.

**Impact:** High: blocks all 16.2 work until fixed. Demonstrates the risk of allowing subagents to merge without post-merge verification gates.
**Source:** 16.2-SPEC-CODEBASE-VALIDATION-2026-04-22.md

---

### S-05: extractAssistantText Had Hidden Semantic Split
The "same" function had two different return semantics depending on usage context, and no one noticed during Phase 14.

**Impact:** Medium: caused subtle bugs where some callers got the last message and others got all messages. The fix (separate named exports) should have been done in Phase 14.
**Source:** 16-01-SUMMARY.md

---

### S-06: Dual-Mode Architecture (D-04A) Was Discovered, Not Planned
The original plan proposed PTY for everything. The dual-mode SDK/PTY split was discovered through verification, not foreseen in planning.

**Impact:** High: the dual-mode architecture is now the core design principle. It would have been a critical miss if verification hadn't caught the disconnected metadata issue.
**Source:** 16-VERIFICATION.md, 16-CONTEXT.md
