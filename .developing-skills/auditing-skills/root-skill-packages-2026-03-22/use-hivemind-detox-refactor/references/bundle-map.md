# Bundle Map

## Purpose

This reference defines the bundle ownership model for `use-hivemind-detox-refactor`.

## Bundle A: Framework Entry and Context Governance

- Owns top-level entry contamination, context integrity claims, verification-entry claims, and false-enforcement reduction.
- Primary targets:
  - `skills/use-hivemind/SKILL.md`
  - `skills/context-intelligence-entry/SKILL.md`
  - `skills/use-hivemind-context-integrity/SKILL.md`
  - `skills/use-hivemind-context-verify/SKILL.md`
  - `skills/context-entry-verify/SKILL.md`
- Helper lane:
  - `context-map` -> `systematic-debugging` -> `verification-before-completion`

## Bundle B: Delegation and Hierarchy Governance

- Owns delegation routing, hierarchy/authority boundaries, and permission-route cleanup.
- Primary targets:
  - `skills/use-hivemind-hierarchy/SKILL.md`
  - `skills/agent-role-boundary/SKILL.md`
  - `skills/use-hivemind-delegation/SKILL.md`
  - `skills/hivemind-delegation-write/SKILL.md`
- Helper lane:
  - `context-map` -> `code-architecture-review` -> `review-and-refactor`

## Bundle C: Git Continuity and Memory

- Owns git-memory routing, continuity behavior, and missing resume/handoff route repair.
- Primary targets:
  - `skills/use-hivemind-git-memory/SKILL.md`
  - `skills/git-atomic-memory/SKILL.md`
- Helper lane:
  - `context-map` -> `systematic-debugging` -> `review-and-refactor`

## Bundle D: Meta-Builder Detox

- Owns framework-native builder overreach and separation of creation versus audit/remediation.
- Primary targets:
  - `skills/use-hivemind/SKILL.md`
  - `skills/hivemind-skill-write/SKILL.md`
  - `skills/use-hivemind-hierarchy/SKILL.md`
  - `skills/agent-role-boundary/SKILL.md`
- Helper lane:
  - `skill-review` or `writing-skills` -> `review-and-refactor` -> `clean-code`

## Bundle E: Contamination Archive Quarantine

- Owns archived and deprecated lineage as evidence only.
- Evidence surfaces:
  - `skills/_archived/**`
  - `skills/_deprecated_hive/**`
- Helper lane:
  - `context-map`

## Cross-Bundle Support

- `AGENTS.md` governance recovery:
  - `create-agentsmd` -> `technical-writer` -> `agent-architect`
- Architecture repair:
  - `context-map` -> `code-architecture-review` -> `clean-architecture` -> `senior-architect`
