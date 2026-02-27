---
name: "agent-role-boundary"
description: "Enforces Diamond role separation: orchestrator, executor, verifier, researcher, planner, and meta-builder boundaries."
triggers:
  - "When defining or editing agent profiles"
  - "When delegation recursion risks appear"
version: "1.0.0"
---

# Agent Role Boundary

## Objective
Prevent overlap between orchestration, execution, verification, and framework-authoring concerns.

## Rules
1. Orchestrators delegate and verify only.
2. Execution agents do not recursively delegate.
3. Verifiers report evidence only, no fixes.
4. Meta-builders maintain framework assets, not product features.
