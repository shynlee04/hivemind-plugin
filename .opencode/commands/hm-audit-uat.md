---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: "Cross-phase audit of all outstanding UAT and verification items"
argument-hint: ""
requires: []
validation-gates: ["evidence-truth-gate"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["uat-verified"]
tools:
  read: true
  glob: true
  grep: true
  bash: true
---

<objective>
Scan all phases for pending, skipped, blocked, and human_needed UAT items. Cross-reference against codebase to detect stale documentation. Produce prioritized human test plan.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/audit-uat.md
</execution_context>

<context>
Core planning files are loaded in-workflow via CLI.

**Scope:**
Glob: .planning/phases/*/*-UAT.md
Glob: .planning/phases/*/*-VERIFICATION.md
</context>
