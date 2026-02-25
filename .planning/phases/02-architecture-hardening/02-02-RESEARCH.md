---
phase: "02"
plan: "02-02"
type: RESEARCH
status: pending
---

# Phase 02 Research: Architecture Hardening

## Questions to Answer
1. Which lib/ files import from @opencode/sdk or similar SDK packages?
2. Which files exceed 550 LOC and what modules can be extracted?
3. Which tools contain business logic that should be in lib/?
4. Are there any CQRS violations (tools reading state directly)?

## Sources to Check
- [ ] `grep -r "@opencode" src/lib/` for SDK imports
- [ ] `find src/ -name "*.ts" -exec wc -l {} \; | sort -rn` for LOC analysis
- [ ] Manual review of src/tools/*.ts for business logic patterns
- [ ] Architecture Taxonomy in AGENTS.md for CQRS rules

## Findings
_Pending research execution_

### SDK Purity Violations
_TBD_

### LOC Threshold Violations
_TBD_

### CQRS Violations
_TBD_
