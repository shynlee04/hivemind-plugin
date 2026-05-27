---
namespace: hm
agent: hm-executor
subtask: true
description: "Run a comprehensive health check on the Hivemind project: verify directory structure integrity, config file validity, agent and command file consistency, git state, and dependency status. Use when something feels wrong, commands aren't working, or after a large refactor."
argument-hint: "[--quick] [--fix] [--verbose]"
requires: []
validation-gates: []
output-templates: ["hm-doctor-report.md"]
coordination-model: "waiter-model"
completion-signals: ["doctor-complete"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
---
<objective>
Run diagnostic checks across the Hivemind project: verify all required directories exist (.opencode/, .hivemind/, .planning/), validate config files parse correctly, check agent/command frontmatter consistency, verify git state is clean, and check dependency integrity.
</objective>

<execution_context>
@.opencode/workflows/hm-doctor.md
</execution_context>

<context>
Namespace: hm
Routed Agent: hm-executor
</context>

<process>
1. Check all required directories exist with .gitkeep registration
2. Validate .hivemind/config.json and opencode.json parse correctly
3. Verify all agent frontmatter has required fields (name, description, mode, tools)
4. Verify all command frontmatter has required fields (namespace, agent, description)
5. Check git status is clean (no uncommitted changes)
6. Run npm ls for dependency integrity
7. Report PASS/FAIL per check with actionable fix suggestions
8. If --fix flag, attempt automatic fixes for known issues
</process>
