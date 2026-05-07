---
phase: CP-PTY-01-background-shell-control-plane-mvp
status: blocked
created: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred for E2E
depends_on:
  - BOOT-07-end-to-end-proof
  - CP-PTY-00-shell-pty-control-plane-spike
allowed_surfaces_when_authorized:
  - src/tools/run-background-command.ts
  - src/lib/command-delegation.ts
  - src/lib/delegation-manager.ts
  - src/lib/pty/**
  - src/hooks/**
  - tests/**
---

# CP-PTY-01 Background Shell Control-Plane MVP Plan Skeleton

## Status

Blocked until BOOT-07 E2E proof completes or the user explicitly authorizes runtime mutation before BOOT-07.

## Intended Goal

Harden background shell/PTY command execution as a permission-gated, bounded-output, lifecycle-aware control-plane capability integrated with delegation status and recovery truth.

## High-Level Acceptance Criteria

- Permission-gated command start path.
- Bounded output buffer/read API.
- Explicit PTY versus headless fallback semantics.
- Lifecycle mapping to delegation/status records.
- Cleanup on terminate, timeout, abort, and parent deletion.
- Restart truth: PTY/headless command sessions marked non-resumable after runtime restart.
- Tests for start/read/write/list/terminate, permission denial, unsupported input, and cleanup.
