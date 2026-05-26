# Wave 8 Comparison Sheet: Code Quality & Review

This document details the audit and comparison for Wave 8 agents (`hm-code-reviewer` and `hm-code-fixer`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-code-reviewer vs gsd-code-reviewer

| Compared Element | gsd-code-reviewer | hm-code-reviewer (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Ecosystem Tracing** | Relies on GSD skill directories (`.claude/skills/` or `.agents/skills/`). | Traces clean codebase guidelines directly from `.planning/` and `./AGENTS.md`. | Focuses on project-specific rules without overhead from outdated GSD-legacy directories. |
| **State updates** | Does not perform programmatic state updates. | Programmatically updates `.hivemind/state/session-continuity.json` and `trajectory-ledger.json`. | Preserves execution telemetry and logs findings metrics directly to Hivemind session logs. |
| **Verdict Reporting** | Standard verdict output. | Leverages structured PASS/FAIL verdicts with next-step recommendations tailored for `hm-orchestrator`. | Enables smooth handoff to remediation agents (`hm-code-fixer`) on failure. |

### Upgrades applied to `hm-code-reviewer`:
- Excised legacy references to `gsd-sdk` commands and TBD blocks.
- Unified severity classification tags (BLOCKER, WARNING, INFO).
- Full 14+ section layout complying with the AGENTS.md.

---

## 2. hm-code-fixer vs gsd-code-fixer

| Compared Element | gsd-code-fixer | hm-code-fixer (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Atomic Commit Mechanism** | Relies on legacy `gsd-sdk query commit` wrapper command. | Executes direct Git CLI commands (`git add`, `git commit`) inside the isolated worktree. | Avoids command failure risks from uninstalled or misconfigured SDK wrappers. |
| **State Integration** | No programmatic updates to the harness state root. | Programmatically updates `session-continuity.json` and `trajectory-ledger.json` with fix stats and commit logs. | Ensures the central composer is fully aware of applied fixes and unresolvable issues. |
| **Rollback Execution** | Basic `git checkout --` rollback instructions. | Formalizes a strict 3-tier verification and `git checkout -- {file}` rollback protocol. | Guarantees that syntax/type errors in modified files are rolled back before committing. |

### Upgrades applied to `hm-code-fixer`:
- Standardized the isolated Git worktree setup and transaction cleanup tail.
- Formatted the recovery sentinel (`.review-fix-recovery-pending.json`) for robust cleanup.
- Conformed to 14+ section layout.
