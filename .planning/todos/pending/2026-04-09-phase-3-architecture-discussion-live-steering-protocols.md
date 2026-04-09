---
created: 2026-04-09T16:54:16.121Z
title: Phase 3 architecture discussion - live steering protocols
area: planning
files:
  - docs/papers/live-steering-protocols.md
---

## Problem

After debugging the background delegation issues, the team needs to discuss and establish clear architecture for Phase 3. The discussion should center on:

1. **Organization of features vs lifecycle** — how to structure the harness capabilities around user-oriented, user-friendly configurations and settings
2. **Runtime facilitating configurations** — making harness conditions accessible and intuitive for users
3. **Smart routing and tool use as the starting point** — using delegation and collaboration with intelligent routing as the foundation for Phase 3

The [live-steering-protocols.md](docs/papers/live-steering-protocols.md) paper provides the architectural foundation with the Unified Steering Protocol (USP), Steering Decision Engine, and Three-Level Coordination Model. This needs to be translated into concrete Phase 3 implementation decisions.

Key architectural decisions needed:
- How to integrate the three steering mechanisms (inbox, system-transform, session-patch) into user-facing configuration
- How to structure delegation routing to be both powerful and intuitive
- How to organize the lifecycle phases around user workflows rather than internal state machines
- What the default delegation model should look like (depth-2 vs depth-3, supervisor counts)

## Solution

Schedule architecture discussion session. Output should be:
1. Phase 3 PLAN.md with clear feature boundaries
2. User-facing configuration schema (opencode.json harness section)
3. Delegation routing design document
4. Lifecycle phase mapping aligned with user workflows

TBD — requires multi-agent discussion session.
