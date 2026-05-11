## Debug Session: session-tracker-cp-st-01
**Status:** hypothesizing → fixing
**Started:** 2026-05-12
**Owner:** hm-l0-orchestrator (delegating to hm-l1-coordinator)

### Reproduction
Session tracker creates files but update pipeline is comprehensively broken:
- Dual write paths (Path A: .md writer, Path B: .json writer) never reconcile
- Project index frozen (serial queue stuck)
- Child records write-once, never updated
- 100% parentSessionID mismatch between .md and .json
- All outputs pruned/missing
- All 14 review findings from CP-ST-01-REVIEW.md unresolved

### Isolation
Root cause narrowed to: **`event-capture.ts:handleSessionCreated()` treats ALL sessions as root sessions** — creates directory + .md with `parentSessionID: null` for every `session.created` event. Meanwhile, `tool-capture.ts:handleTask()` correctly identifies children and creates `.json` in parent dir. Two independent write paths for the same session, never cross-validated.

### Hypothesis
Unified write path in `event-capture.ts`:
1. On `session.created`, check `parentID` via SDK `client.session.get()`
2. If `parentID` exists → child session → create `.json` in parent + update both indices
3. If no `parentID` → root session → create dir + .md + project index entry
4. Remove standalone dir creation for child sessions
5. Fix project index serial queue stuck state
6. Route child lifecycle events through dedicated child path
7. Fix all 14 source defects catalogued in DEFECT-01 through DEFECT-14

### Experiments Run
- [x] Disk audit: 10 defects confirmed with L2 evidence
- [x] Source audit: 14 source defects catalogued
- [x] Planning doc review: SPEC locked, 13 REQs defined
- [x] Phase 12 analysis: all 14 review findings unresolved, 8 new systemic issues

### Fix Applied
Pending — delegating to hm-l1-coordinator

### Verification
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (163 existing tests + new tests)
- [ ] Sub-sessions do NOT create standalone directories
- [ ] parentSessionID consistent across .md and .json
- [ ] project-continuity.json updates correctly
- [ ] Child lifecycle events captured
- [ ] All 14 review findings addressed
