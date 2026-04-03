# Task Plan

## Goal
Audit and fix all CRITICAL and HIGH issues in the deep-research skill pack (56 total flaws found)

## Phases

### Phase 1: Audit complete — 56 flaws categorized
**Status:** complete
- [x] Run full audit against agentskills.io spec
- [x] Categorize by severity: 8 CRITICAL, 14 HIGH, 20 MEDIUM, 14 LOW
- [x] Write findings.md with detailed issue list

### Phase 2: Fix CRITICAL issues
**Status:** in_progress
- [ ] Add frontmatter description field
- [ ] Populate triggers array with semantic patterns
- [ ] Fix broken reference file links
- [ ] Create scripts/ directory with validators
- [ ] Create evals/ directory with test cases
- [ ] Fix frontmatter name field (remove spaces)
- [ ] Create missing reference files
- [ ] Add platform compatibility field

### Phase 3: Fix HIGH issues
**Status:** pending
- [ ] Expand description to 20+ chars
- [ ] Add code examples to body
- [ ] Implement progressive disclosure
- [ ] Add anti-patterns section
- [ ] Reorganize references by lifecycle
- [ ] Split SKILL.md into clear sections
- [ ] Add tool substitution table
- [ ] Add FIRST ACTION block
- [ ] Create gate enforcement scripts
- [ ] Fix reference paths to relative
- [ ] Add version field
- [ ] Remove TODO comments
- [ ] Add error handling instructions
- [ ] Define escalation protocol

### Phase 4: Fix MEDIUM issues
**Status:** pending
- [ ] Address 20 medium-severity formatting issues

### Phase 5: Fix LOW issues
**Status:** pending
- [ ] Address 14 low-severity style issues

### Phase 6: Re-audit and validate
**Status:** pending
- [ ] Re-run audit to confirm all CRITICAL/HIGH fixed
- [ ] Run eval suite
- [ ] Verify skill loads correctly
