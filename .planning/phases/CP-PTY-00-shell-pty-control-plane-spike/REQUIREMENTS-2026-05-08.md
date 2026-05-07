---
phase: CP-PTY-00-shell-pty-control-plane-spike
status: draft
created: 2026-05-08
evidence_level: L5
artifact_group: requirements
---

# CP-PTY-00 Requirements

## Requirement Table

| ID | Requirement | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|
| CPPTY-REQ-01 | The architecture MUST classify SDK child-session delegation separately from command-process delegation. | Given a future implementation plan, when the delegation lanes are inspected, then SDK child sessions and command processes have distinct lifecycle states and recovery semantics. | Spec inspection | draft |
| CPPTY-REQ-02 | The control plane MUST define bounded output reads for long-running commands. | Given a background command that emits large output, when an agent reads output, then the read contract supports offset/limit or equivalent truncation. | Spec inspection | draft |
| CPPTY-REQ-03 | The control plane MUST define PTY capability detection and headless fallback. | Given a host without PTY support, when command dispatch is requested, then the system degrades to a documented headless process mode or rejects with a clear reason. | Spec inspection | draft |
| CPPTY-REQ-04 | The control plane MUST define permission gates before command execution. | Given a disallowed command or untrusted directory, when a command is requested, then execution is denied before spawn. | Future tests in CP-PTY-01 | draft |
| CPPTY-REQ-05 | The control plane MUST preserve Q6 state separation. | Given shell/PTY state, when persistence is needed, then canonical runtime state goes under `.hivemind/` and never under `.opencode/`. | Spec inspection | draft |
| CPPTY-REQ-06 | The control plane MUST define cleanup semantics. | Given session deletion, parent abort, timeout, or explicit terminate, then child command resources are cleaned up or marked non-resumable. | Future tests in CP-PTY-01 | draft |
| CPPTY-REQ-07 | The sidecar/tmux projection MUST remain read-only until explicitly authorized. | Given output streaming/projection, when a sidecar reads progress, then it cannot mutate canonical state or control delegation by default. | Spec inspection | draft |

## Blocked Runtime Claims

- No claim that PTY works across hosts.
- No claim that command processes survive OpenCode/Hivemind restart.
- No claim that sidecar/tmux projection is implemented.
- No claim that OpenCode plugin permission prompts can be invoked for Hivemind shell tools without proof.
