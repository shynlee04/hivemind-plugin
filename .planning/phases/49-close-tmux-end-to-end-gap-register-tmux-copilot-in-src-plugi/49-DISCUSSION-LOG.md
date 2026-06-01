# Phase 49: Tmux E2E Completion — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 49-close-tmux-end-to-end-gap
**Areas discussed:** Tool registration, Observer wiring, Co-pilot adapter injection, BATS in CI, Paperwork closure, P43 re-verification
**Mode:** `--auto` (fully autonomous)

---

## Tool Registration (REQ-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Import + register in plugin.ts | Standard tool registration (~5 LOC) | ✓ (auto) |

**Selection:** Import `tmuxCopilotTool` from `./tools/tmux-copilot.js` and add to plugin.ts tools array.
**Notes:** Tool itself is unchanged — only missing registration.

## Observer Wiring — Runtime Bridge Lookup (REQ-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Inject runtime bridge lookup | Pass `getForkSessionManager()` at observer creation, fallback to noop | ✓ (auto) |
| Change observer factory | Remove parameter, always call getForkSessionManager() internally | |

**Selection:** `createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())` — minimal diff, preserves noop fallback.

## Co-pilot Adapter Injection (REQ-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Integration factory auto-detects vendored fork | Detect `opencode-tmux/` dir and construct adapter | ✓ (auto) |
| Separate bootstrap step calls setForkSessionManager | Explicit wiring step needed | |

**Selection:** Integration factory detects vendored fork at project root and auto-wires the adapter through the bridge.

## BATS in CI (REQ-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Single Linux node, node-22, npm install bats | Standard CI addition (~3 LOC) | ✓ (auto) |

**Selection:** Add BATS job to Linux matrix node (node-version 22). Install via `npm install -g bats`.

## Paperwork (REQ-05, REQ-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Retrospective documentation | Documents already-delivered work with evidence | ✓ (auto) |

**Selection:** Create VERIFICATION.md + UAT.md for P42, 45-01-SUMMARY.md for P45. All retrospective.

## P43 Re-verification (REQ-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Run gsd-verify-work with stricter REQ-05 | Validates runtime bridge lookup is complete | ✓ (auto) |

**Selection:** Run gsd-verify-work for P43 with REQ-05 updated to check runtime bridge wiring.

## the agent's Discretion

- BATS CI job exact YAML placement
- Atomic commit ordering

## Deferred Ideas

None.
