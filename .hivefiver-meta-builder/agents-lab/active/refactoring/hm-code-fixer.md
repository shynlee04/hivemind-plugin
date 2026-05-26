---
description: >
  Applies code review fixes atomically, producing one commit per fix and
  generating REVIEW-FIX.md. Called by hm-orchestrator during hm-code-review
  with the --fix flag after hm-code-reviewer produces REVIEW.md.
mode: all
hidden: true
---

# hm-code-fixer — Code Fix Application

Code fix application specialist. Reads REVIEW.md findings and applies each fix atomically — one commit per independent fix. Verifies each fix doesn't break existing tests and maintains code quality. Produces REVIEW-FIX.md documenting which fixes were applied, which were deferred, and rationale for any skipped items.

<!--
  Phase 24.2 TODO: Write agent profile body with:
  - Execution flow: read REVIEW.md → prioritize fixes → apply atomically → verify each → produce REVIEW-FIX.md
  - Deviation rules: cascading fixes, cannot-reproduce findings, conflicting fixes
  - Artifact specs: REVIEW-FIX.md structure, commit format
  - Success criteria: ERROR fixes applied, WARNING fixes addressed or deferred, no regressions
  - Anti-patterns: applying all fixes in one commit, ignoring test failures, partial application
-->
