<purpose>
List all Hivemind workspaces found in ~/hm-workspaces/ with their status.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup

```bash
# SDK resolution: prefer local hm-tools.cjs, fall back to global hm-sdk (#3668)
Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hm-tools.cjs"
if [ -f "$Hivemind_TOOLS" ]; then
  Hivemind_SDK="node $Hivemind_TOOLS"
elif command -v hm-sdk >/dev/null 2>&1; then
  Hivemind_SDK="hm-sdk"
else
  echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
INIT=$($Hivemind_SDK query init.list-workspaces)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `workspace_base`, `workspaces`, `workspace_count`.

## 2. Display

**If `workspace_count` is 0:**

```
No workspaces found in ~/hm-workspaces/

Create one with:
  /hm-workspace --new --name my-workspace --repos repo1,repo2
```

Done.

**If workspaces exist:**

Display a table:

```
Hivemind Workspaces (~/hm-workspaces/)

| Name | Repos | Strategy | Hivemind Project |
|------|-------|----------|-------------|
| feature-a | 3 | worktree | Yes |
| feature-b | 2 | clone | No |

Manage:
  cd ~/hm-workspaces/<name>     # Enter a workspace
  /hm-workspace --remove <name>  # Remove a workspace
```

For each workspace, show:
- **Name** — directory name
- **Repos** — count from init data
- **Strategy** — from WORKSPACE.md
- **Hivemind Project** — whether `.planning/PROJECT.md` exists (Yes/No)

</process>
