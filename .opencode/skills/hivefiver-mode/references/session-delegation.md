# OpenCode Session Delegation Reference

## SDK Methods

### session.create()
Create a new session with optional parent, title, and permissions.

Parameters:
- `directory` (string) — working directory
- `parentID` (string) — parent session ID (for hierarchical delegation)
- `title` (string) — session title (for identification)
- `permission` (PermissionRuleset) — permission constraints

### session.prompt()
Send a prompt to an existing session.

Parameters:
- `sessionID` (string) — target session
- `agent` (string) — agent to use
- `model` (object) — { providerID, modelID }
- `variant` (string) — reasoning effort
- `parts` (array) — [{ type: "text", text: "..." }]

### session.command()
Execute a slash command in an existing session.

Parameters:
- `sessionID` (string) — target session
- `agent` (string) — agent to use
- `command` (string) — command name (e.g., "/hivefiver")
- `arguments` (string) — command arguments
- `model` (string) — model in provider/model format

## CLI Flags

| Flag | Alias | Type | Description |
|------|-------|------|-------------|
| --session | -s | string | Continue existing session |
| --agent | | string | Agent to use |
| --model | -m | string | Model (provider/model) |
| --title | | string | Session title |
| --fork | | boolean | Fork existing session |
| --dir | | string | Working directory |
| --variant | | string | Reasoning effort level |
| --file | -f | string[] | Files to attach |

## Delegation Patterns

### Self-Delegation with Clean Context
```bash
opencode run --agent hivefiver --title "hivefiver:stage:$STAGE" "$PARSED_PROMPT"
```

### Parent-Child Hierarchical Delegation
```javascript
const child = await client.session.create({
  body: { parentID: currentSessionID, title: "stage: spec" }
})
await sdk.session.prompt({
  sessionID: child.id,
  agent: "hivefiver",
  parts: [{ type: "text", text: workflowInstructions }]
})
```

## Stage-to-Permission Mapping

| Stage | Edit Permission | Task Permission |
|-------|----------------|-----------------|
| start | deny .opencode/** | allow hivefiver only |
| intake | deny .opencode/** | allow hivefiver only |
| spec | allow docs/** | allow hivefiver only |
| architect | allow .opencode/** | allow hivefiver only |
| build | allow .opencode/** | allow hivefiver only |
| audit | deny * (read-only) | allow hivefiver only |
| doctor | allow .opencode/** | allow hivefiver only |

**Universal Denials (all stages):**
- `src/**`
- `tests/**`

## Workflow Prompt Template

When composing the prompt for `opencode run`:

```
Load {skills_to_load} first.
Current stage: {stage}
Execute: {command}
Constraints:
  - Stay in {allowed_paths}
  - Deny {denied_paths}
  - Delegate only to {allowed_agents}
Quality gate: run quality-check.sh {stage} before claiming completion.
```
