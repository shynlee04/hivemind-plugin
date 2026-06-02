---
description: "Audit existing skills, agents, commands, or tools for quality, overlaps, and dead references. Triggers: 'audit skills', 'check agents', 'doctor commands', 'what's wrong with...'"
agent: hf-l0-orchestrator
subtask: true
---

<objective>
Audit existing OpenCode meta-concepts for quality issues, overlaps, dead references, and trigger phrase coverage.

Acts as the diagnostic entry point. Scans all meta-concepts, runs validators, produces findings report.
</objective>

<execution_context>
@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/audit.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the audit workflow from @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/audit.md end-to-end.
Preserve all workflow gates (scan, validate, overlap detection, report).
</process>
