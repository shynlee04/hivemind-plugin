---
phase: 13
phase_name: fix-async-delegated-result-capture-and-persist-child-session
research_date: "2026-04-14"
researcher: gsd-phase-researcher
status: complete
depends_on: "Phase 12 (COMPLETE)"
key_files:
  - src/lib/lifecycle-background-observer.ts
  - src/lib/lifecycle-process-runner.ts
  - src/lib/session-api.ts
  - src/lib/continuity.ts
  - src/lib/notification-handler.ts
  - src/lib/delegation-packet.ts
  - src/lib/types.ts
  - src/lib/pending-notifications.ts
  - src/lib/delegation-export.ts
  - src/lib/tasking/completion/completion-verifier.ts
  - src/lib/tasking/completion/start-gate.ts
---

# Phase 13 Research: Async Delegated Result Capture

## Executive Summary

**The core problem:** When a delegated child session completes asynchronously, the system correctly detects completion (lifecycle phase → "completed") and notifies the parent, but it does NOT capture or persist the child's work product — the assistant's final output text, the transcript of messages exchanged, or the evidence (tool calls made, files touched, commits created). The parent gets a "completed" notification with a `session://<id>` link but no actual content.

## Research Question Answers

### RQ1: How does the current system detect completion but fail to capture results?

**Detection path (works):**
1. `runLifecycleSubsessionTask()` in `lifecycle-process-runner.ts:313` dispatches async via `sendPromptAsync()` and fires `observeBackgroundCompletion()`
2. `lifecycle-background-observer.ts:117` polls via `checkSessionExists()` + `getCombinedEvidenceCount()`
3. `CompletionVerifier.check()` confirms 2 consecutive idle polls + start-gate evidence
4. On completion: `patchLifecycle()` → phase "completed", then `notifyParentSession()` sends notification

**Result capture gap (broken/missing):**
- At `lifecycle-background-observer.ts:271-293`, when `statusType === "idle" && completionCheck.status === "completed"`, the code patches lifecycle to "completed" and notifies the parent, but **never calls `getSessionMessages()` to extract the final assistant output**.
- The `getCombinedEvidenceCount()` helper at line 61-72 already fetches messages for counting but only returns a number — it discards the actual message content.
- `CompletionVerifier.check()` at `completion-verifier.ts:33` also fetches `getSessionMessages()` but only uses `messages.length` — discards all content.
- For the **builtin-process** family (`runLifecycleProcessTask`), the `finalizeProcessResult()` at line 49 does capture `result.stdout` but only for sync return — the async path at line 164-228 calls `finalizeProcessResult()` but the output is only used locally and never persisted to continuity.

**Summary:** Messages are fetched multiple times during polling for counting purposes, but no code path extracts the actual assistant response text or persists it.

### RQ2: Where should result capture be inserted?

**Best insertion point: `lifecycle-background-observer.ts`** — specifically at the completion detection site (lines 271-293).

Reasons:
1. This is where completion is authoritatively detected for the `builtin-subsession` family (the most important family)
2. The `client` is already available here
3. `sessionID` is known
4. `getSessionContinuity()` is already called here
5. The notification is built here — the result should be available before notification

**For the `builtin-process` family:** `lifecycle-process-runner.ts` lines 164-228 (async process completion handler). The `finalizeProcessResult()` already has the output — it just needs to be persisted.

**Architecture options:**

| Option | Where | Pros | Cons |
|--------|-------|------|------|
| A. Inline in observer | `lifecycle-background-observer.ts` completion branches | Minimal new code, same context | Increases LOC of already-large observer |
| B. New `result-capture.ts` module | Separate module called from observer | Clean separation, testable | New file, dependency wiring |
| C. Extend `CompletionVerifier` | Return captured result as part of `CompletionCheckResult` | Reuse existing message fetching | Couples detection with capture |

**Recommendation: Option B** — a new `src/lib/result-capture.ts` module (~100-150 LOC) that:
- Takes `client` + `sessionID`
- Fetches final messages via `getSessionMessages()`
- Extracts assistant text, tool call summary, artifact paths
- Returns a `CapturedResult` type
- Is called from both `lifecycle-background-observer.ts` and `lifecycle-process-runner.ts`

### RQ3: What does "transcript" mean in OpenCode context?

In OpenCode, a session's "transcript" is the **full message history** returned by `client.session.messages()`:
- User messages (role: "user") — the prompts sent
- Assistant messages (role: "assistant") with parts array containing:
  - `text` parts — the assistant's response text
  - `reasoning`/`thinking`/`redacted_thinking` parts — chain-of-thought
  - `tool-call`/`tool_call`/`tool` parts — tool invocations (name, arguments)
  - `tool-result` parts — tool outputs
