---
phase: "04"
plan: "04-02"
type: RESEARCH
status: pending
---

# Phase 04 Research: Session Intelligence

## Questions to Answer
1. How is drift_score currently calculated? What triggers it?
2. What is the current compact implementation? Does it have limits?
3. What chain validation exists? How are broken chains detected?
4. What is the integration point for auto-session triggers?

## Sources to Check
- [ ] src/lib/staleness.ts for drift calculation
- [ ] src/lib/compaction-engine.ts for compact logic
- [ ] src/lib/chain-analysis.ts for chain validation
- [ ] src/hooks/session-lifecycle.ts for integration points
- [ ] Session coherence module (src/hooks/session_coherence/)

## Findings
_Pending research execution_

### Drift Score Mechanism
_TBD_

### Compact Implementation
_TBD_

### Chain Validation
_TBD_

### Integration Points
_TBD_
