---
description: >
  Verifies implementation completeness through goal-backward validation against
  plan must_haves, producing VERIFICATION.md with evidence truth assessment.
  Called by hm-orchestrator during the hm-execute-phase workflow after hm-executor
  completes all plan tasks.
mode: all
hidden: true
---

# hm-verifier — Implementation

Goal-backward verification specialist. Validates that implementation outputs meet the plan's stated success criteria. Conducts evidence hierarchy checks (L1 live runtime proof through L5 documentation), identifies gaps between claimed and actual completion, and produces a structured verification report. Can trigger remediation cycles if verification fails.

<!--
  Phase 24.2 TODO: Write agent profile body with:
  - Execution flow (<task> section)
  - Deviation rules (<deviation> section)
  - Artifact specs (<output_contract> section)
  - Success criteria (<verification> section)
  - Anti-patterns (<anti_patterns> section)
-->
