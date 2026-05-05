---
description: Extract decisions, lessons, patterns, and surprises from completed phase artifacts
argument-hint: <phase-number>
type: prompt
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
  agent: true
---
<objective>
Extract structured learnings from completed phase artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md, UAT.md, STATE.md) into a LEARNINGS.md file that captures decisions, lessons learned, patterns discovered, and surprises encountered.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/extract_learnings.md
</execution_context>

Execute the extract-learnings workflow from @/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/extract_learnings.md end-to-end.
