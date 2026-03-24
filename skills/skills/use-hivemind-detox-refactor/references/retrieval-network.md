# Retrieval Network

## Purpose
- Turn the git-memory family from a vague idea into an explicit recovery substrate.

## Required Recovery Checks
- relevant commits are present or their absence is recorded
- branch context is identified when relevant
- recovery anchors are captured from commit or file history
- continuity output links back to codemap and debug artifacts when later stages depend on them

## Required Output Artifacts
- `templates/continuity-manifest.md`
- `templates/knowledge-synthesis-report.md`
- recovery-anchor notes inside stabilization output

## Minimum Continuity Contract
- `history_quality`: usable, partial, or unsafe
- `branch_context`: current branch plus relevant alternatives
- `recovery_anchors`: commits, file-history anchors, synthesis docs, or other durable anchors
- `confirmed_decisions`: what history proves directly
- `inferred_gaps`: what still needs caution

## Refusals
- do not claim recoverable continuity if history is weak and no other anchors exist
- do not route to deleted resume or handoff skills outside this pack
