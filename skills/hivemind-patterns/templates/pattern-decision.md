# Pattern Decision Record Template

## Date
`YYYY-MM-DD`

## Context
Describe the problem you're solving. What code smell or design challenge exists?

## Candidate Patterns

| Pattern | Pros | Cons | Fit Score (1-5) |
|---------|------|------|-----------------|
| | | | |
| | | | |
| | | | |

## Decision
**Selected pattern:** [name]

**Rationale:** Why this pattern fits. Reference specific code smells or requirements.

**Rejected alternatives:** Why other patterns don't fit as well.

## Trade-offs Accepted
What are you giving up by choosing this pattern?
- [ ] Complexity increase?
- [ ] Performance overhead?
- [ ] Learning curve for team?
- [ ] Additional abstraction layers?

## Implementation Scope
- **Files affected:** [list]
- **Functions to refactor:** [list]
- **Tests to add/update:** [list]
- **Risk level:** LOW / MEDIUM / HIGH

## Verification Plan
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Behavior is identical (no functional changes)

## Review Trigger
When should this decision be revisited?
- When [condition] changes
- When we add [N] more implementations
- When performance becomes a concern

## References
- [Pattern catalog](references/pattern-catalog.md)
- [Anti-pattern catalog](references/anti-pattern-catalog.md)
- Link to relevant code: `src/...`
