# Real OpenCode SDK Runtime Adapter Design

> Date: 2026-04-15
> Status: Approved design for runtime-adapter recovery slice

## Goal

Make `delegate-task` work against the real OpenCode runtime contract now by implementing the full Option 2 adapter fix: use the correct runtime status API, normalize real assistant/tool message parts, and relax completion gating so background child sessions can be observed truthfully without requiring the later event-stream redesign.

## Problem Statement

`delegate-task` currently fails because the harness is reading the OpenCode runtime through the wrong contract.

- `session.get()` is currently treated as if it exposes authoritative runtime execution state, but in practice it is metadata-oriented and not trustworthy for idle/busy/retry truth.
- `session.status()` is the real runtime source for session state, but the current observer path uses it as a fallback instead of the primary runtime signal.
- Result capture expects legacy tool-part fields (`part.name`, `part.arguments`, `part.output`) that do not match the real runtime shape.
- Real tool parts use `part.tool`, `part.state.input`, and `part.state.output`, so current capture logic misses meaningful work and completion evidence.
- `session.prompt()` already returns structured assistant output, but the wrapper forces `parseAs: "text"` and then reinterprets the payload with heuristics.
- Start and completion checks are over-constrained for real delegated children, so sessions can do real work and still fail promotion or completion.
- `promptAsync()` acceptance only proves transport acceptance; it does not prove that the child started meaningful work.

The current implementation therefore confuses metadata, transport acknowledgment, and real execution truth. Option 2 fixes that mismatch without trying to land the full event-stream architecture in the same slice.

## Chosen Approach

Implement full Option 2 now.

Option 2 introduces a runtime-adapter layer inside the existing polling architecture:

- treat `session.status()` as the authoritative runtime status source
- treat `session.get()` as metadata lookup only
- consume `session.prompt()` as structured assistant output instead of text-forced output
- normalize assistant tool parts to the real SDK shape before start-gate, completion, and result-capture logic consume them
- redefine running/completion evidence around real assistant/tool activity rather than transport heuristics

This keeps the single-path recovery design intact while aligning the harness with the real SDK/runtime contract.

## Rejected Alternatives

### Minimal Patch

A minimal patch would swap a few field names or reorder a few fallbacks, but it would leave the wrong truth model in place. That would preserve the deeper bug: metadata APIs and transport acknowledgments would still be mixed with runtime execution evidence. The result would be a fragile fix that only works for the currently observed failure shape.

### Immediate Full Option 3

Option 3 remains the desired end-state, but landing it now would combine contract repair with an architectural redesign. That is too much change for a recovery slice whose first responsibility is to make delegated children work against the real runtime today. Polling is already present, persisted continuity already exists, and the current failure is primarily a contract mismatch. Option 2 fixes the contract first while deliberately leaving seams for the later event-stream transition.

## Runtime Truth Model

The design separates three kinds of truth that are currently conflated:

### Metadata Truth

- Source: `session.get()`
- Use for: session existence, parent linkage, static identifiers, non-runtime metadata
- Must not be used as authoritative proof of `idle`, `busy`, or `retry`

### Runtime Status Truth

- Source: `session.status()`
- Use for: current session runtime state such as `idle`, `busy`, and `retry`
- This is the authoritative runtime status input for polling and completion state transitions

### Work Evidence Truth

- Source: assistant messages and normalized tool parts from `session.messages()` and structured `session.prompt()` responses
- Use for: proving that real delegated work started, progressed, and produced output
- Evidence includes assistant text, tool-part presence, tool-part state transitions, and tool-part input/output payloads

The harness should only mark a child as meaningfully running when work evidence exists. Runtime status can confirm that the child is active or idle, but it does not prove substantive progress by itself. Likewise, `promptAsync()` acceptance is a dispatch signal only, not start evidence.

## Architecture Changes By Module

### `src/lib/session-api.ts`

- Remove the forced `parseAs: "text"` path from `sendPrompt()`.
- Return the structured `session.prompt()` payload as the canonical response shape.
- Keep `getSession()` for metadata retrieval only.
- Keep `getSessionStatusMap()` as the canonical runtime status accessor and document it as authoritative for idle/busy/retry.
- Add small adapter helpers if needed for extracting structured assistant messages or normalizing SDK response envelopes, but do not embed lifecycle policy here.

### `src/lib/result-capture.ts`

- Replace legacy tool-part assumptions with real-shape extraction:
  - tool name from `part.tool`
  - input from `part.state.input`
  - output from `part.state.output`
  - status from `part.state.status`
- Keep assistant text capture separate from tool capture.
- Treat normalized tool parts as the only source for tool summaries, artifact discovery, and output scraping.
- Fail soft when parts are partial or still running.

### `src/lib/tasking/completion/start-gate.ts`

- Stop requiring the current reasoning-plus-two-tool-call gate as the only valid proof of start.
- Switch to a more truthful gate that accepts real delegated-child evidence, such as assistant response presence, normalized tool-part activity, or explicit tool state transitions.
- Preserve the invariant that transport acceptance alone is insufficient.

