---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 04
type: execute
wave: 3
depends_on:
  - CP-ST-06-02
  - CP-ST-06-03
files_modified:
  - src/features/session-tracker/persistence/retry-queue.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/persistence/session-writer.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/types.ts
  - tests/features/session-tracker/persistence/retry-queue.test.ts
  - tests/features/session-tracker/persistence/child-writer.test.ts
  - tests/features/session-tracker/integration/last-message.test.ts
autonomous: true
requirements:
  - RC-4
  - RC-5
  - GA-1
must_haves:
  truths:
    - "Child write failures propagate and create durable retry records; no silent data loss."
    - "Retry queue flushes on initialization and periodic interval; after 5 failures child is degraded."
    - "Full last non-user message is stored for main and child records without truncation."
  artifacts:
    - path: "src/features/session-tracker/persistence/retry-queue.ts"
      provides: "Durable failed child write queue"
      exports: ["ChildWriteRetryQueue"]
    - path: "src/features/session-tracker/persistence/child-writer.ts"
      provides: "Propagating child write queue and retry integration"
      max_lines: 500
    - path: "src/features/session-tracker/persistence/session-writer.ts"
      provides: "Main session full lastMessage metadata"
      max_lines: 500
  key_links:
    - from: "ChildWriter.enqueueWrite"
      to: "ChildWriteRetryQueue"
      via: "caller-visible rejection + persisted retry record"
      pattern: "retry"
    - from: "EventCapture.writeImmediateChildFile"
      to: "ChildWriteRetryQueue/ChildWriter"
      via: "same retry/error surface, no best-effort swallow"
      pattern: "writeImmediateChildFile"
---

<objective>
Implement durable retry queue/error propagation and full lastMessage preservation.

Purpose: GA-1 requires no silent child data loss. RC-4 requires resume context to keep full assistant/tool content across L0/L1/L2 records.

