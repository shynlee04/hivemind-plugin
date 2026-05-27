---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: "Retroactively audit and fill Nyquist validation gaps for a completed phase"
argument-hint: "[phase number]"
requires: ["hm-phase"]
validation-gates: ["lifecycle-gate"]
output-templates: ["hm-validation.md"]
coordination-model: "waiter-model"
completion-signals: ["phase-validated"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  agent: true
  question: true
---

<objective>
Audit Nyquist validation coverage for a completed phase. Three states:
- (A) VALIDATION.md exists — audit and fill gaps
- (B) No VALIDATION.md, SUMMARY.md exists — reconstruct from artifacts
- (C) Phase not executed — exit with guidance

Output: updated VALIDATION.md + generated test files.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/validate-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
