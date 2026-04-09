---
created: 2026-04-10T04:40:00.000Z
title: Fix delegation execution — sync JSON parser crash + async silent failure
area: api
files:
  - src/tools/delegate-task.ts
  - src/lib/session-api.ts
  - src/lib/notification-handler.ts
---

## Problem

Two independent failures make delegation unusable:

1. **Sync mode (`run_in_background: false`)**: Produces `JSON Parse error: Unexpected EOF` — the output format breaks OpenCode's JSON parser. Cascades across 5+ calls, crashes TUI with raw error text.

2. **Async mode (`run_in_background: true`)**: Returns `ok: true` but child sessions complete in 16ms with no work done. False success — LLM trusts output and proceeds without verification.

## Root Causes (documented)
- `.planning/debug/delegation-execution-failure-root-cause-2026-04-10.md`

## Solution
1. **Sync mode**: Either remove it or wrap output in guaranteed-valid-JSON format with proper escaping
2. **Async mode**: Add execution verification — poll child session message count/tool calls to confirm actual work happened; flag sessions completing in <100ms as suspicious
3. **Agent name propagation**: Verify aliased names (`build`→`builder`) reach the underlying OpenCode task tool correctly — may need to use canonical names for `promptAsync()`
