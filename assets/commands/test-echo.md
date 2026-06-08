---
description: Echo back the user's message
agent: hm-executor
tools:
  - delegate-task
  - hivemind-doc
  - run-background-command
---

Echo back exactly what the user said: $ARGUMENTS
