# DEBT Record: use-hivemind-delegation

| Field | Value |
|-------|-------|
| Status | DEFERRED — blocked on `use-hivemind` completion |
| Reason | Root entry skill must be CLEAN before the delegation router can be refactored. The delegation's coupling map and reference routing depend on `use-hivemind` defining the entry→specialist→depth contract in its domain-coupling-map.md. |
| Unblocks when | `use-hivemind` passes all 2-end-extreme metrics at CLEAN |
| Known Defects | D1: 3,650 word bloat (body 1.8x over 2,000-word target). D2: 25 references in flat alphabetical catalog with no consumption order — agent must re-derive read order each turn, D3: Trigger phrases in `## Use This For` body, not in frontmatter `description`. D4: 40% declarative writing mixed with 60% imperative. D5: No internal consumption ordering in reference chain — foundational→protocol→mode-specific sequence is is is, assumed, but implicit, not explicit. |
| Priority | P1 — must address immediately after use-hivemind is CLEAN |
| Dependencies | use-hivemind (parent), use-hivemind-delegation, use-hivemind-context (sibling), use-hivemind-planning (sibling), hivemind-gatekeeping (sibling, via coupling map) |
| Evidence | DEPTH-READ completed 2026-03-31. Score: SUSPECT. See verification report in session artifacts. |
