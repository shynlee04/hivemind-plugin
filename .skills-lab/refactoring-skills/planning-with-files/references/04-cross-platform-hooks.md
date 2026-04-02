# Cross-Platform Hooks

How to sustain planning discipline across different agentic platforms.

---

## Hook Architecture

Hooks are platform-specific event handlers that inject planning behavior into the Agent's workflow. They ensure the Agent reads the plan, updates progress, and verifies completion — even if the Agent forgets.

### Hook Lifecycle

```
UserPromptSubmit → PreToolUse → [Tool executes] → PostToolUse → Stop
       ↓                ↓                              ↓           ↓
  Inject plan      Re-read plan                Remind to     Verify
  into context     before action               update        complete
```

---

## OpenCode

OpenCode uses the `.opencode/` configuration directory with hooks defined in the plugin system.

### UserPromptSubmit Hook
Injects current plan state when the user submits a prompt.

```yaml
hooks:
  UserPromptSubmit:
    - type: command
      command: |
        if [ -f task_plan.md ]; then
          echo '[planning-with-files] ACTIVE PLAN — current state:'
          head -50 task_plan.md
          echo ''
          echo '=== recent progress ==='
          tail -20 progress.md 2>/dev/null
          echo ''
          echo '[planning-with-files] Read findings.md for research context. Continue from the current phase.'
        fi
```

### PreToolUse Hook
Re-reads the plan before every tool call to keep goals in attention.

```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash|Read|Glob|Grep"
      hooks:
        - type: command
          command: "cat task_plan.md 2>/dev/null | head -30 || true"
```

### PostToolUse Hook
Reminds the Agent to update progress after file modifications.

```yaml
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "if [ -f task_plan.md ]; then echo '[planning-with-files] Update progress.md with what you just did. If a phase is now complete, update task_plan.md status.'; fi"
```

### Stop Hook
Verifies completion when the session ends.

```yaml
hooks:
  Stop:
    - type: command
      command: "sh \"$(dirname \"$0\")/scripts/check-complete.sh\" task_plan.md 2>/dev/null || true"
```

---

## Claude Code

Claude Code uses `.cursor/hooks/` directory with JSON configuration.

### hooks.json
```json
{
  "user-prompt-submit": ".cursor/hooks/user-prompt-submit.sh",
  "pre-tool-use": ".cursor/hooks/pre-tool-use.sh",
  "post-tool-use": ".cursor/hooks/post-tool-use.sh",
  "stop": ".cursor/hooks/stop.sh"
}
```

### user-prompt-submit.sh
```bash
#!/bin/bash
if [ -f task_plan.md ]; then
  echo '[planning-with-files] ACTIVE PLAN:'
  head -50 task_plan.md
  echo '=== recent progress ==='
  tail -20 progress.md 2>/dev/null
fi
```

### pre-tool-use.sh
```bash
#!/bin/bash
cat task_plan.md 2>/dev/null | head -30 || true
```

### post-tool-use.sh
```bash
#!/bin/bash
if [ -f task_plan.md ]; then
  echo '[planning-with-files] Update progress.md with what you just did.'
fi
```

### stop.sh
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sh "$SCRIPT_DIR/../scripts/check-complete.sh" task_plan.md 2>/dev/null || true
```

---

## Gemini CLI

Gemini CLI uses `.gemini/hooks/` with shell scripts for each lifecycle event.

### session-start.sh
```bash
#!/bin/bash
if [ -f task_plan.md ]; then
  echo '[planning-with-files] Resuming session. Current plan:'
  head -30 task_plan.md
fi
```

### before-tool.sh
```bash
#!/bin/bash
cat task_plan.md 2>/dev/null | head -20 || true
```

### after-tool.sh
```bash
#!/bin/bash
if [ -f task_plan.md ]; then
  echo '[planning-with-files] Remember to update progress.md after file changes.'
fi
```

### session-end.sh
```bash
#!/bin/bash
sh "$(dirname "$0")/../scripts/check-complete.sh" task_plan.md 2>/dev/null || true
```

---

## Cursor

Cursor uses `.cursor/hooks/` with the same structure as Claude Code but may use PowerShell on Windows.

### hooks.windows.json
```json
{
  "user-prompt-submit": ".cursor/hooks/user-prompt-submit.ps1",
  "pre-tool-use": ".cursor/hooks/pre-tool-use.ps1",
  "post-tool-use": ".cursor/hooks/post-tool-use.ps1",
  "stop": ".cursor/hooks/stop.ps1"
}
```

### stop.ps1
```powershell
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$checkScript = Join-Path $scriptDir "..\scripts\check-complete.ps1"
if (Test-Path $checkScript) {
  & $checkScript "task_plan.md"
}
```

---

## Hook Design Principles

### 1. Always Exit 0
Hooks should never fail the session. Use `|| true` or `exit 0` to ensure hooks report status without blocking.

### 2. Guard Against Missing Files
Always check if `task_plan.md` exists before trying to read it. Use `2>/dev/null` to suppress errors.

### 3. Keep Output Concise
Use `head -30` or `head -50` to limit injected content. The goal is to refresh goals, not flood context.

### 4. Use Relative Paths
Planning files live in the project root. Use relative paths (`task_plan.md`) not absolute paths.

### 5. Separate Scripts from Hooks
Hook commands should call scripts in `scripts/` directory, not inline complex logic. This makes scripts reusable across platforms.

---

## Platform Compatibility Matrix

| Hook Event | OpenCode | Claude Code | Gemini CLI | Cursor |
|-----------|----------|-------------|------------|--------|
| User prompt submit | ✅ | ✅ | ✅ (session-start) | ✅ |
| Before tool use | ✅ | ✅ | ✅ | ✅ |
| After tool use | ✅ | ✅ | ✅ | ✅ |
| Session end | ✅ | ✅ | ✅ (session-end) | ✅ |
| PowerShell support | ❌ | ✅ | ❌ | ✅ |

---

## Session Catchup Integration

The `session-catchup.py` script runs at session start to detect unsynced context from previous sessions. It should be invoked manually or via the platform's session-start hook:

```bash
python3 scripts/session-catchup.py "$(pwd)"
```

The script:
1. Checks if planning files exist (indicates active task).
2. Scans previous session history for unsynced tool calls.
3. Reports what was done but not recorded in planning files.
4. Outputs a catchup report for the Agent to reconcile.
