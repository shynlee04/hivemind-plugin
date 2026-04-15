# Delegate-Task Single-Path Recovery Design

> Date: 2026-04-15
> Status: Approved design for first recovery slice

## Goal

Restore `delegate-task` to one truthful purpose: launch a background child task, let the parent continue working, persist child state/results to disk, poll for progress, fail idle children after 2 minutes, and make final output retrievable by the parent session.

## Problem Statement

Phases 09 through 13 introduced multiple overlapping fixes around delegation, lifecycle state, result capture, async polling, and session continuity. The system drifted into multiple ambiguous execution paths and status signals that made it hard to answer a simple operational question: did the background child actually start, is it still running, did it fail, and what did it return?

The product contract is simpler than the current behavior. `task` should remain the foreground blocking delegation tool. `delegate-task` should be the background delegation tool that works alongside the main session while the main session continues user-facing work.

## Intended Product Contract

### `task`

- foreground
- blocks until result returns inline
- used when parent needs the answer immediately

### `delegate-task`

- background
- returns immediately with child handle/session id
- parent continues other work
- child state is persisted to disk by default
- harness polls for activity and result
- child fails truthfully after 2 minutes with no real activity
- final result is persisted and later parsed back into the parent workflow
- parent should not fully wrap up while unresolved delegated background tasks remain

## Slice 1 Scope

This recovery slice fixes only the single-path `delegate-task` contract.

In scope:

- one underlying launch path for `delegate-task`
- truthful persisted lifecycle states
- agent fallback for invalid/alias names
- activity-based running detection
- 2-minute idle failure for dead children
- result capture persisted to disk by default
- parent-readable continuity state

Out of scope for this slice:

- cleaning or reconciling all historical phase documents
- making every historical launch mode continue to work
- redesigning the entire harness/plugin architecture
- validating all old phase claims from 09–13

## Architecture Decision

`delegate-task` must use one underlying execution path only:

- **async builtin-subsession**

It must not auto-switch between multiple ambiguous launch modes for the same product behavior. In particular, unstable or confusing alternate modes should be detached from this workflow until the single background path is trustworthy.

## State Model

Persisted continuity must be enough for the parent/orchestrator to answer the current child truth without inference.

Allowed child states:

- `queued` — child created, no real work evidence yet
- `running` — assistant evidence or tool activity has been observed
- `completed` — result captured and persisted
- `failed` — explicit error or no real activity for 2 minutes

### Truth Rules

A child is considered **running** if either of the following is observed:

- tool activity (for example `read`, `glob`, `grep`, search, offset-read, or other recorded tool usage)
- assistant evidence from the real child session

A child is considered **failed** if neither tool activity nor assistant evidence appears within 2 minutes of launch.

Status-only transport or session events must never be treated as sufficient proof of meaningful running state.

## Agent Routing and Fallback

If the requested agent name is invalid, stale, or alias-like, `delegate-task` should degrade safely instead of crashing dispatch.

Safe fallback behavior:

- route to `general`
- persist warning/route metadata so fallback is visible
- continue launch when safe

This keeps the background tool operational instead of turning naming mismatches into hard launch failures.

## Persistence Requirements

State and results must be saved to disk by default.

Minimum persisted information:

- parent session id
- child session id
- route metadata
- lifecycle state
- last observed time
- last tool activity time
- failure reason if terminal failure occurs
- captured result/artifacts/commits when present

`session-continuity.json` should be sufficient for both machine logic and human/operator inspection.

## Polling and Timeout Behavior

Background polling exists only to support the single-path contract:

- watch for first real activity
- watch for terminal completion/failure
- save result when available
- stop waiting when the child is clearly dead

### Timeout Rule

If no tool activity and no assistant evidence appear within 2 minutes, the child must transition to a terminal failed state and stop looking live.

This timeout is a product requirement, not a heuristic convenience.

## Parent Session Contract

The parent session should be able to:

- continue main user-facing work while delegated children run
- inspect persisted child states truthfully
- later retrieve and parse delegated results
- avoid final wrap-up until background delegate-tasks are resolved

This means `delegate-task` is not a second general delegation universe. It is a specialized background companion to `task`.

## Explicit Non-Goals

This slice does **not** try to preserve every previously introduced mechanism. If a mechanism makes this contract less truthful or more confusing, it should be detached or ignored until the single-path background model is stable.

## Success Criteria

The slice is successful when all of the following are true:

1. `delegate-task` launches one background child path only.
2. Parent receives immediate handle/metadata and can continue working.
3. Child state is saved to disk by default.
4. Parent can inspect continuity and know whether child is queued, running, failed, or completed.
5. Invalid agent names fall back safely instead of failing launch.
6. No-activity children fail after 2 minutes and do not remain falsely running.
7. Completed children persist retrievable output.
8. `task` remains the foreground blocking tool and is not conflated with `delegate-task`.

## Implementation Direction for Next Step

The implementation plan for the next phase should focus on:

1. locking `delegate-task` to one underlying async builtin-subsession path
2. simplifying persisted lifecycle truth in continuity
3. enforcing agent fallback behavior
4. enforcing 2-minute idle fail semantics
5. guaranteeing result persistence and parent retrieval
