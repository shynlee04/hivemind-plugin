# Spike Manifest

## Idea

Base OpenCode SDK — Server API methods + Custom tools build. Enable agents to programmatically
execute slash commands via the OpenCode server API (`POST /session/:id/command`), bypassing the
default TUI restriction that prevents agents from deterministically appending stored slash commands.
Build a custom tool wrapper and investigate session/signal detection for targeting the API.

**References:**
- https://opencode.ai/docs/server/
- https://opencode.ai/docs/sdk/
- https://opencode.ai/docs/custom-tools/
- https://opencode.ai/docs/commands/

## Requirements

- [x] Must determine if `POST /session/:id/command` is reachable from harness runtime (Node/Bun process) - **Resolved: It is accessible natively via `input.client.session.command` inside the plugin SDK without manual REST calls.**
- [x] Must determine auth/session ID requirements for the server API - **Resolved: The SDK provides an authenticated client and `ToolContext` provides `ctx.sessionID`.**
- [x] Must determine if slash commands chain/stack when executed programmatically - **Resolved: OpenCode SDK `command` endpoint explicitly supports the same primitives as the TUI.**
- [x] Custom tool must be callable by agents through the harness tool system - **Resolved: `tool({ execute(args, ctx) })` works natively.**
- [x] Must handle session context detection (active project, session ID, message ID) - **Resolved: `ToolContext` provides all required variables.**

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | server-api-auth | standard | Given a running OpenCode instance with a session, when we POST to `/session/:id/command` with a slash command, then the command executes and returns a Message response | ✓ VALIDATED | api, auth, session |
| 002 | slash-command-chaining | standard | Given a slash command executed via the server API, when it references/invokes other primitives (workflows, skills, references), then they resolve and execute the same as TUI-triggered commands | ✓ VALIDATED | commands, chaining, parity |
| 003 | custom-tool-wrapper | standard | Given a harness custom tool that wraps `POST /session/:id/command`, when an agent calls the tool with a command name and arguments, then the slash command executes on the active session | ✓ VALIDATED | custom-tools, sdk, integration |
| 004 | session-context-detection | standard | Given the harness runtime, when we need to detect the current OpenCode session ID, project path, and message context, then we can resolve them from runtime state or environment | ✓ VALIDATED | session, context, detection |

## Decisions

1. We will NOT write a manual REST client using `fetch` or discover ports. We will exclusively use `@opencode-ai/plugin` and `@opencode-ai/sdk`'s provided `client` instance.
2. We will wrap the execution inside a custom tool exported via a plugin to ensure `ToolContext` variables are perfectly matched to the active session.

## Key Discoveries

1. The OpenCode Plugin SDK abstracts all session and port discovery. `input.client` is fully authenticated and bound.
2. `ToolContext` inside a plugin tool exposes `sessionID`, `agent`, `directory`, and `worktree` out-of-the-box, eliminating the need to parse session context manually from `.hivemind/state` or environment variables for this specific task.