### `src/lib/tasking/completion/completion-verifier.ts`

- Continue to use stability checks, but consume the revised start-gate evidence.
- Completion should require authoritative runtime idle state plus stable evidence that substantive work occurred.
- The verifier must tolerate children that do useful work with fewer tool calls or without exposed reasoning parts.

### `src/lib/lifecycle-background-observer.ts`

- Use `session.status()` as the primary runtime signal on each poll.
- Use `session.get()` only for metadata/existence fallback behavior, not for runtime-state interpretation.
- Promote `queued -> running` from normalized work evidence, not from async dispatch acknowledgment.
- Drive `completed` from authoritative idle status plus completion-verifier success.
- Keep the dead-start timeout, but define dead start as absence of meaningful evidence, not absence of status churn.

### `src/lib/types.ts` and completion-related types

- Update evidence-related types so they can represent normalized tool-part activity instead of only counting legacy-style tool-call shapes.
- Keep the external continuity model stable where possible, but make internal evidence types reflect the real SDK structure.

## Option 2 Boundary

This slice fixes the runtime adapter and truth model inside the current polling architecture.

It does not:

- replace polling with streaming
- redesign the completion pipeline around event subscriptions
- remove the current continuity-backed observer model

That boundary matters because the fix is specifically about using the real SDK/runtime contract correctly before changing the observation architecture.

## How The Design Stays Ready For Option 3

Option 3 should later replace poll-driven observation with an event-stream-first runtime model. This design keeps that path open in three ways.

### Normalize Once, Consume Everywhere

The adapter logic for assistant/tool parts should produce one normalized internal shape. Polling code, result capture, start gate, and future event consumers should all depend on that normalized shape instead of re-reading raw SDK parts differently in each module.

### Separate Transport From Lifecycle Policy

`session-api.ts` should expose raw/normalized runtime inputs, while lifecycle modules decide what those inputs mean. That lets a future event-stream source feed the same lifecycle policy without rewriting result capture and completion rules.

### Preserve Continuity As The Durable Truth Layer

Option 3 can replace how runtime observations arrive, but not why continuity exists. Persisted lifecycle state, result capture, and parent-visible recovery should remain continuity-backed. The event-stream redesign should therefore swap the observation source, not the persistence contract.

## Validation Strategy

Validation must explicitly distinguish mocked verification from live runtime verification.

### Mocked / Unit Verification

Use focused tests to verify adapter behavior and lifecycle decisions deterministically.

- `session-api.ts` tests for structured `session.prompt()` handling and status-source semantics
- `result-capture.ts` tests for `part.tool`, `part.state.input`, `part.state.output`, and `part.state.status`
- start-gate and completion-verifier tests for revised evidence thresholds
- background observer tests proving `session.status()` is primary and `promptAsync()` acceptance alone does not advance lifecycle state

These tests prove harness logic. They do not prove that the real runtime emits the same shapes in practice.

### Real Live Smoke Validation

A real OpenCode smoke run is required before the fix is considered done.

Minimum live checks:

1. Launch a real async `delegate-task` child against the live OpenCode runtime.
2. Confirm the child is observed through `queued -> running -> completed|failed` without relying on `session.get()` runtime interpretation.
3. Capture at least one real tool part and confirm the harness reads `part.tool`, `part.state.input`, and `part.state.output` correctly.
4. Confirm a child that is merely accepted by `promptAsync()` but does not produce real evidence is not treated as meaningfully running.
5. Confirm parent-visible continuity and notification output are built from persisted results produced by the real run.

If mocked tests pass but live smoke fails, the slice is not done.

## Risks

- The real runtime may emit more than one valid tool-part state shape across providers or versions, so the normalizer must be strict enough to avoid false positives but tolerant enough to avoid dropping real data.
- Relaxing the start gate too far could allow low-signal sessions to be promoted prematurely.
- Keeping polling for now means some latency and edge timing issues remain until Option 3 lands.
- SDK documentation and observed runtime behavior may not always be perfectly aligned, so live smoke validation must remain the final authority.

## Non-Goals

- Full event-stream redesign
- Replacing continuity with a transient-only runtime view
- Reworking unrelated tmux/process execution paths
- Redefining the broader single-path `delegate-task` product contract already approved elsewhere

## Success Criteria

The design is successful when all of the following are true:

1. `delegate-task` observes runtime state from `session.status()`, not from `session.get()`.
2. `session.prompt()` responses are consumed as structured output instead of being forced through text parsing and heuristics.
3. Result capture and evidence logic correctly read real tool parts via `part.tool`, `part.state.input`, and `part.state.output`.
4. Start and completion gates accept real delegated-child work patterns without requiring the old over-constrained evidence combination.
5. `promptAsync()` acceptance alone no longer counts as meaningful progress.
6. Unit tests cover the adapter logic, but release readiness additionally requires a real live smoke validation pass.
7. The new adapter boundary can be reused by a later Option 3 event-stream observer without rewriting persistence and lifecycle semantics.
