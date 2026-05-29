---
description: Create PR, run review, and prepare for merge after verification passes
argument-hint: "[phase number or milestone, e.g., '4' or 'v1.0']"
requires: [review, verify-work]
tools:
  read: true
  bash: true
  grep: true
  glob: true
  write: true
  question: true
---
<objective>
Bridge local completion → merged PR. After /gsd-verify-work passes, ship the work: push branch, create PR with auto-generated body, optionally trigger review, and track the merge.

Closes the plan → execute → verify → ship loop.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md
</execution_context>

Execute the ship workflow from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ship.md end-to-end.
