# Task Plan: Audit and Fix meta-builder Routing

## Goal
Audit the meta-builder skill routing logic for multi-intent requests and fix identified issues

## Phases

### Phase 1: Audit existing routing logic
**Status:** complete
- [x] Read preflight.sh routing decision formula
- [x] Identify GROUP_1 vs GROUP_2 scoring thresholds
- [x] Document multi-intent detection gaps

### Phase 2: Categorize routing issues
**Status:** complete
- [x] Issue 1: Multi-intent requests with both create+explore verbs score as tie
- [x] Issue 2: Stack skills not validated when primary skill is ambiguous
- [x] Issue 3: No fallback for requests referencing multiple skill types

### Phase 3: Fix routing decision formula
**Status:** in_progress
- [ ] Add multi-intent detection scoring layer
- [ ] Implement stack skill auto-selection for ambiguous requests
- [ ] Add tiebreaker logic for equal GROUP scores

### Phase 4: Validate fixes
**Status:** pending
- [ ] Run preflight.sh against 10 multi-intent test cases
- [ ] Verify GROUP classification matches expected output
- [ ] Confirm stack skills are correctly identified

### Phase 5: Update evals
**Status:** pending
- [ ] Add new eval cases for multi-intent routing
- [ ] Update existing evals to reflect new behavior