Output: Dedicated retry queue, ChildWriter/EventCapture retry integration, updated lastMessage semantics and tests.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
@src/features/session-tracker/persistence/atomic-write.ts
@src/features/session-tracker/persistence/child-writer.ts
@src/features/session-tracker/persistence/session-writer.ts
@src/features/session-tracker/capture/event-capture.ts
@src/features/session-tracker/types.ts
@tests/features/session-tracker/persistence/retry-queue.test.ts
@tests/features/session-tracker/persistence/child-writer.test.ts
@tests/features/session-tracker/integration/last-message.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add durable child write retry queue</name>
  <files>src/features/session-tracker/persistence/retry-queue.ts, src/features/session-tracker/types.ts, tests/features/session-tracker/persistence/retry-queue.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/persistence/atomic-write.ts
    - src/features/session-tracker/persistence/pending-dispatch-registry.ts
    - src/features/session-tracker/types.ts
    - tests/features/session-tracker/persistence/retry-queue.test.ts
  </read_first>
  <behavior>
    - Retry records persist under `.hivemind/session-tracker/` using safe paths and atomic JSON writes.
    - Max retries = 5 with backoff schedule 1s, 2s, 4s, 8s, 16s per GA-1.
    - After 5 failures the child record/retry entry is marked degraded and `[Harness]` error is logged.
  </behavior>
  <action>Create `ChildWriteRetryQueue` (or equivalent exported class) with JSDoc. It must support enqueueing failed child operations, persisting retry records, flushing on initialize, periodic flushing every 30s from the lifecycle wiring, and degraded marking after max retries. Do not add external dependencies.</action>
  <acceptance_criteria>
    - `test -f src/features/session-tracker/persistence/retry-queue.ts` passes.
    - `grep -n 'maxRetries\|MAX_RETRIES\|5' src/features/session-tracker/persistence/retry-queue.ts` proves max retry cap.
    - `grep -n '30000\|30_000' src/features/session-tracker/persistence/retry-queue.ts` proves periodic interval constant or exported config.
    - `npx vitest run tests/features/session-tracker/persistence/retry-queue.test.ts` passes.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/retry-queue.test.ts</automated>
  </verify>
  <done>Durable retry queue exists and passes its scoped tests.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Wire ChildWriter and EventCapture to propagate failures and retry</name>
  <files>src/features/session-tracker/persistence/child-writer.ts, src/features/session-tracker/capture/event-capture.ts, tests/features/session-tracker/persistence/child-writer.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/retry-queue.ts
    - src/features/session-tracker/capture/event-capture.ts
    - tests/features/session-tracker/persistence/child-writer.test.ts
  </read_first>
  <behavior>
    - `enqueueWrite()` returns a rejecting promise to callers when the write fails.
    - Internal serial queue remains usable after a failed write.
    - `EventCapture.writeImmediateChildFile()` uses the same retry/error surface and does not hide failures permanently.
  </behavior>
  <action>Replace the swallow pattern with: internal queue catches only to keep serialization alive; returned operation rejects; failed child write is recorded in retry queue with child session ID, operation type, error message, and attempt count. Add `[Harness]` logs including child session ID. Wire immediate child writes in `EventCapture` into this same path.</action>
  <acceptance_criteria>
    - `grep -n 'catch(() => {})' src/features/session-tracker/persistence/child-writer.ts` returns no matches.
    - `grep -n '\[Harness\].*child' src/features/session-tracker/persistence/child-writer.ts src/features/session-tracker/capture/event-capture.ts` returns logging paths.
    - `npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts tests/features/session-tracker/persistence/retry-queue.test.ts` passes.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts tests/features/session-tracker/persistence/retry-queue.test.ts</automated>
  </verify>
  <done>Child write failures are observable, retryable, and no longer silently swallowed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Preserve full lastMessage for main and child records</name>
  <files>src/features/session-tracker/persistence/child-writer.ts, src/features/session-tracker/persistence/session-writer.ts, src/features/session-tracker/types.ts, tests/features/session-tracker/integration/last-message.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/session-writer.ts
    - src/features/session-tracker/types.ts
    - tests/features/session-tracker/integration/last-message.test.ts
  </read_first>
  <behavior>
    - Any assistant/tool turn updates `lastMessage` to full content for child JSON.
    - Main `.md` frontmatter or equivalent machine-readable metadata stores full last non-user message.
    - No 200-char truncation/summary semantics remain in types/docs for `lastMessage`.
  </behavior>
  <action>Update child and main persistence so full last non-user content is retained. If main lastMessage is stored in YAML frontmatter, use existing `SessionWriter.updateFrontmatter()`/atomic write patterns. Update stale type comments that describe `lastMessage` as summary/truncated content.</action>
  <acceptance_criteria>
    - `grep -n 'first 200\|summary' src/features/session-tracker/types.ts` returns no stale `lastMessage` truncation comment.
    - `npx vitest run tests/features/session-tracker/integration/last-message.test.ts` passes.
    - A test uses a long message over 500 characters and asserts exact equality, not prefix/contains only.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/integration/last-message.test.ts</automated>
  </verify>
  <done>Full last non-user message is persisted for L0/L1/L2 records without pruning.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem write failures → session state truth | Failed child writes can otherwise disappear. |
| long assistant/tool content → YAML/JSON persistence | Content must not be truncated or corrupted. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-06-07 | Repudiation | ChildWriter/EventCapture | mitigate | Persist retry record and log `[Harness]` with child session ID on failure. |
| T-CP-ST-06-08 | Information disclosure | lastMessage persistence | accept | Session tracker already stores conversation content; this phase preserves full content for recovery under existing state root. |
| T-CP-ST-06-09 | Tampering | retry record paths | mitigate | Use existing safe path/atomic write helpers under `.hivemind/session-tracker/`. |
</threat_model>

<verification>
Run retry/child-writer/last-message scoped tests, `npm run typecheck`, and LOC checks for touched modules.
</verification>

<success_criteria>
- GA-1 retry behavior is implemented and tested.
- RC-4 full lastMessage behavior is implemented and tested.
- No silent `catch(() => {})` remains in ChildWriter child write queue.
</success_criteria>

<source_audit>
GOAL: covers delete-on-idle/data-loss root cause, full content root cause, and retry queue decision.
REQ: RC-4, RC-5, GA-1 covered.
RESEARCH: retry queue, EventCapture swallow, and lastMessage findings covered.
CONTEXT: GA-1 implemented exactly; no external dependency added.
</source_audit>

<output>
After completion, create `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-04-SUMMARY.md`.
</output>
