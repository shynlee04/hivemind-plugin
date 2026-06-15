# Reference Load Card

When you need to load a platform reference, fill this card to
document the decision.

```markdown
# Reference Load: <topic>

**Date:** YYYY-MM-DD
**Loader:** <agent>

## Question
<What am I trying to find out?>

## Decision
- [ ] Load `hm-research-deep` for multi-source investigation
- [ ] Load `hm-detective` for codebase investigation
- [ ] Load `hm-engine-contracts` for engine internals
- [ ] Load `hm-state-reference` for state root structure
- [ ] Load `hm-integration-contracts` for skill/agent binding registry
- [ ] Load `hm-omo-reference` for oh-my-openagent architecture
- [ ] Load `hm-platform-opencode` for OpenCode SDK
- [ ] Load `hm-project-audit` for project boundaries
- [ ] Load `hm-research-chain` for orchestrated research
- [ ] Load `hm-subagent-patterns` for delegation patterns
- [ ] Load `hm-synthesis` for compressing findings
- [ ] Load `hm-tech-compliance` for tech-stack compatibility
- [ ] Load `hm-tech-ingest` for third-party SDK
- [ ] Load `hm-tooling-capability` for tool matrix
- [ ] Load `hm-non-interactive-shell` for shell scripts

**Chosen skill:** <which one>

## Why
<One sentence: why this skill, not others.>

## Loaded Content
<paths in references/ that you actually read>

## Outcome
<What you found out, what action follows.>
```

## Anti-Pattern

Loading this skill PLUS all 15 references. Each loads ~5KB. Total = 75KB
context, most unused. Load ONE at a time.
