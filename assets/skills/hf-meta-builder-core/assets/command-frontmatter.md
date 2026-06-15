# Template: Command Frontmatter

> **Loading trigger:** When creating a new command.

## YAML Skeleton

```yaml
---
name: command-name
description: "What this command does"
agent: "agent-name"
subtask: false  # true = runs as subagent, false = switches agent in main session
---
```

## $ARGUMENTS Pattern

Commands accept propositional arguments:
```
/command-name entity=value entity:action
```

## Bash Injection Safety

Commands run in non-interactive shells. Enforce:
```bash
#!/usr/bin/env bash
set -euo pipefail
export CI=true
export GIT_TERMINAL_PROMPT=0
```

**Banned:** `vim`, `less`, `git add -p`, `read -p`, any TTY-dependent command.
