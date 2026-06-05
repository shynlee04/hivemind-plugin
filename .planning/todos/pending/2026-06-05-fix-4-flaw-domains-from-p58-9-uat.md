---
created: 2026-06-05T10:38:44.818Z
title: Fix 4 flaw domains from P58.9 UAT
area: planning
files:
  - .opencode/agents/hm-*/  # tmux-copilot permission gate
  - src/coordination/        # child session backchannel
  - src/features/            # agent looping from child emissions
  - .opencode/rules/universal-rules.md  # governance truncation
---

## Problem

UAT from Phase 58.9 identified 4 flaw domains that need fixing in Phase 59:

**A) tmux-copilot permission gate** — The tmux-copilot tool's permission/authorization gate is not properly enforcing role-based access restrictions (orchestrator-tier vs USER_SESSION tier actions like take-over, release, peek).

**B) child session backchannel** — Child/delegated sessions lack a proper backchannel mechanism for reporting status/results back to the parent session, causing lost results and orphaned delegations.

**C) agent looping from child emissions** — Child session emissions (events, status updates) trigger agent looping in the parent, causing infinite delegation chains or runaway agent loops.

**D) universal-rules.md governance truncation** — The `.opencode/rules/universal-rules.md` governance document is being truncated or incompletely applied, causing runtime governance rules to be partially enforced.

## Solution

Phase 59 must address all 4 domains. Approach TBD — needs investigation of each flaw's root cause and coordinated fixes across coordination, features, routing, and governance layers.