- System messages if any

The `getSessionMessages()` function in `session-api.ts:53-66` returns these as `unknown[]`.

For result capture, the "transcript" we need to persist includes:
1. **Assistant text parts** — the actual output the agent produced
2. **Tool call records** — which tools were called with what arguments (shows what the agent did)
3. **File paths mentioned** — artifacts touched/created (extracted from tool call arguments)
4. **Git commits** — if `git commit` was called (extracted from bash tool outputs)

### RQ4: What does "evidence" mean?

"Evidence" in the harness context has two meanings:

1. **Completion evidence** (already implemented): The `StartGateEvidence` type in `tasking/completion/types.ts` — thinkingBlocks, toolCalls, assistantMessages counts used to verify work started and completed.

2. **Work product evidence** (what Phase 13 needs to add): The actual outputs and side-effects of the child session:
   - **Artifact paths**: Files created/modified (extract from tool call args like `Write`, `Edit` tool paths)
   - **Git commits**: SHA references if `git commit` was called (extract from bash tool output)
   - **Result text**: The final assistant message content
   - **Tool call summary**: List of tools invoked with brief description of what they did

The `DelegationPacket` type already has `artifacts: string[]` and `commits: string[]` fields — they are initialized empty but never populated. Phase 13 should populate them.

### RQ5: Where should persisted results be stored?

**Three storage locations, all viable:**

| Location | What to store | Size concern | Current usage |
|----------|---------------|-------------|---------------|
| Continuity JSON (`SessionContinuityMetadata`) | Result summary, extracted artifacts/commits, resultPreview | Low — metadata only | Already stores lifecycle, delegation, notifications |
| `DelegationPacket` | artifacts[], commits[] — file paths and commit SHAs | Low — arrays of strings | Already has these fields, always empty |
| Separate transcript files (`.opencode/state/opencode-harness/transcripts/`) | Full message history JSON | High — could be KB-MB per session | Not implemented yet |

**Recommendation: Layered approach**

1. **Immediate (Phase 13):** Store result summary in continuity JSON + populate `DelegationPacket.artifacts[]` and `.commits[]`
2. **Future (Phase 9.3 or later):** Optional full transcript export to separate files, controlled by config

**Types needed:**
```typescript
type CapturedResult = {
  resultText: string           // Final assistant text (truncated to reasonable limit)
  artifactPaths: string[]      // File paths from Write/Edit tool calls
  gitCommits: string[]         // Git commit SHAs from bash tool output
  toolCallSummary: ToolCallSummary[]  // Brief summary of tools invoked
  messageCount: number         // Total messages in transcript
  capturedAt: number           // Timestamp
}

type ToolCallSummary = {
  tool: string
  args?: string  // Truncated argument summary
}
```

**Storage in `SessionContinuityMetadata`:**
```typescript
// New optional field on SessionContinuityMetadata
resultCapture?: CapturedResult
```

### RQ6: What is the parent session's interface for consuming child results?

Currently the parent receives:
1. **Async dispatch response** — JSON with `session_id`, `output_link: "session://<id>"`, `instruction: "Task dispatched..."` (from `lifecycle-dispatcher.ts:359-383`)
2. **Completion notification** — `<system_reminder>` block via `notifyParentSession()` containing `TaskNotification` with `briefSummary` (generic text like "Researcher completed research...") and `outputLink: "session://<id>"`
3. **Pending notifications** — If parent was offline, notifications are stored in `pendingNotifications[]` on the parent's continuity record

**What the parent DOESN'T get:**
- The actual assistant output text
- File paths created/modified by the child
- Git commits made by the child
- Any actionable content — just a link to a session ID

**Phase 13 should enhance:**
1. `TaskNotification` — add `resultPreview` (first ~500 chars of assistant output), `artifacts` (file paths), `commits` (git SHAs)
2. The notification message — include actual content, not just "completed"
3. `CapturedResult` persisted in continuity — parent can query child session continuity to get full details
4. Pending notification enrichment — when notifications are surfaced on resume, include result summary

### RQ7: How does oh-my-openagent handle result capture?

From the project's `.opencode/skills/oh-my-openagent-reference/` skill:

The oh-my-openagent architecture handles background session results through:
1. **`BackgroundManager`** — captures stdout/stderr from spawned processes (already adapted in this codebase at `src/lib/background-manager.ts`)
2. **`TmuxSessionManager`** — captures pane output content via tmux pipe commands
3. **Direct message injection** — results are injected into the parent session's message stream

