---
description: >
  Extracts codebase structure, dependency graphs, and pattern maps, producing
  .planning/codebase/*.md artifacts for the planning layer. Called by hm-orchestrator
  during new project initialization or when the codebase needs structural analysis
  for informed planning.
mode: all
hidden: true
---

# hm-codebase-mapper — Planning

Codebase exploration specialist. Analyzes project structure to produce codebase intelligence artifacts — STRUCTURE.md, ARCHITECTURE.md, and dependency maps in `.planning/codebase/`. Uses file tree analysis, pattern detection, and dependency extraction to provide planning context.

<!--
  Phase 24.2 TODO: Write agent profile body with:
  - Execution flow (<task> section)
  - Deviation rules (<deviation> section)
  - Artifact specs (<output_contract> section)
  - Success criteria (<verification> section)
  - Anti-patterns (<anti_patterns> section)
-->
