# Wave 7 Comparison Sheet: Execution & Verification

This document details the audit and comparison for Wave 7 agents (`hm-executor` and `hm-verifier`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-executor vs gsd-executor

| Compared Element | gsd-executor | hm-executor (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **State Persistence** | Relies on external shell calls to `gsd-sdk query state.*` CLI commands. | Integrates programmatically with Hivemind's state directories (`.hivemind/state/session-continuity.json`, `delegations.json`, `trajectory-ledger.json`). | Eliminates shell dependencies, reducing execution overhead and avoiding runtime path parsing errors. |
| **Commit Conventions** | Uses GSD subrepo committing commands (`gsd-sdk query commit-to-subrepo`). | Implements clean Conventional Commits checking for worktree cwd drift, HEAD branch security (`worktree-agent-*` namespace), and path scope safety. | Guarantees atomic, isolated commits under the harness worktree mode, strictly obeying the `atomic_commit` config options. |
| **Checkpoints & Auto-approve** | Uses GSD config queries for auto-mode flags. | Integrates with Hivemind-native `src/config/` subscriber configurations and `src/features/` auto-advance hooks. | Supports clean recovery flow and programmatic auto-selection of options during headless agent operations. |

### Upgrades applied to `hm-executor`:
- Excised all `gsd-sdk` CLI commands and replaced them with direct programmatic updates or schema-compliant files.
- Refined the worktree safety check block (cwd-drift verification and forbidden Git commands) for better reliability.
- Full 14+ section layout complying with the AGENTS.md requirements.

---

## 2. hm-verifier vs gsd-verifier

| Compared Element | gsd-verifier | hm-verifier (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Must-Have Verification** | Relies on GSD SDK commands for artifact and link checks. | Executes programmatic verification of `must_haves` using direct file reading, regex checks, and test-suite output validation (Vitest/Node). | Avoids dependencies on the legacy GSD CLI tool, making verification faster and easier to run in headless test environments. |
| **Evidence Truth (L1-L5)** | Flat check against stubs. | Enforces strict L1-L5 evidence truth checks with mock detection downgrade to L5. | Automatically detects and rejects placeholder code or mock integration files as deceptive evidence. |
| **Data-Flow Trace** | Checks file content existence only. | Traces data paths up to DB query, fetch calls, or hook bindings (Level 4 verification). | Ensures visual/UI elements are actually wired to real APIs or DB sources instead of static mocks. |

### Upgrades applied to `hm-verifier`:
- Integrated Vitest command execution parsing for test-output checks (`stack-l3-vitest`).
- Documented clear evidence downgrade rules (e.g. mock-only to L5, self-assertion to L5).
- Integrated with the Hivemind metadata dashboard and the Vercel JSON renderer specifications.
