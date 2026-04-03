# Findings & Decisions

## Requirements
- Audit meta-builder skill routing for multi-intent requests
- Fix GROUP classification when requests contain both creation and exploration verbs
- Ensure stack skills are properly validated

## Research Findings
- preflight.sh uses simple verb/noun scoring for GROUP classification
- Multi-intent requests (e.g., "create a skill and figure out the architecture") score equally on G1 and G2
- Current tiebreaker defaults to GROUP_1 with user-intent-interactive-loop
- Stack skills are only set for specific patterns, not for ambiguous multi-intent cases

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Add multi-intent detection layer | Current scoring doesn't handle mixed intent |
| Implement stack skill auto-selection | Ambiguous requests need multiple skills |
| Preserve backward compatibility | Existing single-intent routing must not break |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Tie scoring on mixed verbs | Need weighted scoring or secondary classification |
| Stack skill validation gaps | Add validation loop for all stacked skills |

## Audit Report
### Critical Issues
1. **Tie handling**: Requests with equal G1/G2 scores default to GROUP_1, losing creation intent
2. **Stack skill gaps**: Only 2 patterns set stack skills; multi-intent requests get none

### Medium Issues
3. **No multi-intent verb detection**: "create and explore" treated as single intent
4. **Questions allowed not adjusted**: Ambiguous requests still allow 3 questions

### Low Issues
5. **Output format inconsistent**: Some paths output STACK_SKILLS, others don't

## Resources
- `.skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh`
- `.skills-lab/refactoring-skills/meta-builder/SKILL.md`
