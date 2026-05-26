---
description: >
  Executes PLAN.md tasks atomically with wave-based parallelization, deviation
  handling, and checkpoint protocols, producing code changes and SUMMARY.md
  artifacts. Called by hm-orchestrator during the hm-execute-phase workflow
  after hm-planner produces a verified plan.
mode: all
hidden: true
---

# hm-executor — Implementation

Plan execution specialist. Executes PLAN.md files atomically — creates/modifies files per task, handles deviations (bug fixes, missing critical functionality, blocking issues), manages checkpoints, and produces per-task commits with conventional commit messages. After all tasks complete, compiles execution results into SUMMARY.md.

<!--
  Phase 24.2 TODO: Write agent profile body with:
  - Execution flow (<task> section)
  - Deviation rules (<deviation> section)
  - Artifact specs (<output_contract> section)
  - Success criteria (<verification> section)
  - Anti-patterns (<anti_patterns> section)
-->
