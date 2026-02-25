---
phase: "01"
plan: "01-02"
type: RESEARCH
status: pending
---

# Phase 01 Research: Foundation Cleanup

## Questions to Answer
1. Which files in src/lib/ have zero imports/references?
2. What FK violations exist in .hivemind/state/*.json files?
3. How many files have date-prefixed names and what naming pattern should replace them?
4. Are there any circular dependencies in the codebase?

## Sources to Check
- [ ] `grep -r "import.*filename" src/` for each lib file
- [ ] `.hivemind/state/graph.json` for FK integrity
- [ ] `.hivemind/state/tasks.json` for FK integrity
- [ ] `ls src/lib/ | grep -E '^[0-9]{4}-'` for date-prefixed files
- [ ] AGENTS.md Source File Registry for canonical file list

## Findings
_Pending research execution_

### Orphan Files
_TBD_

### FK Violations
_TBD_

### Naming Issues
_TBD_
