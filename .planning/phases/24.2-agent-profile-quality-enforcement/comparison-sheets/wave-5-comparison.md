# Wave 5 Comparison Sheet: Goal-Backward Planning

This document details the audit and comparison for Wave 5 agents (`hm-planner` and `hm-plan-checker`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-planner vs gsd-planner

| Compared Element | gsd-planner | hm-planner (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **API Initialization** | Relies on GSD CLI command `gsd-sdk query init.plan-phase` | Programmatic phase state initialization reading directly from `.hivemind/` schemas. | Bypasses GSD CLI wrappers, avoiding command parsing errors in zsh/non-interactive shells. |
| **Gating Verification** | Hardcoded shell validation. | Integrates with Hivemind programmatic gating features (`hm-l2-gate-orchestrator`). | Enforces structural quality gates on the plan structure itself before saving. |
| **Traceability Audit** | Manual or basic checklist. | Fully automated, multi-source coverage audit (GOAL, REQ, RESEARCH, CONTEXT). | Guarantees complete bidirectional coverage, returning structured split recommendations when gaps exist. |

### Upgrades applied to `hm-planner`:
- Resolved legacy `gsd-sdk` TBD flags: integrated planner with Hivemind state root APIs.
- Specified strict task schemas (TDD tasks with Vitest command assertions).
- Enforced scope reduction prohibitions.
- Full 14+ section layout complying with AGENTS.md.

---

## 2. hm-plan-checker vs gsd-plan-checker

| Compared Element | gsd-plan-checker | hm-plan-checker (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Frontmatter Validation** | Manual verification notes. | Programmatic JSON/YAML frontmatter validator using Zod schemas kernel. | Eliminates manual validation errors; rejects invalid formats instantly. |
| **Decision Gates** | Simple keyword checklist. | Decision coverage gate ensuring all `D-XX` user decisions from `CONTEXT.md` are cited. | Ensures zero drift between user-approved decisions and executed tasks. |
| **Fail Escalation** | Returns a standard text log. | Structured PASS/FAIL verdict detailing gap references and remediation routes. | Directs the orchestrator (`hm-orchestrator`) to automatically route back to `hm-planner` for revision. |

### Upgrades applied to `hm-plan-checker`:
- Replaced the TBD frontmatter validator with an active check against the `schema-kernel/prompt-enhance.schema.ts`.
- Integrated automated check logic with the Nyquist verification rate (sampling rate per commit/merge/gate).
- Full 14+ section layout conforming to codebase standards.
