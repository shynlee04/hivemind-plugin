---
namespace: hm
agent: hm-nyquist-auditor
subtask: false
description: "Run codebase and primitive audit to identify structure drift, orphaned configurations, or type check warnings."
argument-hint: "[--strict] [--fix]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["audit-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---

<objective>
Audit repository structure, configuration integrity, type checks, and primitive mappings against harness rules.
</objective>

<execution_context>
@.opencode/workflows/hm-audit.md
</execution_context>

<context>
Flags: $ARGUMENTS
Namespace: hm
Routed Agent: hm-nyquist-auditor
</context>

<process>
Execute end-to-end via hm-audit workflow. Scans codebase and structure, repairs minor warnings automatically if `--fix` is passed.
</process>
