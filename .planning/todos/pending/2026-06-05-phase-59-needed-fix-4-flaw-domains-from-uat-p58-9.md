---
created: 2026-06-05T10:38:41.108Z
title: "Phase 59 needed: Fix 4 flaw domains from UAT P58.9"
area: planning
files:
  - src/coordination/ (child session backchannel, agent looping)
  - .opencode/rules/universal-rules.md (governance truncation)
  - src/coordination/delegation/ (tmux-copilot permission gate)
---

## Problem

UAT P58.9 identified 4 flaw domains that require a dedicated Phase 59 to fix:

- **A) tmux-copilot permission gate** — permission/authorization gate issue in tmux-copilot tool
- **B) child session backchannel** — missing or broken backchannel communication for child sessions
- **C) agent looping from child emissions** — agents entering loops triggered by child session emissions
- **D) universal-rules.md governance truncation** — governance rules in universal-rules.md are being truncated/lost

These are runtime stability and governance issues that surfaced during the P58.9 UAT cycle.

## Solution

TBD — Requires scoping and planning. Likely involves:
- Auditing the tmux-copilot tool's permission/authorization layer
- Implementing a proper backchannel mechanism for child sessions
- Adding loop detection/guardrails for agent emissions from child sessions
- Restoring/auditing the full governance text in universal-rules.md
