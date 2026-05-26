# Research Chain Continuation Template

Use this when a research chain spans multiple turns, agents, or artifacts.

```yaml
research_chain_id: YYYY-MM-DD-topic-slug
started_at: YYYY-MM-DDTHH:MM:SSZ
stage_status:
  detect: complete | blocked | skipped-with-reason
  research: complete | blocked | skipped-with-reason
  synthesize: complete | blocked | skipped-with-reason
  artifact: complete | blocked
artifacts:
  detect: path-or-summary
  research: path-or-summary
  synthesis: path-or-summary
sources_reviewed: []
blocked_sources: []
contradictions: []
next_action: verify | implement | ask | block
```

## Resume Rule

Resume at the first incomplete or blocked stage. Do not restart completed stages unless their source evidence is stale or contradicted.
