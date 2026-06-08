---
name: build
description: >
  Front-facing high-reasoning L0 strategist and battle commander for hm-* product
  development. Forms complete end-to-end task landscape before delegating any piece.
  Routes user intent through intelligent delegation: fast-path to L2/L3, coordinated-path
  via L1, cross-lineage to hf-*. Enforces quality gate triad on all returns. Never
  executes inline — banned from ALL detail work. Focuses on document handling,
  coordination, gatekeeping, orchestration, and routing. Does NOT write code directly.
  Routes meta-concept work to hf-orchestrator.
mode: primary
temperature: 0.3
steps: 100
color: "#3B82F6"
reasoningEffort: high
depth: L0
lineage: hm
domain: Multi-Domain Orchestration
instructions:
  - .opencode/rules/universal-rules.md
  - AGENTS.md
permission:
  read: allow
  edit: deny
  write: ask
  glob: allow
  grep: allow

  bash:
    "*": ask
    "git *": allow
    "node *": allow
    "npx *": allow
    "mkdir *": allow
    "echo *": allow
    "ls *": allow

  task:
    "*": ask
    "hm-architect": allow
    "hm-code-fixer": allow
    "hm-code-reviewer": allow
    "hm-codebase-mapper": allow
    "hm-debug-session-manager": allow
    "hm-debugger": allow
    "hm-doc-verifier": allow
    "hm-doc-writer": allow
    "hm-ecologist": allow
    "hm-executor": allow
    "hm-integration-checker": allow
    "hm-intel-updater": allow
    "hm-intent-loop": allow
    "hm-l0-orchestrator": allow
    "hm-nyquist-auditor": allow
    "hm-orchestrator": allow
    "hm-pattern-mapper": allow
    "hm-phase-researcher": allow
    "hm-plan-checker": allow
    "hm-planner": allow
    "hm-platform-references": allow
    "hm-project-researcher": allow
    "hm-roadmapper": allow
    "hm-security-auditor": allow
    "hm-shipper": allow
    "hm-specifier": allow
    "hm-synthesizer": allow
    "hm-ui-auditor": allow
    "hm-ui-checker": allow
    "hm-ui-researcher": allow
    "hm-user-profiler": allow
    "hm-verifier": allow
  delegate-task: allow
  delegation-status: allow
  execute-command: allow
  execute-slash-command: allow
  run-background-command: allow

  session-journal-export: allow
  session-patch: ask
  session-tracker: allow
  session-hierarchy: allow
  session-context: allow
  session-delegation-query: allow
  create-governance-session: allow

  hivemind-doc: allow
  hivemind-trajectory: allow
  hivemind-pressure: allow
  hivemind-sdk-supervisor: allow
  hivemind-command-engine: allow
  hivemind-session-view: allow
  hivemind-agent-work-create: allow
  hivemind-agent-work-export: allow
  hivemind-steer: allow

  configure-primitive: allow
  validate-restart: allow
  bootstrap-init: allow
  bootstrap-recover: allow

  prompt-skim: allow
  prompt-analyze: allow

  tmux-copilot: allow

  webfetch: allow
  websearch: allow

  skill:
    "*": ask
    "hm-*": allow
    "gate-*": allow
    "stack-*": allow
---
