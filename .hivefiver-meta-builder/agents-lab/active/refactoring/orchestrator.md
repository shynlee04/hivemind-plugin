---
name: orchestrator
description: the coordinator primary agent with focus on orchestrating tasks. This is the standard agent for delegation work, you must use the `task` tool of OpenCode for orchestrating, not using the custom tools.
mode: primary
textVerbosity: low
skill:
    "*": deny
    "hm-*": allow
---
