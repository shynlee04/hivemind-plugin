# ADR Stub Template

```markdown
# ADR-NNN: <Title>

**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
**Date:** YYYY-MM-DD
**Deciders:** <who>
**Supersedes:** <ADR-NNN> (if applicable)
**Superseded by:** <ADR-NNN> (if applicable)

## Context

<1-2 paragraphs: what problem, why now, what constraints>

## Decision

<The chosen option. 1-sentence summary.>

## Options Considered

### Option 1: <name> (CHOSEN)
- **Pros:** <list>
- **Cons:** <list>
- **Implications:** <what this means for the system>

### Option 2: <name> (REJECTED)
- **Pros:** <list>
- **Cons:** <list>
- **Why rejected:** <one sentence>

### Option 3: <name> (REJECTED)
- **Pros:** <list>
- **Cons:** <list>
- **Why rejected:** <one sentence>

## Consequences

### What becomes possible
- <opportunity 1>
- <opportunity 2>

### What becomes harder
- <constraint 1>
- <constraint 2>

### What is now out of scope
- <item>

## References

- <link to research>
- <link to prior art>
- <link to discussion>
```

## Storage

Save to `.planning/architecture/adr-NNN-<slug>.md`.

## When to Write an ADR

HIGH-IMPACT decisions:
- New framework adoption
- Breaking API change
- Database migration
- Security model change
- Architecture pattern adoption

DO NOT write an ADR for:
- Routine code cleanup
- Bug fixes
- Test additions
- Documentation updates
