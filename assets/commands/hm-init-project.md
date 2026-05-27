---
namespace: hm
agent: hm-orchestrator
subtask: false
description: Initialize a new Hivemind-powered project structure with namespaces, directories, and standard config files.
argument-hint: "[project-name] [--scope global|local] [--force]"
requires: []
validation-gates: ["directory-structure-check"]
output-templates: ["project.md", "roadmap.md"]
coordination-model: "waiter-model"
completion-signals: ["orchestrator-complete"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  agent: true
---
<objective>
Initialize a new Hivemind-powered project structure, establishing the target directories (`.opencode/`, `.hivemind/`, `.planning/`) with required `.gitkeep` and default config files.
</objective>

<execution_context>
@.opencode/workflows/hm-init-project.md
</execution_context>

<context>
Project Directory: $ARGUMENTS
Namespace: hm
Default Agent: hm-orchestrator
</context>

<process>
Execute end-to-end via hm-init-project workflow. Establish directories, configs, and default templates.
</process>
