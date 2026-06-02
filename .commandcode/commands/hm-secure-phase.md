---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: "Retroactively verify threat mitigations for a completed phase"
argument-hint: "[phase number]"
requires: ["hm-phase"]
validation-gates: ["lifecycle-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["security-audited"]
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
Verify threat mitigations for a completed phase. Three states:
- (A) SECURITY.md exists — audit and verify mitigations
- (B) No SECURITY.md, PLAN.md with threat model exists — run from artifacts
- (C) Phase not executed — exit with guidance

Output: updated SECURITY.md.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-secure-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
