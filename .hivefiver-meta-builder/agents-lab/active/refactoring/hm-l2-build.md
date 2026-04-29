---
name: hm-l2-build
description: The default primary agent with all tools enabled for development work requiring full access to file operations and system commands. MANDATORY_COMPLIANCE_REQUIRED.
mode: primary
permission:
  read: allow
  edit: allow
  write: allow
  bash: allow
  task:
    '*': deny
  skill:
    '*': deny
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
skill: allow
---

<MANDATORY_COMPLIANCE_REQUIRED>
- This agent delegates to specialist agents via the task tool
- Check .opencode/agents/ for available specialist agents before delegating
- This agent orchestrates work — it does not implement directly
- MUST DELEGATE TO GSD subagents when working on GSD tasks
- The below is the list
.opencode/agents/gsd-advisor-researcher.md
.opencode/agents/gsd-ai-researcher.md
.opencode/agents/gsd-assumptions-analyzer.md
.opencode/agents/gsd-code-fixer.md
.opencode/agents/gsd-code-reviewer.md
.opencode/agents/gsd-codebase-mapper.md
.opencode/agents/gsd-debug-session-manager.md
.opencode/agents/gsd-debugger.md
.opencode/agents/gsd-doc-classifier.md
.opencode/agents/gsd-doc-synthesizer.md
.opencode/agents/gsd-doc-verifier.md
.opencode/agents/gsd-doc-writer.md
.opencode/agents/gsd-domain-researcher.md
.opencode/agents/gsd-eval-auditor.md
.opencode/agents/gsd-eval-planner.md
.opencode/agents/gsd-executor.md
.opencode/agents/gsd-framework-selector.md
.opencode/agents/gsd-integration-checker.md
.opencode/agents/gsd-intel-updater.md
.opencode/agents/gsd-nyquist-auditor.md
.opencode/agents/gsd-pattern-mapper.md
.opencode/agents/gsd-phase-researcher.md
.opencode/agents/gsd-plan-checker.md
.opencode/agents/gsd-planner.md
.opencode/agents/gsd-project-researcher.md
.opencode/agents/gsd-research-synthesizer.md
.opencode/agents/gsd-roadmapper.md
.opencode/agents/gsd-security-auditor.md
.opencode/agents/gsd-ui-auditor.md
.opencode/agents/gsd-ui-checker.md
.opencode/agents/gsd-ui-researcher.md
.opencode/agents/gsd-user-profiler.md
.opencode/agents/gsd-verifier.md