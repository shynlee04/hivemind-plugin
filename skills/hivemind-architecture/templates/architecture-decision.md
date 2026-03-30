# ADR-{number}: {title}

**Status:** {Proposed|Accepted|Deprecated|Superseded}
**Date:** {YYYY-MM-DD}
**Deciders:** {list of people or roles involved}
**Supersedes:** {ADR-NNN if this replaces a prior decision}

## Context

{Describe the forces at play. What is the technical or business situation that motivates this decision? Include constraints, requirements, and any relevant background.}

### Forces

- **Force 1:** {description of driving force}
- **Force 2:** {description of opposing force}
- **Force 3:** {description of neutral force}

## Decision

{State the decision clearly and concisely. What was chosen and why?}

### Chosen Approach

{Brief description of the selected option}

### Rationale

{Why this option was selected over alternatives. Reference specific forces.}

## Consequences

### Positive

- {What becomes easier, faster, or more maintainable}
- {What new capabilities are enabled}

### Negative

- {What becomes harder or more complex}
- {What trade-offs were accepted}

### Neutral

- {Side effects that are neither positive nor negative}

## Alternatives Considered

### Option A: {name}

**Description:** {brief description}
**Pros:** {list}
**Cons:** {list}
**Rejected because:** {reason}

### Option B: {name}

**Description:** {brief description}
**Pros:** {list}
**Cons:** {list}
**Rejected because:** {reason}

## Compliance

- [ ] Decision aligns with Clean Architecture dependency rules
- [ ] Decision respects CQRS boundaries (tools write, hooks read)
- [ ] Decision uses SDK-first approach (no custom reimplementation)
- [ ] Decision maintains consumer-first compatibility
- [ ] Decision has one clear authority owner

## References

- {Links to relevant ADRs, documentation, or external resources}

---

*Use `templates/blueprint-template.md` when this decision requires a system blueprint.*
