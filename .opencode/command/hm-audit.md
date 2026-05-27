---
description: Audit workspace directories, trace lineage, check dependency compliance, and resolve governance issues.
argument-hint: "[--fix] [--check structure|config|lineage]"
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Scan codebase structure, trace lineage consistency, validate configurations, and verify compliance with naming standards.
</objective>

<execution_context>
@.opencode/workflows/hm-audit.md
</execution_context>

<context>
Namespace: hm
Routed Agents: hm-ecologist, hm-intel-updater
</context>

<process>
Execute end-to-end via hm-audit workflow. Standardizes files and fixes drift in primitives.
</process>
