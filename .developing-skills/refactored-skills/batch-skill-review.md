# Batch: Skill Review

**Purpose**: Git memory enforcement, hierarchy traversal, context verification, and audit review for decision traceability and session integrity.
**Governance**: All skills in this batch share the principle that every commit carries memory, every decision is retraceable, every audit is evidence-based.

## Skills

| Skill | Entry Point | Purpose | Dependencies |
|-------|------------|---------|--------------|
| hivemind-atomic-commit | SKILL.md | Typed activity classification, dependency-aware ordering, pre-commit gate validation, conventional commit generation, and rollback planning | git-continuity-memory (commit anchors) |
| git-continuity-memory | SKILL.md | Git-based continuity recovery, commit-history semantic retrieval, and session identity persistence across turns | context-intelligence-entry (verify session before trusting continuity) |
| use-hivemind-git-memory | SKILL.md | Entry router for git-based semantic memory operations: routes to commit linking, intent encoding, and knowledge network formation | git-continuity-memory (for persistence), hivemind-atomic-commit (for commit surface) |
| context-intelligence-entry | SKILL.md | Session-level context-health probe with rot detection, trust scoring, and three modes (quick/rot/full) | context-entry-verify (for project-truth boundary) |
| hierarchy-retrace | SKILL.md | Decision tree traversal: reconstructs the delegation, gate, and role-boundary decisions that led to a specific commit or artifact, producing a verifiable decision lineage | hivemind-gatekeeping-delegation (for gate records), agent-role-boundary (for role records), git-continuity-memory (for commit anchors) |
| git-memory-enforce | SKILL.md | Git discipline enforcement: validates commit message conventions, ensures atomic change boundaries, verifies pre-commit gates passed, and blocks non-conforming commits | hivemind-atomic-commit (for typed commit contract), git-continuity-memory (for anchor format) |

## Cross-Cutting Concerns

- **Git memory backbone**: hivemind-atomic-commit produces typed commits → git-continuity-memory persists session anchors → use-hivemind-git-memory routes memory operations → hierarchy-retrace reconstructs decision trees from commit metadata. The git history is the single source of truth for what happened and why.
- **Context before trust**: context-intelligence-entry runs before git-continuity-memory — if the session is stale or polluted, continuity recovery is quarantined until context health is restored. No memory operation trusts a degraded session.
- **Enforcement layer**: git-memory-enforce validates that hivemind-atomic-commit's output conforms to conventions before it reaches the repository. It acts as the pre-commit gatekeeper that ensures every commit in the history is trustworthy.
- **Decision traceability**: hierarchy-retrace traverses the delegation, gate, and role-boundary records to produce a decision lineage — it connects batch-skill-judge's gate verdicts and batch-writing-skill's plan decisions to the commits that resulted from them.
- **Shared contract keys**: All skills share identity fields (`ses_id`, `task_id`, `pass_id`, `batch_id`, `packet_id`), git fields (`commit_sha`, `branch`, `activity_type`, `phase_type`), context fields (`trust_score`, `rot_severity`, `freshness`), and audit fields (`decision_lineage`, `gate_trace`).
- **Activity folder convergence**: All skills write to `{project}/.hivemind/activity/` — commit records go to `delegation/`, continuity state to `sessions/`, hierarchy traces to `hierarchy/`, and context probes to `codescan/`.

## Integration Points

- **Connects to batch-writing-skill** via plan anchors: hivemind-atomic-commit records `plan_id` from plan-engineering in commit metadata; hierarchy-retrace retrieves plan lineage when auditing a commit's decision ancestry.
- **Connects to batch-skill-judge** via TDD phase commit records: hivemind-atomic-commit captures `tdd_phase` and `gate_status` from tdd-phase-execution in commit messages; git-memory-enforce validates that TDD evidence fields are present before allowing the commit.
- **Context integrity bridge**: context-intelligence-entry and context-entry-verify (from batch-context-integrity lineage) provide the session-freshness proof that git-continuity-memory requires before trusting prior state.
- **Delegation memory loop**: use-hivemind-git-memory links commits to delegation packets — when a subagent completes, its commit is tagged with the `packet_id` that dispatched it, creating a traceable delegation→commit chain.
- **Review feeds judgment**: hierarchy-retrace's decision lineage output is consumed by batch-skill-judge's agent-role-boundary to verify that role violations did not occur during the decision chain — if violations are found, the commit is flagged for review.
- **Gatekeeper convergence**: git-memory-enforce and hivemind-gatekeeping-delegation (batch-skill-judge) share the same gate vocabulary (`pass`, `fail`, `blocked`, `pending`) — git-memory-enforce translates delegation-level gates into commit-level gate proofs that persist in git history.
