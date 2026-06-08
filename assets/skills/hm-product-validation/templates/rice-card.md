# RICE Card

Score one feature with RICE = (Reach × Impact × Confidence) / Effort.

```markdown
# RICE Card: <feature-name>

**Date:** YYYY-MM-DD
**Scorer:** <name>

## Reach (per quarter)

How many users does this affect, per quarter?

- [ ] Marginal: <5%
- [ ] Low: 5-25%
- [ ] Medium: 25-50%
- [ ] High: 50-75%
- [ ] Massive: >75%

**Reach value:** <number>
**Source of estimate:** <analytics | survey | expert judgment>

## Impact (per user)

How much does this move the needle for the AFFECTED user?

- [ ] Minimal: 0.25
- [ ] Low: 0.5
- [ ] Medium: 1.0
- [ ] High: 2.0
- [ ] Massive: 3.0

**Impact value:** <number>

## Confidence (%)

How confident in Reach and Impact estimates?

- [ ] Low: 50%
- [ ] Medium: 80%
- [ ] High: 100%

**Confidence value:** <0.50 | 0.80 | 1.00>

## Effort (person-weeks)

**Effort value:** <number>

## RICE Score

```
RICE = (Reach × Impact × Confidence) / Effort
     = (<R> × <I> × <C>) / <E>
     = <SCORE>
```

## Decision

| Score | Action |
|---|---|
| > 10 | Build now |
| 3-10 | Build this quarter |
| 1-3 | Build eventually |
| < 1 | Skip or deprecate |

**Action:** <build now | this quarter | eventually | skip>
```

## Storage

Save as `cycles/<feature>/rice-card.md` for features being evaluated.