The key OMO pattern is: **capture at the boundary where the execution family produces output**, then persist to a shared store. The harness already has this pattern for `builtin-process` (stdout capture) but is missing it for `builtin-subsession` (SDK message capture).

**What to adapt:**
- OMO's pattern of capturing output at the execution-family boundary
- OMO's result persistence in the session metadata store
- NOT OMO's tmux pipe approach (we use polling instead)

### RQ8: What are the failure modes?

| Failure Mode | Current Behavior | Phase 13 Risk | Mitigation |
|--------------|-----------------|---------------|------------|
| Child crashes mid-work | Observer detects "deleted" or timeout → marks failed | No results to capture | Capture partial results (messages up to crash point) |
| Partial results (child worked but didn't finish all tasks) | Timeout → retry logic → eventual fail or partial complete | Result may be incomplete | Mark as `partial: true` in captured result |
| `getSessionMessages()` fails at capture time | Unhandled — would crash observer | New failure point | Wrap in try/catch, log warning, continue with empty result |
| Result too large for continuity JSON | N/A — not stored today | Continuity file bloat | Truncate text to 10KB limit, store full transcript in separate file |
| Parent session gone before notification | Notification persisted as pending | No change needed — already handled | Enrich pending notification with captured result |
| Multiple notifications for same session | Only one notification sent | No duplication risk | Check if result already captured before re-capturing |
| Process stdout vs. subsession messages differ | Different code paths already | Need capture for both families | Shared `CapturedResult` type, family-specific extraction |

## Current Code Flow Analysis

### Async Subsession (builtin-subsession) — Primary Path

```
delegate-task tool call
  → lifecycle-manager.launchDelegatedSession()
    → lifecycle-dispatcher.launchDelegatedSession()
      → createSession() + recordSessionContinuity()
      → sendPromptAsync() (fire-and-forget)
      → observeBackgroundCompletion()
        → POLL LOOP:
          → checkSessionExists() (direct lookup)
          → getCombinedEvidenceCount() (fetches messages, DISCARDS content)
          → CompletionVerifier.check() (fetches messages, DISCARDS content)
          → Start gate check → promote to "running" + notify "started"
          → Completion check → promote to "completed" + notify "completed"
          ❌ RESULT NEVER CAPTURED
        → FINALLY: releaseQueue()
```

### Async Process (builtin-process) — Secondary Path

```
delegate-task tool call
  → lifecycle-manager.launchDelegatedSession()
    → lifecycle-dispatcher.launchDelegatedSession()
      → createSession() + recordSessionContinuity()
      → backgroundManager.spawn()
      → backgroundManager.onComplete().then():
        → finalizeProcessResult() → captures stdout ✓
        → notifyParentSession() ✓
        → stdout available in .then() but NOT PERSISTED ❌
        → NOT written to continuity ❌
```

### Sync Paths — Working

```
Sync subsession: sendPrompt() → extractTextFromResponse() → base64-encoded envelope ✓
Sync process: backgroundManager.onComplete() → finalizeProcessResult() → returns stdout ✓
```

Sync paths already capture results. Only async paths are broken.

## Identified Gaps

### Gap 1: No result extraction on async subsession completion
**File:** `lifecycle-background-observer.ts:271-293`
**Fix:** After completion detection, call `getSessionMessages()` and extract assistant text + tool call summary + artifacts

### Gap 2: No result persistence on async process completion
**File:** `lifecycle-process-runner.ts:164-228`
**Fix:** Persist `finalizeProcessResult()` output to continuity via `patchSessionContinuity()` or `patchSessionDelegationPacket()`

### Gap 3: `DelegationPacket.artifacts[]` and `.commits[]` never populated
**Files:** `delegation-packet.ts` (has `addArtifact()`, `addCommit()` but they have zero callers)
**Fix:** During result capture, extract artifact paths and commit SHAs, then call `patchSessionDelegationPacket()` to populate these arrays

### Gap 4: `TaskNotification` lacks result content
**File:** `notification-handler.ts:6-16`
**Fix:** Add optional `resultPreview`, `artifacts`, and `commits` fields to `TaskNotification` type. Populate from captured result.

### Gap 5: No `CapturedResult` type in the type system
**File:** `types.ts`
**Fix:** Add `CapturedResult` type to `SessionContinuityMetadata`

### Gap 6: `buildTaskNotificationFromContinuity()` produces generic summaries
**File:** `notification-handler.ts:93-127`
**Fix:** When captured result is available, use actual content instead of generic text

## Dependencies and Constraints

### Upstream (what Phase 13 depends on)
- Phase 12 (COMPLETE): Truthful start semantics — ensures we only capture results when the session genuinely started and completed
- `getSessionMessages()` in `session-api.ts` — the SDK call that returns message history (already exists, works)
- `patchSessionContinuity()` and `patchSessionDelegationPacket()` — persistence functions (already exist, work)

### Downstream (what depends on Phase 13)
- Phase 9.3 (Module Restructuring) — should not start before result capture is solid
- Phase 5 (Integration Verification) — needs real results to verify end-to-end
- Parent session consuming child results — the primary consumer

### Constraints
- **Max module size: 500 LOC** — new result-capture module should stay under 200 LOC
- **No new dependencies** — use existing `session-api.ts`, `continuity.ts`, `delegation-packet.ts`
- **Backward compatible** — `CapturedResult` field is optional on `SessionContinuityMetadata`
- **No `any` types** — new code must be properly typed
- **Deep-clone-on-read** — any `CapturedResult` stored in continuity must be cloned on read

## Recommended Module Structure

```
src/lib/
├── result-capture.ts          (~150 LOC) — NEW
│   • CapturedResult type
│   • captureSubsessionResult(client, sessionID) → CapturedResult
│   • captureProcessResult(stdout, stderr) → CapturedResult
│   • persistCapturedResult(sessionID, result) → void
│   • extractArtifactsFromMessages(messages) → string[]
│   • extractCommitsFromMessages(messages) → string[]
│   • extractAssistantText(messages) → string
│
├── lifecycle-background-observer.ts  (MODIFY)
│   • Import captureSubsessionResult from result-capture
│   • At completion branch (L271-293): capture + persist before notification
│   • At deleted/failed branches: attempt partial capture
│
├── lifecycle-process-runner.ts  (MODIFY)
│   • Import captureProcessResult from result-capture
│   • In async .then() handler (L164-228): persist result after finalize
│
├── notification-handler.ts  (MODIFY)
│   • Extend TaskNotification with resultPreview, artifacts, commits
│   • buildTaskNotificationFromContinuity: use captured result if available
│
├── delegation-packet.ts  (MINOR MODIFY)
│   • populateArtifactsAndCommits() — new function to batch-update packet
│
├── types.ts  (MODIFY)
│   • Add CapturedResult to SessionContinuityMetadata
│
├── continuity-clone.ts  (MODIFY)
│   • Add cloneCapturedResult function
│
└── continuity-normalizers.ts  (MODIFY)
│   • Normalize incoming CapturedResult from disk
```

## Test Strategy Considerations

Current test situation:
- 668 tests pass but are **mock-heavy** — no real child sessions
- `lifecycle-background-observer.test.ts` mocks `getSessionMessages` return value
- `delegate-task.test.ts` mocks SDK transport

For Phase 13 testing:
1. **Unit tests for `result-capture.ts`** — pure functions, easy to test with mock messages
2. **Extend existing observer tests** — add assertions that capture functions are called on completion
3. **Extend existing runner tests** — add assertions that process results are persisted
4. **Integration test (future)** — spawn real child sessions and verify end-to-end result capture

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `getSessionMessages()` returns different shapes than expected | HIGH | Defensive parsing with graceful fallback to empty arrays |
| Large result text bloats continuity JSON | MEDIUM | Truncate text at 10KB, store pointer to full transcript |
| Race condition: capture happens during ongoing work | LOW | Only capture after completion is authoritatively detected (2 consecutive idle polls) |
| Breaking change to continuity format | LOW | `resultCapture` is optional field — old records work fine |

## Summary of What the Planner Needs to Know

1. **Two code paths need fixing:** async subsession (`lifecycle-background-observer.ts`) and async process (`lifecycle-process-runner.ts`)
2. **New module recommended:** `src/lib/result-capture.ts` (~150 LOC) with pure extraction functions
3. **Storage:** `CapturedResult` as optional field on `SessionContinuityMetadata` + populate existing `DelegationPacket.artifacts[]` and `.commits[]`
4. **Notification enrichment:** `TaskNotification` should carry actual result content, not just generic summaries
5. **The `getSessionMessages()` SDK call is already available and used for counting** — we just need to stop discarding the content
6. **Existing `addArtifact()` and `addCommit()` functions** in `delegation-packet.ts` have zero callers — Phase 13 should be their first consumer
7. **Sync paths already work** — only async paths need fixing
8. **Estimated scope:** 3-4 files modified, 1 new file, ~300-400 total LOC change

## RESEARCH COMPLETE
