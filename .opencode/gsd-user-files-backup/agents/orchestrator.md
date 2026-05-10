---
name: orchestrator
description: Phase-gated workflow specialist for multi-step orchestration. Manages stage transitions, quality gates, and sequential delivery under coordinator.md.
mode: subagent
permission:
  read:
    "*": ask
    "*.md": allow
    "*.json": allow
  edit:
    "*": ask
    "*.md": allow
  write:
    "*": ask
  bash:
    "*": ask
    "git status*": allow
    "git diff*": allow
    "git log*": allow
  task: allow
  skill:
    "*": ask
    "hm-*": allow
---
<!-- Hierarchy: This agent is a PHASE-GATED WORKFLOW SPECIALIST under coordinator.md. It manages sequential stage delivery only. -->
