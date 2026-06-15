# Reference — Workspace Security & Sandboxing

This reference defines the security guardrails, scope validations, and file access rules enforced in the Hivemind runtime.

## Sandbox Access Policy

Hivemind restricts file mutations and shell executions to protect the host environment:
1. **Absolute Workspace Isolation**: Subagents are forbidden from writing files outside of the designated workspace directory unless explicit workspace-scoped write access is granted.
2. **State Protection**: The `.hivemind/` runtime configuration and session state folders are write-only to the system hooks; subagents cannot directly mutate session journals.
3. **No Symlinks**: Subagents must use explicit relative or absolute path configurations; symlinks are disallowed to prevent path traversal attacks.

## Safe Path Audits

Every tool execution involving filesystem reads or writes undergoes rigorous path resolution:
- Checks if target paths escape the workspace boundary.
- Rejects paths containing double-dot syntax (`..`) if they lead outside the project root.
- Rejects files containing sensitive credentials (e.g. `.env`, `.git-credentials`, `.npmrc`) unless explicitly bypassed via configuration whitelist.

## Execution Circuit Breakers

To prevent infinite loops, runaway resources, or excessive usage billing:
- **Command Budgets**: Sets millisecond execution timeouts on all shell processes.
- **PTY Session Excision**: Headless fallback ensures execution proceeds even if terminal PTY attachments (via `bun-pty`) fail or time out.
- **Dual-Approval Commands**: Actions containing dangerous flags (like force deleting files or editing repository configurations) require explicit user approval.
