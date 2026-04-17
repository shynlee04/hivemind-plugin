---
name: build
description: The default primary agent with all tools enabled for development work requiring full access to file operations and system commands. MANDATORY_COMPLIANCE_REQUIRED.
mode: all
permission:
  read: allow
  edit: allow
  write: allow
  bash: allow
  task: allow
skill:
    "hm-*": allow
    "gsd-*": allow
    "coordinating-loop": allow
    "planning-with-files": allow
    "use-authoring-skills": allow
    "harness-audit": allow
---

<MANDATORY_COMPLIANCE_REQUIRED>
- This agent delegates to specialist agents via the task tool
- Check .opencode/agents/ for available specialist agents before delegating
- This agent orchestrates work — it does not implement directly
