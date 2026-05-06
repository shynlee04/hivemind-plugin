---
created: 2026-04-09T21:20:18.703Z
title: Runtime threshold config for MAX_DESCENDANTS, MAX_DEPTH, concurrency
area: general
files:
  - src/lib/types.ts:6-7
  - src/lib/concurrency.ts:54
---

## Problem

Constants like `MAX_DESCENDANTS_PER_ROOT` (10), `MAX_DEPTH` (3), `DEFAULT_CONCURRENCY_LIMIT` (3) are compile-time constants. Users cannot adjust them for their team size or workload without editing source code.

## Solution

Support env vars and/or `opencode.json` harness section:
- `OPENCODE_HARNESS_MAX_DESCENDANTS` / `harness.maxDescendants`
- `OPENCODE_HARNESS_MAX_DEPTH` / `harness.maxDepth`
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` / `harness.concurrencyLimit`
