# Rot Taxonomy

## DRIFT vs POLLUTION vs CHAIN_BREAK

### DRIFT
Gradual context staleness over time. The context becomes outdated but not corrupted.

**Indicators:**
- "forgot what we were doing"
- "things feel stale"
- Context depth > 70%
- After extended session

**Recovery:** Light compaction, context refresh

### POLLUTION
Sudden contamination from contradictory or incorrect information. Context is corrupted.

**Indicators:**
- Contradictory information present
- Wrong file references
- Confused lineage
- User says "context is wrong"

**Recovery:** Full context rebuild, truth verification

### CHAIN_BREAK
Broken delegation chain or handoff failure. Parent context is missing.

**Indicators:**
- `OPENCODE_SESSION_PARENT_ID` is undefined
- "parent context missing"
- "handoff failed"
- Delegation record missing

**Recovery:** Re-establish parent link, re-delegate
